import { useEffect, useRef, useState } from "react";
import { PlusCircle, MinusCircle } from "@untitledui/icons";
import { GuiaMedidasModal } from "../components/GuiaMedidasModal";
import { PcdDetalhesModal } from "../components/PcdDetalhesModal";
import { ComoFuncionaModal } from "../components/ComoFuncionaModal";
import { InformacoesSection } from "../components/InformacoesSection";
import { AnimatedMosaic } from "../components/AnimatedMosaic";
import { Reveal } from "../components/Reveal";
import { InstagramIcon, FacebookIcon, TiktokIcon, YoutubeIcon } from "../components/SocialIcons";
import { FAQ_101 } from "../data/ss101";
import { HERO_MOSAIC_TOP, HERO_MOSAIC_LEFT_EDGE, HERO_MOSAIC_RIGHT } from "../data/hero-mosaics";
import logoTicketsportsColor from "../assets/logo-ticketsports-color.png";
import logoHeader from "../assets/logo-header.svg";
import heroLogoCrop from "../assets/hero-logo-crop.png";
import kitPhoto from "../assets/kit-photo.png";
import kitPhotoAzul from "../assets/kit-photo-azul.png";
import kitPhotoVerde from "../assets/kit-photo-verde.png";
import kitPhotoLaranja from "../assets/kit-photo-laranja.png";
import kitShape from "../assets/kit-shape.svg";
import kitBgMiddle from "../assets/kit-bg-middle.svg";
import kitBgLeft from "../assets/kit-bg-left.svg";
import kitBgRight from "../assets/kit-bg-right.svg";
import footerBlocks from "../assets/footer-blocks.svg";
import faqMosaic from "../assets/faq-mosaic.svg";

// ===== Design tokens — Manual de Marca São Silvestre 101 =====
const ACCENT = "#0099FF"; // Azul de destaque — eyebrows, "101", acentos
const BOTAO_PRIMARIO = "#0086FF"; // Azul específico dos botões primários (header, hero)
const HEADER_BG = "#171717"; // Fundo escuro do header
const ROXO = "#971AFE";
const AZUL_INSCRICAO = "#0070CC"; // Eyebrow "Inscreva-se agora" + card "Geral"
const LARANJA_INSCRICAO = "#C83000"; // Eyebrow + checkmarks do card "Inscrição PNE"
const LARANJA_INSCRICAO_BOTAO = "#FF2F01"; // Botão do card "Inscrição PNE"
const LARANJA_KIT = "#FE3800"; // Heading + setas do carrossel do Kit do atleta
const INK = "#0A0A0A";
const MIST = "#F4F4F5";
const LINE = "#E5E5E5";
const MUTED = "#525252";

const TITLE_FONT = "'Outfit', -apple-system, 'Segoe UI', Roboto, sans-serif";
const BODY_FONT = "'Work Sans', -apple-system, 'Segoe UI', Roboto, sans-serif";

const KIT_AUTOPLAY_MS = 4500;

const KIT_VARIANTES = [
    { nome: "Kit roxo", imagem: kitPhoto },
    { nome: "Kit azul", imagem: kitPhotoAzul },
    { nome: "Kit verde", imagem: kitPhotoVerde },
    { nome: "Kit laranja", imagem: kitPhotoLaranja },
];

const NAV_LINKS = [
    { label: "Inscrições", href: "#inscricoes" },
    { label: "Kit do atleta", href: "#kit" },
    { label: "Informações gerais", href: "#informacoes" },
    { label: "Dúvidas", href: "#faq" },
    { label: "Sua inscrição", href: "#inscricoes" },
];

const INSCRICAO_CARDS = [
    {
        cor: AZUL_INSCRICAO,
        corBotao: BOTAO_PRIMARIO,
        eyebrow: "Aberta ao público",
        titulo: "Inscrição geral",
        texto: "Essa é pra quem quer garantir seu lugar na 10ª e viver os 15 km mais clássicos da Paulista, no seu ritmo.",
        cta: "Garantir minha vaga",
        ctaSecundario: "Acessar inscrição",
    },
    {
        cor: LARANJA_INSCRICAO,
        corBotao: LARANJA_INSCRICAO_BOTAO,
        eyebrow: "Todo mundo na pista",
        titulo: "Inscrição PCD gratuita",
        texto: "Categoria gratuita e adaptada com largada exclusiva, apoio dedicado e acessibilidade em todo o percurso.",
        cta: "Enviar documentação",
        ctaSecundario: "Detalhes e requisitos",
    },
    {
        cor: ROXO,
        corBotao: ROXO,
        eyebrow: "Pra correr junto",
        titulo: "Grupos e assessorias",
        texto: "Vai correr com a galera? Solicite vagas para grupos a partir de 20 pessoas. Receba a confirmação por e-mail em até 7 dias.",
        cta: "Inscrever meu grupo",
        ctaSecundario: "Como funciona?",
    },
];

/** Produto lp-ss → Home: recriação hifi da landing page da 101ª São Silvestre, a partir do handoff de design. */
export function Home() {
    const [menuAberto, setMenuAberto] = useState(false);
    const [faqAberto, setFaqAberto] = useState<number | null>(0);
    const [guideOpen, setGuideOpen] = useState(false);
    const [pcdModalOpen, setPcdModalOpen] = useState(false);
    const [comoFuncionaModalOpen, setComoFuncionaModalOpen] = useState(false);
    const [kitVisible, setKitVisible] = useState(false);
    const [kitIndex, setKitIndex] = useState(0);
    const [kitIndexSaindo, setKitIndexSaindo] = useState<number | null>(null);
    const kitSaidaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const kitVariante = KIT_VARIANTES[kitIndex];
    const trocarKit = (novoIndex: number) => {
        setKitIndexSaindo(kitIndex);
        setKitIndex(novoIndex);
        if (kitSaidaTimeout.current) clearTimeout(kitSaidaTimeout.current);
        kitSaidaTimeout.current = setTimeout(() => setKitIndexSaindo(null), 450);
    };
    const proximoKit = () => trocarKit((kitIndex + 1) % KIT_VARIANTES.length);
    const anteriorKit = () => trocarKit((kitIndex - 1 + KIT_VARIANTES.length) % KIT_VARIANTES.length);
    const kitRef = useRef<HTMLElement>(null);

    // Autoplay do carrossel do Kit: avança sozinho enquanto visível; qualquer troca (manual ou automática) reinicia a contagem.
    useEffect(() => {
        if (!kitVisible) return;
        const t = setTimeout(proximoKit, KIT_AUTOPLAY_MS);
        return () => clearTimeout(t);
    }, [kitVisible, kitIndex]);

    // Dispara a animação de surgimento do Kit do atleta quando a seção entra na viewport.
    useEffect(() => {
        const el = kitRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setKitVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Carrega as fontes da marca (Outfit + Work Sans) só nesta página, sem afetar o resto do app.
    useEffect(() => {
        const links = [
            Object.assign(document.createElement("link"), { rel: "preconnect", href: "https://fonts.googleapis.com" }),
            Object.assign(document.createElement("link"), { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" }),
            Object.assign(document.createElement("link"), {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;1,600&display=swap",
            }),
        ];
        links.forEach((l) => document.head.appendChild(l));
        return () => links.forEach((l) => l.remove());
    }, []);

    const scrollSuave = (e: React.MouseEvent, href: string) => {
        const el = document.querySelector(href);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setMenuAberto(false);
    };

    return (
        <div className="min-h-dvh scroll-smooth bg-white" style={{ color: INK, fontFamily: BODY_FONT }}>
            <style>{`
                @keyframes ss-float { 0%,100% { transform: translateY(0) rotate(var(--ss-r,0deg)); } 50% { transform: translateY(-14px) rotate(var(--ss-r,0deg)); } }
                @keyframes ss-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes ss-piece-in { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: scale(1); } }
                @keyframes ss-grow-in { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
                @keyframes ss-kit-fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes ss-kit-fade-out { from { opacity: 1; } to { opacity: 0; } }
                @keyframes ss-kit-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }
                @media (min-width: 768px) { .ss-hero-content { opacity: 0; animation: ss-rise 0.8s ease-out 0.4s both; } }
                @media (prefers-reduced-motion: reduce) { [style*="ss-float"], [style*="ss-rise"], [style*="ss-piece-in"], [style*="ss-grow-in"], [style*="ss-kit-fade"], [style*="ss-kit-progress"] { animation: none !important; } .ss-hero-content { opacity: 1 !important; animation: none !important; } }
            `}</style>

            {/* ===== Nav ===== */}
            <header
                className="sticky top-0 z-50"
                style={{ backgroundColor: HEADER_BG, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
            >
                <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-6 px-6 py-3.5">
                    <a href="#top" onClick={(e) => scrollSuave(e, "#top")}>
                        <img src={logoHeader} alt="Ticket Sports by Ingresse" className="h-9 w-auto" />
                    </a>
                    <div className="hidden items-center gap-7 lg:flex">
                        <nav className="flex gap-[26px]">
                            {NAV_LINKS.map((n) => (
                                <a key={n.label} href={n.href} onClick={(e) => scrollSuave(e, n.href)} className="text-base font-semibold text-white" style={{ fontFamily: BODY_FONT }}>
                                    {n.label}
                                </a>
                            ))}
                        </nav>
                        <a
                            href="#inscricoes"
                            onClick={(e) => scrollSuave(e, "#inscricoes")}
                            className="rounded-xl px-5 py-2.5 text-base font-bold text-white"
                            style={{ backgroundColor: BOTAO_PRIMARIO, fontFamily: TITLE_FONT }}
                        >
                            Inscreva-se
                        </a>
                    </div>
                    <button type="button" onClick={() => setMenuAberto((v) => !v)} aria-label="Menu" className="flex size-9 items-center justify-center rounded-lg lg:hidden">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                            {menuAberto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                        </svg>
                    </button>
                </div>
                {menuAberto && (
                    <nav className="flex flex-col gap-1 border-t px-6 py-3 lg:hidden" style={{ borderColor: "#333" }}>
                        {NAV_LINKS.map((n) => (
                            <a key={n.label} href={n.href} onClick={(e) => scrollSuave(e, n.href)} className="rounded-lg px-2 py-2.5 text-sm font-semibold text-white">
                                {n.label}
                            </a>
                        ))}
                        <a href="#inscricoes" onClick={(e) => scrollSuave(e, "#inscricoes")} className="mt-1 rounded-lg px-2 py-2.5 text-sm font-bold text-white">
                            Inscreva-se
                        </a>
                    </nav>
                )}
            </header>


            {/* ===== Hero ===== */}
            <section id="top" className="relative overflow-hidden bg-white">
                {/* Referência de 1470px (largura do frame no Figma), fixa (não max-width) no desktop pra os dois níveis de grafismos (1470 e 1240) nunca perderem alinhamento entre si em viewports menores; a seção recorta o excesso */}
                <div className="relative mx-auto md:min-h-[672px] md:w-[1470px]" style={{ maxWidth: 1470 }}>
                    {/* Grafismo decorativo direito (Group 1000005778, rotate 180°) — relativo ao hero inteiro (1470) */}
                    <div className="pointer-events-none absolute hidden md:block" style={{ left: 625.3, top: -265.9, width: 938.4, height: 937.9 }}>
                        <div className="size-full" style={{ transform: "rotate(180deg)" }}>
                            <AnimatedMosaic viewBox={HERO_MOSAIC_RIGHT.viewBox} paths={HERO_MOSAIC_RIGHT.paths} baseDelay={0.5} />
                        </div>
                    </div>

                    <div className="relative mx-auto md:min-h-[672px]" style={{ maxWidth: 1240 }}>
                        {/* Grafismos decorativos superior/esquerda (rotate 90°) — relativos ao container (1240) */}
                        <div className="pointer-events-none absolute hidden items-center justify-center md:flex" style={{ left: -489.8, top: -851.8, width: 979.3, height: 979.8 }}>
                            <div style={{ width: 979.8, height: 979.3, transform: "rotate(90deg)" }}>
                                <AnimatedMosaic viewBox={HERO_MOSAIC_TOP.viewBox} paths={HERO_MOSAIC_TOP.paths} baseDelay={0.1} />
                            </div>
                        </div>
                        <div className="pointer-events-none absolute hidden items-center justify-center md:flex" style={{ left: -1059.7, top: 131, width: 979.2, height: 979.8 }}>
                            <div style={{ width: 979.8, height: 979.2, transform: "rotate(90deg)" }}>
                                <AnimatedMosaic viewBox={HERO_MOSAIC_LEFT_EDGE.viewBox} paths={HERO_MOSAIC_LEFT_EDGE.paths} baseDelay={0.3} />
                            </div>
                        </div>

                        <div className="ss-hero-content mx-auto flex max-w-[694px] flex-col items-center gap-6 px-6 py-20 text-center md:absolute md:left-0 md:top-[203px] md:mx-0 md:max-w-none md:w-[694px] md:items-start md:px-0 md:py-0 md:text-left">
                            <div
                                role="img"
                                aria-label="São Silvestre 101 — São Paulo, Brasil"
                                className="hidden md:block"
                                style={{
                                    width: 490,
                                    height: 167,
                                    backgroundImage: `url(${heroLogoCrop})`,
                                    backgroundSize: "990px auto",
                                    backgroundPosition: "-48px -144px",
                                    backgroundRepeat: "no-repeat",
                                }}
                            />
                            <div
                                role="img"
                                aria-label="São Silvestre 101 — São Paulo, Brasil"
                                className="md:hidden"
                                style={{
                                    width: 300,
                                    height: 300 * (167 / 490),
                                    backgroundImage: `url(${heroLogoCrop})`,
                                    backgroundSize: "606px auto",
                                    backgroundPosition: "-29px -88px",
                                    backgroundRepeat: "no-repeat",
                                }}
                            />

                            <div className="flex flex-col items-center gap-1 md:items-start">
                                <h1 className="text-[26px] leading-normal md:text-[30px]" style={{ fontFamily: TITLE_FONT, color: "#404040" }}>
                                    <span className="font-light">A primeira corrida dos</span> <span className="font-semibold">próximos 100 anos</span>
                                </h1>
                                <p className="max-w-[500px] text-lg leading-[1.5] md:max-w-[622px]" style={{ color: "#737373" }}>
                                    15 km pelo coração de São Paulo, na virada mais famosa do mundo. Garanta sua vaga até 20/11/2026 e faça parte desse próximo capítulo.
                                </p>
                            </div>

                            <a
                                href="#inscricoes"
                                onClick={(e) => scrollSuave(e, "#inscricoes")}
                                className="inline-block w-fit rounded-xl px-[34px] py-4 text-base font-bold text-white shadow-[0_4px_10px_rgba(0,153,255,0.5)] transition-shadow duration-150 ease-linear hover:shadow-[0_6px_24px_rgba(0,153,255,0.85)]"
                                style={{ backgroundColor: BOTAO_PRIMARIO, fontFamily: TITLE_FONT }}
                            >
                                Garanta sua inscrição
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Inscrições ===== */}
            <section id="inscricoes" className="relative overflow-hidden">
                <div className="relative mx-auto max-w-[1240px] px-6 py-[72px]">
                    <div className="max-w-[640px]">
                        <div className="text-sm font-bold tracking-[2px] uppercase" style={{ fontFamily: TITLE_FONT, color: AZUL_INSCRICAO }}>
                            Inscreva-se agora
                        </div>
                        <h2 className="mt-3 text-[36px] leading-[0.98] tracking-[-1px] uppercase md:text-[48px] md:tracking-[-1.5px]" style={{ fontFamily: TITLE_FONT, fontWeight: 900 }}>
                            Com seu jeito de correr
                        </h2>
                        <p className="mt-4 text-lg leading-[1.5]" style={{ color: MUTED }}>
                            Individual, adaptada ou em turma: Escolha como quer virar o ano correndo.
                        </p>
                    </div>

                    <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
                        {INSCRICAO_CARDS.map((c, i) => (
                            <Reveal key={c.titulo} delay={i * 0.12} className="h-full">
                                <div className="relative flex h-full flex-col overflow-hidden rounded-3xl p-8" style={{ backgroundColor: "#fff", border: `1px solid ${LINE}` }}>
                                    <div className="text-sm font-bold tracking-[1.5px] uppercase" style={{ fontFamily: TITLE_FONT, color: c.cor }}>
                                        {c.eyebrow}
                                    </div>
                                    <h3 className="mt-2.5 text-[28px] font-extrabold" style={{ fontFamily: TITLE_FONT }}>
                                        {c.titulo}
                                    </h3>
                                    <p className="mt-3 mb-[26px] text-base leading-[1.45]" style={{ color: MUTED }}>
                                        {c.texto}
                                    </p>
                                    <div className="mt-auto flex flex-col gap-2">
                                        {c.titulo === "Grupos e assessorias" ? (
                                            <button
                                                type="button"
                                                disabled
                                                aria-disabled="true"
                                                className="block cursor-not-allowed rounded-[11px] py-3.5 text-center text-base font-semibold opacity-50"
                                                style={{ backgroundColor: c.corBotao, color: "#fff", fontFamily: TITLE_FONT }}
                                            >
                                                Em breve
                                            </button>
                                        ) : (
                                            <a href="#" className="block rounded-[11px] py-3.5 text-center text-base font-semibold" style={{ backgroundColor: c.corBotao, color: "#fff", fontFamily: TITLE_FONT }}>
                                                {c.cta}
                                            </a>
                                        )}
                                        {c.titulo === "Inscrição PCD gratuita" || c.titulo === "Grupos e assessorias" ? (
                                            <button
                                                type="button"
                                                onClick={() => (c.titulo === "Inscrição PCD gratuita" ? setPcdModalOpen(true) : setComoFuncionaModalOpen(true))}
                                                className="block rounded-[11px] py-3.5 text-center text-base font-semibold"
                                                style={{ border: `1px solid ${c.corBotao}`, color: c.corBotao, fontFamily: TITLE_FONT }}
                                            >
                                                {c.ctaSecundario}
                                            </button>
                                        ) : (
                                            <a
                                                href="#"
                                                className="block rounded-[11px] py-3.5 text-center text-base font-semibold"
                                                style={{ border: `1px solid ${c.corBotao}`, color: c.corBotao, fontFamily: TITLE_FONT }}
                                            >
                                                {c.ctaSecundario}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== Kit do atleta ===== */}
            <section id="kit" ref={kitRef} className="relative overflow-hidden bg-white">
                <div className="relative mx-auto md:h-[742px]" style={{ maxWidth: 1240 }}>
                    {/* Grafismos decorativos — só no desktop, calculados a partir do node 2188:21916 */}
                    <div className="pointer-events-none absolute hidden md:block" style={{ left: 49.4, top: -297.3, width: 1262.2, height: 1261.5 }}>
                        <img src={kitBgMiddle} alt="" className="block size-full" />
                    </div>
                    <div className="pointer-events-none absolute hidden items-center justify-center md:flex" style={{ left: -1221.8, top: -298.6, width: 1261.5, height: 1262.2 }}>
                        <div style={{ width: 1262.2, height: 1261.5, transform: "rotate(-90deg)" }}>
                            <img src={kitBgLeft} alt="" className="block size-full" />
                        </div>
                    </div>
                    <img
                        src={kitBgRight}
                        alt=""
                        className="pointer-events-none absolute hidden md:block"
                        style={{ left: 1320.9, top: -298.3, width: 1262.2, height: 1261.6, transform: "rotate(180deg)" }}
                    />

                    {/* Layout mobile — empilhado, sem os grafismos/carrossel */}
                    <div className="px-6 py-16 md:hidden" style={{ opacity: kitVisible ? 1 : 0, animation: kitVisible ? "ss-rise 0.7s ease-out both" : undefined }}>
                        <div className="text-sm font-bold tracking-[2px] uppercase" style={{ fontFamily: TITLE_FONT, color: "#171717" }}>
                            Kit do atleta
                        </div>
                        <h2 className="mt-3 text-[36px] leading-[0.98] tracking-[-1px] uppercase" style={{ fontFamily: TITLE_FONT, fontWeight: 900, color: LARANJA_KIT }}>
                            Tudo que você
                            <br />
                            veste pra virar
                            <br />o ano correndo
                        </h2>
                        <p className="mt-[18px] text-lg leading-[1.5]" style={{ color: MUTED }}>
                            Retirada na Expo São Silvestre, nos dias que antecedem a prova. Endereço e horários chegam no seu e-mail.
                        </p>
                        <button
                            type="button"
                            onClick={() => setGuideOpen(true)}
                            className="mt-[26px] inline-flex items-center gap-2 rounded-xl px-[26px] py-3.5 text-base font-bold"
                            style={{ color: INK, backgroundColor: "#fff", fontFamily: TITLE_FONT, boxShadow: `0 0 0 1.5px ${LINE} inset` }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8">
                                <path d="M3 6v12M21 6v12M7 9v6M11 10v4M15 9v6M19 10v4" />
                            </svg>
                            Guia de medidas
                        </button>
                        <div className="relative mt-10 flex items-center justify-center" style={{ height: 520 }}>
                            <img src={kitShape} alt="" aria-hidden="true" className="pointer-events-none absolute" style={{ width: 331, height: 520 }} />
                            <img
                                src={kitVariante.imagem}
                                alt="Kit oficial: camiseta, número com chip, medalha de finisher e mochila"
                                className="relative transition-opacity duration-200 ease-in-out"
                                style={{ width: 340, height: "auto" }}
                            />
                        </div>
                        <div className="mx-auto flex max-w-[200px] gap-1.5">
                            {KIT_VARIANTES.map((v, i) => (
                                <div key={v.nome} className="h-1 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: LINE }}>
                                    <div
                                        className="h-full origin-left rounded-full"
                                        style={{
                                            backgroundColor: LARANJA_KIT,
                                            transform: i < kitIndex ? "scaleX(1)" : "scaleX(0)",
                                            animation: i === kitIndex ? `ss-kit-progress ${KIT_AUTOPLAY_MS}ms linear both` : undefined,
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Layout desktop — posicionamento absoluto igual ao Figma */}
                    <div className="hidden md:block">
                        <div
                            className="absolute top-1/2 left-0 -translate-y-1/2 transition-opacity duration-700 ease-out"
                            style={{ width: 511, opacity: kitVisible ? 1 : 0 }}
                        >
                            <div className="text-sm font-bold tracking-[2px] uppercase" style={{ fontFamily: TITLE_FONT, color: "#171717" }}>
                                Kit do atleta
                            </div>
                            <h2 className="mt-3 text-[48px] leading-[0.98] tracking-[-1.5px] uppercase" style={{ fontFamily: TITLE_FONT, fontWeight: 900, color: LARANJA_KIT }}>
                                Tudo que você
                                <br />
                                veste pra virar
                                <br />o ano correndo
                            </h2>
                            <p className="mt-[18px] text-lg leading-[1.5]" style={{ color: MUTED }}>
                                Retirada na Expo São Silvestre, nos dias que antecedem a prova. Endereço e horários chegam no seu e-mail.
                            </p>
                            <button
                                type="button"
                                onClick={() => setGuideOpen(true)}
                                className="mt-[26px] inline-flex items-center gap-2 rounded-xl px-[27px] py-[15px] text-base font-bold"
                                style={{ color: INK, backgroundColor: "#fff", fontFamily: TITLE_FONT, boxShadow: `0 0 0 1px ${LINE} inset` }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8">
                                    <path d="M3 6v12M21 6v12M7 9v6M11 10v4M15 9v6M19 10v4" />
                                </svg>
                                Guia de medidas
                            </button>
                        </div>

                        <div
                            className="absolute"
                            style={{
                                left: 567.2,
                                top: 71.4,
                                width: 624.8,
                                height: 597.5,
                                opacity: kitVisible ? 1 : 0,
                                animation: kitVisible ? "ss-rise 0.8s ease-out 0.15s both" : undefined,
                            }}
                        >
                            <div className="absolute text-right" style={{ left: 0, top: 541.5, width: 228.8 }}>
                                <p className="text-xl font-bold" style={{ color: MUTED, fontFamily: BODY_FONT }}>
                                    {kitVariante.nome}
                                </p>
                                <p className="text-lg" style={{ color: MUTED, fontFamily: BODY_FONT }}>
                                    Lorem ipsum dolor sit
                                </p>
                            </div>
                            <img src={kitShape} alt="" aria-hidden="true" className="absolute" style={{ left: 244.8, top: 0, width: 380, height: 597.5 }} />
                            {kitIndexSaindo !== null && (
                                <img
                                    src={KIT_VARIANTES[kitIndexSaindo].imagem}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute"
                                    style={{
                                        left: 191.5,
                                        top: 0,
                                        width: 410.7,
                                        height: 508.5,
                                        animation: "ss-kit-fade-out 0.45s ease-in-out both",
                                    }}
                                />
                            )}
                            <img
                                key={kitIndex}
                                src={kitVariante.imagem}
                                alt="Kit oficial: camiseta, número com chip, medalha de finisher e mochila"
                                className="absolute"
                                style={{
                                    left: 191.5,
                                    top: 0,
                                    width: 410.7,
                                    height: 508.5,
                                    animation: kitIndexSaindo !== null ? "ss-kit-fade-in 0.45s ease-in-out both" : undefined,
                                }}
                            />
                            <div className="absolute flex gap-1.5" style={{ left: 381.8, top: 518, width: 106 }}>
                                {KIT_VARIANTES.map((v, i) => (
                                    <div key={v.nome} className="h-1 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: LINE }}>
                                        <div
                                            className="h-full origin-left rounded-full"
                                            style={{
                                                backgroundColor: LARANJA_KIT,
                                                transform: i < kitIndex ? "scaleX(1)" : "scaleX(0)",
                                                animation: i === kitIndex ? `ss-kit-progress ${KIT_AUTOPLAY_MS}ms linear both` : undefined,
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={proximoKit}
                                aria-label="Próximo item do kit"
                                className="absolute flex items-center justify-center rounded-2xl bg-white"
                                style={{ left: 604.8, top: 278.7, width: 40, height: 40, border: `1px solid ${LINE}` }}
                            >
                                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                                    <path d="M1 13L7 7L1 1" stroke={LARANJA_KIT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={anteriorKit}
                                aria-label="Item anterior do kit"
                                className="absolute flex items-center justify-center rounded-2xl bg-white"
                                style={{ left: 224.8, top: 278.7, width: 40, height: 40, border: `1px solid ${LINE}` }}
                            >
                                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                                    <path d="M7 13L1 7L7 1" stroke={LARANJA_KIT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <InformacoesSection />

            {/* ===== FAQ ===== */}
            <section id="faq" className="relative overflow-hidden bg-white">
                <div className="relative mx-auto max-w-[1470px]">
                    <img
                        src={faqMosaic}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute top-0 left-0 hidden md:block"
                        style={{ width: 525, height: 430 }}
                    />
                    <div className="relative mx-auto flex max-w-[1280px] flex-col gap-16 px-8 pt-40 pb-24">
                        <div className="mx-auto flex max-w-[768px] flex-col items-center gap-5 text-center">
                            <h2 className="text-[36px] leading-[1.2] tracking-[-1px]" style={{ fontFamily: TITLE_FONT, fontWeight: 600 }}>
                                Perguntas frequentes
                            </h2>
                            <p className="text-xl leading-[1.4]" style={{ color: MUTED }}>
                                Reunimos aqui algumas respostas para dúvidas que você possa ter.
                                <br />
                                Não encontrou o que precisa?{" "}
                                <a href="mailto:contato@saosilvestre.com.br" className="font-semibold" style={{ color: ACCENT }}>
                                    Fala com a gente
                                </a>
                                .
                            </p>
                        </div>
                        <div className="mx-auto flex w-full max-w-[768px] flex-col gap-4">
                            {FAQ_101.map((f, i) => {
                                const aberto = faqAberto === i;
                                return (
                                    <Reveal key={i} variant="grow" delay={i * 0.08}>
                                        <div className="rounded-2xl p-6" style={aberto ? { backgroundColor: MIST } : undefined}>
                                            <button type="button" onClick={() => setFaqAberto(aberto ? null : i)} className="flex w-full items-start justify-between gap-4 text-left">
                                                <div className="flex flex-1 flex-col">
                                                    <span className="text-base font-semibold" style={{ color: INK }}>
                                                        {f.q}
                                                    </span>
                                                    <div className="grid transition-[grid-template-rows] duration-300 ease-in-out" style={{ gridTemplateRows: aberto ? "1fr" : "0fr" }}>
                                                        <div className="overflow-hidden">
                                                            <span
                                                                className="block pt-1 text-base leading-[1.5] font-normal transition-opacity duration-200 ease-in-out"
                                                                style={{ color: MUTED, opacity: aberto ? 1 : 0 }}
                                                            >
                                                                {f.a}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {aberto ? (
                                                    <MinusCircle className="size-6 shrink-0" style={{ color: "#A3A3A3" }} />
                                                ) : (
                                                    <PlusCircle className="size-6 shrink-0" style={{ color: "#A3A3A3" }} />
                                                )}
                                            </button>
                                        </div>
                                    </Reveal>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Footer ===== */}
            <footer className="relative overflow-hidden border-t" style={{ backgroundColor: "#fff", color: INK, borderColor: LINE }}>
                <div className="relative mx-auto max-w-[1240px] px-6 pt-12 pb-10">
                    <div className="md:min-h-[258px]">
                        <img src={logoTicketsportsColor} alt="Ticket Sports by Ingresse" className="h-auto w-[183px]" />
                        <p className="mt-[18px] max-w-[403px] text-sm leading-[1.7]" style={{ color: MUTED }}>
                            Ticket Sports é líder nacional para organizadores de eventos esportivos, faça parte agora!
                        </p>
                        <div className="mt-[22px] flex gap-3">
                            {[
                                { Icone: InstagramIcon, label: "Instagram" },
                                { Icone: FacebookIcon, label: "Facebook" },
                                { Icone: TiktokIcon, label: "TikTok" },
                                { Icone: YoutubeIcon, label: "YouTube" },
                            ].map(({ Icone, label }) => (
                                <a
                                    key={label}
                                    href="#"
                                    aria-label={label}
                                    className="flex size-[42px] items-center justify-center rounded-xl"
                                    style={{ backgroundColor: MIST, color: INK }}
                                >
                                    <Icone />
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="mt-11 flex flex-wrap justify-between gap-3 border-t pt-6" style={{ borderColor: LINE }}>
                        <span className="text-sm" style={{ color: MUTED }}>
                            © São Silvestre · Todos os direitos reservados.
                        </span>
                        <span className="text-sm" style={{ color: MUTED }}>
                            São Paulo — Brasil 🇧🇷
                        </span>
                    </div>
                    <img
                        src={footerBlocks}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute top-0 hidden md:block"
                        style={{ left: 1006, width: 350, height: 435 }}
                    />
                </div>
            </footer>

            <GuiaMedidasModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
            <PcdDetalhesModal isOpen={pcdModalOpen} onClose={() => setPcdModalOpen(false)} />
            <ComoFuncionaModal isOpen={comoFuncionaModalOpen} onClose={() => setComoFuncionaModalOpen(false)} />
        </div>
    );
}
