import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { useTheme } from "@/providers/theme-provider";
import { ArrowLeft, MarkerPin06, Monitor01, Phone01, MinusCircle, PlusCircle, Ticket02 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import logoTicketSports from "../assets/LOGO TICKET INGRESSE.svg";
import heroCorredores from "../assets/imagem-corredores.png";

type Viewport = "desktop" | "mobile";

const BLUE = "#0099FF";

/* Slides do banner rotativo do hero. Por enquanto reutilizamos a mesma imagem
   para o carrossel rodar; basta trocar por novas imagens em ../assets. */
const HERO_SLIDES = [heroCorredores, heroCorredores, heroCorredores, heroCorredores];

/* ----------------------------- Brand bits ----------------------------- */

function Logo({ className }: { className?: string }) {
    return <img src={logoTicketSports} alt="TicketSports by Ingresse" className={cx("w-auto", className)} />;
}

function BlueButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            className={cx(
                "inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white transition duration-100 ease-linear hover:brightness-95",
                className,
            )}
            style={{ backgroundColor: BLUE }}
            {...props}
        >
            {children}
        </button>
    );
}

function HeroCarousel({ variant }: { variant: "desktop" | "mobile" }) {
    const N = HERO_SLIDES.length;
    const [active, setActive] = useState(0);

    // Autoplay
    useEffect(() => {
        if (N <= 1) return;
        const t = setInterval(() => setActive((i) => (i + 1) % N), 4500);
        return () => clearInterval(t);
    }, [N]);

    const next = (active + 1) % N;

    // Imagem atual (frente), com crossfade + indicadores. Preenche o container (inset-0).
    const front = (
        <div className="absolute inset-0 z-10 overflow-hidden rounded-3xl shadow-sm">
            {HERO_SLIDES.map((src, i) => (
                <img
                    key={i}
                    src={src}
                    alt="São Silvestre"
                    className={cx("absolute inset-0 size-full object-cover transition-opacity duration-700", i === active ? "opacity-100" : "opacity-0")}
                />
            ))}
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                {HERO_SLIDES.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        aria-label={`Ir para o slide ${i + 1}`}
                        onClick={() => setActive(i)}
                        className={cx("h-1.5 rounded-full transition-all duration-200", i === active ? "w-5 bg-white" : "w-1.5 bg-white/60")}
                    />
                ))}
            </div>
        </div>
    );

    // ---- MOBILE: largura total, 4/3 via spacer, tudo recortado (sem vazar) ----
    if (variant === "mobile") {
        return (
            <div className="relative w-full overflow-hidden rounded-3xl">
                <div className="pb-[75%]" /> {/* spacer 4:3 define a altura */}
                {front}
            </div>
        );
    }

    // ---- DESKTOP: card quadrado fixo, prévia da próxima foto espiando à direita ----
    return (
        <div className="relative w-[560px] shrink-0">
            <div className="pb-[100%]" /> {/* spacer 1:1 define a altura */}
            {/* Próxima imagem: atrás, deslocada à direita, desfocada e com opacidade reduzida */}
            <img
                src={HERO_SLIDES[next]}
                aria-hidden="true"
                className="absolute inset-y-0 left-10 right-[-36px] z-0 rounded-3xl object-cover opacity-50 blur-[3px]"
            />
            {front}
        </div>
    );
}

/* ------------------------------- Data --------------------------------- */

const SOBRE_PARAGRAPHS = [
    "🏃✨ A São Silvestre está chegando para mais uma edição histórica!",
    "Um dos eventos de corrida mais tradicionais e emocionantes do Brasil volta a reunir atletas profissionais, corredores amadores, famílias e apaixonados por esporte em uma grande celebração pelas ruas de São Paulo. Mais do que uma prova, a São Silvestre é um símbolo de superação, energia e fim de ano com propósito. 👏💪",
    "👉 Você escolhe como quer viver essa experiência: correndo, torcendo, acompanhando ou simplesmente celebrando cada quilômetro desse percurso tão especial. Aqui, cada passo representa determinação, movimento e vontade de cruzar novos limites.",
    "🏅 Grandes atletas dividem o mesmo cenário com milhares de pessoas que correm por desafio, diversão, saúde ou simplesmente pela emoção de participar.",
    "🎉 A cidade ganha vida, a torcida toma as ruas e o clima de conquista transforma a corrida em um momento inesquecível.",
    "🔥 Prepare-se para viver uma das provas mais icônicas, vibrantes e especiais do Brasil. A São Silvestre te espera na largada!",
];

const FAQ = [
    {
        q: "Por que a São Silvestre mudou de plataforma este ano?",
        a: "Lorem ipsum dolor sit amet consectetur. Non dui libero aliquet vestibulum cursus volutpat arcu. Eget dictum nibh et lacus. Adipiscing tincidunt id cras at ipsum vel risus. Tempor faucibus varius in.",
    },
    { q: "A Ingresse é uma plataforma confiável para comprar minha inscrição?", a: "Sim. A Ingresse é a plataforma oficial de inscrições da São Silvestre nesta edição." },
    { q: "Tenho cadastro na Ticketsports. Preciso criar uma conta na Ingresse?", a: "Sim, será necessário criar uma conta gratuita na Ingresse para concluir sua inscrição." },
    { q: "Como acesso minha inscrição após a compra?", a: "Sua inscrição fica disponível na sua conta Ingresse, em “Minhas inscrições”." },
    { q: "Meu histórico de inscrições anteriores vai aparecer na Ingresse?", a: "O histórico de edições anteriores permanece na Ticketsports. As próximas passam a ficar na Ingresse." },
    { q: "Como acesso minha inscrição após a compra?", a: "Pelo app ou site da Ingresse, na área de inscrições da sua conta." },
    { q: "Para mais dúvidas, com quem falo? Ingresse ou TicketSports?", a: "Para questões da inscrição via Ingresse, fale com o suporte da Ingresse. Para a organização da prova, com a TicketSports." },
];

/* ------------------------- Landing (responsiva) ------------------------ */

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
    return (
        <div className={cx("rounded-xl border border-secondary transition", open ? "bg-secondary/60" : "bg-primary")}>
            <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                {open ? <MinusCircle className="size-5 shrink-0 text-fg-quaternary" /> : <PlusCircle className="size-5 shrink-0 text-fg-quaternary" />}
                <span className="text-sm font-semibold text-primary">{q}</span>
            </button>
            {open && <p className="px-5 pb-4 pl-13 text-sm text-tertiary">{a}</p>}
        </div>
    );
}

function SaoSilvestreLanding({ viewport = "desktop" }: { viewport?: "desktop" | "mobile" }) {
    const [openFaq, setOpenFaq] = useState(0);
    const mobileBar = viewport === "mobile";

    // Barra escura que destaca, na trilha, o bloco de informação ativo.
    // top/height se adaptam ao bloco atual e perseguem o alvo com easing (lerp).
    const infoRef = useRef<HTMLDivElement>(null);
    const targetRef = useRef({ top: 0, height: 0 });
    const currentRef = useRef({ top: 0, height: 0 });
    const rafRef = useRef<number | null>(null);
    const [thumb, setThumb] = useState({ top: 0, height: 0 });

    useEffect(() => {
        const el = infoRef.current;
        if (!el) return;

        const blocks = () => Array.from(el.querySelectorAll<HTMLElement>("[data-info-block]"));

        const animate = () => {
            const t = targetRef.current;
            const c = currentRef.current;
            const dTop = t.top - c.top;
            const dH = t.height - c.height;
            if (Math.abs(dTop) < 0.3 && Math.abs(dH) < 0.3) {
                currentRef.current = { top: t.top, height: t.height };
                setThumb(currentRef.current);
                rafRef.current = null;
                return;
            }
            currentRef.current = { top: c.top + dTop * 0.14, height: c.height + dH * 0.14 };
            setThumb({ ...currentRef.current });
            rafRef.current = requestAnimationFrame(animate);
        };

        const ensureAnim = () => {
            if (rafRef.current == null) rafRef.current = requestAnimationFrame(animate);
        };

        const computeTarget = () => {
            const list = blocks();
            if (!list.length) return;
            const anchor = window.innerHeight * 0.4;
            let active = 0;
            for (let i = 0; i < list.length; i++) {
                if (list[i].getBoundingClientRect().top <= anchor) active = i;
            }
            const b = list[active];
            targetRef.current = { top: b.offsetTop, height: b.offsetHeight };
            ensureAnim();
        };

        // Estado inicial (sem animação): primeiro bloco
        const list = blocks();
        if (list.length) {
            const init = { top: list[0].offsetTop, height: list[0].offsetHeight };
            targetRef.current = init;
            currentRef.current = init;
            setThumb(init);
        }

        window.addEventListener("scroll", computeTarget, { passive: true });
        window.addEventListener("resize", computeTarget);
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            window.removeEventListener("scroll", computeTarget);
            window.removeEventListener("resize", computeTarget);
        };
    }, []);

    // Barra de ação fixa (mobile): aparece após passar do botão de inscrição
    // e some ao chegar na FAQ (que já tem o próprio CTA).
    const inscreveRef = useRef<HTMLDivElement>(null);
    const faqRef = useRef<HTMLElement>(null);
    const [showBar, setShowBar] = useState(false);

    useEffect(() => {
        if (!mobileBar) {
            setShowBar(false);
            return;
        }
        const BAR_H = 88;
        const onScroll = () => {
            const btn = inscreveRef.current?.getBoundingClientRect();
            const faq = faqRef.current?.getBoundingClientRect();
            if (!btn || !faq) return;
            const vh = window.innerHeight;
            const pastButton = btn.bottom < vh - BAR_H; // já rolamos além do botão
            const faqReached = faq.top <= vh; // FAQ começou a aparecer
            setShowBar(pastButton && !faqReached);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, [mobileBar]);

    return (
        <div className="@container bg-primary text-primary">
            {/* ===== HERO ===== */}
            <section className="px-6 py-10 @3xl:px-12 @3xl:py-16">
                <div className="mx-auto flex max-w-6xl flex-col gap-8 @3xl:flex-row @3xl:items-center @3xl:gap-12">
                    {/* Texto */}
                    <div className="flex-1">
                        <Logo className="h-9" />
                        <h1 className="mt-10 text-5xl font-extrabold tracking-tight @3xl:text-6xl">São Silvestre</h1>
                        <p className="mt-4 text-lg">
                            <span className="font-bold text-primary">A corrida que transforma.</span> <span className="text-tertiary">A chegada que você nunca esquece.</span>
                        </p>
                        <p className="mt-4 max-w-md text-base text-tertiary">
                            A São Silvestre não é só uma prova — é um marco na vida de quem corre. Seja você estreante ou veterano, cada passada nas ruas de São
                            Paulo conta uma história.
                        </p>
                        <BlueButton className="mt-7 w-full px-7 py-4 text-base @3xl:w-auto">Garanta sua vaga pela Ingresse</BlueButton>

                        <div className="mt-7 flex items-center gap-2.5">
                            <Ticket02 className="size-5 shrink-0 text-fg-quaternary" />
                            <p className="text-sm text-tertiary">
                                Se liga: As inscrições e o resgate da sua inscrição são feitos{" "}
                                <span className="font-semibold" style={{ color: BLUE }}>pela Ingresse</span>.
                            </p>
                        </div>
                    </div>

                    {/* Banner rotativo */}
                    <HeroCarousel variant={viewport} />
                </div>
            </section>

            {/* Divider entre o hero e as informações do evento (100% da largura) */}
            <div className="border-t border-secondary" />

            {/* ===== SOBRE + INSCRIÇÃO ===== */}
            <section className="px-6 pt-16 pb-16 @3xl:px-12">
                <div className="mx-auto flex max-w-6xl flex-col gap-10 @3xl:flex-row @3xl:gap-12">
                    {/* Conteúdo */}
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold">Sobre o evento</h2>
                        <div className="mt-4 space-y-4">
                            {SOBRE_PARAGRAPHS.map((p, i) => (
                                <p key={i} className="text-sm leading-relaxed text-secondary">
                                    {p}
                                </p>
                            ))}
                        </div>

                        {/* Informações importantes */}
                        <h2 className="mt-12 text-2xl font-bold">Informações importantes</h2>

                        <div ref={infoRef} className="relative mt-6 space-y-8 pl-6">
                        {/* Trilha clara (caminho) */}
                        <div className="absolute inset-y-0 left-0 w-[3px] rounded-full bg-quaternary" />
                        {/* Barra escura que percorre a trilha conforme o scroll */}
                        <div
                            className="absolute left-0 w-[3px] rounded-full"
                            style={{ top: thumb.top, height: thumb.height, backgroundColor: "#BFBFBF" }}
                        />
                        <div data-info-block>
                            <h3 className="text-sm font-bold text-primary">Kits de participação</h3>
                            <p className="mt-2 text-sm text-tertiary">Nesta edição, você pode escolher entre diferentes KITS DE PARTICIPAÇÃO:</p>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-tertiary">
                                <li><b className="text-secondary">KIT ECONÔMICO:</b> número de peito + chip de cronometragem (uso obrigatório), seguro atleta, hidratação e kit alimentação pós-prova.</li>
                                <li><b className="text-secondary">KIT AME:</b> tudo do kit econômico + camiseta exclusiva + sacochila ou ecobag.</li>
                                <li><b className="text-secondary">KIT AME MAIS:</b> tudo do kit AME + jantar de massas para celebrar sua conquista.</li>
                            </ul>
                        </div>

                        <div data-info-block>
                            <h3 className="text-sm font-bold text-primary">Datas e lotes</h3>
                            <div className="mt-2 space-y-1 text-sm text-tertiary">
                                <p>Inscrições no escuro: 21/01/2026 até esgotarem as vagas (esgotado).</p>
                                <p>1º lote: 02/03/2026</p>
                                <p>2º lote: 04/05/2026</p>
                                <p>3º lote: 03/08/2026</p>
                                <p className="pt-2">👉 Lotes extras podem ser abertos conforme necessidade. Cada lote será encerrado assim que atingir o número estipulado de inscrições.</p>
                                <p className="pt-2">🏃 Uma corrida para todos!</p>
                                <p>A Corrida da AME é inclusiva e celebra a diversidade:</p>
                                <p>🧓 Idosos: 50% de desconto garantido por lei.</p>
                                <p>🏳️‍🌈 Pessoas transgênero: basta entrar em contato com a coordenação para confirmar sua participação.</p>
                                <p>♿ PCDs e pacientes com AME: essa corrida é feita por vocês e para vocês! Inscrição gratuita.</p>
                                <p className="pt-2">(Observação: inscrições de PCDs passam por análise do laudo inserido no processo de inscrição).</p>
                            </div>
                        </div>

                        <div data-info-block>
                            <h3 className="text-sm font-bold text-primary">Horário das largadas</h3>
                            <div className="mt-2 space-y-1 text-sm text-tertiary">
                                <p>A 12ª edição da CORRIDA DA AME, acontecerá dia 13/09/26 e terá suas largadas em onda a partir das 06h15min, conforme percurso detalhado e divulgado no site oficial do EVENTO.</p>
                                <p className="pt-2">Horários das ONDAS DE LARGADA do evento:</p>
                                <p className="pt-2">ONDA 1 – MEIA MARATONA<br />LARGADA às 06h15min em pelotão único.</p>
                                <p className="pt-2">ONDA 2 – CORRIDA PCD (5K)<br />LARGADA às 06h40min em pelotão único.</p>
                                <p className="pt-2">ONDA 3 – CORRIDA 5 E 10K<br />LARGADA às 06h45min em pelotão único.</p>
                                <p className="pt-2">ONDA 4 – CATEGORIA LIVRE<br />LARGADA às 06h50min em pelotão único.</p>
                                <p className="pt-2">ONDA 5 – LARGADA CORRIDA KIDS<br />LARGADA a partir das 8h30min, será definida de acordo com a idade dos participantes.</p>
                                <p className="pt-2">8h30min - 5 e 6 anos de idade.<br />8h40min - 7 e 8 anos de idade.<br />8h50min - 9 a 10 anos de idade.<br />9h00min - 11 a 12 anos de idade.<br />9h10min - 13 e 14 anos de idade.</p>
                                <p className="pt-2">LARGADA CATEGORIA BABY<br />Será realizada a partir das 9h20 de acordo com ordem de chegada na pistinha da TITI.</p>
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Card de inscrição (no mobile, logo abaixo do banner) */}
                    <aside className="order-first w-full @3xl:order-none @3xl:w-[360px] @3xl:shrink-0">
                        <div className="overflow-hidden rounded-3xl border border-secondary bg-primary shadow-sm @3xl:sticky @3xl:top-20">
                            {/* Topo branco */}
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-primary">Inscrição</h3>
                                <p className="mt-4 text-base font-bold text-primary">Data do evento: 29/12/2026</p>
                                <p className="mt-1.5 text-base text-tertiary">Inscrições até: 20/11/2026</p>

                                <div className="mt-6 flex items-center gap-2.5 text-base text-secondary">
                                    <MarkerPin06 className="size-5 shrink-0 text-fg-quaternary" />
                                    Av. Paulista, São Paulo - SP
                                </div>

                                <div ref={inscreveRef} className="mt-6">
                                    <BlueButton className="w-full rounded-xl py-4 text-base">Inscreva-se pela Ingresse</BlueButton>
                                </div>
                            </div>

                            {/* Base cinza */}
                            <div className="bg-secondary p-8">
                                <p className="text-xs font-bold tracking-wide uppercase" style={{ color: BLUE }}>Novidade nesta edição</p>
                                <p className="mt-2 text-xl font-bold text-primary">Sua inscrição agora é pela Ingresse</p>
                                <p className="mt-2 text-sm text-tertiary">Reunimos as principais dúvidas sobre a mudança para você. Role até o final da página ou clique no botão abaixo.</p>

                                <button
                                    type="button"
                                    className="mt-5 w-full rounded-xl border border-secondary bg-primary px-5 py-3.5 text-base font-semibold text-primary transition duration-100 ease-linear hover:bg-secondary"
                                >
                                    Tire suas dúvidas
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            {/* ===== FAQ ===== */}
            <section ref={faqRef} className="bg-secondary px-6 py-16 @3xl:px-12">
                <div className="mx-auto max-w-3xl">
                    <h2 className="text-center text-2xl font-bold text-primary @3xl:text-3xl">Ainda com dúvidas?</h2>
                    <p className="mt-2 text-center text-md text-tertiary">A gente te explica!</p>

                    <div className="mt-8 space-y-3">
                        {FAQ.map((item, i) => (
                            <FaqItem key={i} q={item.q} a={item.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
                        ))}
                    </div>

                    <BlueButton className="mt-8 w-full py-3.5">Quero correr a São Silvestre</BlueButton>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="border-t border-secondary px-6 py-10 text-center">
                <div className="flex justify-center">
                    <Logo className="h-7" />
                </div>
                <p className="mt-4 text-xs text-tertiary">© 2026 São Silvestre. Todos os direitos reservados.</p>
            </footer>

            {/* Barra de ação fixa no rodapé (mobile) — via portal para escapar do @container */}
            {mobileBar &&
                createPortal(
                    <div
                        className={cx(
                            "fixed inset-x-0 bottom-0 z-[60] flex justify-center transition-transform duration-300 ease-out",
                            showBar ? "translate-y-0" : "pointer-events-none translate-y-full",
                        )}
                    >
                        <div className="w-[390px] max-w-full border-t border-secondary bg-primary px-6 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
                            <BlueButton className="w-full rounded-xl py-4 text-base">Inscreva-se pela Ingresse</BlueButton>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}

/* --------------------- Página + toggle de viewport --------------------- */

export function SaoSilvestre() {
    const navigate = useNavigate();
    const [viewport, setViewport] = useState<Viewport>("desktop");
    const { theme, setTheme } = useTheme();
    const prevTheme = useRef(theme);

    // A landing é sempre exibida em light mode, independente do tema do app.
    // Forçamos via ThemeProvider (fonte autoritativa) para evitar que ele
    // reaplique o dark-mode logo após uma mudança manual na classe do root.
    useEffect(() => {
        setTheme("light");
        return () => setTheme(prevTheme.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const seg = "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition duration-100 ease-linear";

    return (
        <div className={cx("min-h-screen", viewport === "mobile" ? "bg-secondary" : "bg-primary")}>
            {/* Barra de controle do protótipo */}
            <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 border-b border-secondary bg-primary/90 px-4 py-2.5 backdrop-blur">
                <button
                    type="button"
                    onClick={() => navigate("/landing-pages")}
                    className="flex items-center gap-1.5 text-sm font-medium text-tertiary transition hover:text-secondary"
                >
                    <ArrowLeft className="size-4" />
                    Landing Pages
                </button>

                <div className="flex items-center gap-1 rounded-lg bg-secondary p-1 ring-1 ring-border-secondary">
                    <button type="button" onClick={() => setViewport("desktop")} className={cx(seg, viewport === "desktop" ? "bg-primary text-primary shadow-sm" : "text-tertiary")}>
                        <Monitor01 className="size-4" /> Desktop
                    </button>
                    <button type="button" onClick={() => setViewport("mobile")} className={cx(seg, viewport === "mobile" ? "bg-primary text-primary shadow-sm" : "text-tertiary")}>
                        <Phone01 className="size-4" /> Mobile
                    </button>
                </div>

                <span className="hidden w-[120px] text-right text-xs text-tertiary @3xl:inline">{viewport === "mobile" ? "390px" : "Full width"}</span>
            </div>

            {/* Área de preview */}
            <div className={cx(viewport === "mobile" ? "px-4 pt-16 pb-10" : "pt-14")}>
                <div
                    className={cx(
                        "mx-auto bg-primary",
                        viewport === "mobile"
                            ? "w-[390px] max-w-full overflow-hidden rounded-3xl shadow-xl ring-1 ring-border-secondary"
                            : "w-full",
                    )}
                >
                    <SaoSilvestreLanding viewport={viewport} />
                </div>
            </div>
        </div>
    );
}
