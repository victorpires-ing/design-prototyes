import { useState } from "react";
import { FileIcon } from "@untitledui/file-icons";
import { Check, CheckCircle, Copy01, Mail01, Ticket02 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { useClipboard } from "@/hooks/use-clipboard";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { EVENTO, type Buyer } from "../data/catalogo";
import { QrMock } from "./QrMock";
import { BuyerNoAccount } from "./BuyerStep";
import { EnviarModal, type CanalEnvio } from "./EnviarModal";

export type OrderChannel = "link" | "saldo";

interface OrderSuccessProps {
    orderId: string;
    channel: OrderChannel;
    buyer: Buyer | null;
    fallbackEmail?: string;
    paymentLink: string;
    onNewSale: () => void;
    onManageOrders: () => void;
    onDownload: (format: "pdf" | "zebra" | "csv") => void;
    /** Envia o link (ou os ingressos) pelo canal escolhido. */
    onSend: (canal: CanalEnvio, destino: string) => void;
}

/** Tela final — pedido emitido, com link de pagamento ou download dos QR codes. */
export function OrderSuccess({
    orderId,
    channel,
    buyer,
    fallbackEmail,
    paymentLink,
    onNewSale,
    onManageOrders,
    onDownload,
    onSend,
}: OrderSuccessProps) {
    const { copy, copied } = useClipboard();
    /** Canal em que o modal de envio está aberto. */
    const [canal, setCanal] = useState<CanalEnvio | null>(null);

    const assunto = channel === "link" ? "o link de pagamento" : "os ingressos";

    return (
        // pt-12: com os 8px que já vinham do header, dá os 56px de respiro
        // entre o título da página e o check da confirmação.
        <div className="flex w-full max-w-[800px] flex-col items-center gap-5 pt-12">
            <div className="flex flex-col items-center gap-3">
                <FeaturedIcon icon={CheckCircle} color="success" theme="dark" size="lg" className="rounded-full" />
                <h2 className="text-display-xs font-bold text-primary">Pedido emitido!</h2>
                {/* O número vem depois do título: primeiro a confirmação, depois a referência. */}
                <span className="rounded-md bg-secondary px-2 py-1 text-sm text-tertiary ring-1 ring-border-secondary">{orderId}</span>
            </div>

            <section className="flex w-full flex-col gap-4 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
                {channel === "link" ? (
                    <>
                        {/*
                          O QR abre o bloco porque é o caminho mais curto do balcão:
                          quem não acessa e-mail aponta a câmera e paga no próprio
                          celular. Enviar o link é a alternativa, não o padrão.
                        */}
                        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                            <QrMock value={paymentLink} className="size-36 shrink-0 rounded-lg" />
                            <div className="flex min-w-0 flex-col gap-1">
                                <p className="text-md font-semibold text-primary">Mostre esse código para o comprador</p>
                                <p className="text-sm text-tertiary">
                                    Ele aponta a câmera do celular, abre o checkout no próprio aparelho e escolhe como pagar.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="h-px flex-1 bg-border-secondary" aria-hidden="true" />
                            <span className="text-sm text-tertiary">ou envie o link para ele</span>
                            <span className="h-px flex-1 bg-border-secondary" aria-hidden="true" />
                        </div>

                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            <InputGroup
                                aria-label="Link de pagamento"
                                className="min-w-0 flex-1"
                                trailingAddon={
                                    <Button
                                        color="secondary"
                                        iconLeading={copied ? Check : Copy01}
                                        onClick={() => copy(`https://${paymentLink}`)}
                                    >
                                        {copied ? "Copiado" : "Copiar"}
                                    </Button>
                                }
                            >
                                <InputBase isReadOnly value={paymentLink} />
                            </InputGroup>
                            <Button size="md" color="secondary" iconLeading={WhatsAppBadge} onClick={() => setCanal("whatsapp")}>
                                Enviar por Whatsapp
                            </Button>
                            <Button size="md" color="secondary" iconLeading={Mail01} onClick={() => setCanal("email")}>
                                Enviar por e-mail
                            </Button>
                        </div>

                        {/* Prazo à vista: o link segura estoque, e quem vende precisa saber até quando. */}
                        <p className="text-sm text-tertiary">
                            O link vale por {EVENTO.validadeLinkDias} dias. Enquanto não for pago, os ingressos seguem reservados para este
                            pedido.
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-md font-semibold text-primary">Faça download do código QR dos itens</p>
                        <div className="grid gap-3 md:grid-cols-3">
                            <DownloadCard
                                label="PDF"
                                icon={<FileIcon type="pdf" variant="solid" className="size-8" />}
                                onClick={() => onDownload("pdf")}
                            />
                            <DownloadCard
                                label="Zebra"
                                icon={<Ticket02 className="size-6 text-fg-secondary" aria-hidden="true" />}
                                onClick={() => onDownload("zebra")}
                            />
                            <DownloadCard
                                label="Planilha .csv"
                                icon={<FileIcon type="csv" variant="solid" className="size-8" />}
                                onClick={() => onDownload("csv")}
                            />
                        </div>

                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm text-tertiary">Prefere enviar o PDF direto para o comprador?</p>
                            <div className="flex flex-wrap gap-2">
                                <Button size="md" color="secondary" iconLeading={WhatsAppBadge} onClick={() => setCanal("whatsapp")}>
                                    Enviar por Whatsapp
                                </Button>
                                <Button size="md" color="secondary" iconLeading={Mail01} onClick={() => setCanal("email")}>
                                    Enviar por e-mail
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* Comprador em cartão próprio: é conferência, não ação. */}
            <section className="flex w-full flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
                <p className="text-sm font-semibold text-primary">Comprador</p>
                {buyer ? (
                    <div className="flex items-center gap-3">
                        <Avatar size="md" initials={buyer.initials} alt={buyer.name} />
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-semibold text-primary">{buyer.name}</span>
                            <span className="truncate text-sm text-tertiary">
                                {buyer.email}
                                {buyer.maskedDocument && (
                                    <>
                                        <span aria-hidden="true"> • </span>
                                        {buyer.maskedDocument}
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                ) : fallbackEmail ? (
                    <div className="flex flex-col gap-3">
                        <BuyerNoAccount email={fallbackEmail} />
                        <p className="text-sm text-tertiary">
                            Os ingressos vão para <strong className="font-semibold text-secondary">{fallbackEmail}</strong>. Peça que o
                            comprador crie uma conta Ingresse com esse mesmo e-mail para acessá-los na carteira.
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-tertiary">Venda realizada sem identificação do comprador.</p>
                )}
            </section>

            <div className="flex w-full flex-col-reverse gap-3 md:flex-row md:justify-end">
                <Button size="md" color="secondary" onClick={onManageOrders}>
                    Gerir pedidos
                </Button>
                <Button size="md" color="primary" onClick={onNewSale}>
                    Nova venda
                </Button>
            </div>

            {/* Sem conta vinculada não há telefone nem e-mail no cadastro — o modal pergunta. */}
            <EnviarModal
                canal={canal}
                assunto={assunto}
                valorInicial={canal === "email" ? (buyer?.email ?? fallbackEmail) : buyer?.phone}
                onClose={() => setCanal(null)}
                onConfirm={(canalEscolhido, destino) => {
                    setCanal(null);
                    onSend(canalEscolhido, destino);
                }}
            />
        </div>
    );
}

const DownloadCard = ({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 rounded-lg bg-primary px-4 py-3 text-left ring-1 ring-border-primary shadow-xs transition duration-100 ease-linear hover:bg-primary_hover"
    >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md ring-1 ring-border-secondary">{icon}</span>
        <span className="text-md font-medium text-primary">{label}</span>
    </button>
);

/** Glifo de marca do WhatsApp — não existe no @untitledui/icons. */
/** Selo verde do WhatsApp: no print o glifo é branco sobre o círculo da marca. */
const WhatsAppBadge = () => (
    <span data-icon className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#25d366]">
        <WhatsAppIcon aria-hidden="true" className="size-3.5 text-white" />
    </span>
);

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.06 0 1.21.89 2.39 1.01 2.55.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
);
