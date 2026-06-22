import type { CSSProperties } from "react";
import textureUrl from "../assets/bg-texture.svg";

/*
 *  Textura cimática usada como MÁSCARA: um <div> preenchido com a cor recebe
 *  o formato (com grão/displacement) do SVG. Assim a textura pode ser tingida
 *  com qualquer cor — aqui, a cor de destaque extraída do banner.
 */
export function BgTexture({ background, className, style }: { background: string; className?: string; style?: CSSProperties }) {
    return (
        <div
            aria-hidden="true"
            className={className}
            style={{
                background,
                WebkitMaskImage: `url(${textureUrl})`,
                maskImage: `url(${textureUrl})`,
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
                WebkitMaskPosition: "center top",
                maskPosition: "center top",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                ...style,
            }}
        />
    );
}
