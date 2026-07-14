import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, SearchLg, XClose } from "@untitledui/icons";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";

export interface CheckboxSelectOption {
    id: string;
    label: string;
    sub?: string;
}

interface CheckboxSelectProps {
    label?: string;
    placeholder: string;
    options: CheckboxSelectOption[];
    selected: Set<string>;
    onChange: (next: Set<string>) => void;
    /** Marca o label com asterisco de obrigatório. */
    required?: boolean;
    /** Texto de apoio abaixo do campo. */
    hint?: ReactNode;
    /** Renderiza chips das opções selecionadas (com × para remover). Default: true. */
    showChips?: boolean;
}

export function CheckboxSelect({ label, placeholder, options, selected, onChange, required, hint, showChips = true }: CheckboxSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUp, setOpenUp] = useState(false);
    const [busca, setBusca] = useState("");
    const rootRef = useRef<HTMLDivElement | null>(null);
    const anchorRef = useRef<HTMLDivElement | null>(null);

    // Ao abrir, decide se o painel abre para cima (quando falta espaço abaixo).
    useEffect(() => {
        if (!isOpen || !anchorRef.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        const espacoAbaixo = window.innerHeight - rect.bottom;
        const alturaPainel = 288; // ~ max-h-64 + busca
        setOpenUp(espacoAbaixo < alturaPainel && rect.top > espacoAbaixo);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onMouseDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) setBusca("");
    }, [isOpen]);

    const summary = useMemo(() => {
        if (selected.size === 0) return placeholder;
        if (selected.size === 1) {
            const only = options.find((o) => selected.has(o.id));
            return only?.label ?? "1 selecionado";
        }
        return `${selected.size} selecionados`;
    }, [selected, options, placeholder]);

    const filtered = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return options;
        return options.filter((o) => o.label.toLowerCase().includes(termo));
    }, [options, busca]);

    const toggle = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onChange(next);
    };

    const chips = showChips ? options.filter((o) => selected.has(o.id)) : [];

    return (
        <div className="flex flex-col gap-1.5" ref={rootRef}>
            {label && (
                <span className="text-sm font-medium text-secondary">
                    {label}
                    {required && <span className="text-brand-secondary"> *</span>}
                </span>
            )}
            <div className="relative" ref={anchorRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen((v) => !v)}
                    aria-expanded={isOpen}
                    className={cx(
                        "flex w-full items-center justify-between gap-2 rounded-lg bg-primary px-3 py-2.5 text-left shadow-xs ring-1 transition duration-100 ease-linear",
                        isOpen ? "ring-2 ring-brand" : "ring-border-primary hover:bg-primary_hover",
                    )}
                >
                    <span className={cx("truncate text-sm", selected.size === 0 ? "text-placeholder" : "text-primary")}>{summary}</span>
                    <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-150", isOpen && "rotate-180")} aria-hidden="true" />
                </button>

                {isOpen && (
                    <div className={cx("absolute z-20 max-h-64 w-full overflow-y-auto rounded-lg bg-primary shadow-lg ring-1 ring-border-secondary_alt", openUp ? "bottom-full mb-1.5" : "top-full mt-1.5")}>
                        <div className="sticky top-0 bg-primary p-2">
                            <div className="flex items-center gap-2 rounded-md bg-secondary px-2.5 py-2">
                                <SearchLg className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                <input
                                    type="text"
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    placeholder="Buscar"
                                    aria-label="Buscar opções"
                                    className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-placeholder"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col p-1">
                            {filtered.length === 0 ? (
                                <span className="px-2.5 py-3 text-sm text-tertiary">Nenhuma opção encontrada.</span>
                            ) : (
                                filtered.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => toggle(option.id)}
                                        className="flex items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition duration-100 ease-linear hover:bg-primary_hover"
                                    >
                                        <span className="pt-0.5">
                                            <Checkbox isSelected={selected.has(option.id)} onChange={() => toggle(option.id)} aria-label={option.label} />
                                        </span>
                                        <span className="flex min-w-0 flex-1 flex-col">
                                            <span className="truncate text-sm text-primary">{option.label}</span>
                                            {option.sub && <span className="truncate text-sm text-tertiary">{option.sub}</span>}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {chips.map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-1 rounded-md bg-secondary py-1 pr-1 pl-2 text-sm text-secondary ring-1 ring-border-secondary">
                            {c.label}
                            <button
                                type="button"
                                onClick={() => toggle(c.id)}
                                aria-label={`Remover ${c.label}`}
                                className="flex size-4 items-center justify-center rounded text-fg-quaternary transition duration-100 ease-linear hover:bg-tertiary hover:text-fg-secondary"
                            >
                                <XClose className="size-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {hint && <p className="text-sm text-tertiary">{hint}</p>}
        </div>
    );
}
