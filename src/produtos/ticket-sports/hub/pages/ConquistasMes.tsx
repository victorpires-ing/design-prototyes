import { useState } from "react";
import { ArrowLeft, Trophy01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { Confetti } from "../components/Confetti";
import { CONCLUIRAM_MES } from "../data/home";

export function ConquistasMes() {
    const navigate = useNavigate();
    const [festa, setFesta] = useState(false);
    const [celebrados, setCelebrados] = useState<Set<string>>(new Set());

    const celebrar = (id: string) => {
        setCelebrados((s) => new Set(s).add(id));
        setFesta(false);
        requestAnimationFrame(() => setFesta(true));
        window.setTimeout(() => setFesta(false), 2400);
    };

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
                <h1 className="mt-2 text-display-xs font-bold text-primary">Conquistas do mês</h1>
                <p className="mt-1 text-md text-tertiary">
                    {CONCLUIRAM_MES.length} pessoas concluíram 100% da rotina em junho 🏆
                </p>

                <div className="mt-6">
                    <Bloco icon={Trophy01} titulo="Conquistas do mês">
                    {CONCLUIRAM_MES.map((p) => {
                        const jaCelebrou = celebrados.has(p.id);
                        return (
                            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-secondary bg-primary p-3">
                                <span className="relative shrink-0">
                                    <img src={p.foto} alt="" className="size-12 rounded-full object-cover ring-2 ring-[#F59E0B]" />
                                    <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[#F59E0B] text-[10px] ring-2 ring-primary">
                                        🏆
                                    </span>
                                </span>
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-bold text-primary">{p.nome}</span>
                                    <span className="truncate text-xs text-tertiary">100% da rotina · {p.atividade}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => !jaCelebrou && celebrar(p.id)}
                                    disabled={jaCelebrou}
                                    className={cx(
                                        "flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-xs font-bold transition",
                                        jaCelebrou
                                            ? "bg-[#7C3AED]/5 text-[#7C3AED]"
                                            : "bg-gradient-to-r from-[#7C3AED] to-[#D946EF] text-white hover:opacity-90",
                                    )}
                                >
                                    {jaCelebrou ? "Celebrado 🎉" : "Celebrar 🎉"}
                                </button>
                            </div>
                        );
                    })}
                    </Bloco>
                </div>
            </div>
            {festa && <Confetti />}
        </TicketSportsLayout>
    );
}
