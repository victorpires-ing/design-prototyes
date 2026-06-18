/* ------------------------------------------------------------------ */
/*  Modelo do evento — cadastros centrais (datas, ingressos, produtos) */
/*  reaproveitados por datas-de-venda e combos via referência (ids).   */
/* ------------------------------------------------------------------ */

/** Item unificado em tempo de execução (modal e listas por data). */
export interface Item {
    id: string;
    nome: string;
    descricao?: string;
    preco?: number;
    imagem?: string;
    obrigatorio?: boolean;
    /** Exibe o preço deste item na seleção do combo. */
    mostrarPreco?: boolean;
}

/** Catálogo: ingresso. */
export interface Ingresso {
    id: string;
    nome: string;
    descricao?: string;
    preco?: number;
}

/** Catálogo: produto (tem imagem). */
export interface Produto {
    id: string;
    nome: string;
    imagem?: string;
    preco?: number;
}

/** Data do evento; referencia ids do catálogo para venda avulsa por data. */
export interface DataEvento {
    id: string;
    iso?: string; // valor do seletor datetime-local (origem dos campos abaixo)
    diaSemana: string;
    dia: string;
    mes: string;
    ano: string;
    hora?: string;
    itens: string[]; // ids de ingressos (ordenados)
    produtos: string[]; // ids de produtos (ordenados)
}

/* ---- Combo fixo ---- */
export interface ComboFixoInclui {
    id: string;
    titulo: string;
    sub?: string;
    descricao?: string;
    qtd: number;
}
export interface ComboFixo {
    id: string;
    tab: string;
    nome: string;
    lote?: string;
    descricao?: string;
    preco: number;
    inclui: ComboFixoInclui[];
}

/* ---- Combo dinâmico (referencia catálogo) ---- */
export interface ComboDinamico {
    id: string;
    nome: string;
    desconto?: string;
    descricao?: string;
    dataLabel: string;
    sessoesLabel: string;
    tags: string[];
    minItens: number;
    maxItens: number;
    datas: string[]; // ids de datas (sessões) — os itens são herdados de cada data
    obrigatorios: string[]; // ids de itens herdados marcados como obrigatórios
    precoVisivel: string[]; // ids de itens herdados cujo preço aparece na seleção
}

/* ---- Estruturas em tempo de execução para o modal ---- */
export interface ComboSessao {
    id: string;
    data: string;
    hora: string;
    itens: Item[];
}
export interface ComboDinamicoView {
    id: string;
    nome: string;
    minItens: number;
    maxItens: number;
    sessoes: ComboSessao[];
}

export type TipoPergunta = "texto-curto" | "texto-longo" | "escolha-unica" | "multipla-escolha";
export interface PerguntaEvento {
    id: string;
    titulo: string;
    tipo: TipoPergunta;
    obrigatoria: boolean;
    vinculos: string[]; // ids de ingressos/produtos/combos
}

export interface Cupom {
    codigo: string;
    ajuda: string;
}

/** O que aparece na tela de venda. */
export interface Exibir {
    datas: boolean;
    combosFixos: boolean;
    combosDinamicos: boolean;
}

/* ------------------------------------------------------------------ */
/*  Dados padrão (mock)                                               */
/* ------------------------------------------------------------------ */

export const INGRESSOS: Ingresso[] = [
    { id: "vip", nome: "Vip - open bar", descricao: "Consumação inclusa", preco: 250 },
    { id: "pista", nome: "Pista premium", preco: 150 },
    { id: "inteira", nome: "INTEIRA - LOTE 2", descricao: "LOTE 2", preco: 336 },
    { id: "meia", nome: "MEIA-ENTRADA - LOTE 2", descricao: "Consulte os tipos válidos nos termos do evento", preco: 168 },
];

export const PRODUTOS: Produto[] = [{ id: "camiseta", nome: "Camiseta oficial", imagem: "https://picsum.photos/seed/camiseta/200", preco: 80 }];

export const DATAS: DataEvento[] = [
    { id: "d26", iso: "2026-12-26T10:30", diaSemana: "Sábado", dia: "26", mes: "DEZ", ano: "2026", hora: "10h30", itens: ["vip", "pista"], produtos: ["camiseta"] },
    { id: "d27", iso: "2026-12-27T10:30", diaSemana: "Domingo", dia: "27", mes: "DEZ", ano: "2026", hora: "10h30", itens: ["vip", "pista"], produtos: ["camiseta"] },
    { id: "d28", iso: "2026-12-28T10:30", diaSemana: "Segunda", dia: "28", mes: "DEZ", ano: "2026", hora: "10h30", itens: ["vip", "pista"], produtos: ["camiseta"] },
    { id: "d29", iso: "2026-12-29T10:30", diaSemana: "Terça", dia: "29", mes: "DEZ", ano: "2026", hora: "10h30", itens: ["vip", "pista"], produtos: ["camiseta"] },
];

export const COMBOS_DINAMICOS: ComboDinamico[] = [
    {
        id: "special-masculino",
        nome: "SPECIAL PASS 3 MASCULINO",
        desconto: "10% OFF",
        descricao: "Acesso VIP nos 3 dias do evento com open bar incluso",
        dataLabel: "26/12/26, 10h30",
        sessoesLabel: "+4 sessões",
        tags: ["Consumação inclusa"],
        minItens: 3,
        maxItens: 8,
        datas: ["d26", "d27", "d28", "d29"],
        obrigatorios: ["vip"],
        precoVisivel: ["vip", "pista", "camiseta"],
    },
    {
        id: "special-feminino",
        nome: "SPECIAL PASS 3 FEMININO",
        dataLabel: "26/12/26, 10h30",
        sessoesLabel: "+4 sessões",
        tags: ["Consumação inclusa"],
        minItens: 3,
        maxItens: 8,
        datas: ["d26", "d27", "d28", "d29"],
        obrigatorios: ["vip"],
        precoVisivel: ["camiseta"],
    },
];

export const COMBOS_FIXOS: ComboFixo[] = [
    {
        id: "passaporte",
        tab: "PASSAPORTE",
        nome: "PASSAPORTE - SÁBADO + DOMINGO - LOTE 2",
        lote: "LOTE 2",
        descricao: "Os ingressos de PASSAPORTE são válidos para SÁBADO e DOMINGO (08 e 09 de agosto). As vendas para sexta-feira ocorrem separadamente.",
        preco: 515.97,
        inclui: [
            { id: "i1", titulo: "08.08 | LOTE 2 • PASSAPORTE - 08.08 - LOTE 2", sub: "sáb, 08/08/26 • 14h00", descricao: "Válido para sábado e domingo.", qtd: 1 },
            { id: "i2", titulo: "09.08 | LOTE 2 • PASSAPORTE - 09.08 - LOTE 2", sub: "dom, 09/08/26 • 14h00", descricao: "Válido para sábado e domingo.", qtd: 1 },
        ],
    },
];

export const PERGUNTAS: PerguntaEvento[] = [
    { id: "p-nome", titulo: "Nome completo do participante", tipo: "texto-curto", obrigatoria: true, vinculos: ["vip", "pista"] },
    { id: "p-camisa", titulo: "Tamanho da camisa", tipo: "escolha-unica", obrigatoria: false, vinculos: ["camiseta"] },
];

export const CUPONS: Cupom[] = [{ codigo: "10off", ajuda: "Válido apenas para o primeiro ingresso de maior valor da compra." }];

export const EXIBIR_PADRAO: Exibir = { datas: true, combosFixos: true, combosDinamicos: true };
