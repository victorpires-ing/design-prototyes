import { useEffect, useState, type FC } from "react";
import { AlertTriangle, CheckCircle, File03, Globe01, Lock01, XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { RadioGroupRadioButton } from "@/components/base/radio-groups/radio-group-radio-button";
import { cx } from "@/utils/cx";
import { EVENTO_STATUS_DESCRICAO, EVENTO_STATUS_LABEL, vendasHabilitadas, type EventoStatus } from "../data/eventos";

export const ORDEM_STATUS: EventoStatus[] = ["rascunho", "privado", "publicado", "encerrado"];

const STATUS_ICON: Record<EventoStatus, FC<{ className?: string }>> = {
    rascunho: File03,
    privado: Lock01,
    publicado: Globe01,
    encerrado: CheckCircle,
};

/** Explica o efeito prático de trocar de `atual` para `alvo` — usado como confirmação. */
function descreverMudanca(atual: EventoStatus, alvo: EventoStatus): { tom: "danger" | "warning"; texto: string } | null {
    if (alvo === atual) return null;

    if (alvo === "encerrado") {
        return {
            tom: "danger",
            texto: "O evento será encerrado e as vendas serão interrompidas. Essa ação não pode ser desfeita.",
        };
    }

    const partes: string[] = [];
    const vendiaAntes = vendasHabilitadas(atual);
    const vendeDepois = vendasHabilitadas(alvo);
    if (!vendiaAntes && vendeDepois) partes.push("ligar a venda de ingressos");
    if (vendiaAntes && !vendeDepois) partes.push("desligar a venda de ingressos");
    if (atual !== "publicado" && alvo === "publicado") partes.push("abrir o acesso para qualquer pessoa comprar, não só quem tem o link");
    if (atual === "publicado" && alvo !== "publicado") partes.push("restringir o acesso a só quem tem o link");

    return { tom: "warning", texto: `Essa mudança só vai ${partes.join(" e ")}.` };
}

function labelConfirmar(alvo: EventoStatus): string {
    if (alvo === "publicado") return "Publicar evento";
    if (alvo === "privado") return "Tornar privado";
    if (alvo === "rascunho") return "Voltar para rascunho";
    return "Encerrar evento";
}

interface AlterarStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    statusAtual: EventoStatus;
    onConfirm: (novoStatus: EventoStatus) => void;
    /** Pré-seleciona uma opção diferente da atual — quem abre o modal já sabendo o que
     *  quer (ex.: escolheu num atalho) não deveria escolher a mesma coisa duas vezes. */
    statusInicial?: EventoStatus;
}

/** Modal de troca de status — reúne escolha e confirmação num só passo, com o efeito
 *  de cada opção explicado antes de aplicar (liga a venda, restringe o acesso, etc.). */
export function AlterarStatusModal({ isOpen, onClose, statusAtual, onConfirm, statusInicial }: AlterarStatusModalProps) {
    const [selecionado, setSelecionado] = useState<EventoStatus>(statusInicial ?? statusAtual);
    const [cienteDoEncerramento, setCienteDoEncerramento] = useState(false);

    useEffect(() => {
        if (isOpen) setSelecionado(statusInicial ?? statusAtual);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        setCienteDoEncerramento(false);
    }, [selecionado]);

    const mudanca = descreverMudanca(statusAtual, selecionado);
    const precisaConfirmarEncerramento = selecionado === "encerrado" && selecionado !== statusAtual;
    const items = ORDEM_STATUS.map((status) => ({
        value: status,
        title: EVENTO_STATUS_LABEL[status],
        secondaryTitle: status === statusAtual ? "· status atual" : "",
        description: EVENTO_STATUS_DESCRICAO[status],
        icon: STATUS_ICON[status],
    }));
    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal>
                <Dialog>
                    <div className="w-full max-w-md rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-primary">Alterar status do evento</h2>
                                {!statusInicial && (
                                    <p className="mt-1 text-sm text-tertiary">
                                        Cada opção muda se as vendas estão ligadas e quem consegue acessar o link de compra.
                                    </p>
                                )}
                            </div>
                            <ButtonUtility size="xs" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                        </div>

                        {statusInicial ? (
                            <p className={cx("mt-4 text-sm", mudanca ? "text-primary" : "text-tertiary")}>{mudanca ? mudanca.texto : EVENTO_STATUS_DESCRICAO[selecionado]}</p>
                        ) : (
                            <>
                                <RadioGroupRadioButton className="mt-5" items={items} value={selecionado} onChange={(value) => setSelecionado(value as EventoStatus)} />
                                {mudanca && (
                                    <div
                                        className={cx(
                                            "mt-4 flex items-start gap-3 rounded-lg p-3 ring-1",
                                            mudanca.tom === "danger" ? "bg-error-primary ring-error_subtle" : "bg-warning-primary ring-border-secondary",
                                        )}
                                    >
                                        <AlertTriangle
                                            className={cx("mt-0.5 size-4 shrink-0", mudanca.tom === "danger" ? "text-fg-error-secondary" : "text-fg-warning-secondary")}
                                            aria-hidden="true"
                                        />
                                        <p className="text-sm text-primary">{mudanca.texto}</p>
                                    </div>
                                )}
                            </>
                        )}

                        {precisaConfirmarEncerramento && (
                            <Checkbox
                                className="mt-3"
                                label="Entendo que essa ação não pode ser desfeita"
                                isSelected={cienteDoEncerramento}
                                onChange={setCienteDoEncerramento}
                            />
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                size="md"
                                color={selecionado === "encerrado" ? "primary-destructive" : "primary"}
                                isDisabled={selecionado === statusAtual || (precisaConfirmarEncerramento && !cienteDoEncerramento)}
                                onClick={() => {
                                    onConfirm(selecionado);
                                    onClose();
                                }}
                            >
                                {labelConfirmar(selecionado)}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
