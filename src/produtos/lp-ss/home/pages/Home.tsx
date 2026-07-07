import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowRight, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, ClockStopwatch, HeartHand, MarkerPin01, Menu01, UsersPlus, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { VersaoSwitch } from "../../components/VersaoSwitch";
import { BABY, EVENTO, FAQ, INCLUSAO, KITS, LARGADAS_INTRO, LOTES_DATAS, LOTES_OBS, ONDAS, SOBRE } from "../data/evento";

const ACCENT = "#E30613";

export function Home() {
    const [menuAberto, setMenuAberto] = useState(false);
    const [faqAberto, setFaqAberto] = useState<number | null>(0);

    const heroCtaRef = useRef<HTMLAnchorElement>(null);
    const footerRef = useRef<HTMLElement>(null);
    const [heroOut, setHeroOut] = useState(false);
    const [footerIn, setFooterIn] = useState(false);
    useEffect(() => {
        const hero = heroCtaRef.current;
        const footer = footerRef.current;
        const obsHero = hero && new IntersectionObserver(([e]) => setHeroOut(!e.isIntersecting), { threshold: 0 });
        const obsFooter = footer && new IntersectionObserver(([e]) => setFooterIn(e.isIntersecting), { threshold: 0 });
        if (hero && obsHero) obsHero.observe(hero);
        if (footer && obsFooter) obsFooter.observe(footer);
        return () => {
            obsHero && obsHero.disconnect();
            obsFooter && obsFooter.disconnect();
        };
    }, []);
    const ctaFixo = heroOut && !footerIn;

    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const scrollSuave = (e: React.MouseEvent, href: string) => {
        if (!href.startsWith("#")) return;
        const el = document.querySelector(href);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setMenuAberto(false);
    };

    const nav = [
        { label: "Início", href: "#topo" },
        { label: "Sobre", href: "#sobre" },
        { label: "Kits", href: "#kit" },
        { label: "Programação", href: "#programacao" },
        { label: "Grupos e Benefícios", href: "#grupos-beneficios" },
        { label: "Dúvidas", href: "#faq" },
        { label: "Minhas compras", href: "#inscricao" },
    ];

    return (
        <div className="min-h-dvh scroll-smooth bg-[#0c0c0f] text-white">
            <VersaoSwitch atual="noturno" />
            {/* ===== Header ===== */}
            <header
                className={cx(
                    "fixed inset-x-0 z-50 transition-all duration-500 ease-out",
                    scrolled
                        ? "top-0 border-b border-white/10 bg-[#0c0c0f]/85 backdrop-blur-md"
                        : "top-9 border-b border-transparent bg-gradient-to-b from-black/70 via-black/25 to-transparent",
                )}
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
                    <a href="#topo" className="flex items-center gap-3">
                        <img src="/lp-ss/logo-ts.png" alt="Ticket Sports" className="h-8 w-auto" />
                        <span className="h-6 w-px bg-white/20" />
                        <img src="/lp-ss/logo-ss.png" alt="São Silvestre" className="h-6 w-auto" />
                    </a>
                    <nav className="hidden items-center gap-5 lg:flex">
                        {nav.map((n) => (
                            <Fragment key={n.href}>
                                {n.label === "Minhas compras" && <span className="h-5 w-px bg-white/15" aria-hidden="true" />}
                                <a
                                    href={n.href}
                                    onClick={(e) => scrollSuave(e, n.href)}
                                    className="whitespace-nowrap text-sm font-semibold text-white/70 transition hover:text-white"
                                >
                                    {n.label}
                                </a>
                            </Fragment>
                        ))}
                    </nav>
                    <button
                        type="button"
                        onClick={() => setMenuAberto((v) => !v)}
                        aria-label="Menu"
                        className="flex size-9 items-center justify-center rounded-lg text-white lg:hidden"
                    >
                        {menuAberto ? <XClose className="size-6" /> : <Menu01 className="size-6" />}
                    </button>
                </div>
                {menuAberto && (
                    <nav className="flex flex-col gap-1 border-t border-white/10 px-5 py-3 lg:hidden">
                        {nav.map((n) => (
                            <a
                                key={n.href}
                                href={n.href}
                                onClick={(e) => scrollSuave(e, n.href)}
                                className={cx(
                                    "rounded-lg px-2 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5",
                                    n.label === "Minhas compras" && "mt-1 border-t border-white/10 pt-3.5",
                                )}
                            >
                                {n.label}
                            </a>
                        ))}
                    </nav>
                )}
            </header>

            {/* ===== CTA flutuante (aparece quando o botão do hero sai da tela) ===== */}
            <div
                className={cx(
                    "fixed inset-x-0 bottom-0 z-50 flex justify-center bg-gradient-to-t from-[#0c0c0f] via-[#0c0c0f]/85 to-transparent px-4 pb-6 pt-14 transition-all duration-300",
                    ctaFixo ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
                )}
            >
                <a
                    href="#inscricao"
                    className="rounded-xl px-8 py-4 text-base font-bold text-white shadow-2xl ring-1 ring-white/20 transition hover:opacity-90"
                    style={{ backgroundColor: ACCENT }}
                >
                    Inscreva-se Agora
                </a>
            </div>

            {/* ===== Hero ===== */}
            <section id="topo" className="relative flex min-h-dvh items-center overflow-hidden pt-16">
                <style>{`@keyframes heroZoom{from{transform:scale(1)}to{transform:scale(1.15)}}@media (prefers-reduced-motion:reduce){.hero-zoom{animation:none!important}}`}</style>
                <img
                    src={EVENTO.heroImg}
                    alt=""
                    className="hero-zoom absolute inset-0 size-full object-cover will-change-transform"
                    style={{ animation: "heroZoom 12s ease-out forwards" }}
                />
                {/* Filtro degradê: preto → vermelho escuro */}
                <span className="absolute inset-0 bg-gradient-to-tr from-black via-[#4a0207]/85 to-[#8b0000]/80" />
                {/* Reforço na base para leitura do texto */}
                <span className="absolute inset-0 bg-gradient-to-t from-[#0c0c0f] via-transparent to-transparent" />
                <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-16 text-center md:px-8">
                    <img src="/lp-ss/selo-100.png" alt="100 anos — Corrida Internacional de São Silvestre" className="w-56 max-w-full md:w-80" />
                    <p className="mt-6 text-2xl font-black leading-snug text-white md:text-5xl">{EVENTO.tagline}</p>
                    <p className="mt-4 max-w-3xl text-base text-white/80 md:text-xl">{EVENTO.descricao}</p>
                    <div className="mt-8 inline-flex flex-col divide-y divide-white/15 overflow-hidden rounded-2xl border border-white/15 bg-white/5 text-sm font-semibold text-white/90 backdrop-blur md:flex-row md:divide-x md:divide-y-0">
                        <span className="flex items-center justify-center gap-2 px-6 py-3.5">
                            <Calendar className="size-5" style={{ color: ACCENT }} /> {EVENTO.data} · {EVENTO.hora}
                        </span>
                        <span className="flex items-center justify-center gap-2 px-6 py-3.5">
                            <MarkerPin01 className="size-5" style={{ color: ACCENT }} /> {EVENTO.local}
                        </span>
                        <span className="flex items-center justify-center gap-2 px-6 py-3.5">
                            <ClockStopwatch className="size-5" style={{ color: ACCENT }} /> Inscrições até {EVENTO.inscricoesAte}
                        </span>
                    </div>
                    <div className="mt-8">
                        <a
                            ref={heroCtaRef}
                            href="#inscricao"
                            className="inline-block rounded-xl px-10 py-5 text-lg font-bold text-white shadow-lg transition hover:opacity-90 md:text-xl"
                            style={{ backgroundColor: ACCENT }}
                        >
                            Inscreva-se Agora
                        </a>
                    </div>
                </div>
            </section>

            {/* ===== Sobre ===== */}
            <Secao id="sobre" titulo="Sobre a prova" subtitulo="Uma tradição de fim de ano" primeira>
                <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
                    <div className="flex flex-col">
                        <p className="text-2xl font-black leading-snug text-white md:text-3xl">{SOBRE.lead}</p>
                        <span className="mt-6 h-1 w-12 rounded-full" style={{ backgroundColor: ACCENT }} />
                        {SOBRE.paragrafos.map((p, i) => (
                            <div key={i}>
                                {i > 0 && (
                                    <div className="my-6 flex items-center gap-3" aria-hidden="true">
                                        <span className="h-px w-8" style={{ backgroundColor: ACCENT }} />
                                        <span className="size-1.5 rotate-45" style={{ backgroundColor: ACCENT }} />
                                        <span className="h-px flex-1 bg-white/10" />
                                    </div>
                                )}
                                <p className="text-base leading-relaxed text-white/75 md:text-lg">{p}</p>
                            </div>
                        ))}
                    </div>
                    <img
                        src={SOBRE.imagem}
                        alt=""
                        className="aspect-[4/5] w-full rounded-2xl object-cover ring-1 ring-white/10 lg:sticky lg:top-24"
                    />
                </div>
            </Secao>

            {/* ===== Kits ===== */}
            <Secao id="kit" titulo="Kits de participação" subtitulo="Escolha sua experiência" alt>
                <KitCarousel />
            </Secao>

            {/* ===== Programação ===== */}
            <Secao id="programacao" titulo="Programação" subtitulo="Datas, lotes e largadas">
                <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                    {/* Coluna 1 — Datas e lotes */}
                    <div className="flex h-full flex-col gap-6">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-7">
                            <h3 className="flex items-center gap-2 text-xl font-black text-white">
                                <span className="h-5 w-1 rounded-full" style={{ backgroundColor: ACCENT }} /> Datas e lotes
                            </h3>
                            <ul className="mt-4 flex flex-col">
                                {LOTES_DATAS.map((l, i) => (
                                    <li key={l.nome} className={cx("flex items-center justify-between gap-3 py-3", i > 0 && "border-t border-white/10")}>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white">{l.nome}</span>
                                            <span className="text-sm text-white/55">{l.data}</span>
                                        </div>
                                        {l.esgotado && (
                                            <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/70">Esgotado</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-4 rounded-lg bg-white/[0.04] p-3 text-xs leading-relaxed text-white/60">{LOTES_OBS}</p>
                        </div>

                        <div className="flex flex-1 flex-col rounded-2xl border p-6 md:p-7" style={{ borderColor: `${ACCENT}55`, backgroundColor: `${ACCENT}12` }}>
                            <h3 className="text-xl font-black text-white">{INCLUSAO.titulo}</h3>
                            <p className="mt-1 text-sm text-white/70">{INCLUSAO.intro}</p>
                            <ul className="mt-4 flex flex-col gap-3">
                                {INCLUSAO.itens.map((it) => (
                                    <li key={it.titulo} className="flex gap-3">
                                        <span className="text-2xl leading-none">{it.emoji}</span>
                                        <p className="text-sm text-white/80">
                                            <strong className="text-white">{it.titulo}:</strong> {it.texto}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-4 text-xs italic text-white/50">Obs.: {INCLUSAO.obs}</p>

                            {/* Faixa decorativa ancorada no fundo */}
                            <div className="mt-auto flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4 pt-4">
                                <div className="flex -space-x-2">
                                    {INCLUSAO.itens.map((it) => (
                                        <span
                                            key={it.titulo}
                                            className="flex size-10 items-center justify-center rounded-full bg-[#0c0c0f] text-lg ring-2 ring-white/10"
                                        >
                                            {it.emoji}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-sm font-black leading-tight text-white">
                                    Todo mundo tem seu lugar <span style={{ color: ACCENT }}>na largada.</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Coluna 2 — Horário das largadas */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-7">
                        <h3 className="flex items-center gap-2 text-xl font-black text-white">
                            <span className="h-5 w-1 rounded-full" style={{ backgroundColor: ACCENT }} /> Horário das largadas
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-white/60">{LARGADAS_INTRO}</p>
                        <ul className="mt-5 flex flex-col gap-3">
                            {ONDAS.map((o) => (
                                <li key={o.onda} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex min-w-[64px] shrink-0 items-center justify-center rounded-lg py-1.5 text-sm font-black text-white" style={{ backgroundColor: ACCENT }}>
                                            {o.hora.includes("h") && !o.hora.includes("partir") ? o.hora : "Kids"}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: ACCENT }}>{o.onda}</span>
                                            <span className="text-sm font-bold text-white">{o.nome}</span>
                                            {o.detalhe && <span className="text-xs text-white/55">{o.hora.includes("partir") ? `${o.hora} · ` : ""}{o.detalhe}</span>}
                                        </div>
                                    </div>
                                    {o.sub && (
                                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 sm:grid-cols-3">
                                            {o.sub.map((s) => (
                                                <div key={s.hora} className="flex flex-col rounded-lg bg-white/[0.05] px-2.5 py-1.5">
                                                    <span className="text-sm font-bold text-white">{s.hora}</span>
                                                    <span className="text-xs text-white/55">{s.texto}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            ))}
                            <li className="rounded-xl border border-dashed border-white/15 p-4">
                                <span className="text-sm font-bold text-white">{BABY.nome}</span>
                                <p className="mt-0.5 text-xs text-white/60">{BABY.texto}</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </Secao>

            {/* ===== Grupos e Benefícios ===== */}
            <Secao id="grupos-beneficios" titulo="Grupos e Benefícios" subtitulo="Vagas especiais" alt>
                <div className="grid gap-6 md:grid-cols-2">
                    {[
                        {
                            icon: UsersPlus,
                            titulo: "Grupos Esportivos",
                            texto: "Solicite vagas para sua equipe, grupo esportivo ou assessoria da corrida.",
                            cta: "Solicitar vagas para grupo",
                        },
                        {
                            icon: HeartHand,
                            titulo: "Benefício PCD",
                            texto: "Solicite a análise do seu benefício enviando seus dados e documentos comprobatórios.",
                            cta: "Solicitar benefício",
                        },
                    ].map((c) => (
                        <div
                            key={c.titulo}
                            className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]"
                        >
                            {/* Ícone marca-d'água ao fundo */}
                            <c.icon className="pointer-events-none absolute -right-6 -top-6 size-40 text-white/[0.04] transition duration-500 group-hover:scale-110" />

                            <span className="flex size-14 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: ACCENT }}>
                                <c.icon className="size-7" />
                            </span>
                            <h3 className="mt-5 text-2xl font-black text-white">{c.titulo}</h3>
                            <p className="mt-2 max-w-sm text-base leading-relaxed text-white/70">{c.texto}</p>
                            <button
                                type="button"
                                className="group/btn mt-6 inline-flex w-max items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/40 hover:bg-white/10"
                            >
                                {c.cta}
                                <ArrowRight className="size-4 transition group-hover/btn:translate-x-0.5" style={{ color: ACCENT }} />
                            </button>
                        </div>
                    ))}
                </div>
            </Secao>

            {/* ===== FAQ ===== */}
            <section id="faq" className="scroll-mt-16 border-t border-white/10 bg-white/[0.02]">
                <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-[minmax(0,0.9fr)_1.6fr] md:gap-12 md:px-8 md:py-24">
                    {/* Cabeçalho (esquerda) */}
                    <div className="md:sticky md:top-28 md:self-start">
                        <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                            Antes de correr
                        </span>
                        <h2 className="mt-1 text-3xl font-black tracking-tight text-white md:text-5xl">Dúvidas frequentes</h2>
                        <p className="mt-4 max-w-xs text-base text-white/60">
                            Tudo o que você precisa saber sobre inscrição, acesso e suporte. Não achou sua dúvida?
                        </p>
                        <a
                            href="#grupos-beneficios"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-80"
                            style={{ color: ACCENT }}
                        >
                            Fale com a gente <ArrowRight className="size-4" />
                        </a>
                    </div>

                    {/* Lista de perguntas (direita) */}
                    <div className="flex flex-col gap-3">
                        {FAQ.map((f, i) => {
                            const aberto = faqAberto === i;
                            return (
                                <div
                                    key={i}
                                    className={cx(
                                        "overflow-hidden rounded-2xl border transition duration-200",
                                        aberto ? "border-white/20 bg-white/[0.06]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]",
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setFaqAberto(aberto ? null : i)}
                                        className="flex w-full items-center gap-4 p-5 text-left"
                                    >
                                        <span className="text-sm font-black tabular-nums" style={{ color: ACCENT }}>
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <span className="flex-1 text-base font-bold text-white">{f.q}</span>
                                        <span
                                            className={cx(
                                                "flex size-8 shrink-0 items-center justify-center rounded-full border transition duration-300",
                                                aberto ? "rotate-180 border-transparent text-white" : "border-white/20 text-white/60",
                                            )}
                                            style={aberto ? { backgroundColor: ACCENT } : undefined}
                                        >
                                            <ChevronDown className="size-4" />
                                        </span>
                                    </button>
                                    <div className={cx("grid transition-all duration-300", aberto ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                                        <div className="overflow-hidden">
                                            <p className="px-5 pb-5 pl-14 text-sm leading-relaxed text-white/70">{f.a}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ===== Footer ===== */}
            <footer ref={footerRef} className="border-t border-white/10 bg-black/40">
                <div className="mx-auto max-w-6xl px-5 py-8 text-center text-sm text-white/50 md:px-8">
                    © 2026 São Silvestre. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
}

function KitCarousel() {
    const [idx, setIdx] = useState(0);
    const total = KITS.length;
    const ir = (n: number) => setIdx((n + total) % total);

    return (
        <div className="flex flex-col gap-5">
            {/* Intro + seletor de kits (mesma linha) */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-base text-white/70 md:whitespace-nowrap md:text-lg">
                    Você pode escolher entre diferentes <strong className="text-white">kits de participação</strong>:
                </p>
                <div className="inline-flex flex-wrap gap-1 self-start rounded-full border border-white/10 bg-white/5 p-1 md:self-auto">
                    {KITS.map((k, i) => (
                        <button
                            key={k.id}
                            type="button"
                            onClick={() => setIdx(i)}
                            className={cx(
                                "rounded-full px-4 py-2 text-sm font-bold transition",
                                i === idx ? "text-white shadow-sm" : "text-white/55 hover:text-white",
                            )}
                            style={i === idx ? { backgroundColor: ACCENT } : undefined}
                        >
                            {k.nome}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
                    {KITS.map((k) => (
                        <div key={k.id} className="w-full shrink-0">
                            <div className="grid gap-0 md:h-[440px] md:grid-cols-2">
                                {/* Imagem */}
                                <div className="relative aspect-[4/3] bg-neutral-100 md:aspect-auto md:h-full">
                                    <img src={k.imagem} alt={k.nome} className="size-full object-cover" />
                                    {/* Fade suave para o painel de texto (embaixo no mobile, à direita no desktop) */}
                                    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-white md:hidden" />
                                    <span className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 bg-gradient-to-r from-transparent to-white md:block" />
                                    {k.destaque && (
                                        <span className="absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: ACCENT }}>
                                            Mais escolhido
                                        </span>
                                    )}
                                </div>
                                {/* Detalhes */}
                                <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
                                    <div>
                                        <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                                            Kit {idx + 1} de {total}
                                        </span>
                                        <h3 className="mt-1 text-3xl font-black text-neutral-900 md:text-4xl">{k.nome}</h3>
                                        <p className="mt-1 text-neutral-500">{k.resumo}</p>
                                    </div>
                                    <ul className="flex flex-col gap-2.5">
                                        {k.base && (
                                            <li className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-sm font-bold text-neutral-900">
                                                <span className="flex size-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: ACCENT }}>
                                                    <Check className="size-3.5" />
                                                </span>
                                                {k.base}
                                            </li>
                                        )}
                                        {k.itens.map((item) => (
                                            <li key={item} className="flex items-center gap-2 text-sm text-neutral-700 md:text-base">
                                                <Check className="size-4 shrink-0" style={{ color: ACCENT }} /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Setas */}
                <button
                    type="button"
                    onClick={() => ir(idx - 1)}
                    aria-label="Kit anterior"
                    className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-800 shadow-sm backdrop-blur transition hover:bg-white"
                >
                    <ChevronLeft className="size-6" />
                </button>
                <button
                    type="button"
                    onClick={() => ir(idx + 1)}
                    aria-label="Próximo kit"
                    className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-800 shadow-sm backdrop-blur transition hover:bg-white"
                >
                    <ChevronRight className="size-6" />
                </button>
            </div>
        </div>
    );
}

function Secao({
    id,
    titulo,
    subtitulo,
    alt,
    light,
    primeira,
    children,
}: {
    id: string;
    titulo: string;
    subtitulo: string;
    alt?: boolean;
    light?: boolean;
    primeira?: boolean;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className={cx("scroll-mt-16", !primeira && "border-t border-white/10", light ? "bg-white text-neutral-900" : alt && "bg-white/[0.02]")}>
            <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
                <div className="mb-8 md:mb-12">
                    <span className="text-sm font-bold uppercase tracking-widest" style={{ color: ACCENT }}>
                        {subtitulo}
                    </span>
                    <h2 className={cx("mt-1 text-3xl font-black tracking-tight md:text-5xl", light ? "text-neutral-900" : "text-white")}>
                        {titulo}
                    </h2>
                </div>
                {children}
            </div>
        </section>
    );
}
