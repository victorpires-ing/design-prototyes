import { useSyncExternalStore } from "react";

// Estado global do overlay de busca — abre suave de qualquer página (header, hero).
let aberto = false;
let intent: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Abre a busca. Opcionalmente com uma intenção/experiência inicial (id). */
export function openSearch(intencao?: string) {
    intent = intencao ?? null;
    aberto = true;
    emit();
}

/** Lê e limpa a intenção inicial (consumida pelo overlay ao abrir). */
export function takeIntent(): string | null {
    const v = intent;
    intent = null;
    return v;
}
export function closeSearch() {
    if (!aberto) return;
    aberto = false;
    emit();
}

export function useSearchOpen(): boolean {
    return useSyncExternalStore(
        (l) => {
            listeners.add(l);
            return () => listeners.delete(l);
        },
        () => aberto,
        () => aberto,
    );
}
