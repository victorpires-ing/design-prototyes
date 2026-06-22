import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Minus, Plus, XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import type { ComboDinamicoView, ComboSessao, Item } from "../data/combos";

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
    const [inclusosAberto, setInclusosAberto] = useState(true);

    useEffect(() => {
        if (!combo) return;
        const inicial: Record<string, number> = {};
        for (const s of combo.sessoes) {
            for (const it of s.itens) inicial[chave(s.id, it.id)] = it.qtdMin ?? (it.obrigatorio ? 1 : 0);
        }
        setQtds(inicial);
        setInclusosAberto(true);
    }, [combo]);

    const total = useMemo(() => Object.values(qtds).reduce((acc, n) => acc + n, 0), [qtds]);

    if (!combo) return null;

    const noMax = total >= combo.maxItens;
    const temObrigatorios = combo.sessoes.some((s) => s.itens.some((it) => it.obrigatorio));
    const temOpcionais = combo.sessoes.some((s) => s.itens.some((it) => !it.obrigatorio));
    const progresso = combo.maxItens > 0 ? Math.min(100, Math.round((total / combo.maxItens) * 100)) : 0;

    // Define a quantidade (absoluta), respeitando mín./máx. do item e o máximo global do combo.
    const setQtdItem = (sessaoId: string, itemId: string, n: number, min: number, max: number) =>
        setQtds((p) => {
            const atual = p[chave(sessaoId, itemId)] ?? 0;
            let novo = Math.min(max, Math.max(min, Math.floor(Number.isNaN(n) ? min : n)));
            if (novo > atual) {
                const t = Object.values(p).reduce((a, x) => a + x, 0);
                const espaco = combo.maxItens - t;
                novo = espaco <= 0 ? atual : Math.min(novo, atual + espaco);
            }
            return { ...p, [chave(sessaoId, itemId)]: novo };
        });

    const podeConfirmar = total >= combo.minItens && total <= combo.maxItens;

    const confirmar = () => {
        if (!podeConfirmar) return;
        const selecoes: ItemSelecao[] = [];
        for (const s of combo.sessoes) {
            for (const it of s.itens) {
                const q = qtds[chave(s.id, it.id)] ?? 0;
                if (q > 0) selecoes.push({ sessaoId: s.id, data: s.data, hora: s.hora, itemId: it.id, nome: it.nome, quantidade: q });
            }
        }
        onConfirmar(combo, selecoes);
    };

    // Linha de item — grid de 3 zonas (identificação · preço · controle).
    // Quantidade fixa (mín. = máx. e > 0): exibe "Nx" em texto, sem stepper.
    const renderItem = (s: ComboSessao, it: Item) => {
        const min = it.qtdMin ?? (it.obrigatorio ? 1 : 0);
        const max = it.qtdMax ?? combo.maxItens;
        const fixa = min === max && min > 0;
        const q = qtds[chave(s.id, it.id)] ?? 0;
        // Mensagem só quando o limite do PRÓPRIO item é atingido (não o limite geral).
        const noItemMax = !fixa && q >= max;
        const precoLabel = it.preco != null ? (it.preco > 0 ? `+ ${brl(it.preco)}` : "Grátis") : null;
        const hierarquia = [it.grupo, it.lote].filter(Boolean).join(" • ");
        return (
            <motion.div key={it.id} layout="position" className="flex flex-col gap-1 border-b border-secondary py-3 first:pt-0 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3">
                    {it.imagem && <img src={it.imagem} alt="" aria-hidden="true" className="size-16 shrink-0 rounded-lg object-cover ring-1 ring-border-secondary" />}
                    {/* Zona A: identificação (preço desce pra cá abaixo de 360px) */}
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-medium text-primary">{it.nome}</span>
                        {hierarquia && <span className="text-sm text-tertiary">{hierarquia}</span>}
                        {it.mostrarPreco && precoLabel && <span className="text-sm font-semibold text-primary min-[360px]:hidden">{precoLabel}</span>}
                    </div>
                    {/* Zona B: preço/status (some abaixo de 360px) */}
                    {it.mostrarPreco && precoLabel && <span className="hidden shrink-0 text-sm font-semibold text-primary min-[360px]:block">{precoLabel}</span>}
                    {/* Zona C: controle (texto fixo "Nx" ou stepper) */}
                    {fixa ? (
                        <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{q}×</span>
                    ) : (
                        <Stepper
                            count={q}
                            canDec={q > min}
                            canInc={!noMax && q < max}
                            onInc={() => setQtdItem(s.id, it.id, q + 1, min, max)}
                            onDec={() => setQtdItem(s.id, it.id, q - 1, min, max)}
                        />
                    )}
                </div>
                <AnimatePresence initial={false}>
                    {noItemMax && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="overflow-hidden"
                        >
                            <span className="text-sm text-tertiary">
                                Você só pode escolher {max} {max === 1 ? "unidade" : "unidades"} desse item
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    // Agrupa por sessão: cabeçalho com a data (negrito) + hora, e os itens abaixo.
    const renderSessao = (s: ComboSessao, itens: Item[]) => {
        if (itens.length === 0) return null;
        return (
            <div key={s.id} className="flex flex-col">
                <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-primary">{s.data}</span>
                    {s.hora && <span className="text-sm text-tertiary">· {s.hora}</span>}
                </div>
                {itens.map((it) => renderItem(s, it))}
            </div>
        );
    };

    const renderSessoes = (filtro: (it: Item) => boolean) => combo.sessoes.map((s) => renderSessao(s, s.itens.filter(filtro)));

    return (
        <ModalOverlay isOpen={combo !== null} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-[520px]">
                <Dialog>
                    <div className="flex max-h-[85vh] w-full flex-col overflow-clip rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary">
                        {/* Header + status dinâmico */}
                        <div className="shrink-0 px-6 pt-5 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <h2 className="text-lg font-semibold text-primary">{combo.nome}</h2>
                                <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                            </div>
                            {temOpcionais ? (
                                <div className="mt-3 flex flex-col gap-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm text-tertiary">
                                            {combo.minItens === combo.maxItens
                                                ? `Escolha ${combo.maxItens} ${combo.maxItens === 1 ? "item" : "itens"}`
                                                : `Escolha entre ${combo.minItens} e ${combo.maxItens} itens`}
                                        </span>
                                        <span className="shrink-0 text-sm font-medium text-primary tabular-nums">
                                            {total} {total === 1 ? "selecionado" : "selecionados"}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-quaternary">
                                        <div className="h-full rounded-full bg-brand-solid transition-all duration-200 ease-linear" style={{ width: `${progresso}%` }} />
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-3 text-sm text-tertiary">Confira os itens inclusos no seu ingresso</p>
                            )}
                        </div>

                        {/* Itens inclusos (accordion) + itens opcionais */}
                        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pt-1 pb-5">
                            {temObrigatorios && (
                                <div className="overflow-clip rounded-xl ring-1 ring-border-secondary">
                                    <button
                                        type="button"
                                        onClick={() => setInclusosAberto((v) => !v)}
                                        aria-expanded={inclusosAberto}
                                        className={cx("flex w-full items-center justify-between gap-3 bg-secondary px-4 py-3 text-left hover:bg-secondary_hover", inclusosAberto && "border-b border-secondary")}
                                    >
                                        <span className="text-sm font-semibold text-primary">Itens inclusos</span>
                                        <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform", inclusosAberto && "rotate-180")} />
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {inclusosAberto && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.22, ease: "easeOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="flex flex-col gap-5 px-4 py-3">{renderSessoes((it) => !!it.obrigatorio)}</div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {renderSessoes((it) => !it.obrigatorio)}
                        </div>

                        {/* Footer fixo — Confirmar acima, Cancelar abaixo */}
                        <div className="flex shrink-0 flex-col gap-3 border-t border-secondary px-6 py-4">
                            <Button size="lg" color="primary" className="w-full" isDisabled={!podeConfirmar} onClick={confirmar}>
                                Confirmar
                            </Button>
                            <Button size="lg" color="secondary" className="w-full" onClick={onClose}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/* ------------------------------------------------------------------ */
/*  Stepper de quantidade — botões num único box (sem input/teclado)  */
/* ------------------------------------------------------------------ */

function Stepper({ count, canDec, canInc, onInc, onDec }: { count: number; canDec: boolean; canInc: boolean; onInc: () => void; onDec: () => void }) {
    return (
        <div className="flex shrink-0 items-center rounded-lg ring-1 ring-border-primary">
            <button
                type="button"
                onClick={onDec}
                disabled={!canDec}
                aria-label="Diminuir"
                className="flex size-9 items-center justify-center rounded-l-lg text-fg-quaternary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-40"
            >
                <Minus className="size-4" />
            </button>
            <span className="w-9 text-center text-sm font-medium text-primary tabular-nums">{count}</span>
            <button
                type="button"
                onClick={onInc}
                disabled={!canInc}
                aria-label="Aumentar"
                className="flex size-9 items-center justify-center rounded-r-lg border-l border-primary text-fg-quaternary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-40"
            >
                <Plus className="size-4" />
            </button>
        </div>
    );
}

