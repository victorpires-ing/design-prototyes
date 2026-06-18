/* Dados da São Silvestre replicados do app (produtos isolados) para a modal da Carteira Web. */
import kitEventoImg from "../assets/kit-evento.png";

export type ItemStatus = "hoje" | "proximo" | "finalizado";

export interface ComboItem {
    status?: ItemStatus;
    nome: string;
    data?: string;
    dataLabel?: string;
    acesso?: string;
    endereco?: string;
    imagem?: string;
    conteudo?: string[];
}

export interface Combo {
    id: string;
    nome: string;
    dataEvento: string;
    itens: ComboItem[];
}

export interface Resposta {
    pergunta: string;
    resposta: string;
}

export interface EventoSS {
    title: string;
    local: string;
    diaSemana: string;
    dia: string;
    mes: string;
    gradient: string;
    titular: string;
    cpf: string;
    combos: Combo[];
    questionario: Resposta[];
}

export const SAO_SILVESTRE: EventoSS = {
    title: "São Silvestre 2026",
    local: "Av. Paulista, São Paulo - SP",
    diaSemana: "Qui",
    dia: "31",
    mes: "Dez",
    gradient: "linear-gradient(135deg,#FF4D00 0%,#1d4ed8 100%)",
    titular: "Duny Alves da Silva",
    cpf: "832.840.732-12",
    combos: [
        {
            id: "combo-sao-silvestre",
            nome: "Combo São Silvestre",
            dataEvento: "Qui, 31 dez • 08:00",
            // Ordenado por data (mais próximo primeiro). Só o próximo recebe badge.
            itens: [
                {
                    status: "proximo",
                    nome: "Kit do atleta",
                    data: "Qui, 10 dez • 10:00",
                    dataLabel: "Data da retirada",
                    endereco: "Pavilhão do Anhembi • Av. Olavo Fontoura, 1209 - São Paulo/SP",
                    imagem: kitEventoImg,
                    conteudo: ["Camisa verde G", "Número", "Cronômetro", "Sacola"],
                },
                { nome: "Acesso ao evento", data: "Qui, 31 dez • 08:00", acesso: "Largada • Av. Paulista" },
            ],
        },
    ],
    questionario: [
        { pergunta: "Tamanho da camiseta", resposta: "G" },
        { pergunta: 'Equipe / assessoria (caso não possua, informe "Avulso")', resposta: "Avulso" },
        { pergunta: "Contato de emergência (nome e telefone)", resposta: "Maria Souza • (11) 99999-0000" },
        { pergunta: "Tipo sanguíneo", resposta: "O+" },
    ],
};
