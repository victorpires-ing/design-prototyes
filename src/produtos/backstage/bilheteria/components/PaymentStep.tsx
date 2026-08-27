import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { AlertTriangle, ChevronDown, Coins01, Link01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { formatBRL, type Buyer } from "../data/catalogo";
import { cartCount, cartLines, cartTotal, type Cart, type CartLine } from "../data/carrinho";
import { BuyerIdentity, BuyerNoAccount } from "./BuyerStep";
import { ComboComposition } from "./ItemsStep";
import { QuantityStepper } from "./QuantityStepper";

/**
 * Dois caminhos, não três: ou o comprador paga pelo checkout, ou não paga nada
 * aqui — e aí tanto faz se ele já pagou por fora ou se a emissão é sem custo,
 * porque o sistema faz a mesma coisa. A diferença vive no repasse, não na tela.
 */
export type PaymentMethod = "link" | "saldo";

/** Taxa de serviço aplicada sobre o subtotal. */
const SERVICE_FEE_RATE = 0.1;

interface PaymentStepProps {
    cart: Cart;
    buyer: Buyer | null;
    /** E-mail informado quando a conta não foi encontrada. */
    fallbackEmail?: string;
    /** Meio de pagamento escolhido — o estado vive na página, porque o botão de concluir fica no header no desktop. */
    method: PaymentMethod | null;
    onMethodChange: (method: PaymentMethod) => void;
    /** Conclui a venda com o meio de pagamento escolhido. */
    onSelectMethod: (method: PaymentMethod) => void;
    onQuantityChange: (id: string, quantity: number) => void;
    /** Identificação pulada — link de pagamento indisponível. */
    linkBlocked: boolean;
}

/** Passo 3 — escolha do meio de pagamento e conferência do pedido. */
export function PaymentStep({
    cart,
    buyer,
    fallbackEmail,
    method,
    onMethodChange,
    onSelectMethod,
    onQuantityChange,
    linkBlocked,
}: PaymentStepProps) {
    const lines = cartLines(cart);
    const subtotal = cartTotal(cart);
    const fee = subtotal * SERVICE_FEE_RATE;
    const count = cartCount(cart);

    return (
        <div className="flex w-full max-w-[800px] flex-col gap-6">
            <section className="flex flex-col gap-4 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
                <h2 className="text-sm font-medium text-secondary">Escolha como vai ser pago</h2>

                <RadioGroup
                    aria-label="Meio de pagamento"
                    value={method}
                    onChange={(value) => onMethodChange(value as PaymentMethod)}
                    className="gap-3"
                >
                    <MethodOption
                        icon={Link01}
                        label="Link de pagamento"
                        value="link"
                        isSelected={method === "link"}
                        isDisabled={linkBlocked}
                    >
                        {linkBlocked ? (
                            <p className="text-sm text-tertiary">
                                Indisponível: sem identificação do comprador não há e-mail para onde enviar o link e os ingressos.
                            </p>
                        ) : (
                            <p className="text-sm text-tertiary">O comprador paga {formatBRL(subtotal + fee)} pelo link.</p>
                        )}
                    </MethodOption>

                    {/*
                      Uma linha por opção, no mesmo formato: quem lê está atendendo uma
                      fila e decide por comparação — o comprador paga agora ou não paga.
                      O que interessa ao fechamento é verdadeiro e precisa estar escrito,
                      mas não a cada venda: fica recolhido, para o operador novo e para
                      quando a dúvida aparecer.
                    */}
                    <MethodOption
                        icon={Coins01}
                        label="Cobrar só a taxa da bilheteria do produtor"
                        value="saldo"
                        isSelected={method === "saldo"}
                        footer={<ComoFunciona />}
                    >
                        <p className="text-sm text-tertiary">O comprador não paga nada. Os ingressos saem emitidos na hora.</p>
                    </MethodOption>
                </RadioGroup>

                {/* No desktop o aviso e a ação dividem a última linha do container. */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {/* Sem cobrança do comprador o pedido já nasce pago: o aviso só cabe no link. */}
                    {method === "link" ? (
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-fg-warning-secondary" aria-hidden="true" />
                            <p className="text-sm font-medium text-secondary">O pedido será criado antes do pagamento</p>
                        </div>
                    ) : (
                        <span />
                    )}

                    <Button
                        size="md"
                        color="primary"
                        isDisabled={!method}
                        onClick={() => method && onSelectMethod(method)}
                        className="w-full shrink-0 md:w-auto"
                    >
                        Vender ingresso
                    </Button>
                </div>
            </section>

            <section className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary">
                <div className="flex flex-col gap-3 border-t border-secondary px-4 py-4 md:px-5">
                    {buyer ? (
                        <BuyerIdentity buyer={buyer} />
                    ) : fallbackEmail ? (
                        <BuyerNoAccount email={fallbackEmail} />
                    ) : (
                        <p className="text-sm text-tertiary">Venda sem identificação do comprador.</p>
                    )}

                    {fallbackEmail && (
                        <p className="text-sm text-tertiary">
                            Os ingressos vão para <strong className="font-semibold text-secondary">{fallbackEmail}</strong>. Peça que o
                            comprador crie uma conta Ingresse com esse mesmo e-mail para acessá-los na carteira.
                        </p>
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
                    <QuantityStepper label={line.name} value={line.quantity} onChange={(quantity) => onQuantityChange(line.id, quantity)} />
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

interface MethodOptionProps {
    icon: typeof Link01;
    label: string;
    value: PaymentMethod;
    isSelected: boolean;
    isDisabled?: boolean;
    children: React.ReactNode;
    /** Conteúdo abaixo do rótulo, fora do <label> — para não virar alvo do radio. */
    footer?: React.ReactNode;
}

/** Cartão de meio de pagamento: radio, título e o resumo da cobrança como descrição. */
const MethodOption = ({ icon: Icon, label, value, isSelected, isDisabled, children, footer }: MethodOptionProps) => (
    <div
        className={cx(
            "group flex flex-col rounded-lg bg-secondary ring-1 transition duration-100 ease-linear",
            isDisabled ? "opacity-50 ring-transparent" : "hover:bg-secondary_hover",
            isSelected ? "ring-brand" : "ring-transparent",
        )}
    >
        <label className={cx("flex flex-col gap-3 p-4", isDisabled ? "cursor-not-allowed" : "cursor-pointer")}>
        <span className="flex items-center gap-3">
            <RadioButton value={value} slot={null} isDisabled={isDisabled} aria-label={label} />
            <Icon
                className={cx(
                    "size-5 shrink-0 transition-colors duration-100 ease-linear",
                    isSelected ? "text-fg-brand-primary" : "text-fg-quaternary",
                    !isDisabled && "group-hover:text-fg-brand-primary",
                )}
                aria-hidden="true"
            />
            <span className="text-sm font-medium text-primary">{label}</span>
        </span>
            {/* Recuo alinhado ao texto do rótulo, não ao radio. */}
            <div className="flex flex-col gap-2 pl-8">{children}</div>
        </label>
        {footer}
    </div>
);

/**
 * O que o produtor paga no fechamento — a resposta que a apresentação do MVP
 * pediu por escrito, sem custar atenção nas 200 vendas seguintes.
 */
const ComoFunciona = () => {
    const [aberto, setAberto] = useState(false);

    return (
        <div className="flex flex-col px-4 pb-4 pl-12">
            <button
                type="button"
                aria-expanded={aberto}
                // preventDefault: o botão vive dentro do cartão do radio e sem isso
                // abrir a explicação também trocava o meio de pagamento.
                onClick={(event) => {
                    event.preventDefault();
                    setAberto((open) => !open);
                }}
                className="flex w-fit items-center gap-1 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:text-secondary_hover"
            >
                Como isso aparece no fechamento?
                <ChevronDown
                    className={cx("size-4 transition-transform duration-100 ease-linear", aberto && "rotate-180")}
                    aria-hidden="true"
                />
            </button>

            {aberto && (
                <p className="pt-2 text-sm text-tertiary">
                    O produtor paga só a taxa da bilheteria — o valor do ingresso não é descontado do repasse. Serve também quando ele já
                    recebeu por fora: Pix, dinheiro ou maquininha própria.
                </p>
            )}
        </div>
    );
};
