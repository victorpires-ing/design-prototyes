import { useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import anguished from "../assets/anguished.json";

/** Emoji "anguished" animado (azul) do modal de item esgotado.
 *  Toca 2 vezes e congela no último frame. */
export function AnguishedAnimation({ className = "size-12" }: { className?: string }) {
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const plays = useRef(1);
    return (
        <Lottie
            lottieRef={lottieRef}
            animationData={anguished}
            loop={false}
            autoplay
            onComplete={() => {
                if (plays.current < 2) {
                    plays.current += 1;
                    lottieRef.current?.goToAndPlay(0, true);
                }
            }}
            aria-hidden="true"
            className={className}
        />
    );
}
