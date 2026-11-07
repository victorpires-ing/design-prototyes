import type { Evento, EventoStatus, Grupo, IngressoEmitido, Lote, Sessao, TipoIngresso } from "./modelo";

/* Regras de negócio puras, usadas por todos os produtos. Sem React, sem banco. */

export const agora = () => new Date().toISOString();

export const novoId = (prefixo: string) => `${prefixo}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

export const slugificar = (texto: string) =>
    texto
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "evento";

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Vender só é possível em evento publicado (vitrine + link) ou privado (só link). */
export const vendeNoLink = (s: EventoStatus) => s === "publicado" || s === "privado";
/** O site lista só eventos publicados. */
export const apareceNoSite = (s: EventoStatus) => s === "publicado";

/** Ingressos emitidos que contam como vendidos (cancelado devolve ao estoque). */
export const vendidosPorLote = (ingressos: IngressoEmitido[]) => {
    const m = new Map<string, number>();
    for (const i of ingressos) if (i.status !== "cancelado") m.set(i.loteId, (m.get(i.loteId) ?? 0) + 1);
    return m;
};

/** Lote à venda agora: o primeiro, na ordem, que ainda tem saldo. */
export const loteAtual = (tipo: TipoIngresso, vendidos: Map<string, number>): Lote | undefined =>
    tipo.lotes.find((l) => (vendidos.get(l.id) ?? 0) < l.quantidade);

export const saldoDoLote = (l: Lote, vendidos: Map<string, number>) => Math.max(0, l.quantidade - (vendidos.get(l.id) ?? 0));

/** Itera todos os ingressos do catálogo com o contexto de sessão e grupo. */
export function* percorrerCatalogo(e: Evento): Generator<{ sessao: Sessao; grupo: Grupo; tipo: TipoIngresso }> {
    for (const sessao of e.sessoes) for (const grupo of sessao.grupos) for (const tipo of grupo.ingressos) yield { sessao, grupo, tipo };
}

/** Menor preço de face à venda (para o "a partir de" da vitrine). Null quando nada está à venda. */
export const precoMinimo = (e: Evento, vendidos: Map<string, number>): number | null => {
    let min: number | null = null;
    for (const { tipo } of percorrerCatalogo(e)) {
        if (!tipo.ativo) continue;
        const l = loteAtual(tipo, vendidos);
        if (l && (min === null || l.preco < min)) min = l.preco;
    }
    return min;
};

export const temIngressoAVenda = (e: Evento, vendidos: Map<string, number>) => precoMinimo(e, vendidos) !== null;

/** Primeira sessão por data: é a data "do evento" nas listagens. */
export const dataDoEvento = (sessoes: Sessao[], fallback: string) =>
    sessoes.map((s) => s.inicio).sort()[0] ?? fallback;

/** Código curto e legível para o QR do ingresso. */
export const codigoIngresso = () =>
    Array.from({ length: 3 }, () => Math.random().toString(36).slice(2, 6).toUpperCase()).join("-");

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** "Sáb, 03 out 2026 · 22h00". Recebe ISO local sem fuso. */
export const dataHoraCurta = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${DIAS[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]} ${d.getFullYear()} · ${hh}h${mm}`;
};
