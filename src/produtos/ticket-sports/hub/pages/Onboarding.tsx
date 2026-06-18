import { useState } from "react";
import { Activity, ArrowLeft, ArrowRight, CheckCircle, MarkerPin01, Target04 } from "@untitledui/icons";
import { useNavigate, useSearchParams } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { HubButton, HubInput, Stepper } from "../components/hub-ui";
import { ATIVIDADES, ATIVIDADES_MAX, OBJETIVOS, OBJETIVOS_EMPRESA, OBJETIVOS_MAX } from "../data/onboarding";

const StepHeader = ({
    onVoltar,
    title,
    subtitle,
    counter,
}: {
    onVoltar: () => void;
    title: string;
    subtitle: string;
    counter?: string;
}) => (
    <div className="flex flex-col gap-2">
        <button type="button" onClick={onVoltar} className="flex w-max items-center gap-1.5 text-sm font-semibold text-[#7C3AED]">
            <ArrowLeft className="size-4" />
            Voltar
        </button>
        <h1 className="text-display-xs font-bold text-primary">{title}</h1>
        <div className="flex items-center justify-between gap-3">
            <p className="text-md text-tertiary">{subtitle}</p>
            {counter && <span className="shrink-0 text-sm font-medium text-tertiary">{counter}</span>}
        </div>
    </div>
);

export function Onboarding() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isEmpresa = searchParams.get("tipo") === "juridica";
    const [step, setStep] = useState(Math.min(3, Math.max(1, Number(searchParams.get("step")) || 1)));
    const [atividades, setAtividades] = useState<Set<string>>(new Set());
    const [objetivos, setObjetivos] = useState<Set<string>>(new Set());
    const [cidade, setCidade] = useState("");

    const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, id: string, max: number) => {
        const next = new Set(set);
        if (next.has(id)) next.delete(id);
        else if (next.size < max) next.add(id);
        setFn(next);
    };

    const avancar = () =>
        step < 3 ? setStep(step + 1) : navigate(`/ticket-sports/hub/sucesso${isEmpresa ? "?tipo=juridica" : ""}`);
    const voltar = () => (step === 1 ? navigate(-1) : setStep((s) => s - 1));

    const continuarDisabled = step === 2 && objetivos.size === 0;

    return (
        <TicketSportsLayout>
            <div className="flex flex-1 flex-col px-6 pt-8">
                <Stepper current={step} total={3} />

                <div className="mt-6 flex flex-1 flex-col gap-5">
                    {step === 1 && (
                        <>
                            <StepHeader
                                onVoltar={voltar}
                                title={isEmpresa ? "Em quais atividades sua empresa atua?" : "Quais suas atividades favoritas?"}
                                subtitle="Escolha até 3 opções."
                                counter={`${atividades.size}/${ATIVIDADES_MAX}`}
                            />
                            <Bloco icon={Activity} titulo={isEmpresa ? "Atividades de atuação" : "Atividades favoritas"}>
                                <div className="grid grid-cols-3 gap-3">
                                {ATIVIDADES.map((a) => {
                                    const sel = atividades.has(a.id);
                                    const atMax = atividades.size >= ATIVIDADES_MAX;
                                    return (
                                        <button
                                            key={a.id}
                                            type="button"
                                            onClick={() => toggle(atividades, setAtividades, a.id, ATIVIDADES_MAX)}
                                            className={cx(
                                                "relative flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border p-2 transition duration-100",
                                                sel ? "border-[#7C3AED] bg-[#7C3AED]/5 ring-1 ring-[#7C3AED]" : "border-secondary",
                                                !sel && atMax && "opacity-40",
                                            )}
                                        >
                                            {sel && <CheckCircle className="absolute right-1.5 top-1.5 size-5 text-[#7C3AED]" />}
                                            <span className="text-3xl leading-none">{a.emoji}</span>
                                            <span className="text-center text-sm font-medium text-secondary">{a.label}</span>
                                        </button>
                                    );
                                })}
                                </div>
                            </Bloco>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <StepHeader
                                onVoltar={voltar}
                                title={isEmpresa ? "Quais os objetivos da sua empresa?" : "Quais seus principais objetivos?"}
                                subtitle="Escolha até 2 opções."
                                counter={`${objetivos.size}/${OBJETIVOS_MAX}`}
                            />
                            <Bloco icon={Target04} titulo="Objetivos">
                                <div className="flex flex-col gap-3">
                                {(isEmpresa ? OBJETIVOS_EMPRESA : OBJETIVOS).map((o) => {
                                    const sel = objetivos.has(o.id);
                                    const atMax = objetivos.size >= OBJETIVOS_MAX;
                                    return (
                                        <button
                                            key={o.id}
                                            type="button"
                                            onClick={() => toggle(objetivos, setObjetivos, o.id, OBJETIVOS_MAX)}
                                            className={cx(
                                                "flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition duration-100",
                                                sel ? "border-[#7C3AED] bg-[#7C3AED]/5" : "border-secondary",
                                                !sel && atMax && "opacity-40",
                                            )}
                                        >
                                            <span className="flex items-center gap-3">
                                                <span className="text-xl leading-none">{o.emoji}</span>
                                                <span className="text-sm font-semibold text-primary">{o.label}</span>
                                            </span>
                                            {sel && <CheckCircle className="size-5 shrink-0 text-[#7C3AED]" />}
                                        </button>
                                    );
                                })}
                                </div>
                            </Bloco>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <StepHeader
                                onVoltar={voltar}
                                title="Em qual cidade você está?"
                                subtitle={isEmpresa ? "Para pessoas encontrarem o seu negócio." : "Para conectar com pessoas e eventos próximos."}
                            />
                            <Bloco icon={MarkerPin01} titulo="Localização">
                                <HubInput label="" placeholder="Ex: São Paulo, Campo Grande …" value={cidade} onChange={setCidade} />
                                <p className="text-center text-sm text-tertiary">Pode preencher depois</p>
                            </Bloco>
                        </>
                    )}
                </div>
            </div>

            <div className="px-4 pb-8 pt-4">
                <HubButton onClick={avancar} isDisabled={continuarDisabled} iconTrailing={ArrowRight}>
                    {step === 3 ? "Começar minha jornada!" : "Continuar"}
                </HubButton>
            </div>
        </TicketSportsLayout>
    );
}
