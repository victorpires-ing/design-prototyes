/* Simulação de "Entrar como [dependente]": qual perfil a Carteira está usando agora.
   Não é a troca de perfis definitiva — só um contexto temporário, iniciado na área de dependentes
   e encerrado com "Voltar ao meu perfil". */

import { useSyncExternalStore } from "react";
import fotoMinhaConta from "../assets/foto-perfil.jpg";

/** Foto da conta logada (simulada). Dependentes não têm foto: aparecem com as iniciais. */
export const FOTO_MINHA_CONTA = fotoMinhaConta;

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
