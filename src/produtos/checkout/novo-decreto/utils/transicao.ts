import type { Transition } from "motion/react";

/**
 * Smart Animate do Figma: Ease In and Out, 450 ms.
 * Usado em toda troca de estado da proteção (Proteger, Seguir sem proteção e Remover).
 */
export const SMART_ANIMATE: Transition = { duration: 0.45, ease: [0.42, 0, 0.58, 1] };

/** Classe equivalente para transições em CSS puro (bordas, sombras, cores). */
export const SMART_ANIMATE_CSS = "duration-[450ms] ease-in-out";
