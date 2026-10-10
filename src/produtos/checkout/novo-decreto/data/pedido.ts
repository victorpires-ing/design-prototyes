/* Pedido mockado do checkout (evento "Vai safadão"). */

export const EVENTO = {
    nome: "Vai safadão",
    local: "Belém - PA",
    sessao: "Sab, 13/06/26 às 13h00",
};

export const PRECO_ITENS = 140;
export const PRECO_PROTECAO = 10;
export const TAXA_SERVICO = 15;
export const TAXA_PROCESSAMENTO = 20;

/** Decisão sobre a proteção: enquanto estiver "pendente", o pagamento fica bloqueado. */
export type Protecao = "pendente" | "com" | "sem";

export const COBERTURAS = {
    cobre: ["Acidente, doença ou lesão", "Infecção por COVID-19 e isolamento", "Emergência doméstica", "Roubo de documentos"],
    naoCobre: ["Desistência ou mudança de planos", "Cancelamento ou adiamento do evento, que já têm reembolso pela política da Ingresse"],
    reembolso: "Em Meus ingressos, até 30 dias após a data do evento, com um documento que comprove o motivo.",
};

export const TAXAS_EXPLICADAS = [
    {
        titulo: "Taxa de serviço",
        texto: "Responsável por viabilizar a operação da plataforma, incluindo tecnologia, atendimento e segurança da compra.",
    },
    {
        titulo: "Taxa de processamento",
        texto: "Referente ao processamento do pagamento e às integrações necessárias para concluir a transação com segurança.",
    },
    {
        titulo: "Juros de parcelamento",
        texto: "Valor aplicado pela operadora financeira em compras parceladas, conforme a forma de pagamento escolhida.",
    },
    { titulo: "Desconto", texto: "Os descontos são aplicados exclusivamente ao valor dos itens, sem incidência nas taxas." },
];

export const totalPedido = (protecao: Protecao) => PRECO_ITENS + (protecao === "com" ? PRECO_PROTECAO : 0) + TAXA_SERVICO + TAXA_PROCESSAMENTO;

export const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
