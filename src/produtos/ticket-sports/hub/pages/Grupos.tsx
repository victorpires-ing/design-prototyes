import { useMemo, useState } from "react";
import { ArrowLeft, Plus, SearchLg } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubButton } from "../components/hub-ui";
import { GRUPOS } from "../data/home";

export function Grupos() {
    const navigate = useNavigate();
    const [busca, setBusca] = useState("");
    const recomendados = GRUPOS.filter((g) => g.motivoRecomendacao);
    const lista = useMemo(() => {
        const q = busca.trim().toLowerCase();
        if (!q) return GRUPOS;
        return GRUPOS.filter((g) =>
            [g.nome, g.atividade, g.local].some((campo) => campo.toLowerCase().includes(q)),
        );
    }, [busca]);

    return (
        <TicketSportsLayout>
            <div className="hub-rise flex flex-1 flex-col px-6 pt-8 pb-10">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex w-max items-center gap-1.5 text-sm font-semibold text-[#7C3AED]"
                >
                    <ArrowLeft className="size-4" />
                    Voltar
                </button>
                <h1 className="mt-2 text-display-xs font-bold text-primary">Grupos</h1>
                <p className="mt-1 text-md text-tertiary">Encontre sua galera e treine junto.</p>

                <div className="mt-5">
                    <HubButton iconLeading={Plus} onClick={() => navigate("/ticket-sports/hub/grupos/divulgar")}>
                        Divulgar grupo
                    </HubButton>
                </div>

                {/* Carrossel — recomendados pelo perfil */}
                {recomendados.length > 0 && (
                    <div className="-mx-6 mt-6">
                        <div className="flex items-center gap-1.5 px-6">
                            <span className="text-sm font-bold text-primary">Recomendados pra você</span>
                            <span className="text-base leading-none">✨</span>
                        </div>
                        <style>{`
@keyframes recKen{from{transform:scale(1)}to{transform:scale(1.12)}}
@keyframes recShine{0%{transform:translateX(-180%) skewX(-12deg)}55%,100%{transform:translateX(480%) skewX(-12deg)}}
@keyframes recGlow{0%,100%{box-shadow:0 4px 12px -8px rgba(124,58,237,.35)}50%{box-shadow:0 6px 18px -8px rgba(124,58,237,.55)}}
@media (prefers-reduced-motion:reduce){[style*="recKen"],[style*="recShine"],[style*="recGlow"]{animation:none!important}}
`}</style>
                        <div className="mt-2 flex gap-3 overflow-x-auto px-6 pb-5 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {recomendados.map((g, idx) => (
                                <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => navigate(`/ticket-sports/hub/grupos/${g.id}`)}
                                    className="relative flex w-52 shrink-0 flex-col gap-2.5 overflow-hidden rounded-2xl border border-[#7C3AED]/40 p-3 text-left"
                                    style={{ animation: "recGlow 3s ease-in-out infinite", animationDelay: `${idx * 0.5}s` }}
                                >
                                    {/* brilho deslizante */}
                                    <span className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl">
                                        <span
                                            className="absolute inset-y-0 left-0 w-1/3 bg-[#7C3AED]/15 blur-md"
                                            style={{ animation: "recShine 3.6s ease-in-out infinite", animationDelay: `${idx * 0.4}s` }}
                                        />
                                    </span>
                                    <div className="size-16 overflow-hidden rounded-xl">
                                        <img
                                            src={g.logo}
                                            alt=""
                                            className="size-full object-cover"
                                            style={{ animation: "recKen 14s ease-in-out infinite alternate" }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="truncate text-sm font-bold text-primary">{g.nome}</span>
                                        <span className="truncate text-xs text-tertiary">{g.membros} membros · {g.atividade}</span>
                                        <span className="mt-1.5 self-start max-w-full rounded-lg bg-[#7C3AED]/10 px-2 py-1 text-[11px] font-semibold leading-snug text-[#7C3AED]">
                                            {g.motivoRecomendacao}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Busca */}
                <div className="relative mt-6">
                    <SearchLg className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-quaternary" />
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar grupo, esporte ou local…"
                        className="w-full rounded-full border border-secondary bg-primary py-2.5 pl-11 pr-4 text-md text-primary placeholder:text-placeholder outline-none transition duration-100 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30"
                    />
                </div>

                <span className="mt-6 text-sm font-bold text-primary">{busca ? "Resultados" : "Todos os grupos"}</span>
                <div className="mt-3 flex flex-col gap-3">
                    {lista.map((g) => (
                        <div key={g.id} className="flex items-center gap-3 rounded-2xl border border-secondary p-4">
                            <img src={g.logo} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm font-bold text-primary">{g.nome}</span>
                                <span className="text-xs text-tertiary">
                                    {g.membros} membros · {g.atividade}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate(`/ticket-sports/hub/grupos/${g.id}`)}
                                className="shrink-0 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
                            >
                                Detalhes
                            </button>
                        </div>
                    ))}
                    {lista.length === 0 && (
                        <p className="py-10 text-center text-sm text-tertiary">Nenhum grupo encontrado para “{busca}”.</p>
                    )}
                </div>
            </div>
        </TicketSportsLayout>
    );
}
