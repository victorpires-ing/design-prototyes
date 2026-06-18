import { useState } from "react";
import { Calendar, ChevronRight, FilterFunnel01, MarkerPin01, Users01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubTabBar } from "../components/HubTabBar";
import { RESUMO } from "../data/desempenho";
import { CIDADE_USUARIO, EVENTOS, type Evento } from "../data/eventos";

// Identidade de cor por esporte
const COR: Record<string, { from: string; to: string; solid: string }> = {
    Corrida: { from: "#FB923C", to: "#F97316", solid: "#F97316" },
    CrossFit: { from: "#F87171", to: "#EF4444", solid: "#EF4444" },
    Ciclismo: { from: "#60A5FA", to: "#3B82F6", solid: "#3B82F6" },
    Yoga: { from: "#2DD4BF", to: "#14B8A6", solid: "#14B8A6" },
};
const corDe = (a: string) => COR[a] ?? { from: "#A78BFA", to: "#7C3AED", solid: "#7C3AED" };
const secaoId = (a: string) => `secao-${a.toLowerCase()}`;

const FACETS = ["Pra você", "Perto", "Amigos vão", "Grátis", "Esta semana"];

function Poster({ e, onClick, destaque, className }: { e: Evento; onClick: () => void; destaque?: boolean; className?: string }) {
    const cor = corDe(e.atividade);
    return (
        <button
            type="button"
            onClick={onClick}
            className={cx(
                "relative aspect-[3/4] overflow-hidden rounded-2xl text-left shadow-md transition duration-100 active:scale-[0.97]",
                destaque ? "ring-2 ring-[#7C3AED]" : "ring-1 ring-black/5",
                className,
            )}
        >
            <img src={e.imagem} alt="" className="size-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <span
                className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                style={{ background: cor.solid }}
            >
                {e.emoji} {e.atividade}
            </span>
            {destaque && <span className="absolute right-2 top-2 rounded-full bg-[#7C3AED] px-2 py-0.5 text-[10px] font-bold text-white shadow">✨</span>}
            <div className="absolute inset-x-2 bottom-2 flex flex-col gap-0.5 text-white">
                <h3 className="line-clamp-2 text-sm font-bold leading-tight">{e.titulo}</h3>
                <span className="text-[11px] text-white/85">{e.data}</span>
                <span className="text-[11px] font-semibold text-[#C4B5FD]">{e.distancia}</span>
            </div>
        </button>
    );
}

function Banner({ e, onClick, destaque }: { e: Evento; onClick: () => void; destaque?: boolean }) {
    const cor = corDe(e.atividade);
    return (
        <button
            type="button"
            onClick={onClick}
            className={cx(
                "relative mx-5 h-40 overflow-hidden rounded-2xl text-left shadow-md transition duration-100 active:scale-[0.99]",
                destaque ? "ring-2 ring-[#7C3AED]" : "ring-1 ring-black/5",
            )}
        >
            <img src={e.imagem} alt="" className="size-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm" style={{ background: cor.solid }}>
                {e.emoji} {e.atividade} · {e.nivel}
            </span>
            <div className="absolute inset-x-3 bottom-3 flex flex-col gap-1 text-white">
                <h3 className="line-clamp-2 max-w-[80%] text-lg font-bold leading-tight">{e.titulo}</h3>
                <span className="flex items-center gap-1.5 text-xs text-white/90">
                    <Calendar className="size-3.5" /> {e.data} · {e.distancia}
                </span>
                <span className="mt-1 flex w-max items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#7C3AED]">
                    Ver evento <ChevronRight className="size-3.5" />
                </span>
            </div>
        </button>
    );
}

function Linha({ titulo, eventos, abrir, recomendadoId }: { titulo: string; eventos: Evento[]; abrir: (id: string) => void; recomendadoId?: string }) {
    if (eventos.length === 0) return null;
    return (
        <div className="flex flex-col gap-3">
            <h2 className="px-5 text-base font-bold text-primary">{titulo}</h2>
            {eventos.length === 1 ? (
                <Banner e={eventos[0]} onClick={() => abrir(eventos[0].id)} destaque={eventos[0].id === recomendadoId} />
            ) : eventos.length === 2 ? (
                <div className="grid grid-cols-2 gap-3 px-5">
                    {eventos.map((e) => (
                        <Poster key={e.id} e={e} onClick={() => abrir(e.id)} destaque={e.id === recomendadoId} className="w-full" />
                    ))}
                </div>
            ) : (
                <div className="flex gap-3 overflow-x-auto px-5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {eventos.map((e) => (
                        <Poster key={e.id} e={e} onClick={() => abrir(e.id)} destaque={e.id === recomendadoId} className="w-36 shrink-0" />
                    ))}
                </div>
            )}
        </div>
    );
}

export function Eventos() {
    const navigate = useNavigate();
    const [facet, setFacet] = useState(0);
    const abrir = (id: string) => navigate(`/ticket-sports/hub/eventos/${id}`);
    const hero = EVENTOS.find((e) => e.recomendado) ?? EVENTOS[0];
    const corHero = corDe(hero.atividade);

    const porAtividade = (a: string) => EVENTOS.filter((e) => e.atividade === a);
    const atividades = Array.from(new Set(EVENTOS.map((e) => e.atividade)));
    const amigosVao = EVENTOS.filter((e) => e.amigos.length > 0);

    // prontidão (do desempenho) + raio do anel
    const pronto = RESUMO.taxaConclusao;
    const r = 18;
    const circ = 2 * Math.PI * r;

    const irPara = (a: string) => document.getElementById(secaoId(a))?.scrollIntoView({ behavior: "smooth", block: "start" });

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

            <main className="hub-rise flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto pb-28 [&>*]:shrink-0">
                {/* Chips de descoberta */}
                <div className="-mb-2 flex gap-2 overflow-x-auto px-5 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {FACETS.map((f, idx) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFacet(idx)}
                            className={cx(
                                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition duration-100",
                                facet === idx ? "border-[#7C3AED] bg-[#7C3AED] text-white" : "border-secondary text-secondary",
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* HERO — seu próximo desafio, com prontidão e contagem */}
                <button type="button" onClick={() => abrir(hero.id)} className="relative mx-5 h-[22rem] overflow-hidden rounded-3xl text-left shadow-lg">
                    <style>{`@keyframes heroKen{from{transform:scale(1)}to{transform:scale(1.12)}}`}</style>
                    <img src={hero.imagem} alt="" className="size-full object-cover" style={{ animation: "heroKen 16s ease-in-out infinite alternate" }} />
                    <span className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

                    <div className="absolute inset-x-4 top-4 flex items-start justify-between">
                        <span className="flex items-center gap-1 rounded-full bg-[#7C3AED] px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                            🎯 Seu próximo desafio
                        </span>
                        {/* anel de prontidão */}
                        <span className="flex items-center gap-1.5 rounded-full bg-black/40 py-1 pl-1 pr-2.5 backdrop-blur-md">
                            <span className="relative flex size-9 items-center justify-center">
                                <svg viewBox="0 0 44 44" className="size-9 -rotate-90">
                                    <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
                                    <circle cx="22" cy="22" r={r} fill="none" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pronto / 100)} />
                                </svg>
                                <span className="absolute text-[9px] font-bold text-white">{pronto}%</span>
                            </span>
                            <span className="text-[11px] font-semibold text-white">pronto</span>
                        </span>
                    </div>

                    <div className="absolute inset-x-4 bottom-4 flex flex-col gap-2.5 text-white">
                        <div className="flex items-center gap-2">
                            <span className="flex w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-sm" style={{ background: corHero.solid }}>
                                {hero.emoji} {hero.atividade} · {hero.nivel}
                            </span>
                            <span className="flex w-max items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md">
                                🔥 Inscrições fecham em 5 dias
                            </span>
                        </div>
                        <h2 className="text-3xl font-black leading-none tracking-tight">{hero.titulo}</h2>
                        <span className="flex items-center gap-2 text-sm text-white/90">
                            <Calendar className="size-4" /> {hero.data}
                            <span className="opacity-60">·</span>
                            <MarkerPin01 className="size-4" /> {hero.distancia}
                        </span>
                        <div className="mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1.5 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#7C3AED] shadow-lg">
                                Garantir vaga <ChevronRight className="size-4" />
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {hero.amigos.map((a, idx) => (
                                        <img key={idx} src={a.foto} alt="" className="size-7 rounded-full object-cover ring-2 ring-black/40" />
                                    ))}
                                </div>
                                <span className="text-xs text-white/85">{hero.amigos.length} amigos vão</span>
                            </div>
                        </div>
                    </div>
                </button>

                {/* Explore por modalidade — tiles coloridos */}
                <div className="flex flex-col gap-3">
                    <h2 className="px-5 text-base font-bold text-primary">Explore por esporte</h2>
                    <div className="flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {atividades.map((a) => {
                            const cor = corDe(a);
                            const qtd = porAtividade(a).length;
                            return (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => irPara(a)}
                                    className="relative flex h-24 w-28 shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-3 text-left text-white shadow-md transition active:scale-[0.97]"
                                    style={{ background: `linear-gradient(135deg, ${cor.from}, ${cor.to})` }}
                                >
                                    <span className="pointer-events-none absolute -right-3 -top-3 size-14 rounded-full bg-white/15" />
                                    <span className="text-2xl">{porAtividade(a)[0]?.emoji}</span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold leading-tight">{a}</span>
                                        <span className="text-[11px] font-medium text-white/85">{qtd} evento{qtd > 1 ? "s" : ""}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Amigos vão — prova social forte */}
                {amigosVao.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h2 className="flex items-center gap-1.5 px-5 text-base font-bold text-primary">
                            <Users01 className="size-4 text-[#7C3AED]" /> Amigos vão
                        </h2>
                        <div className="flex gap-3 overflow-x-auto px-5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {amigosVao.map((e) => (
                                <button
                                    key={e.id}
                                    type="button"
                                    onClick={() => abrir(e.id)}
                                    className="relative h-40 w-64 shrink-0 overflow-hidden rounded-2xl text-left shadow-md ring-1 ring-black/5 transition active:scale-[0.98]"
                                >
                                    <img src={e.imagem} alt="" className="size-full object-cover" />
                                    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                                    <div className="absolute inset-x-3 bottom-3 flex flex-col gap-1.5 text-white">
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2.5">
                                                {e.amigos.map((a, idx) => (
                                                    <img key={idx} src={a.foto} alt="" className="size-8 rounded-full object-cover ring-2 ring-white" />
                                                ))}
                                            </div>
                                            <span className="text-xs font-semibold">
                                                {e.amigos[0]?.nome} e +{Math.max(e.amigos.length - 1, 1)} vão
                                            </span>
                                        </div>
                                        <h3 className="line-clamp-1 text-sm font-bold">{e.titulo}</h3>
                                        <span className="text-[11px] text-white/85">{e.data} · {e.distancia}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bombando perto de você */}
                <Linha titulo="🔥 Bombando perto de você" eventos={EVENTOS} abrir={abrir} recomendadoId={hero.id} />

                {/* Seções por esporte (alvo do scroll dos tiles) */}
                {atividades.map((a) => (
                    <div key={a} id={secaoId(a)} className="scroll-mt-4">
                        <Linha titulo={a} eventos={porAtividade(a)} abrir={abrir} recomendadoId={hero.id} />
                    </div>
                ))}
            </main>

            <HubTabBar active="eventos" />
        </TicketSportsLayout>
    );
}
