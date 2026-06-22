import { useEffect, useState } from "react";
import { hslToHex, rgbToHsl } from "../../components/gradient-families";

/**
 * Extrai do banner um esquema de duas cores VÍVIDAS e de matiz distinto:
 *  - primary: cor dominante (mais frequente × saturação²)
 *  - accent:  cor de destaque (matiz mais diferente da dominante)
 *  - base:    versão escura da dominante (fundo legível para texto branco)
 *
 * Agrupa por faixas de matiz (não por frequência bruta) e limpa saturação/luz,
 * para pegar a cor de DESTAQUE real — não um tom morto médio.
 */
export interface ImagePalette {
    primary: string;
    accent: string;
    base: string;
}

const hueDiff = (a: number, b: number) => {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
};

/** Cor limpa (saturada e com luz controlada) a partir de RGB médio. */
const clean = (r: number, g: number, b: number, light: number) => {
    const [h, s] = rgbToHsl(r, g, b);
    return hslToHex(h, Math.min(0.95, Math.max(0.55, s)), light);
};

export function useImagePalette(src: string, enabled: boolean): ImagePalette | null {
    const [palette, setPalette] = useState<ImagePalette | null>(null);

    useEffect(() => {
        if (!enabled || !src) {
            setPalette(null);
            return;
        }
        let alive = true;
        // Imagens remotas (ex.: CDN sem CORS) são roteadas por um proxy que
        // adiciona os headers CORS, permitindo ler os pixels no canvas.
        const isRemote = /^https?:\/\//i.test(src) && (typeof window === "undefined" || !src.startsWith(window.location.origin));
        const sampleSrc = isRemote
            ? `https://images.weserv.nl/?url=${encodeURIComponent(src.replace(/^https?:\/\//i, ""))}&w=160&h=160&fit=cover`
            : src;

        const img = new Image();
        img.crossOrigin = "anonymous"; // permite ler imagens com CORS
        img.onload = () => {
            try {
                const N = 72;
                const canvas = document.createElement("canvas");
                canvas.width = N;
                canvas.height = N;
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, N, N);
                const { data } = ctx.getImageData(0, 0, N, N);

                // Acumula por faixa de matiz (24 bins), ponderado por saturação².
                const BINS = 24;
                const bins = Array.from({ length: BINS }, () => ({ r: 0, g: 0, b: 0, w: 0 }));
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] < 128) continue;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const [h, s, l] = rgbToHsl(r, g, b);
                    if (l > 0.92 || l < 0.08 || s < 0.2) continue; // ignora branco/preto/cinza
                    const idx = Math.min(BINS - 1, Math.floor((h / 360) * BINS));
                    const w = s * s + 0.05;
                    const bin = bins[idx];
                    bin.r += r * w;
                    bin.g += g * w;
                    bin.b += b * w;
                    bin.w += w;
                }

                const cands = bins
                    .filter((b) => b.w > 0)
                    .map((b) => {
                        const r = b.r / b.w;
                        const g = b.g / b.w;
                        const bl = b.b / b.w;
                        return { r, g, b: bl, score: b.w, hue: rgbToHsl(r, g, bl)[0] };
                    })
                    .sort((a, b) => b.score - a.score);

                if (!cands.length || !alive) return;

                const primary = cands[0];
                // Destaque: matiz mais distante da dominante (≥ 40°); senão complementar.
                const accent = cands.find((c) => hueDiff(c.hue, primary.hue) >= 40);
                const [ph, ps] = rgbToHsl(primary.r, primary.g, primary.b);

                setPalette({
                    primary: clean(primary.r, primary.g, primary.b, 0.55),
                    accent: accent ? clean(accent.r, accent.g, accent.b, 0.62) : hslToHex(ph + 150, 0.85, 0.62),
                    base: hslToHex(ph, Math.min(0.85, Math.max(0.45, ps)), 0.16),
                });
            } catch {
                /* imagem com taint/CORS — mantém fallback */
            }
        };
        img.src = sampleSrc;
        return () => {
            alive = false;
        };
    }, [src, enabled]);

    return palette;
}
