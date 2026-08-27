import { eventos } from "../../eventos/data/eventos";
import { brl, brlCompacto, numero, resumoDoEvento, resumos } from "../../eventos/data/vendas";

/**
 * Respostas do Remix.
 *
 * Mockadas, mas calculadas em cima de `eventos/data/vendas` — o agente
 * responde com os mesmos números que estão na tela, que é o que faz ele
 * parecer parte do sistema e não um chat colado por cima.
 */

export type Bloco =
    | { tipo: "barras"; dados: Array<{ nome: string; valor: number; de: string; para: string }>; formato?: "moeda" | "numero" | "pct" }
    | { tipo: "rosca"; dados: Array<{ nome: string; valor: number; cor: string }> }
    | { tipo: "lista"; itens: Array<{ label: string; sub?: string; valor: string; cover?: string; eventoId?: string; href?: string }> }
    /** Número em destaque, dentro de uma caixa própria. */
    | { tipo: "destaque"; rotulo: string; valor: string }
    /** Lista agrupada por seção, com linha pontilhada ligando rótulo e valor. */
    | { tipo: "agrupada"; grupos: Array<{ titulo: string; linhas: Array<{ label: string; valor: string }> }> }
    /** Registros: título em negrito, subtítulo e valor à direita. */
    | { tipo: "registros"; itens: Array<{ titulo: string; sub: string; valor: string; negativo?: boolean }> }
    /** Série mensal com um ponto destacável. */
    | { tipo: "linha"; dados: Array<{ mes: string; valor: number }>; destaque: number };

export interface Resposta {
    titulo?: string;
    /** Cartão de número que aparece antes do cartão principal. */
    destaque?: { rotulo: string; valor: string };
    bloco?: Bloco;
    insight: string;
    /** Próximos passos, empilhados abaixo do cartão. Sem href e sem pergunta, é só um toast. */
    acoes?: Array<{ label: string; href?: string; pergunta?: string }>;
}

export interface Sugestao {
    id: string;
    texto: string;
}

/** Paleta dos gráficos, na ordem do Figma. */
const GRADIENTES = [
    { de: "#FDE4D8", para: "#F0846A" },
    { de: "#BCC8F5", para: "#F2C4E4" },
    { de: "#6B6B6B", para: "#3A3A3A" },
    { de: "#BFD9F7", para: "#5B8FD9" },
    { de: "#D6C7F0", para: "#8E6BD1" },
];

const CORES_ROSCA = ["#1D4ED8", "#3B82F6", "#93C5FD", "#64748B", "#94A3B8", "#475569", "#CBD5E1"];

const pctFmt = (valor: number) => `${Math.round(valor * 100)}%`;

/* ------------------------------------------------------------------ */
/*  Contexto — o Remix sabe em que tela o usuário está                 */
/* ------------------------------------------------------------------ */

export type Escopo = { tipo: "organizacao" } | { tipo: "evento"; eventoId: string };

export function sugestoesPara(escopo: Escopo): Sugestao[] {
    if (escopo.tipo === "evento") {
        return [
            { id: "ocupacao", texto: "Qual está sendo a ocupação por sessão?" },
            { id: "genero", texto: "Quantos homens e mulheres possuem no evento?" },
            { id: "lote", texto: "Quantos ingressos foram vendidos em cada lote e qual foi o valor por lote?" },
            { id: "canal", texto: "Quantos ingressos vendi por canal?" },
            { id: "ritmo", texto: "Como está o ritmo de vendas?" },
            { id: "meta", texto: "Vou bater a meta de faturamento?" },
        ];
    }
    return [
        { id: "atencao", texto: "Quais eventos precisam de atenção?" },
        { id: "ano", texto: "Qual valor total de ingressos eu vendi ao longo do ano?" },
        { id: "transferencias", texto: "Quais foram os últimos 5 pagamentos que realizamos?" },
        { id: "saldo", texto: "Qual é o saldo de repasse que temos neste momento?" },
        { id: "faturamento", texto: "Quanto faturei em cada evento ativo?" },
        { id: "pagamento", texto: "Como meus clientes estão pagando?" },
    ];
}

/* ------------------------------------------------------------------ */
/*  Motor de respostas                                                 */
/* ------------------------------------------------------------------ */

const inclui = (texto: string, ...termos: string[]) => termos.some((t) => texto.includes(t));

export function responder(pergunta: string, escopo: Escopo): Resposta {
    const p = pergunta.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

    const evento = escopo.tipo === "evento" ? eventos.find((e) => e.id === escopo.eventoId) : null;
    const resumo = evento ? resumoDoEvento(evento) : null;

    /* ---- escopo do evento ---- */

    if (inclui(p, "homens", "mulheres", "genero")) {
        const base = resumo?.vendidos ?? 1900;
        const mulheres = Math.round(base * 0.526);
        const homens = Math.round(base * 0.421);
        const outros = base - mulheres - homens;
        return {
            titulo: "Proporção de participantes por gênero",
            bloco: {
                tipo: "barras",
                formato: "numero",
                dados: [
                    { nome: "Homens", valor: homens, ...GRADIENTES[0] },
                    { nome: "Mulheres", valor: mulheres, ...GRADIENTES[1] },
                    { nome: "Não identificado", valor: outros, ...GRADIENTES[2] },
                ],
            },
            insight: `A diferença entre homens e mulheres é de ${numero(mulheres - homens)}, com uma distribuição de 52,6% de mulheres e 42,1% de homens.`,
        };
    }

    if (inclui(p, "lote", "valor por lote")) {
        return {
            titulo: "Venda por lote",
            bloco: {
                tipo: "agrupada",
                grupos: [
                    {
                        titulo: "Pista",
                        linhas: [
                            { label: "1 lote", valor: "200 • R$ 107,95" },
                            { label: "2 lote", valor: "100 • R$ 217,95" },
                            { label: "3 lote", valor: "50 • R$ 327,95" },
                        ],
                    },
                    {
                        titulo: "Camarote",
                        linhas: [
                            { label: "1 lote", valor: "200 • R$ 227,95" },
                            { label: "2 lote", valor: "50 • R$ 347,95" },
                            { label: "3 lote", valor: "25 • R$ 527,95" },
                        ],
                    },
                ],
            },
            insight:
                "Pista teve a maior quantidade de vendas, porém camarote foi o ingresso que gerou mais receita, representando 63% do faturamento do evento.",
        };
    }

    if (resumo?.vendas && inclui(p, "ocupacao", "sessao", "sessoes", "lotado")) {
        const sessoes = resumo.vendas.sessoes;
        const pior = [...sessoes].sort(
            (a, b) =>
                (a.vendas.ingresse + a.vendas.parceiro + a.vendas.cortesia) / a.capacidade -
                (b.vendas.ingresse + b.vendas.parceiro + b.vendas.cortesia) / b.capacidade,
        )[0];
        const piorPct = (pior.vendas.ingresse + pior.vendas.parceiro + pior.vendas.cortesia) / pior.capacidade;

        return {
            titulo: "Ocupação por sessão",
            bloco: {
                tipo: "rosca",
                dados: sessoes.map((s, i) => ({
                    nome: s.nome,
                    valor: (s.vendas.ingresse + s.vendas.parceiro + s.vendas.cortesia) / s.capacidade,
                    cor: CORES_ROSCA[i % CORES_ROSCA.length],
                })),
            },
            insight: `A média é de ${pctFmt(resumo.ocupacao)}. A sessão ${pior.nome} é a mais vazia, com ${pctFmt(piorPct)} — vale concentrar esforço de marketing nela.`,
            acoes: [{ label: "Ver capacidade por sessão", href: "/backstage/evento/visao-geral" }],
        };
    }

    if (resumo?.vendas && inclui(p, "canal", "parceiro", "cortesia")) {
        const { porCanal } = resumo;
        return {
            titulo: "Ingressos por canal de venda",
            bloco: {
                tipo: "barras",
                formato: "numero",
                dados: [
                    { nome: "Ingresse", valor: porCanal.ingresse, ...GRADIENTES[1] },
                    { nome: "Parceiro", valor: porCanal.parceiro, ...GRADIENTES[0] },
                    { nome: "Cortesias", valor: porCanal.cortesia, ...GRADIENTES[2] },
                ],
            },
            insight: `De ${numero(resumo.vendidos)} ingressos, ${pctFmt(porCanal.ingresse / resumo.vendidos)} saíram pela Ingresse. Parceiros responderam por ${numero(porCanal.parceiro)} e ${numero(porCanal.cortesia)} foram cortesias.`,
        };
    }

    if (resumo && inclui(p, "ritmo", "velocidade", "por dia", "caiu", "acelerou")) {
        const direcao = resumo.variacaoRitmo >= 0 ? "acelerou" : "desacelerou";
        return {
            titulo: "Ritmo de vendas",
            bloco: {
                tipo: "lista",
                itens: [
                    { label: "Últimos 7 dias", valor: `${numero(resumo.ritmo7)}/dia` },
                    {
                        label: "Variação vs. semana anterior",
                        valor: `${resumo.variacaoRitmo >= 0 ? "+" : "−"}${Math.round(Math.abs(resumo.variacaoRitmo) * 100)}%`,
                    },
                    { label: "Ticket médio", valor: brl(resumo.ticketMedio) },
                    { label: "Dias até o evento", valor: `${Math.max(0, resumo.diasParaEvento)}` },
                ],
            },
            insight: `O ritmo ${direcao} ${Math.round(Math.abs(resumo.variacaoRitmo) * 100)}% na última semana, em ${numero(resumo.ritmo7)} ingressos/dia. ${
                resumo.variacaoRitmo < -0.2
                    ? "Queda dessa ordem costuma vir de fim de lote ou de campanha que parou de rodar."
                    : "Mantendo esse ritmo, a ocupação segue no caminho da meta."
            }`,
            acoes: [
                { label: "Ver velocidade no painel", href: "/backstage/evento/visao-geral" },
                { label: "Registrar um marco", href: "/backstage/evento/visao-geral" },
            ],
        };
    }

    if (resumo && inclui(p, "meta", "faturamento", "projecao", "vou bater")) {
        const atingido = resumo.faturamento / resumo.meta;
        const projetado = resumo.projecao / resumo.meta;
        return {
            titulo: "Faturamento contra a meta",
            bloco: {
                tipo: "lista",
                itens: [
                    { label: "Confirmado", valor: brl(resumo.faturamento) },
                    { label: "Meta", valor: brl(resumo.meta) },
                    { label: "Atingido", valor: pctFmt(atingido) },
                    { label: "Projeção no ritmo atual", valor: `${brlCompacto(resumo.projecao)} (${pctFmt(projetado)})` },
                ],
            },
            insight:
                projetado >= 1
                    ? `Sim. No ritmo atual você chega a ${pctFmt(projetado)} da meta antes do evento.`
                    : `No ritmo atual você chega a ${pctFmt(projetado)} da meta — faltariam ${brlCompacto(resumo.meta - resumo.projecao)}.`,
            acoes: [{ label: "Abrir painel do evento", href: "/backstage/evento/visao-geral" }],
        };
    }

    /* ---- escopo da organização ---- */

    const ativos = resumos().filter((r) => r.evento.status === "publicado");

    if (inclui(p, "liste os eventos", "lista de eventos", "listar eventos")) {
        const criticos = ativos.filter((r) => r.variacaoRitmo <= -0.25 || r.projecao < r.meta * 0.9);
        return {
            titulo: "Eventos que precisam de atenção",
            bloco: {
                tipo: "lista",
                itens: criticos.map((r) => ({
                    label: r.evento.nome,
                    sub: `${r.evento.dataLabel} · ${r.variacaoRitmo <= -0.25 ? "ritmo em queda" : "meta em risco"}`,
                    valor: `${Math.round((r.projecao / r.meta) * 100)}%`,
                    cover: r.evento.cover,
                    eventoId: r.evento.id,
                    href: "/backstage/evento/visao-geral",
                })),
            },
            insight: "Toque em um evento para abrir o painel dele com os números completos.",
        };
    }

    if (inclui(p, "atencao", "risco", "problema", "preciso olhar")) {
        const criticos = ativos.filter((r) => r.variacaoRitmo <= -0.25 || r.projecao < r.meta * 0.9);
        return {
            titulo: "Eventos que precisam de atenção",
            bloco: {
                tipo: "lista",
                itens: criticos.map((r) => ({
                    label: r.evento.nome,
                    sub: r.variacaoRitmo <= -0.25 ? "Ritmo em queda" : "Meta em risco",
                    valor: `${Math.round((r.projecao / r.meta) * 100)}% da meta`,
                    cover: r.evento.cover,
                    eventoId: r.evento.id,
                    href: "/backstage/evento/visao-geral",
                })),
            },
            insight: criticos.length
                ? `${criticos.length} ${criticos.length === 1 ? "evento precisa" : "eventos precisam"} de atenção. O caso mais urgente é ${criticos[0].evento.nome}.`
                : "Nenhum evento ativo está fora da curva no momento.",
            acoes: [{ label: "Ver todos os eventos", pergunta: "Liste os eventos que precisam de atenção" }],
        };
    }

    if (inclui(p, "ao longo do ano", "historico", "durante o ano")) {
        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const curva = [1980, 2140, 2320, 2510, 2760, 3180, 6035, 3420, 3260, 3510, 3720, 3900];
        return {
            destaque: { rotulo: "Ingressos vendidos ao longo do ano", valor: numero(curva.reduce((t, v) => t + v, 0)) },
            titulo: "Histórico de vendas",
            bloco: { tipo: "linha", dados: meses.map((mes, i) => ({ mes, valor: curva[i] })), destaque: 6 },
            insight: "A maior quantidade de vendas aconteceu em Julho, com a abertura do Réveillon Carneiros 2027.",
        };
    }

    if (inclui(p, "transferencia", "pagamentos que realizamos", "favorecido", "ultimos 5")) {
        return {
            titulo: "Transferências recentes",
            bloco: {
                tipo: "registros",
                itens: Array.from({ length: 5 }, (_, i) => ({
                    titulo: "Itaú • Conta: **** 4821",
                    sub: `Ag. 1234 · ${23 - i}/07/2026 às 14:32`,
                    valor: "- R$ 2.644,00",
                    negativo: true,
                })),
            },
            insight: "Aqui estão as cinco transferências mais recentes, com os favorecidos, valores e datas.",
        };
    }

    if (inclui(p, "saldo", "repasse")) {
        return {
            bloco: { tipo: "destaque", rotulo: "Saldo disponível", valor: "R$ 1.000.000,00" },
            insight: "Você quer executar os pagamentos com o seu saldo disponível?",
            acoes: [{ label: "Executar pagamentos" }, { label: "Agendar pagamentos" }],
        };
    }

    if (inclui(p, "rapido", "vendendo mais", "melhor")) {
        const ordenado = [...ativos].sort((a, b) => b.ritmo7 - a.ritmo7);
        return {
            titulo: "Ritmo por evento (últimos 7 dias)",
            bloco: {
                tipo: "barras",
                formato: "numero",
                dados: ordenado.slice(0, 4).map((r, i) => ({
                    // O rótulo quebra em duas linhas no gráfico, então cabe mais do nome.
                    nome: r.evento.nome.split(" ").slice(0, 4).join(" "),
                    valor: Math.round(r.ritmo7),
                    ...GRADIENTES[i % GRADIENTES.length],
                })),
            },
            insight: `${ordenado[0].evento.nome} lidera com ${numero(ordenado[0].ritmo7)} ingressos/dia.`,
            acoes: [{ label: "Comparar edições", href: "/backstage/relatorios/comparativos" }],
        };
    }

    if (inclui(p, "pagamento", "pix", "cartao", "pagando")) {
        const base = ativos[0]?.vendas?.pagamentos ?? [];
        const total = base.reduce((t, p2) => t + p2.qtd, 0);
        return {
            titulo: "Meios de pagamento",
            bloco: {
                tipo: "barras",
                formato: "numero",
                dados: base.map((p2, i) => ({ nome: p2.tipo.split(" ")[0], valor: p2.qtd, ...GRADIENTES[i % GRADIENTES.length] })),
            },
            insight: total
                ? `Cartão de crédito concentra ${pctFmt((base[0]?.qtd ?? 0) / total)} das transações, seguido do Pix.`
                : "Ainda não há transações confirmadas.",
        };
    }

    // Faturamento por evento — também é o fallback mais útil.
    return {
        titulo: "Faturamento por evento ativo",
        bloco: {
            tipo: "barras",
            formato: "moeda",
            dados: ativos.slice(0, 4).map((r, i) => ({
                // O rótulo quebra em duas linhas no gráfico, então cabe mais do nome.
                nome: r.evento.nome.split(" ").slice(0, 4).join(" "),
                valor: Math.round(r.faturamento),
                ...GRADIENTES[i % GRADIENTES.length],
            })),
        },
        insight: `Os eventos ativos somam ${brl(ativos.reduce((t, r) => t + r.faturamento, 0))} confirmados. ${ativos[0]?.evento.nome} responde pela maior fatia.`,
        acoes: [{ label: "Ver painel de eventos", href: "/backstage/eventos" }],
    };
}
