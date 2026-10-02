import { useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, XClose } from "@untitledui/icons";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { EtapaCompacta } from "../pos-compra-ui";

/**
 * Casca compartilhada dos três fluxos de alteração (troca, transferência, formulário). Sobrepõe
 * o pedido em vez de navegar para outra rota, então a página nunca desmonta durante o atendimento.
 *
 * Fechar tem um comportamento só: o fluxo decide se guarda um rascunho (só quando já há algo
 * feito além da unidade escolhida). Não existe mais "Minimizar", que fazia quase o mesmo que o X.
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
    ocultarRodape = false,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    titulo: string;
    /** Sobre quem é a alteração: "{Comprador} · Pedido {id curto}". */
    subtitulo?: string;
    etapas: string[];
    indiceAtual: number;
    podeAvancar: boolean;
    rotuloAvancar: string;
    ultimaEtapa: boolean;
    /** Diz o que acontece e com quanto: "Enviar cobrança de R$ 15,30 para c***@email.com". */
    rotuloConfirmar: string;
    onVoltar: () => void;
    onAvancar: () => void;
    onConfirmar: () => void;
    /** Esconde o rodapé fixo, para etapas onde a própria escolha já avança (ex.: clicar num
     *  card de destinatário), sem um "Avançar" redundante embaixo. */
    ocultarRodape?: boolean;
    children: ReactNode;
}) {
    /* Direção do slide: avançar entra pela direita, voltar entra pela esquerda. O movimento
       acompanha o stepper e diz, sem texto, se a pessoa foi para frente ou para trás. */
    const ultimoIndice = useRef(indiceAtual);
    const direcao = useRef(1);
    if (indiceAtual !== ultimoIndice.current) {
        direcao.current = indiceAtual > ultimoIndice.current ? 1 : -1;
        ultimoIndice.current = indiceAtual;
    }
    const semMovimento = useReducedMotion();
    const deslocamento = semMovimento ? 0 : 48;
    const rolagem = useRef<HTMLDivElement>(null);

    const progressItems: ProgressIconType[] = etapas.map((titulo, i) => ({
        title: titulo,
        description: "",
        status: i < indiceAtual ? "complete" : i === indiceAtual ? "current" : "incomplete",
    }));

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable={false}>
            <Modal className="h-[92vh] w-full sm:max-w-4xl">
                <Dialog className="h-full" aria-label={titulo}>
                    <div className="flex size-full flex-col overflow-hidden rounded-none bg-primary sm:rounded-2xl">
                        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-4 md:px-6">
                            <ButtonUtility size="sm" color="secondary" icon={ChevronLeft} aria-label="Voltar" onClick={onVoltar} />
                            <div className="flex flex-col items-center text-center max-md:order-last max-md:w-full md:pointer-events-none md:absolute md:left-1/2 md:-translate-x-1/2">
                                <h2 className="text-lg font-bold text-primary">{titulo}</h2>
                                {subtitulo && <p className="text-sm text-tertiary">{subtitulo}</p>}
                            </div>
                            <ButtonUtility size="sm" color="secondary" icon={XClose} aria-label="Fechar" onClick={onClose} />
                        </header>

                        <div ref={rolagem} className="flex flex-1 flex-col items-center gap-6 overflow-x-hidden overflow-y-auto px-4 py-6 md:px-6">
                            {etapas.length > 1 && (
                                <>
                                    <Progress.IconsWithText items={progressItems} type="number" size="md" orientation="horizontal" className="max-w-[560px] max-md:hidden" />
                                    <EtapaCompacta atual={indiceAtual} titulos={etapas} className="md:hidden" />
                                </>
                            )}
                            {/* Cada etapa nova começa do topo: sem isso, avançar de uma lista longa abria
                                a próxima etapa no meio. */}
                            <AnimatePresence mode="wait" initial={false} custom={direcao.current} onExitComplete={() => rolagem.current?.scrollTo({ top: 0 })}>
                                <motion.section
                                    key={indiceAtual}
                                    custom={direcao.current}
                                    variants={{
                                        entra: (d: number) => ({ x: d * deslocamento, opacity: 0 }),
                                        centro: { x: 0, opacity: 1 },
                                        sai: (d: number) => ({ x: d * -deslocamento, opacity: 0 }),
                                    }}
                                    initial="entra"
                                    animate="centro"
                                    exit="sai"
                                    transition={{ duration: 0.18, ease: "easeOut" }}
                                    className="flex w-full max-w-2xl flex-col gap-5 pb-6"
                                >
                                    {children}
                                </motion.section>
                            </AnimatePresence>
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
