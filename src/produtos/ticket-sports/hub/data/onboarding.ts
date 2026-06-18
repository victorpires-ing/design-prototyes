export interface Opcao {
    id: string;
    emoji: string;
    label: string;
}

export const TIPOS_PERFIL = [
    {
        id: "fisica",
        emoji: "🧑",
        label: "Pessoa Física",
        descricao: "Pra você acompanhar treinos, participar de grupos e eventos.",
    },
    {
        id: "juridica",
        emoji: "🏢",
        label: "Pessoa Jurídica",
        descricao: "Pra empresas e organizadores criarem comunidades e divulgarem eventos.",
    },
];

export const ATIVIDADES: Opcao[] = [
    { id: "caminhada", emoji: "🚶", label: "Caminhada" },
    { id: "corrida", emoji: "🏃", label: "Corrida" },
    { id: "ciclismo", emoji: "🚴", label: "Ciclismo" },
    { id: "academia", emoji: "💪", label: "Academia" },
    { id: "natacao", emoji: "🏊", label: "Natação" },
    { id: "yoga", emoji: "🧘", label: "Yoga" },
    { id: "futebol", emoji: "⚽", label: "Futebol" },
    { id: "volei", emoji: "🏐", label: "Vôlei" },
    { id: "basquete", emoji: "🏀", label: "Basquete" },
    { id: "tenis", emoji: "🎾", label: "Tênis" },
    { id: "crossfit", emoji: "🏋️", label: "CrossFit" },
    { id: "artes-marciais", emoji: "🥋", label: "Artes Marciais" },
    { id: "pilates", emoji: "🤸", label: "Pilates" },
    { id: "danca", emoji: "💃", label: "Dança" },
    { id: "outro", emoji: "✨", label: "Outro" },
];

export const OBJETIVOS: Opcao[] = [
    { id: "habito", emoji: "🌱", label: "Criar um hábito saudável" },
    { id: "perder-peso", emoji: "⚖️", label: "Perder peso" },
    { id: "energia", emoji: "⚡", label: "Ter mais energia" },
    { id: "primeira-corrida", emoji: "🥇", label: "Participar da primeira corrida" },
    { id: "saude-mental", emoji: "🧠", label: "Melhorar saúde mental" },
    { id: "socializar", emoji: "🤝", label: "Socializar e conhecer pessoas" },
    { id: "massa", emoji: "💪", label: "Ganhar massa muscular" },
    { id: "flexibilidade", emoji: "🤸", label: "Melhorar flexibilidade" },
];

export const OBJETIVOS_EMPRESA: Opcao[] = [
    { id: "divulgar-marca", emoji: "📣", label: "Divulgar minha marca" },
    { id: "atrair-clientes", emoji: "🎯", label: "Atrair novos alunos e clientes" },
    { id: "promover-eventos", emoji: "📅", label: "Promover eventos e treinos" },
    { id: "engajar-comunidade", emoji: "🤝", label: "Criar e engajar uma comunidade" },
    { id: "fidelizar", emoji: "💜", label: "Fidelizar e reter clientes" },
    { id: "aumentar-frequencia", emoji: "📈", label: "Aumentar a frequência nos treinos" },
    { id: "desafios", emoji: "🏆", label: "Organizar desafios e competições" },
    { id: "vender", emoji: "🛍️", label: "Vender planos e produtos" },
];

export const ATIVIDADES_MAX = 3;
export const OBJETIVOS_MAX = 2;
