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

/**
 * Nome da cobrança acessória padrão. O nome viaja junto do valor porque o
 * fluxo tem mais de uma cobrança: ingresso paga taxa de serviço e produto paga
 * taxa de licenciamento, em alíquotas diferentes. Exibir uma com o nome da
 * outra é cobrança não informada, e dá ao comprador a impressão de taxa em
 * duplicidade quando ele compara com o contrato.
 */
export const TAXA_SERVICO = "Taxa de serviço";

/** Agregado de cobranças com nomes diferentes: só o plural é verdadeiro. */
const TAXAS_MISTAS = "Taxas";

/** Valor decomposto. `total` é sempre o que a pessoa paga. */
export interface Preco {
    face: number;
    taxa: number;
    total: number;
    /** Como esta cobrança se chama. Ausente quando `taxa` é zero. */
    nomeTaxa?: string;
}

export const PRECO_ZERO: Preco = { face: 0, taxa: 0, total: 0 };

/**
 * Face do ingresso com benefício, sempre derivada da base (art. 9º).
 * FLOOR em centavos garante `2 × totalMeia <= totalInteira` em qualquer face.
 */
export const faceBeneficio = (faceBase: number, percentual = 0.5) => floorCent(faceBase * percentual);

/** Taxa por UNIDADE. O agregado é soma de unitárias, nunca recálculo. */
export const precoComTaxa = (face: number, aliquota: number, nomeTaxa = TAXA_SERVICO): Preco => {
    const taxa = cent(face * Math.max(0, aliquota));
    return taxa > 0 ? { face, taxa, total: cent(face + taxa), nomeTaxa } : { face, taxa: 0, total: face };
};

/** Nada a acrescentar: ou não há cobrança acessória, ou ela já está no preço. */
export const precoSemTaxa = (face: number): Preco => ({ face, taxa: 0, total: face });

/**
 * Preço de produto. A cobrança acessória do produto NÃO é a taxa de serviço do
 * ingresso: tem alíquota própria, nome próprio em contrato e, na maioria dos
 * casos hoje, é embutida — já dentro do valor anunciado, sem linha separada.
 * Embutida não é cobrança oculta: o número exibido é o número pago (art. 7º).
 */
export const precoDoProduto = (face: number, taxa: { aliquota: number; nome: string; modo: "embutida" | "destacada" }): Preco =>
    taxa.modo === "destacada" ? precoComTaxa(face, taxa.aliquota, taxa.nome) : precoSemTaxa(face);

/** Escala um valor avulso por quantidade, em centavos exatos. */
export const escalar = (valor: number, qtd: number) => cent(valor * qtd);

export const multiplicar = (p: Preco, qtd: number): Preco => ({
    face: cent(p.face * qtd),
    taxa: cent(p.taxa * qtd),
    total: cent(p.total * qtd),
    nomeTaxa: p.nomeTaxa,
});

export const somar = (precos: Preco[]): Preco =>
    precos.reduce((acc, p) => {
        // Nomes divergentes viram plural: a barra de total não pode batizar a
        // soma de duas cobranças com o nome de uma delas.
        const nomeTaxa = p.taxa <= 0 ? acc.nomeTaxa : !acc.nomeTaxa || acc.nomeTaxa === p.nomeTaxa ? p.nomeTaxa : TAXAS_MISTAS;
        return { face: cent(acc.face + p.face), taxa: cent(acc.taxa + p.taxa), total: cent(acc.total + p.total), nomeTaxa };
    }, PRECO_ZERO);

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
 * A taxa incide sobre o conjunto, produtos inclusive.
 */
export const precoDoCombo = (base: number, extras: number[], aliquota: number): Preco =>
    precoComTaxa(base + extras.reduce((a, v) => a + v, 0), aliquota);

/** Nome a imprimir para a parcela acessória deste valor. */
export const nomeDaTaxa = (p: Preco) => p.nomeTaxa ?? TAXA_SERVICO;

/**
 * Linha de composição: só a taxa, nomeada e entre parênteses. O número
 * dominante passou a ser o valor do ingresso, então a parcela que precisa de
 * rótulo é a taxa, não a face.
 */
export const legendaTaxa = (p: Preco): string | null => (p.taxa > 0 ? `(${nomeDaTaxa(p)} ${brl(p.taxa)})` : null);


/**
 * Rótulo acessível do bloco de preço. O sinal "+" não é anunciado de forma
 * confiável em pt-BR, então o leitor de tela recebe a frase por extenso e os
 * spans visuais ficam aria-hidden.
 */
export const ariaPreco = (p: Preco, qtd = 1, comTaxa = true): string => {
    const total = multiplicar(p, qtd);
    if (!comTaxa || total.taxa <= 0) return brl(total.face);
    return `${brl(total.face)}, mais ${brl(total.taxa)} de ${nomeDaTaxa(total).toLowerCase()}`;
};

/** Percentual exibível a partir da alíquota. Só aparece ao lado do valor absoluto. */
export const percentual = (aliquota: number) => {
    const n = aliquota * 100;
    return `${Number.isInteger(n) ? n : n.toFixed(1).replace(".", ",")}%`;
};
