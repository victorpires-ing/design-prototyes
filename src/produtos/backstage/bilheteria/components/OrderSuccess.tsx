import { useState } from "react";
import { FileIcon } from "@untitledui/file-icons";
import { CheckCircle, Copy01, Ticket02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import type { Buyer } from "../data/catalogo";
import { BuyerIdentity } from "./BuyerStep";

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
}: OrderSuccessProps) {
    const [copied, setCopied] = useState(false);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(paymentLink);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard indisponível — ignora silenciosamente */
        }
    };

    return (
        <div className="flex w-full max-w-[800px] flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-3">
                <FeaturedIcon icon={CheckCircle} color="success" theme="dark" size="lg" className="rounded-full" />
                <span className="rounded-md bg-secondary px-2 py-1 text-sm text-tertiary ring-1 ring-border-secondary">{orderId}</span>
                <h2 className="text-display-xs font-bold text-primary">Pedido emitido!</h2>
                <p className="text-center text-sm text-tertiary">
                    {channel === "link"
                        ? "O link de pagamento foi enviado para o e-mail do comprador."
                        : "Os itens foram enviados para o comprador."}
                </p>
            </div>

            <section className="flex w-full flex-col gap-4 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
                {buyer ? (
                    <BuyerIdentity buyer={buyer} />
                ) : fallbackEmail ? (
                    <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-semibold text-primary">Comprador ainda sem conta na Ingresse</p>
                        <p className="text-sm text-tertiary">
                            Os ingressos vão para <strong className="font-semibold text-secondary">{fallbackEmail}</strong>. Peça que o
                            comprador crie uma conta Ingresse com esse mesmo e-mail para acessá-los na carteira.
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-tertiary">Venda realizada sem identificação do comprador.</p>
                )}

                <hr className="border-secondary" />

                {channel === "link" ? (
                    <div className="flex flex-col gap-1.5">
                        <p className="text-sm font-medium text-secondary">Link de pagamento</p>
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            <input
                                readOnly
                                value={paymentLink}
                                aria-label="Link de pagamento"
                                className="min-w-0 flex-1 truncate rounded-lg bg-primary px-3 py-2 text-sm text-primary ring-1 ring-border-primary shadow-xs ring-inset"
                            />
                            <Button size="md" color="secondary" iconLeading={Copy01} onClick={copyLink}>
                                {copied ? "Copiado" : "Copiar"}
                            </Button>
                            {buyer && (
                                <Button
                                    size="md"
                                    color="secondary"
                                    iconLeading={<WhatsAppIcon data-icon className="size-5 text-[#25d366]" />}
                                    href={`https://wa.me/?text=${encodeURIComponent(paymentLink)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Enviar por Whatsapp
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-primary">Faça download do código QR dos itens</p>
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
                    </div>
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
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.06 0 1.21.89 2.39 1.01 2.55.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
);
