import type { CSSProperties, ElementType, ReactNode } from "react";
import { cx } from "@/utils/cx";

/* REGRA DE POSSE DA GOTEIRA, e ela não é negociável:
   `SwContainer` é o ÚNICO dono de padding horizontal na campanha. Nenhuma section,
   nenhum componente e nenhum título carrega `px-*` como goteira. O que precisa
   sangrar de borda a borda não vira filho do container: vira irmão, dentro de
   `SwFaixa`. Sem essa regra escrita, a primeira seção nova reintroduz um `px-5`
   literal e o desalinhamento recomeça. */

export function SwContainer({
    children,
    className,
    as: Tag = "div",
    ...resto
}: {
    children: ReactNode;
    className?: string;
    as?: ElementType;
} & Record<string, unknown>) {
    return (
        <Tag className={cx("mx-auto w-full max-w-[var(--sw-campo)] px-[var(--sw-gutter)]", className)} {...resto}>
            {children}
        </Tag>
    );
}

/**
 * Faixa que sangra de borda a borda, com o conteúdo opcionalmente realinhado ao
 * trilho por dentro.
 *
 * O `overflow-hidden` é obrigatório: toda faixa mais larga que 100% (marquee,
 * xadrez na diagonal, bloco de cor que vaza) vive aqui dentro. É o que impede a
 * barra de rolagem horizontal permanente.
 */
export function SwFaixa({
    children,
    className,
    style,
    alinhado = false,
    as: Tag = "div",
    ...resto
}: {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    alinhado?: boolean;
    as?: ElementType;
} & Record<string, unknown>) {
    return (
        <Tag className={cx("relative w-full overflow-hidden", className)} style={style} {...resto}>
            {alinhado ? <SwContainer>{children}</SwContainer> : children}
        </Tag>
    );
}
