import { useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import cardWallet from "../assets/card-wallet.json";

interface Props {
    /** Quantas vezes a animação toca antes de congelar. Default: 1. */
    plays?: number;
    /** Chamado após a animação tocar o número de vezes definido. */
    onDone?: () => void;
}

/** Ícone animado de carteira/cartão: toca N vezes e congela no último frame. */
export function CardWalletAnimation({ plays = 1, onDone }: Props) {
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const count = useRef(1);
    return (
        <Lottie
            lottieRef={lottieRef}
            animationData={cardWallet}
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
