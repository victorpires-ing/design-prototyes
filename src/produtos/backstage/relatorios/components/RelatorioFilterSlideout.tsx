import { useState } from "react";
import { ChevronDown, FilterLines } from "@untitledui/icons";
import type { Key, Selection } from "react-aria-components";
import { CountBadge, type FilterRow } from "@/components/application/filter-bar/filter-dropdown-menu";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { FilterPopover } from "./FilterPopover";
import { HAS_VALUE_SENTINEL, NO_VALUE_SENTINEL, useRelatorioFilters, type DateRange, type FilterFieldDef } from "./relatorio-filters";

type PresenceMode = "qualquer" | "com" | "especifico" | "sem";

const presenceModeFrom = (value: string, operator: string): PresenceMode => {
    if (!value) return "qualquer";
    if (operator === "has-value") return "com";
    if (operator === "no-value") return "sem";
    return "especifico";
};

/** Select de 4 estados (qualquer uso / com valor / com valor específico / sem valor) —
 * o modo "específico" revela um input de texto abaixo para digitar o valor exato. */
const PresenceSelectFiltro = ({
    field,
    value,
    operator,
    onChange,
}: {
    field: FilterFieldDef & { presenceSelect: NonNullable<FilterFieldDef["presenceSelect"]> };
    value: string;
    operator: string;
    onChange: (value: string, operator: string) => void;
}) => {
    const [mode, setMode] = useState<PresenceMode>(() => presenceModeFrom(value, operator));
    const [specificText, setSpecificText] = useState(() => (operator === "contains" ? value : ""));

    const options = [
        { id: "qualquer", label: field.presenceSelect.anyLabel },
        { id: "com", label: field.presenceSelect.hasLabel },
        { id: "especifico", label: field.presenceSelect.specificLabel },
        { id: "sem", label: field.presenceSelect.noneLabel },
    ];

    const selectMode = (next: PresenceMode) => {
        setMode(next);
        if (next === "qualquer") onChange("", "is");
        else if (next === "com") onChange(HAS_VALUE_SENTINEL, "has-value");
        else if (next === "sem") onChange(NO_VALUE_SENTINEL, "no-value");
        else onChange(specificText, "contains");
    };

    return (
        <div className="flex flex-col gap-2">
            <Select
                size="sm"
                aria-label={field.label}
                selectedKey={mode}
                onSelectionChange={(key: Key | null) => selectMode((key as PresenceMode) ?? "qualquer")}
                items={options}
            >
                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
            </Select>
            {mode === "especifico" && (
                <Input
                    size="sm"
                    aria-label={`${field.label} — valor específico`}
                    placeholder="Digite o valor exato"
                    value={specificText}
                    onChange={(v: string) => {
                        setSpecificText(v);
                        onChange(v, "contains");
                    }}
                />
            )}
        </div>
    );
};

/** Um campo do filtro: MultiSelect quando tem opções, senão input de texto. */
const CampoFiltro = ({
    field,
    value,
    operator,
    onChange,
}: {
    field: FilterFieldDef;
    value: string;
    operator: string;
    onChange: (value: string, operator: string) => void;
}) => {
    if (field.presenceSelect) {
        return <PresenceSelectFiltro field={field as FilterFieldDef & { presenceSelect: NonNullable<FilterFieldDef["presenceSelect"]> }} value={value} operator={operator} onChange={onChange} />;
    }

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

    const hasValueChecked = value === HAS_VALUE_SENTINEL;
    return (
        <div className="flex flex-col gap-2">
            <Input
                size="sm"
                aria-label={field.label}
                placeholder="Digite um valor"
                value={hasValueChecked ? "" : value}
                isDisabled={hasValueChecked}
                onChange={(v: string) => onChange(v, "contains")}
            />
            {field.hasValueCheckbox && (
                <Checkbox
                    size="sm"
                    label={field.hasValueCheckbox}
                    isSelected={hasValueChecked}
                    onChange={(checked) => onChange(checked ? HAS_VALUE_SENTINEL : "", "has-value")}
                />
            )}
        </div>
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
    const operadorDoCampo = (fieldId: string) => draftFilters.find((f) => f.field === fieldId)?.operator ?? "is";
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
                                    <CampoFiltro
                                        field={field}
                                        value={valorDoCampo(field.id)}
                                        operator={operadorDoCampo(field.id)}
                                        onChange={(value, operator) => setCampo(field.id, value, operator)}
                                    />
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
