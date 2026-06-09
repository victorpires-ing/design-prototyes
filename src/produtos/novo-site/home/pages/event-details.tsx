import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BellRinging02, Calendar, ChevronDown, ChevronRight, Clock, HomeLine, MarkerPin01, Menu02, Settings01, Share04 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { EventConfigSlideout, defaultEventConfig, enumerateDays, formatLongDate, type EventConfig, type EventStatus } from "../../components/EventConfigSlideout";
import logoBlack from "../../../../assets/Company logo_black.svg";
import bannerImg from "../assets/banner.png";
import mapaImg from "../assets/mapa.png";
import atracaoImg from "../assets/atracao.png";

interface Atracao {
    name: string;
    badge?: "b2b";
    dates: { day: string; time: string }[];
}

const LINEUP: Atracao[] = [
    { name: "ANNA", dates: [{ day: "19/12", time: "03h00" }, { day: "20/12", time: "03h00" }] },
    { name: "Vintage Culture", dates: [{ day: "21/12", time: "01h30" }] },
    { name: "Cat Dealer", dates: [{ day: "19/12", time: "00h00" }, { day: "22/12", time: "00h00" }] },
    { name: "Mochakk", dates: [{ day: "20/12", time: "22h30" }] },
    { name: "Bhaskar", dates: [{ day: "21/12", time: "22h00" }] },
    { name: "VTSS · Brutalismus 3000 · KAS:ST", badge: "b2b", dates: [{ day: "22/12", time: "23h00" }] },
];

const HORARIOS_VARIADOS = ["20h", "21h", "22h", "23h", "19h"];

const FAQ = [
    {
        q: "O valor do ingresso já inclui a taxa de serviço?",
        a: "Sim. Na Ingresse o preço que você vê é o preço que você paga. A taxa de serviço já está inclusa no valor do ingresso — sem surpresas no checkout.",
    },
    {
        q: "Posso transferir meu ingresso para outra pessoa?",
        a: "Pode! Pelo app da Ingresse você transfere o ingresso para qualquer pessoa com conta na plataforma, sem custo. A transferência libera o QR Code para o novo titular.",
    },
    {
        q: "Qual a classificação indicativa?",
        a: "16 anos. Menores de 16 não entram, mesmo acompanhados. Leve um documento oficial com foto — ele será conferido na entrada junto com o ingresso.",
    },
    {
        q: "Tem meia-entrada?",
        a: "Sim, conforme a Lei da Meia-Entrada. A meia é válida para estudantes, pessoas com deficiência e idosos, mediante apresentação do documento comprobatório na portaria.",
    },
    {
        q: "Como funciona a entrada?",
        a: "A entrada é por QR Code, direto no app. Tenha o ingresso aberto na tela antes de chegar à portaria para agilizar o acesso. Abertura dos portões às 22h.",
    },
];

const SOBRE = [
    "VILLAGE SUPERBET ⚽",
    "O grito da torcida. O brilho do palco. A vibração que arrepia. 🇧🇷",
    "Serão mais de 30 dias de evento, mais de 100 atrações e aquela sensação de viver uma experiência única no Rio de Janeiro!",
    "O maior parque de celebração do mundial está de volta! ⚽✨",
    "O evento acontece no Pião do Prado, parte central do Jockey Club Brasileiro, com vista para o Cristo Redentor e a Pedra da Gávea.",
    "Torcida, surpresas, diversão, muita música, alegria e inúmeros encontros acontecerão por aqui! Nosso parque contará com shows, telões, uma extensa praça de alimentação, brinquedos como roda gigante, escorrega e tirolesa.",
    "Endereço: Praça Santos Dumont, 31 - Gávea",
    "CLASSIFICAÇÃO ETÁRIA: 18 anos",
    "*Menores de idade poderão entrar no evento somente se acompanhados dos pais.",
];

export function EventDetails() {
    const [config, setConfig] = useState<EventConfig>(defaultEventConfig);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [showMiniBar, setShowMiniBar] = useState(false);
    const bannerRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const el = bannerRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => setShowMiniBar(!entry.isIntersecting), {
            rootMargin: "-72px 0px 0px 0px",
            threshold: 0,
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-primary text-primary">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-secondary bg-primary">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
                    <img src={logoBlack} alt="Ingresse" className="h-8 dark:invert" />
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setIsConfigOpen(true)}
                            aria-label="Configurar evento"
                            className="flex size-9 items-center justify-center rounded-lg text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
                        >
                            <Settings01 className="size-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Abrir menu"
                            className="flex size-9 items-center justify-center rounded-lg text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
                        >
                            <Menu02 className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Mini-barra exibida ao rolar após o banner */}
                <AnimatePresence>
                    {showMiniBar && (
                        <motion.div
                            key="minibar"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="overflow-hidden border-t border-secondary"
                        >
                            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 lg:px-6">
                                <img src={bannerImg} alt="" className="h-11 w-9 shrink-0 rounded-sm object-cover" />
                                <p className="line-clamp-2 flex-1 text-sm font-bold leading-snug text-primary">Turnê Dominguinho - Goiânia</p>
                                <AgeBadge />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <div className="mx-auto w-full max-w-6xl px-4 lg:flex lg:gap-8 lg:px-6 lg:py-6">
            <main className="mx-auto flex w-full max-w-[480px] flex-col gap-8 py-4 pb-44 lg:mx-0 lg:max-w-none lg:flex-1 lg:py-0 lg:pb-12">
                {/* Hero — imagem e informações empilhadas */}
                <section className="flex flex-col gap-4">
                    {/* Breadcrumbs — sempre no topo */}
                    <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
                        <HomeLine className="size-5 text-fg-quaternary" />
                        <ChevronRight className="size-4 text-fg-quaternary" />
                        <span className="text-sm font-semibold text-quaternary">Categoria</span>
                    </nav>

                    {/* Imagem */}
                    <img
                        ref={bannerRef}
                        src={bannerImg}
                        alt="Turnê Dominguinho"
                        className="mx-auto w-[270px] max-w-full rounded-2xl lg:mx-0 lg:w-[360px]"
                    />

                    {/* Informações */}
                    <div className="flex flex-col gap-4">
                        {/* Título + classificação */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-4">
                                <h1 className="flex-1 text-display-xs font-semibold text-primary">Turnê Dominguinho - Goiânia</h1>
                                <AgeBadge />
                            </div>

                            {/* Detalhes */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="size-5 shrink-0 text-fg-quaternary" />
                                    <p className="text-sm text-tertiary">
                                        de <span className="font-bold text-secondary">{formatLongDate(config.dataInicio)}</span> a{" "}
                                        <span className="font-bold text-secondary">{formatLongDate(config.dataFim)}</span>
                                    </p>
                                </div>
                                {config.horarioTipo === "fixo" && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="size-5 shrink-0 text-fg-quaternary" />
                                        <p className="text-sm text-tertiary">
                                            Todos os dias às <span className="font-bold text-secondary">{config.horarioFixo}</span>
                                        </p>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <MarkerPin01 className="size-5 shrink-0 text-fg-quaternary" />
                                    <p className="truncate text-sm text-tertiary">R. Tucumã, 36 - São Paulo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Datas e horários */}
                <section className="flex flex-col gap-3">
                    <SectionHeading title="Datas e horários" sub="Datas sujeitas a alteração" />
                    <div className="grid grid-cols-5 gap-3 text-center">
                        {enumerateDays(config.dataInicio, config.dataFim).map((d, i) => {
                            const esgotado = config.esgotadas.includes(d.iso);
                            const horario = config.horarioTipo === "fixo" ? config.horarioFixo : HORARIOS_VARIADOS[i % HORARIOS_VARIADOS.length];
                            return (
                                <div key={d.iso} className="flex flex-col overflow-hidden rounded-lg border border-secondary bg-primary shadow-xs">
                                    <div className="flex flex-col items-center px-1 py-1.5">
                                        <span className={cx("text-sm font-semibold", esgotado ? "text-placeholder" : "text-primary")}>{d.weekday}</span>
                                        <span className={cx("text-xl font-semibold", esgotado ? "text-placeholder" : "text-primary")}>{d.day}</span>
                                        <span className={cx("text-sm", esgotado ? "text-placeholder" : "text-tertiary")}>{d.month}</span>
                                        {!esgotado && <span className="text-xs text-tertiary">{horario}</span>}
                                    </div>
                                    {esgotado && (
                                        <span className="w-full border-t border-secondary bg-secondary py-1 text-xs text-placeholder">esgotado</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Line-up */}
                {config.temLineup && (
                    <section className="flex flex-col gap-3">
                        <SectionHeading title="Line-up" sub="Horários sujeitos a alteração" />
                        <div className="flex flex-col border-t border-secondary">
                            {LINEUP.map((atracao) => (
                                <div key={atracao.name} className="flex items-start gap-3 border-b border-secondary py-4">
                                    <Avatar src={atracaoImg} alt={atracao.name} size="md" />
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-primary">{atracao.name}</span>
                                            {atracao.badge === "b2b" && (
                                                <Badge size="sm" color="gray" type="pill-color">
                                                    B2B
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {atracao.dates.map((date) => (
                                                <span
                                                    key={date.day}
                                                    className="rounded-full border border-secondary bg-secondary px-2 py-0.5 text-xs font-medium text-secondary"
                                                >
                                                    {config.lineupComHorario ? `${date.day} • ${date.time}` : date.day}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Como chegar */}
                <section className="flex flex-col gap-3">
                    <h2 className="text-md font-bold text-primary">Como chegar</h2>
                    <div className="overflow-hidden rounded-lg border border-tertiary bg-secondary">
                        <img src={mapaImg} alt="Mapa do local" className="h-[124px] w-full object-cover" />
                        <div className="flex items-end gap-2 p-4">
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="text-sm font-bold text-primary">Nome do lugar</span>
                                <span className="truncate text-sm text-secondary">R. Tucumã, 36 - São Paulo</span>
                            </div>
                            <Button size="sm" color="link-color" iconTrailing={Share04}>
                                Abrir no mapa
                            </Button>
                        </div>
                    </div>
                </section>

                {/* Sobre */}
                <section className="flex flex-col gap-3">
                    <h2 className="text-md font-bold text-primary">Sobre</h2>
                    <div className="flex flex-col gap-3.5 text-sm leading-5 text-secondary">
                        {SOBRE.map((paragraph, i) => (
                            <p key={i} className={cx(i === 0 && "font-bold text-primary")}>
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </section>

                {/* Perguntas frequentes */}
                <section className="flex flex-col gap-2">
                    <h2 className="text-xl font-semibold text-primary">Perguntas frequentes</h2>
                    <div className="flex flex-col">
                        {FAQ.map((item) => (
                            <FaqItem key={item.q} q={item.q} a={item.a} />
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <footer className="flex flex-col items-center pt-3">
                    <p className="text-center text-xs text-tertiary">© 2025 Bilheteria. Todos os direitos reservados.</p>
                </footer>
            </main>

                {/* Bloco fixo flutuante (desktop) — acompanha o scroll */}
                <aside className="hidden lg:block lg:w-[360px] lg:shrink-0">
                    <div className="sticky top-24 flex flex-col gap-3">
                        {/* Resumo: data, horário e local */}
                        <div className="flex flex-col gap-3 rounded-2xl bg-primary p-4 shadow-lg ring-1 ring-border-secondary">
                            <div className="flex items-center gap-2.5">
                                <Calendar className="size-5 shrink-0 text-fg-quaternary" />
                                <span className="text-sm text-secondary">
                                    de <span className="font-bold text-primary">{formatLongDate(config.dataInicio)}</span> a{" "}
                                    <span className="font-bold text-primary">{formatLongDate(config.dataFim)}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Clock className="size-5 shrink-0 text-fg-quaternary" />
                                <span className="text-sm text-secondary">
                                    {config.horarioTipo === "fixo" ? `Todos os dias às ${config.horarioFixo}` : "Vários horários"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <MarkerPin01 className="size-5 shrink-0 text-fg-quaternary" />
                                <span className="text-sm text-secondary">R. Tucumã, 36 - São Paulo</span>
                            </div>
                        </div>

                        <StatusBar status={config.status} preco="R$ 3.000,00" />
                    </div>
                </aside>
            </div>

            {/* Barra inferior fixa (mobile) */}
            <div className="fixed inset-x-0 bottom-0 z-20 lg:hidden">
                <div className="mx-auto max-w-[480px] px-4 pb-4">
                    <StatusBar status={config.status} preco="R$ 3.000,00" />
                </div>
            </div>

            <EventConfigSlideout isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} config={config} onChange={setConfig} />
        </div>
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

function SectionHeading({ title, sub }: { title: string; sub: string }) {
    return (
        <div className="flex flex-col">
            <p className="text-md font-bold text-primary">{title}</p>
            <p className="text-sm text-secondary">{sub}</p>
        </div>
    );
}

function AgeBadge({ value = "16" }: { value?: string }) {
    return (
        <div className="flex shrink-0 flex-col items-center">
            <span className="grid size-6 place-items-center rounded-xs bg-brand-solid text-sm font-semibold text-white">{value}</span>
            <span className="text-xs text-secondary">anos</span>
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

function StatusBar({ status, preco }: { status: EventStatus; preco: string }) {
    const card = "rounded-2xl bg-primary p-4 shadow-lg ring-1 ring-border-secondary";

    if (status === "venda-ativa") {
        return (
            <div className={cx(card, "flex items-center justify-between gap-3")}>
                <div className="flex flex-col">
                    <span className="text-sm text-tertiary">A partir de</span>
                    <span className="text-md font-bold text-primary">{preco}</span>
                    <span className="text-xs text-tertiary">Taxa inclusa</span>
                </div>
                <Button size="lg" color="primary">
                    Garantir ingresso
                </Button>
            </div>
        );
    }

    if (status === "soldout-sem-lista") {
        return (
            <div className={cx(card, "flex items-center gap-3")}>
                <Badge size="md" color="gray" type="modern">
                    Sold-out
                </Badge>
                <span className="text-sm font-bold text-primary">Os ingressos para este evento esgotaram.</span>
            </div>
        );
    }

    if (status === "soldout-com-lista") {
        return (
            <div className={cx(card, "flex flex-col gap-3")}>
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

    // aguardando-abertura
    return (
        <div className={cx(card, "flex flex-col gap-3")}>
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
