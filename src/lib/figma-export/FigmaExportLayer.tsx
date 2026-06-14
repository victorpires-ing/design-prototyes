/**
 * Overlay dev-only para exportar a tela atual como JSON (a ser reconstruído no
 * Figma). FAB no canto inferior esquerdo; ao clicar, captura a árvore, copia o
 * JSON para a área de transferência e mostra um resumo (nós + componentes DS
 * reconhecidos). Marcado com `data-fig-skip` para não se auto-capturar.
 */

import { useEffect, useState } from "react";
import { Figma, Copy01 } from "@untitledui/icons";
import { useLocation } from "react-router";
import { toast } from "sonner";
import { cx } from "@/utils/cx";
import { capturarTela, resumo } from "./capture";

const ENABLED_KEY = "design-prototyes:figma-export:enabled";

/** Liga com "?figma=true" e permanece ao navegar (persistido); desliga com "?figma=false". */
function lerEnabled(search: string): boolean {
    const param = new URLSearchParams(search).get("figma");
    if (param === "true") return true;
    if (param === "false") return false;
    return sessionStorage.getItem(ENABLED_KEY) === "true";
}

export function FigmaExportLayer() {
    const location = useLocation();
    const [enabled, setEnabled] = useState(() => lerEnabled(location.search));
    const [ocupado, setOcupado] = useState(false);

    useEffect(() => {
        const param = new URLSearchParams(location.search).get("figma");
        if (param === "true") {
            sessionStorage.setItem(ENABLED_KEY, "true");
            setEnabled(true);
        } else if (param === "false") {
            sessionStorage.removeItem(ENABLED_KEY);
            setEnabled(false);
        }
    }, [location.search]);

    // Atalho Shift+F: mostra/esconde o botão de exportação na sessão.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!(e.shiftKey && e.code === "KeyF" && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey)) return;
            const el = document.activeElement as HTMLElement | null;
            if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
            e.preventDefault();
            setEnabled((prev) => {
                const next = !prev;
                if (next) sessionStorage.setItem(ENABLED_KEY, "true");
                else sessionStorage.removeItem(ENABLED_KEY);
                return next;
            });
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const exportar = async () => {
        setOcupado(true);
        try {
            const screen = capturarTela();
            if (!screen) {
                toast.error("Nada para capturar nesta tela.");
                return;
            }
            const { nos, ds } = resumo(screen);
            const json = JSON.stringify(screen);
            await navigator.clipboard.writeText(json);
            toast.success("Tela exportada", {
                description: `${nos} nós · ${ds} componentes do DS reconhecidos · JSON copiado (${(json.length / 1024).toFixed(0)} KB)`,
            });
            // Também loga para inspeção/colar no figma_execute.
            console.log("[figma-export]", screen);
        } catch (e) {
            toast.error("Falha ao capturar", { description: String(e) });
        } finally {
            setOcupado(false);
        }
    };

    if (!enabled) return null;

    return (
        <button
            type="button"
            data-fig-skip
            onClick={exportar}
            disabled={ocupado}
            title="Exportar tela para Figma (copia JSON)"
            className={cx(
                "fixed bottom-4 left-4 z-[9997] flex items-center gap-2 rounded-full bg-primary-solid px-4 py-2.5 text-sm font-semibold text-primary_on-brand shadow-2xl ring-1 ring-border-secondary transition hover:opacity-90",
                ocupado && "opacity-60",
            )}
        >
            {ocupado ? <Copy01 className="size-4 animate-pulse" aria-hidden="true" /> : <Figma className="size-4" aria-hidden="true" />}
            Exportar p/ Figma
        </button>
    );
}
