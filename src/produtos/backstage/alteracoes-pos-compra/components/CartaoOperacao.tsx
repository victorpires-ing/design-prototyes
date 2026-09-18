import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy01, Mail01, MessageChatCircle, RefreshCcw01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { RadioGroupRadioButton } from "@/components/base/radio-groups/radio-group-radio-button";
import { TextArea } from "@/components/base/textarea/textarea";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { useClipboard } from "@/hooks/use-clipboard";
import { BadgeTipoOperacao, ListaLimitada, Regra, ResumoFinanceiro, corDaBarraDePrazo, formatarContagem, useContagem } from "./pos-compra-ui";
import {
    TIPO_OPERACAO_LABEL,
    cancelarSolicitacao,
    confirmarPagamento,
    expirarSolicitacao,
    getConta,
    notificarFinanceiro,
    reenviarLink,
    type CanalEnvio,
    type Pedido,
    type Solicitacao,
} from "../data/pos-compra-store";

export function CartaoOperacao({ pedido, solicitacao }: { pedido: Pedido; solicitacao: Solicitacao }) {
    const restante = useContagem(solicitacao.estado === "aguardando" ? solicitacao.expiraEm : undefined, () => expirarSolicitacao(pedido.id, solicitacao.id));
    const duracao = solicitacao.expiraEm - solicitacao.criadoEm;
    const [marcarPagoAberto, setMarcarPagoAberto] = useState(false);
    const [cancelarAberto, setCancelarAberto] = useState(false);
    const [notificarAberto, setNotificarAberto] = useState(false);
    const [reenviarAberto, setReenviarAberto] = useState(false);

    const aguardando = solicitacao.estado === "aguardando";
    const processando = solicitacao.estado === "processando";
    const falha = solicitacao.estado === "falha";
    const aguardandoFinanceiro = solicitacao.estado === "aguardando-financeiro";

    return (
        <section className={cxTom(falha || aguardandoFinanceiro)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1.5">
                    <BadgeTipoOperacao tipo={solicitacao.tipo} texto={TIPO_OPERACAO_LABEL[solicitacao.tipo]} />
                    {solicitacao.detalhes && solicitacao.detalhes.length > 0 && (
                        <ListaLimitada itens={solicitacao.detalhes} limite={3} rotulo="linhas">
                            {(linha) => (
                                <p key={linha} className="py-1 text-sm text-secondary first:pt-0">
                                    {linha}
                                </p>
                            )}
                        </ListaLimitada>
                    )}
                </div>

                {aguardando && (
                    <div className="w-full shrink-0 sm:w-[200px]">
                        <p className="text-sm text-tertiary">
                            expira em: <span className="font-semibold text-primary tabular-nums">{formatarContagem(restante)}</span>
                        </p>
                        <ProgressBarBase className="mt-2" value={restante} max={duracao} progressClassName={corDaBarraDePrazo(restante, duracao)} />
                    </div>
                )}
            </div>

            {processando && (
                <p className="flex items-center gap-2 text-sm font-medium text-secondary">
                    <RefreshCcw01 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
                    Pagamento confirmado. Aplicando a alteração, isso não pode mais ser cancelado.
                </p>
            )}

            {falha && (
                <div className="flex items-start gap-3 rounded-lg bg-error-primary p-3 ring-1 ring-error_subtle">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-fg-error-secondary" aria-hidden="true" />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-error-primary">Pago, mas não aplicado</p>
                        <p className="mt-0.5 text-sm text-tertiary">{solicitacao.motivoFalha ?? "As regras de negócio não valem mais para essa operação."}</p>
                    </div>
                </div>
            )}

            {aguardandoFinanceiro && solicitacao.escalonamento && (
                <div className="flex items-start gap-3 rounded-lg bg-warning-primary p-3 ring-1 ring-border-secondary">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-fg-warning-secondary" aria-hidden="true" />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-warning-primary">Financeiro notificado em {solicitacao.escalonamento.dataLabel}</p>
                        <p className="mt-0.5 text-sm text-tertiary">{solicitacao.escalonamento.relato}</p>
                        <p className="mt-1 text-sm text-tertiary">O Backstage não reverte isso sozinho. O ajuste é tratado pelo financeiro, fora do sistema.</p>
                    </div>
                </div>
            )}

            <ResumoFinanceiro linhas={solicitacao.linhas} titulo="Cobrança" />

            {(aguardando || falha) && (
                <div className="flex flex-wrap items-center gap-2">
                    {aguardando && (
                        <>
                            <Button size="sm" color="primary" onClick={() => setMarcarPagoAberto(true)}>
                                Marcar como pago
                            </Button>
                            <Button size="sm" color="secondary" onClick={() => setCancelarAberto(true)}>
                                Cancelar operação
                            </Button>
                            <Dropdown.Root>
                                <Dropdown.DotsButton />
                                <Dropdown.Popover className="w-56">
                                    <Dropdown.Menu>
                                        <Dropdown.Item id="reenviar" label="Reenviar link" onAction={() => setReenviarAberto(true)} />
                                    </Dropdown.Menu>
                                </Dropdown.Popover>
                            </Dropdown.Root>
                        </>
                    )}
                    {falha && (
                        <Button size="sm" color="primary-destructive" onClick={() => setNotificarAberto(true)}>
                            Notificar financeiro
                        </Button>
                    )}
                </div>
            )}

            <ModalMarcarComoPago isOpen={marcarPagoAberto} onClose={() => setMarcarPagoAberto(false)} pedidoId={pedido.id} solicitacao={solicitacao} />
            <ModalCancelarOperacao isOpen={cancelarAberto} onClose={() => setCancelarAberto(false)} pedidoId={pedido.id} solicitacaoId={solicitacao.id} />
            <ModalNotificarFinanceiro isOpen={notificarAberto} onClose={() => setNotificarAberto(false)} pedidoId={pedido.id} solicitacao={solicitacao} />
            <ModalReenviarLink isOpen={reenviarAberto} onClose={() => setReenviarAberto(false)} pedido={pedido} solicitacao={solicitacao} />
        </section>
    );
}

const cxTom = (destaque: boolean) =>
    `flex flex-col gap-4 rounded-2xl p-5 ring-1 ${destaque ? "bg-primary ring-error_subtle" : "bg-primary ring-border-secondary"}`;

/* ------------------------------------------------------------------ */
/*  Marcar como pago — confirmação honesta, não uma validação de gateway */
/* ------------------------------------------------------------------ */

function ModalMarcarComoPago({ isOpen, onClose, pedidoId, solicitacao }: { isOpen: boolean; onClose: () => void; pedidoId: string; solicitacao: Solicitacao }) {
    const [referencia, setReferencia] = useState("");

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-md">
                <Dialog>
                    <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div>
                            <h2 className="text-lg font-semibold text-primary">Marcar como pago</h2>
                            <p className="mt-1 text-sm text-tertiary">O Backstage não confirma pagamentos automaticamente. Confira o comprovante com o comprador antes de continuar.</p>
                        </div>
                        <Input label="Referência (opcional)" placeholder="Últimos dígitos, horário informado, observação" value={referencia} onChange={setReferencia} />
                        <Regra>Isso libera a reserva da linha de origem e aplica a alteração. Depois de confirmado, não é possível desfazer pelo Backstage.</Regra>
                        <div className="mt-2 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                size="md"
                                color="primary"
                                onClick={() => {
                                    confirmarPagamento(pedidoId, solicitacao.id, referencia.trim() || undefined);
                                    toast.success("Pagamento confirmado. Aplicando a alteração.");
                                    onClose();
                                }}
                            >
                                Confirmar pagamento
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Cancelar operação                                                  */
/* ------------------------------------------------------------------ */

function ModalCancelarOperacao({ isOpen, onClose, pedidoId, solicitacaoId }: { isOpen: boolean; onClose: () => void; pedidoId: string; solicitacaoId: string }) {
    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-md">
                <Dialog>
                    <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div>
                            <h2 className="text-lg font-semibold text-primary">Cancelar esta operação?</h2>
                            <p className="mt-1 text-sm text-tertiary">A reserva do item de destino será liberada e nada será cobrado. O pedido volta ao estado anterior.</p>
                        </div>
                        <div className="mt-2 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Manter operação
                            </Button>
                            <Button
                                size="md"
                                color="primary-destructive"
                                onClick={() => {
                                    cancelarSolicitacao(pedidoId, solicitacaoId);
                                    toast.success("Operação cancelada.");
                                    onClose();
                                }}
                            >
                                Cancelar operação
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Notificar financeiro — escalonamento honesto, nunca finge reverter */
/* ------------------------------------------------------------------ */

function ModalNotificarFinanceiro({ isOpen, onClose, pedidoId, solicitacao }: { isOpen: boolean; onClose: () => void; pedidoId: string; solicitacao: Solicitacao }) {
    const [cenario, setCenario] = useState<"falha-aplicacao" | "pagamento-indevido">("falha-aplicacao");
    const [relato, setRelato] = useState("");

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-md">
                <Dialog>
                    <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div>
                            <h2 className="text-lg font-semibold text-primary">Notificar financeiro</h2>
                            <p className="mt-1 text-sm text-tertiary">Esta operação não pode ser revertida pelo Backstage. O time financeiro trata o ajuste fora do sistema.</p>
                        </div>

                        <RadioGroupRadioButton
                            value={cenario}
                            onChange={(v) => setCenario(v as typeof cenario)}
                            items={[
                                { value: "falha-aplicacao", title: "Pagamento confirmado e aplicação falhou", secondaryTitle: "", description: "A cobrança foi paga, mas a troca ou transferência não pôde ser aplicada.", icon: AlertTriangle },
                                { value: "pagamento-indevido", title: "Pagamento pode ter sido confirmado por engano", secondaryTitle: "", description: "Foi marcado como pago sem confirmação real do comprador.", icon: AlertTriangle },
                            ]}
                        />

                        <TextArea label="Relato para o financeiro" placeholder="Descreva o que aconteceu" value={relato} onChange={setRelato} rows={4} isRequired />

                        <div className="mt-2 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                size="md"
                                color="primary-destructive"
                                isDisabled={relato.trim().length === 0}
                                onClick={() => {
                                    notificarFinanceiro({ pedidoId, solicitacaoId: solicitacao.id, cenario, relato: relato.trim() });
                                    toast.success("Financeiro notificado.");
                                    onClose();
                                }}
                            >
                                Notificar financeiro
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Reenviar link                                                      */
/* ------------------------------------------------------------------ */

function ModalReenviarLink({ isOpen, onClose, pedido, solicitacao }: { isOpen: boolean; onClose: () => void; pedido: Pedido; solicitacao: Solicitacao }) {
    const { copied, copy } = useClipboard();
    const [canal, setCanal] = useState<CanalEnvio>(solicitacao.canalEnvio);
    const [destino, setDestino] = useState(solicitacao.destinatarioEnvio);
    const comprador = getConta(pedido.compradorId);

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-md">
                <Dialog>
                    <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div>
                            <h2 className="text-lg font-semibold text-primary">Reenviar link de pagamento</h2>
                            <p className="mt-1 text-sm text-tertiary">O prazo não muda: continua valendo a partir de quando a cobrança foi criada.</p>
                        </div>

                        <InputGroup aria-label="Link de pagamento" trailingAddon={<Button color="secondary" iconLeading={copied ? Check : Copy01} onClick={() => copy(`https://${solicitacao.linkPagamento}`)}>{copied ? "Copiado" : "Copiar"}</Button>}>
                            <InputBase isReadOnly value={solicitacao.linkPagamento} />
                        </InputGroup>

                        <div className="flex gap-2">
                            <Button size="sm" color={canal === "whatsapp" ? "primary" : "secondary"} iconLeading={MessageChatCircle} className="flex-1" onClick={() => setCanal("whatsapp")}>
                                WhatsApp
                            </Button>
                            <Button size="sm" color={canal === "email" ? "primary" : "secondary"} iconLeading={Mail01} className="flex-1" onClick={() => setCanal("email")}>
                                E-mail
                            </Button>
                        </div>

                        <Input label={canal === "email" ? "E-mail" : "WhatsApp"} value={destino} onChange={setDestino} placeholder={canal === "email" ? comprador?.email : comprador?.celular} />

                        <div className="mt-2 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                size="md"
                                color="primary"
                                isDisabled={destino.trim().length === 0}
                                onClick={() => {
                                    reenviarLink(pedido.id, solicitacao.id, canal, destino.trim());
                                    toast.success("Link reenviado.");
                                    onClose();
                                }}
                            >
                                Reenviar
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
