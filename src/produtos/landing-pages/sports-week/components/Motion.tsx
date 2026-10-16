import type { CSSProperties, ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { cx } from "@/utils/cx";
import { DUR, EASE_OUT_EXPO, STAGGER } from "../utils/motion-tokens";
import { useSwMotion } from "../utils/use-sw-motion";

/* Peças de movimento reutilizadas pelas três páginas. */

type Direcao = "up" | "down" | "left" | "right" | "scale" | "none";

/** Entrada ao entrar em cena. Nunca aninhar um Reveal dentro de outro. */
export function Reveal({
    children,
    direcao = "up",
    distancia = 28,
    delay = 0,
    duracao = DUR.reveal,
    className,
    amount = 0.2,
}: {
    children: ReactNode;
    direcao?: Direcao;
    distancia?: number;
    delay?: number;
    duracao?: number;
    className?: string;
    amount?: number;
}) {
    const { reduce, shift } = useSwMotion();
    const d = shift(distancia);

    const offsets: Record<Direcao, { x?: number; y?: number; scale?: number }> = {
        up: { y: d },
        down: { y: -d },
        left: { x: d },
        right: { x: -d },
        scale: { scale: reduce ? 1 : 0.94 },
        none: {},
    };

    const variants: Variants = {
        hidden: { opacity: 0, ...offsets[direcao] },
        show: {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            transition: { duration: reduce ? 0.18 : duracao, ease: EASE_OUT_EXPO, delay: reduce ? 0 : delay },
        },
    };

    return (
        <motion.div
            className={className}
            variants={variants}
            initial="hidden"
            whileInView="show"
            /* Margem negativa embaixo: não dispara com o elemento ainda colado na borda. */
            viewport={{ once: true, amount, margin: "0px 0px -10% 0px" }}
        >
            {children}
        </motion.div>
    );
}

/**
 * Headline que sobe de dentro de uma máscara, palavra a palavra.
 * Use uma vez por página: duas na mesma tela matam o impacto.
 */
export function HeadlineCinetica({
    linhas,
    className,
    style,
    delay = 0.12,
    aoEntrarEmCena = false,
    as: Tag = "h1",
    quebraNatural = false,
}: {
    linhas: string[];
    className?: string;
    style?: CSSProperties;
    delay?: number;
    aoEntrarEmCena?: boolean;
    as?: "h1" | "h2" | "p";
    /** Deixa o texto quebrar sozinho onde não couber, em vez de forçar uma linha
        por entrada. Use quando as quebras não são decisão de composição. */
    quebraNatural?: boolean;
}) {
    const { reduce, stagger, dur } = useSwMotion();
    const MotionTag = motion[Tag];

    const container: Variants = {
        hidden: {},
        show: { transition: { delayChildren: delay, staggerChildren: stagger(STAGGER.line) } },
    };

    /* Sobe da máscara com um skew que "limpa" na chegada: o toque de velocidade. */
    const pedaco: Variants = {
        hidden: { y: reduce ? 0 : "118%", opacity: reduce ? 0 : 1, skewY: reduce ? 0 : 7 },
        show: { y: 0, opacity: 1, skewY: 0, transition: { duration: dur(DUR.hero), ease: EASE_OUT_EXPO } },
    };

    return (
        <MotionTag
            className={className}
            style={style}
            variants={container}
            initial="hidden"
            {...(aoEntrarEmCena ? { whileInView: "show", viewport: { once: true, amount: 0.4 } } : { animate: "show" })}
        >
            {linhas.map((linha, i) => (
                /* O padding da máscara é calculado, não chutado: em caixa alta pt-BR a
                   Boldonse ocupa 2.019em (topo do Í em 1.561em, fundo do Ç em -0.458em).
                   Com leading 1, o glifo transborda ~0.51em para cada lado da caixa de
                   linha, e é isso que pt/pb cobrem. A margem negativa devolve o aperto
                   de pôster entre as linhas. */
                <span
                    key={`${linha}-${i}`}
                    className={cx("block overflow-hidden pt-[0.56em] pb-[0.46em]", i > 0 && "-mt-[0.74em]")}
                >
                    <motion.span
                        variants={pedaco}
                        className={cx(
                            "sw-display sw-display-integral block will-change-transform",
                            /* Sem `text-box`, a Boldonse transborda muito a caixa de
                               linha: entrelinha abaixo de ~1.45 faz as linhas quebradas
                               se sobreporem. Medido na tela, não calculado. */
                            quebraNatural ? "leading-[1.45]" : "leading-[1] whitespace-nowrap",
                        )}
                    >
                        {linha}
                    </motion.span>
                </span>
            ))}
        </MotionTag>
    );
}

/**
 * Faixa infinita. Animação em CSS: roda no compositor e não disputa com o scroll.
 *
 * `textoAcessivel` existe porque a faixa inteira é `aria-hidden`: quando ela
 * carrega informação que não aparece em outro lugar, a frase vai uma vez só para
 * o leitor de tela em vez de repetida doze vezes.
 */
export function Marquee({
    children,
    velocidade = 18,
    direcao = "left",
    className,
    style,
    textoAcessivel,
}: {
    children: ReactNode;
    velocidade?: number;
    direcao?: "left" | "right";
    className?: string;
    style?: CSSProperties;
    textoAcessivel?: string;
}) {
    return (
        <div className={cx("relative flex overflow-hidden", className)} style={style}>
            {textoAcessivel ? <span className="sr-only">{textoAcessivel}</span> : null}
            <div
                className="sw-marquee-track"
                style={
                    {
                        "--sw-marquee-speed": `${velocidade}s`,
                        "--sw-marquee-dir": direcao === "right" ? "reverse" : "normal",
                    } as CSSProperties
                }
            >
                {/* O track carrega 200% do conteúdo: ao chegar em -50% a segunda cópia
                    está exatamente onde a primeira começou, então o loop não tem costura. */}
                <div aria-hidden="true" className="flex shrink-0 items-center">
                    {children}
                </div>
                <div aria-hidden="true" className="flex shrink-0 items-center">
                    {children}
                </div>
            </div>
        </div>
    );
}

/**
 * Entrada escalonada de grade, para listas curtas.
 * `amount: "some"` é obrigatório aqui: com um limiar percentual, um container
 * alto só dispararia depois de muito scroll e a lista ficaria visivelmente
 * vazia abaixo do título. Para listas longas use `ItemRevelado`, que anima
 * cada item quando ele próprio entra em cena.
 */
export function GradeEscalonada({ children, className }: { children: ReactNode; className?: string }) {
    const { stagger } = useSwMotion();
    return (
        <motion.div
            className={className}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: "some" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: stagger(STAGGER.grid) } } }}
        >
            {children}
        </motion.div>
    );
}

/** Item de lista longa: anima sozinho, quando ele entra em cena. */
export function ItemRevelado({ children, className }: { children: ReactNode; className?: string }) {
    const { reduce } = useSwMotion();
    return (
        <motion.div
            className={className}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: reduce ? 0.18 : DUR.enter, ease: EASE_OUT_EXPO }}
        >
            {children}
        </motion.div>
    );
}

export const itemDaGrade: Variants = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: DUR.enter, ease: EASE_OUT_EXPO } },
};
