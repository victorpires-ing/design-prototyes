import { useState } from "react";
import { Eye, UploadCloud02, XClose } from "@untitledui/icons";
import { toast } from "sonner";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";

interface PerguntaPreview {
    key: string;
    titulo: string;
    descricao: string;
    tipo: "selecao" | "multipla" | "texto" | "anexo";
    opcoes?: string[];
    obrigatorio: boolean;
}

interface PreviewFormularioModalProps {
    isOpen: boolean;
    onClose: () => void;
    nome: string;
    descricao: string;
    perguntas: PerguntaPreview[];
}

export function PreviewFormularioModal({ isOpen, onClose, nome, descricao, perguntas }: PreviewFormularioModalProps) {
    const [respostas, setRespostas] = useState<Record<string, string | string[]>>({});

    const handleClose = () => {
        setRespostas({});
        onClose();
    };

    const setResposta = (key: string, value: string | string[]) => setRespostas((prev) => ({ ...prev, [key]: value }));

    const toggleMultipla = (key: string, opcao: string) =>
        setRespostas((prev) => {
            const atual = (prev[key] as string[] | undefined) ?? [];
            const next = atual.includes(opcao) ? atual.filter((o) => o !== opcao) : [...atual, opcao];
            return { ...prev, [key]: next };
        });

    const handleSubmit = () => {
        toast.success("Respostas enviadas (pré-visualização).");
        handleClose();
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && handleClose()} isDismissable>
            <Modal className="max-w-xl">
                <Dialog>
                    <div className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary_alt">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-secondary px-5 py-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-tertiary">
                                <Eye className="size-4" />
                                Pré-visualização do formulário
                            </div>
                            <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={handleClose} tooltip="Fechar" />
                        </div>

                        {/* Conteúdo (visão do comprador) */}
                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">{nome.trim() || "Formulário sem título"}</h2>
                                {descricao.trim() && <p className="text-sm text-tertiary">{descricao}</p>}
                            </div>

                            {perguntas.length === 0 ? (
                                <p className="mt-8 text-center text-sm text-tertiary">Adicione perguntas para visualizar o formulário.</p>
                            ) : (
                                <div className="mt-6 flex flex-col gap-6">
                                    {perguntas.map((pergunta) => (
                                        <div key={pergunta.key} className="flex flex-col gap-3">
                                            <div className="flex flex-col gap-0.5">
                                                <label className="text-sm font-semibold text-primary">
                                                    {pergunta.titulo}
                                                    {pergunta.obrigatorio && <span className="text-error-primary"> *</span>}
                                                </label>
                                                {pergunta.descricao && <p className="text-sm text-tertiary">{pergunta.descricao}</p>}
                                            </div>

                                            {pergunta.tipo === "texto" && (
                                                <Input
                                                    aria-label={pergunta.titulo}
                                                    placeholder="Sua resposta"
                                                    value={(respostas[pergunta.key] as string) ?? ""}
                                                    onChange={(v) => setResposta(pergunta.key, v)}
                                                />
                                            )}

                                            {pergunta.tipo === "selecao" && (
                                                <RadioGroup
                                                    aria-label={pergunta.titulo}
                                                    value={(respostas[pergunta.key] as string) ?? ""}
                                                    onChange={(v) => setResposta(pergunta.key, v)}
                                                >
                                                    {(pergunta.opcoes ?? []).map((opcao) => (
                                                        <RadioButton key={opcao} value={opcao} label={opcao} />
                                                    ))}
                                                </RadioGroup>
                                            )}

                                            {pergunta.tipo === "multipla" && (
                                                <div className="flex flex-col gap-3">
                                                    {(pergunta.opcoes ?? []).map((opcao) => (
                                                        <Checkbox
                                                            key={opcao}
                                                            size="sm"
                                                            label={opcao}
                                                            isSelected={((respostas[pergunta.key] as string[]) ?? []).includes(opcao)}
                                                            onChange={() => toggleMultipla(pergunta.key, opcao)}
                                                        />
                                                    ))}
                                                </div>
                                            )}

                                            {pergunta.tipo === "anexo" && (
                                                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-secondary bg-secondary/40 px-6 py-5 text-center transition duration-100 ease-linear hover:bg-secondary">
                                                    <UploadCloud02 className="size-6 text-fg-quaternary" />
                                                    <span className="text-sm text-secondary">
                                                        <span className="font-semibold text-brand-secondary">Clique para enviar</span> ou arraste o arquivo
                                                    </span>
                                                    <span className="text-xs text-tertiary">{(respostas[pergunta.key] as string) || "PDF, JPG ou PNG (máx. 10 MB)"}</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) => setResposta(pergunta.key, e.target.files?.[0]?.name ?? "")}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-secondary px-5 py-4">
                            <Button size="md" color="secondary" onClick={handleClose}>
                                Fechar
                            </Button>
                            <Button size="md" color="primary" isDisabled={perguntas.length === 0} onClick={handleSubmit}>
                                Enviar respostas
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
