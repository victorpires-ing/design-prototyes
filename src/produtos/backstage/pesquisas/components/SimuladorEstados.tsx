import { useState } from "react";
import { Settings01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface SimuladorEstadosProps<T extends string> {
    options: { id: T; label: string }[];
    value: T;
    onChange: (v: T) => void;
}

/** Painel flutuante (só protótipo) para simular estados da tela, ex.: empty states. */
export function SimuladorEstados<T extends string>({ options, value, onChange }: SimuladorEstadosProps<T>) {
    const [open, setOpen] = useState(false);

    return (
        <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-2">
            {open && (
                <div className="flex w-60 flex-col gap-1 rounded-xl bg-primary p-2 shadow-lg ring-1 ring-border-secondary">
                    <span className="px-2 py-1 text-xs font-semibold tracking-wide text-tertiary uppercase">Simular estado</span>
                    {options.map((o) => (
                        <button
                            key={o.id}
                            type="button"
                            onClick={() => onChange(o.id)}
                            className={cx(
                                "rounded-lg px-3 py-2 text-left text-sm transition duration-100 ease-linear",
                                value === o.id ? "bg-brand-primary font-semibold text-brand-secondary" : "text-secondary hover:bg-primary_hover",
                            )}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>
            )}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Simular estados"
                className={cx(
                    "flex size-11 items-center justify-center rounded-full bg-primary text-fg-secondary shadow-lg ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-primary_hover",
                    open && "ring-2 ring-brand",
                )}
            >
                <Settings01 className="size-5" />
            </button>
        </div>
    );
}
