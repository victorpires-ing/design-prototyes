export type TipoPergunta = "selecao" | "multipla" | "texto" | "anexo";

export interface PerguntaCadastrada {
    id: string;
    titulo: string;
    descricao: string;
    tipo: TipoPergunta;
    /** Opções de resposta para perguntas de seleção/múltipla escolha. */
    opcoes?: string[];
    /** Perguntas desativadas não podem ser adicionadas ao formulário. */
    ativa?: boolean;
}

export const TIPO_LABEL: Record<TipoPergunta, string> = {
    selecao: "Seleção única",
    multipla: "Múltipla escolha",
    texto: "Texto aberto",
    anexo: "Anexar arquivos",
};

/** Conjunto de perguntas já cadastradas que o organizador pode reaproveitar. */
export const PERGUNTAS_CADASTRADAS: PerguntaCadastrada[] = [
    {
        id: "nome-grupo",
        titulo: "Qual o nome do seu grupo esportivo?",
        descricao: "Usado para identificar o grupo na lista de credenciamento.",
        tipo: "selecao",
        opcoes: ["Time A", "Time B", "Time C", "Outro"],
    },
    {
        id: "tamanho-camiseta",
        titulo: "Qual o tamanho da sua camiseta?",
        descricao: "Tamanho usado para a confecção do kit do participante.",
        tipo: "selecao",
        opcoes: ["PP", "P", "M", "G", "GG"],
    },
    {
        id: "restricao-alimentar",
        titulo: "Você possui alguma restrição alimentar?",
        descricao: "Marque todas as opções que se aplicam.",
        tipo: "multipla",
        opcoes: ["Vegetariano", "Vegano", "Sem glúten", "Sem lactose"],
    },
    {
        id: "documento",
        titulo: "Informe o número do seu documento",
        descricao: "CPF ou RG usado para validação na entrada do evento.",
        tipo: "texto",
    },
    {
        id: "contato-emergencia",
        titulo: "Contato de emergência",
        descricao: "Nome e telefone de alguém para contato em caso de emergência.",
        tipo: "texto",
    },
    {
        id: "como-conheceu",
        titulo: "Como você conheceu o evento?",
        descricao: "Ajuda o organizador a entender os canais de divulgação.",
        tipo: "selecao",
        opcoes: ["Redes sociais", "Indicação de amigos", "Anúncio", "Outro"],
    },
    {
        id: "comprovante-vacina",
        titulo: "Envie seu comprovante de vacinação",
        descricao: "Aceitamos PDF, JPG ou PNG de até 10 MB.",
        tipo: "anexo",
    },
    {
        id: "foto-perfil",
        titulo: "Foto para a credencial",
        descricao: "Foto recente do rosto, usada na credencial de acesso.",
        tipo: "anexo",
    },
    {
        id: "data-nascimento",
        titulo: "Qual a sua data de nascimento?",
        descricao: "Usada para validar a classificação etária do evento.",
        tipo: "texto",
    },
    {
        id: "genero",
        titulo: "Com qual gênero você se identifica?",
        descricao: "Resposta opcional, usada apenas para estatísticas.",
        tipo: "selecao",
        opcoes: ["Feminino", "Masculino", "Não-binário", "Prefiro não responder"],
    },
    {
        id: "interesses",
        titulo: "Quais atividades você tem interesse?",
        descricao: "Marque todas as opções que se aplicam.",
        tipo: "multipla",
        opcoes: ["Workshops", "Networking", "Shows", "Esportes"],
    },
    {
        id: "aceite-regulamento",
        titulo: "Você leu e aceita o regulamento?",
        descricao: "Pergunta desativada pelo organizador.",
        tipo: "selecao",
        opcoes: ["Sim", "Não"],
        ativa: false,
    },
    {
        id: "observacoes-antigas",
        titulo: "Observações adicionais (legado)",
        descricao: "Pergunta desativada pelo organizador.",
        tipo: "texto",
        ativa: false,
    },
];
