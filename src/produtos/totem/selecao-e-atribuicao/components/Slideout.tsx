import type { ReactNode } from "react";
import { XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";

interface SlideoutProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
}

/** Painel lateral (drawer) para editar um elemento sem poluir a tela. */
export function Slideout({ isOpen, title, onClose, children, footer }: SlideoutProps) {
    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex justify-end bg-overlay/70 backdrop-blur-[2px] outline-hidden",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "flex h-full w-full max-w-[480px] flex-col bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-250 ease-out animate-in slide-in-from-right",
                        isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                    )
                }
            >
                <AriaDialog className="flex h-full flex-col outline-hidden">
                    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-secondary px-5 py-4">
                        <h2 className="text-md font-semibold text-primary">{title}</h2>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                    </header>
                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">{children}</div>
                    {footer && <div className="flex shrink-0 items-center justify-between gap-3 border-t border-secondary px-5 py-4">{footer}</div>}
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
