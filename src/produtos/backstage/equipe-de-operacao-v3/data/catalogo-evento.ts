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
];

export const ITENS: ItemCatalogo[] = [...INGRESSOS, ...PRODUTOS, ...COMBOS];

export const ITEM_POR_ID: Record<string, ItemCatalogo> = Object.fromEntries(ITENS.map((i) => [i.id, i]));

export const SESSAO_POR_ID: Record<string, Sessao> = Object.fromEntries(SESSOES.map((s) => [s.id, s]));

/** Limite de itens por grupo — o resumo mostra "N de 10 itens selecionados". */
export const MAX_ITENS = 10;

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
