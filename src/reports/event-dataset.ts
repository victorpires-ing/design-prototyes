/* ------------------------------------------------------------------ */
/*  Fonte de dados do evento (Relatório personalizado).                 */
/*                                                                      */
/*  Os DADOS ficam persistidos em `data/*.json` (payload que a API de   */
/*  produção devolveria) — gerados por `generate.mjs`. Este módulo é só  */
/*  a CAMADA DE CONSULTA: carrega os JSON e agrega por período.          */
/*                                                                      */
/*  Cenário de API: para trocar a fonte, basta substituir a leitura dos  */
/*  JSON por um `fetch` ao endpoint (e tornar `consultarPeriodo` async). */
/* ------------------------------------------------------------------ */

import { CalendarDate, getLocalTimeZone } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import config from "./data/event.json";
import vendasRaw from "./data/vendas.json";
import compradoresRaw from "./data/compradores.json";

/* ------------------------------- Config --------------------------- */

export const EVENTO = config.evento;
export const GRUPOS = config.grupos;
export const MEIOS_PAGAMENTO = config.meiosDePagamento;

const CAP_INGRESSOS = config.capacidadeIngressos;
const FAIXAS_HORARIO = config.faixasHorario;
const PORTOES = config.portoes;
const STATUS_TRANSACAO = config.statusTransacao;
const PERGUNTAS = config.perguntas;

export type Categoria = "Ingressos" | "Combos" | "Produtos";
export type PeriodoSelecionado = { start: DateValue; end: DateValue } | null;

/* ------------------------------ Datas ----------------------------- */

const parseIso = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return { y, m, d };
};
const isoParaMs = (iso: string) => {
    const { y, m, d } = parseIso(iso);
    return new Date(y, m - 1, d).getTime();
};
const isoParaLabel = (iso: string) => {
    const { m, d } = parseIso(iso);
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
};
const isoParaCalendar = (iso: string) => {
    const { y, m, d } = parseIso(iso);
    return new CalendarDate(y, m, d);
};

/** Período completo de vendas (default do filtro). */
export const PERIODO_PADRAO = { start: isoParaCalendar(config.periodoPadrao.start), end: isoParaCalendar(config.periodoPadrao.end) };

/* --------------------------- Tabela-fato -------------------------- */

export interface FatoVenda {
    iso: string;
    data: string;
    ms: number;
    categoria: string;
    grupo: string;
    itens: number;
    receitaBruta: number;
    receitaLiquida: number;
}

/** Tabela-fato (dia × grupo), hidratada com ms e rótulo de dia. */
export const VENDAS: FatoVenda[] = (vendasRaw as Omit<FatoVenda, "ms" | "data">[]).map((v) => ({
    ...v,
    ms: isoParaMs(v.iso),
    data: isoParaLabel(v.iso),
}));

const ITENS_TOTAL = VENDAS.reduce((s, v) => s + v.itens, 0);

/* --------------------------- Demografia --------------------------- */
/*  Catálogo de compradores (idade + localização) — base para análises  */
/*  de inferência (faixa etária, UF, correlações com idade).            */

export interface Comprador {
    idade: number;
    uf: string;
    grupo: string;
    valor: number;
}
export const COMPRADORES = compradoresRaw as Comprador[];

const FAIXAS_ETARIAS = config.faixasEtarias as { faixa: string; lo: number; hi: number }[];
const UFS = config.ufs as string[];
// Escala a amostra de compradores para o total de itens do evento.
const FATOR_DEMO = COMPRADORES.length ? ITENS_TOTAL / COMPRADORES.length : 0;

const DEMOGRAFIA = {
    porFaixa: FAIXAS_ETARIAS.map((f) => {
        const rs = COMPRADORES.filter((c) => c.idade >= f.lo && c.idade <= f.hi);
        return { faixa: f.faixa, itens: Math.round(rs.length * FATOR_DEMO), faturamento: Math.round(rs.reduce((s, c) => s + c.valor, 0) * FATOR_DEMO) };
    }),
    porUf: UFS.map((uf) => {
        const rs = COMPRADORES.filter((c) => c.uf === uf);
        return { uf, itens: Math.round(rs.length * FATOR_DEMO), faturamento: Math.round(rs.reduce((s, c) => s + c.valor, 0) * FATOR_DEMO) };
    })
        .filter((u) => u.itens > 0)
        .sort((a, b) => b.itens - a.itens),
};

/* --------------------------- Consulta agregada -------------------- */

const distribuir = <T extends { share: number }>(base: T[], total: number, i: number) => Math.round(total * base[i].share);

/** Linhas cruas da tabela-fato dentro do período — base para o motor de consulta genérico. */
export function linhasDoPeriodo(periodo: PeriodoSelecionado): FatoVenda[] {
    const tz = getLocalTimeZone();
    const startMs = periodo ? periodo.start.toDate(tz).getTime() : -Infinity;
    const endMs = periodo ? periodo.end.toDate(tz).getTime() + 86_400_000 - 1 : Infinity;
    return VENDAS.filter((v) => v.ms >= startMs && v.ms <= endMs);
}

/** Resumo agregado do período — shape consumido pelos executores de features. */
export function consultarPeriodo(periodo: PeriodoSelecionado) {
    const rows = linhasDoPeriodo(periodo);

    const bruto = rows.reduce((s, r) => s + r.receitaBruta, 0);
    const liquido = rows.reduce((s, r) => s + r.receitaLiquida, 0);
    const itens = rows.reduce((s, r) => s + r.itens, 0);

    // Série diária (ordenada por data).
    const porDia = new Map<string, { data: string; ms: number; valor: number; itens: number }>();
    for (const r of rows) {
        const e = porDia.get(r.iso) ?? { data: r.data, ms: r.ms, valor: 0, itens: 0 };
        e.valor += r.receitaBruta;
        e.itens += r.itens;
        porDia.set(r.iso, e);
    }
    const vendasDiarias = [...porDia.values()].sort((a, b) => a.ms - b.ms).map((e) => ({ dia: e.data, valor: e.valor, itens: e.itens }));

    // Mix por categoria (ordem fixa).
    const ordemCat: Categoria[] = ["Ingressos", "Combos", "Produtos"];
    const mixDeReceita = ordemCat
        .map((cat) => {
            const rs = rows.filter((r) => r.categoria === cat);
            return { grupo: cat, quantidade: rs.reduce((s, r) => s + r.itens, 0), valor: rs.reduce((s, r) => s + r.receitaBruta, 0) };
        })
        .filter((c) => c.quantidade > 0);

    // Ingressos por grupo (ordem do catálogo).
    const ingressosPorGrupo = GRUPOS.filter((g) => g.categoria === "Ingressos")
        .map((g) => {
            const rs = rows.filter((r) => r.grupo === g.nome);
            return { grupo: g.nome, vendido: rs.reduce((s, r) => s + r.itens, 0), valor: rs.reduce((s, r) => s + r.receitaBruta, 0) };
        })
        .filter((g) => g.vendido > 0);

    const ingressosVendidos = ingressosPorGrupo.reduce((s, g) => s + g.vendido, 0);
    const ordens = Math.round(itens / 2.2); // ~2,2 itens por pedido

    // Acesso por grupo (taxa de validação por tipo de ingresso).
    const acessoPorGrupo = ingressosPorGrupo.map((g) => {
        const def = GRUPOS.find((x) => x.nome === g.grupo);
        const taxa = def?.validaPct ?? 0.92;
        const validado = Math.round(g.vendido * taxa);
        return { grupo: g.grupo, vendido: g.vendido, validado, taxaPct: Math.round(taxa * 100) };
    });
    const validados = acessoPorGrupo.reduce((s, g) => s + g.validado, 0);

    return {
        evento: {
            inicioVendas: EVENTO.vendasInicio,
            fimVendas: EVENTO.vendasFim,
            fracaoPeriodoSelecionado: Number((ITENS_TOTAL ? itens / ITENS_TOTAL : 0).toFixed(3)),
        },
        totais: {
            valorTotalBruto: bruto,
            valorTotalComDesconto: liquido,
            desconto: bruto - liquido,
            itensVendidos: itens,
            ticketMedio: itens ? Math.round(bruto / itens) : 0,
        },
        ocupacao: { capacidade: CAP_INGRESSOS, vendido: ingressosVendidos, pct: CAP_INGRESSOS ? Math.round((ingressosVendidos / CAP_INGRESSOS) * 100) : 0 },
        mixDeReceita,
        meiosDePagamento: MEIOS_PAGAMENTO,
        ingressosPorGrupo,
        vendasDiarias,
        transacoes: {
            porStatus: STATUS_TRANSACAO.map((s) => ({ status: s.status, quantidade: Math.round(ordens * s.q), valor: Math.round(bruto * s.v) })),
            porCanal: [
                { canal: "Online", quantidade: Math.round(ordens * 0.96) },
                { canal: "Offline (bilheteria)", quantidade: Math.round(ordens * 0.04) },
            ],
        },
        acesso: {
            validados,
            naoValidados: Math.max(0, ingressosVendidos - validados),
            taxaValidacaoPct: ingressosVendidos ? Math.round((validados / ingressosVendidos) * 100) : 0,
            porFaixaHorario: FAIXAS_HORARIO.map((f, i) => ({ faixa: f.faixa, checkins: distribuir(FAIXAS_HORARIO, validados, i) })),
            porPortao: PORTOES.map((p, i) => ({ portao: p.portao, entradas: distribuir(PORTOES, validados, i) })),
            porGrupo: acessoPorGrupo,
        },
        transferencias: (() => {
            const total = Math.round(ingressosVendidos * 0.12);
            const aceitas = Math.round(total * 0.8);
            const pendentes = Math.round(total * 0.14);
            return { total, aceitas, pendentes, canceladas: Math.max(0, total - aceitas - pendentes), churnPct: 12 };
        })(),
        questionarios: {
            respondentes: Math.round(ingressosVendidos * 0.34),
            enviados: ingressosVendidos,
            taxaRespostaPct: 34,
            porPergunta: PERGUNTAS.map((p) => ({ pergunta: p.pergunta, respostas: Math.round(ingressosVendidos * 0.34 * p.share) })),
        },
        bordero: (() => {
            const taxas = Math.round(bruto * 0.1);
            return { bruto, taxas, liquido: bruto - taxas };
        })(),
        demografia: DEMOGRAFIA,
    };
}

/** Resumo agregado de um período — shape consumido pelas features do relatório. */
export type Dataset = ReturnType<typeof consultarPeriodo>;

/** Série diária crua do período — base para funções estatísticas (média, correlação, etc.). */
export function serieDiaria(periodo: PeriodoSelecionado) {
    return consultarPeriodo(periodo).vendasDiarias;
}
