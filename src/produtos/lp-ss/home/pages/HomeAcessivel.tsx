import { useEffect, useState } from "react";
import { Calendar, Check, ChevronDown, ClockStopwatch, MarkerPin01, Menu01, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { VersaoSwitch } from "../../components/VersaoSwitch";
import { BABY, EVENTO, FAQ, INCLUSAO, KITS, LARGADAS_INTRO, LOTES_DATAS, LOTES_OBS, ONDAS, SOBRE } from "../data/evento";

/**
 * Versão ACESSÍVEL (preto e branco / alto contraste) da landing page.
 * Objetivo do teste: demonstrar, na prática, boas práticas de acessibilidade web:
 * - Skip link ("Pular para o conteúdo")
 * - Marcos semânticos (header/nav/main/section/footer) com rótulos
 * - Foco visível em todos os elementos interativos
 * - Hierarquia de títulos correta (h1 → h2 → h3)
 * - Accordion com aria-expanded / aria-controls
 * - Contraste alto (texto preto sobre fundo branco)
 * - Não depender apenas de cor (status também vêm em texto)
 * - Imagens com alt e em tons de cinza (foco no conteúdo)
 */
export function HomeAcessivel() {
    const [faqAberto, setFaqAberto] = useState<number | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [menuAberto, setMenuAberto] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const nav = [
        { label: "Sobre", href: "#sobre" },
        { label: "Kits", href: "#kits" },
        { label: "Programação", href: "#programacao" },
        { label: "Grupos e Benefícios", href: "#grupos-beneficios" },
        { label: "Dúvidas", href: "#faq" },
        { label: "Minhas compras", href: "#minhas-compras" },
    ];

    return (
        <div className="a11y min-h-dvh bg-white pt-9 text-black">
            <VersaoSwitch atual="pcd" />
            <style>{`
.a11y :focus-visible{outline:3px solid #000;outline-offset:3px;border-radius:2px}
.a11y a{text-underline-offset:3px}
@media (prefers-reduced-motion:reduce){.a11y *{scroll-behavior:auto!important}}
`}</style>

            {/* Skip link — primeiro elemento focável */}
            <a
                href="#conteudo"
                className="sr-only left-4 top-4 z-[100] rounded-md bg-black px-4 py-2 text-sm font-bold text-white focus:not-sr-only focus:absolute"
            >
                Pular para o conteúdo
            </a>

            {/* ===== Cabeçalho ===== */}
            <header className={cx("sticky z-50 border-b-2 border-black bg-white transition-all duration-300", scrolled ? "top-0" : "top-9")}>
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
                    <a href="#topo" className="flex items-center gap-2.5 text-lg font-black tracking-tight" aria-label="Ticket Sports e São Silvestre — início">
                        TICKET SPORTS
                        <span className="h-5 w-px bg-black" aria-hidden="true" />
                        SÃO SILVESTRE
                    </a>
                    <nav aria-label="Navegação principal" className="hidden flex-wrap items-center gap-x-5 gap-y-1 lg:flex">
                        {nav.map((n) => (
                            <a
                                key={n.href}
                                href={n.href}
                                className="rounded px-1 py-1 text-sm font-semibold text-black underline decoration-transparent underline-offset-4 transition hover:decoration-black focus-visible:decoration-black"
                            >
                                {n.label}
                            </a>
                        ))}
                    </nav>

                    {/* Botão do menu (mobile) */}
                    <button
                        type="button"
                        onClick={() => setMenuAberto((v) => !v)}
                        aria-expanded={menuAberto}
                        aria-controls="menu-mobile"
                        aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
                        className="flex size-11 items-center justify-center rounded-lg border-2 border-black text-black lg:hidden"
                    >
                        {menuAberto ? <XClose className="size-6" /> : <Menu01 className="size-6" />}
                    </button>
                </div>

                {/* Menu mobile */}
                {menuAberto && (
                    <nav id="menu-mobile" aria-label="Navegação" className="flex flex-col border-t-2 border-black lg:hidden">
                        {nav.map((n) => (
                            <a
                                key={n.href}
                                href={n.href}
                                onClick={() => setMenuAberto(false)}
                                className="border-b border-neutral-300 px-5 py-4 text-base font-bold text-black last:border-b-0 hover:bg-neutral-100"
                            >
                                {n.label}
                            </a>
                        ))}
                    </nav>
                )}
            </header>

            <main id="conteudo">
                {/* ===== Hero ===== */}
                <section id="topo" aria-labelledby="hero-titulo" className="border-b-2 border-black">
                    <div className="mx-auto flex max-w-5xl flex-col items-center px-5 py-16 text-center md:px-8 md:py-24">
                        <p className="text-sm font-bold uppercase tracking-widest">{EVENTO.edicao}</p>
                        <h1 id="hero-titulo" className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:whitespace-nowrap lg:text-5xl">
                            Corrida Internacional de São Silvestre
                        </h1>
                        <p className="mt-5 max-w-3xl text-xl font-bold md:text-2xl">{EVENTO.tagline}</p>
                        <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-800 md:text-lg">{EVENTO.descricao}</p>

                        <dl className="mt-8 grid w-full max-w-4xl gap-px overflow-hidden rounded-xl border-2 border-black bg-black text-left sm:grid-cols-3">
                            <div className="bg-white px-5 py-4">
                                <dt className="flex items-center gap-2 text-sm font-bold">
                                    <Calendar aria-hidden="true" className="size-5" /> Data
                                </dt>
                                <dd className="mt-1 text-sm sm:whitespace-nowrap">{EVENTO.data} · {EVENTO.hora}</dd>
                            </div>
                            <div className="bg-white px-5 py-4">
                                <dt className="flex items-center gap-2 text-sm font-bold">
                                    <MarkerPin01 aria-hidden="true" className="size-5" /> Local
                                </dt>
                                <dd className="mt-1 text-sm sm:whitespace-nowrap">{EVENTO.local}</dd>
                            </div>
                            <div className="bg-white px-5 py-4">
                                <dt className="flex items-center gap-2 text-sm font-bold">
                                    <ClockStopwatch aria-hidden="true" className="size-5" /> Inscrições até
                                </dt>
                                <dd className="mt-1 text-sm sm:whitespace-nowrap">{EVENTO.inscricoesAte}</dd>
                            </div>
                        </dl>

                        <a
                            href="#kits"
                            className="mt-8 inline-block rounded-xl bg-black px-10 py-5 text-lg font-bold text-white underline-offset-4 transition hover:bg-neutral-800 md:text-xl"
                        >
                            Inscreva-se Agora
                        </a>
                    </div>
                </section>

                {/* ===== Sobre ===== */}
                <Secao id="sobre" chapeu="Uma tradição de fim de ano" titulo="Sobre a prova">
                    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
                        <div>
                            <p className="text-xl font-black">{SOBRE.lead}</p>
                            <div className="mt-4 flex flex-col gap-4">
                                {SOBRE.paragrafos.map((p, i) => (
                                    <p key={i} className="text-base leading-relaxed text-neutral-800 md:text-lg">
                                        {p}
                                    </p>
                                ))}
                            </div>
                        </div>
                        <img
                            src={SOBRE.imagem}
                            alt="Corredores durante uma prova de corrida de rua"
                            className="aspect-[4/5] w-full rounded-xl border-2 border-black object-cover grayscale"
                        />
                    </div>
                </Secao>

                {/* ===== Kits ===== */}
                <Secao id="kits" chapeu="Escolha sua experiência" titulo="Kits de participação">
                    <p className="mb-6 text-base md:text-lg">Você pode escolher entre diferentes kits de participação:</p>
                    <ul className="grid gap-6 md:grid-cols-3">
                        {KITS.map((k) => (
                            <li key={k.id} className="flex flex-col rounded-xl border-2 border-black p-6">
                                <h3 className="text-xl font-black">{k.nome}</h3>
                                {k.destaque && (
                                    <span className="mt-1 w-max border-2 border-black px-2 py-0.5 text-xs font-bold uppercase">Mais escolhido</span>
                                )}
                                <p className="mt-2 text-sm text-neutral-800">{k.resumo}</p>
                                <ul className="mt-4 flex flex-1 flex-col gap-2">
                                    {k.base && <li className="text-sm font-bold">Inclui: {k.base}</li>}
                                    {k.itens.map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-sm">
                                            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </Secao>

                {/* ===== Programação ===== */}
                <Secao id="programacao" chapeu="Datas, lotes e largadas" titulo="Programação">
                    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                        {/* Datas e lotes */}
                        <div className="flex flex-col gap-6">
                            <div className="rounded-xl border-2 border-black p-6">
                                <h3 className="text-lg font-black">Datas e lotes</h3>
                                <ul className="mt-4 flex flex-col divide-y divide-neutral-300">
                                    {LOTES_DATAS.map((l) => (
                                        <li key={l.nome} className="flex items-center justify-between gap-3 py-3">
                                            <span>
                                                <span className="font-bold">{l.nome}</span> — {l.data}
                                            </span>
                                            {l.esgotado && <span className="shrink-0 border-2 border-black px-2 py-0.5 text-xs font-bold uppercase">Esgotado</span>}
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-4 border-t-2 border-black pt-3 text-sm text-neutral-700">{LOTES_OBS}</p>
                            </div>
                            <div className="rounded-xl border-2 border-black p-6">
                                <h3 className="text-lg font-black">{INCLUSAO.titulo}</h3>
                                <p className="mt-1 text-sm">{INCLUSAO.intro}</p>
                                <ul className="mt-4 flex flex-col gap-3">
                                    {INCLUSAO.itens.map((it) => (
                                        <li key={it.titulo} className="text-sm">
                                            <span className="font-bold">{it.titulo}:</span> {it.texto}
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-4 text-xs italic text-neutral-700">Obs.: {INCLUSAO.obs}</p>
                            </div>
                        </div>

                        {/* Largadas */}
                        <div className="rounded-xl border-2 border-black p-6">
                            <h3 className="text-lg font-black">Horário das largadas</h3>
                            <p className="mt-2 text-sm text-neutral-800">{LARGADAS_INTRO}</p>
                            <ul className="mt-5 flex flex-col gap-3">
                                {ONDAS.map((o) => (
                                    <li key={o.onda} className="rounded-lg border-2 border-black p-4">
                                        <p className="text-sm">
                                            <span className="font-black">{o.onda} · {o.hora}</span> — {o.nome}
                                            {o.detalhe ? ` (${o.detalhe})` : ""}
                                        </p>
                                        {o.sub && (
                                            <ul className="mt-2 grid grid-cols-2 gap-2 border-t-2 border-black pt-2 sm:grid-cols-3">
                                                {o.sub.map((s) => (
                                                    <li key={s.hora} className="text-xs">
                                                        <span className="font-bold">{s.hora}</span> — {s.texto}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                                <li className="rounded-lg border-2 border-dashed border-black p-4">
                                    <p className="text-sm font-bold">{BABY.nome}</p>
                                    <p className="mt-0.5 text-xs text-neutral-700">{BABY.texto}</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </Secao>

                {/* ===== Grupos e Benefícios ===== */}
                <Secao id="grupos-beneficios" chapeu="Vagas especiais" titulo="Grupos e Benefícios">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="flex flex-col rounded-xl border-2 border-black p-6">
                            <h3 className="text-xl font-black">Grupos Esportivos</h3>
                            <p className="mt-2 flex-1 text-sm text-neutral-800">Solicite vagas para sua equipe, grupo esportivo ou assessoria da corrida.</p>
                            <button type="button" className="mt-4 w-max rounded-lg border-2 border-black px-6 py-3 text-sm font-bold transition hover:bg-black hover:text-white">
                                Solicitar vagas para grupo
                            </button>
                        </div>
                        <div className="flex flex-col rounded-xl border-2 border-black p-6">
                            <h3 className="text-xl font-black">Benefício PCD</h3>
                            <p className="mt-2 flex-1 text-sm text-neutral-800">Solicite a análise do seu benefício enviando seus dados e documentos comprobatórios.</p>
                            <button type="button" className="mt-4 w-max rounded-lg border-2 border-black px-6 py-3 text-sm font-bold transition hover:bg-black hover:text-white">
                                Solicitar benefício
                            </button>
                        </div>
                    </div>
                </Secao>

                {/* ===== FAQ ===== */}
                <Secao id="faq" chapeu="Antes de correr" titulo="Dúvidas frequentes">
                    <ul className="flex flex-col gap-3">
                        {FAQ.map((f, i) => {
                            const aberto = faqAberto === i;
                            return (
                                <li key={i} className="rounded-xl border-2 border-black">
                                    <h3>
                                        <button
                                            type="button"
                                            aria-expanded={aberto}
                                            aria-controls={`faq-resposta-${i}`}
                                            id={`faq-pergunta-${i}`}
                                            onClick={() => setFaqAberto(aberto ? null : i)}
                                            className="flex w-full items-center justify-between gap-4 p-5 text-left text-base font-bold"
                                        >
                                            {f.q}
                                            <ChevronDown aria-hidden="true" className={cx("size-5 shrink-0 transition", aberto && "rotate-180")} />
                                        </button>
                                    </h3>
                                    {aberto && (
                                        <p id={`faq-resposta-${i}`} role="region" aria-labelledby={`faq-pergunta-${i}`} className="border-t-2 border-black p-5 text-sm leading-relaxed text-neutral-800">
                                            {f.a}
                                        </p>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </Secao>
            </main>

            {/* ===== Rodapé ===== */}
            <footer className="border-t-2 border-black">
                <div className="mx-auto max-w-6xl px-5 py-8 text-center text-sm md:px-8">© 2026 São Silvestre. Todos os direitos reservados.</div>
            </footer>
        </div>
    );
}

function Secao({ id, chapeu, titulo, children }: { id: string; chapeu: string; titulo: string; children: React.ReactNode }) {
    return (
        <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-20 border-b-2 border-black">
            <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
                <p className="text-sm font-bold uppercase tracking-widest">{chapeu}</p>
                <h2 id={`${id}-titulo`} className="mt-1 mb-8 text-3xl font-black md:text-4xl">
                    {titulo}
                </h2>
                {children}
            </div>
        </section>
    );
}
