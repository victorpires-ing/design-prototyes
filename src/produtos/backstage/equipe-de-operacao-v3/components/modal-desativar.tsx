import type { ReactNode } from "react";
import { XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";

interface Props {
    aberto: boolean;
    titulo: string;
    descricao: ReactNode;
    /** Texto do botão de confirmação, ex.: "Desativar grupo". */
    acao: string;
    onCancelar: () => void;
    onConfirmar: () => void;
}

/**
 * Confirmação de desativar (grupo ou operador), no tema escuro do app sobre o fundo
 * desfocado. Reativar não passa por aqui: é direto pelo toggle.
 */
export function ModalDesativar({ aberto, titulo, descricao, acao, onCancelar, onConfirmar }: Props) {
    return (
        <ModalOverlay isOpen={aberto} onOpenChange={(abrir) => !abrir && onCancelar()} isDismissable className="bg-black/40 backdrop-blur-[16px]">
            <Modal className="max-w-[560px]">
                <Dialog aria-label={titulo}>
                    <div className="tema-cotas relative w-full overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary ring-inset">
                        <button
                            type="button"
                            onClick={onCancelar}
                            aria-label="Fechar"
                            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover"
                        >
                            <XClose className="size-5" aria-hidden="true" />
                        </button>
                        <div className="flex flex-col gap-0.5 px-6 pt-6 pr-14">
                            <h2 className="text-md font-semibold text-primary">{titulo}</h2>
                            <p className="text-sm text-tertiary">{descricao}</p>
                        </div>
                        <div className="flex gap-3 px-6 pt-8 pb-6">
                            <Button size="md" color="secondary" className="flex-1" onClick={onCancelar}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" className="flex-1" onClick={onConfirmar}>
                                {acao}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
