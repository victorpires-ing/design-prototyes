// Mock data — TS Academy: plataforma de cursos/aulas de esporte e treino

export type Nivel = "Iniciante" | "Intermediário" | "Avançado";

export interface Categoria {
    id: string;
    label: string;
    emoji: string;
}

/**
 * Estado do conteúdo (relevante para Presencial e Sports Week):
 *  - "anuncio": ainda é um evento presencial com inscrição aberta (sem vídeos).
 *  - "curso": o presencial já aconteceu e a gravação virou um curso na plataforma.
 * Cursos das demais categorias são sempre "curso".
 */
export type Estado = "anuncio" | "curso";

export interface Evento {
    data: string; // ex: "12 jul, 08h"
    local: string; // ex: "Parque Ibirapuera"
    cidade: string; // ex: "São Paulo, SP"
    vagas: number;
    inscritos: number;
    preco: string; // "Gratuito" | "R$ 90"
    programacao: { hora: string; titulo: string }[];
}

export interface Curso {
    id: string;
    titulo: string;
    instrutor: string;
    categoria: string; // Categoria.id
    nivel: Nivel;
    duracaoMin: number; // total em minutos
    aulas: number;
    nota: number; // 0-5
    alunos: number;
    poster: string; // imagem vertical (2:3)
    backdrop: string; // imagem horizontal para o hero
    destaque?: boolean;
    novo?: boolean;
    estado?: Estado; // default "curso"
    evento?: Evento; // presente quando estado === "anuncio" (ou para mostrar a origem)
}

export const CATEGORIAS: Categoria[] = [
    { id: "todos", label: "Todos", emoji: "✨" },
    { id: "corrida", label: "Corrida", emoji: "🏃" },
    { id: "forca", label: "Força", emoji: "🏋️" },
    { id: "mobilidade", label: "Mobilidade", emoji: "🧘" },
    { id: "nutricao", label: "Nutrição", emoji: "🥗" },
    { id: "mente", label: "Mente", emoji: "🧠" },
    { id: "presencial", label: "Presencial", emoji: "📍" },
    { id: "sports-week", label: "Sports Week", emoji: "🔥" },
];

export const NIVEIS: Nivel[] = ["Iniciante", "Intermediário", "Avançado"];

// Helper: gera pôster (vertical) e backdrop (horizontal) a partir de palavras-chave
const img = (kw: string, lock: number) => ({
    poster: `https://loremflickr.com/400/600/${kw}?lock=${lock}`,
    backdrop: `https://loremflickr.com/1280/720/${kw}?lock=${lock}`,
});

type CursoSeed = Omit<Curso, "poster" | "backdrop"> & { kw: string };

const SEED: CursoSeed[] = [
    // ===== Corrida =====
    { id: "c1", titulo: "Do Zero aos 5K", instrutor: "Marina Alves", categoria: "corrida", nivel: "Iniciante", duracaoMin: 220, aulas: 12, nota: 4.9, alunos: 8420, kw: "running,track", destaque: true },
    { id: "c2", titulo: "Projeto Maratona: 16 Semanas", instrutor: "Rafael Nunes", categoria: "corrida", nivel: "Avançado", duracaoMin: 540, aulas: 28, nota: 4.9, alunos: 3120, kw: "marathon,runner" },
    { id: "c3", titulo: "Trilhas Selvagens: Trail Running", instrutor: "Bia Castro", categoria: "corrida", nivel: "Intermediário", duracaoMin: 300, aulas: 16, nota: 4.8, alunos: 2410, kw: "trail,forest", novo: true },
    { id: "c4", titulo: "Velocidade Pura: Treino de Tiros", instrutor: "Rafael Nunes", categoria: "corrida", nivel: "Avançado", duracaoMin: 180, aulas: 10, nota: 4.7, alunos: 1980, kw: "sprint,stadium" },
    { id: "c5", titulo: "Ritmo & Respiração", instrutor: "Marina Alves", categoria: "corrida", nivel: "Iniciante", duracaoMin: 120, aulas: 8, nota: 4.6, alunos: 5230, kw: "running,sunrise" },
    { id: "c6", titulo: "Asfalto à Noite: Corrida Urbana", instrutor: "Lucas Pereira", categoria: "corrida", nivel: "Intermediário", duracaoMin: 160, aulas: 9, nota: 4.7, alunos: 1740, kw: "running,city,night" },

    // ===== Força =====
    { id: "c7", titulo: "Hipertrofia em Casa", instrutor: "Diego Martins", categoria: "forca", nivel: "Intermediário", duracaoMin: 340, aulas: 18, nota: 4.8, alunos: 5210, kw: "gym,dumbbell", destaque: true },
    { id: "c8", titulo: "Levantamento Olímpico", instrutor: "Diego Martins", categoria: "forca", nivel: "Avançado", duracaoMin: 410, aulas: 22, nota: 4.9, alunos: 1890, kw: "weightlifting,barbell" },
    { id: "c9", titulo: "Domine seu Peso: Calistenia", instrutor: "Lucas Pereira", categoria: "forca", nivel: "Iniciante", duracaoMin: 260, aulas: 15, nota: 4.8, alunos: 6310, kw: "calisthenics,bars", novo: true },
    { id: "c10", titulo: "Powerlifting: os 3 Grandes", instrutor: "Diego Martins", categoria: "forca", nivel: "Avançado", duracaoMin: 380, aulas: 20, nota: 4.9, alunos: 2240, kw: "powerlifting,squat" },
    { id: "c11", titulo: "Kettlebell: Força Explosiva", instrutor: "Bia Castro", categoria: "forca", nivel: "Intermediário", duracaoMin: 200, aulas: 12, nota: 4.7, alunos: 3450, kw: "kettlebell,fitness" },
    { id: "c12", titulo: "Core de Aço", instrutor: "Diego Martins", categoria: "forca", nivel: "Iniciante", duracaoMin: 110, aulas: 9, nota: 4.6, alunos: 7120, kw: "abs,workout" },

    // ===== Mobilidade =====
    { id: "c13", titulo: "Mobilidade Diária para Atletas", instrutor: "Camila Rocha", categoria: "mobilidade", nivel: "Iniciante", duracaoMin: 150, aulas: 10, nota: 4.7, alunos: 3110, kw: "yoga,pose", novo: true },
    { id: "c14", titulo: "Alongamento & Recuperação", instrutor: "Camila Rocha", categoria: "mobilidade", nivel: "Intermediário", duracaoMin: 95, aulas: 7, nota: 4.7, alunos: 5530, kw: "stretching,mat" },
    { id: "c15", titulo: "Yoga para Corredores", instrutor: "Helena Souza", categoria: "mobilidade", nivel: "Iniciante", duracaoMin: 140, aulas: 11, nota: 4.8, alunos: 4280, kw: "yoga,sunset" },
    { id: "c16", titulo: "Flexibilidade Total em 30 Dias", instrutor: "Camila Rocha", categoria: "mobilidade", nivel: "Intermediário", duracaoMin: 220, aulas: 30, nota: 4.8, alunos: 2960, kw: "flexibility,gymnastics" },
    { id: "c17", titulo: "Liberação Miofascial com Rolo", instrutor: "Helena Souza", categoria: "mobilidade", nivel: "Iniciante", duracaoMin: 22, aulas: 1, nota: 4.6, alunos: 3890, kw: "foam,recovery" },

    // ===== Nutrição =====
    { id: "c18", titulo: "Nutrição Esportiva Descomplicada", instrutor: "Dr. Paulo Lima", categoria: "nutricao", nivel: "Iniciante", duracaoMin: 180, aulas: 14, nota: 4.9, alunos: 6740, kw: "healthy,bowl" },
    { id: "c19", titulo: "Meal Prep: Marmitas da Semana", instrutor: "Bia Castro", categoria: "nutricao", nivel: "Iniciante", duracaoMin: 130, aulas: 10, nota: 4.8, alunos: 5120, kw: "mealprep,containers", novo: true },
    { id: "c20", titulo: "Comer para Ganhar Massa", instrutor: "Dr. Paulo Lima", categoria: "nutricao", nivel: "Intermediário", duracaoMin: 160, aulas: 12, nota: 4.7, alunos: 4010, kw: "steak,protein" },
    { id: "c21", titulo: "Hidratação & Suplementação", instrutor: "Dr. Paulo Lima", categoria: "nutricao", nivel: "Intermediário", duracaoMin: 16, aulas: 1, nota: 4.6, alunos: 2870, kw: "smoothie,protein" },
    { id: "c22", titulo: "Jejum Intermitente com Ciência", instrutor: "Helena Souza", categoria: "nutricao", nivel: "Avançado", duracaoMin: 140, aulas: 9, nota: 4.7, alunos: 3320, kw: "salad,vegetables" },

    // ===== Mente =====
    { id: "c23", titulo: "Foco e Mente de Atleta", instrutor: "Helena Souza", categoria: "mente", nivel: "Intermediário", duracaoMin: 120, aulas: 8, nota: 4.6, alunos: 4120, kw: "meditation,zen", novo: true },
    { id: "c24", titulo: "Meditação para a Performance", instrutor: "Helena Souza", categoria: "mente", nivel: "Iniciante", duracaoMin: 100, aulas: 8, nota: 4.8, alunos: 5640, kw: "mindfulness,nature" },
    { id: "c25", titulo: "A Ciência do Sono e Recuperação", instrutor: "Dr. Paulo Lima", categoria: "mente", nivel: "Iniciante", duracaoMin: 110, aulas: 9, nota: 4.7, alunos: 3980, kw: "sleep,relax" },
    { id: "c26", titulo: "Mentalidade de Campeão", instrutor: "Rafael Nunes", categoria: "mente", nivel: "Avançado", duracaoMin: 150, aulas: 11, nota: 4.9, alunos: 2510, kw: "summit,mountain" },

    // ===== Presencial — anúncios com inscrição aberta =====
    {
        id: "p1", titulo: "Treinão de Long Run no Parque", instrutor: "Marina Alves", categoria: "presencial", nivel: "Iniciante",
        duracaoMin: 120, aulas: 0, nota: 0, alunos: 0, kw: "running,park,group", estado: "anuncio",
        evento: { data: "12 jul · 07h", local: "Parque Ibirapuera", cidade: "São Paulo, SP", vagas: 120, inscritos: 86, preco: "Gratuito",
            programacao: [{ hora: "07h00", titulo: "Aquecimento coletivo" }, { hora: "07h30", titulo: "Long run guiado (8 km)" }, { hora: "08h45", titulo: "Alongamento e bate-papo" }] },
    },
    {
        id: "p2", titulo: "Workshop de Levantamento Olímpico", instrutor: "Diego Martins", categoria: "presencial", nivel: "Intermediário",
        duracaoMin: 240, aulas: 0, nota: 0, alunos: 0, kw: "weightlifting,gym,coach", estado: "anuncio",
        evento: { data: "26 jul · 09h", local: "Box CrossFit Pinheiros", cidade: "São Paulo, SP", vagas: 30, inscritos: 28, preco: "R$ 149",
            programacao: [{ hora: "09h00", titulo: "Técnica de snatch" }, { hora: "10h30", titulo: "Clean & jerk" }, { hora: "12h00", titulo: "Prática livre assistida" }] },
    },

    // ===== Presencial — já virou curso (gravação disponível) =====
    { id: "p3", titulo: "Presencial: Yoga ao Nascer do Sol", instrutor: "Helena Souza", categoria: "presencial", nivel: "Iniciante", duracaoMin: 95, aulas: 6, nota: 4.8, alunos: 1820, kw: "yoga,sunrise,beach", estado: "curso",
        evento: { data: "Gravado em mai/2026", local: "Praia de Copacabana", cidade: "Rio de Janeiro, RJ", vagas: 0, inscritos: 240, preco: "Gratuito", programacao: [] } },

    // ===== Sports Week — anúncios com inscrição aberta =====
    {
        id: "sw1", titulo: "Sports Week · Masterclass de Corrida", instrutor: "Rafael Nunes", categoria: "sports-week", nivel: "Avançado",
        duracaoMin: 180, aulas: 0, nota: 0, alunos: 0, kw: "marathon,stadium,crowd", estado: "anuncio", destaque: true,
        evento: { data: "05 ago · 19h", local: "Arena TS", cidade: "São Paulo, SP", vagas: 500, inscritos: 412, preco: "R$ 90",
            programacao: [{ hora: "19h00", titulo: "Abertura e aquecimento" }, { hora: "19h30", titulo: "Masterclass de pace e estratégia" }, { hora: "21h00", titulo: "Q&A com atletas de elite" }] },
    },
    {
        id: "sw2", titulo: "Sports Week · Bootcamp de Força", instrutor: "Diego Martins", categoria: "sports-week", nivel: "Intermediário",
        duracaoMin: 150, aulas: 0, nota: 0, alunos: 0, kw: "bootcamp,fitness,outdoor", estado: "anuncio",
        evento: { data: "06 ago · 08h", local: "Arena TS", cidade: "São Paulo, SP", vagas: 200, inscritos: 137, preco: "R$ 70",
            programacao: [{ hora: "08h00", titulo: "Circuito de força" }, { hora: "09h00", titulo: "Desafio em duplas" }, { hora: "10h00", titulo: "Recuperação ativa" }] },
    },

    // ===== Sports Week — edição anterior já virou curso =====
    { id: "sw3", titulo: "Sports Week 2025 · Mobilidade Total", instrutor: "Camila Rocha", categoria: "sports-week", nivel: "Iniciante", duracaoMin: 130, aulas: 9, nota: 4.7, alunos: 3640, kw: "stretching,event,stage", estado: "curso", novo: true,
        evento: { data: "Gravado na Sports Week 2025", local: "Arena TS", cidade: "São Paulo, SP", vagas: 0, inscritos: 480, preco: "R$ 90", programacao: [] } },
];

export const CURSOS: Curso[] = SEED.map(({ kw, ...rest }, i) => ({ ...rest, ...img(kw, 100 + i) }));

const byId = (id: string) => CURSOS.find((c) => c.id === id)!;
const byCat = (cat: string) => CURSOS.filter((c) => c.categoria === cat);

/** É um anúncio de evento presencial com inscrição aberta (ainda não virou curso). */
export const ehAnuncio = (c: Curso) => c.estado === "anuncio";
/** Eventos com inscrição aberta de uma categoria (Presencial / Sports Week). */
export const eventosAbertos = (cat: string) => byCat(cat).filter(ehAnuncio);
/** Gravações já disponíveis como curso de uma categoria. */
export const gravacoes = (cat: string) => byCat(cat).filter((c) => c.estado === "curso");

export interface Fileira {
    titulo: string;
    cursos: Curso[];
}

/** Fileiras temáticas (estilo streaming), bem preenchidas. */
export const FILEIRAS: Fileira[] = [
    { titulo: "🔥 Sports Week · inscrições abertas", cursos: [...eventosAbertos("sports-week"), ...gravacoes("sports-week")] },
    { titulo: "📍 Presencial perto de você", cursos: [...eventosAbertos("presencial"), ...gravacoes("presencial")] },
    { titulo: "Em alta esta semana", cursos: ["c1", "c7", "c9", "c2", "c18", "c10", "c15", "c19"].map(byId) },
    { titulo: "Novidades", cursos: CURSOS.filter((c) => c.novo) },
    { titulo: "Continue assistindo", cursos: ["c5", "c14", "c12", "c24", "c8"].map(byId) },
    { titulo: "Corrida", cursos: byCat("corrida") },
    { titulo: "Treinos de Força", cursos: byCat("forca") },
    { titulo: "Mobilidade & Recuperação", cursos: byCat("mobilidade") },
    { titulo: "Nutrição & Saúde", cursos: byCat("nutricao") },
    { titulo: "Mente & Performance", cursos: byCat("mente") },
    { titulo: "Bombando entre iniciantes", cursos: CURSOS.filter((c) => c.nivel === "Iniciante") },
];

// ===== Aulas, materiais e comentários =====

export interface Aula {
    id: string;
    titulo: string;
    duracaoMin: number;
    assistida: boolean;
}

export interface Material {
    id: string;
    nome: string;
    tipo: "PDF" | "XLSX" | "ZIP" | "MP3";
    tamanho: string;
}

export interface Comentario {
    id: string;
    autor: string;
    iniciais: string;
    tempo: string;
    texto: string;
}

const TITULOS_AULA = [
    "Boas-vindas e visão geral",
    "Fundamentos essenciais",
    "Aquecimento e mobilidade",
    "Técnica na prática",
    "Erros comuns e como evitar",
    "Montando o seu treino",
    "Progressão e intensidade",
    "Treino guiado completo",
    "Respiração e ritmo",
    "Recuperação e descanso",
    "Mentalidade e foco",
    "Ajustes para o seu nível",
    "Plano da semana",
    "Variações avançadas",
    "Medindo a sua evolução",
    "Prevenção de lesões",
    "Alimentação no dia do treino",
    "Rotina de mobilidade diária",
    "Desafio final",
    "Próximos passos",
    "Bônus: dicas dos atletas",
    "Revisão geral",
    "Checklist de execução",
    "Encerramento do curso",
    "Material complementar",
    "Sessão de perguntas",
    "Estudo de caso",
    "Treino expresso",
];

const seedNum = (id: string) => parseInt(id.replace(/\D/g, ""), 10) || 1;

/** Gera a lista de aulas de um curso (duração por aula + status inicial de assistida). */
export function gerarAulas(curso: Curso): Aula[] {
    const n = curso.aulas;
    const base = Math.max(3, Math.round(curso.duracaoMin / n));
    // progresso inicial determinístico e variado por curso (0% a ~80%)
    const fracao = ((seedNum(curso.id) * 37) % 100) / 100;
    const assistidas = Math.min(n, Math.round(n * fracao * 0.8));

    if (n === 1) {
        return [{ id: `${curso.id}-a1`, titulo: `Aula única · ${curso.titulo}`, duracaoMin: curso.duracaoMin, assistida: assistidas > 0 }];
    }

    return Array.from({ length: n }, (_, i) => {
        const ultima = i === n - 1;
        const dur = ultima ? Math.max(4, curso.duracaoMin - base * (n - 1)) : base + ((i + seedNum(curso.id)) % 5) - 2;
        return {
            id: `${curso.id}-a${i + 1}`,
            titulo: `${i + 1}. ${TITULOS_AULA[(i + seedNum(curso.id)) % TITULOS_AULA.length]}`,
            duracaoMin: Math.max(4, dur),
            assistida: i < assistidas,
        };
    });
}

const MATERIAIS_POR_CATEGORIA: Record<string, Material[]> = {
    corrida: [
        { id: "m1", nome: "Planilha de treino de corrida", tipo: "XLSX", tamanho: "82 KB" },
        { id: "m2", nome: "Guia de pace e zonas de FC", tipo: "PDF", tamanho: "1,4 MB" },
        { id: "m3", nome: "Playlist de aquecimento", tipo: "MP3", tamanho: "12 MB" },
    ],
    forca: [
        { id: "m1", nome: "Apostila completa do curso", tipo: "PDF", tamanho: "3,2 MB" },
        { id: "m2", nome: "Planilha de cargas e séries", tipo: "XLSX", tamanho: "96 KB" },
    ],
    mobilidade: [
        { id: "m1", nome: "Sequência de alongamento (PDF)", tipo: "PDF", tamanho: "980 KB" },
        { id: "m2", nome: "Vídeos de apoio", tipo: "ZIP", tamanho: "48 MB" },
    ],
    nutricao: [
        { id: "m1", nome: "Plano alimentar editável", tipo: "XLSX", tamanho: "120 KB" },
        { id: "m2", nome: "Lista de compras semanal", tipo: "PDF", tamanho: "640 KB" },
        { id: "m3", nome: "Receitas do curso", tipo: "PDF", tamanho: "2,1 MB" },
    ],
    mente: [
        { id: "m1", nome: "Áudios de meditação guiada", tipo: "MP3", tamanho: "26 MB" },
        { id: "m2", nome: "Diário de foco (PDF)", tipo: "PDF", tamanho: "540 KB" },
    ],
};

export function gerarMateriais(curso: Curso): Material[] {
    return MATERIAIS_POR_CATEGORIA[curso.categoria] ?? MATERIAIS_POR_CATEGORIA.forca;
}

export const COMENTARIOS_INICIAIS: Comentario[] = [
    { id: "co1", autor: "Aline R.", iniciais: "AR", tempo: "há 2 dias", texto: "Conteúdo direto ao ponto, já senti diferença na primeira semana!" },
    { id: "co2", autor: "Bruno T.", iniciais: "BT", tempo: "há 1 semana", texto: "As aulas são curtas e fáceis de encaixar na rotina. Recomendo demais." },
    { id: "co3", autor: "Carla M.", iniciais: "CM", tempo: "há 3 semanas", texto: "Adorei os materiais para baixar, ajudam muito a acompanhar." },
];

export function descricaoCurso(curso: Curso): string {
    const cat = CATEGORIAS.find((c) => c.id === curso.categoria)?.label.toLowerCase() ?? "treino";
    return `Um curso de ${cat} nível ${curso.nivel.toLowerCase()} com ${curso.instrutor}. ${
        curso.aulas === 1 ? "Em uma aula objetiva" : `Em ${curso.aulas} aulas`
    }, você vai evoluir no seu próprio ritmo, com técnica correta e materiais de apoio para praticar onde quiser.`;
}

export function formatarDuracao(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
}

export function formatarAlunos(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}k`;
    return String(n);
}
