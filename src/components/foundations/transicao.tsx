import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { cx } from "@/utils/cx";

/* ------------------------------------------------------------------ */
/*  Transições de entrada, saída e troca (UI-VIS-008)                  */
/*                                                                     */
/*  Tudo que aparece, some ou troca anima a altura junto com a         */
/*  opacidade: o conteúdo em volta desliza em vez de pular.            */
/*  200 ms, ease-out. Com prefers-reduced-motion, só um fade curto:    */
/*  a altura muda na hora.                                             */
/* ------------------------------------------------------------------ */

export const DURACAO_TRANSICAO = 0.2;

export function useTransicao(): Transition {
    const reduzir = useReducedMotion();
    return reduzir
        ? { height: { duration: 0 }, marginTop: { duration: 0 }, opacity: { duration: 0.12 } }
        : { duration: DURACAO_TRANSICAO, ease: [0.16, 1, 0.3, 1] };
}

interface SurgirProps {
    /** Mostra ou esconde o conteúdo. */
    visivel: boolean;
    children: ReactNode;
    /**
     * Espaço do `gap` do pai (em px) que este bloco ocupa quando visível. Some junto com o bloco,
     * senão o gap fica e a tela pula alguns pixels.
     */
    gap?: number;
    className?: string;
}

/**
 * Aparece e some deslizando a altura. Para trocar um conteúdo por outro (ex.: envio ↔ prévia),
 * use dois `Surgir` com condições opostas: um encolhe enquanto o outro cresce.
 */
export function Surgir({ visivel, children, gap = 0, className }: SurgirProps) {
    const transition = useTransicao();
    return (
        <AnimatePresence initial={false}>
            {visivel && (
                <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: -gap }}
                    animate={{ height: "auto", opacity: 1, marginTop: 0 }}
                    exit={{ height: 0, opacity: 0, marginTop: -gap }}
                    transition={transition}
                    className={cx("overflow-hidden", className)}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
