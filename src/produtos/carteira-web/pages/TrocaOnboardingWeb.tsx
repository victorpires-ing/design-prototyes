import { useEffect, useState } from "react";
import type { FC } from "react";
import { Calendar, ChevronDown, ClockRewind, MarkerPin01, SearchLg, Ticket01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";
import logoBlack from "../../../assets/Company logo_black.svg";
import { TrocaOnboardingDesktop } from "../components/TrocaOnboardingDesktop";

type Tab = "vem-ai" | "ja-passou";

interface EventoCard {
    id: string;
    title: string;
    data: string;
    local: string;
    qtd: number;
    gradient: string;
}

const EVENTO_BASE: Omit<EventoCard, "id"> = {
    title: "DOCE MARAVILHA - A FESTA DA MÚSICA BRASILEIRA",
    data: "07 de Ago 2026",
    local: "Jockey Club Brasileiro - Rio de Janeiro",
    qtd: 1,
    gradient: "linear-gradient(140deg,#ff5a3c 0%,#f59e0b 52%,#c3d04a 100%)",
};

const VEM_AI: EventoCard[] = Array.from({ length: 6 }, (_, i) => ({ id: `doce-${i}`, ...EVENTO_BASE }));

/** Força tema light enquanto a tela está montada (carteira web do consumidor é sempre light). */
function useForceLightTheme() {
    const { theme, setTheme } = useTheme();
    useEffect(() => {
        const previous = theme;
        setTheme("light");
        return () => setTheme(previous);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

export function TrocaOnboardingWeb() {
    useForceLightTheme();
    const [tab, setTab] = useState<Tab>("vem-ai");
    const cards = tab === "vem-ai" ? VEM_AI : [];

    // Onboarding da troca/upgrade — abre ao entrar na Carteira (link dedicado).
    const [onboardingOpen, setOnboardingOpen] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setOnboardingOpen(true), 600);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="min-h-screen bg-primary text-primary">
            <TrocaOnboardingDesktop isOpen={onboardingOpen} onClose={() => setOnboardingOpen(false)} />

            {/* Header INGRESSE */}
            <header className="sticky top-0 z-30 border-b border-secondary bg-primary">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
                    <img src={logoBlack} alt="Ingresse" className="h-5 w-auto" />
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            type="button"
                            aria-label="Buscar"
                            className="flex size-10 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                        >
                            <SearchLg className="size-5" />
                        </button>
                        <button
                            type="button"
                            className="hidden items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary sm:flex"
                        >
                            <MarkerPin01 className="size-5 text-fg-quaternary" />
                            Brasil
                            <ChevronDown className="size-4 text-fg-quaternary" />
                        </button>
                        <Button size="md" color="primary">
                            ACESSAR
                        </Button>
                        <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary"
                        >
                            <span className="text-base leading-none">🇧🇷</span>
                            PT
                            <ChevronDown className="size-4 text-fg-quaternary" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Conteúdo */}
            <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
                <h1 className="text-3xl font-bold text-primary">Carteira</h1>

                {/* Tabs */}
                <div className="mt-6 flex border-b border-secondary">
                    <TabButton icon={Ticket01} label="Vem aí" active={tab === "vem-ai"} onClick={() => setTab("vem-ai")} />
                    <TabButton icon={ClockRewind} label="Já passou" active={tab === "ja-passou"} onClick={() => setTab("ja-passou")} />
                </div>

                {/* Grid de eventos */}
                {cards.length === 0 ? (
                    <p className="mt-12 text-center text-sm text-tertiary">Nenhum ingresso por aqui ainda.</p>
                ) : (
                    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {cards.map((card) => (
                            <EventoCardView key={card.id} card={card} onClick={() => setOnboardingOpen(true)} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

const TabButton = ({ icon: Icon, label, active, onClick }: { icon: FC<{ className?: string }>; label: string; active: boolean; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={cx(
            "-mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition duration-100 ease-linear",
            active ? "border-fg-brand-primary text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary",
            label === "Já passou" && "ml-8",
        )}
    >
        <Icon className={cx("size-5", active ? "text-fg-brand-primary" : "text-fg-quaternary")} />
        <span>{label}</span>
    </button>
);

const EventoCardView = ({ card, onClick }: { card: EventoCard; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col overflow-hidden rounded-2xl bg-primary text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:-translate-y-0.5 hover:shadow-lg"
    >
        {/* Capa do evento */}
        <div className="relative h-44 w-full shrink-0 overflow-hidden" style={{ backgroundImage: card.gradient }}>
            <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                <Ticket01 className="size-3.5" />
                <span>
                    {card.qtd} {card.qtd === 1 ? "ingresso" : "ingressos"}
                </span>
            </div>
        </div>

        {/* Informações */}
        <div className="flex flex-col gap-1.5 p-4">
            <p className="truncate text-base font-bold text-primary">{card.title}</p>
            <p className="flex items-center gap-1.5 text-sm text-tertiary">
                <Calendar className="size-4 shrink-0 text-fg-quaternary" />
                <span>{card.data}</span>
            </p>
            <p className="flex items-center gap-1.5 text-sm text-tertiary">
                <MarkerPin01 className="size-4 shrink-0 text-fg-quaternary" />
                <span className="truncate">{card.local}</span>
            </p>
        </div>
    </button>
);
