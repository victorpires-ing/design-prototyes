import type { ReactNode } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { cx } from "@/utils/cx";

/**
 * Ícone exportado do Figma. O SVG já vem com width/height do desenho, então ele fica
 * centralizado dentro da moldura (`tamanho`) igual à instância no Figma.
 */
export function Icone({ src, tamanho, className, imgClassName }: { src: string; tamanho: number; className?: string; imgClassName?: string }) {
    return (
        <span aria-hidden="true" className={cx("inline-flex shrink-0 items-center justify-center", className)} style={{ width: tamanho, height: tamanho }}>
            <img src={src} alt="" className={cx("block max-w-none", imgClassName)} />
        </span>
    );
}

/** Linha divisória 1px (Colors/Border/border-secondary). */
export const Divisor = ({ className }: { className?: string }) => <div className={cx("h-px w-full shrink-0 bg-(--ck-border-secondary)", className)} />;

/** "Divisor" do resumo: linha de altura 0 no Figma, com o traço de 1px desenhado logo acima. */
export const DivisorLinha = () => (
    <div className="relative h-0 w-full shrink-0">
        <span className="absolute inset-x-0 -top-px h-px bg-(--ck-border-secondary)" />
    </div>
);

type Variante = "primario" | "secundario";
type Tamanho = "lg" | "sm" | "sm-largo";

const variantes: Record<Variante, string> = {
    // Buttons/Button · Primary — bg-brand-solid + borda interna 2px branca 12%
    primario: "ck-botao-primario bg-(--ck-bg-brand-solid) text-white hover:brightness-95",
    // Buttons/Button · Secondary — bg-primary + borda interna border-primary
    secundario: "ck-botao-secundario bg-(--ck-bg-primary) text-(--ck-text-secondary) hover:bg-(--ck-neutral-50)",
};

const tamanhos: Record<Tamanho, string> = {
    // lg: px 16 · py 10 · gap 6 · Text md/Semibold
    lg: "gap-1.5 px-4 py-2.5 text-[16px] leading-6",
    // sm (desktop, "Ingresso sem proteção"): px 10 · py 6 · gap 4 · Text sm/Semibold
    sm: "gap-1 px-2.5 py-1.5 text-[14px] leading-5",
    // sm no mobile: px 12 · py 8 · gap 4
    "sm-largo": "gap-1 px-3 py-2 text-[14px] leading-5",
};

interface BotaoProps extends Omit<AriaButtonProps, "className" | "children"> {
    variante: Variante;
    tamanho?: Tamanho;
    icone?: ReactNode;
    className?: string;
    children: ReactNode;
}

/** Botão do AFTER DS com as cores do Figma do checkout (Shadows/shadow-xs-skeuomorphic). */
export function Botao({ variante, tamanho = "lg", icone, className, children, ...props }: BotaoProps) {
    return (
        <AriaButton
            {...props}
            className={cx(
                "relative inline-flex cursor-pointer items-center justify-center overflow-clip rounded-lg font-semibold whitespace-nowrap outline-offset-2 transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-(--ck-bg-brand-solid)",
                variantes[variante],
                tamanhos[tamanho],
                className,
            )}
        >
            {icone}
            <span className="px-0.5">{children}</span>
        </AriaButton>
    );
}

/** Link de texto (Buttons/Button · Link color): Text sm/Semibold, text-brand-secondary. */
export function LinkTexto({ children, className, ...props }: Omit<AriaButtonProps, "className" | "children"> & { className?: string; children: ReactNode }) {
    return (
        <AriaButton
            {...props}
            className={cx(
                "inline-flex cursor-pointer items-center gap-1 text-[14px] leading-5 font-semibold text-(--ck-text-brand-secondary) outline-offset-2 transition duration-100 ease-linear hover:underline focus-visible:outline-2 focus-visible:outline-(--ck-bg-brand-solid)",
                className,
            )}
        >
            {children}
        </AriaButton>
    );
}
