/* ------------------------------------------------------------------ */
/*  Features do relatório personalizado.                               */
/*  A IA NÃO recebe os dados — ela só escolhe "features" (funções de   */
/*  análise) e argumentos. Aqui aplicamos os métodos estatísticos e    */
/*  decidimos o melhor tipo de visualização a partir do formato do     */
/*  resultado.                                                          */
/* ------------------------------------------------------------------ */

import Statistics from "statistics.js";
import type { Bloco, Dataset, Formato } from "./relatorio-ia";
import { COMPRADORES, GRUPOS } from "@/reports/event-dataset";
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
    { feature: "correlacao", descricao: "Relação entre duas medidas. Diárias (Pearson): faturamento, ingressos, ticket, dia. Demográficas: idade × ticket (dispersão) e idade × grupo (idade média por grupo de ingresso).", args: { a: "faturamento | ingressos | ticket | dia | idade | grupo", b: "faturamento | ingressos | ticket | dia | idade | grupo" } },
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
    { feature: "vendas_por_lote", descricao: "Ingressos vendidos e valor (preço) de cada lote dos ingressos.", args: {} },
    { feature: "genero", descricao: "Distribuição de público por gênero (feminino, masculino, outro/não informado). Use para 'quantos homens e mulheres'.", args: {} },
    { feature: "ultimos_pagamentos", descricao: "Últimos pagamentos/repasses realizados: data, favorecido e valor transferido.", args: {} },
    { feature: "saldo_repasse", descricao: "Saldo líquido disponível no momento para executar repasses/pagamentos.", args: {} },
    { feature: "vendas_ano", descricao: "Valor total de ingressos vendidos no ano somando TODOS os eventos do produtor, com quebra por evento.", args: {} },
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
            const alias: Record<string, string> = {
                valor: "valor", faturamento: "valor", receita: "valor",
                itens: "itens", ingressos: "itens",
                ticket: "ticket", "ticket medio": "ticket", "ticket médio": "ticket",
                dia: "dia", tempo: "dia", data: "dia",
                idade: "idade", idades: "idade", faixa: "idade", "faixa etaria": "idade",
                grupo: "grupo", grupos: "grupo", setor: "grupo", "tipo de ingresso": "grupo", tipo: "grupo",
            };
            const a = alias[String(args.a ?? "itens").toLowerCase()] ?? "itens";
            const b = alias[String(args.b ?? "valor").toLowerCase()] ?? "valor";

            // Idade × grupo de ingresso (numérico × categórico) → idade média por grupo.
            if ((a === "idade" && b === "grupo") || (a === "grupo" && b === "idade")) {
                const porGrupo = new Map<string, { soma: number; n: number }>();
                for (const c of COMPRADORES) {
                    const e = porGrupo.get(c.grupo) ?? { soma: 0, n: 0 };
                    e.soma += c.idade;
                    e.n++;
                    porGrupo.set(c.grupo, e);
                }
                const ordem = GRUPOS.filter((g) => g.categoria === "Ingressos").map((g) => g.nome);
                const dados = [...porGrupo.entries()]
                    .map(([grupo, e]) => ({ nome: grupo, valor: Math.round(e.soma / e.n), i: ordem.indexOf(grupo) }))
                    .sort((x, y) => (x.i < 0 ? 99 : x.i) - (y.i < 0 ? 99 : y.i))
                    .map(({ nome, valor }) => ({ nome, valor }));
                return [{ tipo: "barras", titulo: "Idade média por grupo de ingresso", formato: "numero", dados }];
            }

            const leitura = (r: number) => {
                const abs = Math.abs(r);
                const forca = abs >= 0.7 ? "forte" : abs >= 0.4 ? "moderada" : abs >= 0.2 ? "fraca" : "desprezível";
                return `Correlação ${forca} ${r >= 0 ? "positiva" : "negativa"} (Pearson r = ${r.toFixed(2).replace(".", ",")})`;
            };
            const regressao = (xs: number[], ys: number[]) => {
                const r = correlacaoPearson(xs, ys);
                const eX = resumo(xs);
                const eY = resumo(ys);
                const slope = eX.desvioPadrao ? r * (eY.desvioPadrao / eX.desvioPadrao) : 0;
                return { r, ajuste: { a: slope, b: eY.media - slope * eX.media } };
            };

            // Correlação envolvendo idade → catálogo de compradores (idade × ticket pago).
            if (a === "idade" || b === "idade") {
                const amostra = COMPRADORES.filter((_, i) => i % 3 === 0); // ~800 pontos
                const xs = amostra.map((c) => c.idade);
                const ys = amostra.map((c) => c.valor);
                const { r, ajuste } = regressao(xs, ys);
                return [
                    {
                        tipo: "dispersao",
                        titulo: "Correlação — Idade × Ticket pago",
                        dados: xs.map((x, i) => ({ x, y: ys[i] })),
                        rotuloX: "Idade",
                        rotuloY: "Ticket pago",
                        r,
                        ajuste,
                        formatoX: "numero",
                        formatoY: "moeda",
                        ajuda: leitura(r),
                    },
                ];
            }

            const serie = d.vendasDiarias;
            const coluna = (nome: string) => serie.map((x, i) => (nome === "valor" ? x.valor : nome === "itens" ? x.itens : nome === "ticket" ? (x.itens ? x.valor / x.itens : 0) : i));
            const rotulo: Record<string, string> = { valor: "Faturamento/dia", itens: "Ingressos/dia", ticket: "Ticket médio/dia", dia: "Dia da campanha" };
            const fmtDe: Record<string, Formato> = { valor: "moeda", ticket: "moeda", itens: "numero", dia: "numero" };
            const xs = coluna(a);
            const ys = coluna(b);
            const { r, ajuste } = regressao(xs, ys);
            return [
                {
                    tipo: "dispersao",
                    titulo: `Correlação — ${rotulo[a]} × ${rotulo[b]}`,
                    dados: xs.map((x, i) => ({ x, y: ys[i] })),
                    rotuloX: rotulo[a],
                    rotuloY: rotulo[b],
                    r,
                    ajuste,
                    formatoX: fmtDe[a],
                    formatoY: fmtDe[b],
                    ajuda: leitura(r),
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

        /* ---- Perguntas frequentes do produtor (dados mockados) ---- */

        case "vendas_por_lote": {
            // Lotes dos ingressos: quantidade vendida + preço do lote (mock).
            const lotes = [
                { lote: "Pista — 1º lote", vendidos: 4200, preco: 180 },
                { lote: "Pista — 2º lote", vendidos: 3800, preco: 240 },
                { lote: "Pista — 3º lote", vendidos: 2600, preco: 320 },
                { lote: "Pista Premium — 1º lote", vendidos: 1900, preco: 420 },
                { lote: "Pista Premium — 2º lote", vendidos: 1450, preco: 520 },
                { lote: "Camarote — 1º lote", vendidos: 980, preco: 890 },
                { lote: "Camarote — 2º lote", vendidos: 620, preco: 1180 },
                { lote: "Área VIP — Lote único", vendidos: 340, preco: 2200 },
            ];
            return [
                {
                    tipo: "tabela",
                    titulo: "Ingressos vendidos e valor por lote",
                    colunas: ["Lote", "Vendidos", "Valor do lote", "Total arrecadado"],
                    linhas: lotes.map((l) => [l.lote, numberFormatter.format(l.vendidos), currencyFormatter.format(l.preco), currencyFormatter.format(l.vendidos * l.preco)]),
                },
            ];
        }

        case "genero": {
            // Distribuição por gênero (mock, proporcional ao público vendido).
            const base = d.ocupacao?.vendido || d.totais.itensVendidos || 12000;
            const fem = Math.round(base * 0.54);
            const masc = Math.round(base * 0.44);
            const outro = Math.max(0, base - fem - masc);
            return [
                {
                    tipo: "barras",
                    titulo: "Público por gênero",
                    formato: "numero",
                    dados: [
                        { nome: "Feminino", valor: fem },
                        { nome: "Masculino", valor: masc },
                        { nome: "Outro / não informado", valor: outro },
                    ],
                },
            ];
        }

        case "ultimos_pagamentos": {
            // Últimos repasses/pagamentos executados (mock).
            const pagamentos = [
                { data: "18/07/2026", favorecido: "Produtora Carneiros Live Ltda", valor: 420000 },
                { data: "11/07/2026", favorecido: "Bar do Mar Serviços de A&B", valor: 96500 },
                { data: "04/07/2026", favorecido: "Sound & Light Estruturas", valor: 158000 },
                { data: "27/06/2026", favorecido: "Agência Talentos Brasil", valor: 240000 },
                { data: "20/06/2026", favorecido: "Segurança Praia Norte ME", valor: 73200 },
            ];
            return [
                {
                    tipo: "tabela",
                    titulo: "Últimos 5 pagamentos realizados",
                    colunas: ["Data", "Favorecido", "Valor transferido"],
                    linhas: pagamentos.map((p) => [p.data, p.favorecido, currencyFormatter.format(p.valor)]),
                },
            ];
        }

        case "saldo_repasse": {
            // Saldo líquido disponível para repasse agora (mock derivado do borderô).
            const saldo = d.bordero?.liquido ? Math.round(d.bordero.liquido * 0.38) : 3860000;
            return [{ tipo: "metric", titulo: "Saldo disponível para repasse", valor: currencyFormatter.format(saldo), ajuda: "Valor líquido já liberado para executar pagamentos neste momento." }];
        }

        case "vendas_ano": {
            // Total de ingressos vendidos no ano somando TODOS os eventos do produtor (mock).
            const eventos = [
                { nome: "Réveillon Carneiros 2027", valor: d.totais.valorTotalBruto || 13196160 },
                { nome: "Carnaval Recife 2026", valor: 4820000 },
                { nome: "São João Caruaru 2026", valor: 6310000 },
                { nome: "Festival de Verão 2026", valor: 2140000 },
                { nome: "Ano Novo Porto 2026", valor: 3960000 },
            ];
            const total = eventos.reduce((s, e) => s + e.valor, 0);
            return [
                {
                    tipo: "barras",
                    titulo: `Ingressos vendidos em 2026 — total ${currencyFormatter.format(total)} (todos os eventos)`,
                    formato: "moeda",
                    dados: eventos.map((e) => ({ nome: e.nome, valor: e.valor })),
                },
            ];
        }

        default:
            return [{ tipo: "texto", titulo: cap(chamada.feature), conteudo: "Não reconheci essa análise." }];
    }
}

/** Executa o plano da IA (lista de chamadas) e devolve os blocos já com a visualização decidida. */
export function executarPlano(chamadas: Chamada[], d: Dataset): Bloco[] {
    return chamadas.flatMap((c) => executarChamada(c, d));
}
