import type { Transition } from "motion/react";

/* Tokens de movimento da campanha. Tudo que anima importa daqui, para as três
   páginas terem o mesmo "sotaque" de movimento. */

/** Saída expo. O easing-assinatura: sai rápido e pousa macio. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
/** Saída quint, mais contida. Para elementos pequenos. */
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
/** Mecânico. Para o que atravessa a tela: wipe e faixa xadrez. */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
/** Resposta imediata de toque, quase sem rampa. */
export const EASE_SNAP = [0.2, 0, 0, 1] as const;

export const DUR = {
    snap: 0.12,
    quick: 0.18,
    base: 0.28,
    enter: 0.42,
    reveal: 0.62,
    hero: 0.82,
    wipe: 1.5,
    sweep: 1.1,
} as const;

export const STAGGER = {
    letter: 0.028,
    word: 0.055,
    line: 0.09,
    grid: 0.07,
    chips: 0.04,
} as const;

/** Toggle "ON": rígido, quase sem oscilação. */
export const SPRING_TOGGLE: Transition = { type: "spring", stiffness: 700, damping: 34, mass: 0.6 };
/** Quique curto de card e chip. */
export const SPRING_POP: Transition = { type: "spring", stiffness: 520, damping: 30, mass: 0.7 };
/** Elemento compartilhado entre listagem e página de modalidade. */
export const SPRING_SHARED: Transition = { type: "spring", stiffness: 260, damping: 30, mass: 0.9 };
/** Contador: longo, para o número assentar. */
export const SPRING_COUNTER: Transition = { type: "spring", stiffness: 90, damping: 24, mass: 1 };
/** Amortece o jitter do scroll sem atrasar o parallax. */
export const SPRING_SCROLL: Transition = { type: "spring", stiffness: 180, damping: 36, mass: 0.6, restDelta: 0.001 };

export const T_ENTER: Transition = { duration: DUR.enter, ease: EASE_OUT_EXPO };
export const T_REVEAL: Transition = { duration: DUR.reveal, ease: EASE_OUT_EXPO };
export const T_HERO: Transition = { duration: DUR.hero, ease: EASE_OUT_EXPO };
export const T_SNAP: Transition = { duration: DUR.snap, ease: EASE_SNAP };
export const T_QUICK: Transition = { duration: DUR.quick, ease: EASE_OUT_QUINT };
export const T_WIPE: Transition = { duration: DUR.wipe, ease: EASE_IN_OUT };

/** Hex da identidade, para onde é preciso passar cor em JS (motion, SVG, canvas). */
export const SW = {
    lime: "#B3F300",
    magenta: "#FF1289",
    blue: "#0099FF",
    navy: "#0B2559",
    ink: "#07132E",
    raised: "#122F6B",
    white: "#FFFFFF",
    black: "#000000",
} as const;
