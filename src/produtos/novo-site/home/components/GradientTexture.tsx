import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/utils/cx";
import { gradientCss, radialCss, type GradientFamily } from "../../components/gradient-families";

/*
 *  Textura de gradiente — o gradiente das famílias NUNCA aparece como fill
 *  chapado (regra do manual). Aqui ele é sempre coberto por um grão fractal,
 *  que dá a aparência de "textura" exigida pela marca.
 */

/** Grão fractal em SVG (data URI) — # escapado como %23. */
export const NOISE_URI =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

interface GradientTextureProps {
    family: GradientFamily;
    /** Ângulo do gradiente linear. */
    angle?: number;
    /** Usa gradiente radial (mancha) no lugar do linear. */
    radial?: boolean | string;
    /** Intensidade do grão (0–1). */
    grain?: number;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
}

export function GradientTexture({ family, angle = 165, radial = false, grain = 0.16, className, style, children }: GradientTextureProps) {
    const bg = radial ? radialCss(family, typeof radial === "string" ? radial : "50% 25%") : gradientCss(family, angle);
    return (
        <div className={cx("relative isolate overflow-hidden", className)} style={style}>
            {/* Camada de cor (não exposta sozinha — sempre sob o grão) */}
            <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ backgroundImage: bg }} />
            {/* Grão fractal — transforma o gradiente em textura */}
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 mix-blend-soft-light"
                style={{ backgroundImage: `url("${NOISE_URI}")`, backgroundSize: "200px 200px", opacity: grain }}
            />
            {children}
        </div>
    );
}
