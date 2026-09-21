import { type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, XClose } from "@untitledui/icons";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { EtapaCompacta } from "../pos-compra-ui";

/**
 * Casca compartilhada dos dois fluxos de operação (troca de item, transferência de
 * titularidade) — antes cada página reimplementava o próprio cabeçalho, stepper e
 * cálculo de podeAvancar/rotuloAvancar. Sobrepõe o hub (DetalhePedido) em vez de navegar
 * para uma rota separada, então o pedido nunca desmonta durante o atendimento.
 */
export function WizardShell({
    isOpen,
    onClose,
    titulo,
    subtitulo,
    etapas,
    indiceAtual,
    podeAvancar,
    rotuloAvancar,
    ultimaEtapa,
    rotuloConfirmar,
    onVoltar,
    onAvancar,
    onConfirmar,
    onMinimizar,
    ocultarRodape = false,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    titulo: string;
    subtitulo?: string;
    etapas: string[];
    indiceAtual: number;
    podeAvancar: boolean;
    rotuloAvancar: string;
    ultimaEtapa: boolean;
    rotuloConfirmar: string;
    onVoltar: () => void;
    onAvancar: () => void;
    onConfirmar: () => void;
    /** Ausente = a primeira etapa não pode ser minimizada, só descartada. */
    onMinimizar?: () => void;
    /** Esconde o rodapé fixo — para etapas onde a própria escolha já avança (ex.: clicar num
     *  card de destinatário), sem precisar de um "Avançar" redundante embaixo. */
    ocultarRodape?: boolean;
    children: ReactNode;
}) {
    const progressItems: ProgressIconType[] = etapas.map((titulo, i) => ({
        title: titulo,
        description: "",
        status: i < indiceAtual ? "complete" : i === indiceAtual ? "current" : "incomplete",
    }));

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable={false}>
            <Modal className="h-[92vh] w-full sm:max-w-4xl">
                <Dialog className="h-full">
                    <div className="flex size-full flex-col overflow-hidden rounded-none bg-primary sm:rounded-2xl">
                        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-4 md:px-6">
                            <ButtonUtility size="md" color="secondary" icon={ChevronLeft} tooltip="Voltar" onClick={onVoltar} />
                            <div className="flex flex-col items-center text-center max-md:order-last max-md:w-full md:pointer-events-none md:absolute md:left-1/2 md:-translate-x-1/2">
                                <h1 className="text-lg font-bold text-primary">{titulo}</h1>
                                {subtitulo && <p className="text-sm text-tertiary">{subtitulo}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                {onMinimizar && (
                                    <Button size="sm" color="tertiary" onClick={onMinimizar}>
                                        Minimizar
                                    </Button>
                                )}
                                <ButtonUtility size="md" color="secondary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                            </div>
                        </header>

                        <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-4 py-6 md:px-6">
                            <Progress.IconsWithText items={progressItems} type="number" size="sm" orientation="horizontal" className="max-w-[520px] max-md:hidden" />
                            <EtapaCompacta atual={indiceAtual} titulos={etapas} className="md:hidden" />
                            <section className="flex w-full max-w-2xl flex-col gap-5 pb-6">{children}</section>
                        </div>

                        <AnimatePresence>
                            {!ocultarRodape && (
                                <motion.footer
                                    initial={{ y: "100%", opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: "100%", opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                    className="flex shrink-0 items-center justify-end gap-3 border-t border-secondary px-4 py-4 md:px-6"
                                >
                                    {ultimaEtapa ? (
                                        <Button size="md" isDisabled={!podeAvancar} onClick={onConfirmar}>
                                            {rotuloConfirmar}
                                        </Button>
                                    ) : (
                                        <Button size="md" isDisabled={!podeAvancar} onClick={onAvancar}>
                                            {rotuloAvancar}
                                        </Button>
                                    )}
                                </motion.footer>
                            )}
                        </AnimatePresence>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
