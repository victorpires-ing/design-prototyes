import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "@untitledui/icons";
import { toast } from "sonner";
import { cx } from "@/utils/cx";
import icPix from "../assets/ic-pix.svg";
import { CheckoutShell } from "../components/checkout-shell";
import { ClickToPayIcon, CreditCardIcon, DebitCardIcon, GoogleIcon } from "../components/icones";
import { ProtecaoCard } from "../components/protecao-card";
import type { Protecao } from "../data/pedido";
import { useIsMobile, useTemaClaro } from "../utils/hooks";
import { SMART_ANIMATE, SMART_ANIMATE_CSS } from "../utils/transicao";

interface MetodoProps {
    icon: ReactNode;
    label: string;
    bloqueado: boolean;
    /** Borda do card: verde destaca o Pix quando o ingresso está protegido. */
    borda?: "neutra" | "sucesso";
    badge?: string;
}

function Metodo({ icon, label, bloqueado, borda, badge }: MetodoProps) {
    return (
        <div className="relative">
            <button
                type="button"
                disabled={bloqueado}
                aria-disabled={bloqueado}
                onClick={() => toast(`${label} não faz parte deste protótipo`, { description: "O foco aqui é a decisão sobre a proteção." })}
                className={cx(
                    "flex w-full items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3 text-left shadow-xs ring-1 ring-inset transition-shadow",
                    SMART_ANIMATE_CSS,
                    borda === "sucesso" ? "ring-fg-success-primary" : borda === "neutra" ? "ring-primary" : "ring-transparent",
                    bloqueado ? "cursor-not-allowed" : "cursor-pointer hover:bg-primary_hover",
                )}
            >
                <span className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full text-fg-secondary ring-1 ring-secondary ring-inset">{icon}</span>
                    <span className="text-md font-medium text-primary">{label}</span>
                </span>
                <ChevronDown className="size-5 text-fg-secondary" />
            </button>
            {badge && (
                <span className="pointer-events-none absolute -top-2.5 right-1.5 rounded-full bg-fg-success-primary px-2 py-0.5 text-xs font-medium text-white">{badge}</span>
            )}
        </div>
    );
}

export function Pagamento() {
    useTemaClaro();
    const isMobile = useIsMobile();
    const [protecao, setProtecao] = useState<Protecao>("pendente");
    const bloqueado = protecao === "pendente";

    return (
        <CheckoutShell isMobile={isMobile} protecao={protecao}>
            <ProtecaoCard isMobile={isMobile} protecao={protecao} onChange={setProtecao} />

            <section aria-labelledby="titulo-pagamento" className="mt-6">
                <h2 id="titulo-pagamento" className="text-lg font-semibold text-primary">
                    Escolha como pagar
                </h2>
                <AnimatePresence initial={false}>
                    {bloqueado && (
                        <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={SMART_ANIMATE}
                            className="overflow-hidden text-md text-secondary"
                        >
                            <span className="block pt-1">Escolha uma das opções de proteção acima para liberar o pagamento.</span>
                        </motion.p>
                    )}
                </AnimatePresence>

                {/* Bloqueadas (50%) até a decisão; habilitam no mesmo Smart Animate do card */}
                <motion.div
                    initial={false}
                    animate={{ opacity: bloqueado ? 0.5 : 1 }}
                    transition={SMART_ANIMATE}
                    aria-describedby={bloqueado ? "pagamento-bloqueado" : undefined}
                    className="mt-6 flex flex-col gap-4"
                >
                    {bloqueado && (
                        <span id="pagamento-bloqueado" className="sr-only">
                            Pagamento bloqueado até você escolher uma opção de proteção.
                        </span>
                    )}
                    <Metodo
                        icon={<img src={icPix} alt="" className="size-[18px]" />}
                        label="Pix"
                        bloqueado={bloqueado}
                        borda={protecao === "com" ? "sucesso" : "neutra"}
                        badge="Aprovação imediata"
                    />
                    <Metodo icon={<CreditCardIcon className="size-4" />} label="Cartão de crédito" bloqueado={bloqueado} />
                    <Metodo icon={<DebitCardIcon className="size-4" />} label="Cartão de débito" bloqueado={bloqueado} />
                    <Metodo icon={<GoogleIcon className="size-4" />} label="Google Pay" bloqueado={bloqueado} />
                    <Metodo icon={<ClickToPayIcon className="size-4" />} label="Click To Pay" bloqueado={bloqueado} />
                </motion.div>
            </section>
        </CheckoutShell>
    );
}
