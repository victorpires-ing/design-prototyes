import { EVENTOS as EVENTOS_SITE } from "@/produtos/novo-site/home/data/events";
import type { Evento, EventoStatus, Grupo, HistoricoVendas, Organizacao, Sessao, Usuario } from "../modelo";
import { idDaOrganizacao, siglaDe, slugificar } from "../regras";

/* ------------------------------------------------------------------ */
/*  Mundo inicial do banco                                             */
/*                                                                     */
/*  Junta os eventos que já existiam no Backstage e no novo site, cada */
/*  um com um catálogo de ingressos gerado. Mudou a seed? Suba         */
/*  SEED_VERSAO: o servidor grava só os documentos que ainda não       */
/*  existem, então nada criado por alguém é sobrescrito.               */
/* ------------------------------------------------------------------ */

export const SEED_VERSAO = "2026-11-13.1";

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
                tipoAcesso: "qr",
                capacidade: 1120,
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
                tipoAcesso: "qr",
                capacidade: 200,
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
    organizacaoId: idDaOrganizacao(e.produtora),
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

/* ------------------------------------------------------------------ */
/*  Vendas anteriores ao gêmeo (coleção historico)                     */
/*                                                                     */
/*  Só os eventos publicados do Backstage têm passado, para o painel   */
/*  da organização contar uma história. Determinístico: mesma seed,    */
/*  mesmos números em qualquer aparelho.                               */
/* ------------------------------------------------------------------ */

function aleatorio(seed: number) {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

interface PerfilVendas {
    /** Fração do estoque já vendida. */
    ocupacao: number;
    /** Dias de venda até ontem. */
    janela: number;
    /** Ritmo da última semana contra a anterior (abaixo de 1 = desacelerando). */
    ritmo: number;
    /** Meta de faturamento como fração do faturamento máximo possível. */
    meta: number;
    bilheteria: number;
    cortesias: number;
    seed: number;
}

const PERFIS: Record<string, PerfilVendas> = {
    "6704": { ocupacao: 0.63, janela: 120, ritmo: 1.18, meta: 0.85, bilheteria: 0.1, cortesias: 24, seed: 41 },
    "2871": { ocupacao: 0.71, janela: 60, ritmo: 1.5, meta: 0.8, bilheteria: 0.05, cortesias: 18, seed: 7 },
    "3390": { ocupacao: 0.34, janela: 45, ritmo: 0.6, meta: 0.75, bilheteria: 0.12, cortesias: 10, seed: 13 },
    "5518": { ocupacao: 0.52, janela: 40, ritmo: 0.95, meta: 0.9, bilheteria: 0.08, cortesias: 12, seed: 29 },
};

function historicoDe(ev: Evento, p: PerfilVendas): HistoricoVendas {
    const rand = aleatorio(p.seed);
    const porLote: Record<string, number> = {};
    let total = 0;
    let face = 0;
    let faceMaxima = 0;
    for (const sessao of ev.sessoes)
        for (const grupo of sessao.grupos)
            for (const tipo of grupo.ingressos) {
                const capacidade = tipo.lotes.reduce((t, l) => t + l.quantidade, 0);
                let resta = Math.round(capacidade * p.ocupacao * (0.8 + rand() * 0.4));
                for (const lote of tipo.lotes) {
                    faceMaxima += lote.quantidade * lote.preco;
                    const qtd = Math.min(lote.quantidade, resta);
                    if (qtd > 0) porLote[lote.id] = qtd;
                    resta -= qtd;
                    total += qtd;
                    face += qtd * lote.preco;
                }
            }

    const cortesia = Math.min(p.cortesias, Math.round(total * 0.05));
    const bilheteria = Math.round((total - cortesia) * p.bilheteria);
    const pagos = total - cortesia;
    const ticket = total ? face / total : 0;

    // Curva de vendas: abre forte, cai no meio e acelera perto do evento; a última semana
    // segue o ritmo do perfil contra a anterior.
    const pesos = Array.from({ length: p.janela }, (_, d) => {
        const x = d / Math.max(1, p.janela - 1);
        const curva = 0.6 * Math.exp(-x * 6) + 0.25 + 0.9 * x * x;
        const semana = d >= p.janela - 7 ? p.ritmo : 1;
        return curva * semana * (0.75 + rand() * 0.5);
    });
    const soma = pesos.reduce((t, v) => t + v, 0);
    let distribuidos = 0;
    const serie = pesos.map((w, d): [number, number, number] => {
        const ingressos = d === p.janela - 1 ? total - distribuidos : Math.round((total * w) / soma);
        distribuidos += ingressos;
        const pagosDia = Math.round(ingressos * (pagos / Math.max(1, total)));
        return [ingressos, Math.round(ingressos * 0.07 * rand() * 2), Math.round(pagosDia * ticket)];
    });

    const pedidos = Math.round(pagos * 0.62);
    return {
        id: ev.id,
        eventoId: ev.id,
        meta: Math.round((faceMaxima * p.meta) / 1000) * 1000,
        porLote,
        porCanal: { online: pagos - bilheteria, bilheteria, cortesia },
        pagamentos: [
            { tipo: "Cartão de crédito", qtd: Math.round(pedidos * 0.64) },
            { tipo: "Pix", qtd: Math.round(pedidos * 0.27) },
            { tipo: "Dinheiro", qtd: Math.round(pedidos * 0.04) },
            { tipo: "Cartão de débito", qtd: Math.round(pedidos * 0.05) },
        ],
        serie,
    };
}

const historico: HistoricoVendas[] = eventosBackstage.filter((e) => PERFIS[e.id]).map((e) => historicoDe(e, PERFIS[e.id]));

const usuarios: Usuario[] = [{ id: "u_demo", nome: "Victor Pires da Costa", email: "victor.demo@exemplo.com" }];

/** Uma organização por produtora dos eventos da seed (o primeiro nome visto vence). */
const organizacoes: Organizacao[] = [
    ...new Map(
        [...eventosBackstage, ...eventosSite].map((e) => [e.organizacaoId!, { id: e.organizacaoId!, nome: e.produtora, sigla: siglaDe(e.produtora), criadoEm: CRIADO }] as const).reverse(),
    ).values(),
    // Organização sem evento: para começar do zero (criar o primeiro evento, o estado vazio de Eventos).
    { id: idDaOrganizacao("Ingresse"), nome: "Ingresse", sigla: siglaDe("Ingresse"), criadoEm: "2026-11-13T12:00:00.000Z" },
];

export const SEED = {
    organizacoes,
    eventos: [...eventosBackstage, ...eventosSite],
    pedidos: [],
    ingressos: [],
    usuarios,
    historico,
};
