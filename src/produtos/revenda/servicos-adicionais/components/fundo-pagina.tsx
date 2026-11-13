import type { ReactNode } from "react";
import { cx } from "@/utils/cx";
import { VistaPrototipo } from "./vista-prototipo";

/**
 * Fundo das páginas de Serviços adicionais: cinza liso no desktop (bg-tertiary) e branco
 * no mobile, onde o card da oferta ocupa a tela toda.
 */
export function FundoPagina({ className, children }: { className?: string; children: ReactNode }) {
    return (
        // Desktop/Mobile do protótipo envolve a página inteira, header incluso
        <VistaPrototipo>
            <div className={cx("relative isolate min-h-screen bg-primary text-primary lg:bg-tertiary", className)}>{children}</div>
        </VistaPrototipo>
    );
}
