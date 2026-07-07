import { useState } from "react";
import {
    ArrowDown,
    ArrowUpRight,
    Facebook,
    Instagram,
    Twitter,
    Users,
    Youtube,
} from "lucide-react";
import IngresseLogo from "../../../../assets/Company logo_white.svg";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import type { PosterEvento, TimeConfig } from "../data/times";

/* ------------------------------------------------------------------ */
/*  Page + layout switcher                                            */
/* ------------------------------------------------------------------ */

type LayoutVariant = "v1" | "v2";

export function TimeLanding({ time }: { time: TimeConfig }) {
    const [layout, setLayout] = useState<LayoutVariant>("v1");

    return (
        <div className="min-h-screen w-full" style={{ backgroundColor: time.palette.pageBg }}>
            <LayoutToggle value={layout} onChange={setLayout} accent={time.palette.accent} />
            {layout === "v1" ? <LayoutV1 time={time} /> : <LayoutV2 time={time} />}
        </div>
    );
}

/** Shared constrained wrapper for delimited page content. */
const Container = ({ children }: { children: React.ReactNode }) => (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-28">
        {children}
    </div>
);

const LAYOUT_OPTIONS: { id: LayoutVariant; label: string }[] = [
    { id: "v1", label: "Layout atual" },
    { id: "v2", label: "Novo layout" },
];

const LayoutToggle = ({
    value,
    onChange,
    accent,
}: {
    value: LayoutVariant;
    onChange: (v: LayoutVariant) => void;
    accent: string;
}) => (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full bg-black/80 p-1 shadow-xl ring-1 ring-white/15 backdrop-blur">
            {LAYOUT_OPTIONS.map((opt) => {
                const active = value === opt.id;
                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.id)}
                        aria-pressed={active}
                        className={cx(
                            "min-w-[160px] rounded-full px-8 py-2.5 text-center text-sm font-semibold transition duration-100 ease-linear",
                            active ? "text-white" : "text-white/60 hover:text-white",
                        )}
                        style={active ? { backgroundColor: accent } : undefined}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    </div>
);

/* ================================================================== */
/*  LAYOUT V1 — current (poster grid)                                 */
/* ================================================================== */

const LayoutV1 = ({ time }: { time: TimeConfig }) => (
    <Container>
        <Hero time={time} />
        <DependentsNotice time={time} />
        <EventGrid time={time} />
        <Footer time={time} />
    </Container>
);

const Hero = ({ time }: { time: TimeConfig }) => (
    <section
        className="relative flex min-h-[400px] flex-col items-center overflow-hidden rounded-3xl bg-cover bg-center px-4 pt-12 pb-5 md:pt-20"
        style={{ backgroundImage: `url("${time.hero}")` }}
    >
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
                backgroundImage:
                    "linear-gradient(180deg, rgba(8,8,8,0.25) 0%, rgba(8,8,8,0.35) 55%, rgba(8,8,8,0.75) 100%)",
            }}
        />

        <div className="relative z-10 flex flex-1 flex-col items-center">
            {!time.ocultarEscudoTopo && <Emblem time={time} />}
            <h1 className="mt-6 max-w-lg text-center text-[40px] font-medium leading-tight tracking-tight text-white md:text-6xl">
                {time.heroTitulo}
            </h1>
        </div>

        <button
            type="button"
            className="relative z-10 mt-8 flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-base font-bold text-white transition duration-100 ease-linear hover:brightness-105 md:py-5 md:text-lg"
            style={{ backgroundColor: time.palette.accent }}
        >
            <ArrowDown className="size-5" aria-hidden="true" />
            Compre seus ingressos aqui
            <ArrowDown className="size-5" aria-hidden="true" />
        </button>
    </section>
);

const Emblem = ({ time }: { time: TimeConfig }) => (
    <img src={time.logo} alt={time.nomeCompleto} className="h-20 w-auto md:h-24" />
);

const EventGrid = ({ time }: { time: TimeConfig }) => (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {time.eventos.map((evento) => (
            <EventCard key={evento.id} evento={evento} accent={time.palette.accent} />
        ))}
    </section>
);

const EventCard = ({ evento, accent }: { evento: PosterEvento; accent: string }) => (
    <article className="flex h-full flex-col rounded-2xl bg-white p-3">
        <Poster evento={evento} />
        <div className="mt-3 flex flex-1 flex-col gap-1 pt-0">
            <h3 className="border-b border-neutral-200 pb-1 text-sm font-bold text-neutral-900">
                {evento.title}
            </h3>
            {evento.subtitle && (
                <span className="pt-1 text-sm text-neutral-500">{evento.subtitle}</span>
            )}
            <span className="mt-auto text-sm font-bold" style={{ color: accent }}>
                {evento.date}
            </span>
        </div>
    </article>
);

const Poster = ({ evento }: { evento: PosterEvento }) => (
    <img
        src={evento.imageUrl}
        alt={evento.title}
        loading="lazy"
        className="aspect-[3/4] w-full rounded-xl object-cover"
    />
);

/* ================================================================== */
/*  LAYOUT V2 — marketing landing (hero → spotlight → list → CTA)     */
/* ================================================================== */

const LayoutV2 = ({ time }: { time: TimeConfig }) => (
    <>
        <HeroV2 time={time} />
        <Container>
            <DependentsNotice time={time} />
            <Experiences time={time} />
            <Footer time={time} />
        </Container>
    </>
);

const HeroV2 = ({ time }: { time: TimeConfig }) => (
    <section
        className="relative min-h-[520px] overflow-hidden bg-cover bg-center md:min-h-[640px]"
        style={{ backgroundImage: `url("${time.hero}")` }}
    >
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
                backgroundImage:
                    "linear-gradient(90deg, rgba(8,8,8,0.9) 0%, rgba(8,8,8,0.55) 45%, rgba(8,8,8,0.1) 100%), linear-gradient(0deg, rgba(8,8,8,0.7) 0%, transparent 50%)",
            }}
        />

        <div className="relative z-10 mx-auto flex min-h-[520px] w-full max-w-[1280px] flex-col px-4 py-8 md:min-h-[640px] md:px-6 md:py-12">
            {!time.ocultarEscudoTopo && (
                <div className="flex items-center justify-center w-full">
                    <img
                        src={time.logo}
                        alt={time.nomeCompleto}
                        className="h-20 w-auto self-start md:h-24"
                    />
                </div>
            )}

            <div className="mt-auto flex max-w-xl flex-col items-start gap-5">
                <span
                    className="rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide text-white"
                    style={{
                        backgroundColor: time.palette.badgeBg,
                        boxShadow: `inset 0 0 0 1px ${time.palette.badgeRing}`,
                    }}
                >
                    {time.temporada}
                </span>
                <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl">
                    {time.heroV2Titulo}
                </h1>
                <p className="max-w-md text-base text-white/80 md:text-lg">
                    {time.heroV2Subtitulo}
                </p>
            </div>
        </div>
    </section>
);

const Experiences = ({ time }: { time: TimeConfig }) => (
    <section id="experiencias" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {time.eventos.map((evento) => (
            <EventCard key={evento.id} evento={evento} accent={time.palette.accent} />
        ))}
    </section>
);

/* ------------------------------------------------------------------ */
/*  Dependents notice (pre-purchase prerequisite) — shared            */
/* ------------------------------------------------------------------ */

const DEPENDENTS_URL = "https://awa-profile.ingresse.com/dependents";

const DependentsNotice = ({ time }: { time: TimeConfig }) => (
    <section
        role="note"
        aria-label="Aviso sobre cadastro de dependentes"
        className="flex flex-col gap-5 rounded-2xl p-5 md:flex-row md:items-center md:justify-between md:gap-6 md:p-6"
        style={{
            backgroundColor: time.palette.accentSoft,
            boxShadow: `inset 0 0 0 1px ${time.palette.accentRing}`,
        }}
    >
        <div className="flex items-start gap-4">
            {time.featuredIconColor === "gray" ? (
                <FeaturedIcon icon={Users} size="lg" color="gray" theme="gradient" />
            ) : (
                <span
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: time.palette.accent, boxShadow: `0 0 0 4px ${time.palette.accentSoft}` }}
                >
                    <Users className="size-6" data-icon />
                </span>
            )}
            <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold text-white md:text-lg">
                    Vai ao jogo acompanhado?
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
                    Para liberar ingressos exclusivos e curtir o ao vivo com seu dependente,
                    cadastre-o{" "}
                    <span className="font-semibold text-white">antes de iniciar a compra</span>.
                </p>
            </div>
        </div>

        <a
            href={DEPENDENTS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition duration-100 ease-linear hover:brightness-105"
            style={{ backgroundColor: time.palette.accent }}
        >
            Cadastrar dependentes
            <ArrowUpRight className="size-4" aria-hidden="true" />
        </a>
    </section>
);

/* ------------------------------------------------------------------ */
/*  Footer — shared                                                   */
/* ------------------------------------------------------------------ */

const SOCIALS = [
    { id: "instagram", icon: Instagram, label: "Instagram" },
    { id: "facebook", icon: Facebook, label: "Facebook" },
    { id: "x", icon: Twitter, label: "X" },
    { id: "youtube", icon: Youtube, label: "YouTube" },
];

const Footer = ({ time }: { time: TimeConfig }) => {
    const [firstWord, ...rest] = time.nomeCompleto.split(" ");
    return (
        <footer
            className="flex flex-col gap-10 rounded-3xl px-6 py-10 text-white md:px-12 md:py-12"
            style={{
                backgroundColor: time.palette.accent,
                boxShadow: `inset 0 0 0 1px ${time.palette.accentRing}`,
            }}
        >
            <div className="flex flex-col gap-10 md:flex-row md:justify-between">
                <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                    {firstWord}
                    <br />
                    {rest.join(" ")}
                </h2>

                <div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
                    <nav className="flex flex-col gap-3">
                        <span className="text-sm font-bold">Canais oficiais</span>
                        <FooterLink>{time.footer.site}</FooterLink>
                        <FooterLink>{time.footer.loja}</FooterLink>
                        <FooterLink>{time.footer.fale}</FooterLink>
                    </nav>

                    <div className="flex max-w-xs flex-col gap-3">
                        <span className="text-sm font-bold">{time.footer.siga}</span>
                        <p className="text-sm text-white/85">{time.footer.sigaDescricao}</p>
                        <div className="flex items-center gap-4 pt-1">
                            {SOCIALS.map(({ id, icon: Icon, label }) => (
                                <a
                                    key={id}
                                    href="#"
                                    aria-label={label}
                                    className="text-white transition-opacity duration-100 ease-linear hover:opacity-80"
                                >
                                    <Icon className="size-5" />
                                </a>
                            ))}
                            <a
                                href="#"
                                className="text-sm font-bold italic text-white transition-opacity duration-100 ease-linear hover:opacity-80"
                            >
                                flickr
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-px w-full bg-white/30" />

            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-white/80">Powered by</span>
                    <img src={IngresseLogo} alt="Ingresse" className="h-5 w-auto" />
                </div>

                <LanguageSelector />
            </div>
        </footer>
    );
};

const FooterLink = ({ children }: { children: string }) => (
    <a
        href="#"
        className="text-sm text-white/85 transition-opacity duration-100 ease-linear hover:opacity-80"
    >
        {children}
    </a>
);

const LANGUAGES = [
    { id: "es", label: "ES", flag: "🇪🇸" },
    { id: "en", label: "EN", flag: "🇺🇸" },
    { id: "pt", label: "PT", flag: "🇧🇷" },
];

const LanguageSelector = () => (
    <div className="flex items-center gap-4">
        {LANGUAGES.map((lang) => (
            <span
                key={lang.id}
                className={cx(
                    "flex items-center gap-1.5 text-sm",
                    lang.id === "pt" ? "font-bold text-white" : "text-white/70",
                )}
            >
                {lang.label} <span aria-hidden="true">{lang.flag}</span>
            </span>
        ))}
    </div>
);
