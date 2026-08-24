/**
 * Dados mock do projeto Antifraude (produto Suspensão de compra).
 * Base: Figma "Suspensão de compra" → seção "Suspender usuário".
 */

/* ------------------------------------------------------------------ */
/*  Usuários e contas                                                 */
/* ------------------------------------------------------------------ */

export type StatusConta = "normal" | "suspensa";

export interface Conta {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    cpf: string;
    companhia: string;
    status: StatusConta;
}

export type StatusCompra = "ativa" | "suspensa" | "reembolsada";

export interface Compra {
    id: string;
    evento: string;
    dataEvento: string;
    status: StatusCompra;
    companhia: string;
}

/** Contas por e-mail/CPF — um e-mail pode ter mais de uma conta vinculada. */
export interface ResultadoBusca {
    email: string;
    contas: Conta[];
}

export const COMPRAS_POR_CONTA: Record<string, Compra[]> = {
    "5501234": [
        { id: "#a5f92ee9", evento: "Torcedor Mirante — Palmeiras x Cerro", dataEvento: "12 ago 2026", status: "ativa", companhia: "Ingresse" },
        { id: "#7c41b0a2", evento: "Turnê Dominguinho — Uberlândia", dataEvento: "14 ago 2026", status: "ativa", companhia: "Ingresse" },
        { id: "#98708fd1", evento: "BBQ SEM FRONTEIRAS", dataEvento: "15 ago 2026", status: "ativa", companhia: "Ingresse" },
    ],
    "5507788": [
        { id: "#31b7cc02", evento: "Turnê Dominguinho — Uberlândia", dataEvento: "14 ago 2026", status: "ativa", companhia: "Ingresse" },
    ],
    "5509912": [
        { id: "#c1094ffa", evento: "Camarote Firezone — Botafogo x Athlético PR", dataEvento: "24 ago 2026", status: "ativa", companhia: "Ingresse" },
        { id: "#4d20aa71", evento: "Quartinha 4 anos", dataEvento: "26 ago 2026", status: "ativa", companhia: "Ingresse" },
    ],
    "5512045": [
        { id: "#7ff10c3d", evento: "Corrida Mundo Livre 2026", dataEvento: "08 fev 2026", status: "reembolsada", companhia: "Ticket Sports" },
        { id: "#0ab93e55", evento: "Fortaleza x São Bernardo", dataEvento: "10 fev 2026", status: "reembolsada", companhia: "Ingresse" },
    ],
};

/** Base de busca do protótipo — casa por e-mail (parcial) ou por CPF (dígitos). */
export const BASE_USUARIOS: Conta[] = [
    {
        id: "5501234",
        nome: "Felipe Oliveira",
        email: "llipe.oliveira@hotmail.com",
        telefone: "+55 (11) 98888-0000",
        cpf: "•••.•••.•••-00",
        companhia: "Ingresse",
        status: "normal",
    },
    {
        id: "5507788",
        nome: "Felipe Oliveira",
        email: "llipe.oliveira@hotmail.com",
        telefone: "+55 (11) 97777-1111",
        cpf: "•••.•••.•••-00",
        companhia: "Ingresse",
        status: "normal",
    },
    {
        id: "5509912",
        nome: "Beatriz Gomes",
        email: "beatriz.35gom@gmail.com",
        telefone: "+55 (31) 99123-4567",
        cpf: "•••.•••.•••-42",
        companhia: "Ingresse",
        status: "normal",
    },
    {
        id: "5512045",
        nome: "Lucas Araújo",
        email: "lucasaraujo.ed@gmail.com",
        telefone: "+55 (85) 98120-7744",
        cpf: "•••.•••.•••-19",
        companhia: "Ticket Sports",
        status: "suspensa",
    },
];

/** CPFs completos aceitos na busca (o protótipo exibe sempre mascarado). */
const CPF_POR_CONTA: Record<string, string> = {
    "5501234": "12345678900",
    "5507788": "12345678900",
    "5509912": "98765432142",
    "5512045": "45678912319",
};

/**
 * Busca contas por e-mail ou CPF. Retorna `null` quando nada casa —
 * o que alimenta o estado "Nenhum usuário encontrado".
 */
export function buscarContas(termo: string): ResultadoBusca | null {
    const query = termo.trim().toLowerCase();
    if (!query) return null;

    const digitos = query.replace(/\D/g, "");
    const contas = BASE_USUARIOS.filter((conta) => {
        const porEmail = conta.email.toLowerCase().includes(query);
        const porCpf = digitos.length >= 3 && (CPF_POR_CONTA[conta.id] ?? "").includes(digitos);
        return porEmail || porCpf;
    });

    if (contas.length === 0) return null;
    return { email: contas[0].email, contas };
}

export function comprasDaConta(contaId: string): Compra[] {
    return COMPRAS_POR_CONTA[contaId] ?? [];
}

/* ------------------------------------------------------------------ */
/*  Motivos de suspensão                                              */
/* ------------------------------------------------------------------ */

export interface MotivoSuspensao {
    id: string;
    label: string;
    /** Motivos de alta certeza vão direto para reembolso, sem janela de validação. */
    reembolsoImediato?: boolean;
}

export const MOTIVOS: MotivoSuspensao[] = [
    { id: "chargeback", label: "Chargeback" },
    { id: "fraude-confirmada", label: "Fraude confirmada", reembolsoImediato: true },
    { id: "cartao-clonado", label: "Cartão clonado", reembolsoImediato: true },
    { id: "determinacao-judicial", label: "Determinação judicial" },
    { id: "revenda-nao-autorizada", label: "Revenda não autorizada" },
    { id: "cadastro-irregular", label: "Cadastro irregular" },
    { id: "uso-indevido-cortesia", label: "Uso indevido de cortesia" },
];

/* ------------------------------------------------------------------ */
/*  Fila de análise (Reanálise)                                        */
/* ------------------------------------------------------------------ */

export type DecisaoTransacao = "sem-decisao" | "aprovada" | "suspensa";

export interface Transacao {
    id: string;
    companhia: string;
    /** Coluna is_eventAlert da ferramenta atual. */
    alertaEvento: number | null;
    valor: number;
    dataPagamento: string;
    dataEvento: string;
    idEvento: string;
    nomeEvento: string;
    idPagamento: string;
    emailUsuario: string;
    contaId: string;
    decisao: DecisaoTransacao;
    /** Orientação da esteira para o analista. */
    orientacao: string;
}

const EVENTO_CAMAROTE = {
    idEvento: "9476fb5f-315f-4b6f-a8eb-cc9db99b0415",
    nomeEvento: "Camarote Firezone - Botafogo x Athlético PR",
    dataEvento: "24 ago 2026 19:00",
};

const EVENTO_QUARTINHA = {
    idEvento: "104524",
    nomeEvento: "Quartinha 4 anos",
    dataEvento: "26 ago 2026 19:00",
};

export const TRANSACOES: Transacao[] = [
    {
        id: "t-01",
        companhia: "Ingresse",
        alertaEvento: null,
        valor: 769.91,
        dataPagamento: "2026-08-15 23:14",
        idPagamento: "ff755609-c6e6-45b8-a246-bb977814ffee",
        emailUsuario: "llipe.oliveira@hotmail.com",
        contaId: "5501234",
        decisao: "sem-decisao",
        orientacao: "Análise padrão",
        ...EVENTO_CAMAROTE,
    },
    {
        id: "t-02",
        companhia: "Ingresse",
        alertaEvento: null,
        valor: 605.21,
        dataPagamento: "2026-08-23 21:02",
        idPagamento: "a1c0f9de-2b77-4c31-9f0a-71cb2f0d5511",
        emailUsuario: "beatriz.35gom@gmail.com",
        contaId: "5509912",
        decisao: "aprovada",
        orientacao: "Análise padrão",
        ...EVENTO_CAMAROTE,
    },
    {
        id: "t-03",
        companhia: "Ingresse",
        alertaEvento: null,
        valor: 769.91,
        dataPagamento: "2026-08-24 02:47",
        idPagamento: "b8fd2e10-77aa-4b6e-9c22-5f0d1b7c8890",
        emailUsuario: "beatriz.35gom@gmail.com",
        contaId: "5509912",
        decisao: "aprovada",
        orientacao: "Análise padrão",
        ...EVENTO_CAMAROTE,
    },
    {
        id: "t-04",
        companhia: "Ingresse",
        alertaEvento: 1,
        valor: 645.93,
        dataPagamento: "2026-08-21 19:38",
        idPagamento: "6f2ab441-1d54-4f19-9a01-e2c8d7f11a02",
        emailUsuario: "lucasaraujo.ed@gmail.com",
        contaId: "5512045",
        decisao: "sem-decisao",
        orientacao: "Cartão com múltiplos pedidos no fim de semana",
        ...EVENTO_QUARTINHA,
    },
    {
        id: "t-05",
        companhia: "Ingresse",
        alertaEvento: 1,
        valor: 795.94,
        dataPagamento: "2026-08-05 13:20",
        idPagamento: "1cf70b93-88de-4a55-83f7-0b6e5a2c9d31",
        emailUsuario: "lucasaraujo.ed@gmail.com",
        contaId: "5512045",
        decisao: "aprovada",
        orientacao: "Cartão com múltiplos pedidos no fim de semana",
        ...EVENTO_QUARTINHA,
    },
    {
        id: "t-06",
        companhia: "Ingresse",
        alertaEvento: null,
        valor: 575.96,
        dataPagamento: "2026-08-13 17:05",
        idPagamento: "0d9c1f77-4c02-4e88-b7aa-9d3e5f80c112",
        emailUsuario: "llipe.oliveira@hotmail.com",
        contaId: "5501234",
        decisao: "sem-decisao",
        orientacao: "Análise padrão",
        ...EVENTO_QUARTINHA,
    },
    {
        id: "t-07",
        companhia: "Ingresse",
        alertaEvento: null,
        valor: 302.83,
        dataPagamento: "2026-08-13 12:41",
        idPagamento: "7ba24e60-9f13-4d77-8c0b-2ad4e9f7b551",
        emailUsuario: "beatriz.35gom@gmail.com",
        contaId: "5509912",
        decisao: "aprovada",
        orientacao: "Análise padrão",
        ...EVENTO_QUARTINHA,
    },
    {
        id: "t-08",
        companhia: "Ingresse",
        alertaEvento: null,
        valor: 631.96,
        dataPagamento: "2026-08-22 19:12",
        idPagamento: "5e1b8a02-33cd-4a7f-9be1-6c7d0f2a44b8",
        emailUsuario: "llipe.oliveira@hotmail.com",
        contaId: "5501234",
        decisao: "sem-decisao",
        orientacao: "Análise padrão",
        ...EVENTO_QUARTINHA,
    },
    {
        id: "t-09",
        companhia: "Ingresse",
        alertaEvento: null,
        valor: 947.3,
        dataPagamento: "2026-08-22 21:55",
        idPagamento: "9a0e4c31-7b58-42d9-a1f6-08cb3d5e7712",
        emailUsuario: "beatriz.35gom@gmail.com",
        contaId: "5509912",
        decisao: "aprovada",
        orientacao: "Análise padrão",
        ...EVENTO_QUARTINHA,
    },
    {
        id: "t-10",
        companhia: "Ingresse",
        alertaEvento: null,
        valor: 484.01,
        dataPagamento: "2026-08-12 12:26",
        idPagamento: "2c7f9b18-6ad4-4be0-93c5-71f8e0a2d443",
        emailUsuario: "llipe.oliveira@hotmail.com",
        contaId: "5501234",
        decisao: "sem-decisao",
        orientacao: "Análise padrão",
        ...EVENTO_QUARTINHA,
    },
    {
        id: "t-11",
        companhia: "Ingresse",
        alertaEvento: null,
        valor: 254.58,
        dataPagamento: "2026-08-06 09:33",
        idPagamento: "e30ac5f9-1d26-4c88-b7f0-4a9e2b6d1105",
        emailUsuario: "beatriz.35gom@gmail.com",
        contaId: "5509912",
        decisao: "aprovada",
        orientacao: "Análise padrão",
        ...EVENTO_QUARTINHA,
    },
    {
        id: "t-12",
        companhia: "Ingresse",
        alertaEvento: null,
        valor: 631.96,
        dataPagamento: "2026-08-20 14:07",
        idPagamento: "cc41d2b7-58e9-4a03-9d17-6b2f8e0c5539",
        emailUsuario: "lucasaraujo.ed@gmail.com",
        contaId: "5512045",
        decisao: "suspensa",
        orientacao: "Alta certeza de fraude",
        ...EVENTO_QUARTINHA,
    },
];

export const OPERADORES = ["Bruno", "Gustavo", "Jackson", "Jennifer", "Nicolas", "Samara"];

export const STATUS_ANALISE: { id: DecisaoTransacao; label: string }[] = [
    { id: "aprovada", label: "Aprovado" },
    { id: "suspensa", label: "Suspenso" },
    { id: "sem-decisao", label: "Aguardando análise" },
];

/** Ferramentas externas consultadas durante a análise (chips do painel Decisão). */
export const FERRAMENTAS = ["OASIS", "SIFT", "CAF", "UNICO", "PROCOB", "BACKOFFICE", "BLACKTAG", "TICKETSPORTS"];

/* ------------------------------------------------------------------ */
/*  Usuários suspensos (histórico / desfechos)                         */
/* ------------------------------------------------------------------ */

export interface UsuarioSuspenso {
    contaId: string;
    nome: string;
    email: string;
    motivo: string;
    /** Ação tomada no desfecho. */
    acao: "Aguardando validação" | "Reembolso imediato" | "Reembolso após validação";
    analista: string;
    data: string;
    /** Alta certeza de fraude: reembolso direto, sem janela de validação nem contato. */
    altaCerteza: boolean;
    compras: Compra[];
}

export const USUARIOS_SUSPENSOS: UsuarioSuspenso[] = [
    {
        contaId: "5512045",
        nome: "Lucas Araújo",
        email: "lucasaraujo.ed@gmail.com",
        motivo: "Fraude confirmada",
        acao: "Reembolso imediato",
        analista: "Jackson",
        data: "11 fev 2026",
        altaCerteza: true,
        compras: [
            { id: "#7ff10c3d", evento: "Corrida Mundo Livre 2026", dataEvento: "08 fev 2026", status: "reembolsada", companhia: "Ticket Sports" },
            { id: "#0ab93e55", evento: "Fortaleza x São Bernardo", dataEvento: "10 fev 2026", status: "reembolsada", companhia: "Ingresse" },
        ],
    },
    {
        contaId: "5498120",
        nome: "Renata Prado",
        email: "renata.prado@gmail.com",
        motivo: "Chargeback",
        acao: "Aguardando validação",
        analista: "Samara",
        data: "18 ago 2026",
        altaCerteza: false,
        compras: [
            { id: "#a10f77c2", evento: "Quartinha 4 anos", dataEvento: "26 ago 2026", status: "suspensa", companhia: "Ingresse" },
        ],
    },
    {
        contaId: "5503391",
        nome: "Diego Martins",
        email: "diego.martins88@outlook.com",
        motivo: "Determinação judicial",
        acao: "Aguardando validação",
        analista: "Nicolas",
        data: "20 ago 2026",
        altaCerteza: false,
        compras: [
            { id: "#bb7710de", evento: "Camarote Firezone — Botafogo x Athlético PR", dataEvento: "24 ago 2026", status: "suspensa", companhia: "Ingresse" },
            { id: "#5c02f9a1", evento: "BBQ SEM FRONTEIRAS", dataEvento: "15 ago 2026", status: "suspensa", companhia: "Ingresse" },
        ],
    },
];

/* ------------------------------------------------------------------ */
/*  Formatadores                                                       */
/* ------------------------------------------------------------------ */

export const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const numero = new Intl.NumberFormat("pt-BR");

export const STATUS_COMPRA_META: Record<StatusCompra, { label: string; tone: "success" | "purple" | "neutral" }> = {
    ativa: { label: "Ativa", tone: "success" },
    suspensa: { label: "Suspensa", tone: "purple" },
    reembolsada: { label: "Reembolsada", tone: "neutral" },
};
