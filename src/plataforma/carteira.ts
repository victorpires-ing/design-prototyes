import { useMemo } from "react";
import { useColecao } from "./db";
import type { Evento, IngressoEmitido } from "./modelo";
import { useSessao } from "./sessao";

export interface EventoNaCarteira {
    evento: Evento;
    ingressos: IngressoEmitido[];
    /** Primeira sessão em que a pessoa tem ingresso (ISO local). */
    inicio: string;
    passado: boolean;
}

/**
 * Ingressos válidos de quem está logado (pelo e-mail do titular), agrupados por evento e
 * ordenados por data. Base comum das carteiras web e app: cada uma converte para a própria tela.
 */
export function useMeusIngressosPorEvento(): EventoNaCarteira[] {
    const sessao = useSessao();
    const ingressos = useColecao("ingressos");
    const eventos = useColecao("eventos");
    return useMemo(() => {
        if (!sessao) return [];
        const porEvento = new Map<string, IngressoEmitido[]>();
        for (const i of ingressos) {
            if (i.status !== "valido" || i.titular.email !== sessao.email) continue;
            porEvento.set(i.eventoId, [...(porEvento.get(i.eventoId) ?? []), i]);
        }
        const agora = new Date();
        return [...porEvento]
            .flatMap(([id, lista]) => {
                const evento = eventos.find((e) => e.id === id);
                if (!evento) return [];
                const inicio = lista.map((i) => evento.sessoes.find((s) => s.id === i.sessaoId)?.inicio ?? evento.data).sort()[0];
                return [{ evento, ingressos: lista, inicio, passado: new Date(inicio) < agora }];
            })
            .sort((a, b) => a.inicio.localeCompare(b.inicio));
    }, [sessao, ingressos, eventos]);
}
