/* ------------------------------------------------------------------ */
/*  Catálogo do Réveillon Carneiros — o evento vende APENAS combos.    */
/*  4 combos (NIGHT/FULL × FEMININO/MASCULINO). As sessões (festas)    */
/*  são metadados do que cada combo inclui — não há venda por sessão.  */
/* ------------------------------------------------------------------ */

export type Grupo = "NIGHT PASS" | "FULL PASS";
export type Genero = "FEMININO" | "MASCULINO";

export interface SessaoReveillon {
    id: string;
    label: string;
    descricao: string;
    data: string; // dd/mm/aaaa
}

/** As festas do Réveillon (dias de operação). */
export const SESSOES: SessaoReveillon[] = [
    { id: "s-2612-16", label: "26/12 16h", descricao: "Sáb · 26/12 · 16h00", data: "26/12/2026" },
    { id: "s-2712-16", label: "27/12 16h", descricao: "Dom · 27/12 · 16h00", data: "27/12/2026" },
    { id: "s-2712-22", label: "27/12 22h", descricao: "Dom · 27/12 · 22h00", data: "27/12/2026" },
    { id: "s-2812-16", label: "28/12 16h", descricao: "Seg · 28/12 · 16h00", data: "28/12/2026" },
    { id: "s-2812-22", label: "28/12 22h", descricao: "Seg · 28/12 · 22h00", data: "28/12/2026" },
    { id: "s-2912-16", label: "29/12 16h", descricao: "Ter · 29/12 · 16h00", data: "29/12/2026" },
    { id: "s-2912-22", label: "29/12 22h", descricao: "Ter · 29/12 · 22h00", data: "29/12/2026" },
    { id: "s-3012-16", label: "30/12 16h", descricao: "Qua · 30/12 · 16h00", data: "30/12/2026" },
    { id: "s-3112-20", label: "31/12 20h", descricao: "Qui · 31/12 · 20h00 · Réveillon", data: "31/12/2026" },
    { id: "s-0201-16", label: "02/01 16h", descricao: "Sáb · 02/01 · 16h00", data: "02/01/2027" },
    { id: "s-0201-22", label: "02/01 22h", descricao: "Sáb · 02/01 · 22h00", data: "02/01/2027" },
];

const NIGHT_SESSOES = ["s-2712-22", "s-2812-22", "s-2912-22", "s-3112-20", "s-0201-22"];
const FULL_SESSOES = SESSOES.map((s) => s.id);

export interface Combo {
    id: string;
    nome: string;
    grupo: Grupo;
    genero: Genero;
    /** Preço unitário do combo. */
    preco: number;
    /** Unidades vendidas (mock). */
    quantidade: number;
    /** Sessões (festas) incluídas no combo. */
    sessoes: string[];
}

/**
 * Dados de teste — propositalmente discrepantes da produção.
 * Masculino 268+176 = 444 · Feminino 242+154 = 396 · total 840 unidades.
 */
export const COMBOS: Combo[] = [
    { id: "night-masc", nome: "NIGHT PASS | MASCULINO", grupo: "NIGHT PASS", genero: "MASCULINO", preco: 3900, quantidade: 268, sessoes: NIGHT_SESSOES },
    { id: "night-fem", nome: "NIGHT PASS | FEMININO", grupo: "NIGHT PASS", genero: "FEMININO", preco: 3900, quantidade: 242, sessoes: NIGHT_SESSOES },
    { id: "full-masc", nome: "FULL PASS | MASCULINO", grupo: "FULL PASS", genero: "MASCULINO", preco: 9800, quantidade: 176, sessoes: FULL_SESSOES },
    { id: "full-fem", nome: "FULL PASS | FEMININO", grupo: "FULL PASS", genero: "FEMININO", preco: 9800, quantidade: 154, sessoes: FULL_SESSOES },
];

export function comboById(id: string) {
    return COMBOS.find((c) => c.id === id);
}

/** GMV (faturamento) de um combo. */
export const comboGmv = (c: Combo) => c.preco * c.quantidade;

/** Opções para filtros/seletores por combo. */
export const COMBO_OPTIONS = COMBOS.map((c) => ({ id: c.id, label: c.nome }));

/** Opções por grupo (NIGHT/FULL). */
export const GRUPO_OPTIONS = [
    { id: "NIGHT PASS", label: "NIGHT PASS" },
    { id: "FULL PASS", label: "FULL PASS" },
];

export const TOTAL_UNIDADES = COMBOS.reduce((s, c) => s + c.quantidade, 0);
export const TOTAL_GMV = COMBOS.reduce((s, c) => s + comboGmv(c), 0);
