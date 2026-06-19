import { useState } from "react";
import { Activity, ArrowLeft, CheckVerified01, ChevronRight, Heart, Home02 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { HubButton, Stepper } from "../components/hub-ui";
import { ALIMENTACAO, ESPORTES_POR_OBJETIVO, HABITOS, PERGUNTAS } from "../data/plano";

type Fase = "quiz" | "montando" | "resultado";

export function Plano() {
    const navigate = useNavigate();
    const [fase, setFase] = useState<Fase>("quiz");
    const [idx, setIdx] = useState(0);
    const [respostas, setRespostas] = useState<Record<string, string>>({});

    const pergunta = PERGUNTAS[idx];

    const responder = (opcaoId: string) => {
        const novas = { ...respostas, [pergunta.id]: opcaoId };
        setRespostas(novas);
        if (idx < PERGUNTAS.length - 1) {
            setIdx((i) => i + 1);
        } else {
            setFase("montando");
            window.setTimeout(() => setFase("resultado"), 1100);
        }
    };

    const voltar = () => {
        if (fase !== "quiz") {
            setFase("quiz");
            return;
        }
        if (idx > 0) setIdx((i) => i - 1);
        else navigate(-1);
    };

    const esportes = ESPORTES_POR_OBJETIVO[respostas.objetivo] ?? ESPORTES_POR_OBJETIVO.disposicao;
    const refeicoes = ALIMENTACAO[respostas.alimentacao] ?? ALIMENTACAO.livre;

    return (
        <TicketSportsLayout>
            <header className="flex items-center gap-2 border-b border-secondary bg-primary px-5 py-3.5 md:rounded-t-3xl">
                <button
                    type="button"
                    onClick={voltar}
                    aria-label="Voltar"
                    className="flex size-9 items-center justify-center rounded-full text-fg-secondary hover:bg-secondary"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <h1 className="text-xl font-bold text-primary">Seu plano ideal</h1>
            </header>

            {/* QUIZ */}
            {fase === "quiz" && (
                <div className="flex flex-1 flex-col px-6 pt-6">
                    <Stepper current={idx + 1} total={PERGUNTAS.length} />
                    <span className="mt-6 text-sm font-medium text-tertiary">Pergunta {idx + 1} de {PERGUNTAS.length}</span>
                    <h2 className="mt-1 text-display-xs font-bold text-primary">{pergunta.titulo}</h2>

                    <div className="mt-6 flex flex-col gap-3">
                        {pergunta.opcoes.map((o) => {
                            const sel = respostas[pergunta.id] === o.id;
                            return (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => responder(o.id)}
                                    className={cx(
                                        "flex items-center gap-3 rounded-2xl border bg-primary p-4 text-left transition duration-100",
                                        sel ? "border-[#7C3AED] ring-1 ring-[#7C3AED]" : "border-secondary hover:border-[#7C3AED]/40",
                                    )}
                                >
                                    <span className="text-2xl leading-none">{o.emoji}</span>
                                    <span className="flex-1 text-md font-semibold text-primary">{o.label}</span>
                                    <ChevronRight className="size-5 text-fg-quaternary" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MONTANDO */}
            {fase === "montando" && (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                    <span className="flex size-20 items-center justify-center rounded-full bg-[#7C3AED]/10 text-4xl" style={{ animation: "planoPulse 1.1s ease-in-out infinite" }}>
                        ✨
                    </span>
                    <style>{`@keyframes planoPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.6}}`}</style>
                    <span className="text-lg font-bold text-primary">Montando seu plano…</span>
                    <span className="text-sm text-tertiary">Combinando seus objetivos com esportes, hábitos e alimentação.</span>
                </div>
            )}

            {/* RESULTADO */}
            {fase === "resultado" && (
                <div className="hub-rise flex flex-1 flex-col gap-5 px-5 py-5 pb-10">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#9333EA] to-[#D946EF] p-5 text-white shadow-lg">
                        <span className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/10" />
                        <span className="text-2xl">🎉</span>
                        <h2 className="mt-1 text-xl font-black leading-tight">Seu plano está pronto!</h2>
                        <p className="mt-1 text-sm text-white/85">Feito sob medida pros seus objetivos. Bora começar?</p>
                    </div>

                    <Bloco icon={Activity} titulo="Seus esportes ideais">
                        <div className="flex flex-col gap-3">
                            {esportes.map((e) => (
                                <div key={e.nome} className="flex flex-col gap-2 rounded-2xl border border-secondary bg-primary p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-2xl">{e.emoji}</span>
                                        <div className="flex flex-1 flex-col">
                                            <span className="text-sm font-bold text-primary">{e.nome}</span>
                                            <span className="text-xs text-tertiary">{e.motivo}</span>
                                        </div>
                                        <span className="shrink-0 rounded-full bg-[#7C3AED]/10 px-2.5 py-1 text-xs font-bold text-[#7C3AED]">{e.match}%</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                                        <div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#D946EF]" style={{ width: `${e.match}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Bloco>

                    <Bloco icon={CheckVerified01} titulo="Hábitos saudáveis">
                        <div className="flex flex-col rounded-2xl border border-secondary bg-primary px-4">
                            {HABITOS.map((h, i) => (
                                <div key={i} className={cx("flex items-center gap-3 py-3", i > 0 && "border-t border-secondary")}>
                                    <span className="text-xl leading-none">{h.emoji}</span>
                                    <span className="flex-1 text-sm text-secondary">{h.texto}</span>
                                </div>
                            ))}
                        </div>
                    </Bloco>

                    <Bloco icon={Heart} titulo="Alimentação sugerida">
                        <div className="flex flex-col gap-3">
                            {refeicoes.map((r) => (
                                <div key={r.refeicao} className="flex items-center gap-3 rounded-2xl border border-secondary bg-primary p-4">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-2xl">{r.emoji}</span>
                                    <div className="flex flex-1 flex-col">
                                        <span className="text-xs font-bold uppercase tracking-wide text-tertiary">{r.refeicao}</span>
                                        <span className="text-sm font-medium text-primary">{r.sugestao}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Bloco>

                    <div className="flex flex-col gap-2">
                        <HubButton onClick={() => navigate("/ticket-sports/hub/criar-rotina")}>Criar minha rotina</HubButton>
                        <HubButton variant="secondary" onClick={() => navigate("/ticket-sports/hub/grupos")}>
                            Ver grupos do meu esporte
                        </HubButton>
                        <button
                            type="button"
                            onClick={() => navigate("/ticket-sports/hub/home")}
                            className="mt-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-tertiary transition hover:text-primary"
                        >
                            <Home02 className="size-4" /> Voltar para o início
                        </button>
                    </div>
                </div>
            )}
        </TicketSportsLayout>
    );
}
