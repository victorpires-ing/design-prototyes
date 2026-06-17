import { useMemo, useState } from "react";
import { Calendar, ChevronRight, FilterFunnel01, MarkerPin01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { EventoCard } from "../components/EventoCard";
import { HubTabBar } from "../components/HubTabBar";
import { CIDADE_USUARIO, EVENTOS } from "../data/eventos";

const FILTROS = ["Todos", "Corrida", "CrossFit", "Ciclismo", "Yoga"];

export function Eventos() {
    const navigate = useNavigate();
    const [filtro, setFiltro] = useState("Todos");
    const abrir = (id: string) => navigate(`/ticket-sports/hub/eventos/${id}`);
    const recomendado = EVENTOS.find((e) => e.recomendado);
    const lista = useMemo(() => EVENTOS.filter((e) => (filtro === "Todos" ? true : e.atividade === filtro)), [filtro]);

    return (
        <TicketSportsLayout fullHeight>
            <header className="flex items-center justify-between gap-3 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <h1 className="text-xl font-bold text-primary">Eventos</h1>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary">
                        <MarkerPin01 className="size-3.5 text-[#7C3AED]" /> {CIDADE_USUARIO}
                    </span>
                    <button
                        type="button"
                        onClick={() => navigate("/ticket-sports/hub/eventos/filtros")}
                        aria-label="Filtros"
                        className="flex size-10 items-center justify-center rounded-full bg-secondary text-fg-secondary transition hover:bg-tertiary"
                    >
                        <FilterFunnel01 className="size-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/ticket-sports/hub/eventos/mapa")}
                        aria-label="Mapa de eventos"
                        className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#D946EF] text-white shadow-md transition hover:opacity-90"
                    >
                        <span className="absolute inset-0 animate-ping rounded-full bg-[#7C3AED] opacity-30" />
                        <MarkerPin01 className="relative size-5" />
                    </button>
                </div>
            </header>

            <main className="hub-rise flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5 pb-28 [&>*]:shrink-0">
                <p className="text-md text-tertiary">Perto de você e do seu esporte.</p>

                {/* Recomendado — destaque */}
                {recomendado && (
                    <button
                        type="button"
                        onClick={() => abrir(recomendado.id)}
                        className="relative overflow-hidden rounded-2xl border border-[#7C3AED]/40 text-left"
                        style={{ animation: "recGlow 3s ease-in-out infinite" }}
                    >
                        <style>{`
@keyframes recKen{from{transform:scale(1)}to{transform:scale(1.12)}}
@keyframes recShine{0%{transform:translateX(-180%) skewX(-12deg)}55%,100%{transform:translateX(480%) skewX(-12deg)}}
@keyframes recGlow{0%,100%{box-shadow:0 8px 22px -10px rgba(124,58,237,.35)}50%{box-shadow:0 12px 34px -6px rgba(124,58,237,.6)}}
@keyframes recChev{0%,100%{transform:translateX(0)}50%{transform:translateX(3px)}}
@keyframes recSpark{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(1.3)}}
@media (prefers-reduced-motion:reduce){[style*="recKen"],[style*="recShine"],[style*="recGlow"],[style*="recChev"],[style*="recSpark"]{animation:none!important}}
`}</style>
                        <div className="relative h-44 overflow-hidden">
                            <img
                                src={recomendado.imagem}
                                alt=""
                                className="size-full object-cover"
                                style={{ animation: "recKen 14s ease-in-out infinite alternate" }}
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            {/* brilho deslizante */}
                            <span className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
                                <span className="absolute inset-y-0 left-0 w-1/4 bg-white/25 blur-md" style={{ animation: "recShine 3.6s ease-in-out infinite" }} />
                            </span>
                            <span className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#D946EF] px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                                <span className="inline-block" style={{ animation: "recSpark 1.6s ease-in-out infinite" }}>✨</span> Recomendado pra você
                            </span>
                            <div className="absolute inset-x-3 bottom-3 z-20 flex flex-col gap-1 text-white">
                                <span className="flex w-max items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-md">
                                    {recomendado.emoji} {recomendado.atividade} · {recomendado.nivel}
                                </span>
                                <h3 className="text-lg font-bold leading-tight">{recomendado.titulo}</h3>
                                <span className="flex items-center gap-1.5 text-xs text-white/90">
                                    <Calendar className="size-3.5" /> {recomendado.data} · {recomendado.distancia}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 p-3">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {recomendado.amigos.map((a, idx) => (
                                        <img key={idx} src={a.foto} alt="" className="size-7 rounded-full object-cover ring-2 ring-primary" />
                                    ))}
                                </div>
                                <span className="text-xs text-tertiary">{recomendado.amigos.length} do seu grupo vão</span>
                            </div>
                            <span className="flex items-center gap-1 rounded-lg bg-[#7C3AED] px-3.5 py-2 text-sm font-semibold text-white">
                                Ver <ChevronRight className="size-4" style={{ animation: "recChev 1.2s ease-in-out infinite" }} />
                            </span>
                        </div>
                    </button>
                )}

                {/* Filtros */}
                <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {FILTROS.map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFiltro(f)}
                            className={
                                "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition duration-100 " +
                                (filtro === f ? "border-[#7C3AED] bg-[#7C3AED] text-white" : "border-secondary text-secondary")
                            }
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Lista */}
                <div className="flex flex-col gap-3">
                    {lista.map((e) => (
                        <EventoCard key={e.id} e={e} onClick={() => abrir(e.id)} />
                    ))}
                    {lista.length === 0 && <p className="py-8 text-center text-sm text-tertiary">Nenhum evento dessa atividade por aqui ainda.</p>}
                </div>
            </main>

            <HubTabBar active="eventos" />
        </TicketSportsLayout>
    );
}
