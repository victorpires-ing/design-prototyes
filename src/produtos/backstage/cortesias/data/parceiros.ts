import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/*  Grupos parceiros + cotas (extensão do fluxo de Emissão de Cortesias)*/
/*  Evento: Botafogo x Chapecoense — Copa do Brasil.                   */
/* ------------------------------------------------------------------ */

export interface Setor {
    id: string;
    nome: string;
    tipo: string;
}

export interface Alocacao {
    id: string;
    grupoId: string;
    grupoNome: string;
    setorNome: string;
    setorTipo: string;
    cota: number;
    usadas: number;
    expira: string; // dd/mm/aaaa
    ativa: boolean;
}

/** Setores/ingressos disponíveis para alocar cota. */
export const SETORES: Setor[] = [
    { id: "norte", nome: "Cadeira Superior Norte", tipo: "Inteira" },
    { id: "sul", nome: "Cadeira Sul", tipo: "Inteira" },
    { id: "leste", nome: "Cadeira Leste", tipo: "Sócio Associação" },
    { id: "visitante", nome: "Setor Visitante", tipo: "Inteira" },
    { id: "camarote", nome: "Camarote Premium", tipo: "VIP" },
];

/** Normaliza para comparação de nomes (sem acento, minúsculo, espaços colapsados). */
export function normalizar(s: string): string {
    return s
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

/** Verifica se dois nomes são "semelhantes" (um contém o outro), sem serem iguais. */
export function nomeSemelhante(a: string, b: string): boolean {
    const na = normalizar(a);
    const nb = normalizar(b);
    if (!na || !nb || na === nb) return false;
    return na.includes(nb) || nb.includes(na);
}

/* ------------------------------------------------------------------ */
/*  Store reativo (grupos + alocações)                                 */
/* ------------------------------------------------------------------ */

let _alocacoes: Alocacao[] = [];

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
};

/* --- alocações --- */
const alocacoesSnap = () => _alocacoes;
export function useAlocacoes() {
    return useSyncExternalStore(subscribe, alocacoesSnap);
}
export function addAlocacoes(novas: Alocacao[]) {
    _alocacoes = [...novas, ..._alocacoes];
    notify();
}
