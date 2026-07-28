/* ------------------------------------------------------------------ */
/*  Store da Equipe de operação (in-memory, escopo do protótipo).       */
/*  Cada grupo tem operadores (e-mails), uma COTA ÚNICA e a lista de     */
/*  itens liberados — a cota vale para qualquer um dos itens.            */
/* ------------------------------------------------------------------ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { EVENTO_TEM_ITENS } from "./equipe-data";

/** Como a cota do grupo é definida. */
export type CotaModo = "compartilhada" | "individual";

/** Item liberado + sua cota (usada só no modo individual). */
export interface ItemCota {
    itemId: string;
    cota: number;
}

export interface GrupoOperacao {
    id: string;
    nome: string;
    ativo: boolean;
    /** compartilhada = cota única do grupo; individual = cota por item (por operador). */
    modo: CotaModo;
    operadores: string[]; // e-mails
    /** Cota única do grupo (modo compartilhada). */
    cota: number;
    /** Itens liberados. No modo individual, cada um tem sua cota. */
    itens: ItemCota[];
    /** Cortesias já emitidas pelo grupo (mock). */
    emitidas: number;
}

export interface NovoGrupo {
    nome: string;
    modo: CotaModo;
    operadores: string[];
    cota: number;
    itens: ItemCota[];
}

// Começa vazio: o produtor cai no estado vazio e cria o primeiro grupo pelo fluxo.
const SEED: GrupoOperacao[] = [];

/** Cota total do grupo: única (compartilhada) ou soma das cotas por item (individual). */
export const cotaTotal = (g: GrupoOperacao) => (g.modo === "individual" ? g.itens.reduce((s, i) => s + i.cota, 0) : g.cota);

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
        // Emissão mockada (~40% da cota) para que os fluxos de detalhe/edição já
        // mostrem consumo por item; num cenário real começaria em 0.
        const total = dados.modo === "individual" ? dados.itens.reduce((s, i) => s + i.cota, 0) : dados.cota;
        const novo: GrupoOperacao = {
            id: `g${Date.now()}`,
            nome: dados.nome.trim(),
            ativo: true,
            modo: dados.modo,
            operadores: dados.operadores,
            cota: dados.cota,
            itens: dados.itens,
            emitidas: Math.round(total * 0.4),
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
