import GremioLogo from "../../../../assets/gremio-logo.webp";
import GremioHero from "../../../../assets/gremio-hero.webp";
import PosterTaca from "../../../../assets/gremio-poster-taca.jpeg";
import PosterBook from "../../../../assets/gremio-poster-book.jpeg";
import PosterTour from "../../../../assets/gremio-poster-tour.jpeg";
import PosterPacotes from "../../../../assets/gremio-poster-pacotes.jpeg";
import BotafogoHeader from "../../../../assets/products/bg-header site ingresse.png";
import BotafogoVitoria from "../../../../assets/products/Brasileirao-Ingresse_BFRxECV_230726.png";
import BotafogoSantos from "../../../../assets/products/Brasileirao-Ingresse_BFRxSFC_160726.png";

/* ------------------------------------------------------------------ */
/*  Team-driven landing config                                        */
/* ------------------------------------------------------------------ */

export interface PosterEvento {
    id: string;
    title: string;
    subtitle?: string;
    date: string;
    description: string;
    imageUrl: string;
}

/**
 * Brand palette consumed generically by the landing template.
 * `accent` is the intrinsic brand color; the rest are RGBA overlays/tints
 * derived from it so the template stays parameterized.
 */
export interface TimePalette {
    /** Solid brand accent (buttons, dates, footer bg). */
    accent: string;
    /** Full-page background. */
    pageBg: string;
    /** Text color used on top of the accent (footer/buttons). */
    onAccent: string;
    /** Subtle accent tint background (notice card). */
    accentSoft: string;
    /** Accent ring/border color. */
    accentRing: string;
    /** Notice-card inline border color (used by FeaturedIcon overrides). */
    accentBorder: string;
    /** Badge (V2 hero pill) background. */
    badgeBg: string;
    /** Badge (V2 hero pill) inset ring. */
    badgeRing: string;
}

export interface TimeFooter {
    site: string;
    loja: string;
    fale: string;
    siga: string;
    /** Small descriptive line under the "Siga" heading. */
    sigaDescricao: string;
}

export interface TimeConfig {
    id: string;
    nome: string;
    nomeCompleto: string;
    temporada: string;
    heroTitulo: string;
    /** V2 marketing hero title + subtitle. */
    heroV2Titulo: string;
    heroV2Subtitulo: string;
    logo: string;
    hero: string;
    palette: TimePalette;
    /** Cor do FeaturedIcon no card de aviso. Default: "brand". */
    featuredIconColor?: "brand" | "gray";
    eventos: PosterEvento[];
    footer: TimeFooter;
}

/* ------------------------------------------------------------------ */
/*  Grêmio (blue)                                                     */
/* ------------------------------------------------------------------ */

const gremio: TimeConfig = {
    id: "gremio",
    nome: "Grêmio",
    nomeCompleto: "Grêmio Foot-Ball Porto Alegrense",
    temporada: "Temporada 2026 · Arena do Grêmio",
    heroTitulo: "Ingressos para os eventos do Grêmio",
    heroV2Titulo: "Viva cada jogo de pertinho",
    heroV2Subtitulo:
        "Ingressos oficiais para os eventos do Tricolor. Garanta seu lugar e sinta a emoção da torcida ao vivo, do primeiro ao último minuto.",
    logo: GremioLogo,
    hero: GremioHero,
    palette: {
        accent: "#1CA4E3",
        pageBg: "#0a0a0a",
        onAccent: "#ffffff",
        accentSoft: "rgba(28,164,227,0.10)",
        accentRing: "rgba(28,164,227,0.35)",
        accentBorder: "#1CA4E3",
        badgeBg: "rgba(28,164,227,0.25)",
        badgeRing: "rgba(28,164,227,0.6)",
    },
    eventos: [
        {
            id: "taca",
            title: "Grêmio - Taça 2026",
            date: "Junho de 2026",
            description:
                "Registre seu momento ao lado da taça da Libertadores e leve para casa uma lembrança à altura da sua paixão.",
            imageUrl: PosterTaca,
        },
        {
            id: "book",
            title: "Book - Tour Arena Grêmio",
            subtitle: "Arena do Grêmio",
            date: "Junho de 2026",
            description:
                "Um book fotográfico exclusivo em cenários incríveis da casa do Tricolor — do gramado aos bastidores.",
            imageUrl: PosterBook,
        },
        {
            id: "tour",
            title: "Tour Arena do Grêmio - Junho",
            date: "Junho de 2026",
            description:
                "Conheça os bastidores da Arena e mergulhe na história do clube no Museu Hermínio Bittencourt.",
            imageUrl: PosterTour,
        },
        {
            id: "pacotes",
            title: "Pacotes Brasileirão",
            date: "Junho de 2026",
            description:
                "Pra quem não abre mão do alento: pacotes para acompanhar o Tricolor durante todo o Brasileirão.",
            imageUrl: PosterPacotes,
        },
    ],
    footer: {
        site: "Site Grêmio Oficial",
        loja: "Loja Grêmio",
        fale: "Fale com o Grêmio",
        siga: "Siga o Grêmio",
        sigaDescricao: "As novidades do clube e opinião da torcida estão nas redes sociais.",
    },
};

/* ------------------------------------------------------------------ */
/*  Botafogo (black & white)                                          */
/* ------------------------------------------------------------------ */

const BOTAFOGO_LOGO = "https://logodetimes.com/times/botafogo/logo-botafogo-2048.png";

const botafogo: TimeConfig = {
    id: "botafogo",
    nome: "Botafogo",
    nomeCompleto: "Botafogo de Futebol e Regatas",
    temporada: "Temporada 2026 · Estádio Nilton Santos",
    heroTitulo: "Ingressos para os jogos do Botafogo",
    heroV2Titulo: "Viva cada jogo de pertinho",
    heroV2Subtitulo:
        "Ingressos oficiais para os jogos do Fogão. Garanta seu lugar no Nilton Santos e sinta a emoção da estrela solitária ao vivo, do primeiro ao último minuto.",
    logo: BOTAFOGO_LOGO,
    hero: BotafogoHeader,
    featuredIconColor: "gray",
    palette: {
        accent: "#111111",
        pageBg: "#0a0a0a",
        onAccent: "#ffffff",
        accentSoft: "rgba(255,255,255,0.06)",
        accentRing: "rgba(255,255,255,0.25)",
        accentBorder: "#ffffff",
        badgeBg: "rgba(255,255,255,0.14)",
        badgeRing: "rgba(255,255,255,0.5)",
    },
    eventos: [
        {
            id: "santos",
            title: "Botafogo x Santos",
            subtitle: "Brasileirão 2026 · 19ª rodada",
            date: "Quinta, 16 de julho de 2026 · 19h30",
            description:
                "O Fogão recebe o Santos no Nilton Santos pela 19ª rodada do Brasileirão. Garanta seu lugar e empurre o Glorioso.",
            imageUrl: BotafogoSantos,
        },
        {
            id: "vitoria",
            title: "Botafogo x Vitória",
            subtitle: "Brasileirão 2026 · 19ª rodada",
            date: "Quinta, 23 de julho de 2026 · 19h30",
            description:
                "Mais uma noite de Brasileirão no Nilton Santos: o Botafogo enfrenta o Vitória diante da sua torcida.",
            imageUrl: BotafogoVitoria,
        },
    ],
    footer: {
        site: "Site Botafogo Oficial",
        loja: "Loja Botafogo",
        fale: "Fale com o Botafogo",
        siga: "Siga o Botafogo",
        sigaDescricao: "As novidades do clube e opinião da torcida estão nas redes sociais.",
    },
};

export const TIMES: TimeConfig[] = [gremio, botafogo];

export const timeById = (id: string) => TIMES.find((t) => t.id === id);
