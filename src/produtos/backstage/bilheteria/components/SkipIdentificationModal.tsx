import { XClose } from "@untitledui/icons";
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
                            <h2 className="text-lg font-semibold text-primary">Pular identificação</h2>
                            <ButtonUtility size="xs" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                        </div>
                        <p className="mt-1 text-sm text-tertiary">
                            Ingressos com acesso por face estarão desabilitados para venda e você não poderá usar o{" "}
                            <strong className="font-semibold text-secondary">“Link de pagamento”</strong> para concluir a venda.
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row">
                            <Button size="md" color="secondary" className="md:flex-1" onClick={onClose}>
                                Cancelar
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
                                Continuar
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
