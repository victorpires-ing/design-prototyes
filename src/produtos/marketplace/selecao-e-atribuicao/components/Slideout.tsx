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

/**
 * Painel de apoio, sem tirar a pessoa da tela de compra.
 *
 * De `sm` para cima é um drawer que entra pela direita, com a altura toda.
 * No celular vira folha de baixo, com a altura do conteúdo e teto de 85dvh:
 * ocupando a tela inteira, um texto de seis linhas sobre taxa apagava o
 * contexto da compra e a volta virava uma decisão, em vez de um olhar de lado.
 *
 * `dvh` e não `vh`: com a barra do navegador recolhendo, `vh` deixa o pé da
 * folha embaixo da barra justamente enquanto a pessoa rola o conteúdo.
 */
export function Slideout({ isOpen, title, onClose, children, footer }: SlideoutProps) {
    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex items-end justify-center bg-overlay/70 backdrop-blur-[2px] outline-hidden sm:items-stretch sm:justify-end",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "flex max-h-[85dvh] w-full flex-col rounded-t-2xl bg-primary pb-[env(safe-area-inset-bottom)] shadow-xl outline-hidden",
                        "sm:h-full sm:max-h-none sm:max-w-[480px] sm:rounded-none sm:pb-0",
                        /*
                          O sufixo `-0` zera o eixo que a classe base do mobile
                          deixou ligado. Sem ele, de `sm` para cima o painel entraria
                          na diagonal: as variantes somam, não se substituem.
                        */
                        isEntering && "duration-250 ease-out animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:slide-in-from-right",
                        isExiting && "duration-200 ease-in animate-out slide-out-to-bottom sm:slide-out-to-bottom-0 sm:slide-out-to-right",
                    )
                }
            >
                <AriaDialog className="flex min-h-0 flex-1 flex-col outline-hidden">
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
