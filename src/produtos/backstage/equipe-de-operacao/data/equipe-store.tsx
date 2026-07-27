/* ------------------------------------------------------------------ */
/*  Store da Equipe de operação (in-memory, escopo do protótipo).       */
/*  Cada grupo tem operadores (e-mails), uma COTA ÚNICA e a lista de     */
/*  itens liberados — a cota vale para qualquer um dos itens.            */
/* ------------------------------------------------------------------ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { EVENTO_TEM_ITENS } from "./equipe-data";

/** Como a cota única do grupo é distribuída. */
export type CotaModo = "compartilhada" | "individual";

export interface GrupoOperacao {
    id: string;
    nome: string;
    ativo: boolean;
    /** compartilhada = saldo único dividido entre os operadores; individual = cada operador recebe esse saldo. */
    modo: CotaModo;
    operadores: string[]; // e-mails
    /** Cota única do grupo — vale para qualquer item liberado. */
    cota: number;
    /** IDs dos itens liberados para o grupo. */
    itens: string[];
    /** Cortesias já emitidas pelo grupo (mock). */
    emitidas: number;
}

export interface NovoGrupo {
    nome: string;
    modo: CotaModo;
    operadores: string[];
    cota: number;
    itens: string[];
}

// Começa vazio: o produtor cai no estado vazio e cria o primeiro grupo pelo fluxo.
const SEED: GrupoOperacao[] = [];

/** % de uso da cota (emitidas / cota). */
export const usoDaCota = (g: GrupoOperacao) => (g.cota ? Math.min(100, Math.round((g.emitidas / g.cota) * 100)) : 0);

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
            cota: dados.cota,
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
