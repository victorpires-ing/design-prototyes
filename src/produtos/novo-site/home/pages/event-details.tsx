import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
    Bell01,
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
    SearchLg,
    Settings01,
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
import logoBlack from "../../../../assets/Company logo_black.svg";
import logoWhite from "../../../../assets/Company logo_white.svg";
import headerBg from "../assets/header-bg.png";
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

const NAV_LINKS = ["Home", "Dashboard", "Projects", "Tasks", "Reporting", "Users"];

/* ------------------------------------------------------------------ */
/*  Página                                                            */
/* ------------------------------------------------------------------ */

export function EventDetails() {
    const [config, setConfig] = useState<EventConfig>(defaultEventConfig);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [showMiniBar, setShowMiniBar] = useState(false);
    const bannerRef = useRef<HTMLImageElement>(null);

    const sectionTabs: SectionTab[] = [
        ...(config.temLineup ? [{ id: "lineup", label: "Lineup" }] : []),
        { id: "experiencia", label: "Experiência" },
        { id: "descricao", label: "Descrição" },
        { id: "endereco", label: "Endereço" },
        { id: "faq", label: "FAQ" },
    ];

    useEffect(() => {
        const el = bannerRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => setShowMiniBar(!entry.isIntersecting), {
            rootMargin: "-64px 0px 0px 0px",
            threshold: 0,
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-primary text-primary">
            <HeaderNav onOpenConfig={() => setIsConfigOpen(true)} />

            {/* Mini-barra (mobile) — fixa, surge ao rolar além do banner (sem empurrar layout) */}
            <AnimatePresence>
                {showMiniBar && (
                    <motion.div
                        key="minibar"
                        initial={{ y: "-100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "-100%" }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed inset-x-0 top-0 z-50 border-b border-secondary bg-primary lg:hidden"
                    >
                        <div className="flex h-16 items-center gap-3 px-4">
                            <img src={bannerImg} alt="" className="h-11 w-9 shrink-0 rounded-sm object-cover" />
                            <p className="line-clamp-2 flex-1 text-sm font-bold leading-snug text-primary">{config.nomeEvento}</p>
                            <AgeBadge value={config.classificacao} />
                        </div>
                        {/* Tab de seções — entra junto com a mini-barra */}
                        <div className="border-t border-secondary">
                            <SectionTabsBar tabs={sectionTabs} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero band — fundo com grafismo/gradient exportado */}
            <div className="relative">
                <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[360px] overflow-hidden lg:h-[540px]">
                    <img src={headerBg} alt="" className="size-full object-cover" />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 lg:flex lg:gap-10 lg:px-8 lg:py-10">
                    <main className="flex w-full flex-col gap-10 pt-6 pb-32 lg:min-w-0 lg:flex-1 lg:py-0">
                        {/* Poster — sem limite de largura */}
                        <img
                            ref={bannerRef}
                            src={bannerImg}
                            alt={config.nomeEvento}
                            className="mx-auto w-[240px] max-w-full rounded-2xl shadow-lg lg:w-[354px]"
                        />

                        {/* Tab de seções (desktop) — sticky em fluxo; no mobile vai na mini-barra */}
                        <div className="sticky top-16 z-30 hidden max-w-[540px] border-b border-secondary bg-primary/90 backdrop-blur-md lg:block">
                            <SectionTabsBar tabs={sectionTabs} />
                        </div>

                        {/* Seções de conteúdo — largura máxima de 540px */}
                        <div className="flex flex-col gap-12 lg:max-w-[540px]">
                            {/* Info do evento — inline no mobile (sem o CTA, que é fixo) */}
                            <div className="lg:hidden">
                                <EventInfo config={config} card={false} />
                            </div>

                            {config.temLineup && (
                                <div id="lineup" className="scroll-mt-32">
                                    <Lineup config={config} />
                                </div>
                            )}
                            <div id="experiencia" className="scroll-mt-32">
                                <Complementos />
                            </div>
                            <div id="descricao" className="scroll-mt-32">
                                <Descricao />
                            </div>
                            <div id="endereco" className="scroll-mt-32">
                                <ComoChegar config={config} />
                            </div>
                            <ProduzidoPor />
                            <div id="faq" className="scroll-mt-32">
                                <Faq />
                            </div>
                            <HelpCta />
                            <RegrasVenda />
                        </div>
                    </main>

                    {/* Card sticky — desktop */}
                    <aside className="hidden lg:block lg:w-[440px] lg:shrink-0">
                        <div className="sticky top-24">
                            <EventInfo config={config} card />
                        </div>
                    </aside>
                </div>
            </div>

            <Footer />

            {/* Barra de venda fixa (mobile) com fade/blur no topo */}
            <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
                <div
                    aria-hidden="true"
                    className="h-8 backdrop-blur-md"
                    style={{
                        WebkitMaskImage: "linear-gradient(to bottom, transparent, black)",
                        maskImage: "linear-gradient(to bottom, transparent, black)",
                    }}
                />
                <div className="border-t border-secondary bg-primary/85 px-4 pt-3 pb-8 backdrop-blur-lg">
                    <SaleStatus status={config.status} preco={config.preco} />
                </div>
            </div>

            <EventConfigSlideout isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} config={config} onChange={setConfig} />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Tab fixa de seções — scroll-spy + barra de progresso              */
/* ------------------------------------------------------------------ */

interface SectionTab {
    id: string;
    label: string;
}

/** Progresso de rolagem APENAS pelas seções navegáveis (1ª → última tab),
 *  ignorando o que vem depois (ex.: regras de venda). 0 → 1. */
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

function SectionTabsBar({ tabs }: { tabs: SectionTab[] }) {
    const active = useScrollSpy(
        tabs.map((t) => t.id),
        130,
    );
    const progress = useSectionsProgress(tabs[0]?.id, tabs[tabs.length - 1]?.id);
    const navRef = useRef<HTMLElement>(null);
    const activeRef = useRef<HTMLButtonElement>(null);

    // Mantém a tab ativa visível: centraliza-a no scroll horizontal da própria tab (mobile).
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
                                isActive ? "text-brand-secondary" : "text-tertiary hover:text-secondary",
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
            {/* Barra de progresso de navegação (vermelha) na base da tab */}
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px]">
                <div className="h-full bg-brand-solid transition-[width] duration-150 ease-out" style={{ width: `${progress * 100}%` }} />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Header navigation                                                 */
/* ------------------------------------------------------------------ */

function IngresseMark({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 30" fill="currentColor" className={className} aria-hidden="true">
            <path d="M36.9121 0.00116609C35.3956 -0.0279861 33.8001 0.718894 32.6234 1.87041C31.8713 2.60621 30.8754 3.03067 29.9732 3.03067C29.0703 3.03067 28.3736 2.58872 28.0968 1.85466C27.6739 0.734053 26.6021 0 25.1185 0C23.635 0 22.0849 0.73347 20.9317 1.85466C20.1773 2.58814 19.192 3.03067 18.2892 3.03067C17.3869 3.03067 16.6672 2.60621 16.3945 1.87041C15.9675 0.718894 14.8592 -0.0279861 13.3238 0.00116609C10.9397 0.0466436 8.39022 1.9911 7.63637 4.33727C6.87252 6.71376 8.19528 8.63664 10.5976 8.63664C11.9881 8.63664 13.4357 7.99238 14.5606 6.98954C15.3845 6.2549 16.4199 5.83395 17.3639 5.83395C18.3086 5.83395 19.0689 6.25549 19.4146 6.98954C19.8864 7.99238 20.9147 8.63664 22.3046 8.63664C23.6945 8.63664 25.1427 7.99238 26.2676 6.98954C27.0915 6.2549 28.1268 5.83395 29.0709 5.83395C30.0156 5.83395 30.7759 6.25549 31.1216 6.98954C31.5934 7.99238 32.6216 8.63664 34.0116 8.63664C36.4144 8.63664 38.9893 6.71318 39.7738 4.33727C40.5494 1.99168 39.2661 0.0466436 36.9121 0.00116609Z" />
            <path d="M29.7911 20.1518C30.4831 18.0278 32.6033 16.2611 34.7612 15.8927C35.2477 15.8093 35.7094 15.4099 35.8602 14.9475L37.0593 11.2662C37.2324 10.7345 36.9374 10.3036 36.4008 10.3036H7.12394C6.58682 10.3036 6.01142 10.7345 5.83827 11.2662L4.63919 14.9475C4.48842 15.4099 4.68984 15.8099 5.12212 15.8927C7.03972 16.2611 8.00911 18.0278 7.31711 20.1518C6.6251 22.2758 4.50491 24.0425 2.34703 24.4109C1.86056 24.4943 1.39883 24.8937 1.24806 25.3561L0.0495637 29.0374C-0.123585 29.5691 0.171475 30 0.708001 30H29.9843C30.5214 30 31.0968 29.5691 31.27 29.0374L32.4691 25.3561C32.6198 24.8937 32.4184 24.4937 31.9861 24.4109C30.0685 24.0425 29.0991 22.2758 29.7911 20.1518Z" />
        </svg>
    );
}

function HeaderNav({ onOpenConfig }: { onOpenConfig: () => void }) {
    return (
        <header className="sticky top-0 z-40 border-b border-secondary bg-primary">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 lg:px-8">
                <img src={logoBlack} alt="Ingresse" className="h-6 shrink-0 dark:invert" />

                <nav className="hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link}
                            href="#"
                            className={cx(
                                "rounded-md px-3 py-2 text-sm font-semibold transition duration-100 ease-linear hover:bg-secondary",
                                link === "Dashboard" ? "text-primary" : "text-tertiary",
                            )}
                        >
                            {link}
                        </a>
                    ))}
                </nav>

                <div className="flex flex-1 items-center justify-end gap-1">
                    <IconButton icon={SearchLg} label="Buscar" />
                    <IconButton icon={Settings01} label="Configurar evento" onClick={onOpenConfig} />
                    <div className="relative">
                        <IconButton icon={Bell01} label="Notificações" />
                        <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-brand-solid text-[10px] font-semibold text-white">
                            2
                        </span>
                    </div>
                    <Button size="sm" color="secondary" iconTrailing={ChevronDown} className="ml-2 max-md:hidden">
                        Account
                    </Button>
                </div>
            </div>
        </header>
    );
}

function IconButton({ icon: Icon, label, onClick }: { icon: typeof Bell01; label: string; onClick?: () => void }) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className="flex size-9 items-center justify-center rounded-lg text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
        >
            <Icon className="size-5" />
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Card de informações do evento                                     */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Texto de datas (única / intervalo contínuo / não contínuo)        */
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

function EventDateText({ config }: { config: EventConfig }) {
    const dias = enumerateDays(config.dataInicio, config.dataFim);
    if (dias.length === 0) return null;

    const data = "font-semibold text-brand-secondary";
    const conector = "text-secondary";
    const time = config.horarioTipo === "fixo" ? config.horarioFixo : HORARIOS_VARIADOS[0];

    // Data única
    if (dias.length === 1) {
        return (
            <p className="text-sm">
                <span className={data}>{fmtDate(config.dataInicio, true)}</span> <span className={conector}>às {time}</span>
            </p>
        );
    }

    // Intervalo não contínuo (vários horários) — "Entre … e …", sem horário
    if (config.horarioTipo === "varios") {
        return (
            <div className="flex flex-col text-sm leading-6">
                <span>
                    <span className={conector}>Entre </span>
                    <span className={data}>{fmtDate(config.dataInicio, false)}</span>
                </span>
                <span>
                    <span className={conector}>e </span>
                    <span className={data}>{fmtDate(config.dataFim, true)}</span>
                </span>
            </div>
        );
    }

    // Intervalo contínuo (horário fixo) — "De … às … / Até … às …"
    return (
        <div className="flex flex-col text-sm leading-6">
            <span>
                <span className={conector}>De </span>
                <span className={data}>{fmtDate(config.dataInicio, false)}</span>
                <span className={conector}> às {time}</span>
            </span>
            <span>
                <span className={conector}>Até </span>
                <span className={data}>{fmtDate(config.dataFim, true)}</span>
                <span className={conector}> às {time}</span>
            </span>
        </div>
    );
}

function EventInfo({ config, card }: { config: EventConfig; card: boolean }) {
    return (
        <div className={cx("flex flex-col gap-5", card && "rounded-2xl bg-primary p-6 shadow-lg ring-1 ring-border-secondary")}>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
                <IngresseMark className="h-4 w-auto text-fg-quaternary" />
                <ChevronRight className="size-4 text-fg-quaternary" />
                <span className="text-sm font-semibold text-quaternary">Turnê</span>
            </nav>

            {/* Título + classificação */}
            <div className="flex items-start gap-4">
                <h1 className="flex-1 text-display-xs font-bold text-primary lg:text-display-sm">{config.nomeEvento}</h1>
                <AgeBadge value={config.classificacao} />
            </div>

            {/* Datas e horários */}
            <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
                    <EventDateText config={config} />
                </div>
                <div className="flex items-center gap-3">
                    <Clock className="size-5 shrink-0 text-fg-quaternary" />
                    <span className="text-sm text-secondary">
                        A partir das {config.horarioTipo === "fixo" ? config.horarioFixo : HORARIOS_VARIADOS[0]}00
                    </span>
                </div>
            </div>

            {/* Local */}
            <div className="flex flex-col gap-3 border-t border-secondary pt-4">
                <div className="flex items-center gap-3">
                    <HomeLine className="size-5 shrink-0 text-fg-quaternary" />
                    <span className="text-sm font-semibold text-secondary">{config.localNome}</span>
                </div>
                <div className="flex items-center gap-3">
                    <MarkerPin01 className="size-5 shrink-0 text-fg-quaternary" />
                    <span className="text-sm text-secondary">{config.localEndereco}</span>
                </div>
            </div>

            {/* Preço + CTA — só no card (desktop); no mobile fica na barra fixa */}
            {card && (
                <div className="border-t border-secondary pt-4">
                    <SaleStatus status={config.status} preco={config.preco} />
                </div>
            )}
        </div>
    );
}

function AgeBadge({ value = "16" }: { value?: string }) {
    const classif = CLASSIFICACOES.find((c) => c.id === value) ?? CLASSIFICACOES[4];
    return (
        <div className="flex shrink-0 flex-col items-center">
            <span
                className="grid size-6 place-items-center rounded-xs text-sm font-semibold text-white"
                style={{ backgroundColor: classif.cor }}
            >
                {classif.id === "L" ? "L" : classif.id}
            </span>
            <span className="text-xs text-secondary">{classif.legenda}</span>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Status de venda (varia conforme config.status)                    */
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
                    {preco} <span className="font-normal text-sm text-tertiary">+ taxa</span>
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

function Descricao() {
    const [expanded, setExpanded] = useState(false);
    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-primary">Descrição</h2>
            <div className="relative">
                <div className="flex flex-col gap-3.5 text-sm leading-5 text-secondary">
                    {DESCRICAO_RESUMO.map((p, i) => (
                        <p key={i} className={cx(i === 0 && "font-bold text-primary")}>
                            {p}
                        </p>
                    ))}
                    {expanded && DESCRICAO_COMPLETO.map((p, i) => <p key={`c-${i}`}>{p}</p>)}
                </div>
                {/* Fade na base indicando conteúdo oculto */}
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
        </section>
    );
}

function ComoChegar({ config }: { config: EventConfig }) {
    const query = encodeURIComponent(`${config.localNome} ${config.localEndereco}`);
    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-primary">Como chegar</h2>
            <div className="overflow-hidden rounded-lg border border-tertiary bg-secondary">
                <iframe
                    title="Mapa do local"
                    src={`https://maps.google.com/maps?q=${query}&z=15&output=embed`}
                    className="h-[160px] w-full border-0"
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

    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-primary">Produzido por</h2>

            {expanded ? (
                <>
                    <div className="flex flex-col gap-4">
                        {PRODUTORES.map((p) => (
                            <div key={p.name} className="flex items-center gap-3">
                                <Avatar src={p.img} initials={p.initials} alt={p.name} size="md" />
                                <div className="flex min-w-0 flex-col">
                                    <span className="text-sm font-semibold text-primary">{p.name}</span>
                                    {p.eventos != null && (
                                        <span className="text-sm text-tertiary">
                                            {p.eventos} {p.eventos === 1 ? "evento" : "eventos"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button size="sm" color="link-color" iconTrailing={ChevronUp} onClick={() => setExpanded(false)} className="self-start">
                        Resumir
                    </Button>
                </>
            ) : (
                <div className="flex items-center gap-3">
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
                </div>
            )}
        </section>
    );
}

function Faq() {
    return (
        <section className="flex flex-col gap-4 pt-5">
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
            {open && <p className="pb-4 text-sm leading-5 text-secondary">{a}</p>}
        </div>
    );
}

function HelpCta() {
    return (
        <section className="flex flex-col items-center gap-4 rounded-2xl bg-secondary px-6 py-8 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-brand-solid">
                <IngresseMark className="w-7 text-black" />
            </span>
            <p className="text-lg font-bold text-primary">
                Se precisar de ajuda,
                <br />a Ingresse tá por aqui.
            </p>
            <Button size="lg" color="primary">
                Fale com a gente
            </Button>
        </section>
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
        <div className="flex flex-col gap-0.5">
            <h2 className="text-xl font-semibold text-primary">{title}</h2>
            <p className="text-sm text-tertiary">{sub}</p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                            */
/* ------------------------------------------------------------------ */

const FOOTER_LINKS = ["Overview", "Features", "Pricing", "Careers", "Help", "Privacy"];

function Footer() {
    return (
        <footer className="bg-[#0a0a0a] text-white">
            <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
                <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-col gap-8">
                        <img src={logoWhite} alt="Ingresse" className="h-6 self-start" />
                        <h2 className="text-display-sm font-semibold lg:text-display-md">
                            Ao vivo,
                            <br />
                            ao máximo.
                        </h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="text-sm font-semibold text-white/70">Baixe o app Ingresse</span>
                        <div className="flex flex-col gap-2.5">
                            <StoreBadge store="apple" />
                            <StoreBadge store="google" />
                        </div>
                    </div>
                </div>

                <nav className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
                    {FOOTER_LINKS.map((link) => (
                        <a key={link} href="#" className="text-sm font-semibold text-white/70 transition duration-100 ease-linear hover:text-white">
                            {link}
                        </a>
                    ))}
                </nav>

                <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-white/50">© 2026 Todos os direitos reservados</p>
                    <div className="flex items-center gap-4 text-white/50">
                        <SocialIcon network="instagram" />
                        <SocialIcon network="tiktok" />
                        <SocialIcon network="linkedin" />
                    </div>
                </div>
            </div>
        </footer>
    );
}

function StoreBadge({ store }: { store: "apple" | "google" }) {
    return (
        <a
            href="#"
            className="flex w-40 items-center gap-2.5 rounded-lg border border-white/20 bg-black px-3 py-2 transition duration-100 ease-linear hover:bg-white/5"
        >
            {store === "apple" ? (
                <svg viewBox="0 0 24 24" className="size-6 shrink-0 fill-white" aria-hidden="true">
                    <path d="M17.05 12.54c-.02-2.07 1.69-3.06 1.77-3.11-0.96-1.41-2.46-1.6-3-1.62-1.27-.13-2.49.75-3.14.75-.65 0-1.65-.73-2.71-.71-1.39.02-2.68.81-3.4 2.06-1.45 2.52-.37 6.25 1.04 8.29.69 1 1.51 2.12 2.58 2.08 1.04-.04 1.43-.67 2.68-.67 1.25 0 1.6.67 2.7.65 1.11-.02 1.82-1.02 2.5-2.02.79-1.16 1.11-2.28 1.13-2.34-.02-.01-2.17-.83-2.19-3.29zM15.1 5.82c.57-.69.96-1.65.85-2.61-.82.03-1.82.55-2.41 1.24-.53.61-1 1.59-.87 2.53.92.07 1.86-.47 2.43-1.16z" />
                </svg>
            ) : (
                <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
                    <path d="M3.6 2.3 13 11.7l2.6-2.6L5.1 2.1c-.5-.3-1.1-.2-1.5.2z" fill="#34a853" />
                    <path d="M3 2.6C2.9 2.8 2.8 3 2.8 3.3v17.4c0 .3.1.5.2.7L12.4 12 3 2.6z" fill="#4285f4" />
                    <path d="M16.8 8.9 13 11.7l3.8 3.8 3.6-2.1c.7-.4.7-1.4 0-1.8l-3.6-2.7z" fill="#fbbc04" />
                    <path d="M3 21.4c.4.4 1 .5 1.5.2l11.3-6.1-2.8-3.8L3 21.4z" fill="#ea4335" />
                </svg>
            )}
            <span className="flex flex-col leading-tight">
                <span className="text-[9px] text-white/70">{store === "apple" ? "Download on the" : "GET IT ON"}</span>
                <span className="text-sm font-semibold text-white">{store === "apple" ? "App Store" : "Google Play"}</span>
            </span>
        </a>
    );
}

function SocialIcon({ network }: { network: "instagram" | "tiktok" | "linkedin" }) {
    const paths: Record<typeof network, string> = {
        instagram:
            "M12 2c2.7 0 3 0 4.1.06 1.1.05 1.8.24 2.4.5.7.27 1.2.63 1.8 1.2.6.6.95 1.1 1.2 1.8.26.6.45 1.3.5 2.4.06 1.1.06 1.4.06 4.1s0 3-.06 4.1c-.05 1.1-.24 1.8-.5 2.4-.27.7-.63 1.2-1.2 1.8-.6.6-1.1.95-1.8 1.2-.6.26-1.3.45-2.4.5-1.1.06-1.4.06-4.1.06s-3 0-4.1-.06c-1.1-.05-1.8-.24-2.4-.5-.7-.27-1.2-.63-1.8-1.2-.6-.6-.95-1.1-1.2-1.8-.26-.6-.45-1.3-.5-2.4C2 15 2 14.7 2 12s0-3 .06-4.1c.05-1.1.24-1.8.5-2.4.27-.7.63-1.2 1.2-1.8.6-.6 1.1-.95 1.8-1.2.6-.26 1.3-.45 2.4-.5C9 2 9.3 2 12 2zm0 1.8c-2.7 0-3 0-4 .06-1 .04-1.5.22-1.9.36-.5.18-.8.4-1.2.8-.4.4-.62.7-.8 1.2-.14.4-.32.9-.36 1.9-.05 1-.06 1.3-.06 4s0 3 .06 4c.04 1 .22 1.5.36 1.9.18.5.4.8.8 1.2.4.4.7.62 1.2.8.4.14.9.32 1.9.36 1 .05 1.3.06 4 .06s3 0 4-.06c1-.04 1.5-.22 1.9-.36.5-.18.8-.4 1.2-.8.4-.4.62-.7.8-1.2.14-.4.32-.9.36-1.9.05-1 .06-1.3.06-4s0-3-.06-4c-.04-1-.22-1.5-.36-1.9-.18-.5-.4-.8-.8-1.2-.4-.4-.7-.62-1.2-.8-.4-.14-.9-.32-1.9-.36-1-.05-1.3-.06-4-.06zm0 3.1a5.1 5.1 0 110 10.2 5.1 5.1 0 010-10.2zm0 1.8a3.3 3.3 0 100 6.6 3.3 3.3 0 000-6.6zm5.3-3.2a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z",
        tiktok: "M16.6 5.8c-.9-.6-1.5-1.5-1.7-2.6h-2.5v10.4a2.3 2.3 0 11-1.7-2.2v-2.6a4.9 4.9 0 103.6 4.7V8.9c.9.6 2 1 3.1 1V7.4c-.3 0-.6 0-.8-.1z",
        linkedin:
            "M6.94 5a1.94 1.94 0 11-3.88 0 1.94 1.94 0 013.88 0zM3.3 8.4h3.3V21H3.3V8.4zm5.4 0h3.16v1.7h.05c.44-.83 1.5-1.7 3.1-1.7 3.3 0 3.9 2.18 3.9 5v6.6h-3.3v-5.85c0-1.4-.02-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H8.7V8.4z",
    };
    return (
        <a href="#" aria-label={network} className="transition duration-100 ease-linear hover:text-white">
            <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
                <path d={paths[network]} />
            </svg>
        </a>
    );
}
