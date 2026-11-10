import { useMemo } from "react";
import { apareceNoSite, precoMinimo, useColecao, useVendidos, type Evento } from "@/plataforma";
import { CATEGORIAS, EVENTOS as ESTATICOS, type CategoriaId, type EventoMock } from "./events";

/* ------------------------------------------------------------------ */
/*  O site lê os eventos do banco unificado (src/plataforma).          */
/*                                                                     */
/*  Só evento publicado aparece aqui. A vitrine rica (lineup, futebol, */
/*  vídeo, status de pré-venda) continua no mock estático, casada pelo */
/*  mesmo id; evento criado no Backstage usa padrões da categoria.     */
/* ------------------------------------------------------------------ */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const estatico = new Map(ESTATICOS.map((e) => [e.id, e]));
const ehCategoria = (c?: string): c is CategoriaId => !!c && CATEGORIAS.some((x) => x.id === c);

export function paraMock(e: Evento, vendidos: Map<string, number>): EventoMock {
    const base = estatico.get(e.id);
    const categoria: CategoriaId = ehCategoria(e.vitrine?.categoria) ? e.vitrine.categoria : (base?.categoria ?? "festival");
    const min = precoMinimo(e, vendidos);
    const d = new Date(e.data);
    const dataLabel = base?.dataLabel ?? (Number.isNaN(d.getTime()) ? e.data : `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]}`);
    return {
        ...(base ?? {}),
        id: e.id,
        titulo: e.nome,
        artista: e.vitrine?.artista ?? base?.artista,
        data: e.data.slice(0, 10),
        dataLabel,
        local: e.local,
        cidade: e.cidade ?? base?.cidade ?? "",
        preco: min ?? base?.preco ?? 0,
        seed: base?.seed ?? e.id,
        cover: e.capa ?? base?.cover,
        vibe: base?.vibe ?? CATEGORIAS.find((c) => c.id === categoria)!.vibe,
        categoria,
        tags: e.vitrine?.tags ?? base?.tags ?? [],
        // Evento novo entra alto no "em alta": quem acabou de publicar quer se ver na home.
        popularidade: base?.popularidade ?? 1700,
        status: min === null ? "esgotado" : (base?.status ?? "venda"),
        descricao: e.vitrine?.descricao ?? base?.descricao,
    };
}

/** Eventos publicados, prontos para os componentes do site. Antes do banco responder, usa o mock. */
export function useEventosSite(): EventoMock[] {
    const eventos = useColecao("eventos");
    const vendidos = useVendidos();
    return useMemo(() => {
        if (eventos.length === 0) return ESTATICOS;
        return eventos.filter((e) => apareceNoSite(e.status)).map((e) => paraMock(e, vendidos));
    }, [eventos, vendidos]);
}

/** Um evento pelo id, mesmo privado (o detalhe abre por link). */
export function useEventoSite(id: string | null | undefined): EventoMock | undefined {
    const eventos = useColecao("eventos");
    const vendidos = useVendidos();
    return useMemo(() => {
        if (!id) return undefined;
        const e = eventos.find((x) => x.id === id);
        if (!e) return eventos.length === 0 ? estatico.get(id) : undefined;
        return paraMock(e, vendidos);
    }, [id, eventos, vendidos]);
}

/** Destaques da home: os criados no Backstage primeiro, depois a curadoria fixa. */
const CURADORIA = ["jardim-copa", "dedge-rio", "doce-maravilha", "firezone", "rio-surf"];
export function useDestaques(): EventoMock[] {
    const todos = useEventosSite();
    return useMemo(() => {
        const novos = todos.filter((e) => e.id.startsWith("ev_")).slice(0, 3);
        const fixos = CURADORIA.map((id) => todos.find((e) => e.id === id)).filter(Boolean) as EventoMock[];
        return [...novos, ...fixos].slice(0, 6);
    }, [todos]);
}

/** Caminho da compra do evento: a seleção de ingressos do link de compra. */
export const urlCompra = (id: string) => `/comprar/${id}`;
