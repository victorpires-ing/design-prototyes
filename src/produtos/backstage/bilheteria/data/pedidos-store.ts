import { useSyncExternalStore } from "react";
import { cartLines, cartTotal, type Cart } from "./carrinho";
import type { Buyer } from "./catalogo";
import type { Pedido, PedidoItem, PedidoTipo } from "./pedidos";

/**
 * Persistência local dos pedidos da bilheteria.
 *
 * O protótipo guarda as vendas em `localStorage` para que o fluxo completo
 * (empty state → venda → lista → cancelar/reenviar) possa ser testado sem backend.
 */

const STORAGE_KEY = "bilheteria-pedidos";
const EMPTY: Pedido[] = [];

let cache: Pedido[] | null = null;
const listeners = new Set<() => void>();

function read(): Pedido[] {
    if (cache) return cache;
    if (typeof window === "undefined") return EMPTY;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        cache = raw ? (JSON.parse(raw) as Pedido[]) : [];
    } catch {
        cache = [];
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

/** Lista reativa dos pedidos salvos, do mais recente para o mais antigo. */
export function usePedidos(): Pedido[] {
    return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function addPedido(pedido: Pedido) {
    write([pedido, ...read()]);
}

export function cancelPedidos(ids: string[]) {
    const target = new Set(ids);
    write(read().map((pedido) => (target.has(pedido.id) ? { ...pedido, status: "cancelado" } : pedido)));
}

export function registerResend(id: string, at: string) {
    write(read().map((pedido) => (pedido.id === id ? { ...pedido, resentAt: at } : pedido)));
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

const randomId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `pedido-${Math.random().toString(16).slice(2)}`;
};

interface CreatePedidoInput {
    cart: Cart;
    buyer: Buyer | null;
    /** E-mail informado quando a conta não foi encontrada. */
    fallbackEmail?: string;
    tipo: PedidoTipo;
    emissor: string;
    paymentLink: string;
}

export function createPedido({ cart, buyer, fallbackEmail, tipo, emissor, paymentLink }: CreatePedidoInput): Pedido {
    const lines = cartLines(cart);
    const subtotal = cartTotal(cart);
    const now = new Date();

    const itens: PedidoItem[] = lines.map((line) => ({
        id: line.id,
        quantity: line.quantity,
        name: line.name,
        subtitle: [line.meta, line.date].filter(Boolean).join(" • ") || undefined,
    }));

    const sessions = [...new Set(lines.map((line) => line.date).filter(Boolean))].join(" | ");

    return {
        id: randomId(),
        // Link de pagamento nasce pendente; saldo do produtor já é aprovado.
        status: tipo === "link" ? "pendente" : "aprovado",
        tipo,
        title: lines[0]?.name ?? "Venda na bilheteria",
        sessions: sessions || "—",
        sessionShort: lines[0]?.date ?? "—",
        emissor,
        destinatario: buyer?.email ?? fallbackEmail ?? "Sem identificação",
        dataVenda: isoDate(now),
        dataVendaLabel: formatDate(now),
        valor: subtotal * (1 + SERVICE_FEE_RATE),
        paymentLink,
        itens,
    };
}
