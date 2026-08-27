/* ------------------------------------------------------------------ */
/*  Catálogo mock do quiosque.                                         */
/*                                                                     */
/*  Mesma gramática do balcão de fast-food que serve de referência:     */
/*  categoria → item → complemento. Aqui: grupo → ingresso/lote →       */
/*  meia-entrada e titular.                                            */
/* ------------------------------------------------------------------ */

export interface ItemQuiosque {
    id: string;
    nome: string;
    /** Lote ou variação — a linha fina abaixo do nome. */
    lote: string;
    preco: number;
    imagem: string;
    /** Item esgotado continua visível, como no balcão: some, ninguém entende. */
    esgotado?: boolean;
    /** Aceita meia-entrada — habilita o passo "Personalizar" da sacola. */
    meia?: boolean;
}

export interface CategoriaQuiosque {
    id: string;
    nome: string;
    /** Rótulo grande da seção, quebrado em duas linhas como na referência. */
    titulo: [string, string];
    imagem: string;
    /** Selo opcional no card (ex.: desconto). */
    selo?: string;
    /** Tom que banha o topo da tela quando a categoria está ativa. */
    tint: string;
    /** Cor de preenchimento do card ativo. */
    solid: string;
    itens: ItemQuiosque[];
}

const foto = (seed: string) => `https://picsum.photos/seed/${seed}/240`;

export const CATEGORIAS: CategoriaQuiosque[] = [
    {
        id: "combos",
        nome: "Combos",
        titulo: ["Combos", "do evento"],
        imagem: foto("combo-evento"),
        selo: "-20%",
        tint: "var(--color-utility-brand-100)",
        solid: "var(--color-utility-brand-600)",
        itens: [
            { id: "c1", nome: "Combo Família", lote: "2 inteiras + 2 meias", preco: 260, imagem: foto("combo-familia") },
            { id: "c2", nome: "Combo Casal", lote: "2 inteiras + 1 copo", preco: 190, imagem: foto("combo-casal") },
            { id: "c3", nome: "Combo VIP", lote: "Camarote + camiseta", preco: 420, imagem: foto("combo-vip") },
        ],
    },
    {
        id: "pista",
        nome: "Pista",
        titulo: ["Pista", "e Pista Premium"],
        imagem: foto("pista-show"),
        tint: "var(--color-utility-orange-100)",
        solid: "var(--color-utility-orange-500)",
        itens: [
            { id: "p1", nome: "Pista", lote: "1º lote", preco: 100, imagem: foto("pista-1"), meia: true },
            { id: "p2", nome: "Pista", lote: "2º lote", preco: 120, imagem: foto("pista-2"), meia: true },
            { id: "p3", nome: "Pista Premium", lote: "1º lote", preco: 180, imagem: foto("pista-premium"), meia: true },
            { id: "p4", nome: "Pista", lote: "Promocional", preco: 80, imagem: foto("pista-promo"), esgotado: true },
            { id: "p5", nome: "Pista Premium", lote: "2º lote", preco: 210, imagem: foto("pista-prem-2"), meia: true },
            { id: "p6", nome: "Pista", lote: "Último lote", preco: 140, imagem: foto("pista-ultimo"), meia: true },
        ],
    },
    {
        id: "camarote",
        nome: "Camarote",
        titulo: ["Camarote", "e Lounge"],
        imagem: foto("camarote-vip"),
        tint: "var(--color-utility-amber-100)",
        solid: "var(--color-utility-amber-500)",
        itens: [
            { id: "k1", nome: "Camarote", lote: "1º lote", preco: 320, imagem: foto("camarote-1"), meia: true },
            { id: "k2", nome: "Camarote Open Bar", lote: "1º lote", preco: 480, imagem: foto("camarote-open") },
            { id: "k3", nome: "Lounge", lote: "Mesa para 4", preco: 1200, imagem: foto("lounge-mesa") },
        ],
    },
    {
        id: "produtos",
        nome: "Produtos",
        titulo: ["Produtos", "oficiais"],
        imagem: foto("camiseta-oficial"),
        tint: "var(--color-utility-blue-100)",
        solid: "var(--color-utility-blue-600)",
        itens: [
            { id: "o1", nome: "Camiseta oficial", lote: "Unissex", preco: 119.9, imagem: foto("camiseta-unissex") },
            { id: "o2", nome: "Copo colecionável", lote: "500 ml", preco: 39.9, imagem: foto("copo-500") },
            { id: "o3", nome: "Boné", lote: "Tamanho único", preco: 89.9, imagem: foto("bone-evento") },
        ],
    },
    {
        id: "bebidas",
        nome: "Bebidas",
        titulo: ["Bebidas", "e consumação"],
        imagem: foto("bebida-copo"),
        tint: "var(--color-utility-purple-100)",
        solid: "var(--color-utility-purple-600)",
        itens: [
            { id: "b1", nome: "Cartão consumação", lote: "R$ 50 de crédito", preco: 50, imagem: foto("cartao-consumo") },
            { id: "b2", nome: "Cartão consumação", lote: "R$ 100 de crédito", preco: 100, imagem: foto("cartao-consumo-100") },
        ],
    },
    {
        id: "estacionamento",
        nome: "Estacionamento",
        titulo: ["Estacionamento", "no local"],
        imagem: foto("estacionamento-evento"),
        tint: "var(--color-utility-emerald-100)",
        solid: "var(--color-utility-emerald-600)",
        itens: [{ id: "e1", nome: "Vaga coberta", lote: "Válida no dia", preco: 60, imagem: foto("vaga-coberta") }],
    },
];

export const ITENS_POR_ID = Object.fromEntries(CATEGORIAS.flatMap((c) => c.itens).map((i) => [i.id, i]));

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
