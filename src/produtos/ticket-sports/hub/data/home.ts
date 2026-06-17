import type { ComponentType } from "react";
import { TrendUp02, Users01, UsersPlus } from "@untitledui/icons";

export const USUARIO = { nome: "William", inicial: "W", foto: "https://i.pravatar.cc/100?img=68" };

export interface Compromisso {
    id: string;
    quando: string;
    atividade: string;
    emoji: string;
    hora: string;
    local: string;
    hoje?: boolean;
}

export const COMPROMISSOS: Compromisso[] = [
    { id: "1", quando: "Hoje · Seg", atividade: "Corrida", emoji: "🏃", hora: "06:00", local: "Parque da Cidade", hoje: true },
    { id: "2", quando: "Amanhã · Ter", atividade: "Musculação", emoji: "💪", hora: "19:00", local: "Academia Fit" },
    { id: "3", quando: "Qua", atividade: "Yoga", emoji: "🧘", hora: "07:00", local: "Estúdio Zen" },
    { id: "4", quando: "Sex", atividade: "Natação", emoji: "🏊", hora: "18:30", local: "Clube Aquático" },
];

export interface CheckinAoVivo {
    nome: string;
    inicial: string;
    atividade: string;
    emoji: string;
    foto: string;
}

export const CHECKINS_AOVIVO: CheckinAoVivo[] = [
    { nome: "Marina", inicial: "M", atividade: "Corrida", emoji: "🏃‍♀️", foto: "https://i.pravatar.cc/100?img=5" },
    { nome: "Carlos", inicial: "C", atividade: "Musculação", emoji: "💪", foto: "https://i.pravatar.cc/100?img=12" },
    { nome: "Ana", inicial: "A", atividade: "Ciclismo", emoji: "🚴", foto: "https://i.pravatar.cc/100?img=9" },
    { nome: "Rafael", inicial: "R", atividade: "Natação", emoji: "🏊", foto: "https://i.pravatar.cc/100?img=13" },
    { nome: "Juliana", inicial: "J", atividade: "Yoga", emoji: "🧘‍♀️", foto: "https://i.pravatar.cc/100?img=16" },
    { nome: "Bruno", inicial: "B", atividade: "CrossFit", emoji: "🏋️", foto: "https://i.pravatar.cc/100?img=7" },
];

export const CHECKINS_TOTAL = 342;

export interface Stat {
    id: string;
    icon: ComponentType<{ className?: string }>;
    valor: string;
    label: string;
}

export const STATS: Stat[] = [
    { id: "treinando", icon: Users01, valor: "1.248", label: "Pessoas treinando hoje" },
    { id: "grupos", icon: UsersPlus, valor: "+32", label: "Novos grupos criados" },
    { id: "comunidades", icon: TrendUp02, valor: "8", label: "Comunidades em crescimento" },
];

export interface Historia {
    id: string;
    nome: string;
    inicial: string;
    tempo: string;
    atividade: string;
    texto: string;
    curtidas: number;
}

export const HISTORIAS: Historia[] = [
    {
        id: "1",
        nome: "Marina Souza",
        inicial: "M",
        tempo: "2h",
        atividade: "Corrida",
        texto: "Há três meses eu não conseguia correr 1 km. Hoje completei meus primeiros 5k na Corrida da Primavera! 🏅",
        curtidas: 124,
    },
    {
        id: "2",
        nome: "Carlos Lima",
        inicial: "C",
        tempo: "5h",
        atividade: "Musculação",
        texto: "Comecei a treinar com um grupo do bairro e nunca mais faltei. A galera me motiva demais!",
        curtidas: 87,
    },
    {
        id: "3",
        nome: "Ana Beatriz",
        inicial: "A",
        tempo: "1d",
        atividade: "Ciclismo",
        texto: "Pedalei 50 km pela primeira vez no fim de semana. Minhas pernas ainda doem, mas valeu cada metro! 🚴",
        curtidas: 203,
    },
    {
        id: "4",
        nome: "Rafael Mendes",
        inicial: "R",
        tempo: "2d",
        atividade: "Natação",
        texto: "Voltei a nadar depois de 10 anos. Hoje fiz 20 piscinas sem parar. Nunca é tarde pra recomeçar.",
        curtidas: 156,
    },
    {
        id: "5",
        nome: "Juliana Castro",
        inicial: "J",
        tempo: "3d",
        atividade: "Yoga",
        texto: "A yoga mudou minha relação com o estresse. 30 minutos por dia que transformaram minha rotina. 🧘",
        curtidas: 98,
    },
    {
        id: "6",
        nome: "Bruno Alves",
        inicial: "B",
        tempo: "4d",
        atividade: "CrossFit",
        texto: "Fechei meu primeiro Desafio CrossFit SP! Treinei firme aqui no Hub e valeu cada gota de suor. 🏆",
        curtidas: 176,
    },
];

export interface Participante {
    nome: string;
    inicial: string;
}

export interface Recado {
    id: string;
    texto: string;
    tempo: string;
}

export interface PostPessoa {
    id: string;
    autor: string;
    inicial: string;
    tempo: string;
    texto: string;
    foto?: string;
    curtidas: number;
    comentarios: number;
}

export const FEED_GERAL: PostPessoa[] = [
    {
        id: "1",
        autor: "Marina Souza",
        inicial: "M",
        tempo: "há 20 min",
        texto: "Acordei 5h pra correr antes do trabalho. Valeu cada passo! 🌅",
        foto: "https://picsum.photos/seed/feed-geral1/600/400",
        curtidas: 87,
        comentarios: 12,
    },
    { id: "2", autor: "Carlos Lima", inicial: "C", tempo: "há 1h", texto: "Nova marca no supino hoje. Progresso é progresso! 💪", curtidas: 54, comentarios: 8 },
    {
        id: "3",
        autor: "Ana Beatriz",
        inicial: "A",
        tempo: "há 2h",
        texto: "Pedalada de 30 km com a galera do Pedal SP. Que manhã! 🚴",
        foto: "https://picsum.photos/seed/feed-geral3/600/400",
        curtidas: 120,
        comentarios: 19,
    },
    { id: "4", autor: "Rafael Mendes", inicial: "R", tempo: "há 4h", texto: "Voltei pra piscina depois de meses. Bom demais reencontrar a água. 🏊", curtidas: 33, comentarios: 5 },
    {
        id: "5",
        autor: "Juliana Castro",
        inicial: "J",
        tempo: "há 6h",
        texto: "Yoga ao pôr do sol = paz total. 🧘‍♀️",
        foto: "https://picsum.photos/seed/feed-geral5/600/400",
        curtidas: 98,
        comentarios: 14,
    },
    { id: "6", autor: "Bruno Alves", inicial: "B", tempo: "há 8h", texto: "Treino puxado de CrossFit, mas terminei! 🔥", curtidas: 41, comentarios: 6 },
];

export interface Grupo {
    id: string;
    nome: string;
    emoji: string;
    logo: string;
    membros: number;
    atividade: string;
    local: string;
    descricao: string;
    /** Se o usuário atual é o criador do grupo (pode enviar recados). */
    souCriador: boolean;
    criador: Participante;
    participantes: Participante[];
    recados: Recado[];
    /** Quando preenchido, o grupo entra no carrossel "Recomendados pra você". */
    motivoRecomendacao?: string;
}

const PARTICIPANTES: Participante[] = [
    { nome: "Marina Souza", inicial: "M" },
    { nome: "Carlos Lima", inicial: "C" },
    { nome: "Ana Beatriz", inicial: "A" },
    { nome: "Rafael Mendes", inicial: "R" },
    { nome: "Juliana Castro", inicial: "J" },
    { nome: "Bruno Alves", inicial: "B" },
];

export const GRUPOS: Grupo[] = [
    {
        id: "1",
        nome: "Corredores da Lagoa",
        emoji: "🏃",
        logo: "https://picsum.photos/seed/grupo-lagoa/200/200",
        membros: 320,
        atividade: "Corrida",
        local: "Parque da Cidade, São Paulo",
        descricao: "Grupo de corrida para todos os níveis. Treinos leves durante a semana e longão aos sábados. Bora evoluir junto!",
        souCriador: true,
        criador: { nome: "Você", inicial: "W" },
        participantes: PARTICIPANTES,
        recados: [
            { id: "r1", texto: "Treino de amanhã confirmado às 6h no portão principal! 🏃", tempo: "há 3h" },
            { id: "r2", texto: "Levem água e protetor solar, o dia vai estar quente.", tempo: "há 1d" },
        ],
    },
    {
        id: "2",
        nome: "CrossFit Centro",
        emoji: "🏋️",
        logo: "https://picsum.photos/seed/grupo-crossfit/200/200",
        membros: 145,
        atividade: "CrossFit",
        local: "Box Centro, São Paulo",
        descricao: "Treinos funcionais de alta intensidade. Foco em força e condicionamento. Iniciantes são bem-vindos!",
        souCriador: false,
        criador: { nome: "Pedro Gomes", inicial: "P" },
        participantes: PARTICIPANTES.slice(0, 4),
        recados: [{ id: "r1", texto: "Aula extra de mobilidade na quinta às 19h. Não percam!", tempo: "há 5h" }],
        motivoRecomendacao: "Combina com seu treino de força 💪",
    },
    {
        id: "3",
        nome: "Pedal Noturno",
        emoji: "🚴",
        logo: "https://picsum.photos/seed/grupo-pedal/200/200",
        membros: 89,
        atividade: "Ciclismo",
        local: "Av. Paulista, São Paulo",
        descricao: "Pedais noturnos pela cidade às terças e quintas. Percursos tranquilos e muita conversa boa.",
        souCriador: false,
        criador: { nome: "Lucas Dias", inicial: "L" },
        participantes: PARTICIPANTES.slice(0, 3),
        recados: [],
    },
    {
        id: "4",
        nome: "Treino de Força SP",
        emoji: "💪",
        logo: "https://picsum.photos/seed/grupo-forca/200/200",
        membros: 210,
        atividade: "Musculação",
        local: "SmartFit Paulista, São Paulo",
        descricao: "Galera focada em hipertrofia e ganho de força. Trocamos treinos, dicas e parceria de academia.",
        souCriador: false,
        criador: { nome: "Diego Martins", inicial: "D" },
        participantes: PARTICIPANTES.slice(0, 5),
        recados: [{ id: "r1", texto: "Quem topa um treino de pernas pesado no sábado de manhã? 🦵", tempo: "há 2h" }],
        motivoRecomendacao: "Combina com seu treino de força 💪",
    },
    {
        id: "5",
        nome: "Corrida Matinal",
        emoji: "🏃",
        logo: "https://picsum.photos/seed/grupo-matinal/200/200",
        membros: 176,
        atividade: "Corrida",
        local: "Parque Ibirapuera, São Paulo",
        descricao: "Treinos de corrida antes do trabalho, de segunda a sexta às 6h. Comece o dia com energia!",
        souCriador: false,
        criador: { nome: "Marina Souza", inicial: "M" },
        participantes: PARTICIPANTES.slice(0, 4),
        recados: [],
        motivoRecomendacao: "Você também corre 🏃",
    },
];
