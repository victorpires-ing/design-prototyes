export interface Dica {
    emoji: string;
    titulo: string;
    texto: string;
    acao?: string;
}

export const TREINO: Dica[] = [
    { emoji: "🏃", titulo: "Experimente treino intervalado", texto: "Alterne ritmo forte e leve para evoluir no seu tempo de corrida.", acao: "Ver treino" },
    { emoji: "🧘", titulo: "Inclua um dia de mobilidade", texto: "Ajuda na recuperação da musculação e evita lesões.", acao: "Adicionar à rotina" },
    { emoji: "📅", titulo: "Que tal treinar aos sábados?", texto: "Quem treina 4x+ por semana costuma progredir mais rápido." },
];

export const SAUDE: Dica[] = [
    { emoji: "💧", titulo: "Capriche na hidratação", texto: "Beba água antes e depois dos seus treinos da manhã." },
    { emoji: "😴", titulo: "Durma de 7 a 8 horas", texto: "Seu pico de treino é às 6h — dormir cedo melhora o desempenho." },
    { emoji: "🥗", titulo: "Proteína no pós-treino", texto: "Acelera a recuperação muscular depois da academia." },
];

export const CONTEUDOS: Dica[] = [
    { emoji: "📖", titulo: "Guia: seus primeiros 10k", texto: "Para quem corre e quer evoluir a distância com segurança.", acao: "Ler" },
    { emoji: "🎧", titulo: "Playlist pra correr", texto: "Batidas no ritmo do seu treino de corrida.", acao: "Ouvir" },
];
