import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ChevronDown, InfoCircle } from "@untitledui/icons";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { BuyerStep, type BuyerSearch } from "../components/BuyerStep";
import { ItemsStep } from "../components/ItemsStep";
import { OrderSuccess } from "../components/OrderSuccess";
import { PaymentStep, type PaymentMethod } from "../components/PaymentStep";
import { ResumoPanel } from "../components/ResumoPanel";
import { SkipIdentificationModal } from "../components/SkipIdentificationModal";
import { cartCount, cartTotal, type Cart } from "../data/carrinho";
import { addPedido, createPedido } from "../data/pedidos-store";
import { gerarIngressosCsv, gerarIngressosPdf } from "../utils/gerar-ingressos";
import type { Pedido } from "../data/pedidos";
import { findBuyer, formatBRL, isEmail, isValidEmail, type Buyer } from "../data/catalogo";

type Phase = "flow" | "processing" | "success";

/** E-mail do operador logado — no protótipo é fixo. */
const EMISSOR = "operacao@exemplo.com";
const PAYMENT_LINK = "cart.ingresse.com/971c14dc-89ba-41dd-a469-cad4a1fde120";

const STEP_TITLES = ["Comprador", "Itens", "Meio de pagamento"];

export function VenderIngressos() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState<Phase>("flow");
    const [step, setStep] = useState(0);

    const [term, setTerm] = useState("");
    const [search, setSearch] = useState<BuyerSearch>({ status: "idle" });
    const [skipped, setSkipped] = useState(false);
    const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);

    const [cart, setCart] = useState<Cart>({});
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    /** Pedido gerado ao concluir a venda — alimenta a tela de sucesso. */
    const [pedido, setPedido] = useState<Pedido | null>(null);

    const searchTimer = useRef<number | undefined>(undefined);

    const buyer: Buyer | null = search.status === "found" ? search.buyer : null;
    const fallbackEmail = search.status === "email-not-found" ? search.email : undefined;
    const total = cartTotal(cart);
    const count = cartCount(cart);

    const steps: ProgressIconType[] = useMemo(
        () =>
            STEP_TITLES.map((title, index) => ({
                title,
                description: "",
                status: index < step ? "complete" : index === step ? "current" : "incomplete",
            })),
        [step],
    );

    const canAdvance = useMemo(() => {
        if (step === 0) return skipped || search.status === "found" || search.status === "email-not-found";
        return count > 0;
    }, [step, skipped, search.status, count]);

    const runSearch = useCallback(() => {
        const value = term.trim();
        if (!value) return;

        if (isEmail(value) && !isValidEmail(value)) {
            setSearch({ status: "invalid-email" });
            return;
        }

        setSearch({ status: "searching" });
        window.clearTimeout(searchTimer.current);
        searchTimer.current = window.setTimeout(() => {
            const found = findBuyer(value);
            if (found) {
                setSearch({ status: "found", buyer: found });
            } else if (isEmail(value)) {
                setSearch({ status: "email-not-found", email: value });
            } else {
                setSearch({ status: "document-not-found" });
            }
        }, 1200);
    }, [term]);

    const resetFlow = useCallback(() => {
        setStep(0);
        setTerm("");
        setSearch({ status: "idle" });
        setSkipped(false);
        setCart({});
        setMethod(null);
        setIsSummaryOpen(false);
        setPedido(null);
    }, []);

    const handleQuantityChange = useCallback((id: string, quantity: number) => {
        setCart((current) => {
            const next = { ...current };
            if (quantity <= 0) delete next[id];
            else next[id] = quantity;
            return next;
        });
    }, []);

    const handleAdvance = useCallback(() => {
        if (!canAdvance || step >= 2) return;
        setStep(step + 1);
    }, [canAdvance, step]);

    /** No passo 3 a escolha do meio de pagamento já conclui a venda. */
    const handleSelectMethod = useCallback(
        (selectedMethod: PaymentMethod) => {
            setMethod(selectedMethod);
            setPhase("processing");
            window.setTimeout(() => {
                const novoPedido = createPedido({
                    cart,
                    buyer,
                    fallbackEmail,
                    tipo: selectedMethod,
                    emissor: EMISSOR,
                    paymentLink: PAYMENT_LINK,
                });
                addPedido(novoPedido);
                setPedido(novoPedido);
                setPhase("success");
            }, 2200);
        },
        [cart, buyer, fallbackEmail],
    );

    const handleBack = useCallback(() => {
        if (phase === "success" || step === 0) {
            navigate("/backstage/bilheteria");
            return;
        }
        setStep(step - 1);
    }, [phase, step, navigate]);

    /* --------------------------------------------------------------- */

    const advanceButton = (
        <Button size="md" color="primary" isDisabled={!canAdvance} onClick={handleAdvance} className="max-md:w-full">
            Avançar
        </Button>
    );

    return (
        <BackstageLayout activeSection="bilheteria" activeItem="bilheteria-online">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="relative flex items-center justify-between gap-3 px-4 py-6 max-md:justify-start md:px-6">
                    {phase !== "processing" && (
                        <ButtonUtility size="sm" color="tertiary" icon={ArrowLeft} tooltip="Voltar" onClick={handleBack} />
                    )}
                    <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-display-xs font-bold text-primary max-md:static max-md:translate-x-0">
                        Vender ingressos
                    </h1>
                    {phase === "flow" && step < 2 && <div className="max-md:hidden">{advanceButton}</div>}
                </header>

                <main className="flex flex-1 flex-col items-center gap-6 px-4 pb-6 md:px-6">
                    {phase === "processing" && (
                        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
                            <LoadingIndicator type="dot-circle" size="md" />
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-display-xs font-bold text-primary">Processando compra</p>
                                <p className="text-sm text-tertiary">Isso pode levar alguns segundos</p>
                            </div>
                        </div>
                    )}

                    {phase === "success" && (
                        <OrderSuccess
                            orderId={pedido?.id ?? ""}
                            channel={method === "saldo" ? "saldo" : "link"}
                            buyer={buyer}
                            fallbackEmail={fallbackEmail}
                            paymentLink={PAYMENT_LINK}
                            onNewSale={() => {
                                resetFlow();
                                setPhase("flow");
                            }}
                            onManageOrders={() => navigate("/backstage/bilheteria")}
                            onDownload={(format) => {
                                if (!pedido) return;
                                if (format === "pdf") gerarIngressosPdf(pedido);
                                if (format === "csv") gerarIngressosCsv(pedido);
                            }}
                        />
                    )}

                    {phase === "flow" && (
                        <>
                            <Progress.IconsWithText
                                items={steps}
                                size="sm"
                                type="number"
                                orientation="horizontal"
                                className="max-w-[680px] max-md:hidden"
                            />
                            <Progress.IconsWithText
                                items={steps}
                                size="sm"
                                type="number"
                                orientation="vertical"
                                className="w-full md:hidden"
                            />

                            {step === 0 && (
                                <BuyerStep
                                    term={term}
                                    onTermChange={setTerm}
                                    search={search}
                                    onSearch={runSearch}
                                    onSkip={() => setIsSkipModalOpen(true)}
                                    mobileAdvance={advanceButton}
                                />
                            )}

                            {step === 1 && (
                                <div className="flex w-full max-w-[1024px] gap-4 max-md:pb-28">
                                    <ItemsStep cart={cart} facialBlocked={skipped} onQuantityChange={handleQuantityChange} />
                                    <ResumoPanel
                                        cart={cart}
                                        onRemove={(id) => handleQuantityChange(id, 0)}
                                        onRemoveAll={() => setCart({})}
                                        className="w-[330px] shrink-0 self-start max-md:hidden"
                                    />
                                </div>
                            )}

                            {step === 2 && (
                                <PaymentStep
                                    cart={cart}
                                    buyer={buyer}
                                    fallbackEmail={fallbackEmail}
                                    onSelectMethod={handleSelectMethod}
                                    onQuantityChange={handleQuantityChange}
                                    linkBlocked={skipped}
                                />
                            )}
                        </>
                    )}
                </main>

                {phase === "flow" && step === 1 && (
                    <MobileSummaryBar
                        cart={cart}
                        total={total}
                        isOpen={isSummaryOpen}
                        onToggle={() => setIsSummaryOpen((open) => !open)}
                        onRemove={(id) => handleQuantityChange(id, 0)}
                        onRemoveAll={() => setCart({})}
                        advanceButton={advanceButton}
                    />
                )}
            </div>

            <SkipIdentificationModal
                isOpen={isSkipModalOpen}
                onClose={() => setIsSkipModalOpen(false)}
                onConfirm={() => {
                    setSkipped(true);
                    setSearch({ status: "idle" });
                    setTerm("");
                    setMethod("saldo");
                    setStep(1);
                }}
            />
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Barra de resumo fixa do passo 2 no mobile                          */
/* ------------------------------------------------------------------ */

interface MobileSummaryBarProps {
    cart: Cart;
    total: number;
    isOpen: boolean;
    onToggle: () => void;
    onRemove: (id: string) => void;
    onRemoveAll: () => void;
    advanceButton: React.ReactNode;
}

const MobileSummaryBar = ({ cart, total, isOpen, onToggle, onRemove, onRemoveAll, advanceButton }: MobileSummaryBarProps) => (
    <div className="sticky bottom-0 z-50 border-t border-secondary bg-primary md:hidden">
        <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-primary"
        >
            Resumo
            <ChevronDown
                className={cx("size-5 text-fg-quaternary transition-transform duration-100 ease-linear", isOpen && "rotate-180")}
                aria-hidden="true"
            />
        </button>

        {isOpen && (
            <div className="max-h-[50vh] overflow-y-auto px-4 pb-3">
                <ResumoPanel cart={cart} onRemove={onRemove} onRemoveAll={onRemoveAll} showTotal={false} className="min-h-0 ring-0" />
            </div>
        )}

        {/* pb generoso: o switcher flutuante de layout do protótipo ocupa o canto inferior direito. */}
        <div className="flex items-center justify-between gap-3 px-4 pb-20">
            <p className="flex items-center gap-1.5 whitespace-nowrap text-md font-semibold text-primary">
                {formatBRL(total)}
                <span className="text-sm font-normal text-tertiary">+ taxas</span>
                <InfoCircle className="size-4 text-fg-quaternary" aria-hidden="true" />
            </p>
            <div className="w-40">{advanceButton}</div>
        </div>
    </div>
);
