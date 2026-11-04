import { useEffect } from "react";
import "./marca-ingresse.css";

/** Marca vermelha da Ingresse enquanto a tela está montada (CTAs em brand, como no app). */
export function useMarcaIngresse() {
    useEffect(() => {
        document.documentElement.classList.add("marca-ingresse", "carteira-web");
        return () => document.documentElement.classList.remove("marca-ingresse", "carteira-web");
    }, []);
}
