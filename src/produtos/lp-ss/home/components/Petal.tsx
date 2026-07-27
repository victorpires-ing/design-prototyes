import { type CSSProperties } from "react";
import { cx } from "@/utils/cx";

type Canto = "tl" | "tr" | "br" | "bl";

const RAIO: Record<Canto, string> = {
    bl: "60% 60% 60% 12px",
    tl: "12px 60% 60% 60%",
    tr: "60% 12px 60% 60%",
    br: "60% 60% 12px 60%",
};

interface PetalProps {
    /** Cor de preenchimento (hex da paleta da marca). */
    cor: string;
    /** Qual canto fica "vivo" (pontudo) — os outros três ficam bem arredondados. */
    cantoVivo?: Canto;
    /** Opacidade (0-1) — usada para as pétalas "faint" de fundo dos cards. */
    opacidade?: number;
    /** Ativa a animação de flutuação suave. */
    flutuar?: boolean;
    /** Rotação de base (graus) usada como ponto de partida da animação de flutuação. */
    rotacao?: number;
    /** Duração da animação de flutuação, em segundos. */
    duracao?: number;
    className?: string;
    style?: CSSProperties;
}

/** Pétala decorativa — forma orgânica de 3 cantos arredondados + 1 canto vivo, motivo central da marca São Silvestre 101.
 *  Requer que a keyframe `ss-float` esteja definida na página (ver <style> em Home.tsx). */
export const Petal = ({ cor, cantoVivo = "bl", opacidade = 1, flutuar, rotacao = 0, duracao = 7, className, style }: PetalProps) => (
    <div
        className={cx("pointer-events-none", className)}
        style={{
            backgroundColor: cor,
            borderRadius: RAIO[cantoVivo],
            opacity: opacidade,
            animation: flutuar ? `ss-float ${duracao}s ease-in-out infinite` : undefined,
            ["--ss-r" as string]: `${rotacao}deg`,
            ...style,
        }}
        aria-hidden="true"
    />
);
