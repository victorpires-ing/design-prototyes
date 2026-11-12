import { useMemo, useSyncExternalStore } from "react";
import type { FC } from "react";
import { CoinsHand, Gift01, Ticket01 } from "@untitledui/icons";
import { useEstadoComissarios, type Comissario, type ComissarioNoEvento } from "@/plataforma/comissarios";
import { emissoesDoGrupo, gruposDaPessoa } from "@/plataforma/equipe";
import { USUARIO_EMAIL } from "./usuario";

/* ------------------------------------------------------------------ */
/*  O que a pessoa faz no Freepass (FCO-80 a FCO-89)                   */
/*                                                                     */
/*  Cada evento libera funcionalidades conforme os canais que a        */
/*  produtora deu: link de venda (Minhas vendas), cortesia e           */
/*  bilheteria. Há quem só emita (cortesia, bilheteria), sem link e    */
/*  sem comissão.                                                      */
/* ------------------------------------------------------------------ */

export type Funcao = "vendas" | "cortesia" | "bilheteria";

export const FUNCOES: Funcao[] = ["vendas", "cortesia", "bilheteria"];

export const FUNCAO_INFO: Record<Funcao, { rotulo: string; titulo: string; icone: FC<{ className?: string }>; lista: string; tela: string; descricao: string }> = {
    vendas: {
        rotulo: "Minhas vendas",
        titulo: "Minhas vendas",
        icone: CoinsHand,
        lista: "/freepass/vendas",
        tela: "/freepass/evento/vendas",
        descricao: "Eventos em que você vende pelo seu link e cupom. Abra um para ver as vendas e quanto ganha.",
    },
    cortesia: {
        rotulo: "Cortesias",
        titulo: "Cortesias",
        icone: Gift01,
        lista: "/freepass/cortesias/eventos",
        tela: "/freepass/cortesias",
        descricao: "Eventos em que você pode enviar cortesias. Abra um para enviar e acompanhar o que já mandou.",
    },
    bilheteria: {
        rotulo: "Bilheteria",
        titulo: "Bilheteria",
        icone: Ticket01,
        lista: "/freepass/bilheteria/eventos",
        tela: "/freepass/bilheteria",
        descricao: "Eventos em que você vende na bilheteria. Abra um para vender e ver os pedidos.",
    },
};

/**
 * Funcionalidades do vínculo. Minhas vendas existe com o link de venda ou com vendas no evento, mesmo
 * pausado (o histórico fica); cortesia e bilheteria somem quando a produtora pausa (FCO-80).
 */
export function funcoesDoVinculo(v: Pick<ComissarioNoEvento, "canais">, pausado: boolean, dosGrupos: Array<"cortesia" | "bilheteria"> = [], temVendas = false): Funcao[] {
    const f: Funcao[] = [];
    if (v.canais.includes("online") || temVendas) f.push("vendas");
    if (pausado) return f;
    // Cortesia e bilheteria vêm dos canais do grupo do comissário (o vínculo é a leitura dele) e dos
    // outros grupos da Equipe e Comissários em que a pessoa está (ECO-80).
    if (v.canais.includes("cortesia") || dosGrupos.includes("cortesia")) f.push("cortesia");
    if (v.canais.includes("bilheteria") || dosGrupos.includes("bilheteria")) f.push("bilheteria");
    return f;
}

/**
 * Pausado: o comissário pausado na organização, ou sem nenhum canal ligado no evento (COM-64). Não
 * existe mais uma pausa só do evento separada dos canais.
 */
export const pausadoNoEvento = (c: Pick<Comissario, "ativo">, v: Pick<ComissarioNoEvento, "canais">, dosGrupos: unknown[]) =>
    !c.ativo || (v.canais.length === 0 && dosGrupos.length === 0);

/** Funcionalidades que a pessoa tem em pelo menos um evento: é o menu do Freepass por funcionalidade. */
export function useFuncoesDisponiveis(): Funcao[] {
    const estado = useEstadoComissarios();
    return useMemo(() => {
        const minhas = new Set(estado.comissarios.filter((c) => c.pessoas.some((p) => p.email.toLowerCase() === USUARIO_EMAIL)).map((c) => c.id));
        const ativos = new Map(estado.comissarios.map((c) => [c.id, c.ativo]));
        const todas = new Set<Funcao>();
        for (const v of estado.vinculos) if (minhas.has(v.comissarioId)) funcoesDoVinculo(v, !ativos.get(v.comissarioId)).forEach((f) => todas.add(f));
        for (const g of gruposDaPessoa(estado.grupos, USUARIO_EMAIL)) emissoesDoGrupo(g).forEach((f) => todas.add(f));
        return FUNCOES.filter((f) => todas.has(f));
    }, [estado]);
}

/** Tela de evento do Backstage que pertence a cada funcionalidade (pelo item ativo do menu). */
export function funcaoDaTela(activeSection?: string, activeItem?: string): Funcao | null {
    if (activeItem === "minhas-vendas-evento") return "vendas";
    if (activeItem === "emissao-cortesias") return "cortesia";
    if (activeItem === "bilheteria-online") return "bilheteria";
    if (activeSection === "comissarios") return "vendas";
    return null;
}

/* ---------------- visualização (protótipo) ---------------- */

/** "evento": como o Backstage (evento › funcionalidade). "funcionalidade": funcionalidade › evento. */
export type Visualizacao = "evento" | "funcionalidade";

const CHAVE = "freepass-visualizacao";
const ouvintes = new Set<() => void>();
let atual: Visualizacao | null = null;

const ler = (): Visualizacao => {
    if (atual) return atual;
    try {
        atual = window.localStorage.getItem(CHAVE) === "funcionalidade" ? "funcionalidade" : "evento";
    } catch {
        atual = "evento";
    }
    return atual;
};

export function setVisualizacao(v: Visualizacao) {
    atual = v;
    try {
        window.localStorage.setItem(CHAVE, v);
    } catch {
        /* sem storage: fica na memória */
    }
    ouvintes.forEach((o) => o());
}

export function useVisualizacao(): Visualizacao {
    return useSyncExternalStore(
        (fn) => {
            ouvintes.add(fn);
            return () => ouvintes.delete(fn);
        },
        ler,
        () => "evento",
    );
}
