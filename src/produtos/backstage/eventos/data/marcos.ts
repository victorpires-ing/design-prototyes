import { useSyncExternalStore } from "react";

/**
 * Marcos & anotações do evento.
 *
 * O dado sozinho não explica o pico: o produtor registra aqui o que aconteceu
 * (virada de lote, anúncio de atração, ação de marketing) para dar contexto à
 * curva de vendas depois.
 */

export type TipoMarco = "lote" | "atracao" | "marketing" | "externo";

export const TIPO_MARCO_LABEL: Record<TipoMarco, string> = {
    lote: "Virada de lote",
    atracao: "Anúncio de atração",
    marketing: "Ação de marketing",
    externo: "Evento externo",
};

export const TIPO_MARCO_COR: Record<TipoMarco, string> = {
    lote: "var(--color-utility-brand-500)",
    atracao: "var(--color-utility-purple-500)",
    marketing: "var(--color-utility-blue-500)",
    externo: "var(--color-utility-gray-400)",
};

export interface Marco {
    id: string;
    eventoId: string;
    /** Data do marco, em ISO curto (YYYY-MM-DD). */
    data: string;
    tipo: TipoMarco;
    titulo: string;
    descricao?: string;
}

const STORAGE_KEY = "backstage-marcos";
const VAZIO: Marco[] = [];

/** Alguns marcos já registrados, para a curva não nascer sem contexto. */
const SEMENTE: Marco[] = [
    {
        id: "m1",
        eventoId: "6704",
        data: "2026-06-15",
        tipo: "lote",
        titulo: "Virou 3º lote",
        descricao: "Full Pass de R$ 890 para R$ 1.120.",
    },
    { id: "m2", eventoId: "6704", data: "2026-07-28", tipo: "atracao", titulo: "Anúncio do line-up completo" },
    {
        id: "m3",
        eventoId: "6704",
        data: "2026-08-14",
        tipo: "marketing",
        titulo: "Campanha de remarketing",
        descricao: "Foco em quem abandonou o carrinho.",
    },
    {
        id: "m4",
        eventoId: "2871",
        data: "2026-08-18",
        tipo: "externo",
        titulo: "Classificação na Libertadores",
        descricao: "Pico de procura no dia seguinte.",
    },
];

let cache: Marco[] | null = null;
const listeners = new Set<() => void>();

function read(): Marco[] {
    if (cache) return cache;
    if (typeof window === "undefined") return VAZIO;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        cache = raw ? (JSON.parse(raw) as Marco[]) : [...SEMENTE];
    } catch {
        cache = [...SEMENTE];
    }
    return cache;
}

function write(next: Marco[]) {
    cache = next;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        /* storage indisponível — mantém apenas em memória */
    }
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Marcos do evento, do mais recente para o mais antigo. */
export function useMarcos(eventoId: string): Marco[] {
    const todos = useSyncExternalStore(subscribe, read, () => VAZIO);
    return todos.filter((marco) => marco.eventoId === eventoId).sort((a, b) => b.data.localeCompare(a.data));
}

export function addMarco(marco: Omit<Marco, "id">) {
    const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `marco-${Math.random().toString(16).slice(2)}`;
    write([{ ...marco, id }, ...read()]);
}

export function removeMarco(id: string) {
    write(read().filter((marco) => marco.id !== id));
}
