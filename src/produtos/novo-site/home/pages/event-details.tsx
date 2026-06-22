import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
    BellRinging02,
    Calendar,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Clock,
    HomeLine,
    LinkExternal02,
    MarkerPin01,
    MarkerPin02,
    Tag01,
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import {
    CLASSIFICACOES,
    EventConfigSlideout,
    defaultEventConfig,
    enumerateDays,
    type EventConfig,
    type EventStatus,
} from "../../components/EventConfigSlideout";
import { FROM_IMAGE_ID, INGRESSE_RED, getFamily, gradientCss, type GradientFamily, type VibeMotion } from "../../components/gradient-families";
import { MatchupCover } from "../components/MatchupCover";
import { GradientTexture, NOISE_URI } from "../components/GradientTexture";
import { useImagePalette } from "../utils/image-palette";
import { getEvento, type Confronto, type EventStatus as MockStatus } from "../data/events";
import meshGradient from "../assets/mesh-gradient.png";
import sideTexture from "../assets/side-bg-texture.svg";
import { Footer, HeaderNav } from "../components/SiteChrome";
import bannerImg from "../assets/banner.png";
import lineupJoao from "../assets/lineup-joao.png";
import lineupJota from "../assets/lineup-jota.png";
import lineupMestrinho from "../assets/lineup-mestrinho.png";
import produtorVibra from "../assets/produtor-vibra.png";
import produtorOnda from "../assets/produtor-onda.png";

/* ------------------------------------------------------------------ */
/*  Dados                                                             */
/* ------------------------------------------------------------------ */

interface Atracao {
    name: string;
    img: string;
    dates: { day: string; time?: string }[];
}

const LINEUP: Atracao[] = [
    { name: "João Gomes", img: lineupJoao, dates: [{ day: "19/12", time: "00h" }, { day: "22/12", time: "00h" }] },
    {
        name: "Jota.Pê",
        img: lineupJota,
        dates: [{ day: "19/12", time: "00h" }, { day: "20/12", time: "00h" }, { day: "21/12", time: "00h" }, { day: "22/12", time: "00h" }],
    },
    { name: "Mestrinho", img: lineupMestrinho, dates: [{ day: "19/12", time: "00h" }, { day: "20/12" }, { day: "22/12", time: "00h" }] },
];

const HORARIOS_VARIADOS = ["00h", "21h", "22h", "23h", "19h"];

const COMPLEMENTOS: { nome: string; icon: typeof Tag01; cardapio: boolean }[] = [
    { nome: "Open bar", icon: Tag01, cardapio: true },
    { nome: "Open food", icon: Tag01, cardapio: true },
    { nome: "Estacionamento", icon: MarkerPin02, cardapio: false },
];

const DESCRICAO_RESUMO = [
    "VILLAGE SUPERBET ⚽",
    "O grito da torcida. O brilho do palco. A vibração que arrepia. 🇧🇷",
    "Serão mais de 30 dias de evento, mais de 100 atrações e aquela sensação de viver uma experiência única no Rio de Janeiro!",
    "O maior parque de celebração do mundial está de volta! ⚽✨",
    "Preparem-se para jogar junto em mais uma edição histórica! 🙌",
];

const DESCRICAO_COMPLETO = [
    "O evento acontece no Pião do Prado, parte central do Jockey Club Brasileiro, com vista para o Cristo Redentor e a Pedra da Gávea.",
    "Torcida, surpresas, diversão, muita música, alegria e inúmeros encontros acontecerão por aqui! Nosso parque contará com shows, telões, uma extensa praça de alimentação, brinquedos como roda gigante, escorrega e tirolesa.",
    "Endereço: Praça Santos Dumont, 31 - Gávea",
    "CLASSIFICAÇÃO ETÁRIA: 18 anos",
    "*Menores de idade poderão entrar no evento somente se acompanhados dos pais.",
];

const FAQ = [
    {
        q: "A transferência do segundo ingresso é obrigatória?",
        a: "Não. A transferência é opcional e pode ser feita pelo app da Ingresse a qualquer momento até o início do evento, sem custo. Cada ingresso libera o QR Code para o titular atual.",
    },
    {
        q: "Quais documentos são aceitos para comprovação da meia-entrada?",
        a: "Carteira de estudante válida, documento que comprove a condição (PCD, idoso) ou os documentos previstos na Lei da Meia-Entrada. A conferência é feita na portaria junto com um documento oficial com foto.",
    },
    {
        q: "Quais são as condições para compra da meia-entrada social/solidária?",
        a: "A meia social/solidária é liberada mediante a doação de 1 kg de alimento não perecível, entregue na entrada do evento, conforme regras do organizador e a legislação vigente.",
    },
    {
        q: "Qual é a idade mínima para acessar o evento?",
        a: "16 anos. Menores de 16 não entram, mesmo acompanhados. Leve um documento oficial com foto — ele será conferido na entrada junto com o ingresso.",
    },
    {
        q: "O local possui estacionamento?",
        a: "Sim. O local conta com estacionamento, que pode ser adquirido como complemento na sua compra ou pago no próprio dia, conforme disponibilidade.",
    },
];

/* ------------------------------------------------------------------ */
/*  Página                                                            */
/* ------------------------------------------------------------------ */

/** Mapeia um evento do mock (via ?ev=) para a config da página. */
function configFromParam(ev: string | null): EventConfig {
    const e = ev ? getEvento(ev) : null;
    if (!e) return defaultEventConfig;
    const statusMap: Record<MockStatus, EventStatus> = {
        venda: "venda-ativa",
        esgotado: "soldout-com-lista",
        "pre-venda": "aguardando-abertura",
        "fura-fila": "venda-ativa",
    };
    return {
        ...defaultEventConfig,
        nomeEvento: e.titulo,
        localNome: e.local,
        localEndereco: e.cidade,
        preco: e.preco === 0 ? "Gratuito" : `R$ ${e.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        dataInicio: e.data,
        dataFim: e.data,
        status: statusMap[e.status],
        bannerUrl: e.cover ?? "",
        temLineup: e.id === "dominguinho",
    };
}

export function EventDetails() {
    const [params] = useSearchParams();
    const [config, setConfig] = useState<EventConfig>(() => configFromParam(params.get("ev")));
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    // Jogo principal de futebol: confronto vira o "pôster" e as cores vêm dos times.
    const evento = useMemo(() => getEvento(params.get("ev") ?? ""), [params]);
    const confronto = evento?.futebol ?? null;

    // Pôster: URL configurável (vazio = padrão).
    const poster = config.bannerUrl.trim() || bannerImg;

    // "From image": esquema de cores extraído do banner (desativado no futebol — sem imagem).
    const palette = useImagePalette(poster, config.vibe === FROM_IMAGE_ID && !confronto);
    const family = useMemo<GradientFamily>(() => {
        const base = getFamily(config.vibe);
        if (config.vibe === FROM_IMAGE_ID && palette) {
            return { ...base, stops: [palette.primary, palette.accent, palette.base] };
        }
        return base;
    }, [config.vibe, palette]);

    // Fundo do hero.
    const isImg = config.vibe === FROM_IMAGE_ID && !!palette;
    const heroBg = confronto
        ? `linear-gradient(160deg, ${confronto.casa.cor} 0%, #0d0d12 52%, ${confronto.fora.cor} 100%)`
        : isImg
          ? `linear-gradient(160deg, ${palette!.primary} 0%, ${palette!.base} 100%)`
          : gradientCss(family, 160);
    const heroAccent = confronto ? INGRESSE_RED : isImg ? palette!.accent : (family.stops[1] ?? family.stops[0]);

    // Mini-barra: aparece por cima do header quando o hero sai da tela.
    const heroRef = useRef<HTMLElement>(null);
    const [showMini, setShowMini] = useState(false);
    useEffect(() => {
        const onScroll = () => {
            const el = heroRef.current;
            if (!el) return;
            setShowMini(el.getBoundingClientRect().bottom < 140);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    const sectionTabs: SectionTab[] = [
        ...(config.temLineup ? [{ id: "lineup", label: "Lineup" }] : []),
        { id: "descricao", label: "Descrição" },
        { id: "endereco", label: "Endereço" },
        { id: "experiencia", label: "Experiência" },
        { id: "faq", label: "FAQ" },
    ];

    return (
        <div className="min-h-screen bg-primary text-primary">
            <HeaderNav onOpenConfig={() => setIsConfigOpen(true)} />

            {/* Mini-barra fixa — surge por cima do header ao rolar além do hero */}
            <AnimatePresence>
                {showMini && (
                    <motion.div
                        key="minibar"
                        initial={{ y: "-100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-100%" }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-x-0 top-0 z-50 border-b border-secondary bg-primary/95 backdrop-blur-md"
                    >
                        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:px-8">
                            {confronto ? (
                                <div className="flex h-11 shrink-0 items-center gap-1">
                                    {[confronto.casa, confronto.fora].map((t) =>
                                        t.escudo ? <img key={t.abbr} src={t.escudo} alt={t.nome} className="size-9 object-contain" /> : null,
                                    )}
                                </div>
                            ) : (
                                <img src={poster} alt="" className="h-11 w-9 shrink-0 rounded-sm object-cover" />
                            )}
                            <div className="flex min-w-0 flex-1 flex-col">
                                <p className="line-clamp-1 text-sm font-bold text-primary">{config.nomeEvento}</p>
                                <span className="line-clamp-1 text-xs text-tertiary">
                                    <HeroDateText config={config} />
                                </span>
                            </div>
                            <MiniAge value={config.classificacao} />
                            <Button size="sm" color="primary" className="max-sm:hidden">
                                Garantir ingresso
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero full-bleed — a página veste a energia do evento */}
            <Hero heroRef={heroRef} config={config} family={family} poster={poster} heroBg={heroBg} heroAccent={heroAccent} confronto={confronto} />

            {/* Navegação de seções — fixa abaixo do header, largura total */}
            <div className="sticky top-16 z-30 border-b border-secondary bg-primary/90 backdrop-blur-md">
                <div className="mx-auto max-w-2xl px-5">
                    <SectionTabsBar tabs={sectionTabs} family={family} />
                </div>
            </div>

            {/* Conteúdo editorial */}
            <main className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-5 pt-14 pb-40 lg:gap-20 lg:pb-32">
                {config.temLineup && (
                    <Section id="lineup">
                        <Lineup config={config} />
                    </Section>
                )}
                <Section id="descricao">
                    <Descricao family={family} />
                </Section>
                <Section id="endereco">
                    <ComoChegar config={config} family={family} />
                </Section>
                <Reveal>
                    <ProduzidoPor />
                </Reveal>
                <Section id="experiencia">
                    <Complementos />
                </Section>
                <Section id="faq">
                    <Faq />
                </Section>
                <Reveal>
                    <HelpCta family={family} />
                </Reveal>
                <Reveal>
                    <RegrasVenda />
                </Reveal>
            </main>

            <Footer />

            {/* Barra de venda persistente — fade/blur no topo, mesma lógica de status */}
            <div className="fixed inset-x-0 bottom-0 z-30">
                <div
                    aria-hidden="true"
                    className="h-8 backdrop-blur-md"
                    style={{
                        WebkitMaskImage: "linear-gradient(to bottom, transparent, black)",
                        maskImage: "linear-gradient(to bottom, transparent, black)",
                    }}
                />
                <div className="border-t border-secondary bg-primary/85 backdrop-blur-lg">
                    <div className="mx-auto max-w-2xl px-5 pt-3 pb-7 lg:max-w-3xl">
                        <SaleStatus status={config.status} preco={config.preco} />
                    </div>
                </div>
            </div>

            <EventConfigSlideout isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} config={config} onChange={setConfig} />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Motion helpers                                                    */
/* ------------------------------------------------------------------ */

/** Reveal no scroll — entrada de baixo, dispara uma vez ao entrar na viewport. */
function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
    const reduce = useReducedMotion();
    if (reduce) return <div className={className}>{children}</div>;
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
        >
            {children}
        </motion.div>
    );
}

/** Seção navegável (âncora + reveal). */
function Section({ id, children }: { id: string; children: ReactNode }) {
    return (
        <div id={id} className="scroll-mt-32">
            <Reveal>{children}</Reveal>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                              */
/* ------------------------------------------------------------------ */

function Hero({
    config,
    family,
    poster,
    heroBg,
    heroAccent,
    confronto,
    heroRef,
}: {
    config: EventConfig;
    family: GradientFamily;
    poster: string;
    heroBg: string;
    heroAccent: string;
    confronto: Confronto | null;
    heroRef?: RefObject<HTMLElement | null>;
}) {
    const reduce = useReducedMotion();
    return (
        <section ref={heroRef} className="relative">
            <div className="relative isolate h-[calc(100dvh-4rem)] min-h-[560px] overflow-hidden">
                {/* Fundo: gradiente LINEAR da cor dominante */}
                <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: heroBg }} />

                {/* Vídeo (duotone) ou malha (mesh) + texturas laterais da marca */}
                <HeroBackdrop accent={heroAccent} videoUrl={config.heroVideoUrl} reduce={!!reduce} />

                {/* Escurecimento só na base — garante contraste do texto branco sem apagar a cor
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-b from-transparent via-black/35 to-black/80"
                /> */}

                <div className="relative z-10 mx-auto flex h-[calc(100dvh-4rem)] min-h-[560px] max-w-5xl flex-col items-center justify-center gap-5 px-5 py-6 text-center text-white">
                    {/* Pôster (ou confronto, no jogo principal) — destaque na primeira dobra */}
                    {confronto ? (
                        <motion.div
                            initial={reduce ? false : { opacity: 0, scale: 0.92, y: 24 }}
                            animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                            className="relative aspect-square w-[min(80vw,320px)] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15 lg:w-[420px]"
                        >
                            <MatchupCover confronto={confronto} />
                        </motion.div>
                    ) : (
                        <motion.img
                            src={poster}
                            alt={config.nomeEvento}
                            initial={reduce ? false : { opacity: 0, scale: 0.92, y: 24 }}
                            animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                            className="h-auto max-h-[42vh] w-auto max-w-[min(74vw,300px)] rounded-2xl shadow-2xl ring-1 ring-white/15 lg:max-w-[420px]"
                        />
                    )}

                    {/* Título cinético */}
                    <KineticTitle text={config.nomeEvento} motionCfg={family.motion} reduce={!!reduce} />

                    {/* Data + classificação */}
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        animate={reduce ? undefined : { opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.45 }}
                        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
                    >
                        <span className="flex items-center gap-2 text-sm font-medium text-white/85">
                            <Calendar className="size-4 shrink-0" />
                            <HeroDateText config={config} />
                        </span>
                        <span aria-hidden="true" className="h-4 w-px bg-white/25" />
                        <span className="flex items-center gap-2 text-sm font-medium text-white/85">
                            <Clock className="size-4 shrink-0" />
                            A partir das {config.horarioTipo === "fixo" ? config.horarioFixo : HORARIOS_VARIADOS[0]}
                        </span>
                        <span aria-hidden="true" className="h-4 w-px bg-white/25" />
                        <span className="flex items-center gap-2 text-sm font-medium text-white/85">
                            <MarkerPin01 className="size-4 shrink-0" />
                            {config.localNome}
                        </span>
                        <AgeMark value={config.classificacao} />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

/** Extrai o ID de um vídeo do YouTube (watch, youtu.be, shorts, embed, live). */
function youtubeId(url: string): string | null {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
}

/**
 * Fundo do hero. Com URL de vídeo → footage em duotone (mix-blend-luminosity).
 * Sem vídeo → textura cimática (máscara) tingida com a cor de destaque do banner.
 */
/** Velocidade do vídeo de fundo (mais lento = mais cinematográfico). */
const HERO_VIDEO_RATE = 1;

function HeroBackdrop({ accent, videoUrl, reduce }: { accent: string; videoUrl: string; reduce: boolean }) {
    const url = videoUrl.trim();
    const ytId = url ? youtubeId(url) : null;
    const active = !!url && !reduce;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // YouTube: reduz a velocidade via IFrame API (postMessage). Tenta até o player ficar pronto.
    useEffect(() => {
        if (!active || !ytId) return;
        let tries = 0;
        const id = setInterval(() => {
            const win = iframeRef.current?.contentWindow;
            if (win) {
                win.postMessage(JSON.stringify({ event: "command", func: "setPlaybackRate", args: [HERO_VIDEO_RATE] }), "*");
                win.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
            }
            if (++tries > 12) clearInterval(id);
        }, 600);
        return () => clearInterval(id);
    }, [active, ytId]);

    // Arquivo de vídeo direto: define playbackRate.
    useEffect(() => {
        if (!active || ytId) return;
        const v = videoRef.current;
        if (v) v.playbackRate = HERO_VIDEO_RATE;
    }, [active, ytId, url]);

    if (active) {
        // Dimensões que cobrem o hero mantendo 16:9 (recorta a UI do player).
        const coverStyle = {
            width: "max(100vw, calc((100dvh - 4rem) * 1.7778))",
            height: "max(calc(100dvh - 4rem), 56.25vw)",
        } as const;
        // opacity menor (não compete com o texto) + motion blur direcional + duotone na família.
        const coverCls =
            "pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-55 mix-blend-luminosity [filter:url(#hero-motion-blur)_contrast(1.05)_saturate(1.1)]";

        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const media = ytId ? (
            <iframe
                ref={iframeRef}
                aria-hidden="true"
                title="Vídeo de fundo do evento"
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&playsinline=1&modestbranding=1&rel=0&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(origin)}`}
                allow="autoplay; encrypted-media"
                className={coverCls}
                style={coverStyle}
            />
        ) : (
            // Arquivo de vídeo direto (.mp4/.webm) como bônus.
            <video ref={videoRef} aria-hidden="true" src={url} autoPlay loop muted playsInline className={cx(coverCls, "object-cover")} style={coverStyle} />
        );

        return (
            <>
                {/* Filtro de motion blur direcional (rastro horizontal). */}
                <svg aria-hidden="true" className="absolute size-0">
                    <filter id="hero-motion-blur" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur stdDeviation="3 9" edgeMode="duplicate" />
                    </filter>
                </svg>
                {media}
                {/* Grão reforçado sobre o vídeo. */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 mix-blend-overlay"
                    style={{ backgroundImage: `url("${NOISE_URI}")`, backgroundSize: "160px 160px", opacity: 0.4 }}
                />
            </>
        );
    }

    // Malha (mesh) dá forma orgânica ao gradiente; texturas laterais da marca
    // (mascaradas, na cor de destaque) entram nas duas bordas; grão sutil.
    const sideStyle = {
        backgroundColor: accent,
        WebkitMaskImage: `url(${sideTexture})`,
        maskImage: `url(${sideTexture})`,
        WebkitMaskSize: "auto 100%",
        maskSize: "auto 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
    } as const;
    return (
        <>
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 mix-blend-overlay"
                style={{ backgroundImage: `url(${meshGradient})`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
            {/* Texturas da marca nas laterais (esquerda e espelhada à direita) */}
            <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 -z-10 w-[42vw] max-w-[300px]"
                style={{ ...sideStyle, WebkitMaskPosition: "left center", maskPosition: "left center" }}
            />
            <div
                aria-hidden="true"
                className="absolute inset-y-0 right-0 -z-10 w-[42vw] max-w-[300px] -scale-x-100"
                style={{ ...sideStyle, WebkitMaskPosition: "left center", maskPosition: "left center" }}
            />
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 opacity-[0.12] mix-blend-soft-light"
                style={{ backgroundImage: `url("${NOISE_URI}")`, backgroundSize: "200px 200px" }}
            />
        </>
    );
}

/** Título grande com palavras subindo em sequência (entrada de fonte). */
/** Tamanho do título por faixa de caracteres — mantém ~2 linhas bem ajustadas. */
function titleSizeClass(len: number): string {
    if (len <= 16) return "text-display-md lg:text-display-2xl";
    if (len <= 26) return "text-display-sm lg:text-display-xl";
    if (len <= 38) return "text-display-xs lg:text-display-lg";
    return "text-2xl lg:text-display-md";
}

function KineticTitle({ text, motionCfg, reduce }: { text: string; motionCfg: VibeMotion; reduce: boolean }) {
    const words = text.split(" ");
    return (
        <h1 className={cx("leading-[0.92] font-extrabold tracking-tight text-white uppercase", titleSizeClass(text.length))}>
            {words.map((word, i) => (
                <span key={i} className="-mt-[0.22em] inline-block overflow-hidden pt-[0.22em] pr-[0.22em] align-top">
                    <motion.span
                        className="inline-block"
                        initial={reduce ? false : { y: "110%" }}
                        animate={reduce ? undefined : { y: 0 }}
                        transition={{ duration: 0.85 * motionCfg.tempo, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * motionCfg.stagger }}
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </h1>
    );
}

/* ------------------------------------------------------------------ */
/*  Tab fixa de seções — scroll-spy + barra de progresso              */
/* ------------------------------------------------------------------ */

interface SectionTab {
    id: string;
    label: string;
}

/** Progresso de rolagem APENAS pelas seções navegáveis (1ª → última tab). 0 → 1. */
function useSectionsProgress(firstId: string | undefined, lastId: string | undefined): number {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        if (!firstId || !lastId) return;
        const onScroll = () => {
            const first = document.getElementById(firstId);
            const last = document.getElementById(lastId);
            if (!first || !last) return;
            const start = first.getBoundingClientRect().top + window.scrollY;
            const end = last.getBoundingClientRect().bottom + window.scrollY;
            const span = end - start;
            const seen = window.scrollY + window.innerHeight - start;
            setProgress(span > 0 ? Math.min(1, Math.max(0, seen / span)) : 0);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, [firstId, lastId]);
    return progress;
}

/** Seção atualmente no topo da viewport (descontando o offset da tab fixa). */
function useScrollSpy(ids: string[], offset: number): string | null {
    const key = ids.join(",");
    const [active, setActive] = useState<string | null>(ids[0] ?? null);
    useEffect(() => {
        const list = key ? key.split(",") : [];
        const onScroll = () => {
            let current = list[0] ?? null;
            for (const id of list) {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top - offset <= 0) current = id;
            }
            setActive(current);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [key, offset]);
    return active;
}

function SectionTabsBar({ tabs, family }: { tabs: SectionTab[]; family: GradientFamily }) {
    const active = useScrollSpy(
        tabs.map((t) => t.id),
        130,
    );
    const progress = useSectionsProgress(tabs[0]?.id, tabs[tabs.length - 1]?.id);
    const navRef = useRef<HTMLElement>(null);
    const activeRef = useRef<HTMLButtonElement>(null);

    // Mantém a tab ativa visível (centraliza no scroll horizontal — mobile).
    useEffect(() => {
        const nav = navRef.current;
        const btn = activeRef.current;
        if (!nav || !btn) return;
        const target = btn.offsetLeft - (nav.clientWidth - btn.clientWidth) / 2;
        nav.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }, [active]);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        const y = el.getBoundingClientRect().top + window.scrollY - 116;
        window.scrollTo({ top: y, behavior: "smooth" });
    };

    return (
        <div className="relative">
            <nav
                ref={navRef}
                aria-label="Seções do evento"
                className="relative flex w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {tabs.map((tab) => {
                    const isActive = active === tab.id;
                    return (
                        <button
                            key={tab.id}
                            ref={isActive ? activeRef : undefined}
                            type="button"
                            onClick={() => scrollTo(tab.id)}
                            aria-current={isActive || undefined}
                            className={cx(
                                "flex-1 px-3 py-3.5 text-center text-sm font-semibold whitespace-nowrap transition-colors duration-100",
                                isActive ? "text-primary" : "text-tertiary hover:text-secondary",
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
            {/* Barra de progresso — vestida com o gradiente da família */}
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px]">
                <div
                    className="h-full transition-[width] duration-150 ease-out"
                    style={{ width: `${progress * 100}%`, backgroundImage: gradientCss(family, 90) }}
                />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Marca Ingresse                                                    */
/* ------------------------------------------------------------------ */

function IngresseMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 30" fill="currentColor" className={className} aria-hidden="true">
            <path d="M36.9121 0.00116609C35.3956 -0.0279861 33.8001 0.718894 32.6234 1.87041C31.8713 2.60621 30.8754 3.03067 29.9732 3.03067C29.0703 3.03067 28.3736 2.58872 28.0968 1.85466C27.6739 0.734053 26.6021 0 25.1185 0C23.635 0 22.0849 0.73347 20.9317 1.85466C20.1773 2.58814 19.192 3.03067 18.2892 3.03067C17.3869 3.03067 16.6672 2.60621 16.3945 1.87041C15.9675 0.718894 14.8592 -0.0279861 13.3238 0.00116609C10.9397 0.0466436 8.39022 1.9911 7.63637 4.33727C6.87252 6.71376 8.19528 8.63664 10.5976 8.63664C11.9881 8.63664 13.4357 7.99238 14.5606 6.98954C15.3845 6.2549 16.4199 5.83395 17.3639 5.83395C18.3086 5.83395 19.0689 6.25549 19.4146 6.98954C19.8864 7.99238 20.9147 8.63664 22.3046 8.63664C23.6945 8.63664 25.1427 7.99238 26.2676 6.98954C27.0915 6.2549 28.1268 5.83395 29.0709 5.83395C30.0156 5.83395 30.7759 6.25549 31.1216 6.98954C31.5934 7.99238 32.6216 8.63664 34.0116 8.63664C36.4144 8.63664 38.9893 6.71318 39.7738 4.33727C40.5494 1.99168 39.2661 0.0466436 36.9121 0.00116609Z" />
            <path d="M29.7911 20.1518C30.4831 18.0278 32.6033 16.2611 34.7612 15.8927C35.2477 15.8093 35.7094 15.4099 35.8602 14.9475L37.0593 11.2662C37.2324 10.7345 36.9374 10.3036 36.4008 10.3036H7.12394C6.58682 10.3036 6.01142 10.7345 5.83827 11.2662L4.63919 14.9475C4.48842 15.4099 4.68984 15.8099 5.12212 15.8927C7.03972 16.2611 8.00911 18.0278 7.31711 20.1518C6.6251 22.2758 4.50491 24.0425 2.34703 24.4109C1.86056 24.4943 1.39883 24.8937 1.24806 25.3561L0.0495637 29.0374C-0.123585 29.5691 0.171475 30 0.708001 30H29.9843C30.5214 30 31.0968 29.5691 31.27 29.0374L32.4691 25.3561C32.6198 24.8937 32.4184 24.4937 31.9861 24.4109C30.0685 24.0425 29.0991 22.2758 29.7911 20.1518Z" />
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/*  Texto de datas                                                    */
/* ------------------------------------------------------------------ */

const WEEKDAYS_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const parseDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
};

/** Ex.: "sábado 19 de dez" (longo: "sábado 19 de dezembro"). */
const fmtDate = (iso: string, longMonth: boolean) => {
    const dt = parseDate(iso);
    const months = longMonth ? MONTHS_LONG : MONTHS_SHORT;
    return `${WEEKDAYS_LONG[dt.getDay()]} ${dt.getDate()} de ${months[dt.getMonth()]}`;
};

/** Resumo curto de data para o hero (uma linha). */
function HeroDateText({ config }: { config: EventConfig }) {
    const dias = enumerateDays(config.dataInicio, config.dataFim);
    if (dias.length === 0) return null;
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    if (dias.length === 1) return <>{cap(fmtDate(config.dataInicio, false))}</>;
    const ini = parseDate(config.dataInicio);
    const fim = parseDate(config.dataFim);
    return (
        <>
            {ini.getDate()} a {fim.getDate()} de {MONTHS_LONG[fim.getMonth()]}
        </>
    );
}


/** Classificação compacta para a mini-barra (fundo claro). */
function MiniAge({ value = "16" }: { value?: string }) {
    const classif = CLASSIFICACOES.find((c) => c.id === value) ?? CLASSIFICACOES[4];
    return (
        <span className="grid size-7 shrink-0 place-items-center rounded-xs text-xs font-bold text-white" style={{ backgroundColor: classif.cor }}>
            {classif.id === "L" ? "L" : classif.id}
        </span>
    );
}

/** Classificação no hero — texto claro sobre fundo escuro. */
function AgeMark({ value = "16" }: { value?: string }) {
    const classif = CLASSIFICACOES.find((c) => c.id === value) ?? CLASSIFICACOES[4];
    return (
        <span className="flex items-center gap-1.5">
            <span className="grid size-6 place-items-center rounded-xs text-sm font-semibold text-white" style={{ backgroundColor: classif.cor }}>
                {classif.id === "L" ? "L" : classif.id}
            </span>
            <span className="text-sm text-white/70">{classif.legenda}</span>
        </span>
    );
}

/* ------------------------------------------------------------------ */
/*  Status de venda                                                   */
/* ------------------------------------------------------------------ */

function SaleStatus({ status, preco }: { status: EventStatus; preco: string }) {
    if (status === "soldout-sem-lista") {
        return (
            <div className="flex items-center gap-3">
                <Badge size="md" color="gray" type="modern">
                    Sold-out
                </Badge>
                <span className="text-sm font-bold text-primary">Os ingressos para este evento esgotaram.</span>
            </div>
        );
    }

    if (status === "soldout-com-lista") {
        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <Badge size="md" color="gray" type="modern">
                        Sold-out
                    </Badge>
                    <span className="text-sm font-bold text-primary">Os ingressos para este evento esgotaram.</span>
                </div>
                <Button size="lg" color="primary" iconLeading={BellRinging02} className="w-full">
                    Entrar na lista de espera
                </Button>
                <p className="text-center text-sm text-tertiary">Outras 32 pessoas já estão esperando</p>
            </div>
        );
    }

    if (status === "aguardando-abertura") {
        return (
            <div className="flex flex-col gap-3">
                <span className="flex items-center gap-2 text-sm text-tertiary">
                    <Clock className="size-4 shrink-0" />
                    Vendas abrem em
                </span>
                <Countdown />
                <Button size="lg" color="primary" iconLeading={BellRinging02} className="w-full">
                    Avise-me quando abrir
                </Button>
            </div>
        );
    }

    // venda-ativa
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
                <span className="text-sm text-tertiary">A partir de</span>
                <span className="text-md font-bold text-primary">
                    {preco} <span className="text-sm font-normal text-tertiary">+ taxa</span>
                </span>
            </div>
            <Button size="lg" color="primary">
                Garantir ingresso
            </Button>
        </div>
    );
}

/** Countdown regressivo até a abertura das vendas. */
function Countdown() {
    const target = useRef<number>(0);
    if (target.current === 0) {
        target.current = Date.now() + ((2 * 24 + 6) * 3600 + 31 * 60 + 51) * 1000;
    }
    const [remaining, setRemaining] = useState(() => Math.max(0, target.current - Date.now()));

    useEffect(() => {
        const id = setInterval(() => setRemaining(Math.max(0, target.current - Date.now())), 1000);
        return () => clearInterval(id);
    }, []);

    const total = Math.floor(remaining / 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const cells = [
        { value: pad(Math.floor(total / 86400)), label: "Dias" },
        { value: pad(Math.floor((total % 86400) / 3600)), label: "Horas" },
        { value: pad(Math.floor((total % 3600) / 60)), label: "Minutos" },
        { value: pad(total % 60), label: "Segundos" },
    ];

    return (
        <div className="grid grid-cols-4 gap-2 text-center">
            {cells.map((c) => (
                <div key={c.label} className="flex flex-col items-center rounded-lg border border-secondary py-2">
                    <span className="text-xl font-bold text-primary tabular-nums">{c.value}</span>
                    <span className="text-xs text-tertiary">{c.label}</span>
                </div>
            ))}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Seções de conteúdo                                                */
/* ------------------------------------------------------------------ */

function Lineup({ config }: { config: EventConfig }) {
    return (
        <section className="flex flex-col gap-5">
            <SectionHeading title="Lineup" sub="Datas e horários sujeitas a alteração" />
            <div className="flex flex-col gap-5">
                {LINEUP.map((atracao) => (
                    <div key={atracao.name} className="flex items-center gap-3">
                        <Avatar src={atracao.img} alt={atracao.name} size="md" />
                        <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-semibold text-primary">{atracao.name}</span>
                            <div className="flex flex-wrap gap-1.5">
                                {atracao.dates.map((date, i) => (
                                    <span
                                        key={i}
                                        className="rounded-full border border-secondary bg-secondary px-2 py-0.5 text-xs font-medium text-secondary"
                                    >
                                        {config.lineupComHorario && date.time ? `${date.day} • ${date.time}` : date.day}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function Complementos() {
    return (
        <section className="flex flex-col gap-4">
            <SectionHeading title="Complementos da sua experiência" sub="Benefícios e serviços podem variar conforme a data e o ingresso adquirido." />
            <div className="flex flex-col divide-y divide-secondary border-y border-secondary">
                {COMPLEMENTOS.map((item) => (
                    <div key={item.nome} className="flex items-center gap-3 py-4">
                        <item.icon className="size-5 shrink-0 text-fg-quaternary" />
                        <span className="flex-1 text-sm font-medium text-primary">{item.nome}</span>
                        {item.cardapio && (
                            <Button size="sm" color="secondary">
                                Conferir cardápio
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function Descricao({ family }: { family: GradientFamily }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-display-xs font-extrabold tracking-tight text-primary uppercase">Descrição</h2>
            <div className="relative">
                <div className="flex flex-col gap-3.5 text-sm leading-5 text-secondary">
                    {DESCRICAO_RESUMO.map((p, i) => (
                        <p key={i} className={cx(i === 0 && "font-bold text-primary")}>
                            {p}
                        </p>
                    ))}
                    {expanded && DESCRICAO_COMPLETO.map((p, i) => <p key={`c-${i}`}>{p}</p>)}
                </div>
                {!expanded && (
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-primary to-transparent" />
                )}
            </div>
            <Button
                size="sm"
                color="link-color"
                iconTrailing={<ChevronDown data-icon className={cx("size-5 transition-transform duration-200", expanded && "rotate-180")} />}
                onClick={() => setExpanded((v) => !v)}
                className="self-center"
            >
                {expanded ? "Recolher" : "Expandir"}
            </Button>
            <span aria-hidden="true" className="mt-2 h-0.5 w-16 rounded-full" style={{ backgroundImage: gradientCss(family, 90) }} />
        </section>
    );
}

function ComoChegar({ config, family }: { config: EventConfig; family: GradientFamily }) {
    const query = encodeURIComponent(`${config.localNome} ${config.localEndereco}`);
    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-display-xs font-extrabold tracking-tight text-primary uppercase">Como chegar</h2>
            <div className="overflow-hidden rounded-lg border border-tertiary bg-secondary">
                <iframe
                    title="Mapa do local"
                    src={`https://maps.google.com/maps?q=${query}&z=15&output=embed`}
                    className="h-[180px] w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="flex items-end gap-2 p-4">
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-bold text-primary">{config.localNome}</span>
                        <span className="truncate text-sm text-secondary">{config.localEndereco}</span>
                    </div>
                    <Button
                        size="sm"
                        color="link-color"
                        iconTrailing={LinkExternal02}
                        href={`https://www.google.com/maps/search/?api=1&query=${query}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Abrir no mapa
                    </Button>
                </div>
            </div>
            <span aria-hidden="true" className="mt-2 h-0.5 w-16 rounded-full" style={{ backgroundImage: gradientCss(family, 90) }} />
        </section>
    );
}

const PRODUTORES: { name: string; initials: string; img?: string; eventos?: number }[] = [
    { name: "Grupo Vibra", initials: "GV", img: produtorVibra, eventos: 1 },
    { name: "Grupo Onda", initials: "GO", img: produtorOnda, eventos: 3 },
    { name: "Fábrica", initials: "F" },
    { name: "Maltas Eventos", initials: "ME" },
    { name: "Leo Marçal", initials: "LM" },
    { name: "Lorde", initials: "L" },
    { name: "GMP", initials: "G" },
    { name: "Dume", initials: "D" },
];

function ProduzidoPor() {
    const [expanded, setExpanded] = useState(false);
    const PREVIEW = 3;
    const preview = PRODUTORES.slice(0, PREVIEW);
    const hidden = PRODUTORES.length - PREVIEW;

    const reduce = useReducedMotion();
    const ease = [0.22, 1, 0.36, 1] as const;

    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-display-xs font-extrabold tracking-tight text-primary uppercase">Produzido por</h2>

            <AnimatePresence initial={false} mode="wait">
                {expanded ? (
                    <motion.div
                        key="full"
                        initial={reduce ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduce ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="flex flex-col gap-4 overflow-hidden"
                    >
                        <div className="flex flex-col gap-4">
                            {PRODUTORES.map((p, i) => (
                                <motion.div
                                    key={p.name}
                                    initial={reduce ? false : { opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, ease, delay: 0.05 + i * 0.04 }}
                                    className="flex items-center gap-3"
                                >
                                    <Avatar src={p.img} initials={p.initials} alt={p.name} size="md" />
                                    <div className="flex min-w-0 flex-col">
                                        <span className="text-sm font-semibold text-primary">{p.name}</span>
                                        {p.eventos != null && (
                                            <span className="text-sm text-tertiary">
                                                {p.eventos} {p.eventos === 1 ? "evento" : "eventos"}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <Button size="sm" color="link-color" iconTrailing={ChevronUp} onClick={() => setExpanded(false)} className="self-start">
                            Resumir
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={reduce ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={reduce ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="flex items-center gap-3 overflow-hidden"
                    >
                        <div className="flex -space-x-2">
                            {preview.map((p) => (
                                <Avatar key={p.name} src={p.img} initials={p.initials} alt={p.name} size="sm" className="ring-2 ring-[color:var(--color-bg-primary)]" />
                            ))}
                            {hidden > 0 && (
                                <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary ring-2 ring-[color:var(--color-bg-primary)]">
                                    {hidden}
                                </span>
                            )}
                        </div>
                        <p className="min-w-0 flex-1 text-sm text-secondary">
                            {preview.map((p) => p.name).join(", ")}
                            {hidden > 0 && (
                                <>
                                    {" e "}
                                    <button
                                        type="button"
                                        onClick={() => setExpanded(true)}
                                        className="font-semibold text-brand-secondary transition hover:text-brand-secondary_hover hover:underline"
                                    >
                                        {hidden} mais
                                    </button>
                                </>
                            )}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

function Faq() {
    return (
        <section className="flex flex-col gap-4">
            <SectionHeading title="Dúvidas frequentes" sub="Tudo que você precisa saber sobre esse evento." />
            <div className="flex flex-col">
                {FAQ.map((item) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
            </div>
        </section>
    );
}

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-secondary">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
            >
                <span className="text-md font-semibold text-primary">{q}</span>
                <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-200", open && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        <p className="pb-4 text-sm leading-5 text-secondary">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function HelpCta({ family }: { family: GradientFamily }) {
    return (
        <GradientTexture family={family} angle={135} className="rounded-3xl">
            <div className="absolute inset-0 -z-10 bg-black/35" />
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-white">
                    <IngresseMark className="w-7 text-black" />
                </span>
                <p className="text-display-xs font-extrabold tracking-tight text-white uppercase">
                    Se precisar de ajuda,
                    <br />a Ingresse tá por aqui.
                </p>
                <Button size="lg" color="secondary">
                    Fale com a gente
                </Button>
            </div>
        </GradientTexture>
    );
}

/* ------------------------------------------------------------------ */
/*  Regras de venda online (exigência legal — fora da navegação)      */
/* ------------------------------------------------------------------ */

const REGRAS_PT: string[] = [
    `1) A Ingresse é uma plataforma intermediária especializada na venda de ingressos online para eventos. Os organizadores dos eventos utilizam a nossa plataforma para ofertar seus eventos ao público. Dessa forma, o organizador é o único responsável pela produção, organização, política de vendas, precificação, meia-entrada, atrações, alterações de datas e local de realização do evento e demais questões definidas, única e exclusivamente, pelo organizador do evento.`,
    `2) A obrigação da Ingresse limita-se estritamente ao uso e manutenção da tecnologia em si, ou seja, dos seus serviços de licenciamento do uso da plataforma da Ingresse.`,
    `3) O organizador do evento é exclusivamente responsável por suas atividades estarem em conformidade com todo o arcabouço legislativo aplicável a seu evento, incluindo, mas não se limitando a, obtenção de (i) alvará de autorização para realização do evento, (ii) licença de funcionamento, (iii) divulgação e cumprimento de protocolos locais e nacionais relacionados a políticas sanitárias.`,
    `4) O site (www.ingresse.com) e o App (Ingresse - Ingressos e Eventos) são os únicos canais oficiais de vendas da Ingresse. A Ingresse não se responsabiliza, em qualquer hipótese e aspecto, por ingressos adquiridos com terceiros.`,
    `5) Compras suspeitas ou com evidências de fraude de qualquer natureza no processo de compra serão canceladas e reembolsadas;`,
    `6) Para acessar o evento é obrigatória a apresentação do ingresso em formato digital, através do App (Ingresse - Ingressos e Eventos), juntamente com o respectivo documento de identificação oficial com foto;`,
    `7) O não comparecimento ao evento invalidará o ingresso e não permitirá reembolso;`,
    `8) Em casos de arrependimento, o Código de Defesa do Consumidor (Artigo 49) prevê que em até 7 (sete) dias o consumidor pode desistir da compra, desde que esse prazo não ultrapasse 48 (quarenta e oito) horas antes do evento ou 24 (vinte e quatro) horas antes da realização de partidas de futebol. O reembolso é realizado via um processador de pagamentos online pela mesma forma de pagamento utilizada na compra, descontada a taxa de conveniência (se houver), no prazo de até 45 (quarenta e cinco) dias após o cancelamento. No caso de compras com cartões de crédito, o valor será devolvido como crédito nas faturas seguintes.`,
    `9) Em caso de solicitação de estorno da compra em razão do exercício do direito de arrependimento, a taxa de serviço da Ingresse e a taxa de processamento serão descontados do valor total do reembolso;`,
    `10) O organizador do evento é o único e exclusivo responsável por determinar a habilitação da possibilidade de transferência de ingressos em determinado evento. A Ingresse não determina a habilitação ou não e as regras relacionadas a transferência de ingressos, as quais serão estabelecidas unicamente pelo organizador.`,
    `11) Caso não conste da descrição do evento acima quaisquer informações adicionais sobre o evento, como estacionamento, cardápio, line-up, ordem de entrada de artistas e demais, relacionadas exclusivamente à organização do evento, deverão ser solicitadas diretamente para o organizador do evento, através do e-mail de contato do mesmo;`,
    `12) A Ingresse não permite e repudia a venda de ingressos para eventos irregulares, que não estejam seguindo todas as orientações e protocolos de segurança determinados pelas autoridades governamentais competentes. Consideramos, antes de tudo, a saúde e segurança de todos.`,
    `13) Horário de atendimento do SAC da Ingresse é: Das 11h às 19h, todos os dias, pelos canais: e-mail, FAQ e telefone; e das 10h às 23h, todos os dias, pelo canal WhatsApp.`,
    `14) Precisa de ajuda? Acesse nosso site e clique em "Fale com a Ingresse", localizada na parte inferior de nosso site. Ao acessar este item, você terá acesso a conteúdos sobre compras, cadastro, entre outros temas.`,
];

const REGRAS_ES: string[] = [
    `1) Ingresse es una plataforma intermediaria especializada en la venta de entradas online para eventos. Los organizadores de eventos utilizan nuestra plataforma para ofrecer sus eventos al público. Por esta razón, el organizador es el único responsable de cada detalle del evento, incluyendo su producción, organización, localización, precio de entradas, descuentos, política de ventas, cartel de artistas y/o cambios de fechas.`,
    `2) La obligación de Ingresse se limita estrictamente al uso y mantenimiento de la tecnología en sí, es decir, a sus servicios de licencia para el uso de la plataforma Ingresse.`,
    `3) El organizador del evento es el único responsable de asegurar que sus actividades cumplan con todos los marcos legislativos aplicables a su evento, incluyendo, pero no limitado a, la obtención de (i) un permiso de autorización para realizar el evento, (ii) una licencia de funcionamiento, (iii) divulgación y cumplimiento de las políticas locales y nacionales sanitarias.`,
    `4) El sitio web (www.ingresse.com) y la App (Ingresse – Eventos y Entradas) son los únicos canales de venta oficiales de Ingresse. Ingresse no es responsable, bajo ninguna circunstancia, de las entradas adquiridas mediante otras vías o terceros.`,
    `5) Las compras sospechosas que evidencien fraude de cualquier tipo en el proceso de compra serán canceladas y reembolsadas.`,
    `6) Para acceder al evento, es obligatorio presentar la entrada en formato digital, a través de la App (Ingresse – Eventos y Entradas), junto con el respectivo documento de identificación oficial con fotografía.`,
    `7) La no asistencia al evento invalidará la entrada y no permitirá reembolso.`,
    `8) El organizador del evento es el único y exclusivo responsable de determinar si existe o no la posibilidad de transferir entradas para un evento determinado. Ingresse no determina la elegibilidad o no de las entradas ni las reglas relacionadas con la transferencia de entradas, que serán establecidas únicamente por el organizador.`,
    `9) Si la descripción del evento no incluye ninguna información adicional sobre el mismo, como parking, menú, cartel, orden de entrada de los artistas y cualquier otro asunto relacionado exclusivamente con la organización del evento, deberán solicitarse estos datos directamente al organizador del evento a través de su teléfono o correo electrónico.`,
    `10) Ingresse no permite y rechaza rotundamente la venta de entradas para eventos irregulares que no sigan todos los protocolos de seguridad determinados por las autoridades gubernamentales competentes. Ante todo, priorizamos la salud y la seguridad de todos.`,
    `11) El horario de atención de Atención al Cliente de Ingresse es todos los días a través de los siguientes canales: correo electrónico, preguntas frecuentes y vía WhatsApp.`,
    `12) ¿Necesitas ayuda? Visita nuestra página web y haz clic en “Contactar Ingresse”, ubicado en la parte inferior de nuestro sitio web. Al acceder a este ítem, tendrás acceso a contenido sobre tus compras, registros, entre otros asuntos.`,
];

const REGRAS_EN: string[] = [
    `1) Ingresse is an intermediary platform specialized in selling tickets online for events. Event organizers use our platform to offer their events to the public. Therefore, the organizer is solely responsible for the production, organization, sales policy, pricing, half-priced tickets, attractions, changes to dates and location of the event and other issues defined solely and exclusively by the event organizer.`,
    `2) Ingresse's obligation is strictly limited to the use and maintenance of the technology itself, that is, its licensing services for the use of the Ingresse platform.`,
    `3) The event organizer is exclusively responsible for its activities being in compliance with the entire legislative framework applicable to its event and in its region, including, without limitation, obtaining (i) the necessary authorizations to hold the event, (ii) operating licenses, (iii) disclosure and compliance with local protocols.`,
    `4) The website (www.ingresse.com) and the App (Ingresse - Tickets and Events) are Ingresse’s only official sales channels. Ingresse is not liable, under any circumstances or aspect, for tickets purchased from third parties.`,
    `5) Suspicious purchases or those with evidence of fraud of any nature in the purchase process will be canceled and refunded in full;`,
    `6) To access the event, presentation of the ticket in digital format through the App (Ingresse - Ingressos e Eventos) is mandatory, together with the respective official identification document with photo;`,
    `7) Failure to attend the event will invalidate the ticket and will not allow a refund;`,
    `8) You may be eligible for a full refund of your ticket price only if: (i) the event is cancelled; (ii) the event is rescheduled; or (iii) the event organizer expressly orders Ingresse to make the refund.`,
    `9) The event organizer is solely and exclusively responsible for authorizing the possibility of transferring tickets for a given event. Ingresse does not determine the authorization or not and the rules related to ticket transfer, which will be set solely by the organizer.`,
    `10) If the description of the event does not include any additional information about the event, such as parking, menu, line-up, order of appearance of artists and others, related exclusively to the organization of the event, it must be requested directly from the event organizer, through its contact email;`,
    `11) Ingresse does not allow and repudiates the sale of tickets for irregular events which are not following all the guidelines and safety protocols determined by the competent government authorities. First and foremost, we take everyone's health and safety into consideration.`,
    `12) Ingresse's SAC service hours are: Every day from 11 a.m. to 7 p.m., through the channels below: email, FAQ and telephone; and every day from 10 a.m. to 11 p.m., through the WhatsApp channel.`,
    `13) Need help? Access our website and click on "Contact Ingresse", located at the bottom of our website. By accessing this item, you will have access to content about purchases, registration, among other topics.`,
];

function RegrasVenda() {
    const [expanded, setExpanded] = useState(true);
    const blocos: { titulo: string; itens: string[] }[] = [
        { titulo: "Regras de Venda Online", itens: REGRAS_PT },
        { titulo: "Normas de Venta en Línea", itens: REGRAS_ES },
        { titulo: "Online Selling Rules", itens: REGRAS_EN },
    ];

    return (
        <section className="flex flex-col gap-4">
            <hr className="border-secondary" />
            <SectionHeading title="Regras de venda online" sub="Saiba mais sobre políticas de Ingresse" />

            {expanded && (
                <div className="flex flex-col gap-6 text-sm leading-5 text-secondary">
                    {blocos.map((bloco, i) => (
                        <div key={bloco.titulo} className="flex flex-col gap-3">
                            {i > 0 && <hr className="border-secondary" />}
                            <h3 className="text-sm font-semibold text-primary">{bloco.titulo}</h3>
                            {bloco.itens.map((p, j) => (
                                <p key={j}>{p}</p>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            <Button
                size="sm"
                color="link-color"
                iconTrailing={<ChevronDown data-icon className={cx("size-5 transition-transform duration-200", expanded && "rotate-180")} />}
                onClick={() => setExpanded((v) => !v)}
                className="self-start"
            >
                {expanded ? "Ver menos" : "Ver mais"}
            </Button>
        </section>
    );
}

function SectionHeading({ title, sub }: { title: string; sub: string }) {
    return (
        <div className="flex flex-col gap-1">
            <h2 className="text-display-xs font-extrabold tracking-tight text-primary uppercase">{title}</h2>
            <p className="text-sm text-tertiary">{sub}</p>
        </div>
    );
}
