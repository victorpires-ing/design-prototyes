import { useId } from "react";

/**
 * Renderiza um degradê como SVG inline (vetor com gradiente) em vez de CSS
 * `background: linear-gradient(...)`. Isso é export-safe: ferramentas HTML→Figma
 * capturam o SVG/gradiente, enquanto gradientes via CSS costumam sair em branco.
 * Preenche o elemento pai (que deve ter tamanho + overflow-hidden + bordas).
 */
export function GradientFill({ gradient, className = "size-full" }: { gradient: string; className?: string }) {
    const id = useId();
    const matches = gradient.match(/#[0-9a-fA-F]{3,8}(?:\s+\d+%)?/g) ?? ["#9ca3af", "#4b5563"];
    const stops = matches.map((m) => {
        const [cor, off] = m.trim().split(/\s+/);
        return { cor, off };
    });
    return (
        <svg className={className} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                    {stops.map((s, i) => (
                        <stop key={i} offset={s.off ?? `${(i / Math.max(1, stops.length - 1)) * 100}%`} stopColor={s.cor} />
                    ))}
                </linearGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${id})`} />
        </svg>
    );
}
