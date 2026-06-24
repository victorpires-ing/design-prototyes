import { useState } from "react";
import { ArrowLeft, Calendar, CheckCircle, Clock, MarkerPin01, Ticket01, Users01, VideoRecorder } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { cx } from "@/utils/cx";
import { AcademyLayout } from "../../components/AcademyLayout";
import { CATEGORIAS, CURSOS } from "../data/cursos";

export function EventoInscricao() {
    const { id } = useParams();
    const navigate = useNavigate();
    const curso = CURSOS.find((c) => c.id === id) ?? CURSOS[0];
    const evento = curso.evento;
    const [inscrito, setInscrito] = useState(false);

    const categoriaLabel = CATEGORIAS.find((c) => c.id === curso.categoria)?.label ?? "Presencial";
    const vagasRestantes = evento ? Math.max(0, evento.vagas - evento.inscritos) - (inscrito ? 1 : 0) : 0;
    const lotando = evento ? evento.inscritos / evento.vagas >= 0.85 : false;

    return (
        <AcademyLayout active={curso.categoria === "sports-week" ? "sports-week" : "presencial"}>
            {/* ===== Backdrop ===== */}
            <section className="relative">
                <div className="relative h-[52vh] min-h-[360px] w-full md:h-[58vh]">
                    <img src={curso.backdrop} alt="" className="absolute inset-0 size-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/50 to-black/40" />
                    <span className="absolute inset-0 bg-gradient-to-r from-[#0b0b0f]/90 via-transparent to-transparent" />

                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="absolute left-4 top-20 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/60 md:left-10"
                    >
                        <ArrowLeft className="size-4" /> Voltar
                    </button>

                    <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1600px] px-4 pb-6 md:px-10 md:pb-8">
                        <div className="flex max-w-2xl flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded bg-[#E50914] px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-white">
                                    {categoriaLabel} · Evento presencial
                                </span>
                                {lotando && !inscrito && (
                                    <span className="rounded bg-amber-500/90 px-2 py-0.5 text-xs font-bold text-black">Últimas vagas</span>
                                )}
                            </div>
                            <h1 className="text-3xl font-black leading-tight text-white drop-shadow-lg md:text-5xl">{curso.titulo}</h1>
                            <span className="text-sm text-white/75">com {curso.instrutor}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Corpo ===== */}
            <div className="mx-auto grid max-w-[1600px] gap-8 px-4 pb-20 pt-8 md:grid-cols-[1fr_360px] md:px-10">
                {/* Principal */}
                <div className="flex min-w-0 flex-col gap-8">
                    {/* Aviso da peculiaridade */}
                    <div className="flex items-start gap-3 rounded-xl border border-[#E50914]/30 bg-[#E50914]/10 p-4">
                        <VideoRecorder className="mt-0.5 size-5 shrink-0 text-[#ff6b6b]" />
                        <p className="text-sm leading-relaxed text-white/85">
                            Este é um <strong className="text-white">evento presencial</strong>. Garanta sua vaga para participar ao vivo — e,
                            depois que ele acontecer, a <strong className="text-white">gravação completa vira um curso</strong> aqui na
                            plataforma, disponível para quem se inscreveu.
                        </p>
                    </div>

                    {/* Sobre */}
                    <section className="flex flex-col gap-2">
                        <h2 className="text-lg font-bold text-white">Sobre o evento</h2>
                        <p className="text-sm leading-relaxed text-white/70">
                            Um encontro presencial de {categoriaLabel.toLowerCase()} com {curso.instrutor}. Vivencie o treino ao vivo, conecte-se
                            com a comunidade e leve para casa o conteúdo gravado.
                        </p>
                    </section>

                    {/* Programação */}
                    {evento && evento.programacao.length > 0 && (
                        <section className="flex flex-col gap-3">
                            <h2 className="text-lg font-bold text-white">Programação do dia</h2>
                            <ul className="flex flex-col gap-2">
                                {evento.programacao.map((p, i) => (
                                    <li key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-3">
                                        <span className="flex w-16 shrink-0 items-center gap-1.5 text-sm font-bold text-white">
                                            <Clock className="size-4 text-white/50" /> {p.hora}
                                        </span>
                                        <span className="text-sm text-white/80">{p.titulo}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                {/* Card de inscrição */}
                <aside className="md:sticky md:top-24 md:self-start">
                    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                        {evento && (
                            <div className="flex flex-col gap-3">
                                <Linha icon={Calendar} label="Data" valor={evento.data} />
                                <Linha icon={MarkerPin01} label="Local" valor={`${evento.local} · ${evento.cidade}`} />
                                <Linha icon={Ticket01} label="Inscrição" valor={evento.preco} />
                                <Linha
                                    icon={Users01}
                                    label="Vagas"
                                    valor={vagasRestantes > 0 ? `${vagasRestantes} restantes` : "Esgotado"}
                                />
                            </div>
                        )}

                        {inscrito ? (
                            <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                                <CheckCircle className="size-7 text-emerald-400" />
                                <span className="text-sm font-bold text-white">Inscrição confirmada!</span>
                                <span className="text-xs text-white/65">
                                    Você vai receber os detalhes por e-mail. Depois do evento, a gravação aparece em “Meus cursos”.
                                </span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setInscrito(true)}
                                disabled={vagasRestantes <= 0}
                                className={cx(
                                    "w-full rounded-md py-3 text-sm font-bold transition",
                                    vagasRestantes > 0 ? "bg-[#E50914] text-white hover:bg-[#c40811]" : "cursor-not-allowed bg-white/10 text-white/40",
                                )}
                            >
                                {vagasRestantes > 0 ? "Garantir minha vaga" : "Vagas esgotadas"}
                            </button>
                        )}
                        <p className="text-center text-xs text-white/45">A gravação fica disponível para inscritos após o evento.</p>
                    </div>
                </aside>
            </div>
        </AcademyLayout>
    );
}

function Linha({ icon: Icon, label, valor }: { icon: React.ComponentType<{ className?: string }>; label: string; valor: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <Icon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col">
                <span className="text-xs text-white/45">{label}</span>
                <span className="text-sm font-semibold text-white">{valor}</span>
            </div>
        </div>
    );
}
