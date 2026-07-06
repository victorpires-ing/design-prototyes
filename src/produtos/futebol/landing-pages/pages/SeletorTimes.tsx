import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { TIMES, type TimeConfig } from "../data/times";

export function SeletorTimes() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-secondary text-primary">
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 py-16 md:px-6 md:py-24">
                <header className="flex flex-col gap-2">
                    <h1 className="text-display-sm font-extrabold tracking-tight text-primary md:text-display-md">Escolha o time</h1>
                    <p className="max-w-md text-md text-tertiary">Selecione um clube para ver a página oficial de ingressos e eventos.</p>
                </header>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {TIMES.map((time) => (
                        <TimeCard key={time.id} time={time} onSelect={() => navigate(`/futebol/landing-pages/${time.id}`)} />
                    ))}
                </div>
            </div>
        </div>
    );
}

const TimeCard = ({ time, onSelect }: { time: TimeConfig; onSelect: () => void }) => (
    <button
        type="button"
        onClick={onSelect}
        className="group flex flex-col items-start gap-5 rounded-2xl bg-primary p-6 text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-primary_hover md:p-8"
    >
        {/* Quadro do escudo — cor do time com um branco por cima */}
        <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-white/20" style={{ backgroundColor: time.palette.accent }}>
            <span className="absolute inset-0 bg-white/10" aria-hidden="true" />
            <img src={time.logo} alt={time.nomeCompleto} className="relative max-h-14 w-auto p-1" />
        </div>

        <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold tracking-tight text-primary">{time.nome}</h2>
            <span className="text-sm text-tertiary">{time.temporada}</span>
        </div>

        <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary">
            Ver ingressos
            <ArrowRight className="size-4 transition-transform duration-100 ease-linear group-hover:translate-x-1" aria-hidden="true" />
        </span>
    </button>
);
