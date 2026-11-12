import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useCallback, useMemo } from "react";
import { itensDaAbertura, useBanco, useDoc, type Evento } from "@/plataforma";
import { marcar, useMemoriaDoGuia } from "./memoria";
import { resolverGuia, type EstadoDoEvento, type GuiaResolvido, type Presenca, type Publicacao } from "./passos";

const presenca = (n: number): Presenca => (n > 0 ? "algum" : "nenhum");

/** Rascunho é o único status fora do ar; privado e publicado vendem, encerrado já passou por aqui. */
const publicacaoDe = (status: Evento["status"] | undefined): Publicacao => {
    if (!status) return "desconhecido";
    return status === "rascunho" ? "fora-do-ar" : "no-ar";
};

/** Lê o estado do evento no banco. Enquanto o banco carrega, tudo é `desconhecido` (GDC-04). */
export function estadoDoEvento(evento: Evento | undefined, carregando: boolean): EstadoDoEvento {
    if (carregando || !evento) return { setores: "desconhecido", ingressos: "desconhecido", abertura: "desconhecido", publicacao: "desconhecido" };
    const setores = evento.sessoes.flatMap((s) => s.grupos);
    const idsDeIngresso = new Set(setores.flatMap((g) => g.ingressos.map((t) => t.id)));
    const aberturaComIngresso = (evento.aberturas ?? []).some((a) => itensDaAbertura(a).some((i) => i.tipo === "ingresso" && idsDeIngresso.has(i.id)));
    return {
        setores: presenca(setores.length),
        ingressos: presenca(idsDeIngresso.size),
        abertura: aberturaComIngresso ? "algum" : "nenhum",
        publicacao: publicacaoDe(evento.status),
    };
}

export interface Guia extends GuiaResolvido {
    minimizado: boolean;
    holofotePendente: boolean;
    fechar: () => void;
    alternarMinimizado: () => void;
    concluirHolofote: () => void;
}

/** O guia do evento. O painel e o alerta chamam o mesmo hook e leem a mesma memória. */
export function useGuiaDeConfiguracao(eventoId: string | undefined): Guia {
    const { modo } = useBanco();
    const evento = useDoc("eventos", eventoId ?? null);
    const memoria = useMemoriaDoGuia(eventoId);
    // No celular o painel aberto cobre boa parte da tela: começa recolhido, até o produtor abrir (GDC-15).
    const celular = !useBreakpoint("sm");
    const minimizado = memoria.minimizado || (celular && !memoria.expandido);
    const estado = estadoDoEvento(evento, modo === "carregando");
    const guia = useMemo(() => resolverGuia(estado, memoria.fechado), [estado.setores, estado.ingressos, estado.abertura, estado.publicacao, memoria.fechado]);

    const fechar = useCallback(() => eventoId && marcar("fechado", eventoId, true), [eventoId]);
    const alternarMinimizado = useCallback(() => {
        if (!eventoId) return;
        marcar("expandido", eventoId, minimizado);
        marcar("minimizado", eventoId, !minimizado);
    }, [eventoId, minimizado]);
    const concluirHolofote = useCallback(() => eventoId && marcar("holofote-pendente", eventoId, false), [eventoId]);

    if (!eventoId) return { ...guia, superficie: "nenhuma", minimizado: false, holofotePendente: false, fechar, alternarMinimizado, concluirHolofote };
    return {
        ...guia,
        minimizado,
        // Só depois de criar o evento, e junto com o painel aberto (GDC-14).
        holofotePendente: memoria.holofotePendente && !minimizado && guia.superficie === "painel",
        fechar,
        alternarMinimizado,
        concluirHolofote,
    };
}
