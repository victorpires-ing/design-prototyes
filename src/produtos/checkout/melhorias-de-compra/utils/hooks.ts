import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

/*
 * Reserva dos ingressos: uma contagem só para o fluxo inteiro, que começa em 10 min na
 * primeira tela do checkout. O "Tempo restante" do topo e o do Pix leem este mesmo relógio,
 * então mudam juntos e seguem contando ao navegar entre Pix, cartão e recusa.
 */
export const RESERVA_SEGUNDOS = 10 * 60;
let reservaFim: number | null = null;
let restanteAtual = RESERVA_SEGUNDOS;
let intervalo: number | null = null;
const ouvintes = new Set<() => void>();

const calcularRestante = () => (reservaFim === null ? RESERVA_SEGUNDOS : Math.max(0, Math.ceil((reservaFim - Date.now()) / 1000)));

function assinarRelogio(ouvinte: () => void) {
    if (reservaFim === null) reservaFim = Date.now() + RESERVA_SEGUNDOS * 1000;
    ouvintes.add(ouvinte);
    if (intervalo === null) {
        intervalo = window.setInterval(() => {
            const r = calcularRestante();
            if (r === restanteAtual) return;
            restanteAtual = r;
            ouvintes.forEach((o) => o());
        }, 250);
    }
    return () => {
        ouvintes.delete(ouvinte);
        if (ouvintes.size === 0 && intervalo !== null) {
            window.clearInterval(intervalo);
            intervalo = null;
        }
    };
}

/** Segundos que faltam na reserva (mesmo valor para todos os componentes). */
function useRestanteReserva() {
    return useSyncExternalStore(assinarRelogio, () => restanteAtual);
}

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** "Tempo restante: 09m59s" do topo. */
export function useTempoReserva() {
    const restante = useRestanteReserva();
    return `${doisDigitos(Math.floor(restante / 60))}m${doisDigitos(restante % 60)}s`;
}

/** Validade do Pix = tempo da reserva: o código vale enquanto os ingressos estiverem reservados. */
export function useValidadePix() {
    const restante = useRestanteReserva();
    return {
        seed: 1,
        relogio: `${doisDigitos(Math.floor(restante / 60))}:${doisDigitos(restante % 60)}s`,
        progresso: (restante / RESERVA_SEGUNDOS) * 100,
        urgente: restante <= 60,
    };
}
