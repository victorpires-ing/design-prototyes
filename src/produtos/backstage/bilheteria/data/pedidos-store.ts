import { useMemo, useSyncExternalStore } from "react";
import { useColecao } from "@/plataforma";
import { useEventoAtual } from "../../eventos/data/eventos";
import { cartLines, cartTotal, type Cart } from "./carrinho";
import type { Buyer } from "./catalogo";
import type { Pedido, PedidoItem, PedidoTipo } from "./pedidos";
import { cancelarNoBanco, statusDoBanco } from "./plataforma";

/**
 * Pedidos da bilheteria.
 *
 * A venda é gravada no banco unificado (pedido no canal bilheteria, ver data/plataforma.ts).
 * Aqui fica só o que é da tela de gestão e o banco não guarda: tipo de cobrança, quem emitiu,
 * link, reenvios. O status vem do banco: pagar pelo link aprova, cancelar devolve o estoque.
 * "Expirado" ainda é só local (o banco não expira link).
 */

const STORAGE_KEY = "bilheteria-pedidos:v2";
const EMPTY: Pedido[] = [];

let cache: Pedido[] | null = null;
const listeners = new Set<() => void>();

function read(): Pedido[] {
    if (cache) return cache;
    if (typeof window === "undefined") return EMPTY;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        cache = raw ? (JSON.parse(raw) as Pedido[]) : EMPTY;
    } catch {
        cache = EMPTY;
    }
    return cache;
}

function write(next: Pedido[]) {
    cache = next;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        /* storage indisponível — mantém apenas em memória */
    }
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Pedidos do evento em contexto, do mais recente para o mais antigo, com o status do banco. */
export function usePedidos(): Pedido[] {
    const locais = useSyncExternalStore(subscribe, read, () => EMPTY);
    const evento = useEventoAtual();
    const doBanco = useColecao("pedidos");
    return useMemo(() => {
        const porId = new Map(doBanco.map((p) => [p.id, p]));
        return locais
            .filter((p) => p.eventoId === evento.id)
            .map((p) => {
                const banco = porId.get(p.id);
                const status = statusDoBanco(banco);
                // Expirado só existe aqui; o banco manda nos demais.
                return status && p.status !== "expirado" ? { ...p, status, valor: banco!.total } : p;
            });
    }, [locais, evento.id, doBanco]);
}

export function addPedido(pedido: Pedido) {
    write([pedido, ...read()]);
}

export function cancelPedidos(ids: string[]) {
    void cancelarNoBanco(ids);
    const target = new Set(ids);
    write(read().map((pedido) => (target.has(pedido.id) ? { ...pedido, status: "cancelado" } : pedido)));
}

export function registerResend(id: string, at: string, canal?: "email" | "whatsapp", destino?: string) {
    write(
        read().map((pedido) =>
            pedido.id === id
                ? {
                      ...pedido,
                      resentAt: at,
                      envios: canal && destino ? [...(pedido.envios ?? []), { canal, destino, at }] : pedido.envios,
                  }
                : pedido,
        ),
    );
}

/* ------------------------------------------------------------------ */
/*  Criação de um pedido a partir da venda concluída                   */
/* ------------------------------------------------------------------ */

const pad = (value: number) => value.toString().padStart(2, "0");

export const formatDateTime = (date: Date) =>
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

const formatDate = (date: Date) => `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

const isoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Taxa de serviço aplicada sobre o subtotal — espelha a do passo 3. */
const SERVICE_FEE_RATE = 0.1;

interface CreatePedidoInput {
    /** Id do pedido já gravado no banco. */
    id: string;
    eventoId: string;
    cart: Cart;
    buyer: Buyer | null;
    /** E-mail informado quando a conta não foi encontrada. */
    fallbackEmail?: string;
    tipo: PedidoTipo;
    emissor: string;
    paymentLink: string;
}

/**
 * Atalho de teste: vender para este e-mail cria o pedido já com o link vencido.
 * A expiração acontece dias depois da venda, fora da tela — sem um gatilho não
 * dá para exercitar a gestão desse estado.
 */
export const EMAIL_TESTE_EXPIRADO = "expirado@mail.com";

export function createPedido({ id, eventoId, cart, buyer, fallbackEmail, tipo, emissor, paymentLink }: CreatePedidoInput): Pedido {
    const lines = cartLines(cart);
    const subtotal = cartTotal(cart);
    const now = new Date();

    const itens: PedidoItem[] = lines.map((line) => ({
        id: line.id,
        quantity: line.quantity,
        name: line.name,
        subtitle: [line.meta, line.date].filter(Boolean).join(" • ") || undefined,
        lote: line.lote,
        unitPrice: line.unitPrice,
        access: line.access,
    }));

    const sessions = [...new Set(lines.map((line) => line.date).filter(Boolean))].join(" | ");

    const destinatario = buyer?.email ?? fallbackEmail ?? "Sem identificação";
    const testeExpirado = destinatario.trim().toLowerCase() === EMAIL_TESTE_EXPIRADO;

    return {
        id,
        eventoId,
        // Link de pagamento nasce pendente; sem cobrança do comprador já é aprovado.
        status: testeExpirado ? "expirado" : tipo === "link" ? "pendente" : "aprovado",
        tipo,
        title: lines[0]?.name ?? "Venda na bilheteria",
        sessions: sessions || "—",
        sessionShort: lines[0]?.date ?? "—",
        emissor,
        destinatario,
        dataVenda: isoDate(now),
        dataVendaLabel: formatDate(now),
        valor: tipo === "saldo" ? 0 : subtotal * (1 + SERVICE_FEE_RATE),
        paymentLink,
        itens,
        // Sem conta, o ingresso só chega na carteira depois do cadastro.
        contaPendente: !buyer && Boolean(fallbackEmail),
    };
}

/* ------------------------------------------------------------------ */
/*  Atalhos de teste                                                   */
/*                                                                     */
/*  O fluxo de venda só produz pedido pendente ou aprovado. Expirado e  */
/*  cancelado acontecem depois, fora da tela — e sem um jeito de forçar */
/*  não dá para testar a gestão desses estados. Só em dev, sem UI.      */
/* ------------------------------------------------------------------ */

if (import.meta.env.DEV && typeof window !== "undefined") {
    const mudarStatus = (status: Pedido["status"], id?: string) => {
        const lista = read();
        const alvo = id ? lista.find((p) => p.id === id) : lista.find((p) => p.status === "pendente" && p.tipo === "link");
        if (!alvo) return `Nenhum pedido ${id ? `com id ${id}` : "pendente com link"} para alterar.`;
        write(lista.map((p) => (p.id === alvo.id ? { ...p, status } : p)));
        return `Pedido ${alvo.id} agora é ${status}.`;
    };

    (window as unknown as Record<string, unknown>).bilheteria = {
        /** Expira o primeiro pendente com link, ou o pedido do id informado. */
        expirar: (id?: string) => mudarStatus("expirado", id),
        /** Devolve um pedido para pendente, para repetir o teste. */
        reabrir: (id?: string) => mudarStatus("pendente", id),
        /** Volta ao histórico de exemplo. */
        limpar: () => {
            window.localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        },
    };
}
