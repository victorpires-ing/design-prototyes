import { toast } from "sonner";
import { Check, Copy01, Download01, Printer, Receipt, RefreshCcw01, SlashCircle01, SwitchHorizontal01, UserX01, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { ITENS_POR_ID, SESSAO_DO_ITEM, currency } from "../data/bilheteria-data";
import { STATUS_META, TIPO_LABEL, type Pedido } from "../data/bilheteria-store";
import { AcessoIcon } from "./ItensVendaSelector";

export function PedidoDetailsSlideOut({ pedido, onClose, onCancelar }: { pedido: Pedido | null; onClose: () => void; onCancelar: (id: string) => void }) {
    const copiar = async () => {
        if (!pedido?.link) return;
        try {
            await navigator.clipboard?.writeText(`https://${pedido.link}`);
            toast.success("Link copiado");
        } catch {
            toast.message(`https://${pedido.link}`);
        }
    };

    const meta = pedido ? STATUS_META[pedido.status] : null;

    return (
        <AriaModalOverlay
            isOpen={!!pedido}
            onOpenChange={(open) => { if (!open) onClose(); }}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx("fixed inset-0 z-50 flex justify-end bg-overlay/70 outline-hidden backdrop-blur-[2px]", isEntering && "duration-300 ease-out animate-in fade-in", isExiting && "duration-200 ease-in animate-out fade-out")
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx("h-full w-full max-w-[560px] bg-primary_alt shadow-xl outline-hidden", isEntering && "duration-300 ease-out animate-in slide-in-from-right", isExiting && "duration-200 ease-in animate-out slide-out-to-right")
                }
            >
                <AriaDialog className="flex h-full flex-col outline-hidden">
                    <div className="flex items-center justify-between gap-4 border-b border-secondary px-6 py-5">
                        <h2 className="text-lg font-semibold text-primary">Detalhes do pedido</h2>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                    </div>

                    {pedido && meta && (
                        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
                            {/* Meta */}
                            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                                <Row label="Status">
                                    <BadgeWithDot size="sm" type="modern" color={meta.color}>{meta.label}</BadgeWithDot>
                                </Row>
                                <Row label="Meio de pagamento"><span className="text-sm text-secondary">{TIPO_LABEL[pedido.tipo]}</span></Row>
                                <Row label="Emissor responsável"><span className="text-sm text-secondary">{pedido.emissor}</span></Row>
                                <Row label="Data de venda"><span className="text-sm text-secondary tabular-nums">{pedido.data}</span></Row>
                                <Row label="ID do pedido"><span className="text-sm break-all text-secondary tabular-nums">{pedido.id}</span></Row>
                                <Row label="Valor"><span className="text-sm font-semibold text-primary tabular-nums">{currency.format(pedido.valor)}</span></Row>
                            </dl>

                            {/* Comprador */}
                            {pedido.comprador ? (
                                <div className="flex items-center gap-3 rounded-xl bg-secondary p-4">
                                    <Avatar size="md" initials={pedido.comprador.iniciais} alt={pedido.comprador.nome} />
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate text-sm font-semibold text-primary">{pedido.comprador.nome}</span>
                                        <span className="truncate text-sm text-tertiary">{pedido.comprador.emailExibicao}</span>
                                        <span className="truncate text-xs text-tertiary">CPF {pedido.comprador.cpf}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 rounded-xl bg-secondary p-4">
                                    <Avatar size="md" icon={UserX01} alt="Sem identificação" />
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate text-sm font-semibold text-primary">Venda sem identificação</span>
                                        <span className="truncate text-sm text-tertiary">Sem vínculo com conta</span>
                                    </div>
                                </div>
                            )}

                            {/* Link de pagamento */}
                            {pedido.link && (
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-sm font-medium text-secondary">Link de pagamento</span>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <div className="flex min-w-0 flex-1 items-center rounded-lg bg-primary_alt px-3 py-2.5 text-sm text-tertiary ring-1 ring-border-primary">
                                            <span className="truncate">{pedido.link}</span>
                                        </div>
                                        <Button size="md" color="secondary" iconLeading={Copy01} onClick={copiar}>Copiar link</Button>
                                    </div>
                                </div>
                            )}

                            {/* Pix copia e cola */}
                            {pedido.pixCode && (
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-sm font-medium text-secondary">Pix copia e cola</span>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <div className="flex min-w-0 flex-1 items-center rounded-lg bg-primary_alt px-3 py-2.5 text-sm text-tertiary ring-1 ring-border-primary">
                                            <span className="truncate">{pedido.pixCode}</span>
                                        </div>
                                        <Button
                                            size="md"
                                            color="secondary"
                                            iconLeading={Copy01}
                                            onClick={async () => {
                                                try { await navigator.clipboard?.writeText(pedido.pixCode!); toast.success("Código Pix copiado"); }
                                                catch { toast.message(pedido.pixCode!); }
                                            }}
                                        >
                                            Copiar código
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Ações */}
                            <div className="flex flex-col gap-3">
                                <h3 className="text-md font-semibold text-primary">Ações</h3>
                                <div className="flex flex-wrap gap-2">
                                    {pedido.status === "aprovado" && (
                                        <>
                                            <Button size="sm" color="secondary" iconLeading={Printer} onClick={() => toast.success("Preparando impressão do ingresso…")}>Imprimir</Button>
                                            <Button size="sm" color="secondary" iconLeading={Download01} onClick={() => toast.success("PDF do ingresso baixado")}>Baixar PDF</Button>
                                            <Button size="sm" color="secondary" iconLeading={Receipt} onClick={() => toast.success("Nota baixada")}>Nota</Button>
                                        </>
                                    )}
                                    {pedido.link && pedido.status !== "cancelado" && (
                                        <Button size="sm" color="secondary" iconLeading={RefreshCcw01} onClick={() => toast.success("Link reenviado ao comprador")}>Reenviar link</Button>
                                    )}
                                    <Button size="sm" color="secondary-destructive" iconLeading={SlashCircle01} isDisabled={pedido.status === "cancelado"} onClick={() => onCancelar(pedido.id)}>Cancelar pedido</Button>
                                </div>
                            </div>

                            {/* Itens */}
                            <div className="flex flex-col gap-3">
                                <h3 className="text-md font-semibold text-primary">Itens</h3>
                                <ul className="flex flex-col gap-2">
                                    {pedido.itens.map((v) => {
                                        const item = ITENS_POR_ID[v.itemId];
                                        return (
                                            <li key={v.itemId} className="flex items-start gap-3 rounded-lg bg-secondary p-3">
                                                <span className="flex h-7 min-w-9 shrink-0 items-center justify-center rounded-md bg-primary_alt px-1.5 text-xs font-semibold text-secondary tabular-nums ring-1 ring-border-secondary">{v.qtd}</span>
                                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                                                        <AcessoIcon acesso={item?.acesso} className="size-3.5" />
                                                        <span className="truncate">{item?.nome}</span>
                                                    </span>
                                                    <span className="truncate text-xs text-tertiary">{[item?.grupo, item?.tipo].filter(Boolean).join(" - ")}</span>
                                                    <span className="truncate text-xs text-tertiary">{SESSAO_DO_ITEM[v.itemId]}</span>
                                                </div>
                                                <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{currency.format((item?.preco ?? 0) * v.qtd)}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            {/* Histórico */}
                            <div className="flex flex-col gap-3">
                                <h3 className="text-md font-semibold text-primary">Histórico</h3>
                                <ul className="flex flex-col gap-4">
                                    {pedido.status === "cancelado" && (
                                        <HistItem icon={SlashCircle01} titulo={`Cancelado por ${pedido.emissor}`} data={`${pedido.data} às 14:20`} />
                                    )}
                                    {pedido.comprador && (
                                        <HistItem icon={SwitchHorizontal01} titulo={`Transferência realizada para ${pedido.comprador.emailExibicao}`} data={`${pedido.data} às 14:20`} />
                                    )}
                                    <HistItem icon={Check} titulo={`Pedido emitido por ${pedido.emissor}`} data={`${pedido.data} às 14:20`} />
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 border-t border-secondary px-6 py-4">
                        <Button size="sm" color="secondary" onClick={onClose}>Fechar</Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-0.5">
        <dt className="text-xs text-tertiary">{label}</dt>
        <dd>{children}</dd>
    </div>
);

const HistItem = ({ icon: Icon, titulo, data }: { icon: React.FC<{ className?: string }>; titulo: string; data: string }) => (
    <li className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-fg-secondary ring-1 ring-border-secondary">
            <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-primary">{titulo}</span>
            <span className="text-xs text-tertiary tabular-nums">{data}</span>
        </div>
    </li>
);
