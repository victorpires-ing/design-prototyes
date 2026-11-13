/* ------------------------------------------------------------------ */
/*  Pedidos do grupo (ECO-74): os de todos os canais numa lista só.    */
/*                                                                     */
/*  Comissário: as vendas atribuídas ao grupo (link, PDV e bilheteria   */
/*  com comissão, cortesia). PDV, Bilheteria online e Cortesia sem     */
/*  venda atribuída: o protótipo não grava esses pedidos, só o uso de   */
/*  cada item no canal. Aqui o uso vira pedidos de exemplo, sempre      */
/*  iguais para o mesmo grupo, com as pessoas dele como vendedor.       */
/* ------------------------------------------------------------------ */

import type { VendaAtribuida } from "@/plataforma/comissarios";
import type { CanalGrupo, GrupoEquipe } from "@/plataforma/equipe";
import { ITEM_POR_ID, sessaoDoItem } from "./catalogo-evento";

export interface PedidoDoGrupo {
    id: string;
    /** Número do pedido (uuid). */
    pedido: string;
    data: string;
    comprador: string;
    item: string;
    /** Setor, sessão ou tipo do item. */
    detalhe: string;
    quantidade: number;
    canal: CanalGrupo;
    vendedor: string;
    /** Total pago. Cortesia: 0. */
    valor: number;
    status: "pago" | "cancelado";
    /** A venda atribuída ao comissário, quando há (comissão, desconto, valor a mais). */
    venda?: VendaAtribuida;
}

const COMPRADORES = [
    "Ana Ribeiro", "Bruno Carvalho", "Camila Souza", "Diego Martins", "Eduarda Lima", "Felipe Rocha", "Gabriela Alves", "Henrique Dias",
    "Isabela Nogueira", "João Pedro Melo", "Larissa Teixeira", "Marcelo Pinto", "Natália Barros", "Otávio Freitas", "Paula Cardoso", "Rafaela Moura",
    "Sérgio Azevedo", "Tatiane Gomes", "Vinícius Ramos", "Yasmin Correia",
];

/** Gerador determinístico: o mesmo grupo gera sempre os mesmos pedidos. */
function sorteador(semente: string) {
    let h = 2166136261;
    for (let i = 0; i < semente.length; i++) h = Math.imul(h ^ semente.charCodeAt(i), 16777619);
    return () => {
        h += 0x6d2b79f5;
        let t = h;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function uuidDe(r: () => number) {
    const hex = (n: number) => Array.from({ length: n }, () => Math.floor(r() * 16).toString(16)).join("");
    return `${hex(8)}-${hex(4)}-4${hex(3)}-${"89ab"[Math.floor(r() * 4)]}${hex(3)}-${hex(12)}`;
}

/** Referência fixa para as datas de exemplo (não muda a cada render). */
const AGORA = Date.now();
const DIA = 24 * 60 * 60 * 1000;

/** Canal do grupo de uma venda atribuída. Bilheteria do comissário é a do grupo, ou o PDV quando não há bilheteria. */
function canalDaVenda(v: VendaAtribuida, g: GrupoEquipe): CanalGrupo {
    if (v.canal === "online") return "link";
    if (v.canal === "cortesia") return "cortesia";
    return g.canais.bilheteria ? "bilheteria" : "pdv";
}

const nomeDaPessoa = (g: GrupoEquipe, email: string) => g.nomes?.[email] ?? email.split("@")[0];

function detalheDoItem(id: string) {
    const item = ITEM_POR_ID[id];
    if (!item) return "";
    if (item.tipo === "produto") return "Produto";
    const sessao = sessaoDoItem(item)?.curto;
    return [item.tipo === "combo" ? "Combo" : item.grupo, sessao].filter(Boolean).join(", ");
}

export function pedidosDoGrupo(g: GrupoEquipe, vendas: VendaAtribuida[]): PedidoDoGrupo[] {
    const lista: PedidoDoGrupo[] = vendas.map((v) => ({
        id: v.id,
        pedido: v.pedido,
        data: v.data,
        comprador: v.comprador,
        item: v.ingresso,
        detalhe: v.setor,
        quantidade: v.quantidade,
        canal: canalDaVenda(v, g),
        vendedor: v.vendedor,
        valor: v.canal === "cortesia" ? 0 : v.face * v.quantidade,
        status: v.status === "cancelada" ? "cancelado" : "pago",
        venda: v,
    }));

    // Canais que já têm venda atribuída não ganham pedidos de exemplo, para não contar duas vezes.
    const comVenda = new Set(lista.map((p) => p.canal));
    const pessoas = g.operadores.length > 0 ? g.operadores : [g.responsavel ?? "equipe@ingresse.com"];
    for (const canal of ["pdv", "bilheteria", "cortesia"] as const) {
        const cfg = g.canais[canal];
        if (!cfg || comVenda.has(canal)) continue;
        const r = sorteador(`${g.id}:${canal}`);
        for (const [id, usados] of Object.entries(cfg.uso)) {
            const item = ITEM_POR_ID[id];
            if (!item || usados <= 0) continue;
            let falta = usados;
            while (falta > 0) {
                const quantidade = Math.min(falta, 1 + Math.floor(r() * (canal === "cortesia" ? 2 : 4)));
                falta -= quantidade;
                const preco = item.preco ?? 0;
                lista.push({
                    id: `${g.id}-${canal}-${lista.length}`,
                    pedido: uuidDe(r),
                    data: new Date(AGORA - Math.floor(r() * 30 * DIA)).toISOString(),
                    comprador: COMPRADORES[Math.floor(r() * COMPRADORES.length)],
                    item: item.nome,
                    detalhe: detalheDoItem(id),
                    quantidade,
                    canal,
                    vendedor: nomeDaPessoa(g, pessoas[Math.floor(r() * pessoas.length)]),
                    valor: canal === "cortesia" ? 0 : preco * quantidade,
                    status: canal !== "cortesia" && r() < 0.03 ? "cancelado" : "pago",
                });
            }
        }
    }
    return lista.sort((a, b) => b.data.localeCompare(a.data));
}
