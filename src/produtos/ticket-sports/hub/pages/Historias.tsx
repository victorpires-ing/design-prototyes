import { useMemo, useState } from "react";
import { ArrowLeft, Plus } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HistoriaCard } from "../components/HistoriaCard";
import { HubButton } from "../components/hub-ui";
import { HISTORIAS } from "../data/home";

export function Historias() {
    const navigate = useNavigate();
    const [filtro, setFiltro] = useState("Todas");

    const filtros = useMemo(() => ["Todas", ...Array.from(new Set(HISTORIAS.map((h) => h.atividade)))], []);
    const historias = filtro === "Todas" ? HISTORIAS : HISTORIAS.filter((h) => h.atividade === filtro);

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
                <h1 className="mt-2 text-display-xs font-bold text-primary">Histórias inspiradoras</h1>
                <p className="mt-1 text-md text-tertiary">Conquistas que inspiram a comunidade.</p>

                <div className="mt-5">
                    <HubButton iconLeading={Plus} onClick={() => navigate("/ticket-sports/hub/historias/nova")}>
                        Enviar história
                    </HubButton>
                </div>

                {/* Filtro por tipo de atividade */}
                <div className="-mx-6 mt-5 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {filtros.map((f) => {
                        const sel = filtro === f;
                        return (
                            <button
                                key={f}
                                type="button"
                                onClick={() => setFiltro(f)}
                                className={cx(
                                    "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition duration-100",
                                    sel ? "border-[#7C3AED] bg-[#7C3AED] text-white" : "border-secondary text-secondary",
                                )}
                            >
                                {f}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-5 flex flex-col gap-3">
                    {historias.map((h) => (
                        <HistoriaCard key={h.id} historia={h} />
                    ))}
                    {historias.length === 0 && (
                        <p className="py-8 text-center text-sm text-tertiary">Nenhuma história para essa atividade ainda.</p>
                    )}
                </div>
            </div>
        </TicketSportsLayout>
    );
}
