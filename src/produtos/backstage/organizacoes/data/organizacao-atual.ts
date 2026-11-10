import { useMemo, useSyncExternalStore } from "react";
import { lerColecao, organizacaoDoEvento, siglaDe, useColecao, type Evento, type Organizacao } from "@/plataforma";

/* ------------------------------------------------------------------ */
/*  Organização em contexto no Backstage                               */
/*                                                                     */
/*  Três memórias, cada uma com um papel (ver organizacoes/rules.md):  */
/*  - sessão (sessionStorage): já escolheu nesta aba? Se sim, entrar   */
/*    pelo /backstage não pergunta de novo.                            */
/*  - última (localStorage): a organização que links diretos usam.     */
/*  - recentes (localStorage): até 4, a mais nova primeiro.            */
/* ------------------------------------------------------------------ */

const ULTIMA_KEY = "backstage-organizacao-atual";
const SESSAO_KEY = "backstage-organizacao-sessao";
const RECENTES_KEY = "backstage-organizacoes-recentes";
const MAX_RECENTES = 4;

let atual: string | null = null;
let versao = 0;
const ouvintes = new Set<() => void>();
const avisar = () => {
    versao++;
    ouvintes.forEach((o) => o());
};

const ler = (storage: "local" | "session", chave: string) => {
    try {
        return (storage === "local" ? window.localStorage : window.sessionStorage).getItem(chave);
    } catch {
        return null;
    }
};
const gravar = (storage: "local" | "session", chave: string, valor: string) => {
    try {
        (storage === "local" ? window.localStorage : window.sessionStorage).setItem(chave, valor);
    } catch {
        /* storage indisponível: fica só em memória */
    }
};

/** Organização escolhida (memória → última salva). `null` se nunca escolheu neste navegador. */
export function organizacaoAtualId(): string | null {
    if (atual) return atual;
    if (typeof window === "undefined") return null;
    atual = ler("local", ULTIMA_KEY);
    return atual;
}

/** Já escolheu uma organização nesta sessão do navegador. */
export const escolheuNestaSessao = () => typeof window !== "undefined" && ler("session", SESSAO_KEY) !== null;

export function lerRecentes(): string[] {
    try {
        const lista = JSON.parse(ler("local", RECENTES_KEY) ?? "[]");
        return Array.isArray(lista) ? lista.filter((id): id is string => typeof id === "string") : [];
    } catch {
        return [];
    }
}

/** Escolha da pessoa: vale para a sessão, vira a última e entra nos recentes. */
export function setOrganizacaoAtual(id: string) {
    atual = id;
    gravar("local", ULTIMA_KEY, id);
    gravar("session", SESSAO_KEY, id);
    gravar("local", RECENTES_KEY, JSON.stringify([id, ...lerRecentes().filter((r) => r !== id)].slice(0, MAX_RECENTES)));
    avisar();
}

/** Padrão sem escolha (link direto no primeiro acesso): só em memória, não conta como escolha. */
export function definirPadrao(id: string) {
    if (atual) return;
    atual = id;
    avisar();
}

export function removerRecente(id: string) {
    gravar("local", RECENTES_KEY, JSON.stringify(lerRecentes().filter((r) => r !== id)));
    avisar();
}

export function assinarOrganizacao(fn: () => void) {
    ouvintes.add(fn);
    return () => {
        ouvintes.delete(fn);
    };
}

export const useOrganizacaoVersao = () => useSyncExternalStore(assinarOrganizacao, () => versao, () => 0);

/* ---------------- leitura com dados do banco ---------------- */

export interface OrganizacaoComEventos extends Organizacao {
    eventos: Evento[];
    /** Privados ou publicados. */
    ativos: number;
}

/**
 * Organizações do banco com seus eventos. Evento cuja organização não está na coleção (banco antigo)
 * cria a organização na hora, pelo nome da produtora.
 */
export function organizacoesComEventos(organizacoes: Organizacao[], eventos: Evento[]): OrganizacaoComEventos[] {
    const mapa = new Map<string, OrganizacaoComEventos>(organizacoes.map((o) => [o.id, { ...o, eventos: [], ativos: 0 }]));
    for (const e of eventos) {
        const id = organizacaoDoEvento(e);
        let org = mapa.get(id);
        if (!org) {
            org = { id, nome: e.produtora, sigla: siglaDe(e.produtora), criadoEm: e.criadoEm, eventos: [], ativos: 0 };
            mapa.set(id, org);
        }
        org.eventos.push(e);
        if (e.status === "privado" || e.status === "publicado") org.ativos++;
    }
    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function useOrganizacoes(): OrganizacaoComEventos[] {
    const organizacoes = useColecao("organizacoes");
    const eventos = useColecao("eventos");
    return useMemo(() => organizacoesComEventos(organizacoes, eventos), [organizacoes, eventos]);
}

/** Organização em contexto, com nome e sigla. */
export function useOrganizacaoAtual(): OrganizacaoComEventos | undefined {
    useOrganizacaoVersao();
    const todas = useOrganizacoes();
    const id = organizacaoAtualId();
    return todas.find((o) => o.id === id) ?? todas[0];
}

/** Para código fora do React: organizações agora. */
export const lerOrganizacoes = () => organizacoesComEventos(lerColecao("organizacoes"), lerColecao("eventos"));
