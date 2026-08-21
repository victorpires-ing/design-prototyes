import { useMemo, useState } from "react";
import { Copy01, RefreshCcw01, SearchLg, SlashCircle01, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { toast } from "sonner";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { InputBase } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { formatBRL } from "../data/catalogo";
import { PEDIDO_STATUS_META, PEDIDO_TIPO_LABEL, type Pedido } from "../data/pedidos";

interface PedidoDetailsSlideOutProps {
    pedido: Pedido | null;
    onClose: () => void;
    onCancelPedido: (pedido: Pedido) => void;
    onResend: (pedido: Pedido) => void;
}

/** Slideout de detalhes do pedido, com ações e a lista de itens do pedido. */
export function PedidoDetailsSlideOut({ pedido, onClose, onCancelPedido, onResend }: PedidoDetailsSlideOutProps) {
    const [term, setTerm] = useState("");

    const itens = useMemo(() => {
        if (!pedido) return [];
        const query = term.trim().toLowerCase();
        if (!query) return pedido.itens;
        return pedido.itens.filter((item) => `${item.name} ${item.subtitle ?? ""}`.toLowerCase().includes(query));
    }, [pedido, term]);

    const isCancelled = pedido?.status === "cancelado";

    const close = () => {
        setTerm("");
        onClose();
    };

    return (
        <AriaModalOverlay
            isOpen={Boolean(pedido)}
            onOpenChange={(open) => !open && close()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex justify-end bg-overlay/70 outline-hidden backdrop-blur-[2px]",
                    isEntering && "duration-300 ease-out animate-in fade-in",
                    isExiting && "duration-200 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "h-full w-full max-w-[550px] bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                        isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                    )
                }
            >
                <AriaDialog className="flex h-full flex-col outline-hidden">
                    {pedido && (
                        <>
                            <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4">
                                <h2 className="text-lg font-semibold text-primary">Detalhes do pedido</h2>
                                <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={close} />
                            </div>

                            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-semibold text-primary">{pedido.title}</p>
                                    <p className="text-sm text-secondary">sessions: {pedido.sessions}</p>
                                    <p className="text-sm text-tertiary">{pedido.sessionShort}</p>
                                </div>

                                <hr className="border-secondary" />

                                <dl className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <dt className="text-sm text-tertiary">Status:</dt>
                                        <dd>
                                            <BadgeWithDot size="sm" type="pill-color" color={PEDIDO_STATUS_META[pedido.status].color}>
                                                {PEDIDO_STATUS_META[pedido.status].label}
                                            </BadgeWithDot>
                                        </dd>
                                    </div>
                                    <Field label="Emissor responsável:">{pedido.emissor}</Field>
                                    <Field label="ID do pedido:">
                                        <span className="break-all">{pedido.id}</span>
                                    </Field>
                                    <Field label="Destinatário:">{pedido.destinatario}</Field>
                                    <Field label="Data da venda:">{pedido.dataVendaLabel}</Field>
                                    <Field label="Valor:">{formatBRL(pedido.valor)}</Field>
                                    <Field label="Tipo:">{PEDIDO_TIPO_LABEL[pedido.tipo]}</Field>
                                </dl>

                                {pedido.tipo === "link" && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            readOnly
                                            value={pedido.paymentLink}
                                            aria-label="Link de pagamento"
                                            className="min-w-0 flex-1 truncate rounded-lg bg-primary px-3 py-2 text-sm text-tertiary ring-1 ring-border-primary shadow-xs ring-inset"
                                        />
                                        <Button
                                            size="md"
                                            color="secondary"
                                            iconLeading={Copy01}
                                            onClick={() => {
                                                navigator.clipboard?.writeText(pedido.paymentLink);
                                                toast.success("Link copiado");
                                            }}
                                        >
                                            Copiar
                                        </Button>
                                    </div>
                                )}

                                <hr className="border-secondary" />

                                <div className="flex flex-col gap-3">
                                    <h3 className="text-md font-semibold text-primary">Ações</h3>
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            size="md"
                                            color="secondary"
                                            iconLeading={SlashCircle01}
                                            isDisabled={isCancelled}
                                            onClick={() => onCancelPedido(pedido)}
                                        >
                                            Cancelar
                                        </Button>
                                        {pedido.tipo === "link" && pedido.status === "pendente" && (
                                            <Button
                                                size="md"
                                                color="secondary"
                                                iconLeading={RefreshCcw01}
                                                onClick={() => onResend(pedido)}
                                            >
                                                Reenviar link
                                            </Button>
                                        )}
                                    </div>
                                    {pedido.resentAt && <p className="text-sm text-tertiary">Último reenvio em {pedido.resentAt}</p>}
                                </div>

                                <div className="rounded-xl bg-primary ring-1 ring-border-secondary">
                                    <div className="flex flex-col gap-1.5 border-b border-secondary p-4">
                                        <label htmlFor="pedido-item-search" className="text-sm font-medium text-secondary">
                                            Busca
                                        </label>
                                        <InputBase
                                            id="pedido-item-search"
                                            size="sm"
                                            icon={SearchLg}
                                            value={term}
                                            onChange={(event) => setTerm(event.target.value)}
                                            placeholder="Buscar por nome do item"
                                        />
                                    </div>

                                    <p className="border-b border-secondary px-4 py-2.5 text-sm text-tertiary">Item</p>

                                    {itens.map((item) => (
                                        <div key={item.id} className="flex flex-col border-b border-secondary px-4 py-3 last:border-b-0">
                                            <p className="text-sm text-primary">
                                                {item.quantity > 1 && <span className="text-tertiary">{item.quantity}x </span>}
                                                {item.name}
                                            </p>
                                            {item.subtitle && <p className="text-sm text-tertiary">{item.subtitle}</p>}
                                        </div>
                                    ))}

                                    {itens.length === 0 && (
                                        <p className="px-4 py-8 text-center text-sm text-tertiary">Nenhum item encontrado para a busca.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-secondary px-6 py-4">
                                <Button size="md" color="secondary" onClick={close}>
                                    Cancel
                                </Button>
                                <Button size="md" color="primary" onClick={close}>
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col">
        <dt className="text-sm text-tertiary">{label}</dt>
        <dd className="text-sm text-secondary">{children}</dd>
    </div>
);
