/* Conteúdo editorial da campanha. Tudo que é texto de marketing mora aqui para
   a página ficar só com estrutura e movimento. */

export const CAMPANHA = {
    nome: "Sports Week",
    edicao: "2026",
    /* Headline do hero: o lockup logo acima já diz o nome da campanha, então a
       headline carrega só o prazo e o que o atleta leva.
       É uma frase, não uma lista de linhas: onde ela quebra é decisão da largura
       da coluna, não nossa. Escrita aqui, a quebra vira promessa que não se
       cumpre, porque a mesma frase vive em telas de 360 a 1600px. */
    headline: "Sete dias para garantir o ano",
    subheadline: "Até 60% de desconto em mais de 1.200 eventos, de 23 a 30 de novembro.",
    claim: "A maior temporada de descontos chegou",
    selo: "powered by Ticket Sports",
    /* A contagem regressiva aponta para o fim da campanha. Como é protótipo, o
       alvo é calculado a partir do carregamento para o relógio nunca zerar. */
    duracaoHoras: 7 * 24,
    periodo: "De 23 a 30 de novembro",
    descontoMaximo: 60,
};

export interface Numero {
    valor: string;
    label: string;
}

export const NUMEROS: Numero[] = [
    { valor: "+1.200", label: "eventos em oferta" },
    { valor: "60%", label: "de desconto máximo" },
    { valor: "7", label: "dias de campanha" },
    { valor: "+90", label: "cidades" },
];

export interface Passo {
    titulo: string;
    texto: string;
}

export const COMO_FUNCIONA: Passo[] = [
    {
        titulo: "Escolha o esporte",
        texto: "Corrida, trail, ciclismo, triathlon, águas abertas, obstáculos, caminhada ou CrossFit. Cada modalidade tem a própria vitrine.",
    },
    {
        titulo: "Garanta o lote promocional",
        texto: "O preço da Sports Week vale enquanto durarem as vagas do lote. Quando elas acabam, o evento volta ao valor cheio.",
    },
    {
        titulo: "Corra quando for a data",
        texto: "A inscrição fica guardada na sua conta Ingresse. No dia, você só precisa aparecer na largada.",
    },
];

export interface Vantagem {
    titulo: string;
    texto: string;
}

export const VANTAGENS: Vantagem[] = [
    { titulo: "Preço de lote fechado", texto: "O valor da campanha é menor que o primeiro lote de qualquer evento da lista." },
    { titulo: "Parcelamento em até 12x", texto: "Dá para garantir a vaga do ano que vem sem esperar o salário cair." },
    { titulo: "Inscrição transferível", texto: "Se não puder correr, passe a vaga para outra pessoa pelo app, sem taxa." },
    { titulo: "Kit do atleta incluso", texto: "Número de peito, chip de cronometragem, seguro e medalha de finisher em todas as provas." },
];

export interface Pergunta {
    q: string;
    a: string;
}

export const FAQ: Pergunta[] = [
    {
        q: "O que é a Sports Week?",
        a: "É a semana de ofertas da Ticket Sports. Durante sete dias, eventos esportivos de todo o país abrem um lote promocional exclusivo, com preço abaixo do primeiro lote oficial.",
    },
    {
        q: "O desconto vale para qualquer evento?",
        a: "Vale para os eventos listados nesta página. Cada organizador define o percentual e a quantidade de vagas do lote da campanha.",
    },
    {
        q: "Quantas inscrições posso comprar?",
        a: "Quantas quiser. Você pode inscrever outra pessoa ou um dependente no mesmo pedido, respondendo um formulário de atleta para cada inscrição.",
    },
    {
        q: "O preço volta depois da campanha?",
        a: "Volta. Quando a Sports Week termina ou quando as vagas do lote acabam, o evento retoma o valor do lote vigente.",
    },
    {
        q: "Posso parcelar?",
        a: "Pode, em até 12 vezes no cartão de crédito. As duas primeiras parcelas são sem juros.",
    },
    {
        q: "E se eu não puder participar?",
        a: "A inscrição é transferível pelo app da Ingresse até a data limite informada pelo organizador, sem custo.",
    },
    {
        q: "Onde vejo minha inscrição depois da compra?",
        a: "Em “Minhas inscrições”, na sua conta Ingresse. O número de peito e as instruções de retirada do kit chegam por e-mail.",
    },
];

/* Frases que rodam no marquee. Curtas de propósito. */
export const MARQUEE = [
    "SPORTS WEEK TÁ ON",
    "ATÉ 60% OFF",
    "+1.200 EVENTOS EM OFERTA",
    "SETE DIAS SÓ",
    "LOTE PROMOCIONAL ABERTO",
    "KIT DO ATLETA INCLUSO",
    "ASFALTO, TRILHA E MAR",
    "VIP NA SPORTS WEEK",
];

/* Títulos e textos de apoio das seções da home. Ficam juntos para a página só
   cuidar de estrutura e movimento. */
export const SECOES = {
    numeros: { titulo: "Sports Week em números", apoio: "O tamanho da edição 2026, em quatro números." },
    modalidades: { titulo: "Escolha seu esporte", apoio: "Oito modalidades, cada uma com a própria vitrine de eventos em oferta." },
    destaques: { titulo: "Destaques da semana", apoio: "Os lotes promocionais que estão saindo mais rápido." },
    comoFunciona: { titulo: "Como funciona", apoio: "Três passos entre o scroll e a largada." },
    vantagens: { titulo: "O que vem junto", apoio: "Vale para todos os eventos da campanha, sem letra miúda." },
    relampago: { titulo: "Oferta relâmpago", apoio: "Um evento por dia com desconto extra. Vale até as 23h59." },
    faq: { titulo: "Perguntas frequentes", apoio: "O que mais perguntam para o nosso suporte." },
    fechamento: { titulo: "Pronto para largar?", apoio: "A campanha fecha em 30 de novembro. Depois disso, preço de lote normal." },
};

/* Preço não inclui taxa de serviço: precisa estar escrito em algum lugar. */
export const DISCLAIMER =
    "Preços válidos de 23 a 30 de novembro de 2026 ou enquanto durarem as vagas do lote promocional, o que acontecer primeiro. Os valores exibidos não incluem a taxa de serviço da Ingresse, apresentada antes da confirmação da compra. Cada organizador define o percentual de desconto e a quantidade de vagas do lote da campanha. Promoção não cumulativa com outros descontos, cupons ou convênios. Encerrada a campanha, cada evento retoma o valor do lote vigente.";
