import { AnimatePresence, motion } from "motion/react";
import { Button as AriaButton, Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import xClose from "../assets/x-close.svg";
import { TAXAS_EXPLICADAS } from "../data/pedido";
import { Icone } from "./base";

const ENTRADA = { duration: 0.2, ease: [0.42, 0, 0.58, 1] as const };

/** Modal "Entenda como calculamos os valores" (instância Modal 9672:6790): o overlay começa abaixo da barra da Ingresse. */
export function ModalTaxas({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <AriaModalOverlay
                    isOpen
                    isDismissable
                    onOpenChange={(aberto) => !aberto && onClose()}
                    className="ck-decreto fixed inset-x-0 top-11 bottom-0 z-50 flex flex-col items-center overflow-y-auto px-4 py-20 sm:px-8"
                >
                    <motion.div
                        className="fixed inset-x-0 top-11 bottom-0 bg-(--ck-overlay)/70 backdrop-blur-[8px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={ENTRADA}
                    />
                    <AriaModal className="relative w-full max-w-[440px] outline-hidden">
                        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={ENTRADA}>
                            <AriaDialog
                                aria-label="Entenda como calculamos os valores"
                                className="ck-sombra-xl flex w-full flex-col gap-4 overflow-clip rounded-2xl bg-(--ck-bg-primary) p-4 outline-hidden"
                            >
                                <div className="relative w-full pr-10">
                                    <h2 className="text-[16px] leading-6 font-semibold text-(--ck-text-primary)">Entenda como calculamos os valores</h2>
                                    <AriaButton
                                        aria-label="Fechar"
                                        onPress={onClose}
                                        className="absolute -top-1.5 right-0 flex size-9 cursor-pointer items-center justify-center rounded-lg p-2 transition duration-100 ease-linear hover:bg-(--ck-neutral-50)"
                                    >
                                        <Icone src={xClose} tamanho={20} />
                                    </AriaButton>
                                </div>
                                {TAXAS_EXPLICADAS.map((t) => (
                                    <div key={t.titulo} className="flex w-full flex-col gap-2 text-[14px] leading-5 text-(--ck-text-primary)">
                                        <p className="font-semibold">{t.titulo}</p>
                                        <p>{t.texto}</p>
                                    </div>
                                ))}
                            </AriaDialog>
                        </motion.div>
                    </AriaModal>
                </AriaModalOverlay>
            )}
        </AnimatePresence>
    );
}
