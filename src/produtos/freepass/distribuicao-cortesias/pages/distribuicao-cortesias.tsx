import { useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, ClockFastForward, MarkerPin06, Ticket01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { FreepassHeader } from "../components/FreepassHeader";
import { EVENTOS_CORTESIA, type EventoCortesia } from "../data/eventos";
import { useTotalDisponivel } from "../data/envios-store";

type Aba = "vem-ai" | "ja-passou";

const ABAS: { id: Aba; label: string; icon: typeof Ticket01 }[] = [
    { id: "vem-ai", label: "Vem aí", icon: Ticket01 },
    { id: "ja-passou", label: "Já passou", icon: ClockFastForward },
];

export function DistribuicaoCortesias() {
    const [aba, setAba] = useState<Aba>("vem-ai");
    const eventos = EVENTOS_CORTESIA.filter((e) => (aba === "ja-passou" ? e.passado : !e.passado));

    return (
        <div className="flex min-h-screen flex-col bg-primary text-primary">
            <FreepassHeader />

            <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
                <h1 className="text-display-sm font-semibold text-primary">Minhas cortesias</h1>

                {/* Abas */}
                <div className="flex border-b border-secondary">
                    {ABAS.map((a) => {
                        const ativo = aba === a.id;
                        const Icon = a.icon;
                        return (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => setAba(a.id)}
                                className={cx(
                                    "-mb-px flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition duration-100 ease-linear",
                                    ativo ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary",
                                )}
                            >
                                <Icon className="size-4 shrink-0" aria-hidden="true" />
                                {a.label}
                            </button>
                        );
                    })}
                </div>

                {eventos.length === 0 ? (
                    <div className="rounded-2xl bg-secondary px-6 py-16 text-center text-sm text-tertiary ring-1 ring-border-secondary">
                        {aba === "ja-passou" ? "Nenhum evento passado com cortesia." : "Nenhum evento com cortesia por aqui."}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {eventos.map((evento) => (
                            <EventoCortesiaCard key={evento.id} evento={evento} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

const EventoCortesiaCard = ({ evento }: { evento: EventoCortesia }) => {
    const navigate = useNavigate();
    const total = useTotalDisponivel(evento.id, evento.itens);
    const label = `${total} ${total === 1 ? "cortesia" : "cortesias"}`;

    return (
        <button
            type="button"
            onClick={() => navigate(`/freepass/distribuicao-cortesias/${evento.id}`)}
            className="group flex overflow-hidden rounded-2xl bg-primary text-left ring-1 ring-border-secondary transition duration-150 ease-linear hover:-translate-y-0.5 hover:ring-brand sm:flex-col"
        >
            <div className="relative h-full w-24 shrink-0 overflow-hidden sm:h-44 sm:w-full">
                {evento.capa ? (
                    <img src={evento.capa} alt={evento.nome} className="size-full object-cover" />
                ) : (
                    <div className={cx("size-full bg-gradient-to-br", evento.gradiente)} />
                )}
                <span className="absolute top-3 right-3 hidden items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-sm font-medium text-[#1a1a1a] backdrop-blur-md sm:inline-flex">
                    <Ticket01 className="size-3.5" aria-hidden="true" />
                    {label}
                </span>
                {evento.novo && (
                    <span className="absolute top-3 left-3 hidden items-center rounded-full bg-brand-solid px-2.5 py-1 text-sm font-semibold text-white sm:inline-flex">
                        Novo
                    </span>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
                {evento.novo && (
                    <span className="inline-flex w-fit items-center rounded-full bg-brand-solid px-2.5 py-0.5 text-sm font-semibold text-white sm:hidden">
                        Novo
                    </span>
                )}
                <span className="line-clamp-2 text-md font-semibold text-primary">{evento.nome}</span>
                <span className="flex items-center gap-1.5 text-sm text-tertiary">
                    <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    {evento.data}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-tertiary">
                    <MarkerPin06 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    <span className="truncate">{evento.local}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-blue-600 sm:hidden">
                    <Ticket01 className="size-4 shrink-0" aria-hidden="true" />
                    {label}
                </span>
            </div>
        </button>
    );
};
