import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle, XClose } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

export type TomToast = "sucesso" | "aviso";

export interface AppToastData {
    id: number;
    titulo: string;
    descricao?: string;
    tom: TomToast;
}

/* O Toaster global da sonner é fixo no canto da janela, ou seja, fora da moldura
   do celular. Este toast vive dentro do frame, como um app de verdade. */

let atual: AppToastData | null = null;
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

/** Onde o toast para: acima da tab bar, acima da barra de ações ou no rodapé. */
export type AncoraToast = "tab-bar" | "barra-de-acoes" | "rodape";

const ANCORA: Record<AncoraToast, string> = {
    "tab-bar": "bottom-24",
    "barra-de-acoes": "bottom-32",
    rodape: "bottom-6",
};

/** Notificação do app. Fica ancorada no rodapé do frame, acima do que estiver lá. */
export function AppToast({ ancora = "rodape" }: { ancora?: AncoraToast }) {
    const toast = useSyncExternalStore(
        subscribe,
        () => atual,
        () => null,
    );

    return (
        <div
            role="status"
            aria-live={toast?.tom === "aviso" ? "assertive" : "polite"}
            aria-atomic="true"
            className={cx("pointer-events-none absolute inset-x-0 z-40 flex justify-center px-4", ANCORA[ancora])}
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
