import { useEffect, useState } from "react";
import { XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { CampoFormulario, respostaVazia } from "./CampoFormulario";
import { mostrarToast } from "./WebToast";
import { SAO_SILVESTRE, tituloFormulario } from "../data/sao-silvestre";
import { getFormulario, mesmaResposta, salvarFormulario } from "../data/formulario-store";

interface EditarFormularioModalProps {
    isOpen: boolean;
    onClose: () => void;
    comboId: string;
}

/** Edição do formulário da inscrição na web: botão abre este modal, sem sair da página. */
export function EditarFormularioModal({ isOpen, onClose, comboId }: EditarFormularioModalProps) {
    const perguntas = getFormulario(comboId, SAO_SILVESTRE.questionario);
    const [respostas, setRespostas] = useState<Record<string, string>>({});

    // Cada abertura recomeça das respostas salvas.
    useEffect(() => {
        if (isOpen) setRespostas(Object.fromEntries(getFormulario(comboId, SAO_SILVESTRE.questionario).map((q) => [q.pergunta, q.resposta])));
    }, [isOpen, comboId]);

    const faltando = perguntas.filter((q) => respostaVazia(q, respostas[q.pergunta] ?? ""));
    const alteradas = perguntas.filter((q) => !mesmaResposta(q, respostas[q.pergunta] ?? q.resposta, q.resposta));
    const podeSalvar = faltando.length === 0 && alteradas.length > 0;

    const salvar = () => {
        const { salvas, conflitos } = salvarFormulario(comboId, perguntas, respostas);

        if (conflitos.length > 0) {
            // A opção acabou enquanto a pessoa preenchia: a tela volta a refletir o que o store aceitou.
            setRespostas(Object.fromEntries(getFormulario(comboId, SAO_SILVESTRE.questionario).map((q) => [q.pergunta, q.resposta])));

            const primeiro = conflitos[0];
            const motivo =
                conflitos.length === 1
                    ? `A opção esgotou em "${primeiro.pergunta}" enquanto você preenchia. Escolha outra.`
                    : "As opções esgotaram enquanto você preenchia. Escolha outras.";
            mostrarToast(
                conflitos.length === 1 ? `"${primeiro.valor}" esgotou` : `${conflitos.length} opções esgotaram`,
                salvas.length > 0 ? `${motivo} As outras alterações foram salvas.` : motivo,
                "aviso",
            );
            return;
        }

        if (salvas.length === 0) {
            mostrarToast("Nada para salvar", "As respostas continuam iguais às que você enviou.", "aviso");
            return;
        }

        mostrarToast("Formulário atualizado", salvas.length === 1 ? `"${salvas[0]}" foi alterada.` : `${salvas.length} respostas foram alteradas.`);
        onClose();
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(aberto) => !aberto && onClose()} isDismissable>
            <Modal>
                <Dialog>
                    <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-xl bg-primary shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start gap-4 border-b border-secondary p-6">
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-primary">Editar {tituloFormulario(SAO_SILVESTRE.tipo)}</h2>
                                <p className="mt-1 text-sm text-tertiary">
                                    Altere as respostas que você enviou na inscrição da {SAO_SILVESTRE.title}.
                                </p>
                            </div>
                            <ButtonUtility size="xs" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                        </div>

                        <div className="flex flex-col gap-5 overflow-y-auto p-6">
                            {perguntas.map((q) => (
                                <CampoFormulario
                                    key={q.pergunta}
                                    pergunta={q}
                                    valor={respostas[q.pergunta] ?? ""}
                                    valorOriginal={q.resposta}
                                    isInvalid={faltando.includes(q)}
                                    onChange={(v) => setRespostas((r) => ({ ...r, [q.pergunta]: v }))}
                                />
                            ))}
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-secondary p-6">
                            <p className="text-sm text-tertiary">
                                {faltando.length > 0
                                    ? faltando.length === 1
                                        ? "Falta responder 1 pergunta obrigatória."
                                        : `Faltam responder ${faltando.length} perguntas obrigatórias.`
                                    : alteradas.length > 0
                                      ? alteradas.length === 1
                                          ? "1 resposta alterada."
                                          : `${alteradas.length} respostas alteradas.`
                                      : "Nenhuma alteração ainda."}
                            </p>
                            <div className="flex shrink-0 items-center gap-3">
                                <Button size="md" color="secondary" onClick={onClose}>
                                    Cancelar
                                </Button>
                                <Button size="md" color="primary" isDisabled={!podeSalvar} onClick={salvar}>
                                    Salvar alterações
                                </Button>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
