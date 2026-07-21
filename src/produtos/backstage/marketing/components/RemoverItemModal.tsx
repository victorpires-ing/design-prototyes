import { Trash01, XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

interface RemoverItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function RemoverItemModal({ isOpen, onClose, onConfirm }: RemoverItemModalProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            isDismissable
        >
            <Modal>
                <Dialog>
                    <div className="w-full max-w-[480px] rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start gap-4">
                            <FeaturedIcon icon={Trash01} color="error" theme="modern" size="md" />
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-primary">
                                    Remover item da pré-venda?
                                </h2>
                                <p className="mt-1 text-sm text-tertiary">
                                    Você pode adicioná-lo novamente depois. Para editar vários itens
                                    ao mesmo tempo, use a opção “Editar” no topo da tabela.
                                </p>
                            </div>
                            <ButtonUtility
                                size="xs"
                                color="tertiary"
                                icon={XClose}
                                tooltip="Fechar"
                                onClick={onClose}
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary-destructive" onClick={handleConfirm}>
                                Remover
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
