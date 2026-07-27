import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, CheckCircle, ChevronDown, InfoCircle, Package, SearchLg, ShoppingCart01, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Tabs } from "@/components/application/tabs/tabs";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { COTA_MAXIMA, ITENS_POR_ID, KIND_TABS, SESSAO_DO_ITEM, SESSOES, type CatalogoItem, type ItemKind } from "../data/equipe-data";
import type { CotaModo, ItemCota } from "../data/equipe-store";

/** Texto do aviso de consumo da cota conforme o modo escolhido. */
export const AVISO_COTA: Record<CotaModo, string> = {
    compartilhada: "Os operadores consumirão juntos a cota de itens.",
    individual: "Cada operador terá a própria cota para cada item.",
};

const COTA_PADRAO = 0;

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
    /** itemId → cota selecionada. */
    value: ItemCota[];
    onChange: (itens: ItemCota[]) => void;
    /** Piso da cota por item (ex.: já emitidos) — usado na edição. */
    minPorItem?: Record<string, number>;
    /** Modo de gestão da cota (muda o texto do aviso). */
    modo?: CotaModo;
}

export function ItensCotasSelector({ value, onChange, minPorItem, modo = "compartilhada" }: Props) {
    const [tab, setTab] = useState<ItemKind>("ingresso");
    const [busca, setBusca] = useState("");
    const [fechadas, setFechadas] = useState<Set<string>>(new Set());

    const mapa = useMemo(() => new Map(value.map((v) => [v.itemId, v.cota])), [value]);

    const setCota = useCallback(
        (itemId: string, cota: number) =>
            onChange(value.some((v) => v.itemId === itemId) ? value.map((v) => (v.itemId === itemId ? { ...v, cota } : v)) : [...value, { itemId, cota }]),
        [onChange, value],
    );
    const remover = useCallback((itemId: string) => onChange(value.filter((v) => v.itemId !== itemId)), [onChange, value]);
    const toggle = (item: CatalogoItem, on: boolean) => (on ? setCota(item.id, minPorItem?.[item.id] ?? COTA_PADRAO) : remover(item.id));

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
                            <div className="flex items-center justify-between gap-2 border-b border-secondary pb-2 text-xs font-semibold tracking-wide text-tertiary uppercase">
                                <span className="pl-2">Item</span>
                                <span className="pr-1">Qtd. cortesias</span>
                            </div>
                            {porGrupo(sessao.itens).map(([grupo, lista]) => (
                                <div key={grupo} className="flex flex-col gap-2">
                                    <p className="text-sm font-semibold tracking-wide text-primary">{grupo}</p>
                                    <div className="flex flex-col gap-1">
                                        {lista.map((item) => (
                                            <ItemRow
                                                key={item.id}
                                                item={item}
                                                cota={mapa.get(item.id)}
                                                minCota={minPorItem?.[item.id]}
                                                onToggle={(on) => toggle(item, on)}
                                                onCota={(c) => setCota(item.id, c)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </AccordionShell>
                    ))
                )}
            </section>

            {/* Coluna direita: resumo + aviso fora do card */}
            <div className="flex w-full shrink-0 flex-col gap-3 lg:sticky lg:top-6 lg:w-[340px] lg:self-start">
                <ResumoPanel value={value} onRemover={remover} onRemoverTodos={() => onChange([])} />
                <div className="flex items-start gap-2 px-1">
                    <InfoCircle className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden="true" />
                    <p className="text-xs text-primary">{AVISO_COTA[modo]}</p>
                </div>
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
    cota?: number;
    minCota?: number;
    onToggle: (on: boolean) => void;
    onCota: (cota: number) => void;
}

function ItemRow({ item, cota, minCota, onToggle, onCota }: ItemRowProps) {
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
                            ) : (
                                <span className="flex items-baseline gap-2">
                                    <span className="text-sm font-medium text-primary">{item.nome}</span>
                                    <Badge type="pill-color" color="gray" size="sm">{item.tipo}</Badge>
                                </span>
                            )
                        }
                    />
                </label>
                <AnimatePresence initial={false}>
                    {selecionado && (
                        <motion.input
                            key="qtd"
                            type="number"
                            min={piso}
                            max={COTA_MAXIMA}
                            value={cota}
                            onChange={(e) => onCota(Math.max(0, Number(e.target.value) || 0))}
                            aria-label={`Cota de ${item.nome}`}
                            initial={{ opacity: 0, scale: 0.8, width: 0 }}
                            animate={{ opacity: 1, scale: 1, width: 80 }}
                            exit={{ opacity: 0, scale: 0.8, width: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 34 }}
                            className={cx(
                                "mt-0.5 shrink-0 rounded-lg bg-primary px-3 py-1.5 text-right text-sm font-medium text-primary tabular-nums shadow-xs ring-1 outline-none transition-[box-shadow] duration-100 ease-linear focus:ring-2",
                                invalido ? "ring-border-error focus:ring-error" : "ring-border-primary focus:ring-brand",
                            )}
                        />
                    )}
                </AnimatePresence>
            </div>

            {ehCombo && (
                <ul className="ml-8 flex flex-col gap-1.5">
                    {item.componentes!.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-secondary">
                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-tertiary text-[10px] font-semibold text-secondary">{i + 1}</span>
                            <span><span className="font-medium text-primary">{c.nome}</span> - <span className="text-secondary">{c.tipo}</span></span>
                        </li>
                    ))}
                </ul>
            )}

            {selecionado && erro && <p className="pl-9 text-xs font-medium text-error-primary">{erro}</p>}
        </div>
    );
}

/* ------------------------------- Resumo -------------------------- */

function ResumoPanel({ value, onRemover, onRemoverTodos }: { value: ItemCota[]; onRemover: (id: string) => void; onRemoverTodos: () => void }) {
    const porKind = useMemo(() => {
        const grupos: Record<ItemKind, ItemCota[]> = { ingresso: [], produto: [], combo: [] };
        for (const v of value) {
            const item = ITENS_POR_ID[v.itemId];
            if (item) grupos[item.kind].push(v);
        }
        return grupos;
    }, [value]);

    const kindLabel: Record<ItemKind, string> = { ingresso: "Ingressos", produto: "Produtos", combo: "Combos" };
    const vazio = value.length === 0;

    return (
        <aside className="flex h-[460px] flex-col overflow-hidden rounded-xl bg-secondary ring-1 ring-border-secondary">
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-secondary px-4 py-3.5">
                <h3 className="text-sm font-semibold text-primary">Resumo</h3>
                {!vazio && (
                    <Button size="xs" color="link-gray" className="font-medium underline" onClick={onRemoverTodos}>
                        Remover todos
                    </Button>
                )}
            </header>

            {vazio ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                    <FeaturedIcon icon={CheckCircle} color="brand" theme="gradient" size="lg" />
                    <p className="text-md text-primary">Você ainda não<br />selecionou itens</p>
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
                                                        <span className="flex h-7 min-w-9 shrink-0 items-center justify-center rounded-md bg-secondary px-1.5 text-xs font-semibold text-secondary tabular-nums ring-1 ring-border-secondary">{v.cota}</span>
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
