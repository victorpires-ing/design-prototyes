/* Desktop/Mobile do protótipo, compartilhado entre as páginas da Carteira Web (carteira, dependentes, transferir). */

import { useSyncExternalStore } from "react";

export type Viewport = "desktop" | "mobile";

let atual: Viewport = "desktop";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
};

export const setViewport = (v: Viewport) => {
    atual = v;
    listeners.forEach((l) => l());
};

export const useViewport = () => [useSyncExternalStore(subscribe, () => atual), setViewport] as const;
