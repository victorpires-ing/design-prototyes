export interface PostUsuario {
    id: string;
    tempo: string;
    texto: string;
    foto?: string;
    curtidas: number;
    comentarios: number;
}

export interface Usuario {
    id: string;
    foto: string;
    nome: string;
    inicial: string;
    atividade: string;
    cidade: string;
    bio: string;
    seguidores: string;
    posts: PostUsuario[];
}

export const USUARIOS: Usuario[] = [
    {
        id: "marina",
        foto: "https://i.pravatar.cc/100?img=5",
        nome: "Marina Souza",
        inicial: "M",
        atividade: "Corrida",
        cidade: "São Paulo, SP",
        bio: "Correndo atrás dos sonhos (e dos PRs). 🏃‍♀️",
        seguidores: "1.2k",
        posts: [
            { id: "1", tempo: "há 20 min", texto: "Acordei 5h pra correr antes do trabalho. Valeu cada passo! 🌅", foto: "https://picsum.photos/seed/feed-geral1/600/400", curtidas: 87, comentarios: 12 },
            { id: "2", tempo: "há 3 dias", texto: "Primeiros 10 km da vida concluídos. Ainda não acredito! 🥹", curtidas: 142, comentarios: 23 },
        ],
    },
    {
        id: "carlos",
        foto: "https://i.pravatar.cc/100?img=12",
        nome: "Carlos Lima",
        inicial: "C",
        atividade: "Musculação",
        cidade: "Rio de Janeiro, RJ",
        bio: "Foco, força e fé. Treino todo dia.",
        seguidores: "860",
        posts: [
            { id: "1", tempo: "há 1h", texto: "Nova marca no supino hoje. Progresso é progresso! 💪", curtidas: 54, comentarios: 8 },
            { id: "2", tempo: "há 2 dias", texto: "Treino de pernas que ninguém pediu, mas que todo mundo precisa. 🦵", curtidas: 39, comentarios: 5 },
        ],
    },
    {
        id: "ana",
        foto: "https://i.pravatar.cc/100?img=9",
        nome: "Ana Beatriz",
        inicial: "A",
        atividade: "Ciclismo",
        cidade: "Curitiba, PR",
        bio: "Duas rodas, mil aventuras. 🚴",
        seguidores: "2.1k",
        posts: [
            { id: "1", tempo: "há 2h", texto: "Pedalada de 30 km com a galera. Que manhã! 🚴", foto: "https://picsum.photos/seed/feed-geral3/600/400", curtidas: 120, comentarios: 19 },
        ],
    },
    {
        id: "rafael",
        foto: "https://i.pravatar.cc/100?img=13",
        nome: "Rafael Mendes",
        inicial: "R",
        atividade: "Natação",
        cidade: "Florianópolis, SC",
        bio: "A água é minha terapia. 🏊",
        seguidores: "540",
        posts: [
            { id: "1", tempo: "há 4h", texto: "Voltei pra piscina depois de meses. Nunca é tarde pra recomeçar.", curtidas: 33, comentarios: 5 },
        ],
    },
    {
        id: "juliana",
        foto: "https://i.pravatar.cc/100?img=16",
        nome: "Juliana Castro",
        inicial: "J",
        atividade: "Yoga",
        cidade: "Salvador, BA",
        bio: "Equilíbrio entre corpo e mente. 🧘‍♀️",
        seguidores: "3.4k",
        posts: [
            { id: "1", tempo: "há 6h", texto: "Yoga ao pôr do sol = paz total. 🧘‍♀️", foto: "https://picsum.photos/seed/feed-geral5/600/400", curtidas: 98, comentarios: 14 },
        ],
    },
    {
        id: "bruno",
        foto: "https://i.pravatar.cc/100?img=7",
        nome: "Bruno Alves",
        inicial: "B",
        atividade: "CrossFit",
        cidade: "Belo Horizonte, MG",
        bio: "Sem desculpas, só resultados. 🔥",
        seguidores: "720",
        posts: [
            { id: "1", tempo: "há 8h", texto: "Treino puxado de CrossFit, mas terminei! 🔥", curtidas: 41, comentarios: 6 },
        ],
    },
];

export const getUsuario = (id?: string) => USUARIOS.find((u) => u.id === id);
