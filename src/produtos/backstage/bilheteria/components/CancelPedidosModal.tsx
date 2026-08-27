import { XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import type { Pedido } from "../data/pedidos";

interface CancelPedidosModalProps {
    /** `null` mantém o modal fechado. */
    pedidos: Pedido[] | null;
    onClose: () => void;
    onConfirm: (pedidos: Pedido[]) => void;
}

/** Confirmação de cancelamento de um ou mais pedidos da bilheteria. */
export function CancelPedidosModal({ pedidos, onClose, onConfirm }: CancelPedidosModalProps) {
    const count = pedidos?.length ?? 0;
    const isBulk = count > 1;

    return (
        <ModalOverlay isOpen={count > 0} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal>
                <Dialog>
                    <div className="w-full max-w-lg rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-primary">
                                    {isBulk ? `Cancelar ${count} pedidos?` : "Cancelar pedido?"}
                                </h2>
                                <p className="mt-1 text-sm text-tertiary">
                                    Os itens voltam para o estoque e o comprador perde o acesso. Essa ação não pode ser desfeita.
                                </p>
                            </div>
                            <ButtonUtility size="xs" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                        </div>

                        {pedidos && pedidos.length > 0 && (
                            <div className="mt-5 max-h-44 overflow-y-auto rounded-lg bg-secondary_subtle p-3 ring-1 ring-border-secondary">
                                <ul className="flex flex-col gap-2">
                                    {pedidos.map((pedido) => (
                                        <li key={pedido.id} className="truncate text-sm text-primary">
                                            {pedido.id}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Voltar
                            </Button>
                            <Button size="md" color="primary-destructive" onClick={() => pedidos && onConfirm(pedidos)}>
                                Cancelar {isBulk ? "pedidos" : "pedido"}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
