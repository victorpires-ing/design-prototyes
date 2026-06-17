/**
 * Store do sistema de testes. Tenta a API remota (Redis via /api/usability) e,
 * em caso de falha (ex.: `vercel dev` ausente em localhost), cai num fallback
 * localStorage para que o painel continue utilizável em desenvolvimento.
 *
 * Em produção (Vercel), a API funciona e os dados são compartilhados entre
 * dispositivos — necessário para o link de teste responsivo.
 */

import type { SessaoTeste, Teste, UsabilityStore } from "./types";

const ENDPOINT = "/api/usability";

/* --------------------------- ids e device --------------------------- */

export function gerarId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `id-${Math.abs(hashString(String(performance.now()) + navigator.userAgent)).toString(36)}`;
}

function hashString(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return h;
}

const DEVICE_KEY = "usability:device-id";

/** Id estável por navegador (best-effort — limpar storage reseta). */
export function getDeviceId(): string {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
        id = gerarId();
        localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
}

const FEITOS_KEY = "usability:testes-feitos";

export function jaFez(testeId: string): boolean {
    return lerFeitos().includes(testeId);
}

export function marcarFeito(testeId: string) {
    const feitos = lerFeitos();
    if (!feitos.includes(testeId)) localStorage.setItem(FEITOS_KEY, JSON.stringify([...feitos, testeId]));
}

function lerFeitos(): string[] {
    try {
        const raw = localStorage.getItem(FEITOS_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

/* ----------------------------- fallback ----------------------------- */

const LS_TESTES = "usability:testes";
const lsSessoes = (testeId: string) => `usability:sessoes:${testeId}`;

function lsList<T>(key: string): T[] {
    try {
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

const localStore: UsabilityStore = {
    async listTestes() {
        return lsList<Teste>(LS_TESTES);
    },
    async getTeste(id) {
        return lsList<Teste>(LS_TESTES).find((t) => t.id === id) ?? null;
    },
    async saveTeste(teste) {
        const all = lsList<Teste>(LS_TESTES);
        const idx = all.findIndex((t) => t.id === teste.id);
        if (idx >= 0) all[idx] = teste;
        else all.push(teste);
        localStorage.setItem(LS_TESTES, JSON.stringify(all));
        return teste;
    },
    async removeTeste(id) {
        localStorage.setItem(LS_TESTES, JSON.stringify(lsList<Teste>(LS_TESTES).filter((t) => t.id !== id)));
        localStorage.removeItem(lsSessoes(id));
    },
    async criarSessao(sessao) {
        const all = lsList<SessaoTeste>(lsSessoes(sessao.testeId));
        all.push(sessao);
        localStorage.setItem(lsSessoes(sessao.testeId), JSON.stringify(all));
        return sessao;
    },
    async atualizarSessao(sessao) {
        const all = lsList<SessaoTeste>(lsSessoes(sessao.testeId));
        const idx = all.findIndex((s) => s.id === sessao.id);
        if (idx >= 0) all[idx] = sessao;
        else all.push(sessao);
        localStorage.setItem(lsSessoes(sessao.testeId), JSON.stringify(all));
        return sessao;
    },
    async listSessoes(testeId) {
        return lsList<SessaoTeste>(lsSessoes(testeId));
    },
};

/* ------------------------------ remoto ------------------------------ */

async function api<T>(input: string, init?: RequestInit): Promise<T> {
    const res = await fetch(input, {
        ...init,
        headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`Usability API ${res.status}`);
    return res.json() as Promise<T>;
}

function post<T>(body: Record<string, unknown>): Promise<T> {
    return api<T>(ENDPOINT, { method: "POST", body: JSON.stringify(body) });
}

/** Executa a versão remota; em qualquer falha, usa o fallback local. */
async function comFallback<T>(remoto: () => Promise<T>, local: () => Promise<T>): Promise<T> {
    try {
        return await remoto();
    } catch {
        return local();
    }
}

export const usabilityStore: UsabilityStore = {
    listTestes: () => comFallback(() => api<Teste[]>(`${ENDPOINT}`, { cache: "no-store" }), () => localStore.listTestes()),
    getTeste: (id) =>
        comFallback(
            () => api<Teste | null>(`${ENDPOINT}?testeId=${encodeURIComponent(id)}`, { cache: "no-store" }),
            () => localStore.getTeste(id),
        ),
    saveTeste: (teste) =>
        comFallback(
            () => post<Teste>({ action: "saveTeste", teste }),
            () => localStore.saveTeste(teste),
        ),
    removeTeste: (id) =>
        comFallback(
            async () => {
                await post({ action: "removeTeste", id });
            },
            () => localStore.removeTeste(id),
        ),
    criarSessao: (sessao) =>
        comFallback(
            () => post<SessaoTeste>({ action: "saveSessao", sessao }),
            () => localStore.criarSessao(sessao),
        ),
    atualizarSessao: (sessao) =>
        comFallback(
            () => post<SessaoTeste>({ action: "saveSessao", sessao }),
            () => localStore.atualizarSessao(sessao),
        ),
    listSessoes: (testeId) =>
        comFallback(
            () => api<SessaoTeste[]>(`${ENDPOINT}?sessoes=1&testeId=${encodeURIComponent(testeId)}`, { cache: "no-store" }),
            () => localStore.listSessoes(testeId),
        ),
};
