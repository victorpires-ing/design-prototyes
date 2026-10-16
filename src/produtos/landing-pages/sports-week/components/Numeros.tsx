import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useInView, useMotionValue, useSpring, useTransform } from "motion/react";
import { cx } from "@/utils/cx";
import { DUR, EASE_OUT_EXPO, SPRING_COUNTER } from "../utils/motion-tokens";
import { useSwMotion } from "../utils/use-sw-motion";
import { dd, legendaCountdown, useCountdown, type Restante } from "../utils/use-countdown";

/* Números que se movem: contador que sobe e relógio com dígitos que viram. */

/**
 * Contador que sobe ao entrar em cena.
 * O valor é lido como MotionValue direto no DOM, sem passar pelo React: zero
 * re-render por frame.
 */
export function Contador({
    valor,
    prefixo = "",
    sufixo = "",
    className,
}: {
    valor: number;
    prefixo?: string;
    sufixo?: string;
    className?: string;
}) {
    const { reduce } = useSwMotion();
    const ref = useRef<HTMLSpanElement>(null);
    const emCena = useInView(ref, { once: true, amount: 0.6 });

    const bruto = useMotionValue(0);
    const suave = useSpring(bruto, SPRING_COUNTER);
    const texto = useTransform(suave, (v) => `${prefixo}${Math.round(v).toLocaleString("pt-BR")}${sufixo}`);

    useEffect(() => {
        if (!emCena) return;
        if (reduce) {
            bruto.jump(valor);
            suave.jump(valor);
            return;
        }
        bruto.set(valor);
    }, [emCena, valor, reduce, bruto, suave]);

    return (
        <span ref={ref} className={className}>
            <motion.span aria-hidden="true">{texto}</motion.span>
            {/* O leitor de tela recebe o número final, não a contagem. */}
            <span className="sr-only">{`${prefixo}${valor.toLocaleString("pt-BR")}${sufixo}`}</span>
        </span>
    );
}

function Digito({ valor }: { valor: string }) {
    const { reduce } = useSwMotion();

    return (
        <span className="relative inline-block h-[1.15em] w-[0.86em] overflow-hidden align-baseline">
            <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                    key={valor}
                    className="absolute inset-0 flex items-center justify-center"
                    initial={reduce ? { opacity: 0 } : { y: "-100%" }}
                    animate={reduce ? { opacity: 1 } : { y: "0%" }}
                    exit={reduce ? { opacity: 0 } : { y: "100%" }}
                    transition={{ duration: reduce ? 0.12 : DUR.base, ease: EASE_OUT_EXPO }}
                >
                    {valor}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}

function Grupo({ valor, rotulo, coluna }: { valor: number; rotulo: string; coluna?: boolean }) {
    const texto = dd(valor);
    return (
        <div className={cx("flex flex-col items-center", coluna && "@5xl/sw:w-full @5xl/sw:flex-row @5xl/sw:items-baseline @5xl/sw:gap-3")}>
            <span
                className="sw-display flex text-[length:var(--sw-fs-cd)] leading-none"
                style={{ color: "var(--sw-lime)", letterSpacing: "-0.02em" }}
            >
                {/* Uma key por dígito: uma key só para o bloco remontaria tudo a cada segundo. */}
                <Digito valor={texto[0]} />
                <Digito valor={texto[1]} />
            </span>
            <span
                className={cx("sw-ui text-sm font-bold uppercase", coluna ? "mt-2 @5xl/sw:mt-0" : "mt-2")}
                style={{ color: "var(--sw-subtle)", letterSpacing: "0.1em" }}
            >
                {rotulo}
            </span>
        </div>
    );
}

export function Countdown({
    alvo,
    className,
    style,
    orientacao = "linha",
}: {
    alvo: number;
    className?: string;
    style?: React.CSSProperties;
    /* No desktop o relógio vira coluna ao lado da headline: em linha ele ficaria
       perdido numa faixa de 1100px. */
    orientacao?: "linha" | "coluna";
}) {
    const restante: Restante = useCountdown(alvo);
    const legenda = legendaCountdown(restante);

    if (restante.encerrado) {
        return (
            <div className={className} style={style}>
                <p className="sw-ui text-sm font-extrabold uppercase" style={{ color: "var(--sw-magenta)", letterSpacing: "0.14em" }}>
                    {legenda}
                </p>
                <p className="mt-2 text-base" style={{ color: "var(--sw-muted)" }}>
                    A campanha acabou. Os eventos voltaram para o valor do lote vigente.
                </p>
            </div>
        );
    }

    return (
        <div className={className} style={style}>
            <p className="sw-ui text-sm font-extrabold uppercase" style={{ color: "var(--sw-magenta)", letterSpacing: "0.14em" }}>
                {legenda}
            </p>
            {/* aria-live off: um relógio que anuncia cada segundo trava o leitor de tela.
                O prazo é dito uma vez em texto, logo abaixo. */}
            <div
                className={cx(
                    "mt-3 flex gap-4",
                    orientacao === "coluna" ? "items-start @5xl/sw:mt-6 @5xl/sw:flex-col @5xl/sw:gap-5" : "items-start",
                )}
                aria-live="off"
            >
                {!restante.ultimoDia ? <Grupo valor={restante.dias} rotulo="dias" coluna={orientacao === "coluna"} /> : null}
                <Grupo valor={restante.horas} rotulo="horas" coluna={orientacao === "coluna"} />
                <Grupo valor={restante.minutos} rotulo="min" coluna={orientacao === "coluna"} />
                <Grupo valor={restante.segundos} rotulo="seg" coluna={orientacao === "coluna"} />
            </div>
            <p className="sr-only">A campanha termina em 30 de novembro de 2026, às 23h59.</p>
        </div>
    );
}

/** Bloco dos quatro números da campanha. */
export function BlocoDeNumeros({
    itens,
    className,
}: {
    itens: { valor: string; label: string }[];
    className?: string;
}) {
    return (
        <div
            className={cx("grid grid-cols-2 gap-px @5xl/sw:grid-cols-4", className)}
            style={{ backgroundColor: "var(--sw-line)" }}
        >
            {itens.map((item) => (
                <div
                    key={item.label}
                    className="@container/num px-5 py-6 @5xl/sw:px-6 @5xl/sw:py-12"
                    style={{ backgroundColor: "var(--sw-ink)" }}
                >
                    {/* O número se mede pela CÉLULA, não por degrau de tela. Fora do
                        sangramento a célula encolheu e "+1.200", que é o valor mais
                        largo, passava por cima do filete divisor. `min` mantém o
                        tamanho de projeto onde ele cabe e só cede onde não cabe, então
                        não existe largura de tela em que o número estoure. */}
                    <p
                        className="sw-display text-[length:min(var(--sw-fs-num),23cqi)] leading-none"
                        style={{ color: "var(--sw-lime)" }}
                    >
                        {item.valor}
                    </p>
                    <p className="mt-2 text-sm leading-snug @5xl/sw:text-[length:var(--sw-fs-corpo)]" style={{ color: "var(--sw-muted)" }}>
                        {item.label}
                    </p>
                </div>
            ))}
        </div>
    );
}
