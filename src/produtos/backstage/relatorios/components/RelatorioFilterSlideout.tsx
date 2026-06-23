import { useState } from "react";
import { ChevronDown, FilterLines, Plus, Trash01 } from "@untitledui/icons";
import type { Key, Selection } from "react-aria-components";
import { CountBadge, type FilterRow } from "@/components/application/filter-bar/filter-dropdown-menu";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Select } from "@/components/base/select/select";
import { SlideoutMenu } from "@/components/application/slideout-menus/slideout-menu";
import { cx } from "@/utils/cx";
import {
    createEmptyFilter,
    OPERATOR_OPTIONS_MULTI,
    OPERATOR_OPTIONS_TEXT,
    useRelatorioFilters,
    type DateRange,
    type FilterFieldDef,
} from "./relatorio-filters";

const FilterValueInput = ({
    fields,
    filter,
    onChange,
}: {
    fields: FilterFieldDef[];
    filter: FilterRow;
    onChange: (patch: Partial<Omit<FilterRow, "id">>) => void;
}) => {
    const def = fields.find((f) => f.id === filter.field);

    if (def?.multi) {
        const options = def.multi.options;
        const selectedKeys: Selection = filter.value ? new Set(filter.value.split(",").filter(Boolean)) : new Set();
        const count = selectedKeys instanceof Set ? selectedKeys.size : 0;
        return (
            <MultiSelect
                className="min-w-0 flex-1"
                size="sm"
                aria-label="Valor"
                placeholder="Selecione"
                items={options}
                selectedKeys={selectedKeys}
                onSelectionChange={(keys: Selection) =>
                    onChange({ value: keys === "all" ? options.map((o) => o.id).join(",") : Array.from(keys).join(",") })
                }
                supportingText={count > 0 ? `${count} selecionados` : undefined}
                onReset={() => onChange({ value: "" })}
                onSelectAll={() => onChange({ value: options.map((o) => o.id).join(",") })}
            >
                {(item: { id: string; label: string }) => (
                    <MultiSelect.Item id={item.id} selectionIndicator="checkbox" selectionIndicatorAlign="left">
                        {item.label}
                    </MultiSelect.Item>
                )}
            </MultiSelect>
        );
    }

    return (
        <Input
            className="min-w-0 flex-1"
            size="sm"
            aria-label="Valor"
            placeholder="Digite um valor"
            value={filter.value}
            onChange={(value: string) => onChange({ value })}
        />
    );
};

export const RelatorioFilterSlideout = ({ triggerClassName }: { triggerClassName?: string }) => {
    const { fields, sessoes, dateRange, sessao, filters, appliedCount, apply, clear } = useRelatorioFilters();

    const [isOpen, setIsOpen] = useState(false);
    const [draftRange, setDraftRange] = useState<DateRange>(dateRange);
    const [draftSessao, setDraftSessao] = useState<string>(sessao);
    const [draftFilters, setDraftFilters] = useState<FilterRow[]>(filters);

    const hasFields = fields.length > 0;
    const hasSessoes = sessoes.length > 0;

    const seedAndOpen = (open: boolean) => {
        if (open) {
            setDraftRange(dateRange);
            setDraftSessao(sessao);
            setDraftFilters(filters);
        }
        setIsOpen(open);
    };

    const addFilter = () => setDraftFilters((prev) => [...prev, createEmptyFilter()]);
    const removeFilter = (id: string) => setDraftFilters((prev) => prev.filter((f) => f.id !== id));
    const changeFilter = (id: string, patch: Partial<Omit<FilterRow, "id">>) =>
        setDraftFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

    const draftCount =
        draftFilters.filter((f) => f.field && f.value).length +
        (draftRange ? 1 : 0) +
        (draftSessao !== "all" ? 1 : 0);

    return (
        <SlideoutMenu.Trigger isOpen={isOpen} onOpenChange={seedAndOpen}>
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

            <SlideoutMenu className="z-50" isDismissable>
                {({ close }) => (
                    <>
                        <SlideoutMenu.Header onClose={close}>
                            <h2 className="text-lg font-semibold text-primary">Filtros</h2>
                            <p className="mt-1 text-sm text-tertiary">Refine os dados de todo o relatório.</p>
                        </SlideoutMenu.Header>

                        <SlideoutMenu.Content>
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
                                        items={[{ id: "all", descricao: "Todas as sessões" }, ...sessoes]}
                                    >
                                        {(item: { id: string; descricao: string }) => (
                                            <Select.Item id={item.id}>{item.descricao}</Select.Item>
                                        )}
                                    </Select>
                                </section>
                            )}

                            {/* Filtros por campo */}
                            {hasFields && (
                                <section className="flex flex-col gap-3">
                                    <span className="text-sm font-semibold text-secondary">Campos</span>
                                    {draftFilters.length === 0 && (
                                        <p className="text-sm text-tertiary">Nenhum filtro de campo adicionado.</p>
                                    )}
                                    {draftFilters.map((filter) => {
                                        const onChange = (patch: Partial<Omit<FilterRow, "id">>) => changeFilter(filter.id, patch);
                                        const def = fields.find((f) => f.id === filter.field);
                                        return (
                                            <div key={filter.id} className="flex flex-col gap-2 rounded-lg bg-secondary p-3 ring-1 ring-border-secondary">
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        className="min-w-0 flex-1"
                                                        size="sm"
                                                        aria-label="Campo"
                                                        placeholder="Selecione o campo"
                                                        items={fields}
                                                        selectedKey={filter.field || null}
                                                        onSelectionChange={(key: Key | null) =>
                                                            onChange({ field: key ? String(key) : "", value: "" })
                                                        }
                                                    >
                                                        {(item: FilterFieldDef) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                                    </Select>
                                                    <Button
                                                        size="sm"
                                                        color="tertiary"
                                                        iconLeading={Trash01}
                                                        aria-label="Remover filtro"
                                                        onClick={() => removeFilter(filter.id)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        className="max-w-36 flex-1"
                                                        size="sm"
                                                        aria-label="Operador"
                                                        items={def?.multi ? OPERATOR_OPTIONS_MULTI : OPERATOR_OPTIONS_TEXT}
                                                        selectedKey={filter.operator || null}
                                                        onSelectionChange={(key: Key | null) => onChange({ operator: key ? String(key) : "" })}
                                                    >
                                                        {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                                    </Select>
                                                    <FilterValueInput fields={fields} filter={filter} onChange={onChange} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div>
                                        <Button size="sm" color="secondary" iconLeading={Plus} onClick={addFilter}>
                                            Adicionar filtro
                                        </Button>
                                    </div>
                                </section>
                            )}
                        </SlideoutMenu.Content>

                        <SlideoutMenu.Footer className="flex items-center justify-between gap-3">
                            <Button
                                size="md"
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
                                size="md"
                                color="primary"
                                onClick={() => {
                                    apply({ dateRange: draftRange, sessao: draftSessao, filters: draftFilters });
                                    close();
                                }}
                            >
                                Aplicar{draftCount > 0 ? ` (${draftCount})` : ""}
                            </Button>
                        </SlideoutMenu.Footer>
                    </>
                )}
            </SlideoutMenu>
        </SlideoutMenu.Trigger>
    );
};
