import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, FilterLines, HomeLine, UploadCloud02 } from "@untitledui/icons";
import type { Key, Selection } from "react-aria-components";
import { CountBadge, type FilterRow } from "@/components/application/filter-bar/filter-dropdown-menu";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { EVENT } from "../data/event";
import { useRelatorioFilters, type DateRange, type FilterFieldDef } from "./relatorio-filters";

/* ------------------------------------------------------------------ */
/*  Export menu (Excel / CSV / PDF)                                    */
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
/*  Controle de filtro por campo (multiselect ou texto)               */
/* ------------------------------------------------------------------ */

/** Itens de Sessão para o Select (usa `label` para exibir o valor selecionado). */
const sessaoItems = (sessoes: { id: string; descricao: string }[]) => [
    { id: "all", label: "Todas as sessões" },
    ...sessoes.map((s) => ({ id: s.id, label: s.descricao })),
];

/** Multiselect com indicador de check (sem checkbox, sem botões extras). */
const MultiSelectCampo = ({
    field,
    value,
    onChange,
    className,
    popoverClassName,
}: {
    field: FilterFieldDef;
    value: string;
    onChange: (v: string) => void;
    className?: string;
    popoverClassName?: string;
}) => {
    const options = field.multi!.options;
    const selectedKeys: Selection = value ? new Set(value.split(",").filter(Boolean)) : new Set();
    return (
        <MultiSelect
            className={className}
            size="sm"
            aria-label={field.label}
            placeholder={field.label}
            popoverClassName={popoverClassName}
            items={options}
            selectedKeys={selectedKeys}
            onSelectionChange={(keys: Selection) => onChange(keys === "all" ? options.map((o) => o.id).join(",") : Array.from(keys).join(","))}
            selectedCountFormatter={(count) => `${count} ${count === 1 ? "selecionado" : "selecionados"}`}
            showSearch={false}
            showFooter={false}
        >
            {(item: { id: string; label: string }) => (
                <MultiSelect.Item id={item.id} selectionIndicator="checkmark">
                    {item.label}
                </MultiSelect.Item>
            )}
        </MultiSelect>
    );
};

const FieldControl = ({ field }: { field: FilterFieldDef }) => {
    const { dateRange, sessao, filters, apply } = useRelatorioFilters();
    const current = filters.find((f) => f.field === field.id)?.value ?? "";

    const setValue = (value: string) => {
        const others = filters.filter((f) => f.field !== field.id);
        const op = field.multi ? "is" : "contains";
        const next = value ? [...others, { id: `f-${field.id}`, field: field.id, operator: op, value }] : others;
        apply({ dateRange, sessao, filters: next });
    };

    if (field.multi) return <MultiSelectCampo field={field} value={current} onChange={setValue} className="w-56 shrink-0" />;

    return <Input className="w-52 shrink-0" size="sm" aria-label={field.label} placeholder={field.label} value={current} onChange={setValue} />;
};

/* ------------------------------------------------------------------ */
/*  Barra de filtros inline (horizontal, sem overlay — ok em iframe)   */
/* ------------------------------------------------------------------ */

const FiltrosBar = ({ mostrarPeriodo }: { mostrarPeriodo: boolean }) => {
    const { fields, sessoes, dateRange, sessao, filters, appliedCount, apply, clear } = useRelatorioFilters();

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
            {mostrarPeriodo && (
                <div className="shrink-0">
                    <DateRangePicker value={dateRange} onChange={(range) => apply({ dateRange: range, sessao, filters })} />
                </div>
            )}

            {sessoes.length > 0 && (
                <Select
                    className="w-48 shrink-0"
                    size="sm"
                    aria-label="Sessão"
                    selectedKey={sessao}
                    onSelectionChange={(key: Key | null) => apply({ dateRange, sessao: key ? String(key) : "all", filters })}
                    items={sessaoItems(sessoes)}
                >
                    {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                </Select>
            )}

            {fields.map((field) => (
                <FieldControl key={field.id} field={field} />
            ))}

            {appliedCount > 0 && (
                <Button size="sm" color="link-gray" className="shrink-0" onClick={clear}>
                    Limpar
                </Button>
            )}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Variante de teste — botão "Filtrar" com dropdown + Aplicar/Cancelar */
/* ------------------------------------------------------------------ */

const FiltrosDropdown = ({ mostrarPeriodo }: { mostrarPeriodo: boolean }) => {
    const { fields, sessoes, dateRange, sessao, filters, appliedCount, apply, clear } = useRelatorioFilters();
    const [open, setOpen] = useState(false);
    const [draftRange, setDraftRange] = useState<DateRange>(dateRange);
    const [draftSessao, setDraftSessao] = useState(sessao);
    const [draftFilters, setDraftFilters] = useState<FilterRow[]>(filters);

    const abrir = () => {
        setDraftRange(dateRange);
        setDraftSessao(sessao);
        setDraftFilters(filters);
        setOpen(true);
    };

    const draftFieldValue = (fieldId: string) => draftFilters.find((f) => f.field === fieldId)?.value ?? "";
    const setDraftField = (field: FilterFieldDef, value: string) => {
        const others = draftFilters.filter((f) => f.field !== field.id);
        const op = field.multi ? "is" : "contains";
        setDraftFilters(value ? [...others, { id: `f-${field.id}`, field: field.id, operator: op, value }] : others);
    };

    const draftCount = draftFilters.filter((f) => f.field && f.value).length + (draftRange ? 1 : 0) + (draftSessao !== "all" ? 1 : 0);

    return (
        <div className="relative w-fit">
            <Button color="secondary" size="md" iconLeading={FilterLines} onClick={() => (open ? setOpen(false) : abrir())} className={cx(appliedCount > 0 && "bg-primary_hover")}>
                <span className="flex items-center gap-1.5">
                    Filtrar
                    {appliedCount > 0 && <CountBadge count={appliedCount} />}
                </span>
            </Button>

            <AnimatePresence>
                {open && (
                    <>
                        {/* backdrop — dim no mobile, transparente no desktop (fecha ao clicar fora) */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 z-40 bg-overlay/40 sm:bg-transparent"
                            aria-hidden="true"
                            onClick={() => setOpen(false)}
                        />

                        {/* painel — bottom sheet no mobile, ancorado ao botão no desktop */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 16 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-primary shadow-xl ring-1 ring-border-secondary_alt sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:bottom-auto sm:left-auto sm:mt-2 sm:max-h-[70vh] sm:w-[360px] sm:rounded-xl"
                        >
                            <span className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-quaternary sm:hidden" aria-hidden="true" />
                        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
                            <span className="text-sm font-semibold text-primary">Filtros</span>

                            {mostrarPeriodo && (
                                <section className="flex flex-col gap-1.5">
                                    <span className="text-sm font-medium text-secondary">Período</span>
                                    <DateRangePicker value={draftRange} onChange={setDraftRange} />
                                </section>
                            )}

                            {sessoes.length > 0 && (
                                <section className="flex flex-col gap-1.5">
                                    <span className="text-sm font-medium text-secondary">Sessão</span>
                                    <Select
                                        size="sm"
                                        aria-label="Sessão"
                                        popoverClassName="z-[60]"
                                        selectedKey={draftSessao}
                                        onSelectionChange={(key: Key | null) => setDraftSessao(key ? String(key) : "all")}
                                        items={sessaoItems(sessoes)}
                                    >
                                        {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                    </Select>
                                </section>
                            )}

                            {fields.map((field) => (
                                <section key={field.id} className="flex flex-col gap-1.5">
                                    <span className="text-sm font-medium text-secondary">{field.label}</span>
                                    {field.multi ? (
                                        <MultiSelectCampo field={field} value={draftFieldValue(field.id)} onChange={(v) => setDraftField(field, v)} popoverClassName="z-[60]" />
                                    ) : (
                                        <Input size="sm" aria-label={field.label} placeholder={field.label} value={draftFieldValue(field.id)} onChange={(v) => setDraftField(field, v)} />
                                    )}
                                </section>
                            ))}
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-secondary p-4">
                            <Button
                                size="sm"
                                color="link-gray"
                                onClick={() => {
                                    setDraftRange(null);
                                    setDraftSessao("all");
                                    setDraftFilters([]);
                                    clear();
                                    setOpen(false);
                                }}
                            >
                                Limpar tudo
                            </Button>
                            <div className="flex items-center gap-2">
                                <Button size="sm" color="secondary" onClick={() => setOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    color="primary"
                                    onClick={() => {
                                        apply({ dateRange: draftRange, sessao: draftSessao, filters: draftFilters });
                                        setOpen(false);
                                    }}
                                >
                                    Aplicar{draftCount > 0 ? ` (${draftCount})` : ""}
                                </Button>
                            </div>
                        </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Cabeçalho da página de relatório                                   */
/* ------------------------------------------------------------------ */

interface RelatorioPageHeaderProps {
    title: string;
    /** Ações extras (ex.: ExportMenu). */
    actions?: ReactNode;
    /** Variante dos filtros: "inline" (padrão) ou "dropdown" (botão Filtrar + Aplicar/Cancelar). */
    filtroVariante?: "inline" | "dropdown";
    /** Renderiza os filtros padrão (Período/Sessão/campos). Use false em relatórios com controles próprios (ex: Comparativos). Default: true. */
    withFilters?: boolean;
    /** Exibe o filtro de Período. Use false em relatórios sem recorte por data (ex: Borderô). Default: true. */
    mostrarPeriodo?: boolean;
}

export const RelatorioPageHeader = ({ title, actions, filtroVariante = "inline", withFilters = true, mostrarPeriodo = true }: RelatorioPageHeaderProps) => {
    return (
        <div className={cx("sticky top-0 z-40 -mt-6 flex flex-col gap-3 border-x-8 border-[var(--color-bg-secondary)] bg-secondary pt-6 pb-3 dark:border-[#0a0a0a] dark:bg-[#0a0a0a]")}>
            <div className="max-lg:hidden">
                <Breadcrumbs type="button">
                    <Breadcrumbs.Item href="/" icon={HomeLine} />
                    <Breadcrumbs.Item href="/backstage/relatorios/vendas-por-grupo">Relatórios</Breadcrumbs.Item>
                    <Breadcrumbs.Item>{title}</Breadcrumbs.Item>
                </Breadcrumbs>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                    <p className="text-xl font-semibold text-primary">{title}</p>
                    <p className="text-sm text-tertiary">
                        {EVENT.tzLabel} <span className="px-1 text-fg-quaternary">|</span> {EVENT.currency} ({EVENT.currencyLabel})
                    </p>
                </div>
                {((withFilters && filtroVariante === "dropdown") || actions) && (
                    <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-normal">
                        {withFilters && filtroVariante === "dropdown" && <FiltrosDropdown mostrarPeriodo={mostrarPeriodo} />}
                        {actions}
                    </div>
                )}
            </div>

            {withFilters && filtroVariante === "inline" && (
                <>
                    <div className="h-px w-full bg-border-secondary" aria-hidden="true" />
                    <FiltrosBar mostrarPeriodo={mostrarPeriodo} />
                </>
            )}
        </div>
    );
};
