/* ------------------------------------------------------------------ */
/*  Catálogo do Réveillon Carneiros — 3 DIMENSÕES DISTINTAS:           */
/*                                                                     */
/*   1. Ingresso  — hierarquia grupo > ingresso > lote.                */
/*   2. Combo     — bundle que agrupa vários ingressos (fixo/dinâmico).*/
/*   3. Produto   — item avulso (foto, nome, descrição, preço, qtd).   */
/*                                                                     */
/*  As três são contabilizadas separadamente nos relatórios.          */
/*  Dados de teste propositalmente discrepantes da produção.          */
/* ------------------------------------------------------------------ */

export type Passe = "NIGHT PASS" | "FULL PASS";
export type Genero = "FEMININO" | "MASCULINO";
export type ComboTipo = "fixo" | "dinamico";
export type Area = "Mouton" | "Night";

/* ------------------------------------------------------------------ */
/*  Sessões (festas)                                                   */
/* ------------------------------------------------------------------ */

export interface Sessao {
    id: string;
    label: string;
    descricao: string;
    data: string; // dd/mm/aaaa
    area: Area;
}

const mkSessao = (id: string, label: string, descricao: string, data: string): Sessao => ({
    id,
    label,
    descricao,
    data,
    area: label.includes("16h") ? "Mouton" : "Night",
});

/** As festas do Réveillon (dias de operação). */
export const SESSOES: Sessao[] = [
    mkSessao("s-2612-16", "26/12 16h", "Sáb · 26/12 · 16h00", "26/12/2026"),
    mkSessao("s-2712-16", "27/12 16h", "Dom · 27/12 · 16h00", "27/12/2026"),
    mkSessao("s-2712-22", "27/12 22h", "Dom · 27/12 · 22h00", "27/12/2026"),
    mkSessao("s-2812-16", "28/12 16h", "Seg · 28/12 · 16h00", "28/12/2026"),
    mkSessao("s-2812-22", "28/12 22h", "Seg · 28/12 · 22h00", "28/12/2026"),
    mkSessao("s-2912-16", "29/12 16h", "Ter · 29/12 · 16h00", "29/12/2026"),
    mkSessao("s-2912-22", "29/12 22h", "Ter · 29/12 · 22h00", "29/12/2026"),
    mkSessao("s-3012-16", "30/12 16h", "Qua · 30/12 · 16h00", "30/12/2026"),
    mkSessao("s-3112-20", "31/12 20h", "Qui · 31/12 · 20h00 · Réveillon", "31/12/2026"),
    mkSessao("s-0201-16", "02/01 16h", "Sáb · 02/01 · 16h00", "02/01/2027"),
    mkSessao("s-0201-22", "02/01 22h", "Sáb · 02/01 · 22h00", "02/01/2027"),
];

const NIGHT_SESSOES = ["s-2712-22", "s-2812-22", "s-2912-22", "s-3112-20", "s-0201-22"];
export const sessaoById = (id: string) => SESSOES.find((s) => s.id === id);

/* ------------------------------------------------------------------ */
/*  1. INGRESSO — grupo > ingresso > lote                              */
/* ------------------------------------------------------------------ */

export interface Lote {
    id: string;
    nome: string;
    preco: number;
    /** Vendas diretas do ingresso neste lote (fora de combo). */
    quantidade: number;
}

export interface Ingresso {
    id: string;
    nome: string; // "Masculino" | "Feminino"
    grupoId: string;
    genero: Genero;
    lotes: Lote[];
    /** Unidades entregues via combos (derivado dos combos que o incluem). */
    quantidade: number;
    /** Vendas diretas do ingresso (fora de combo) — soma dos lotes. */
    vendaDireta: number;
}

export interface Grupo {
    id: string;
    nome: string; // "Réveillon 31/12", "Mouton 26/12", ...
    sessaoId: string;
    area: Area;
}

const nomeGrupo = (s: Sessao) => `${s.area} · ${s.label.replace(/ \d+h$/, "")}`;

/** Um grupo por festa (cada grupo pertence a uma sessão). */
export const GRUPOS: Grupo[] = SESSOES.map((s) => ({
    id: `g-${s.id}`,
    nome: nomeGrupo(s),
    sessaoId: s.id,
    area: s.area,
}));

export const grupoById = (id: string) => GRUPOS.find((g) => g.id === id);

/** Preço-base de referência do lote por área (o combo tem preço próprio). */
const LOTE_BASE: Record<Area, number> = { Night: 780, Mouton: 520 };
/** Vendas diretas de ingresso (fora de combo), por área. */
const DIRETA_BASE: Record<Area, number> = { Night: 58, Mouton: 33 };

const mkIngresso = (grupo: Grupo, genero: Genero): Ingresso => {
    const g = genero === "MASCULINO" ? "m" : "f";
    const base = LOTE_BASE[grupo.area];
    const id = `i-${grupo.sessaoId}-${g}`;
    const direta = DIRETA_BASE[grupo.area] - (genero === "FEMININO" ? 6 : 0);
    const q1 = Math.round(direta * 0.6);
    const q2 = direta - q1;
    return {
        id,
        nome: genero === "MASCULINO" ? "Masculino" : "Feminino",
        grupoId: grupo.id,
        genero,
        lotes: [
            { id: `${id}-l1`, nome: "1º lote", preco: base, quantidade: q1 },
            { id: `${id}-l2`, nome: "2º lote", preco: Math.round(base * 1.25), quantidade: q2 },
        ],
        quantidade: 0, // preenchido após os combos
        vendaDireta: direta,
    };
};

/** Ingressos: Masculino + Feminino por grupo. */
export const INGRESSOS: Ingresso[] = GRUPOS.flatMap((g) => [mkIngresso(g, "MASCULINO"), mkIngresso(g, "FEMININO")]);

export const ingressoById = (id: string) => INGRESSOS.find((i) => i.id === id);

const ingressosDo = (sessaoIds: string[], genero: Genero) =>
    sessaoIds.map((sid) => `i-${sid}-${genero === "MASCULINO" ? "m" : "f"}`);

/* ------------------------------------------------------------------ */
/*  2. COMBO — bundle de ingressos                                     */
/* ------------------------------------------------------------------ */

export interface ComboRegras {
    /** Mínimo/máximo de itens (combo dinâmico). */
    min: number;
    max: number;
    /** Ingressos obrigatórios (combo dinâmico). */
    obrigatorios: string[];
}

/** Lote do combo (faixa de preço no tempo). */
export interface ComboLote {
    id: string;
    nome: string;
    preco: number;
    quantidade: number;
}

export interface Combo {
    id: string;
    nome: string;
    passe: Passe;
    genero: Genero;
    tipo: ComboTipo;
    /** Preço unitário médio do combo (ponderado pelos lotes). */
    preco: number;
    /** Combos vendidos (soma dos lotes). */
    quantidade: number;
    /** Lotes do combo. */
    lotes: ComboLote[];
    /** Ingressos que o combo agrupa (ids). */
    itens: string[];
    /** Regras (apenas combos dinâmicos). */
    regras?: ComboRegras;
    /** Sessões (festas) cobertas — derivado dos itens. */
    sessoes: string[];
}

const TODAS_SESSOES = SESSOES.map((s) => s.id);

interface ComboDef {
    id: string;
    nome: string;
    passe: Passe;
    genero: Genero;
    tipo: ComboTipo;
    preco: number;
    quantidade: number;
    festas: string[];
    regras?: ComboRegras;
}

/**
 * Combos vendidos (todos fixos aqui). O tipo suporta dinâmico (regras).
 * Masculino 268+176 = 444 · Feminino 242+154 = 396 · total 840 combos.
 */
const COMBO_DEFS: ComboDef[] = [
    { id: "night-masc", nome: "NIGHT PASS | MASCULINO", passe: "NIGHT PASS", genero: "MASCULINO", tipo: "fixo", preco: 3900, quantidade: 268, festas: NIGHT_SESSOES },
    { id: "night-fem", nome: "NIGHT PASS | FEMININO", passe: "NIGHT PASS", genero: "FEMININO", tipo: "fixo", preco: 3900, quantidade: 242, festas: NIGHT_SESSOES },
    { id: "full-masc", nome: "FULL PASS | MASCULINO", passe: "FULL PASS", genero: "MASCULINO", tipo: "fixo", preco: 9800, quantidade: 176, festas: TODAS_SESSOES },
    { id: "full-fem", nome: "FULL PASS | FEMININO", passe: "FULL PASS", genero: "FEMININO", tipo: "fixo", preco: 9800, quantidade: 154, festas: TODAS_SESSOES },
];

// Distribui a quantidade do combo em lotes (faixas de preço no tempo).
const mkComboLotes = (comboId: string, base: number, qtd: number): ComboLote[] => {
    const dist = [0.55, 0.3, 0.15];
    const fatores = [1, 1.06, 1.12];
    let acc = 0;
    return dist.map((frac, idx) => {
        const q = idx === dist.length - 1 ? qtd - acc : Math.round(qtd * frac);
        acc += q;
        return { id: `${comboId}-l${idx + 1}`, nome: `${idx + 1}º lote`, preco: Math.round(base * fatores[idx]), quantidade: q };
    });
};

export const COMBOS: Combo[] = COMBO_DEFS.map((d) => {
    const itens = ingressosDo(d.festas, d.genero);
    const lotes = mkComboLotes(d.id, d.preco, d.quantidade);
    const quantidade = lotes.reduce((s, l) => s + l.quantidade, 0);
    const gmv = lotes.reduce((s, l) => s + l.preco * l.quantidade, 0);
    return {
        id: d.id,
        nome: d.nome,
        passe: d.passe,
        genero: d.genero,
        tipo: d.tipo,
        preco: Math.round(gmv / quantidade), // unitário médio
        quantidade,
        lotes,
        itens,
        regras: d.regras,
        sessoes: d.festas,
    };
});

// Deriva a quantidade de cada ingresso a partir dos combos que o incluem.
for (const combo of COMBOS) {
    for (const iid of combo.itens) {
        const ing = ingressoById(iid);
        if (ing) ing.quantidade += combo.quantidade;
    }
}

export const comboById = (id: string) => COMBOS.find((c) => c.id === id);

/** Ingressos (objetos) que um combo agrupa. */
export const comboIngressos = (c: Combo): Ingresso[] => c.itens.map((id) => ingressoById(id)).filter(Boolean) as Ingresso[];

/** GMV (faturamento) de um combo — soma dos lotes. */
export const comboGmv = (c: Combo) => c.lotes.reduce((s, l) => s + l.preco * l.quantidade, 0);

/* ------------------------------------------------------------------ */
/*  3. PRODUTO — item avulso                                           */
/* ------------------------------------------------------------------ */

export interface Produto {
    id: string;
    nome: string;
    descricao: string;
    foto: string;
    preco: number;
    quantidade: number;
}

const fotoProduto = (seed: string) => `https://picsum.photos/seed/${seed}/96/96`;

export const PRODUTOS: Produto[] = [
    { id: "camiseta", nome: "Camiseta Réveillon Carneiros", descricao: "Algodão, estampa oficial 2027", foto: fotoProduto("camiseta"), preco: 120, quantidade: 312 },
    { id: "copo", nome: "Copo Ecológico Oficial", descricao: "Copo reutilizável 500ml", foto: fotoProduto("copo"), preco: 45, quantidade: 528 },
    { id: "kit-brinde", nome: "Kit Boas-Festas", descricao: "Necessaire + adesivos + chaveiro", foto: fotoProduto("kit"), preco: 89, quantidade: 143 },
    { id: "abadade", nome: "Abadá Premium", descricao: "Abadá exclusivo da virada", foto: fotoProduto("abada"), preco: 210, quantidade: 97 },
];

export const produtoById = (id: string) => PRODUTOS.find((p) => p.id === id);
export const produtoGmv = (p: Produto) => p.preco * p.quantidade;

/* ------------------------------------------------------------------ */
/*  Opções para filtros/seletores                                      */
/* ------------------------------------------------------------------ */

export const COMBO_OPTIONS = COMBOS.map((c) => ({ id: c.id, label: c.nome }));
export const PASSE_OPTIONS = [
    { id: "NIGHT PASS", label: "NIGHT PASS" },
    { id: "FULL PASS", label: "FULL PASS" },
];
export const PRODUTO_OPTIONS = PRODUTOS.map((p) => ({ id: p.id, label: p.nome }));

/* ------------------------------------------------------------------ */
/*  Agregados                                                          */
/* ------------------------------------------------------------------ */

/** Combos vendidos. */
export const TOTAL_UNIDADES = COMBOS.reduce((s, c) => s + c.quantidade, 0);
/** Faturamento em combos. */
export const TOTAL_GMV = COMBOS.reduce((s, c) => s + comboGmv(c), 0);
/** Ingressos entregues (soma dos itens dos combos vendidos). */
export const TOTAL_INGRESSOS = COMBOS.reduce((s, c) => s + c.quantidade * c.itens.length, 0);
/** Produtos vendidos e faturamento em produtos. */
export const TOTAL_PRODUTOS = PRODUTOS.reduce((s, p) => s + p.quantidade, 0);
export const TOTAL_GMV_PRODUTOS = PRODUTOS.reduce((s, p) => s + produtoGmv(p), 0);
