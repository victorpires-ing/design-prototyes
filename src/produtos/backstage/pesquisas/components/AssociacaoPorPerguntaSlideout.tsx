import { useMemo } from "react";
import { XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";
import { usePesquisas, type Pergunta } from "../data/pesquisas-store";

interface AssociacaoPorPerguntaSlideoutProps {
    isOpen: boolean;
    onClose: () => void;
    pergunta: Pergunta | null;
}

export function AssociacaoPorPerguntaSlideout({ isOpen, onClose, pergunta }: AssociacaoPorPerguntaSlideoutProps) {
    const { ingressos, associacoes, togglePerguntaNoIngresso } = usePesquisas();

    const usadaEm = useMemo(() => {
        const set = new Set<string>();
        if (!pergunta) return set;
        for (const [ingressoId, itens] of Object.entries(associacoes)) {
            if (itens.some((it) => it.perguntaId === pergunta.id)) set.add(ingressoId);
        }
        return set;
    }, [associacoes, pergunta]);

    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex justify-end bg-overlay/70 outline-hidden backdrop-blur-[2px]",
                    isEntering && "duration-300 ease-out animate-in fade-in",
                    isExiting && "duration-200 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "h-full w-full max-w-[460px] bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                        isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                    )
                }
            >
                <AriaDialog className="flex h-full flex-col outline-hidden">
                    <div className="flex shrink-0 items-start justify-between gap-4 px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-lg font-semibold text-primary">Em quais ingressos perguntar?</h2>
                            <p className="text-sm text-tertiary">“{pergunta?.titulo}”</p>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pb-6">
                        {ingressos.map((ingresso) => {
                            const marcado = usadaEm.has(ingresso.id);
                            const total = (associacoes[ingresso.id] ?? []).length;
                            return (
                                <button
                                    key={ingresso.id}
                                    type="button"
                                    onClick={() => pergunta && togglePerguntaNoIngresso(ingresso.id, pergunta.id)}
                                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors duration-100 ease-linear hover:bg-primary_hover"
                                >
                                    <Checkbox size="md" isSelected={marcado} isReadOnly aria-hidden="true" />
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <span className="text-sm font-medium text-primary">{ingresso.nome}</span>
                                        <span className="text-xs text-tertiary">
                                            {ingresso.grupo} · {total === 0 ? "sem perguntas" : `${total} ${total === 1 ? "pergunta" : "perguntas"}`}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-secondary px-6 py-4">
                        <Button size="md" color="primary" onClick={onClose}>
                            Concluir
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
