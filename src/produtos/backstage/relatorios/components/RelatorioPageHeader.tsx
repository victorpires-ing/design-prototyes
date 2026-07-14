import type { ReactNode } from "react";
import { getLocalTimeZone } from "@internationalized/date";
import { ChevronDown, Clock, CurrencyDollarCircle, UploadCloud02, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { cx } from "@/utils/cx";
import { EVENT, dateFormatter } from "../data/event";
import { RelatorioFilterSlideout } from "./RelatorioFilterSlideout";
import { useRelatorioFilters } from "./relatorio-filters";

/* ------------------------------------------------------------------ */
/*  Export menu (Excel / CSV / PDF) — usado no slot de ações.          */
/* ------------------------------------------------------------------ */

export const ExportMenu = ({ onExport }: { onExport?: (format: "excel" | "csv" | "pdf") => void }) => (
    <Dropdown.Root>
        <Button color="secondary" size="md" iconLeading={UploadCloud02} iconTrailing={ChevronDown}>
            Exportar
        </Button>
        <Dropdown.Popover>
            <Dropdown.Menu>
                <Dropdown.Item label="Arquivo Excel" onAction={() => onExport?.("excel")} />
                <Dropdown.Item label="Arquivo .CSV" onAction={() => onExport?.("csv")} />
                <Dropdown.Item label="Arquivo PDF" onAction={() => onExport?.("pdf")} />
            </Dropdown.Menu>
        </Dropdown.Popover>
    </Dropdown.Root>
);

/* ------------------------------------------------------------------ */
/*  Chip de filtro ativo                                              */
/* ------------------------------------------------------------------ */

const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pl-2.5 pr-1 text-sm font-medium text-secondary ring-1 ring-border-secondary">
        {label}
        <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover filtro ${label}`}
            className="flex size-4 items-center justify-center rounded-full text-fg-quaternary transition duration-100 ease-linear hover:bg-tertiary hover:text-fg-secondary"
        >
            <XClose className="size-3" />
        </button>
    </span>
);

const InfoChip = ({ icon: Icon, label }: { icon: typeof Clock; label: string }) => (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-tertiary">
        <Icon className="size-3.5 text-fg-quaternary" aria-hidden="true" />
        {label}
    </span>
);

/* ------------------------------------------------------------------ */
/*  Tira de filtros aplicados + meta do evento                         */
/* ------------------------------------------------------------------ */

const FiltersStrip = () => {
    const { fields, sessoes, dateRange, sessao, filters, appliedCount, apply, clear } = useRelatorioFilters();
    const tz = getLocalTimeZone();

    const removeDate = () => apply({ dateRange: null, sessao, filters });
    const removeSessao = () => apply({ dateRange, sessao: "all", filters });
    const removeFilter = (id: string) => apply({ dateRange, sessao, filters: filters.filter((f) => f.id !== id) });

    const validFilters = filters.filter((f) => f.field && f.value);

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <InfoChip icon={Clock} label={EVENT.tzLabel} />
            <InfoChip icon={CurrencyDollarCircle} label={`Moeda: ${EVENT.currency} (${EVENT.currencyLabel})`} />

            {appliedCount > 0 && <span className="h-4 w-px bg-border-secondary" aria-hidden="true" />}

            {dateRange && (
                <FilterChip
                    label={`${dateFormatter.format(dateRange.start.toDate(tz))} – ${dateFormatter.format(dateRange.end.toDate(tz))}`}
                    onRemove={removeDate}
                />
            )}
            {sessao !== "all" && (
                <FilterChip
                    label={`Sessão: ${sessoes.find((s) => s.id === sessao)?.label ?? sessao}`}
                    onRemove={removeSessao}
                />
            )}
            {validFilters.map((f) => {
                const def = fields.find((x) => x.id === f.field);
                const value = def?.multi
                    ? f.value
                          .split(",")
                          .map((v) => def.multi!.options.find((o) => o.id === v)?.label ?? v)
                          .join(", ")
                    : f.value;
                return <FilterChip key={f.id} label={`${def?.label ?? f.field}: ${value}`} onRemove={() => removeFilter(f.id)} />;
            })}

            {appliedCount > 0 && (
                <Button size="sm" color="link-gray" onClick={clear}>
                    Limpar tudo
                </Button>
            )}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Barra superior fixa                                               */
/* ------------------------------------------------------------------ */

interface RelatorioPageHeaderProps {
    title: string;
    /** Ações extras (ex.: ExportMenu). O botão de Filtros já é incluído quando withFilters. */
    actions?: ReactNode;
    /** Renderiza o botão de Filtros + tira de filtros (exige RelatorioFiltersProvider). Default true. */
    withFilters?: boolean;
    /** Controles fixos exibidos numa linha dentro do header (ex.: toggles de métrica). */
    toolbar?: ReactNode;
}

export const RelatorioPageHeader = ({ title, actions, withFilters = true, toolbar }: RelatorioPageHeaderProps) => {
    return (
        <div className={cx("sticky top-[var(--bs-header-offset,0px)] z-40 -mt-6 flex flex-col gap-3 border-x-8 border-[var(--color-bg-secondary)] bg-secondary pb-3 pt-6 shadow-[-8px_0_0_0_var(--color-bg-secondary),8px_0_0_0_var(--color-bg-secondary)] dark:border-[#0a0a0a] dark:bg-[#0a0a0a] dark:shadow-[-8px_0_0_0_#0a0a0a,8px_0_0_0_#0a0a0a]")}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-display-sm font-semibold text-primary">{title}</p>
                {(actions || withFilters) && (
                    <div className="flex flex-wrap items-center gap-3">
                        {actions}
                        {withFilters && <RelatorioFilterSlideout />}
                    </div>
                )}
            </div>
            {withFilters && <FiltersStrip />}
            {toolbar && <div className="flex flex-wrap items-end gap-x-6 gap-y-3 overflow-x-auto">{toolbar}</div>}
        </div>
    );
};
