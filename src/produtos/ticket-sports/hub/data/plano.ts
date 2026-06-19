// Quiz "Seu plano ideal" — descobrir esportes, hábitos e alimentação

export interface OpcaoQuiz {
    id: string;
    label: string;
    emoji: string;
}
export interface PerguntaQuiz {
    id: string;
    titulo: string;
    opcoes: OpcaoQuiz[];
}

export const PERGUNTAS: PerguntaQuiz[] = [
    {
        id: "objetivo",
        titulo: "Qual é o seu principal objetivo?",
        opcoes: [
            { id: "emagrecer", label: "Emagrecer", emoji: "🔥" },
            { id: "massa", label: "Ganhar massa", emoji: "💪" },
            { id: "disposicao", label: "Mais disposição", emoji: "⚡" },
            { id: "mental", label: "Saúde mental", emoji: "🧘" },
            { id: "performance", label: "Performance", emoji: "🏅" },
        ],
    },
    {
        id: "ambiente",
        titulo: "Onde você curte treinar?",
        opcoes: [
            { id: "arlivre", label: "Ao ar livre", emoji: "🌳" },
            { id: "academia", label: "Academia", emoji: "🏋️" },
            { id: "casa", label: "Em casa", emoji: "🏠" },
            { id: "qualquer", label: "Tanto faz", emoji: "🤷" },
        ],
    },
    {
        id: "social",
        titulo: "Você prefere treinar...",
        opcoes: [
            { id: "sozinho", label: "Sozinho", emoji: "🎧" },
            { id: "grupo", label: "Em grupo", emoji: "👥" },
            { id: "tantofaz", label: "Tanto faz", emoji: "🙂" },
        ],
    },
    {
        id: "frequencia",
        titulo: "Quantos dias por semana você tem?",
        opcoes: [
            { id: "2", label: "2 dias", emoji: "🗓️" },
            { id: "3", label: "3 dias", emoji: "🗓️" },
            { id: "4", label: "4 dias", emoji: "🗓️" },
            { id: "5", label: "5+ dias", emoji: "🗓️" },
        ],
    },
    {
        id: "alimentacao",
        titulo: "Como é a sua alimentação hoje?",
        opcoes: [
            { id: "livre", label: "Sem restrição", emoji: "🍽️" },
            { id: "veg", label: "Vegetariana", emoji: "🥗" },
            { id: "lowcarb", label: "Low carb", emoji: "🥑" },
            { id: "semtempo", label: "Pouco tempo pra cozinhar", emoji: "⏱️" },
        ],
    },
];

export interface EsporteMatch {
    nome: string;
    emoji: string;
    match: number;
    motivo: string;
}

export const ESPORTES_POR_OBJETIVO: Record<string, EsporteMatch[]> = {
    emagrecer: [
        { nome: "Corrida", emoji: "🏃", match: 96, motivo: "Alta queima calórica e fácil de começar." },
        { nome: "Treino funcional", emoji: "🤸", match: 90, motivo: "Acelera o metabolismo e trabalha o corpo todo." },
        { nome: "Natação", emoji: "🏊", match: 84, motivo: "Gasta muita energia e poupa as articulações." },
    ],
    massa: [
        { nome: "Musculação", emoji: "🏋️", match: 96, motivo: "O caminho mais direto pra hipertrofia." },
        { nome: "CrossFit", emoji: "🤸", match: 89, motivo: "Força e potência com intensidade." },
        { nome: "Calistenia", emoji: "💪", match: 82, motivo: "Constrói força usando o peso do corpo." },
    ],
    disposicao: [
        { nome: "Corrida", emoji: "🏃", match: 93, motivo: "Libera energia e melhora o fôlego." },
        { nome: "Ciclismo", emoji: "🚴", match: 88, motivo: "Cardio leve e prazeroso ao ar livre." },
        { nome: "Yoga", emoji: "🧘", match: 80, motivo: "Equilibra corpo e mente no dia a dia." },
    ],
    mental: [
        { nome: "Yoga", emoji: "🧘", match: 95, motivo: "Reduz estresse e melhora o sono." },
        { nome: "Caminhada", emoji: "🚶", match: 88, motivo: "Clareia a mente e é fácil de manter." },
        { nome: "Natação", emoji: "🏊", match: 82, motivo: "Movimento ritmado que relaxa." },
    ],
    performance: [
        { nome: "CrossFit", emoji: "🤸", match: 94, motivo: "Desafia força, potência e condicionamento." },
        { nome: "Corrida", emoji: "🏃", match: 90, motivo: "Evolua ritmo e resistência com metas." },
        { nome: "Musculação", emoji: "🏋️", match: 85, motivo: "Base de força pra todo esporte." },
    ],
};

export const HABITOS = [
    { emoji: "💧", texto: "Beba cerca de 2L de água por dia" },
    { emoji: "😴", texto: "Durma de 7 a 8 horas por noite" },
    { emoji: "🚶", texto: "Some 8 mil passos ao longo do dia" },
    { emoji: "🧘", texto: "Faça 5 min de alongamento ao acordar" },
    { emoji: "📵", texto: "Evite telas 1h antes de dormir" },
];

export interface Refeicao {
    refeicao: string;
    sugestao: string;
    emoji: string;
}

export const ALIMENTACAO: Record<string, Refeicao[]> = {
    livre: [
        { refeicao: "Café da manhã", sugestao: "Ovos mexidos, pão integral e uma fruta", emoji: "🍳" },
        { refeicao: "Almoço", sugestao: "Arroz, feijão, frango grelhado e salada", emoji: "🍛" },
        { refeicao: "Lanche", sugestao: "Iogurte com granola e banana", emoji: "🥣" },
        { refeicao: "Jantar", sugestao: "Omelete com legumes", emoji: "🍳" },
    ],
    veg: [
        { refeicao: "Café da manhã", sugestao: "Tapioca com pasta de amendoim e fruta", emoji: "🫓" },
        { refeicao: "Almoço", sugestao: "Arroz integral, lentilha, tofu e salada", emoji: "🥗" },
        { refeicao: "Lanche", sugestao: "Mix de castanhas e iogurte", emoji: "🥜" },
        { refeicao: "Jantar", sugestao: "Wrap de grão-de-bico com legumes", emoji: "🌯" },
    ],
    lowcarb: [
        { refeicao: "Café da manhã", sugestao: "Ovos, abacate e café", emoji: "🥑" },
        { refeicao: "Almoço", sugestao: "Frango, brócolis e salada com azeite", emoji: "🥦" },
        { refeicao: "Lanche", sugestao: "Queijo e castanhas", emoji: "🧀" },
        { refeicao: "Jantar", sugestao: "Salmão com legumes assados", emoji: "🐟" },
    ],
    semtempo: [
        { refeicao: "Café da manhã", sugestao: "Iogurte proteico com fruta", emoji: "🥤" },
        { refeicao: "Almoço", sugestao: "Marmita: arroz, feijão, proteína e legumes", emoji: "🍱" },
        { refeicao: "Lanche", sugestao: "Fruta + barrinha de proteína", emoji: "🍎" },
        { refeicao: "Jantar", sugestao: "Sanduíche integral com frango", emoji: "🥪" },
    ],
};
