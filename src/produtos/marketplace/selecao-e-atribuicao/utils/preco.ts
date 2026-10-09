/* ------------------------------------------------------------------ */
/*  Preço com taxa acessória — Decreto nº 13.108/2026                 */
/*                                                                     */
/*  Fonte única de dinheiro do fluxo: nenhum componente faz conta de   */
/*  valor fora daqui. A API não expõe nenhum caminho que aceite        */
/*  (subtotal, alíquota), porque recalcular a taxa sobre o subtotal    */
/*  faz o detalhamento deixar de fechar com o total (art. 7º).        */
/* ------------------------------------------------------------------ */

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Arredonda para centavo. Number.EPSILON evita 1.005 virar 1.00. */
const cent = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const floorCent = (n: number) => Math.floor(n * 100 + 1e-9) / 100;

/** Valor decomposto. `total` é sempre o que a pessoa paga. */
export interface Preco {
    face: number;
    taxa: number;
    total: number;
}

export const PRECO_ZERO: Preco = { face: 0, taxa: 0, total: 0 };

/**
 * Face do ingresso com benefício, sempre derivada da base (art. 9º).
 * FLOOR em centavos garante `2 × totalMeia <= totalInteira` em qualquer face.
 */
export const faceBeneficio = (faceBase: number, percentual = 0.5) => floorCent(faceBase * percentual);

/** Taxa por UNIDADE. O agregado é soma de unitárias, nunca recálculo. */
export const precoComTaxa = (face: number, aliquota: number): Preco => {
    const taxa = cent(face * Math.max(0, aliquota));
    return { face, taxa, total: cent(face + taxa) };
};

/** Produto não tem taxa acessória: o decreto trata de ingresso. */
export const precoSemTaxa = (face: number): Preco => ({ face, taxa: 0, total: face });

export const multiplicar = (p: Preco, qtd: number): Preco => ({
    face: cent(p.face * qtd),
    taxa: cent(p.taxa * qtd),
    total: cent(p.total * qtd),
});

export const somar = (precos: Preco[]): Preco =>
    precos.reduce(
        (acc, p) => ({ face: cent(acc.face + p.face), taxa: cent(acc.taxa + p.taxa), total: cent(acc.total + p.total) }),
        PRECO_ZERO,
    );

/**
 * Rateia um valor por pesos preservando a soma exata.
 * Resíduo de arredondamento vai na última posição, então a lista de
 * sub-linhas sempre fecha com o total exibido acima dela.
 */
export const ratear = (valor: number, pesos: number[]): number[] => {
    const somaPesos = pesos.reduce((a, p) => a + p, 0);
    if (pesos.length === 0) return [];
    if (somaPesos <= 0) {
        const parte = floorCent(valor / pesos.length);
        const partes = pesos.map(() => parte);
        partes[partes.length - 1] = cent(valor - parte * (pesos.length - 1));
        return partes;
    }
    const partes = pesos.map((p) => floorCent((valor * p) / somaPesos));
    const distribuido = partes.slice(0, -1).reduce((a, p) => a + p, 0);
    partes[partes.length - 1] = cent(valor - distribuido);
    return partes;
};

/**
 * Preço de um combo: valor do pacote mais os opcionais escolhidos.
 *
 * A taxa incide só sobre a parte de ingresso. Produto dentro de combo entra
 * sem taxa, senão a mesma camisa custaria R$ 119,90 avulsa e R$ 143,88 no
 * combo, que é a incoerência de preço que este desenho existe para eliminar.
 */
export const precoDoCombo = (
    base: number,
    extras: { isProduto?: boolean; valor: number }[],
    aliquota: number,
): Preco => {
    const deIngresso = extras.reduce((a, e) => (e.isProduto ? a : a + e.valor), 0);
    const deProduto = extras.reduce((a, e) => (e.isProduto ? a + e.valor : a), 0);
    return somar([precoComTaxa(base + deIngresso, aliquota), precoSemTaxa(deProduto)]);
};

/**
 * Linha de composição. O valor da taxa aparece sempre em reais e nunca em
 * percentual: no formato
 * particionado o consumidor ancora no primeiro número, e o efeito é maior
 * quando a sobretaxa aparece como "+20%".
 *
 * Devolve null quando não há taxa (produto, cortesia): a ausência é
 * discriminada uma vez por seção, não repetida em cada linha.
 */
export const legendaPreco = (p: Preco, forma: "curta" | "completa" = "curta", base = "ingresso"): string | null =>
    p.taxa > 0 ? `(${base} + ${brl(p.taxa)} de taxa${forma === "completa" ? " de serviço" : ""})` : null;

/** Composição de uma linha com várias unidades: `2 × R$ 403,20, inclui R$ 134,40 de taxa`. */
export const legendaMultipla = (unit: Preco, qtd: number, base = "ingresso"): string | null => {
    if (qtd <= 1) return legendaPreco(unit, "curta", base);
    const sub = multiplicar(unit, qtd);
    const linha = `${qtd} × ${brl(unit.total)}`;
    return sub.taxa > 0 ? `${linha} (inclui ${brl(sub.taxa)} de taxa)` : linha;
};

/**
 * Rótulo acessível do bloco de preço. O sinal "+" não é anunciado de forma
 * confiável em pt-BR, então o leitor de tela recebe a frase por extenso e os
 * spans visuais ficam aria-hidden.
 */
export const ariaPreco = (p: Preco, qtd = 1): string => {
    const total = multiplicar(p, qtd);
    if (total.taxa <= 0) return brl(total.total);
    return `${brl(total.total)}, sendo ${brl(total.face)} de ingresso mais ${brl(total.taxa)} de taxa de serviço`;
};

/** Percentual exibível a partir da alíquota. Só aparece ao lado do valor absoluto. */
export const percentual = (aliquota: number) => {
    const n = aliquota * 100;
    return `${Number.isInteger(n) ? n : n.toFixed(1).replace(".", ",")}%`;
};
