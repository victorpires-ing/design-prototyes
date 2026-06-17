import { useRef, useState } from "react";
import { ArrowLeft, Building07, Image01 } from "@untitledui/icons";
import { useNavigate, useSearchParams } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubButton, HubInput, HubSelect, HubTextarea } from "../components/hub-ui";
import { COMUNIDADES } from "../data/comunidade";
import { ATIVIDADES } from "../data/onboarding";

export function ConfigurarComunidade() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editando = searchParams.get("editar") === "1";
    const c = COMUNIDADES[0];

    const [banner, setBanner] = useState<string | null>(editando ? c.banner : null);
    const [logo, setLogo] = useState<string | null>(editando ? c.logo : null);
    const bannerRef = useRef<HTMLInputElement>(null);
    const logoRef = useRef<HTMLInputElement>(null);
    const [nome, setNome] = useState(editando ? c.nome : "");
    const [descricao, setDescricao] = useState(editando ? c.descricao : "");
    const [atividade, setAtividade] = useState<string | null>(
        editando ? (ATIVIDADES.find((a) => a.label === c.atividade)?.id ?? null) : null,
    );

    const lerArquivo = (e: React.ChangeEvent<HTMLInputElement>, set: (v: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => set(reader.result as string);
        reader.readAsDataURL(file);
    };

    const podeCriar = nome.trim().length > 0 && atividade !== null;

    return (
        <TicketSportsLayout>
            <input ref={bannerRef} type="file" accept="image/*" hidden onChange={(e) => lerArquivo(e, setBanner)} />
            <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => lerArquivo(e, setLogo)} />

            <div className="flex flex-1 flex-col px-6 pt-8">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex w-max items-center gap-1.5 text-sm font-semibold text-[#7C3AED]"
                >
                    <ArrowLeft className="size-4" />
                    Voltar
                </button>
                <h1 className="mt-2 text-display-xs font-bold text-primary">Configurar comunidade</h1>
                <p className="mt-1 text-md text-tertiary">
                    {editando ? "Atualize as informações da sua comunidade." : "Crie a comunidade oficial da sua empresa."}
                </p>

                {/* Banner + logo */}
                <div className="relative mt-6 mb-8">
                    <button
                        type="button"
                        onClick={() => bannerRef.current?.click()}
                        className="flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#7C3AED]/40 bg-[#7C3AED]/5"
                    >
                        {banner ? (
                            <img src={banner} alt="Banner da comunidade" className="size-full object-cover" />
                        ) : (
                            <span className="flex items-center gap-2 text-sm font-semibold text-[#7C3AED]">
                                <Image01 className="size-5" /> Inserir banner
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => logoRef.current?.click()}
                        className="absolute -bottom-6 left-4 flex size-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#7C3AED]/40 bg-primary ring-4 ring-primary"
                    >
                        {logo ? (
                            <img src={logo} alt="Logo da comunidade" className="size-full object-cover" />
                        ) : (
                            <Building07 className="size-7 text-[#7C3AED]/60" />
                        )}
                    </button>
                </div>

                {/* Campos */}
                <div className="flex flex-1 flex-col gap-5">
                    <HubInput label="Nome da comunidade" placeholder="Ex: Ticket Sports Run Club" value={nome} onChange={setNome} />
                    <HubSelect label="Atividade principal" placeholder="Selecione a atividade" value={atividade} onChange={setAtividade} options={ATIVIDADES} />
                    <HubTextarea
                        label="Descrição"
                        placeholder="Conte o propósito da comunidade, treinos, eventos…"
                        value={descricao}
                        onChange={setDescricao}
                        rows={4}
                    />
                </div>
            </div>

            <div className="px-4 pb-8 pt-4">
                <HubButton onClick={() => navigate("/ticket-sports/hub/empresa")} isDisabled={!podeCriar}>
                    {editando ? "Salvar comunidade" : "Criar comunidade"}
                </HubButton>
            </div>
        </TicketSportsLayout>
    );
}
