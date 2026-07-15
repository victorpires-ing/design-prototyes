export type StatusSolicitacao = "pendente" | "aprovada" | "rejeitada";

export interface Anexo {
    nome: string;
    arquivo: string;
    tamanho: string;
    tipo: "identificacao" | "laudo";
}

export interface Solicitacao {
    id: string;
    nome: string;
    documento: string;
    email: string;
    cid: string;
    telefone: string;
    /** Data de nascimento (DD/MM/AAAA). */
    nascimento: string;
    /** Data do laudo médico (DD/MM/AAAA). */
    dataLaudo: string;
    /** Data da solicitação (ISO YYYY-MM-DD). */
    data: string;
    status: StatusSolicitacao;
    /** Nome da segmentação em que a pessoa foi incluída (preenchido ao aprovar). */
    segmento?: string;
    /** Motivo informado ao reprovar. */
    justificativa?: string;
    anexos: Anexo[];
}

export const STATUS_META: Record<StatusSolicitacao, { label: string; color: "warning" | "success" | "error" }> = {
    pendente: { label: "Pendente", color: "warning" },
    aprovada: { label: "Aprovado", color: "success" },
    rejeitada: { label: "Reprovado", color: "error" },
};

const ANEXOS_PADRAO: Anexo[] = [
    { nome: "Documento de identificação", arquivo: "nomedodoc.pdf", tamanho: "200 KB", tipo: "identificacao" },
    { nome: "Laudo ou documento comprobatório", arquivo: "laudo.pdf", tamanho: "1,2 MB", tipo: "laudo" },
];

const nomes: [string, string, string][] = [
    ["Maria Silva", "123.456.789-01", "maria.silva"],
    ["João Ferraz", "234.567.890-12", "joao.ferraz"],
    ["Fernando Soares", "987.654.321-00", "fernando.soares"],
    ["Carlos Oliveira", "321.654.987-11", "carlos.oliveira"],
    ["Ana Costa", "456.789.123-22", "ana.costa"],
    ["Lucas Almeida", "789.123.456-33", "lucas.almeida"],
    ["Rafaela Lima", "213.546.879-44", "rafaela.lima"],
    ["Felipe Santos", "654.321.987-55", "felipe.santos"],
    ["Beatriz Rocha", "147.258.369-66", "beatriz.rocha"],
    ["Gustavo Nunes", "258.369.147-77", "gustavo.nunes"],
    ["Camila Duarte", "369.147.258-88", "camila.duarte"],
    ["Rodrigo Pires", "159.357.486-99", "rodrigo.pires"],
];

/** Gera uma data aleatória (DD/MM/AAAA) entre 2024 e 2026, para o campo "Data do laudo". */
const gerarDataLaudoAleatoria = () => {
    const dia = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
    const mes = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    const ano = 2024 + Math.floor(Math.random() * 3);
    return `${dia}/${mes}/${ano}`;
};

export const SOLICITACOES: Solicitacao[] = nomes.map(([nome, documento, user], i) => ({
    id: String(i + 1),
    nome,
    documento,
    email: `${user}@email.com`,
    cid: ["H90", "F41", "J45", "M54", "G43", "K21"][i % 6],
    telefone: `81 9 ${String(1000 + i).slice(-4)} ${String(4321 + i).slice(-4)}`,
    nascimento: `${String((i % 28) + 1).padStart(2, "0")}/0${(i % 9) + 1}/199${i % 9}`,
    dataLaudo: gerarDataLaudoAleatoria(),
    data: `2026-02-${String(i + 1).padStart(2, "0")}`,
    // Todas as solicitações começam pendentes; Aprovado/Reprovado se populam conforme o uso.
    status: "pendente" as StatusSolicitacao,
    anexos: ANEXOS_PADRAO,
}));

/** "YYYY-MM-DD" → "DD/MM/AAAA". */
export const formatarData = (iso: string): string => {
    const [ano, mes, dia] = iso.split("-");
    return `${dia}/${mes}/${ano}`;
};
