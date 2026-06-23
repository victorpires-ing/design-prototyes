import { ArrowDown, ArrowUp, ChevronSelectorVertical } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { SortDir } from "../utils/useSortableTable";

interface SortableHeaderProps {
    label: string;
    align?: "left" | "right";
    /** Chave da coluna; quando informada junto de onSort, o header é clicável. */
    sortKey?: string;
    /** Chave atualmente ordenada (para destacar e escolher o ícone). */
    activeKey?: string | null;
    dir?: SortDir;
    onSort?: (key: string) => void;
}

/**
 * Header de coluna com ícone de ordenação ao lado do texto.
 * - Inativo: ChevronSelectorVertical esmaecido.
 * - Ativo: ArrowUp / ArrowDown conforme a direção.
 * Quando `sortKey` e `onSort` são fornecidos, todo o header vira um botão.
 */
export const SortableHeader = ({
    label,
    align = "left",
    sortKey,
    activeKey,
    dir = "asc",
    onSort,
}: SortableHeaderProps) => {
    const isActive = !!sortKey && activeKey === sortKey;
    const Icon = isActive ? (dir === "asc" ? ArrowUp : ArrowDown) : ChevronSelectorVertical;
    const interactive = !!sortKey && !!onSort;

    const content = (
        <span className={cx("inline-flex items-center gap-1", align === "right" && "flex-row-reverse")}>
            <span>{label}</span>
            <Icon
                aria-hidden="true"
                className={cx(
                    "size-3.5 shrink-0",
                    isActive ? "text-fg-brand-primary" : "text-fg-quaternary",
                )}
            />
        </span>
    );

    if (!interactive) {
        return (
            <span className={cx("inline-flex items-center", align === "right" && "justify-end")}>
                {content}
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={() => onSort!(sortKey!)}
            className={cx(
                "inline-flex items-center rounded transition duration-100 ease-linear hover:text-secondary",
                align === "right" && "justify-end",
            )}
            aria-label={`Ordenar por ${label}`}
        >
            {content}
        </button>
    );
};
