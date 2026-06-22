import type { ComponentType } from "react";
import { Disc02, Heart, Microphone02, MusicNote01, MusicNote02, Star01, Trophy01, Zap } from "@untitledui/icons";
import type { VibeId } from "../../components/gradient-families";

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
}

export interface Time {
    abbr: string;
    nome: string;
    cor: string;
    escudo?: string;
}
export interface Confronto {
    campeonato: string;
    fase?: string;
    casa: Time;
    fora: Time;
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

export const EVENTOS: EventoMock[] = [
    // --- Capas reais (Ingresse) ---
    { id: "dedge-rio", titulo: "D-Edge Rio apresenta Departamento", artista: "Departamento", data: "2026-06-25", dataLabel: "25 jun", local: "D-Edge Rio", cidade: "Rio de Janeiro", preco: 90, seed: "dedge", cover: `${K}/97708/large/1781044616.1797788.jpg`, vibe: "high-tempo", categoria: "eletronica", tags: ["techno", "house", "open bar"], popularidade: 1180, status: "venda", club: true, patrocinado: true },
    { id: "jardim-copa", titulo: "Jardim da Copa 2026", artista: "by Johnnie Walker", data: "2026-06-27", dataLabel: "27 jun", local: "Jockey Club", cidade: "Rio de Janeiro", preco: 150, seed: "jardimcopa", cover: `${K}/94311/large/1779136499.7231941.jpg`, vibe: "unified", categoria: "festival", tags: ["copa", "festival", "open bar"], popularidade: 1390, status: "venda", patrocinado: true },
    { id: "doce-maravilha", titulo: "Doce Maravilha", artista: "A festa da música brasileira", data: "2026-06-28", dataLabel: "28 jun", local: "Marina da Glória", cidade: "Rio de Janeiro", preco: 110, seed: "docemaravilha", cover: `${K}/92149/large/1781884210.5202928.jpg`, vibe: "communal", categoria: "sertanejo", tags: ["mpb", "samba", "ao ar livre"], popularidade: 1240, status: "venda", club: true },
    { id: "rio-surf", titulo: "Rio Surf Music Festival", data: "2026-07-04", dataLabel: "04 jul", local: "Praia da Macumba", cidade: "Rio de Janeiro", preco: 130, seed: "riosurf", cover: `${K}/91699/large/1778018804.1097233.jpg`, vibe: "rooted", categoria: "festival", tags: ["reggae", "surf", "ao ar livre"], popularidade: 880, status: "venda" },
    { id: "firezone", titulo: "Camarote Firezone · Botafogo x Grêmio", data: "2026-07-12", dataLabel: "12 jul", local: "Maracanã", cidade: "Rio de Janeiro", preco: 320, seed: "firezone", cover: `${K}/91843/large/1781274013.0050466.jpg`, vibe: "unified", categoria: "esportes", tags: ["futebol", "camarote"], popularidade: 1450, status: "venda", patrocinado: true, camarote: true },
    { id: "bot-gre", titulo: "Botafogo x Grêmio", data: "2026-07-12", dataLabel: "12 jul", local: "Estádio Nilton Santos", cidade: "Rio de Janeiro", preco: 60, seed: "botgre", vibe: "unified", categoria: "esportes", tags: ["futebol", "brasileirão"], popularidade: 1500, status: "venda", futebol: { campeonato: "Brasileirão 2026", fase: "Rodada 14", casa: { abbr: "BOT", nome: "Botafogo", cor: "#111111", escudo: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Escudo_Botafogo.png" }, fora: { abbr: "GRE", nome: "Grêmio", cor: "#1E6CB3", escudo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Gremio_logo.svg" } } },
    { id: "bah-for", titulo: "Bahia x Fortaleza", data: "2026-07-19", dataLabel: "19 jul", local: "Arena Fonte Nova", cidade: "Salvador", preco: 50, seed: "bahfor", vibe: "unified", categoria: "esportes", tags: ["futebol", "nordestão"], popularidade: 1280, status: "venda", futebol: { campeonato: "Copa do Nordeste 2026", fase: "Final", casa: { abbr: "BAH", nome: "Bahia", cor: "#0056A7", escudo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Esporte_Clube_Bahia_logo.svg/250px-Esporte_Clube_Bahia_logo.svg.png" }, fora: { abbr: "FOR", nome: "Fortaleza", cor: "#1C3F94", escudo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Fortaleza_Esporte_Clube_logo.svg/1920px-Fortaleza_Esporte_Clube_logo.svg.png" } } },
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

/** Eventos em destaque para o palco cinematográfico da Home. */
export const DESTAQUES: EventoMock[] = ["jardim-copa", "dedge-rio", "doce-maravilha", "firezone", "rio-surf"]
    .map(getEvento)
    .filter(Boolean) as EventoMock[];

/* ------------------------------------------------------------------ */
/*  Artistas em destaque (com eventos ativos)                         */
/* ------------------------------------------------------------------ */

export interface Artista {
    nome: string;
    avatar: string;
    /** IDs de eventos ativos (até 3 exibidos). */
    eventos: string[];
}

const portrait = (seed: string) => `https://picsum.photos/seed/${seed}/240/240`;

export const ARTISTAS: Artista[] = [
    { nome: "Liniker", avatar: portrait("liniker"), eventos: ["doce-maravilha", "samba-bons", "encontrin"] },
    { nome: "João Gomes", avatar: portrait("joaogomes"), eventos: ["dominguinho"] },
    { nome: "Caetano Veloso", avatar: portrait("caetano"), eventos: ["doce-maravilha"] },
    { nome: "Rafael Cerato", avatar: portrait("cerato"), eventos: ["dedge-rio"] },
    { nome: "Mr. Dan", avatar: portrait("mrdan"), eventos: ["prainha", "rio-surf"] },
    { nome: "Departamento", avatar: portrait("departamento"), eventos: ["dedge-rio", "ginga"] },
    { nome: "Mestrinho", avatar: portrait("mestrinho"), eventos: ["dominguinho", "encontrin"] },
];
