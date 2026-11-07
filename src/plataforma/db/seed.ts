import { EVENTOS as EVENTOS_SITE } from "@/produtos/novo-site/home/data/events";
import type { Evento, EventoStatus, Grupo, Sessao, Usuario } from "../modelo";
import { slugificar } from "../regras";

/* ------------------------------------------------------------------ */
/*  Mundo inicial do banco                                             */
/*                                                                     */
/*  Junta os eventos que já existiam no Backstage e no novo site, cada */
/*  um com um catálogo de ingressos gerado. Mudou a seed? Suba         */
/*  SEED_VERSAO: o servidor grava só os documentos que ainda não       */
/*  existem, então nada criado por alguém é sobrescrito.               */
/* ------------------------------------------------------------------ */

export const SEED_VERSAO = "2026-11-07.1";

const CRIADO = "2026-11-07T12:00:00.000Z";

/** Catálogo padrão: Pista (inteira + meia) e Camarote, dois lotes cada. */
export function catalogoPadrao(eventoId: string, inicios: string[], precoBase: number): Sessao[] {
    const p = Math.max(precoBase, 20);
    return inicios.map((inicio, si) => {
        const s = `${eventoId}-s${si + 1}`;
        const grupos: Grupo[] = [
            {
                id: `${s}-pista`,
                nome: "Pista",
                acesso: "Portão A",
                ingressos: [
                    {
                        id: `${s}-pista-inteira`,
                        nome: "Inteira",
                        beneficio: "inteira",
                        ativo: true,
                        lotes: [
                            { id: `${s}-pista-inteira-l1`, nome: "1º lote", preco: p, quantidade: 300 },
                            { id: `${s}-pista-inteira-l2`, nome: "2º lote", preco: Math.round(p * 1.2), quantidade: 500 },
                        ],
                    },
                    {
                        id: `${s}-pista-meia`,
                        nome: "Meia-entrada",
                        beneficio: "meia-entrada",
                        descricao: "Estudantes, pessoas com deficiência, idosos e jovens de baixa renda, com documento na entrada.",
                        ativo: true,
                        lotes: [
                            { id: `${s}-pista-meia-l1`, nome: "1º lote", preco: Math.round(p / 2), quantidade: 120 },
                            { id: `${s}-pista-meia-l2`, nome: "2º lote", preco: Math.round((p * 1.2) / 2), quantidade: 200 },
                        ],
                    },
                ],
            },
            {
                id: `${s}-camarote`,
                nome: "Camarote",
                acesso: "Portão VIP",
                ingressos: [
                    {
                        id: `${s}-camarote-inteira`,
                        nome: "Inteira",
                        beneficio: "inteira",
                        descricao: "Open bar e área exclusiva com vista para o palco.",
                        ativo: true,
                        lotes: [
                            { id: `${s}-camarote-inteira-l1`, nome: "1º lote", preco: Math.round(p * 2.5), quantidade: 80 },
                            { id: `${s}-camarote-inteira-l2`, nome: "2º lote", preco: Math.round(p * 3), quantidade: 120 },
                        ],
                    },
                ],
            },
        ];
        return { id: s, inicio, grupos };
    });
}

/** Um início por dia entre data e dataFim (festival de vários dias). */
const diasEntre = (data: string, fim: string | undefined, hora: string) => {
    const out: string[] = [];
    const d = new Date(`${data}T12:00`);
    const f = new Date(`${fim ?? data}T12:00`);
    while (d <= f && out.length < 7) {
        out.push(`${d.toISOString().slice(0, 10)}T${hora}`);
        d.setDate(d.getDate() + 1);
    }
    return out;
};

const evento = (e: Omit<Evento, "slug" | "criadoEm" | "atualizadoEm" | "taxaServico"> & { taxaServico?: number }): Evento => ({
    taxaServico: 0.1,
    ...e,
    slug: slugificar(e.nome),
    criadoEm: CRIADO,
    atualizadoEm: CRIADO,
});

/** Os cinco eventos da listagem do Backstage. */
const BACKSTAGE: { id: string; nome: string; produtora: string; capa: string; status: EventoStatus; data: string; local: string; cidade: string; preco: number }[] = [
    { id: "6704", nome: "MOCHAKK CALLING 2026", produtora: "Mochakk Calling", capa: "https://kraken.ingresse.com/event/posters/103691/large/1787000382.8580675.jpg", status: "publicado", data: "2026-10-03T22:00", local: "Mercado Pago Hall", cidade: "São Paulo", preco: 180 },
    { id: "2871", nome: "Laroc apresenta: RAVE THE WORLD by Alok", produtora: "Laroc", capa: "https://kraken.ingresse.com/event/posters/104600/large/1786025742.4637246.jpg", status: "publicado", data: "2026-10-17T22:00", local: "Laroc Club", cidade: "Valinhos", preco: 220 },
    { id: "3390", nome: "D-EDGE RIO apresenta IN DA CLUB W/ JUICCE", produtora: "D-EDGE", capa: "https://kraken.ingresse.com/event/posters/108467/large/1790120499.9730182.jpg", status: "publicado", data: "2026-10-02T23:00", local: "D-EDGE Rio", cidade: "Rio de Janeiro", preco: 80 },
    { id: "5518", nome: "FREAK CHIC D-EDGE SP pres.: P1: BACKFOR3. D.MARCO. MISS BELINI (BDAY). SOL", produtora: "D-EDGE", capa: "https://kraken.ingresse.com/event/posters/108847/large/1790802263.758427.jpg", status: "publicado", data: "2026-10-02T23:00", local: "D-EDGE", cidade: "São Paulo", preco: 90 },
    { id: "4102", nome: "D-EDGE RIO apresenta INCEPTION", produtora: "D-EDGE", capa: "https://kraken.ingresse.com/event/posters/108445/large/1790030930.3048496.jpg", status: "rascunho", data: "2026-10-16T23:00", local: "D-EDGE Rio", cidade: "Rio de Janeiro", preco: 80 },
];

const eventosBackstage: Evento[] = BACKSTAGE.map((b) =>
    evento({
        id: b.id,
        nome: b.nome,
        produtora: b.produtora,
        status: b.status,
        capa: b.capa,
        local: b.local,
        cidade: b.cidade,
        data: b.data,
        sessoes: catalogoPadrao(b.id, [b.data], b.preco),
        vitrine: { categoria: "eletronica", tags: ["eletrônica", "club"] },
    }),
);

/** Os eventos do novo site. A vitrine rica (lineup, futebol, vídeo) continua no mock do site, pelo mesmo id. */
const eventosSite: Evento[] = EVENTOS_SITE.map((s) => {
    const inicios = diasEntre(s.data, s.dataFim, "20:00");
    return evento({
        id: s.id,
        nome: s.titulo,
        produtora: s.artista ?? "Produtora parceira",
        status: "publicado",
        capa: s.cover,
        local: s.local,
        cidade: s.cidade,
        data: inicios[0],
        sessoes: catalogoPadrao(s.id, inicios, s.preco),
        vitrine: { artista: s.artista, categoria: s.categoria, tags: s.tags, descricao: s.descricao },
    });
});

const usuarios: Usuario[] = [{ id: "u_demo", nome: "Victor Pires da Costa", email: "victor.demo@exemplo.com" }];

export const SEED = {
    eventos: [...eventosBackstage, ...eventosSite],
    pedidos: [],
    ingressos: [],
    usuarios,
};
