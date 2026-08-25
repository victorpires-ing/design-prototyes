import { useState } from "react";
import { Calendar, ChevronDown, Package, SearchLg, ShoppingCart01 } from "@untitledui/icons";
import { Tabs } from "@/components/application/tabs/tabs";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { COTA_MAXIMA, KIND_TABS, SESSOES, type CatalogoItem, type ItemKind } from "../data/equipe-data";
import { PERMISSAO_META, type CotaModo, type Permissao } from "../data/equipe-v2-store";

const TAB_ICON: Record<ItemKind, React.FC<{ className?: string }>> = { ingresso: Calendar, produto: ShoppingCart01, combo: Package };

/** Agrupa itens por `grupo`, preservando a ordem de aparição. */
function agruparPorGrupo(itens: CatalogoItem[]): [string, CatalogoItem[]][] {
    const mapa = new Map<string, CatalogoItem[]>();
    for (const i of itens) {
        const lista = mapa.get(i.grupo) ?? [];
        lista.push(i);
        mapa.set(i.grupo, lista);
    }
    return [...mapa.entries()];
}

/** Configuração de uma permissão enquanto o grupo está sendo criado. */
export interface RascunhoPermissao {
    modo: CotaModo;
    itens: string[];
    cota: number;
    porItem: Record<string, number>;
}

interface Props {
    concedidas: Permissao[];
    configs: Partial<Record<Permissao, RascunhoPermissao>>;
    /** Marca ou desmarca um item dentro de uma permissão. */
    onItem: (permissao: Permissao, itemId: string, liberado: boolean) => void;
    /** Limite único (modo "grupo"). */
    onCota: (permissao: Permissao, cota: number) => void;
    /** Limite daquele item (modo "item"). */
    onCotaPorItem: (permissao: Permissao, itemId: string, cota: number) => void;
    /** Ação primária do passo — fecha o painel de cotas. */
    advanceButton?: React.ReactNode;
}

/**
 * Cotas e itens no formato da v1: catálogo à esquerda, cotas à direita.
 *
 * Cada tipo de envio é uma coluna da tabela — marca os próprios itens e, quando
 * a cota é por item, traz também a quantidade ali na linha.
 */
export function ConfiguracaoGrupo({ concedidas, configs, onItem, onCota, onCotaPorItem, advanceButton }: Props) {
    const [tab, setTab] = useState<ItemKind>("ingresso");
    const [busca, setBusca] = useState("");
    const [fechadas, setFechadas] = useState<Set<string>>(new Set());

    const comCotaDeGrupo = concedidas.filter((id) => configs[id]?.modo !== "item");
    const larguraColuna = (permissao: Permissao) => (configs[permissao]?.modo === "item" ? "w-[150px]" : "w-[92px]");

    const termo = busca.trim().toLowerCase();
    const filtra = (i: CatalogoItem) =>
        i.kind === tab &&
        (!termo || i.nome.toLowerCase().includes(termo) || i.grupo.toLowerCase().includes(termo) || i.tipo.toLowerCase().includes(termo));
    const sessoesComItens = SESSOES.map((s) => ({ ...s, itens: s.itens.filter(filtra) })).filter((s) => s.itens.length > 0);

    return (
        <div className="flex w-full flex-col gap-6 lg:flex-row">
            {/* Coluna esquerda: catálogo, com uma coluna por tipo de envio */}
            <section className="flex min-w-0 flex-1 flex-col gap-4">
                <Input
                    icon={SearchLg}
                    label="Buscar itens"
                    placeholder="Busque por nome de grupo, item ou lote"
                    value={busca}
                    onChange={setBusca}
                />

                <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(k as ItemKind)} className="w-fit!">
                    <Tabs.List type="button-minimal" size="sm">
                        {KIND_TABS.map((t) => (
                            <Tabs.Item key={t.id} id={t.id}>
                                {t.label}
                            </Tabs.Item>
                        ))}
                    </Tabs.List>
                </Tabs>

                {sessoesComItens.length === 0 ? (
                    <p className="rounded-lg bg-secondary px-4 py-8 text-center text-sm text-tertiary">Nenhum item corresponde à busca.</p>
                ) : (
                    sessoesComItens.map((sessao) => {
                        const aberta = termo !== "" || !fechadas.has(sessao.id);

                        return (
                            <div
                                key={sessao.id}
                                className="flex flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary"
                            >
                                <button
                                    type="button"
                                    aria-expanded={aberta}
                                    onClick={() =>
                                        setFechadas((atual) => {
                                            const proximo = new Set(atual);
                                            if (proximo.has(sessao.id)) proximo.delete(sessao.id);
                                            else proximo.add(sessao.id);
                                            return proximo;
                                        })
                                    }
                                    className={cx(
                                        "flex items-center gap-3 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover",
                                        aberta && "border-b border-secondary",
                                    )}
                                >
                                    <FeaturedIcon icon={TAB_ICON[tab]} color="gray" size="sm" theme="modern" />
                                    <h3 className="flex-1 text-sm font-semibold text-primary">{sessao.data}</h3>
                                    <ChevronDown
                                        aria-hidden="true"
                                        className={cx(
                                            "size-4 shrink-0 text-fg-quaternary transition-transform duration-150",
                                            aberta && "rotate-180",
                                        )}
                                    />
                                </button>

                                {aberta && (
                                    <div className="flex flex-col gap-4 overflow-x-auto p-4">
                                        <div className="flex min-w-max flex-col gap-4">
                                            <div className="flex items-end gap-2 border-b border-secondary pb-2">
                                                <span className="min-w-[220px] flex-1 text-sm font-semibold text-tertiary">Item</span>
                                                {concedidas.map((id) => (
                                                    <span
                                                        key={id}
                                                        className={cx(
                                                            "shrink-0 text-center text-sm font-semibold text-tertiary",
                                                            larguraColuna(id),
                                                        )}
                                                    >
                                                        {PERMISSAO_META[id].label}
                                                    </span>
                                                ))}
                                            </div>

                                            {agruparPorGrupo(sessao.itens).map(([grupo, lista]) => (
                                                <div key={grupo} className="flex flex-col gap-2">
                                                    <p className="text-sm font-semibold tracking-wide text-primary">{grupo}</p>
                                                    <div className="flex flex-col gap-1">
                                                        {lista.map((item) => (
                                                            <div key={item.id} className="flex items-center gap-2 py-1">
                                                                <span className="flex min-w-[220px] flex-1 flex-col">
                                                                    <span className="text-sm font-medium text-primary">
                                                                        {item.nome}
                                                                        <span className="text-tertiary"> · {item.tipo}</span>
                                                                    </span>
                                                                    {item.componentes?.length ? (
                                                                        <span className="truncate text-sm text-tertiary">
                                                                            {item.componentes
                                                                                .map((c) => `${c.nome} · ${c.tipo}`)
                                                                                .join(" + ")}
                                                                        </span>
                                                                    ) : null}
                                                                </span>

                                                                {concedidas.map((id) => {
                                                                    const config = configs[id]!;
                                                                    const liberado = config.itens.includes(item.id);
                                                                    const porItem = config.modo === "item";

                                                                    return (
                                                                        <div
                                                                            key={id}
                                                                            className={cx(
                                                                                "flex shrink-0 items-center justify-center gap-2",
                                                                                larguraColuna(id),
                                                                            )}
                                                                        >
                                                                            <Checkbox
                                                                                size="sm"
                                                                                isSelected={liberado}
                                                                                onChange={(on) => onItem(id, item.id, on)}
                                                                                aria-label={`${PERMISSAO_META[id].label} para ${item.nome} ${item.tipo}`}
                                                                            />
                                                                            {porItem && (
                                                                                <InputNumber
                                                                                    size="sm"
                                                                                    orientation="horizontal"
                                                                                    isDisabled={!liberado}
                                                                                    minValue={0}
                                                                                    maxValue={COTA_MAXIMA}
                                                                                    value={config.porItem[item.id] ?? 0}
                                                                                    onChange={(v) =>
                                                                                        onCotaPorItem(id, item.id, Number.isNaN(v) ? 0 : v)
                                                                                    }
                                                                                    aria-label={`Quantidade de ${PERMISSAO_META[id].label} para ${item.nome}`}
                                                                                    inputClassName="text-center tabular-nums"
                                                                                    className="w-[110px]"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </section>

            {/* Coluna direita: as cotas por grupo num cartão só, como no design */}
            <div className="flex w-full shrink-0 flex-col gap-3 lg:sticky lg:top-6 lg:w-[320px] lg:self-start">
                {comCotaDeGrupo.length > 0 && (
                    <div className="flex flex-col overflow-hidden rounded-xl bg-secondary ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-4 p-4">
                            {comCotaDeGrupo.map((id, indice) => {
                                const meta = PERMISSAO_META[id];
                                const config = configs[id]!;

                                return (
                                    <div key={id} className="flex flex-col gap-1.5">
                                        {/* Divisor tracejado separa um tipo de envio do outro. */}
                                        {indice > 0 && <hr className="mb-3 border-t border-dashed border-secondary" />}
                                        <Input
                                            label={meta.label}
                                            type="number"
                                            min={0}
                                            max={COTA_MAXIMA}
                                            placeholder="0"
                                            value={config.cota ? String(config.cota) : ""}
                                            onChange={(v) => onCota(id, Math.max(0, Number(v) || 0))}
                                            aria-label={`Cota de ${meta.label}`}
                                            isInvalid={config.cota > COTA_MAXIMA}
                                        />
                                    </div>
                                );
                            })}

                            <p className="text-sm text-tertiary">Quantidade de itens que podem ser emitidos em cada tipo de envio.</p>
                        </div>

                        {advanceButton && <div className="border-t border-secondary p-4 [&>*]:w-full">{advanceButton}</div>}
                    </div>
                )}

                {/* Permissões com cota por item já têm os números na tabela — aqui fica só o total. */}
                {concedidas
                    .filter((id) => configs[id]?.modo === "item")
                    .map((id) => {
                        const meta = PERMISSAO_META[id];
                        const config = configs[id]!;
                        const total = config.itens.reduce((soma, itemId) => soma + (config.porItem[itemId] ?? 0), 0);

                        return (
                            <div key={id} className="flex flex-col gap-2 rounded-xl bg-secondary p-4 ring-1 ring-border-secondary">
                                <span className="flex items-center gap-2">
                                    <meta.icon className="size-4 shrink-0 text-fg-brand-primary" aria-hidden="true" />
                                    <span className="text-sm font-semibold text-primary">{meta.label}</span>
                                </span>
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-sm text-tertiary">
                                        {config.itens.length} {config.itens.length === 1 ? "item liberado" : "itens liberados"}
                                    </span>
                                    <span className="text-md font-semibold text-primary tabular-nums">{total.toLocaleString("pt-BR")}</span>
                                </div>
                            </div>
                        );
                    })}

                {/* Sem cota por grupo não há cartão com rodapé — o botão precisa de um lugar. */}
                {comCotaDeGrupo.length === 0 && advanceButton && <div className="flex flex-col [&>*]:w-full">{advanceButton}</div>}
            </div>
        </div>
    );
}
