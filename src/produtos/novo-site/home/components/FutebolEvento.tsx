import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, ChevronDown, Clock, FaceId, LinkExternal02, MarkerPin01, Ticket01, Users01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { hslToHex, rgbToHsl } from "../../components/gradient-families";
import { NOISE_URI } from "./GradientTexture";
import type { EventoMock } from "../data/events";
import meshGradient from "../assets/mesh-gradient.png";
import sideTexture from "../assets/side-bg-texture.png";

/* ------------------------------------------------------------------ */
/*  Variante de FUTEBOL — vestida só com a cor do mandante            */
/* ------------------------------------------------------------------ */

const hexToRgb = (hex: string): [number, number, number] => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
/** Tom da cor do time com luminosidade controlada — preserva a saturação real
 *  (sem piso) para que times preto/branco (ex.: Botafogo) não virem marrom. */
const shade = (hex: string, light: number) => {
    const [r, g, b] = hexToRgb(hex);
    const [h, s] = rgbToHsl(r, g, b);
    return hslToHex(h, Math.min(0.85, s), light);
};

type Lado = "mandante" | "neutro" | "visitante";
interface Setor {
    id: string;
    nome: string;
    lado: Lado;
    preco: number;
    restam: number;
}

const real = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const youtubeId = (url: string): string | null => {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
};

const TABS = [
    { id: "dia", label: "No dia do jogo" },
    { id: "socio", label: "Sócio & meia" },
    { id: "acesso", label: "Acesso" },
    { id: "faq", label: "Dúvidas" },
];

export function FutebolEvento({ evento, videoUrl = "" }: { evento: EventoMock; videoUrl?: string }) {
    const c = evento.futebol!;
    const { casa, fora } = c;
    const base = evento.preco || 60;
    const torcidaUnica = !!c.torcidaUnica;

    const setores: Setor[] = [
        { id: "norte", nome: "Arquibancada Norte", lado: "mandante", preco: base, restam: 240 },
        { id: "leste", nome: "Cadeira Leste", lado: "neutro", preco: base * 2, restam: 64 },
        { id: "oeste", nome: "Cadeira Oeste · coberta", lado: "neutro", preco: base * 3, restam: 12 },
        { id: "camarote", nome: "Camarote", lado: "neutro", preco: base * 6, restam: 5 },
        torcidaUnica
            ? { id: "sul", nome: "Arquibancada Sul", lado: "mandante", preco: base, restam: 180 }
            : { id: "sul", nome: "Setor Visitante", lado: "visitante", preco: base, restam: 90 },
    ];

    const precoMin = Math.min(...setores.filter((s) => s.restam > 0).map((s) => s.preco));

    // Navegação: scroll-spy + progresso (barra na cor do mandante).
    const [activeTab, setActiveTab] = useState(TABS[0].id);
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const onScroll = () => {
            const first = document.getElementById(TABS[0].id);
            const last = document.getElementById("faq");
            if (first && last) {
                // Progresso fiel: 0 quando a 1ª seção encosta na nav; 100% quando o
                // fim do FAQ chega à base da tela (sem adiantar uma tela inteira).
                const start = first.getBoundingClientRect().top + window.scrollY - 130;
                const end = last.getBoundingClientRect().bottom + window.scrollY;
                const denom = end - window.innerHeight - start;
                const seen = window.scrollY - start;
                setProgress(denom > 0 ? Math.min(1, Math.max(0, seen / denom)) : 0);
            }
            let cur = TABS[0].id;
            for (const t of TABS) {
                const el = document.getElementById(t.id);
                if (el && el.getBoundingClientRect().top - 130 <= 0) cur = t.id;
            }
            setActiveTab(cur);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    // Mini-barra: surge por cima do header ao rolar além do hero (como em shows).
    const heroRef = useRef<HTMLElement>(null);
    const [showMini, setShowMini] = useState(false);
    useEffect(() => {
        const onScroll = () => {
            const el = heroRef.current;
            if (el) setShowMini(el.getBoundingClientRect().bottom < 140);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);

    const heroBg = `linear-gradient(160deg, ${shade(casa.cor, 0.26)} 0%, #0c0c10 100%)`;
    const query = encodeURIComponent(`${evento.local} ${evento.cidade}`);

    const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

    return (
        <>
            {/* Mini-barra fixa — escudos + confronto ao rolar além do hero */}
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
                            <div className="flex h-10 shrink-0 items-center gap-1.5">
                                {[casa, fora].map((t) => (t.escudo ? <img key={t.abbr} src={t.escudo} alt={t.nome} className="size-8 object-contain" /> : null))}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col">
                                <p className="line-clamp-1 text-sm font-bold text-primary">
                                    {casa.nome} × {fora.nome}
                                </p>
                                <span className="line-clamp-1 text-xs text-tertiary">{evento.dataLabel} · {evento.local}</span>
                            </div>
                            <Button size="sm" color="primary" iconLeading={Ticket01} className="max-sm:hidden">
                                Comprar ingresso
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HERO — confronto, só cor do mandante */}
            <section ref={heroRef} className="relative isolate h-[calc(100dvh-4rem)] min-h-[560px] overflow-hidden text-white" style={{ background: heroBg }}>
                <HeroVideo url={videoUrl} />
                <div aria-hidden className="absolute inset-0 -z-10 mix-blend-overlay" style={{ backgroundImage: `url(${meshGradient})`, backgroundSize: "cover" }} />
                <div aria-hidden className="absolute inset-y-0 left-0 -z-10 w-[38vw] max-w-[280px]" style={sideMask(casa.cor, false)} />
                <div aria-hidden className="absolute inset-y-0 right-0 -z-10 w-[38vw] max-w-[280px] -scale-x-100" style={sideMask(casa.cor, false)} />
                {/* Com vídeo: overlay preto a 30% para legibilidade */}
                {videoUrl.trim() && <div aria-hidden className="absolute inset-0 -z-10 bg-black/50" />}

                <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center gap-7 px-5 py-10 text-center lg:px-8">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-[0.16em] uppercase">Venda oficial</span>
                        {torcidaUnica && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold tracking-[0.16em] text-black uppercase">Torcida única</span>}
                    </div>
                    <span className="text-sm font-semibold tracking-[0.2em] text-white/80 uppercase">
                        {c.campeonato}
                        {c.fase ? ` · ${c.fase}` : ""}
                    </span>

                    {/* Escudos × */}
                    <div className="flex items-center justify-center gap-6 lg:gap-10">
                        <Escudo time={casa} />
                        <span className="text-3xl font-black text-white/80 lg:text-5xl">×</span>
                        <Escudo time={fora} />
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-white/85">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="size-4" /> {evento.dataLabel}
                        </span>
                        <span aria-hidden className="h-4 w-px bg-white/25" />
                        <span className="flex items-center gap-1.5">
                            <Clock className="size-4" /> Portões 14h · Bola 16h
                        </span>
                        <span aria-hidden className="h-4 w-px bg-white/25" />
                        <span className="flex items-center gap-1.5">
                            <MarkerPin01 className="size-4" /> {evento.local} · {evento.cidade}
                        </span>
                    </div>
                </div>
            </section>

            {/* NAV — full width + barra de progresso na cor do mandante */}
            <nav className="sticky top-16 z-30 border-b border-secondary bg-primary/90 backdrop-blur-md">
                <div className="relative mx-auto max-w-5xl px-5 lg:px-8">
                    <div className="flex">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => irPara(t.id)}
                                aria-current={activeTab === t.id || undefined}
                                className={cx(
                                    "flex-1 px-2 py-3.5 text-center text-sm font-semibold whitespace-nowrap transition-colors duration-100",
                                    activeTab === t.id ? "text-primary" : "text-tertiary hover:text-secondary",
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px]">
                        <div className="h-full transition-[width] duration-150 ease-out" style={{ width: `${progress * 100}%`, backgroundColor: casa.cor }} />
                    </div>
                </div>
            </nav>

            <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-5 pt-12 pb-40 lg:px-8">
                {/* SETORES & valores — assento marcado é escolhido na compra (seats.io) */}
                <section id="setores" className="scroll-mt-32 flex flex-col gap-5">
                    {/* Aviso de dependentes — antes da compra */}
                    <div className="flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center" style={{ borderColor: shade(casa.cor, 0.4), backgroundColor: shade(casa.cor, 0.12) }}>
                        <Users01 className="mt-0.5 size-5 shrink-0 text-white" />
                        <p className="flex-1 text-sm text-white/90">
                            <span className="font-bold text-white">Cadastre seus dependentes antes de comprar.</span> Ingressos de futebol são nominais, cada torcedor precisa de nome e documento cadastrados.
                        </p>
                        <Button size="sm" color="secondary" iconLeading={Users01} className="shrink-0 max-sm:w-full">
                            Cadastrar dependentes
                        </Button>
                    </div>
                </section>

                {/* DIA DO JOGO */}
                <section id="dia" className="scroll-mt-32 flex flex-col gap-5">
                    <Titulo titulo="No dia do jogo" sub="Tudo que importa pra chegar tranquilo." />
                    <div className="grid gap-4 sm:grid-cols-3">
                        <InfoCard icon={Clock} titulo="Portões" texto="Abrem 14h. Bola rola às 16h. Chegue cedo para a revista." />
                        <InfoCard icon={MarkerPin01} titulo="Estádio" texto={`${evento.local}, ${evento.cidade}.`} />
                        <InfoCard icon={Users01} titulo="Transporte" texto="Metrô até a estação mais próxima. Estacionamento limitado no entorno." />
                    </div>
                    <div className="overflow-hidden rounded-xl border border-tertiary bg-secondary">
                        <iframe
                            title="Mapa do estádio"
                            src={`https://maps.google.com/maps?q=${query}&z=15&output=embed`}
                            className="h-[180px] w-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                        <div className="flex items-center justify-between gap-2 p-4">
                            <span className="text-sm font-bold text-primary">{evento.local}</span>
                            <Button size="sm" color="link-color" iconTrailing={LinkExternal02} href={`https://www.google.com/maps/search/?api=1&query=${query}`} target="_blank" rel="noopener noreferrer">
                                Abrir no mapa
                            </Button>
                        </div>
                    </div>

                    {/* Entradas (portões) — endereço de cada acesso por setor */}
                    {c.entradas && c.entradas.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-md font-bold text-primary">Entradas do estádio</h3>
                            <p className="text-sm text-tertiary">Acesse pelo portão do seu setor — confira o endereço de cada um.</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {c.entradas.map((e) => (
                                    <div key={e.nome} className="flex flex-col gap-2 rounded-2xl border border-secondary p-4">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-extrabold text-white"
                                                style={{ backgroundColor: shade(casa.cor, 0.32) }}
                                            >
                                                {e.nome.replace(/[^A-Z0-9]/g, "").slice(-1)}
                                            </span>
                                            <div className="flex min-w-0 flex-col">
                                                <span className="text-sm font-bold text-primary">{e.nome}</span>
                                                <span className="line-clamp-1 text-xs text-tertiary">{e.setores}</span>
                                            </div>
                                        </div>
                                        <p className="flex items-start gap-1.5 text-sm text-secondary">
                                            <MarkerPin01 className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
                                            {e.endereco}
                                        </p>
                                        <Button
                                            size="sm"
                                            color="link-color"
                                            iconTrailing={LinkExternal02}
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.endereco)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-fit"
                                        >
                                            Ver no mapa
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* SÓCIO & MEIA */}
                <section id="socio" className="scroll-mt-32 flex flex-col gap-5">
                    <Titulo titulo="Sócio & meia-entrada" sub="Vantagens de quem é do clube." />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-3 rounded-2xl p-5 text-white" style={{ background: shade(casa.cor, 0.22) }}>
                            <span className="text-md font-bold">É sócio do {casa.nome}?</span>
                            <p className="text-sm text-white/80">Faça check-in com a sua carteira para preço e prioridade de sócio.</p>
                            <Button size="md" color="secondary" className="w-fit">
                                Check-in de sócio
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2 rounded-2xl border border-secondary p-5">
                            <span className="text-md font-bold text-primary">Meia-entrada</span>
                            <p className="text-sm text-secondary">Estudante, idoso (60+), PCD e demais previstos em lei. Comprovação na portaria com documento oficial com foto.</p>
                        </div>
                    </div>
                </section>

                {/* ACESSO & REGRAS */}
                <section id="acesso" className="scroll-mt-32 flex flex-col gap-5">
                    <Titulo titulo="Acesso ao estádio" sub="Garanta que vai entrar sem dor de cabeça." />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoCard icon={FaceId} titulo="Cadastro facial obrigatório" texto="Faça o cadastro biométrico no app antes do jogo — é exigência para entrar." />
                        <InfoCard icon={Ticket01} titulo="Ingresso digital" texto="Apresente o QR Code no app junto com documento oficial com foto." />
                        <InfoCard icon={Users01} titulo="Gratuidades" texto="Crianças e idosos conforme regra do clube; sujeito a setor específico." />
                        <InfoCard icon={MarkerPin01} titulo="Itens proibidos" texto="Sem garrafas, hastes, sombrinhas e objetos cortantes. Confira a lista oficial." />
                    </div>
                </section>

                {/* FAQ */}
                <section id="faq" className="scroll-mt-32 flex flex-col gap-3">
                    <Titulo titulo="Dúvidas frequentes" sub="" />
                    {FAQ.map((f) => (
                        <FaqItem key={f.q} q={f.q} a={f.a} />
                    ))}
                </section>
            </main>

            {/* Barra de compra fixa */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-secondary bg-primary/90 backdrop-blur-lg">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 pt-3 pb-7 lg:px-8">
                    <div className="flex flex-col">
                        <span className="text-sm text-tertiary">A partir de</span>
                        <span className="text-md font-bold text-primary">
                            {real(precoMin)} <span className="text-sm font-normal text-tertiary">+ taxa</span>
                        </span>
                    </div>
                    <Button size="lg" color="primary" iconLeading={Ticket01}>
                        Comprar ingresso
                    </Button>
                </div>
            </div>
        </>
    );
}

/* ---- subcomponentes ---- */

/** Velocidade do vídeo de fundo (mais lento = mais cinematográfico). */
const HERO_VIDEO_RATE = 1;

/**
 * Vídeo de fundo do hero — em duotone (mix-blend-luminosity), por isso a
 * footage assume a cor do mandante que vem do gradiente abaixo. Mesmos
 * filtros/efeitos do hero de evento: motion blur direcional + grão.
 * Aceita YouTube (iframe) ou arquivo direto (.mp4/.webm).
 */
function HeroVideo({ url }: { url: string }) {
    const u = url.trim();
    const ytId = u ? youtubeId(u) : null;
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // YouTube: reduz a velocidade via IFrame API (postMessage).
    useEffect(() => {
        if (!u || !ytId) return;
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
    }, [u, ytId]);

    // Arquivo de vídeo direto: define playbackRate.
    useEffect(() => {
        if (!u || ytId) return;
        const v = videoRef.current;
        if (v) v.playbackRate = HERO_VIDEO_RATE;
    }, [u, ytId]);

    if (!u) return null;

    const coverCls =
        "pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-55 mix-blend-luminosity [filter:url(#fut-hero-motion-blur)_contrast(1.05)_saturate(1.1)]";
    const coverStyle = {
        width: "max(100vw, 177.78vh)",
        height: "max(100vh, 56.25vw)",
    } as const;

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
        <video ref={videoRef} aria-hidden="true" src={u} autoPlay loop muted playsInline className={cx(coverCls, "object-cover")} style={coverStyle} />
    );

    return (
        <>
            {/* Motion blur direcional (rastro horizontal). */}
            <svg aria-hidden="true" className="absolute size-0">
                <filter id="fut-hero-motion-blur" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="1 3" edgeMode="duplicate" />
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

function sideMask(cor: string, _x: boolean) {
    return {
        backgroundColor: cor,
        WebkitMaskImage: `url(${sideTexture})`,
        maskImage: `url(${sideTexture})`,
        WebkitMaskSize: "auto 100%",
        maskSize: "auto 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "left center",
        maskPosition: "left center",
        opacity: 0.5,
    } as const;
}

function Escudo({ time }: { time: { nome: string; cor: string; abbr: string; escudo?: string } }) {
    return (
        <span className="flex flex-col items-center gap-2">
            {time.escudo ? (
                <img src={time.escudo} alt={time.nome} className="size-20 object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] lg:size-28" />
            ) : (
                <span className="grid size-20 place-items-center rounded-2xl text-xl font-extrabold text-white lg:size-28" style={{ backgroundColor: time.cor }}>
                    {time.abbr}
                </span>
            )}
            <span className="text-sm font-bold text-white lg:text-md">{time.nome}</span>
        </span>
    );
}


function Titulo({ titulo, sub }: { titulo: string; sub: string }) {
    return (
        <div className="flex flex-col gap-1">
            <h2 className="text-display-xs font-extrabold tracking-tight text-primary uppercase">{titulo}</h2>
            {sub && <p className="text-sm text-tertiary">{sub}</p>}
        </div>
    );
}

function InfoCard({ icon: Icon, titulo, texto }: { icon: typeof Clock; titulo: string; texto: string }) {
    return (
        <div className="flex flex-col gap-2 rounded-2xl border border-secondary p-5">
            <Icon className="size-5 text-fg-quaternary" />
            <span className="text-sm font-bold text-primary">{titulo}</span>
            <p className="text-sm text-secondary">{texto}</p>
        </div>
    );
}

const FAQ = [
    { q: "É torcida única?", a: "Quando o jogo é de torcida única, não há setor visitante e a sinalização aparece no topo da página. Confira o setor antes de comprar." },
    { q: "Preciso fazer cadastro facial?", a: "Sim. Vários estádios exigem biometria facial. Faça o cadastro no app com antecedência para não ser barrado na catraca." },
    { q: "Como funciona a meia-entrada?", a: "Estudante, idoso (60+), PCD e demais previstos em lei. A comprovação é feita na portaria com documento oficial com foto." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-secondary">
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 py-4 text-left">
                <span className="text-md font-semibold text-primary">{q}</span>
                <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform", open && "rotate-180")} />
            </button>
            {open && <p className="pb-4 text-sm leading-5 text-secondary">{a}</p>}
        </div>
    );
}
