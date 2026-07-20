import { useState } from "react";
import { ChevronDown, FilterLines } from "@untitledui/icons";
import type { Key, Selection } from "react-aria-components";
import { CountBadge, type FilterRow } from "@/components/application/filter-bar/filter-dropdown-menu";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { FilterPopover } from "./FilterPopover";
import { useRelatorioFilters, type DateRange, type FilterFieldDef } from "./relatorio-filters";

/** Um campo do filtro: MultiSelect quando tem opções, senão input de texto. */
const CampoFiltro = ({
    field,
    value,
    onChange,
}: {
    field: FilterFieldDef;
    value: string;
    onChange: (value: string, operator: string) => void;
}) => {
    if (field.multi) {
        const options = field.multi.options;
        const selectedKeys: Selection = value ? new Set(value.split(",").filter(Boolean)) : new Set();
        const count = selectedKeys instanceof Set ? selectedKeys.size : 0;
        return (
            <MultiSelect
                size="sm"
                aria-label={field.label}
                placeholder="Selecione"
                items={options}
                selectedKeys={selectedKeys}
                onSelectionChange={(keys: Selection) =>
                    onChange(keys === "all" ? options.map((o) => o.id).join(",") : Array.from(keys).join(","), "is")
                }
                supportingText={count > 0 ? `${count} selecionados` : undefined}
                onReset={() => onChange("", "is")}
                onSelectAll={() => onChange(options.map((o) => o.id).join(","), "is")}
            >
                {(item: { id: string; label: string }) => (
                    <MultiSelect.Item id={item.id} selectionIndicator="checkmark">
                        {item.label}
                    </MultiSelect.Item>
                )}
            </MultiSelect>
        );
    }

    return (
        <Input
            size="sm"
            aria-label={field.label}
            placeholder="Digite um valor"
            value={value}
            onChange={(v: string) => onChange(v, "contains")}
        />
    );
};

/** Seletor de Período — o próprio botão de datas (aplica direto). Usado no Relatório personalizado. */
export const RelatorioPeriodoButton = () => {
    const { dateRange, sessao, filters, apply } = useRelatorioFilters();
    return (
        <DateRangePicker
            size="md"
            value={dateRange}
            onChange={(r) => apply({ dateRange: (r as DateRange) ?? null, sessao, filters })}
        />
    );
};

export const RelatorioFilterSlideout = ({ triggerClassName }: { triggerClassName?: string }) => {
    const { fields, sessoes, dateRange, sessao, filters, appliedCount, apply, clear } = useRelatorioFilters();

    const [draftRange, setDraftRange] = useState<DateRange>(dateRange);
    const [draftSessao, setDraftSessao] = useState<string>(sessao);
    const [draftFilters, setDraftFilters] = useState<FilterRow[]>(filters);

    const hasFields = fields.length > 0;
    const hasSessoes = sessoes.length > 0;

    const seed = () => {
        setDraftRange(dateRange);
        setDraftSessao(sessao);
        setDraftFilters(filters);
    };

    const valorDoCampo = (fieldId: string) => draftFilters.find((f) => f.field === fieldId)?.value ?? "";
    const setCampo = (fieldId: string, value: string, operator: string) =>
        setDraftFilters((prev) => {
            if (!value) return prev.filter((f) => f.field !== fieldId);
            if (prev.some((f) => f.field === fieldId)) return prev.map((f) => (f.field === fieldId ? { ...f, value, operator } : f));
            return [...prev, { id: `campo-${fieldId}`, field: fieldId, operator, value }];
        });

    const draftCount = draftFilters.filter((f) => f.field && f.value).length + (draftRange ? 1 : 0) + (draftSessao !== "all" ? 1 : 0);

    return (
        <FilterPopover
            onOpenChange={(open) => open && seed()}
            className="w-[420px]"
            trigger={
                <Button
                    color="secondary"
                    size="md"
                    iconLeading={FilterLines}
                    iconTrailing={ChevronDown}
                    className={cx(appliedCount > 0 && "bg-primary_hover", triggerClassName)}
                >
                    <span className="flex items-center gap-1.5">
                        Filtros
                        {appliedCount > 0 && <CountBadge count={appliedCount} />}
                    </span>
                </Button>
            }
        >
            {(close) => (
                <div className="flex max-h-[min(70vh,640px)] flex-col">
                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
                        {/* Período */}
                        <section className="flex flex-col gap-2">
                            <span className="text-sm font-semibold text-secondary">Período</span>
                            <DateRangePicker value={draftRange} onChange={setDraftRange} />
                        </section>

                        {/* Sessão */}
                        {hasSessoes && (
                            <section className="flex flex-col gap-2">
                                <span className="text-sm font-semibold text-secondary">Sessão</span>
                                <Select
                                    size="sm"
                                    aria-label="Sessão"
                                    selectedKey={draftSessao}
                                    onSelectionChange={(key: Key | null) => setDraftSessao(key ? String(key) : "all")}
                                    items={[{ id: "all", label: "Todas as sessões" }, ...sessoes.map((s) => ({ id: s.id, label: s.descricao }))]}
                                >
                                    {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                </Select>
                            </section>
                        )}

                        {/* Campos — um MultiSelect (ou input) por campo */}
                        {hasFields &&
                            fields.map((field) => (
                                <section key={field.id} className="flex flex-col gap-2">
                                    <span className="text-sm font-semibold text-secondary">{field.label}</span>
                                    <CampoFiltro field={field} value={valorDoCampo(field.id)} onChange={(value, operator) => setCampo(field.id, value, operator)} />
                                </section>
                            ))}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-secondary px-4 py-3">
                        <Button
                            size="sm"
                            color="link-gray"
                            onClick={() => {
                                setDraftRange(null);
                                setDraftSessao("all");
                                setDraftFilters([]);
                                clear();
                            }}
                        >
                            Limpar tudo
                        </Button>
                        <Button
                            size="sm"
                            color="primary"
                            onClick={() => {
                                apply({ dateRange: draftRange, sessao: draftSessao, filters: draftFilters });
                                close();
                            }}
                        >
                            Aplicar{draftCount > 0 ? ` (${draftCount})` : ""}
                        </Button>
                    </div>
                </div>
            )}
        </FilterPopover>
    );
};
