/** Status possíveis de uma solicitação de aprovação. */
export type StatusSolicitacao = "pendente" | "aprovada" | "rejeitada";

export interface Solicitacao {
    id: string;
    /** Data da solicitação (ISO: YYYY-MM-DD). */
    data: string;
    solicitante: {
        nome: string;
        /** Documento (CPF) do solicitante. */
        documento: string;
    };
    status: StatusSolicitacao;
    /** Anexos enviados na solicitação. */
    anexos: { nome: string; url: string }[];
    /** Quem decidiu (aprovou/reprovou) e quando — presente apenas em solicitações já decididas. */
    decisao?: { por: string; em: string };
}

/** Solicitações mock para a listagem. */
export const SOLICITACOES: Solicitacao[] = [
    {
        id: "1",
        data: "2026-06-28",
        solicitante: { nome: "Olivia Rhye", documento: "123.456.789-01" },
        status: "pendente",
        anexos: [
            { nome: "contrato.pdf", url: "#" },
            { nome: "documento-rg.jpg", url: "#" },
        ],
    },
    {
        id: "2",
        data: "2026-06-27",
        solicitante: { nome: "Phoenix Baker", documento: "234.567.890-12" },
        status: "aprovada",
        anexos: [{ nome: "comprovante.pdf", url: "#" }],
        decisao: { por: "Ana Soares", em: "2026-06-27" },
    },
    {
        id: "3",
        data: "2026-06-26",
        solicitante: { nome: "Lana Steiner", documento: "345.678.901-23" },
        status: "rejeitada",
        anexos: [],
        decisao: { por: "Carlos Mendes", em: "2026-06-26" },
    },
    {
        id: "4",
        data: "2026-06-25",
        solicitante: { nome: "Demi Wilkinson", documento: "456.789.012-34" },
        status: "pendente",
        anexos: [
            { nome: "proposta.pdf", url: "#" },
            { nome: "planilha.xlsx", url: "#" },
            { nome: "termo.pdf", url: "#" },
        ],
    },
    {
        id: "5",
        data: "2026-06-24",
        solicitante: { nome: "Candice Wu", documento: "567.890.123-45" },
        status: "aprovada",
        anexos: [{ nome: "nota-fiscal.pdf", url: "#" }],
        decisao: { por: "Ana Soares", em: "2026-06-24" },
    },
    {
        id: "6",
        data: "2026-06-22",
        solicitante: { nome: "Natali Craig", documento: "678.901.234-56" },
        status: "pendente",
        anexos: [
            { nome: "cartao-cnpj.pdf", url: "#" },
            { nome: "alvara.pdf", url: "#" },
        ],
    },
    {
        id: "7",
        data: "2026-06-20",
        solicitante: { nome: "Drew Cano", documento: "789.012.345-67" },
        status: "aprovada",
        anexos: [],
        decisao: { por: "Ana Soares", em: "2026-06-20" },
    },
];

/** Rótulos e cores (semânticas do design system) por status. */
export const STATUS_META: Record<StatusSolicitacao, { label: string; color: "warning" | "success" | "error" }> = {
    pendente: { label: "Pendente", color: "warning" },
    aprovada: { label: "Aprovada", color: "success" },
    rejeitada: { label: "Rejeitada", color: "error" },
};

/** Formata "YYYY-MM-DD" para "DD/MM/AAAA". */
export const formatarData = (iso: string): string => {
    const [ano, mes, dia] = iso.split("-");
    return `${dia}/${mes}/${ano}`;
};
