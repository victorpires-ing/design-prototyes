import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle, XClose } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

export type TomToast = "sucesso" | "aviso";

export interface WebToastData {
    id: number;
    titulo: string;
    descricao?: string;
    tom: TomToast;
}

/* A Carteira Web alterna entre desktop e um frame de celular. Na janela o toast
   fica no canto, como em qualquer site; no frame ele para dentro da moldura. */

let atual: WebToastData | null = null;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
};

export const fecharToast = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    atual = null;
    notify();
};

/** Mostra uma notificação dentro do frame do app. */
export const mostrarToast = (titulo: string, descricao?: string, tom: TomToast = "sucesso", duracaoMs = tom === "aviso" ? 6000 : 4000) => {
    if (timer) clearTimeout(timer);
    seq += 1;
    atual = { id: seq, titulo, descricao, tom };
    notify();
    timer = setTimeout(fecharToast, duracaoMs);
};

/** "janela" = canto inferior direito da página; "frame" = dentro da moldura do celular. */
export type AncoraToast = "janela" | "frame";

const ANCORA: Record<AncoraToast, string> = {
    janela: "fixed right-6 bottom-6 justify-end",
    frame: "absolute inset-x-0 bottom-6 justify-center",
};

/** Notificação da Carteira Web. */
export function WebToast({ ancora = "janela" }: { ancora?: AncoraToast }) {
    const toast = useSyncExternalStore(
        subscribe,
        () => atual,
        () => null,
    );

    // z acima do modal (z-50 do design system): o conflito de estoque aparece com ele aberto.
    return (
        <div
            role="status"
            aria-live={toast?.tom === "aviso" ? "assertive" : "polite"}
            aria-atomic="true"
            className={cx("pointer-events-none z-[60] flex px-4", ANCORA[ancora])}
        >
            <AnimatePresence mode="popLayout">
                {toast && (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.6 }}
                        className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-primary p-4 shadow-xl ring-1 ring-border-secondary"
                    >
                        <FeaturedIcon
                            icon={toast.tom === "aviso" ? AlertTriangle : CheckCircle}
                            color={toast.tom === "aviso" ? "warning" : "success"}
                            theme="light"
                            size="md"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-primary">{toast.titulo}</p>
                            {toast.descricao && <p className="mt-0.5 text-sm text-tertiary">{toast.descricao}</p>}
                        </div>
                        <button
                            type="button"
                            aria-label="Fechar notificação"
                            onClick={fecharToast}
                            className="shrink-0 text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                        >
                            <XClose className="size-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
