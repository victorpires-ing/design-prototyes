import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, CheckCircle, ChevronDown, FaceId, Minus, Package, Plus, QrCode01, SearchLg, ShoppingCart01, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Tabs } from "@/components/application/tabs/tabs";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { ACESSO_LABEL, ITENS_POR_ID, KIND_TABS, SESSAO_DO_ITEM, SESSOES, currency, exigeIdentificacao, type AcessoTipo, type ItemKind, type VendaItem } from "../data/bilheteria-data";
import type { PedidoItem } from "../data/bilheteria-store";

const TAB_ICON: Record<ItemKind, React.FC<{ className?: string }>> = { ingresso: Calendar, produto: ShoppingCart01, combo: Package };

/** Ícone que sinaliza a forma de acesso do ingresso (facial x QR code). */
export const ACESSO_ICON: Record<AcessoTipo, React.FC<{ className?: string }>> = { qrcode: QrCode01, facial: FaceId };

export function AcessoIcon({ acesso, className }: { acesso?: AcessoTipo; className?: string }) {
    if (!acesso) return null;
    const Icon = ACESSO_ICON[acesso];
    return <Icon className={cx("shrink-0 text-fg-quaternary", className)} aria-label={ACESSO_LABEL[acesso]} />;
}

interface Props {
    itens: PedidoItem[];
    onItens: (itens: PedidoItem[]) => void;
    /** Há comprador identificado? Se não, ingressos faciais ficam bloqueados. */
    identificado: boolean;
}

export function ItensVendaSelector({ itens, onItens, identificado }: Props) {
    const [tab, setTab] = useState<ItemKind>("ingresso");
    const [busca, setBusca] = useState("");
    const [fechadas, setFechadas] = useState<Set<string>>(new Set());

    const mapaQtd = new Map(itens.map((i) => [i.itemId, i.qtd]));
    const setQtd = (id: string, qtd: number) => {
        if (qtd <= 0) return onItens(itens.filter((i) => i.itemId !== id));
        onItens(itens.some((i) => i.itemId === id) ? itens.map((i) => (i.itemId === id ? { ...i, qtd } : i)) : [...itens, { itemId: id, qtd }]);
    };

    const termo = busca.trim().toLowerCase();
    const filtra = (i: VendaItem) => i.kind === tab && (!termo || i.nome.toLowerCase().includes(termo) || (i.grupo ?? "").toLowerCase().includes(termo) || (i.tipo ?? "").toLowerCase().includes(termo));
    const sessoesComItens = SESSOES.map((s) => ({ ...s, itens: s.itens.filter(filtra) })).filter((s) => s.itens.length > 0);

    return (
        <div className="flex w-full flex-col gap-6 lg:flex-row">
            <section className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex-1">
                        <Input icon={SearchLg} placeholder="Busque por nome do grupo ou item" value={busca} onChange={setBusca} aria-label="Buscar item" />
                    </div>
                    <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(k as ItemKind)} className="w-fit!">
                        <Tabs.List type="button-minimal" size="sm">
                            {KIND_TABS.map((t) => (
                                <Tabs.Item key={t.id} id={t.id}>{t.label}</Tabs.Item>
                            ))}
                        </Tabs.List>
                    </Tabs>
                </div>

                {sessoesComItens.length === 0 ? (
                    <p className="rounded-lg bg-secondary px-4 py-8 text-center text-sm text-tertiary">Nenhum item corresponde à busca.</p>
                ) : (
                    sessoesComItens.map((sessao) => {
                        const aberta = termo !== "" || !fechadas.has(sessao.id);
                        return (
                            <section key={sessao.id} className="overflow-hidden rounded-xl bg-primary_alt ring-1 ring-border-secondary">
                                <button
                                    type="button"
                                    onClick={() => setFechadas((p) => { const n = new Set(p); n.has(sessao.id) ? n.delete(sessao.id) : n.add(sessao.id); return n; })}
                                    className={cx("flex w-full items-center gap-3 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover", aberta && "border-b border-secondary")}
                                >
                                    <FeaturedIcon icon={Calendar} color="gray" size="sm" theme="modern" />
                                    <span className="flex-1 text-sm font-semibold text-primary">{sessao.data}</span>
                                    <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", !aberta && "-rotate-90")} aria-hidden="true" />
                                </button>
                                {aberta && (
                                    <ul className="flex flex-col divide-y divide-border-secondary">
                                        {sessao.itens.map((item) => (
                                            <ItemRow key={item.id} item={item} qtd={mapaQtd.get(item.id) ?? 0} onQtd={(q) => setQtd(item.id, q)} bloqueado={!identificado && exigeIdentificacao(item)} />
                                        ))}
                                    </ul>
                                )}
                            </section>
                        );
                    })
                )}
            </section>

            <div className="flex w-full shrink-0 flex-col lg:sticky lg:top-6 lg:w-[340px] lg:self-start">
                <ResumoPanel itens={itens} onRemover={(id) => onItens(itens.filter((i) => i.itemId !== id))} onRemoverTodos={() => onItens([])} />
            </div>
        </div>
    );
}

/* ------------------------------ Item row ------------------------- */

function ItemRow({ item, qtd, onQtd, bloqueado }: { item: VendaItem; qtd: number; onQtd: (q: number) => void; bloqueado: boolean }) {
    return (
        <li className={cx("flex items-start gap-4 p-4", bloqueado && "opacity-60")}>
            {item.kind === "produto" && <img src={item.imagem} alt="" className="size-12 shrink-0 rounded-md object-cover ring-1 ring-secondary" />}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <AcessoIcon acesso={item.acesso} className="size-4" />
                    {item.nome}
                </span>
                {(item.lote || item.tipo) && <span className="text-xs text-tertiary">{[item.lote, item.tipo].filter(Boolean).join(" · ")}</span>}
                {item.descricao && <span className="text-xs text-tertiary">{item.descricao}</span>}
                {item.componentes && (
                    <ul className="mt-1 flex flex-col gap-0.5">
                        {item.componentes.map((c, i) => (
                            <li key={i} className="text-xs text-tertiary">• {c.nome} · {c.tipo}{c.data ? ` · ${c.data}` : ""}</li>
                        ))}
                    </ul>
                )}
                <span className="mt-1 text-sm font-bold text-primary">{currency.format(item.preco)}</span>
            </div>
            {bloqueado ? (
                <div className="flex max-w-[160px] shrink-0 items-start gap-2 text-right">
                    <FaceId className="mt-0.5 size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    <span className="text-xs text-tertiary">Requer comprador identificado</span>
                </div>
            ) : (
                <QtyStepper qtd={qtd} onQtd={onQtd} />
            )}
        </li>
    );
}

function QtyStepper({ qtd, onQtd }: { qtd: number; onQtd: (q: number) => void }) {
    return (
        <div className="flex shrink-0 items-center gap-2">
            <button
                type="button"
                onClick={() => onQtd(Math.max(0, qtd - 1))}
                disabled={qtd === 0}
                aria-label="Diminuir"
                className="flex size-8 items-center justify-center rounded-lg bg-secondary text-fg-secondary ring-1 ring-border-primary transition duration-100 ease-linear hover:bg-secondary_hover disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="w-6 text-center text-sm font-semibold text-primary tabular-nums">{qtd}</span>
            <button
                type="button"
                onClick={() => onQtd(qtd + 1)}
                aria-label="Aumentar"
                className="flex size-8 items-center justify-center rounded-lg bg-brand-solid text-white transition duration-100 ease-linear hover:bg-brand-solid_hover"
            >
                <Plus className="size-4" aria-hidden="true" />
            </button>
        </div>
    );
}

/* ------------------------------- Resumo -------------------------- */

function ResumoPanel({ itens, onRemover, onRemoverTodos }: { itens: PedidoItem[]; onRemover: (id: string) => void; onRemoverTodos: () => void }) {
    const kindLabel: Record<ItemKind, string> = { ingresso: "Ingressos", produto: "Produtos", combo: "Combos" };
    const porKind: Record<ItemKind, PedidoItem[]> = { ingresso: [], produto: [], combo: [] };
    for (const v of itens) {
        const item = ITENS_POR_ID[v.itemId];
        if (item) porKind[item.kind].push(v);
    }

    return (
        <aside className="flex max-h-[620px] flex-col overflow-hidden rounded-xl bg-primary_alt ring-1 ring-border-secondary">
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-secondary p-4">
                <h3 className="text-sm font-semibold text-primary">Resumo</h3>
                {itens.length > 0 && (
                    <Button size="xs" color="link-gray" className="font-medium underline" onClick={onRemoverTodos}>Remover todos</Button>
                )}
            </header>

            {itens.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                    <FeaturedIcon icon={CheckCircle} color="brand" theme="gradient" size="lg" />
                    <p className="text-md text-primary">Você ainda não<br />selecionou itens</p>
                </div>
            ) : (
                <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
                    <AnimatePresence initial={false} mode="popLayout">
                        {(Object.keys(porKind) as ItemKind[]).map((kind) =>
                            porKind[kind].length ? (
                                <motion.section key={kind} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-3">
                                    <header className="flex items-center gap-3">
                                        <h4 className="shrink-0 text-sm font-semibold text-primary">{kindLabel[kind]}</h4>
                                        <span className="h-0 flex-1 border-t border-dashed border-secondary" aria-hidden="true" />
                                    </header>
                                    <ul className="flex flex-col gap-3">
                                        <AnimatePresence initial={false} mode="popLayout">
                                            {porKind[kind].map((v) => {
                                                const item = ITENS_POR_ID[v.itemId];
                                                return (
                                                    <motion.li
                                                        key={v.itemId}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.85 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.85 }}
                                                        transition={{ type: "spring", stiffness: 420, damping: 30 }}
                                                        className="flex items-start gap-3 rounded-lg bg-secondary p-3 ring-1 ring-border-secondary"
                                                    >
                                                        <span className="flex h-7 min-w-9 shrink-0 items-center justify-center rounded-md bg-primary_alt px-1.5 text-xs font-semibold text-secondary tabular-nums ring-1 ring-border-secondary">{v.qtd}</span>
                                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                            <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                                                                <AcessoIcon acesso={item?.acesso} className="size-3.5" />
                                                                <span className="truncate">{item?.nome}</span>
                                                            </span>
                                                            <span className="truncate text-xs text-tertiary">{[item?.grupo, item?.tipo].filter(Boolean).join(" - ")}</span>
                                                            <span className="truncate text-xs text-tertiary">{SESSAO_DO_ITEM[v.itemId]}</span>
                                                            {item?.componentes && (
                                                                <ul className="mt-1.5 flex flex-col gap-1 border-l border-secondary pl-2.5">
                                                                    {item.componentes.map((c, i) => (
                                                                        <li key={i} className="flex items-center gap-2 text-xs text-tertiary">
                                                                            <span className="font-medium text-secondary tabular-nums">1x</span>
                                                                            <span className="truncate">{c.nome} · {c.tipo}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                        <button type="button" onClick={() => onRemover(v.itemId)} aria-label="Remover item" className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-error-secondary">
                                                            <Trash01 className="size-4" aria-hidden="true" />
                                                        </button>
                                                    </motion.li>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </ul>
                                </motion.section>
                            ) : null,
                        )}
                    </AnimatePresence>
                </div>
            )}
        </aside>
    );
}
