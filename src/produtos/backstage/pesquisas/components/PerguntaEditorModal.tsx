import { useEffect, useState } from "react";
import { InfoCircle, Plus, Trash01, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { TIPO_PERGUNTA, TIPOS_ORDENADOS, usePesquisas, type Pergunta, type PerguntaInput, type TipoPergunta } from "../data/pesquisas-store";
import { perguntaSemelhante } from "../utils/similaridade";

interface PerguntaEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Pergunta em edição, ou null para criar. */
    pergunta: Pergunta | null;
    /** Chamado após salvar (criação ou edição). */
    onSaved?: (pergunta: Pergunta) => void;
    /** Pede a exclusão da pergunta (o pai confirma). Só aparece ao editar. */
    onExcluir?: (pergunta: Pergunta) => void;
}

const emptyDraft: PerguntaInput = { titulo: "", ajuda: "", tipo: "texto-curto", opcoes: [], ativa: true };

export function PerguntaEditorModal({ isOpen, onClose, pergunta, onSaved, onExcluir }: PerguntaEditorModalProps) {
    const { addPergunta, updatePergunta, perguntas } = usePesquisas();
    const [draft, setDraft] = useState<PerguntaInput>(emptyDraft);
    const [semelhante, setSemelhante] = useState<{ titulo: string } | null>(null);
    const [verificando, setVerificando] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setSemelhante(null);
        setVerificando(false);
        setDraft(
            pergunta
                ? { titulo: pergunta.titulo, ajuda: pergunta.ajuda ?? "", tipo: pergunta.tipo, opcoes: [...pergunta.opcoes], ativa: pergunta.ativa }
                : emptyDraft,
        );
    }, [isOpen, pergunta]);

    // Verifica perguntas parecidas (semântico) enquanto o usuário digita o título.
    useEffect(() => {
        if (!isOpen) return;
        let cancel = false;
        const texto = draft.titulo;
        if (texto.trim().length < 4) {
            setSemelhante(null);
            setVerificando(false);
            return;
        }
        const id = setTimeout(async () => {
            setVerificando(true);
            const candidatos = perguntas.filter((p) => p.id !== pergunta?.id).map((p) => ({ id: p.id, titulo: p.titulo }));
            try {
                const r = await perguntaSemelhante(texto, candidatos);
                if (!cancel) setSemelhante(r ? { titulo: r.titulo } : null);
            } catch {
                if (!cancel) setSemelhante(null);
            } finally {
                if (!cancel) setVerificando(false);
            }
        }, 450);
        return () => {
            cancel = true;
            clearTimeout(id);
        };
    }, [draft.titulo, isOpen, perguntas, pergunta]);

    const temOpcoes = TIPO_PERGUNTA[draft.tipo].temOpcoes;
    const opcoesValidas = draft.opcoes.filter((o) => o.trim() !== "");
    const podeSalvar = draft.titulo.trim() !== "" && (!temOpcoes || opcoesValidas.length >= 2);
    const emUso = (pergunta?.respostas ?? 0) > 0;

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

    const tipoItems = TIPOS_ORDENADOS.map((t) => ({ id: t, label: TIPO_PERGUNTA[t].label, descricao: TIPO_PERGUNTA[t].descricao, icon: TIPO_PERGUNTA[t].icon }));

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
                        "flex max-h-full w-full max-w-[560px] flex-col rounded-2xl bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex max-h-[inherit] flex-col outline-hidden">
                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-5">
                        <h2 className="text-lg font-semibold text-primary">{pergunta ? "Editar pergunta" : "Nova pergunta"}</h2>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6">
                        {emUso && (
                            <div className="flex items-start gap-3 rounded-xl bg-secondary p-4">
                                <FeaturedIcon icon={InfoCircle} color="warning" theme="light" size="sm" className="shrink-0" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-semibold text-primary">Esta pergunta está em uso</span>
                                    <span className="text-sm text-tertiary">Já tem respostas, então não dá para excluir — só editar.</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <Input
                                label="Título da pergunta"
                                isRequired
                                autoFocus
                                placeholder="Ex.: Qual o tamanho da sua camiseta?"
                                value={draft.titulo}
                                onChange={(v) => setDraft((d) => ({ ...d, titulo: v }))}
                            />
                            {verificando ? (
                                <div className="flex items-center gap-2 text-xs text-tertiary">
                                    <span
                                        className="size-4 shrink-0 animate-spin rounded-full border-2 border-[var(--color-fg-quaternary)] border-t-[var(--color-fg-brand-primary)]"
                                        style={{ borderTopColor: "var(--color-fg-brand-primary)" }}
                                    />
                                    Procurando perguntas parecidas…
                                </div>
                            ) : semelhante ? (
                                <div className="flex items-start gap-2.5 rounded-lg bg-warning-primary p-3">
                                    <InfoCircle className="mt-0.5 size-4 shrink-0 text-fg-warning-primary" />
                                    <span className="text-sm text-secondary">
                                        Você já tem a pergunta “<span className="font-semibold text-primary">{semelhante.titulo}</span>” cadastrada, que é muito parecida.
                                    </span>
                                </div>
                            ) : null}
                        </div>

                        <Select
                            label="Tipo da resposta"
                            isRequired
                            selectedKey={draft.tipo}
                            onSelectionChange={(k: React.Key) => escolherTipo(k as TipoPergunta)}
                            items={tipoItems}
                        >
                            {(item: (typeof tipoItems)[number]) => (
                                <Select.Item id={item.id} icon={item.icon} supportingText={item.descricao}>
                                    {item.label}
                                </Select.Item>
                            )}
                        </Select>

                        {temOpcoes && (
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-secondary">Opções</span>
                                <div className="flex flex-col gap-2">
                                    {draft.opcoes.map((opcao, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Input aria-label={`Opção ${i + 1}`} placeholder={`Opção ${i + 1}`} value={opcao} onChange={(v) => setOpcao(i, v)} className="flex-1" />
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
                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-secondary px-6 py-4">
                        {pergunta ? (
                            <Button
                                size="md"
                                color="tertiary-destructive"
                                iconLeading={Trash01}
                                isDisabled={emUso}
                                onClick={() => onExcluir?.(pergunta)}
                            >
                                Excluir pergunta
                            </Button>
                        ) : (
                            <span />
                        )}
                        <div className="flex gap-2">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" onClick={salvar} isDisabled={!podeSalvar}>
                                {pergunta ? "Salvar alterações" : "Criar pergunta"}
                            </Button>
                        </div>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
