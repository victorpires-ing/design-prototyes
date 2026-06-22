/* ------------------------------------------------------------------ */
/*  Famílias de gradiente — AFTER / Ingresse brand manual             */
/* ------------------------------------------------------------------ */
/*
 *  Regras do manual (Color Don'ts) que governam este módulo:
 *   - Os gradientes NUNCA são fill chapado: as paradas só são aplicadas
 *     sobre TEXTURA (ver GradientTexture). Aqui guardamos só os valores.
 *   - Sempre existe um traço de vermelho Ingresse (#FF271A) na família.
 *   - Não se mistura cor entre famílias nem se adiciona cor a uma família.
 *
 *  Por isso os hex abaixo são dados de marca (não há token equivalente no
 *  design system) e vivem isolados neste arquivo.
 */

export const INGRESSE_RED = "#FF271A";

export type VibeId =
    | "from-image"
    | "high-tempo"
    | "communal"
    | "rooted"
    | "swagger"
    | "elegance"
    | "countercultural"
    | "captivating"
    | "unified";

/** Perfil de movimento — a energia da animação casa com a da família. */
export interface VibeMotion {
    /** Multiplicador de duração: <1 mais rápido, >1 mais lento. */
    tempo: number;
    /** Intervalo entre elementos num stagger (s). */
    stagger: number;
}

export interface GradientFamily {
    id: VibeId;
    /** Nome da família no manual. */
    label: string;
    /** Energia em uma palavra (kicker na página). */
    energia: string;
    /** Gêneros a que serve. */
    generos: string;
    /** Descritor curto do manual. */
    descricao: string;
    /** Paradas de cor, topo → base (sempre com vermelho Ingresse). */
    stops: string[];
    /** Palavra que se repete/irradia no hero (tipografia como comportamento). */
    chant: string;
    /** Linha de manifesto do hero. */
    manifesto: string;
    motion: VibeMotion;
}

export const GRADIENT_FAMILIES: Record<VibeId, GradientFamily> = {
    "from-image": {
        id: "from-image",
        label: "From image",
        energia: "Adaptativo",
        generos: "Extraído do pôster do evento",
        descricao: "Duas cores análogas e uma complementar amostradas da imagem, fundidas ao vermelho Ingresse.",
        // Paradas provisórias até a amostragem da imagem (ver imageStops).
        stops: [INGRESSE_RED, "#8A7FB0", "#3A3550", "#15131F"],
        chant: "AO VIVO",
        manifesto: "A cara do seu evento",
        motion: { tempo: 1.05, stagger: 0.09 },
    },
    "high-tempo": {
        id: "high-tempo",
        label: "High Tempo & Full Volume",
        energia: "Eletrizante",
        generos: "Electronic, Funk, Club, EDM",
        descricao: "Força total, amarelo elétrico e a euforia visual de quem não para.",
        stops: ["#08F2F9", "#0095FF", "#C52EC5", INGRESSE_RED, "#E9FF5A", "#F3F3FB"],
        chant: "ELETRIZANTE",
        manifesto: "Live Louder",
        motion: { tempo: 0.7, stagger: 0.04 },
    },
    communal: {
        id: "communal",
        label: "Communal & Comforting",
        energia: "Acolhedor",
        generos: "Pagode, Samba, Salsa, Cumbia, Sertanejo",
        descricao: "Calor e união, num laranja lavado de sol que soa familiar.",
        stops: [INGRESSE_RED, "#EA8BA9", "#F5D8B8", "#EFB926", "#F47E48"],
        chant: "INESQUECÍVEL",
        manifesto: "A gente vibra junto",
        motion: { tempo: 1, stagger: 0.08 },
    },
    rooted: {
        id: "rooted",
        label: "Rooted & Cultural",
        energia: "Ancestral",
        generos: "Reggae, Reggaeton, Afrofunk",
        descricao: "Identidade cultural num verde de chão, ligado ao movimento coletivo.",
        stops: [INGRESSE_RED, "#EFCD20", "#C9D1D8", "#AAC21D", "#110E07"],
        chant: "ANCESTRAL",
        manifesto: "No ritmo da raiz",
        motion: { tempo: 1.05, stagger: 0.09 },
    },
    swagger: {
        id: "swagger",
        label: "Swagger, Bravado & Grit",
        energia: "Ousado",
        generos: "Rap, Hip-Hop, Trap, Drill",
        descricao: "Força confrontadora, traduzida em azul-marinho e roxo profundos.",
        stops: [INGRESSE_RED, "#CADCEE", "#00709C", "#091D4D", "#1B0828"],
        chant: "OUSADO",
        manifesto: "Sem medo de ser",
        motion: { tempo: 0.85, stagger: 0.05 },
    },
    elegance: {
        id: "elegance",
        label: "Elegance & Thoughtfulness",
        energia: "Sublime",
        generos: "Jazz, Ballet, Clássico, Teatro",
        descricao: "Energia contida e refinada, expressa em brancos e cinzas suaves.",
        stops: [INGRESSE_RED, "#979AD8", "#BEDCF8", "#DCECF0"],
        chant: "SUBLIME",
        manifesto: "Sinta a beleza",
        motion: { tempo: 1.4, stagger: 0.14 },
    },
    countercultural: {
        id: "countercultural",
        label: "Countercultural Rawness",
        energia: "Cru",
        generos: "Rock, Punk, Metal, Hardcore, Grunge",
        descricao: "Poder indomado, rosa sujo de show de garagem, estética alta e crua.",
        stops: [INGRESSE_RED, "#C968C7", "#E0E2E5", "#8B9A4E", "#2C3C3B", "#240F11"],
        chant: "INTENSO",
        manifesto: "Rock hits different",
        motion: { tempo: 0.8, stagger: 0.05 },
    },
    captivating: {
        id: "captivating",
        label: "Captivating Focus",
        energia: "Revelador",
        generos: "Palestras, Conferências, Speaker",
        descricao: "Foco hipnótico — duas cores extraídas da imagem fundidas ao vermelho.",
        stops: [INGRESSE_RED, "#8F22B2", "#024FD3", "#00102A"],
        chant: "REVELADOR",
        manifesto: "Ideas come alive",
        motion: { tempo: 1.1, stagger: 0.1 },
    },
    unified: {
        id: "unified",
        label: "Unified Cadence",
        energia: "Cadência",
        generos: "Esportes, Jogos",
        descricao: "Cadência coletiva em preto e branco, com o traço de vermelho do clube.",
        stops: [INGRESSE_RED, "#E0E2E5", "#1A1A1A", "#000000"],
        chant: "VIBRE",
        manifesto: "Vibre junto",
        motion: { tempo: 0.95, stagger: 0.07 },
    },
};

export const VIBE_LIST = Object.values(GRADIENT_FAMILIES);

export const getFamily = (id: VibeId): GradientFamily => GRADIENT_FAMILIES[id] ?? GRADIENT_FAMILIES.communal;

/** Gradiente linear das paradas (para uso EXCLUSIVO sobre textura). */
export const gradientCss = (family: GradientFamily, angle = 165): string =>
    `linear-gradient(${angle}deg, ${family.stops.join(", ")})`;

/** Gradiente radial — usado em manchas/glows de fundo. */
export const radialCss = (family: GradientFamily, at = "50% 30%"): string =>
    `radial-gradient(120% 90% at ${at}, ${family.stops.join(", ")})`;

/** Palavras que irradiam no fundo do hero (tipografia como comportamento). */
export const CHANT_WORDS = ["ARREPIANTE", "ELETRIZANTE", "IMPRESSIONANTE", "INESQUECÍVEL", "AO VIVO"];

/* ------------------------------------------------------------------ */
/*  From image — extração adaptativa de cor                           */
/* ------------------------------------------------------------------ */

export const FROM_IMAGE_ID: VibeId = "from-image";

export type RGB = [number, number, number];

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    let h = 0;
    let s = 0;
    if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            default:
                h = (r - g) / d + 4;
        }
        h *= 60;
    }
    return [h, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) [r, g] = [c, x];
    else if (h < 120) [r, g] = [x, c];
    else if (h < 180) [g, b] = [c, x];
    else if (h < 240) [g, b] = [x, c];
    else if (h < 300) [r, b] = [x, c];
    else [r, b] = [c, x];
    const to = (v: number) =>
        Math.round((v + m) * 255)
            .toString(16)
            .padStart(2, "0");
    return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Monta as paradas do gradiente "From image" a partir de uma cor-base
 * amostrada do pôster: duas análogas (±32°) e uma complementar (+180°),
 * sempre com o vermelho Ingresse como heartbeat unificador.
 */
export function imageStops(base: RGB): string[] {
    const [h, s] = rgbToHsl(base[0], base[1], base[2]);
    const sat = Math.min(0.9, Math.max(0.5, s)); // garante cor mesmo em imagem dessaturada
    // Lidera com a cor REAL do banner: vermelho Ingresse + tons em volta da cor
    // amostrada (2 análogas) e a complementar só como âncora escura no fim.
    const analogClaro = hslToHex(h - 26, sat, 0.7);
    const principal = hslToHex(h, sat, 0.55);
    const analogEscuro = hslToHex(h + 26, sat, 0.42);
    const ancora = hslToHex(h + 180, sat * 0.5, 0.18); // complementar escura, discreta
    return [INGRESSE_RED, analogClaro, principal, analogEscuro, ancora];
}
