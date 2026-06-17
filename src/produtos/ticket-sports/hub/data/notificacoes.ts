export interface Notificacao {
    id: string;
    emoji: string;
    titulo: string;
    texto: string;
    tempo: string;
    lida: boolean;
}

export const NOTIFICACOES: Notificacao[] = [
    { id: "1", emoji: "⏰", titulo: "Hora do treino!", texto: "Seu compromisso de Corrida começa às 06:00.", tempo: "agora", lida: false },
    { id: "2", emoji: "❤️", titulo: "Marina curtiu sua publicação", texto: "“Fechei a semana com 4 treinos!”", tempo: "há 20 min", lida: false },
    { id: "3", emoji: "👥", titulo: "Novo membro no grupo", texto: "Bruno entrou no Corredores da Lagoa.", tempo: "há 1h", lida: false },
    { id: "4", emoji: "💬", titulo: "Carlos comentou na sua história", texto: "“Parabéns, inspirador demais!”", tempo: "há 3h", lida: true },
    { id: "5", emoji: "📣", titulo: "Ticket Sports Run Club", texto: "Novo informativo: Inscrições da Corrida da Primavera.", tempo: "há 5h", lida: true },
    { id: "6", emoji: "🔥", titulo: "Sequência de 7 dias!", texto: "Você treinou 7 dias seguidos. Continue assim!", tempo: "há 1d", lida: true },
];

export interface ConfigNotificacao {
    id: string;
    label: string;
    descricao: string;
}

export const CONFIG_NOTIFICACOES: ConfigNotificacao[] = [
    { id: "treinos", label: "Lembretes de treino", descricao: "Avisos de check-in nos horários planejados." },
    { id: "interacoes", label: "Curtidas e comentários", descricao: "Quando interagem com suas publicações." },
    { id: "seguidores", label: "Novos membros e seguidores", descricao: "Quando alguém entra nos seus grupos." },
    { id: "grupos", label: "Atividade dos grupos", descricao: "Recados e novidades dos seus grupos." },
    { id: "comunidades", label: "Comunidades", descricao: "Publicações e informativos das comunidades." },
    { id: "conquistas", label: "Conquistas e metas", descricao: "Sequências, recordes e objetivos atingidos." },
    { id: "novidades", label: "Novidades do Hub", descricao: "Dicas, eventos e atualizações do app." },
];
