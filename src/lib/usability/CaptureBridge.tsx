/**
 * Ponte de captura — montada DENTRO do app quando carregado em modo captura
 * (`?__capture=1`), tipicamente num iframe dentro do editor de testes.
 *
 * - Reporta a rota atual ao editor (parent) via postMessage a cada navegação.
 * - Quando o editor pede "armar seleção", intercepta o próximo clique, calcula
 *   o seletor CSS do elemento e devolve ao editor (com destaque visual no hover).
 *
 * Em modo captura, o app NÃO monta CommentsLayer nem TestRunnerLayer.
 */

import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { gerarSeletor, rotuloDoElemento } from "./selector";

/** Verdadeiro quando o app foi aberto em modo captura (computado uma vez). */
export const EM_CAPTURA = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("__capture");

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "*";

function postParent(msg: Record<string, unknown>) {
    window.parent?.postMessage({ source: "uxcap", ...msg }, ORIGIN);
}

export function CaptureBridge() {
    const location = useLocation();
    const [armado, setArmado] = useState(false);
    const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

    // Reporta a rota atual ao editor.
    useEffect(() => {
        postParent({ tipo: "rota", rota: location.pathname });
    }, [location.pathname]);

    // Ouve comandos do editor.
    useEffect(() => {
        const onMsg = (e: MessageEvent) => {
            if (e.data?.source !== "uxcap-cmd") return;
            if (e.data.tipo === "armar-selecao") setArmado(true);
            if (e.data.tipo === "desarmar-selecao") setArmado(false);
        };
        window.addEventListener("message", onMsg);
        postParent({ tipo: "pronto", rota: location.pathname });
        return () => window.removeEventListener("message", onMsg);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Captura de elemento por clique, com destaque no hover.
    useEffect(() => {
        if (!armado) {
            setHoverRect(null);
            return;
        }
        const onMove = (e: MouseEvent) => {
            const alvo = e.target as Element | null;
            setHoverRect(alvo && alvo !== document.body ? alvo.getBoundingClientRect() : null);
        };
        const onClick = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const alvo = e.target as Element | null;
            if (!alvo) return;
            postParent({ tipo: "elemento", seletor: gerarSeletor(alvo), rotulo: rotuloDoElemento(alvo) });
            setArmado(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setArmado(false);
                postParent({ tipo: "selecao-cancelada" });
            }
        };
        document.addEventListener("mousemove", onMove, true);
        document.addEventListener("click", onClick, true);
        document.addEventListener("keydown", onKey, true);
        return () => {
            document.removeEventListener("mousemove", onMove, true);
            document.removeEventListener("click", onClick, true);
            document.removeEventListener("keydown", onKey, true);
        };
    }, [armado]);

    if (!armado) return null;

    return (
        <>
            {/* Faixa de instrução */}
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[100000] flex justify-center p-3">
                <div className="rounded-full bg-brand-solid px-4 py-2 text-xs font-semibold text-white shadow-lg">
                    Clique no elemento que conclui a tarefa · Esc para cancelar
                </div>
            </div>
            {/* Destaque do elemento sob o cursor */}
            {hoverRect && (
                <div
                    className="pointer-events-none fixed z-[99999] rounded-sm ring-2 ring-brand"
                    style={{
                        top: hoverRect.top,
                        left: hoverRect.left,
                        width: hoverRect.width,
                        height: hoverRect.height,
                        background: "color-mix(in srgb, var(--color-bg-brand-solid) 14%, transparent)",
                    }}
                />
            )}
        </>
    );
}
