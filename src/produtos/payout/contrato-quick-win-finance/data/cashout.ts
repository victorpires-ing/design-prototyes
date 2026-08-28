/**
 * Dados mock do Cashout — Contrato Quick Win Finance.
 *
 * Espelha o refinamento do Figma (section "Refinamento", node 4108:811):
 * a página de eventos onde a associação é feita e a página de produtoras
 * onde os contratos vivem.
 */

/* ------------------------------------------------------------------ */
/*  Condições comerciais                                              */
/* ------------------------------------------------------------------ */

export interface CondicaoItem {
    label: string;
    valor: string;
}

export interface CondicoesComerciais {
    online: CondicaoItem[];
    pdvOffline: CondicaoItem[];
}

/** Resumo de 4 colunas exibido no card do contrato antes de expandir. */
export interface ResumoCondicoes {
    credito: string;
    pix: string;
    debito: string;
    embutida: string;
}

/* ------------------------------------------------------------------ */
/*  Contratos                                                         */
/* ------------------------------------------------------------------ */

export interface Contrato {
    /** Identificador exibido como "Contrato 6431254613". */
    id: string;
    nome: string;
    produtora: string;
    /** Um contrato encerrado não pode ser vinculado a um evento. */
    podeAssociar: boolean;
    /** "Vigência até" para contratos válidos, "Encerrado em" para encerrados. */
    vigenciaPrefixo: string;
    /** Data da vigência, destacada em negrito no card. */
    vigenciaData: string;
    /** Alerta âmbar exibido acima das condições (vigência perto do fim). */
    aviso?: string;
    resumo: ResumoCondicoes;
    condicoes: CondicoesComerciais;
}

const CONDICOES_PADRAO: CondicoesComerciais = {
    online: [
        { label: "Taxa de conveniência", valor: "Organizador" },
        { label: "MDR", valor: "Organizador" },
        { label: "Crédito", valor: "20,00%" },
        { label: "PIX", valor: "20,00%" },
        { label: "Débito", valor: "0,00%" },
        { label: "Taxa embutida", valor: "6,00%" },
        { label: "Valor do MDR", valor: "2,62%" },
    ],
    pdvOffline: [
        { label: "MDR", valor: "Organizador" },
        { label: "Crédito", valor: "1,50%" },
        { label: "PIX", valor: "0,00%" },
        { label: "Débito", valor: "1,00%" },
        { label: "Dinheiro", valor: "0,00%" },
        { label: "Valor do MDR", valor: "2,62%" },
    ],
};

export const CONTRATOS: Contrato[] = [
    {
        id: "6431254613",
        nome: "São Paulo",
        produtora: "Anitta Produções",
        podeAssociar: true,
        vigenciaPrefixo: "Vigência até",
        vigenciaData: "12 mar 2026",
        resumo: { credito: "10,00%", pix: "8,00%", debito: "0,00%", embutida: "6,00%" },
        condicoes: CONDICOES_PADRAO,
    },
    {
        id: "354534",
        nome: "Outros estados",
        produtora: "Grupo Onda",
        podeAssociar: true,
        vigenciaPrefixo: "Vigência até",
        vigenciaData: "28 fev 2026",
        aviso: "Vigência termina em 41 dias. Confirme a renovação para eventos futuros.",
        resumo: { credito: "13,00%", pix: "13,00%", debito: "0,00%", embutida: "6,00%" },
        condicoes: CONDICOES_PADRAO,
    },
    {
        id: "354535",
        nome: "Interior",
        produtora: "Grupo Onda",
        podeAssociar: true,
        vigenciaPrefixo: "Vigência até",
        vigenciaData: "28 fev 2026",
        aviso: "Vigência termina em 41 dias. Confirme a renovação para eventos futuros.",
        resumo: { credito: "13,00%", pix: "13,00%", debito: "0,00%", embutida: "6,00%" },
        condicoes: CONDICOES_PADRAO,
    },
    {
        id: "354536",
        nome: "Rio de Janeiro",
        produtora: "Camarote Eventos",
        podeAssociar: false,
        vigenciaPrefixo: "Encerrado em",
        vigenciaData: "30 nov 2025",
        resumo: { credito: "13,00%", pix: "13,00%", debito: "0,00%", embutida: "6,00%" },
        condicoes: CONDICOES_PADRAO,
    },
];

/* ------------------------------------------------------------------ */
/*  Eventos                                                           */
/* ------------------------------------------------------------------ */

/** Situação do contrato associado ao evento — dirige a cor do badge. */
export type SituacaoAssociacao = "ativo" | "renegociacao" | "renegociacao-pendente" | "meta-gmv" | "sem-contrato" | "inativo";

/** Tratamento visual da capa do evento, como no refinamento. */
export type CapaEvento = "imagem" | "promo" | "lancamento" | "live";

export type AcaoEvento = "visualizar" | "associar" | "regularizar";

export interface Evento {
    id: string;
    nome: string;
    data: string;
    hora: string;
    produtora: string;
    capa: CapaEvento;
    situacao: SituacaoAssociacao;
    /** "contrato 6431254613" — ausente quando não há contrato associado. */
    contrato?: string;
    /** Linha de apoio abaixo do badge. */
    detalhe: string;
    acao: AcaoEvento;
}

export const EVENTOS: Evento[] = [
    {
        id: "86885",
        nome: "Réveillon Copacabana",
        data: "31/12/2026",
        hora: "20:00",
        produtora: "Produtora Exemplo Ltda",
        capa: "imagem",
        situacao: "ativo",
        contrato: "contrato 6431254613",
        detalhe: "Crédito 20,00% · PIX 20,00% · Organizador",
        acao: "visualizar",
    },
    {
        id: "90114",
        nome: "Onda Verão 2027",
        data: "14/02/2027",
        hora: "22:00",
        produtora: "Onda Produções",
        capa: "promo",
        situacao: "renegociacao",
        contrato: "contrato 8890",
        detalhe: "Condição atual vale até 12 mar 2026",
        acao: "visualizar",
    },
    {
        id: "91288",
        nome: "Camarote Setorial",
        data: "08/03/2027",
        hora: "16:00",
        produtora: "Camarote SP Eventos",
        capa: "live",
        situacao: "renegociacao-pendente",
        contrato: "contrato 9120",
        detalhe: "Condição pode mudar até a assinatura",
        acao: "visualizar",
    },
    {
        id: "92450",
        nome: "Festival Litoral",
        data: "21/11/2026",
        hora: "18:30",
        produtora: "Grupo Onda",
        capa: "lancamento",
        situacao: "meta-gmv",
        contrato: "contrato 7745",
        detalhe: "Faixa vigente: Crédito 12,00% · muda por GMV",
        acao: "visualizar",
    },
    {
        id: "85653",
        nome: "Eventis com Biritis 2",
        data: "01/01/2031",
        hora: "02:59",
        produtora: "Anitta Produções",
        capa: "imagem",
        situacao: "sem-contrato",
        detalhe: "Anitta Produções tem 3 contratos disponíveis",
        acao: "associar",
    },
    {
        id: "71800",
        nome: "Test Antifraud",
        data: "20/12/2030",
        hora: "22:00",
        produtora: "Grêmio FBPA",
        capa: "imagem",
        situacao: "inativo",
        detalhe: "Nenhum contrato elegível · único contrato inativo",
        acao: "regularizar",
    },
];

/* ------------------------------------------------------------------ */
/*  Produtoras                                                        */
/* ------------------------------------------------------------------ */

export type StatusContratoProdutora = "ativo" | "renegociacao" | "inativo";

export interface ContratoDaProdutora {
    nome: string;
    status: StatusContratoProdutora;
    condicao: string;
    papel: string;
    vigencia: string;
    /** Vigência exibida em vermelho quando o contrato já venceu. */
    vencido?: boolean;
}

export interface Produtora {
    id: string;
    nome: string;
    documento: string;
    tipo: "PJ" | "PF";
    contratos: ContratoDaProdutora[];
}

export const PRODUTORAS: Produtora[] = [
    {
        id: "1625",
        nome: "Produtora Exemplo Ltda",
        documento: "60.259.457/0001-47",
        tipo: "PJ",
        contratos: [
            {
                nome: "São Paulo",
                status: "ativo",
                condicao: "Crédito 20,00% · PIX 20,00%",
                papel: "Organizador",
                vigencia: "até 12 mar 2026",
            },
        ],
    },
    {
        id: "1624",
        nome: "Anitta Produções",
        documento: "21.197.879/0001-83",
        tipo: "PJ",
        contratos: [
            {
                nome: "São Paulo",
                status: "ativo",
                condicao: "Crédito 20,00% · PIX 20,00%",
                papel: "Organizador",
                vigencia: "até 12 mar 2026",
            },
            {
                nome: "Outros estados",
                status: "renegociacao",
                condicao: "Crédito 13,00% · PIX 13,00%",
                papel: "Organizador",
                vigencia: "até 28 fev 2026",
            },
            {
                nome: "Rio de Janeiro",
                status: "inativo",
                condicao: "Crédito 10,00% · PIX 10,00%",
                papel: "Organizador",
                vigencia: "Vencido em 30 nov 2025",
                vencido: true,
            },
        ],
    },
    {
        id: "1623",
        nome: "Grupo Onda",
        documento: "47.271.584/0001-01",
        tipo: "PJ",
        contratos: [
            {
                nome: "Outros estados",
                status: "ativo",
                condicao: "Crédito 13,00% · PIX 13,00%",
                papel: "Organizador",
                vigencia: "até 28 fev 2026",
            },
            {
                nome: "Interior",
                status: "renegociacao",
                condicao: "Crédito 13,00% · PIX 13,00%",
                papel: "Organizador",
                vigencia: "até 28 fev 2026",
            },
        ],
    },
    {
        id: "1622",
        nome: "Camarote SP Eventos",
        documento: "207.380.247-83",
        tipo: "PF",
        contratos: [
            {
                nome: "São Paulo",
                status: "renegociacao",
                condicao: "Crédito 13,00% · PIX 13,00%",
                papel: "Organizador",
                vigencia: "até 28 fev 2026",
            },
        ],
    },
    {
        id: "1621",
        nome: "Grêmio FBPA",
        documento: "50.702.753/0001-17",
        tipo: "PJ",
        contratos: [
            {
                nome: "Rio Grande do Sul",
                status: "inativo",
                condicao: "Crédito 10,00% · PIX 10,00%",
                papel: "Organizador",
                vigencia: "Vencido em 30 nov 2025",
                vencido: true,
            },
        ],
    },
    {
        id: "1620",
        nome: "Zenity Produções",
        documento: "60.259.457/0001-99",
        tipo: "PJ",
        contratos: [],
    },
];
