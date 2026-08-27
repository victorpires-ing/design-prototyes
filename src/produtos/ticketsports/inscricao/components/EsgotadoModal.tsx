import { X } from "@untitledui/icons";
import { ErrorBadgeAnimation } from "./ErrorBadgeAnimation";

/** Modal exibido quando a opção esgota no momento da seleção. */
export function EsgotadoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 w-full max-w-[460px] rounded-2xl bg-white p-6 shadow-2xl">
                <button
                    type="button"
                    aria-label="Fechar"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 transition hover:text-gray-600"
                >
                    <X className="size-5" />
                </button>

                <div className="flex items-start gap-3 pr-6">
                    <ErrorBadgeAnimation className="size-12 shrink-0" />
                    <div className="pt-0.5">
                        <h3 className="text-lg font-bold text-gray-900">Essa opção acabou de esgotar</h3>
                        <p className="mt-1 text-sm text-gray-500">Mas ainda há outras opções disponíveis. Escolha uma para continuar.</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 w-full rounded-lg border border-gray-300 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                    Entendi
                </button>
            </div>
        </div>
    );
}
