/**
 * Estado da execução em andamento, persistido em sessionStorage para sobreviver
 * à navegação do participante pelas telas reais dos protótipos. O TestRunnerLayer
 * lê esse estado e reage ao evento `usability:run-changed`.
 */

import type { RunAtivo, SessaoTeste } from "./types";

const RUN_KEY = "usability:run";
const SESSAO_KEY = "usability:run-sessao";
const EVENTO = "usability:run-changed";

export function lerRun(): RunAtivo | null {
    try {
        const raw = sessionStorage.getItem(RUN_KEY);
        return raw ? (JSON.parse(raw) as RunAtivo) : null;
    } catch {
        return null;
    }
}

export function gravarRun(run: RunAtivo | null) {
    if (run) sessionStorage.setItem(RUN_KEY, JSON.stringify(run));
    else sessionStorage.removeItem(RUN_KEY);
    window.dispatchEvent(new CustomEvent(EVENTO));
}

export function lerSessao(): SessaoTeste | null {
    try {
        const raw = sessionStorage.getItem(SESSAO_KEY);
        return raw ? (JSON.parse(raw) as SessaoTeste) : null;
    } catch {
        return null;
    }
}

export function gravarSessao(sessao: SessaoTeste | null) {
    if (sessao) sessionStorage.setItem(SESSAO_KEY, JSON.stringify(sessao));
    else sessionStorage.removeItem(SESSAO_KEY);
}

export function ouvirRun(cb: () => void): () => void {
    window.addEventListener(EVENTO, cb);
    return () => window.removeEventListener(EVENTO, cb);
}
