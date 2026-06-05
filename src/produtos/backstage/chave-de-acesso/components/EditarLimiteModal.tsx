import { useEffect, useState } from "react";
import { Edit01, XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

interface EditarLimiteModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Novo limite. `null` = ilimitado (campo vazio). */
    onSave: (limit: number | null) => void;
}

export function EditarLimiteModal({ isOpen, onClose, onSave }: EditarLimiteModalProps) {
    const [value, setValue] = useState("");

    useEffect(() => {
        if (isOpen) setValue("");
    }, [isOpen]);

    const handleSave = () => {
        const parsed = parseInt(value.replace(/\D/g, ""), 10);
        onSave(value.trim() === "" || Number.isNaN(parsed) ? null : parsed);
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal>
                <Dialog>
                    <div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <FeaturedIcon icon={Edit01} color="gray" theme="modern" size="lg" />
                            <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                        </div>

                        <h2 className="mt-4 text-lg font-semibold text-primary">Editar limite de uso</h2>
                        <p className="mt-1 text-sm text-tertiary">
                            Ao atingir o limite de uso, as chaves de acesso não poderão mais ser utilizadas, mas os itens
                            permanecerão ocultos.
                        </p>

                        <div className="mt-5">
                            <Input
                                aria-label="Limite de uso"
                                placeholder="Ilimitado"
                                value={value}
                                onChange={setValue}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSave();
                                }}
                            />
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button size="lg" color="secondary" className="flex-1" onClick={onClose}>
                                Voltar
                            </Button>
                            <Button size="lg" color="primary" className="flex-1" onClick={handleSave}>
                                Salvar novo limite
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
