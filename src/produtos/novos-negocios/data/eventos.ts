/* Catálogo mock do canal de Revenda — compartilhado entre a home e a página de evento. */

/** Uma oferta de revenda: o anúncio de uma pessoa que não vai mais ao evento. */
export interface OfertaRevenda {
    id: string;
    /** Valor pedido pelo ingresso, sem taxas. */
    ingresso: number;
    /** Taxa de serviço + taxa de processamento (decreto do Procon). */
    taxa: number;
    disponiveis: number;
    /** Preço original deste ingresso, quando veio de outro lote do mesmo tipo. */
    precoOriginal?: number;
}

/**
 * Um tipo/modalidade do evento (pista, camarote, meia-entrada…), com as ofertas de revenda.
 * A listagem não separa mais por lote: ofertas de lotes diferentes do mesmo tipo ficam juntas.
 */
export interface LoteRevenda {
    id: string;
    nome: string;
    /** Preço original (mercado primário, sem taxas) — vale para as ofertas sem `precoOriginal` próprio. */
    valorOriginal: number;
    ofertas: OfertaRevenda[];
}

export interface PerguntaEvento {
    pergunta: string;
    resposta: string;
}

export interface EventoRevenda {
    id: string;
    nome: string;
    /** Artigo do nome nas frases geradas: "o Lollapalooza", "a Semana Santa". */
    artigo: "o" | "a";
    /** Complemento de lugar já flexionado: "na Casa Marceneiro, em Milagres (BA)". */
    onde: string;
    /** No Figma a linha de local já inclui a cidade no mesmo texto. */
    local: string;
    data: string;
    /** Capa (degradê) enquanto não há imagem real do evento. */
    gradient: string;
    /** Selo sobre o pôster, na home. */
    status: string;
    /** Chip ao lado do pôster, na página do evento. */
    selo?: string;
    /** "Sobre este evento" — um parágrafo por item. */
    descricao: string[];
    lotes: LoteRevenda[];
    /** Duas perguntas próprias do evento; as genéricas saem de `faqDoEvento`. */
    perguntas: [PerguntaEvento, PerguntaEvento];
}

/** "R$ 483,00" */
export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** "32,50" — a taxa aparece sem o prefixo de moeda na linha de oferta. */
export const valor = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const totalOferta = (o: OfertaRevenda) => o.ingresso + o.taxa;

/** Preço pago no mercado primário por este ingresso, sem taxas. */
export const precoOriginal = (o: OfertaRevenda, l: LoteRevenda) => o.precoOriginal ?? l.valorOriginal;

/** Como o preço na revenda (sem taxas) se posiciona frente ao preço original. */
export type ComparacaoValor = "abaixo" | "igual" | "acima";

export const compararComOriginal = (o: OfertaRevenda, original: number): ComparacaoValor =>
    o.ingresso > original ? "acima" : o.ingresso < original ? "abaixo" : "igual";

export const ofertasDoLote = (l: LoteRevenda) => l.ofertas.reduce((t, o) => t + o.disponiveis, 0);

export const totalOfertas = (e: EventoRevenda) => e.lotes.reduce((t, l) => t + ofertasDoLote(l), 0);

export const plural = (n: number, singular: string, pluralForma: string) => `${n} ${n === 1 ? singular : pluralForma}`;

/**
 * FAQ da página do evento: as duas perguntas próprias do evento intercaladas
 * com as três genéricas, que se escrevem a partir dos dados do próprio evento.
 */
export const faqDoEvento = (e: EventoRevenda): PerguntaEvento[] => [
    e.perguntas[0],
    { pergunta: `Onde acontece ${e.artigo} ${e.nome}?`, resposta: `O evento acontece ${e.onde}.` },
    {
        pergunta: `Quando acontece ${e.artigo} ${e.nome}?`,
        resposta: `${e.artigo === "a" ? "A" : "O"} ${e.nome} acontece no dia ${e.data}.`,
    },
    e.perguntas[1],
    {
        pergunta: "Como funciona a compra por aqui?",
        resposta:
            "A Revenda é o canal oficial da Ingresse para ingressos de segunda mão. O pagamento fica retido até a transferência de titularidade ser concluída, " +
            "que acontece de forma automática e imediata. O ingresso chega validado na sua conta e no seu nome — sem risco de calote e sem precisar combinar nada com o vendedor.",
    },
];

export const getEvento = (id?: string) => EVENTOS.find((e) => e.id === id);

export const EVENTOS: EventoRevenda[] = [
    {
        id: "boma-the-moment",
        nome: "BOMA - The moment",
        artigo: "o",
        onde: "no Jockey Club Brasileiro, no Rio de Janeiro (RJ)",
        local: "Jockey Club Brasileiro - Rio de Janeiro",
        data: "7 de agosto de 2026",
        gradient: "linear-gradient(145deg,#e8384f 0%,#f2a93b 55%,#cbc648 100%)",
        status: "Alta demanda",
        selo: "Evento novo na área",
        descricao: [
            "O BOMA - The moment ocupa as tribunas do Jockey Club Brasileiro no dia 7 de agosto de 2026 com uma edição pensada para durar da tarde à madrugada. São três palcos, cada um com uma leitura diferente da música eletrônica brasileira, montados de frente para a vista da Lagoa.",
            "A curadoria reúne nomes residentes do coletivo e convidados internacionais, alternando sets de house melódico no fim da tarde e techno mais pesado depois da meia-noite. O line-up completo é divulgado por palco nas semanas que antecedem o evento.",
            "Os portões abrem às 15h. A área de alimentação funciona durante todo o evento e há espaço coberto em caso de chuva. A classificação etária é de 18 anos, sem exceção, com apresentação de documento com foto na entrada.",
        ],
        lotes: [
            {
                id: "pista-1",
                nome: "PISTA - Inteira",
                valorOriginal: 240,
                ofertas: [
                    { id: "a", ingresso: 220, taxa: 26.5, disponiveis: 2 },
                    { id: "b", ingresso: 240, taxa: 29, disponiveis: 1 },
                    // Veio do 2º lote: o preço original é outro, mas o tipo é o mesmo.
                    { id: "c", ingresso: 290, taxa: 35, disponiveis: 1, precoOriginal: 280 },
                ],
            },
            {
                id: "front-2",
                nome: "FRONT STAGE - Inteira",
                valorOriginal: 480,
                ofertas: [
                    { id: "a", ingresso: 520, taxa: 62.5, disponiveis: 1, precoOriginal: 560 },
                    { id: "b", ingresso: 620, taxa: 74.5, disponiveis: 3 },
                    { id: "c", ingresso: 720, taxa: 86.5, disponiveis: 1 },
                ],
            },
            {
                id: "pista-meia",
                nome: "PISTA - Meia Solidária",
                valorOriginal: 120,
                ofertas: [{ id: "a", ingresso: 140, taxa: 17, disponiveis: 1 }],
            },
        ],
        perguntas: [
            {
                pergunta: "O que é o BOMA - The moment?",
                resposta:
                    "É a edição anual do BOMA no Rio de Janeiro, com três palcos de música eletrônica montados nas tribunas do Jockey Club Brasileiro. A proposta é atravessar o dia: começa com sets mais solares no fim da tarde e vai endurecendo até a madrugada.",
            },
            {
                pergunta: "Quais são os horários do evento?",
                resposta: "Os portões abrem às 15h e o evento vai até as 4h. O palco principal começa às 16h30 e o headliner está previsto para 1h.",
            },
        ],
    },
    {
        id: "gop-tun",
        nome: "Gop Tun X Heavy Love",
        artigo: "o",
        onde: "no NU Cine Copan, em São Paulo (SP)",
        local: "NU Cine Copan - São Paulo",
        data: "7 de agosto de 2026",
        gradient: "linear-gradient(145deg,#f4e3c8 0%,#e8763a 60%,#1f3b70 100%)",
        status: "Evento novo na área",
        descricao: [
            "Gop Tun e Heavy Love dividem a mesma noite no NU Cine Copan, no dia 7 de agosto de 2026. É o primeiro encontro entre os dois selos em São Paulo e cada um assina um ambiente da casa, no coração do Edifício Copan.",
            "No cinema, a Gop Tun aposta em house, disco edits e brazilian beats. No subsolo, a Heavy Love assume com um set mais seco, de electro e breaks. O trânsito entre os dois espaços é livre durante toda a noite.",
            "A festa começa às 23h e vai até as 7h. A capacidade é reduzida e não há venda na porta — por isso, quando esgota, a revenda é a única forma de conseguir ingresso. Entrada permitida apenas para maiores de 18 anos.",
        ],
        lotes: [
            {
                id: "lista-2",
                nome: "LISTA - Inteira",
                valorOriginal: 250,
                ofertas: [
                    { id: "a", ingresso: 270, taxa: 32.5, disponiveis: 3 },
                    { id: "b", ingresso: 310, taxa: 37.5, disponiveis: 1 },
                ],
            },
            {
                id: "open-bar",
                nome: "OPEN BAR - Inteira",
                valorOriginal: 650,
                ofertas: [{ id: "a", ingresso: 720, taxa: 86.5, disponiveis: 2 }],
            },
        ],
        perguntas: [
            {
                pergunta: "Como funciona a divisão entre os dois selos?",
                resposta:
                    "São dois ambientes no mesmo ingresso: a Gop Tun comanda a sala de cinema, com house e disco, e a Heavy Love ocupa o subsolo, com electro e breaks. Você circula livremente entre os dois durante toda a noite.",
            },
            {
                pergunta: "Quais são os horários do evento?",
                resposta: "As portas abrem às 23h e a festa vai até as 7h. Os dois ambientes funcionam em paralelo a partir da meia-noite.",
            },
        ],
    },
    {
        id: "d-edge",
        nome: "D.Edge Classics",
        artigo: "o",
        onde: "no D.Edge, em São Paulo (SP)",
        local: "D.Edge - São Paulo",
        data: "22 de agosto de 2026",
        gradient: "linear-gradient(145deg,#1d4ed8 0%,#7c3aed 55%,#db2777 100%)",
        status: "Últimos ingressos",
        descricao: [
            "O D.Edge Classics é a noite em que a casa revisita o próprio acervo. No dia 22 de agosto de 2026, os residentes históricos voltam às cabines para tocar os sets que definiram a identidade do clube na Barra Funda.",
            "A programação é dividida em três blocos: abertura com o repertório dos primeiros anos, um bloco central dedicado ao techno que consolidou a casa e um encerramento aberto, sem setlist definido.",
            "O evento tem lotação única e ingresso nominal. A entrada é permitida a partir dos 18 anos, com documento com foto. A casa abre às 23h30.",
        ],
        lotes: [
            {
                id: "unico",
                nome: "PISTA ÚNICA - Inteira",
                valorOriginal: 260,
                ofertas: [{ id: "a", ingresso: 260, taxa: 31.5, disponiveis: 1 }],
            },
        ],
        perguntas: [
            {
                pergunta: "O que é o D.Edge Classics?",
                resposta:
                    "É a noite em que o D.Edge recoloca nas cabines os DJs residentes que construíram a casa, tocando os sets que marcaram cada fase do clube. Não é uma festa de aniversário: é um recorte do acervo, dividido em três blocos cronológicos.",
            },
            {
                pergunta: "Quais são os horários do evento?",
                resposta: "A casa abre às 23h30 e o evento segue até as 6h. O bloco de techno começa por volta das 2h.",
            },
        ],
    },
    {
        id: "mochakk",
        nome: "Mochakk Calling 2026",
        artigo: "o",
        onde: "no Memorial da América Latina, em São Paulo (SP)",
        local: "Memorial da América Latina - São Paulo",
        data: "3 de outubro de 2026",
        gradient: "linear-gradient(145deg,#2563eb 0%,#9333ea 55%,#f59e0b 100%)",
        status: "Últimas horas",
        selo: "Evento novo na área",
        descricao: [
            "O Mochakk Calling 2026 leva o projeto solo do DJ brasileiro para a esplanada do Memorial da América Latina, no dia 3 de outubro de 2026. É a maior apresentação da carreira dele no país, com estrutura de palco desenhada especificamente para o espaço projetado por Niemeyer.",
            "O set é de seis horas, sem intervalos, e percorre o house, o disco e as releituras de clássicos brasileiros que marcaram as apresentações do artista nos últimos anos. Há dois convidados de abertura, anunciados mais perto da data.",
            "Os portões abrem às 16h. O evento é ao ar livre e acontece com qualquer condição de tempo. Classificação etária de 18 anos.",
        ],
        lotes: [
            {
                id: "pista-3",
                nome: "PISTA - Inteira",
                valorOriginal: 220,
                ofertas: [
                    { id: "a", ingresso: 200, taxa: 24, disponiveis: 2 },
                    { id: "b", ingresso: 260, taxa: 31.5, disponiveis: 1 },
                ],
            },
            {
                id: "premium",
                nome: "PISTA PREMIUM - Inteira",
                valorOriginal: 490,
                ofertas: [{ id: "a", ingresso: 560, taxa: 67.5, disponiveis: 1 }],
            },
            {
                id: "pista-meia",
                nome: "PISTA - Meia Solidária",
                valorOriginal: 110,
                ofertas: [{ id: "a", ingresso: 125, taxa: 15, disponiveis: 2 }],
            },
        ],
        perguntas: [
            {
                pergunta: "O que é o Mochakk Calling?",
                resposta:
                    "É o formato de show solo do Mochakk: um set longo, de seis horas sem intervalo, em que ele constrói a noite inteira sozinho. A edição de 2026 é a primeira em um espaço aberto desse tamanho no Brasil.",
            },
            {
                pergunta: "Quais são as atrações de abertura?",
                resposta: "Dois convidados abrem a noite a partir das 17h; os nomes são anunciados nas semanas que antecedem o evento. O Mochakk assume as pick-ups às 20h.",
            },
        ],
    },
    {
        id: "lollapalooza",
        nome: "Lollapalooza Brasil 2026",
        artigo: "o",
        onde: "no Autódromo de Interlagos, em São Paulo (SP)",
        local: "Autódromo de Interlagos - São Paulo",
        data: "27 de março de 2026",
        gradient: "linear-gradient(145deg,#db2777 0%,#f59e0b 60%,#22c55e 100%)",
        status: "Alta demanda",
        descricao: [
            "O Lollapalooza Brasil 2026 abre no dia 27 de março no Autódromo de Interlagos. Esta página é da revenda de ingressos do primeiro dia do festival, que tem quatro palcos ativos e mais de vinte atrações distribuídas entre as 11h e a meia-noite.",
            "A edição mantém a estrutura de dois palcos principais alternados, o palco de eletrônica Perry's e o palco alternativo, além das áreas de gastronomia, do Lolla Lounge e do espaço Kidzapalooza.",
            "A grade por palco e horário é divulgada pela organização cerca de um mês antes do festival. O evento acontece com chuva ou sol. Menores de 13 anos entram gratuitamente acompanhados de um responsável.",
        ],
        lotes: [
            {
                id: "lolla-pass",
                nome: "LOLLA PASS DIA 1 - Inteira",
                valorOriginal: 375,
                ofertas: [
                    { id: "a", ingresso: 390, taxa: 47, disponiveis: 3 },
                    { id: "b", ingresso: 430, taxa: 52, disponiveis: 2 },
                ],
            },
            {
                id: "comfort",
                nome: "LOLLA COMFORT DIA 1 - Inteira",
                valorOriginal: 890,
                ofertas: [
                    { id: "a", ingresso: 980, taxa: 118, disponiveis: 1 },
                    { id: "b", ingresso: 1200, taxa: 144, disponiveis: 1 },
                ],
            },
            {
                id: "lolla-meia",
                nome: "LOLLA PASS DIA 1 - Meia Solidária",
                valorOriginal: 187.5,
                ofertas: [{ id: "a", ingresso: 210, taxa: 25.5, disponiveis: 2 }],
            },
        ],
        perguntas: [
            {
                pergunta: "Este ingresso vale para todos os dias do festival?",
                resposta:
                    "Não. Esta página reúne as ofertas de revenda do dia 1, 27 de março de 2026. Cada dia do Lollapalooza tem a sua própria página de revenda, e o Lolla Pass aqui listado dá acesso apenas à sexta-feira.",
            },
            {
                pergunta: "Quais são os horários do evento?",
                resposta: "Os portões abrem às 11h e o festival vai até a meia-noite. Os headliners dos palcos principais se apresentam a partir das 21h30.",
            },
        ],
    },
    {
        id: "reveillon-copa",
        nome: "Réveillon Copacabana 2027",
        artigo: "o",
        onde: "na Praia de Copacabana, no Rio de Janeiro (RJ)",
        local: "Praia de Copacabana - Rio de Janeiro",
        data: "31 de dezembro de 2026",
        gradient: "linear-gradient(145deg,#1e3a8a 0%,#9333ea 55%,#f59e0b 100%)",
        status: "Últimas horas",
        descricao: [
            "O Réveillon Copacabana 2027 é a área oficial de camarotes e lounges da virada na Praia de Copacabana, na noite de 31 de dezembro de 2026. As estruturas ficam na altura do Posto 4, de frente para as balsas de fogos.",
            "A programação começa às 20h, com shows na areia, e segue até as 4h. A queima de fogos tem 14 minutos e é assistida de dentro da área, sem disputa por espaço na faixa de areia aberta.",
            "Todos os ingressos incluem open bar e open food durante toda a noite. Há banheiros exclusivos e acesso controlado por pulseira nominal — por isso a transferência de titularidade é obrigatória na revenda.",
        ],
        lotes: [
            {
                id: "lounge-3",
                nome: "LOUNGE - Inteira",
                valorOriginal: 140,
                ofertas: [
                    { id: "a", ingresso: 140, taxa: 17, disponiveis: 4 },
                    { id: "b", ingresso: 185, taxa: 22.5, disponiveis: 2 },
                ],
            },
            {
                id: "camarote",
                nome: "CAMAROTE VISTA MAR - Inteira",
                valorOriginal: 420,
                ofertas: [{ id: "a", ingresso: 480, taxa: 58, disponiveis: 2 }],
            },
        ],
        perguntas: [
            {
                pergunta: "O que está incluído no ingresso?",
                resposta:
                    "Open bar e open food durante toda a noite, banheiros exclusivos e acesso à área reservada de frente para as balsas de fogos, na altura do Posto 4. O Camarote Vista Mar inclui ainda área coberta e serviço de mesa.",
            },
            {
                pergunta: "Quais são os horários do evento?",
                resposta: "O acesso começa às 20h, os shows na areia vão até as 4h e a queima de fogos acontece à meia-noite, com 14 minutos de duração.",
            },
        ],
    },
    {
        id: "semana-santa",
        nome: "Semana Santa dos Milagres",
        artigo: "a",
        onde: "na Casa Marceneiro, em Milagres (BA)",
        local: "Casa Marceneiro - Milagres",
        data: "2 de abril de 2026",
        gradient: "linear-gradient(145deg,#0ea5e9 0%,#22c55e 100%)",
        status: "Evento novo na área",
        descricao: [
            "A Semana Santa dos Milagres abre no dia 2 de abril de 2026 na Casa Marceneiro, em Milagres. É a festa que inaugura o feriado na cidade e, há seis edições, reúne forró pé de serra na primeira parte da noite e arrocha na segunda.",
            "A casa tem estrutura em dois ambientes: o salão principal, com o palco e a pista, e o terraço, com som próprio e vista para a serra. O ingresso dá acesso aos dois.",
            "O evento começa às 22h. A venda oficial esgotou em dezembro e a organização não fará lotes adicionais — a revenda é o único canal disponível. Entrada a partir de 18 anos.",
        ],
        lotes: [
            {
                id: "pista-4",
                nome: "PISTA - Inteira",
                valorOriginal: 80,
                ofertas: [
                    { id: "a", ingresso: 90, taxa: 11, disponiveis: 3 },
                    { id: "b", ingresso: 110, taxa: 13.5, disponiveis: 1 },
                ],
            },
            {
                id: "terraco",
                nome: "TERRAÇO - Inteira",
                valorOriginal: 220,
                ofertas: [{ id: "a", ingresso: 260, taxa: 31.5, disponiveis: 1 }],
            },
        ],
        perguntas: [
            {
                pergunta: "O que é a Semana Santa dos Milagres?",
                resposta:
                    "É a festa que abre o feriado da Semana Santa em Milagres, na sexta edição. A noite é dividida entre forró pé de serra, até por volta das 2h, e arrocha na sequência, com bandas da região.",
            },
            {
                pergunta: "Quais são os horários do evento?",
                resposta: "A casa abre às 22h e a festa vai até o amanhecer. O palco principal começa às 23h30.",
            },
        ],
    },
    {
        id: "festival-verao",
        nome: "Festival de Verão 2026",
        artigo: "o",
        onde: "no Parque de Exposições, em Salvador (BA)",
        local: "Parque de Exposições - Salvador",
        data: "25 de janeiro de 2026",
        gradient: "linear-gradient(145deg,#f97316 0%,#ef4444 55%,#a21caf 100%)",
        status: "Alta demanda",
        descricao: [
            "O Festival de Verão 2026 acontece no Parque de Exposições de Salvador, no dia 25 de janeiro. Esta página reúne as ofertas de revenda do segundo dia do festival, com atrações de axé, pagode e pop nacional em dois palcos alternados.",
            "A estrutura tem pista, área premium e camarotes, além da passarela que liga os dois palcos. A alternância entre eles é contínua, sem intervalos longos entre os shows.",
            "Os portões abrem às 17h e o festival vai até as 5h. O evento é coberto em parte da área e acontece com qualquer condição de tempo. Classificação etária de 16 anos, com menores acompanhados de responsável legal.",
        ],
        lotes: [
            {
                id: "pista-2",
                nome: "PISTA - Inteira",
                valorOriginal: 110,
                ofertas: [
                    { id: "a", ingresso: 100, taxa: 12, disponiveis: 2 },
                    { id: "b", ingresso: 145, taxa: 17.5, disponiveis: 3 },
                ],
            },
            {
                id: "premium",
                nome: "ÁREA PREMIUM - Inteira",
                valorOriginal: 300,
                ofertas: [{ id: "a", ingresso: 340, taxa: 41, disponiveis: 1 }],
            },
            {
                id: "pista-meia",
                nome: "PISTA - Meia Solidária",
                valorOriginal: 55,
                ofertas: [{ id: "a", ingresso: 65, taxa: 8, disponiveis: 1 }],
            },
        ],
        perguntas: [
            {
                pergunta: "Este ingresso vale para os dois dias?",
                resposta:
                    "Não. As ofertas desta página são do dia 25 de janeiro de 2026, o segundo dia do festival. O primeiro dia tem página de revenda própria, com line-up e lotes diferentes.",
            },
            {
                pergunta: "Quais são os horários do evento?",
                resposta: "Os portões abrem às 17h e o festival vai até as 5h. Os dois palcos se alternam sem intervalo a partir das 18h30.",
            },
        ],
    },
    {
        id: "rock-arena",
        nome: "Arena Rock Brasil 2026",
        artigo: "o",
        onde: "no Allianz Parque, em São Paulo (SP)",
        local: "Allianz Parque - São Paulo",
        data: "19 de junho de 2026",
        gradient: "linear-gradient(145deg,#16a34a 0%,#2563eb 50%,#f59e0b 100%)",
        status: "Últimas horas",
        selo: "Evento novo na área",
        descricao: [
            "O Arena Rock Brasil 2026 acontece no Allianz Parque, em São Paulo, no dia 19 de junho de 2026. São cinco bandas em um único palco, em formato de festival de estádio, com shows encadeados e sem palco secundário.",
            "A estrutura usa pista comum, pista premium na frente do palco e as cadeiras inferiores e superiores do estádio. Os setores de cadeira são numerados e a poltrona exata aparece no ingresso depois da transferência.",
            "Os portões abrem às 15h e o primeiro show começa às 16h30. O headliner sobe ao palco às 21h30. Classificação etária de 14 anos; menores de 14 apenas acompanhados por responsável legal.",
        ],
        lotes: [
            {
                id: "pista-comum",
                nome: "PISTA COMUM - Inteira",
                valorOriginal: 190,
                ofertas: [
                    { id: "a", ingresso: 210, taxa: 25.5, disponiveis: 3 },
                    { id: "b", ingresso: 250, taxa: 30, disponiveis: 1 },
                ],
            },
            {
                id: "pista-premium",
                nome: "PISTA PREMIUM - Inteira",
                valorOriginal: 480,
                ofertas: [{ id: "a", ingresso: 540, taxa: 65, disponiveis: 2 }],
            },
            {
                id: "cadeira-superior",
                nome: "CADEIRA SUPERIOR - Inteira",
                valorOriginal: 160,
                ofertas: [{ id: "a", ingresso: 180, taxa: 21.5, disponiveis: 1 }],
            },
        ],
        perguntas: [
            {
                pergunta: "O que é o Arena Rock Brasil?",
                resposta:
                    "É um festival de estádio com cinco bandas em um único palco, sem shows simultâneos. A edição de 2026 é a primeira no Allianz Parque e tem o line-up concentrado em um só dia, com shows encadeados da tarde à noite.",
            },
            {
                pergunta: "Como funcionam os setores de cadeira?",
                resposta:
                    "As cadeiras inferiores e superiores são numeradas. O setor aparece na oferta, e o assento exato é revelado no seu ingresso logo depois que a transferência de titularidade é concluída.",
            },
        ],
    },
    {
        id: "sunset-pier",
        nome: "Sunset Pier Sessions",
        artigo: "o",
        onde: "no Pier Mauá, no Rio de Janeiro (RJ)",
        local: "Pier Mauá - Rio de Janeiro",
        data: "14 de novembro de 2026",
        gradient: "linear-gradient(145deg,#f472b6 0%,#fb923c 55%,#facc15 100%)",
        status: "Últimos ingressos",
        descricao: [
            "O Sunset Pier Sessions acontece no Pier Mauá, no Rio de Janeiro, no dia 14 de novembro de 2026. A edição é diurna: começa às 14h e termina às 23h, com o palco principal virado para a Baía de Guanabara e o pôr do sol como parte da programação.",
            "São dois ambientes: o deck externo, com o palco principal, e o galpão, que assume depois do anoitecer com um set mais longo. A alternância acontece por volta das 18h30.",
            "O ingresso dá acesso aos dois ambientes e à área de alimentação. O evento é parcialmente coberto. Entrada a partir de 18 anos, com documento com foto.",
        ],
        lotes: [
            {
                id: "deck-2",
                nome: "DECK - Inteira",
                valorOriginal: 165,
                ofertas: [
                    { id: "a", ingresso: 180, taxa: 21.5, disponiveis: 2 },
                    { id: "b", ingresso: 220, taxa: 26.5, disponiveis: 1 },
                ],
            },
            {
                id: "lounge",
                nome: "LOUNGE BAÍA - Inteira",
                valorOriginal: 380,
                ofertas: [{ id: "a", ingresso: 420, taxa: 50.5, disponiveis: 1 }],
            },
        ],
        perguntas: [
            {
                pergunta: "O que é o Sunset Pier Sessions?",
                resposta:
                    "É uma festa diurna no Pier Mauá, com o palco principal virado para a Baía de Guanabara. O recorte é o fim da tarde: a programação é construída em torno do pôr do sol e muda de ambiente quando anoitece.",
            },
            {
                pergunta: "Quais são os horários do evento?",
                resposta: "O evento começa às 14h e vai até as 23h. A troca do deck externo para o galpão acontece por volta das 18h30.",
            },
        ],
    },
];

/** Os mais buscados hoje (carrossel do hero). */
export const MAIS_BUSCADOS = EVENTOS.slice(0, 6);
