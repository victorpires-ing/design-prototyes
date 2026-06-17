import { useState } from "react";
import { ArrowLeft, Calendar, Check, MarkerPin01 } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubButton } from "../components/hub-ui";
import { RESUMO } from "../data/desempenho";
import { getEvento } from "../data/eventos";

export function EventoDetalhe() {
    const navigate = useNavigate();
    const { id } = useParams();
    const e = getEvento(id);
    const [confirmado, setConfirmado] = useState(false);
    const pronto = RESUMO.taxaConclusao >= 70;

    if (!e) {
        return (
            <TicketSportsLayout>
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="text-md text-tertiary">Evento não encontrado.</p>
                    <HubButton variant="secondary" onClick={() => navigate("/ticket-sports/hub/eventos")}>
                        Ver eventos
                    </HubButton>
                </div>
            </TicketSportsLayout>
        );
    }

    return (
        <TicketSportsLayout fullHeight>
            <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4">
                {/* capa */}
                <div className="relative">
                    <img src={e.imagem} alt="" className="h-52 w-full object-cover md:rounded-t-3xl" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:rounded-t-3xl" />
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Voltar"
                        className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/90 text-primary backdrop-blur-md"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <span className="absolute bottom-3 left-4 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-primary backdrop-blur-md">
                        {e.emoji} {e.atividade} · {e.nivel}
                    </span>
                </div>

                <div className="flex flex-col gap-5 px-5 py-5">
                    {/* título */}
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-display-xs font-bold text-primary">{e.titulo}</h1>
                        <span className="flex items-center gap-1.5 text-sm text-tertiary">
                            <Calendar className="size-4 text-fg-quaternary" /> {e.data}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-tertiary">
                            <MarkerPin01 className="size-4 text-fg-quaternary" /> {e.local} · {e.distancia}
                        </span>
                    </div>

                    {/* recomendado pra você */}
                    {e.recomendado && (
                        <div className="flex flex-col gap-3 rounded-2xl bg-[#7C3AED]/5 p-4 ring-1 ring-[#7C3AED]/15">
                            <span className="text-sm font-bold text-[#7C3AED]">✨ Recomendado pra você</span>
                            <div className="flex flex-col gap-2">
                                {e.motivos.map((m, idx) => (
                                    <span key={idx} className="flex items-start gap-2 text-sm text-secondary">
                                        <Check className="mt-0.5 size-4 shrink-0 text-[#7C3AED]" /> {m}
                                    </span>
                                ))}
                            </div>
                            {pronto && (
                                <span className="rounded-lg bg-[#7C3AED]/10 px-3 py-2 text-sm font-semibold text-[#7C3AED]">
                                    💪 Pelo seu desempenho ({RESUMO.taxaConclusao}% de conclusão), você está pronto pra esse desafio!
                                </span>
                            )}
                        </div>
                    )}

                    {/* quem vai */}
                    {e.amigos.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-semibold text-primary">Quem vai</span>
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2.5">
                                    {e.amigos.map((a, idx) => (
                                        <img key={idx} src={a.foto} alt="" className="size-9 rounded-full object-cover ring-2 ring-primary" />
                                    ))}
                                </div>
                                <span className="text-sm text-tertiary">
                                    {e.inscritos} · <span className="font-semibold text-primary">{e.amigos.length} do seu grupo</span> vão
                                </span>
                            </div>
                        </div>
                    )}

                    {/* sobre */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-primary">Sobre o evento</span>
                        <p className="text-sm leading-snug text-secondary">{e.descricao}</p>
                    </div>
                </div>
            </main>

            {/* CTA fixo */}
            <div className="flex items-center justify-between gap-3 border-t border-secondary bg-primary px-5 py-4 md:rounded-b-3xl">
                <div className="flex flex-col leading-tight">
                    {e.precoMembro ? (
                        <>
                            <span className="text-xs text-tertiary line-through">{e.preco}</span>
                            <span className="text-lg font-bold text-primary">
                                {e.precoMembro} <span className="text-xs font-semibold text-[#7C3AED]">membro</span>
                            </span>
                        </>
                    ) : (
                        <span className="text-lg font-bold text-primary">{e.preco}</span>
                    )}
                </div>
                {confirmado ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-[#7C3AED]/5 px-5 py-3 text-sm font-semibold text-[#7C3AED]">
                        <Check className="size-5" /> Vaga garantida!
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirmado(true)}
                        className="rounded-lg bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
                    >
                        {e.preco === "Gratuito" ? "Confirmar presença" : "Garantir vaga"}
                    </button>
                )}
            </div>
        </TicketSportsLayout>
    );
}
