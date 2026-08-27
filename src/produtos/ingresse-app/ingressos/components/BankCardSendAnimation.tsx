import Lottie from "lottie-react";
import bankCardSend from "../assets/bank-card-send.json";

/** Ícone animado de cartão com seta (envio de valor). Toca uma vez e congela no fim. */
export function BankCardSendAnimation({ className = "size-14" }: { className?: string }) {
    return <Lottie animationData={bankCardSend} loop={false} autoplay aria-hidden="true" className={className} />;
}
