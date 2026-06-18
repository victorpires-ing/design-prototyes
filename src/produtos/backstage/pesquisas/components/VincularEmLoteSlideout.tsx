import { useEffect, useMemo, useState } from "react";
import { Plus, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { TIPO_PERGUNTA, usePesquisas, type AssocItem, type Pergunta, type TipoIngresso } from "../data/pesquisas-store";

interface VincularEmLoteSlideoutProps {
    isOpen: boolean;
    onClose: () => void;
    /** Ingressos selecionados que receberão as perguntas. */
    ingressos: TipoIngresso[];
    /** Vincula e limpa a seleção no pai. */
    onVinculado: () => void;
    /** Abre o editor de nova pergunta (o pai reabre este slideout depois). */
    onCriarPergunta: () => void;
}

export function VincularEmLoteSlideout({ isOpen, onClose, ingressos, onVinculado, onCriarPergunta }: VincularEmLoteSlideoutProps) {
    const { perguntas, vincularPerguntasEmIngressos } = usePesquisas();

    const [itens, setItens] = useState<AssocItem[]>([]);

    useEffect(() => {
        if (isOpen) setItens([]);
    }, [isOpen]);

    const selecionadas = useMemo(() => new Set(itens.map((it) => it.perguntaId)), [itens]);
    const disponiveis = useMemo(() => perguntas.filter((p) => p.ativa && !selecionadas.has(p.id)), [perguntas, selecionadas]);

    const adicionar = (p: Pergunta) => setItens((prev) => [...prev, { perguntaId: p.id, obrigatoria: true }]);
    const remover = (perguntaId: string) => setItens((prev) => prev.filter((it) => it.perguntaId !== perguntaId));
    const setObrigatoria = (perguntaId: string, value: boolean) =>
        setItens((prev) => prev.map((it) => (it.perguntaId === perguntaId ? { ...it, obrigatoria: value } : it)));

    const vincular = () => {
        if (itens.length === 0 || ingressos.length === 0) return;
        vincularPerguntasEmIngressos(
            ingressos.map((i) => i.id),
            itens,
            { modo: "fim" },
        );
        const nP = itens.length;
        const nI = ingressos.length;
        toast.success("Perguntas vinculadas", {
            description: `${nP} ${nP === 1 ? "pergunta" : "perguntas"} em ${nI} ${nI === 1 ? "ingresso" : "ingressos"}.`,
        });
        onVinculado();
        onClose();
    };

    return (
        <AriaModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable className="fixed inset-0 z-50 flex justify-end outline-hidden">
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "h-full w-full max-w-[520px] border-l border-secondary bg-primary shadow-2xl outline-hidden",
                        isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                        isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                    )
                }
            >
                <AriaDialog className="flex h-full flex-col outline-hidden">
                    {/* Header */}
                    <div className="flex shrink-0 items-start justify-between gap-4 px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold tracking-wide text-tertiary uppercase">Vincular em lote</span>
                            <h2 className="text-lg font-semibold text-primary">
                                {ingressos.length} {ingressos.length === 1 ? "ingresso selecionado" : "ingressos selecionados"}
                            </h2>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-6 pb-6">
                        {ingressos.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {ingressos.map((i) => (
                                    <span key={i.id} className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary">
                                        {i.grupo} · {i.nome}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Selecionadas */}
                        <div className="flex flex-col gap-2.5">
                            <span className="text-xs font-semibold tracking-wide text-tertiary uppercase">No formulário · {itens.length}</span>
                            {itens.length === 0 ? (
                                <p className="text-sm text-tertiary">Marque abaixo as perguntas que entram nos ingressos.</p>
                            ) : (
                                <div className="flex flex-col">
                                    <AnimatePresence initial={false} mode="popLayout">
                                        {itens.map((it) => {
                                            const pergunta = perguntas.find((p) => p.id === it.perguntaId);
                                            if (!pergunta) return null;
                                            return (
                                                <motion.div
                                                    key={it.perguntaId}
                                                    layout
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0.9, opacity: 0 }}
                                                    transition={{ type: "spring", stiffness: 600, damping: 42, mass: 0.5 }}
                                                >
                                                    <LinhaSelecionada
                                                        item={it}
                                                        pergunta={pergunta}
                                                        onRemover={() => remover(it.perguntaId)}
                                                        onObrigatoria={(v) => setObrigatoria(it.perguntaId, v)}
                                                    />
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Não selecionadas */}
                        <div className="flex flex-col gap-2.5">
                            <span className="text-xs font-semibold tracking-wide text-tertiary uppercase">Disponíveis</span>
                            {disponiveis.length === 0 ? (
                                <p className="text-sm text-tertiary">Tudo já foi adicionado.</p>
                            ) : (
                                <div className="flex flex-col">
                                    <AnimatePresence initial={false} mode="popLayout">
                                        {disponiveis.map((p, index) => (
                                            <motion.div
                                                key={p.id}
                                                layout
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.9, opacity: 0 }}
                                                transition={{ type: "spring", stiffness: 600, damping: 42, mass: 0.5 }}
                                            >
                                                <LinhaDisponivel pergunta={p} onAdicionar={() => adicionar(p)} />
                                                {index < disponiveis.length - 1 && <hr className="mx-auto w-4/5 border-t border-secondary" />}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 flex-col gap-3 border-t border-secondary px-6 py-4">
                        <span className="text-xs text-tertiary">As perguntas entram no fim do formulário de cada ingresso.</span>
                        <div className="flex items-center justify-between gap-2">
                            <Button size="md" color="link-color" iconLeading={Plus} onClick={onCriarPergunta}>
                                Criar pergunta
                            </Button>
                            <div className="flex gap-2">
                                <Button size="md" color="secondary" onClick={onClose}>
                                    Cancelar
                                </Button>
                                <Button size="md" color="primary" onClick={vincular} isDisabled={itens.length === 0}>
                                    Vincular
                                </Button>
                            </div>
                        </div>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}

function LinhaSelecionada({
    item,
    pergunta,
    onRemover,
    onObrigatoria,
}: {
    item: AssocItem;
    pergunta: Pergunta;
    onRemover: () => void;
    onObrigatoria: (value: boolean) => void;
}) {
    const meta = TIPO_PERGUNTA[pergunta.tipo];
    const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onRemover}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRemover();
                }
            }}
            aria-label={`Remover ${pergunta.titulo}`}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-100 ease-linear hover:bg-primary_hover"
        >
            <Checkbox size="md" isSelected isReadOnly aria-hidden="true" />
            <meta.icon className="size-4 shrink-0 text-fg-quaternary" />
            <span className="line-clamp-2 min-w-0 flex-1 text-sm text-primary">{pergunta.titulo}</span>
            <div onClick={stop} onKeyDown={stop}>
                <Toggle size="sm" label={item.obrigatoria ? "Obrigatória" : "Opcional"} isSelected={item.obrigatoria} onChange={onObrigatoria} />
            </div>
        </div>
    );
}

function LinhaDisponivel({ pergunta, onAdicionar }: { pergunta: Pergunta; onAdicionar: () => void }) {
    const meta = TIPO_PERGUNTA[pergunta.tipo];
    return (
        <button
            type="button"
            onClick={onAdicionar}
            aria-label={`Adicionar ${pergunta.titulo}`}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-[18px] text-left transition-colors duration-100 ease-linear hover:bg-primary_hover"
        >
            <Checkbox size="md" isSelected={false} isReadOnly aria-hidden="true" />
            <meta.icon className="size-4 shrink-0 text-fg-quaternary" />
            <span className="line-clamp-2 min-w-0 flex-1 text-sm text-primary">{pergunta.titulo}</span>
        </button>
    );
}
