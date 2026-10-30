/* ------------------------------------------------------------------ */
/*  Catálogo mock do evento para o Gerenciamento de cotas.             */
/*  É o que o grupo pode operar: ingressos por sessão e grupo de       */
/*  ingresso, produtos e combos. Os ids são estáveis porque ficam      */
/*  salvos dentro do grupo (localStorage).                             */
/* ------------------------------------------------------------------ */

export type TipoItem = "ingresso" | "produto" | "combo";

export interface Ingresso {
    id: string;
    tipo: "ingresso";
    nome: string;
    /** Modalidade (Inteira, Meia-entrada…). Já vem no nome; o badge do ingresso é sempre "Ingresso". */
    categoria: string;
    grupo: string;
    sessaoId: string;
    /** Lotes do ingresso. Com um só ("Lote único") não há escolha de lote. */
    lotes: Lote[];
    /** Preenchido quando o item é um lote específico (selecionado sem os outros lotes do ingresso). */
    loteDe?: string;
    /** Nome do lote, quando o item é um lote específico. */
    lote?: string;
}

export interface Lote {
    /** `${idDoIngresso}-l1`, `-l2`… */
    id: string;
    nome: string;
}

export interface Produto {
    id: string;
    tipo: "produto";
    nome: string;
    descricao: string;
    imagem: string;
    /** Produto não tem sessão: é comprado à parte, como um adicional do evento (ou dentro de um combo). */
}

export interface ComponenteCombo {
    quantidade: number;
    nome: string;
    categoria: string;
}

export interface Combo {
    id: string;
    tipo: "combo";
    nome: string;
    grupo: string;
    categoria: string;
    sessaoId: string;
    componentes: ComponenteCombo[];
}

export type ItemCatalogo = Ingresso | Produto | Combo;

export interface Sessao {
    id: string;
    /** "03 de abril às 16:00" — cabeçalho dos cards de sessão. */
    rotulo: string;
    /** "03 de abril • 16:00" — linha de data no resumo e no detalhe. */
    curto: string;
}

export const SESSOES: Sessao[] = [
    { id: "s1", rotulo: "03 de abril às 16:00", curto: "03 de abril • 16:00" },
    { id: "s2", rotulo: "04 de abril às 16:00", curto: "04 de abril • 16:00" },
    { id: "s3", rotulo: "05 de abril às 14:00", curto: "05 de abril • 14:00" },
    { id: "s4", rotulo: "10 de abril às 20:00", curto: "10 de abril • 20:00" },
    { id: "s5", rotulo: "11 de abril às 16:00", curto: "11 de abril • 16:00" },
    { id: "s6", rotulo: "12 de abril às 14:00", curto: "12 de abril • 14:00" },
    { id: "s7", rotulo: "17 de abril às 20:00", curto: "17 de abril • 20:00" },
    { id: "s8", rotulo: "18 de abril às 16:00", curto: "18 de abril • 16:00" },
];

/**
 * `nome` é o setor ("Pista Sunset"); o ingresso leva a modalidade no nome ("Pista Sunset - Meia-entrada").
 * `qtdLotes` 1 = "Lote único"; mais de 1 = "1º lote", "2º lote"…
 */
const ingresso = (id: string, sessaoId: string, grupo: string, nome: string, categoria: string, qtdLotes: number): Ingresso => ({
    id,
    tipo: "ingresso",
    sessaoId,
    grupo,
    nome: `${nome} - ${categoria}`,
    categoria,
    lotes:
        qtdLotes <= 1
            ? [{ id: `${id}-l1`, nome: "Lote único" }]
            : Array.from({ length: qtdLotes }, (_, i) => ({ id: `${id}-l${i + 1}`, nome: `${i + 1}º lote` })),
});

/*
 * Sessões s3–s8: catálogo maior para testar a seleção com muitos itens (~200 ingressos).
 * Cada sessão tem os mesmos setores; ids no formato `s3-vip-mei` (estáveis entre recargas).
 */
const SETORES: { id: string; grupo: string; nome: string; lotes: number }[] = [
    { id: "pista", grupo: "Arena Sunset", nome: "Pista Sunset", lotes: 3 },
    { id: "premium", grupo: "Premium Beira-Mar", nome: "Pista Premium Beira-Mar", lotes: 2 },
    { id: "front", grupo: "Palco Principal", nome: "Frontstage Colado no Palco", lotes: 1 },
    { id: "cam", grupo: "Camarotes Milagres", nome: "Camarote Open Bar Milagres", lotes: 3 },
    { id: "vip", grupo: "Experiência VIP", nome: "Área VIP Pé na Areia", lotes: 2 },
    { id: "lounge", grupo: "Beach Club", nome: "Lounge Beach Club", lotes: 2 },
    { id: "arq", grupo: "Mirante", nome: "Arquibancada Mirante", lotes: 1 },
    { id: "mesa", grupo: "Mesas & Bistrô", nome: "Mesa Bistrô para 4", lotes: 1 },
];
const CATEGORIAS: { id: string; nome: string }[] = [
    { id: "int", nome: "Inteira" },
    { id: "mei", nome: "Meia-entrada" },
    { id: "soc", nome: "Meia Solidária" },
    { id: "pcd", nome: "PCD" },
];

function gerarIngressos(): Ingresso[] {
    const sessoes = ["s3", "s4", "s5", "s6", "s7", "s8"];
    return sessoes.flatMap((sessaoId) =>
        SETORES.flatMap((setor) =>
            CATEGORIAS.map((cat) => ingresso(`${sessaoId}-${setor.id}-${cat.id}`, sessaoId, setor.grupo, setor.nome, cat.nome, setor.lotes)),
        ),
    );
}

export const INGRESSOS: Ingresso[] = [
    ingresso("s1-pista-int", "s1", "Arena Sunset", "Pista Sunset", "Inteira", 3),
    ingresso("s1-pista-mei", "s1", "Arena Sunset", "Pista Sunset", "Meia-entrada", 3),
    ingresso("s1-pista-soc", "s1", "Arena Sunset", "Pista Sunset", "Meia Solidária", 3),
    ingresso("s1-front-int", "s1", "Palco Principal", "Frontstage Colado no Palco", "Inteira", 1),
    ingresso("s1-front-mei", "s1", "Palco Principal", "Frontstage Colado no Palco", "Meia-entrada", 1),
    ingresso("s1-cam-int", "s1", "Camarotes Milagres", "Camarote Open Bar Milagres", "Inteira", 2),
    ingresso("s1-cam-mei", "s1", "Camarotes Milagres", "Camarote Open Bar Milagres", "Meia-entrada", 2),
    ingresso("s2-pista-int", "s2", "Arena Sunset", "Pista Sunset", "Inteira", 3),
    ingresso("s2-pista-mei", "s2", "Arena Sunset", "Pista Sunset", "Meia-entrada", 3),
    ingresso("s2-front-int", "s2", "Palco Principal", "Frontstage Colado no Palco", "Inteira", 1),
    ingresso("s2-cam-int", "s2", "Camarotes Milagres", "Camarote Open Bar Milagres", "Inteira", 2),
    ingresso("s2-cam-mei", "s2", "Camarotes Milagres", "Camarote Open Bar Milagres", "Meia-entrada", 2),
    ...gerarIngressos(),
];

export const PRODUTOS: Produto[] = [
    {
        id: "p-camiseta",
        tipo: "produto",
        nome: "Camiseta oficial",
        descricao: "Algodão • tamanhos P ao GG",
        imagem: "https://picsum.photos/seed/camiseta-milagres/96",
    },
    {
        id: "p-copo",
        tipo: "produto",
        nome: "Copo colecionável",
        descricao: "500 ml",
        imagem: "https://picsum.photos/seed/copo-milagres/96",
    },
    {
        id: "p-estacionamento",
        tipo: "produto",
        nome: "Estacionamento",
        descricao: "Vaga para carro",
        imagem: "https://picsum.photos/seed/estacionamento-milagres/96",
    },
];

export const COMBOS: Combo[] = [
    {
        id: "c-amigos",
        tipo: "combo",
        sessaoId: "s1",
        nome: "Combo Amigos",
        grupo: "Arena Sunset",
        categoria: "4 ingressos",
        componentes: [
            { quantidade: 3, nome: "Pista Sunset", categoria: "Inteira" },
            { quantidade: 1, nome: "Copo colecionável", categoria: "Produto" },
        ],
    },
    {
        id: "c-camarote",
        tipo: "combo",
        sessaoId: "s2",
        nome: "Combo Camarote",
        grupo: "Camarotes Milagres",
        categoria: "Ingresso + camiseta",
        componentes: [
            { quantidade: 1, nome: "Camarote Open Bar Milagres", categoria: "Inteira" },
            { quantidade: 1, nome: "Camiseta oficial", categoria: "Produto" },
        ],
    },
    {
        id: "c-casal",
        tipo: "combo",
        sessaoId: "s3",
        nome: "Combo Casal",
        grupo: "Arena Sunset",
        categoria: "2 ingressos",
        componentes: [{ quantidade: 2, nome: "Pista Sunset", categoria: "Inteira" }],
    },
    {
        id: "c-galera",
        tipo: "combo",
        sessaoId: "s3",
        nome: "Combo Galera",
        grupo: "Arena Sunset",
        categoria: "6 ingressos",
        componentes: [
            { quantidade: 5, nome: "Pista Sunset", categoria: "Inteira" },
            { quantidade: 1, nome: "Pista Sunset", categoria: "Meia-entrada" },
        ],
    },
    {
        id: "c-vip-duo",
        tipo: "combo",
        sessaoId: "s4",
        nome: "Combo VIP Duo",
        grupo: "Experiência VIP",
        categoria: "2 ingressos + copos",
        componentes: [
            { quantidade: 2, nome: "Área VIP Pé na Areia", categoria: "Inteira" },
            { quantidade: 2, nome: "Copo colecionável", categoria: "Produto" },
        ],
    },
    {
        id: "c-premium",
        tipo: "combo",
        sessaoId: "s4",
        nome: "Combo Premium",
        grupo: "Premium Beira-Mar",
        categoria: "3 ingressos",
        componentes: [{ quantidade: 3, nome: "Pista Premium Beira-Mar", categoria: "Inteira" }],
    },
    {
        id: "c-lounge",
        tipo: "combo",
        sessaoId: "s5",
        nome: "Combo Lounge",
        grupo: "Beach Club",
        categoria: "4 ingressos",
        componentes: [{ quantidade: 4, nome: "Lounge Beach Club", categoria: "Inteira" }],
    },
    {
        id: "c-front-fa",
        tipo: "combo",
        sessaoId: "s5",
        nome: "Combo Fã",
        grupo: "Palco Principal",
        categoria: "Ingresso + camiseta",
        componentes: [
            { quantidade: 1, nome: "Frontstage Colado no Palco", categoria: "Inteira" },
            { quantidade: 1, nome: "Camiseta oficial", categoria: "Produto" },
        ],
    },
    {
        id: "c-familia",
        tipo: "combo",
        sessaoId: "s6",
        nome: "Combo Família",
        grupo: "Mirante",
        categoria: "4 ingressos",
        componentes: [
            { quantidade: 2, nome: "Arquibancada Mirante", categoria: "Inteira" },
            { quantidade: 2, nome: "Arquibancada Mirante", categoria: "Meia-entrada" },
        ],
    },
    {
        id: "c-mesa",
        tipo: "combo",
        sessaoId: "s6",
        nome: "Combo Mesa",
        grupo: "Mesas & Bistrô",
        categoria: "Mesa + estacionamento",
        componentes: [
            { quantidade: 1, nome: "Mesa Bistrô para 4", categoria: "Inteira" },
            { quantidade: 1, nome: "Estacionamento", categoria: "Produto" },
        ],
    },
    {
        id: "c-camarote-trio",
        tipo: "combo",
        sessaoId: "s7",
        nome: "Combo Camarote Trio",
        grupo: "Camarotes Milagres",
        categoria: "3 ingressos",
        componentes: [{ quantidade: 3, nome: "Camarote Open Bar Milagres", categoria: "Inteira" }],
    },
    {
        id: "c-fim-de-semana",
        tipo: "combo",
        sessaoId: "s8",
        nome: "Combo Fim de Semana",
        grupo: "Arena Sunset",
        categoria: "Ingresso + copo + estacionamento",
        componentes: [
            { quantidade: 1, nome: "Pista Sunset", categoria: "Inteira" },
            { quantidade: 1, nome: "Copo colecionável", categoria: "Produto" },
            { quantidade: 1, nome: "Estacionamento", categoria: "Produto" },
        ],
    },
];

export const ITENS: ItemCatalogo[] = [...INGRESSOS, ...PRODUTOS, ...COMBOS];

/**
 * Um lote escolhido sozinho vira um item próprio (para cotas, resumo e detalhe), com o nome do
 * lote. Selecionar o ingresso inteiro guarda só o id do ingresso; lotes avulsos guardam o id do lote.
 */
const ITENS_DE_LOTE: Ingresso[] = INGRESSOS.filter((i) => i.lotes.length > 1).flatMap((i) =>
    i.lotes.map((l) => ({ ...i, id: l.id, lotes: [l], loteDe: i.id, lote: l.nome })),
);

export const ITEM_POR_ID: Record<string, ItemCatalogo> = Object.fromEntries([...ITENS, ...ITENS_DE_LOTE].map((i) => [i.id, i]));

export const SESSAO_POR_ID: Record<string, Sessao> = Object.fromEntries(SESSOES.map((s) => [s.id, s]));

/** Produtos não têm sessão: na seleção e nas cotas ficam num card próprio, depois das sessões. */
export const SEM_SESSAO: Sessao = { id: "evento", rotulo: "Todo o evento", curto: "Todo o evento" };

/** Sessão do item; produto não tem. */
export const sessaoDoItem = (item: ItemCatalogo): Sessao | undefined => (item.tipo === "produto" ? undefined : SESSAO_POR_ID[item.sessaoId]);

/** Agrupa itens por sessão e, dentro dela, pelo grupo de ingresso — a estrutura dos cards. Produtos vão para o fim, sem sessão. */
export function agruparPorSessao<T extends ItemCatalogo>(itens: T[]) {
    const porSessao = SESSOES.map((sessao) => {
        const daSessao = itens.filter((i) => i.tipo !== "produto" && i.sessaoId === sessao.id);
        const grupos = new Map<string, T[]>();
        for (const item of daSessao) {
            const nome = item.tipo === "combo" ? "Combos" : item.tipo === "ingresso" ? item.grupo : "";
            grupos.set(nome, [...(grupos.get(nome) ?? []), item]);
        }
        return { sessao, grupos: [...grupos.entries()].map(([nome, lista]) => ({ nome, itens: lista })) };
    });
    const produtos = itens.filter((i) => i.tipo === "produto");
    return [...porSessao, { sessao: SEM_SESSAO, grupos: produtos.length ? [{ nome: "Produtos", itens: produtos }] : [] }].filter((s) => s.grupos.length > 0);
}

/** Ordem e rótulo dos tipos: em toda listagem de itens eles aparecem separados, nesta ordem. */
export const TIPOS_ITEM = [
    { tipo: "ingresso", titulo: "Ingressos" },
    { tipo: "produto", titulo: "Produtos" },
    { tipo: "combo", titulo: "Combos" },
] as const;

/** Separa os itens por tipo (só os tipos presentes), mantendo dentro de cada um a ordem por sessão e grupo. */
export function separarPorTipo<T extends ItemCatalogo>(itens: T[]) {
    const ordenados = agruparPorSessao(itens).flatMap(({ grupos }) => grupos.flatMap((g) => g.itens));
    return TIPOS_ITEM.map(({ tipo, titulo }) => ({ tipo, titulo, itens: ordenados.filter((i) => i.tipo === tipo) })).filter((t) => t.itens.length > 0);
}

/**
 * Estoque do item (mock): referência de limite quando o grupo não tem cota definida.
 * Determinístico pelo id, para não mudar entre recargas. Lote avulso = estoque daquele lote.
 */
export function estoqueDoItem(item: ItemCatalogo) {
    let h = 0;
    for (const c of item.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const base = item.tipo === "combo" ? 60 : item.tipo === "produto" ? 150 : 200;
    return base + (h % 17) * 50;
}

/** Linha de apoio do item no detalhe do grupo: o grupo e, se for um lote avulso, o lote ("Pista · 1º lote"). */
export function apoioDoItem(item: ItemCatalogo) {
    if (item.tipo === "ingresso") {
        return item.lote ? `${item.grupo} · ${item.lote}` : item.grupo;
    }
    if (item.tipo === "combo") return `${item.grupo} · ${item.categoria}`;
    return item.descricao;
}
