/* ------------------------------------------------------------------ */
/*  Store da Equipe de operação v2 (in-memory, escopo do protótipo).    */
/*                                                                      */
/*  Diferença para a v1: o grupo deixa de existir só para cortesia.     */
/*  Ele ganha uma ou mais PERMISSÕES (cortesia, PDV, bilheteria), e cada  */
/*  uma traz o próprio tipo de cota, os próprios itens liberados e os     */
/*  próprios limites — tudo configurado numa tela só.                     */
/* ------------------------------------------------------------------ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CurrencyDollarCircle, Gift01, Phone01 } from "@untitledui/icons";
import { EVENTO_TEM_ITENS } from "./equipe-data";

export type Permissao = "cortesia" | "pdv" | "bilheteria";

/** Onde o limite é aplicado: um número para a permissão inteira ou um por item. */
export type CotaModo = "grupo" | "item";

/** Cota de uma permissão: onde o limite vale, quais itens libera e quanto já foi usado. */
export interface CotaPermissao {
    modo: CotaModo;
    /** Itens que esta permissão libera — cada tipo de envio tem os seus. */
    itens: string[];
    /** Limite único da permissão (modo "grupo"). */
    cota: number;
    /** Limite por item liberado (modo "item") — chave é o id do item. */
    porItem: Record<string, number>;
    usadas: number;
}

export interface GrupoOperacaoV2 {
    id: string;
    nome: string;
    ativo: boolean;
    operadores: string[];
    /** Só as permissões concedidas aparecem aqui, cada uma com seus itens. */
    permissoes: Partial<Record<Permissao, CotaPermissao>>;
}

export interface NovoGrupoV2 {
    nome: string;
    operadores: string[];
    /** Modo, itens e limites de cada permissão concedida. */
    permissoes: Partial<Record<Permissao, Omit<CotaPermissao, "usadas">>>;
}

export const PERMISSOES: Array<{
    id: Permissao;
    label: string;
    /** O que o operador passa a poder fazer. */
    descricao: string;
    /** O que a cota limita, no vocabulário daquela permissão. */
    unidade: string;
    icon: typeof Gift01;
}> = [
    {
        id: "cortesia",
        label: "Cortesia",
        descricao: "Emitir cortesias pelo portal do operador, sem cobrança.",
        unidade: "cortesias para emitir",
        icon: Gift01,
    },
    {
        id: "pdv",
        label: "PDV",
        descricao: "Vender no ponto de venda presencial, com dinheiro, Pix ou cartão.",
        unidade: "ingressos para vender no PDV",
        icon: Phone01,
    },
    {
        id: "bilheteria",
        label: "Bilheteria",
        descricao: "Vender pela bilheteria online, por link de pagamento ou saldo do produtor.",
        unidade: "ingressos para vender na bilheteria",
        icon: CurrencyDollarCircle,
    },
];

export const PERMISSAO_META = Object.fromEntries(PERMISSOES.map((p) => [p.id, p])) as Record<Permissao, (typeof PERMISSOES)[number]>;

/** Limite total: o número único ou a soma dos limites por item. */
export const cotaTotal = (c: Pick<CotaPermissao, "modo" | "cota" | "porItem" | "itens">) =>
    c.modo === "item" ? c.itens.reduce((soma, id) => soma + (c.porItem[id] ?? 0), 0) : c.cota;

/** % de uso da cota de uma permissão. */
export const usoDaCota = (c: CotaPermissao) => {
    const total = cotaTotal(c);
    return total ? Math.min(100, Math.round((c.usadas / total) * 100)) : 0;
};

/** Permissões concedidas, na ordem do catálogo. */
export const permissoesDo = (g: GrupoOperacaoV2): Permissao[] => PERMISSOES.map((p) => p.id).filter((id) => Boolean(g.permissoes[id]));

// Começa vazio: o produtor cai no estado vazio e cria o primeiro grupo pelo fluxo.
const SEED: GrupoOperacaoV2[] = [];

interface EquipeV2ContextValue {
    grupos: GrupoOperacaoV2[];
    temItens: boolean;
    getGrupo: (id: string) => GrupoOperacaoV2 | undefined;
    criarGrupo: (dados: NovoGrupoV2) => GrupoOperacaoV2;
    atualizarGrupo: (id: string, dados: Partial<Omit<GrupoOperacaoV2, "id">>) => void;
    toggleAtivo: (id: string) => void;
    nomeDisponivel: (nome: string, ignorarId?: string) => boolean;
}

const EquipeV2Context = createContext<EquipeV2ContextValue | null>(null);

export function EquipeV2Provider({ children }: { children: ReactNode }) {
    const [grupos, setGrupos] = useState<GrupoOperacaoV2[]>(SEED);

    const getGrupo = useCallback((id: string) => grupos.find((g) => g.id === id), [grupos]);

    const nomeDisponivel = useCallback(
        (nome: string, ignorarId?: string) => {
            const alvo = nome.trim().toLowerCase();
            if (!alvo) return true;
            return !grupos.some((g) => g.id !== ignorarId && g.nome.trim().toLowerCase() === alvo);
        },
        [grupos],
    );

    const criarGrupo = useCallback((dados: NovoGrupoV2) => {
        // Consumo mockado (~40% da cota) para que detalhe e listagem já mostrem
        // barras com progresso; num cenário real começaria em 0.
        const permissoes: GrupoOperacaoV2["permissoes"] = {};
        for (const [id, config] of Object.entries(dados.permissoes) as Array<[Permissao, Omit<CotaPermissao, "usadas">]>) {
            permissoes[id] = { ...config, usadas: Math.round(cotaTotal(config) * 0.4) };
        }

        const novo: GrupoOperacaoV2 = {
            id: `g${Date.now()}`,
            nome: dados.nome.trim(),
            ativo: true,
            operadores: dados.operadores,
            permissoes,
        };
        setGrupos((prev) => [novo, ...prev]);
        return novo;
    }, []);

    const atualizarGrupo = useCallback((id: string, dados: Partial<Omit<GrupoOperacaoV2, "id">>) => {
        setGrupos((prev) => prev.map((g) => (g.id === id ? { ...g, ...dados } : g)));
    }, []);

    const toggleAtivo = useCallback((id: string) => {
        setGrupos((prev) => prev.map((g) => (g.id === id ? { ...g, ativo: !g.ativo } : g)));
    }, []);

    const value = useMemo<EquipeV2ContextValue>(
        () => ({ grupos, temItens: EVENTO_TEM_ITENS, getGrupo, criarGrupo, atualizarGrupo, toggleAtivo, nomeDisponivel }),
        [grupos, getGrupo, criarGrupo, atualizarGrupo, toggleAtivo, nomeDisponivel],
    );

    return <EquipeV2Context.Provider value={value}>{children}</EquipeV2Context.Provider>;
}

export function useEquipeV2() {
    const ctx = useContext(EquipeV2Context);
    if (!ctx) throw new Error("useEquipeV2 deve ser usado dentro de <EquipeV2Provider>.");
    return ctx;
}
