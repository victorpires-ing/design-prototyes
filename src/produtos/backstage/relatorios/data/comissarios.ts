import { COMBOS } from "./produtos";

/* ------------------------------------------------------------------ */
/*  Comissários — vendas por combo. As colunas somam exatamente as     */
/*  quantidades de cada combo (o restante é venda orgânica).           */
/* ------------------------------------------------------------------ */

export const COMBO_COLS = COMBOS.map((c) => ({ id: c.id, nome: c.nome }));

export interface ComissarioRow {
    id: string;
    nome: string;
    /** vendas por combo id */
    vendas: Record<string, number>;
}

const mk = (id: string, nome: string, nm: number, nf: number, fm: number, ff: number): ComissarioRow => ({
    id,
    nome,
    vendas: { "night-masc": nm, "night-fem": nf, "full-masc": fm, "full-fem": ff },
});

export const COMISSARIOS: ComissarioRow[] = [
    mk("c-joao", "João Artur Fiúza", 39, 40, 22, 19),
    mk("c-ricardo", "Ricardo Almeida", 10, 9, 4, 2),
    mk("c-manuela", "Manuela Sales do Prado", 5, 5, 0, 1),
    mk("c-juan", "Juan Pablo Garrido", 2, 3, 2, 3),
    mk("c-itamar", "Itamar Batista", 4, 4, 0, 0),
    mk("c-victor", "Victor Lázaro de Souza", 0, 0, 3, 3),
    mk("c-pedro", "Pedro Alcântara", 1, 1, 3, 1),
    mk("c-antonio", "Antonio Marcos Vieira", 1, 5, 0, 0),
    mk("c-armando", "Armando José", 3, 0, 2, 1),
    mk("c-arthur", "Arthur Gabriel Júnior", 1, 1, 1, 2),
    mk("c-marina", "Marina Quadros", 1, 1, 1, 2),
    mk("c-wallas", "Wallas Baldacine", 1, 4, 0, 0),
    mk("c-diego", "Diego Iyra", 0, 0, 2, 3),
    mk("c-diogo", "Diogo Cordioli Felix", 3, 2, 0, 0),
    mk("c-rodrigo", "Rodrigo Melo", 0, 1, 0, 1),
    mk("c-felipe", "Felipe Henrique", 2, 0, 1, 0),
];

/** Total de um comissário (soma dos combos). */
export const totalComissario = (c: ComissarioRow) => COMBOS.reduce((s, combo) => s + (c.vendas[combo.id] ?? 0), 0);

/** Venda orgânica (sem comissário) por combo = quantidade do combo − soma dos comissários. */
export const ORGANICO: Record<string, number> = Object.fromEntries(
    COMBOS.map((combo) => {
        const vendidoComissarios = COMISSARIOS.reduce((s, c) => s + (c.vendas[combo.id] ?? 0), 0);
        return [combo.id, Math.max(0, combo.quantidade - vendidoComissarios)];
    }),
);

/** Total por combo considerando só comissários. */
export const totalComissariosPorCombo = (comboId: string) => COMISSARIOS.reduce((s, c) => s + (c.vendas[comboId] ?? 0), 0);

export const TOTAL_COMISSIONADAS = COMBOS.reduce((s, c) => s + totalComissariosPorCombo(c.id), 0);
export const TOTAL_ORGANICAS = COMBOS.reduce((s, c) => s + ORGANICO[c.id], 0);

/** Faturamento (unidades × preço do combo). */
export const gmvComissionadas = COMBOS.reduce((s, c) => s + totalComissariosPorCombo(c.id) * c.preco, 0);
export const gmvOrganicas = COMBOS.reduce((s, c) => s + ORGANICO[c.id] * c.preco, 0);
