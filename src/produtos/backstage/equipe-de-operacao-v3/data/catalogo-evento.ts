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
    /** Tipo do ingresso (badge): Inteira, Meia-entrada... */
    categoria: string;
    lote: string;
    grupo: string;
    sessaoId: string;
}

export interface Produto {
    id: string;
    tipo: "produto";
    nome: string;
    descricao: string;
    imagem: string;
    sessaoId: string;
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

const ingresso = (id: string, sessaoId: string, grupo: string, nome: string, categoria: string, lote: string): Ingresso => ({
    id,
    tipo: "ingresso",
    sessaoId,
    grupo,
    nome,
    categoria,
    lote,
});

/*
 * Sessões s3–s8: catálogo maior para testar a seleção com muitos itens (~200 ingressos).
 * Cada sessão tem os mesmos setores; ids no formato `s3-vip-mei` (estáveis entre recargas).
 */
const SETORES: { id: string; grupo: string; nome: string; lote: string }[] = [
    { id: "pista", grupo: "Pista", nome: "Pista", lote: "2º lote" },
    { id: "premium", grupo: "Pista Premium", nome: "Pista Premium", lote: "1º lote" },
    { id: "front", grupo: "Frontstage", nome: "Frontstage", lote: "Lote único" },
    { id: "cam", grupo: "Camarote Milagres", nome: "Camarote Open Bar", lote: "3º lote" },
    { id: "vip", grupo: "Área VIP", nome: "Área VIP", lote: "1º lote" },
    { id: "lounge", grupo: "Lounge Praia", nome: "Lounge Praia", lote: "2º lote" },
    { id: "arq", grupo: "Arquibancada", nome: "Arquibancada", lote: "Lote único" },
    { id: "mesa", grupo: "Mesas", nome: "Mesa para 4", lote: "1º lote" },
];
const CATEGORIAS: { id: string; nome: string }[] = [
    { id: "int", nome: "Inteira" },
    { id: "mei", nome: "Meia-entrada" },
    { id: "soc", nome: "Social" },
    { id: "pcd", nome: "PCD" },
];

function gerarIngressos(): Ingresso[] {
    const sessoes = ["s3", "s4", "s5", "s6", "s7", "s8"];
    return sessoes.flatMap((sessaoId) =>
        SETORES.flatMap((setor) => CATEGORIAS.map((cat) => ingresso(`${sessaoId}-${setor.id}-${cat.id}`, sessaoId, setor.grupo, setor.nome, cat.nome, setor.lote))),
    );
}

export const INGRESSOS: Ingresso[] = [
    ingresso("s1-pista-int", "s1", "Pista", "Pista", "Inteira", "1º lote"),
    ingresso("s1-pista-mei", "s1", "Pista", "Pista", "Meia-entrada", "1º lote"),
    ingresso("s1-pista-soc", "s1", "Pista", "Pista", "Social", "1º lote"),
    ingresso("s1-front-int", "s1", "Frontstage", "Frontstage", "Inteira", "Lote único"),
    ingresso("s1-front-mei", "s1", "Frontstage", "Frontstage", "Meia-entrada", "Lote único"),
    ingresso("s1-cam-int", "s1", "Camarote Milagres", "Camarote Open Bar", "Inteira", "2º lote"),
    ingresso("s1-cam-mei", "s1", "Camarote Milagres", "Camarote Open Bar", "Meia-entrada", "2º lote"),
    ingresso("s2-pista-int", "s2", "Pista", "Pista", "Inteira", "1º lote"),
    ingresso("s2-pista-mei", "s2", "Pista", "Pista", "Meia-entrada", "1º lote"),
    ingresso("s2-front-int", "s2", "Frontstage", "Frontstage", "Inteira", "Lote único"),
    ingresso("s2-cam-int", "s2", "Camarote Milagres", "Camarote Open Bar", "Inteira", "2º lote"),
    ingresso("s2-cam-mei", "s2", "Camarote Milagres", "Camarote Open Bar", "Meia-entrada", "2º lote"),
    ...gerarIngressos(),
];

export const PRODUTOS: Produto[] = [
    {
        id: "p-camiseta",
        tipo: "produto",
        sessaoId: "s1",
        nome: "Camiseta oficial",
        descricao: "Algodão • tamanhos P ao GG",
        imagem: "https://picsum.photos/seed/camiseta-milagres/96",
    },
    {
        id: "p-copo",
        tipo: "produto",
        sessaoId: "s1",
        nome: "Copo colecionável",
        descricao: "500 ml",
        imagem: "https://picsum.photos/seed/copo-milagres/96",
    },
    {
        id: "p-estacionamento",
        tipo: "produto",
        sessaoId: "s2",
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
        grupo: "Pista",
        categoria: "4 ingressos",
        componentes: [
            { quantidade: 3, nome: "Pista", categoria: "Inteira" },
            { quantidade: 1, nome: "Copo colecionável", categoria: "Produto" },
        ],
    },
    {
        id: "c-camarote",
        tipo: "combo",
        sessaoId: "s2",
        nome: "Combo Camarote",
        grupo: "Camarote Milagres",
        categoria: "Ingresso + camiseta",
        componentes: [
            { quantidade: 1, nome: "Camarote Open Bar", categoria: "Inteira" },
            { quantidade: 1, nome: "Camiseta oficial", categoria: "Produto" },
        ],
    },
    {
        id: "c-casal",
        tipo: "combo",
        sessaoId: "s3",
        nome: "Combo Casal",
        grupo: "Pista",
        categoria: "2 ingressos",
        componentes: [
            { quantidade: 2, nome: "Pista", categoria: "Inteira" },
        ],
    },
    {
        id: "c-galera",
        tipo: "combo",
        sessaoId: "s3",
        nome: "Combo Galera",
        grupo: "Pista",
        categoria: "6 ingressos",
        componentes: [
            { quantidade: 5, nome: "Pista", categoria: "Inteira" },
            { quantidade: 1, nome: "Pista", categoria: "Meia-entrada" },
        ],
    },
    {
        id: "c-vip-duo",
        tipo: "combo",
        sessaoId: "s4",
        nome: "Combo VIP Duo",
        grupo: "Área VIP",
        categoria: "2 ingressos + copos",
        componentes: [
            { quantidade: 2, nome: "Área VIP", categoria: "Inteira" },
            { quantidade: 2, nome: "Copo colecionável", categoria: "Produto" },
        ],
    },
    {
        id: "c-premium",
        tipo: "combo",
        sessaoId: "s4",
        nome: "Combo Premium",
        grupo: "Pista Premium",
        categoria: "3 ingressos",
        componentes: [
            { quantidade: 3, nome: "Pista Premium", categoria: "Inteira" },
        ],
    },
    {
        id: "c-lounge",
        tipo: "combo",
        sessaoId: "s5",
        nome: "Combo Lounge",
        grupo: "Lounge Praia",
        categoria: "4 ingressos",
        componentes: [
            { quantidade: 4, nome: "Lounge Praia", categoria: "Inteira" },
        ],
    },
    {
        id: "c-front-fa",
        tipo: "combo",
        sessaoId: "s5",
        nome: "Combo Fã",
        grupo: "Frontstage",
        categoria: "Ingresso + camiseta",
        componentes: [
            { quantidade: 1, nome: "Frontstage", categoria: "Inteira" },
            { quantidade: 1, nome: "Camiseta oficial", categoria: "Produto" },
        ],
    },
    {
        id: "c-familia",
        tipo: "combo",
        sessaoId: "s6",
        nome: "Combo Família",
        grupo: "Arquibancada",
        categoria: "4 ingressos",
        componentes: [
            { quantidade: 2, nome: "Arquibancada", categoria: "Inteira" },
            { quantidade: 2, nome: "Arquibancada", categoria: "Meia-entrada" },
        ],
    },
    {
        id: "c-mesa",
        tipo: "combo",
        sessaoId: "s6",
        nome: "Combo Mesa",
        grupo: "Mesas",
        categoria: "Mesa + estacionamento",
        componentes: [
            { quantidade: 1, nome: "Mesa para 4", categoria: "Inteira" },
            { quantidade: 1, nome: "Estacionamento", categoria: "Produto" },
        ],
    },
    {
        id: "c-camarote-trio",
        tipo: "combo",
        sessaoId: "s7",
        nome: "Combo Camarote Trio",
        grupo: "Camarote Milagres",
        categoria: "3 ingressos",
        componentes: [
            { quantidade: 3, nome: "Camarote Open Bar", categoria: "Inteira" },
        ],
    },
    {
        id: "c-fim-de-semana",
        tipo: "combo",
        sessaoId: "s8",
        nome: "Combo Fim de Semana",
        grupo: "Pista",
        categoria: "Ingresso + copo + estacionamento",
        componentes: [
            { quantidade: 1, nome: "Pista", categoria: "Inteira" },
            { quantidade: 1, nome: "Copo colecionável", categoria: "Produto" },
            { quantidade: 1, nome: "Estacionamento", categoria: "Produto" },
        ],
    },
];

export const ITENS: ItemCatalogo[] = [...INGRESSOS, ...PRODUTOS, ...COMBOS];

export const ITEM_POR_ID: Record<string, ItemCatalogo> = Object.fromEntries(ITENS.map((i) => [i.id, i]));

export const SESSAO_POR_ID: Record<string, Sessao> = Object.fromEntries(SESSOES.map((s) => [s.id, s]));

/** Agrupa itens por sessão e, dentro dela, pelo grupo de ingresso — a estrutura dos cards. */
export function agruparPorSessao<T extends ItemCatalogo>(itens: T[]) {
    return SESSOES.map((sessao) => {
        const daSessao = itens.filter((i) => i.sessaoId === sessao.id);
        const grupos = new Map<string, T[]>();
        for (const item of daSessao) {
            const nome = item.tipo === "produto" ? "Produtos" : item.tipo === "combo" ? "Combos" : item.grupo;
            grupos.set(nome, [...(grupos.get(nome) ?? []), item]);
        }
        return { sessao, grupos: [...grupos.entries()].map(([nome, lista]) => ({ nome, itens: lista })) };
    }).filter((s) => s.grupos.length > 0);
}

/** Linha de apoio do item no detalhe do grupo: "Pista · Inteira". */
export function apoioDoItem(item: ItemCatalogo) {
    // Quando o ingresso tem o nome do próprio grupo ("Pista" em "Pista"), repetir não informa nada.
    if (item.tipo === "ingresso") return item.nome === item.grupo ? item.categoria : `${item.grupo} · ${item.categoria}`;
    if (item.tipo === "combo") return `${item.grupo} · ${item.categoria}`;
    return item.descricao;
}
