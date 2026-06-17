import { ChevronDown, ChevronRight, Ticket01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";

interface EventoCard {
    id: string;
    title: string;
    date: string;
    gradient: string;
}

const EVENTOS_COPA: EventoCard[] = [
    { id: "arena1", title: "ARENA BRASILEIRA 2026", date: "Sáb, 13 de junho", gradient: "linear-gradient(150deg,#16a34a 0%,#2563eb 50%,#f59e0b 100%)" },
    { id: "arena2", title: "ARENA Backstage Mirante", date: "Sáb, 13 de junho", gradient: "linear-gradient(150deg,#2563eb 0%,#0ea5e9 100%)" },
    { id: "justino", title: "Seu Justino - Copa do Mundo", date: "Sáb, 13 de junho", gradient: "linear-gradient(150deg,#15803d 0%,#facc15 100%)" },
];

const EM_ALTA: EventoCard[] = [
    { id: "reveillon", title: "Réveillon dos Milagres 2026", date: "Qui, 31 de dezembro", gradient: "linear-gradient(135deg,#FF4D00 0%,#B91C1C 100%)" },
    { id: "sunset", title: "Sunset na Praia", date: "Ter, 29 de dezembro", gradient: "linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)" },
    { id: "mixed", title: "Mixed by Mixed", date: "Seg, 28 de dezembro", gradient: "linear-gradient(135deg,#7c3aed 0%,#2563eb 100%)" },
];

export function Home() {
    return (
        <AppShell activeTab="inicio">
            {/* Hero / carrossel */}
            <section
                className="relative flex h-[440px] flex-col"
                style={{ background: "linear-gradient(180deg,#1e3a8a 0%,#1d4ed8 38%,#15803d 100%)" }}
            >
                <StatusBar tone="light" />

                <div className="flex items-center justify-between px-5 pt-1 text-white">
                    <span className="flex items-center gap-2 font-extrabold tracking-wide">
                        <Ticket01 className="size-5" aria-hidden="true" />
                        INGRESSE
                    </span>
                    <button type="button" className="flex items-center gap-1.5 text-sm font-semibold">
                        <span aria-hidden="true">🇧🇷</span>
                        Brasil
                        <ChevronDown className="size-4" />
                    </button>
                </div>

                {/* Overlay inferior com título + CTA + dots */}
                <div className="mt-auto bg-gradient-to-t from-black/70 to-transparent px-5 pt-16 pb-5">
                    <h1 className="text-xl font-bold text-white drop-shadow">Arena Brasileira 2026</h1>
                    <Button size="lg" color="primary" className="mt-4 w-full rounded-full">
                        Ver mais
                    </Button>
                    <div className="mt-4 flex items-center justify-center gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className={cx("h-1.5 rounded-full bg-white transition-all", i === 0 ? "w-5" : "w-1.5 bg-white/40")} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Eventos de Copa */}
            <EventoRow title="Eventos de Copa" eventos={EVENTOS_COPA} />

            {/* Em alta */}
            <EventoRow title="Em alta" eventos={EM_ALTA} />
        </AppShell>
    );
}

const EventoRow = ({ title, eventos }: { title: string; eventos: EventoCard[] }) => (
    <section className="pt-6">
        <div className="flex items-center justify-between px-5">
            <h2 className="text-md font-bold text-primary">{title}</h2>
            <button type="button" aria-label="Ver todos" className="text-fg-quaternary">
                <ChevronRight className="size-5" />
            </button>
        </div>

        <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {eventos.map((evento) => (
                <button key={evento.id} type="button" className="flex w-40 shrink-0 flex-col text-left">
                    <div className="h-40 w-40 rounded-2xl ring-1 ring-border-secondary ring-inset" style={{ background: evento.gradient }} />
                    <p className="mt-2 line-clamp-2 text-sm font-semibold text-primary">{evento.title}</p>
                    <p className="mt-0.5 text-xs text-tertiary">{evento.date}</p>
                </button>
            ))}
        </div>
    </section>
);
