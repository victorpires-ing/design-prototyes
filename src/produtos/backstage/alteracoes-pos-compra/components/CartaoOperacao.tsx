import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Check, CheckCircle, ChevronDown, Clock, Copy01, RefreshCcw01, Send01, XCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { RadioGroupRadioButton } from "@/components/base/radio-groups/radio-group-radio-button";
import { TextArea } from "@/components/base/textarea/textarea";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";
import { FOCO, Regra, ResumoFinanceiro, TIPO_OPERACAO_ICONE, mascararDestino, useContagem } from "./pos-compra-ui";
import { isEmailValido, isTelefoneValido } from "./wizard/EtapaEnvio";
import {
    TIPO_OPERACAO_CURTO,
    canalLabel,
    cancelarSolicitacao,
    descreverMotivo,
    expirarSolicitacao,
    formatarMoeda,
    getConta,
    getItem,
    notificarFinanceiro,
    reenviarLink,
    registrarPagamento,
    titularDaLinha,
    type CanalEnvio,
    type Conta,
    type Pedido,
    type Solicitacao,
} from "../data/pos-compra-store";

/** Quem recebe o link e paga: o novo titular numa transferência, o comprador nas demais. */
const quemPaga = (pedido: Pedido, solicitacao: Solicitacao): Conta | undefined => {
    if (solicitacao.tipo === "troca-titularidade") return getConta(Object.values(solicitacao.aplicar.titularPorLinha ?? {})[0] ?? "");
    return getConta(pedido.compradorId);
};

const unicos = (valores: Array<string | undefined>) => [...new Set(valores.filter(Boolean))] as string[];

/** O quê, numa frase: "Transferência de Camiseta extra do evento" e, abaixo, de quem para quem. */
const resumoDoCartao = (pedido: Pedido, solicitacao: Solicitacao) => {
    const linhas = pedido.itens.filter((l) => solicitacao.linhasAfetadas.includes(l.id));
    const itens = unicos(linhas.map((l) => getItem(l.itemId)?.nome));
    const oQue = itens.length === 1 ? `${linhas.length > 1 ? `${linhas.length}x ` : ""}${itens[0]}` : `${linhas.length} unidades`;
    const titulares = unicos(linhas.map((l) => titularDaLinha(pedido, l)?.nome)).join(", ");

    if (solicitacao.tipo === "troca-titularidade") {
        const destino = getConta(Object.values(solicitacao.aplicar.titularPorLinha ?? {})[0] ?? "")?.nome ?? "novo titular";
        return { titulo: `Transferência de ${oQue}`, de: titulares, para: destino };
    }
    if (solicitacao.tipo === "troca-item") {
        const novos = unicos((solicitacao.aplicar.trocas ?? []).map((t) => getItem(t.novoItemId)?.nome));
        return { titulo: `Troca de ${oQue}`, de: titulares, para: novos.length === 1 ? novos[0] : `${novos.length} itens novos` };
    }
    return { titulo: `Edição do formulário de ${oQue}`, de: titulares };
};

const tempoRestante = (ms: number) => {
    const segundos = Math.max(0, Math.ceil(ms / 1000));
    if (segundos >= 3600) return `${Math.floor(segundos / 3600)} h`;
    if (segundos >= 60) return `${Math.floor(segundos / 60)} min`;
    return `${segundos} s`;
};

const horaDe = (instante: number) => new Date(instante).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export const idDoCartao = (solicitacaoId: string) => `alteracao-${solicitacaoId}`;

/**
 * Uma alteração aberta, em quatro níveis e nada além:
 * 1. o quê (tipo, item, de quem para quem) e quanto;
 * 2. o estado, numa faixa com a cor dele: é o que muda e o que o operador precisa ver primeiro;
 * 3. o que fazer agora: a ação frequente à vista, as de exceção juntas em "Mais ações";
 * 4. o detalhe da cobrança, recolhido.
 * Quem enviou e quando já está no histórico; o cartão mostra só o destino do link, que é o que
 * importa para reenviar.
 */
export function CartaoOperacao({ pedido, solicitacao }: { pedido: Pedido; solicitacao: Solicitacao }) {
    const aguardando = solicitacao.estado === "aguardando";
    const processando = solicitacao.estado === "processando";
    const falha = solicitacao.estado === "falha";
    const comFinanceiro = solicitacao.estado === "aguardando-financeiro";

    const restante = useContagem(aguardando ? solicitacao.expiraEm : undefined, () => expirarSolicitacao(pedido.id, solicitacao.id));
    /* Reta final do prazo (os últimos 10 minutos de 1 hora): o tempo ganha peso. */
    const urgente = aguardando && restante < (solicitacao.expiraEm - solicitacao.criadoEm) / 6;
    const [reenviarAberto, setReenviarAberto] = useState(false);
    const [pagamentoAberto, setPagamentoAberto] = useState(false);
    const [cancelarAberto, setCancelarAberto] = useState(false);
    const [notificarAberto, setNotificarAberto] = useState(false);
    const { copied, copy } = useClipboard();

    const pagante = quemPaga(pedido, solicitacao);
    const resumo = resumoDoCartao(pedido, solicitacao);
    const Icone = TIPO_OPERACAO_ICONE[solicitacao.tipo];

    return (
        <section
            id={idDoCartao(solicitacao.id)}
            tabIndex={-1}
            aria-labelledby={`${idDoCartao(solicitacao.id)}-titulo`}
            className={cx("flex scroll-mt-24 flex-col gap-4 rounded-2xl bg-primary p-5 ring-1", falha ? "ring-error_subtle" : "ring-border-secondary", FOCO)}
        >
            {/* 1. O quê e quanto */}
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary ring-1 ring-border-secondary">
                    <Icone className="size-5 text-fg-secondary" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 id={`${idDoCartao(solicitacao.id)}-titulo`} className="text-md font-semibold text-primary">
                        {resumo.titulo}
                    </h3>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-tertiary">
                        <span>{resumo.de}</span>
                        {resumo.para && (
                            <>
                                <ArrowRight className="size-4 shrink-0 text-fg-quaternary" aria-label="para" />
                                <span className="font-medium text-secondary">{resumo.para}</span>
                            </>
                        )}
                    </p>
                </div>
                <p className="shrink-0 text-lg font-semibold text-primary tabular-nums">{formatarMoeda(solicitacao.total)}</p>
            </div>

            {/* 2. Estado */}
            {aguardando && (
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-warning-primary px-3 py-2.5 ring-1 ring-border-secondary">
                    <p className="flex items-center gap-2 text-sm font-semibold text-warning-primary">
                        <span className="size-2 shrink-0 rounded-full bg-fg-warning-secondary" aria-hidden="true" />
                        Aguardando pagamento{pagante ? ` de ${pagante.nome}` : ""}
                    </p>
                    <p className={cx("flex items-center gap-1.5 text-sm tabular-nums", urgente ? "font-semibold text-warning-primary" : "text-secondary")}>
                        <Clock className="size-4 shrink-0 text-fg-warning-secondary" aria-hidden="true" />
                        Expira em {tempoRestante(restante)}, às {horaDe(solicitacao.expiraEm)}
                    </p>
                </div>
            )}

            {processando && (
                <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2.5 ring-1 ring-border-secondary">
                    <RefreshCcw01 className="size-4 shrink-0 animate-spin text-fg-secondary" aria-hidden="true" />
                    <p className="text-sm font-semibold text-secondary">Pagamento registrado. Aplicando a {TIPO_OPERACAO_CURTO[solicitacao.tipo].toLowerCase()}.</p>
                </div>
            )}

            {falha && (
                <div role="alert" className="flex items-start gap-3 rounded-lg bg-error-primary px-3 py-2.5 ring-1 ring-error_subtle">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-fg-error-secondary" aria-hidden="true" />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-error-primary">Paga, mas não aplicada</p>
                        <p className="text-sm text-secondary">{solicitacao.motivoFalha ?? "As regras de negócio não valem mais para essa alteração."} Nada foi revertido.</p>
                    </div>
                </div>
            )}

            {comFinanceiro && solicitacao.escalonamento && (
                <div className="flex items-start gap-3 rounded-lg bg-warning-primary px-3 py-2.5 ring-1 ring-border-secondary">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-fg-warning-secondary" aria-hidden="true" />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-warning-primary">Com o financeiro desde {solicitacao.escalonamento.dataLabel}</p>
                        <p className="text-sm text-secondary">O ajuste é feito fora do Backstage. As unidades ficam bloqueadas até lá.</p>
                    </div>
                </div>
            )}

            {/* 3. O que fazer agora */}
            {aguardando && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <Button size="sm" color="secondary" iconLeading={copied ? Check : Copy01} onClick={() => copy(`https://${solicitacao.linkPagamento}`)}>
                            {copied ? "Link copiado" : "Copiar link"}
                        </Button>
                        <Button size="sm" color="secondary" iconLeading={Send01} onClick={() => setReenviarAberto(true)}>
                            Reenviar
                        </Button>
                        <span className="text-sm text-tertiary">
                            Enviado por {canalLabel(solicitacao.canalEnvio)} para {mascararDestino(solicitacao.destinatarioEnvio)}
                        </span>
                    </div>
                    {/* As duas saídas de exceção ficam juntas e longe do caminho comum: registrar
                        pagamento não volta, e não pode estar a um clique errado do "Copiar link". */}
                    <Dropdown.Root>
                        <Button size="sm" color="tertiary" iconTrailing={ChevronDown}>
                            Mais ações
                        </Button>
                        <Dropdown.Popover placement="bottom end" className="w-auto min-w-64">
                            <Dropdown.Menu
                                onAction={(chave) => {
                                    if (chave === "registrar") setPagamentoAberto(true);
                                    if (chave === "cancelar") setCancelarAberto(true);
                                }}
                            >
                                <Dropdown.Item id="registrar" icon={CheckCircle} label="Registrar pagamento recebido" />
                                <Dropdown.Item id="cancelar" icon={XCircle} label="Cancelar alteração" />
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown.Root>
                </div>
            )}

            {falha && (
                <div>
                    <Button size="sm" color="primary" onClick={() => setNotificarAberto(true)}>
                        Notificar financeiro
                    </Button>
                </div>
            )}

            {/* 4. Detalhe, sob demanda */}
            <details className="group border-t border-secondary pt-3">
                <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-md text-sm font-semibold text-tertiary transition duration-100 ease-linear hover:text-tertiary_hover [&::-webkit-details-marker]:hidden">
                    Detalhes da cobrança
                    <ChevronDown className="size-4 text-fg-quaternary transition-transform duration-100 ease-linear group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-border-secondary">
                    <ResumoFinanceiro linhas={solicitacao.linhas} semMoldura />
                    {(solicitacao.motivo || comFinanceiro) && (
                        <div className="flex flex-col gap-1 border-t border-secondary px-4 py-3 text-sm text-tertiary">
                            {solicitacao.motivo && (
                                <p>
                                    Motivo: {descreverMotivo(solicitacao.motivo)} · aberta por {solicitacao.operador}
                                </p>
                            )}
                            {comFinanceiro && solicitacao.escalonamento && <p>Relato ao financeiro: {solicitacao.escalonamento.relato}</p>}
                        </div>
                    )}
                </div>
            </details>

            <ModalReenviarLink isOpen={reenviarAberto} onClose={() => setReenviarAberto(false)} pedidoId={pedido.id} solicitacao={solicitacao} pagante={pagante} />
            <ModalRegistrarPagamento isOpen={pagamentoAberto} onClose={() => setPagamentoAberto(false)} pedidoId={pedido.id} solicitacao={solicitacao} />
            <ModalCancelarAlteracao isOpen={cancelarAberto} onClose={() => setCancelarAberto(false)} pedidoId={pedido.id} solicitacaoId={solicitacao.id} />
            <ModalNotificarFinanceiro isOpen={notificarAberto} onClose={() => setNotificarAberto(false)} pedidoId={pedido.id} solicitacao={solicitacao} />
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Reenviar: o destino aparece e pode ser corrigido antes de enviar   */
/* ------------------------------------------------------------------ */

function ModalReenviarLink({ isOpen, onClose, pedidoId, solicitacao, pagante }: { isOpen: boolean; onClose: () => void; pedidoId: string; solicitacao: Solicitacao; pagante?: Conta }) {
    /* Começa no último destino usado, não no cadastro: se o cliente disse "mudei de número" e o
       operador corrigiu, o próximo reenvio não volta para o número velho. */
    const [canal, setCanal] = useState<CanalEnvio>(solicitacao.canalEnvio);
    const [destinos, setDestinos] = useState<Record<CanalEnvio, string>>({
        email: solicitacao.canalEnvio === "email" ? solicitacao.destinatarioEnvio : (pagante?.email ?? ""),
        whatsapp: solicitacao.canalEnvio === "whatsapp" ? solicitacao.destinatarioEnvio : (pagante?.celular ?? ""),
    });
    const destino = destinos[canal];
    const valido = canal === "email" ? isEmailValido(destino) : isTelefoneValido(destino);

    const enviar = () => {
        reenviarLink(pedidoId, solicitacao.id, canal, destino.trim());
        toast.success(`Link reenviado por ${canalLabel(canal)} para ${destino.trim()}.`);
        onClose();
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-md">
                <Dialog aria-label="Reenviar link de pagamento">
                    <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div>
                            <h2 className="text-lg font-semibold text-primary">Reenviar link de pagamento</h2>
                            <p className="mt-1 text-sm text-tertiary">O link é o mesmo e o prazo não reinicia. Confira o contato com o cliente antes de enviar.</p>
                        </div>
                        <RadioGroup aria-label="Canal" value={canal} onChange={(valor) => setCanal(valor as CanalEnvio)} className="flex-row gap-6">
                            <RadioButton value="email" label="E-mail" />
                            <RadioButton value="whatsapp" label="WhatsApp" />
                        </RadioGroup>
                        <Input
                            label={canal === "email" ? "E-mail" : "WhatsApp"}
                            value={destino}
                            onChange={(valor) => setDestinos((atual) => ({ ...atual, [canal]: valor }))}
                            isInvalid={destino.length > 0 && !valido}
                            hint={destino.length > 0 && !valido ? (canal === "email" ? "Confira o e-mail." : "Confira o número com DDD.") : undefined}
                        />
                        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Voltar
                            </Button>
                            <Button size="md" color="primary" isDisabled={!valido} onClick={enviar}>
                                Reenviar por {canalLabel(canal)}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Registrar pagamento: a ação mais arriscada, com evidência           */
/* ------------------------------------------------------------------ */

function ModalRegistrarPagamento({ isOpen, onClose, pedidoId, solicitacao }: { isOpen: boolean; onClose: () => void; pedidoId: string; solicitacao: Solicitacao }) {
    const [referencia, setReferencia] = useState("");
    const valida = referencia.trim().length >= 4;

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-md">
                <Dialog aria-label="Registrar pagamento recebido">
                    <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div>
                            <h2 className="text-lg font-semibold text-primary">Registrar pagamento recebido</h2>
                            <p className="mt-1 text-sm text-tertiary">
                                Use só quando o pagamento de {formatarMoeda(solicitacao.total)} foi feito fora do link e você conferiu o comprovante. O Backstage não confirma isso sozinho.
                            </p>
                        </div>
                        <Input
                            label="Referência do comprovante"
                            placeholder="Horário e últimos dígitos da transação"
                            value={referencia}
                            onChange={setReferencia}
                            isRequired
                            hint="Fica no histórico, com o seu nome."
                        />
                        <Regra>A alteração é aplicada logo em seguida e não pode ser desfeita pelo Backstage.</Regra>
                        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Voltar
                            </Button>
                            <Button
                                size="md"
                                color="primary"
                                isDisabled={!valida}
                                onClick={() => {
                                    registrarPagamento(pedidoId, solicitacao.id, referencia.trim());
                                    toast.success("Pagamento registrado. Aplicando a alteração.");
                                    onClose();
                                }}
                            >
                                Registrar pagamento de {formatarMoeda(solicitacao.total)}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Cancelar alteração                                                 */
/* ------------------------------------------------------------------ */

function ModalCancelarAlteracao({ isOpen, onClose, pedidoId, solicitacaoId }: { isOpen: boolean; onClose: () => void; pedidoId: string; solicitacaoId: string }) {
    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-md">
                <Dialog aria-label="Cancelar esta alteração">
                    <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div>
                            <h2 className="text-lg font-semibold text-primary">Cancelar esta alteração?</h2>
                            <p className="mt-1 text-sm text-tertiary">O link para de funcionar, a reserva é liberada e nada é cobrado. As unidades voltam a ficar livres.</p>
                        </div>
                        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Manter alteração
                            </Button>
                            <Button
                                size="md"
                                color="primary-destructive"
                                onClick={() => {
                                    cancelarSolicitacao(pedidoId, solicitacaoId);
                                    toast.success("Alteração cancelada. Nada foi cobrado.");
                                    onClose();
                                }}
                            >
                                Cancelar alteração
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Notificar financeiro: escalonamento honesto, nunca finge reverter  */
/* ------------------------------------------------------------------ */

function ModalNotificarFinanceiro({ isOpen, onClose, pedidoId, solicitacao }: { isOpen: boolean; onClose: () => void; pedidoId: string; solicitacao: Solicitacao }) {
    const [cenario, setCenario] = useState<"falha-aplicacao" | "pagamento-indevido">("falha-aplicacao");
    const [relato, setRelato] = useState("");

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-md">
                <Dialog aria-label="Notificar financeiro">
                    <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div>
                            <h2 className="text-lg font-semibold text-primary">Notificar financeiro</h2>
                            <p className="mt-1 text-sm text-tertiary">Esta alteração não pode ser revertida pelo Backstage. O time financeiro trata o ajuste fora do sistema.</p>
                        </div>

                        <RadioGroupRadioButton
                            value={cenario}
                            onChange={(v) => setCenario(v as typeof cenario)}
                            items={[
                                { value: "falha-aplicacao", title: "Pagamento confirmado e aplicação falhou", secondaryTitle: "", description: "A cobrança foi paga, mas a troca ou transferência não pôde ser aplicada.", icon: AlertTriangle },
                                { value: "pagamento-indevido", title: "Pagamento pode ter sido registrado por engano", secondaryTitle: "", description: "Foi registrado como pago sem confirmação real do comprador.", icon: AlertTriangle },
                            ]}
                        />

                        <TextArea label="Relato para o financeiro" placeholder="Descreva o que aconteceu" value={relato} onChange={setRelato} rows={4} isRequired />

                        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Voltar
                            </Button>
                            <Button
                                size="md"
                                color="primary"
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
