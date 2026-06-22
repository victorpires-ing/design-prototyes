import { useState } from "react";
import { useNavigate } from "react-router";
import type { FC } from "react";
import { ChevronRight, ClockRewind, Ticket01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";

interface Evento {
    id: string;
    title: string;
    date: string;
    local: string;
    qtd: number;
    gradient?: string;
}
interface GrupoMes {
    mes: string;
    eventos: Evento[];
}

const VEM_AI: GrupoMes[] = [
    {
        mes: "Junho 2026",
        eventos: [
            {
                id: "arena",
                title: "ARENA BRASILEIRA 2026",
                date: "Sex, 19 jun • 15:00",
                local: "Parque Ibirapuera • São Paulo/SP",
                qtd: 2,
                gradient: "linear-gradient(150deg,#16a34a 0%,#2563eb 50%,#f59e0b 100%)",
            },
        ],
    },
    {
        mes: "Dezembro 2026",
        eventos: [
            {
                id: "reveillon-copacabana",
                title: "Réveillon Copacabana 2027",
                date: "Qui, 31 dez • 22:00",
                local: "Praia de Copacabana • Rio de Janeiro/RJ",
                qtd: 2,
                gradient: "linear-gradient(135deg,#1d4ed8 0%,#9333ea 55%,#f59e0b 100%)",
            },
            {
                id: "sao-silvestre",
                title: "São Silvestre 2026",
                date: "Qui, 31 dez • 08:00",
                local: "Av. Paulista • São Paulo/SP",
                qtd: 2,
                gradient: "linear-gradient(135deg,#FF4D00 0%,#1d4ed8 100%)",
            },
        ],
    },
    {
        mes: "Janeiro 2027",
        eventos: [
            { id: "combo", title: "TESTE MINI COMBO", date: "Seg, 04 jan • 20:00", local: "Japaratinga • Japaratinga/AL", qtd: 2 },
        ],
    },
    {
        mes: "Março 2027",
        eventos: [
            {
                id: "mirella",
                title: "Mirella teste 2",
                date: "Sáb, 27 mar • 00:00",
                local: "Estádio Olímpico Nilton Santos",
                qtd: 1,
                gradient: "linear-gradient(135deg,#1f2937 0%,#0b0f19 100%)",
            },
        ],
    },
];

const PASSADOS: GrupoMes[] = [
    {
        mes: "Março 2025",
        eventos: [
            { id: "lolla", title: "Lollapalooza 2025", date: "Sex, 28 mar • 12:00", local: "Autódromo de Interlagos • São Paulo/SP", qtd: 2, gradient: "linear-gradient(135deg,#db2777 0%,#7c3aed 100%)" },
        ],
    },
    {
        mes: "Janeiro 2024",
        eventos: [
            { id: "verao", title: "Festival de Verão 2024", date: "Sáb, 27 jan • 16:00", local: "Parque de Exposições • Salvador/BA", qtd: 4, gradient: "linear-gradient(135deg,#0ea5e9 0%,#22c55e 100%)" },
        ],
    },
];

export function Carteira() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<"vem-ai" | "passados">("vem-ai");
    const grupos = tab === "vem-ai" ? VEM_AI : PASSADOS;

    return (
        <AppShell activeTab="ingressos">
            <div className="min-h-full bg-secondary">
                <StatusBar tone="dark" />

                <h1 className="px-5 pt-4 pb-5 text-xl font-bold text-primary">Carteira de ingressos</h1>

                {/* Tabs */}
                <div className="flex px-5">
                    <TabButton icon={Ticket01} label="Vem aí" active={tab === "vem-ai"} onClick={() => setTab("vem-ai")} />
                    <TabButton icon={ClockRewind} label="Passados" active={tab === "passados"} onClick={() => setTab("passados")} />
                </div>
                <div className="h-px bg-border-secondary" />

                {/* Eventos agrupados por mês */}
                <div className="flex flex-col gap-2 px-5 pt-5 pb-6">
                    {grupos.map((grupo) => (
                        <section key={grupo.mes} className="pt-2">
                            <h2 className="pb-3 text-md font-bold text-primary">{grupo.mes}</h2>
                            <div className="flex flex-col gap-4">
                                {grupo.eventos.map((evento) => (
                                    <button
                                        key={evento.id}
                                        type="button"
                                        onClick={() => navigate("/ingresse-app/ingressos/evento", { state: { eventId: evento.id } })}
                                        className="flex items-center gap-4 rounded-2xl bg-primary p-3 text-left ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                                    >
                                        {evento.gradient ? (
                                            <div className="size-24 shrink-0 rounded-xl" style={{ background: evento.gradient }} />
                                        ) : (
                                            <div className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-secondary text-fg-quaternary">
                                                <Ticket01 className="size-8" />
                                            </div>
                                        )}
                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <p className="text-sm font-bold text-primary">{evento.title}</p>
                                            <p className="text-sm font-medium text-secondary">{evento.date}</p>
                                            <p className="text-sm text-tertiary">{evento.local}</p>
                                            <p className="text-sm text-tertiary">
                                                {evento.qtd} {evento.qtd === 1 ? "ingresso" : "ingressos"}
                                            </p>
                                        </div>
                                        <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}

const TabButton = ({ icon: Icon, label, active, onClick }: { icon: FC<{ className?: string }>; label: string; active: boolean; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={cx(
            "-mb-px flex flex-1 items-center justify-center gap-2 border-b-2 pb-3 text-sm font-semibold transition duration-100 ease-linear",
            active ? "border-fg-brand-primary text-brand-secondary" : "border-transparent text-tertiary",
        )}
    >
        <Icon className={cx("size-5", active ? "text-fg-brand-primary" : "text-fg-quaternary")} />
        {label}
    </button>
);
