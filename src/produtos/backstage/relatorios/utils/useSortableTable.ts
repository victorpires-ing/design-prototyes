import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export interface SortState {
    key: string | null;
    dir: SortDir;
}

/**
 * Ordenação funcional de tabelas. Recebe as linhas e um mapa opcional de
 * acessadores por coluna (para valores derivados); cai no valor bruto da
 * propriedade quando não há acessador. Strings são comparadas com locale
 * pt-BR e números/datas numericamente.
 */
export function useSortableTable<T extends Record<string, unknown>>(
    rows: T[],
    accessors?: Partial<Record<string, (row: T) => string | number>>,
    initial?: SortState,
) {
    const [sort, setSort] = useState<SortState>(initial ?? { key: null, dir: "asc" });

    const toggleSort = (key: string) =>
        setSort((prev) =>
            prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { key, dir: "asc" },
        );

    const sorted = useMemo(() => {
        if (!sort.key) return rows;
        const key = sort.key;
        const getValue = (row: T): string | number => {
            const accessor = accessors?.[key];
            if (accessor) return accessor(row);
            const raw = row[key];
            return typeof raw === "number" ? raw : String(raw ?? "");
        };
        const factor = sort.dir === "asc" ? 1 : -1;
        return [...rows].sort((a, b) => {
            const va = getValue(a);
            const vb = getValue(b);
            if (typeof va === "number" && typeof vb === "number") {
                return (va - vb) * factor;
            }
            return String(va).localeCompare(String(vb), "pt-BR", { numeric: true }) * factor;
        });
    }, [rows, sort, accessors]);

    return { sorted, sort, sortKey: sort.key, sortDir: sort.dir, toggleSort };
}
