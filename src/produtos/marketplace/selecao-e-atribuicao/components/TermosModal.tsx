import { useEffect, useState } from "react";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";

interface TermosModalProps {
    isOpen: boolean;
    termos: string;
    onClose: () => void;
    onConfirmar: () => void;
}

/** Termos de uso: topo + intro fixos, miolo scrollável, rodapé fixo (aceite + Continuar). */
export function TermosModal({ isOpen, termos, onClose, onConfirmar }: TermosModalProps) {
    const [aceito, setAceito] = useState(false);

    useEffect(() => {
        if (isOpen) setAceito(false);
    }, [isOpen]);

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-[460px]">
                <Dialog>
                    <div className="flex max-h-[85vh] w-full flex-col rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        {/* Topo fixo */}
                        <h2 className="shrink-0 text-lg font-semibold text-primary">Termos de uso</h2>
                        <p className="mt-2 shrink-0 text-md text-secondary">Para prosseguir com a compra você deve ler e concordar com os seguintes termos:</p>

                        {/* Miolo scrollável */}
                        <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl bg-secondary px-4 py-3 text-sm whitespace-pre-line text-tertiary ring-1 ring-border-secondary">
                            {termos}
                        </div>

                        {/* Rodapé fixo */}
                        <div className="mt-4 shrink-0">
                            <Checkbox size="sm" label="Li e aceito os termos e condições" isSelected={aceito} onChange={setAceito} />
                            <Button size="lg" color="primary" className="mt-4 w-full" isDisabled={!aceito} onClick={onConfirmar}>
                                Continuar
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
