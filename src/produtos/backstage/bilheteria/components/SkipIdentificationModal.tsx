import { XClose } from "@untitledui/icons";
import { EVENTO, ingressosPorCpf } from "../data/catalogo";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

interface SkipIdentificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

/** Confirmação de "Pular identificação" — avisa o que a venda anônima perde. */
export function SkipIdentificationModal({ isOpen, onClose, onConfirm }: SkipIdentificationModalProps) {
    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal>
                <Dialog>
                    <div className="w-full max-w-md rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="text-lg font-semibold text-primary">Vender sem identificar o comprador?</h2>
                            <ButtonUtility size="xs" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                        </div>
                        {/*
                          O modal confirma; quem ensina é o passo 1, que já explica o
                          trade-off antes de este abrir. Primeira frase o que se perde,
                          segunda o que se ganha — a estrutura aparece antes da leitura.
                        */}
                        <p className="mt-2 text-sm text-tertiary">
                            Esta venda fica sem <strong className="font-semibold text-secondary">link de pagamento</strong> e sem ingressos
                            com <strong className="font-semibold text-secondary">acesso por face</strong>.
                            {EVENTO.limitePorCpf > 0 && (
                                <>
                                    {" "}
                                    Em troca, o limite de{" "}
                                    <strong className="font-semibold text-secondary">{ingressosPorCpf(EVENTO.limitePorCpf)}</strong> não
                                    vale, e dá para emitir em lote.
                                </>
                            )}
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row">
                            <Button size="md" color="secondary" className="md:flex-1" onClick={onClose}>
                                Voltar
                            </Button>
                            <Button
                                size="md"
                                color="primary"
                                className="md:flex-1"
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                            >
                                Pular identificação
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
