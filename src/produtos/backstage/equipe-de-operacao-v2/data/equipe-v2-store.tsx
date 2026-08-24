/* ------------------------------------------------------------------ */
/*  Store da Equipe de operação v2 (in-memory, escopo do protótipo).    */
/*                                                                      */
/*  Diferença para a v1: o grupo deixa de existir só para cortesia.     */
/*  Ele ganha uma ou mais PERMISSÕES (cortesia, PDV, bilheteria) e      */
/*  cada uma tem a própria cota. Os itens liberados e a forma de        */
/*  dividir a cota são do grupo — é uma decisão só, não uma por         */
/*  permissão, para a configuração caber numa tela.                     */
/* ------------------------------------------------------------------ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CurrencyDollarCircle, Gift01, ShoppingBag01 } from "@untitledui/icons";
import { EVENTO_TEM_ITENS } from "./equipe-data";

export type Permissao = "cortesia" | "pdv" | "bilheteria";

/** Como a cota é dividida entre os operadores do grupo. */
export type CotaModo = "compartilhada" | "individual";

/** Cota de uma permissão + quanto dela já foi usado. */
export interface CotaPermissao {
    cota: number;
    usadas: number;
}

export interface GrupoOperacaoV2 {
    id: string;
    nome: string;
    ativo: boolean;
    operadores: string[];
    /** Vale para todas as permissões do grupo. */
    modo: CotaModo;
    /** Ids dos itens que o grupo pode operar. */
    itens: string[];
    /** Só as permissões concedidas aparecem aqui. */
    permissoes: Partial<Record<Permissao, CotaPermissao>>;
}

export interface NovoGrupoV2 {
    nome: string;
    operadores: string[];
    modo: CotaModo;
    itens: string[];
    /** Cota por permissão concedida. */
    cotas: Partial<Record<Permissao, number>>;
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
        icon: ShoppingBag01,
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

/** % de uso da cota de uma permissão. */
export const usoDaCota = (c: CotaPermissao) => (c.cota ? Math.min(100, Math.round((c.usadas / c.cota) * 100)) : 0);

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
        for (const [id, cota] of Object.entries(dados.cotas) as Array<[Permissao, number]>) {
            permissoes[id] = { cota, usadas: Math.round(cota * 0.4) };
        }

        const novo: GrupoOperacaoV2 = {
            id: `g${Date.now()}`,
            nome: dados.nome.trim(),
            ativo: true,
            operadores: dados.operadores,
            modo: dados.modo,
            itens: dados.itens,
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
