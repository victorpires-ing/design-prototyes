/* Dados da São Silvestre replicados do app (produtos isolados) para a modal da Carteira Web. */

export type ItemStatus = "hoje" | "proximo" | "finalizado";

export interface ComboItem {
    status?: ItemStatus;
    nome: string;
    data?: string;
    dataLabel?: string;
    acesso?: string;
    endereco?: string;
    imagem?: string;
    /** Degradê usado como imagem ilustrativa do produto (no lugar de uma foto). */
    gradient?: string;
    conteudo?: string[];
}

export interface Combo {
    id: string;
    nome: string;
    dataEvento: string;
    itens: ComboItem[];
}

/** Opção de uma pergunta de escolha. `estoque` ausente = não controla estoque; 0 = esgotada. */
export interface OpcaoResposta {
    valor: string;
    estoque?: number;
    /** Opção disputada: outra pessoa leva a última unidade enquanto você salva. */
    disputada?: boolean;
}

/** O vocabulário muda com o tipo de evento, como na compra: atleta em sports, participante nos demais. */
export type TipoEvento = "sports" | "futebol" | "entretenimento";

/** Título da seção de respostas. */
export const tituloRespostas = (tipo?: TipoEvento) => (tipo === "sports" ? "Respostas do formulário do atleta" : "Respostas do formulário");

/** Título do formulário em si (edição, transferência). */
export const tituloFormulario = (tipo?: TipoEvento) => (tipo === "sports" ? "formulário do atleta" : "formulário");

export type TipoPergunta = "texto" | "texto-longo" | "numero" | "telefone" | "data" | "selecao" | "multipla" | "sim-nao" | "anexo";

export interface Resposta {
    pergunta: string;
    /** Valor atual. Em "multipla", os escolhidos vêm separados por ", ". Em "sim-nao", "Sim" ou "Não". */
    resposta: string;
    /** Default "texto" (campo livre de uma linha). */
    tipo?: TipoPergunta;
    /** Só em "selecao" e "multipla". */
    opcoes?: OpcaoResposta[];
    /** Texto de apoio abaixo do campo. */
    ajuda?: string;
    /** Default true: toda pergunta é obrigatória, como na inscrição. */
    obrigatoria?: boolean;
    /** Só em "texto-longo". */
    limiteCaracteres?: number;
    /** Só em "anexo". Ex.: "PDF, JPG ou PNG de até 5 MB". */
    formatosAceitos?: string;
}

export interface EventoSS {
    title: string;
    /** Default "entretenimento". */
    tipo?: TipoEvento;
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

/* Formulário da inscrição da São Silvestre: longo e com todos os tipos de pergunta.
   Cobre os quatro cenários de estoque: sobrando, poucas unidades, esgotada e
   esgotada sendo a escolha atual do corredor (a camiseta P). */
export const QUESTIONARIO_SAO_SILVESTRE: Resposta[] = [
    {
        pergunta: "Tamanho da camiseta",
        resposta: "P",
        tipo: "selecao",
        ajuda: "A camiseta vem no kit e não pode ser trocada na retirada.",
        opcoes: [
            { valor: "PP", estoque: 12 },
            { valor: "P", estoque: 0 },
            { valor: "M", estoque: 48 },
            { valor: "G", estoque: 2 },
            { valor: "GG", estoque: 7 },
            { valor: "XGG", estoque: 0 },
        ],
    },
    {
        pergunta: "Local de retirada do kit",
        resposta: "Pavilhão do Anhembi",
        tipo: "selecao",
        opcoes: [
            { valor: "Pavilhão do Anhembi", estoque: 220 },
            { valor: "Shopping Ibirapuera", estoque: 0 },
            // Disputada: some no meio do salvamento, para testar o conflito de estoque.
            { valor: "Loja Paulista", estoque: 1, disputada: true },
        ],
    },
    {
        pergunta: "Transporte para a largada",
        resposta: "Por conta própria",
        tipo: "selecao",
        opcoes: [{ valor: "Por conta própria" }, { valor: "Ônibus oficial", estoque: 24 }, { valor: "Carona solidária", estoque: 0 }],
    },
    {
        pergunta: "Serviços extras",
        resposta: "Guarda-volumes",
        tipo: "multipla",
        ajuda: "Escolha quantos quiser. Alguns têm vagas limitadas.",
        opcoes: [
            { valor: "Guarda-volumes", estoque: 5 },
            { valor: "Massagem pós-prova", estoque: 0 },
            { valor: "Pacote de fotos" },
            { valor: "Estacionamento", estoque: 1, disputada: true },
        ],
    },
    { pergunta: 'Equipe / assessoria (caso não possua, informe "Avulso")', resposta: "Avulso" },
    { pergunta: "Contato de emergência (nome completo)", resposta: "Maria Souza" },
    { pergunta: "Telefone do contato de emergência", resposta: "(11) 99999-0000", tipo: "telefone" },
    {
        pergunta: "Tipo sanguíneo",
        resposta: "O+",
        tipo: "selecao",
        opcoes: [{ valor: "A+" }, { valor: "A-" }, { valor: "B+" }, { valor: "B-" }, { valor: "AB+" }, { valor: "AB-" }, { valor: "O+" }, { valor: "O-" }],
    },
    { pergunta: "Data de nascimento", resposta: "1991-03-14", tipo: "data" },
    { pergunta: "Provas de rua concluídas nos últimos 12 meses", resposta: "4", tipo: "numero", ajuda: "Usamos para montar os pelotões de largada." },
    {
        pergunta: "Histórico médico e observações",
        resposta: "Nenhuma observação.",
        tipo: "texto-longo",
        limiteCaracteres: 600,
        obrigatoria: false,
    },
    { pergunta: "Autorizo o uso da minha imagem na cobertura da prova", resposta: "Sim", tipo: "sim-nao" },
    {
        pergunta: "Atestado médico",
        resposta: "atestado-medico.pdf",
        tipo: "anexo",
        formatosAceitos: "PDF, JPG ou PNG de até 5 MB",
    },
];

export const SAO_SILVESTRE: EventoSS = {
    title: "São Silvestre 2026",
    tipo: "sports",
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
            nome: "Kit Premium",
            dataEvento: "30 de Dez 2026",
            itens: [
                {
                    nome: "Kit Premium",
                    data: "Qui, 10 dez • 10:00",
                    dataLabel: "Data da retirada",
                    endereco: "Pavilhão do Anhembi • Av. Olavo Fontoura, 1209 - São Paulo/SP",
                    gradient: "linear-gradient(135deg,#16A34A 0%,#0EA5E9 100%)",
                    conteudo: ["Camisa verde", "Número", "Cronômetro", "Sacola"],
                },
            ],
        },
    ],
    questionario: QUESTIONARIO_SAO_SILVESTRE,
};
