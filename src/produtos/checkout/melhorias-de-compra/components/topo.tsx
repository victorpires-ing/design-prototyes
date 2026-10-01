import type { ReactNode } from "react";
import { ChevronLeft, Lock01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { useTempoReserva } from "../utils/hooks";

function TempoReserva({ className }: { className?: string }) {
    const tempo = useTempoReserva();
    return (
        <p className={cx("shrink-0 text-tertiary", className)}>
            Tempo restante: <span className="tabular-nums">{tempo}</span>
        </p>
    );
}

/** Linha de título da tela inicial do pagamento. */
export function TopoFinalizar({ isMobile }: { isMobile: boolean }) {
    if (isMobile) return null;
    return (
        <div className="flex items-end justify-between gap-4">
            <div>
                <h1 className="text-display-xs font-semibold text-primary">Finalizar compra</h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-tertiary">
                    <Lock01 className="size-4" />
                    Compra 100% segura
                </p>
            </div>
            <TempoReserva className="text-md lg:w-[448px]" />
        </div>
    );
}

/** "‹ Outros métodos" + tempo da reserva — telas de cartão e de recusa. */
export function TopoVoltar({ isMobile, onVoltar, children = "Outros métodos" }: { isMobile: boolean; onVoltar: () => void; children?: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <button
                type="button"
                onClick={onVoltar}
                className={cx("-ml-1 flex items-center gap-2 font-semibold text-primary transition duration-100 ease-linear hover:text-secondary", isMobile ? "text-md" : "text-lg")}
            >
                <ChevronLeft className="size-5" />
                {children}
            </button>
            <TempoReserva className={cx(isMobile ? "text-sm" : "text-md lg:w-[448px]")} />
        </div>
    );
}
