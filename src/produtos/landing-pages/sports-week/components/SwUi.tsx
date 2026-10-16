import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion } from "motion/react";
import { cx } from "@/utils/cx";
import { DUR, EASE_OUT_EXPO, SPRING_POP, T_SNAP } from "../utils/motion-tokens";
import { useSwMotion } from "../utils/use-sw-motion";
import { alturaDeLinha } from "../utils/formato";
import { Asterisco } from "./SwBrand";

/* Kit de interface da campanha. Sombra dura em vez de blur: é a estética de
   pôster da identidade, e sombra sólida não força repaint quando o card se move. */

type Variante = "neon" | "contorno" | "escuro";

type Tamanho = "sm" | "md" | "lg";

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variante?: Variante;
    tamanho?: Tamanho;
    carregando?: boolean;
    larguraTotal?: boolean;
}

/* A sombra sólida acompanha o botão por CLASSE, não por motion: transição de
   box-shadow num botão isolado é barata; animar box-shadow por frame, não.
   Boldonse não entra em botão em tamanho nenhum. */
export function SwBotao({
    children,
    variante = "neon",
    tamanho = "md",
    carregando,
    larguraTotal,
    className,
    ...props
}: BotaoProps) {
    const { reduce } = useSwMotion();

    const porVariante: Record<Variante, string> = {
        neon: "bg-[var(--sw-lime)] text-[var(--sw-navy)] shadow-[4px_4px_0_0_var(--sw-magenta)] hover:shadow-[6px_6px_0_0_var(--sw-magenta)] active:shadow-none",
        contorno: "border-2 border-[var(--sw-lime)] text-[var(--sw-lime)] hover:bg-[var(--sw-lime)] hover:text-[var(--sw-navy)]",
        escuro: "bg-[var(--sw-navy)] text-[var(--sw-white)]",
    };

    const porTamanho: Record<Tamanho, string> = {
        sm: "min-h-11 px-5 py-2.5 text-base",
        md: "px-6 py-3.5 text-base",
        lg: "min-h-14 px-8 py-4 text-lg",
    };

    return (
        <motion.button
            type="button"
            whileTap={reduce ? undefined : { scale: 0.97 }}
            transition={T_SNAP}
            className={cx(
                "sw-ui relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-extrabold tracking-[-0.01em] transition duration-100 ease-linear disabled:opacity-50",
                "hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1",
                "motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0",
                porTamanho[tamanho],
                porVariante[variante],
                larguraTotal && "w-full",
                className,
            )}
            disabled={carregando || props.disabled}
            {...(props as object)}
        >
            {carregando ? (
                <motion.span
                    className="inline-flex"
                    animate={reduce ? undefined : { rotate: 360 }}
                    transition={{ duration: 1.1, ease: "linear", repeat: Infinity }}
                >
                    <Asterisco className="size-5" />
                </motion.span>
            ) : null}
            {children}
        </motion.button>
    );
}

export function SwChip({
    children,
    ativo,
    onClick,
    className,
}: {
    children: ReactNode;
    ativo?: boolean;
    onClick?: () => void;
    className?: string;
}) {
    const { reduce } = useSwMotion();
    return (
        <motion.button
            type="button"
            onClick={onClick}
            whileTap={reduce ? undefined : { scale: 0.94 }}
            transition={SPRING_POP}
            aria-pressed={ativo}
            className={cx(
                "sw-ui shrink-0 cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-bold whitespace-nowrap transition duration-100 ease-linear @5xl/sw:py-2.5 @5xl/sw:text-base",
                ativo
                    ? "border-[var(--sw-lime)] bg-[var(--sw-lime)] text-[var(--sw-navy)]"
                    : "border-[var(--sw-line-strong)] text-[var(--sw-muted)] hover:border-[var(--sw-lime)]/60 hover:text-[var(--sw-white)]",
                className,
            )}
        >
            {children}
        </motion.button>
    );
}

/** Rótulo estático, sem comportamento de botão. */
export function SwTag({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
    return (
        <span
            className={cx(
                "sw-ui inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold whitespace-nowrap @5xl/sw:px-3 @5xl/sw:py-1.5",
                className,
            )}
            style={style}
        >
            {children}
        </span>
    );
}

export function TituloDeSecao({
    titulo,
    apoio,
    className,
    cor = "var(--sw-white)",
    layout = "empilhado",
}: {
    titulo: string;
    apoio?: string;
    className?: string;
    cor?: string;
    layout?: "empilhado" | "ladoALado";
}) {
    /* Sem `px-*` aqui: a goteira é do SwContainer. São nove chamadas, e qualquer
       padding próprio brigaria com o trilho em todas elas. */
    return (
        <div
            className={cx(
                layout === "ladoALado" && "@5xl/sw:flex @5xl/sw:items-end @5xl/sw:justify-between @5xl/sw:gap-12",
                className,
            )}
        >
            <h2 className="sw-display text-[length:var(--sw-fs-d1)]" style={{ color: cor, lineHeight: alturaDeLinha(titulo) }}>
                {titulo}
            </h2>
            {apoio ? (
                <p
                    className={cx(
                        "mt-2 max-w-[46ch] text-[length:var(--sw-fs-corpo)] leading-[1.55]",
                        layout === "ladoALado" && "@5xl/sw:mt-0 @5xl/sw:max-w-[38ch] @5xl/sw:text-right",
                    )}
                    style={{ color: "var(--sw-muted)" }}
                >
                    {apoio}
                </p>
            ) : null}
        </div>
    );
}

/** Acordeão de uma pergunta. Usa grid-rows para animar altura sem medir nada. */
export function Acordeao({ pergunta, resposta }: { pergunta: string; resposta: string }) {
    const [aberto, setAberto] = useState(false);

    return (
        <div className="relative border-b" style={{ borderColor: "var(--sw-line)" }}>
            <span
                aria-hidden="true"
                className={cx(
                    "absolute inset-x-0 bottom-0 h-0.5 origin-left transition-transform duration-200 ease-out",
                    aberto ? "scale-x-100" : "scale-x-0",
                )}
                style={{ backgroundColor: "var(--sw-lime)" }}
            />
            <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}
                className="sw-ui group flex w-full cursor-pointer items-start justify-between gap-4 py-5 text-left text-base font-bold text-[var(--sw-white)]/85 transition-colors duration-100 hover:text-[var(--sw-white)] @5xl/sw:py-7 @5xl/sw:text-[19px]"
            >
                {pergunta}
                <motion.span
                    aria-hidden="true"
                    animate={{ rotate: aberto ? 135 : 0 }}
                    transition={{ duration: DUR.base, ease: EASE_OUT_EXPO }}
                    className="mt-0.5 shrink-0 text-xl leading-none"
                    style={{ color: "var(--sw-lime)" }}
                >
                    +
                </motion.span>
            </button>
            <div
                className="grid transition-[grid-template-rows] duration-300 ease-out"
                style={{ gridTemplateRows: aberto ? "1fr" : "0fr" }}
            >
                <div className="overflow-hidden">
                    <p className="max-w-[64ch] pb-5 text-[length:var(--sw-fs-corpo)] leading-[1.6]" style={{ color: "var(--sw-muted)" }}>
                        {resposta}
                    </p>
                </div>
            </div>
        </div>
    );
}
