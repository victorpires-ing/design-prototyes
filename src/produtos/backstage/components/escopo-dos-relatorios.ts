import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/*  Escopo dos Relatórios (BKS-27): todos os eventos da organização    */
/*  (padrão) ou o evento em contexto. Fica na sessão do navegador,     */
/*  para valer ao trocar de relatório.                                 */
/* ------------------------------------------------------------------ */

export type EscopoDosRelatorios = "todos" | "evento";

const CHAVE = "backstage-relatorios-escopo";
const ouvintes = new Set<() => void>();
let atual: EscopoDosRelatorios | null = null;

const ler = (): EscopoDosRelatorios => {
    if (atual) return atual;
    try {
        atual = window.sessionStorage.getItem(CHAVE) === "evento" ? "evento" : "todos";
    } catch {
        atual = "todos";
    }
    return atual;
};

export function setEscopoDosRelatorios(escopo: EscopoDosRelatorios) {
    if (ler() === escopo) return;
    atual = escopo;
    try {
        window.sessionStorage.setItem(CHAVE, escopo);
    } catch {
        /* sem storage: fica na memória */
    }
    ouvintes.forEach((o) => o());
}

export function useEscopoDosRelatorios(): EscopoDosRelatorios {
    return useSyncExternalStore(
        (fn) => {
            ouvintes.add(fn);
            return () => ouvintes.delete(fn);
        },
        ler,
        () => "todos",
    );
}

/** `true`: os relatórios somam todos os eventos da organização; `false`: só o evento em contexto. */
export const useTodosOsEventos = () => useEscopoDosRelatorios() === "todos";

export const setTodosOsEventos = (todos: boolean) => setEscopoDosRelatorios(todos ? "todos" : "evento");
