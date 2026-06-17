import { useEffect, useMemo, useState } from "react";
import { SearchLg, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { BANCO_PERGUNTAS, TIPO_PERGUNTA } from "../data/pesquisas-store";

interface UsarPerguntasModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Ids já presentes no evento (não aparecem na lista). */
    jaAdicionadas: Set<string>;
    /** Confirma a seleção — recebe os ids escolhidos do banco. */
    onAdicionar: (ids: string[]) => void;
    /** Atalho para criar uma pergunta original (quando o banco não tem o que se quer). */
    onCriarNova: () => void;
}

export function UsarPerguntasModal({ isOpen, onClose, jaAdicionadas, onAdicionar, onCriarNova }: UsarPerguntasModalProps) {
    const [busca, setBusca] = useState("");
    const [sel, setSel] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            setBusca("");
            setSel(new Set());
        }
    }, [isOpen]);

    const disponiveis = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return BANCO_PERGUNTAS.filter((p) => !jaAdicionadas.has(p.id) && (termo === "" || p.titulo.toLowerCase().includes(termo)));
    }, [busca, jaAdicionadas]);

    const toggle = (id: string) =>
        setSel((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const confirmar = () => {
        if (sel.size === 0) return;
        onAdicionar([...sel]);
        onClose();
    };

    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4 backdrop-blur-[2px] outline-hidden",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "flex max-h-[85vh] w-full max-w-[560px] flex-col rounded-2xl bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex min-h-0 flex-1 flex-col outline-hidden">
                    {/* Header */}
                    <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-4">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-lg font-semibold text-primary">Usar perguntas existentes</h2>
                            <p className="text-sm text-tertiary">Escolha perguntas do banco da sua organização para adicionar a este evento.</p>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                    </div>

                    {/* Busca */}
                    <div className="shrink-0 px-6 pb-3">
                        <Input size="sm" icon={SearchLg} aria-label="Buscar pergunta" placeholder="Buscar pergunta no banco" value={busca} onChange={setBusca} />
                    </div>

                    {/* Lista */}
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-2">
                        {disponiveis.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center">
                                <p className="text-sm font-medium text-primary">{busca ? "Nada encontrado" : "Nenhuma pergunta no banco"}</p>
                                <p className="text-sm text-tertiary">{busca ? "Tente outro termo ou crie uma nova." : "Crie uma pergunta original para começar."}</p>
                            </div>
                        ) : (
                            <ul className="flex flex-col">
                                {disponiveis.map((p) => {
                                    const meta = TIPO_PERGUNTA[p.tipo];
                                    const marcada = sel.has(p.id);
                                    return (
                                        <li key={p.id}>
                                            <button
                                                type="button"
                                                onClick={() => toggle(p.id)}
                                                className={cx(
                                                    "flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors duration-100 ease-linear",
                                                    marcada ? "bg-brand-primary dark:bg-white/10" : "hover:bg-primary_hover",
                                                )}
                                            >
                                                <Checkbox size="sm" isSelected={marcada} isReadOnly aria-hidden="true" />
                                                <meta.icon className="size-4 shrink-0 text-fg-quaternary" />
                                                <span className="min-w-0 flex-1 truncate text-sm text-primary">{p.titulo}</span>
                                                <span className="shrink-0 text-xs text-tertiary">{meta.label}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-secondary px-6 py-4">
                        <Button size="md" color="link-color" onClick={onCriarNova}>
                            Criar nova pergunta
                        </Button>
                        <div className="flex gap-2">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" onClick={confirmar} isDisabled={sel.size === 0}>
                                {sel.size > 0 ? `Adicionar (${sel.size})` : "Adicionar"}
                            </Button>
                        </div>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
