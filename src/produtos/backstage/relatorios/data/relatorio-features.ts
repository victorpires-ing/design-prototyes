/* ------------------------------------------------------------------ */
/*  Features do relatório personalizado.                               */
/*  A IA NÃO recebe os dados — ela só escolhe "features" (funções de   */
/*  análise) e argumentos. Aqui aplicamos os métodos estatísticos e    */
/*  decidimos o melhor tipo de visualização a partir do formato do     */
/*  resultado.                                                          */
/* ------------------------------------------------------------------ */

import Statistics from "statistics.js";
import type { Bloco, Dataset, Formato } from "./relatorio-ia";
import { currencyFormatter, numberFormatter } from "./event";

/* -------------------------- Métodos estatísticos ------------------ */
/*  Delegados à biblioteca statistics.js (média, mediana, desvio,      */
/*  mínimo/máximo e correlação de Pearson).                            */

/** Resumo estatístico de uma série numérica via statistics.js. */
function resumo(valores: number[]) {
    const vazio = { media: 0, mediana: 0, desvioPadrao: 0, minimo: 0, maximo: 0 };
    if (!valores.length) return vazio;
    const s = new Statistics(valores.map((v) => ({ v })), { v: "interval" });
    return {
        media: s.arithmeticMean("v"),
        mediana: s.median("v"),
        desvioPadrao: s.standardDeviation("v"),
        minimo: s.minimum("v"),
        maximo: s.maximum("v"),
    };
}

/** Correlação de Pearson entre duas séries pareadas (via statistics.js). */
function correlacaoPearson(a: number[], b: number[]): number {
    const n = Math.min(a.length, b.length);
    if (n < 2) return 0;
    const data = Array.from({ length: n }, (_, i) => ({ a: a[i], b: b[i] }));
    const s = new Statistics(data, { a: "interval", b: "interval" });
    const r = s.correlationCoefficient("a", "b").correlationCoefficient;
    return Number.isFinite(r) ? r : 0;
}

/** Variação percentual do primeiro ao último ponto (tendência). */
const tendenciaPct = (a: number[]) => (a.length > 1 && a[0] ? ((a[a.length - 1] - a[0]) / Math.abs(a[0])) * 100 : 0);

const formatar = (v: number, f?: Formato) => (f === "moeda" ? currencyFormatter.format(v) : f === "pct" ? `${Math.round(v)}%` : numberFormatter.format(Math.round(v)));

/* ------------------- Decisão do tipo de visualização -------------- */

interface Resultado {
    tipoDado: "escalar" | "temporal" | "categorico";
    titulo: string;
    formato?: Formato;
    escalar?: number;
    /** true quando as partes somam um todo (usar pizza). */
    composicao?: boolean;
    series?: { nome: string; valor: number }[];
}

/** Feature de visualização: escolhe o gráfico ideal para o formato do dado. */
export function decidirVisualizacao(r: Resultado): Bloco {
    if (r.tipoDado === "escalar") {
        return { tipo: "metric", titulo: r.titulo, valor: formatar(r.escalar ?? 0, r.formato) };
    }
    if (r.tipoDado === "temporal") {
        return { tipo: "linha", titulo: r.titulo, formato: r.formato, dados: r.series ?? [] };
    }
    // Categórico: composição de um todo com poucas fatias → pizza; senão barras (ranking/comparação).
    if (r.composicao && (r.series?.length ?? 0) <= 6) {
        return { tipo: "pizza", titulo: r.titulo, dados: r.series ?? [] };
    }
    return { tipo: "barras", titulo: r.titulo, formato: r.formato, dados: r.series ?? [] };
}

/* ----------------------- Catálogo (vai no prompt) ----------------- */

export interface Chamada {
    feature: string;
    args?: Record<string, string | number>;
}

/** Descrição das features enviada à IA (sem nenhum dado real). */
export const CATALOGO = [
    { feature: "totais", descricao: "Resumo dos totais do evento (valor bruto, com desconto, desconto, itens vendidos, ticket médio).", args: {} },
    { feature: "ocupacao", descricao: "Taxa de ocupação do evento (vendido vs capacidade).", args: {} },
    { feature: "serie_vendas", descricao: "Série temporal diária.", args: { metrica: "valor | itens" } },
    { feature: "estatisticas_vendas", descricao: "Estatísticas da série diária: média, mediana, desvio padrão, mínimo, máximo e tendência.", args: { metrica: "valor | itens" } },
    { feature: "correlacao", descricao: "Correlação de Pearson entre duas medidas diárias (ex.: ingressos × faturamento, ou dia da campanha × faturamento para medir crescimento).", args: { a: "faturamento | ingressos | ticket | dia", b: "faturamento | ingressos | ticket | dia" } },
    { feature: "distribuicao", descricao: "Distribuição por uma dimensão.", args: { dimensao: "mix (grupos de receita) | meios (meios de pagamento) | grupos (ingressos por grupo)" } },
    { feature: "ranking_grupos", descricao: "Ranking dos grupos de ingressos por uma métrica.", args: { metrica: "vendido | valor", limite: "número opcional (padrão 5)" } },
    { feature: "metrica_dia", descricao: "Faturamento e ingressos de um DIA específico (use o rótulo do dia, ex.: 20/6).", args: { dia: "rótulo do dia (ex.: 20/6)" } },
    { feature: "metrica", descricao: "Um indicador único (KPI) do evento.", args: { kpi: "valorBruto | valorLiquido | desconto | itens | ticketMedio" } },
    { feature: "transacoes_status", descricao: "Relatório de Transações: distribuição das transações por status (aprovado, pendente, cancelado, estornado, reembolso).", args: { metrica: "quantidade | valor" } },
    { feature: "transacoes_canal", descricao: "Relatório de Transações: distribuição por canal de venda (online vs bilheteria).", args: {} },
    { feature: "acesso_validacao", descricao: "Relatório de Acesso: taxa de validação (check-in) e quantos validaram vs não validaram.", args: {} },
    { feature: "acesso_horario", descricao: "Relatório de Acesso: check-ins ao longo das faixas de horário (fluxo de entrada).", args: {} },
    { feature: "acesso_portao", descricao: "Relatório de Acesso: entradas por portão.", args: {} },
    { feature: "transferencias", descricao: "Relatório de Transferências: total, aceitas/pendentes/canceladas e taxa de churn.", args: {} },
    { feature: "questionarios", descricao: "Relatório de Questionários: total de respondentes, taxa de resposta e respostas por pergunta.", args: {} },
    { feature: "bordero", descricao: "Relatório de Borderô: valor bruto, taxas retidas e valor líquido a repassar.", args: {} },
];

/** Schema de tools (function calling) no formato OpenAI/OpenRouter. */
export const TOOLS = [
    { type: "function", function: { name: "totais", description: "Resumo dos totais do evento: valor bruto, com desconto, desconto, itens vendidos e ticket médio.", parameters: { type: "object", properties: {}, required: [] } } },
    { type: "function", function: { name: "ocupacao", description: "Taxa de ocupação do evento (vendido vs capacidade).", parameters: { type: "object", properties: {}, required: [] } } },
    {
        type: "function",
        function: {
            name: "serie_vendas",
            description: "Série temporal diária de faturamento (valor) ou de ingressos.",
            parameters: { type: "object", properties: { metrica: { type: "string", enum: ["valor", "itens"] } }, required: ["metrica"] },
        },
    },
    {
        type: "function",
        function: {
            name: "estatisticas_vendas",
            description: "Estatísticas da série diária: média, mediana, desvio padrão, mínimo, máximo e tendência.",
            parameters: { type: "object", properties: { metrica: { type: "string", enum: ["valor", "itens"] } }, required: ["metrica"] },
        },
    },
    {
        type: "function",
        function: {
            name: "distribuicao",
            description: "Distribuição por dimensão: mix de receita, meios de pagamento ou ingressos por grupo.",
            parameters: { type: "object", properties: { dimensao: { type: "string", enum: ["mix", "meios", "grupos"] } }, required: ["dimensao"] },
        },
    },
    {
        type: "function",
        function: {
            name: "ranking_grupos",
            description: "Ranking dos grupos de ingressos por uma métrica.",
            parameters: {
                type: "object",
                properties: { metrica: { type: "string", enum: ["vendido", "valor"] }, limite: { type: "number", description: "Quantos grupos (padrão 5)." } },
                required: ["metrica"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "transacoes_status",
            description: "Relatório de Transações: distribuição por status (aprovado, pendente, cancelado, estornado, reembolso).",
            parameters: { type: "object", properties: { metrica: { type: "string", enum: ["quantidade", "valor"] } }, required: ["metrica"] },
        },
    },
    { type: "function", function: { name: "transacoes_canal", description: "Relatório de Transações: distribuição por canal (online vs bilheteria).", parameters: { type: "object", properties: {}, required: [] } } },
    { type: "function", function: { name: "acesso_validacao", description: "Relatório de Acesso: taxa de validação e validados vs não validados.", parameters: { type: "object", properties: {}, required: [] } } },
    { type: "function", function: { name: "acesso_horario", description: "Relatório de Acesso: fluxo de check-ins por faixa de horário.", parameters: { type: "object", properties: {}, required: [] } } },
    { type: "function", function: { name: "acesso_portao", description: "Relatório de Acesso: entradas por portão.", parameters: { type: "object", properties: {}, required: [] } } },
    { type: "function", function: { name: "transferencias", description: "Relatório de Transferências: total, status e churn.", parameters: { type: "object", properties: {}, required: [] } } },
    { type: "function", function: { name: "questionarios", description: "Relatório de Questionários: respondentes, taxa de resposta e respostas por pergunta.", parameters: { type: "object", properties: {}, required: [] } } },
    { type: "function", function: { name: "bordero", description: "Relatório de Borderô: bruto, taxas e líquido.", parameters: { type: "object", properties: {}, required: [] } } },
];

/** Resposta em linguagem natural montada LOCALMENTE a partir dos títulos — nenhum dado é enviado à IA. */
export function descreverBlocos(blocos: Bloco[]): string {
    const titulos = blocos.map((b) => (b.tipo === "texto" ? b.titulo || "" : b.titulo)).filter(Boolean) as string[];
    if (!titulos.length) return "Aqui está a visão que montei.";
    if (titulos.length === 1) return `Aqui está: ${titulos[0]}.`;
    return `Aqui está: ${titulos.slice(0, -1).join(", ")} e ${titulos[titulos.length - 1]}.`;
}

/* --------------------------- Executores --------------------------- */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function executarChamada(chamada: Chamada, d: Dataset): Bloco[] {
    const args = chamada.args ?? {};
    switch (chamada.feature) {
        case "totais":
            return [
                { tipo: "metric", titulo: "Valor total bruto", valor: currencyFormatter.format(d.totais.valorTotalBruto) },
                { tipo: "metric", titulo: "Valor total c/ desconto", valor: currencyFormatter.format(d.totais.valorTotalComDesconto) },
                { tipo: "metric", titulo: "Desconto", valor: currencyFormatter.format(d.totais.desconto) },
                { tipo: "metric", titulo: "Itens vendidos", valor: numberFormatter.format(d.totais.itensVendidos) },
                { tipo: "metric", titulo: "Ticket médio", valor: currencyFormatter.format(d.totais.ticketMedio) },
            ];

        case "ocupacao":
            return [
                decidirVisualizacao({ tipoDado: "escalar", titulo: "Taxa de ocupação", formato: "pct", escalar: d.ocupacao.pct }),
                {
                    tipo: "barras",
                    titulo: "Vendido x Capacidade",
                    formato: "numero",
                    dados: [
                        { nome: "Vendido", valor: d.ocupacao.vendido },
                        { nome: "Capacidade", valor: d.ocupacao.capacidade },
                    ],
                },
            ];

        case "serie_vendas": {
            const metrica = args.metrica === "itens" ? "itens" : "valor";
            const series = d.vendasDiarias.map((x) => ({ nome: x.dia, valor: metrica === "itens" ? x.itens : x.valor }));
            return [decidirVisualizacao({ tipoDado: "temporal", titulo: metrica === "itens" ? "Ingressos por dia" : "Faturamento por dia", formato: metrica === "itens" ? "numero" : "moeda", series })];
        }

        case "estatisticas_vendas": {
            const metrica = args.metrica === "itens" ? "itens" : "valor";
            const valores = d.vendasDiarias.map((x) => (metrica === "itens" ? x.itens : x.valor));
            const fmt: Formato = metrica === "itens" ? "numero" : "moeda";
            const est = resumo(valores);
            const tend = tendenciaPct(valores);
            return [
                {
                    tipo: "tabela",
                    titulo: `Estatísticas — ${metrica === "itens" ? "ingressos/dia" : "faturamento/dia"}`,
                    colunas: ["Métrica", "Valor"],
                    linhas: [
                        ["Média", formatar(est.media, fmt)],
                        ["Mediana", formatar(est.mediana, fmt)],
                        ["Desvio padrão", formatar(est.desvioPadrao, fmt)],
                        ["Mínimo", formatar(est.minimo, fmt)],
                        ["Máximo", formatar(est.maximo, fmt)],
                        ["Tendência (início→fim)", `${tend >= 0 ? "+" : ""}${Math.round(tend)}%`],
                    ],
                },
                decidirVisualizacao({ tipoDado: "temporal", titulo: "Evolução diária", formato: fmt, series: d.vendasDiarias.map((x) => ({ nome: x.dia, valor: metrica === "itens" ? x.itens : x.valor })) }),
            ];
        }

        case "correlacao": {
            // Medidas diárias disponíveis para correlacionar.
            const alias: Record<string, "valor" | "itens" | "ticket" | "dia"> = {
                valor: "valor", faturamento: "valor", receita: "valor",
                itens: "itens", ingressos: "itens",
                ticket: "ticket", "ticket medio": "ticket", "ticket médio": "ticket",
                dia: "dia", tempo: "dia", data: "dia",
            };
            const serie = d.vendasDiarias;
            const coluna = (nome: "valor" | "itens" | "ticket" | "dia") =>
                serie.map((x, i) => (nome === "valor" ? x.valor : nome === "itens" ? x.itens : nome === "ticket" ? (x.itens ? x.valor / x.itens : 0) : i));
            const a = alias[String(args.a ?? "itens").toLowerCase()] ?? "itens";
            const b = alias[String(args.b ?? "valor").toLowerCase()] ?? "valor";
            const rotulo: Record<string, string> = { valor: "Faturamento/dia", itens: "Ingressos/dia", ticket: "Ticket médio/dia", dia: "Dia da campanha" };
            const fmtDe: Record<string, Formato> = { valor: "moeda", ticket: "moeda", itens: "numero", dia: "numero" };
            const xs = coluna(a);
            const ys = coluna(b);
            const r = correlacaoPearson(xs, ys);
            const abs = Math.abs(r);
            const forca = abs >= 0.7 ? "forte" : abs >= 0.4 ? "moderada" : abs >= 0.2 ? "fraca" : "desprezível";
            const direcao = r >= 0 ? "positiva" : "negativa";

            // Reta de regressão (mínimos quadrados) via desvios: slope = r · (σy/σx).
            const estX = resumo(xs);
            const estY = resumo(ys);
            const slope = estX.desvioPadrao ? r * (estY.desvioPadrao / estX.desvioPadrao) : 0;
            const intercept = estY.media - slope * estX.media;

            return [
                {
                    tipo: "dispersao",
                    titulo: `Correlação — ${rotulo[a]} × ${rotulo[b]}`,
                    dados: xs.map((x, i) => ({ x, y: ys[i] })),
                    rotuloX: rotulo[a],
                    rotuloY: rotulo[b],
                    r,
                    ajuste: { a: slope, b: intercept },
                    formatoX: fmtDe[a],
                    formatoY: fmtDe[b],
                    ajuda: `Correlação ${forca} ${direcao} (Pearson r = ${r.toFixed(2).replace(".", ",")})`,
                },
            ];
        }

        case "distribuicao": {
            const dim = String(args.dimensao ?? "mix");
            if (dim === "meios") {
                return [decidirVisualizacao({ tipoDado: "categorico", composicao: true, titulo: "Meios de pagamento", formato: "pct", series: d.meiosDePagamento.map((m) => ({ nome: m.meio, valor: m.pct })) })];
            }
            if (dim === "grupos") {
                return [decidirVisualizacao({ tipoDado: "categorico", titulo: "Ingressos por grupo", formato: "numero", series: d.ingressosPorGrupo.map((g) => ({ nome: g.grupo, valor: g.vendido })) })];
            }
            return [decidirVisualizacao({ tipoDado: "categorico", composicao: true, titulo: "Mix de receita", formato: "moeda", series: d.mixDeReceita.map((m) => ({ nome: m.grupo, valor: m.valor })) })];
        }

        case "ranking_grupos": {
            const metrica = args.metrica === "valor" ? "valor" : "vendido";
            const limite = Math.max(1, Number(args.limite) || 5);
            const ordenado = [...d.ingressosPorGrupo].sort((a, b) => (b[metrica] as number) - (a[metrica] as number)).slice(0, limite);
            return [
                decidirVisualizacao({
                    tipoDado: "categorico",
                    titulo: `Top ${limite} grupos por ${metrica === "valor" ? "receita" : "ingressos vendidos"}`,
                    formato: metrica === "valor" ? "moeda" : "numero",
                    series: ordenado.map((g) => ({ nome: g.grupo, valor: g[metrica] as number })),
                }),
            ];
        }

        case "metrica": {
            const t = d.totais;
            const map: Record<string, [string, string]> = {
                valorBruto: ["Valor total bruto", currencyFormatter.format(t.valorTotalBruto)],
                valorLiquido: ["Valor total c/ desconto", currencyFormatter.format(t.valorTotalComDesconto)],
                desconto: ["Desconto", currencyFormatter.format(t.desconto)],
                itens: ["Itens vendidos", numberFormatter.format(t.itensVendidos)],
                ticketMedio: ["Ticket médio", currencyFormatter.format(t.ticketMedio)],
            };
            const [titulo, valor] = map[String(args.kpi ?? "valorBruto")] ?? map.valorBruto;
            return [{ tipo: "metric", titulo, valor }];
        }

        case "metrica_dia": {
            const dia = String(args.dia ?? "");
            const reg = d.vendasDiarias.find((x) => x.dia === dia);
            if (!reg) return [{ tipo: "texto", titulo: `Dia ${dia || "?"}`, conteudo: `Não há dados para ${dia || "esse dia"} no período selecionado.` }];
            return [
                { tipo: "metric", titulo: `Faturamento — ${dia}`, valor: currencyFormatter.format(reg.valor) },
                { tipo: "metric", titulo: `Ingressos — ${dia}`, valor: numberFormatter.format(reg.itens) },
            ];
        }

        case "transacoes_status": {
            const metrica = args.metrica === "valor" ? "valor" : "quantidade";
            return [
                decidirVisualizacao({
                    tipoDado: "categorico",
                    titulo: metrica === "valor" ? "Valor por status da transação" : "Transações por status",
                    formato: metrica === "valor" ? "moeda" : "numero",
                    series: d.transacoes.porStatus.map((s) => ({ nome: s.status, valor: metrica === "valor" ? s.valor : s.quantidade })),
                }),
            ];
        }

        case "transacoes_canal":
            return [
                decidirVisualizacao({
                    tipoDado: "categorico",
                    composicao: true,
                    titulo: "Transações por canal",
                    formato: "numero",
                    series: d.transacoes.porCanal.map((c) => ({ nome: c.canal, valor: c.quantidade })),
                }),
            ];

        case "acesso_validacao":
            return [
                { tipo: "medidor", titulo: "Taxa de validação", pct: d.acesso.taxaValidacaoPct, detalhe: `${numberFormatter.format(d.acesso.validados)} validados` },
                { tipo: "metric", titulo: "Validados", valor: numberFormatter.format(d.acesso.validados) },
                { tipo: "metric", titulo: "Não validados", valor: numberFormatter.format(d.acesso.naoValidados) },
            ];

        case "acesso_horario":
            return [decidirVisualizacao({ tipoDado: "temporal", titulo: "Check-ins por horário", formato: "numero", series: d.acesso.porFaixaHorario.map((h) => ({ nome: h.faixa, valor: h.checkins })) })];

        case "acesso_portao":
            return [decidirVisualizacao({ tipoDado: "categorico", titulo: "Entradas por portão", formato: "numero", series: d.acesso.porPortao.map((p) => ({ nome: p.portao, valor: p.entradas })) })];

        case "transferencias":
            return [
                { tipo: "metric", titulo: "Transferências", valor: numberFormatter.format(d.transferencias.total) },
                { tipo: "medidor", titulo: "Taxa de churn", pct: d.transferencias.churnPct },
                decidirVisualizacao({
                    tipoDado: "categorico",
                    titulo: "Transferências por status",
                    formato: "numero",
                    series: [
                        { nome: "Aceitas", valor: d.transferencias.aceitas },
                        { nome: "Pendentes", valor: d.transferencias.pendentes },
                        { nome: "Canceladas", valor: d.transferencias.canceladas },
                    ],
                }),
            ];

        case "questionarios":
            return [
                { tipo: "metric", titulo: "Respondentes", valor: numberFormatter.format(d.questionarios.respondentes) },
                { tipo: "medidor", titulo: "Taxa de resposta", pct: d.questionarios.taxaRespostaPct, detalhe: `de ${numberFormatter.format(d.questionarios.enviados)} enviados` },
                decidirVisualizacao({ tipoDado: "categorico", titulo: "Respostas por pergunta", formato: "numero", series: d.questionarios.porPergunta.map((p) => ({ nome: p.pergunta, valor: p.respostas })) }),
            ];

        case "bordero":
            return [
                { tipo: "metric", titulo: "Valor bruto", valor: currencyFormatter.format(d.bordero.bruto) },
                { tipo: "metric", titulo: "Taxas retidas", valor: currencyFormatter.format(d.bordero.taxas) },
                { tipo: "metric", titulo: "Líquido a repassar", valor: currencyFormatter.format(d.bordero.liquido) },
                decidirVisualizacao({
                    tipoDado: "categorico",
                    titulo: "Composição do borderô",
                    formato: "moeda",
                    series: [
                        { nome: "Líquido", valor: d.bordero.liquido },
                        { nome: "Taxas", valor: d.bordero.taxas },
                    ],
                }),
            ];

        default:
            return [{ tipo: "texto", titulo: cap(chamada.feature), conteudo: "Não reconheci essa análise." }];
    }
}

/** Executa o plano da IA (lista de chamadas) e devolve os blocos já com a visualização decidida. */
export function executarPlano(chamadas: Chamada[], d: Dataset): Bloco[] {
    return chamadas.flatMap((c) => executarChamada(c, d));
}
