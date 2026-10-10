import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ShieldTick } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { COBERTURAS, PRECO_PROTECAO, brl, type Protecao } from "../data/pedido";
import { SMART_ANIMATE, SMART_ANIMATE_CSS } from "../utils/transicao";
import { AlturaAnimada } from "./altura-animada";

interface ProtecaoCardProps {
    isMobile: boolean;
    protecao: Protecao;
    onChange: (protecao: Protecao) => void;
}

function Coberturas() {
    return (
        <div className="flex flex-col gap-4 pt-1 text-sm text-secondary">
            <div>
                <p className="font-semibold text-primary">O que cobre</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                    {COBERTURAS.cobre.map((c) => (
                        <li key={c} className="flex items-start gap-2">
                            <ShieldTick className="mt-0.5 size-4 shrink-0 text-fg-success-primary" />
                            {c}
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <p className="font-semibold text-primary">O que não cobre</p>
                <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
                    {COBERTURAS.naoCobre.map((c) => (
                        <li key={c}>{c}</li>
                    ))}
                </ul>
            </div>
            <div>
                <p className="font-semibold text-primary">Como pedir o reembolso</p>
                <p className="mt-2">{COBERTURAS.reembolso}</p>
            </div>
        </div>
    );
}

/** Estado inicial: o comprador precisa decidir antes de liberar o pagamento. */
function Decisao({ isMobile, onChange }: Omit<ProtecaoCardProps, "protecao">) {
    const [coberturas, setCoberturas] = useState(false);

    return (
        <div className="flex flex-col gap-3.5">
            <h2 className="text-lg font-semibold text-primary">{isMobile ? "Proteja-se de imprevistos!" : "Proteja-se de imprevistos"}</h2>
            <div className="h-px bg-border-secondary" />
            <p className="text-md text-secondary">Quero meu dinheiro de volta nos casos previstos</p>

            <div>
                <button
                    type="button"
                    aria-expanded={coberturas}
                    onClick={() => setCoberturas((v) => !v)}
                    className="flex items-center gap-1 text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                >
                    Ver coberturas
                    {!isMobile && <ChevronDown className={cx("size-5 transition", SMART_ANIMATE_CSS, coberturas && "rotate-180")} />}
                </button>
                <AnimatePresence initial={false}>
                    {coberturas && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={SMART_ANIMATE}
                            className="overflow-hidden"
                        >
                            <div className="pt-3">
                                <Coberturas />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className={cx("flex gap-3", isMobile && "flex-col")}>
                <Button size="lg" color="secondary" className="flex-1" onPress={() => onChange("sem")}>
                    Seguir sem proteção
                </Button>
                <Button size="lg" color="primary" iconLeading={ShieldTick} className="flex-1" onPress={() => onChange("com")}>
                    Proteger por {brl(PRECO_PROTECAO)}
                </Button>
            </div>

            <p className="text-xs font-medium text-secondary">
                Ao proteger seu ingresso, você concorda com os <span className="text-brand-tertiary">Termos e condições</span>.
            </p>
        </div>
    );
}

/** Ingresso protegido: resumo da escolha + "Remover". */
function Protegido({ onChange }: Pick<ProtecaoCardProps, "onChange">) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-primary">Reembolso por imprevistos</h2>
                <Button size="sm" color="link-color" onPress={() => onChange("sem")}>
                    Remover
                </Button>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-secondary_subtle px-2 py-4">
                <ShieldTick className="size-[22px] text-fg-success-primary" />
                <p className="text-lg font-bold text-success-primary">Ingresso protegido</p>
            </div>
        </div>
    );
}

/** Seguiu sem proteção: ainda dá para voltar atrás. */
function SemProtecao({ isMobile, onChange }: Omit<ProtecaoCardProps, "protecao">) {
    return (
        <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-primary">Reembolso por imprevistos</h2>
            <div className={cx("flex gap-3 rounded-xl bg-secondary_subtle px-2 py-4", isMobile ? "flex-col" : "items-center justify-between")}>
                <div className="flex flex-col gap-2">
                    <p className="text-lg font-bold text-brand-secondary">Ingresso sem proteção</p>
                    <p className="text-md text-secondary">Tenho certeza que vou ao evento, imprevistos acontecem.</p>
                </div>
                <Button size="sm" color="primary" iconLeading={ShieldTick} className={cx("shrink-0", isMobile && "w-full")} onPress={() => onChange("com")}>
                    Proteger por {brl(PRECO_PROTECAO)}
                </Button>
            </div>
        </div>
    );
}

/**
 * Card da proteção. Cada troca de estado é um Smart Animate (Ease In and Out, 450 ms):
 * a altura do card acompanha o conteúdo, o conteúdo antigo sai em fade enquanto o novo
 * entra, e a borda aparece quando a decisão já foi tomada. Nada navega, então a rolagem
 * fica onde estava.
 */
export function ProtecaoCard({ isMobile, protecao, onChange }: ProtecaoCardProps) {
    return (
        <section
            aria-label="Proteção para imprevistos"
            className={cx(
                "rounded-[14px] bg-primary shadow-md ring-1 transition-shadow ring-inset",
                SMART_ANIMATE_CSS,
                protecao === "pendente" ? "ring-transparent" : "ring-primary",
            )}
        >
            <AlturaAnimada>
                <div className="relative p-5">
                    <AnimatePresence initial={false} mode="popLayout">
                        <motion.div
                            key={protecao}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={SMART_ANIMATE}
                        >
                            {protecao === "pendente" && <Decisao isMobile={isMobile} onChange={onChange} />}
                            {protecao === "com" && <Protegido onChange={onChange} />}
                            {protecao === "sem" && <SemProtecao isMobile={isMobile} onChange={onChange} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </AlturaAnimada>
        </section>
    );
}
