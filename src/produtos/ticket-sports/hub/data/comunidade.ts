import type { Participante } from "./home";

export interface Publicacao {
    id: string;
    autor: string;
    inicial: string;
    tempo: string;
    texto: string;
    foto?: string;
    curtidas: number;
    comentarios: number;
}

export interface Informativo {
    id: string;
    titulo: string;
    texto: string;
    data: string;
}

export interface Comunidade {
    id: string;
    nome: string;
    empresa: string;
    atividade: string;
    descricao: string;
    banner: string;
    logo: string;
    inscritos: string;
    participantes: Participante[];
    publicacoes: Publicacao[];
    informativos: Informativo[];
    /** Quando preenchido, a comunidade entra no carrossel "Recomendadas pra você". */
    motivoRecomendacao?: string;
}

const PARTS: Participante[] = [
    { nome: "Marina", inicial: "M" },
    { nome: "Carlos", inicial: "C" },
    { nome: "Ana", inicial: "A" },
    { nome: "Rafael", inicial: "R" },
    { nome: "Juliana", inicial: "J" },
];

export const COMUNIDADES: Comunidade[] = [
    {
        id: "run-club",
        nome: "Ticket Sports Run Club",
        empresa: "Ticket Sports",
        atividade: "Corrida",
        descricao: "Comunidade oficial de corrida da Ticket Sports. Treinos coletivos, eventos e desafios para todos os níveis. Bora correr junto! 🏃",
        banner: "https://picsum.photos/seed/comunidade-banner/1000/400",
        logo: "https://picsum.photos/seed/comunidade-logo/200/200",
        inscritos: "12.4k",
        motivoRecomendacao: "Você também corre 🏃",
        participantes: PARTS,
        publicacoes: [
            {
                id: "p1",
                autor: "Marina Souza",
                inicial: "M",
                tempo: "há 1h",
                texto: "Treino coletivo de domingo foi incrível! Mais de 80 pessoas no parque. Quem vem na próxima? 🏃‍♀️",
                foto: "https://picsum.photos/seed/comunidade-post1/600/400",
                curtidas: 248,
                comentarios: 32,
            },
            {
                id: "p2",
                autor: "Carlos Lima",
                inicial: "C",
                tempo: "há 4h",
                texto: "Bati meu recorde nos 10k hoje graças à galera dessa comunidade. Obrigado a todos! 💜",
                curtidas: 156,
                comentarios: 18,
            },
        ],
        informativos: [
            {
                id: "i1",
                titulo: "Inscrições abertas: Corrida da Primavera",
                texto: "Garanta sua vaga na nossa corrida oficial de 5k e 10k no dia 21/09. Membros têm 20% de desconto.",
                data: "12 Jun 2026",
            },
            {
                id: "i2",
                titulo: "Novo ponto de encontro aos sábados",
                texto: "A partir deste mês, os treinos de sábado acontecem no Parque da Cidade, portão norte, às 7h.",
                data: "08 Jun 2026",
            },
        ],
    },
    {
        id: "pedal-sp",
        nome: "Pedal SP",
        empresa: "Bike Co",
        atividade: "Ciclismo",
        descricao: "Pedais e treinos de ciclismo pela cidade. Encontros semanais e muita estrada boa.",
        banner: "https://picsum.photos/seed/comunidade-banner2/1000/400",
        logo: "https://picsum.photos/seed/comunidade-logo2/200/200",
        inscritos: "5.2k",
        participantes: PARTS.slice(0, 4),
        publicacoes: [
            {
                id: "p1",
                autor: "Bruno Alves",
                inicial: "B",
                tempo: "há 2h",
                texto: "Pedal noturno de ontem reuniu 40 ciclistas pela Paulista. Que energia! 🚴",
                foto: "https://picsum.photos/seed/comunidade-post2/600/400",
                curtidas: 132,
                comentarios: 9,
            },
        ],
        informativos: [
            {
                id: "i1",
                titulo: "Revisão gratuita de bikes",
                texto: "Parceria com a Bike Co: traga sua bike no sábado para uma revisão gratuita antes do pedalão.",
                data: "10 Jun 2026",
            },
        ],
    },
    {
        id: "yoga-mind",
        nome: "Yoga & Mente",
        empresa: "Studio Zen",
        atividade: "Yoga",
        descricao: "Práticas de yoga e meditação para corpo e mente. Sessões ao vivo e encontros presenciais.",
        banner: "https://picsum.photos/seed/comunidade-banner3/1000/400",
        logo: "https://picsum.photos/seed/comunidade-logo3/200/200",
        inscritos: "3.8k",
        participantes: PARTS.slice(0, 3),
        publicacoes: [
            {
                id: "p1",
                autor: "Juliana Castro",
                inicial: "J",
                tempo: "há 6h",
                texto: "Aula ao ar livre no nascer do sol foi transformadora. Namastê a todos. 🧘",
                curtidas: 98,
                comentarios: 12,
            },
        ],
        informativos: [
            {
                id: "i1",
                titulo: "Semana da meditação",
                texto: "Sessões guiadas de meditação todas as manhãs desta semana, às 7h, transmitidas ao vivo.",
                data: "09 Jun 2026",
            },
        ],
    },
    {
        id: "forca-total",
        nome: "Força & Hipertrofia",
        empresa: "SmartFit",
        atividade: "Musculação",
        descricao: "Treinos de força, dicas de hipertrofia e desafios de carga. Pra quem leva o ferro a sério. 💪",
        banner: "https://picsum.photos/seed/comunidade-banner4/1000/400",
        logo: "https://picsum.photos/seed/comunidade-logo4/200/200",
        inscritos: "9.1k",
        participantes: PARTS.slice(0, 4),
        motivoRecomendacao: "Combina com seu treino de força 💪",
        publicacoes: [
            {
                id: "p1",
                autor: "Diego Martins",
                inicial: "D",
                tempo: "há 3h",
                texto: "Novo PR no agachamento: 140kg! Consistência é tudo. Quem mais bateu recorde essa semana? 🏋️",
                foto: "https://picsum.photos/seed/comunidade-post4/600/400",
                curtidas: 187,
                comentarios: 24,
            },
        ],
        informativos: [
            {
                id: "i1",
                titulo: "Desafio de 30 dias: agachamento",
                texto: "Entre no desafio e aumente sua carga progressivamente. Premiação para quem completar todos os treinos.",
                data: "11 Jun 2026",
            },
        ],
    },
    {
        id: "crossfit-tribe",
        nome: "CrossFit Tribe SP",
        empresa: "Box Centro",
        atividade: "CrossFit",
        descricao: "WODs diários, comunidade aguerrida e muita superação. Vem pro box! 🔥",
        banner: "https://picsum.photos/seed/comunidade-banner5/1000/400",
        logo: "https://picsum.photos/seed/comunidade-logo5/200/200",
        inscritos: "6.7k",
        participantes: PARTS.slice(0, 5),
        motivoRecomendacao: "Em alta perto de você 🔥",
        publicacoes: [
            {
                id: "p1",
                autor: "Letícia Ramos",
                inicial: "L",
                tempo: "há 5h",
                texto: "WOD de hoje foi brutal mas valeu cada segundo. Bora pro próximo! 💥",
                curtidas: 121,
                comentarios: 15,
            },
        ],
        informativos: [
            {
                id: "i1",
                titulo: "Aula experimental gratuita",
                texto: "Traga um amigo no sábado e ganhe uma aula experimental gratuita para vocês dois.",
                data: "10 Jun 2026",
            },
        ],
    },
];

export interface FeedItem extends Publicacao {
    comunidadeId: string;
    comunidadeNome: string;
    comunidadeLogo: string;
}

export const FEED: FeedItem[] = COMUNIDADES.flatMap((c) =>
    c.publicacoes.map((p) => ({ ...p, comunidadeId: c.id, comunidadeNome: c.nome, comunidadeLogo: c.logo })),
);

export const getComunidade = (id?: string) => COMUNIDADES.find((c) => c.id === id);
