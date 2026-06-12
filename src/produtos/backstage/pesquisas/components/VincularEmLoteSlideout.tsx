import { useEffect, useMemo, useState } from "react";
import { Plus, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";
import { TIPO_PERGUNTA, usePesquisas, type Pergunta, type TipoIngresso } from "../data/pesquisas-store";

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

    const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
    const [obrigatorias, setObrigatorias] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setMarcadas(new Set());
            setObrigatorias(true);
        }
    }, [isOpen]);

    const disponiveis = useMemo(() => perguntas.filter((p) => p.ativa), [perguntas]);

    const toggle = (id: string) =>
        setMarcadas((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const vincular = () => {
        if (marcadas.size === 0 || ingressos.length === 0) return;
        vincularPerguntasEmIngressos(
            ingressos.map((i) => i.id),
            Array.from(marcadas),
            obrigatorias,
        );
        const nP = marcadas.size;
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
                        "h-full w-full max-w-[480px] border-l border-secondary bg-primary shadow-2xl outline-hidden",
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

                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
                        <p className="text-sm text-tertiary">
                            As perguntas marcadas entram em todos os ingressos selecionados. Quem já tinha a pergunta não muda. A ordem e a obrigatoriedade você ajusta depois, em
                            cada ingresso.
                        </p>

                        {ingressos.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {ingressos.map((i) => (
                                    <span key={i.id} className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary">
                                        {i.grupo} · {i.nome}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col gap-2.5">
                            <span className="text-xs font-semibold tracking-wide text-tertiary uppercase">Perguntas · {marcadas.size} marcadas</span>
                            {disponiveis.length === 0 ? (
                                <p className="text-sm text-tertiary">Nenhuma pergunta ativa no banco. Crie uma abaixo.</p>
                            ) : (
                                <div className="flex flex-col">
                                    <AnimatePresence initial={false} mode="popLayout">
                                        {disponiveis.map((p, index) => (
                                            <motion.div
                                                key={p.id}
                                                layout
                                                initial={{ scale: 0.95, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.95, opacity: 0 }}
                                                transition={{ type: "spring", stiffness: 600, damping: 42, mass: 0.5 }}
                                            >
                                                <LinhaPergunta pergunta={p} marcada={marcadas.has(p.id)} onToggle={() => toggle(p.id)} />
                                                {index < disponiveis.length - 1 && <hr className="mx-auto w-4/5 border-t border-secondary" />}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Obrigatoriedade do lote */}
                    <div className="shrink-0 border-t border-secondary px-6 py-3.5">
                        <Checkbox
                            size="md"
                            label="Marcar todas como obrigatórias"
                            hint="O comprador só finaliza a compra depois de responder."
                            isSelected={obrigatorias}
                            onChange={(v: boolean) => setObrigatorias(v)}
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-secondary px-6 py-4">
                        <Button size="md" color="link-color" iconLeading={Plus} onClick={onCriarPergunta}>
                            Criar pergunta
                        </Button>
                        <div className="flex gap-2">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" onClick={vincular} isDisabled={marcadas.size === 0}>
                                Vincular
                            </Button>
                        </div>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}

function LinhaPergunta({ pergunta, marcada, onToggle }: { pergunta: Pergunta; marcada: boolean; onToggle: () => void }) {
    const meta = TIPO_PERGUNTA[pergunta.tipo];
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={marcada}
            aria-label={`${marcada ? "Desmarcar" : "Marcar"} ${pergunta.titulo}`}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-3.5 text-left transition-colors duration-100 ease-linear hover:bg-primary_hover"
        >
            <Checkbox size="md" isSelected={marcada} isReadOnly aria-hidden="true" />
            <meta.icon className="size-4 shrink-0 text-fg-quaternary" />
            <span className="line-clamp-2 min-w-0 flex-1 text-sm text-primary">{pergunta.titulo}</span>
        </button>
    );
}
