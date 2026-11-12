/* ------------------------------------------------------------------ */
/*  Grupos de exemplo da listagem.                                     */
/*                                                                      */
/*  O participante começa no estado vazio e cria o primeiro grupo;     */
/*  ao voltar para a listagem, encontra o dele no topo e estes logo    */
/*  abaixo — cobrindo as combinações de atuação e de cota, com uso     */
/*  simulado e um grupo inativo, para dar a visão completa.            */
/* ------------------------------------------------------------------ */

import { canalNovo, type CanalGrupo, type CotaGrupo, type GrupoEquipe } from "@/plataforma/equipe";
import { INGRESSOS, PRODUTOS, COMBOS, type ItemCatalogo } from "./catalogo-evento";
import { GRUPO_MEMBROS_POR_ID } from "./membros";

interface Exemplo {
    id: string;
    nome: string;
    ativo?: boolean;
    atuacao: Exclude<CanalGrupo, "link">;
    grupoMembrosId: string;
    /** Pessoas incluídas por e-mail, fora do grupo de Membros. */
    avulsos?: string[];
    operadoresInativos?: string[];
    /** Item → quanto já foi operado dele. */
    uso: Record<string, number>;
    cota: CotaGrupo;
    /** Há quantos dias o grupo foi criado — só para ordenar de forma plausível. */
    diasAtras: number;
}

const EXEMPLOS: Exemplo[] = [
    {
        id: "ex-bilheteria-portaria",
        nome: "Bilheteria Portaria",
        atuacao: "bilheteria",
        grupoMembrosId: "m-bilheteria",
        uso: { "s1-pista-int": 74, "s1-pista-mei": 38, "s2-pista-int": 16 },
        cota: { tipo: "sem-limite", total: 0, porItem: {} },
        diasAtras: 2,
    },
    {
        id: "ex-promoters",
        nome: "Promoters",
        atuacao: "cortesia",
        grupoMembrosId: "m-promoters",
        avulsos: ["dj.convidado@gmail.com", "rp.parceira@gmail.com"],
        operadoresInativos: ["nando.promo@gmail.com"],
        uso: { "s1-pista-int": 96, "s1-front-int": 52, "s2-pista-int": 36 },
        cota: { tipo: "compartilhada", total: 300, porItem: {} },
        diasAtras: 4,
    },
    {
        id: "ex-camarote-vip",
        nome: "Camarote VIP",
        atuacao: "pdv",
        grupoMembrosId: "m-camarote",
        uso: { "s1-cam-int": 62, "s1-cam-mei": 30, "p-copo": 15, "c-camarote": 12 },
        cota: { tipo: "por-item", total: 0, porItem: { "s1-cam-int": 100, "s1-cam-mei": 50, "p-copo": 40, "c-camarote": 20 } },
        diasAtras: 6,
    },
    {
        id: "ex-equipe-pdv",
        nome: "Equipe de PDV",
        atuacao: "pdv",
        grupoMembrosId: "m-pdv",
        uso: { "s1-pista-int": 188, "s1-pista-mei": 97, "p-copo": 84, "c-amigos": 43 },
        cota: { tipo: "compartilhada", total: 500, porItem: {} },
        diasAtras: 9,
    },
    {
        id: "ex-producao",
        nome: "Produção",
        atuacao: "cortesia",
        grupoMembrosId: "m-producao",
        uso: { "s1-pista-int": 18, "s1-front-int": 20, "p-camiseta": 9 },
        cota: { tipo: "por-item", total: 0, porItem: { "s1-pista-int": 40, "s1-front-int": 20, "p-camiseta": 30 } },
        diasAtras: 12,
    },
    {
        id: "ex-hostess",
        nome: "Hostess",
        ativo: false,
        atuacao: "bilheteria",
        grupoMembrosId: "m-hostess",
        uso: { "s1-cam-int": 14, "s2-cam-int": 7 },
        cota: { tipo: "sem-limite", total: 0, porItem: {} },
        diasAtras: 15,
    },
];

/** Reparte o total entre os operadores de forma desigual (quem opera mais aparece primeiro). */
function repartir(total: number, emails: string[]): Record<string, number> {
    const pesos = emails.map((_, i) => emails.length - i);
    const soma = pesos.reduce((a, b) => a + b, 0);
    const partes = pesos.map((p) => Math.floor((total * p) / soma));
    partes[0] += total - partes.reduce((a, b) => a + b, 0);
    return Object.fromEntries(emails.map((e, i) => [e, partes[i]]));
}

/**
 * Os exemplos foram escritos com ids de modelo ("s1-pista-int", "p-copo", "c-casal"). Cada id vira
 * um item real do evento em contexto, do mesmo tipo e na ordem em que aparece (EO3-50).
 */
function mapaDeItens(): Map<string, string> {
    const mapa = new Map<string, string>();
    const usados = { ingresso: 0, produto: 0, combo: 0 };
    const reais: Record<keyof typeof usados, ItemCatalogo[]> = { ingresso: INGRESSOS, produto: PRODUTOS, combo: COMBOS };
    for (const ex of EXEMPLOS)
        for (const id of [...Object.keys(ex.uso), ...Object.keys(ex.cota.porItem)]) {
            if (mapa.has(id)) continue;
            const tipo = id.startsWith("p-") ? "produto" : id.startsWith("c-") ? "combo" : "ingresso";
            const lista = reais[tipo];
            if (lista.length === 0) continue;
            mapa.set(id, lista[usados[tipo]++ % lista.length].id);
        }
    return mapa;
}

const trocarChaves = (obj: Record<string, number>, mapa: Map<string, string>) => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(obj)) {
        const real = mapa.get(k);
        if (real) out[real] = (out[real] ?? 0) + v;
    }
    return out;
};

/**
 * Os 6 grupos de exemplo do evento, sem comissário e com um canal cada (ECO-06). Os ids levam o
 * evento: cada evento tem os seus no store.
 */
export function gruposDeExemplo(eventoId: string, organizacaoId: string): GrupoEquipe[] {
    const agora = Date.now();
    const mapa = mapaDeItens();
    return EXEMPLOS.map((exModelo) => {
        const ex = { ...exModelo, uso: trocarChaves(exModelo.uso, mapa), cota: { ...exModelo.cota, porItem: trocarChaves(exModelo.cota.porItem, mapa) } };
        const avulsos = ex.avulsos ?? [];
        const operadores = [...new Set([...(GRUPO_MEMBROS_POR_ID[ex.grupoMembrosId]?.emails ?? []), ...avulsos])];
        const usado = Object.values(ex.uso).reduce((a, b) => a + b, 0);
        return {
            id: `${eventoId}-${ex.id}`,
            eventoId,
            organizacaoId,
            nome: ex.nome,
            ativo: ex.ativo ?? true,
            criadoEm: new Date(agora - ex.diasAtras * 86_400_000).toISOString(),
            gruposMembrosIds: [ex.grupoMembrosId],
            emailsAvulsos: avulsos,
            operadores,
            operadoresInativos: ex.operadoresInativos ?? [],
            gruposInativos: [],
            emitidosPorOperador: repartir(usado, operadores),
            comissarioId: null,
            condicoes: null,
            canais: { [ex.atuacao]: { ...canalNovo(ex.atuacao), itens: Object.keys(ex.uso), cota: ex.cota, uso: ex.uso } },
        };
    });
}
