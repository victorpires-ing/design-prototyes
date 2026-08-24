import { useState } from "react";
import { Calendar, Package, SearchLg, ShoppingCart01, Trash01 } from "@untitledui/icons";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Tabs } from "@/components/application/tabs/tabs";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { COTA_MAXIMA, ITENS_POR_ID, KIND_TABS, SESSAO_DO_ITEM, SESSOES, type CatalogoItem, type ItemKind } from "../data/equipe-data";
import { PERMISSAO_META, type CotaModo, type Permissao } from "../data/equipe-v2-store";

const TAB_ICON: Record<ItemKind, React.FC<{ className?: string }>> = { ingresso: Calendar, produto: ShoppingCart01, combo: Package };

const MODOS: Array<{ id: CotaModo; label: string; descricao: string }> = [
    { id: "compartilhada", label: "Uma cota para o grupo inteiro", descricao: "Todos os operadores consomem do mesmo saldo." },
    { id: "individual", label: "A mesma cota para cada operador", descricao: "Cada operador recebe esse saldo separadamente." },
];

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
    /** Permissões concedidas no passo anterior. */
    concedidas: Permissao[];
    modo: CotaModo;
    onModo: (modo: CotaModo) => void;
    cotas: Partial<Record<Permissao, number>>;
    onCota: (permissao: Permissao, cota: number) => void;
    /** Ids dos itens liberados — os mesmos para todas as permissões. */
    itens: string[];
    onItens: (itens: string[]) => void;
}

/**
 * Passo 2 — uma tela só: quanto o grupo pode operar em cada permissão e
 * quais itens ficam liberados. Sem abas: as cotas ficam lado a lado.
 */
export function ConfiguracaoGrupo({ concedidas, modo, onModo, cotas, onCota, itens, onItens }: Props) {
    const [tab, setTab] = useState<ItemKind>("ingresso");
    const [busca, setBusca] = useState("");

    const selecionados = new Set(itens);
    const toggle = (id: string, on: boolean) => onItens(on ? [...itens, id] : itens.filter((i) => i !== id));

    const termo = busca.trim().toLowerCase();
    const filtra = (i: CatalogoItem) =>
        i.kind === tab &&
        (!termo || i.nome.toLowerCase().includes(termo) || i.grupo.toLowerCase().includes(termo) || i.tipo.toLowerCase().includes(termo));
    const sessoesComItens = SESSOES.map((s) => ({ ...s, itens: s.itens.filter(filtra) })).filter((s) => s.itens.length > 0);

    return (
        <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">
            {/* 1. Quanto o grupo pode operar */}
            <section className="flex flex-col gap-4 rounded-2xl bg-secondary p-5 ring-1 ring-border-secondary">
                <div className="flex flex-col gap-1">
                    <h2 className="text-md font-semibold text-primary">Quanto este grupo pode operar?</h2>
                    <p className="text-sm text-tertiary">Defina o limite de cada permissão concedida.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {concedidas.map((id) => {
                        const meta = PERMISSAO_META[id];
                        const valor = cotas[id] ?? 0;
                        return (
                            <div key={id} className="flex flex-col gap-2 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                                <span className="flex items-center gap-2">
                                    <meta.icon className="size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />
                                    <span className="text-sm font-semibold text-primary">{meta.label}</span>
                                </span>
                                <Input
                                    type="number"
                                    min={0}
                                    max={COTA_MAXIMA}
                                    value={String(valor)}
                                    onChange={(v) => onCota(id, Math.max(0, Number(v) || 0))}
                                    aria-label={`Cota de ${meta.label}`}
                                    isInvalid={valor > COTA_MAXIMA}
                                />
                                <span className="text-sm text-tertiary">{meta.unidade}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-2 border-t border-secondary pt-4">
                    <span className="text-sm font-medium text-secondary">Esses números valem para…</span>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {MODOS.map((opcao) => (
                            <button
                                key={opcao.id}
                                type="button"
                                onClick={() => onModo(opcao.id)}
                                className={cx(
                                    "flex flex-col gap-0.5 rounded-lg bg-primary p-3 text-left ring-1 transition duration-100 ease-linear hover:bg-primary_hover",
                                    modo === opcao.id ? "ring-brand" : "ring-border-secondary",
                                )}
                            >
                                <span className="text-sm font-medium text-primary">{opcao.label}</span>
                                <span className="text-sm text-tertiary">{opcao.descricao}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2. Em quais itens */}
            <section className="flex flex-col gap-4 rounded-2xl bg-secondary p-5 ring-1 ring-border-secondary">
                <div className="flex flex-col gap-1">
                    <h2 className="text-md font-semibold text-primary">Em quais itens?</h2>
                    <p className="text-sm text-tertiary">Os itens marcados valem para todas as permissões do grupo.</p>
                </div>

                <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="flex min-w-0 flex-1 flex-col gap-4">
                        <Input
                            icon={SearchLg}
                            placeholder="Busque por nome de grupo, item ou lote"
                            value={busca}
                            onChange={setBusca}
                            aria-label="Buscar itens"
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
                            <p className="rounded-lg bg-primary px-4 py-8 text-center text-sm text-tertiary">
                                Nenhum item corresponde à busca.
                            </p>
                        ) : (
                            sessoesComItens.map((sessao) => (
                                <div
                                    key={sessao.id}
                                    className="flex flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary"
                                >
                                    <div className="flex items-center gap-3 border-b border-secondary px-4 py-3">
                                        <FeaturedIcon icon={TAB_ICON[tab]} color="gray" size="sm" theme="modern" />
                                        <h3 className="flex-1 text-sm font-semibold text-primary">{sessao.data}</h3>
                                        <SelecionarTodos
                                            ids={sessao.itens.map((i) => i.id)}
                                            selecionados={selecionados}
                                            onItens={onItens}
                                            itens={itens}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-4 p-4">
                                        {porGrupo(sessao.itens).map(([grupo, lista]) => (
                                            <div key={grupo} className="flex flex-col gap-2">
                                                <p className="text-sm font-semibold tracking-wide text-primary">{grupo}</p>
                                                <div className="flex flex-col gap-1">
                                                    {lista.map((item) => (
                                                        <label
                                                            key={item.id}
                                                            className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition duration-100 ease-linear hover:bg-primary_hover"
                                                        >
                                                            <Checkbox
                                                                size="sm"
                                                                isSelected={selecionados.has(item.id)}
                                                                onChange={(on) => toggle(item.id, on)}
                                                                aria-label={`${item.nome} ${item.tipo}`}
                                                            />
                                                            <span className="flex min-w-0 flex-col">
                                                                <span className="text-sm font-medium text-primary">
                                                                    {item.nome}
                                                                    <span className="text-tertiary"> · {item.tipo}</span>
                                                                </span>
                                                                {item.componentes?.length ? (
                                                                    <span className="truncate text-sm text-tertiary">
                                                                        {item.componentes.map((c) => `${c.nome} · ${c.tipo}`).join(" + ")}
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <ResumoItens itens={itens} onItens={onItens} />
                </div>
            </section>
        </div>
    );
}

/** Marca ou desmarca todos os itens visíveis da sessão de uma vez. */
const SelecionarTodos = ({
    ids,
    selecionados,
    itens,
    onItens,
}: {
    ids: string[];
    selecionados: Set<string>;
    itens: string[];
    onItens: (itens: string[]) => void;
}) => {
    const todos = ids.every((id) => selecionados.has(id));

    return (
        <button
            type="button"
            onClick={() => onItens(todos ? itens.filter((i) => !ids.includes(i)) : [...new Set([...itens, ...ids])])}
            className="text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
        >
            {todos ? "Desmarcar todos" : "Selecionar todos"}
        </button>
    );
};

const ResumoItens = ({ itens, onItens }: { itens: string[]; onItens: (itens: string[]) => void }) => (
    <div className="flex w-full shrink-0 flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary lg:sticky lg:top-6 lg:w-[300px] lg:self-start">
        <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-primary">
                {itens.length} {itens.length === 1 ? "item liberado" : "itens liberados"}
            </span>
            {itens.length > 0 && (
                <button
                    type="button"
                    onClick={() => onItens([])}
                    className="text-sm text-tertiary transition duration-100 ease-linear hover:text-secondary"
                >
                    Limpar
                </button>
            )}
        </div>

        {itens.length === 0 ? (
            <p className="py-6 text-center text-sm text-tertiary">Marque ao menos um item para continuar.</p>
        ) : (
            <ul className="flex flex-col divide-y divide-secondary">
                {itens.map((id) => {
                    const item = ITENS_POR_ID[id];
                    return (
                        <li key={id} className="flex items-start justify-between gap-2 py-2 first:pt-0 last:pb-0">
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-medium text-primary">
                                    {item?.nome}
                                    <span className="text-tertiary"> · {item?.tipo}</span>
                                </span>
                                <span className="truncate text-sm text-tertiary">{SESSAO_DO_ITEM[id]}</span>
                            </span>
                            <button
                                type="button"
                                onClick={() => onItens(itens.filter((i) => i !== id))}
                                aria-label={`Remover ${item?.nome}`}
                                className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-error-secondary"
                            >
                                <Trash01 className="size-4" />
                            </button>
                        </li>
                    );
                })}
            </ul>
        )}
    </div>
);
