/* ------------------------------------------------------------------ */
/*  Modelo do evento — cadastros centrais (datas, ingressos, produtos) */
/*  reaproveitados por datas-de-venda e combos via referência (ids).   */
/* ------------------------------------------------------------------ */

/** Natureza do ingresso. "promocional" não entra na cota de meia (art. 10 p.ú.). */
export type Beneficio = "inteira" | "meia-entrada" | "promocional" | "cortesia";

/**
 * Taxa acessória única (art. 3º V). Ad valorem por construção: sem piso, sem
 * teto e sem valor absoluto, porque qualquer um dos três quebra a
 * proporcionalidade exigida pelo art. 9º e derruba o desconto da meia-entrada.
 */
export interface TaxaServico {
    nome: string;
    /** 0.2 = 20% sobre o preço de face. */
    aliquota: number;
    /** O serviço efetivamente prestado que a taxa remunera (art. 3º V e 6º). */
    descricao: string;
    /** Documento dos critérios de definição (art. 7º §3º). Link só renderiza se preenchido. */
    criteriosUrl?: string;
}

/**
 * Cobrança acessória do PRODUTO. Não é a taxa de serviço do ingresso: alíquota
 * menor, negociável por contrato e com outro nome ("licenciamento"). Hoje a
 * maior parte dos contratos a traz embutida no preço anunciado; existe a opção
 * de repassá-la ao comprador, e aí ela precisa aparecer com o nome dela.
 */
export interface TaxaProduto {
    nome: string;
    /** 0.05 = 5% sobre o valor do produto. */
    aliquota: number;
    /** "embutida": já dentro do preço exibido. "destacada": somada e nomeada na tela. */
    modo: "embutida" | "destacada";
    descricao: string;
}

/** Art. 11: quantitativo ofertado por grupo. Oferta, não saldo em tempo real. */
export interface Quantitativo {
    ofertados: number;
    ofertadosMeia: number;
}

/** Item unificado em tempo de execução (modal e listas por data). */
export interface Item {
    id: string;
    nome: string;
    /** Hierarquia do ingresso: grupo > ingresso (nome) > lote. */
    grupo?: string;
    lote?: string;
    descricao?: string;
    preco?: number;
    beneficio?: Beneficio;
    /** Produto não é ingresso: fica fora da base de cálculo da taxa acessória. */
    isProduto?: boolean;
    /** Cota do benefício vendida. A linha continua na tela, só o stepper trava (art. 8º I). */
    cotaEsgotada?: boolean;
    imagem?: string;
    obrigatorio?: boolean;
    /** Quantidade mínima deste item no combo (inclusos: >= 1). */
    qtdMin?: number;
    /** Quantidade máxima deste item no combo. */
    qtdMax?: number;
    /** @deprecated Ignorado. Todo valor que entra no carrinho é exibido (art. 7º §2º). */
    mostrarPreco?: boolean;
    /** Variações (ex.: tamanhos) — produtos com variação abrem modal de escolha. */
    variacoes?: string[];
}

/** Catálogo: ingresso. */
export interface Ingresso {
    id: string;
    nome: string;
    /** Hierarquia: grupo > ingresso (nome) > lote. */
    grupo?: string;
    lote?: string;
    descricao?: string;
    /**
     * Preço de face. Em ingresso de meia-entrada é DERIVADO de `baseId` em
     * tempo de render, nunca digitado: face digitada à mão deixa um operador
     * produzir uma razão diferente de 50% sem o sistema reclamar (art. 9º).
     */
    preco?: number;
    imagem?: string;
    beneficio?: Beneficio;
    /** Obrigatório quando `beneficio === "meia-entrada"`: id do ingresso base. */
    baseId?: string;
    /** Fração da face base. Default 0.5. */
    percentualBeneficio?: number;
    cotaEsgotada?: boolean;
}

/**
 * Quanto este item ACRESCENTA ao valor do combo.
 * Item obrigatório já está no preço do pacote e acrescenta zero. Rótulo e
 * cálculo precisam usar este mesmo predicado, senão o modal exibe "+ R$ 150,00"
 * em unidades que somam nada.
 */
export const precoExtraDoItem = (it: Item) => (it.obrigatorio ? 0 : (it.preco ?? 0));

/** Catálogo: produto (tem imagem). */
export interface Produto {
    id: string;
    nome: string;
    imagem?: string;
    preco?: number;
    descricao?: string;
    /** Selo opcional exibido sobre a imagem (ex.: "Últimas unidades"). */
    selo?: string;
    /** Variações (ex.: tamanhos). Com variações, "Adicionar" abre o modal de escolha. */
    variacoes?: string[];
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
    /** Limite máximo de itens selecionáveis nesta data (desabilita o "+" ao atingir). */
    limite?: number;
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
    /** Qtd mín./máx. por item herdado (mín. = máx. → quantidade fixa "Nx"). */
    quantidades?: Record<string, { min: number; max: number }>;
    /** @deprecated Ignorado. Mantido só para não quebrar links ?cfg= já compartilhados. */
    precoVisivel: string[];
    ocultos?: string[]; // ids de itens herdados ocultados deste combo
    /** Valor único do combo. */
    preco?: number;
    /** @deprecated Ignorado. O preço do combo é sempre exibido no card. */
    exibirPreco?: boolean;
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
    preco?: number;
    sessoes: ComboSessao[];
}

export type TipoPergunta = "texto" | "numero" | "data" | "checkbox" | "radio" | "dropdown";
export interface PerguntaEvento {
    id: string;
    titulo: string;
    tipo: TipoPergunta;
    obrigatoria: boolean;
    opcoes?: string[]; // para checkbox / radio / dropdown
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
    /* ---- CAMAROTE VIP OPEN BAR PREMIUM ---- */
    {
        id: "vip",
        nome: "INTEIRA",
        grupo: "CAMAROTE VIP OPEN BAR PREMIUM",
        lote: "3º LOTE",
        descricao: "Consumação inclusa até 23h. Entrada exclusiva pelo portão A com acesso ao lounge climatizado e banheiros privativos.",
        preco: 250,
        beneficio: "inteira",
    },
    { id: "vip-meia", nome: "MEIA-ENTRADA", grupo: "CAMAROTE VIP OPEN BAR PREMIUM", lote: "3º LOTE", beneficio: "meia-entrada", baseId: "vip" },
    {
        id: "vip-idoso",
        nome: "IDOSO 60+",
        grupo: "CAMAROTE VIP OPEN BAR PREMIUM",
        lote: "3º LOTE",
        descricao: "Apresente documento com foto na entrada.",
        beneficio: "meia-entrada",
        baseId: "vip",
    },
    {
        id: "vip-solidaria",
        // Promocional, não meia-entrada: é política comercial do produtor e não
        // entra na cota legal (art. 10, parágrafo único).
        nome: "ENTRADA SOLIDÁRIA",
        grupo: "CAMAROTE VIP OPEN BAR PREMIUM",
        lote: "3º LOTE",
        descricao: "Mediante entrega de 1 kg de alimento não perecível na entrada do evento.",
        preco: 200,
        beneficio: "promocional",
    },

    /* ---- PISTA PREMIUM FRONT STAGE ---- */
    { id: "pista", nome: "INTEIRA", grupo: "PISTA PREMIUM FRONT STAGE", lote: "2º LOTE PROMOCIONAL", preco: 150, beneficio: "inteira" },
    // Cota vendida: a linha permanece na tela com o stepper travado (art. 8º I).
    {
        id: "pista-meia",
        nome: "MEIA-ENTRADA",
        grupo: "PISTA PREMIUM FRONT STAGE",
        lote: "2º LOTE PROMOCIONAL",
        beneficio: "meia-entrada",
        baseId: "pista",
        cotaEsgotada: true,
    },
    { id: "pista-idoso", nome: "IDOSO 60+", grupo: "PISTA PREMIUM FRONT STAGE", lote: "2º LOTE PROMOCIONAL", beneficio: "meia-entrada", baseId: "pista" },
    {
        id: "pista-solidaria",
        nome: "ENTRADA SOLIDÁRIA",
        grupo: "PISTA PREMIUM FRONT STAGE",
        lote: "2º LOTE PROMOCIONAL",
        descricao: "Mediante entrega de 1 kg de alimento não perecível na entrada do evento.",
        preco: 120,
        beneficio: "promocional",
    },
    {
        id: "pista-social",
        nome: "ENTRADA SOCIAL",
        grupo: "PISTA PREMIUM FRONT STAGE",
        lote: "2º LOTE PROMOCIONAL",
        descricao: "Lote limitado para moradores da região, mediante comprovante de residência.",
        preco: 90,
        beneficio: "promocional",
    },

    /* ---- ARQUIBANCADA SUPERIOR COBERTA ---- */
    { id: "inteira", nome: "INTEIRA", grupo: "ARQUIBANCADA SUPERIOR COBERTA", lote: "LOTE 2", preco: 336, beneficio: "inteira" },
    {
        id: "meia",
        nome: "MEIA-ENTRADA",
        grupo: "ARQUIBANCADA SUPERIOR COBERTA",
        lote: "LOTE 2",
        descricao: "Válido para estudantes, pessoas com deficiência e acompanhante, jovens de baixa renda com ID Jovem e pessoas com 60 anos ou mais.",
        beneficio: "meia-entrada",
        baseId: "inteira",
    },
    { id: "arq-idoso", nome: "IDOSO 60+", grupo: "ARQUIBANCADA SUPERIOR COBERTA", lote: "LOTE 2", beneficio: "meia-entrada", baseId: "inteira" },
    {
        id: "arq-solidaria",
        nome: "ENTRADA SOLIDÁRIA",
        grupo: "ARQUIBANCADA SUPERIOR COBERTA",
        lote: "LOTE 2",
        descricao: "Mediante entrega de 1 kg de alimento não perecível na entrada do evento.",
        preco: 280,
        beneficio: "promocional",
    },
];

/** Taxa acessória padrão do protótipo. 20% ad valorem, única. */
export const TAXA_PADRAO: TaxaServico = {
    nome: "Taxa de serviço",
    aliquota: 0.2,
    descricao:
        "A taxa de serviço remunera a emissão e a validação do ingresso, o atendimento ao comprador e a operação da bilheteria digital.",
};

/**
 * Licenciamento do produto oficial. Em contrato a maioria dos casos hoje vem
 * embutida; o protótipo nasce "destacada" porque a tela a ser demonstrada é a
 * do repasse ao comprador, onde a cobrança precisa aparecer com o nome dela.
 */
export const TAXA_PRODUTO_PADRAO: TaxaProduto = {
    nome: "Taxa de licenciamento",
    aliquota: 0.05,
    modo: "destacada",
    descricao: "A taxa de licenciamento remunera o uso da marca e dos direitos do evento no produto oficial.",
};

/**
 * Art. 11. Chaveado pelo nome do grupo. Camarote VIP não oferta meia-entrada,
 * e a cota de 40% da Lei 12.933/2013 é apurada sobre o evento, não por grupo:
 * 1.400 de 3.500 ingressos.
 */
export const QUANTITATIVO_PADRAO: Record<string, Quantitativo> = {
    "CAMAROTE VIP OPEN BAR PREMIUM": { ofertados: 300, ofertadosMeia: 120 },
    "PISTA PREMIUM FRONT STAGE": { ofertados: 1200, ofertadosMeia: 500 },
    "ARQUIBANCADA SUPERIOR COBERTA": { ofertados: 2000, ofertadosMeia: 820 },
};

export const PRODUTOS: Produto[] = [
    {
        id: "camiseta",
        nome: "Camisa Oficial #BGS26",
        imagem: "https://picsum.photos/seed/camiseta/480",
        preco: 119.9,
        descricao: "Design personalizado e conforto absoluto com 100% algodão. Feita para gamers que vivem o game, dentro e fora das telas.",
        variacoes: ["P", "M", "G", "GG"],
    },
    {
        id: "boneco",
        nome: "Boneco Bot_GS - Fandom Box",
        imagem: "https://picsum.photos/seed/boneco/480",
        preco: 129.9,
        descricao: "O Bot_GS ganhou uma Fandom Box! Cada caixa é uma surpresa, com itens colecionáveis exclusivos do evento.",
    },
];

/** Ingressos de todas as datas. A meia precisa estar ofertada para ser comprável (art. 8º I). */
const ITENS_DA_DATA = INGRESSOS.map((i) => i.id);

export const DATAS: DataEvento[] = [
    { id: "d26", iso: "2026-12-26T10:30", diaSemana: "Sábado", dia: "26", mes: "DEZ", ano: "2026", hora: "10h30", itens: ITENS_DA_DATA, produtos: ["camiseta"] },
    { id: "d27", iso: "2026-12-27T10:30", diaSemana: "Domingo", dia: "27", mes: "DEZ", ano: "2026", hora: "10h30", itens: ITENS_DA_DATA, produtos: ["camiseta"] },
    { id: "d28", iso: "2026-12-28T10:30", diaSemana: "Segunda", dia: "28", mes: "DEZ", ano: "2026", hora: "10h30", itens: ITENS_DA_DATA, produtos: ["camiseta"] },
    { id: "d29", iso: "2026-12-29T10:30", diaSemana: "Terça", dia: "29", mes: "DEZ", ano: "2026", hora: "10h30", itens: ITENS_DA_DATA, produtos: ["camiseta"] },
];

/** Combos são pacote comercial fechado: herdam só os ingressos que o compõem.
    Derivado, e não uma lista de exclusões: ingresso novo no catálogo entra
    fora do combo por padrão, em vez de aparecer nele sem ninguém notar. */
const NO_COMBO = ["vip", "pista"];
const FORA_DOS_COMBOS = ITENS_DA_DATA.filter((id) => !NO_COMBO.includes(id));

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
        obrigatorios: ["vip", "pista"],
        // vip: incluso fixo (1). pista: incluso, mas o comprador pode levar de 1 a 3.
        quantidades: { vip: { min: 1, max: 1 }, pista: { min: 1, max: 3 } },
        ocultos: FORA_DOS_COMBOS,
        precoVisivel: [],
        preco: 450,
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
        ocultos: FORA_DOS_COMBOS,
        precoVisivel: [],
        preco: 400,
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
    { id: "p-nome", titulo: "Nome completo do atleta", tipo: "texto", obrigatoria: true, vinculos: [] },
    { id: "p-nasc", titulo: "Data de nascimento", tipo: "data", obrigatoria: true, vinculos: [] },
    { id: "p-idade", titulo: "Idade", tipo: "numero", obrigatoria: false, vinculos: [] },
    { id: "p-sexo", titulo: "Sexo", tipo: "radio", obrigatoria: true, opcoes: ["Masculino", "Feminino", "Prefiro não informar"], vinculos: [] },
    { id: "p-camisa", titulo: "Tamanho da camiseta", tipo: "dropdown", obrigatoria: true, opcoes: ["PP", "P", "M", "G", "GG", "XG"], vinculos: [] },
    { id: "p-pace", titulo: "Informe o seu Pace (em quanto tempo percorre um km)", tipo: "texto", obrigatoria: true, vinculos: [] },
    { id: "p-equipe", titulo: "Equipe (caso não possua, digite: Avulso)", tipo: "texto", obrigatoria: true, vinculos: [] },
    { id: "p-sangue", titulo: "Tipo sanguíneo", tipo: "dropdown", obrigatoria: true, opcoes: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], vinculos: [] },
    { id: "p-tel-emerg", titulo: "Telefone de emergência", tipo: "texto", obrigatoria: true, vinculos: [] },
    { id: "p-nome-emerg", titulo: "Nome completo do contato de emergência", tipo: "texto", obrigatoria: true, vinculos: [] },
    { id: "p-termo", titulo: "Termo de responsabilidade", tipo: "checkbox", obrigatoria: true, opcoes: ["Estou ciente e concordo integralmente com o TERMO DE RESPONSABILIDADE do evento"], vinculos: [] },
    { id: "p-regulamento", titulo: "Regulamento", tipo: "checkbox", obrigatoria: true, opcoes: ["Estou ciente e concordo integralmente com o REGULAMENTO do evento"], vinculos: [] },
    { id: "p-novidades", titulo: "Comunicações", tipo: "checkbox", obrigatoria: false, opcoes: ["Aceito receber informações sobre o evento e ficar por dentro das novidades e promoções sobre a São Silvestre e marcas parceiras"], vinculos: [] },
];

export const CUPONS: Cupom[] = [{ codigo: "10off", ajuda: "Válido apenas para o primeiro ingresso de maior valor da compra." }];

export const EXIBIR_PADRAO: Exibir = { datas: true, combosFixos: true, combosDinamicos: true };
