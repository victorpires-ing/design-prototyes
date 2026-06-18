import { useState } from "react";
import { Announcement01, ArrowLeft, CheckVerified01, Heart, MessageCircle01 } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { EventoCard } from "../components/EventoCard";
import { HubButton } from "../components/hub-ui";
import { getComunidade } from "../data/comunidade";
import { EVENTOS } from "../data/eventos";

export function ComunidadeDetalhe() {
    const navigate = useNavigate();
    const { id } = useParams();
    const c = getComunidade(id);
    const [aba, setAba] = useState<"publicacoes" | "informativos" | "eventos">("publicacoes");
    const [inscrito, setInscrito] = useState(false);
    const eventosRelacionados = EVENTOS.filter((e) => e.atividade === c?.atividade);

    if (!c) {
        return (
            <TicketSportsLayout>
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="text-md text-tertiary">Comunidade não encontrada.</p>
                    <HubButton variant="secondary" onClick={() => navigate("/ticket-sports/hub/comunidades")}>
                        Ver comunidades
                    </HubButton>
                </div>
            </TicketSportsLayout>
        );
    }

    return (
        <TicketSportsLayout>
            <main className="flex flex-1 flex-col overflow-y-auto pb-10">
                {/* Banner + logo */}
                <div className="relative">
                    <img src={c.banner} alt="" className="h-36 w-full object-cover md:rounded-t-3xl" />
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Voltar"
                        className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/90 text-[#1f1f1f] backdrop-blur-md"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <span className="absolute -bottom-8 left-5 size-20 overflow-hidden rounded-2xl ring-4 ring-primary">
                        <img src={c.logo} alt={c.nome} className="size-full object-cover" />
                    </span>
                </div>

                {/* Cabeçalho */}
                <div className="flex flex-col gap-3 px-5 pt-12">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-display-xs font-bold text-primary">{c.nome}</h1>
                        <span className="flex w-max items-center gap-1.5 rounded-full bg-[#7C3AED]/5 px-2.5 py-1 text-xs font-semibold text-[#7C3AED]">
                            <CheckVerified01 className="size-3.5" />
                            Comunidade oficial · {c.empresa}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {c.participantes.slice(0, 4).map((p, i) => (
                                    <span key={i} className="flex size-8 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white ring-2 ring-primary">
                                        {p.inicial}
                                    </span>
                                ))}
                            </div>
                            <span className="text-sm text-tertiary">
                                <span className="font-bold text-primary">{c.inscritos}</span> inscritos
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setInscrito((v) => !v)}
                            className={cx(
                                "shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold transition duration-100",
                                inscrito ? "bg-primary text-primary ring-1 ring-border-secondary" : "bg-[#7C3AED] text-white hover:bg-[#6D28D9]",
                            )}
                        >
                            {inscrito ? "Inscrito" : "Inscrever-se"}
                        </button>
                    </div>
                </div>

                {/* Abas */}
                <div className="mt-5 flex border-b border-secondary px-5">
                    {(["publicacoes", "informativos", "eventos"] as const).map((tabId) => (
                        <button
                            key={tabId}
                            type="button"
                            onClick={() => setAba(tabId)}
                            className={cx(
                                "flex-1 border-b-2 pb-3 text-sm font-semibold transition duration-100",
                                aba === tabId ? "border-[#7C3AED] text-[#7C3AED]" : "border-transparent text-tertiary",
                            )}
                        >
                            {tabId === "publicacoes" ? "Publicações" : tabId === "informativos" ? "Informativos" : "Eventos"}
                        </button>
                    ))}
                </div>

                {/* Conteúdo */}
                <div className="flex flex-col gap-3 px-5 pt-5">
                    {aba === "publicacoes" &&
                        c.publicacoes.map((p) => (
                            <article key={p.id} className="flex flex-col gap-3 rounded-2xl border border-secondary p-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-full bg-[#7C3AED] font-bold text-white">{p.inicial}</span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-primary">{p.autor}</span>
                                        <span className="text-xs text-tertiary">{p.tempo}</span>
                                    </div>
                                </div>
                                <p className="text-md leading-snug text-secondary">{p.texto}</p>
                                {p.foto && <img src={p.foto} alt="" className="aspect-[3/2] w-full rounded-xl object-cover" />}
                                <div className="flex items-center gap-4 text-sm text-tertiary">
                                    <span className="flex items-center gap-1.5">
                                        <Heart className="size-4 text-[#7C3AED]" /> {p.curtidas}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MessageCircle01 className="size-4 text-fg-quaternary" /> {p.comentarios}
                                    </span>
                                </div>
                            </article>
                        ))}

                    {aba === "informativos" &&
                        c.informativos.map((info) => (
                            <article key={info.id} className="flex gap-3 rounded-2xl border border-secondary p-4">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#7C3AED]/10 text-[#7C3AED]">
                                    <Announcement01 className="size-5" />
                                </span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-bold text-primary">{info.titulo}</span>
                                    <p className="text-sm text-secondary">{info.texto}</p>
                                    <span className="mt-1 text-xs text-tertiary">{info.data}</span>
                                </div>
                            </article>
                        ))}

                    {aba === "eventos" &&
                        (eventosRelacionados.length > 0 ? (
                            eventosRelacionados.map((e) => (
                                <EventoCard key={e.id} e={e} onClick={() => navigate(`/ticket-sports/hub/eventos/${e.id}`)} />
                            ))
                        ) : (
                            <p className="py-10 text-center text-sm text-tertiary">
                                Nenhum evento desta comunidade por aqui ainda.
                            </p>
                        ))}
                </div>
            </main>
        </TicketSportsLayout>
    );
}
