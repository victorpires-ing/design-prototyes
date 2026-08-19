import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Send01, SwitchHorizontal01, Tag01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";
import { BottomSheet } from "../../components/BottomSheet";

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

// Espelha o CircleAction do FAB real: ações primárias vermelhas, "Mais" neutro.
const Circle = ({ icon: Icon, label, brand }: { icon: typeof Plus; label: string; brand?: boolean }) => (
    <div className="flex w-14 flex-col items-center gap-1.5">
        <span className={cx("flex size-11 items-center justify-center rounded-full shadow-lg", brand ? "bg-brand-solid text-white" : "bg-primary text-fg-secondary ring-1 ring-border-secondary")}>
            <Icon className="size-5" />
        </span>
        <span className="text-center text-[10px] leading-tight font-medium text-secondary">{label}</span>
    </div>
);

// Espelha a pílula do FAB real: fundo branco, ring e ícone cinza.
const Pill = ({ icon: Icon, label }: { icon: typeof Plus; label: string }) => (
    <span className="flex items-center gap-2.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary shadow-lg ring-1 ring-border-secondary">
        <Icon className="size-5 text-fg-quaternary" />
        {label}
    </span>
);

/** Mini-demonstração do FAB: toca em "Mais", a tela escurece e revela as opções, com foco em "Trocar ingresso". Em loop. */
function DemoFab() {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        let alive = true;
        let id: ReturnType<typeof setTimeout>;
        const ciclo = (aberto: boolean) => {
            setOpen(aberto);
            id = setTimeout(() => alive && ciclo(!aberto), aberto ? 2600 : 1600);
        };
        ciclo(false);
        return () => {
            alive = false;
            clearTimeout(id);
        };
    }, []);

    return (
        <div className="relative h-32 overflow-hidden rounded-2xl bg-secondary">
            <AnimatePresence mode="wait">
                {!open ? (
                    // Fechado: os botões do ingresso (Transferir, Vender, Mais) + toque em "Mais"
                    <motion.div
                        key="fechado"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex items-center justify-center gap-4"
                    >
                        <Circle icon={Send01} label="Transferir" brand />
                        <Circle icon={Tag01} label="Vender" brand />
                        <div className="relative">
                            <Circle icon={Plus} label="Mais" />
                            <Tap className="top-6 left-9" />
                        </div>
                    </motion.div>
                ) : (
                    // Aberto: a tela escurece e revela só o "Trocar ingresso"
                    <motion.div
                        key="aberto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/65"
                    >
                        <div className="relative">
                            <Pill icon={SwitchHorizontal01} label="Trocar ingresso" />
                            <Tap className="top-8 -right-3" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/** Onboarding (primeiro acesso) que apresenta a funcionalidade de trocar ingresso. */
export function TrocaOnboarding({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col">
                <DemoFab />

                <h2 className="mt-5 text-lg font-bold text-primary">Troque ou faça upgrade do seu ingresso</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-tertiary">
                    Escolha uma nova opção de ingresso para o mesmo evento na Carteira. Se ela custar mais, você paga apenas a diferença e as taxas aplicáveis.
                </p>

                <Button size="lg" color="primary" className="mt-5 w-full rounded-full" onClick={onClose}>
                    Entendi
                </Button>
            </div>
        </BottomSheet>
    );
}
