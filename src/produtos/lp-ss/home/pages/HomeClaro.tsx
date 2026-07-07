import { useEffect, useRef, useState } from "react";
import { ArrowRight, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, ClockStopwatch, HeartHand, MarkerPin01, UsersPlus } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { VersaoSwitch } from "../../components/VersaoSwitch";
import { BABY, EVENTO, FAQ, INCLUSAO, KITS, LARGADAS_INTRO, LOTES_DATAS, LOTES_OBS, ONDAS, SOBRE } from "../data/evento";

const ACCENT = "#E30613";

/** Versão CLARA (fundo branco, texto escuro, acento vermelho). */
export function HomeClaro() {
    const [faqAberto, setFaqAberto] = useState<number | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const heroCtaRef = useRef<HTMLAnchorElement>(null);
    const footerRef = useRef<HTMLElement>(null);
    const [heroOut, setHeroOut] = useState(false);
    const [footerIn, setFooterIn] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    useEffect(() => {
        const hero = heroCtaRef.current;
        const footer = footerRef.current;
        const o1 = hero && new IntersectionObserver(([e]) => setHeroOut(!e.isIntersecting), { threshold: 0 });
        const o2 = footer && new IntersectionObserver(([e]) => setFooterIn(e.isIntersecting), { threshold: 0 });
        if (hero && o1) o1.observe(hero);
        if (footer && o2) o2.observe(footer);
        return () => {
            o1 && o1.disconnect();
            o2 && o2.disconnect();
        };
    }, []);
    const ctaFixo = heroOut && !footerIn;

    const nav = [
        { label: "Sobre", href: "#sobre" },
        { label: "Kits", href: "#kits" },
        { label: "Programação", href: "#programacao" },
        { label: "Grupos e Benefícios", href: "#grupos-beneficios" },
        { label: "Dúvidas", href: "#faq" },
        { label: "Minhas compras", href: "#minhas-compras" },
    ];

    return (
        <div className="min-h-dvh bg-white pt-9 text-neutral-900">
            <VersaoSwitch atual="claro" />

            {/* Header */}
            <header
                className={cx(
                    "fixed inset-x-0 z-50 transition-all duration-300",
                    scrolled ? "top-0 border-b border-white/10 bg-black/85 backdrop-blur-md" : "top-9 border-b border-transparent bg-gradient-to-b from-black/75 via-black/30 to-transparent",
                )}
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
                    <a href="#topo" className="flex items-center gap-3">
                        <img src="/lp-ss/logo-ts.png" alt="Ticket Sports" className="h-8 w-auto" />
                        <span className="h-6 w-px bg-white/30" />
                        <img src="/lp-ss/logo-ss.png" alt="São Silvestre" className="h-6 w-auto" />
                    </a>
                    <nav className="hidden flex-wrap items-center gap-x-5 gap-y-1 lg:flex">
                        {nav.map((n) => (
                            <a key={n.href} href={n.href} className="text-sm font-semibold text-white/80 transition hover:text-white">
                                {n.label}
                            </a>
                        ))}
                    </nav>
                </div>
            </header>

            {/* CTA flutuante */}
            <div
                className={cx(
                    "fixed inset-x-0 bottom-0 z-50 flex justify-center bg-gradient-to-t from-white via-white/85 to-transparent px-4 pb-6 pt-14 transition-all duration-300",
                    ctaFixo ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
                )}
            >
                <a href="#kits" className="rounded-xl px-8 py-4 text-base font-bold text-white shadow-2xl transition hover:opacity-90" style={{ backgroundColor: ACCENT }}>
                    Inscreva-se Agora
                </a>
            </div>

            {/* Hero (com imagem) */}
            <section id="topo" className="relative overflow-hidden">
                <style>{`@keyframes heroZoom{from{transform:scale(1)}to{transform:scale(1.15)}}@media (prefers-reduced-motion:reduce){.hero-zoom{animation:none!important}}`}</style>
                <img
                    src={EVENTO.heroImg}
                    alt=""
                    className="hero-zoom absolute inset-0 size-full object-cover will-change-transform"
                    style={{ animation: "heroZoom 12s ease-out forwards" }}
                />
                {/* Filtro degradê: vermelho → branco */}
                <span className="absolute inset-0 bg-gradient-to-b from-[#7a0a10]/90 via-[#7a0a10]/70 to-white" />
                <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-5 py-24 text-center text-white md:px-8 md:py-32">
                    <img src="/lp-ss/selo-100.png" alt="100 anos — São Silvestre" className="w-52 max-w-full md:w-72" />
                    <p className="mt-6 text-2xl font-black leading-snug drop-shadow md:text-4xl">{EVENTO.tagline}</p>
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg">{EVENTO.descricao}</p>

                    <div className="mt-8 inline-flex flex-col divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-900 shadow-xl md:flex-row md:divide-x md:divide-y-0">
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
                        <a ref={heroCtaRef} href="#kits" className="inline-block rounded-xl px-10 py-5 text-lg font-bold text-white shadow-lg transition hover:opacity-90 md:text-xl" style={{ backgroundColor: ACCENT }}>
                            Inscreva-se Agora
                        </a>
                    </div>
                </div>
            </section>

            {/* Sobre */}
            <Secao id="sobre" chapeu="Uma tradição de fim de ano" titulo="Sobre a prova">
                <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
                    <div className="flex flex-col">
                        <p className="text-2xl font-black leading-snug md:text-3xl">{SOBRE.lead}</p>
                        <span className="mt-6 h-1 w-12 rounded-full" style={{ backgroundColor: ACCENT }} />
                        {SOBRE.paragrafos.map((p, i) => (
                            <div key={i}>
                                {i > 0 && (
                                    <div className="my-6 flex items-center gap-3" aria-hidden="true">
                                        <span className="h-px w-8" style={{ backgroundColor: ACCENT }} />
                                        <span className="size-1.5 rotate-45" style={{ backgroundColor: ACCENT }} />
                                        <span className="h-px flex-1 bg-neutral-200" />
                                    </div>
                                )}
                                <p className="text-base leading-relaxed text-neutral-700 md:text-lg">{p}</p>
                            </div>
                        ))}
                    </div>
                    <img src={SOBRE.imagem} alt="Corredores em uma prova de corrida de rua" className="aspect-[4/5] w-full rounded-2xl border border-neutral-200 object-cover lg:sticky lg:top-24" />
                </div>
            </Secao>

            {/* Kits */}
            <Secao id="kits" chapeu="Escolha sua experiência" titulo="Kits de participação" alt>
                <KitCarouselClaro />
            </Secao>

            {/* Programação */}
            <Secao id="programacao" chapeu="Datas, lotes e largadas" titulo="Programação">
                <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                    <div className="flex h-full flex-col gap-6">
                        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                            <h3 className="flex items-center gap-2 text-xl font-black">
                                <span className="h-5 w-1 rounded-full" style={{ backgroundColor: ACCENT }} /> Datas e lotes
                            </h3>
                            <ul className="mt-4 flex flex-col divide-y divide-neutral-200">
                                {LOTES_DATAS.map((l) => (
                                    <li key={l.nome} className="flex items-center justify-between gap-3 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{l.nome}</span>
                                            <span className="text-sm text-neutral-500">{l.data}</span>
                                        </div>
                                        {l.esgotado && <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-500">Esgotado</span>}
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-4 rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-500">{LOTES_OBS}</p>
                        </div>
                        <div className="flex flex-1 flex-col rounded-2xl border p-6" style={{ borderColor: `${ACCENT}40`, backgroundColor: `${ACCENT}0d` }}>
                            <h3 className="text-xl font-black">{INCLUSAO.titulo}</h3>
                            <p className="mt-1 text-sm text-neutral-600">{INCLUSAO.intro}</p>
                            <ul className="mt-4 flex flex-col gap-3">
                                {INCLUSAO.itens.map((it) => (
                                    <li key={it.titulo} className="flex gap-3">
                                        <span className="text-2xl leading-none">{it.emoji}</span>
                                        <p className="text-sm text-neutral-700">
                                            <strong className="text-neutral-900">{it.titulo}:</strong> {it.texto}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-4 text-xs italic text-neutral-500">Obs.: {INCLUSAO.obs}</p>
                            <div className="mt-auto flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                                <div className="flex -space-x-2">
                                    {INCLUSAO.itens.map((it) => (
                                        <span key={it.titulo} className="flex size-10 items-center justify-center rounded-full bg-neutral-100 text-lg ring-2 ring-white">
                                            {it.emoji}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-sm font-black leading-tight">
                                    Todo mundo tem seu lugar <span style={{ color: ACCENT }}>na largada.</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                        <h3 className="flex items-center gap-2 text-xl font-black">
                            <span className="h-5 w-1 rounded-full" style={{ backgroundColor: ACCENT }} /> Horário das largadas
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{LARGADAS_INTRO}</p>
                        <ul className="mt-5 flex flex-col gap-3">
                            {ONDAS.map((o) => (
                                <li key={o.onda} className="rounded-xl border border-neutral-200 p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex min-w-[64px] shrink-0 items-center justify-center rounded-lg py-1.5 text-sm font-black text-white" style={{ backgroundColor: ACCENT }}>
                                            {o.hora.includes("h") && !o.hora.includes("partir") ? o.hora : "Kids"}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: ACCENT }}>{o.onda}</span>
                                            <span className="text-sm font-bold">{o.nome}</span>
                                            {o.detalhe && <span className="text-xs text-neutral-500">{o.hora.includes("partir") ? `${o.hora} · ` : ""}{o.detalhe}</span>}
                                        </div>
                                    </div>
                                    {o.sub && (
                                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-neutral-200 pt-3 sm:grid-cols-3">
                                            {o.sub.map((s) => (
                                                <div key={s.hora} className="flex flex-col rounded-lg bg-neutral-50 px-2.5 py-1.5">
                                                    <span className="text-sm font-bold">{s.hora}</span>
                                                    <span className="text-xs text-neutral-500">{s.texto}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            ))}
                            <li className="rounded-xl border border-dashed border-neutral-300 p-4">
                                <span className="text-sm font-bold">{BABY.nome}</span>
                                <p className="mt-0.5 text-xs text-neutral-500">{BABY.texto}</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </Secao>

            {/* Grupos e Benefícios */}
            <Secao id="grupos-beneficios" chapeu="Vagas especiais" titulo="Grupos e Benefícios" alt>
                <div className="grid gap-6 md:grid-cols-2">
                    {[
                        { icon: UsersPlus, titulo: "Grupos Esportivos", texto: "Solicite vagas para sua equipe, grupo esportivo ou assessoria da corrida.", cta: "Solicitar vagas para grupo" },
                        { icon: HeartHand, titulo: "Benefício PCD", texto: "Solicite a análise do seu benefício enviando seus dados e documentos comprobatórios.", cta: "Solicitar benefício" },
                    ].map((c) => (
                        <div key={c.titulo} className="flex flex-col rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
                            <span className="flex size-14 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: ACCENT }}>
                                <c.icon className="size-7" />
                            </span>
                            <h3 className="mt-5 text-2xl font-black">{c.titulo}</h3>
                            <p className="mt-2 flex-1 text-base leading-relaxed text-neutral-600">{c.texto}</p>
                            <button type="button" className="group/btn mt-6 inline-flex w-max items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold transition hover:border-neutral-900">
                                {c.cta}
                                <ArrowRight className="size-4 transition group-hover/btn:translate-x-0.5" style={{ color: ACCENT }} />
                            </button>
                        </div>
                    ))}
                </div>
            </Secao>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-24 border-b border-neutral-200 bg-neutral-50">
                <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-[minmax(0,0.9fr)_1.6fr] md:gap-12 md:px-8 md:py-24">
                    <div className="md:sticky md:top-32 md:self-start">
                        <p className="text-sm font-bold uppercase tracking-widest" style={{ color: ACCENT }}>Antes de correr</p>
                        <h2 className="mt-1 text-3xl font-black md:text-5xl">Dúvidas frequentes</h2>
                    </div>
                    <div className="flex flex-col gap-3">
                        {FAQ.map((f, i) => {
                            const aberto = faqAberto === i;
                            return (
                                <div key={i} className={cx("overflow-hidden rounded-2xl border transition", aberto ? "border-neutral-300 bg-white shadow-sm" : "border-neutral-200 bg-white")}>
                                    <button type="button" onClick={() => setFaqAberto(aberto ? null : i)} className="flex w-full items-center gap-4 p-5 text-left">
                                        <span className="text-sm font-black tabular-nums" style={{ color: ACCENT }}>{String(i + 1).padStart(2, "0")}</span>
                                        <span className="flex-1 text-base font-bold">{f.q}</span>
                                        <ChevronDown className={cx("size-5 shrink-0 text-neutral-500 transition", aberto && "rotate-180")} />
                                    </button>
                                    {aberto && <p className="px-5 pb-5 pl-14 text-sm leading-relaxed text-neutral-600">{f.a}</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <footer ref={footerRef} className="border-t border-neutral-200">
                <div className="mx-auto max-w-6xl px-5 py-8 text-center text-sm text-neutral-500 md:px-8">© 2026 São Silvestre. Todos os direitos reservados.</div>
            </footer>
        </div>
    );
}

function KitCarouselClaro() {
    const [idx, setIdx] = useState(0);
    const total = KITS.length;
    const ir = (n: number) => setIdx((n + total) % total);

    return (
        <div className="flex flex-col gap-5">
            {/* Intro + seletor */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-base text-neutral-600 md:whitespace-nowrap md:text-lg">
                    Você pode escolher entre diferentes <strong className="text-neutral-900">kits de participação</strong>:
                </p>
                <div className="inline-flex flex-wrap gap-1 self-start rounded-full border border-neutral-200 bg-white p-1 md:self-auto">
                    {KITS.map((k, i) => (
                        <button
                            key={k.id}
                            type="button"
                            onClick={() => setIdx(i)}
                            className={cx("rounded-full px-4 py-2 text-sm font-bold transition", i === idx ? "text-white" : "text-neutral-500 hover:text-neutral-900")}
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
                                <div className="relative aspect-[4/3] bg-neutral-100 md:aspect-auto md:h-full">
                                    <img src={k.imagem} alt={k.nome} className="size-full object-cover" />
                                    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-white md:hidden" />
                                    <span className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 bg-gradient-to-r from-transparent to-white md:block" />
                                    {k.destaque && (
                                        <span className="absolute left-4 top-4 z-10 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: ACCENT }}>
                                            Mais escolhido
                                        </span>
                                    )}
                                </div>
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

function Secao({ id, chapeu, titulo, alt, children }: { id: string; chapeu: string; titulo: string; alt?: boolean; children: React.ReactNode }) {
    return (
        <section id={id} className={cx("scroll-mt-24 border-b border-neutral-200", alt && "bg-neutral-50")}>
            <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
                <p className="text-sm font-bold uppercase tracking-widest" style={{ color: ACCENT }}>{chapeu}</p>
                <h2 className="mt-1 mb-8 text-3xl font-black tracking-tight md:text-5xl">{titulo}</h2>
                {children}
            </div>
        </section>
    );
}
