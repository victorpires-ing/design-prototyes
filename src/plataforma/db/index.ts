import { useMemo, useSyncExternalStore } from "react";
import { COLECOES, type Colecoes, type NomeColecao } from "../modelo";
import { agora } from "../regras";
import { SEED, SEED_VERSAO } from "./seed";

/* ------------------------------------------------------------------ */
/*  Cliente do banco unificado                                         */
/*                                                                     */
/*  Compartilhado: /api/db (Upstash Redis na Vercel). Todo mundo que   */
/*  abre o protótipo vê o mesmo mundo.                                 */
/*  Local: quando a API não responde (ex.: `npm run dev` sem           */
/*  `vercel dev`), o mesmo banco vive no localStorage deste navegador. */
/*                                                                     */
/*  Escrita otimista: a tela muda na hora e a gravação vai em seguida. */
/*  Outras abas e aparelhos recebem a mudança no próximo ciclo         */
/*  (foco na janela ou a cada POLL_MS).                                */
/* ------------------------------------------------------------------ */

export type ModoBanco = "carregando" | "compartilhado" | "local";

type Tabelas = { [C in NomeColecao]: Record<string, Colecoes[C]> };

interface Estado {
    modo: ModoBanco;
    tabelas: Tabelas;
    /** Muda a cada alteração; hooks derivam listas a partir dela. */
    versao: number;
    erro: string | null;
}

const ENDPOINT = "/api/db";
const LOCAL_KEY = "plataforma:db:v1";
const POLL_MS = 8000;

const vazio = (): Tabelas => ({ eventos: {}, pedidos: {}, ingressos: {}, usuarios: {} });

let estado: Estado = { modo: "carregando", tabelas: vazio(), versao: 0, erro: null };
const ouvintes = new Set<() => void>();

function emitir(patch: Partial<Estado>) {
    estado = { ...estado, ...patch, versao: estado.versao + 1 };
    ouvintes.forEach((l) => l());
}

const indexar = (colecoes: Partial<Record<NomeColecao, { id: string }[]>>): Tabelas => {
    const t = vazio();
    for (const c of COLECOES) for (const d of colecoes[c] ?? []) (t[c] as Record<string, unknown>)[d.id] = d;
    return t;
};

/* ---------------- transporte ---------------- */

async function api<T>(init?: RequestInit, query = ""): Promise<T> {
    const res = await fetch(`${ENDPOINT}${query}`, { cache: "no-store", ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
    const tipo = res.headers.get("content-type") ?? "";
    if (!res.ok || !tipo.includes("application/json")) throw new Error(`API ${res.status}`);
    return res.json() as Promise<T>;
}

const post = <T,>(body: unknown) => api<T>({ method: "POST", body: JSON.stringify(body) });

function lerLocal(): Tabelas | null {
    try {
        const raw = localStorage.getItem(LOCAL_KEY);
        if (!raw) return null;
        const p = JSON.parse(raw) as { versao?: string; tabelas?: Tabelas };
        if (!p.tabelas) return null;
        // Seed nova: completa com o que falta, sem sobrescrever o que já existe.
        if (p.versao !== SEED_VERSAO) {
            const seed = indexar(SEED);
            for (const c of COLECOES) p.tabelas[c] = { ...seed[c], ...(p.tabelas[c] ?? {}) } as never;
        }
        return p.tabelas;
    } catch {
        return null;
    }
}

function gravarLocal() {
    try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify({ versao: SEED_VERSAO, tabelas: estado.tabelas }));
    } catch {
        /* storage cheio ou bloqueado: segue só em memória */
    }
}

/* ---------------- ciclo de vida ---------------- */

let iniciado = false;
/** Gravações em voo: enquanto houver, a sincronização não sobrescreve a tela com dado velho. */
let pendentes = 0;

async function sincronizar() {
    if (estado.modo === "local") return;
    try {
        const r = await api<{ meta: { versao?: string } | null; colecoes: Partial<Record<NomeColecao, { id: string }[]>> }>();
        if (r.meta?.versao !== SEED_VERSAO) {
            await post({ op: "seed", versao: SEED_VERSAO, data: SEED });
            return sincronizar();
        }
        if (pendentes === 0) emitir({ modo: "compartilhado", tabelas: indexar(r.colecoes), erro: null });
    } catch (err) {
        if (estado.modo === "carregando") {
            emitir({ modo: "local", tabelas: lerLocal() ?? indexar(SEED), erro: null });
            gravarLocal();
        } else emitir({ erro: `Sem conexão com o banco (${String(err)})` });
    }
}

function iniciar() {
    if (iniciado || typeof window === "undefined") return;
    iniciado = true;
    void sincronizar();
    const tick = () => document.visibilityState === "visible" && sincronizar();
    window.setInterval(tick, POLL_MS);
    window.addEventListener("focus", tick);
    // Outra aba no modo local gravou: recarrega.
    window.addEventListener("storage", (e) => {
        if (e.key === LOCAL_KEY && estado.modo === "local") emitir({ tabelas: lerLocal() ?? estado.tabelas });
    });
}

function assinar(l: () => void) {
    iniciar();
    ouvintes.add(l);
    return () => {
        ouvintes.delete(l);
    };
}

/* ---------------- escrita ---------------- */

/** Grava (cria ou substitui) um documento. Atualiza `atualizadoEm` se o tipo tiver o campo. */
export async function salvar<C extends NomeColecao>(col: C, doc: Colecoes[C]): Promise<Colecoes[C]> {
    iniciar();
    const d = ("atualizadoEm" in doc ? { ...doc, atualizadoEm: agora() } : doc) as Colecoes[C];
    emitir({ tabelas: { ...estado.tabelas, [col]: { ...estado.tabelas[col], [d.id]: d } } });
    if (estado.modo === "local") gravarLocal();
    else {
        pendentes++;
        try {
            await post({ op: "put", col, doc: d });
        } catch (err) {
            emitir({ erro: `Não salvou no banco compartilhado (${String(err)})` });
        } finally {
            pendentes--;
        }
    }
    return d;
}

/** Grava vários de uma vez (ex.: pedido pago + ingressos emitidos). */
export async function salvarVarios(docs: { [C in NomeColecao]?: Colecoes[C][] }) {
    await Promise.all(COLECOES.flatMap((c) => (docs[c] ?? []).map((d) => salvar(c, d as never))));
}

export async function remover(col: NomeColecao, id: string) {
    iniciar();
    const tabela = { ...estado.tabelas[col] };
    delete tabela[id];
    emitir({ tabelas: { ...estado.tabelas, [col]: tabela } });
    if (estado.modo === "local") gravarLocal();
    else await post({ op: "del", col, id }).catch((err) => emitir({ erro: String(err) }));
}

/** Volta o mundo para a seed. Apaga tudo o que foi criado por todo mundo (no modo compartilhado). */
export async function resetarBanco() {
    if (estado.modo === "local") {
        emitir({ tabelas: indexar(SEED) });
        gravarLocal();
        return;
    }
    await post({ op: "reset", confirmar: "RESETAR", versao: SEED_VERSAO, data: SEED });
    await sincronizar();
}

/* ---------------- leitura ---------------- */

/** Leitura síncrona fora de componente (ex.: dentro de uma ação). */
export const lerBanco = () => estado;
export const lerDoc = <C extends NomeColecao>(col: C, id: string): Colecoes[C] | undefined => estado.tabelas[col][id];
export const lerColecao = <C extends NomeColecao>(col: C): Colecoes[C][] => Object.values(estado.tabelas[col]);

/** Garante que o banco começou a carregar (para quem só lê com lerColecao). */
export const iniciarBanco = iniciar;
/** Assinatura fora de componente (stores de produto que espelham o banco). */
export const assinarBanco = assinar;

export function useBanco(): Estado {
    return useSyncExternalStore(assinar, () => estado, () => estado);
}

export function useColecao<C extends NomeColecao>(col: C): Colecoes[C][] {
    const { tabelas } = useBanco();
    const tabela = tabelas[col];
    return useMemo(() => Object.values(tabela), [tabela]);
}

export function useDoc<C extends NomeColecao>(col: C, id: string | null | undefined): Colecoes[C] | undefined {
    const { tabelas } = useBanco();
    return id ? tabelas[col][id] : undefined;
}

/** Para testes e depuração no console. */
if (typeof window !== "undefined") (window as unknown as { __banco?: unknown }).__banco = { lerBanco, resetarBanco };

