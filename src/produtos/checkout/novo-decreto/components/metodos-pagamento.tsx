import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { cx } from "@/utils/cx";
import icChevronMetodoMobile from "../assets/ic-chevron-metodo-mobile.svg";
import icChevronMetodo from "../assets/ic-chevron-metodo.svg";
import icClicktopay from "../assets/ic-clicktopay.svg";
import icCreditcard from "../assets/ic-creditcard.svg";
import icDebit from "../assets/ic-debit.svg";
import icGoogle from "../assets/ic-google.png";
import icPix from "../assets/ic-pix.svg";
import type { Protecao } from "../data/pedido";
import { SMART_ANIMATE, SMART_ANIMATE_CSS } from "../utils/transicao";
import { Icone } from "./base";

const METODOS = [
    { id: "pix", label: "Pix", icone: icPix },
    { id: "credito", label: "Cartão de crédito", icone: icCreditcard },
    { id: "debito", label: "Cartão de débito", icone: icDebit },
    { id: "google", label: "Google Pay", icone: icGoogle },
    { id: "clicktopay", label: "Click To Pay", icone: icClicktopay },
] as const;

const Badge = ({ className }: { className?: string }) => (
    <span
        className={cx(
            "rounded-3xl bg-(--ck-fg-success) px-2 py-0.5 text-[12px] leading-4 font-medium tracking-[0.24px] whitespace-nowrap text-white",
            className,
        )}
    >
        Aprovação imediata
    </span>
);

interface MetodoProps {
    metodo: (typeof METODOS)[number];
    isMobile: boolean;
    bloqueado: boolean;
    borda: "nenhuma" | "neutra" | "sucesso";
}

function Metodo({ metodo, isMobile, bloqueado, borda }: MetodoProps) {
    const isPix = metodo.id === "pix";
    const icone =
        metodo.id === "google" ? (
            <img src={icGoogle} alt="" className="size-[18px] max-w-none shrink-0 object-cover" />
        ) : (
            <Icone src={metodo.icone} tamanho={18} />
        );

    return (
        <div className="ck-sombra-metodo relative w-full">
            <button
                type="button"
                disabled={bloqueado}
                onClick={() => toast(`${metodo.label} não faz parte deste protótipo`, { description: "O foco aqui é a decisão sobre a proteção." })}
                className={cx(
                    "flex w-full items-center justify-between rounded-2xl bg-(--ck-bg-primary) text-left ring-1 transition-[box-shadow] ring-inset",
                    SMART_ANIMATE_CSS,
                    isMobile ? "gap-3 p-3" : "px-4 py-3",
                    borda === "sucesso" ? "ring-(--ck-fg-success)" : borda === "neutra" ? "ring-(--ck-border-metodo)" : "ring-transparent",
                    bloqueado ? "cursor-not-allowed" : "cursor-pointer",
                )}
            >
                <span className={cx("flex min-w-0 items-center", isMobile && "flex-1 justify-between")}>
                    <span className="flex items-center gap-3">
                        <span
                            className={cx(
                                "flex size-8 shrink-0 items-center justify-center rounded-full border p-2.5",
                                isMobile && !isPix ? "border-(--ck-border-primary)" : "border-(--ck-border-secundary)",
                            )}
                        >
                            {icone}
                        </span>
                        <span className={cx("text-[14px] leading-5 font-medium", isMobile ? "text-(--ck-text-primary)" : "text-(--ck-content-primary)")}>
                            {metodo.label}
                        </span>
                    </span>
                    {isMobile && isPix && <Badge />}
                </span>
                <Icone src={isMobile ? icChevronMetodoMobile : icChevronMetodo} tamanho={20} className="-rotate-90" />
            </button>
            {!isMobile && isPix && <Badge className="pointer-events-none absolute -top-2.5 right-2" />}
        </div>
    );
}

/** Espaço entre o título/ajuda e a primeira forma de pagamento, frame a frame do Figma. */
function espacoAteMetodos(protecao: Protecao, isMobile: boolean) {
    if (isMobile) return 16;
    if (protecao === "pendente" || protecao === "carregando") return 16;
    if (protecao === "sem") return 40;
    return 24; // "com" (14 + 10 do badge) e "sem-oferta"
}

/**
 * "Escolha como pagar". Enquanto a proteção não foi decidida (ou está carregando), as formas
 * de pagamento ficam bloqueadas em 50% e passam a 100% no mesmo Smart Animate do card.
 */
export function MetodosPagamento({ isMobile, protecao }: { isMobile: boolean; protecao: Protecao }) {
    const bloqueado = protecao === "pendente" || protecao === "carregando";
    const ajuda =
        protecao === "pendente"
            ? "Escolha uma das opções de proteção acima para liberar o pagamento."
            : protecao === "carregando"
              ? "Carregando as opções de proteção..."
              : null;

    const borda = (id: string): MetodoProps["borda"] => {
        if (id !== "pix" || isMobile) return "nenhuma";
        return protecao === "com" ? "sucesso" : protecao === "sem-oferta" ? "nenhuma" : "neutra";
    };

    return (
        <section aria-labelledby="titulo-pagamento" className={isMobile ? "px-4" : undefined}>
            <h2 id="titulo-pagamento" className="text-[16px] leading-6 font-bold whitespace-nowrap text-(--ck-content-primary)">
                Escolha como pagar
            </h2>

            <AnimatePresence initial={false}>
                {ajuda && (
                    <motion.p
                        key={ajuda}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={SMART_ANIMATE}
                        className="overflow-hidden"
                    >
                        <span className={cx("block text-[14px] leading-[1.4] text-(--ck-text-secondary)", isMobile ? "pt-4" : "pt-1")}>{ajuda}</span>
                    </motion.p>
                )}
            </AnimatePresence>

            <motion.div
                initial={false}
                animate={{ opacity: bloqueado ? 0.5 : 1, marginTop: espacoAteMetodos(protecao, isMobile) }}
                transition={SMART_ANIMATE}
                className="flex flex-col gap-4"
            >
                {bloqueado && <span className="sr-only">Pagamento bloqueado até você escolher uma opção de proteção.</span>}
                {METODOS.map((m) => (
                    <Metodo key={m.id} metodo={m} isMobile={isMobile} bloqueado={bloqueado} borda={borda(m.id)} />
                ))}
            </motion.div>
        </section>
    );
}
