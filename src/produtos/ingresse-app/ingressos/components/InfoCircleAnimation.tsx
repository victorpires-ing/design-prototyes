import { useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import infoCircle from "../assets/info-circle.json";

/** Ícone animado de info circle: toca 2 vezes e congela no último frame. */
export function InfoCircleAnimation() {
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const plays = useRef(1);
    return (
        <Lottie
            lottieRef={lottieRef}
            animationData={infoCircle}
            loop={false}
            autoplay
            onComplete={() => {
                if (plays.current < 2) {
                    plays.current += 1;
                    lottieRef.current?.goToAndPlay(0, true);
                }
            }}
            aria-hidden="true"
            className="size-16"
        />
    );
}
