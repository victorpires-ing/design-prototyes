import type { ComponentType } from "react";
import { Disc02, Heart, Microphone02, MusicNote01, MusicNote02, Star01, Trophy01, Zap } from "@untitledui/icons";
import type { VibeId } from "../../components/gradient-families";
import lineupJoao from "../assets/lineup-joao.png";
import lineupJota from "../assets/lineup-jota.png";
import lineupMestrinho from "../assets/lineup-mestrinho.png";

/* ------------------------------------------------------------------ */
/*  Mock compartilhado de eventos — Home, Busca e Categoria           */
/* ------------------------------------------------------------------ */

export type EventStatus = "venda" | "esgotado" | "pre-venda" | "fura-fila";

export interface EventoMock {
    id: string;
    titulo: string;
    artista?: string;
    /** ISO de início — usado para ordenar e filtrar por período. */
    data: string;
    /** ISO de fim (eventos de vários dias). */
    dataFim?: string;
    dataLabel: string;
    local: string;
    cidade: string;
    /** 0 = gratuito. */
    preco: number;
    /** seed do picsum para a capa. */
    seed: string;
    /** Família de gradiente que veste o evento. */
    vibe: VibeId;
    categoria: CategoriaId;
    tags: string[];
    popularidade: number;
    status: EventStatus;
    /** Capa real (URL). Quando ausente, usa picsum por seed. */
    cover?: string;
    /** Disponível no Ingresse Club (desconto/pré-venda/fura-fila). */
    club?: boolean;
    /** Aparece nas primeiras posições (patrocinado). */
    patrocinado?: boolean;
    /** Evento de camarote (exibe a arte normalmente). */
    camarote?: boolean;
    /** Jogo principal — exibe escudos + "X" + campeonato (diferencia do camarote). */
    futebol?: Confronto;
    /** Vídeo de fundo padrão do hero (YouTube ou arquivo direto). */
    heroVideoUrl?: string;
    /** Descrição oficial (parágrafos; 1º em destaque). Vazio = placeholder na página. */
    descricao?: string[];
    /** Lineup do evento — atrações com datas. */
    lineup?: Atracao[];
}

/** Atração do lineup de um evento. */
export interface Atracao {
    name: string;
    img?: string;
    dates?: { day: string; time?: string }[];
}

export interface Time {
    abbr: string;
    nome: string;
    cor: string;
    escudo?: string;
}
/** Entrada (portão) do estádio do mandante: onde fica e que setores atende. */
export interface Entrada {
    nome: string;
    setores: string;
    endereco: string;
}
export interface Confronto {
    campeonato: string;
    fase?: string;
    casa: Time;
    fora: Time;
    /** Jogo de torcida única (sem setor visitante). */
    torcidaUnica?: boolean;
    /** Portões do estádio do mandante (endereço de cada acesso). */
    entradas?: Entrada[];
}

export type CategoriaId = "eletronica" | "sertanejo" | "rock" | "rap" | "teatro" | "esportes" | "standup" | "festival";

export interface Categoria {
    id: CategoriaId;
    label: string;
    vibe: VibeId;
    icon: ComponentType<{ className?: string }>;
    /** Tags que pertencem à categoria (folksonomia). */
    tags: string[];
}

export const CATEGORIAS: Categoria[] = [
    { id: "eletronica", label: "Eletrônica", vibe: "high-tempo", icon: Disc02, tags: ["techno", "house", "rave", "open bar"] },
    { id: "sertanejo", label: "Sertanejo & Pagode", vibe: "communal", icon: MusicNote02, tags: ["sertanejo", "pagode", "samba", "ao ar livre"] },
    { id: "rock", label: "Rock & Indie", vibe: "countercultural", icon: MusicNote01, tags: ["rock", "indie", "metal", "punk"] },
    { id: "rap", label: "Rap & Trap", vibe: "swagger", icon: Microphone02, tags: ["rap", "trap", "hip-hop", "drill"] },
    { id: "teatro", label: "Teatro & Clássico", vibe: "elegance", icon: Star01, tags: ["teatro", "clássico", "jazz", "candlelight"] },
    { id: "festival", label: "Festivais", vibe: "rooted", icon: Heart, tags: ["festival", "ao ar livre", "reggae", "mpb"] },
    { id: "esportes", label: "Esportes", vibe: "unified", icon: Trophy01, tags: ["futebol", "nba", "ufc"] },
    { id: "standup", label: "Stand-up", vibe: "captivating", icon: Zap, tags: ["comédia", "stand-up", "teatro"] },
];

export const getCategoria = (id: CategoriaId): Categoria => CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[0];

/** Capa fotográfica (placeholder picsum por seed). */
export const coverUrl = (seed: string, w = 600, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const K = "https://kraken.ingresse.com/event/posters";

const ANITTA_FOTO = "https://images.sk-static.com/images/media/profile_images/artists/6889329/huge_avatar";
const ALOK_FOTO = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVaxBh4efjnnOTY_zgx-cwQG9emuDo-g3GNwkedDHLSTBkoFygIUFMpta7U17aVY-q-NjDysUQMsXHoFCQ1VFFtCeTEmFITZhYb3g7DRA5aw&s=10";
const CAETANO_FOTO = "https://akamai.sscdn.co/uploadfile/letras/fotos/6/d/7/0/6d701c857dba15768bc310cfe8c8bf06.jpg";

// Fotos de artistas (Deezer CDN — estável e hotlinkável). Usadas no "Explore por vibe".
const DZ = {
    vintage: "https://cdn-images.dzcdn.net/images/artist/bbc7f0e75f9154e5982420c42e805484/1000x1000-000000-80-0-0.jpg",
    catDealers: "https://cdn-images.dzcdn.net/images/artist/7958fc63d208af6188de2b6d3ce61fd9/1000x1000-000000-80-0-0.jpg",
    pitty: "https://cdn-images.dzcdn.net/images/artist/6d0e0efb632bb7464df2a1f4917495b7/1000x1000-000000-80-0-0.jpg",
    cpm22: "https://cdn-images.dzcdn.net/images/artist/d0422a934c07dd011b0a9adf54c033c9/1000x1000-000000-80-0-0.jpg",
    fresno: "https://cdn-images.dzcdn.net/images/artist/57e441a1eb8e54da5c97f542ede227f7/1000x1000-000000-80-0-0.jpg",
    emicida: "https://cdn-images.dzcdn.net/images/artist/828378440da0f264fb58647280c991e9/1000x1000-000000-80-0-0.jpg",
    criolo: "https://cdn-images.dzcdn.net/images/artist/6bc58b4567691714ce5074711b955105/1000x1000-000000-80-0-0.jpg",
    racionais: "https://cdn-images.dzcdn.net/images/artist/eb2451cb8d2eefe925a8ecffc8ff5e55/1000x1000-000000-80-0-0.jpg",
    bethania: "https://cdn-images.dzcdn.net/images/artist/ff4c673a3d8b6b5edd5f2b6733bd8b00/1000x1000-000000-80-0-0.jpg",
    paulinho: "https://cdn-images.dzcdn.net/images/artist/1d4b17c68f3132f656c097ed807829aa/1000x1000-000000-80-0-0.jpg",
    whindersson: "https://cdn-images.dzcdn.net/images/artist/84f4abb68cc7d7de5f8e7413346672eb/1000x1000-000000-80-0-0.jpg",
    porchat: "https://cdn-images.dzcdn.net/images/artist/a9880905d0bfb6d7a2a82ec7ffef28f2/1000x1000-000000-80-0-0.jpg",
    ventura: "https://cdn-images.dzcdn.net/images/artist/5eba00f57d87d6ab3bc8b4c5e2fa9197/1000x1000-000000-80-0-0.jpg",
};
const LINIKER_FOTO = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzpSPtaWSfYExktw-VzZGrN7OOl8dLqBgu52tEwZagIc3h6pZfX7xA95t7&s=10";

const trioDominguinho = (dia: string): Atracao[] => [
    { name: "Jota.pê", img: lineupJota, dates: [{ day: dia }] },
    { name: "João Gomes", img: lineupJoao, dates: [{ day: dia }] },
    { name: "Mestrinho", img: lineupMestrinho, dates: [{ day: dia }] },
];
const anittaLine = (dia: string): Atracao[] => [{ name: "Anitta", img: ANITTA_FOTO, dates: [{ day: dia }] }];

const LINIKER_DESCRICAO = [
    "O Camarote Fanzone convida o público a viver o show da Liniker, dentro da turnê “Bye Bye Caju”, no Nubank Parque, em uma apresentação que celebra afeto, potência artística e a maturidade musical de uma das vozes mais marcantes da música brasileira contemporânea.",
    "A turnê apresenta ao público o repertório do álbum CAJU, além de canções que atravessam a trajetória da artista, em um espetáculo intenso, sensível e carregado de emoção. No palco, Liniker entrega uma performance envolvente, que transforma o show em uma experiência profunda de conexão com o público.",
    "Com visão privilegiada para o palco e ambiente climatizado, o Camarote Fanzone oferece conforto e exclusividade para acompanhar cada momento da apresentação. O espaço conta com serviço completo de open bar e open food, atendimento dedicado e acesso organizado, garantindo uma experiência fluida do início ao fim do evento.",
    "O Camarote Fanzone é a escolha ideal para quem deseja vivenciar a turnê da Liniker de forma diferenciada, unindo música, conforto e hospitalidade em um dos principais palcos do país.",
    "Data: 11/07/2026 · Abertura dos portões: 15h00* · Show: 19h00*. Horário sujeito a alteração. Abertura de vendas dia 22/12 às 13h.",
    "OPEN BAR completíssimo: água e refrigerante durante todo o evento, a cerveja oficial do evento e JACK DANIEL’S.",
    "OPEN FOOD: buffet de entrada (snacks, canapés, pães, pastas, verrine) da abertura até o início do show; prato principal servido duas horas antes do show; açaí liberado a noite toda e sobremesas a partir de uma hora após o início do show. *Cardápio sujeito a alteração sem aviso prévio.",
    "Cobertura fotográfica: haverá fotógrafo oficial do camarote no evento. Ao adquirir o ingresso, você autoriza o uso da sua imagem.",
    "Classificação etária: +18. Menores de 18 anos somente acompanhados dos responsáveis.",
    "Contato: contato@soccerhospitality.com.br · SAC: (11) 94229-2687.",
    "Importante: o encerramento do acesso pelas catracas do E0 ocorre às 22h00. Chegue antes desse horário para garantir a entrada.",
];

const DOCE_DESCRICAO = [
    "A quarta edição do Doce Maravilha acontece nos dias 7, 8 e 9 de agosto, no Jockey Club Brasileiro, no Rio de Janeiro, reafirmando sua proposta de reunir diferentes gerações, regiões e sonoridades em torno de uma grande celebração da música brasileira.",
    "As atrações seguem ancoradas na mistura entre repertório, descoberta e invenção, unindo a experiência e o olhar atento de Nelson Motta para diferentes movimentos da música feita no país.",
    "Local: Jockey Club — Praça Santos Dumont, 31, Gávea. Abertura na sexta às 18h (entrada até 21h15, término 22h); sábado e domingo abertura às 12h (entrada até 20h30, término 22h).",
    "Classificação etária: 16 anos. Menores entre 5 e 15 anos só acompanhados dos pais ou responsáveis legais (com documento). Proibida a entrada de menores de 5 anos.",
    "Ingresso solidário: parte da arrecadação é destinada a institutos beneficentes parceiros do festival; vale para todas as pessoas, sem necessidade de comprovação e sem obrigatoriedade de levar alimento.",
    "Venda limitada a 4 ingressos por CPF, sendo até 2 meia-entrada. Taxa de conveniência de 10% nas vendas online; sem taxa nas vendas presenciais. Não serão permitidas transferências de ingressos online no dia do evento.",
];
const DOCE_LINEUP: Atracao[] = [
    { name: "Caetano Veloso conv. Emicida", dates: [{ day: "09/08" }] },
    { name: "Paulinho da Viola conv. Maria Bethânia", dates: [{ day: "08/08" }] },
    { name: "Os Paralamas do Sucesso", dates: [{ day: "09/08" }] },
    { name: "Raimundos conv. Charlie Brown Jr.", dates: [{ day: "07/08" }] },
    { name: "Fresno: 10 anos de A Sinfonia de Tudo Que Há", dates: [{ day: "07/08" }] },
    { name: "Bloco do Silva", dates: [{ day: "08/08" }] },
    { name: "Leci Brandão & Rappin’ Hood", dates: [{ day: "08/08" }] },
    { name: "Cortejo Afro conv. Luedji Luna & Margareth Menezes", dates: [{ day: "08/08" }] },
    { name: "Falamansa conv. Ruan Vitor", dates: [{ day: "09/08" }] },
    { name: "Sandra Sá: 40 anos", dates: [{ day: "09/08" }] },
];

export const EVENTOS: EventoMock[] = [
    // --- Anitta / Village & Arena Brasileira (Ingresse, capas reais) ---
    { id: "village-anitta", titulo: "Village 2026 · Anitta", artista: "Anitta", data: "2026-02-14", dataLabel: "14 fev", local: "Camarote Village", cidade: "Salvador", preco: 890, seed: "village-anitta", cover: `${K}/91169/large/1774865640.8354099.jpg`, vibe: "high-tempo", categoria: "festival", tags: ["carnaval", "anitta", "camarote"], popularidade: 1650, status: "venda", patrocinado: true, club: true, lineup: anittaLine("14 fev") },
    { id: "village-momo", titulo: "Village 2026 · Baile do Momo", artista: "Anitta", data: "2026-02-15", dataLabel: "15 fev", local: "Arena Village", cidade: "Salvador", preco: 690, seed: "village-momo", cover: `${K}/91683/large/1774435347.0555267.jpg`, vibe: "communal", categoria: "festival", tags: ["carnaval", "baile do momo", "camarote"], popularidade: 1480, status: "venda", patrocinado: true, lineup: anittaLine("15 fev") },
    { id: "arena-brasileira", titulo: "Arena Brasileira 2026", artista: "Anitta", data: "2026-03-21", dataLabel: "21 mar", local: "Arena", cidade: "São Paulo", preco: 240, seed: "arena-brasileira", cover: `${K}/88741/large/1777059599.2681417.jpg`, vibe: "communal", categoria: "festival", tags: ["festival", "música brasileira"], popularidade: 1390, status: "venda", lineup: anittaLine("21 mar") },
    // --- Turnê Dominguinho (Jota.pê, João Gomes e Mestrinho) — capas reais (Ingresse) ---
    { id: "dom-fortaleza-bb", titulo: "Turnê Dominguinho · Fortaleza", artista: "Jota.pê, João Gomes e Mestrinho", data: "2026-04-10", dataLabel: "10 abr", local: "Centro de Eventos do Ceará", cidade: "Fortaleza", preco: 160, seed: "dom-fortaleza-bb", cover: `${K}/94563/large/1779123707.2089734.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["forró", "sertanejo", "mpb"], popularidade: 1320, status: "venda", club: true, lineup: trioDominguinho("10 abr") },
    { id: "dom-fortaleza", titulo: "Turnê Dominguinho · Fortaleza (2ª data)", artista: "Jota.pê, João Gomes e Mestrinho", data: "2026-04-11", dataLabel: "11 abr", local: "Centro de Eventos do Ceará", cidade: "Fortaleza", preco: 160, seed: "dom-fortaleza", cover: `${K}/94463/large/1779123672.545349.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["forró", "sertanejo", "mpb"], popularidade: 1180, status: "venda", lineup: trioDominguinho("11 abr") },
    { id: "dom-uberlandia", titulo: "Turnê Dominguinho · Uberlândia", artista: "Jota.pê, João Gomes e Mestrinho", data: "2026-04-18", dataLabel: "18 abr", local: "Center Convention", cidade: "Uberlândia", preco: 150, seed: "dom-uberlandia", cover: `${K}/94657/large/1779123761.921731.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["forró", "sertanejo", "mpb"], popularidade: 1010, status: "venda", lineup: trioDominguinho("18 abr") },
    { id: "dom-santos", titulo: "Turnê Dominguinho · Santos", artista: "Jota.pê, João Gomes e Mestrinho", data: "2026-04-25", dataLabel: "25 abr", local: "Mendes Convention Center", cidade: "Santos", preco: 150, seed: "dom-santos", cover: `${K}/94574/large/1779123830.2433288.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["forró", "sertanejo", "mpb"], popularidade: 1040, status: "venda", lineup: trioDominguinho("25 abr") },
    { id: "dom-campinas", titulo: "Dominguinho em Campinas", artista: "Jota.pê, João Gomes e Mestrinho", data: "2026-05-02", dataLabel: "02 mai", local: "Royal Palm Hall", cidade: "Campinas", preco: 150, seed: "dom-campinas", cover: `${K}/94572/large/1779123884.4590633.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["forró", "sertanejo", "mpb"], popularidade: 1060, status: "venda", lineup: trioDominguinho("02 mai") },
    { id: "dom-portoalegre", titulo: "Turnê Dominguinho · Porto Alegre", artista: "Jota.pê, João Gomes e Mestrinho", data: "2026-05-09", dataLabel: "09 mai", local: "Pepsi On Stage", cidade: "Porto Alegre", preco: 170, seed: "dom-portoalegre", cover: `${K}/94501/large/1779123936.371687.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["forró", "sertanejo", "mpb"], popularidade: 1120, status: "venda", club: true, lineup: trioDominguinho("09 mai") },
    { id: "dom-natal", titulo: "Turnê Dominguinho · Natal", artista: "Jota.pê, João Gomes e Mestrinho", data: "2026-05-16", dataLabel: "16 mai", local: "Arena das Dunas", cidade: "Natal", preco: 150, seed: "dom-natal", cover: `${K}/94573/large/1779124002.883828.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["forró", "sertanejo", "mpb"], popularidade: 980, status: "venda", lineup: trioDominguinho("16 mai") },
    { id: "dom-londrina", titulo: "Turnê Dominguinho · Londrina", artista: "Jota.pê, João Gomes e Mestrinho", data: "2026-05-23", dataLabel: "23 mai", local: "Londrina Convention", cidade: "Londrina", preco: 140, seed: "dom-londrina", cover: `${K}/95087/large/1779151236.5105138.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["forró", "sertanejo", "mpb"], popularidade: 940, status: "venda", lineup: trioDominguinho("23 mai") },
    { id: "dom-ribeirao", titulo: "Turnê Dominguinho · Ribeirão Preto", artista: "Jota.pê, João Gomes e Mestrinho", data: "2026-05-30", dataLabel: "30 mai", local: "Vila Mix Ribeirão", cidade: "Ribeirão Preto", preco: 150, seed: "dom-ribeirao", cover: `${K}/94789/large/1779137468.601717.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["forró", "sertanejo", "mpb"], popularidade: 990, status: "venda", lineup: trioDominguinho("30 mai") },
    { id: "dom-salvador", titulo: "Turnê Dominguinho · Salvador", artista: "Jota.pê, João Gomes e Mestrinho", data: "2026-06-06", dataLabel: "06 jun", local: "Concha Acústica TCA", cidade: "Salvador", preco: 160, seed: "dom-salvador", cover: `${K}/94506/large/1779137759.8814712.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["forró", "sertanejo", "mpb"], popularidade: 1150, status: "venda", club: true, lineup: trioDominguinho("06 jun") },
    // --- Capas reais (Ingresse) ---
    { id: "alok", titulo: "Alok", artista: "Alok", data: "2026-09-12", dataLabel: "12 set", local: "Allianz Parque", cidade: "São Paulo", preco: 180, seed: "alok", cover: `${K}/17008/large.jpg`, vibe: "high-tempo", categoria: "eletronica", tags: ["edm", "eletrônica", "open air"], popularidade: 1520, status: "venda", patrocinado: true, lineup: [{ name: "Alok", img: ALOK_FOTO, dates: [{ day: "12/09", time: "22h" }] }] },
    { id: "dedge-rio", titulo: "D-Edge Rio apresenta Departamento", artista: "Departamento", data: "2026-06-25", dataLabel: "25 jun", local: "D-Edge Rio", cidade: "Rio de Janeiro", preco: 90, seed: "dedge", cover: `${K}/97708/large/1781044616.1797788.jpg`, vibe: "high-tempo", categoria: "eletronica", tags: ["techno", "house", "open bar"], popularidade: 1180, status: "venda", club: true, patrocinado: true },
    { id: "jardim-copa", titulo: "Jardim da Copa 2026", artista: "by Johnnie Walker", data: "2026-06-27", dataLabel: "27 jun", local: "Jockey Club", cidade: "Rio de Janeiro", preco: 150, seed: "jardimcopa", cover: `${K}/94311/large/1779136499.7231941.jpg`, vibe: "unified", categoria: "festival", tags: ["copa", "festival", "open bar"], popularidade: 1390, status: "venda", patrocinado: true },
    { id: "doce-maravilha", titulo: "Doce Maravilha · A Festa da Música Brasileira", artista: "Caetano, Paulinho da Viola, Paralamas e mais", data: "2026-08-07", dataFim: "2026-08-09", dataLabel: "07 a 09 ago", local: "Jockey Club Brasileiro", cidade: "Rio de Janeiro", preco: 110, seed: "docemaravilha", cover: `${K}/92149/large/1781884210.5202928.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["mpb", "samba", "ao ar livre"], popularidade: 1240, status: "venda", club: true, descricao: DOCE_DESCRICAO, lineup: DOCE_LINEUP },
    { id: "camarote-liniker", titulo: "Camarote Fanzone · Liniker — Bye Bye Caju", artista: "Liniker", data: "2026-07-11", dataLabel: "11 jul", local: "Nubank Parque", cidade: "São Paulo", preco: 690, seed: "camarote-liniker", cover: `${K}/89285/large/1778187266.1136427.jpg`, vibe: "communal", categoria: "festival", tags: ["camarote", "open bar", "open food", "mpb"], popularidade: 1300, status: "venda", patrocinado: true, lineup: [{ name: "Liniker", img: LINIKER_FOTO, dates: [{ day: "11/07", time: "19h" }] }], descricao: LINIKER_DESCRICAO },
    { id: "rio-surf", titulo: "Rio Surf Music Festival", data: "2026-07-04", dataLabel: "04 jul", local: "Praia da Macumba", cidade: "Rio de Janeiro", preco: 130, seed: "riosurf", cover: `${K}/91699/large/1778018804.1097233.jpg`, vibe: "rooted", categoria: "festival", tags: ["reggae", "surf", "ao ar livre"], popularidade: 880, status: "venda" },
    { id: "firezone", titulo: "Camarote Firezone · Botafogo x Grêmio", data: "2026-07-12", dataLabel: "12 jul", local: "Maracanã", cidade: "Rio de Janeiro", preco: 320, seed: "firezone", cover: `${K}/91843/large/1781274013.0050466.jpg`, vibe: "unified", categoria: "esportes", tags: ["futebol", "camarote"], popularidade: 1450, status: "venda", patrocinado: true, camarote: true },
    { id: "bot-gre", titulo: "Botafogo x Grêmio", data: "2026-07-12", dataLabel: "12 jul", local: "Estádio Nilton Santos", cidade: "Rio de Janeiro", preco: 60, seed: "botgre", vibe: "unified", categoria: "esportes", tags: ["futebol", "brasileirão"], popularidade: 1500, status: "venda", heroVideoUrl: "https://guczkytnfgfggsxvlsru.supabase.co/storage/v1/object/public/teste/download.mp4", futebol: { campeonato: "Brasileirão 2026", fase: "Rodada 14", torcidaUnica: true, casa: { abbr: "BOT", nome: "Botafogo", cor: "#111111", escudo: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Escudo_Botafogo.png" }, fora: { abbr: "GRE", nome: "Grêmio", cor: "#1E6CB3", escudo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Gremio_logo.svg" }, entradas: [
        { nome: "Portão A", setores: "Arquibancada Norte", endereco: "Rua Arquias Cordeiro, Engenho de Dentro, Rio de Janeiro" },
        { nome: "Portão B", setores: "Cadeira Leste", endereco: "Rua José dos Reis, 425, Engenho de Dentro, Rio de Janeiro" },
        { nome: "Portão C", setores: "Cadeira Oeste · coberta e Camarotes", endereco: "Rua Dr. Padilha, Engenho de Dentro, Rio de Janeiro" },
        { nome: "Portão D", setores: "Arquibancada Sul", endereco: "Av. Dom Hélder Câmara, Engenho de Dentro, Rio de Janeiro" },
    ] } },
    { id: "bah-for", titulo: "Bahia x Fortaleza", data: "2026-07-19", dataLabel: "19 jul", local: "Arena Fonte Nova", cidade: "Salvador", preco: 50, seed: "bahfor", vibe: "unified", categoria: "esportes", tags: ["futebol", "nordestão"], popularidade: 1280, status: "venda", futebol: { campeonato: "Copa do Nordeste 2026", fase: "Final", casa: { abbr: "BAH", nome: "Bahia", cor: "#0056A7", escudo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Esporte_Clube_Bahia_logo.svg/250px-Esporte_Clube_Bahia_logo.svg.png" }, fora: { abbr: "FOR", nome: "Fortaleza", cor: "#1C3F94", escudo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Fortaleza_Esporte_Clube_logo.svg/1920px-Fortaleza_Esporte_Clube_logo.svg.png" }, entradas: [
        { nome: "Portão A", setores: "Arquibancada Norte", endereco: "Ladeira da Fonte das Pedras, s/n, Nazaré, Salvador" },
        { nome: "Portão B", setores: "Cadeira Leste", endereco: "Rua Comendador Bernardo Catarino, Nazaré, Salvador" },
        { nome: "Portão C", setores: "Cadeira Oeste · coberta e Camarotes", endereco: "Rua Saldanha Marinho, Nazaré, Salvador" },
        { nome: "Portão D", setores: "Setor Visitante", endereco: "Rua Conselheiro Pedro Luís, Nazaré, Salvador" },
    ] } },
    { id: "ginga", titulo: "Ginga BH · Full Open Bar", data: "2026-06-26", dataLabel: "26 jun", local: "Mansão Ginga", cidade: "Belo Horizonte", preco: 80, seed: "ginga", cover: `${K}/92036/large/1781620538.9821115.jpg`, vibe: "high-tempo", categoria: "eletronica", tags: ["funk", "open bar", "festa"], popularidade: 760, status: "venda", club: true },
    { id: "prainha", titulo: "Prainha Club com Mr. Dan", artista: "Mr. Dan", data: "2026-06-29", dataLabel: "29 jun", local: "Prainha", cidade: "Rio de Janeiro", preco: 70, seed: "prainha", cover: `${K}/99266/large/1781100643.520255.jpg`, vibe: "rooted", categoria: "festival", tags: ["reggae", "pop", "praia"], popularidade: 640, status: "venda" },
    { id: "samba-bons", titulo: "Samba Independente dos Bons Costumes", data: "2026-07-02", dataLabel: "02 jul", local: "Pedra do Sal", cidade: "Rio de Janeiro", preco: 40, seed: "sambabons", cover: `${K}/97574/large/1780073864.711198.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["samba", "pagode", "ao ar livre"], popularidade: 690, status: "venda" },
    { id: "encontrin", titulo: "Encontrin das Quintas", data: "2026-07-09", dataLabel: "09 jul", local: "Quintal RJ", cidade: "Rio de Janeiro", preco: 0, seed: "encontrin", cover: `${K}/96274/large/1779478034.6552.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["pagode", "samba", "open bar"], popularidade: 560, status: "venda" },

    // --- Variedade adicional (placeholder) p/ completar categorias ---
    { id: "dominguinho", titulo: "Turnê Dominguinho", artista: "Jota.Pê, João Gomes, Mestrinho", data: "2026-12-19", dataLabel: "19 a 22 dez", local: "Classic Hall", cidade: "Recife", preco: 120, seed: "dominguinho", vibe: "communal", categoria: "sertanejo", tags: ["sertanejo", "forró", "ao ar livre"], popularidade: 1320, status: "venda" },
    { id: "trap", titulo: "Sem Medo · Trap Night", artista: "MC Lørde, Dume", data: "2026-06-26", dataLabel: "26 jun", local: "Tokio Marine Hall", cidade: "São Paulo", preco: 110, seed: "trap-night", vibe: "swagger", categoria: "rap", tags: ["trap", "hip-hop", "drill"], popularidade: 980, status: "venda" },
    { id: "candle", titulo: "Candlelight: Tributo ao Queen", data: "2026-07-04", dataLabel: "04 jul", local: "Teatro Santander", cidade: "São Paulo", preco: 130, seed: "candle-queen", vibe: "elegance", categoria: "teatro", tags: ["clássico", "candlelight", "intimista"], popularidade: 870, status: "venda" },
    { id: "rock-roof", titulo: "Rock in Roof", artista: "Cassia & The Noise", data: "2026-06-28", dataLabel: "28 jun", local: "Mirante Vivo", cidade: "São Paulo", preco: 95, seed: "rock-roof", vibe: "countercultural", categoria: "rock", tags: ["rock", "indie", "ao ar livre"], popularidade: 720, status: "venda" },
    { id: "ideas", titulo: "Ideas Come Alive", artista: "João Martins", data: "2026-07-18", dataLabel: "18 jul", local: "Auditório Ibirapuera", cidade: "São Paulo", preco: 60, seed: "speaker-ideas", vibe: "captivating", categoria: "standup", tags: ["palestra", "inovação"], popularidade: 410, status: "pre-venda" },
    { id: "metal", titulo: "Hellfire Open Air", artista: "Vibra & convidados", data: "2026-08-09", dataLabel: "09 ago", local: "Arena Anhembi", cidade: "São Paulo", preco: 180, seed: "hellfire", vibe: "countercultural", categoria: "rock", tags: ["metal", "rock", "ao ar livre"], popularidade: 880, status: "venda" },
    { id: "standup-noite", titulo: "Stand-up: Noite de Outro Nível", artista: "Leo Marçal", data: "2026-07-02", dataLabel: "02 jul", local: "Teatro Gazeta", cidade: "São Paulo", preco: 75, seed: "standup-noite", vibe: "captivating", categoria: "standup", tags: ["comédia", "stand-up"], popularidade: 520, status: "venda" },
    { id: "nba", titulo: "NBA Global Games", data: "2026-10-10", dataLabel: "10 out", local: "Arena", cidade: "São Paulo", preco: 320, seed: "nba-games", vibe: "unified", categoria: "esportes", tags: ["nba", "basquete"], popularidade: 990, status: "pre-venda" },
    { id: "jazz", titulo: "The Jazz Room: New Orleans", data: "2026-07-08", dataLabel: "08 jul", local: "Cine Theatro Brasil", cidade: "Belo Horizonte", preco: 82, seed: "jazz-room", vibe: "elegance", categoria: "teatro", tags: ["jazz", "intimista"], popularidade: 560, status: "venda" },
    { id: "funk", titulo: "Baile Eletrônico", artista: "Departamento", data: "2026-06-21", dataLabel: "ontem", local: "Laje SP", cidade: "São Paulo", preco: 40, seed: "baile-funk", vibe: "high-tempo", categoria: "eletronica", tags: ["funk", "house"], popularidade: 700, status: "esgotado" },
    { id: "trap2", titulo: "Drill Tape Live", artista: "GMP", data: "2026-08-01", dataLabel: "01 ago", local: "Cine Joia", cidade: "São Paulo", preco: 85, seed: "drill-tape", vibe: "swagger", categoria: "rap", tags: ["drill", "trap"], popularidade: 470, status: "venda" },
];

/** Eventos recentemente visualizados (mock). */
export const VISTOS_RECENTEMENTE = ["doce-maravilha", "trap", "candle", "firezone"]
    .map((id) => EVENTOS.find((e) => e.id === id))
    .filter(Boolean) as EventoMock[];

export const formatPreco = (preco: number) => (preco === 0 ? "Gratuito" : `R$ ${preco.toLocaleString("pt-BR")}`);

export const getEvento = (id: string) => EVENTOS.find((e) => e.id === id);

/** Capa representativa de uma categoria (prioriza pôster real). */
export const categoriaCover = (id: CategoriaId): string => {
    const real = EVENTOS.find((e) => e.categoria === id && e.cover);
    if (real?.cover) return real.cover;
    const any = EVENTOS.find((e) => e.categoria === id);
    return any ? coverUrl(any.seed) : coverUrl(id);
};

/**
 * Imagens da aba "Explore por vibe" — fotos reais de artistas que casam com a
 * energia da família; onde não há retrato, completa com a capa real do gênero.
 */
// Apenas fotos de artista ou da venue (nunca pôsteres). Categorias sem foto
// confiável ficam vazias — o tile mantém gradiente + ícone + nome.
const ESCUDO = (id: string) => {
    const f = getEvento(id)?.futebol;
    return [f?.casa.escudo, f?.fora.escudo].filter(Boolean) as string[];
};
export const VIBE_IMAGES: Record<CategoriaId, string[]> = {
    eletronica: [ALOK_FOTO, DZ.vintage, DZ.catDealers],
    sertanejo: [lineupJota, lineupJoao, lineupMestrinho],
    rock: [DZ.pitty, DZ.cpm22, DZ.fresno],
    rap: [DZ.emicida, DZ.criolo, DZ.racionais],
    teatro: [CAETANO_FOTO, DZ.bethania, DZ.paulinho],
    esportes: [...ESCUDO("bot-gre"), ...ESCUDO("bah-for")].slice(0, 3),
    standup: [DZ.whindersson, DZ.porchat, DZ.ventura],
    festival: [ANITTA_FOTO, LINIKER_FOTO, CAETANO_FOTO],
};

/** Eventos em destaque para o palco cinematográfico da Home. */
export const DESTAQUES: EventoMock[] = ["jardim-copa", "dedge-rio", "doce-maravilha", "firezone", "rio-surf"]
    .map(getEvento)
    .filter(Boolean) as EventoMock[];

/* ------------------------------------------------------------------ */
/*  Artistas em destaque (com eventos ativos)                         */
/* ------------------------------------------------------------------ */

export interface Artista {
    /** Fotos para grupos/trios — quando presente, mostra avatares sobrepostos. */
    avatars?: string[];
    nome: string;
    avatar: string;
    /** IDs de eventos ativos (até 3 exibidos). */
    eventos: string[];
}

export const ARTISTAS: Artista[] = [
    { nome: "Anitta", avatar: "https://images.sk-static.com/images/media/profile_images/artists/6889329/huge_avatar", eventos: ["village-anitta", "village-momo", "arena-brasileira"] },
    { nome: "Jota.pê, João Gomes e Mestrinho", avatar: lineupJoao, avatars: [lineupJota, lineupJoao, lineupMestrinho], eventos: ["dom-fortaleza-bb", "dom-salvador", "dom-portoalegre"] },
    { nome: "Alok", avatar: ALOK_FOTO, eventos: ["alok"] },
    { nome: "Liniker", avatar: LINIKER_FOTO, eventos: ["camarote-liniker"] },
    { nome: "Caetano Veloso", avatar: CAETANO_FOTO, eventos: ["doce-maravilha"] },
];
