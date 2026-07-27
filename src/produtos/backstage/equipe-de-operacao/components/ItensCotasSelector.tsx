import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, CheckCircle, ChevronDown, Package, SearchLg, ShoppingCart01, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Tabs } from "@/components/application/tabs/tabs";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { COTA_MAXIMA, ITENS_POR_ID, KIND_TABS, SESSAO_DO_ITEM, SESSOES, type CatalogoItem, type ItemKind } from "../data/equipe-data";
import type { CotaModo, ItemCota } from "../data/equipe-store";

const TAB_ICON: Record<ItemKind, React.FC<{ className?: string }>> = { ingresso: Calendar, produto: ShoppingCart01, combo: Package };

/** Agrupa itens por `grupo`, preservando a ordem de aparição. */
function porGrupo(itens: CatalogoItem[]): [string, CatalogoItem[]][] {
    const mapa = new Map<string, CatalogoItem[]>();
    for (const i of itens) {
        const lista = mapa.get(i.grupo) ?? [];
        lista.push(i);
        mapa.set(i.grupo, lista);
    }
    return [...mapa.entries()];
}

interface Props {
    modo: CotaModo;
    /** Itens liberados (+ cota por item no modo individual). */
    itens: ItemCota[];
    onItens: (itens: ItemCota[]) => void;
    /** Cota única do grupo (modo compartilhada). */
    cota: number;
    onCota: (n: number) => void;
    /** Piso da cota única (compartilhada, edição). */
    minCota?: number;
    /** Piso da cota por item (individual, edição) — também é o total já emitido por item. */
    minPorItem?: Record<string, number>;
    /** Cortesias já emitidas pelo grupo (edição) — mostra consumo no painel de cota. */
    emitidas?: number;
}

export function ItensCotasSelector({ modo, itens, onItens, cota, onCota, minCota, minPorItem, emitidas }: Props) {
    const [tab, setTab] = useState<ItemKind>("ingresso");
    const [busca, setBusca] = useState("");
    const [fechadas, setFechadas] = useState<Set<string>>(new Set());

    const individual = modo === "individual";
    const mapaCota = new Map(itens.map((i) => [i.itemId, i.cota]));

    const toggle = (id: string, on: boolean) => onItens(on ? [...itens, { itemId: id, cota: minPorItem?.[id] ?? 0 }] : itens.filter((i) => i.itemId !== id));
    const setItemCota = (id: string, c: number) => onItens(itens.map((i) => (i.itemId === id ? { ...i, cota: c } : i)));

    const termo = busca.trim().toLowerCase();
    const filtra = (i: CatalogoItem) => i.kind === tab && (!termo || i.nome.toLowerCase().includes(termo) || i.grupo.toLowerCase().includes(termo) || i.tipo.toLowerCase().includes(termo));
    const sessoesComItens = SESSOES.map((s) => ({ ...s, itens: s.itens.filter(filtra) })).filter((s) => s.itens.length > 0);

    return (
        <div className="flex w-full flex-col gap-6 lg:flex-row">
            {/* Coluna esquerda: catálogo */}
            <section className="flex min-w-0 flex-1 flex-col gap-4">
                <Input icon={SearchLg} label="Buscar itens" placeholder="Busque por nome de grupo, item ou lote" value={busca} onChange={setBusca} />

                <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(k as ItemKind)} className="w-fit!">
                    <Tabs.List type="button-minimal" size="sm">
                        {KIND_TABS.map((t) => (
                            <Tabs.Item key={t.id} id={t.id}>{t.label}</Tabs.Item>
                        ))}
                    </Tabs.List>
                </Tabs>

                {sessoesComItens.length === 0 ? (
                    <p className="rounded-lg bg-secondary px-4 py-8 text-center text-sm text-tertiary">Nenhum item corresponde à busca.</p>
                ) : (
                    sessoesComItens.map((sessao) => (
                        <AccordionShell
                            key={sessao.id}
                            icon={TAB_ICON[tab]}
                            title={sessao.data}
                            isOpen={termo !== "" || !fechadas.has(sessao.id)}
                            onToggle={() => setFechadas((p) => { const n = new Set(p); n.has(sessao.id) ? n.delete(sessao.id) : n.add(sessao.id); return n; })}
                        >
                            {individual && (
                                <div className="flex items-center justify-between gap-2 border-b border-secondary pb-2 text-xs font-semibold tracking-wide text-tertiary uppercase">
                                    <span className="pl-2">Item</span>
                                    <span className="pr-1">Qtd. cortesias</span>
                                </div>
                            )}
                            {porGrupo(sessao.itens).map(([grupo, lista]) => (
                                <div key={grupo} className="flex flex-col gap-2">
                                    <p className="text-sm font-semibold tracking-wide text-primary">{grupo}</p>
                                    <div className="flex flex-col gap-1">
                                        {lista.map((item) => (
                                            <ItemRow
                                                key={item.id}
                                                item={item}
                                                individual={individual}
                                                cota={mapaCota.get(item.id)}
                                                minCota={minPorItem?.[item.id]}
                                                onToggle={(on) => toggle(item.id, on)}
                                                onCota={(c) => setItemCota(item.id, c)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </AccordionShell>
                    ))
                )}
            </section>

            {/* Coluna direita: cota (só compartilhada) + resumo */}
            <div className="flex w-full shrink-0 flex-col gap-3 lg:sticky lg:top-6 lg:w-[340px] lg:self-start">
                {!individual && <CotaPanel cota={cota} onCota={onCota} minCota={minCota} emitidas={emitidas} />}
                <ResumoPanel itens={itens} showCota={individual} onRemover={(id) => onItens(itens.filter((i) => i.itemId !== id))} onRemoverTodos={() => onItens([])} />
            </div>
        </div>
    );
}

/* ----------------------------- Accordion ------------------------- */

interface AccordionShellProps {
    icon: React.FC<{ className?: string }>;
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const AccordionShell = ({ icon: Icon, title, isOpen, onToggle, children }: AccordionShellProps) => (
    <div className="flex flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
        <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className={cx("flex items-center gap-3 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover", isOpen && "border-b border-secondary")}
        >
            <FeaturedIcon icon={Icon} color="gray" size="sm" theme="modern" />
            <h3 className="flex-1 text-sm font-semibold text-primary">{title}</h3>
            <ChevronDown aria-hidden="true" className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", isOpen && "rotate-180")} />
        </button>
        {isOpen && <div className="flex flex-col gap-4 p-4">{children}</div>}
    </div>
);

/* ------------------------------ Item row ------------------------- */

interface ItemRowProps {
    item: CatalogoItem;
    individual: boolean;
    cota?: number;
    minCota?: number;
    onToggle: (on: boolean) => void;
    onCota: (cota: number) => void;
}

function ItemRow({ item, individual, cota, minCota, onToggle, onCota }: ItemRowProps) {
    const selecionado = cota !== undefined;
    const piso = minCota ?? 0;
    const acimaMax = cota! > COTA_MAXIMA;
    const abaixoMin = minCota !== undefined && cota! < minCota;
    const invalido = selecionado && (acimaMax || abaixoMin);
    const erro = acimaMax ? `A quantidade máxima é ${COTA_MAXIMA.toLocaleString("pt-BR")}` : abaixoMin ? `A cota não pode ser menor que ${minCota} (já emitidos)` : undefined;
    const ehCombo = !!item.componentes?.length;

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-start gap-2">
                <label className={cx("flex min-w-0 flex-1 cursor-pointer gap-3 rounded-md px-2 py-1.5 transition duration-100 ease-linear hover:bg-primary_hover", ehCombo ? "items-start" : "items-center")}>
                    <Checkbox
                        size="sm"
                        isSelected={selecionado}
                        onChange={onToggle}
                        label={
                            ehCombo ? (
                                <span className="flex flex-col gap-0.5">
                                    <span className="text-sm font-semibold text-primary">{item.nome}</span>
                                    <span className="text-xs font-normal text-tertiary">{item.tipo}</span>
                                </span>
                            ) : item.kind === "produto" ? (
                                <span className="flex items-center gap-3">
                                    <img src={item.imagem} alt="" className="size-9 shrink-0 rounded-md object-cover ring-1 ring-secondary" />
                                    <span className="text-sm font-medium text-primary">{item.nome}</span>
                                </span>
                            ) : (
                                <span className="flex items-baseline gap-2">
                                    <span className="text-sm font-medium text-primary">{item.nome}</span>
                                    <Badge type="pill-color" color="gray" size="sm">{item.tipo}</Badge>
                                </span>
                            )
                        }
                    />
                </label>
                {individual && selecionado && (
                    <div className="mt-0.5 flex shrink-0 items-center gap-2">
                        {minCota !== undefined && <span className="whitespace-nowrap text-xs text-tertiary tabular-nums">{minCota} emitidos</span>}
                        <input
                            type="number"
                            min={piso}
                            max={COTA_MAXIMA}
                            value={cota}
                            onChange={(e) => onCota(Math.max(0, Number(e.target.value) || 0))}
                            aria-label={`Cota de ${item.nome}`}
                            className={cx(
                                "w-20 rounded-lg bg-primary px-3 py-1.5 text-right text-sm font-medium text-primary tabular-nums shadow-xs ring-1 outline-none transition-[box-shadow] duration-100 ease-linear focus:ring-2",
                                invalido ? "ring-border-error focus:ring-error" : "ring-border-primary focus:ring-brand",
                            )}
                        />
                    </div>
                )}
            </div>
            {individual && selecionado && erro && <p className="pl-9 text-xs font-medium text-error-primary">{erro}</p>}
        </div>
    );
}

/* ------------------------------ Cota do grupo -------------------- */

function CotaPanel({ cota, onCota, minCota, emitidas }: { cota: number; onCota: (n: number) => void; minCota?: number; emitidas?: number }) {
    const piso = minCota ?? 0;
    const acimaMax = cota > COTA_MAXIMA;
    const abaixoMin = minCota !== undefined && cota < minCota;
    const erroCota = acimaMax ? `A quantidade máxima é ${COTA_MAXIMA.toLocaleString("pt-BR")}` : abaixoMin ? `A cota não pode ser menor que ${minCota} (já emitidos)` : undefined;
    const pctConsumo = emitidas !== undefined && cota ? Math.min(100, Math.round((emitidas / cota) * 100)) : 0;

    return (
        <div className="flex flex-col gap-2 rounded-xl bg-secondary p-4 ring-1 ring-border-secondary">
            <h3 className="text-sm font-semibold text-primary">Cota do grupo</h3>
            <input
                type="number"
                min={piso}
                max={COTA_MAXIMA}
                value={cota}
                onChange={(e) => onCota(Math.max(0, Number(e.target.value) || 0))}
                aria-label="Cota do grupo"
                className={cx(
                    "w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary tabular-nums shadow-xs ring-1 outline-none transition-[box-shadow] duration-100 ease-linear focus:ring-2",
                    erroCota ? "ring-border-error focus:ring-error" : "ring-border-primary focus:ring-brand",
                )}
            />
            {erroCota && <p className="text-xs font-medium text-error-primary">{erroCota}</p>}
            <p className="text-xs text-tertiary">Quantidade de itens que podem ser emitidos pelo grupo.</p>

            {emitidas !== undefined && (
                <div className="mt-1 flex flex-col gap-1.5 border-t border-secondary pt-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-tertiary">Cota consumida</span>
                        <span className="text-secondary tabular-nums"><span className="font-semibold text-primary">{emitidas}</span> de {cota}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-quaternary">
                        <div className={cx("h-full rounded-full", pctConsumo >= 100 ? "bg-error-solid" : "bg-brand-solid")} style={{ width: `${pctConsumo}%` }} />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ------------------------------- Resumo -------------------------- */

interface ResumoProps {
    itens: ItemCota[];
    showCota: boolean;
    onRemover: (id: string) => void;
    onRemoverTodos: () => void;
}

function ResumoPanel({ itens, showCota, onRemover, onRemoverTodos }: ResumoProps) {
    const kindLabel: Record<ItemKind, string> = { ingresso: "Ingressos", produto: "Produtos", combo: "Combos" };
    const porKind: Record<ItemKind, ItemCota[]> = { ingresso: [], produto: [], combo: [] };
    for (const v of itens) {
        const item = ITENS_POR_ID[v.itemId];
        if (item) porKind[item.kind].push(v);
    }

    return (
        <aside className="flex max-h-[460px] flex-col overflow-hidden rounded-xl bg-secondary ring-1 ring-border-secondary">
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-secondary p-4">
                <h3 className="text-sm font-semibold text-primary">Resumo</h3>
                {itens.length > 0 && (
                    <Button size="xs" color="link-gray" className="font-medium underline" onClick={onRemoverTodos}>Remover todos</Button>
                )}
            </header>

            {itens.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                    <FeaturedIcon icon={CheckCircle} color="brand" theme="gradient" size="lg" />
                    <p className="text-md text-primary">Você ainda não<br />liberou itens</p>
                </div>
            ) : (
                <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
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
                                                        className="flex items-start gap-3 rounded-lg bg-primary p-3 ring-1 ring-border-secondary dark:bg-[#0a0a0a]"
                                                    >
                                                        {showCota && <span className="flex h-7 min-w-9 shrink-0 items-center justify-center rounded-md bg-secondary px-1.5 text-xs font-semibold text-secondary tabular-nums ring-1 ring-border-secondary">{v.cota}</span>}
                                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                            <span className="truncate text-sm font-semibold text-primary">{item?.nome}</span>
                                                            <span className="truncate text-xs text-tertiary">{item?.grupo} - {item?.tipo}</span>
                                                            <span className="truncate text-xs text-tertiary">{SESSAO_DO_ITEM[v.itemId]}</span>
                                                            {item?.componentes && item.componentes.length > 0 && (
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
