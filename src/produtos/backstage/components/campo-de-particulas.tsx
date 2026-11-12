import { useEffect, useRef } from "react";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

/*
 * Campo de partículas (figura de Chladni), porte do CymaticField da branch feat/event-setup-journey.
 * Compartilhado no Backstage: faixa do Guia de configuração e banner da criação de evento.
 *
 * Cada partícula dá um passo aleatório de amplitude proporcional a |f(x,y)|:
 *   f(x,y) = a·sin(πnx)·sin(πmy) + b·sin(πmx)·sin(πny)
 * Onde a placa vibra forte ela é chutada longe; na linha nodal (f ≈ 0) quase para. Com o tempo
 * todas escorrem para as linhas paradas e a figura aparece sozinha. A placa troca de modo aos
 * poucos, como um botão de frequência girando.
 *
 * Canvas 2D nativo, sem biblioteca. Respeita reduzir movimento (pinta a figura já assentada),
 * pausa com a aba fora de vista e nunca derruba a tela: qualquer falha só deixa de desenhar.
 */

interface CampoDeParticulasProps {
    className?: string;
    /** Cor das partículas (canvas não lê classe de Tailwind). */
    cor?: string;
    /** Multiplica a contagem calculada pela área. */
    densidade?: number;
    /** Aumenta as células da figura dividindo as frequências da placa. */
    escala?: number;
    /** Fração do ciclo em que a placa fica parada num modo; 0 = sempre migrando. */
    parada?: number;
}

const MAX = 24000;
const MIN = 2000;
const PX_POR_PARTICULA = 14;
const V = 0.02;
const PASSO_MINIMO = 0.002;
const MODOS: ReadonlyArray<readonly [number, number, number, number]> = [
    [3, 5, 1, 1],
    [4, 7, 1, -1],
    [2, 5, 1, 1],
    [5, 8, -1, 1],
    [3, 8, 1, 1],
    [4, 6, 1, -1],
];
const CICLO_MS = 16000;
const PARADA = 0.72;

const suavizar = (t: number) => t * t * (3 - 2 * t);
const aleatorio = (semente: number) => () => {
    semente = (semente + 0x6d2b79f5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export function CampoDeParticulas({ className, cor = "rgba(255,255,255,0.15)", densidade = 1, escala = 1, parada = PARADA }: CampoDeParticulasProps) {
    const ref = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        let ctx: CanvasRenderingContext2D;
        try {
            const c = canvas.getContext("2d");
            if (!c) return;
            ctx = c;
        } catch {
            return;
        }

        const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        const rand = aleatorio(0x9e3779b9);
        let largura = 0;
        let altura = 0;
        let proporcao = 1;
        let quadro = 0;
        let rodando = false;

        const r0 = canvas.getBoundingClientRect();
        const total = Math.round(densidade * Math.min(MAX, Math.max(MIN, Math.round((Math.max(1, r0.width) * Math.max(1, r0.height)) / PX_POR_PARTICULA))));
        const xs = new Float32Array(total);
        const ys = new Float32Array(total);
        for (let i = 0; i < total; i++) {
            xs[i] = rand();
            ys[i] = rand();
        }

        const redimensionar = () => {
            const r = canvas.getBoundingClientRect();
            largura = Math.max(1, Math.floor(r.width));
            altura = Math.max(1, Math.floor(r.height));
            proporcao = largura / altura;
            canvas.width = largura;
            canvas.height = altura;
        };

        const modoEm = (indice: number) => {
            const [m, n, a, b] = MODOS[((indice % MODOS.length) + MODOS.length) % MODOS.length];
            const d = Math.max(1, escala);
            return {
                m: Math.max(1, Math.round(m / d)),
                n: Math.max(1, Math.round(n / d)),
                a,
                b,
                mx: Math.max(1, Math.round((m * proporcao) / d)),
                nx: Math.max(1, Math.round((n * proporcao) / d)),
            };
        };
        let modo = modoEm(0);
        const definirModo = (tempo: number) => {
            const ciclo = tempo / CICLO_MS;
            const indice = Math.floor(ciclo);
            const fase = ciclo - indice;
            const de = modoEm(indice);
            const pausa = Math.min(Math.max(parada, 0), 0.99);
            if (fase <= pausa) {
                modo = de;
                return;
            }
            const para = modoEm(indice + 1);
            const k = suavizar((fase - pausa) / (1 - pausa));
            const mix = (x: number, y: number) => x + (y - x) * k;
            modo = { m: mix(de.m, para.m), n: mix(de.n, para.n), a: mix(de.a, para.a), b: mix(de.b, para.b), mx: mix(de.mx, para.mx), nx: mix(de.nx, para.nx) };
        };
        const chladni = (x: number, y: number) =>
            modo.a * Math.sin(Math.PI * modo.nx * x) * Math.sin(Math.PI * modo.m * y) + modo.b * Math.sin(Math.PI * modo.mx * x) * Math.sin(Math.PI * modo.n * y);

        const passo = () => {
            for (let i = 0; i < total; i++) {
                let amp = V * Math.abs(chladni(xs[i], ys[i]));
                if (amp <= PASSO_MINIMO) amp = PASSO_MINIMO;
                const nx = xs[i] + (rand() * 2 - 1) * amp;
                const ny = ys[i] + (rand() * 2 - 1) * amp;
                xs[i] = nx < 0 ? 0 : nx > 1 ? 1 : nx;
                ys[i] = ny < 0 ? 0 : ny > 1 ? 1 : ny;
            }
        };
        const pintar = () => {
            ctx.clearRect(0, 0, largura, altura);
            ctx.fillStyle = cor;
            ctx.globalCompositeOperation = "lighter";
            for (let i = 0; i < total; i++) ctx.fillRect(xs[i] * largura, ys[i] * altura, 1, 1);
            ctx.globalCompositeOperation = "source-over";
        };
        const desenhar = (tempo: number) => {
            try {
                definirModo(tempo);
                passo();
                pintar();
                if (rodando) quadro = requestAnimationFrame(desenhar);
            } catch {
                rodando = false;
            }
        };
        const iniciar = () => {
            if (rodando || reduzir) return;
            rodando = true;
            quadro = requestAnimationFrame(desenhar);
        };
        const parar = () => {
            rodando = false;
            cancelAnimationFrame(quadro);
        };
        const aoMudarVisibilidade = () => (document.hidden ? parar() : iniciar());

        redimensionar();
        definirModo(0);
        const observador = new ResizeObserver(redimensionar);
        observador.observe(canvas);
        document.addEventListener("visibilitychange", aoMudarVisibilidade);

        if (reduzir) {
            try {
                for (let i = 0; i < 600; i++) passo();
                pintar();
            } catch {
                /* decoração: falhar não leva a tela junto */
            }
        } else iniciar();

        return () => {
            parar();
            observador.disconnect();
            document.removeEventListener("visibilitychange", aoMudarVisibilidade);
        };
    }, [cor, densidade, escala, parada]);

    return <canvas ref={ref} aria-hidden="true" className={cx("pointer-events-none block", className)} />;
}

/**
 * Cor das partículas pelo tema. Canvas não lê token: no escuro, branco translúcido; no claro, preto
 * translúcido (branco some no fundo claro, e os tokens de marca do protótipo são neutros).
 */
export function useCorDeParticulas(alfa = { escuro: 0.18, claro: 0.16 }): string {
    const { theme } = useTheme();
    const escuro = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    return escuro ? `rgba(255,255,255,${alfa.escuro})` : `rgba(0,0,0,${alfa.claro})`;
}
