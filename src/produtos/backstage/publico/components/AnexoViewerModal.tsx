import { useEffect, useState } from "react";
import {
    Dialog as AriaDialog,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { Minus, Plus, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { DocumentoIdentificacaoView } from "./DocumentoIdentificacaoView";
import { LaudoView } from "./LaudoView";
import type { Anexo } from "../data/solicitacoes";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_PASSO = 0.25;

/** Modal em tela cheia para visualizar um anexo (documento de identificação ou laudo), com zoom. */
export function AnexoViewerModal({ anexo, onClose }: { anexo: Anexo | null; onClose: () => void }) {
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        if (anexo) setZoom(1);
    }, [anexo]);

    return (
        <AriaModalOverlay
            isOpen={anexo !== null}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-[80] outline-hidden",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "flex h-full w-full flex-col bg-primary outline-hidden",
                        isEntering && "duration-200 ease-out animate-in fade-in",
                        isExiting && "duration-150 ease-in animate-out fade-out",
                    )
                }
            >
                <AriaDialog className="relative flex h-full flex-col outline-hidden">
                    <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center gap-0.5 bg-overlay/70 px-12 py-4 text-center backdrop-blur-md">
                        <h2 className="truncate text-lg font-semibold text-primary">{anexo?.nome}</h2>
                        {anexo && (
                            <span className="truncate text-sm text-tertiary">
                                {anexo.arquivo} · {anexo.tamanho}
                            </span>
                        )}
                        <button
                            type="button"
                            aria-label="Fechar"
                            onClick={onClose}
                            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-quaternary_hover"
                        >
                            <XClose className="size-5" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-auto bg-secondary p-6 pt-24 dark:bg-[#0a0a0a]">
                        <div className="flex min-h-full items-center justify-center">
                            <div
                                style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
                                className="w-[720px] shrink-0 transition-transform duration-150 ease-linear"
                            >
                                {anexo?.tipo === "identificacao" ? <DocumentoIdentificacaoView /> : <LaudoView />}
                            </div>
                        </div>
                    </div>

                    <div className="fixed bottom-6 left-1/2 z-20 flex w-max -translate-x-1/2 items-center gap-1 rounded-xl bg-primary p-1 shadow-lg ring-1 ring-secondary">
                        <button
                            type="button"
                            aria-label="Diminuir zoom"
                            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_PASSO).toFixed(2)))}
                            disabled={zoom <= ZOOM_MIN}
                            className="flex size-8 items-center justify-center rounded-lg text-fg-secondary transition duration-100 ease-linear hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Minus className="size-4" aria-hidden="true" />
                        </button>
                        <span className="w-12 text-center text-sm font-medium text-primary select-none">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            type="button"
                            aria-label="Aumentar zoom"
                            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_PASSO).toFixed(2)))}
                            disabled={zoom >= ZOOM_MAX}
                            className="flex size-8 items-center justify-center rounded-lg text-fg-secondary transition duration-100 ease-linear hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
