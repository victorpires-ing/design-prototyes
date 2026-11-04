/* "Entrar como [dependente]" na Carteira Web: qual perfil a carteira está usando agora (mesma lógica do app). */

import { useSyncExternalStore } from "react";

export type PerfilAtivo = {
    id: string;
    nome: string;
    iniciais: string;
    cpf: string;
    /** Ingressos visíveis nesse perfil: só os que quem entrou comprou ou atribuiu ao dependente. */
    carteira: { eventId: string; itens: string[] }[];
};

let ativo: PerfilAtivo | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
};

export const getPerfilAtivo = () => ativo;
export const usePerfilAtivo = () => useSyncExternalStore(subscribe, () => ativo);

export const entrarNoPerfil = (perfil: PerfilAtivo) => {
    ativo = perfil;
    notify();
};

export const sairDoPerfil = () => {
    ativo = null;
    notify();
};

/** Ids dos itens do evento que aparecem no perfil ativo (undefined = perfil próprio, mostra tudo). */
export const itensDoPerfil = (eventId?: string) => (ativo ? (ativo.carteira.find((c) => c.eventId === eventId)?.itens ?? []) : undefined);
