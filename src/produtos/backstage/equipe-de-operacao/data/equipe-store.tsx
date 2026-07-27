/* ------------------------------------------------------------------ */
/*  Store da Equipe de operação (in-memory, escopo do protótipo).       */
/*  Guarda os grupos de operação — cada grupo tem operadores (e-mails), */
/*  itens com cota e um total de cortesias já emitidas (mock).          */
/* ------------------------------------------------------------------ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { EVENTO_TEM_ITENS } from "./equipe-data";

export interface ItemCota {
    itemId: string;
    cota: number;
}

/** Como a cota de itens é gerenciada pelo grupo. */
export type CotaModo = "compartilhada" | "individual";

export interface GrupoOperacao {
    id: string;
    nome: string;
    ativo: boolean;
    /** compartilhada = todos dividem a mesma cota; individual = cada operador tem a própria cota. */
    modo: CotaModo;
    operadores: string[]; // e-mails
    itens: ItemCota[];
    /** Cortesias já emitidas pelo grupo (mock). */
    emitidas: number;
}

export interface NovoGrupo {
    nome: string;
    modo: CotaModo;
    operadores: string[];
    itens: ItemCota[];
}

// Começa vazio: o produtor cai no estado vazio ("Configure grupos de operação")
// e cria o primeiro grupo pelo fluxo. Os grupos criados populam a listagem.
const SEED: GrupoOperacao[] = [];

/** Cota total do grupo = soma das cotas dos itens. */
export const cotaTotal = (g: GrupoOperacao) => g.itens.reduce((s, i) => s + i.cota, 0);
/** % de uso da cota (emitidas / cota total). */
export const usoDaCota = (g: GrupoOperacao) => {
    const total = cotaTotal(g);
    return total ? Math.min(100, Math.round((g.emitidas / total) * 100)) : 0;
};

interface EquipeContextValue {
    grupos: GrupoOperacao[];
    temItens: boolean;
    getGrupo: (id: string) => GrupoOperacao | undefined;
    criarGrupo: (dados: NovoGrupo) => GrupoOperacao;
    atualizarGrupo: (id: string, dados: Partial<Omit<GrupoOperacao, "id">>) => void;
    toggleAtivo: (id: string) => void;
    nomeDisponivel: (nome: string, ignorarId?: string) => boolean;
}

const EquipeContext = createContext<EquipeContextValue | null>(null);

export function EquipeProvider({ children }: { children: ReactNode }) {
    const [grupos, setGrupos] = useState<GrupoOperacao[]>(SEED);

    const getGrupo = useCallback((id: string) => grupos.find((g) => g.id === id), [grupos]);

    const nomeDisponivel = useCallback(
        (nome: string, ignorarId?: string) => {
            const alvo = nome.trim().toLowerCase();
            if (!alvo) return true;
            return !grupos.some((g) => g.id !== ignorarId && g.nome.trim().toLowerCase() === alvo);
        },
        [grupos],
    );

    const criarGrupo = useCallback((dados: NovoGrupo) => {
        const novo: GrupoOperacao = {
            id: `g${Date.now()}`,
            nome: dados.nome.trim(),
            ativo: true,
            modo: dados.modo,
            operadores: dados.operadores,
            itens: dados.itens,
            emitidas: 0,
        };
        setGrupos((prev) => [novo, ...prev]);
        return novo;
    }, []);

    const atualizarGrupo = useCallback((id: string, dados: Partial<Omit<GrupoOperacao, "id">>) => {
        setGrupos((prev) => prev.map((g) => (g.id === id ? { ...g, ...dados } : g)));
    }, []);

    const toggleAtivo = useCallback((id: string) => {
        setGrupos((prev) => prev.map((g) => (g.id === id ? { ...g, ativo: !g.ativo } : g)));
    }, []);

    const value = useMemo<EquipeContextValue>(
        () => ({ grupos, temItens: EVENTO_TEM_ITENS, getGrupo, criarGrupo, atualizarGrupo, toggleAtivo, nomeDisponivel }),
        [grupos, getGrupo, criarGrupo, atualizarGrupo, toggleAtivo, nomeDisponivel],
    );

    return <EquipeContext.Provider value={value}>{children}</EquipeContext.Provider>;
}

export function useEquipe() {
    const ctx = useContext(EquipeContext);
    if (!ctx) throw new Error("useEquipe deve ser usado dentro de <EquipeProvider>.");
    return ctx;
}
