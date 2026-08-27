import { useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import ticketCheck from "../assets/ticket-check.json";

interface Props {
    /** Quantas vezes a animação toca antes de congelar. Default: 2. */
    plays?: number;
    /** Chamado após a animação tocar o número de vezes definido. */
    onDone?: () => void;
}

/** Ícone animado de ingresso com selo de check: toca N vezes e congela no último frame. */
export function TicketCheckAnimation({ plays = 2, onDone }: Props) {
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const count = useRef(1);
    return (
        <Lottie
            lottieRef={lottieRef}
            animationData={ticketCheck}
            loop={false}
            autoplay
            onComplete={() => {
                if (count.current < plays) {
                    count.current += 1;
                    lottieRef.current?.goToAndPlay(0, true);
                } else {
                    onDone?.();
                }
            }}
            aria-hidden="true"
            className="size-28"
        />
    );
}
