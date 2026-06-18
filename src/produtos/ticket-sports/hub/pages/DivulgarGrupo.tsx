import { useRef, useState } from "react";
import { ArrowLeft, Activity, Image01, MarkerPin01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { Bloco } from "../components/Bloco";
import { HubButton, HubInput, HubSelect, HubTextarea } from "../components/hub-ui";
import { ATIVIDADES } from "../data/onboarding";

export function DivulgarGrupo() {
    const navigate = useNavigate();
    const [logo, setLogo] = useState<string | null>(null);
    const logoRef = useRef<HTMLInputElement>(null);
    const [nome, setNome] = useState("");
    const [atividade, setAtividade] = useState<string | null>(null);
    const [descricao, setDescricao] = useState("");
    const [local, setLocal] = useState("");

    const onArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setLogo(reader.result as string);
        reader.readAsDataURL(file);
    };

    const podeDivulgar = nome.trim().length > 0 && atividade !== null && local.trim().length > 0;

    return (
        <TicketSportsLayout>
            <input ref={logoRef} type="file" accept="image/*" hidden onChange={onArquivo} />

            <div className="flex flex-1 flex-col px-6 pt-8">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex w-max items-center gap-1.5 text-sm font-semibold text-[#7C3AED]"
                >
                    <ArrowLeft className="size-4" />
                    Voltar
                </button>
                <h1 className="mt-2 text-display-xs font-bold text-primary">Divulgar grupo</h1>
                <p className="mt-1 text-md text-tertiary">Crie a página do seu grupo e atraia novos integrantes.</p>

                {/* Blocos */}
                <div className="mt-6 flex flex-1 flex-col gap-5">
                    <Bloco icon={Image01} titulo="Identidade do grupo">
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-secondary bg-primary p-4">
                            <button
                                type="button"
                                onClick={() => logoRef.current?.click()}
                                className="flex size-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#7C3AED]/40 bg-[#7C3AED]/5"
                            >
                                {logo ? (
                                    <img src={logo} alt="Logo do grupo" className="size-full object-cover" />
                                ) : (
                                    <Image01 className="size-9 text-[#7C3AED]/60" />
                                )}
                            </button>
                            <button type="button" onClick={() => logoRef.current?.click()} className="text-sm font-semibold text-[#7C3AED]">
                                Inserir logo do grupo
                            </button>
                        </div>
                        <HubInput label="Nome do grupo" placeholder="Ex: Corredores da Lagoa" value={nome} onChange={setNome} />
                    </Bloco>

                    <Bloco icon={Activity} titulo="Sobre o grupo">
                        <HubSelect
                            label="Tipo de atividade"
                            placeholder="Selecione a atividade"
                            value={atividade}
                            onChange={setAtividade}
                            options={ATIVIDADES}
                        />
                        <HubTextarea
                            label="Descrição do grupo"
                            placeholder="Conte como são os treinos, o nível, os horários…"
                            value={descricao}
                            onChange={setDescricao}
                            rows={4}
                        />
                    </Bloco>

                    <Bloco icon={MarkerPin01} titulo="Localização">
                        <HubInput label="Localização" placeholder="Ex: Parque da Cidade, São Paulo" value={local} onChange={setLocal} />
                    </Bloco>
                </div>
            </div>

            <div className="px-4 pb-8 pt-4">
                <HubButton onClick={() => navigate("/ticket-sports/hub/grupos")} isDisabled={!podeDivulgar}>
                    Divulgar grupo
                </HubButton>
            </div>
        </TicketSportsLayout>
    );
}
