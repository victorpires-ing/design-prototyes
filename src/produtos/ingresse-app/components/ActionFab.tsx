import type { FC } from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "@untitledui/icons";
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

const CircleAction = ({ icon: Icon, label, onClick }: { icon: FC<{ className?: string }>; label: string; onClick?: () => void }) => (
    <button type="button" onClick={onClick} className="pointer-events-auto flex w-16 flex-col items-center gap-1.5">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-solid text-white shadow-lg transition duration-100 ease-linear active:scale-95">
            <Icon className="size-6" />
        </span>
        <span className="text-center text-sm leading-tight font-medium text-secondary">{label}</span>
    </button>
);

/** Mesma largura do botão circular, para alinhar as duas camadas (abaixo e acima do overlay). */
const CircleSlot = () => <div className="w-16" aria-hidden="true" />;

/** Botão "Mais"/"Fechar": o + gira até virar x e o rótulo entra por baixo. */
const ToggleAction = ({ aberto, onClick }: { aberto: boolean; onClick: () => void }) => (
    <button
        type="button"
        aria-label={aberto ? "Fechar" : "Mais"}
        aria-expanded={aberto}
        onClick={onClick}
        className="pointer-events-auto flex w-16 flex-col items-center gap-1.5"
    >
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-fg-secondary shadow-lg ring-1 ring-border-secondary transition duration-100 ease-linear active:scale-95">
            <motion.span
                className="flex"
                animate={{ rotate: aberto ? 135 : 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.6 }}
            >
                <Plus className="size-6" />
            </motion.span>
        </span>
        <span className="relative h-5 w-full overflow-hidden">
            <AnimatePresence initial={false} mode="wait">
                <motion.span
                    key={aberto ? "fechar" : "mais"}
                    className={cx(
                        "absolute inset-0 text-center text-sm leading-tight font-medium",
                        aberto ? "text-primary_on-brand" : "text-secondary",
                    )}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                >
                    {aberto ? "Fechar" : "Mais"}
                </motion.span>
            </AnimatePresence>
        </span>
    </button>
);

/**
 * Barra de ações no rodapé do frame (botões circulares com rótulo).
 * Mostra as 2 primeiras ações + um botão "Mais" que revela o restante.
 * Com o menu aberto, as ações principais ficam atrás do overlay: o foco vai para o "Mais".
 * Use como `bottomBar` do AppShell.
 */
export function ActionFab({ actions }: { actions: FabAction[] }) {
    const [open, setOpen] = useState(false);
    const primary = actions.slice(0, 2);
    const rest = actions.slice(2);
    const temMais = rest.length > 0;
    const aberto = open && temMais;

    return (
        <>
            {/* Camada de baixo: ações principais (ficam sob o overlay quando o menu abre) */}
            <div
                /* React 18 descarta inert booleano; como atributo string ele funciona. */
                {...(aberto ? { inert: "" } : {})}
                className={cx(
                    "absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pt-16 pb-6",
                    !aberto && "bg-[linear-gradient(to_top,var(--color-bg-secondary)_30%,transparent)]",
                )}
            >
                <div className="flex items-start justify-center gap-8">
                    {primary.map((a) => (
                        <CircleAction key={a.label} icon={a.icon} label={a.short ?? a.label} onClick={a.onClick} />
                    ))}
                    {/* O botão "Mais" vive na camada de cima, para continuar visível com o overlay */}
                    {temMais && <CircleSlot />}
                </div>
            </div>

            {/* Overlay: escurece a tela e as ações principais */}
            <AnimatePresence>
                {aberto && (
                    <motion.button
                        type="button"
                        aria-label="Fechar"
                        onClick={() => setOpen(false)}
                        className="pointer-events-auto absolute inset-0 z-10 bg-black/50 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                    />
                )}
            </AnimatePresence>

            {/* Camada de cima: botão "Mais" e as ações extras, sempre sobre o overlay */}
            {temMais && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center px-5 pt-16 pb-6">
                    <div className="flex flex-col gap-5">
                        {/* Ações extras em formato de pílula */}
                        <AnimatePresence>
                            {aberto && (
                                <motion.div className="flex flex-col items-end gap-2.5" initial="closed" animate="open" exit="closed">
                                    {rest.map((a, i) => {
                                        const Icon = a.icon;
                                        // De baixo para cima: a pílula mais próxima do botão entra primeiro.
                                        const delay = (rest.length - 1 - i) * 0.04;
                                        return (
                                            <motion.button
                                                key={a.label}
                                                type="button"
                                                onClick={() => {
                                                    setOpen(false);
                                                    a.onClick?.();
                                                }}
                                                variants={{
                                                    closed: { opacity: 0, y: 12, scale: 0.94 },
                                                    open: { opacity: 1, y: 0, scale: 1 },
                                                }}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 420,
                                                    damping: 32,
                                                    mass: 0.6,
                                                    delay,
                                                    opacity: { duration: 0.18, delay },
                                                }}
                                                whileTap={{ scale: 0.96 }}
                                                className={cx(
                                                    "pointer-events-auto flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg ring-1",
                                                    a.dark
                                                        ? "bg-black text-primary_on-brand ring-white/15"
                                                        : "bg-primary text-primary ring-border-secondary active:bg-secondary",
                                                )}
                                            >
                                                <Icon className={cx("size-5", a.dark ? "text-primary_on-brand" : "text-fg-quaternary")} />
                                                {a.label}
                                            </motion.button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Linha principal: slots vazios + o botão "Mais"/"Fechar" */}
                        <div className="flex items-start justify-center gap-8">
                            {primary.map((a) => (
                                <CircleSlot key={a.label} />
                            ))}
                            <ToggleAction aberto={aberto} onClick={() => setOpen((v) => !v)} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
