import type { FC, ReactNode } from "react";
import { XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    icon: FC<{ className?: string }>;
    title: ReactNode;
    description: ReactNode;
    confirmLabel: string;
    confirmColor?: "primary" | "primary-destructive";
    cancelLabel?: string;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    icon,
    title,
    description,
    confirmLabel,
    confirmColor = "primary",
    cancelLabel = "Voltar",
}: ConfirmModalProps) {
    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal>
                <Dialog>
                    <div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <FeaturedIcon icon={icon} color="gray" theme="modern" size="lg" />
                            <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                        </div>

                        <h2 className="mt-4 text-lg font-semibold text-primary">{title}</h2>
                        <p className="mt-1 text-sm text-tertiary">{description}</p>

                        <div className="mt-6 flex gap-3">
                            <Button size="lg" color="secondary" className="flex-1" onClick={onClose}>
                                {cancelLabel}
                            </Button>
                            <Button size="lg" color={confirmColor} className="flex-1" onClick={onConfirm}>
                                {confirmLabel}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
