import { useRef, useState } from "react";
import { ArrowLeft, Image01, XClose } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubButton, HubInput, HubSelect, HubTextarea } from "../components/hub-ui";
import { ATIVIDADES } from "../data/onboarding";

export function NovaPublicacao() {
    const navigate = useNavigate();
    const [tipo, setTipo] = useState<"publicacao" | "informativo">("publicacao");

    // publicação
    const [atividade, setAtividade] = useState<string | null>(null);
    const [texto, setTexto] = useState("");
    const [imagens, setImagens] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);

    // informativo
    const [titulo, setTitulo] = useState("");
    const [textoInfo, setTextoInfo] = useState("");

    const onArquivos = (e: React.ChangeEvent<HTMLInputElement>) => {
        Array.from(e.target.files ?? []).forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => setImagens((prev) => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    const podePublicar =
        tipo === "publicacao" ? texto.trim().length > 0 || imagens.length > 0 : titulo.trim().length > 0 && textoInfo.trim().length > 0;

    return (
        <TicketSportsLayout>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onArquivos} />

            <div className="flex flex-1 flex-col px-6 pt-8">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex w-max items-center gap-1.5 text-sm font-semibold text-[#7C3AED]"
                >
                    <ArrowLeft className="size-4" />
                    Voltar
                </button>
                <h1 className="mt-2 text-display-xs font-bold text-primary">Nova publicação</h1>
                <p className="mt-1 text-md text-tertiary">Compartilhe com a sua comunidade.</p>

                {/* Seletor de tipo */}
                <div className="mt-6 flex gap-1 rounded-xl bg-secondary p-1">
                    {(["publicacao", "informativo"] as const).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTipo(t)}
                            className={cx(
                                "flex-1 rounded-lg py-2 text-sm font-semibold transition duration-100",
                                tipo === t ? "bg-primary text-[#7C3AED] shadow-sm" : "text-tertiary",
                            )}
                        >
                            {t === "publicacao" ? "Publicação" : "Informativo"}
                        </button>
                    ))}
                </div>

                {/* Campos */}
                <div className="mt-6 flex flex-1 flex-col gap-5">
                    {tipo === "publicacao" ? (
                        <>
                            <HubSelect
                                label="Atividade"
                                placeholder="Selecione a atividade"
                                value={atividade}
                                onChange={setAtividade}
                                options={ATIVIDADES}
                            />
                            <HubTextarea
                                label="Publicação"
                                placeholder="O que você quer compartilhar com a comunidade?"
                                value={texto}
                                onChange={setTexto}
                                rows={5}
                            />
                            {imagens.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {imagens.map((src, i) => (
                                        <div key={i} className="relative size-20 overflow-hidden rounded-xl">
                                            <img src={src} alt="" className="size-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setImagens((prev) => prev.filter((_, idx) => idx !== i))}
                                                aria-label="Remover imagem"
                                                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
                                            >
                                                <XClose className="size-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="flex w-max items-center gap-1.5 text-sm font-semibold text-[#7C3AED]"
                            >
                                <Image01 className="size-5" /> Adicionar imagem
                            </button>
                        </>
                    ) : (
                        <>
                            <HubInput label="Título" placeholder="Ex: Inscrições abertas para a corrida" value={titulo} onChange={setTitulo} />
                            <HubTextarea
                                label="Mensagem"
                                placeholder="Escreva o comunicado para os inscritos…"
                                value={textoInfo}
                                onChange={setTextoInfo}
                                rows={5}
                            />
                        </>
                    )}
                </div>
            </div>

            <div className="px-4 pb-8 pt-4">
                <HubButton onClick={() => navigate("/ticket-sports/hub/empresa")} isDisabled={!podePublicar}>
                    Publicar
                </HubButton>
            </div>
        </TicketSportsLayout>
    );
}
