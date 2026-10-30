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
    SEM_SESSAO,
    sessaoDoItem,
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
    [i.nome, i.tipo === "produto" ? i.descricao : i.grupo, i.tipo === "produto" ? "" : i.categoria, sessaoDoItem(i)?.rotulo].join(" ").toLowerCase();

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

    /*
     * Ingresso com lotes: marcar o ingresso guarda só o id dele (vale para todos os lotes);
     * marcar lotes avulsos guarda os ids dos lotes. Quando todos os lotes ficam marcados,
     * eles voltam a ser o ingresso inteiro.
     */
    const estado = (item: ItemCatalogo): Estado => {
        if (set.has(item.id)) return "todos";
        if (item.tipo !== "ingresso" || item.lotes.length < 2) return "nenhum";
        return item.lotes.some((l) => set.has(l.id)) ? "parcial" : "nenhum";
    };
    const semIngresso = (lista: string[], item: ItemCatalogo) => {
        const ids = new Set([item.id, ...(item.tipo === "ingresso" ? item.lotes.map((l) => l.id) : [])]);
        return lista.filter((id) => !ids.has(id));
    };
    // Parcial + clique completa a seleção (todos os lotes); marcado + clique desmarca tudo.
    const alternarItem = (item: ItemCatalogo) =>
        onChange(estado(item) === "todos" ? semIngresso(selecionados, item) : [...semIngresso(selecionados, item), item.id]);
    const alternarLote = (item: Ingresso, loteId: string) => {
        if (set.has(item.id)) return onChange([...semIngresso(selecionados, item), ...item.lotes.filter((l) => l.id !== loteId).map((l) => l.id)]);
        const proxima = set.has(loteId) ? selecionados.filter((id) => id !== loteId) : [...selecionados, loteId];
        const todos = item.lotes.every((l) => proxima.includes(l.id));
        onChange(todos ? [...semIngresso(proxima, item), item.id] : proxima);
    };

    // Grupo e sessão: marcados quando todos os itens estão; parcial quando só alguns.
    const estadoLista = (itens: ItemCatalogo[]): Estado => {
        const e = itens.map(estado);
        if (e.length && e.every((x) => x === "todos")) return "todos";
        return e.some((x) => x !== "nenhum") ? "parcial" : "nenhum";
    };
    const alternarLista = (itens: ItemCatalogo[]) => {
        const limpa = itens.reduce((lista, item) => semIngresso(lista, item), selecionados);
        onChange(estadoLista(itens) === "todos" ? limpa : [...limpa, ...itens.map((i) => i.id)]);
    };

    // O que está na tela: a aba atual, filtrada pela busca.
    const visiveis = useMemo(() => {
        const q = busca.trim().toLowerCase();
        return CATALOGO[aba].filter((i) => !q || textoBusca(i).includes(q));
    }, [aba, busca]);
    const sessoes = useMemo(() => agruparPorSessao(visiveis), [visiveis]);

    // "Selecionar todos" vale para o que está visível (aba + busca), sem mexer no resto da seleção.
    const estadoVisiveis = estadoLista(visiveis);

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
                            estado={estadoVisiveis}
                            total={visiveis.length}
                            rotulo={visiveis.length === 1 ? SINGULAR[aba] : ABAS.find((a) => a.id === aba)!.label.toLowerCase()}
                            onChange={() => alternarLista(visiveis)}
                        />
                        {sessoes.map(({ sessao, grupos }) =>
                            // Produto não tem sessão: lista simples, sem cabeçalho de data nem linha de grupo (o "Selecionar todos" já cobre).
                            sessao.id === SEM_SESSAO.id ? (
                                <CardSessao key={sessao.id}>
                                    {grupos
                                        .flatMap((g) => g.itens)
                                        .map((item) => (
                                            <LinhaItem key={item.id} nivel={0} item={item} estado={estado(item)} onChange={() => alternarItem(item)} />
                                        ))}
                                </CardSessao>
                            ) : (
                                <CardSessao key={sessao.id} rotulo={sessao.rotulo}>
                                    {grupos.map((grupo) => (
                                        <div key={grupo.nome} className="flex flex-col">
                                            {/* O grupo também se marca: vale para todos os itens dele */}
                                            <LinhaCheck
                                                nivel={0}
                                                destaque
                                                estado={estadoLista(grupo.itens)}
                                                rotulo={grupo.nome}
                                                onChange={() => alternarLista(grupo.itens)}
                                            />
                                            {grupo.itens.map((item) => (
                                                <div key={item.id} className="flex flex-col">
                                                    <LinhaItem item={item} estado={estado(item)} onChange={() => alternarItem(item)} />
                                                    {/* Lotes logo abaixo do ingresso, um nível para dentro */}
                                                    {item.tipo === "ingresso" &&
                                                        item.lotes.length > 1 &&
                                                        item.lotes.map((l) => (
                                                            <LinhaCheck
                                                                key={l.id}
                                                                nivel={2}
                                                                estado={set.has(item.id) || set.has(l.id) ? "todos" : "nenhum"}
                                                                rotulo={l.nome}
                                                                onChange={() => alternarLote(item, l.id)}
                                                            />
                                                        ))}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </CardSessao>
                            ),
                        )}
                    </>
                )}
            </section>

            <Resumo selecionados={selecionados} onRemover={(id) => alternar(id, false)} onLimpar={() => onChange([])} />
        </div>
    );
}

/* --------------------------------- Linhas ------------------------------- */

type Estado = "nenhum" | "parcial" | "todos";

/** Tecla espaço/Enter numa "linha-checkbox". */
const teclaMarca = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    fn();
};

/** Recuo de cada nível: grupo, item e lote. */
const RECUO = ["pl-4", "pl-11", "pl-[72px]"] as const;

/** Linha inteira clicável com checkbox de 3 estados. Base de todas as linhas da lista. */
const LinhaBase = ({
    nivel,
    estado,
    rotulo,
    onChange,
    children,
}: {
    nivel: 0 | 1 | 2;
    estado: Estado;
    rotulo: string;
    onChange: () => void;
    children: React.ReactNode;
}) => (
    <div
        role="checkbox"
        aria-checked={estado === "parcial" ? "mixed" : estado === "todos"}
        aria-label={rotulo}
        tabIndex={0}
        onClick={onChange}
        onKeyDown={teclaMarca(onChange)}
        className={cx(
            "flex min-h-[50px] cursor-pointer items-center gap-2 rounded-xl py-3 pr-4 outline-none transition duration-100 ease-linear select-none hover:bg-secondary focus-visible:bg-secondary",
            RECUO[nivel],
        )}
    >
        <CheckboxBase isSelected={estado === "todos"} isIndeterminate={estado === "parcial"} />
        {children}
    </div>
);

/** Linha só com texto: grupo e lote. */
const LinhaCheck = ({
    nivel,
    destaque,
    estado,
    rotulo,
    onChange,
}: {
    nivel: 0 | 1 | 2;
    destaque?: boolean;
    estado: Estado;
    rotulo: string;
    onChange: () => void;
}) => (
    <LinhaBase nivel={nivel} estado={estado} rotulo={rotulo} onChange={onChange}>
        <span className={cx("text-sm text-secondary", destaque ? "font-semibold text-primary" : "font-normal")}>{rotulo}</span>
    </LinhaBase>
);

/** Ingresso, produto ou combo, um nível abaixo do grupo. Os lotes vêm na linha de baixo, recuados. */
const LinhaItem = ({ item, estado, onChange, nivel = 1 }: { item: ItemCatalogo; estado: Estado; onChange: () => void; nivel?: 0 | 1 }) => (
    <LinhaBase nivel={nivel} estado={estado} rotulo={item.nome} onChange={onChange}>
        {item.tipo === "produto" && <img src={item.imagem} alt="" className="size-8 shrink-0 rounded-md bg-primary object-cover ring-1 ring-border-primary" />}
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-secondary">{item.nome}</span>
            {/* Tipo do item: ingressos são sempre "Ingresso"; combos mostram o que vem no pacote */}
            {item.tipo !== "produto" && <BadgeTipo>{item.tipo === "ingresso" ? "Ingresso" : item.categoria}</BadgeTipo>}
            {item.tipo === "produto" && <span className="text-sm text-tertiary">{item.descricao}</span>}
        </span>
        {/* Com um lote só não há escolha: o nome do lote fica na própria linha */}
        {item.tipo === "ingresso" && item.lotes.length === 1 && <span className="shrink-0 text-sm text-tertiary">{item.lotes[0].nome}</span>}
        {item.tipo === "combo" && (
            <span className="shrink-0 text-sm text-tertiary">{item.componentes.map((c) => `${c.quantidade}x ${c.nome}`).join(" + ")}</span>
        )}
    </LinhaBase>
);

/* --------------------------- Selecionar todos --------------------------- */

/** Fica antes das sessões; marca ou desmarca tudo o que está visível (aba + busca). */
const SelecionarTodos = ({ estado, total, rotulo, onChange }: { estado: Estado; total: number; rotulo: string; onChange: () => void }) => (
    <div
        role="checkbox"
        aria-checked={estado === "parcial" ? "mixed" : estado === "todos"}
        aria-label="Selecionar todos"
        tabIndex={0}
        onClick={onChange}
        onKeyDown={teclaMarca(onChange)}
        className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary_alt px-4 py-3 ring-1 ring-border-secondary outline-none transition duration-100 ease-linear select-none ring-inset hover:bg-secondary focus-visible:bg-secondary"
    >
        <CheckboxBase isSelected={estado === "todos"} isIndeterminate={estado === "parcial"} />
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
                                    <span className="text-sm font-medium text-secondary">{i.grupo}</span>
                                    <span className="text-sm text-tertiary">
                                        {i.lote ? `${i.lote} • ` : ""}
                                        {SESSAO_POR_ID[i.sessaoId]?.curto}
                                    </span>
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
                                    <div className="mt-1.5 flex flex-col gap-1.5 border-l border-secondary pl-2">
                                        {c.componentes.map((comp) => (
                                            <div key={comp.nome} className="flex gap-2">
                                                <span className="text-xs font-medium text-primary">{comp.quantidade}x</span>
                                                <span className="flex flex-col gap-1">
                                                    <span className="text-sm font-medium text-primary">
                                                        {comp.nome} • {comp.categoria}
                                                    </span>
                                                    {/* A sessão do combo vem dos ingressos dele; produto não tem sessão. */}
                                                    {comp.categoria !== "Produto" && (
                                                        <span className="text-sm text-tertiary">{SESSAO_POR_ID[c.sessaoId]?.curto}</span>
                                                    )}
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
