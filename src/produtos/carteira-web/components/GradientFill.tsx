import { cx } from "@/utils/cx";

/**
 * Renderiza um degradê como <img> com data-URI SVG (não CSS background nem SVG
 * com id dinâmico). É a forma mais export-safe: ferramentas HTML→Figma tratam
 * <img> como preenchimento de imagem. Preenche o pai (que deve ter tamanho +
 * overflow-hidden + bordas).
 */
export function GradientFill({ gradient, className = "size-full" }: { gradient: string; className?: string }) {
    const matches = gradient.match(/#[0-9a-fA-F]{3,8}(?:\s+\d+%)?/g) ?? ["#9ca3af", "#4b5563"];
    const stops = matches
        .map((m, i, arr) => {
            const [cor, off] = m.trim().split(/\s+/);
            const offset = off ?? `${(i / Math.max(1, arr.length - 1)) * 100}%`;
            return `<stop offset="${offset}" stop-color="${cor}"/>`;
        })
        .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs><rect width="100" height="100" fill="url(#g)"/></svg>`;
    const src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    return <img src={src} alt="" aria-hidden="true" className={cx("block object-cover", className)} />;
}
