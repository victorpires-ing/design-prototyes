import type { FC, SVGProps } from "react";
import { AmexIcon, DinersClubIcon, EloIcon, MastercardIcon, VisaIcon } from "@/components/foundations/payment-icons";
import type { Bandeira } from "../data/checkout-store";

export const BANDEIRAS: Record<Bandeira, { nome: string; Icon: FC<SVGProps<SVGSVGElement>> }> = {
    visa: { nome: "Visa", Icon: VisaIcon },
    mastercard: { nome: "Mastercard", Icon: MastercardIcon },
    amex: { nome: "American Express", Icon: AmexIcon },
    diners: { nome: "Diners Club", Icon: DinersClubIcon },
    elo: { nome: "Elo", Icon: EloIcon },
};

export function CreditCardIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
            <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
            <path d="M2.5 9.5h19" />
        </svg>
    );
}

export function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.06-1.3-.18-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2Z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z" />
            <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9Z" />
        </svg>
    );
}

export function ClickToPayIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={className} aria-hidden="true">
            <path d="M4 7h7l3 5-3 5H4l3-5-3-5Z" />
            <path d="M14 7l3 5-3 5M18 7l3 5-3 5" />
        </svg>
    );
}

/** Logo "INGRESSE" do topo do checkout. */
export function LogoIngresse() {
    return (
        <span className="flex items-center gap-1.5 text-sm font-bold tracking-wide text-white">
            <svg viewBox="0 0 20 16" className="h-4 w-5" fill="currentColor" aria-hidden="true">
                <path d="M2 1h3l-1 3H1l1-3Zm5 0h3l-1 3H6l1-3Zm5 0h3l-1 3h-3l1-3Zm5 0h3l-1 3h-3l1-3ZM1 6h18l-1.2 4H2.2L1 6Zm1.6 5.5h14.8L16 15H4l-1.4-3.5Z" />
            </svg>
            INGRESSE
        </span>
    );
}
