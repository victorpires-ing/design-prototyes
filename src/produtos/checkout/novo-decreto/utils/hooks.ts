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

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** "Tempo restante: 09m59s" — reserva de 10 min a partir da abertura da tela. */
export function useTempoReserva() {
    const [fim] = useState(() => Date.now() + 10 * 60 * 1000);
    const [restante, setRestante] = useState(10 * 60);
    useEffect(() => {
        const id = window.setInterval(() => setRestante(Math.max(0, Math.ceil((fim - Date.now()) / 1000))), 250);
        return () => window.clearInterval(id);
    }, [fim]);
    return `${doisDigitos(Math.floor(restante / 60))}m${doisDigitos(restante % 60)}s`;
}
