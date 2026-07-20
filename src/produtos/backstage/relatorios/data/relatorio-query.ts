/* ------------------------------------------------------------------ */
/*  Motor genérico de consulta do relatório personalizado.             */
/*                                                                      */
/*  A IA (ou o roteador local) emite uma CONSULTA estruturada           */
/*  { medida × dimensão × agregação × acumulado × gráfico } e este      */
/*  motor a executa sobre a tabela-fato + tabelas derivadas, montando   */
/*  o bloco visual. Aberto a combinações não previstas por um catálogo. */
/* ------------------------------------------------------------------ */

import Statistics from "statistics.js";
import type { Bloco, Formato } from "./relatorio-ia";
import type { Dataset, FatoVenda } from "@/reports/event-dataset";
import { currencyFormatter, numberFormatter } from "./event";

export interface Consulta {
    titulo?: string;
    /** Medida (o que medir). Ex.: faturamento, itens, ticketMedio, taxaValidacao… */
    medida: string;
    /** Dimensão (como quebrar). Ex.: dia, grupo, categoria, meioPagamento, status… ou null para um número único. */
    dimensao?: string | null;
    /** Agregação para número único sobre série temporal. Default soma. */
    agregacao?: "soma" | "media" | "mediana" | "min" | "max" | "desvio";
    /** Soma corrida ao longo do tempo (faturamento acumulado). */
    acumulado?: boolean;
    /** Gráfico desejado; "auto" (default) escolhe pelo formato do dado. */
    grafico?: "linha" | "barras" | "pizza" | "medidor" | "metric" | "tabela" | "auto";
    /** Top N (ranking) quando a dimensão é categórica. */
    limite?: number;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const fmt = (v: number, f?: Formato) => (f === "moeda" ? currencyFormatter.format(Math.round(v)) : f === "pct" ? `${Math.round(v)}%` : numberFormatter.format(Math.round(v)));

/* --------------------------- Dicionários -------------------------- */

const ALIAS_MEDIDA: Record<string, string> = {
    faturamento: "faturamento", receita: "faturamento", bruto: "faturamento", "valor bruto": "faturamento", gmv: "faturamento",
    liquido: "faturamentoLiquido", "faturamento liquido": "faturamentoLiquido", "com desconto": "faturamentoLiquido", "valor liquido": "faturamentoLiquido",
    desconto: "desconto",
    itens: "itens", ingressos: "itens", vendas: "itens", vendidos: "itens", quantidade: "itens",
    ticket: "ticketMedio", ticketmedio: "ticketMedio", "ticket medio": "ticketMedio",
    ocupacao: "ocupacao", lotacao: "ocupacao",
    validados: "validados", validacao: "validados", checkin: "validados", "check-in": "validados", presenca: "validados",
    "taxa de validacao": "taxaValidacao", "taxa de acesso": "taxaValidacao", "taxa validacao": "taxaValidacao", acesso: "taxaValidacao",
    checkins: "checkins",
    transacoes: "transacoes", pedidos: "transacoes",
    "valor transacionado": "valorTransacoes", transacionado: "valorTransacoes",
    transferencias: "transferencias", churn: "churn",
    respostas: "respostas", respondentes: "respostas", "taxa de resposta": "taxaResposta",
    meio: "meioPagamento", "meio de pagamento": "meioPagamento", pagamento: "meioPagamento", meios: "meioPagamento",
    bordero: "bordero", repasse: "bordero",
};

const ALIAS_DIM: Record<string, string> = {
    dia: "dia", data: "dia", tempo: "dia", diario: "dia", "por dia": "dia",
    grupo: "grupo", setor: "grupo", "tipo de ingresso": "grupo", tipoingresso: "grupo", tipo: "grupo",
    categoria: "categoria",
    meio: "meioPagamento", meiopagamento: "meioPagamento", "meio de pagamento": "meioPagamento", pagamento: "meioPagamento",
    status: "status", canal: "canal",
    portao: "portao",
    faixahorario: "faixaHorario", horario: "faixaHorario", hora: "faixaHorario",
    pergunta: "pergunta",
};

const UNIDADE: Record<string, Formato> = {
    faturamento: "moeda", faturamentoLiquido: "moeda", desconto: "moeda", ticketMedio: "moeda", valorTransacoes: "moeda", bordero: "moeda",
    itens: "numero", validados: "numero", checkins: "numero", transacoes: "numero", transferencias: "numero", respostas: "numero",
    ocupacao: "pct", taxaValidacao: "pct", churn: "pct", taxaResposta: "pct", meioPagamento: "pct",
};

const LABEL_MEDIDA: Record<string, string> = {
    faturamento: "Faturamento", faturamentoLiquido: "Faturamento líquido", desconto: "Desconto", itens: "Itens vendidos", ticketMedio: "Ticket médio",
    ocupacao: "Taxa de ocupação", validados: "Validados", taxaValidacao: "Taxa de validação", checkins: "Check-ins", transacoes: "Transações",
    valorTransacoes: "Valor transacionado", transferencias: "Transferências", churn: "Taxa de churn", respostas: "Respostas", taxaResposta: "Taxa de resposta",
    meioPagamento: "Meios de pagamento", bordero: "Borderô",
};

const LABEL_DIM: Record<string, string> = {
    dia: "por dia", grupo: "por grupo", categoria: "por categoria", meioPagamento: "por meio de pagamento", status: "por status",
    canal: "por canal", portao: "por portão", faixaHorario: "por horário", pergunta: "por pergunta",
};

/* --------------------------- Resolvedor --------------------------- */

interface Resolvido {
    series?: { nome: string; valor: number }[];
    escalar?: number;
    unidade: Formato;
    temporal?: boolean;
    composicao?: boolean;
}

const rowVal: Record<string, (r: FatoVenda) => number> = {
    faturamento: (r) => r.receitaBruta,
    faturamentoLiquido: (r) => r.receitaLiquida,
    desconto: (r) => r.receitaBruta - r.receitaLiquida,
    itens: (r) => r.itens,
};

function agrupar(linhas: FatoVenda[], chave: (r: FatoVenda) => string, val: (r: FatoVenda) => number, ordenarMs = false) {
    const m = new Map<string, { nome: string; ms: number; valor: number }>();
    for (const r of linhas) {
        const k = chave(r);
        const e = m.get(k) ?? { nome: k, ms: r.ms, valor: 0 };
        e.valor += val(r);
        m.set(k, e);
    }
    const arr = [...m.values()];
    if (ordenarMs) arr.sort((a, b) => a.ms - b.ms);
    return arr.map((e) => ({ nome: e.nome, valor: e.valor }));
}

/** Ticket médio (razão) por dimensão. */
function ticketPor(linhas: FatoVenda[], chave: (r: FatoVenda) => string, ordenarMs = false) {
    const m = new Map<string, { nome: string; ms: number; bruta: number; itens: number }>();
    for (const r of linhas) {
        const k = chave(r);
        const e = m.get(k) ?? { nome: k, ms: r.ms, bruta: 0, itens: 0 };
        e.bruta += r.receitaBruta;
        e.itens += r.itens;
        m.set(k, e);
    }
    const arr = [...m.values()];
    if (ordenarMs) arr.sort((a, b) => a.ms - b.ms);
    return arr.map((e) => ({ nome: e.nome, valor: e.itens ? e.bruta / e.itens : 0 }));
}

const chaveDim: Record<string, (r: FatoVenda) => string> = {
    dia: (r) => r.data,
    grupo: (r) => r.grupo,
    categoria: (r) => r.categoria,
};

function resolver(medida: string, dim: string | null, d: Dataset, linhas: FatoVenda[]): Resolvido | null {
    const unidade = UNIDADE[medida] ?? "numero";

    // ---- Medidas de vendas (tabela-fato) ----
    if (medida in rowVal) {
        const val = rowVal[medida];
        if (dim && chaveDim[dim]) return { series: agrupar(linhas, chaveDim[dim], val, dim === "dia"), unidade, temporal: dim === "dia", composicao: dim === "categoria" };
        return { escalar: linhas.reduce((s, r) => s + val(r), 0), unidade };
    }
    if (medida === "ticketMedio") {
        if (dim && chaveDim[dim]) return { series: ticketPor(linhas, chaveDim[dim], dim === "dia"), unidade, temporal: dim === "dia" };
        const bruta = linhas.reduce((s, r) => s + r.receitaBruta, 0);
        const itens = linhas.reduce((s, r) => s + r.itens, 0);
        return { escalar: itens ? bruta / itens : 0, unidade };
    }

    // ---- Medidas derivadas (tabelas do Dataset) ----
    switch (medida) {
        case "ocupacao":
            return { escalar: d.ocupacao.pct, unidade };
        case "meioPagamento":
            return { series: d.meiosDePagamento.map((m) => ({ nome: m.meio, valor: m.pct })), unidade, composicao: true };
        case "transacoes":
            if (dim === "canal") return { series: d.transacoes.porCanal.map((c) => ({ nome: c.canal, valor: c.quantidade })), unidade, composicao: true };
            if (dim === "status") return { series: d.transacoes.porStatus.map((s) => ({ nome: s.status, valor: s.quantidade })), unidade, composicao: true };
            return { escalar: d.transacoes.porStatus.reduce((s, x) => s + x.quantidade, 0), unidade };
        case "valorTransacoes":
            if (dim === "status") return { series: d.transacoes.porStatus.map((s) => ({ nome: s.status, valor: s.valor })), unidade, composicao: true };
            return { escalar: d.transacoes.porStatus.reduce((s, x) => s + x.valor, 0), unidade };
        case "validados":
            if (dim === "grupo") return { series: d.acesso.porGrupo.map((g) => ({ nome: g.grupo, valor: g.validado })), unidade };
            if (dim === "faixaHorario") return { series: d.acesso.porFaixaHorario.map((f) => ({ nome: f.faixa, valor: f.checkins })), unidade, temporal: true };
            if (dim === "portao") return { series: d.acesso.porPortao.map((p) => ({ nome: p.portao, valor: p.entradas })), unidade };
            return { escalar: d.acesso.validados, unidade };
        case "taxaValidacao":
            if (dim === "grupo") return { series: d.acesso.porGrupo.map((g) => ({ nome: g.grupo, valor: g.taxaPct })), unidade };
            return { escalar: d.acesso.taxaValidacaoPct, unidade };
        case "checkins":
            if (dim === "portao") return { series: d.acesso.porPortao.map((p) => ({ nome: p.portao, valor: p.entradas })), unidade };
            return { series: d.acesso.porFaixaHorario.map((f) => ({ nome: f.faixa, valor: f.checkins })), unidade, temporal: true };
        case "transferencias":
            if (dim === "status")
                return {
                    series: [
                        { nome: "Aceitas", valor: d.transferencias.aceitas },
                        { nome: "Pendentes", valor: d.transferencias.pendentes },
                        { nome: "Canceladas", valor: d.transferencias.canceladas },
                    ],
                    unidade,
                    composicao: true,
                };
            return { escalar: d.transferencias.total, unidade };
        case "churn":
            return { escalar: d.transferencias.churnPct, unidade };
        case "respostas":
            if (dim === "pergunta") return { series: d.questionarios.porPergunta.map((p) => ({ nome: p.pergunta, valor: p.respostas })), unidade };
            return { escalar: d.questionarios.respondentes, unidade };
        case "taxaResposta":
            return { escalar: d.questionarios.taxaRespostaPct, unidade };
        case "bordero":
            return {
                series: [
                    { nome: "Líquido a repassar", valor: d.bordero.liquido },
                    { nome: "Taxas retidas", valor: d.bordero.taxas },
                ],
                unidade,
                composicao: true,
            };
        default:
            return null;
    }
}

/* --------------------------- Auxiliares --------------------------- */

function agregarSerie(valores: number[], agg: NonNullable<Consulta["agregacao"]>): number {
    if (!valores.length) return 0;
    if (agg === "soma") return valores.reduce((s, x) => s + x, 0);
    const st = new Statistics(valores.map((v) => ({ v })), { v: "interval" });
    if (agg === "media") return st.arithmeticMean("v");
    if (agg === "mediana") return st.median("v");
    if (agg === "desvio") return st.standardDeviation("v");
    if (agg === "min") return st.minimum("v");
    if (agg === "max") return st.maximum("v");
    return valores.reduce((s, x) => s + x, 0);
}

const ehTemporal = (medida: string) => medida in rowVal || medida === "ticketMedio";

function tituloAuto(medida: string, dim: string | null, acumulado?: boolean): string {
    const m = LABEL_MEDIDA[medida] ?? medida;
    const acc = acumulado ? " acumulado" : "";
    const dl = dim ? ` ${LABEL_DIM[dim] ?? ""}`.trimEnd() : "";
    return `${m}${acc}${dl}`.trim();
}

/* --------------------------- Execução ----------------------------- */

/** Executa uma consulta genérica e devolve o bloco visual. */
export function executarConsulta(c: Consulta, d: Dataset, linhas: FatoVenda[]): Bloco {
    const medida = ALIAS_MEDIDA[norm(c.medida ?? "")] ?? norm(c.medida ?? "");
    const dim = c.dimensao ? (ALIAS_DIM[norm(c.dimensao)] ?? norm(c.dimensao)) : null;
    const res = resolver(medida, dim, d, linhas);

    if (!res) return { tipo: "texto", titulo: c.titulo || "Análise", conteudo: "Não consegui montar essa análise com os dados disponíveis." };

    const titulo = c.titulo || tituloAuto(medida, dim, c.acumulado);

    // ---- Série (com dimensão) ----
    if (res.series) {
        let series = res.series;
        // Ranking (top N) em dimensões categóricas.
        if (c.limite && !res.temporal) series = [...series].sort((a, b) => b.valor - a.valor).slice(0, c.limite);
        // Soma acumulada ao longo do tempo.
        if (c.acumulado && res.temporal) {
            let acc = 0;
            series = series.map((s) => ({ nome: s.nome, valor: (acc += s.valor) }));
        }

        const grafico =
            c.grafico && c.grafico !== "auto" ? c.grafico : res.temporal ? "linha" : res.composicao && series.length <= 6 ? "pizza" : "barras";

        if (grafico === "pizza") return { tipo: "pizza", titulo, dados: series };
        if (grafico === "tabela") return { tipo: "tabela", titulo, colunas: ["Item", "Valor"], linhas: series.map((s) => [s.nome, fmt(s.valor, res.unidade)]) };
        if (grafico === "metric") return { tipo: "metric", titulo, valor: fmt(series.reduce((a, b) => a + b.valor, 0), res.unidade) };
        if (grafico === "linha") return { tipo: "linha", titulo, formato: res.unidade, dados: series };
        return { tipo: "barras", titulo, formato: res.unidade, dados: series };
    }

    // ---- Escalar (número único) ----
    let valor = res.escalar ?? 0;
    if (c.agregacao && c.agregacao !== "soma" && ehTemporal(medida)) {
        const serieDia = resolver(medida, "dia", d, linhas)?.series?.map((s) => s.valor) ?? [];
        valor = agregarSerie(serieDia, c.agregacao);
    }

    if (res.unidade === "pct" && (!c.grafico || c.grafico === "auto" || c.grafico === "medidor")) {
        return { tipo: "medidor", titulo, pct: Math.round(valor) };
    }
    return { tipo: "metric", titulo, valor: fmt(valor, res.unidade) };
}
