import { useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import user from "../assets/user.json";

/** Ícone animado de pessoa (acesso habilitado): toca N vezes e congela no último frame. */
export function UsersAnimation({ plays = 1, onDone }: { plays?: number; onDone?: () => void }) {
    const lottieRef = useRef<LottieRefCurrentProps>(null);
    const count = useRef(1);
    return (
        <Lottie
            lottieRef={lottieRef}
            animationData={user}
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
            className="size-24"
        />
    );
}
