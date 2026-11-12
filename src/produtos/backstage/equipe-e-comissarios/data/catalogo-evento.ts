/* ------------------------------------------------------------------ */
/*  Catálogo do evento em contexto para a Equipe de operação (EO3-50).  */
/*                                                                     */
/*  É o que o grupo pode operar: os ingressos (por sessão e setor), os  */
/*  produtos e os combos do evento, lidos do banco (`@/plataforma`),   */
/*  como em Itens. Antes era um catálogo inventado, igual em qualquer  */
/*  evento (BKS-40).                                                   */
/*                                                                     */
/*  As listas são "espelhos": as telas importam as mesmas constantes   */
/*  de sempre, e elas são refeitas quando o banco ou o evento em        */
/*  contexto mudam. `useCatalogoDaEquipe()` assina as mudanças.         */
/* ------------------------------------------------------------------ */

import { useSyncExternalStore } from "react";
import { organizacaoDoEvento, type Evento } from "@/plataforma";
import { assinarBanco, lerBanco } from "@/plataforma/db";
import { assinarEventoAtual, eventoAtualId } from "../../eventos/data/eventos";
import { bibliotecaDe } from "../../itens/data/catalogo";

export type TipoItem = "ingresso" | "produto" | "combo";

export interface Ingresso {
    id: string;
    tipo: "ingresso";
    /** Nome do ingresso no evento (ex.: "Inteira"). */
    nome: string;
    categoria: string;
    /** Setor do ingresso. */
    grupo: string;
    sessaoId: string;
    /** Soma dos lotes: o teto quando o grupo não tem cota. */
    estoque: number;
}

export interface Produto {
    id: string;
    tipo: "produto";
    nome: string;
    descricao: string;
    imagem: string;
    estoque: number;
}

export interface ComponenteCombo {
    quantidade: number;
    nome: string;
    categoria: string;
    sessaoId?: string;
}

export interface Combo {
    id: string;
    tipo: "combo";
    nome: string;
    grupo: string;
    categoria: string;
    sessaoId: string;
    componentes: ComponenteCombo[];
    estoque: number;
}

export type ItemCatalogo = Ingresso | Produto | Combo;

export interface Sessao {
    id: string;
    /** "03 de abril às 16:00": cabeçalho de sessão. */
    rotulo: string;
    /** Linha de data no resumo e no detalhe. */
    curto: string;
}

/* ---------------- espelho do banco ---------------- */

export const SESSOES: Sessao[] = [];
export const INGRESSOS: Ingresso[] = [];
export const PRODUTOS: Produto[] = [];
export const COMBOS: Combo[] = [];
export const ITENS: ItemCatalogo[] = [];
export const ITEM_POR_ID: Record<string, ItemCatalogo> = {};
export const SESSAO_POR_ID: Record<string, Sessao> = {};

const DATA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
const rotuloDaSessao = (inicio: string) => DATA.format(new Date(inicio)).replace(",", " às");

let versao = 0;
let assinatura = "";
const ouvintes = new Set<() => void>();

function espelhar() {
    const { modo, tabelas } = lerBanco();
    if (modo === "carregando") return;
    const evento = tabelas.eventos[eventoAtualId()] as Evento | undefined;
    const org = evento ? (tabelas.organizacoes as Record<string, Parameters<typeof bibliotecaDe>[0]>)[organizacaoDoEvento(evento)] : undefined;
    // Refaz só quando o evento ou o catálogo dele mudam.
    const nova = evento ? `${evento.id}:${JSON.stringify([evento.sessoes, evento.produtos, evento.combos])}` : "";
    if (nova === assinatura) return;
    assinatura = nova;

    const sessoes: Sessao[] = [];
    const ingressos: Ingresso[] = [];
    const vistos = new Set<string>();
    for (const s of evento?.sessoes ?? []) {
        const rotulo = rotuloDaSessao(s.inicio);
        sessoes.push({ id: s.id, rotulo, curto: rotulo });
        for (const g of s.grupos ?? [])
            for (const t of g.ingressos ?? []) {
                if (vistos.has(t.id)) continue;
                vistos.add(t.id);
                ingressos.push({
                    id: t.id,
                    tipo: "ingresso",
                    nome: t.nome,
                    categoria: t.nome,
                    grupo: g.nome,
                    sessaoId: s.id,
                    estoque: (t.lotes ?? []).reduce((soma, l) => soma + (l.quantidade ?? 0), 0),
                });
            }
    }
    const biblioteca = evento ? bibliotecaDe(org, organizacaoDoEvento(evento)) : [];
    const produtos: Produto[] = (evento?.produtos ?? [])
        .filter((p) => p.ativo !== false)
        .map((p) => {
            const b = biblioteca.find((x) => x.id === p.produtoId);
            return { id: p.produtoId, tipo: "produto" as const, nome: b?.nome ?? "Produto", descricao: b?.descricao ?? "", imagem: b?.imagem ?? "", estoque: p.estoque };
        });
    const porId = new Map<string, Ingresso | Produto>([...ingressos.map((i) => [i.id, i] as const), ...produtos.map((p) => [p.id, p] as const)]);
    const combos: Combo[] = (evento?.combos ?? [])
        .filter((c) => c.ativo !== false)
        .map((c) => {
            const componentes = c.itens.map((it) => {
                const alvo = porId.get(it.id);
                return {
                    quantidade: it.quantidade,
                    nome: alvo?.tipo === "ingresso" ? `${alvo.grupo}, ${alvo.nome}` : (alvo?.nome ?? "Item"),
                    categoria: it.tipo === "produto" ? "Produto" : (alvo?.nome ?? ""),
                    sessaoId: alvo?.tipo === "ingresso" ? alvo.sessaoId : undefined,
                };
            });
            const primeiroIngresso = c.itens.map((it) => porId.get(it.id)).find((x): x is Ingresso => x?.tipo === "ingresso");
            // Sem limite próprio, o combo vai até o item que acaba primeiro.
            const pelosItens = Math.min(...c.itens.map((it) => Math.floor((porId.get(it.id)?.estoque ?? 0) / Math.max(1, it.quantidade))));
            return {
                id: c.id,
                tipo: "combo" as const,
                nome: c.nome,
                grupo: primeiroIngresso?.grupo ?? "Combo",
                categoria: `${c.itens.reduce((s, it) => s + it.quantidade, 0)} itens`,
                sessaoId: primeiroIngresso?.sessaoId ?? sessoes[0]?.id ?? "",
                componentes,
                estoque: c.limite ?? (Number.isFinite(pelosItens) ? pelosItens : 0),
            };
        });

    SESSOES.splice(0, SESSOES.length, ...sessoes);
    INGRESSOS.splice(0, INGRESSOS.length, ...ingressos);
    PRODUTOS.splice(0, PRODUTOS.length, ...produtos);
    COMBOS.splice(0, COMBOS.length, ...combos);
    ITENS.splice(0, ITENS.length, ...ingressos, ...produtos, ...combos);
    for (const k of Object.keys(ITEM_POR_ID)) delete ITEM_POR_ID[k];
    for (const i of ITENS) ITEM_POR_ID[i.id] = i;
    for (const k of Object.keys(SESSAO_POR_ID)) delete SESSAO_POR_ID[k];
    for (const s of SESSOES) SESSAO_POR_ID[s.id] = s;
    versao++;
    ouvintes.forEach((o) => o());
}

if (typeof window !== "undefined") {
    assinarBanco(espelhar);
    assinarEventoAtual(espelhar);
    espelhar();
}

/** Assina o catálogo do evento em contexto: a tela redesenha quando ele muda. */
export function useCatalogoDaEquipe() {
    return useSyncExternalStore(
        (fn) => {
            ouvintes.add(fn);
            return () => ouvintes.delete(fn);
        },
        () => versao,
        () => 0,
    );
}

/* ---------------- leituras ---------------- */

/** Produtos não têm sessão: ficam depois das sessões. */
export const SEM_SESSAO: Sessao = { id: "evento", rotulo: "Todo o evento", curto: "Todo o evento" };

/** Sessão do item; produto não tem. */
export const sessaoDoItem = (item: ItemCatalogo): Sessao | undefined => (item.tipo === "produto" ? undefined : SESSAO_POR_ID[item.sessaoId]);

/** Agrupa itens por sessão e, dentro dela, pelo setor. Produtos e combos vão para o fim, sem sessão. */
export function agruparPorSessao<T extends ItemCatalogo>(itens: T[]) {
    const porSessao = SESSOES.map((sessao) => {
        const daSessao = itens.filter((i) => i.tipo === "ingresso" && i.sessaoId === sessao.id);
        const grupos = new Map<string, T[]>();
        for (const item of daSessao) {
            const nome = item.tipo === "ingresso" ? item.grupo : "";
            grupos.set(nome, [...(grupos.get(nome) ?? []), item]);
        }
        return { sessao, grupos: [...grupos.entries()].map(([nome, lista]) => ({ nome, itens: lista })) };
    });
    const ordemSessao = (i: ItemCatalogo) => SESSOES.findIndex((s) => s.id === sessaoDoItem(i)?.id);
    const produtos = itens.filter((i) => i.tipo === "produto");
    const combos = itens.filter((i) => i.tipo === "combo").sort((a, b) => ordemSessao(a) - ordemSessao(b));
    const semSessao = [...(produtos.length ? [{ nome: "Produtos", itens: produtos }] : []), ...(combos.length ? [{ nome: "Combos", itens: combos }] : [])];
    return [...porSessao, { sessao: SEM_SESSAO, grupos: semSessao }].filter((s) => s.grupos.length > 0);
}

/** É produto (dentro de um combo)? Produto não tem sessão. */
export const componenteEhProduto = (c: ComponenteCombo) => c.categoria === "Produto";

/** Sessão de um componente do combo: a dele, ou a do combo; produto não tem. */
export const sessaoDoComponente = (combo: Combo, c: ComponenteCombo) => (componenteEhProduto(c) ? undefined : SESSAO_POR_ID[c.sessaoId ?? combo.sessaoId]);

/** Sessões de um item, em ordem: ingresso tem uma; combo, as dos ingressos dele; produto, nenhuma. */
export const sessoesDoItem = (item: ItemCatalogo): Sessao[] => {
    if (item.tipo === "produto") return [];
    if (item.tipo === "ingresso") return [SESSAO_POR_ID[item.sessaoId]].filter(Boolean);
    const ids = new Set(item.componentes.map((c) => sessaoDoComponente(item, c)?.id).filter(Boolean));
    if (ids.size === 0) ids.add(item.sessaoId);
    return SESSOES.filter((s) => ids.has(s.id));
};

/** Legenda de sessão: a primeira e "+N" quando há mais. */
export const legendaDeSessao = (item: ItemCatalogo, formato: "rotulo" | "curto" = "rotulo") => {
    const s = sessoesDoItem(item);
    if (s.length === 0) return undefined;
    return s[0][formato] + (s.length > 1 ? ` +${s.length - 1}` : "");
};

/** Quantas sessões diferentes os itens cobrem. */
export const contarSessoes = (itens: ItemCatalogo[]) => new Set(itens.flatMap((i) => sessoesDoItem(i).map((s) => s.id))).size;

/** Ordem e rótulo dos tipos. */
export const TIPOS_ITEM = [
    { tipo: "ingresso", titulo: "Ingressos" },
    { tipo: "produto", titulo: "Produtos" },
    { tipo: "combo", titulo: "Combos" },
] as const;

/** Separa os itens por tipo (só os presentes), na ordem por sessão e setor. */
export function separarPorTipo<T extends ItemCatalogo>(itens: T[]) {
    const ordenados = agruparPorSessao(itens).flatMap(({ grupos }) => grupos.flatMap((g) => g.itens));
    return TIPOS_ITEM.map(({ tipo, titulo }) => ({ tipo, titulo, itens: ordenados.filter((i) => i.tipo === tipo) })).filter((t) => t.itens.length > 0);
}

/** Estoque do item no evento: lotes do ingresso, estoque do produto, limite do combo (ou o do item que acaba primeiro). */
export const estoqueDoItem = (item: ItemCatalogo) => item.estoque;

/** Linha de apoio do item: o setor (ingresso e combo) ou a descrição do produto. */
export function apoioDoItem(item: ItemCatalogo) {
    if (item.tipo === "produto") return item.descricao;
    return item.grupo;
}
