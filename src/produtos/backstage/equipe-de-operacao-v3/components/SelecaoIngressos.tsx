import { useMemo, useState } from "react";
import { SearchLg, Trash01 } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { CheckboxBase } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import iconeResumoVazio from "../assets/icone-resumo-vazio.svg";
import {
    agruparPorSessao,
    COMBOS,
    INGRESSOS,
    ITEM_POR_ID,
    PRODUTOS,
    SESSAO_POR_ID,
    type Combo,
    type Ingresso,
    type ItemCatalogo,
    type Produto,
    type TipoItem,
} from "../data/catalogo-evento";
import { ALTURA_CABECALHO, BadgeTipo, CardSessao } from "./ui-cotas";

const ABAS: Array<{ id: TipoItem; label: string }> = [
    { id: "ingresso", label: "Ingressos" },
    { id: "produto", label: "Produtos" },
    { id: "combo", label: "Combos" },
];

const SINGULAR: Record<TipoItem, string> = { ingresso: "ingresso", produto: "produto", combo: "combo" };

const CATALOGO: Record<TipoItem, ItemCatalogo[]> = { ingresso: INGRESSOS, produto: PRODUTOS, combo: COMBOS };

const textoBusca = (i: ItemCatalogo) =>
    [i.nome, i.tipo === "produto" ? i.descricao : i.grupo, i.tipo === "produto" ? "" : i.categoria, SESSAO_POR_ID[i.sessaoId]?.rotulo].join(" ").toLowerCase();

interface Props {
    /** Ids dos itens que o grupo poderá operar, na ordem em que foram escolhidos. */
    selecionados: string[];
    onChange: (ids: string[]) => void;
}

/** Etapa "Itens": escolha do que o grupo opera, com o resumo ao lado. */
export function SelecaoIngressos({ selecionados, onChange }: Props) {
    const [aba, setAba] = useState<TipoItem>("ingresso");
    const [busca, setBusca] = useState("");
    const set = useMemo(() => new Set(selecionados), [selecionados]);

    const alternar = (id: string, marcar: boolean) => {
        if (marcar && set.has(id)) return;
        onChange(marcar ? [...selecionados, id] : selecionados.filter((i) => i !== id));
    };

    // O que está na tela: a aba atual, filtrada pela busca.
    const visiveis = useMemo(() => {
        const q = busca.trim().toLowerCase();
        return CATALOGO[aba].filter((i) => !q || textoBusca(i).includes(q));
    }, [aba, busca]);
    const sessoes = useMemo(() => agruparPorSessao(visiveis), [visiveis]);

    // "Selecionar todos" vale para o que está visível (aba + busca), sem mexer no resto da seleção.
    const marcadosVisiveis = visiveis.filter((i) => set.has(i.id)).length;
    const todosMarcados = visiveis.length > 0 && marcadosVisiveis === visiveis.length;
    const alternarTodos = () => {
        if (todosMarcados) {
            const ids = new Set(visiveis.map((i) => i.id));
            onChange(selecionados.filter((id) => !ids.has(id)));
        } else {
            onChange([...selecionados, ...visiveis.filter((i) => !set.has(i.id)).map((i) => i.id)]);
        }
    };

    return (
        <div className="flex w-full items-start gap-4">
            <section className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="w-full max-w-[300px]">
                        <Input
                            size="sm"
                            icon={SearchLg}
                            placeholder="Busque por nome do grupo ou item"
                            value={busca}
                            onChange={setBusca}
                            aria-label="Buscar itens"
                        />
                    </div>
                    <div role="tablist" className="inline-flex shrink-0 overflow-hidden rounded-lg border border-primary">
                        {ABAS.map((t, i) => (
                            <button
                                key={t.id}
                                type="button"
                                role="tab"
                                aria-selected={aba === t.id}
                                onClick={() => setAba(t.id)}
                                className={cx(
                                    "px-3.5 py-2 text-sm font-semibold outline-none transition duration-100 ease-linear",
                                    i > 0 && "border-l border-primary",
                                    aba === t.id ? "bg-tertiary text-[var(--color-neutral-200)]" : "bg-primary text-secondary hover:bg-primary_hover",
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {sessoes.length === 0 ? (
                    <div className="rounded-xl bg-primary_alt px-5 py-10 text-center text-sm text-tertiary ring-1 ring-border-secondary ring-inset">
                        {busca.trim() ? "Nenhum item corresponde à busca." : `Este evento não tem ${ABAS.find((a) => a.id === aba)?.label.toLowerCase()}.`}
                    </div>
                ) : (
                    <>
                        <SelecionarTodos
                            marcado={todosMarcados}
                            parcial={marcadosVisiveis > 0 && !todosMarcados}
                            total={visiveis.length}
                            rotulo={visiveis.length === 1 ? SINGULAR[aba] : ABAS.find((a) => a.id === aba)!.label.toLowerCase()}
                            onChange={alternarTodos}
                        />
                        {sessoes.map(({ sessao, grupos }) => (
                            <CardSessao key={sessao.id} rotulo={sessao.rotulo}>
                                {grupos.map((grupo) => (
                                    <div key={grupo.nome} className="flex flex-col">
                                        <p className="flex h-8 items-center text-sm font-semibold text-primary">{grupo.nome}</p>
                                        {grupo.itens.map((item) => (
                                            <LinhaItem key={item.id} item={item} marcado={set.has(item.id)} onChange={(m) => alternar(item.id, m)} />
                                        ))}
                                    </div>
                                ))}
                            </CardSessao>
                        ))}
                    </>
                )}
            </section>

            <Resumo selecionados={selecionados} onRemover={(id) => alternar(id, false)} onLimpar={() => onChange([])} />
        </div>
    );
}

/* --------------------------------- Linha -------------------------------- */

/** A linha inteira é o checkbox: um clique em qualquer ponto marca ou desmarca o item. */
const LinhaItem = ({ item, marcado, onChange }: { item: ItemCatalogo; marcado: boolean; onChange: (m: boolean) => void }) => (
    <div
        role="checkbox"
        aria-checked={marcado}
        aria-label={item.nome}
        tabIndex={0}
        onClick={() => onChange(!marcado)}
        onKeyDown={(e) => {
            if (e.key !== " " && e.key !== "Enter") return;
            e.preventDefault();
            onChange(!marcado);
        }}
        className="flex min-h-[54px] cursor-pointer items-center gap-2 rounded-xl px-4 py-4 outline-none transition duration-100 ease-linear select-none hover:bg-secondary focus-visible:bg-secondary"
    >
        <CheckboxBase isSelected={marcado} />
        {item.tipo === "produto" && <img src={item.imagem} alt="" className="size-8 shrink-0 rounded-md bg-primary object-cover ring-1 ring-border-primary" />}
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-secondary">{item.nome}</span>
            {item.tipo !== "produto" && <BadgeTipo>{item.categoria}</BadgeTipo>}
            {item.tipo === "produto" && <span className="text-sm text-tertiary">{item.descricao}</span>}
        </span>
        {item.tipo === "ingresso" && <span className="shrink-0 text-sm font-medium text-secondary">{item.lote}</span>}
        {item.tipo === "combo" && (
            <span className="shrink-0 text-sm text-tertiary">{item.componentes.map((c) => `${c.quantidade}x ${c.nome}`).join(" + ")}</span>
        )}
    </div>
);

/* --------------------------- Selecionar todos --------------------------- */

/** Fica antes das sessões; marca ou desmarca tudo o que está visível (aba + busca). */
const SelecionarTodos = ({
    marcado,
    parcial,
    total,
    rotulo,
    onChange,
}: {
    marcado: boolean;
    parcial: boolean;
    total: number;
    rotulo: string;
    onChange: () => void;
}) => (
    <div
        role="checkbox"
        aria-checked={parcial ? "mixed" : marcado}
        aria-label="Selecionar todos"
        tabIndex={0}
        onClick={onChange}
        onKeyDown={(e) => {
            if (e.key !== " " && e.key !== "Enter") return;
            e.preventDefault();
            onChange();
        }}
        className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary_alt px-4 py-3 ring-1 ring-border-secondary outline-none transition duration-100 ease-linear select-none ring-inset hover:bg-secondary focus-visible:bg-secondary"
    >
        <CheckboxBase isSelected={marcado} isIndeterminate={parcial} />
        <span className="flex-1 text-sm font-semibold text-secondary">Selecionar todos</span>
        <span className="shrink-0 text-sm text-tertiary">
            {total} {rotulo}
        </span>
    </div>
);

/* -------------------------------- Resumo -------------------------------- */

const Resumo = ({ selecionados, onRemover, onLimpar }: { selecionados: string[]; onRemover: (id: string) => void; onLimpar: () => void }) => {
    const itens = selecionados.map((id) => ITEM_POR_ID[id]).filter(Boolean);
    const ingressos = itens.filter((i): i is Ingresso => i.tipo === "ingresso");
    const produtos = itens.filter((i): i is Produto => i.tipo === "produto");
    const combos = itens.filter((i): i is Combo => i.tipo === "combo");

    return (
        <aside
            style={{ top: ALTURA_CABECALHO + 24, maxHeight: `calc(100vh - ${ALTURA_CABECALHO + 48}px)` }}
            className="sticky hidden w-[330px] shrink-0 flex-col overflow-hidden rounded-2xl border border-primary bg-primary lg:flex"
        >
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-secondary p-4">
                <h3 className="text-sm font-medium text-primary">Resumo</h3>
                {itens.length > 0 && (
                    <button
                        type="button"
                        onClick={onLimpar}
                        className="text-xs font-medium text-tertiary underline-offset-2 transition duration-100 ease-linear hover:text-secondary hover:underline"
                    >
                        Remover todos
                    </button>
                )}
            </header>

            {itens.length === 0 ? (
                <div className="flex min-h-[388px] flex-col items-center justify-center gap-4 bg-primary_alt px-4 pt-4 pb-[92px] text-center">
                    <IconeVazio />
                    <p className="max-w-[160px] text-sm font-medium text-primary">Você ainda não selecionou nenhum item</p>
                </div>
            ) : (
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-primary_alt p-4">
                    {ingressos.length > 0 && (
                        <BlocoResumo titulo="Ingressos">
                            {ingressos.map((i) => (
                                <CartaoResumo key={i.id} onRemover={() => onRemover(i.id)} nome={i.nome}>
                                    <span className="text-sm font-medium text-secondary">
                                        {i.grupo} - {i.categoria}
                                    </span>
                                    <span className="text-sm text-tertiary">{SESSAO_POR_ID[i.sessaoId]?.curto}</span>
                                </CartaoResumo>
                            ))}
                        </BlocoResumo>
                    )}
                    {produtos.length > 0 && (
                        <BlocoResumo titulo="Produtos">
                            {produtos.map((p) => (
                                <CartaoResumo key={p.id} onRemover={() => onRemover(p.id)} nome={p.nome} imagem={p.imagem}>
                                    <span className="text-sm text-tertiary">{p.descricao}</span>
                                </CartaoResumo>
                            ))}
                        </BlocoResumo>
                    )}
                    {combos.length > 0 && (
                        <BlocoResumo titulo="Combos">
                            {combos.map((c) => (
                                <CartaoResumo key={c.id} onRemover={() => onRemover(c.id)} nome={c.nome}>
                                    <span className="text-sm font-medium text-secondary">
                                        {c.grupo} - {c.categoria}
                                    </span>
                                    <span className="text-sm text-tertiary">{SESSAO_POR_ID[c.sessaoId]?.curto}</span>
                                    <div className="mt-1.5 flex flex-col gap-1.5 border-l border-secondary pl-2">
                                        {c.componentes.map((comp) => (
                                            <div key={comp.nome} className="flex gap-2">
                                                <span className="text-xs font-medium text-primary">{comp.quantidade}x</span>
                                                <span className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-primary">
                                                        {comp.nome} • {comp.categoria}
                                                    </span>
                                                    <span className="text-sm text-tertiary">{SESSAO_POR_ID[c.sessaoId]?.curto}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CartaoResumo>
                            ))}
                        </BlocoResumo>
                    )}
                </div>
            )}
        </aside>
    );
};

const BlocoResumo = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold text-secondary">{titulo}</h4>
        <div className="flex flex-col gap-4">{children}</div>
    </div>
);

const CartaoResumo = ({ nome, imagem, onRemover, children }: { nome: string; imagem?: string; onRemover: () => void; children: React.ReactNode }) => (
    <div className="flex items-start gap-2 rounded-xl bg-secondary p-3">
        {imagem && <img src={imagem} alt="" className="size-12 shrink-0 rounded-md bg-primary object-cover ring-1 ring-border-primary" />}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium text-primary">{nome}</span>
            {children}
        </div>
        <ButtonUtility size="xs" color="tertiary" icon={Trash01} tooltip="Remover" onClick={onRemover} />
    </div>
);

/** Ícone em destaque do resumo vazio, exportado do Figma. */
const IconeVazio = () => <img src={iconeResumoVazio} alt="" aria-hidden="true" className="size-14 shrink-0" />;
