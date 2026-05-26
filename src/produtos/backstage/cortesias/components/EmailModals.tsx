import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle, SlashCircle01, XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

/* ------------------------------------------------------------------ */
/*  Edit e-mail modal                                                 */
/* ------------------------------------------------------------------ */

export interface EditEmailModalProps {
    isOpen: boolean;
    email: string;
    onClose: () => void;
    onSave: (newEmail: string) => void;
}

export function EditEmailModal({ isOpen, email, onClose, onSave }: EditEmailModalProps) {
    const [value, setValue] = useState(email);

    // Reset to the incoming e-mail every time the modal is opened.
    useEffect(() => {
        if (isOpen) setValue(email);
    }, [isOpen, email]);

    const handleSave = () => {
        const next = value.trim();
        if (!next) return;
        onSave(next);
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
                    <div className="w-full max-w-md rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-primary">Editar e-mail</h2>
                                <p className="mt-1 text-sm text-tertiary">
                                    Você está editando o e-mail{" "}
                                    <span className="font-medium text-primary">{email}</span>
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
                        <div className="mt-5">
                            <Input
                                type="email"
                                value={value}
                                onChange={setValue}
                                aria-label="E-mail do destinatário"
                                autoFocus
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                size="md"
                                color="primary"
                                isDisabled={!value.trim()}
                                onClick={handleSave}
                            >
                                Salvar
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Confirm remove e-mail modal                                       */
/* ------------------------------------------------------------------ */

export interface ConfirmRemoveEmailModalProps {
    isOpen: boolean;
    email: string;
    onClose: () => void;
    onConfirm: () => void;
}

export function ConfirmRemoveEmailModal({
    isOpen,
    email,
    onClose,
    onConfirm,
}: ConfirmRemoveEmailModalProps) {
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
                    <div className="w-full max-w-md rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start gap-4">
                            <FeaturedIcon
                                icon={SlashCircle01}
                                color="error"
                                theme="modern"
                                size="lg"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-lg font-semibold text-primary">
                                        Remover destinatário?
                                    </h2>
                                    <ButtonUtility
                                        size="xs"
                                        color="tertiary"
                                        icon={XClose}
                                        tooltip="Fechar"
                                        onClick={onClose}
                                    />
                                </div>
                                <p className="mt-1 text-sm text-tertiary">
                                    Você está prestes a remover o destinatário{" "}
                                    <span className="font-medium text-primary">{email}</span>.
                                </p>
                                <div className="mt-6 flex justify-end gap-3">
                                    <Button size="md" color="secondary" onClick={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        size="md"
                                        color="primary-destructive"
                                        onClick={onConfirm}
                                    >
                                        Remover destinatário
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Confirm send cortesias modal                                      */
/* ------------------------------------------------------------------ */

export interface ConfirmSendCortesiasModalProps {
    isOpen: boolean;
    recipientCount: number;
    itemsPerRecipient: number;
    onClose: () => void;
    onConfirm: () => void;
}

export function ConfirmSendCortesiasModal({
    isOpen,
    recipientCount,
    itemsPerRecipient,
    onClose,
    onConfirm,
}: ConfirmSendCortesiasModalProps) {
    const recipientText: ReactNode = (
        <span className="font-semibold text-primary">
            {String(recipientCount).padStart(2, "0")}
        </span>
    );
    const itemsText: ReactNode = (
        <span className="font-semibold text-primary">
            {itemsPerRecipient} {itemsPerRecipient === 1 ? "item" : "itens"}
        </span>
    );
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
                    <div className="w-full max-w-md rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start gap-4">
                            <FeaturedIcon
                                icon={AlertCircle}
                                color="brand"
                                theme="modern"
                                size="lg"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-lg font-semibold text-primary">
                                        Confirmar envio de cortesias
                                    </h2>
                                    <ButtonUtility
                                        size="xs"
                                        color="tertiary"
                                        icon={XClose}
                                        tooltip="Fechar"
                                        onClick={onClose}
                                    />
                                </div>
                                <p className="mt-1 text-sm text-tertiary">
                                    Você está prestes a enviar as cortesias para os
                                    destinatários selecionados. Cada um dos{" "}
                                    {recipientText} destinatários receberá {itemsText} por
                                    e-mail.
                                </p>
                                <div className="mt-6 flex justify-end gap-3">
                                    <Button size="md" color="secondary" onClick={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button size="md" color="primary" onClick={onConfirm}>
                                        Enviar cortesias
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
