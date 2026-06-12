import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { TIPO_PERGUNTA, usePesquisas, type AssocItem, type Pergunta, type TipoIngresso } from "../data/pesquisas-store";

interface AssociacaoSlideoutProps {
    isOpen: boolean;
    onClose: () => void;
    ingresso: TipoIngresso | null;
    /** Salva o rascunho atual e pede para o pai abrir o editor de nova pergunta. */
    onCriarPergunta: () => void;
}

export function AssociacaoSlideout({ isOpen, onClose, ingresso, onCriarPergunta }: AssociacaoSlideoutProps) {
    const { perguntas, itensDoIngresso, setAssociacao } = usePesquisas();

    // Rascunho local — só grava ao "Salvar" (ou ao "Criar pergunta").
    const [itens, setItens] = useState<AssocItem[]>([]);

    useEffect(() => {
        if (!isOpen || !ingresso) return;
        setItens(itensDoIngresso(ingresso.id).map((it) => ({ perguntaId: it.pergunta.id, obrigatoria: it.obrigatoria })));
    }, [isOpen, ingresso, itensDoIngresso]);

    const selecionadas = useMemo(() => new Set(itens.map((it) => it.perguntaId)), [itens]);
    const disponiveis = useMemo(() => perguntas.filter((p) => !selecionadas.has(p.id) && p.ativa), [perguntas, selecionadas]);

    const adicionar = (p: Pergunta) => setItens((prev) => [...prev, { perguntaId: p.id, obrigatoria: true }]);
    const remover = (perguntaId: string) => setItens((prev) => prev.filter((it) => it.perguntaId !== perguntaId));
    const setObrigatoria = (perguntaId: string, value: boolean) =>
        setItens((prev) => prev.map((it) => (it.perguntaId === perguntaId ? { ...it, obrigatoria: value } : it)));

    const mover = (index: number, dir: -1 | 1) =>
        setItens((prev) => {
            const alvo = index + dir;
            if (alvo < 0 || alvo >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[alvo]] = [next[alvo], next[index]];
            return next;
        });

    const commit = () => {
        if (!ingresso) return;
        setAssociacao(ingresso.id, itens);
    };

    const vincular = () => {
        if (!ingresso) return;
        commit();
        toast.success("Formulário atualizado", {
            description: itens.length === 0 ? `${ingresso.nome} ficou sem perguntas.` : `${itens.length} ${itens.length === 1 ? "pergunta" : "perguntas"} em ${ingresso.nome}.`,
        });
        onClose();
    };

    // Salva o rascunho e abre o editor de nova pergunta (o pai reabre este slideout depois).
    const criarPergunta = () => {
        commit();
        onCriarPergunta();
    };

    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className="fixed inset-0 z-50 flex justify-end outline-hidden"
        >
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
                            <span className="text-xs font-semibold tracking-wide text-tertiary uppercase">{ingresso?.grupo}</span>
                            <h2 className="text-lg font-semibold text-primary">{ingresso?.nome}</h2>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-6 pb-6">
                        {/* Selecionadas */}
                        <div className="flex flex-col gap-2.5">
                            <span className="text-xs font-semibold tracking-wide text-tertiary uppercase">Selecionadas · {itens.length}</span>
                            {itens.length === 0 ? (
                                <p className="text-sm text-tertiary">Marque abaixo para incluir.</p>
                            ) : (
                                <div className="flex flex-col">
                                    <AnimatePresence initial={false} mode="popLayout">
                                        {itens.map((it, index) => {
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
                                                        posicao={index + 1}
                                                        total={itens.length}
                                                        pergunta={pergunta}
                                                        onRemover={() => remover(it.perguntaId)}
                                                        onObrigatoria={(v) => setObrigatoria(it.perguntaId, v)}
                                                        onSubir={() => mover(index, -1)}
                                                        onDescer={() => mover(index, 1)}
                                                    />
                                                    {index < itens.length - 1 && <hr className="mx-auto w-4/5 border-t border-secondary" />}
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Não selecionadas */}
                        <div className="flex flex-col gap-2.5">
                            <span className="text-xs font-semibold tracking-wide text-tertiary uppercase">Não selecionadas</span>
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
                    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-secondary px-6 py-4">
                        <Button size="md" color="link-color" iconLeading={Plus} onClick={criarPergunta}>
                            Criar pergunta
                        </Button>
                        <div className="flex gap-2">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" onClick={vincular}>
                                Salvar
                            </Button>
                        </div>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Linha selecionada — ordenável por chevron ↑ / ↓                   */
/* ------------------------------------------------------------------ */

function LinhaSelecionada({
    item,
    posicao,
    total,
    pergunta,
    onRemover,
    onObrigatoria,
    onSubir,
    onDescer,
}: {
    item: AssocItem;
    posicao: number;
    total: number;
    pergunta: Pergunta;
    onRemover: () => void;
    onObrigatoria: (value: boolean) => void;
    onSubir: () => void;
    onDescer: () => void;
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
            <span className="w-4 shrink-0 text-center text-xs font-semibold text-tertiary tabular-nums">{posicao}</span>
            <meta.icon className="size-4 shrink-0 text-fg-quaternary" />
            <span className="line-clamp-2 min-w-0 flex-1 text-sm text-primary">{pergunta.titulo}</span>
            <div onClick={stop} onKeyDown={stop} className="flex shrink-0 items-center gap-3">
                <Toggle size="sm" label={item.obrigatoria ? "Obrigatória" : "Opcional"} isSelected={item.obrigatoria} onChange={onObrigatoria} />
                <div className="flex flex-col">
                    <ButtonUtility size="xs" color="tertiary" icon={ChevronUp} tooltip="Subir" isDisabled={posicao === 1} onClick={onSubir} />
                    <ButtonUtility size="xs" color="tertiary" icon={ChevronDown} tooltip="Descer" isDisabled={posicao === total} onClick={onDescer} />
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Linha disponível — só checkbox + título (não está no formulário)  */
/* ------------------------------------------------------------------ */

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
