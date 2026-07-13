/* ------------------------------------------------------------------ */
/*  Dados demográficos e geográficos do público (mock).               */
/*  Base: ~447 compradores do evento (coerente com os demais mocks).  */
/* ------------------------------------------------------------------ */

export interface RegiaoDado {
    /** Para países: id numérico ISO 3166-1 (bate com o world-atlas).
     *  Para estados: sigla UF (bate com a malha do Brasil). */
    code: string;
    nome: string;
    masculino: number;
    feminino: number;
}

export interface FaixaIdade {
    faixa: string;
    masculino: number;
    feminino: number;
}

export interface MetodoPagamento {
    metodo: string;
    valor: number;
}

/* ---- Gênero (total) — coerente com os combos (444 M / 396 F = 840). ---- */
export const GENERO = { masculino: 444, feminino: 396 };
export const TOTAL_COMPRADORES = GENERO.masculino + GENERO.feminino;

/* ---- Gênero por faixa etária ---- */
export const IDADE: FaixaIdade[] = [
    { faixa: "18–24", masculino: 58, feminino: 62 },
    { faixa: "25–34", masculino: 201, feminino: 176 },
    { faixa: "35–44", masculino: 128, feminino: 104 },
    { faixa: "45–54", masculino: 34, feminino: 28 },
    { faixa: "55–64", masculino: 9, feminino: 8 },
    { faixa: "65+", masculino: 2, feminino: 1 },
    { faixa: "Não informado", masculino: 12, feminino: 17 },
];

/* ---- Países (code = id numérico ISO, para o mapa-múndi) ---- */
export const PAISES: RegiaoDado[] = [
    { code: "076", nome: "Brasil", masculino: 188, feminino: 177 },
    { code: "840", nome: "Estados Unidos", masculino: 14, feminino: 12 },
    { code: "032", nome: "Argentina", masculino: 6, feminino: 5 },
    { code: "152", nome: "Chile", masculino: 5, feminino: 5 },
    { code: "276", nome: "Alemanha", masculino: 4, feminino: 2 },
    { code: "756", nome: "Suíça", masculino: 3, feminino: 2 },
    { code: "826", nome: "Reino Unido", masculino: 2, feminino: 2 },
    { code: "124", nome: "Canadá", masculino: 3, feminino: 1 },
    { code: "380", nome: "Itália", masculino: 3, feminino: 1 },
    { code: "724", nome: "Espanha", masculino: 2, feminino: 1 },
];

/* ---- Estados (code = sigla UF, para o mapa do Brasil) ---- */
export const ESTADOS: RegiaoDado[] = [
    { code: "SP", nome: "São Paulo", masculino: 66, feminino: 61 },
    { code: "MG", nome: "Minas Gerais", masculino: 19, feminino: 18 },
    { code: "RJ", nome: "Rio de Janeiro", masculino: 16, feminino: 15 },
    { code: "GO", nome: "Goiás", masculino: 14, feminino: 12 },
    { code: "PR", nome: "Paraná", masculino: 11, feminino: 10 },
    { code: "DF", nome: "Distrito Federal", masculino: 8, feminino: 7 },
    { code: "PA", nome: "Pará", masculino: 7, feminino: 6 },
    { code: "PE", nome: "Pernambuco", masculino: 7, feminino: 6 },
    { code: "SC", nome: "Santa Catarina", masculino: 7, feminino: 6 },
    { code: "BA", nome: "Bahia", masculino: 6, feminino: 4 },
    { code: "RS", nome: "Rio Grande do Sul", masculino: 5, feminino: 4 },
    { code: "CE", nome: "Ceará", masculino: 4, feminino: 3 },
    { code: "ES", nome: "Espírito Santo", masculino: 3, feminino: 2 },
    { code: "MT", nome: "Mato Grosso", masculino: 2, feminino: 2 },
    { code: "AM", nome: "Amazonas", masculino: 2, feminino: 1 },
];

/* ---- Método de pagamento (donut) ---- */
export const PAGAMENTO: MetodoPagamento[] = [
    { metodo: "Cartão de Crédito", valor: 298 },
    { metodo: "Pix", valor: 96 },
    { metodo: "Apple Pay", valor: 24 },
    { metodo: "NuPay", valor: 15 },
    { metodo: "Google Pay", valor: 9 },
    { metodo: "Cartão de Débito", valor: 5 },
];
