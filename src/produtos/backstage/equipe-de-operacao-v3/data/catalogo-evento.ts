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
    /** Sessão do ingresso dentro do combo (padrão: a do combo). Produto não tem sessão. */
    sessaoId?: string;
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
 */
const ingresso = (id: string, sessaoId: string, grupo: string, nome: string, categoria: string): Ingresso => ({
    id,
    tipo: "ingresso",
    sessaoId,
    grupo,
    nome: `${nome} - ${categoria}`,
    categoria,
});

/*
 * Sessões s3–s8: catálogo maior para testar a seleção com muitos itens (~200 ingressos).
 * Cada sessão tem os mesmos setores; ids no formato `s3-vip-mei` (estáveis entre recargas).
 */
const SETORES: { id: string; grupo: string; nome: string }[] = [
    { id: "pista", grupo: "Arena Sunset", nome: "Pista Sunset" },
    { id: "premium", grupo: "Premium Beira-Mar", nome: "Pista Premium Beira-Mar" },
    { id: "front", grupo: "Palco Principal", nome: "Frontstage Colado no Palco" },
    { id: "cam", grupo: "Camarotes Milagres", nome: "Camarote Open Bar Milagres" },
    { id: "vip", grupo: "Experiência VIP", nome: "Área VIP Pé na Areia" },
    { id: "lounge", grupo: "Beach Club", nome: "Lounge Beach Club" },
    { id: "arq", grupo: "Mirante", nome: "Arquibancada Mirante" },
    { id: "mesa", grupo: "Mesas & Bistrô", nome: "Mesa Bistrô para 4" },
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
        SETORES.flatMap((setor) => CATEGORIAS.map((cat) => ingresso(`${sessaoId}-${setor.id}-${cat.id}`, sessaoId, setor.grupo, setor.nome, cat.nome))),
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
        sessaoId: "s7",
        nome: "Combo Fim de Semana",
        grupo: "Arena Sunset",
        categoria: "2 ingressos + copo + estacionamento",
        // O mesmo combo em duas sessões: o vínculo é dos ingressos, e cada um tem a sua.
        componentes: [
            { quantidade: 1, nome: "Pista Sunset", categoria: "Inteira", sessaoId: "s7" },
            { quantidade: 1, nome: "Pista Sunset", categoria: "Inteira", sessaoId: "s8" },
            { quantidade: 1, nome: "Copo colecionável", categoria: "Produto" },
            { quantidade: 1, nome: "Estacionamento", categoria: "Produto" },
        ],
    },
];

export const ITENS: ItemCatalogo[] = [...INGRESSOS, ...PRODUTOS, ...COMBOS];

export const ITEM_POR_ID: Record<string, ItemCatalogo> = Object.fromEntries(ITENS.map((i) => [i.id, i]));

export const SESSAO_POR_ID: Record<string, Sessao> = Object.fromEntries(SESSOES.map((s) => [s.id, s]));

/** Produtos não têm sessão: na seleção e nas cotas ficam num card próprio, depois das sessões. */
export const SEM_SESSAO: Sessao = { id: "evento", rotulo: "Todo o evento", curto: "Todo o evento" };

/** Sessão do item; produto não tem. */
export const sessaoDoItem = (item: ItemCatalogo): Sessao | undefined => (item.tipo === "produto" ? undefined : SESSAO_POR_ID[item.sessaoId]);

/** Agrupa itens por sessão e, dentro dela, pelo grupo de ingresso — a estrutura dos cards. Produtos vão para o fim, sem sessão. */
export function agruparPorSessao<T extends ItemCatalogo>(itens: T[]) {
    // Só ingressos ficam em cards de sessão. Produtos e combos são selecionados numa lista simples:
    // o combo leva a sessão como legenda abaixo do nome (os ingressos dele é que têm sessão).
    const porSessao = SESSOES.map((sessao) => {
        const daSessao = itens.filter((i) => i.tipo === "ingresso" && i.sessaoId === sessao.id);
        const grupos = new Map<string, T[]>();
        for (const item of daSessao) {
            const nome = item.tipo === "ingresso" ? item.grupo : "";
            grupos.set(nome, [...(grupos.get(nome) ?? []), item]);
        }
        return { sessao, grupos: [...grupos.entries()].map(([nome, lista]) => ({ nome, itens: lista })) };
    });
    const ordemSessao = (i: ItemCatalogo) => SESSOES.findIndex((s) => s.id === sessaoDoItem(i)?.id);
    const produtos = itens.filter((i) => i.tipo === "produto");
    const combos = itens.filter((i) => i.tipo === "combo").sort((a, b) => ordemSessao(a) - ordemSessao(b));
    const semSessao = [...(produtos.length ? [{ nome: "Produtos", itens: produtos }] : []), ...(combos.length ? [{ nome: "Combos", itens: combos }] : [])];
    return [...porSessao, { sessao: SEM_SESSAO, grupos: semSessao }].filter((s) => s.grupos.length > 0);
}

/** É produto (dentro de um combo)? Produto não tem sessão. */
export const componenteEhProduto = (c: ComponenteCombo) => c.categoria === "Produto";

/** Sessão de um componente do combo: a dele, ou a do combo; produto não tem. */
export const sessaoDoComponente = (combo: Combo, c: ComponenteCombo) => (componenteEhProduto(c) ? undefined : SESSAO_POR_ID[c.sessaoId ?? combo.sessaoId]);

/** Sessões de um item, em ordem: ingresso tem uma; combo, as dos ingressos dele; produto, nenhuma. */
export const sessoesDoItem = (item: ItemCatalogo): Sessao[] => {
    if (item.tipo === "produto") return [];
    if (item.tipo === "ingresso") return [SESSAO_POR_ID[item.sessaoId]].filter(Boolean);
    const ids = new Set(item.componentes.map((c) => sessaoDoComponente(item, c)?.id).filter(Boolean));
    if (ids.size === 0) ids.add(item.sessaoId);
    return SESSOES.filter((s) => ids.has(s.id));
};

/** Legenda de sessão do combo, como no Backstage: a primeira sessão e "+N" quando há mais ("29 de agosto às 11:30 +1"). */
export const legendaDeSessao = (item: ItemCatalogo, formato: "rotulo" | "curto" = "rotulo") => {
    const s = sessoesDoItem(item);
    if (s.length === 0) return undefined;
    return s[0][formato] + (s.length > 1 ? ` +${s.length - 1}` : "");
};

/** Quantas sessões diferentes os itens cobrem (ingressos e combos; produto não tem sessão). */
export const contarSessoes = (itens: ItemCatalogo[]) => new Set(itens.flatMap((i) => sessoesDoItem(i).map((s) => s.id))).size;

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
 * Determinístico pelo id, para não mudar entre recargas.
 */
export function estoqueDoItem(item: ItemCatalogo) {
    let h = 0;
    for (const c of item.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const base = item.tipo === "combo" ? 60 : item.tipo === "produto" ? 150 : 200;
    return base + (h % 17) * 50;
}

/** Linha de apoio do item no detalhe do grupo: o grupo do ingresso, o grupo e a categoria do combo ou a descrição do produto. */
export function apoioDoItem(item: ItemCatalogo) {
    if (item.tipo === "ingresso") {
        return item.grupo;
    }
    if (item.tipo === "combo") return `${item.grupo} · ${item.categoria}`;
    return item.descricao;
}
