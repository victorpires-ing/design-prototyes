import { AnimatePresence, motion } from "motion/react";
import { SwitchHorizontal01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

/** Dedinho tocando + ondinha, para simular o "clique" da pessoa. */
function Tap({ className }: { className?: string }) {
    return (
        <span className={cx("pointer-events-none absolute", className)}>
            <motion.span
                className="absolute -inset-2 rounded-full bg-black/15"
                animate={{ scale: [0.5, 1.8], opacity: [0.45, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span className="block text-2xl drop-shadow" animate={{ y: [0, -5, 0] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}>
                👆
            </motion.span>
        </span>
    );
}

/** Mini-demo desktop: só o botão "Trocar" (fileira de ações do ingresso) com a mãozinha clicando, em loop. */
function DemoTrocaDesktop() {
    return (
        <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-secondary">
            <div className="relative">
                {/* Pílula "Trocar" no mesmo estilo das ações do ingresso no desktop */}
                <motion.span
                    className="flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary shadow-lg ring-1 ring-border-secondary"
                    animate={{ scale: [1, 0.95, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                >
                    <SwitchHorizontal01 className="size-5 text-fg-quaternary" />
                    Trocar
                </motion.span>
                <Tap className="top-9 -right-2" />
            </div>
        </div>
    );
}

/** Onboarding (primeiro acesso) da troca/upgrade de ingresso — versão desktop da Carteira. */
export function TrocaOnboardingDesktop({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Troque ou faça upgrade do seu ingresso"
                        className="w-full max-w-[480px] rounded-2xl bg-primary p-6 shadow-xl"
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="text-lg font-bold text-primary">Troque ou faça upgrade do seu ingresso</h2>
                            <button
                                type="button"
                                aria-label="Fechar"
                                onClick={onClose}
                                className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>

                        <div className="mt-5">
                            <DemoTrocaDesktop />
                        </div>

                        <p className="mt-5 text-sm leading-relaxed text-tertiary">
                            Escolha uma nova opção de ingresso para o mesmo evento na Carteira. Se ela custar mais, você paga apenas a diferença e as taxas aplicáveis.
                        </p>

                        <Button size="lg" color="primary" className="mt-5 w-full" onClick={onClose}>
                            Entendi
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
