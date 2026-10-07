/* Modalidades da campanha.
   São as modalidades reais do calendário da Ticket Sports, com os mesmos slugs
   que a API usa em `quickFilter`, para o protótipo não inventar categoria que o
   produto não tem.

   As cores vêm exclusivamente da paleta da identidade Sports Week (lime, magenta,
   azul elétrico e navy). Cada modalidade "pinta" sua página com um par fundo/tinta
   já conferido em contraste. */

export type ModalidadeSlug =
    | "corrida-de-rua"
    | "trail-run"
    | "ciclismo"
    | "mountain-bike"
    | "triathlon"
    | "natacao"
    | "caminhada"
    | "corrida-de-aventura";

export interface Modalidade {
    slug: ModalidadeSlug;
    nome: string;
    nomeCurto: string;
    emoji: string;
    /** Fundo do bloco da modalidade. */
    cor: string;
    /** Cor do texto sobre `cor`. Par já conferido para contraste AA. */
    tinta: string;
    chamada: string;
    descricao: string;
    /** Distâncias e provas típicas. Viram chips na página da modalidade. */
    provas: string[];
}

export const MODALIDADES: Modalidade[] = [
    {
        slug: "corrida-de-rua",
        nome: "Corrida de rua",
        nomeCurto: "Corrida",
        emoji: "🏃",
        cor: "#B3F300",
        tinta: "#0B2559",
        chamada: "Do primeiro 5k à maratona",
        descricao:
            "As provas mais disputadas do calendário, de 5 km a 42 km. É aqui que está a maior parte dos lotes promocionais da Sports Week.",
        provas: ["5 km", "10 km", "15 km", "21 km", "42 km"],
    },
    {
        slug: "trail-run",
        nome: "Trail run",
        nomeCurto: "Trail",
        emoji: "⛰️",
        cor: "#0B2559",
        tinta: "#B3F300",
        chamada: "Terra, subida e altimetria",
        descricao:
            "Corridas em trilha, montanha e serra. O percurso se mede em quilômetros e em metros de altimetria. Leve tênis com cravo.",
        provas: ["12 km", "21 km", "35 km", "50 km"],
    },
    {
        slug: "ciclismo",
        nome: "Ciclismo",
        nomeCurto: "Ciclismo",
        emoji: "🚴",
        cor: "#0099FF",
        tinta: "#FFFFFF",
        chamada: "Asfalto, pelotão e longa distância",
        descricao:
            "Provas de estrada com pelotão separado por nível. A inscrição inclui número de quadro e apoio mecânico no percurso.",
        provas: ["40 km", "70 km", "100 km", "160 km"],
    },
    {
        slug: "mountain-bike",
        nome: "Mountain bike",
        nomeCurto: "MTB",
        emoji: "🚵",
        cor: "#FF1289",
        tinta: "#FFFFFF",
        chamada: "Terra, single track e gravel",
        descricao:
            "Cross-country, maratona e gravel. Largada por categoria, trechos de single track e apoio mecânico nos pontos de controle.",
        provas: ["25 km", "45 km", "70 km", "Gravel"],
    },
    {
        slug: "triathlon",
        nome: "Triathlon",
        nomeCurto: "Triathlon",
        emoji: "🏊",
        cor: "#B3F300",
        tinta: "#0B2559",
        chamada: "Nadar, pedalar e correr",
        descricao:
            "Sprint, olímpico e meio ironman. A inscrição vem com chip de cronometragem, área de transição demarcada e apoio náutico na natação.",
        provas: ["Sprint", "Olímpico", "Half", "Aquathlon"],
    },
    {
        slug: "natacao",
        nome: "Natação",
        nomeCurto: "Natação",
        emoji: "🌊",
        cor: "#0099FF",
        tinta: "#0B2559",
        chamada: "Mar, represa e travessia",
        descricao:
            "Travessias cronometradas com raia balizada e apoio de caiaque. O briefing de segurança acontece na areia, antes da largada.",
        provas: ["750 m", "1,5 km", "3 km", "5 km"],
    },
    {
        slug: "caminhada",
        nome: "Caminhada",
        nomeCurto: "Caminhada",
        emoji: "🚶",
        cor: "#FF1289",
        tinta: "#FFFFFF",
        chamada: "Para quem está começando agora",
        descricao:
            "Percursos curtos, sem tempo de corte e com clima de passeio. A porta de entrada mais honesta para quem nunca participou de um evento esportivo.",
        provas: ["3 km", "5 km", "Família", "Pet"],
    },
    {
        slug: "corrida-de-aventura",
        nome: "Corrida de aventura",
        nomeCurto: "Aventura",
        emoji: "🧭",
        cor: "#0B2559",
        tinta: "#FFFFFF",
        chamada: "Fora do asfalto, fora do roteiro",
        descricao:
            "Percursos que misturam corrida, navegação e obstáculo natural. Dá para encarar sozinho ou em equipe, e a maioria das provas abre as duas categorias.",
        provas: ["10 km", "21 km", "Dupla", "Equipe"],
    },
];

export const getModalidade = (slug?: string) => MODALIDADES.find((m) => m.slug === slug);
