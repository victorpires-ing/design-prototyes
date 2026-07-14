import { useSyncExternalStore } from "react";

export type MembroTipo = "individuo" | "grupo";

export interface RegraIngresso {
    ticketId: string;
    label: string;
    cota: number;
    usadas: number;
}

export interface Membro {
    id: string;
    tipo: MembroTipo;
    nome: string; // e-mail/CPF para indivíduo, nome do grupo
    emails: string[]; // lista de membros do grupo (vazio para indivíduo)
    modulos: string[]; // IDs dos módulos selecionados
    regras: RegraIngresso[]; // config do módulo "cortesias"
    relatorios: string[]; // ids de relatórios liberados (config do módulo "relatorios")
    conviteFantasma: boolean;
    criadoEm: string;
}

export const MODULOS = [
    { id: "cortesias", label: "Gestão e Envio de Cortesias", disponivel: true },
    { id: "relatorios", label: "Relatórios e Dashboards", disponivel: true },
    { id: "portaria", label: "Controle de Portaria / Check-in", disponivel: false },
];

export function moduloLabel(id: string) {
    return MODULOS.find((m) => m.id === id)?.label ?? id;
}

/** Relatórios que podem ser liberados (config do módulo "relatorios"). */
export const RELATORIOS = [
    { id: "vendas", label: "Vendas por grupo", desc: "Faturamento e volume por canal" },
    { id: "bordero", label: "Borderô financeiro", desc: "Repasses, taxas e acertos" },
    { id: "acesso", label: "Acesso / Check-in", desc: "Entradas e ocupação em tempo real" },
    { id: "transacoes", label: "Transações", desc: "Pedidos, estornos e conciliação" },
];

export function relatorioLabel(id: string) {
    return RELATORIOS.find((r) => r.id === id)?.label ?? id;
}

export const TICKETS = [
    { id: "esquadrao", name: "Esquadrão de Aço", area: "Cadeira Superior Norte · 16 ago 16:00" },
    { id: "inteira-norte", name: "Inteira Norte", area: "Cadeira Norte · 16 ago 16:00" },
    { id: "socio-leste", name: "Sócio Associação", area: "Cadeira Leste · 16 ago 16:00" },
    { id: "visitante", name: "Inteira Visitante", area: "Visitante Superior · 16 ago 16:00" },
];

export type CotaNivel = "ok" | "high" | "full";
export function cotaNivel(usadas: number, total: number): CotaNivel {
    if (total <= 0) return "ok";
    const pct = usadas / total;
    if (pct >= 1) return "full";
    if (pct >= 0.85) return "high";
    return "ok";
}

// Store reativo (módulo singleton, sem context)
let _store: Membro[] = [];
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

export function getMembro(id: string) {
    return _store.find((m) => m.id === id);
}
export function addMembro(m: Membro) {
    _store = [m, ..._store];
    _notify();
}
export function updateMembro(id: string, m: Membro) {
    _store = _store.map((x) => (x.id === id ? m : x));
    _notify();
}
export function removeMembro(id: string) {
    _store = _store.filter((m) => m.id !== id);
    _notify();
}
export function useMembros() {
    return useSyncExternalStore(_subscribe, _snapshot);
}
