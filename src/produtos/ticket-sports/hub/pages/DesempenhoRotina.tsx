import { useState } from "react";
import { Activity, ArrowLeft, BarChartSquare02, Calendar, ChevronLeft, ChevronRight, Stars01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { MetaSemana } from "../components/MetaSemana";
import { BARRAS, INSIGHTS, MES_ATUAL_INDEX, MESES, RESUMO } from "../data/desempenho";
import { ATIVIDADES } from "../data/onboarding";
import { MINHA_ROTINA } from "../data/rotina";

const PERIODOS = [
    { id: "semana", label: "Semana" },
    { id: "mes", label: "Mês" },
    { id: "ano", label: "Ano" },
] as const;

const StatCard = ({ emoji, valor, label, className }: { emoji: string; valor: string; label: string; className: string }) => (
    <div className={cx("flex flex-col justify-between gap-2 rounded-2xl p-4 text-white", className)}>
        <span className="text-2xl">{emoji}</span>
        <div className="flex flex-col">
            <span className="text-2xl font-black leading-none">{valor}</span>
            <span className="text-xs font-medium text-white/90">{label}</span>
        </div>
    </div>
);

export function DesempenhoRotina() {
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState<"semana" | "mes" | "ano">("semana");

    const ativ = ATIVIDADES.find((a) => a.id === MINHA_ROTINA.atividade);
    const barras = BARRAS[periodo];
    const maxBarra = Math.max(...barras.map((b) => b.valor), 1);

    const METRICA: Record<typeof periodo, string> = {
        semana: "Minutos treinados por dia",
        mes: "Treinos por semana",
        ano: "Treinos por mês",
    };
    const DIAS_LABEL = ["D", "S", "T", "Q", "Q", "S", "S"];

    // Calendário do mês: rotina (seg/qua/sex) x dias treinados, com navegação entre meses
    const [mesIdx, setMesIdx] = useState(MES_ATUAL_INDEX);
    const mes = MESES[mesIdx];
    const WEEKDAY: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };
    const diasRotina = new Set(MINHA_ROTINA.dias.map((d) => WEEKDAY[d]));
    const treinados = new Set(mes.treinados);
    const ehRotina = (dia: number) => diasRotina.has((mes.primeiroDiaSemana + dia - 1) % 7);
    const celulas: (number | null)[] = [
        ...Array.from({ length: mes.primeiroDiaSemana }, () => null),
        ...Array.from({ length: mes.diasNoMes }, (_, i) => i + 1),
    ];
    const planejadosNoMes = Array.from({ length: mes.diasNoMes }, (_, i) => i + 1).filter(ehRotina).length;

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
                <h1 className="text-xl font-bold text-primary">Meu desempenho</h1>
            </header>

            <div className="hub-rise flex flex-1 flex-col gap-5 px-5 py-5 pb-10">
                {/* Resumo */}
                <Bloco icon={Activity} titulo="Resumo">
                    {/* Rotina */}
                    <div className="flex items-center gap-3 rounded-2xl border border-secondary bg-primary p-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-[#7C3AED]/10 text-xl">{ativ?.emoji}</span>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-primary">{MINHA_ROTINA.nome}</span>
                            <span className="text-xs text-tertiary">{ativ?.label}</span>
                        </div>
                    </div>

                    {/* Meta da semana — anel */}
                    <MetaSemana />

                    {/* Métricas */}
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard emoji="🔥" valor={`${RESUMO.sequenciaAtual} dias`} label="Sequência atual" className="bg-gradient-to-br from-[#F97316] to-[#EF4444]" />
                        <StatCard emoji="🏆" valor={`${RESUMO.melhorSequencia} dias`} label="Melhor sequência" className="bg-gradient-to-br from-[#F59E0B] to-[#F97316]" />
                        <StatCard emoji="✅" valor={`${RESUMO.taxaConclusao}%`} label="Conclusão" className="bg-gradient-to-br from-[#22C55E] to-[#16A34A]" />
                        <StatCard emoji="📅" valor={`${RESUMO.treinosMes}`} label="Treinos no mês" className="bg-gradient-to-br from-[#3B82F6] to-[#6366F1]" />
                    </div>
                </Bloco>

                {/* Atividade */}
                <Bloco icon={BarChartSquare02} titulo="Atividade">
                    <div className="flex flex-col gap-4 rounded-2xl border border-secondary bg-primary p-4">
                        <div className="flex items-start justify-between gap-3">
                            <span className="text-xs text-tertiary">{METRICA[periodo]}</span>
                            <div className="flex gap-1 rounded-lg bg-secondary p-0.5">
                                {PERIODOS.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setPeriodo(p.id)}
                                        className={cx(
                                            "rounded-md px-2.5 py-1 text-xs font-semibold transition duration-100",
                                            periodo === p.id ? "bg-primary text-[#7C3AED] shadow-sm" : "text-tertiary",
                                        )}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex h-40 items-stretch gap-2">
                            {barras.map((b, i) => (
                                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                                    <span className={cx("text-[11px] font-semibold", b.valor > 0 ? "text-secondary" : "text-quaternary")}>
                                        {b.valor > 0 ? b.valor : "–"}
                                    </span>
                                    <div className="flex w-full flex-1 items-end">
                                        {b.valor > 0 ? (
                                            <div
                                                className="w-full rounded-lg bg-[#7C3AED]"
                                                style={{ height: `${Math.max((b.valor / maxBarra) * 100, 8)}%` }}
                                            />
                                        ) : (
                                            <div className="h-1 w-full rounded-full bg-secondary" />
                                        )}
                                    </div>
                                    <span className="text-[10px] text-tertiary">{b.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Bloco>

                {/* Frequência — calendário do mês */}
                <Bloco icon={Calendar} titulo="Frequência">
                    <div className="flex flex-col gap-3 rounded-2xl border border-secondary bg-primary p-4">
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setMesIdx((i) => Math.max(0, i - 1))}
                                disabled={mesIdx === 0}
                                aria-label="Mês anterior"
                                className="flex size-8 items-center justify-center rounded-full text-fg-secondary transition hover:bg-secondary disabled:opacity-30"
                            >
                                <ChevronLeft className="size-5" />
                            </button>
                            <span className="text-sm font-semibold text-primary">{mes.nome}</span>
                            <button
                                type="button"
                                onClick={() => setMesIdx((i) => Math.min(MES_ATUAL_INDEX, i + 1))}
                                disabled={mesIdx === MES_ATUAL_INDEX}
                                aria-label="Próximo mês"
                                className="flex size-8 items-center justify-center rounded-full text-fg-secondary transition hover:bg-secondary disabled:opacity-30"
                            >
                                <ChevronRight className="size-5" />
                            </button>
                        </div>
                        {/* cabeçalho dias da semana */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {DIAS_LABEL.map((d, i) => (
                                <span key={i} className="text-center text-[10px] font-medium text-tertiary">{d}</span>
                            ))}
                        </div>
                        {/* dias do mês */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {celulas.map((dia, i) => {
                                if (dia === null) return <span key={i} />;
                                const rotina = ehRotina(dia);
                                const treinou = treinados.has(dia);
                                const hoje = dia === mes.hoje;
                                return (
                                    <span
                                        key={i}
                                        className={cx(
                                            "flex aspect-square items-center justify-center rounded-lg text-xs font-semibold",
                                            treinou
                                                ? "bg-[#7C3AED] text-white"
                                                : rotina
                                                  ? "bg-[#7C3AED]/10 text-[#7C3AED]"
                                                  : "text-tertiary",
                                            hoje && !treinou && "ring-2 ring-inset ring-[#7C3AED]",
                                        )}
                                    >
                                        {dia}
                                    </span>
                                );
                            })}
                        </div>
                        {/* legenda */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-secondary pt-3">
                            <span className="flex items-center gap-1.5 text-xs text-tertiary">
                                <span className="size-3.5 rounded bg-[#7C3AED]" /> Treinou
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-tertiary">
                                <span className="size-3.5 rounded bg-[#7C3AED]/10 ring-1 ring-inset ring-[#7C3AED]/30" /> Treino na rotina
                            </span>
                            <span className="ml-auto text-xs text-tertiary">
                                <span className="font-bold text-primary">{treinados.size}</span> de {planejadosNoMes} planejados
                            </span>
                        </div>
                    </div>
                </Bloco>

                {/* Insights */}
                <Bloco icon={Stars01} titulo="Insights">
                    <div className="flex flex-col gap-3">
                        {INSIGHTS.map((ins, i) => (
                            <div key={i} className="flex items-start gap-3 rounded-2xl bg-[#7C3AED]/5 p-4 ring-1 ring-[#7C3AED]/15">
                                <span className="text-xl leading-none">{ins.emoji}</span>
                                <p className="text-sm font-medium text-secondary">{ins.texto}</p>
                            </div>
                        ))}
                    </div>
                </Bloco>
            </div>
        </TicketSportsLayout>
    );
}
