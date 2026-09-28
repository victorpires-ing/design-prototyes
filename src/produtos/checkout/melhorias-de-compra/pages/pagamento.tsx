import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { ChevronDown } from "@untitledui/icons";
import { toast } from "sonner";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { cx } from "@/utils/cx";
import { CheckoutShell } from "../components/checkout-shell";
import { ClickToPayIcon, CreditCardIcon, GoogleIcon } from "../components/icones";
import { PixCard } from "../components/pix-card";
import { TopoFinalizar } from "../components/topo";
import { useCheckout } from "../data/checkout-store";
import { PRECO_PROTECAO, brl } from "../data/pedido";
import { useIsMobile, useTemaClaro } from "../utils/hooks";

const BASE = "/checkout/melhorias-de-compra";

function OpcaoProtecao({ value, children, recomendado }: { value: string; children: ReactNode; recomendado?: boolean }) {
    return (
        <AriaRadio
            value={value}
            className={({ isSelected }) =>
                cx(
                    "relative flex cursor-pointer items-start gap-3 rounded-2xl p-4 ring-1 transition duration-100 ease-linear ring-inset lg:px-4 lg:py-5",
                    isSelected ? "bg-brand-primary ring-brand" : "bg-primary ring-secondary hover:bg-primary_hover",
                )
            }
        >
            {({ isSelected, isFocusVisible }) => (
                <>
                    {recomendado && (
                        <span className="absolute -top-2.5 right-2 rounded-full bg-primary-solid px-2 py-0.5 text-xs font-medium text-white">Recomendado</span>
                    )}
                    <RadioButtonBase size="md" isSelected={isSelected} isFocusVisible={isFocusVisible} className="mt-2.5 lg:mt-3" />
                    <div className="min-w-0 flex-1">{children}</div>
                </>
            )}
        </AriaRadio>
    );
}

function Metodo({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
    return (
        <button
            type="button"
            onClick={onPress}
            className="flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-left shadow-xs transition duration-100 ease-linear hover:bg-primary_hover"
        >
            <span className="flex size-8 items-center justify-center rounded-full text-fg-secondary ring-1 ring-secondary">{icon}</span>
            <span className="flex-1 text-md font-medium text-primary">{label}</span>
            <ChevronDown className="size-5 text-fg-secondary" />
        </button>
    );
}

export function Pagamento() {
    useTemaClaro();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { protecao, setProtecao } = useCheckout();

    const foraDoEscopo = (metodo: string) => toast(`${metodo} não faz parte deste protótipo`, { description: "Siga pelo Pix ou pelo cartão." });

    return (
        <CheckoutShell isMobile={isMobile} topo={<TopoFinalizar isMobile={isMobile} />}>
            {/* Proteção de compra */}
            <section aria-labelledby="titulo-protecao">
                <h2 id="titulo-protecao" className="text-lg font-semibold text-primary">
                    Proteja-se de imprevistos!
                </h2>
                <AriaRadioGroup aria-labelledby="titulo-protecao" value={protecao} onChange={(v) => setProtecao(v as "com" | "sem")} className="mt-4 flex flex-col gap-2">
                    <OpcaoProtecao value="com" recomendado>
                        {isMobile ? (
                            <>
                                <p className="flex justify-between gap-2 text-md font-medium text-primary">
                                    Proteger meu pedido <span className="tabular-nums">{brl(PRECO_PROTECAO)}</span>
                                </p>
                                <p className="mt-0.5 text-sm text-tertiary">Receba 100% do valor de volta em casos previstos.</p>
                            </>
                        ) : (
                            <>
                                <p className="text-lg text-primary">Compra protegida por {brl(PRECO_PROTECAO)}</p>
                                <p className="mt-1 text-md text-secondary">Quero meu dinheiro de volta nos casos previstos</p>
                            </>
                        )}
                        <span className="mt-1.5 inline-block text-sm font-medium text-brand-secondary underline lg:text-md">Ver coberturas</span>
                    </OpcaoProtecao>
                    <OpcaoProtecao value="sem">
                        <p className="text-md font-medium text-primary lg:text-lg lg:font-normal">{isMobile ? "Continuar sem proteção" : "Seguir sem proteção adicional"}</p>
                        <p className="mt-0.5 text-sm text-tertiary lg:mt-1 lg:text-md lg:text-secondary">
                            {isMobile ? "Meu pedido não terá cobertura para imprevistos" : "Tenho certeza que vou ao evento, imprevistos acontecem."}
                        </p>
                    </OpcaoProtecao>
                </AriaRadioGroup>
                <p className="mt-3 text-sm text-secondary">
                    Ao aderir à proteção de compra, você declara estar de acordo com os <span className="text-brand-secondary">Termos e condições</span>.
                </p>
            </section>

            {/* Métodos de pagamento — Pix aberto por padrão */}
            <section aria-labelledby="titulo-pagamento" className="mt-6 lg:mt-8">
                <h2 id="titulo-pagamento" className="text-lg font-semibold text-primary">
                    Escolha como pagar
                </h2>
                <div className="mt-4 flex flex-col gap-4">
                    <PixCard isMobile={isMobile} />
                    <Metodo icon={<CreditCardIcon className="size-4" />} label="Crédito" onPress={() => navigate(`${BASE}/cartao`)} />
                    <Metodo icon={<CreditCardIcon className="size-4" />} label="Débito" onPress={() => navigate(`${BASE}/cartao?tipo=debito`)} />
                    <Metodo icon={<GoogleIcon className="size-4" />} label="Google Pay" onPress={() => foraDoEscopo("Google Pay")} />
                    <Metodo icon={<ClickToPayIcon className="size-4" />} label="Click To Pay" onPress={() => foraDoEscopo("Click To Pay")} />
                </div>
            </section>
        </CheckoutShell>
    );
}
