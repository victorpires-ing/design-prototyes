import { useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { useNavigate, useSearchParams } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubButton, HubInput, HubSelect, HubToggle } from "../components/hub-ui";
import { ATIVIDADES } from "../data/onboarding";
import { DIAS, MINHA_ROTINA } from "../data/rotina";

const timeInputClass =
    "rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-md text-primary outline-none transition duration-100 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/30";

export function CriarRotina() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editando = searchParams.get("editar") === "1";
    const base = editando ? MINHA_ROTINA : null;

    const [nome, setNome] = useState(base?.nome ?? "");
    const [atividade, setAtividade] = useState<string | null>(base?.atividade ?? null);
    const [dias, setDias] = useState<Set<string>>(new Set(base?.dias ?? []));
    const [mesmoHorario, setMesmoHorario] = useState(base?.mesmoHorario ?? true);
    const [horaGeral, setHoraGeral] = useState(base?.horaGeral ?? "");
    const [horaPorDia, setHoraPorDia] = useState<Record<string, string>>(base?.horaPorDia ?? {});
    const [divulgar, setDivulgar] = useState(base?.divulgar ?? false);

    const toggleDia = (id: string) => {
        const next = new Set(dias);
        next.has(id) ? next.delete(id) : next.add(id);
        setDias(next);
    };

    const diasSelecionados = DIAS.filter((d) => dias.has(d.id));
    const podeSalvar = nome.trim().length > 0 && atividade !== null && dias.size > 0;

    return (
        <TicketSportsLayout>
            <div className="flex flex-1 flex-col px-6 pt-8">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex w-max items-center gap-1.5 text-sm font-semibold text-[#7C3AED]"
                >
                    <ArrowLeft className="size-4" />
                    Voltar
                </button>
                <h1 className="mt-2 text-display-xs font-bold text-primary">{editando ? "Editar rotina" : "Criar rotina"}</h1>
                <p className="mt-1 text-md text-tertiary">Monte seu treino do jeitinho que você gosta.</p>

                <div className="mt-6 flex flex-1 flex-col gap-6">
                    {/* Nome */}
                    <HubInput label="Nome da rotina" placeholder="Ex: Treino de força" value={nome} onChange={setNome} />

                    {/* Atividade — seleção única (dropdown) */}
                    <HubSelect
                        label="Atividade"
                        placeholder="Selecione a atividade"
                        value={atividade}
                        onChange={setAtividade}
                        options={ATIVIDADES}
                    />

                    {/* Dias de treino */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-primary">Dias de treino</span>
                        <div className="flex justify-between gap-2">
                            {DIAS.map((dia, i) => {
                                const sel = dias.has(dia.id);
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => toggleDia(dia.id)}
                                        aria-label={dia.nome}
                                        className={cx(
                                            "flex size-10 items-center justify-center rounded-full border text-sm font-semibold transition duration-100",
                                            sel ? "border-[#7C3AED] bg-[#7C3AED] text-white" : "border-secondary text-secondary",
                                        )}
                                    >
                                        {dia.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hora do treino */}
                    <div className="flex flex-col gap-3">
                        <span className="text-sm font-semibold text-primary">Hora do treino</span>

                        {mesmoHorario ? (
                            <input
                                type="time"
                                value={horaGeral}
                                onChange={(e) => setHoraGeral(e.target.value)}
                                className={cx(timeInputClass, "w-full")}
                            />
                        ) : diasSelecionados.length === 0 ? (
                            <p className="text-sm text-tertiary">Selecione os dias de treino acima para definir os horários.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {diasSelecionados.map((d) => (
                                    <div key={d.id} className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-secondary">{d.nome}</span>
                                        <input
                                            type="time"
                                            value={horaPorDia[d.id] ?? ""}
                                            onChange={(e) => setHoraPorDia((prev) => ({ ...prev, [d.id]: e.target.value }))}
                                            className={cx(timeInputClass, "w-36")}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <HubToggle checked={mesmoHorario} onChange={setMesmoHorario} label="Mesmo horário para todos os dias" />
                    </div>

                    {/* Visibilidade */}
                    <div className="rounded-xl border border-secondary p-4">
                        <HubToggle checked={divulgar} onChange={setDivulgar} label="Deixar rotina visível para todos" />
                    </div>
                </div>
            </div>

            <div className="px-4 pb-8 pt-4">
                <HubButton
                    onClick={() => navigate(editando ? "/ticket-sports/hub/perfil" : "/ticket-sports/hub/sucesso")}
                    isDisabled={!podeSalvar}
                >
                    {editando ? "Salvar rotina" : "Criar rotina"}
                </HubButton>
            </div>
        </TicketSportsLayout>
    );
}
