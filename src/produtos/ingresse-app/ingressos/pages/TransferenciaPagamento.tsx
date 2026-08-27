import type { FC } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronRight, CreditCard01, CreditCard02, CreditCardRefresh, QrCode01, Wallet01, Wallet02 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { AppShell } from "../../components/AppShell";
import { GradientFill } from "../../components/GradientFill";
import { StatusBar } from "../../components/StatusBar";
import { getEvento, getItem } from "../data/eventos";

const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export function TransferenciaPagamento() {
    const navigate = useNavigate();
    const { eventId, id } = useParams();
    const evento = getEvento(eventId);
    const item = getItem(eventId, id);
    const taxa = item?.taxaTransferencia ?? 0;

    const base = `/ingresse-app/ingressos/transferir-pagamento/${evento.id}/${id}`;

    const metodos: { id: string; label: string; icon: FC<{ className?: string }>; tint: string; to?: string }[] = [
        { id: "pix", label: "Pix", icon: QrCode01, tint: "text-teal-500", to: `${base}/pix` },
        { id: "credito", label: "Cartão de Crédito", icon: CreditCard01, tint: "text-fg-secondary", to: `${base}/cartao` },
        { id: "debito", label: "Cartão de Débito", icon: CreditCard02, tint: "text-fg-secondary" },
        { id: "nupay", label: "Nupay", icon: Wallet02, tint: "text-purple-500" },
        { id: "apple", label: "Apple Pay", icon: Wallet01, tint: "text-primary" },
        { id: "google", label: "Google Pay", icon: Wallet01, tint: "text-blue-500" },
        { id: "picpay", label: "PicPay", icon: Wallet01, tint: "text-emerald-500" },
        { id: "click", label: "Click To Pay", icon: CreditCardRefresh, tint: "text-orange-500" },
    ];

    return (
        <AppShell showTabBar={false} scrollClassName="bg-secondary">
            <div className="min-h-full bg-secondary">
                <StatusBar tone="dark" />

                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={() => navigate(-1)}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <span className="text-sm text-tertiary">
                        Tempo restante: <span className="font-semibold text-secondary">19m15s</span>
                    </span>
                </div>
                <h1 className="px-5 pt-3 text-xl font-bold text-primary">Finalizar compra</h1>

                {/* Card do evento */}
                <div className="px-5 pt-4">
                    <div className="rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                        <div className="flex gap-3">
                            <div className="size-14 shrink-0 overflow-hidden rounded-xl">
                                <GradientFill gradient={evento.gradient} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-primary">{evento.title}</p>
                                <p className="truncate text-sm text-tertiary">{item?.title}</p>
                                <p className="truncate text-sm text-tertiary">{item?.tipo}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-secondary pt-3">
                            <span className="text-sm font-semibold text-primary">Taxa de transferência</span>
                            <span className="text-sm font-semibold text-primary">{brl(taxa)}</span>
                        </div>
                    </div>
                </div>

                {/* Métodos de pagamento */}
                <h2 className="px-5 pt-6 pb-2 text-md font-bold text-primary">Escolha como pagar</h2>
                <div className="flex flex-col gap-3 px-5 pb-8">
                    {metodos.map((m) => {
                        const Icon = m.icon;
                        return (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => m.to && navigate(m.to)}
                                className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-left ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                            >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                                    <Icon className={cx("size-5", m.tint)} />
                                </span>
                                <span className="flex-1 text-sm font-semibold text-primary">{m.label}</span>
                                <ChevronRight className="size-5 shrink-0 text-fg-quaternary" />
                            </button>
                        );
                    })}
                </div>
            </div>
        </AppShell>
    );
}
