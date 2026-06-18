import { useState } from "react";
import { ArrowLeft, ArrowRight, User01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { HubButton } from "../components/hub-ui";
import { TIPOS_PERFIL } from "../data/onboarding";

export function TipoPerfil() {
    const navigate = useNavigate();
    const [tipo, setTipo] = useState("fisica");

    return (
        <TicketSportsLayout>
            <div className="flex flex-1 flex-col px-6 pt-8">
                <button
                    type="button"
                    onClick={() => navigate("/ticket-sports/hub")}
                    className="flex w-max items-center gap-1.5 text-sm font-semibold text-[#7C3AED]"
                >
                    <ArrowLeft className="size-4" />
                    Voltar
                </button>
                <h1 className="mt-2 text-display-xs font-bold text-primary">Que tipo de perfil você quer criar?</h1>
                <p className="mt-1 text-md text-tertiary">Isso vai personalizar sua experiência.</p>

                <div className="mt-6">
                    <Bloco icon={User01} titulo="Tipo de perfil">
                        {TIPOS_PERFIL.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTipo(t.id)}
                                className={cx(
                                    "flex items-start gap-3 rounded-2xl border bg-primary p-4 text-left transition duration-100",
                                    tipo === t.id ? "border-[#7C3AED] ring-1 ring-[#7C3AED]" : "border-secondary",
                                )}
                            >
                                <span className="text-2xl leading-none">{t.emoji}</span>
                                <span className="flex flex-col gap-0.5">
                                    <span className="text-sm font-bold text-primary">{t.label}</span>
                                    <span className="text-sm text-tertiary">{t.descricao}</span>
                                </span>
                            </button>
                        ))}
                    </Bloco>
                </div>
            </div>

            <div className="px-4 pb-8 pt-4">
                <HubButton iconTrailing={ArrowRight} onClick={() => navigate(`/ticket-sports/hub/cadastro?tipo=${tipo}`)}>
                    Continuar
                </HubButton>
            </div>
        </TicketSportsLayout>
    );
}
