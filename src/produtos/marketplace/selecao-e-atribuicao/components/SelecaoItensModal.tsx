import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import type { ComboDinamicoView } from "../data/combos";

/** Seleção confirmada: quantidade por (sessão, item). */
export interface ItemSelecao {
    sessaoId: string;
    data: string;
    hora: string;
    itemId: string;
    nome: string;
    quantidade: number;
}

interface SelecaoItensModalProps {
    combo: ComboDinamicoView | null;
    onClose: () => void;
    onConfirmar: (combo: ComboDinamicoView, selecoes: ItemSelecao[]) => void;
}

const chave = (sessaoId: string, itemId: string) => `${sessaoId}:${itemId}`;
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Modal de seleção de itens do combo dinâmico — quantidades por sessão. */
export function SelecaoItensModal({ combo, onClose, onConfirmar }: SelecaoItensModalProps) {
    // Quantidade por (sessão, item). Itens obrigatórios já começam com 1.
    const [qtds, setQtds] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!combo) return;
        const inicial: Record<string, number> = {};
        for (const s of combo.sessoes) {
            for (const it of s.itens) inicial[chave(s.id, it.id)] = it.obrigatorio ? 1 : 0;
        }
        setQtds(inicial);
    }, [combo]);

    const total = useMemo(() => Object.values(qtds).reduce((acc, n) => acc + n, 0), [qtds]);

    if (!combo) return null;

    const noMax = total >= combo.maxItens;

    const inc = (sessaoId: string, itemId: string) => {
        if (noMax) return;
        setQtds((p) => ({ ...p, [chave(sessaoId, itemId)]: (p[chave(sessaoId, itemId)] ?? 0) + 1 }));
    };
    const dec = (sessaoId: string, itemId: string, min: number) => {
        setQtds((p) => {
            const atual = p[chave(sessaoId, itemId)] ?? 0;
            if (atual <= min) return p;
            return { ...p, [chave(sessaoId, itemId)]: atual - 1 };
        });
    };

    const podeConfirmar = total >= combo.minItens && total <= combo.maxItens;

    const confirmar = () => {
        if (!podeConfirmar) return;
        const selecoes: AtribuicaoSelecao[] = [];
        for (const s of combo.sessoes) {
            for (const it of s.itens) {
                const q = qtds[chave(s.id, it.id)] ?? 0;
                if (q > 0) selecoes.push({ sessaoId: s.id, data: s.data, hora: s.hora, itemId: it.id, nome: it.nome, quantidade: q });
            }
        }
        onConfirmar(combo, selecoes);
    };

    return (
        <AriaModalOverlay
            isOpen={combo !== null}
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
                        "flex max-h-[85vh] w-full max-w-[520px] flex-col rounded-2xl bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex min-h-0 flex-1 flex-col outline-hidden">
                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-5">
                        <h2 className="text-lg font-semibold text-primary">{combo.nome}</h2>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                    </div>

                    {/* Sub-barra: regra + contador */}
                    <div className="flex shrink-0 items-center justify-between gap-3 border-y border-secondary bg-secondary px-6 py-3">
                        <span className="text-sm text-tertiary">
                            {combo.minItens === combo.maxItens ? `Selecione ${combo.minItens} itens` : `Selecione entre ${combo.minItens} e ${combo.maxItens} itens`}
                        </span>
                        <span className="text-sm font-medium text-primary tabular-nums">
                            {total} {total === 1 ? "item selecionado" : "itens selecionados"}
                        </span>
                    </div>

                    {/* Itens por sessão */}
                    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
                        {combo.sessoes.map((s) => (
                            <section key={s.id} className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-primary">{s.data}</span>
                                    <span className="text-fg-quaternary">•</span>
                                    <span className="text-sm text-tertiary">{s.hora}</span>
                                </div>
                                {s.itens.map((it) => {
                                    const min = it.obrigatorio ? 1 : 0;
                                    const q = qtds[chave(s.id, it.id)] ?? 0;
                                    return (
                                        <div key={it.id} className="relative flex items-center gap-3 rounded-xl px-4 py-3.5 ring-1 ring-border-secondary">
                                            {it.obrigatorio && (
                                                <span className="absolute -top-2.5 right-3 rounded-md bg-primary-solid px-2 py-0.5 text-xs font-medium text-white">Incluso</span>
                                            )}
                                            {it.imagem && (
                                                <img src={it.imagem} alt="" aria-hidden="true" className="size-11 shrink-0 rounded-md object-cover ring-1 ring-border-secondary" />
                                            )}
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <span className="text-sm font-medium text-primary">{it.nome}</span>
                                                {it.descricao && <span className="text-xs text-tertiary">{it.descricao}</span>}
                                                {it.mostrarPreco && it.preco != null && <span className="text-sm font-semibold text-primary">{brl(it.preco)}</span>}
                                            </div>
                                            <Stepper
                                                count={q}
                                                canDec={q > min}
                                                canInc={!noMax}
                                                onInc={() => inc(s.id, it.id)}
                                                onDec={() => dec(s.id, it.id, min)}
                                            />
                                        </div>
                                    );
                                })}
                            </section>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="flex shrink-0 items-center gap-3 border-t border-secondary px-6 py-4">
                        <Button size="lg" color="secondary" className="flex-1" onClick={onClose}>
                            Voltar
                        </Button>
                        <Button size="lg" color="primary" className="flex-1" isDisabled={!podeConfirmar} onClick={confirmar}>
                            Confirmar
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Stepper de quantidade                                             */
/* ------------------------------------------------------------------ */

function Stepper({ count, canDec, canInc, onInc, onDec }: { count: number; canDec: boolean; canInc: boolean; onInc: () => void; onDec: () => void }) {
    return (
        <div className="flex shrink-0 items-center gap-2">
            <button
                type="button"
                onClick={onDec}
                disabled={!canDec}
                aria-label="Diminuir"
                className="flex size-8 items-center justify-center rounded-md text-fg-secondary ring-1 ring-border-primary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Minus className="size-4" />
            </button>
            <span className="w-5 text-center text-sm font-medium text-primary tabular-nums">{count}</span>
            <button
                type="button"
                onClick={onInc}
                disabled={!canInc}
                aria-label="Aumentar"
                className="flex size-8 items-center justify-center rounded-md text-fg-secondary ring-1 ring-border-primary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Plus className="size-4" />
            </button>
        </div>
    );
}
