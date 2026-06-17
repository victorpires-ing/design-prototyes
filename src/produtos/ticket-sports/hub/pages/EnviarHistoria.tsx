import { useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubButton, HubSelect, HubTextarea } from "../components/hub-ui";
import { ATIVIDADES } from "../data/onboarding";

export function EnviarHistoria() {
    const navigate = useNavigate();
    const [atividade, setAtividade] = useState<string | null>(null);
    const [texto, setTexto] = useState("");

    const podePublicar = atividade !== null && texto.trim().length > 0;

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
                <h1 className="mt-2 text-display-xs font-bold text-primary">Enviar história</h1>
                <p className="mt-1 text-md text-tertiary">Compartilhe sua conquista e inspire outras pessoas.</p>

                <div className="mt-6 flex flex-1 flex-col gap-5">
                    <HubSelect
                        label="Atividade"
                        placeholder="Selecione a atividade"
                        value={atividade}
                        onChange={setAtividade}
                        options={ATIVIDADES}
                    />
                    <HubTextarea
                        label="Sua história"
                        placeholder="Ex: Há três meses eu não conseguia correr 1 km. Hoje completei meus primeiros 5 km."
                        value={texto}
                        onChange={setTexto}
                        rows={6}
                    />
                </div>
            </div>

            <div className="px-4 pb-8 pt-4">
                <HubButton onClick={() => navigate("/ticket-sports/hub/historias")} isDisabled={!podePublicar}>
                    Publicar história
                </HubButton>
            </div>
        </TicketSportsLayout>
    );
}
