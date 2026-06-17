export interface Amigo {
    nome: string;
    foto: string;
}

export interface Evento {
    id: string;
    titulo: string;
    atividade: string;
    emoji: string;
    data: string;
    local: string;
    distancia: string;
    preco: string;
    precoMembro?: string;
    imagem: string;
    recomendado?: boolean;
    nivel: string;
    descricao: string;
    inscritos: string;
    motivos: string[];
    amigos: Amigo[];
}

export const CIDADE_USUARIO = "São Paulo, SP";

const AMIGOS: Amigo[] = [
    { nome: "Marina", foto: "https://i.pravatar.cc/100?img=5" },
    { nome: "Carlos", foto: "https://i.pravatar.cc/100?img=12" },
    { nome: "Ana", foto: "https://i.pravatar.cc/100?img=9" },
];

export const EVENTOS: Evento[] = [
    {
        id: "1",
        titulo: "Corrida da Primavera 5k / 10k",
        atividade: "Corrida",
        emoji: "🏃",
        data: "21 Set · 7h",
        local: "Parque Ibirapuera",
        distancia: "3,2 km de você",
        preco: "R$ 80",
        precoMembro: "R$ 64",
        imagem: "https://picsum.photos/seed/evento-corrida/600/360",
        recomendado: true,
        nivel: "Todos os níveis",
        descricao:
            "Uma corrida pra celebrar a chegada da primavera no Ibirapuera. Percursos de 5k e 10k, kit do atleta, hidratação e cronometragem oficial.",
        inscritos: "1.240 inscritos",
        motivos: [
            "Corrida é a sua atividade favorita",
            "A 3,2 km de você, no seu parque de treino",
            "5k combina com o seu ritmo atual",
        ],
        amigos: AMIGOS,
    },
    {
        id: "2",
        titulo: "Treinão coletivo na Paulista",
        atividade: "Corrida",
        emoji: "🏃",
        data: "Sáb · 7h",
        local: "Av. Paulista",
        distancia: "1,5 km de você",
        preco: "Gratuito",
        imagem: "https://picsum.photos/seed/evento-paulista/600/360",
        nivel: "Iniciante",
        descricao: "Treino coletivo gratuito de corrida leve pela Paulista, com pace de grupo e alongamento guiado.",
        inscritos: "320 confirmados",
        motivos: ["Corrida é a sua atividade favorita", "Pertinho de você, a 1,5 km"],
        amigos: AMIGOS.slice(0, 2),
    },
    {
        id: "3",
        titulo: "Desafio CrossFit SP",
        atividade: "CrossFit",
        emoji: "🏋️",
        data: "28 Set · 9h",
        local: "Box Centro",
        distancia: "4 km de você",
        preco: "R$ 60",
        imagem: "https://picsum.photos/seed/evento-crossfit/600/360",
        nivel: "Intermediário",
        descricao: "Competição amadora de CrossFit em duplas, com WODs pra todos os boxes da cidade.",
        inscritos: "180 inscritos",
        motivos: ["Combina com seus treinos de força"],
        amigos: AMIGOS.slice(0, 1),
    },
    {
        id: "4",
        titulo: "Pedal Noturno SP",
        atividade: "Ciclismo",
        emoji: "🚴",
        data: "Qui · 20h",
        local: "Vão do MASP",
        distancia: "2 km de você",
        preco: "Gratuito",
        imagem: "https://picsum.photos/seed/evento-pedal/600/360",
        nivel: "Todos os níveis",
        descricao: "Pedal noturno tranquilo pela cidade, com batedores e rota segura. Traga sua bike e capacete.",
        inscritos: "540 confirmados",
        motivos: ["Perto de você, a 2 km"],
        amigos: AMIGOS.slice(0, 2),
    },
    {
        id: "5",
        titulo: "Aulão de Yoga no Parque",
        atividade: "Yoga",
        emoji: "🧘",
        data: "Dom · 8h",
        local: "Parque Villa-Lobos",
        distancia: "6 km de você",
        preco: "Gratuito",
        imagem: "https://picsum.photos/seed/evento-yoga/600/360",
        nivel: "Todos os níveis",
        descricao: "Prática coletiva de yoga ao ar livre, ideal pra relaxar e recuperar o corpo no fim de semana.",
        inscritos: "210 confirmados",
        motivos: ["Ótimo pra recuperação dos treinos"],
        amigos: [],
    },
    {
        id: "6",
        titulo: "Maratona de São Paulo",
        atividade: "Corrida",
        emoji: "🏃",
        data: "12 Abr · 6h",
        local: "Centro · SP",
        distancia: "5 km de você",
        preco: "R$ 150",
        precoMembro: "R$ 120",
        imagem: "https://picsum.photos/seed/evento-maratona/600/360",
        nivel: "Avançado",
        descricao: "A maior maratona da cidade. Percursos de 5k, 21k e 42k pelas ruas de São Paulo.",
        inscritos: "8.400 inscritos",
        motivos: ["Corrida é a sua atividade favorita", "Uma meta pra evoluir a distância"],
        amigos: AMIGOS.slice(0, 1),
    },
];

export const getEvento = (id?: string) => EVENTOS.find((e) => e.id === id);
