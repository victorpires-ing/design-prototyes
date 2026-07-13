import { useSyncExternalStore } from "react";

export type PermTipo = "grupo" | "individual";
export type CotaMode = "shared" | "per";

export interface Ticket {
    id: string;
    name: string;
    area: string;
    tipo: string;
}

export const TICKETS: Ticket[] = [
    { id: "esquadrao", name: "Esquadrão de Aço", area: "Cadeira Superior Norte · 16 ago 16:00", tipo: "Inteira" },
    { id: "inteira-norte", name: "Inteira Norte", area: "Cadeira Norte · 16 ago 16:00", tipo: "Inteira" },
    { id: "socio-leste", name: "Sócio Associação", area: "Cadeira Leste · 16 ago 16:00", tipo: "Cortesia" },
    { id: "visitante", name: "Inteira Visitante", area: "Visitante Superior · 16 ago 16:00", tipo: "Inteira" },
];

export type CotaNivel = "ok" | "high" | "full";

export function cotaNivel(usadas: number, total: number): CotaNivel {
    if (total <= 0) return "ok";
    const pct = usadas / total;
    if (pct >= 1) return "full";
    if (pct >= 0.85) return "high";
    return "ok";
}

export interface TicketLiberado {
    ticketId: string;
    label: string;
    qty: number;
    perEmissor?: boolean;
}

export interface Permissao {
    id: string;
    nome: string;
    tipo: PermTipo;
    iniciais: string;
    sub: string;
    emissorCount: number;
    quotaMode: CotaMode;
    emailList: string[];
    indEmail: string;
    tickets: TicketLiberado[];
    usadas: number;
    total: number;
}

/* ------------------------------------------------------------------ */
/*  Store reativo (módulo singleton, sem context/provider)             */
/* ------------------------------------------------------------------ */

let _store: Permissao[] = [];
const _listeners = new Set<() => void>();

function _notify() {
    _listeners.forEach((l) => l());
}

function _snapshot() {
    return _store;
}

function _subscribe(fn: () => void) {
    _listeners.add(fn);
    return () => {
        _listeners.delete(fn);
    };
}

export function getPermissao(id: string): Permissao | undefined {
    return _store.find((p) => p.id === id);
}

export function addPermissao(p: Permissao) {
    _store = [p, ..._store];
    _notify();
}

export function updatePermissao(id: string, updated: Permissao) {
    _store = _store.map((p) => (p.id === id ? updated : p));
    _notify();
}

export function removePermissao(id: string) {
    _store = _store.filter((p) => p.id !== id);
    _notify();
}

export function usePermissoes() {
    return useSyncExternalStore(_subscribe, _snapshot);
}
