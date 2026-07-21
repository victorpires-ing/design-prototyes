/* ------------------------------------------------------------------ */
/*  Store em memória dos envios/resgates feitos DURANTE a sessão.       */
/*  Começa vazio — as telas de reenvio e resgate escrevem aqui, e a     */
/*  tabela "Envios e resgates" (detalhe) lê para parecer mais fiel.     */
/* ------------------------------------------------------------------ */

import { useSyncExternalStore } from "react";

export type StatusEnvio = "resgatado" | "aberto" | "enviado";

export interface EnvioRegistro {
    id: string;
    destinatario: string;
    email: string;
    quantidade: number;
    status: StatusEnvio;
    data: string;
}

/** Registro sem os campos gerados automaticamente (id/data). */
type NovoEnvio = Omit<EnvioRegistro, "id" | "data">;

const store = new Map<string, EnvioRegistro[]>();
const listeners = new Set<() => void>();
const EMPTY: EnvioRegistro[] = [];
let seq = 1;

const keyOf = (eventoId: string, itemId: string) => `${eventoId}:${itemId}`;
const emit = () => listeners.forEach((l) => l());

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const hoje = () => {
    const d = new Date();
    return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
};

export const getEnvios = (eventoId: string, itemId: string): EnvioRegistro[] => store.get(keyOf(eventoId, itemId)) ?? EMPTY;

export const addEnvios = (eventoId: string, itemId: string, registros: NovoEnvio[]) => {
    if (registros.length === 0) return;
    const key = keyOf(eventoId, itemId);
    const data = hoje();
    const novos = registros.map((r) => ({ ...r, id: `ev${seq++}`, data }));
    // Mais recentes primeiro.
    store.set(key, [...novos, ...(store.get(key) ?? [])]);
    emit();
};

const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => {
        listeners.delete(l);
    };
};

export function useEnvios(eventoId: string, itemId: string): EnvioRegistro[] {
    return useSyncExternalStore(
        subscribe,
        () => getEnvios(eventoId, itemId),
        () => EMPTY,
    );
}

/** Quantidade já enviada/resgatada na sessão para um item. */
export const consumidoDe = (eventoId: string, itemId: string): number => getEnvios(eventoId, itemId).reduce((s, e) => s + e.quantidade, 0);

/** Total de cortesias ainda disponíveis num evento (soma dos itens, descontando a sessão). */
export function useTotalDisponivel(eventoId: string, itens: { id: string; disponivel: number }[]): number {
    const base = () => itens.reduce((s, it) => s + it.disponivel, 0);
    return useSyncExternalStore(
        subscribe,
        () => itens.reduce((s, it) => s + Math.max(0, it.disponivel - consumidoDe(eventoId, it.id)), 0),
        base,
    );
}

/** Nome de exibição a partir do e-mail (parte antes do @, capitalizada). */
export const nomeDoEmail = (email: string): string =>
    email
        .split("@")[0]
        .split(/[._-]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ") || email;
