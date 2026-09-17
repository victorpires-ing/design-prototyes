import type { ReactNode } from "react";
import { XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { FOCO_ESCOPO } from "./pos-compra-ui";

interface FluxoModalProps {
    isOpen: boolean;
    titulo: string;
    subtitulo: string;
    onClose: () => void;
    children: ReactNode;
    rodape: ReactNode;
    /** Faixa fixa entre o conteúdo e as ações, para contadores de seleção. */
    resumo?: ReactNode;
    largura?: "md" | "lg" | "xl";
}

const LARGURAS = {
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-3xl",
};

/** Casca comum dos três fluxos: cabeçalho, corpo rolável e rodapé de ações. */
export function FluxoModal({ isOpen, titulo, subtitulo, onClose, children, rodape, resumo, largura = "lg" }: FluxoModalProps) {
    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            isDismissable
        >
            {/* A altura é fixada aqui para o corpo rolar sozinho, em vez de esticar o modal. */}
            <Modal className={cx("h-[88svh] w-full sm:h-[85svh]", LARGURAS[largura])}>
                <Dialog className="h-full">
                    <div
                        className={cx(
                            "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl bg-primary shadow-xl ring-1 ring-border-secondary",
                            FOCO_ESCOPO,
                        )}
                    >
                        <header className="flex shrink-0 items-start gap-4 border-b border-secondary px-4 py-4 sm:px-6 sm:py-5">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-semibold text-primary">{titulo}</h2>
                                <p className="mt-1 text-sm text-tertiary">{subtitulo}</p>
                            </div>
                            <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                        </header>
                        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
                            {children}
                        </div>
                        {resumo && <div className="shrink-0 border-t border-secondary px-4 py-3 sm:px-6">{resumo}</div>}
                        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
                            {rodape}
                        </footer>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
