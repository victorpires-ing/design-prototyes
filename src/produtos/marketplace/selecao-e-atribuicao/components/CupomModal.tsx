import { useEffect, useState } from "react";
import { XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

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
                        "flex w-full max-w-[400px] flex-col rounded-2xl bg-primary p-6 shadow-xl outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex flex-col outline-hidden">
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

                    <div className="mt-6 flex items-center justify-between gap-3">
                        <Button size="md" color="link-gray" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button size="md" color="primary" onClick={aplicar} isDisabled={codigo.trim() === ""}>
                            Aplicar
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
