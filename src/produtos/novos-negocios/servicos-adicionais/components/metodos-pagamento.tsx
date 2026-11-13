import type { ReactNode } from "react";
import { ChevronRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import icPix from "../assets/ic-pix.svg";

/**
 * Lista "Escolha como pagar" do checkout em produção: cada método é uma linha com ícone
 * em círculo, nome e seta. O Pix vem em destaque com borda verde.
 */
export function MetodoPagamento({ icone, rotulo, destaque, onPress }: { icone: ReactNode; rotulo: string; destaque?: boolean; onPress: () => void }) {
    return (
        <button
            type="button"
            onClick={onPress}
            className={cx(
                "flex w-full cursor-pointer items-center gap-3 rounded-xl bg-primary px-4 py-3.5 text-left shadow-xs outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
                destaque ? "ring-1 ring-fg-success-secondary" : "ring-1 ring-secondary",
            )}
        >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-secondary">{icone}</span>
            <span className="flex-1 text-md font-medium text-primary">{rotulo}</span>
            <ChevronRight className="size-5 text-fg-quaternary" aria-hidden="true" />
        </button>
    );
}

export function IconePix() {
    return <img src={icPix} alt="" aria-hidden="true" className="size-4" />;
}

export function IconeCartao() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4 text-fg-secondary" aria-hidden="true">
            <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
            <path d="M2.5 9.5h19" />
        </svg>
    );
}

export function IconeGoogle() {
    return (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.06-1.3-.18-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2Z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z" />
            <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z" />
        </svg>
    );
}

export function IconeClickToPay() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4 text-fg-secondary" aria-hidden="true">
            <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
            <path d="m14 9 3 3-3 3M18 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
