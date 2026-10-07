import { useEffect, useRef, useState } from "react";

export interface Restante {
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
    /** Campanha acabou. */
    encerrado: boolean;
    /** Falta menos de um dia: o bloco de dias some e a legenda muda. */
    ultimoDia: boolean;
    /** Falta menos de uma hora. */
    ultimaHora: boolean;
}

const vazio: Restante = { dias: 0, horas: 0, minutos: 0, segundos: 0, encerrado: true, ultimoDia: false, ultimaHora: false };

function calcular(alvo: number): Restante {
    const delta = alvo - Date.now();
    if (delta <= 0) return vazio;

    const segundosTotais = Math.floor(delta / 1000);
    return {
        dias: Math.floor(segundosTotais / 86400),
        horas: Math.floor((segundosTotais % 86400) / 3600),
        minutos: Math.floor((segundosTotais % 3600) / 60),
        segundos: segundosTotais % 60,
        encerrado: false,
        ultimoDia: delta < 86400_000,
        ultimaHora: delta < 3600_000,
    };
}

/**
 * Contagem regressiva até `alvo` (timestamp em ms).
 * O tick só roda enquanto a aba está visível: em background o `setInterval`
 * é estrangulado e só gastaria bateria à toa.
 */
export function useCountdown(alvo: number): Restante {
    const [restante, setRestante] = useState(() => calcular(alvo));
    const alvoRef = useRef(alvo);
    alvoRef.current = alvo;

    useEffect(() => {
        let id: number | undefined;

        const parar = () => {
            if (id !== undefined) window.clearInterval(id);
            id = undefined;
        };

        const comecar = () => {
            parar();
            setRestante(calcular(alvoRef.current));
            id = window.setInterval(() => setRestante(calcular(alvoRef.current)), 1000);
        };

        const aoMudarVisibilidade = () => (document.hidden ? parar() : comecar());

        comecar();
        document.addEventListener("visibilitychange", aoMudarVisibilidade);
        return () => {
            parar();
            document.removeEventListener("visibilitychange", aoMudarVisibilidade);
        };
    }, [alvo]);

    return restante;
}

export function legendaCountdown(r: Restante) {
    if (r.encerrado) return "Sports Week encerrada";
    if (r.ultimaHora) return "Última hora da Sports Week";
    if (r.ultimoDia) return "Último dia. Termina em";
    return "A campanha termina em";
}

/** Dois dígitos, sempre. "7" vira "07" para os números não dançarem de largura. */
export const dd = (n: number) => String(Math.max(0, n)).padStart(2, "0");
