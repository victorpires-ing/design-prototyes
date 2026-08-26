import { Fragment, useState } from "react";
import { AlertCircle, Calendar, ChevronDown, Package, SearchLg, ShoppingCart01 } from "@untitledui/icons";
import { Tabs } from "@/components/application/tabs/tabs";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input, InputBase } from "@/components/base/input/input";
import { InputNumber } from "@/components/base/input/input-number";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { COTA_MAXIMA, KIND_TABS, SESSOES, type CatalogoItem, type ItemKind } from "../data/equipe-data";
import { PERMISSAO_META, type CotaModo, type Permissao } from "../data/equipe-v2-store";

const TAB_ICON: Record<ItemKind, React.FC<{ className?: string }>> = { ingresso: Calendar, produto: ShoppingCart01, combo: Package };

/** Configuração de uma permissão enquanto o grupo está sendo criado. */
export interface RascunhoPermissao {
    modo: CotaModo;
    itens: string[];
    cota: number;
    porItem: Record<string, number>;
}

/** Soma dos limites digitados na tabela, para a permissão com cota por item. */
const totalPorItem = (config: RascunhoPermissao) => config.itens.reduce((soma, id) => soma + (config.porItem[id] ?? 0), 0);

interface Props {
    concedidas: Permissao[];
    configs: Partial<Record<Permissao, RascunhoPermissao>>;
    /** Marca ou desmarca um item dentro de uma permissão. */
    onItem: (permissao: Permissao, itemId: string, liberado: boolean) => void;
    /** Limite único (modo "grupo"). */
    onCota: (permissao: Permissao, cota: number) => void;
    /** Limite daquele item (modo "item"). */
    onCotaPorItem: (permissao: Permissao, itemId: string, cota: number) => void;
    /** O que falta em cada permissão — só aparece depois da primeira tentativa de avançar. */
    erros?: Partial<Record<Permissao, string>>;
    /** Ação primária do passo. */
    advanceButton?: React.ReactNode;
}

/**
 * Cotas e itens no formato da v1: catálogo à esquerda, cotas à direita.
 *
 * Cada permissão é uma coluna da tabela: marca os próprios itens e, quando a
 * cota é por item, traz também a quantidade ali na linha.
 */
export function ConfiguracaoGrupo({ concedidas, configs, onItem, onCota, onCotaPorItem, erros, advanceButton }: Props) {
    const [tab, setTab] = useState<ItemKind>("ingresso");
    const [busca, setBusca] = useState("");
    const [fechadas, setFechadas] = useState<Set<string>>(new Set());

    const termo = busca.trim().toLowerCase();
    const filtra = (i: CatalogoItem) =>
        i.kind === tab &&
        (!termo || i.nome.toLowerCase().includes(termo) || i.grupo.toLowerCase().includes(termo) || i.tipo.toLowerCase().includes(termo));
    const sessoesComItens = SESSOES.map((s) => ({ ...s, itens: s.itens.filter(filtra) })).filter((s) => s.itens.length > 0);

    return (
        <div className="flex w-full flex-col gap-6 max-lg:pb-28 lg:flex-row">
            <section className="flex min-w-0 flex-1 flex-col gap-4">
                {/*
                  No mobile as cotas vêm antes da tabela, no fluxo da página. Campo obrigatório
                  dentro de gaveta passa despercebido: gaveta é para o que é opcional.
                */}
                <div className="lg:hidden">
                    <CartaoCotas concedidas={concedidas} configs={configs} onCota={onCota} erros={erros} />
                </div>

                {/* Mesma composição da bilheteria: tipo de item à esquerda, busca à direita. */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(k as ItemKind)} className="md:w-auto md:shrink-0">
                        <Tabs.List type="button-border" size="sm" className="max-md:w-full">
                            {KIND_TABS.map((t) => (
                                <Tabs.Item key={t.id} id={t.id} className="max-md:flex-1">
                                    {t.label}
                                </Tabs.Item>
                            ))}
                        </Tabs.List>
                    </Tabs>
                    <div className="md:flex-1">
                        <InputBase
                            size="sm"
                            icon={SearchLg}
                            value={busca}
                            aria-label="Buscar item"
                            onChange={(event) => setBusca(event.target.value)}
                            placeholder="Buscar por nome, grupo ou lote"
                        />
                    </div>
                </div>

                {/* Ensina a mecânica da tabela sem tutorial: cada coluna é uma permissão. */}
                <p className="text-sm text-tertiary">
                    Cada coluna é uma permissão. Marque os itens que ela libera e, quando a cota for por item, informe a quantidade na
                    própria linha.
                </p>

                {sessoesComItens.length === 0 ? (
                    <p className="rounded-lg bg-secondary px-4 py-8 text-center text-sm text-tertiary">
                        Nenhum item com esse nome. Tente outro termo ou troque de aba.
                    </p>
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
                                    <>
                                        {/* Mobile: cartão por item. Rolagem horizontal com campo dentro é intragável. */}
                                        <ListaSessaoMobile
                                            sessao={sessao}
                                            concedidas={concedidas}
                                            configs={configs}
                                            onItem={onItem}
                                            onCotaPorItem={onCotaPorItem}
                                        />
                                        <TabelaSessao
                                            sessao={sessao}
                                            concedidas={concedidas}
                                            configs={configs}
                                            onItem={onItem}
                                            onCotaPorItem={onCotaPorItem}
                                        />
                                    </>
                                )}
                            </div>
                        );
                    })
                )}
            </section>

            {/* Desktop: o cartão de cotas fica na coluna da direita. */}
            <div className="w-full shrink-0 max-lg:hidden lg:sticky lg:top-6 lg:w-[320px] lg:self-start">
                <CartaoCotas concedidas={concedidas} configs={configs} onCota={onCota} erros={erros} advanceButton={advanceButton} />
            </div>

            {/* Mobile: barra fixa só com o resumo e a ação. */}
            <BarraAcao concedidas={concedidas} configs={configs} erros={erros} advanceButton={advanceButton} />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Itens de uma sessão                                                */
/* ------------------------------------------------------------------ */

interface TabelaProps {
    sessao: (typeof SESSOES)[number];
    concedidas: Permissao[];
    configs: Partial<Record<Permissao, RascunhoPermissao>>;
    onItem: Props["onItem"];
    onCotaPorItem: Props["onCotaPorItem"];
}

/**
 * Tabela real (`<table>` + `<th scope>`), para o leitor de tela anunciar a
 * permissão junto de cada campo. O wrapper é focável para rolar pelo teclado.
 */
const TabelaSessao = ({ sessao, concedidas, configs, onItem, onCotaPorItem }: TabelaProps) => {
    const ids = sessao.itens.map((i) => i.id);

    return (
        <div
            role="region"
            tabIndex={0}
            aria-label={`Itens de ${sessao.data}`}
            className="overflow-x-auto p-4 outline-brand max-md:hidden focus-visible:outline-2 focus-visible:-outline-offset-2"
        >
            <table className="w-full min-w-max border-collapse">
                <caption className="sr-only">Itens liberados e cotas por permissão em {sessao.data}</caption>
                <thead>
                    <tr className="border-b border-secondary">
                        <th scope="col" className="min-w-[150px] py-2 pr-3 text-left align-bottom text-sm font-semibold text-tertiary">
                            Item
                        </th>
                        {concedidas.map((id) => {
                            const config = configs[id]!;
                            const naSessao = ids.filter((itemId) => config.itens.includes(itemId));

                            return (
                                <th
                                    key={id}
                                    scope="col"
                                    className={cx(
                                        "px-1.5 py-2 text-center align-bottom text-sm font-semibold whitespace-nowrap text-tertiary",
                                        config.modo === "item" ? "w-[156px]" : "w-[120px]",
                                    )}
                                >
                                    {PERMISSAO_META[id].label}
                                    {naSessao.length > 0 && (
                                        <span className="font-normal text-quaternary tabular-nums">
                                            {" "}
                                            {naSessao.length}/{ids.length}
                                        </span>
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>

                <tbody>
                    {sessao.itens.map((item, indice) => {
                        const primeiroDoGrupo = indice === 0 || sessao.itens[indice - 1].grupo !== item.grupo;

                        return (
                            <Fragment key={item.id}>
                                {primeiroDoGrupo && (
                                    <tr>
                                        <th
                                            scope="colgroup"
                                            colSpan={concedidas.length + 1}
                                            className="pt-4 pb-1 text-left text-sm font-semibold tracking-wide text-primary"
                                        >
                                            {item.grupo}
                                        </th>
                                    </tr>
                                )}

                                <tr>
                                    <th scope="row" className="py-1 pr-4 text-left font-normal">
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
                                    </th>

                                    {concedidas.map((id) => {
                                        const config = configs[id]!;

                                        return (
                                            <td key={id} className="px-1.5 py-1">
                                                {config.modo === "item" ? (
                                                    <div className="flex justify-center">
                                                        <InputNumber
                                                            size="sm"
                                                            orientation="horizontal"
                                                            minValue={0}
                                                            maxValue={COTA_MAXIMA}
                                                            value={config.porItem[item.id] ?? 0}
                                                            onChange={(v) => onCotaPorItem(id, item.id, Number.isNaN(v) ? 0 : v)}
                                                            aria-label={`Quantidade de ${PERMISSAO_META[id].label} para ${item.nome} ${item.tipo}`}
                                                            inputClassName="text-center tabular-nums"
                                                            className="w-[144px]"
                                                        />
                                                    </div>
                                                ) : (
                                                    // min-h-11: alvo de toque de 44px, o quadrado do checkbox tem 16.
                                                    <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear hover:bg-primary_hover">
                                                        <Checkbox
                                                            size="sm"
                                                            isSelected={config.itens.includes(item.id)}
                                                            onChange={(on) => onItem(id, item.id, on)}
                                                            aria-label={`${PERMISSAO_META[id].label} para ${item.nome} ${item.tipo}`}
                                                        />
                                                    </label>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

/**
 * Mesma configuração em cartões: o item é o cabeçalho e cada permissão vira uma
 * linha rotulada. Sem tabela, sem rolagem lateral.
 */
const ListaSessaoMobile = ({ sessao, concedidas, configs, onItem, onCotaPorItem }: TabelaProps) => (
    <div className="flex flex-col gap-3 p-4 md:hidden">
        {sessao.itens.map((item, indice) => {
            const primeiroDoGrupo = indice === 0 || sessao.itens[indice - 1].grupo !== item.grupo;

            return (
                <div key={item.id} className="flex flex-col gap-2">
                    {primeiroDoGrupo && <p className="pt-2 text-sm font-semibold tracking-wide text-primary">{item.grupo}</p>}

                    <div className="flex flex-col gap-2 rounded-xl bg-secondary p-3">
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

                        <div className="flex flex-col divide-y divide-secondary border-t border-secondary">
                            {concedidas.map((id) => {
                                const config = configs[id]!;

                                return config.modo === "item" ? (
                                    <div key={id} className="flex items-center justify-between gap-3 py-2">
                                        <span className="text-sm text-tertiary">{PERMISSAO_META[id].label}</span>
                                        <InputNumber
                                            size="sm"
                                            orientation="horizontal"
                                            minValue={0}
                                            maxValue={COTA_MAXIMA}
                                            value={config.porItem[item.id] ?? 0}
                                            onChange={(v) => onCotaPorItem(id, item.id, Number.isNaN(v) ? 0 : v)}
                                            aria-label={`Quantidade de ${PERMISSAO_META[id].label} para ${item.nome} ${item.tipo}`}
                                            inputClassName="text-center tabular-nums"
                                            className="w-[152px] shrink-0"
                                        />
                                    </div>
                                ) : (
                                    <label key={id} className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
                                        <span className="text-sm text-tertiary">{PERMISSAO_META[id].label}</span>
                                        <Checkbox
                                            size="md"
                                            isSelected={config.itens.includes(item.id)}
                                            onChange={(on) => onItem(id, item.id, on)}
                                            aria-label={`${PERMISSAO_META[id].label} para ${item.nome} ${item.tipo}`}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);

/* ------------------------------------------------------------------ */
/*  Painel de cotas                                                    */
/* ------------------------------------------------------------------ */

interface PainelProps {
    concedidas: Permissao[];
    configs: Partial<Record<Permissao, RascunhoPermissao>>;
    onCota?: (permissao: Permissao, cota: number) => void;
    erros?: Partial<Record<Permissao, string>>;
    advanceButton?: React.ReactNode;
}

/** Cotas de todas as permissões num cartão só. */
const CartaoCotas = ({ concedidas, configs, onCota, erros, advanceButton }: PainelProps) => (
    <div className="flex flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
        <div className="flex flex-col gap-4 p-4">
            {concedidas.map((id, indice) => (
                <div key={id} className="flex flex-col gap-1.5">
                    {/* Divisor tracejado separa uma permissão da outra. */}
                    {indice > 0 && <hr className="mb-3 border-t border-dashed border-secondary" />}
                    <LinhaCota permissao={id} config={configs[id]!} onCota={onCota} erro={erros?.[id]} />
                </div>
            ))}
        </div>

        {advanceButton && <div className="border-t border-secondary p-4 [&>*]:w-full">{advanceButton}</div>}
    </div>
);

const LinhaCota = ({
    permissao,
    config,
    onCota,
    erro,
}: {
    permissao: Permissao;
    config: RascunhoPermissao;
    onCota?: (permissao: Permissao, cota: number) => void;
    erro?: string;
}) => {
    const meta = PERMISSAO_META[permissao];

    // Cota por item já tem os números na tabela: aqui vira leitura.
    if (config.modo === "item") {
        return (
            <>
                <span className="text-sm font-medium text-secondary">{meta.cotaLabel}</span>
                <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-tertiary">
                        {config.itens.length === 0
                            ? "Informe as quantidades na tabela"
                            : `${config.itens.length} ${config.itens.length === 1 ? "item selecionado" : "itens selecionados"}`}
                    </span>
                    {totalPorItem(config) > 0 && (
                        <span className="text-md font-semibold text-primary tabular-nums">
                            {totalPorItem(config).toLocaleString("pt-BR")}
                        </span>
                    )}
                </span>
                {erro && <MensagemErro>{erro}</MensagemErro>}
            </>
        );
    }

    return (
        <>
            <Input
                label={meta.cotaLabel}
                type="number"
                min={0}
                max={COTA_MAXIMA}
                placeholder="0"
                value={config.cota ? String(config.cota) : ""}
                onChange={(v) => onCota?.(permissao, Math.max(0, Number(v) || 0))}
                aria-label={`Cota de ${meta.label}`}
                isInvalid={Boolean(erro) || config.cota > COTA_MAXIMA}
            />
            <span className="text-sm text-tertiary">
                {config.itens.length === 0
                    ? "Marque os itens na tabela"
                    : `${config.itens.length} ${config.itens.length === 1 ? "item selecionado" : "itens selecionados"}`}
            </span>
            {erro && <MensagemErro>{erro}</MensagemErro>}
        </>
    );
};

const MensagemErro = ({ children }: { children: React.ReactNode }) => (
    <span role="alert" className="flex items-start gap-1.5 text-sm text-error-primary">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {children}
    </span>
);

/** Barra fixa do mobile: o que ainda falta, nome por nome, e a ação primária. */
const BarraAcao = ({ concedidas, configs, erros, advanceButton }: PainelProps) => {
    const pendentes = concedidas.filter((id) => erros?.[id]);

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-2 border-t border-secondary bg-primary px-4 pt-3 pb-4 lg:hidden">
            {pendentes.length > 0 ? (
                // Dizer qual permissão e o que falta nela: "1 permissão incompleta" não orienta ninguém.
                <div role="alert" className="flex flex-col gap-1">
                    {pendentes.map((id) => (
                        <p key={id} className="flex items-start gap-1.5 text-sm text-error-primary">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {erros![id]}
                        </p>
                    ))}
                </div>
            ) : (
                <p className="flex flex-wrap gap-x-3 text-sm text-tertiary">
                    {concedidas.map((id) => {
                        const config = configs[id]!;
                        const total = config.modo === "item" ? totalPorItem(config) : config.cota;
                        return (
                            <span key={id}>
                                {PERMISSAO_META[id].label}{" "}
                                <span className="font-semibold text-secondary tabular-nums">{total.toLocaleString("pt-BR")}</span>
                            </span>
                        );
                    })}
                </p>
            )}
            {advanceButton && <div className="[&>*]:w-full">{advanceButton}</div>}
        </div>
    );
};
