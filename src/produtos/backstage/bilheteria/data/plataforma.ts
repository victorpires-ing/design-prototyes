import { useMemo } from "react";
import {
    cancelarPedido,
    criarPedido,
    loteAtual,
    lerDoc,
    pagarPedido,
    slugificar,
    useDoc,
    useVendidos,
    type Evento,
    type ItemPedido,
    type Pedido as PedidoBanco,
    type Usuario,
} from "@/plataforma";
import { useEventoAtual } from "../../eventos/data/eventos";
import { cartLines, type Cart } from "./carrinho";
import { definirSessoes, type Buyer, type TicketSession } from "./catalogo";
import type { PedidoStatus, PedidoTipo } from "./pedidos";

/* ------------------------------------------------------------------ */
/*  Bilheteria ligada ao banco unificado                               */
/*                                                                     */
/*  Ingressos à venda = catálogo do evento em contexto, no lote atual. */
/*  Produtos e combos seguem no mock da bilheteria (a plataforma ainda */
/*  não tem produto). A venda vira pedido no banco, no canal          */
/*  bilheteria: link de pagamento espera o checkout; "só a taxa" já    */
/*  nasce pago e emite os ingressos na carteira de quem comprou.       */
/* ------------------------------------------------------------------ */

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MESES_LONGOS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** Id do ingresso na bilheteria: `b:<sessão>:<grupo>:<ingresso>`. O lote é o atual na hora da venda. */
const idDoTicket = (sessaoId: string, grupoId: string, ingressoId: string) => `b:${sessaoId}:${grupoId}:${ingressoId}`;
const lerIdDoTicket = (id: string) => {
    const [prefixo, sessaoId, grupoId, ingressoId] = id.split(":");
    return prefixo === "b" && sessaoId && grupoId && ingressoId ? { sessaoId, grupoId, ingressoId } : null;
};

export function sessoesDoBanco(evento: Evento, vendidos: Map<string, number>): TicketSession[] {
    return evento.sessoes.map((s) => {
        const d = new Date(s.inicio);
        const dia = String(d.getDate()).padStart(2, "0");
        const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        const longa = `${dia} de ${MESES_LONGOS[d.getMonth()]}`;
        const tickets = s.grupos.flatMap((g) =>
            g.ingressos
                .filter((t) => t.ativo)
                .flatMap((t) => {
                    const lote = loteAtual(t, vendidos);
                    if (!lote) return [];
                    return [
                        {
                            id: idDoTicket(s.id, g.id, t.id),
                            name: `${g.nome} · ${t.nome}`,
                            group: g.nome,
                            type: t.nome,
                            lote: lote.nome,
                            access: "qrcode" as const,
                            description: t.descricao ?? "Entrada válida apenas para a data e o horário selecionados. Sujeito à disponibilidade do lote.",
                            price: lote.preco,
                        },
                    ];
                }),
        );
        return {
            id: s.id,
            label: `${longa} às ${hora}`,
            shortDate: `${longa} • ${hora}`,
            weekday: DIAS[d.getDay()],
            day: dia,
            month: MESES[d.getMonth()],
            year: String(d.getFullYear()),
            time: hora,
            soldOut: tickets.length === 0,
            tickets,
        };
    });
}

/**
 * Catálogo da bilheteria para o evento em contexto. Troca as sessões do módulo de catálogo na
 * renderização, antes dos passos da venda lerem. Devolve as sessões (vazio = nada à venda).
 */
export function useCatalogoDoBanco(): { evento?: Evento; sessoes: TicketSession[] } {
    const ctx = useEventoAtual();
    const evento = useDoc("eventos", ctx.id);
    const vendidos = useVendidos();
    const sessoes = useMemo(() => (evento ? sessoesDoBanco(evento, vendidos) : []), [evento, vendidos]);
    definirSessoes(sessoes);
    return { evento, sessoes };
}

/* ---------------- venda ---------------- */

interface VendaInput {
    eventoId: string;
    cart: Cart;
    buyer: Buyer | null;
    fallbackEmail?: string;
    tipo: PedidoTipo;
}

function comprador(buyer: Buyer | null, fallbackEmail?: string): Usuario {
    if (buyer) return { id: `u_${slugificar(buyer.email)}`, nome: buyer.name, email: buyer.email.toLowerCase() };
    const email = fallbackEmail?.trim().toLowerCase();
    if (email) return { id: `u_${slugificar(email)}`, nome: email.split("@")[0], email };
    // Venda sem identificação: o ingresso fica com a bilheteria (impresso no PDF).
    return { id: "u_bilheteria", nome: "Venda sem identificação", email: "bilheteria@exemplo.com" };
}

/**
 * Grava a venda como pedido do canal bilheteria. Link: aguarda pagamento no checkout.
 * Só a taxa: a produtora paga a taxa pelo saldo, o comprador não paga e os ingressos saem na hora.
 */
export async function gravarVenda({ eventoId, cart, buyer, fallbackEmail, tipo }: VendaInput): Promise<PedidoBanco> {
    const evento = lerDoc("eventos", eventoId);
    const taxa = evento?.taxaServico ?? 0.1;
    const itens: ItemPedido[] = cartLines(cart).flatMap((line): ItemPedido[] => {
        const ref = lerIdDoTicket(line.id);
        const tipoIngresso = ref && evento?.sessoes.find((s) => s.id === ref.sessaoId)?.grupos.find((g) => g.id === ref.grupoId)?.ingressos.find((t) => t.id === ref.ingressoId);
        const lote = tipoIngresso?.lotes.find((l) => l.nome === line.lote);
        const face = tipo === "saldo" ? 0 : line.unitPrice;
        const taxaItem = Math.round(line.unitPrice * taxa * 100) / 100;
        if (ref && tipoIngresso && lote) {
            return [{ tipo: "ingresso", nome: tipoIngresso.nome, detalhe: lote.nome, ...ref, loteId: lote.id, quantidade: line.quantity, face, taxa: taxaItem }];
        }
        // Produto ou combo do mock: entra no pedido, não emite ingresso.
        return [{ tipo: "produto", nome: line.name, detalhe: line.meta, quantidade: line.quantity, face, taxa: taxaItem }];
    });
    const pedido = await criarPedido({ eventoId, comprador: comprador(buyer, fallbackEmail), canal: "bilheteria", itens, atribuicoes: [] });
    if (tipo === "saldo") await pagarPedido(pedido.id, "saldo");
    return lerDoc("pedidos", pedido.id) ?? pedido;
}

/** Link de pagamento real: abre o checkout com o pedido. */
export const linkDePagamento = (pedidoId: string) =>
    `${typeof window === "undefined" ? "" : window.location.origin}/checkout/melhorias-de-compra?pedido=${pedidoId}`;

/** Status do pedido do banco como a gestão da bilheteria mostra. */
export const statusDoBanco = (p: PedidoBanco | undefined): PedidoStatus | undefined =>
    !p ? undefined : p.status === "pago" ? "aprovado" : p.status === "cancelado" ? "cancelado" : "pendente";

export const cancelarNoBanco = (ids: string[]) => Promise.all(ids.map((id) => cancelarPedido(id)));
