import { useEffect, useState } from "react";
import { Plus, Trash01, XClose } from "@untitledui/icons";
import { toast } from "sonner";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { TIPO_PERGUNTA, TIPOS_ORDENADOS, usePesquisas, type Pergunta, type PerguntaInput, type TipoPergunta } from "../data/pesquisas-store";

interface PerguntaEditorSlideoutProps {
    isOpen: boolean;
    onClose: () => void;
    /** Pergunta em edição, ou null para criar. */
    pergunta: Pergunta | null;
    /** Chamado após salvar (criação ou edição). */
    onSaved?: (pergunta: Pergunta) => void;
}

const emptyDraft: PerguntaInput = {
    titulo: "",
    ajuda: "",
    tipo: "texto-curto",
    opcoes: [],
    ativa: true,
};

export function PerguntaEditorSlideout({ isOpen, onClose, pergunta, onSaved }: PerguntaEditorSlideoutProps) {
    const { addPergunta, updatePergunta } = usePesquisas();
    const [draft, setDraft] = useState<PerguntaInput>(emptyDraft);

    // Sincroniza o rascunho ao abrir / trocar a pergunta editada.
    useEffect(() => {
        if (!isOpen) return;
        setDraft(
            pergunta
                ? { titulo: pergunta.titulo, ajuda: pergunta.ajuda ?? "", tipo: pergunta.tipo, opcoes: [...pergunta.opcoes], ativa: pergunta.ativa }
                : emptyDraft,
        );
    }, [isOpen, pergunta]);

    const set = <K extends keyof PerguntaInput>(key: K, value: PerguntaInput[K]) => setDraft((d) => ({ ...d, [key]: value }));

    const temOpcoes = TIPO_PERGUNTA[draft.tipo].temOpcoes;
    const opcoesValidas = draft.opcoes.filter((o) => o.trim() !== "");
    const podeSalvar = draft.titulo.trim() !== "" && (!temOpcoes || opcoesValidas.length >= 2);

    const escolherTipo = (tipo: TipoPergunta) => {
        const temOp = TIPO_PERGUNTA[tipo].temOpcoes;
        setDraft((d) => ({ ...d, tipo, opcoes: temOp && d.opcoes.length === 0 ? ["", ""] : d.opcoes }));
    };

    const setOpcao = (i: number, value: string) => setDraft((d) => ({ ...d, opcoes: d.opcoes.map((o, idx) => (idx === i ? value : o)) }));
    const addOpcao = () => setDraft((d) => ({ ...d, opcoes: [...d.opcoes, ""] }));
    const removeOpcao = (i: number) => setDraft((d) => ({ ...d, opcoes: d.opcoes.filter((_, idx) => idx !== i) }));

    const salvar = () => {
        if (!podeSalvar) return;
        const input: PerguntaInput = { ...draft, titulo: draft.titulo.trim(), ajuda: draft.ajuda?.trim() || undefined, opcoes: temOpcoes ? opcoesValidas : [] };
        if (pergunta) {
            updatePergunta(pergunta.id, input);
            onSaved?.({ ...pergunta, ...input });
            toast.success("Alterações salvas", { description: `“${input.titulo}” foi atualizada.` });
        } else {
            const nova = addPergunta(input);
            onSaved?.(nova);
            toast.success("Pergunta criada", { description: `“${input.titulo}” já está no seu banco.` });
        }
        onClose();
    };

    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-[60] flex justify-end bg-overlay/70 outline-hidden backdrop-blur-[2px]",
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
                    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-secondary px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-md font-semibold text-primary">{pergunta ? "Editar pergunta" : "Nova pergunta"}</h2>
                            <p className="text-sm text-tertiary">Fica no banco para usar em vários ingressos.</p>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
                        {/* Pergunta */}
                        <Input
                            label="Pergunta"
                            placeholder="Ex.: Qual o tamanho da sua camiseta?"
                            value={draft.titulo}
                            onChange={(v) => set("titulo", v)}
                            isRequired
                            autoFocus
                        />

                        {/* Texto de apoio */}
                        <Input
                            label="Texto de apoio"
                            hint="Opcional. Aparece abaixo da pergunta."
                            placeholder="Ex.: O kit do evento inclui uma camiseta."
                            value={draft.ajuda ?? ""}
                            onChange={(v) => set("ajuda", v)}
                        />

                        {/* Tipo de resposta */}
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-secondary">Tipo de resposta</span>
                            <div className="grid grid-cols-2 gap-2">
                                {TIPOS_ORDENADOS.map((tipo) => {
                                    const meta = TIPO_PERGUNTA[tipo];
                                    const selected = draft.tipo === tipo;
                                    return (
                                        <button
                                            key={tipo}
                                            type="button"
                                            onClick={() => escolherTipo(tipo)}
                                            aria-pressed={selected}
                                            className={cx(
                                                "flex items-start gap-2.5 rounded-lg border p-3 text-left transition duration-100 ease-linear",
                                                selected ? "border-brand bg-brand-primary ring-1 ring-brand" : "border-secondary hover:bg-primary_hover",
                                            )}
                                        >
                                            <meta.icon className={cx("size-5 shrink-0", selected ? "text-fg-brand-primary" : "text-fg-quaternary")} />
                                            <span className="flex min-w-0 flex-col">
                                                <span className="text-sm font-semibold text-primary">{meta.label}</span>
                                                <span className="text-xs text-tertiary">{meta.descricao}</span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Opções (tipos de escolha) */}
                        {temOpcoes && (
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-secondary">Opções</span>
                                <div className="flex flex-col gap-2">
                                    {draft.opcoes.map((opcao, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Input
                                                aria-label={`Opção ${i + 1}`}
                                                placeholder={`Opção ${i + 1}`}
                                                value={opcao}
                                                onChange={(v) => setOpcao(i, v)}
                                                className="flex-1"
                                            />
                                            <ButtonUtility
                                                size="sm"
                                                color="tertiary"
                                                icon={Trash01}
                                                tooltip="Remover opção"
                                                isDisabled={draft.opcoes.length <= 2}
                                                onClick={() => removeOpcao(i)}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <Button size="sm" color="link-color" iconLeading={Plus} onClick={addOpcao} className="self-start">
                                    Adicionar opção
                                </Button>
                            </div>
                        )}

                        {/* Comportamento */}
                        <div className="flex flex-col gap-4 border-t border-secondary pt-5">
                            <Toggle
                                size="sm"
                                label="Pergunta ativa"
                                hint="Só perguntas ativas aparecem para usar."
                                isSelected={draft.ativa}
                                onChange={(v) => set("ativa", v)}
                            />
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-secondary px-5 py-4">
                        <Button size="md" color="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button size="md" color="primary" onClick={salvar} isDisabled={!podeSalvar}>
                            {pergunta ? "Salvar alterações" : "Criar pergunta"}
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
