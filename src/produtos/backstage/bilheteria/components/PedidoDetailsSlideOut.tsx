import { useState } from "react";
import { Check, Copy01, Download01, FaceId, Mail01, QrCode01, Send01, SlashCircle01, Ticket02, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { toast } from "sonner";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { formatBRL, isValidEmail } from "../data/catalogo";
import { PEDIDO_STATUS_META, PEDIDO_TIPO_LABEL, type Pedido } from "../data/pedidos";
import { EnviarModal, type CanalEnvio } from "./EnviarModal";

export type ResendChannel = "email" | "whatsapp";
export type PedidoDownload = "pdf" | "zebra" | "csv";

interface PedidoDetailsSlideOutProps {
    pedido: Pedido | null;
    onClose: () => void;
    onResend: (pedido: Pedido, canal: ResendChannel, destino: string) => void;
    /** Baixa os ingressos do pedido no formato escolhido. */
    onDownload: (pedido: Pedido, formato: PedidoDownload) => void;
}

/** Slideout de detalhes do pedido, com ações e a lista de itens do pedido. */
export function PedidoDetailsSlideOut({ pedido, onClose, onResend, onDownload }: PedidoDetailsSlideOutProps) {
    const [canal, setCanal] = useState<CanalEnvio | null>(null);

    const itens = pedido?.itens ?? [];

    const isCancelled = pedido?.status === "cancelado";
    /** Venda sem identificação não tem destino salvo; o modal pergunta. */
    const emailDoPedido = pedido && isValidEmail(pedido.destinatario) ? pedido.destinatario : undefined;
    /** No link o que circula é o link; nos demais, os próprios ingressos. */
    const assuntoDoPedido = pedido?.tipo === "link" ? "Link de pagamento" : "Ingressos";

    const close = () => {
        setTerm("");
        setCanal(null);
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
                                    <p className="text-sm text-secondary">Sessões: {pedido.sessions}</p>
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
                                    {/*
                                      Sem conta, o ingresso fica em limbo: comprado, pago, mas
                                      fora da carteira. Quem atende na porta precisa ver isso
                                      aqui em vez de descobrir com a pessoa na frente.
                                    */}
                                    {pedido.contaPendente && (
                                        <Field label="Cadastro:">
                                            <span className="text-warning-primary">
                                                Pendente — o comprador ainda não concluiu o cadastro, então os ingressos não estão na
                                                carteira dele.
                                            </span>
                                        </Field>
                                    )}
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

                                {/* Pedido cancelado não tem ação possível — o bloco todo sai. */}
                                {!isCancelled && (
                                    <>
                                        <hr className="border-secondary" />

                                        <div className="flex flex-col gap-3">
                                            <h3 className="text-md font-semibold text-primary">Ações</h3>
                                            <div className="flex flex-wrap gap-3">
                                                {/* Pago pelo saldo: os ingressos já existem, então dá para baixar e imprimir. */}
                                                {pedido.tipo === "saldo" && (
                                                    <>
                                                        <Button
                                                            size="md"
                                                            color="secondary"
                                                            iconLeading={Download01}
                                                            onClick={() => onDownload(pedido, "pdf")}
                                                        >
                                                            Baixar PDF
                                                        </Button>
                                                        <Button
                                                            size="md"
                                                            color="secondary"
                                                            iconLeading={Ticket02}
                                                            onClick={() => onDownload(pedido, "zebra")}
                                                        >
                                                            Imprimir na zebra
                                                        </Button>
                                                        <Button
                                                            size="md"
                                                            color="secondary"
                                                            iconLeading={Download01}
                                                            onClick={() => onDownload(pedido, "csv")}
                                                        >
                                                            Baixar .csv
                                                        </Button>
                                                    </>
                                                )}

                                                {/*
                                              O envio passa pelo modal: em venda sem identificação o pedido não
                                              tem e-mail nem telefone, então o destino é informado na hora.
                                            */}
                                                {pedido.status !== "cancelado" && (
                                                    <>
                                                        <Button
                                                            size="md"
                                                            color="secondary"
                                                            iconLeading={Mail01}
                                                            onClick={() => setCanal("email")}
                                                        >
                                                            Enviar por e-mail
                                                        </Button>
                                                        <Button
                                                            size="md"
                                                            color="secondary"
                                                            iconLeading={<WhatsAppIcon data-icon className="size-5 text-[#25d366]" />}
                                                            onClick={() => setCanal("whatsapp")}
                                                        >
                                                            Enviar por WhatsApp
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <hr className="border-secondary" />

                                <div className="flex flex-col gap-3">
                                    <h3 className="text-md font-semibold text-primary">Itens</h3>
                                    {/*
                                      A quantidade sai do meio do nome e vira pílula à
                                      esquerda; o valor da linha ancora à direita. Assim a
                                      lista é varrida por coluna — quanto, o quê, quanto custa.
                                    */}
                                    <ul className="flex flex-col gap-2">
                                        {itens.map((item) => {
                                            const AccessIcon = item.access === "facial" ? FaceId : QrCode01;

                                            return (
                                                <li key={item.id} className="flex items-start gap-3 rounded-lg bg-secondary p-3">
                                                    <span className="flex h-7 min-w-9 shrink-0 items-center justify-center rounded-md bg-primary px-1.5 text-sm font-semibold text-secondary tabular-nums ring-1 ring-border-secondary">
                                                        {item.quantity}
                                                    </span>
                                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                        <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-primary">
                                                            {item.access && (
                                                                <AccessIcon className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                                            )}
                                                            <span className="truncate">{item.name}</span>
                                                        </span>
                                                        {item.subtitle && <span className="truncate text-sm text-tertiary">{item.subtitle}</span>}
                                                        {item.lote && <span className="truncate text-sm text-tertiary">{item.lote}</span>}
                                                    </div>
                                                    {item.unitPrice !== undefined && (
                                                        <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">
                                                            {formatBRL(item.unitPrice * item.quantity)}
                                                        </span>
                                                    )}
                                                </li>
                                            );
                                        })}

                                        {itens.length === 0 && (
                                            <li className="px-4 py-8 text-center text-sm text-tertiary">
                                                Este pedido não tem itens.
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                {/*
                                  Histórico em linha do tempo: "foi enviado no seu e-mail dia X"
                                  é a frase que o atendimento precisa dar ao cliente, e ver os
                                  envios anteriores evita reenviar e duplicar ingresso na porta.
                                  Ordem do mais recente para o mais antigo.
                                */}
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-md font-semibold text-primary">Histórico</h3>

                                    {pedido.envios && pedido.envios.length > 1 && (
                                        // A consequência mora na portaria: sem dizer isso, o aviso vira curiosidade.
                                        <p className="text-sm text-warning-primary">
                                            Enviado {pedido.envios.length} vezes. Todas as cópias têm o mesmo código QR: na portaria, só a
                                            primeira leitura passa.
                                        </p>
                                    )}

                                    <ul className="flex flex-col gap-4">
                                        {pedido.status === "cancelado" && (
                                            <HistoricoItem
                                                icon={SlashCircle01}
                                                titulo={`Cancelado por ${pedido.emissor}`}
                                                data={pedido.resentAt ?? pedido.dataVendaLabel}
                                            />
                                        )}

                                        {[...(pedido.envios ?? [])].reverse().map((envio, indice) => (
                                            <HistoricoItem
                                                key={`${envio.at}-${indice}`}
                                                icon={Send01}
                                                titulo={`${assuntoDoPedido} enviado por ${envio.canal === "email" ? "e-mail" : "WhatsApp"} para ${envio.destino}`}
                                                data={envio.at}
                                            />
                                        ))}

                                        <HistoricoItem
                                            icon={Check}
                                            titulo={`Pedido emitido por ${pedido.emissor}`}
                                            data={pedido.dataVendaLabel}
                                        />
                                    </ul>
                                </div>

                            </div>

                            <div className="flex items-center justify-end border-t border-secondary px-6 py-4">
                                <Button size="md" color="secondary" onClick={close}>
                                    Fechar
                                </Button>
                            </div>
                        </>
                    )}
                </AriaDialog>
            </AriaModal>

            {pedido && (
                <EnviarModal
                    canal={canal}
                    assunto={pedido.tipo === "saldo" ? "os ingressos" : "o link de pagamento"}
                    valorInicial={canal === "email" ? emailDoPedido : undefined}
                    onClose={() => setCanal(null)}
                    onConfirm={(canalEscolhido, destino) => {
                        setCanal(null);
                        onResend(pedido, canalEscolhido, destino);
                    }}
                />
            )}
        </AriaModalOverlay>
    );
}

/** Linha da timeline: ícone em círculo, o que aconteceu e quando. */
const HistoricoItem = ({
    icon: Icon,
    titulo,
    data,
}: {
    icon: React.FC<{ className?: string }>;
    titulo: string;
    data: string;
}) => (
    <li className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-fg-secondary ring-1 ring-border-secondary">
            <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-primary">{titulo}</span>
            <span className="text-sm text-tertiary tabular-nums">{data}</span>
        </div>
    </li>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col">
        <dt className="text-sm text-tertiary">{label}</dt>
        <dd className="text-sm text-secondary">{children}</dd>
    </div>
);

/** Glifo de marca do WhatsApp — não existe no @untitledui/icons. */
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.06 0 1.21.89 2.39 1.01 2.55.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
);
