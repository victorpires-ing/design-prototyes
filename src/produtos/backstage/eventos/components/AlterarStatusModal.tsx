import { useEffect, useState, type FC } from "react";
import { File03, Globe01, Lock01, PauseCircle, XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { RadioGroupRadioButton } from "@/components/base/radio-groups/radio-group-radio-button";
import { EVENTO_STATUS_DESCRICAO, EVENTO_STATUS_LABEL, PROXIMOS_STATUS, STATUS_SIMPLES, vendasHabilitadas, type EventoStatus } from "../data/eventos";

const STATUS_ICON: Record<EventoStatus, FC<{ className?: string }>> = {
    rascunho: File03,
    privado: Lock01,
    publicado: Globe01,
    suspenso: PauseCircle,
    encerrado: File03,
};

/** Lista, em itens concretos (não numa frase só), o que muda na prática ao trocar de
 *  `atual` para `alvo` — venda de ingressos e quem consegue ver/acessar o evento.
 *  Encerrado nunca chega aqui: é uma troca só de ida, com confirmação própria. */
function efeitosDaMudanca(atual: EventoStatus, alvo: EventoStatus): string[] {
    if (alvo === atual) return [];

    const efeitos: string[] = [];
    const vendiaAntes = vendasHabilitadas(atual);
    const vendeDepois = vendasHabilitadas(alvo);
    if (!vendiaAntes && vendeDepois) efeitos.push("A venda de ingressos será ativada.");
    if (vendiaAntes && !vendeDepois) efeitos.push("A venda de ingressos será desativada.");

    if (alvo === "privado") efeitos.push("O evento estará acessível apenas via link direto.");
    if (alvo === "publicado") efeitos.push("O evento ficará visível para qualquer pessoa no site.");

    return efeitos;
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

/** Modal de troca de status entre os quatro estados reversíveis (rascunho, privado,
 *  publicado, suspenso) — reúne escolha e confirmação num só passo. Encerrado nunca
 *  aparece como opção aqui: o sistema aplica esse status sozinho (ex.: quando a data do
 *  evento passa), então não existe ação manual para chegar lá pela interface. */
export function AlterarStatusModal({ isOpen, onClose, statusAtual, onConfirm, statusInicial }: AlterarStatusModalProps) {
    const alcancaveis = PROXIMOS_STATUS[statusAtual];
    const [selecionado, setSelecionado] = useState<EventoStatus>(statusInicial ?? alcancaveis[0] ?? statusAtual);

    useEffect(() => {
        if (isOpen) setSelecionado(statusInicial ?? alcancaveis[0] ?? statusAtual);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (alcancaveis.length === 0) return null;

    const efeitos = efeitosDaMudanca(statusAtual, selecionado);
    /* Lista sempre com os quatro status, na mesma ordem fixa (STATUS_SIMPLES) — o atual e
       qualquer um fora de alcance a partir dele só ficam desabilitados no próprio lugar,
       nunca somem nem pulam de posição, pra quem usa aprender onde cada opção fica. */
    const items = STATUS_SIMPLES.map((status) => ({
        value: status,
        title: EVENTO_STATUS_LABEL[status],
        secondaryTitle: status === statusAtual ? "· status atual" : "",
        description: EVENTO_STATUS_DESCRICAO[status],
        icon: STATUS_ICON[status],
        disabled: status === statusAtual || !alcancaveis.includes(status),
    }));

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal>
                <Dialog>
                    <div className="w-full max-w-md rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start gap-4">
                            {/* O título já cita o destino — reage à seleção mesmo no seletor
                                completo, então não faz sentido genérico ("Alterar status do
                                evento") em nenhum dos dois modos. */}
                            <h2 className="flex-1 text-lg font-semibold text-primary">Mudar status para "{EVENTO_STATUS_LABEL[selecionado]}"?</h2>
                            <ButtonUtility size="xs" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                        </div>

                        {/* De onde para onde, direto no texto — sem badge, sem seta, sem caixa
                            por baixo. Sempre visível, mesmo quando a escolha já chega
                            pré-selecionada por um atalho: sem isso, quem abre o modal direto
                            numa opção não vê contra o que está comparando. */}
                        <p className="mt-2 text-sm text-tertiary">
                            Você está alterando o evento de <strong className="font-semibold text-primary">{EVENTO_STATUS_LABEL[statusAtual]}</strong> para{" "}
                            <strong className="font-semibold text-primary">{EVENTO_STATUS_LABEL[selecionado]}</strong>.
                        </p>

                        {/* Quem já escolheu o destino clicando na lista suspensa não deveria
                            escolher de novo aqui — só sobra confirmar. O grupo de opções só
                            aparece pra quem abriu o modal sem um alvo definido (ex.: botão
                            genérico "Alterar status"). */}
                        {!statusInicial && (
                            <RadioGroupRadioButton className="mt-4" items={items} value={selecionado} onChange={(value) => setSelecionado(value as EventoStatus)} />
                        )}

                        {efeitos.length > 0 && (
                            <div className="mt-4 flex flex-col gap-1.5">
                                <p className="text-sm font-medium text-secondary">O que acontece agora:</p>
                                <ul className="flex flex-col gap-1">
                                    {efeitos.map((efeito) => (
                                        <li key={efeito} className="flex items-baseline gap-2 text-sm text-tertiary">
                                            <span className="text-fg-quaternary" aria-hidden="true">
                                                •
                                            </span>
                                            {efeito}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" isDisabled={selecionado === statusAtual} onClick={() => { onConfirm(selecionado); onClose(); }}>
                                Alterar status
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
