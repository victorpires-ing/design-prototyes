import { useEffect, useState } from "react";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";

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
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4 backdrop-blur-[2px] outline-hidden",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "flex max-h-[85vh] w-full max-w-[460px] flex-col rounded-2xl bg-primary p-6 shadow-xl outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex min-h-0 flex-1 flex-col outline-hidden">
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
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
