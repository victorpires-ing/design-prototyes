import { useEffect, type RefObject } from "react";

/**
 * Mobile: os cantos de cima do card vão endireitando nos últimos 24px antes de encostar
 * na barra do topo (72px), para não sobrar uma curva sob o header ao rolar.
 */
export function useCantosDoCard(card: RefObject<HTMLElement | null>) {
    useEffect(() => {
        const el = card.current;
        if (!el) return;
        const desktop = window.matchMedia("(min-width: 1024px)");
        const BARRA = 72;
        const RAIO = 24;
        const atualizar = () => {
            if (desktop.matches) {
                el.style.borderTopLeftRadius = el.style.borderTopRightRadius = "";
                return;
            }
            const raio = Math.max(0, Math.min(RAIO, el.getBoundingClientRect().top - BARRA));
            el.style.borderTopLeftRadius = el.style.borderTopRightRadius = `${raio}px`;
        };
        atualizar();
        window.addEventListener("scroll", atualizar, { passive: true });
        desktop.addEventListener("change", atualizar);
        return () => {
            window.removeEventListener("scroll", atualizar);
            desktop.removeEventListener("change", atualizar);
        };
    }, [card]);
}
