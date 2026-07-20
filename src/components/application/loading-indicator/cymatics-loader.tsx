import { useEffect, useRef, type RefObject } from "react";
import { cx } from "@/utils/cx";

/**
 * Cymatics loader — inspired by Chladni figures of the new Ingresse visual identity.
 *
 * Particles do a random walk whose amplitude is proportional to the local vibration
 * of a standing wave. Where the wave is ~0 (nodal lines) they barely move and pile up,
 * drawing the pattern. Morphing the frequency params (m, n) over time makes the figure
 * flow continuously — a natural, on-brand loading motion.
 *
 * Closed-form Chladni solution (x, y ∈ [0,1], result ∈ [-1,1]):
 *   f(x,y) = a·sin(πn·x)·sin(πm·y) + b·sin(πm·x)·sin(πn·y)
 */
const chladni = (x: number, y: number, a: number, b: number, m: number, n: number) =>
    a * Math.sin(Math.PI * n * x) * Math.sin(Math.PI * m * y) + b * Math.sin(Math.PI * m * x) * Math.sin(Math.PI * n * y);

/** Coarser figures — legible at small sizes. */
const PATTERNS_SIMPLE: [number, number][] = [
    [1, 2],
    [2, 3],
    [3, 2],
    [1, 4],
    [4, 1],
    [2, 4],
    [3, 4],
];

/** Richer, denser figures — for large / fullscreen surfaces. */
const PATTERNS_RICH: [number, number][] = [
    [3, 4],
    [4, 5],
    [5, 6],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 8],
    [6, 7],
];

interface ChladniOptions {
    /** Number of particles. Scales with the surface size. */
    count: number;
    /** Frequency pairs the figure morphs between. */
    patterns: [number, number][];
    /** Dot size in CSS px. */
    dot: number;
}

/** Runs the Chladni simulation on a canvas for the lifetime of the mounted element. */
function useChladni(canvasRef: RefObject<HTMLCanvasElement | null>, { count, patterns, dot }: ChladniOptions) {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Resolve the brand color straight from the DS token (theme-aware at mount).
        const color = getComputedStyle(canvas).color || "#ff271a";
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let w = canvas.clientWidth || 64;
        let h = canvas.clientHeight || 64;
        const resize = () => {
            w = canvas.clientWidth || w;
            h = canvas.clientHeight || h;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();

        const xs = new Float32Array(count);
        const ys = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            xs[i] = Math.random();
            ys[i] = Math.random();
        }

        const a = 1;
        const b = 1;
        const v = 0.025; // vibration strength
        const minWalk = 0.0015; // baseline jitter so particles never fully freeze

        const pick = (curM: number, curN: number): [number, number] => {
            for (let tries = 0; tries < 8; tries++) {
                const [pm, pn] = patterns[Math.floor(Math.random() * patterns.length)];
                if (pm !== curM || pn !== curN) return [pm, pn];
            }
            return patterns[0];
        };

        let [mT, nT] = pick(0, 0);
        let m = mT;
        let n = nT;

        const stepParticles = () => {
            for (let i = 0; i < count; i++) {
                const eq = chladni(xs[i], ys[i], a, b, m, n);
                let amp = v * Math.abs(eq);
                if (amp < minWalk) amp = minWalk;

                let nx = xs[i] + (Math.random() * 2 - 1) * amp;
                let ny = ys[i] + (Math.random() * 2 - 1) * amp;
                if (nx < 0) nx = 0;
                else if (nx > 1) nx = 1;
                if (ny < 0) ny = 0;
                else if (ny > 1) ny = 1;
                xs[i] = nx;
                ys[i] = ny;
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.85;
            for (let i = 0; i < count; i++) {
                ctx.fillRect(xs[i] * w, ys[i] * h, dot, dot);
            }
            ctx.globalAlpha = 1;
        };

        // Reduced motion: settle into a single static figure, no animation loop.
        if (reduce) {
            for (let s = 0; s < 600; s++) stepParticles();
            draw();
            return;
        }

        let dwell = 0;
        const DWELL = 12; // frames to hold a formed figure before morphing to the next
        let raf = 0;

        const loop = () => {
            const settled = Math.abs(mT - m) < 0.02 && Math.abs(nT - n) < 0.02;
            if (settled) {
                dwell++;
                if (dwell > DWELL) {
                    [mT, nT] = pick(mT, nT);
                    dwell = 0;
                }
            }
            m += (mT - m) * 0.05;
            n += (nT - n) * 0.05;

            stepParticles();
            draw();
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);

        const ro = new ResizeObserver(() => resize());
        ro.observe(canvas);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, [canvasRef, count, patterns, dot]);
}

const SIZES = {
    sm: { box: "size-10", count: 900, dot: 1, patterns: PATTERNS_SIMPLE },
    md: { box: "size-16", count: 2000, dot: 1, patterns: PATTERNS_SIMPLE },
    lg: { box: "size-24", count: 4200, dot: 1.15, patterns: PATTERNS_RICH },
    xl: { box: "size-36", count: 7000, dot: 1.25, patterns: PATTERNS_RICH },
} as const;

interface CymaticsLoaderProps {
    /** @default 'md' */
    size?: keyof typeof SIZES;
    /** Optional text shown below the figure. */
    label?: string;
    className?: string;
}

/** Inline cymatics loader — drop-in replacement for a spinner, in four sizes. */
export const CymaticsLoader = ({ size = "md", label, className }: CymaticsLoaderProps) => {
    const cfg = SIZES[size];
    const ref = useRef<HTMLCanvasElement>(null);
    useChladni(ref, { count: cfg.count, dot: cfg.dot, patterns: cfg.patterns });

    return (
        <div className={cx("flex flex-col items-center justify-center gap-4", className)} role="status" aria-live="polite" aria-label={label ?? "Carregando"}>
            <canvas ref={ref} aria-hidden="true" className={cx("text-fg-brand-primary", cfg.box)} />
            {label && <span className="text-sm font-medium text-secondary">{label}</span>}
        </div>
    );
};

interface CymaticsFillProps {
    /** Particle count — raise for larger surfaces. @default 7000 */
    count?: number;
    /** Dot size in CSS px. @default 1.25 */
    dot?: number;
    /** Frequency pairs the figure morphs between. @default PATTERNS_RICH */
    patterns?: [number, number][];
    className?: string;
}

/**
 * Cymatics that fills its parent box (any aspect ratio). Give the parent a defined size
 * (e.g. `relative` + a min-height) and drop this in as `absolute inset-0`.
 */
export const CymaticsFill = ({ count = 7000, dot = 1.25, patterns = PATTERNS_RICH, className }: CymaticsFillProps) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useChladni(ref, { count, dot, patterns });
    return <canvas ref={ref} aria-hidden="true" className={cx("size-full text-fg-brand-primary", className)} />;
};

/** Canvas tuned for a large, immersive surface. */
const FullscreenFigure = () => {
    const ref = useRef<HTMLCanvasElement>(null);
    useChladni(ref, { count: 11000, dot: 1.25, patterns: PATTERNS_RICH });
    return <canvas ref={ref} aria-hidden="true" className="size-64 text-fg-brand-primary sm:size-80" />;
};

interface CymaticsLoaderFullscreenProps {
    /** @default 'Carregando…' */
    label?: string;
    /** @default true */
    isOpen?: boolean;
}

/** Full-viewport cymatics loading screen (splash / route transition). */
export const CymaticsLoaderFullscreen = ({ label = "Carregando…", isOpen = true }: CymaticsLoaderFullscreenProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-primary" role="status" aria-live="polite" aria-label={label}>
            <FullscreenFigure />
            {label && <span className="text-md font-medium text-secondary">{label}</span>}
        </div>
    );
};
