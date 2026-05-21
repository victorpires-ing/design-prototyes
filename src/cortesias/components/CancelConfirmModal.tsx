import type { ReactNode } from "react";
import { SlashCircle01, XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

export interface CancelConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: ReactNode;
    description: ReactNode;
    listLabel?: string;
    listItems?: ReactNode[];
    confirmLabel: string;
    cancelLabel: string;
}

export function CancelConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    listLabel,
    listItems,
    confirmLabel,
    cancelLabel,
}: CancelConfirmModalProps) {
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
                    <div className="w-full max-w-lg rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start gap-4">
                            <FeaturedIcon
                                icon={SlashCircle01}
                                color="error"
                                theme="modern"
                                size="md"
                            />
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-primary">{title}</h2>
                                <div className="mt-1 text-sm text-tertiary">{description}</div>
                            </div>
                            <ButtonUtility
                                size="xs"
                                color="tertiary"
                                icon={XClose}
                                tooltip="Fechar"
                                onClick={onClose}
                            />
                        </div>

                        {listItems && listItems.length > 0 && (
                            <div className="mt-5 flex flex-col gap-2">
                                {listLabel && (
                                    <p className="text-sm font-semibold text-primary">
                                        {listLabel}
                                    </p>
                                )}
                                <div className="max-h-44 overflow-y-auto rounded-lg bg-secondary_subtle p-3 ring-1 ring-border-secondary">
                                    <ul className="flex flex-col gap-2">
                                        {listItems.map((node, i) => (
                                            <li key={i} className="text-sm text-primary">
                                                {node}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                {cancelLabel}
                            </Button>
                            <Button
                                size="md"
                                color="primary-destructive"
                                onClick={handleConfirm}
                            >
                                {confirmLabel}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
