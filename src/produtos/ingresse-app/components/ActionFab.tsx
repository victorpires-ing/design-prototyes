import type { FC } from "react";
import { useState } from "react";
import { Plus, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export interface FabAction {
    icon: FC<{ className?: string }>;
    label: string;
    /** Estilo iOS (fundo preto), ex.: Adicionar à Carteira. */
    dark?: boolean;
    onClick?: () => void;
}

/**
 * Botão flutuante (FAB) no canto inferior direito que abre um menu de ações.
 * Use como `bottomBar` do AppShell para acompanhar o scroll do frame.
 */
export function ActionFab({ actions }: { actions: FabAction[] }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            {open && (
                <button
                    type="button"
                    aria-label="Fechar menu"
                    onClick={() => setOpen(false)}
                    className="pointer-events-auto absolute inset-0 bg-black/30"
                />
            )}

            <div className="absolute right-5 bottom-10 flex flex-col items-end gap-3">
                {open && (
                    <div className="flex flex-col items-end gap-2.5 duration-150 animate-in fade-in slide-in-from-bottom-2">
                        {actions.map((a) => {
                            const Icon = a.icon;
                            return (
                                <button
                                    key={a.label}
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        a.onClick?.();
                                    }}
                                    className={cx(
                                        "pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg ring-1 transition duration-100 ease-linear",
                                        a.dark ? "bg-black text-white ring-black/10" : "bg-primary text-primary ring-border-secondary active:bg-secondary",
                                    )}
                                >
                                    <Icon className={cx("size-5", a.dark ? "text-white" : "text-fg-quaternary")} />
                                    {a.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                <button
                    type="button"
                    aria-label={open ? "Fechar ações" : "Abrir ações"}
                    onClick={() => setOpen((v) => !v)}
                    className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-brand-solid text-white shadow-lg transition duration-100 ease-linear active:scale-95"
                >
                    {open ? <XClose className="size-6" /> : <Plus className="size-6" />}
                </button>
            </div>
        </>
    );
}
