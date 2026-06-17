import { useRef, useState } from "react";
import { Building07, Camera01, FaceSmile, UploadCloud02 } from "@untitledui/icons";
import { useNavigate, useSearchParams } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubButton } from "../components/hub-ui";

export function FotoRosto() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tipo = searchParams.get("tipo") === "juridica" ? "juridica" : "fisica";
    const isEmpresa = tipo === "juridica";

    const [imagem, setImagem] = useState<string | null>(null);
    const cameraRef = useRef<HTMLInputElement>(null);
    const galeriaRef = useRef<HTMLInputElement>(null);

    const onArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setImagem(reader.result as string);
        reader.readAsDataURL(file);
    };

    const avancar = () => navigate(`/ticket-sports/hub/onboarding?tipo=${tipo}`);

    return (
        <TicketSportsLayout>
            <input ref={cameraRef} type="file" accept="image/*" capture="user" hidden onChange={onArquivo} />
            <input ref={galeriaRef} type="file" accept="image/*" hidden onChange={onArquivo} />

            <div className="flex flex-1 flex-col px-6 pt-8">
                <h1 className="text-display-xs font-bold text-primary">
                    {isEmpresa ? "Adicione o logo da empresa" : "Adicione uma foto de rosto"}
                </h1>
                <p className="mt-1 text-md text-tertiary">
                    {isEmpresa
                        ? "Isso ajuda os participantes a reconhecerem sua empresa. Você pode fazer isso depois."
                        : "Isso ajuda a personalizar seu perfil e a te reconhecer nos eventos. Você pode fazer isso depois."}
                </p>

                <div className="mt-10 flex flex-1 flex-col items-center">
                    {/* preview / placeholder */}
                    <div
                        className={cx(
                            "flex size-44 items-center justify-center overflow-hidden border-2 border-dashed border-[#7C3AED]/40 bg-[#7C3AED]/5",
                            isEmpresa ? "rounded-3xl" : "rounded-full",
                        )}
                    >
                        {imagem ? (
                            <img src={imagem} alt={isEmpresa ? "Logo da empresa" : "Sua foto de rosto"} className="size-full object-cover" />
                        ) : isEmpresa ? (
                            <Building07 className="size-16 text-[#7C3AED]/60" />
                        ) : (
                            <FaceSmile className="size-16 text-[#7C3AED]/60" />
                        )}
                    </div>

                    {/* ações */}
                    <div className="mt-8 flex w-full flex-col gap-3">
                        {!isEmpresa && (
                            <HubButton variant="secondary" iconLeading={Camera01} onClick={() => cameraRef.current?.click()}>
                                Tirar uma foto
                            </HubButton>
                        )}
                        <HubButton variant="secondary" iconLeading={UploadCloud02} onClick={() => galeriaRef.current?.click()}>
                            {isEmpresa ? "Inserir logo" : "Anexar uma foto"}
                        </HubButton>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center gap-4 px-4 pb-8 pt-4">
                <HubButton onClick={avancar}>Continuar</HubButton>
                <button type="button" onClick={avancar} className="text-sm font-semibold text-tertiary">
                    Pular por enquanto
                </button>
            </div>
        </TicketSportsLayout>
    );
}
