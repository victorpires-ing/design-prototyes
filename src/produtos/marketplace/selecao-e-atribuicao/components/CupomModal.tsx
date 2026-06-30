import { useEffect, useState } from "react";
import { XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";

interface CupomModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Valida e aplica o código. Retorna true se válido (fecha o modal); false mostra erro. */
    onAplicar: (codigo: string) => boolean;
}

export function CupomModal({ isOpen, onClose, onAplicar }: CupomModalProps) {
    const [codigo, setCodigo] = useState("");
    const [erro, setErro] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCodigo("");
            setErro(false);
        }
    }, [isOpen]);

    const aplicar = () => {
        if (codigo.trim() === "") return;
        const ok = onAplicar(codigo.trim());
        if (ok) onClose();
        else setErro(true);
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-[400px]">
                <Dialog>
                    <div className="w-full rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-lg font-semibold text-primary">Adicionar código ou cupom</h2>
                            <p className="text-sm text-tertiary">Insira um código de desconto ou de desbloqueio de itens exclusivos</p>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                    </div>

                    <div className="mt-5 flex flex-col gap-2">
                        <Input
                            size="md"
                            aria-label="Código ou cupom"
                            placeholder="Digite o código ou cupom aqui"
                            value={codigo}
                            onChange={(v) => {
                                setCodigo(v);
                                if (erro) setErro(false);
                            }}
                            isInvalid={erro}
                        />
                        {erro && <span className="text-sm text-error-primary">Cupom inválido ou não encontrado.</span>}
                    </div>

                    <div className="-mx-6 mt-5 flex items-center gap-3 border-t border-secondary px-6 pt-5">
                        <Button size="lg" color="secondary" className="flex-1" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button size="lg" color="primary" className="flex-1" onClick={aplicar} isDisabled={codigo.trim() === ""}>
                            Aplicar
                        </Button>
                    </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
