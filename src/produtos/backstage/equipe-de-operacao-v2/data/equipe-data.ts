/* ------------------------------------------------------------------ */
/*  Catálogo mock do evento para a Equipe de operação.                 */
/*  Itens (ingressos, produtos, combos) agrupados por sessão/grupo.    */
/*  A cota é definida por item; os operadores do grupo consomem a cota */
/*  em conjunto.                                                       */
/* ------------------------------------------------------------------ */

export type ItemKind = "ingresso" | "produto" | "combo";

export interface ItemCombable {
    nome: string;
    tipo: string; // ex.: "Inteira", "Meia", "Camiseta"
}

export interface CatalogoItem extends ItemCombable {
    id: string;
    kind: ItemKind;
    grupo: string; // nome do grupo de ingresso/combo
    /** Imagem do produto (só para kind "produto"). */
    imagem?: string;
    /** Sub-itens de um combo (fixo/dinâmico). */
    componentes?: ItemCombable[];
}

export interface Sessao {
    id: string;
    data: string; // rótulo legível
    itens: CatalogoItem[];
}

/** Liga/desliga o estado vazio bloqueado ("configure itens antes"). */
export const EVENTO_TEM_ITENS = true;

export const SESSOES: Sessao[] = [
    {
        id: "s1",
        data: "08 de agosto às 14:00",
        itens: [
            { id: "i-pista-int", kind: "ingresso", grupo: "Pista", nome: "Pista", tipo: "Inteira" },
            { id: "i-pista-mei", kind: "ingresso", grupo: "Pista", nome: "Pista", tipo: "Meia" },
            { id: "i-pista-soc", kind: "ingresso", grupo: "Pista", nome: "Pista", tipo: "Social" },
            { id: "i-cam-int", kind: "ingresso", grupo: "Camarote", nome: "Camarote", tipo: "Inteira" },
            { id: "i-cam-mei", kind: "ingresso", grupo: "Camarote", nome: "Camarote", tipo: "Meia" },
            { id: "p-camiseta", kind: "produto", grupo: "Produtos oficiais", nome: "Camiseta do evento", tipo: "Unissex", imagem: "https://picsum.photos/seed/camiseta-evento/80" },
            { id: "p-copo", kind: "produto", grupo: "Produtos oficiais", nome: "Copo colecionável", tipo: "500ml", imagem: "https://picsum.photos/seed/copo-colecionavel/80" },
            {
                id: "c-familia",
                kind: "combo",
                grupo: "Combo Família",
                nome: "Combo Família",
                tipo: "4 ingressos",
                componentes: [
                    { nome: "Pista", tipo: "Inteira" },
                    { nome: "Pista", tipo: "Meia" },
                    { nome: "Copo colecionável", tipo: "500ml" },
                ],
            },
        ],
    },
    {
        id: "s2",
        data: "09 de agosto às 12:00",
        itens: [
            { id: "i2-pista-int", kind: "ingresso", grupo: "Pista", nome: "Pista", tipo: "Inteira" },
            { id: "i2-cam-int", kind: "ingresso", grupo: "Camarote", nome: "Camarote", tipo: "Inteira" },
            {
                id: "c2-vip",
                kind: "combo",
                grupo: "Combo VIP",
                nome: "Combo VIP",
                tipo: "Camarote + brinde",
                componentes: [
                    { nome: "Camarote", tipo: "Inteira" },
                    { nome: "Camiseta do evento", tipo: "Unissex" },
                ],
            },
        ],
    },
];

export const KIND_TABS: { id: ItemKind; label: string }[] = [
    { id: "ingresso", label: "Ingressos" },
    { id: "produto", label: "Produtos" },
    { id: "combo", label: "Combos" },
];

/** Cota máxima permitida por item (usada na validação do input). */
export const COTA_MAXIMA = 99999;

/** Índice id → item, para lookups rápidos no resumo/detalhe. */
export const ITENS_POR_ID: Record<string, CatalogoItem> = Object.fromEntries(
    SESSOES.flatMap((s) => s.itens).map((i) => [i.id, i]),
);

/** Sessão à qual um item pertence (para exibir a data no resumo). */
export const SESSAO_DO_ITEM: Record<string, string> = Object.fromEntries(
    SESSOES.flatMap((s) => s.itens.map((i) => [i.id, s.data])),
);

export const rotuloItem = (i: CatalogoItem) => `${i.nome} · ${i.tipo}`;
