// Dados da landing page — Corrida de São Silvestre

export const EVENTO = {
    nome: "Corrida Internacional de São Silvestre",
    tagline: "A corrida que transforma. A chegada que você nunca esquece.",
    descricao:
        "A São Silvestre não é só uma prova — é um marco na vida de quem corre. Seja você estreante ou veterano, cada passada nas ruas de São Paulo conta uma história.",
    edicao: "101ª edição",
    data: "29 de dezembro de 2026",
    dataCurta: "29 DEZ",
    inscricoesAte: "20/11/2026",
    hora: "07h00",
    local: "Avenida Paulista, São Paulo — SP",
    distancia: "15 km",
    participantes: "35 mil",
    heroImg: "/lp-ss/hero.jpg",
};

export const SOBRE = {
    lead: "A São Silvestre está chegando para mais uma edição histórica!",
    paragrafos: [
        "Um dos eventos de corrida mais tradicionais e emocionantes do Brasil volta a reunir atletas profissionais, corredores amadores, famílias e apaixonados por esporte em uma grande celebração pelas ruas de São Paulo. Mais do que uma prova, a São Silvestre é um símbolo de superação, energia e fim de ano com propósito.",
        "Você escolhe como quer viver essa experiência: correndo, torcendo, acompanhando ou celebrando cada quilômetro desse percurso tão especial. Aqui, cada passo representa determinação, movimento e vontade de cruzar novos limites.",
        "Grandes atletas dividem o mesmo cenário com milhares de pessoas que correm por desafio, diversão, saúde, tradição ou simplesmente pela emoção de participar.",
        "A cidade ganha vida, a torcida toma as ruas e o clima de conquista transforma a corrida em um momento inesquecível.",
        "Prepare-se para viver uma das provas mais icônicas, vibrantes e especiais do Brasil. A São Silvestre te espera na largada!",
    ],
    imagem: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1000&q=80",
};

export interface Numero {
    valor: string;
    label: string;
}

export const NUMEROS: Numero[] = [
    { valor: "15 km", label: "Percurso oficial" },
    { valor: "35 mil", label: "Corredores" },
    { valor: "101ª", label: "Edição histórica" },
    { valor: "+70", label: "Países" },
];

export interface Lote {
    id: string;
    nome: string;
    preco: string;
    descricao: string;
    beneficios: string[];
    destaque?: boolean;
    esgotado?: boolean;
}

export const LOTES: Lote[] = [
    {
        id: "l1",
        nome: "1º Lote",
        preco: "R$ 180",
        descricao: "Garanta o menor preço",
        beneficios: ["Número de peito", "Chip de cronometragem", "Kit atleta"],
        esgotado: true,
    },
    {
        id: "l2",
        nome: "2º Lote",
        preco: "R$ 240",
        descricao: "Mais procurado",
        beneficios: ["Número de peito", "Chip de cronometragem", "Kit atleta", "Camiseta oficial"],
        destaque: true,
    },
    {
        id: "l3",
        nome: "Lote Premium",
        preco: "R$ 380",
        descricao: "Experiência completa",
        beneficios: ["Tudo do 2º lote", "Acesso à área VIP", "Medalha personalizada", "Foto oficial"],
    },
];

export interface Kit {
    id: string;
    nome: string;
    resumo: string;
    base?: string; // "Tudo do Kit Econômico"
    itens: string[];
    imagem: string;
    destaque?: boolean;
}

export const KITS: Kit[] = [
    {
        id: "economico",
        nome: "Kit Econômico",
        resumo: "O essencial para cruzar a linha de chegada.",
        itens: [
            "Número de peito",
            "Chip de cronometragem (uso obrigatório)",
            "Seguro atleta",
            "Hidratação",
            "Kit alimentação pós-prova",
        ],
        imagem: "/lp-ss/kit-atleta.jpg",
    },
    {
        id: "ame",
        nome: "Kit AME",
        resumo: "Leve para casa a camiseta oficial da prova.",
        base: "Tudo do Kit Econômico",
        itens: ["Camiseta exclusiva", "Sacochila ou ecobag"],
        imagem: "/lp-ss/kit-atleta.jpg",
        destaque: true,
    },
    {
        id: "ame-mais",
        nome: "Kit AME Mais",
        resumo: "A experiência completa, com celebração incluída.",
        base: "Tudo do Kit AME",
        itens: ["Jantar de massas para celebrar sua conquista"],
        imagem: "/lp-ss/kit-atleta.jpg",
    },
];

// ===== Programação: datas & lotes =====
export interface LoteData {
    nome: string;
    data: string;
    esgotado?: boolean;
}

export const LOTES_DATAS: LoteData[] = [
    { nome: "Inscrições no escuro", data: "21/01/2026 até esgotarem as vagas", esgotado: true },
    { nome: "1º lote", data: "02/03/2026" },
    { nome: "2º lote", data: "04/05/2026" },
    { nome: "3º lote", data: "03/08/2026" },
];

export const LOTES_OBS = "Lotes extras podem ser abertos conforme necessidade. Cada lote será encerrado assim que atingir o número estipulado de inscrições.";

export const INCLUSAO = {
    titulo: "Uma corrida para todos!",
    intro: "A Corrida da AME é inclusiva e celebra a diversidade:",
    itens: [
        { emoji: "🧓", titulo: "Idosos", texto: "50% de desconto garantido por lei." },
        { emoji: "🏳️‍🌈", titulo: "Pessoas transgênero", texto: "basta entrar em contato com a coordenação para confirmar sua participação." },
        { emoji: "♿", titulo: "PCDs e pacientes com AME", texto: "essa corrida é feita por vocês e para vocês! Inscrição gratuita." },
    ],
    obs: "Inscrições de PCDs passam por análise do laudo inserido no processo de inscrição.",
};

// ===== Programação: largadas =====
export interface Onda {
    onda: string;
    nome: string;
    hora: string;
    detalhe?: string;
    sub?: { hora: string; texto: string }[];
}

export const LARGADAS_INTRO =
    "A 12ª edição da Corrida da AME acontecerá dia 13/09/26 e terá suas largadas em onda a partir das 06h15, conforme percurso detalhado e divulgado no site oficial do evento.";

export const ONDAS: Onda[] = [
    { onda: "Onda 1", nome: "Meia Maratona", hora: "06h15", detalhe: "Pelotão único" },
    { onda: "Onda 2", nome: "Corrida PCD (5K)", hora: "06h40", detalhe: "Pelotão único" },
    { onda: "Onda 3", nome: "Corrida 5 e 10K", hora: "06h45", detalhe: "Pelotão único" },
    { onda: "Onda 4", nome: "Categoria Livre", hora: "06h50", detalhe: "Pelotão único" },
    {
        onda: "Onda 5",
        nome: "Corrida Kids",
        hora: "a partir das 8h30",
        detalhe: "Definida pela idade dos participantes",
        sub: [
            { hora: "8h30", texto: "5 e 6 anos" },
            { hora: "8h40", texto: "7 e 8 anos" },
            { hora: "8h50", texto: "9 a 10 anos" },
            { hora: "9h00", texto: "11 a 12 anos" },
            { hora: "9h10", texto: "13 e 14 anos" },
        ],
    },
];

export const BABY = {
    nome: "Categoria Baby",
    texto: "A partir das 9h20, de acordo com a ordem de chegada na pistinha da TITI.",
};

export interface Pergunta {
    q: string;
    a: string;
}

export const FAQ: Pergunta[] = [
    {
        q: "Já me inscrevi. Onde vejo minha inscrição?",
        a: "Acesse sua conta na Ingresse e abra 'Minhas inscrições' para visualizar todos os seus registros e comprovantes.",
    },
    {
        q: "A Ingresse é uma plataforma confiável para comprar minha inscrição?",
        a: "Sim. A Ingresse é a plataforma oficial de inscrições do evento, com ambiente seguro e pagamento protegido.",
    },
    {
        q: "Tenho cadastro na TicketSports. Preciso criar uma conta na Ingresse?",
        a: "Sim, é necessário ter uma conta na Ingresse para concluir a inscrição. O cadastro é rápido e leva poucos minutos.",
    },
    {
        q: "Como acesso minha inscrição após a compra?",
        a: "Assim que a compra é confirmada, a inscrição fica disponível na sua conta Ingresse, em 'Minhas inscrições', e você também recebe a confirmação por e-mail.",
    },
    {
        q: "Meu histórico de inscrições anteriores vai aparecer na Ingresse?",
        a: "As inscrições feitas pela Ingresse ficam no seu histórico da plataforma. Registros anteriores feitos em outra plataforma podem não ser migrados automaticamente.",
    },
    {
        q: "Para mais dúvidas, com quem falo? Ingresse ou TicketSports?",
        a: "Para dúvidas sobre inscrição, pagamento e acesso à conta, fale com o suporte da Ingresse. Para informações sobre a prova (percurso, kit e regulamento), fale com a TicketSports.",
    },
];
