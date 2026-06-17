import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, SearchLg } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { COMUNIDADES } from "../data/comunidade";

export function Comunidades() {
    const navigate = useNavigate();
    const [busca, setBusca] = useState("");
    const recomendadas = COMUNIDADES.filter((c) => c.motivoRecomendacao);
    const lista = useMemo(() => {
        const q = busca.trim().toLowerCase();
        if (!q) return COMUNIDADES;
        return COMUNIDADES.filter((c) =>
            [c.nome, c.empresa, c.atividade].some((campo) => campo.toLowerCase().includes(q)),
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
                <h1 className="mt-2 text-display-xs font-bold text-primary">Comunidades</h1>
                <p className="mt-1 text-md text-tertiary">Descubra comunidades oficiais e participe.</p>

                {/* Carrossel — recomendadas pelo perfil */}
                {recomendadas.length > 0 && (
                    <div className="-mx-6 mt-6">
                        <div className="flex items-center gap-1.5 px-6">
                            <span className="text-sm font-bold text-primary">Recomendadas pra você</span>
                            <span className="text-base leading-none">✨</span>
                        </div>
                        <div className="mt-3 flex gap-3 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {recomendadas.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => navigate(`/ticket-sports/hub/comunidades/${c.id}`)}
                                    className="flex w-56 shrink-0 flex-col overflow-hidden rounded-2xl border border-secondary text-left transition duration-100 hover:border-[#7C3AED]/40"
                                >
                                    <div className="relative h-24">
                                        <img src={c.banner} alt="" className="size-full object-cover" />
                                        <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                        <img
                                            src={c.logo}
                                            alt=""
                                            className="absolute -bottom-5 left-3 size-12 rounded-xl object-cover ring-2 ring-primary"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-0.5 p-3 pt-7">
                                        <span className="truncate text-sm font-bold text-primary">{c.nome}</span>
                                        <span className="truncate text-xs text-tertiary">{c.inscritos} inscritos · {c.atividade}</span>
                                        <span className="mt-1.5 self-start max-w-full rounded-lg bg-[#7C3AED]/10 px-2 py-1 text-[11px] font-semibold leading-snug text-[#7C3AED]">
                                            {c.motivoRecomendacao}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="relative mt-6">
                    <SearchLg className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-quaternary" />
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar comunidade, empresa ou esporte…"
                        className="w-full rounded-full border border-secondary bg-primary py-2.5 pl-11 pr-4 text-md text-primary placeholder:text-placeholder outline-none transition duration-100 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30"
                    />
                </div>

                <span className="mt-6 text-sm font-bold text-primary">{busca ? "Resultados" : "Todas as comunidades"}</span>
                <div className="mt-3 flex flex-col gap-3">
                    {lista.map((c) => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => navigate(`/ticket-sports/hub/comunidades/${c.id}`)}
                            className="flex items-center gap-3 rounded-2xl border border-secondary p-3 text-left transition duration-100 hover:bg-secondary"
                        >
                            <img src={c.logo} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm font-bold text-primary">{c.nome}</span>
                                <span className="truncate text-xs text-tertiary">por {c.empresa}</span>
                                <span className="mt-0.5 text-xs text-tertiary">
                                    {c.inscritos} inscritos · {c.atividade}
                                </span>
                            </div>
                            <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                        </button>
                    ))}
                    {lista.length === 0 && (
                        <p className="py-10 text-center text-sm text-tertiary">
                            Nenhuma comunidade encontrada para “{busca}”.
                        </p>
                    )}
                </div>
            </div>
        </TicketSportsLayout>
    );
}
