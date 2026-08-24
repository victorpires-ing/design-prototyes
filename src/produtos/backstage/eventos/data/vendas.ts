import { eventos, type Evento } from "./eventos";

/**
 * Métricas de venda por evento.
 *
 * Mock determinístico (mesma seed → mesma série), para que a listagem da
 * organização, o painel do evento e o comparativo contem a mesma história.
 */

/** Hoje fixo, para o protótipo não mudar de comportamento com o passar dos dias. */
export const HOJE = new Date("2026-08-24T12:00:00");

export type Canal = "ingresse" | "parceiro" | "cortesia";

export const CANAL_LABEL: Record<Canal, string> = {
    ingresse: "Ingresse",
    parceiro: "Parceiro",
    cortesia: "Cortesias",
};

export const CANAL_COR: Record<Canal, string> = {
    ingresse: "var(--color-utility-blue-500)",
    parceiro: "var(--color-utility-orange-500)",
    cortesia: "var(--color-utility-gray-400)",
};

export interface Sessao {
    id: string;
    nome: string;
    ambiente: string;
    dataLabel: string;
    capacidade: number;
    vendas: Record<Canal, number>;
}

export interface DiaVenda {
    /** Dias desde a abertura das vendas. */
    dia: number;
    dataISO: string;
    ingressos: number;
    faturamento: number;
}

export interface VendasEvento {
    eventoId: string;
    aberturaISO: string;
    metaFaturamento: number;
    sessoes: Sessao[];
    serie: DiaVenda[];
    pagamentos: Array<{ tipo: string; qtd: number }>;
}

/* ------------------------------------------------------------------ */
/*  Geração determinística                                             */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const diasEntre = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);

const addDias = (date: Date, dias: number) => new Date(date.getTime() + dias * 86_400_000);

interface Spec {
    eventoId: string;
    /** Dias de venda até a data do evento. */
    janelaDias: number;
    capacidadePorSessao: number;
    sessoes: Array<{ nome: string; ambiente: string; peso: number }>;
    ticketBase: number;
    /** Fração da capacidade já vendida hoje. */
    ocupacaoAlvo: number;
    metaFaturamento: number;
    /** Multiplicador do ritmo da última semana — abaixo de 1 significa desaceleração. */
    ritmoRecente: number;
    parceiroPct: number;
    cortesias: number;
    seed: number;
}

const SPECS: Spec[] = [
    {
        eventoId: "6704",
        janelaDias: 300,
        capacidadePorSessao: 3200,
        sessoes: [
            { nome: "AURA", ambiente: "Night Celebrations", peso: 1 },
            { nome: "LUAU", ambiente: "Night Celebrations", peso: 0.96 },
            { nome: "AQUA", ambiente: "Night Celebrations", peso: 0.92 },
            { nome: "Réveillon", ambiente: "Night Celebrations", peso: 1.08 },
            { nome: "FLORA", ambiente: "Night Celebrations", peso: 0.74 },
            { nome: "Beach Day 30/12", ambiente: "Mouton Beach Club", peso: 0.61 },
            { nome: "Beach Day 02/01", ambiente: "Mouton Beach Club", peso: 0.48 },
        ],
        ticketBase: 780,
        ocupacaoAlvo: 0.63,
        metaFaturamento: 15_000_000,
        ritmoRecente: 1.18,
        parceiroPct: 0.14,
        cortesias: 210,
        seed: 41,
    },
    {
        eventoId: "2871",
        janelaDias: 60,
        capacidadePorSessao: 55_000,
        sessoes: [{ nome: "Gre-Nal 445", ambiente: "Arena do Grêmio", peso: 1 }],
        ticketBase: 180,
        ocupacaoAlvo: 0.71,
        metaFaturamento: 12_000_000,
        ritmoRecente: 1.45,
        parceiroPct: 0.05,
        cortesias: 1400,
        seed: 7,
    },
    {
        eventoId: "3390",
        janelaDias: 90,
        capacidadePorSessao: 420,
        sessoes: [{ nome: "Tour + Museu", ambiente: "Arena do Grêmio", peso: 1 }],
        ticketBase: 95,
        ocupacaoAlvo: 0.28,
        metaFaturamento: 42_000,
        ritmoRecente: 0.42,
        parceiroPct: 0.22,
        cortesias: 12,
        seed: 19,
    },
    {
        eventoId: "5518",
        janelaDias: 70,
        capacidadePorSessao: 90,
        sessoes: [{ nome: "Book no gramado", ambiente: "Arena do Grêmio", peso: 1 }],
        ticketBase: 640,
        ocupacaoAlvo: 0.44,
        metaFaturamento: 60_000,
        ritmoRecente: 0.88,
        parceiroPct: 0,
        cortesias: 4,
        seed: 63,
    },
    {
        eventoId: "1234",
        janelaDias: 45,
        capacidadePorSessao: 31_000,
        sessoes: [{ nome: "América x Laguna", ambiente: "Arena das Dunas", peso: 1 }],
        ticketBase: 70,
        ocupacaoAlvo: 0.93,
        metaFaturamento: 1_900_000,
        ritmoRecente: 1,
        parceiroPct: 0.03,
        cortesias: 900,
        seed: 88,
    },
];

function build(spec: Spec, evento: Evento): VendasEvento {
    const rand = mulberry32(spec.seed);
    const dataEvento = new Date(evento.data);
    const abertura = addDias(dataEvento, -spec.janelaDias);
    // Eventos já realizados têm a série completa; os ativos param em hoje.
    const diasCorridos = Math.min(spec.janelaDias, Math.max(1, diasEntre(abertura, HOJE)));

    const capacidadeTotal = spec.sessoes.reduce((total, s) => total + Math.round(spec.capacidadePorSessao * s.peso), 0);
    const ingressosVendidos = Math.round(capacidadeTotal * spec.ocupacaoAlvo);

    // Curva em S: devagar no começo, acelera perto do evento.
    const pesos: number[] = [];
    for (let dia = 0; dia < diasCorridos; dia++) {
        const t = dia / Math.max(1, spec.janelaDias - 1);
        const base = 0.25 + Math.pow(t, 2.4) * 3.4;
        const ruido = 0.65 + rand() * 0.7;
        const recente = dia >= diasCorridos - 7 ? spec.ritmoRecente : 1;
        pesos.push(base * ruido * recente);
    }
    const somaPesos = pesos.reduce((a, b) => a + b, 0);

    let acumulado = 0;
    const serie: DiaVenda[] = pesos.map((peso, dia) => {
        const ingressos = Math.round((peso / somaPesos) * ingressosVendidos);
        acumulado += ingressos;
        const ticket = spec.ticketBase * (0.85 + (dia / Math.max(1, diasCorridos)) * 0.45);
        return {
            dia,
            dataISO: addDias(abertura, dia).toISOString().slice(0, 10),
            ingressos,
            faturamento: Math.round(ingressos * ticket),
        };
    });

    // Ajusta o último dia para bater exatamente com o total.
    if (serie.length) serie[serie.length - 1].ingressos += ingressosVendidos - acumulado;

    const sessoes: Sessao[] = spec.sessoes.map((s, index) => {
        const capacidade = Math.round(spec.capacidadePorSessao * s.peso);
        const vendidos = Math.round(capacidade * spec.ocupacaoAlvo * (0.82 + rand() * 0.36));
        const parceiro = Math.round(vendidos * spec.parceiroPct);
        const cortesia = Math.round(spec.cortesias / spec.sessoes.length);
        return {
            id: `${spec.eventoId}-s${index}`,
            nome: s.nome,
            ambiente: s.ambiente,
            dataLabel: evento.dataLabel,
            capacidade,
            vendas: {
                ingresse: Math.max(0, Math.min(capacidade - parceiro - cortesia, vendidos - parceiro)),
                parceiro,
                cortesia,
            },
        };
    });

    const totalPagamentos = Math.round(ingressosVendidos * 0.62);
    return {
        eventoId: spec.eventoId,
        aberturaISO: abertura.toISOString().slice(0, 10),
        metaFaturamento: spec.metaFaturamento,
        sessoes,
        serie,
        pagamentos: [
            { tipo: "Cartão de crédito", qtd: Math.round(totalPagamentos * 0.64) },
            { tipo: "Pix", qtd: Math.round(totalPagamentos * 0.24) },
            { tipo: "Boleto", qtd: Math.round(totalPagamentos * 0.07) },
            { tipo: "Saldo do produtor", qtd: Math.round(totalPagamentos * 0.05) },
        ],
    };
}

const VENDAS = new Map<string, VendasEvento>(
    SPECS.map((spec) => {
        const evento = eventos.find((e) => e.id === spec.eventoId)!;
        return [spec.eventoId, build(spec, evento)];
    }),
);

export const vendasDoEvento = (eventoId: string) => VENDAS.get(eventoId) ?? null;

/* ------------------------------------------------------------------ */
/*  Métricas derivadas                                                 */
/* ------------------------------------------------------------------ */

export interface ResumoEvento {
    evento: Evento;
    vendas: VendasEvento | null;
    capacidade: number;
    vendidos: number;
    porCanal: Record<Canal, number>;
    ocupacao: number;
    faturamento: number;
    meta: number;
    ticketMedio: number;
    /** Ingressos/dia nos últimos 7 dias. */
    ritmo7: number;
    /** Variação do ritmo contra os 7 dias anteriores. */
    variacaoRitmo: number;
    diasParaEvento: number;
    /** Projeção de faturamento no dia do evento, limitada pela capacidade. */
    projecao: number;
    sparkline: number[];
}

const somaCanais = (sessoes: Sessao[]): Record<Canal, number> =>
    sessoes.reduce(
        (acc, s) => ({
            ingresse: acc.ingresse + s.vendas.ingresse,
            parceiro: acc.parceiro + s.vendas.parceiro,
            cortesia: acc.cortesia + s.vendas.cortesia,
        }),
        { ingresse: 0, parceiro: 0, cortesia: 0 },
    );

export function resumoDoEvento(evento: Evento): ResumoEvento {
    const vendas = vendasDoEvento(evento.id);
    const diasParaEvento = diasEntre(HOJE, new Date(evento.data));

    if (!vendas) {
        return {
            evento,
            vendas: null,
            capacidade: 0,
            vendidos: 0,
            porCanal: { ingresse: 0, parceiro: 0, cortesia: 0 },
            ocupacao: 0,
            faturamento: 0,
            meta: 0,
            ticketMedio: 0,
            ritmo7: 0,
            variacaoRitmo: 0,
            diasParaEvento,
            projecao: 0,
            sparkline: [],
        };
    }

    const capacidade = vendas.sessoes.reduce((total, s) => total + s.capacidade, 0);
    const porCanal = somaCanais(vendas.sessoes);
    const vendidos = porCanal.ingresse + porCanal.parceiro + porCanal.cortesia;
    const faturamento = vendas.serie.reduce((total, d) => total + d.faturamento, 0);

    const ultimos7 = vendas.serie.slice(-7);
    const anteriores7 = vendas.serie.slice(-14, -7);
    const ritmo7 = ultimos7.reduce((t, d) => t + d.ingressos, 0) / Math.max(1, ultimos7.length);
    const ritmoAnterior = anteriores7.reduce((t, d) => t + d.ingressos, 0) / Math.max(1, anteriores7.length);

    const faturamentoDia7 = ultimos7.reduce((t, d) => t + d.faturamento, 0) / Math.max(1, ultimos7.length);
    const ticketMedio = vendidos ? faturamento / vendidos : 0;
    // O ritmo atual projetado até o dia do evento não pode passar do teto físico:
    // vender toda a capacidade pelo ticket médio praticado.
    const teto = capacidade * ticketMedio;
    const projecao = Math.min(teto, faturamento + Math.max(0, diasParaEvento) * faturamentoDia7);

    return {
        evento,
        vendas,
        capacidade,
        vendidos,
        porCanal,
        ocupacao: capacidade ? vendidos / capacidade : 0,
        faturamento,
        meta: vendas.metaFaturamento,
        ticketMedio,
        ritmo7,
        variacaoRitmo: ritmoAnterior ? ritmo7 / ritmoAnterior - 1 : 0,
        diasParaEvento,
        projecao,
        sparkline: vendas.serie.slice(-30).map((d) => d.ingressos),
    };
}

export const resumos = () => eventos.map(resumoDoEvento);

/* ------------------------------------------------------------------ */
/*  Alertas — o que precisa de atenção hoje                            */
/* ------------------------------------------------------------------ */

export type AlertaTom = "error" | "warning" | "success";

export interface Alerta {
    id: string;
    evento: Evento;
    tom: AlertaTom;
    titulo: string;
    detalhe: string;
    acao: string;
    href: string;
    /** Pergunta que o Remix responde sobre esse sinal. */
    pergunta: string;
}

const pct = (valor: number) => `${Math.round(Math.abs(valor) * 100)}%`;

export function alertas(): Alerta[] {
    const lista: Alerta[] = [];

    for (const resumo of resumos()) {
        const { evento, diasParaEvento } = resumo;
        if (evento.status === "encerrado") continue;

        if (evento.status === "rascunho" && diasParaEvento <= 60) {
            lista.push({
                id: `${evento.id}-rascunho`,
                evento,
                tom: "error",
                titulo: "Ainda em rascunho",
                detalhe: `Faltam ${diasParaEvento} dias e o evento não está publicado — nenhum ingresso pode ser vendido.`,
                acao: "Publicar evento",
                href: "/backstage/catalogo/ingressos",
                pergunta: "O que falta para publicar este evento?",
            });
            continue;
        }

        if (resumo.variacaoRitmo <= -0.25) {
            lista.push({
                id: `${evento.id}-ritmo`,
                evento,
                tom: "warning",
                titulo: `Ritmo caiu ${pct(resumo.variacaoRitmo)}`,
                detalhe: `De ${Math.round(resumo.ritmo7 / (1 + resumo.variacaoRitmo))} para ${Math.round(resumo.ritmo7)} ingressos/dia na última semana.`,
                acao: "Ver velocidade",
                href: "/backstage/evento/visao-geral",
                pergunta: "Como está o ritmo de vendas?",
            });
        }

        if (resumo.meta && resumo.projecao < resumo.meta * 0.9 && diasParaEvento > 0) {
            lista.push({
                id: `${evento.id}-meta`,
                evento,
                tom: "warning",
                titulo: "Meta em risco",
                detalhe: `No ritmo atual chega a ${pct(resumo.projecao / resumo.meta)} da meta até o dia do evento.`,
                acao: "Ver painel",
                href: "/backstage/evento/visao-geral",
                pergunta: "Vou bater a meta de faturamento?",
            });
        }

        const sessoesFracas = (resumo.vendas?.sessoes ?? []).filter(
            (s) => (s.vendas.ingresse + s.vendas.parceiro + s.vendas.cortesia) / s.capacidade < 0.35,
        );
        if (sessoesFracas.length && diasParaEvento <= 150) {
            lista.push({
                id: `${evento.id}-sessao`,
                evento,
                tom: "warning",
                titulo: `${sessoesFracas.length} ${sessoesFracas.length === 1 ? "sessão abaixo" : "sessões abaixo"} de 35%`,
                detalhe: sessoesFracas.map((s) => s.nome).join(", "),
                acao: "Ver capacidade",
                href: "/backstage/evento/visao-geral",
                pergunta: "Qual está sendo a ocupação por sessão?",
            });
        }

        if (resumo.variacaoRitmo >= 0.4) {
            lista.push({
                id: `${evento.id}-acelerou`,
                evento,
                tom: "success",
                titulo: `Ritmo acelerou ${pct(resumo.variacaoRitmo)}`,
                detalhe: `${Math.round(resumo.ritmo7)} ingressos/dia na última semana — bom momento para virar o lote.`,
                acao: "Ver lotes",
                href: "/backstage/catalogo/ingressos",
                pergunta: "Como está o ritmo de vendas?",
            });
        }
    }

    const ordem: Record<AlertaTom, number> = { error: 0, warning: 1, success: 2 };
    return lista.sort((a, b) => ordem[a.tom] - ordem[b.tom]);
}

/** Alertas agrupados por evento, para exibir dentro da própria linha. */
export function alertasPorEvento(): Map<string, Alerta[]> {
    const mapa = new Map<string, Alerta[]>();
    for (const alerta of alertas()) {
        const atuais = mapa.get(alerta.evento.id) ?? [];
        atuais.push(alerta);
        mapa.set(alerta.evento.id, atuais);
    }
    return mapa;
}

/** Um evento "precisa de atenção" quando tem alerta de erro ou aviso. */
export const precisaAtencao = (lista: Alerta[] = []) => lista.some((a) => a.tom !== "success");

/* ------------------------------------------------------------------ */
/*  Formatação                                                         */
/* ------------------------------------------------------------------ */

export const brl = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const brlCompacto = (valor: number) =>
    valor >= 1_000_000
        ? `R$ ${(valor / 1_000_000).toFixed(1).replace(".", ",")}M`
        : valor >= 1000
          ? `R$ ${Math.round(valor / 1000)}K`
          : brl(valor);

export const numero = (valor: number) => Math.round(valor).toLocaleString("pt-BR");
