import { useSyncExternalStore } from "react";

export const CIDADES = ["Belo Horizonte", "São Paulo", "Rio de Janeiro", "Curitiba", "Salvador"];

// Cidade selecionada — compartilhada entre o header e as páginas (sem provider).
let cidade = "Belo Horizonte";
const listeners = new Set<() => void>();

export function setCidade(nova: string) {
    cidade = nova;
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function useCidade(): string {
    return useSyncExternalStore(subscribe, () => cidade, () => cidade);
}
