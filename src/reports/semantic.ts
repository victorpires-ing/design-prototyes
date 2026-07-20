/* ------------------------------------------------------------------ */
/*  Camada semântica do dataset — enviada para a IA.                    */
/*                                                                      */
/*  Descreve as TABELAS, seus CAMPOS (medidas e dimensões) e as FUNÇÕES */
/*  ESTATÍSTICAS aplicáveis, para que a IA saiba o que considerar em    */
/*  cada chamada e qual método usar por tipo de pergunta — sem depender */
/*  de ver os dados brutos.                                             */
/* ------------------------------------------------------------------ */

import { EVENTO } from "./event-dataset";

export const CAMADA_SEMANTICA = {
    evento: {
        nome: EVENTO.nome,
        tipo: "Evento de entretenimento (festival/réveillon)",
        local: EVENTO.local,
        moeda: EVENTO.moeda,
        fuso: EVENTO.fusoLabel,
        diaDoEvento: EVENTO.diaEvento,
        janelaDeVendas: `${EVENTO.vendasInicio} a ${EVENTO.vendasFim} (≈3 meses)`,
    },

    // Cada tabela expõe medidas (números agregáveis) e dimensões (eixos de corte).
    tabelas: [
        {
            nome: "vendas",
            grao: "dia × grupo",
            temporal: true,
            descricao: "Vendas de itens (ingressos, combos e produtos) por dia ao longo da campanha.",
            medidas: [
                { campo: "receitaBruta", unidade: "moeda", agregacoes: ["soma", "media", "mediana", "desvioPadrao", "minimo", "maximo", "tendencia"] },
                { campo: "receitaLiquida", unidade: "moeda", agregacoes: ["soma", "media"] },
                { campo: "itens", unidade: "numero", agregacoes: ["soma", "media", "mediana", "desvioPadrao", "minimo", "maximo", "tendencia"] },
                { campo: "ticketMedio", unidade: "moeda", derivada: "receitaBruta / itens" },
            ],
            dimensoes: [
                { campo: "data", tipo: "temporal", granularidade: "dia" },
                { campo: "categoria", tipo: "categorico", valores: ["Ingressos", "Combos", "Produtos"] },
                { campo: "grupo", tipo: "categorico", descricao: "Grupo de ingresso (Pista, Camarote…), combo ou produto." },
            ],
        },
        {
            nome: "ocupacao",
            grao: "evento",
            temporal: false,
            descricao: "Ingressos vendidos frente à capacidade total.",
            medidas: [
                { campo: "vendido", unidade: "numero" },
                { campo: "capacidade", unidade: "numero" },
                { campo: "pct", unidade: "pct", derivada: "vendido / capacidade" },
            ],
            dimensoes: [],
        },
        {
            nome: "meiosDePagamento",
            grao: "evento",
            temporal: false,
            descricao: "Participação de cada meio de pagamento.",
            medidas: [{ campo: "pct", unidade: "pct" }],
            dimensoes: [{ campo: "meio", tipo: "categorico", valores: ["Pix", "Cartão de Crédito", "Cartão de Débito", "Isento / Cortesia"] }],
        },
        {
            nome: "transacoes",
            grao: "evento",
            temporal: false,
            descricao: "Pedidos por status e por canal de venda.",
            medidas: [
                { campo: "quantidade", unidade: "numero", agregacoes: ["soma", "distribuicaoPercentual"] },
                { campo: "valor", unidade: "moeda", agregacoes: ["soma", "distribuicaoPercentual"] },
            ],
            dimensoes: [
                { campo: "status", tipo: "categorico", valores: ["Aprovado", "Pendente", "Cancelado", "Estornado", "Reembolso"] },
                { campo: "canal", tipo: "categorico", valores: ["Online", "Offline (bilheteria)"] },
            ],
        },
        {
            nome: "acesso",
            grao: "dia do evento",
            temporal: true,
            descricao: "Check-in / validação de ingressos no dia do evento.",
            medidas: [
                { campo: "validados", unidade: "numero" },
                { campo: "naoValidados", unidade: "numero" },
                { campo: "taxaValidacaoPct", unidade: "pct" },
                { campo: "checkins", unidade: "numero" },
                { campo: "entradas", unidade: "numero" },
            ],
            dimensoes: [
                { campo: "faixaHorario", tipo: "temporal", granularidade: "hora", valores: ["20h", "21h", "22h", "23h", "00h", "01h", "02h", "03h"] },
                { campo: "portao", tipo: "categorico", valores: ["Portão Norte", "Portão Sul", "Portão Praia", "Portão VIP"] },
            ],
        },
        {
            nome: "transferencias",
            grao: "evento",
            temporal: false,
            descricao: "Transferências de ingressos entre portadores.",
            medidas: [
                { campo: "total", unidade: "numero" },
                { campo: "aceitas", unidade: "numero" },
                { campo: "pendentes", unidade: "numero" },
                { campo: "canceladas", unidade: "numero" },
                { campo: "churnPct", unidade: "pct" },
            ],
            dimensoes: [{ campo: "status", tipo: "categorico", valores: ["Aceitas", "Pendentes", "Canceladas"] }],
        },
        {
            nome: "questionarios",
            grao: "evento",
            temporal: false,
            descricao: "Respostas do questionário do evento.",
            medidas: [
                { campo: "respondentes", unidade: "numero" },
                { campo: "enviados", unidade: "numero" },
                { campo: "taxaRespostaPct", unidade: "pct" },
                { campo: "respostas", unidade: "numero" },
            ],
            dimensoes: [{ campo: "pergunta", tipo: "categorico" }],
        },
        {
            nome: "bordero",
            grao: "evento",
            temporal: false,
            descricao: "Composição financeira: bruto → taxas retidas → líquido a repassar.",
            medidas: [
                { campo: "bruto", unidade: "moeda" },
                { campo: "taxas", unidade: "moeda" },
                { campo: "liquido", unidade: "moeda" },
            ],
            dimensoes: [],
        },
    ],

    // Métodos disponíveis + quando usar cada um.
    funcoesEstatisticas: [
        { nome: "soma", quando: "Totais e KPIs agregados." },
        { nome: "media", quando: "Valor típico por dia numa série temporal." },
        { nome: "mediana", quando: "Valor central resistente a picos (ex.: dia atípico)." },
        { nome: "desvioPadrao", quando: "Dispersão / volatilidade das vendas diárias." },
        { nome: "minimo / maximo", quando: "Melhor e pior dia da série." },
        { nome: "tendencia", quando: "Variação percentual do início ao fim do período (crescimento)." },
        { nome: "distribuicaoPercentual", quando: "Participação de cada categoria num todo (mix, status, meios)." },
        { nome: "ranking", quando: "Ordenar grupos por uma medida (top N)." },
        { nome: "correlacao", quando: "Relação (Pearson) entre duas medidas diárias — ex.: ingressos × faturamento, ou dia da campanha × faturamento (força do crescimento)." },
    ],

    // Visualizações disponíveis e quando usar cada uma (a IA escolhe a partir daqui).
    visualizacoes: [
        { grafico: "linha", quando: "Séries temporais / evolução no tempo (dimensao: dia). Suporta acumulado." },
        { grafico: "barras", quando: "Ranking e comparação entre categorias (grupo, status, portão…)." },
        { grafico: "pizza", quando: "Composição de um todo com poucas fatias (mix, meios, canal)." },
        { grafico: "medidor", quando: "Uma taxa/percentual único (ocupação, validação, churn, taxa de resposta)." },
        { grafico: "metric", quando: "Um KPI único (faturamento total, ticket médio…)." },
        { grafico: "tabela", quando: "Resumo estatístico com vários números (média, mediana, desvio, mín/máx)." },
        { grafico: "dispersao", quando: "Inferência: relação entre duas medidas diárias — pontos + reta de regressão + coeficiente r. Use a feature 'correlacao' {a,b}." },
    ],
} as const;
