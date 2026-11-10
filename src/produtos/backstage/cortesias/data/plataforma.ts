import { useMemo } from "react";
import { loteAtual, useDoc, useVendidos, type Evento } from "@/plataforma";
import { useEventoAtual } from "../../eventos/data/eventos";
import { definirSessoes, type SessionSection } from "./cortesia-items";

/* ------------------------------------------------------------------ */
/*  Cortesias ligadas ao banco unificado                               */
/*                                                                     */
/*  O catálogo de cortesia é o do evento em contexto: todo ingresso    */
/*  ativo com lote. O id do item guarda a referência no catálogo.      */
/* ------------------------------------------------------------------ */

/** Id do item de cortesia: `c:<sessão>:<grupo>:<ingresso>`. */
export const idDoItem = (sessaoId: string, grupoId: string, ingressoId: string) => `c:${sessaoId}:${grupoId}:${ingressoId}`;

export const lerIdDoItem = (id: string) => {
    const [prefixo, sessaoId, grupoId, ingressoId] = id.split(":");
    return prefixo === "c" && sessaoId && grupoId && ingressoId ? { sessaoId, grupoId, ingressoId } : null;
};

export const dataDaSessao = (inicio: string) => {
    const d = new Date(inicio);
    if (Number.isNaN(d.getTime())) return inicio;
    const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
    const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return `${dia} às ${hora}`;
};

export function sessoesDoBanco(evento: Evento, vendidos: Map<string, number>): SessionSection[] {
    return evento.sessoes.map((s) => ({
        id: s.id,
        datetime: dataDaSessao(s.inicio),
        groups: s.grupos
            .map((g) => ({
                name: g.nome,
                tickets: g.ingressos
                    .filter((t) => t.ativo && t.lotes.length > 0)
                    .map((t) => ({ id: idDoItem(s.id, g.id, t.id), name: t.nome, type: (loteAtual(t, vendidos) ?? t.lotes[t.lotes.length - 1]).nome })),
            }))
            .filter((g) => g.tickets.length > 0),
    }));
}

/** Troca o catálogo de cortesia pelo do evento em contexto. Chamado pelo provider das cortesias. */
export function useCatalogoDeCortesia(): { evento?: Evento; sessoes: SessionSection[] } {
    const ctx = useEventoAtual();
    const evento = useDoc("eventos", ctx.id);
    const vendidos = useVendidos();
    const sessoes = useMemo(() => (evento ? sessoesDoBanco(evento, vendidos) : []), [evento, vendidos]);
    definirSessoes(sessoes);
    return { evento, sessoes };
}
