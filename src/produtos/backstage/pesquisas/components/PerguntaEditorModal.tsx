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
import { LIMITE_PERTO, TIPO_PERGUNTA, TIPOS_ORDENADOS, usePesquisas, type Pergunta, type PerguntaInput, type TipoPergunta } from "../data/pesquisas-store";
import { perguntaSemelhante } from "../utils/similaridade";
import { ConfirmDialog } from "./ConfirmDialog";

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

/** Bloco de pergunta no construtor (PerguntaInput + chave local). `estoque` guarda o texto cru por opção (alinhado a `opcoes`); "" = ilimitado. */
type Bloco = Omit<PerguntaInput, "estoqueOpcoes"> & { key: string; estoque: string[] };

const blocoVazio = (key: string): Bloco => ({ key, titulo: "", ajuda: "", tipo: "texto-curto", opcoes: [], estoque: [], ativa: true, obrigatoria: true });
const temOpcoes = (tipo: TipoPergunta) => TIPO_PERGUNTA[tipo].temOpcoes;
/** Pares (opção, estoque cru) com texto preenchido. */
const paresValidos = (b: Bloco) => b.opcoes.map((o, i) => ({ opcao: o.trim(), estoque: (b.estoque[i] ?? "").trim() })).filter((p) => p.opcao !== "");
const parseEstoque = (s: string): number | null => {
    const n = parseInt(s, 10);
    return s.trim() === "" || Number.isNaN(n) ? null : n;
};
const blocoValido = (b: Bloco) => b.titulo.trim() !== "" && (!temOpcoes(b.tipo) || paresValidos(b).length >= 2);
const toInput = (b: Bloco): PerguntaInput => {
    const usaOpcoes = temOpcoes(b.tipo);
    const pares = paresValidos(b);
    return {
        titulo: b.titulo.trim(),
        ajuda: b.ajuda?.trim() || undefined,
        tipo: b.tipo,
        opcoes: usaOpcoes ? pares.map((p) => p.opcao) : [],
        estoqueOpcoes: usaOpcoes ? pares.map((p) => parseEstoque(p.estoque)) : undefined,
        ativa: b.ativa,
        obrigatoria: b.obrigatoria,
    };
};

export function PerguntaEditorModal({ isOpen, onClose, pergunta, onSaved, onExcluir }: PerguntaEditorModalProps) {
    const { addPergunta, updatePergunta, perguntas, consumoDaOpcao } = usePesquisas();
    const seq = useRef(0);
    const [blocos, setBlocos] = useState<Bloco[]>([]);
    const [expandido, setExpandido] = useState<string | null>(null);
    const [semelhante, setSemelhante] = useState<{ titulo: string } | null>(null);
    const [verificando, setVerificando] = useState(false);
    // Edição em uso: o usuário mexeu no estoque de alguma opção → confirmar impacto no relatório antes de salvar.
    const [estoqueTocado, setEstoqueTocado] = useState(false);
    const [confirmEstoque, setConfirmEstoque] = useState(false);

    const editando = pergunta !== null;
    const emUso = (pergunta?.respostas ?? 0) > 0;

    useEffect(() => {
        if (!isOpen) return;
        setSemelhante(null);
        setVerificando(false);
        setEstoqueTocado(false);
        setConfirmEstoque(false);
        seq.current = 0;
        if (pergunta) {
            const estoque = pergunta.opcoes.map((_, i) => {
                const e = pergunta.estoqueOpcoes?.[i];
                return e == null ? "" : String(e);
            });
            const b: Bloco = { key: "edit", titulo: pergunta.titulo, ajuda: pergunta.ajuda ?? "", tipo: pergunta.tipo, opcoes: [...pergunta.opcoes], estoque, ativa: pergunta.ativa, obrigatoria: pergunta.obrigatoria };
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
        setBlocos((prev) =>
            prev.map((b) => {
                if (b.key !== key) return b;
                const init = temOpcoes(tipo) && b.opcoes.length === 0;
                return { ...b, tipo, opcoes: init ? ["", ""] : b.opcoes, estoque: init ? ["", ""] : b.estoque };
            }),
        );
    const setOpcao = (key: string, i: number, v: string) => setBlocos((prev) => prev.map((b) => (b.key === key ? { ...b, opcoes: b.opcoes.map((o, idx) => (idx === i ? v : o)) } : b)));
    const setEstoque = (key: string, i: number, v: string) => {
        const limpo = v.replace(/\D/g, "");
        if (emUso) setEstoqueTocado(true);
        setBlocos((prev) => prev.map((b) => (b.key === key ? { ...b, estoque: b.estoque.map((e, idx) => (idx === i ? limpo : e)) } : b)));
    };
    const addOpcao = (key: string) => setBlocos((prev) => prev.map((b) => (b.key === key ? { ...b, opcoes: [...b.opcoes, ""], estoque: [...b.estoque, ""] } : b)));
    const removeOpcao = (key: string, i: number) =>
        setBlocos((prev) =>
            prev.map((b) => {
                if (b.key !== key) return b;
                if (emUso && (b.estoque[i] ?? "").trim() !== "") setEstoqueTocado(true);
                return { ...b, opcoes: b.opcoes.filter((_, idx) => idx !== i), estoque: b.estoque.filter((_, idx) => idx !== i) };
            }),
        );

    const removerBloco = (key: string) =>
        setBlocos((prev) => {
            const next = prev.filter((b) => b.key !== key);
            if (key === expandido) setExpandido(next.length ? next[next.length - 1].key : null);
            return next;
        });

    // Regra: ao editar uma pergunta em uso, o limite de uma opção nunca pode ficar abaixo do já consumido.
    const limiteAbaixoConsumido = useMemo(() => {
        if (!editando || !emUso || !pergunta) return false;
        const b = blocos[0];
        if (!b || !temOpcoes(b.tipo)) return false;
        return b.opcoes.some((op, i) => {
            if (op.trim() === "") return false;
            const limite = parseEstoque(b.estoque[i] ?? "");
            return limite != null && limite < consumoDaOpcao(pergunta.id, i);
        });
    }, [editando, emUso, pergunta, blocos, consumoDaOpcao]);

    const podeSalvar = blocos.length > 0 && blocos.every(blocoValido) && !blocos.some((b) => tituloDuplicado(b.titulo)) && !limiteAbaixoConsumido;

    const salvar = () => {
        if (!podeSalvar) return;
        // Editar o estoque de uma pergunta que já coleta respostas pode afetar o relatório do time de dados.
        if (editando && emUso && estoqueTocado) {
            setConfirmEstoque(true);
            return;
        }
        doSalvar();
    };

    const doSalvar = () => {
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
                                    mostrarConsumo={emUso}
                                    consumoOpcao={(i) => (pergunta ? consumoDaOpcao(pergunta.id, i) : 0)}
                                    minEstoque={(i) => (pergunta && emUso ? consumoDaOpcao(pergunta.id, i) : 0)}
                                    onTitulo={(v) => setBloco(b.key, { titulo: v })}
                                    onTipo={(t) => escolherTipo(b.key, t)}
                                    onSetOpcao={(i, v) => setOpcao(b.key, i, v)}
                                    onSetEstoque={(i, v) => setEstoque(b.key, i, v)}
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

            <ConfirmDialog
                isOpen={confirmEstoque}
                onClose={() => setConfirmEstoque(false)}
                onConfirm={doSalvar}
                tone="warning"
                title="Alterar o limite de respostas das opções?"
                description="Esta pergunta já coletou respostas. Mudar o limite de respostas de uma opção pode impactar o relatório de respostas que o time de dados gera para o cliente. Deseja salvar mesmo assim?"
                confirmLabel="Salvar mesmo assim"
                cancelLabel="Cancelar"
            />
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
    mostrarConsumo,
    consumoOpcao,
    minEstoque,
    onTitulo,
    onTipo,
    onSetOpcao,
    onSetEstoque,
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
    /** Mostra o consumo do estoque por opção (pergunta já coletando respostas). */
    mostrarConsumo?: boolean;
    consumoOpcao: (i: number) => number;
    /** Limite mínimo permitido por opção (= já consumido). 0 quando não há trava. */
    minEstoque: (i: number) => number;
    onTitulo: (v: string) => void;
    onTipo: (t: TipoPergunta) => void;
    onSetOpcao: (i: number, v: string) => void;
    onSetEstoque: (i: number, v: string) => void;
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
                            Você já tem uma pergunta chamada “<span className="font-semibold text-primary">{semelhante.titulo}</span>” cadastrada. Deseja continuar assim mesmo?
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
                    <div className="flex items-center gap-2">
                        <span className="flex-1 text-sm font-medium text-secondary">Opções</span>
                        <span className="w-28 text-sm font-medium text-secondary">Limite</span>
                        <span className="size-9 shrink-0" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-3">
                        {bloco.opcoes.map((opcao, i) => {
                            const cru = bloco.estoque[i] ?? "";
                            const limite = parseEstoque(cru);
                            const consumo = mostrarConsumo ? consumoOpcao(i) : 0;
                            const min = mostrarConsumo ? minEstoque(i) : 0;
                            const abaixoConsumido = opcao.trim() !== "" && limite != null && limite < min;
                            const usados = limite != null ? Math.min(consumo, limite) : consumo;
                            const pct = limite && limite > 0 ? Math.min(100, Math.round((usados / limite) * 100)) : 0;
                            const esgotado = !abaixoConsumido && limite != null && usados >= limite;
                            const perto = !esgotado && !abaixoConsumido && limite != null && limite > 0 && usados / limite >= LIMITE_PERTO;
                            return (
                                <div key={i} className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                        <Input aria-label={`Opção ${i + 1}`} placeholder={`Opção ${i + 1}`} value={opcao} onChange={(v) => onSetOpcao(i, v)} className="flex-1" />
                                        <Input
                                            aria-label={`Limite de respostas da opção ${i + 1}`}
                                            inputMode="numeric"
                                            placeholder="Ilimitado"
                                            value={cru}
                                            isInvalid={abaixoConsumido}
                                            onChange={(v) => onSetEstoque(i, v)}
                                            className="w-28"
                                        />
                                        <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover opção" isDisabled={bloco.opcoes.length <= 2} onClick={() => onRemoveOpcao(i)} />
                                    </div>
                                    {abaixoConsumido ? (
                                        <span className="text-xs text-error-primary">O limite não pode ser menor que {min} (já preenchidas).</span>
                                    ) : mostrarConsumo && limite != null && (
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-quaternary">
                                                <div
                                                    className={cx("h-full rounded-full", esgotado ? "bg-error-solid" : perto ? "bg-warning-solid" : "bg-brand-solid")}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className={cx("shrink-0 text-xs tabular-nums", esgotado ? "text-error-primary" : perto ? "text-warning-primary" : "text-tertiary")}>
                                                {esgotado ? "Esgotado" : perto ? `${usados} preenchidas · perto do limite` : `${usados} preenchidas`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
