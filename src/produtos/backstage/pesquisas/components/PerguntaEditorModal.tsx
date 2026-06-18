import { useEffect, useMemo, useRef, useState } from "react";
import { AlertOctagon, AlertTriangle, InfoCircle, Plus, Trash01, XClose } from "@untitledui/icons";
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
    /** Pergunta em edição, ou null para criar (criação permite empilhar várias). */
    pergunta: Pergunta | null;
    /** Chamado após salvar — uma vez por pergunta criada/editada. */
    onSaved?: (pergunta: Pergunta) => void;
    /** Pede a exclusão da pergunta (o pai confirma). Só aparece ao editar. */
    onExcluir?: (pergunta: Pergunta) => void;
}

/** Bloco de pergunta no construtor (PerguntaInput + chave local). */
type Bloco = PerguntaInput & { key: string };

const blocoVazio = (key: string): Bloco => ({ key, titulo: "", ajuda: "", tipo: "texto-curto", opcoes: [], ativa: true, obrigatoria: true });
const temOpcoes = (tipo: TipoPergunta) => TIPO_PERGUNTA[tipo].temOpcoes;
const opcoesValidas = (b: Bloco) => b.opcoes.filter((o) => o.trim() !== "");
const blocoValido = (b: Bloco) => b.titulo.trim() !== "" && (!temOpcoes(b.tipo) || opcoesValidas(b).length >= 2);
const toInput = (b: Bloco): PerguntaInput => ({ titulo: b.titulo.trim(), ajuda: b.ajuda?.trim() || undefined, tipo: b.tipo, opcoes: temOpcoes(b.tipo) ? opcoesValidas(b) : [], ativa: b.ativa, obrigatoria: b.obrigatoria });

export function PerguntaEditorModal({ isOpen, onClose, pergunta, onSaved, onExcluir }: PerguntaEditorModalProps) {
    const { addPergunta, updatePergunta, perguntas } = usePesquisas();
    const seq = useRef(0);
    const [blocos, setBlocos] = useState<Bloco[]>([]);
    const [expandido, setExpandido] = useState<string | null>(null);
    const [semelhante, setSemelhante] = useState<{ titulo: string } | null>(null);
    const [verificando, setVerificando] = useState(false);

    const editando = pergunta !== null;
    const emUso = (pergunta?.respostas ?? 0) > 0;

    useEffect(() => {
        if (!isOpen) return;
        setSemelhante(null);
        setVerificando(false);
        seq.current = 0;
        if (pergunta) {
            const b: Bloco = { key: "edit", titulo: pergunta.titulo, ajuda: pergunta.ajuda ?? "", tipo: pergunta.tipo, opcoes: [...pergunta.opcoes], ativa: pergunta.ativa, obrigatoria: pergunta.obrigatoria };
            setBlocos([b]);
            setExpandido("edit");
        } else {
            const b = blocoVazio(`b${seq.current++}`);
            setBlocos([b]);
            setExpandido(b.key);
        }
    }, [isOpen, pergunta]);

    const blocoExp = blocos.find((b) => b.key === expandido) ?? null;

    // Títulos já cadastrados (banco da organização + perguntas do evento), exceto a que está em edição.
    const titulosExistentes = useMemo(() => {
        const set = new Set<string>();
        for (const p of perguntas) {
            if (p.id === pergunta?.id) continue;
            set.add(p.titulo.trim().toLowerCase());
        }
        return set;
    }, [perguntas, pergunta]);

    const tituloDuplicado = (titulo: string) => {
        const t = titulo.trim().toLowerCase();
        return t !== "" && titulosExistentes.has(t);
    };

    // Verifica perguntas parecidas para o bloco em edição.
    useEffect(() => {
        if (!isOpen) return;
        setSemelhante(null);
        const texto = blocoExp?.titulo ?? "";
        if (texto.trim().length < 4) {
            setVerificando(false);
            return;
        }
        // Ao editar uma pergunta já criada, só avisa se o título for de fato alterado.
        if (pergunta && texto.trim() === pergunta.titulo.trim()) {
            setVerificando(false);
            return;
        }
        let cancel = false;
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
    }, [isOpen, expandido, blocoExp?.titulo, perguntas, pergunta]);

    const setBloco = (key: string, patch: Partial<Bloco>) => setBlocos((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
    const escolherTipo = (key: string, tipo: TipoPergunta) =>
        setBlocos((prev) => prev.map((b) => (b.key === key ? { ...b, tipo, opcoes: temOpcoes(tipo) && b.opcoes.length === 0 ? ["", ""] : b.opcoes } : b)));
    const setOpcao = (key: string, i: number, v: string) => setBlocos((prev) => prev.map((b) => (b.key === key ? { ...b, opcoes: b.opcoes.map((o, idx) => (idx === i ? v : o)) } : b)));
    const addOpcao = (key: string) => setBlocos((prev) => prev.map((b) => (b.key === key ? { ...b, opcoes: [...b.opcoes, ""] } : b)));
    const removeOpcao = (key: string, i: number) => setBlocos((prev) => prev.map((b) => (b.key === key ? { ...b, opcoes: b.opcoes.filter((_, idx) => idx !== i) } : b)));

    const removerBloco = (key: string) =>
        setBlocos((prev) => {
            const next = prev.filter((b) => b.key !== key);
            if (key === expandido) setExpandido(next.length ? next[next.length - 1].key : null);
            return next;
        });

    const podeSalvar = blocos.length > 0 && blocos.every(blocoValido) && !blocos.some((b) => tituloDuplicado(b.titulo));

    const salvar = () => {
        if (!podeSalvar) return;
        if (editando && pergunta) {
            const input = toInput(blocos[0]);
            updatePergunta(pergunta.id, input);
            onSaved?.({ ...pergunta, ...input });
            toast.success("Alterações salvas", { description: `“${input.titulo}” foi atualizada.` });
        } else {
            const criadas = blocos.map((b) => addPergunta(toInput(b)));
            criadas.forEach((p) => onSaved?.(p));
            toast.success(criadas.length > 1 ? `${criadas.length} perguntas criadas` : "Pergunta criada", {
                description: criadas.length > 1 ? "Já estão no seu banco." : `“${criadas[0].titulo}” já está no seu banco.`,
            });
        }
        onClose();
    };

    const tipoItems = TIPOS_ORDENADOS.map((t) => ({ id: t, label: TIPO_PERGUNTA[t].label, descricao: TIPO_PERGUNTA[t].descricao, icon: TIPO_PERGUNTA[t].icon }));

    const labelSalvar = editando ? "Salvar alterações" : blocos.length > 1 ? `Salvar (${blocos.length})` : "Criar pergunta";

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
                        "flex max-h-[90vh] w-full max-w-[560px] flex-col rounded-2xl bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex min-h-0 flex-1 flex-col outline-hidden">
                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-5">
                        <h2 className="text-lg font-semibold text-primary">{editando ? "Editar pergunta" : blocos.length > 1 ? "Novas perguntas" : "Nova pergunta"}</h2>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
                        {emUso && (
                            <div className="flex items-start gap-3 rounded-xl bg-secondary p-4">
                                <FeaturedIcon icon={InfoCircle} color="warning" theme="light" size="sm" className="shrink-0" />
                                <span className="text-sm text-tertiary">
                                    Esta pergunta não pode ser excluída ou ter seu tipo alterado por já possuir respostas.{" "}
                                    {pergunta && temOpcoes(pergunta.tipo) ? "Você ainda pode editar o título e as opções." : "Apenas o título pode ser editado."}
                                </span>
                            </div>
                        )}

                        {blocos.map((b, idx) =>
                            b.key === expandido ? (
                                <BlocoEditor
                                    key={b.key}
                                    bloco={b}
                                    indice={idx + 1}
                                    multi={!editando && blocos.length > 1}
                                    podeRemover={!editando && blocos.length > 1}
                                    duplicado={tituloDuplicado(b.titulo)}
                                    semelhante={semelhante}
                                    verificando={verificando}
                                    tipoItems={tipoItems}
                                    tipoBloqueado={emUso}
                                    onTitulo={(v) => setBloco(b.key, { titulo: v })}
                                    onTipo={(t) => escolherTipo(b.key, t)}
                                    onSetOpcao={(i, v) => setOpcao(b.key, i, v)}
                                    onAddOpcao={() => addOpcao(b.key)}
                                    onRemoveOpcao={(i) => removeOpcao(b.key, i)}
                                    onRemover={() => removerBloco(b.key)}
                                />
                            ) : (
                                <BlocoResumo key={b.key} bloco={b} indice={idx + 1} onAbrir={() => setExpandido(b.key)} onRemover={() => removerBloco(b.key)} />
                            ),
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-secondary px-6 py-4">
                        {editando && pergunta ? (
                            <Button size="md" color="tertiary-destructive" iconLeading={Trash01} isDisabled={emUso} onClick={() => onExcluir?.(pergunta)}>
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
                                {labelSalvar}
                            </Button>
                        </div>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Bloco em edição (formulário completo)                             */
/* ------------------------------------------------------------------ */

function BlocoEditor({
    bloco,
    indice,
    multi,
    podeRemover,
    duplicado,
    semelhante,
    verificando,
    tipoItems,
    tipoBloqueado,
    onTitulo,
    onTipo,
    onSetOpcao,
    onAddOpcao,
    onRemoveOpcao,
    onRemover,
}: {
    bloco: Bloco;
    indice: number;
    multi: boolean;
    podeRemover: boolean;
    duplicado: boolean;
    semelhante: { titulo: string } | null;
    verificando: boolean;
    tipoItems: { id: TipoPergunta; label: string; descricao: string; icon: React.FC<{ className?: string }> }[];
    tipoBloqueado?: boolean;
    onTitulo: (v: string) => void;
    onTipo: (t: TipoPergunta) => void;
    onSetOpcao: (i: number, v: string) => void;
    onAddOpcao: () => void;
    onRemoveOpcao: (i: number) => void;
    onRemover: () => void;
}) {
    const opcoes = temOpcoes(bloco.tipo);
    return (
        <div className={cx("flex flex-col gap-5", multi && "rounded-xl p-4 ring-1 ring-inset ring-brand")}>
            {multi && (
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-primary">Pergunta {indice}</span>
                    {podeRemover && <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover" onClick={onRemover} />}
                </div>
            )}

            <div className="flex flex-col gap-2">
                <Input label="Título da pergunta" isRequired isInvalid={duplicado} autoFocus placeholder="Ex.: Qual o tamanho da sua camiseta?" value={bloco.titulo} onChange={onTitulo} />
                {duplicado ? (
                    <div className="flex items-start gap-3 rounded-xl bg-secondary p-4">
                        <FeaturedIcon icon={AlertOctagon} color="error" theme="light" size="sm" className="shrink-0" />
                        <span className="self-center text-sm text-tertiary">Já existe uma pergunta com este título. Por favor, escolha um título diferente.</span>
                    </div>
                ) : verificando ? (
                    <div className="flex items-center gap-2 text-xs text-tertiary">
                        <span
                            className="size-4 shrink-0 animate-spin rounded-full border-2 border-[var(--color-fg-quaternary)] border-t-[var(--color-fg-brand-primary)]"
                            style={{ borderTopColor: "var(--color-fg-brand-primary)" }}
                        />
                        Procurando perguntas parecidas…
                    </div>
                ) : semelhante ? (
                    <div className="flex items-start gap-3 rounded-xl bg-secondary p-4">
                        <FeaturedIcon icon={AlertTriangle} color="warning" theme="light" size="sm" className="shrink-0" />
                        <span className="self-center text-sm text-tertiary">
                            Você já tem uma pergunta chamada “<span className="font-semibold text-primary">{semelhante.titulo}</span>” cadastrada. Deseja criar outra muito parecida?
                        </span>
                    </div>
                ) : null}
            </div>

            <Select label="Tipo da resposta" isRequired isDisabled={tipoBloqueado} selectedKey={bloco.tipo} onSelectionChange={(k: React.Key) => onTipo(k as TipoPergunta)} items={tipoItems}>
                {(item: (typeof tipoItems)[number]) => (
                    <Select.Item id={item.id} icon={item.icon} supportingText={item.descricao}>
                        {item.label}
                    </Select.Item>
                )}
            </Select>

            {opcoes && (
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-secondary">Opções</span>
                    <div className="flex flex-col gap-2">
                        {bloco.opcoes.map((opcao, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Input aria-label={`Opção ${i + 1}`} placeholder={`Opção ${i + 1}`} value={opcao} onChange={(v) => onSetOpcao(i, v)} className="flex-1" />
                                <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover opção" isDisabled={bloco.opcoes.length <= 2} onClick={() => onRemoveOpcao(i)} />
                            </div>
                        ))}
                    </div>
                    <Button size="sm" color="link-color" iconLeading={Plus} onClick={onAddOpcao} className="self-start">
                        Adicionar opção
                    </Button>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Bloco recolhido (linha de resumo)                                 */
/* ------------------------------------------------------------------ */

function BlocoResumo({ bloco, indice, onAbrir, onRemover }: { bloco: Bloco; indice: number; onAbrir: () => void; onRemover: () => void }) {
    const meta = TIPO_PERGUNTA[bloco.tipo];
    const valido = blocoValido(bloco);
    return (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ring-inset ring-border-secondary transition duration-100 ease-linear hover:bg-primary_hover">
            <button type="button" onClick={onAbrir} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span
                    className={cx(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                        valido ? "bg-brand-solid text-white" : "bg-tertiary text-tertiary",
                    )}
                >
                    {indice}
                </span>
                <meta.icon className="size-4 shrink-0 text-fg-quaternary" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{bloco.titulo.trim() || "Pergunta sem título"}</span>
                <span className="shrink-0 text-xs text-tertiary">{meta.label}</span>
            </button>
            <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover" onClick={onRemover} />
        </div>
    );
}
