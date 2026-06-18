import { Activity, ArrowLeft, Clock, MessageChatSquare, Stars01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { ASSUNTOS, ESPORTES, HORARIOS, HORARIO_PICO, INSIGHTS, TEMPO_MEDIO, TEMPO_POR_ATIVIDADE } from "../data/tendencias";

export function Tendencias() {
    const navigate = useNavigate();
    const maxHora = Math.max(...HORARIOS.map((h) => h.valor), 1);

    return (
        <TicketSportsLayout>
            <header className="flex items-center gap-2 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Voltar"
                    className="flex size-9 items-center justify-center rounded-full text-fg-secondary hover:bg-secondary"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <h1 className="text-xl font-bold text-primary">Tendências</h1>
            </header>

            <div className="hub-rise flex flex-1 flex-col gap-5 px-5 py-5 pb-10">
                <p className="text-md text-tertiary">O que está em alta no Hub esta semana.</p>

                {/* Em alta na comunidade */}
                <Bloco icon={MessageChatSquare} titulo="Em alta na comunidade">
                    {/* Assuntos mais comentados */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-secondary bg-primary p-4">
                        <h3 className="text-md font-semibold text-primary">Assuntos mais comentados</h3>
                        <div className="flex flex-col gap-3">
                            {ASSUNTOS.map((a, i) => (
                                <div key={a.tag} className="flex items-center gap-3">
                                    <span className="w-5 text-sm font-bold text-[#7C3AED]">{i + 1}</span>
                                    <span className="flex-1 text-sm font-semibold text-primary">{a.tag}</span>
                                    <span className="text-sm text-tertiary">{a.mencoes} menções</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Esportes mais praticados */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-secondary bg-primary p-4">
                        <h3 className="text-md font-semibold text-primary">Esportes mais praticados</h3>
                        <div className="flex flex-col gap-3">
                            {ESPORTES.map((e) => (
                                <div key={e.nome} className="flex items-center gap-3">
                                    <span className="text-xl leading-none">{e.emoji}</span>
                                    <div className="flex flex-1 flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-primary">{e.nome}</span>
                                            <span className="text-xs font-semibold text-tertiary">{e.pct}%</span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                                            <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${e.pct}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Bloco>

                {/* Hábitos de treino */}
                <Bloco icon={Activity} titulo="Hábitos de treino">
                    {/* Horários de treino */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-secondary bg-primary p-4">
                        <h3 className="text-md font-semibold text-primary">Horários de treino</h3>
                        <div className="flex h-32 items-stretch gap-2">
                            {HORARIOS.map((h) => (
                                <div key={h.label} className="flex flex-1 flex-col items-center gap-1.5">
                                    <div className="flex w-full flex-1 items-end">
                                        <div
                                            className={cx("w-full rounded-lg", h.label === HORARIO_PICO ? "bg-[#7C3AED]" : "bg-[#7C3AED]/30")}
                                            style={{ height: `${Math.max((h.valor / maxHora) * 100, 8)}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-tertiary">{h.label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="flex items-center gap-1.5 text-sm text-tertiary">
                            <Clock className="size-4 text-[#7C3AED]" /> Pico de treinos às <span className="font-semibold text-primary">{HORARIO_PICO}</span>
                        </p>
                    </div>

                    {/* Tempo médio de treino */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-secondary bg-primary p-4">
                        <h3 className="text-md font-semibold text-primary">Tempo médio de treino</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-primary">{TEMPO_MEDIO}</span>
                            <span className="text-sm text-tertiary">por sessão</span>
                        </div>
                        <div className="flex flex-col">
                            {TEMPO_POR_ATIVIDADE.map((t, i) => (
                                <div key={t.nome} className={cx("flex items-center justify-between py-2.5", i > 0 && "border-t border-secondary")}>
                                    <span className="flex items-center gap-2 text-sm text-primary">
                                        <span className="text-lg leading-none">{t.emoji}</span> {t.nome}
                                    </span>
                                    <span className="text-sm font-semibold text-tertiary">{t.tempo}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Bloco>

                {/* Insights */}
                <Bloco icon={Stars01} titulo="Insights">
                    <div className="flex flex-col gap-3">
                        {INSIGHTS.map((ins, i) => (
                            <div key={i} className="flex items-start gap-3 rounded-xl bg-[#7C3AED]/5 p-3 ring-1 ring-[#7C3AED]/15">
                                <span className="text-lg leading-none">{ins.emoji}</span>
                                <p className="text-sm font-medium text-secondary">{ins.texto}</p>
                            </div>
                        ))}
                    </div>
                </Bloco>
            </div>
        </TicketSportsLayout>
    );
}
