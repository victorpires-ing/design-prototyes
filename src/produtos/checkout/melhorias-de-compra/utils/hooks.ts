import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/providers/theme-provider";

/** Viewport de celular (< lg = 1024px). */
export function useIsMobile() {
    const query = "(max-width: 1023px)";
    const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
    useEffect(() => {
        const mq = window.matchMedia(query);
        const handler = () => setMobile(mq.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return mobile;
}

/** Checkout sempre em light mode; restaura o tema anterior ao sair. */
export function useTemaClaro() {
    const { theme, setTheme } = useTheme();
    const anterior = useRef(theme);
    useEffect(() => {
        setTheme("light");
        return () => setTheme(anterior.current);
    }, [setTheme]);
}

/* A reserva dos ingressos é uma só para o fluxo inteiro: o prazo é fixado na primeira tela. */
const RESERVA_SEGUNDOS = 9 * 60 + 15;
let reservaFim: number | null = null;

export function useTempoReserva() {
    if (reservaFim === null) reservaFim = Date.now() + RESERVA_SEGUNDOS * 1000;
    const calc = () => Math.max(0, Math.round(((reservaFim as number) - Date.now()) / 1000));
    const [restante, setRestante] = useState(calc);
    useEffect(() => {
        const t = window.setInterval(() => setRestante(calc()), 1000);
        return () => window.clearInterval(t);
    }, []);
    return `${String(Math.floor(restante / 60)).padStart(2, "0")}m${String(restante % 60).padStart(2, "0")}s`;
}

/** Validade do QR do Pix: ao zerar, um novo código é gerado e a contagem recomeça. */
export function useValidadePix(total = 10 * 60, inicial = 9 * 60 + 15) {
    const [restante, setRestante] = useState(inicial);
    const [seed, setSeed] = useState(1);
    useEffect(() => {
        const t = window.setInterval(() => {
            setRestante((r) => {
                if (r <= 1) {
                    setSeed((s) => s + 1);
                    return total;
                }
                return r - 1;
            });
        }, 1000);
        return () => window.clearInterval(t);
    }, [total]);
    return {
        seed,
        relogio: `${String(Math.floor(restante / 60)).padStart(2, "0")}:${String(restante % 60).padStart(2, "0")}s`,
        progresso: (restante / total) * 100,
        urgente: restante <= 60,
    };
}
