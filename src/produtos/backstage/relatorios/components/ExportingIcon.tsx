import { useEffect, useRef } from "react";
import { cx } from "@/utils/cx";

/**
 * Ícone de loading do botão "Exportando...": um círculo com ondas animadas dentro,
 * como no frame de referência do Figma (node 19372:522). Um único termo de onda
 * estacionária simples — Z(x,y) = sin(mπx)·sin(nπy), com m,n baixos (1–2) — renderizado
 * como um gradiente suave e contínuo (sem linhas nodais finas), para não virar ruído
 * num ícone tão pequeno (20px).
 */

const MODE_PAIRS: Array<[number, number]> = [
    [1, 1],
    [1, 2],
    [2, 1],
];
const SEGMENT_DURATION_MS = 900;
const GRID_SIZE = 24;

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function ExportingIcon({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const size = GRID_SIZE * dpr;
        canvas.width = size;
        canvas.height = size;
        const imageData = ctx.createImageData(size, size);

        let raf = 0;
        const start = performance.now();

        const render = () => {
            const elapsed = performance.now() - start;
            const segmentIndex = Math.floor(elapsed / SEGMENT_DURATION_MS) % MODE_PAIRS.length;
            const nextIndex = (segmentIndex + 1) % MODE_PAIRS.length;
            const t = smoothstep((elapsed % SEGMENT_DURATION_MS) / SEGMENT_DURATION_MS);
            const [m0, n0] = MODE_PAIRS[segmentIndex];
            const [m1, n1] = MODE_PAIRS[nextIndex];
            const m = lerp(m0, m1, t);
            const n = lerp(n0, n1, t);

            const data = imageData.data;
            for (let j = 0; j < size; j++) {
                const y = (j / (size - 1)) * 2 - 1;
                for (let i = 0; i < size; i++) {
                    const x = (i / (size - 1)) * 2 - 1;
                    const value = Math.sin(m * Math.PI * x) * Math.sin(n * Math.PI * y);
                    // Gradiente suave e contínuo (0..1) — sem limiar/linha, então não há
                    // detalhe fino para "serrilhar" num ícone de 20px.
                    const alpha = 0.18 + (value * 0.5 + 0.5) * 0.72;
                    const o = (j * size + i) * 4;
                    data[o] = 255;
                    data[o + 1] = 255;
                    data[o + 2] = 255;
                    data[o + 3] = Math.round(alpha * 255);
                }
            }
            ctx.putImageData(imageData, 0, 0);

            raf = requestAnimationFrame(render);
        };

        raf = requestAnimationFrame(render);
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className={cx(className, "relative overflow-hidden rounded-full bg-white/20")} aria-hidden="true">
            <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
        </div>
    );
}
