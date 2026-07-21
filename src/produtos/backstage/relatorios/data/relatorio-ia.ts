/* ------------------------------------------------------------------ */
/*  Relatório personalizado por IA (OpenRouter).                       */
/*  A fonte de dados é `src/reports` (dataset local do evento, pronto   */
/*  para ser trocado pela API de produção). A IA recebe a CAMADA         */
/*  SEMÂNTICA + o resumo agregado do período e devolve uma "visão"       */
/*  (blocos) escolhendo features e funções estatísticas.                 */
/* ------------------------------------------------------------------ */

import { CATALOGO, executarChamada, type Chamada } from "./relatorio-features";
import { executarConsulta, type Consulta } from "./relatorio-query";
import { CAMADA_SEMANTICA } from "@/reports/semantic";
import { consultarPeriodo, linhasDoPeriodo } from "@/reports/event-dataset";
import type { Dataset, FatoVenda, PeriodoSelecionado } from "@/reports/event-dataset";

export { consultarPeriodo, PERIODO_PADRAO, EVENTO } from "@/reports/event-dataset";
export type { Dataset, PeriodoSelecionado } from "@/reports/event-dataset";
export type { Consulta } from "./relatorio-query";

/* ------------------------------ Blocos ---------------------------- */

export type Formato = "moeda" | "numero" | "pct";

export type Bloco =
    | { tipo: "metric"; titulo: string; valor: string; ajuda?: string }
    | { tipo: "medidor"; titulo: string; pct: number; detalhe?: string }
    | { tipo: "barras"; titulo: string; formato?: Formato; dados: { nome: string; valor: number }[] }
    | { tipo: "linha"; titulo: string; formato?: Formato; dados: { nome: string; valor: number }[] }
    | { tipo: "pizza"; titulo: string; dados: { nome: string; valor: number }[] }
    | { tipo: "tabela"; titulo: string; colunas: string[]; linhas: (string | number)[][] }
    // Dispersão para inferência: pontos pareados + reta de regressão (ajuste) + coeficiente r.
    | { tipo: "dispersao"; titulo: string; dados: { x: number; y: number }[]; rotuloX: string; rotuloY: string; r: number; ajuste: { a: number; b: number }; formatoX?: Formato; formatoY?: Formato; ajuda?: string }
    | { tipo: "texto"; titulo?: string; conteudo: string };

export interface RespostaIA {
    resposta: string;
    blocos: Bloco[];
    sugestoes?: string[];
}

export interface Mensagem {
    autor: "user" | "assistant";
    texto: string;
}

/* ---------------------------- OpenRouter -------------------------- */

export const MODELO_PADRAO = "tencent/hy3:free";

export const getApiKey = (): string =>
    (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined) || localStorage.getItem("openrouter_key") || "";
export const setApiKey = (k: string) => localStorage.setItem("openrouter_key", k.trim());
export const getModelo = (): string =>
    localStorage.getItem("openrouter_model") || (import.meta.env.VITE_OPENROUTER_MODEL as string | undefined) || MODELO_PADRAO;
export const setModelo = (m: string) => localStorage.setItem("openrouter_model", m.trim());

/** Rótulos de dia + referências relativas a partir do resumo. */
const datasDoDataset = (dataset: Dataset) => {
    const dias = dataset.vendasDiarias.map((d) => d.dia);
    return { hoje: dias[dias.length - 1] ?? "", ontem: dias[dias.length - 2] ?? "", dias };
};

const SYSTEM = (dataset: Dataset) => {
    const datas = datasDoDataset(dataset);
    return `Você é um analista da Ingresse. Responda perguntas do organizador sobre o evento de forma CLARA e CONCISA, em português do Brasil.

CAMADA SEMÂNTICA (tabelas, campos, medidas, dimensões e funções estatísticas disponíveis — use para saber o que considerar em cada análise e qual método aplicar):
${JSON.stringify(CAMADA_SEMANTICA)}

RESUMO DOS DADOS (já do período selecionado; use apenas estes números, não invente e não cite a origem):
${JSON.stringify(dataset)}

DATAS: hoje = ${datas.hoje}; ontem = ${datas.ontem}; dias disponíveis = ${JSON.stringify(datas.dias)}.
Interprete termos relativos (hoje, ontem, anteontem, "dia 20") mapeando para os dias disponíveis. Se pedirem um dia sem dados (ex.: amanhã), diga isso na resposta.

Responda SOMENTE com um JSON válido (sem markdown):
{"consultas":[{"titulo":"...","medida":"...","dimensao":"...|null","agregacao":"soma|media|mediana|min|max|desvio","acumulado":false,"grafico":"auto","limite":0}],"sugestoes":["ideia 1","ideia 2","ideia 3"]}

MOTOR DE CONSULTA (combine livremente — cobre qualquer pergunta):
- medida: faturamento | faturamentoLiquido | desconto | itens | ticketMedio | ocupacao | validados | taxaValidacao | checkins | transacoes | valorTransacoes | transferencias | churn | respostas | taxaResposta | meioPagamento | bordero
- dimensao (opcional): dia | grupo | categoria | meioPagamento | status | canal | portao | faixaHorario | pergunta | faixaEtaria | uf | null (número único)
- acumulado: true = soma corrida no tempo (ex.: faturamento acumulado = {medida:"faturamento",dimensao:"dia",acumulado:true})
- agregacao: para um número único sobre a série diária (media/mediana/desvio/min/max); default soma
- grafico: "auto" (recomendado) escolhe pelo formato; ou linha/barras/pizza/medidor/metric/tabela
- limite: top N quando a dimensão é categórica (ranking)

Regras:
- Identifique TODAS as solicitações da mensagem. Para CADA uma gere UMA consulta. N pedidos → N consultas. Não repita consultas idênticas.
- Escolha medida+dimensão que respondem ao pedido, guiando-se pela CAMADA SEMÂNTICA (tabelas, campos e funções). Ex.: "taxa de acesso por tipo de ingresso" → {medida:"taxaValidacao",dimensao:"grupo"}.
- Relatórios empacotados (vários blocos): pode usar "chamadas":[{"feature":"nome","args":{}}] com as FEATURES abaixo (ex.: totais, bordero, questionarios, transferencias).
- NÃO escreva texto/resposta; entregue só os gráficos. Em "sugestoes", proponha 3 novas análises úteis e diferentes.

FEATURES (opcionais, relatórios empacotados): ${JSON.stringify(CATALOGO)}`;
};

/** Um único elemento por solicitação: prioriza o gráfico; senão o primeiro bloco. */
function umBloco(blocos: Bloco[]): Bloco[] {
    if (blocos.length <= 1) return blocos;
    const grafico = blocos.find((b) => b.tipo === "barras" || b.tipo === "linha" || b.tipo === "pizza" || b.tipo === "medidor" || b.tipo === "tabela" || b.tipo === "dispersao");
    return [grafico ?? blocos[0]];
}

/** Monta a resposta final a partir do texto do modelo. Uma consulta/chamada = um gráfico; N solicitações = N gráficos. */
function finalize(conteudo: string, dataset: Dataset, linhas: FatoVenda[]): RespostaIA {
    const plano = extrairJson(conteudo);
    if (!plano) return { resposta: "", blocos: [], sugestoes: DEFAULT_SUGESTOES };
    const deConsultas = (plano.consultas ?? []).map((c) => executarConsulta(c, dataset, linhas));
    const deFeatures = (plano.chamadas ?? []).flatMap((c) => umBloco(executarChamada(c, dataset)));
    return { resposta: plano.resposta ?? "", blocos: [...deConsultas, ...deFeatures], sugestoes: plano.sugestoes ?? DEFAULT_SUGESTOES };
}

const DEFAULT_SUGESTOES = ["Mostre as vendas por dia", "Distribuição por meio de pagamento", "Estatísticas do faturamento diário", "Top grupos por receita"];

interface ChatMsg {
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_call_id?: string;
    name?: string;
    tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
}

interface PlanoIA {
    resposta?: string;
    consultas?: Consulta[];
    chamadas?: Chamada[];
    sugestoes?: string[];
}

function extrairJson(txt: string): PlanoIA | null {
    const limpo = txt.replace(/```json/gi, "").replace(/```/g, "").trim();
    const ini = limpo.indexOf("{");
    const fim = limpo.lastIndexOf("}");
    if (ini === -1 || fim === -1) return null;
    try {
        return JSON.parse(limpo.slice(ini, fim + 1)) as PlanoIA;
    } catch {
        return null;
    }
}

const URL = "https://openrouter.ai/api/v1/chat/completions";

/** POST ao OpenRouter com timeout. */
async function post(model: string, body: Record<string, unknown>, key: string): Promise<Record<string, unknown>> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
        const resp = await fetch(URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
                "HTTP-Referer": window.location.origin,
                "X-Title": "Ingresse - Relatorio personalizado",
            },
            body: JSON.stringify({ model, ...body }),
            signal: ctrl.signal,
        });
        if (!resp.ok) {
            const detalhe = await resp.text().catch(() => "");
            throw new Error(`HTTP ${resp.status}: ${detalhe.slice(0, 200)}`);
        }
        return await resp.json();
    } finally {
        clearTimeout(timer);
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Roteia UMA parte da mensagem para uma consulta (motor genérico) ou feature (relatório empacotado). */
function rotearParte(parte: string, datas: { hoje: string; ontem: string }): Chamada | Consulta {
    const q = parte.toLowerCase();
    const has = (...w: string[]) => w.some((x) => q.includes(x));
    const ehItens = has("ingresso", "ingressos") && !has("faturamento", "receita", "valor", "r$");

    if (has("hoje")) return { feature: "metrica_dia", args: { dia: datas.hoje } };
    if (has("ontem")) return { feature: "metrica_dia", args: { dia: datas.ontem } };
    // Motor genérico para os casos que o catálogo fixo não cobre:
    if (has("acumul")) return { medida: ehItens ? "itens" : "faturamento", dimensao: "dia", acumulado: true };
    if (has("acesso", "valida", "check-in", "checkin", "check in") && has("tipo", "grupo", "ingresso", "categoria", "setor"))
        return { medida: "taxaValidacao", dimensao: "grupo" };

    /* ---- Perguntas frequentes do produtor (respostas mockadas) ---- */
    // Gênero: "quantos homens e mulheres".
    if (has("gênero", "genero", "homens", "mulheres", "masculino", "feminino", "sexo")) return { feature: "genero" };
    // Vendas por lote.
    if (has("lote", "lotes")) return { feature: "vendas_por_lote" };
    // Total vendido no ano somando todos os eventos.
    if (has("todos os eventos", "todos os meus eventos", "todos meus eventos") || (has("ano") && has("evento", "vendi", "ingresso", "total")))
        return { feature: "vendas_ano" };
    // Saldo disponível para repasse (antes de borderô, que também usa "repasse").
    if (has("saldo") || has("disponível para repass", "disponivel para repass", "para executar pagament")) return { feature: "saldo_repasse" };
    // Últimos pagamentos realizados (antes de "meio/pagamento" e "transfer").
    if (has("favorecid") || (has("pagamento", "pagamentos") && has("últim", "ultim", "realiza", "fizemos", "realizamos", "5 ")))
        return { feature: "ultimos_pagamentos" };
    if (has("correla", "relação entre", "relacao entre")) {
        const medidas: string[] = [];
        if (has("idade", "faixa etária", "faixa etaria")) medidas.push("idade");
        if (has("grupo", "setor", "tipo de ingresso")) medidas.push("grupo");
        if (has("ticket")) medidas.push("ticket");
        if (medidas.length < 2 && has("fatur", "receita", "valor", "r$")) medidas.push("valor");
        if (medidas.length < 2 && has("ingresso", "itens")) medidas.push("itens");
        if (medidas.length < 2 && has("dia", "tempo", "campanha", "cresc")) medidas.push("dia");
        const a = medidas[0] ?? "itens";
        const b = medidas[1] ?? (a === "valor" ? "itens" : "valor");
        return { feature: "correlacao", args: { a, b } };
    }
    // Demografia: faixa etária / localização (UF) → consulta genérica.
    if (has("faixa etária", "faixa etaria", "idade", "geração", "geracao"))
        return { medida: ehItens ? "itens" : "faturamento", dimensao: "faixaEtaria" };
    if (has("estado", "uf", "localiz", "região", "regiao", "por cidade"))
        return { medida: ehItens ? "itens" : "faturamento", dimensao: "uf" };
    if (has("ocupa", "lota")) return { feature: "ocupacao" };
    if (has("portão", "portao", "portões", "portoes")) return { feature: "acesso_portao" };
    if (has("horário", "horario", "fluxo", "por hora", "pico")) return { feature: "acesso_horario" };
    if (has("acesso", "valida", "check-in", "checkin", "check in", "entrada", "entraram", "compareci", "presenç", "presenc", "público presente")) return { feature: "acesso_validacao" };
    if (has("status", "aprovad", "cancelad", "estorn", "reembol", "pendente")) return { feature: "transacoes_status", args: { metrica: has("valor", "receita", "faturamento") ? "valor" : "quantidade" } };
    if (has("canal", "online", "bilheteria", "offline")) return { feature: "transacoes_canal" };
    if (has("meio", "pagamento", "pix", "cart", "boleto")) return { feature: "distribuicao", args: { dimensao: "meios" } };
    if (has("transfer", "churn")) return { feature: "transferencias" };
    if (has("question", "pesquisa", "respost", "formulá", "formula")) return { feature: "questionarios" };
    if (has("borderô", "bordero", "repasse", "taxa retid")) return { feature: "bordero" };
    if (has("estat", "média", "media", "mediana", "desvio", "tend")) return { feature: "estatisticas_vendas", args: { metrica: ehItens ? "itens" : "valor" } };
    if (has("ranking", "top", "mais vend", "melhores grupo", "maiores grupo")) return { feature: "ranking_grupos", args: { metrica: has("receita", "faturamento", "valor") ? "valor" : "vendido" } };
    if (has("por dia", "diá", "diario", "por data", "ao longo", "evolu", "linha do tempo")) return { feature: "serie_vendas", args: { metrica: ehItens ? "itens" : "valor" } };
    if (has("mix", "receita por grupo", "composi", "combos", "produtos")) return { feature: "distribuicao", args: { dimensao: "mix" } };
    if (has("grupo", "setor")) return { feature: "distribuicao", args: { dimensao: "grupos" } };
    if (has("ticket")) return { feature: "metrica", args: { kpi: "ticketMedio" } };
    if (has("desconto")) return { feature: "metrica", args: { kpi: "desconto" } };
    if (has("item", "itens")) return { feature: "metrica", args: { kpi: "itens" } };
    if (has("com desconto", "líquido", "liquido")) return { feature: "metrica", args: { kpi: "valorLiquido" } };
    return { feature: "metrica", args: { kpi: "valorBruto" } };
}

/**
 * Perguntas frequentes do produtor: têm resposta mockada determinística e
 * NÃO devem passar pelo LLM (que tende a confundir "pagamentos" com "meios de
 * pagamento", etc.). São sempre roteadas localmente pelo `rotearParte`.
 */
export function ehPerguntaFrequente(texto: string): boolean {
    return /homens e mulheres|g[êe]nero|favorecid|pagamento[s]? (que|realiz|fizemos)|[úu]ltimos?\s*\d*\s*pagamento|saldo|por lote|ao longo do ano|todos os (meus )?eventos/i.test(texto);
}

/** Modo demonstração: divide a mensagem em N solicitações e gera um gráfico por solicitação. */
export function responderLocal(historico: Mensagem[], dataset: Dataset, linhas: FatoVenda[]): RespostaIA {
    const q = historico.filter((m) => m.autor === "user").pop()?.texto || "";
    const datas = datasDoDataset(dataset);
    // Correlação/relação é um pedido único — não dividir no " e " (ex.: "idade e grupo").
    const ehCorrelacao = /correla|rela[cç][aã]o entre/i.test(q);
    // Perguntas frequentes também são pedido único (têm vírgulas/"e" internos: "homens e mulheres", "favorecidos, e valores").
    const partes = ehCorrelacao || ehPerguntaFrequente(q)
        ? [q]
        : q
              .split(/\s+e\s+|,|;|\btambém\b|\bmais\b/i)
              .map((s) => s.trim())
              .filter((s) => s.length > 1);
    const alvo = partes.length ? partes : [q];

    // Um pedido por parte (consulta OU feature), sem duplicar.
    const chave = (p: Chamada | Consulta) => ("medida" in p ? `c:${p.medida}:${p.dimensao ?? ""}:${p.acumulado ?? ""}` : `f:${p.feature}:${JSON.stringify(p.args ?? {})}`);
    const pedidos: (Chamada | Consulta)[] = [];
    for (const parte of alvo) {
        const p = rotearParte(parte, datas);
        if (!pedidos.some((x) => chave(x) === chave(p))) pedidos.push(p);
    }
    const blocos = pedidos.flatMap((p) => ("medida" in p ? [executarConsulta(p, dataset, linhas)] : umBloco(executarChamada(p, dataset))));
    return { resposta: "", blocos, sugestoes: DEFAULT_SUGESTOES };
}

/** Tempo extra de loading (ms) para valorizar a animação cymatics de geração. */
const LOADING_EXTRA_MS = 2000;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Dispatcher: OpenRouter (se houver chave) → modo demonstração local. Recebe o período e resolve os dados da fonte. */
export async function chamarIA(historico: Mensagem[], periodo: PeriodoSelecionado): Promise<RespostaIA> {
    const dataset = consultarPeriodo(periodo);
    const linhas = linhasDoPeriodo(periodo);
    const orKey = getApiKey();
    // Perguntas frequentes → resposta mockada determinística (não depende do LLM).
    const ultimaUser = historico.filter((m) => m.autor === "user").pop()?.texto || "";
    const usarLocal = !orKey || ehPerguntaFrequente(ultimaUser);
    const res = usarLocal ? responderLocal(historico, dataset, linhas) : await chamarOpenRouter(historico, dataset, linhas, orKey);
    // Segura o loading +2s para mostrar mais a animação de geração do gráfico.
    await delay(LOADING_EXTRA_MS);
    return res;
}

async function chamarOpenRouter(historico: Mensagem[], dataset: Dataset, linhas: FatoVenda[], key: string): Promise<RespostaIA> {
    const baseMsgs: ChatMsg[] = [
        { role: "system", content: SYSTEM(dataset) },
        ...historico.map((m) => ({ role: m.autor === "user" ? ("user" as const) : ("assistant" as const), content: m.texto })),
    ];

    // Modelo escolhido + fallbacks gratuitos (JSON, sem tools).
    const modelos = [...new Set([getModelo(), "google/gemma-2-9b-it:free", "meta-llama/llama-3.3-70b-instruct:free"])];

    let ultimoErro: unknown;
    for (const model of modelos) {
        try {
            const data: any = await post(model, { messages: baseMsgs, temperature: 0.2 }, key);
            const conteudo: string = data?.choices?.[0]?.message?.content ?? "";
            const res = finalize(conteudo, dataset, linhas);
            // Sempre entregar algo visual: se a IA não gerou blocos, o sistema gera a partir da pergunta.
            if (!res.blocos.length) {
                const local = responderLocal(historico, dataset, linhas);
                if (local.blocos.length) return { ...local, resposta: res.resposta || local.resposta };
            }
            if (res.blocos.length) return res;
        } catch (e) {
            ultimoErro = e;
        }
    }
    // Todos os modelos falharam → não deixa o usuário sem resposta: roteia localmente.
    if (ultimoErro) return responderLocal(historico, dataset, linhas);
    throw new Error("Falha ao consultar a IA.");
}
