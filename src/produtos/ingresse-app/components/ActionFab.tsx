import type { FC } from "react";
import { useState } from "react";
import { Plus, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export interface FabAction {
    icon: FC<{ className?: string }>;
    label: string;
    /** Rótulo curto exibido sob o botão circular (fallback para label). */
    short?: string;
    /** Estilo escuro (ex.: Adicionar à carteira) quando exibido como pílula. */
    dark?: boolean;
    onClick?: () => void;
}

const CircleAction = ({
    icon: Icon,
    label,
    onClick,
    variant = "primary",
    onDark = false,
}: {
    icon: FC<{ className?: string }>;
    label: string;
    onClick?: () => void;
    variant?: "primary" | "neutral";
    /** Menu aberto (fundo escuro): rótulo em branco para contraste. */
    onDark?: boolean;
}) => (
    <button type="button" onClick={onClick} className="pointer-events-auto flex w-16 flex-col items-center gap-1.5">
        <span
            className={cx(
                "flex size-14 items-center justify-center rounded-full shadow-lg transition duration-100 ease-linear active:scale-95",
                variant === "primary" ? "bg-brand-solid text-white" : "bg-primary text-fg-secondary ring-1 ring-border-secondary",
            )}
        >
            <Icon className="size-6" />
        </span>
        <span className={cx("text-center text-xs leading-tight font-medium", onDark ? "text-white" : "text-secondary")}>{label}</span>
    </button>
);

/**
 * Barra de ações no rodapé do frame (botões circulares com rótulo).
 * Mostra as 2 primeiras ações + um botão "Mais" que revela o restante.
 * Use como `bottomBar` do AppShell.
 */
export function ActionFab({ actions }: { actions: FabAction[] }) {
    const [open, setOpen] = useState(false);
    const primary = actions.slice(0, 2);
    const rest = actions.slice(2);

    return (
        <>
            {open && rest.length > 0 && (
                <button
                    type="button"
                    aria-label="Fechar"
                    onClick={() => setOpen(false)}
                    className="pointer-events-auto absolute inset-0 bg-black/50 backdrop-blur-md duration-200 animate-in fade-in"
                />
            )}

            <div
                className={cx(
                    "absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pt-16 pb-6",
                    !open && "bg-[linear-gradient(to_top,var(--color-bg-secondary)_30%,transparent)]",
                )}
            >
                {/* Bloco centralizado: a pílula alinha à direita (acima do "Mais/Fechar") */}
                <div className="flex flex-col gap-5">
                {/* Ações extras (reveladas pelo "Mais") em formato de pílula */}
                {open && rest.length > 0 && (
                    <div className="flex flex-col items-end gap-2.5 duration-150 animate-in fade-in slide-in-from-bottom-2">
                        {rest.map((a) => {
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

                {/* Linha principal: 2 ações + Mais */}
                <div className="flex items-start justify-center gap-8">
                    {primary.map((a) => (
                        <CircleAction key={a.label} icon={a.icon} label={a.short ?? a.label} onClick={a.onClick} onDark={open} />
                    ))}
                    {rest.length > 0 && (
                        <CircleAction icon={open ? XClose : Plus} label={open ? "Fechar" : "Mais"} variant="neutral" onDark={open} onClick={() => setOpen((v) => !v)} />
                    )}
                </div>
                </div>
            </div>
        </>
    );
}
