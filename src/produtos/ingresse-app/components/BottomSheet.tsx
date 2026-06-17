import type { ReactNode } from "react";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { cx } from "@/utils/cx";

/** Bottom sheet do app (sobe de baixo, cantos arredondados no topo). */
export function BottomSheet({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: ReactNode }) {
    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex items-end justify-center bg-overlay/60 outline-hidden",
                    isEntering && "duration-300 ease-out animate-in fade-in",
                    isExiting && "duration-200 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "w-full max-w-[420px] rounded-t-3xl bg-primary p-5 pb-8 shadow-xl outline-hidden",
                        isEntering && "duration-300 ease-out animate-in slide-in-from-bottom",
                        isExiting && "duration-200 ease-in animate-out slide-out-to-bottom",
                    )
                }
            >
                <AriaDialog className="outline-hidden">{children}</AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
