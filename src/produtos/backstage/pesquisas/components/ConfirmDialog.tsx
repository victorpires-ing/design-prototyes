import type { ReactNode } from "react";
import { AlertTriangle } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
}

/** Confirmação centralizada para ações destrutivas — previne perdas acidentais. */
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, description, confirmLabel = "Excluir", cancelLabel = "Cancelar" }: ConfirmDialogProps) {
    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-[70] flex items-center justify-center bg-overlay/70 p-4 outline-hidden backdrop-blur-[2px]",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "w-full max-w-[400px] rounded-2xl bg-primary p-6 shadow-xl outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex flex-col gap-4 outline-hidden">
                    <FeaturedIcon icon={AlertTriangle} color="error" theme="light" size="lg" />
                    <div className="flex flex-col gap-1">
                        <h2 className="text-md font-semibold text-primary">{title}</h2>
                        <p className="text-sm text-tertiary">{description}</p>
                    </div>
                    <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button size="md" color="secondary" onClick={onClose}>
                            {cancelLabel}
                        </Button>
                        <Button
                            size="md"
                            color="primary-destructive"
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
