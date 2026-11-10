import { useEffect, useRef, type FC } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useReducedMotion } from "motion/react";
import { cx } from "@/utils/cx";

/* ------------------------------------------------------------------ */
/*  Ícone animado do Iconly (UI-DS-008)                                */
/*                                                                     */
/*  Lottie em traço (estilo Light). Toca uma vez quando o item que o   */
/*  contém (opção de menu, botão, link) ganha hover ou foco: anima no  */
/*  momento da escolha, sem loop. Parado, mostra o último quadro (o    */
/*  ícone completo). Com prefers-reduced-motion, nunca toca.           */
/*  A cor vem de `currentColor`, para seguir o token do texto do item. */
/* ------------------------------------------------------------------ */

const ALVO = '[role="menuitem"], [role="option"], button, a';

interface IconeAnimadoProps {
    animacao: object;
    className?: string;
}

export function IconeAnimado({ animacao, className }: IconeAnimadoProps) {
    const caixa = useRef<HTMLSpanElement>(null);
    const lottie = useRef<LottieRefCurrentProps>(null);
    const reduzir = useReducedMotion();

    // Começa no último quadro: o ícone aparece completo, sem animar sozinho.
    const congelar = () => {
        const total = lottie.current?.getDuration(true) ?? 0;
        if (total > 0) lottie.current?.goToAndStop(total - 1, true);
    };

    useEffect(() => {
        const alvo = caixa.current?.closest(ALVO);
        if (!alvo || reduzir) return;
        const tocar = () => lottie.current?.goToAndPlay(0, true);
        alvo.addEventListener("mouseenter", tocar);
        alvo.addEventListener("focus", tocar);
        return () => {
            alvo.removeEventListener("mouseenter", tocar);
            alvo.removeEventListener("focus", tocar);
        };
    }, [reduzir]);

    return (
        <span ref={caixa} aria-hidden="true" className={cx("inline-flex shrink-0", className)}>
            <Lottie
                lottieRef={lottie}
                animationData={animacao}
                loop={false}
                autoplay={false}
                onDOMLoaded={congelar}
                className="size-full [&_path]:stroke-current [&_path[fill^='rgb']]:fill-current"
            />
        </span>
    );
}

/** Cria um componente de ícone no formato que o DS espera (`FC<{ className }>`), ex.: `Dropdown.Item icon`. */
export const iconeAnimado = (animacao: object): FC<{ className?: string }> => {
    const Icone = ({ className }: { className?: string }) => (
        // O DS passa `size-4` e `stroke-[…]` para ícone SVG; o Lottie usa o próprio traço, então
        // só o tamanho, a margem e a cor interessam.
        <IconeAnimado animacao={animacao} className={cx(className, "size-5")} />
    );
    return Icone;
};
