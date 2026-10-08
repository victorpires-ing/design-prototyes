import { useReducedMotion } from "motion/react";

/**
 * Fonte única de verdade para "o usuário pediu menos movimento".
 *
 * Convenção da campanha: com movimento reduzido a página continua a mesma.
 * Não some conteúdo, não some cor, não some o xadrez. O que some é o
 * deslocamento, e tudo chega ao estado final num fade curto.
 */
export function useSwMotion() {
    const reduce = useReducedMotion() ?? false;

    return {
        reduce,
        /** Escolhe entre o valor normal e o reduzido, sem encher o JSX de ternário. */
        v: <A, B>(normal: A, reduzido: B) => (reduce ? reduzido : normal),
        /** Colapsa a duração para um crossfade quase instantâneo. */
        dur: (d: number) => (reduce ? Math.min(d, 0.18) : d),
        /** Zera o escalonamento: tudo aparece junto. */
        stagger: (s: number) => (reduce ? 0 : s),
        /** Corta o loop infinito. */
        repeat: (r: number) => (reduce ? 0 : r),
        /** Zera o deslocamento em px, sobra só a opacidade. */
        shift: (px: number) => (reduce ? 0 : px),
    };
}
