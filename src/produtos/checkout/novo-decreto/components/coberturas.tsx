import { AnimatePresence, motion } from "motion/react";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import checkCircle from "../assets/check-circle.svg";
import { COBERTURAS } from "../data/pedido";
import { SMART_ANIMATE } from "../utils/transicao";
import { Botao, Icone } from "./base";

const Titulo = ({ children }: { children: string }) => <p className="text-[14px] leading-[17px] font-semibold text-(--ck-titulo-cobertura)">{children}</p>;

/** Marcador "excluído": círculo #ededf0 com traço #737373. */
const Excluido = () => (
    <span aria-hidden="true" className="relative size-[18px] shrink-0 overflow-clip rounded-[9px] bg-(--ck-excluido-bg)">
        <span className="absolute top-[8.25px] left-[5px] h-[1.5px] w-2 bg-(--ck-text-quaternary)" />
    </span>
);

/** "Coberturas detalhadas" — o que cobre, o que não cobre e como pedir o reembolso. */
export function CoberturasDetalhadas() {
    return (
        <div className="flex w-full flex-col items-start gap-5 overflow-clip rounded-lg bg-(--ck-coberturas-bg) p-4">
            <div className="flex w-full flex-col gap-2">
                <Titulo>O que cobre</Titulo>
                <ul className="flex flex-col gap-2">
                    {COBERTURAS.cobre.map((c) => (
                        <li key={c} className="flex items-start gap-2 text-[14px] leading-[17px] text-(--ck-text-secondary)">
                            <Icone src={checkCircle} tamanho={18} />
                            <span className="min-w-0 flex-1">{c}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex w-full flex-col gap-2">
                <Titulo>O que não cobre</Titulo>
                <ul className="flex flex-col gap-2">
                    {COBERTURAS.naoCobre.map((c) => (
                        <li key={c} className="flex items-start gap-2 text-[14px] leading-[17px] text-(--ck-text-secondary)">
                            <Excluido />
                            <span className="min-w-0 flex-1">{c}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="flex w-full flex-col gap-2 text-[14px]">
                <Titulo>Como pedir o reembolso</Titulo>
                <p className="leading-[1.4] text-(--ck-text-secondary)">{COBERTURAS.reembolso}</p>
            </div>
        </div>
    );
}

/** Mobile: "Ver coberturas" abre o bottom sheet "Coberturas do Reembolso por imprevistos". */
export function BottomSheetCoberturas({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <AriaModalOverlay
                    isOpen
                    isDismissable
                    onOpenChange={(aberto) => !aberto && onClose()}
                    className="ck-decreto fixed inset-0 z-50 flex items-end"
                >
                    <motion.div
                        className="absolute inset-0 bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={SMART_ANIMATE}
                    />
                    <AriaModal className="relative w-full outline-hidden">
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={SMART_ANIMATE}>
                            <AriaDialog
                                aria-label="Coberturas do Reembolso por imprevistos"
                                className="flex max-h-[85dvh] flex-col items-center gap-4 overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 pb-[50px] outline-hidden"
                            >
                                <span aria-hidden="true" className="h-1 w-10 shrink-0 rounded-[2px] bg-(--ck-handle)" />
                                <h2 className="w-full text-[20px] leading-6 font-bold text-(--ck-titulo-cobertura)">Coberturas do Reembolso por imprevistos</h2>
                                <CoberturasDetalhadas />
                                <Botao variante="secundario" className="w-full" onPress={onClose}>
                                    Entendi
                                </Botao>
                            </AriaDialog>
                        </motion.div>
                    </AriaModal>
                </AriaModalOverlay>
            )}
        </AnimatePresence>
    );
}
