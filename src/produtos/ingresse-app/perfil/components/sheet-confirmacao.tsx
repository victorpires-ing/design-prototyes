import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

/**
 * Bottom sheet de confirmação da área de dependentes (o mesmo da exclusão de dependente):
 * título, texto de apoio, conteúdo opcional e as ações empilhadas.
 */
export function SheetConfirmacao({
    aberto,
    titulo,
    descricao,
    children,
    confirmar,
    destrutivo,
    carregando,
    onConfirmar,
    onCancelar,
}: {
    aberto: boolean;
    titulo: string;
    descricao?: ReactNode;
    children?: ReactNode;
    confirmar: string;
    destrutivo?: boolean;
    carregando?: boolean;
    onConfirmar: () => void;
    onCancelar: () => void;
}) {
    return (
        <AnimatePresence>
            {aberto && (
                <motion.div
                    key="sheet-overlay"
                    className="fixed inset-0 z-50 flex items-end justify-center bg-overlay/60"
                    role="dialog"
                    aria-modal="true"
                    aria-label={titulo}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    onClick={(e) => e.target === e.currentTarget && !carregando && onCancelar()}
                >
                    <motion.div
                        className="w-full max-w-md rounded-t-2xl bg-primary px-6 pt-6 pb-8 shadow-xl ring-1 ring-border-secondary"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-primary">{titulo}</h2>
                            <button
                                type="button"
                                aria-label="Fechar"
                                disabled={carregando}
                                onClick={onCancelar}
                                className="-mr-1 flex size-6 shrink-0 items-center justify-center text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary disabled:opacity-50"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>
                        {descricao && <p className="mt-1 text-sm leading-relaxed text-tertiary">{descricao}</p>}
                        {children}
                        <div className="mt-6 flex flex-col gap-3">
                            <Button
                                size="lg"
                                color={destrutivo ? "primary-destructive" : "primary"}
                                className="w-full"
                                isLoading={carregando}
                                onClick={onConfirmar}
                            >
                                {confirmar}
                            </Button>
                            <Button size="lg" color="secondary" className="w-full" isDisabled={carregando} onClick={onCancelar}>
                                Cancelar
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
