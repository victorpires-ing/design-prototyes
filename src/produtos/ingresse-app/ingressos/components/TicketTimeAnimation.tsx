import { useEffect, useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import ticketTime from "../assets/ticket-time.json";

/** Ícone animado de ingresso + relógio (processando). Loop contínuo e lento (sensação de carregando). */
export function TicketTimeAnimation({ className = "size-28", speed = 0.5 }: { className?: string; speed?: number }) {
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    useEffect(() => {
        lottieRef.current?.setSpeed(speed);
    }, [speed]);
    return <Lottie lottieRef={lottieRef} animationData={ticketTime} loop autoplay aria-hidden="true" className={className} />;
}
