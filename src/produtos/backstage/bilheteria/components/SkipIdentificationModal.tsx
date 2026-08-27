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
                            <h2 className="text-lg font-semibold text-primary">Pular identificação</h2>
                            <ButtonUtility size="xs" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                        </div>
                        <p className="mt-1 text-sm text-tertiary">Sem identificar o comprador, a venda muda de natureza:</p>
                        <ul className="mt-3 flex flex-col gap-2 text-sm text-tertiary">
                            <li>
                                Ingressos com <strong className="font-semibold text-secondary">acesso por face</strong> ficam
                                indisponíveis, porque dependem de um cadastro Ingresse.
                            </li>
                            <li>
                                Não dá para usar o <strong className="font-semibold text-secondary">link de pagamento</strong>: sem e-mail
                                não há para onde enviar.
                            </li>
                            {/* O lado bom de pular, que é justamente o caso do pré-impresso em lote. */}
                            {EVENTO.limitePorCpf > 0 && (
                                <li>
                                    Em compensação, o limite de{" "}
                                    <strong className="font-semibold text-secondary">{ingressosPorCpf(EVENTO.limitePorCpf)}</strong> deixa de
                                    valer — dá para emitir a quantidade que precisar de uma vez.
                                </li>
                            )}
                        </ul>

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
