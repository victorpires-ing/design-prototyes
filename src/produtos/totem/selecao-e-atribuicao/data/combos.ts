/* ------------------------------------------------------------------ */
/*  Modelo do evento — cadastros centrais (datas, ingressos, produtos) */
/*  reaproveitados por datas-de-venda e combos via referência (ids).   */
/* ------------------------------------------------------------------ */

/** Item unificado em tempo de execução (modal e listas por data). */
export interface Item {
    id: string;
    nome: string;
    /** Hierarquia do ingresso: grupo > ingresso (nome) > lote. */
    grupo?: string;
    lote?: string;
    descricao?: string;
    preco?: number;
    imagem?: string;
    obrigatorio?: boolean;
    /** Quantidade mínima deste item no combo (inclusos: >= 1). */
    qtdMin?: number;
    /** Quantidade máxima deste item no combo. */
    qtdMax?: number;
    /** Exibe o preço deste item na seleção do combo. */
    mostrarPreco?: boolean;
    /** Variações (ex.: tamanhos) — produtos com variação abrem modal de escolha. */
    variacoes?: string[];
}

/**
 * Catálogo: ingresso já achatado para consumo.
 *
 * É o que o fluxo de venda enxerga — uma linha comprável por lote. Vem sempre
 * de `achatarGrupos`, nunca é cadastrado direto: o cadastro é a hierarquia
 * grupo > ingresso > lote abaixo, igual ao Backstage.
 */
export interface Ingresso {
    id: string;
    nome: string;
    /** Hierarquia: grupo > ingresso (nome) > lote. */
    grupo?: string;
    lote?: string;
    descricao?: string;
    preco?: number;
    imagem?: string;
}

/* ---- Hierarquia de cadastro: grupo > ingresso > lote ---- */

/** Lote de um tipo de ingresso: é aqui que mora o preço. */
export interface LoteIngresso {
    id: string;
    nome: string;
    preco: number;
    /** Fora de venda — não chega ao totem. */
    ativo: boolean;
    /** Vira para o próximo lote sozinho, na data de virada. */
    auto?: boolean;
    /** Quando este lote dá lugar ao próximo, "25/07 às 10:00". */
    virada?: string;
}

/** Tipo de ingresso dentro de um grupo: Inteira, Meia-entrada, Sócio. */
export interface TipoIngresso {
    id: string;
    nome: string;
    descricao?: string;
    ativo: boolean;
    lotes: LoteIngresso[];
}

/** Setor do evento: Camarote VIP, Arquibancada, Pista. */
export interface GrupoIngresso {
    id: string;
    nome: string;
    /** Por onde se entra com este ingresso — "Portão A". */
    acesso: string;
    ingressos: TipoIngresso[];
}

/**
 * Achata a hierarquia numa lista comprável: um item por lote à venda.
 *
 * Grupo e tipo desativados somem junto com os lotes, que é o que faz o
 * interruptor do cadastro valer no totem sem nenhum outro filtro.
 */
export const achatarGrupos = (grupos: GrupoIngresso[]): Ingresso[] =>
    grupos.flatMap((grupo) =>
        grupo.ingressos
            .filter((tipo) => tipo.ativo)
            .flatMap((tipo) =>
                tipo.lotes
                    .filter((lote) => lote.ativo)
                    .map((lote) => ({
                        id: lote.id,
                        nome: tipo.nome,
                        grupo: grupo.nome,
                        lote: lote.nome,
                        descricao: tipo.descricao,
                        preco: lote.preco,
                    })),
            ),
    );

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
/** Horário de uma sessão dentro de um dia do evento. */
export interface Sessao {
    id: string;
    /** Início da sessão, no formato "HH:MM". */
    hora: string;
}

/**
 * Um dia do evento: a data, a janela em que o portão fica aberto e as sessões
 * que acontecem dentro dela.
 */
export interface DataEvento {
    id: string;
    iso?: string; // valor do seletor de data (origem dos campos abaixo)
    diaSemana: string;
    dia: string;
    mes: string;
    ano: string;
    /** Rótulo curto do horário exibido no fluxo — derivado da abertura ou da primeira sessão. */
    hora?: string;
    /** Abertura dos portões, "HH:MM". */
    abertura?: string;
    /** Encerramento, "HH:MM". */
    encerramento?: string;
    /** Sessões do dia. Vazio = o dia inteiro é uma sessão só. */
    sessoes?: Sessao[];
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
    precoVisivel: string[]; // ids de itens herdados cujo preço aparece na seleção
    ocultos?: string[]; // ids de itens herdados ocultados deste combo
    /** Valor único do combo. */
    preco?: number;
    /** Exibe o preço do combo no card de seleção. */
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

/* ------------------------------------------------------------------ */
/*  Dados padrão (mock)                                               */
/* ------------------------------------------------------------------ */

export const GRUPOS_INGRESSO: GrupoIngresso[] = [
    {
        id: "g-vip",
        nome: "Camarote VIP",
        acesso: "Portão VIP",
        ingressos: [
            {
                id: "t-vip-inteira",
                nome: "Inteira",
                descricao: "Consumação inclusa",
                ativo: true,
                lotes: [
                    { id: "vip-l1", nome: "Lote 1", preco: 200, ativo: false, virada: "25/07 às 10:00" },
                    { id: "vip", nome: "Lote 2", preco: 250, ativo: true, auto: true, virada: "20/11 às 10:00" },
                ],
            },
        ],
    },
    {
        id: "g-pista",
        nome: "Pista Premium",
        acesso: "Portão B",
        ingressos: [
            {
                id: "t-pista-inteira",
                nome: "Inteira",
                ativo: true,
                lotes: [{ id: "pista", nome: "Lote 2", preco: 150, ativo: true }],
            },
        ],
    },
    {
        id: "g-arqui",
        nome: "Arquibancada",
        acesso: "Portão A",
        ingressos: [
            {
                id: "t-arqui-inteira",
                nome: "Inteira",
                ativo: true,
                lotes: [{ id: "inteira", nome: "Lote 2", preco: 336, ativo: true }],
            },
            {
                id: "t-arqui-meia",
                nome: "Meia-entrada",
                descricao: "Consulte os tipos válidos nos termos do evento",
                ativo: true,
                lotes: [{ id: "meia", nome: "Lote 2", preco: 168, ativo: true }],
            },
        ],
    },
];

/** Lista achatada dos dados de exemplo, para quem só precisa dos itens à venda. */
export const INGRESSOS: Ingresso[] = achatarGrupos(GRUPOS_INGRESSO);

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

export const DATAS: DataEvento[] = [
    {
        id: "d26",
        iso: "2026-12-26",
        diaSemana: "Sábado",
        dia: "26",
        mes: "DEZ",
        ano: "2026",
        hora: "10h30",
        abertura: "10:30",
        encerramento: "21:00",
        sessoes: [
            { id: "s26a", hora: "11:00" },
            { id: "s26b", hora: "17:00" },
        ],
        itens: ["vip", "pista"],
        produtos: ["camiseta"],
    },
    {
        id: "d27",
        iso: "2026-12-27",
        diaSemana: "Domingo",
        dia: "27",
        mes: "DEZ",
        ano: "2026",
        hora: "10h30",
        abertura: "10:30",
        encerramento: "21:00",
        sessoes: [{ id: "s27a", hora: "14:00" }],
        itens: ["vip", "pista"],
        produtos: ["camiseta"],
    },
    {
        id: "d28",
        iso: "2026-12-28",
        diaSemana: "Segunda",
        dia: "28",
        mes: "DEZ",
        ano: "2026",
        hora: "10h30",
        abertura: "10:30",
        encerramento: "20:00",
        sessoes: [],
        itens: ["vip", "pista"],
        produtos: ["camiseta"],
    },
    {
        id: "d29",
        iso: "2026-12-29",
        diaSemana: "Terça",
        dia: "29",
        mes: "DEZ",
        ano: "2026",
        hora: "10h30",
        abertura: "10:30",
        encerramento: "20:00",
        sessoes: [],
        itens: ["vip", "pista"],
        produtos: ["camiseta"],
    },
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
        obrigatorios: ["vip", "pista"],
        // vip: incluso fixo (1). pista: incluso, mas o comprador pode levar de 1 a 3.
        quantidades: { vip: { min: 1, max: 1 }, pista: { min: 1, max: 3 } },
        precoVisivel: ["vip", "pista", "camiseta"],
        preco: 450,
        exibirPreco: true,
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
        preco: 400,
        exibirPreco: true,
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

