import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Coins01, Link01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { formatBRL, type Buyer } from "../data/catalogo";
import { cartCount, cartLines, cartTotal, type Cart, type CartLine } from "../data/carrinho";
import { BuyerIdentity } from "./BuyerStep";
import { ComboComposition } from "./ItemsStep";
import { QuantityStepper } from "./QuantityStepper";

export type PaymentMethod = "link" | "saldo";

/** Taxa de serviço aplicada sobre o subtotal. */
const SERVICE_FEE_RATE = 0.1;

interface PaymentStepProps {
    cart: Cart;
    buyer: Buyer | null;
    /** E-mail informado quando a conta não foi encontrada. */
    fallbackEmail?: string;
    /** Escolher o meio de pagamento já conclui a venda — não há botão "Avançar". */
    onSelectMethod: (method: PaymentMethod) => void;
    onQuantityChange: (id: string, quantity: number) => void;
    /** Identificação pulada — link de pagamento indisponível. */
    linkBlocked: boolean;
}

/** Passo 3 — escolha do meio de pagamento e conferência do pedido. */
export function PaymentStep({ cart, buyer, fallbackEmail, onSelectMethod, onQuantityChange, linkBlocked }: PaymentStepProps) {
    const lines = cartLines(cart);
    const subtotal = cartTotal(cart);
    const fee = subtotal * SERVICE_FEE_RATE;
    const count = cartCount(cart);

    return (
        <div className="flex w-full max-w-[800px] flex-col gap-6">
            <section className="flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
                <h2 className="text-sm font-medium text-secondary">Escolha como vai ser pago</h2>

                <MethodRow icon={Link01} label="Link de pagamento" isDisabled={linkBlocked} onClick={() => onSelectMethod("link")} />
                {linkBlocked && (
                    <p className="-mt-1 text-sm text-tertiary">
                        Indisponível: sem identificação do comprador não há e-mail para onde enviar o link e os ingressos.
                    </p>
                )}

                <MethodRow icon={Coins01} label="Saldo do produtor" onClick={() => onSelectMethod("saldo")} />

                <div className="flex items-start gap-2 pt-1">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-fg-warning-secondary" aria-hidden="true" />
                    <div className="flex flex-col">
                        <p className="text-sm font-medium text-secondary">O pedido será criado antes do pagamento</p>
                        <p className="text-sm text-tertiary">O comprador realizará o pagamento após a emissão do pedido.</p>
                    </div>
                </div>
            </section>

            <section className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary">
                <dl className="flex flex-col gap-2 px-4 py-4 md:px-5">
                    <div className="flex justify-between text-sm">
                        <dt className="text-tertiary">Subtotal</dt>
                        <dd className="text-secondary">{formatBRL(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                        <dt className="text-tertiary">Taxa de serviço</dt>
                        <dd className="text-secondary">{formatBRL(fee)}</dd>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                        <dt className="text-primary">Total com taxas</dt>
                        <dd className="text-primary">{formatBRL(subtotal + fee)}</dd>
                    </div>
                </dl>

                <div className="border-t border-secondary px-4 py-4 md:px-5">
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
                        <p className="text-sm text-tertiary">Venda sem identificação do comprador.</p>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-secondary px-4 pt-4 md:px-5">
                    <p className="text-sm text-tertiary">Itens</p>
                    <Badge size="sm" type="modern" color="gray">
                        {count} {count === 1 ? "item" : "itens"}
                    </Badge>
                </div>

                <div className="flex flex-col gap-3 px-4 py-4 md:px-5">
                    {lines.map((line) => (
                        <ItemRow key={line.id} line={line} onQuantityChange={onQuantityChange} />
                    ))}
                </div>
            </section>
        </div>
    );
}

/** Linha do resumo. Combos trazem o próprio expander "Detalhes" com a composição. */
const ItemRow = ({ line, onQuantityChange }: { line: CartLine; onQuantityChange: (id: string, quantity: number) => void }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="flex flex-col rounded-lg bg-secondary">
            <div className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 flex-col">
                    <p className="text-sm font-semibold text-primary">{line.name}</p>
                    {line.meta && <p className="text-sm text-tertiary">{line.meta}</p>}
                    {line.date && <p className="text-sm text-quaternary">{line.date}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-sm font-semibold text-primary">{formatBRL(line.unitPrice)}</p>
                    <QuantityStepper
                        label={line.name}
                        value={line.quantity}
                        showRemoveAtMin
                        onChange={(quantity) => onQuantityChange(line.id, quantity)}
                    />
                </div>
            </div>

            {line.composicao && (
                <>
                    {showDetails && (
                        <div className="px-3 pb-3">
                            <ComboComposition entries={line.composicao} />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowDetails((open) => !open)}
                        aria-expanded={showDetails}
                        aria-label={`Detalhes de ${line.name}`}
                        className="flex items-center justify-between gap-2 border-t border-secondary px-3 py-2.5 text-sm text-tertiary transition duration-100 ease-linear hover:text-secondary_hover"
                    >
                        Detalhes
                        <ChevronDown
                            className={cx("size-5 transition-transform duration-100 ease-linear", showDetails && "rotate-180")}
                            aria-hidden="true"
                        />
                    </button>
                </>
            )}
        </div>
    );
};

interface MethodRowProps {
    icon: typeof Link01;
    label: string;
    isDisabled?: boolean;
    onClick: () => void;
}

const MethodRow = ({ icon: Icon, label, isDisabled, onClick }: MethodRowProps) => (
    <button
        type="button"
        disabled={isDisabled}
        onClick={onClick}
        className={cx(
            "group flex w-full items-center gap-3 rounded-lg bg-secondary px-4 py-4 text-left transition duration-100 ease-linear",
            !isDisabled && "cursor-pointer hover:bg-secondary_hover",
            isDisabled && "cursor-not-allowed opacity-50",
        )}
    >
        {/* No hover o fundo clareia e o ícone quaternário some — vira brand. */}
        <Icon
            className={cx(
                "size-5 shrink-0 text-fg-quaternary transition-colors duration-100 ease-linear",
                !isDisabled && "group-hover:text-fg-brand-primary",
            )}
            aria-hidden="true"
        />
        <span className="flex-1 text-sm font-medium text-primary">{label}</span>
        <ChevronRight className="size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />
    </button>
);
