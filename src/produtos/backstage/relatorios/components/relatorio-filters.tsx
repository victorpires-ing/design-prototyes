import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import type { FilterRow } from "@/components/application/filter-bar/filter-dropdown-menu";
import { EVENT, parseEventDate, type Sessao } from "../data/event";

export type { FilterRow };

export type DateRange = { start: DateValue; end: DateValue } | null;

/** Converte "dd/mm/aaaa" em CalendarDate. */
const parseBR = (s: string): CalendarDate | null => {
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? new CalendarDate(Number(m[3]), Number(m[2]), Number(m[1])) : null;
};

/** Intervalo cobrindo toda a janela de vendas do evento. */
export const periodoCompleto = (): DateRange => {
    const start = parseBR(EVENT.salesStart);
    const end = parseBR(EVENT.salesEnd);
    return start && end ? { start, end } : null;
};

/** Definição de um campo filtrável. `multi` torna o valor um multiselect. */
export interface FilterFieldDef {
    id: string;
    label: string;
    multi?: { options: { id: string; label: string }[] };
    /** Quando definido, exibe abaixo do input um checkbox com este rótulo (ex.: "Com
     * passkey") que filtra por "campo preenchido", como alternativa a digitar um valor. */
    hasValueCheckbox?: string;
    /** Torna o campo um select de 4 estados — presença/ausência de valor, ou um valor
     * específico (que revela um input de texto). Ex.: "Qualquer uso" / "Com cupom" /
     * "Com cupom específico" / "Sem cupom". */
    presenceSelect?: {
        anyLabel: string;
        hasLabel: string;
        specificLabel: string;
        noneLabel: string;
    };
    /** Placeholder do input de texto simples. Default: "Digite um valor". */
    placeholder?: string;
}

/** Valor sentinela usado pelo `hasValueCheckbox`/`presenceSelect` — não é comparado
 * literalmente, apenas sinaliza para `matchFilterValue` que o operador "has-value" ou
 * "no-value" deve ser aplicado. */
export const HAS_VALUE_SENTINEL = "__has_value__";
export const NO_VALUE_SENTINEL = "__no_value__";

export interface AppliedFilters {
    dateRange: DateRange;
    /** "all" ou o id de uma sessão. */
    sessao: string;
    filters: FilterRow[];
}

interface RelatorioFiltersContextValue extends AppliedFilters {
    fields: FilterFieldDef[];
    sessoes: Sessao[];
    appliedCount: number;
    apply: (next: AppliedFilters) => void;
    clear: () => void;
}

const RelatorioFiltersContext = createContext<RelatorioFiltersContextValue | null>(null);

export const useRelatorioFilters = (): RelatorioFiltersContextValue => {
    const ctx = useContext(RelatorioFiltersContext);
    if (!ctx) throw new Error("useRelatorioFilters deve ser usado dentro de RelatorioFiltersProvider");
    return ctx;
};

interface ProviderProps {
    fields?: FilterFieldDef[];
    sessoes?: Sessao[];
    /** Período inicial aplicado (ex.: período completo do evento). Default null. */
    initialDateRange?: DateRange;
    children: ReactNode;
}

export const countApplied = (a: AppliedFilters): number =>
    a.filters.filter((f) => f.field && f.value).length +
    (a.dateRange ? 1 : 0) +
    (a.sessao && a.sessao !== "all" ? 1 : 0);

export const RelatorioFiltersProvider = ({ fields = [], sessoes = [], initialDateRange = null, children }: ProviderProps) => {
    const [applied, setApplied] = useState<AppliedFilters>({ dateRange: initialDateRange, sessao: "all", filters: [] });

    const apply = useCallback((next: AppliedFilters) => setApplied(next), []);
    const clear = useCallback(() => setApplied({ dateRange: initialDateRange, sessao: "all", filters: [] }), [initialDateRange]);

    const value = useMemo<RelatorioFiltersContextValue>(
        () => ({
            fields,
            sessoes,
            dateRange: applied.dateRange,
            sessao: applied.sessao,
            filters: applied.filters,
            appliedCount: countApplied(applied),
            apply,
            clear,
        }),
        [fields, sessoes, applied, apply, clear],
    );

    return <RelatorioFiltersContext.Provider value={value}>{children}</RelatorioFiltersContext.Provider>;
};

/* ------------------------------------------------------------------ */
/*  Matching helpers (row-level)                                      */
/* ------------------------------------------------------------------ */

export function matchFilterValue(haystack: string, needle: string, operator: string): boolean {
    const h = haystack.toLowerCase();
    const n = needle.toLowerCase();
    switch (operator) {
        case "has-value":
            // Ignora `needle` (o sentinela) — só verifica se o campo tem valor real.
            return h.trim() !== "" && h !== "—";
        case "no-value":
            return h.trim() === "" || h === "—";
        case "is":
        case "is-not":
            // Trata o haystack como um conjunto de tags separadas por vírgula, para permitir
            // que uma linha corresponda a mais de um rótulo simultaneamente (ex.: status
            // "Aprovado" + tag derivada "Aprovados hoje"). Compatível com haystacks de uma
            // única tag (comportamento anterior de igualdade exata).
            return h
                .split(",")
                .map((tag) => tag.trim())
                .includes(n) === (operator === "is");
        case "equals":
            return h === n;
        case "starts-with":
            return h.startsWith(n);
        case "does-not-contain":
            return !h.includes(n);
        case "contains":
        default:
            return h.includes(n);
    }
}

/** Aplica todas as linhas de filtro a uma linha de dados via acessador de campo. */
export function matchRow<T>(row: T, rows: FilterRow[], getFieldValue: (row: T, field: string) => string): boolean {
    for (const r of rows) {
        if (!r.field || !r.value) continue;
        const haystack = getFieldValue(row, r.field);
        const values = r.value.split(",").map((v) => v.trim()).filter(Boolean);
        if (!values.length) continue;
        const negate = r.operator === "is-not" || r.operator === "does-not-contain";
        const matched = negate
            ? values.every((v) => matchFilterValue(haystack, v, r.operator))
            : values.some((v) => matchFilterValue(haystack, v, r.operator));
        if (!matched) return false;
    }
    return true;
}

/** Predicado de intervalo de data sobre uma string dd/mm/aaaa parseável. */
export function inDateRange(date: Date | null, range: DateRange): boolean {
    if (!range) return true;
    if (!date) return false;
    const tz = getLocalTimeZone();
    const startMs = range.start.toDate(tz).getTime();
    const endMs = range.end.toDate(tz).getTime() + 86_400_000 - 1;
    const ms = date.getTime();
    return ms >= startMs && ms <= endMs;
}

/** Fração (0,1] da janela de vendas do evento coberta pelo intervalo selecionado. */
export const dateRangeFraction = (range: DateRange): number => {
    if (!range) return 1;
    const tz = getLocalTimeZone();
    const start = parseEventDate(EVENT.salesStart)!.getTime();
    const end = parseEventDate(EVENT.salesEnd)!.getTime();
    const rStart = Math.max(start, range.start.toDate(tz).getTime());
    const rEnd = Math.min(end, range.end.toDate(tz).getTime());
    if (rEnd < rStart) return 0.05;
    const frac = (rEnd - rStart) / (end - start || 1);
    return Math.min(1, Math.max(0.05, frac));
};

let nextFilterId = 1;
export const createEmptyFilter = (): FilterRow => ({
    id: `f${nextFilterId++}`,
    field: "",
    operator: "is",
    value: "",
});

export const OPERATOR_OPTIONS_MULTI = [
    { id: "is", label: "É" },
    { id: "is-not", label: "Não é" },
];

export const OPERATOR_OPTIONS_TEXT = [
    { id: "contains", label: "Contém" },
    { id: "equals", label: "Igual a" },
    { id: "does-not-contain", label: "Não contém" },
    { id: "starts-with", label: "Começa com" },
];
