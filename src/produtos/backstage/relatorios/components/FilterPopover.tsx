import { useEffect, useState, type ReactNode } from "react";
import {
    Dialog as AriaDialog,
    DialogTrigger as AriaDialogTrigger,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
    Popover as AriaPopover,
} from "react-aria-components";
import { cx } from "@/utils/cx";

/** true quando a viewport está em breakpoint mobile (< md). */
export function useIsMobile(query = "(max-width: 767px)"): boolean {
    const [isMobile, setIsMobile] = useState(() => (typeof window === "undefined" ? false : window.matchMedia(query).matches));
    useEffect(() => {
        const mq = window.matchMedia(query);
        const handler = () => setIsMobile(mq.matches);
        handler();
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [query]);
    return isMobile;
}

interface FilterPopoverProps {
    /** Botão que abre o overlay (deve ser um trigger válido do react-aria). */
    trigger: ReactNode;
    /** Chamado ao abrir/fechar — útil para semear rascunhos ao abrir. */
    onOpenChange?: (open: boolean) => void;
    /** Classes de largura do popover no desktop. */
    className?: string;
    /** Conteúdo do overlay; recebe `close` para fechar programaticamente. */
    children: (close: () => void) => ReactNode;
}

/**
 * Dropdown no desktop; bottom sheet no mobile. Mesmo conteúdo nos dois,
 * escolhido por media query.
 */
export function FilterPopover({ trigger, onOpenChange, className, children }: FilterPopoverProps) {
    const isMobile = useIsMobile();

    return (
        <AriaDialogTrigger onOpenChange={onOpenChange}>
            {trigger}

            {isMobile ? (
                <AriaModalOverlay
                    isDismissable
                    className={({ isEntering, isExiting }) =>
                        cx(
                            "fixed inset-0 z-50 flex items-end bg-overlay",
                            isEntering && "duration-200 ease-out animate-in fade-in",
                            isExiting && "duration-150 ease-in animate-out fade-out",
                        )
                    }
                >
                    <AriaModal
                        className={({ isEntering, isExiting }) =>
                            cx(
                                "max-h-[75vh] w-full rounded-t-2xl bg-primary shadow-xl outline-hidden",
                                isEntering && "duration-300 ease-out animate-in slide-in-from-bottom",
                                isExiting && "duration-200 ease-in animate-out slide-out-to-bottom",
                            )
                        }
                    >
                        <AriaDialog className="outline-hidden">
                            {({ close }) => (
                                <>
                                    <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-quaternary" aria-hidden="true" />
                                    {children(close)}
                                </>
                            )}
                        </AriaDialog>
                    </AriaModal>
                </AriaModalOverlay>
            ) : (
                <AriaPopover
                    placement="bottom end"
                    offset={4}
                    containerPadding={0}
                    className={(state) =>
                        cx(
                            "origin-(--trigger-anchor-point) will-change-transform",
                            state.isEntering && "duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5",
                            state.isExiting && "duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5",
                            className,
                        )
                    }
                >
                    <AriaDialog className="overflow-hidden rounded-lg bg-primary shadow-lg ring-1 ring-secondary_alt outline-hidden">
                        {({ close }) => children(close)}
                    </AriaDialog>
                </AriaPopover>
            )}
        </AriaDialogTrigger>
    );
}
