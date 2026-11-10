import type { PointerEvent } from "react";
import { cx } from "@/utils/cx";
import { formatar } from "../data/textos-itens";

/**
 * Alça de arrastar: o padrão de ordenação do Backstage (6 bolinhas). Aparece no hover da linha no
 * desktop e fica sempre visível no toque. Pelo teclado, foco na alça e setas para cima e para
 * baixo movem o item (alternativa a arrastar, WCAG 2.5.7).
 */
export function Alca({
    nome,
    onPointerDown,
    onMover,
    grupo,
}: {
    nome: string;
    onPointerDown: (e: PointerEvent) => void;
    onMover: (delta: -1 | 1) => void;
    /** Nome do `group/<nome>` da linha que mostra a alça no hover. */
    grupo: "setor" | "linha";
}) {
    return (
        <button
            type="button"
            aria-label={formatar("Mover {item}. Arraste ou use as setas para cima e para baixo.", { item: nome })}
            onPointerDown={onPointerDown}
            onKeyDown={(e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault();
                    onMover(e.key === "ArrowUp" ? -1 : 1);
                }
            }}
            className={cx(
                "relative z-10 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-fg-quaternary outline-focus-ring transition-opacity duration-100 hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:opacity-100 focus-visible:outline-2 active:cursor-grabbing motion-reduce:transition-none",
                // Só no hover em telas com mouse; no toque fica visível.
                grupo === "setor" ? "md:opacity-0 md:group-hover/setor:opacity-100" : "md:opacity-0 md:group-hover/linha:opacity-100",
            )}
        >
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                <circle cx="9" cy="6" r="1.6" />
                <circle cx="9" cy="12" r="1.6" />
                <circle cx="9" cy="18" r="1.6" />
                <circle cx="15" cy="6" r="1.6" />
                <circle cx="15" cy="12" r="1.6" />
                <circle cx="15" cy="18" r="1.6" />
            </svg>
        </button>
    );
}

/** Move um item da posição `de` para `para` numa cópia da lista. */
export const mover = <T,>(lista: T[], de: number, para: number) => {
    const prox = [...lista];
    const [item] = prox.splice(de, 1);
    prox.splice(Math.max(0, Math.min(prox.length, para)), 0, item);
    return prox;
};
