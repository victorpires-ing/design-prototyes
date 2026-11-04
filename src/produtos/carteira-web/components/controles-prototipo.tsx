import type { ReactNode } from "react";
import { ArrowLeft, Monitor01, Phone01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { useViewport } from "../data/viewport";

/**
 * Controles do protótipo num botão flutuante no canto inferior direito
 * (o topo fica livre para o header do site). `extra` entra na mesma barra só quando o cenário existe (ex.: erro no formulário).
 */
export function ControlesPrototipo({ voltar, extra }: { voltar: { label: string; onClick: () => void }; extra?: ReactNode }) {
    // Desktop/Mobile vale para todas as páginas da Carteira Web
    const [viewport, onViewport] = useViewport();
    const seg = "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition duration-100 ease-linear";
    return (
        <div className="fixed right-6 bottom-6 z-50">
            <div className="flex items-center gap-1 rounded-xl bg-primary p-1 shadow-lg ring-1 ring-border-secondary">
                <button
                    type="button"
                    onClick={voltar.onClick}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:bg-secondary hover:text-secondary"
                >
                    <ArrowLeft className="size-4" />
                    <span>{voltar.label}</span>
                </button>
                <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-border-secondary" />
                <button type="button" onClick={() => onViewport("desktop")} className={cx(seg, viewport === "desktop" ? "bg-secondary text-primary" : "text-tertiary")}>
                    <Monitor01 className="size-4" /> <span>Desktop</span>
                </button>
                <button type="button" onClick={() => onViewport("mobile")} className={cx(seg, viewport === "mobile" ? "bg-secondary text-primary" : "text-tertiary")}>
                    <Phone01 className="size-4" /> <span>Mobile</span>
                </button>
                {extra && (
                    <>
                        <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-border-secondary" />
                        {extra}
                    </>
                )}
            </div>
        </div>
    );
}
