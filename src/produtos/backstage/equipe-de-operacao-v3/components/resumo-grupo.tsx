import { useMemo, type ReactNode } from "react";
import { Calendar, Edit01, Package, ShoppingBag01, Ticket01, User01, Users01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { agruparPorSessao, ITEM_POR_ID, SEM_SESSAO, sessaoDoItem, separarPorTipo, type ItemCatalogo } from "../data/catalogo-evento";
import { plural, ROTULO_ATUACAO, ROTULO_COTA, type Atuacao, type CotaGrupo } from "../data/equipe-v3-store";
import { GRUPO_MEMBROS_POR_ID } from "../data/membros";
import { LinhaOperador, operadoresDe, SecaoOperadores } from "./seletor-operadores";
import { TituloSecao } from "./ui-cotas";

interface Props {
    nome: string;
    atuacao?: Atuacao;
    gruposMembros: string[];
    emailsAvulsos: string[];
    itens: string[];
    cota: CotaGrupo;
    /** Volta para uma etapa (0 = Grupo, 1 = Itens, 2 = Cotas). */
    onEditar: (etapa: number) => void;
}

/**
 * Última etapa do fluxo: resume o que foi configurado (grupo, operadores, itens e cotas)
 * antes de salvar. Cada bloco tem "Editar", que volta para a etapa correspondente.
 */
export function ResumoGrupo({ nome, atuacao, gruposMembros, emailsAvulsos, itens, cota, onEditar }: Props) {
    const total = operadoresDe(gruposMembros, emailsAvulsos).length;
    const lista = useMemo(() => itens.map((id) => ITEM_POR_ID[id]).filter((i): i is ItemCatalogo => Boolean(i)), [itens]);
    const sessoes = useMemo(() => agruparPorSessao(lista), [lista]);
    const ordenados = sessoes.flatMap(({ grupos }) => grupos.flatMap((g) => g.itens));
    const somaPorItem = lista.reduce((soma, item) => soma + (cota.porItem[item.id] ?? 0), 0);

    return (
        <div className="flex w-full max-w-[800px] flex-col gap-6">
            <TituloSecao>Revise as configurações</TituloSecao>

            {/* Mesma ordem da etapa Grupo: onde atua, nome e quem faz parte. */}
            <CardResumo titulo="Grupo" onEditar={() => onEditar(0)}>
                <Destaques>
                    <Campo rotulo="Onde o grupo opera">{atuacao ? ROTULO_ATUACAO[atuacao] : "—"}</Campo>
                    <Campo rotulo="Nome do grupo">{nome.trim()}</Campo>
                </Destaques>

                {/* Operadores é um bloco à parte, com o título (e o total) em cima dos cards. */}
                <div className="-mx-5 mt-1 flex flex-col gap-3 border-t border-secondary px-5 pt-4">
                    <div className="flex flex-col gap-0.5">
                        <h4 className="text-sm font-semibold text-primary">Operadores</h4>
                        <p className="text-sm text-tertiary">{plural(total, "pessoa", "pessoas")}</p>
                    </div>
                    {/* Os mesmos cards da seleção, só para leitura. */}
                    {gruposMembros.map((id) => {
                        const g = GRUPO_MEMBROS_POR_ID[id];
                        if (!g) return null;
                        return (
                            <SecaoOperadores key={id} icone={Users01} titulo={g.nome} total={g.emails.length} unidade={["membro", "membros"]}>
                                {g.emails.map((email) => (
                                    <LinhaOperador key={email} email={email} />
                                ))}
                            </SecaoOperadores>
                        );
                    })}
                    {emailsAvulsos.length > 0 && (
                        <SecaoOperadores icone={User01} titulo="Adicionadas individualmente" total={emailsAvulsos.length} unidade={["pessoa", "pessoas"]}>
                            {emailsAvulsos.map((email) => (
                                <LinhaOperador key={email} email={email} />
                            ))}
                        </SecaoOperadores>
                    )}
                </div>
            </CardResumo>

            <CardResumo
                titulo="Itens"
                apoio={`${plural(lista.length, "item selecionado", "itens selecionados")} · ${plural(sessoes.filter((s) => s.sessao.id !== SEM_SESSAO.id).length, "sessão", "sessões")}`}
                onEditar={() => onEditar(1)}
            >
                {/* Separados por tipo, na ordem da seleção: ingressos, produtos e combos. */}
                <div className="flex flex-col gap-4">
                    {TIPOS.map(({ tipo, titulo }) => {
                        const doTipo = ordenados.filter((i) => i.tipo === tipo);
                        if (doTipo.length === 0) return null;
                        return (
                            <section key={tipo} className="-mx-5 flex flex-col gap-3 border-t border-secondary px-5 pt-4 first:border-t-0 first:pt-0">
                                <h4 className="text-sm font-semibold text-primary">
                                    {titulo} <span className="font-normal text-tertiary">· {doTipo.length}</span>
                                </h4>
                                <ul className="grid gap-3 sm:grid-cols-2">
                                    {doTipo.map((item) => (
                                        <CardItem key={item.id} item={item} />
                                    ))}
                                </ul>
                            </section>
                        );
                    })}
                </div>
            </CardResumo>

            <CardResumo titulo="Cotas" onEditar={() => onEditar(2)}>
                <Destaques>
                    <Campo rotulo="Tipo de cota">{ROTULO_COTA[cota.tipo]}</Campo>
                    {cota.tipo === "sem-limite" && <Campo rotulo="Limite">Estoque disponível de cada item</Campo>}
                    {cota.tipo === "compartilhada" && <Campo rotulo="Cota total do grupo">{plural(cota.total, "emissão", "emissões")}</Campo>}
                    {cota.tipo === "por-item" && <Campo rotulo="Total das cotas">{plural(somaPorItem, "emissão", "emissões")}</Campo>}
                </Destaques>
                {cota.tipo === "por-item" && (
                    // Cota de cada item, também separada por tipo: uma lista para ingressos, outra para produtos, outra para combos.
                    <div className="mt-1 flex flex-col gap-4">
                        {separarPorTipo(lista).map(({ tipo, titulo, itens: doTipo }) => (
                            <div key={tipo} className="flex flex-col gap-2">
                                <h4 className="text-sm font-semibold text-primary">
                                    {titulo} <span className="font-normal text-tertiary">· {doTipo.length}</span>
                                </h4>
                                <ul className="flex flex-col rounded-lg bg-primary_alt px-4 py-1 ring-1 ring-border-secondary ring-inset">
                                    {doTipo.map((item) => (
                                        <li key={item.id} className="flex min-h-11 items-center gap-2 border-t border-secondary py-2 text-sm first:border-t-0">
                                            <span className="min-w-0 truncate font-medium text-secondary">{item.nome}</span>
                                            {item.tipo === "ingresso" && item.lote && <span className="shrink-0 text-tertiary">{item.lote}</span>}
                                            <span className="ml-auto shrink-0 font-medium text-primary tabular-nums">{cota.porItem[item.id] ?? 0}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </CardResumo>
        </div>
    );
}

const CardResumo = ({ titulo, apoio, onEditar, children }: { titulo: string; apoio?: string; onEditar: () => void; children: ReactNode }) => (
    <section className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary ring-inset">
        {/* Cabeçalho em outro tom: deixa claro que Grupo, Itens e Cotas agrupam o que vem abaixo. */}
        <div className="flex items-center justify-between gap-3 rounded-t-xl border-b border-secondary bg-secondary px-5 py-4">
            <div className="flex flex-col gap-0.5">
                <h3 className="text-md font-semibold text-primary">{titulo}</h3>
                {apoio && <p className="text-sm text-tertiary">{apoio}</p>}
            </div>
            <Button size="sm" color="tertiary" iconLeading={Edit01} onClick={onEditar}>
                Editar
            </Button>
        </div>
        <div className="flex flex-col gap-3 p-5">{children}</div>
    </section>
);

/**
 * Informações complementares uma embaixo da outra, sem caixa, separadas por um divisor de ponta a ponta:
 * o mesmo padrão de "Operadores", título em cima e a resposta embaixo.
 */
const Destaques = ({ children }: { children: ReactNode }) => <dl className="flex flex-col gap-4">{children}</dl>;

const Campo = ({ rotulo, children }: { rotulo: string; children: ReactNode }) => (
    <div className="-mx-5 flex flex-col gap-0.5 border-t border-secondary px-5 pt-4 first:border-t-0 first:pt-0">
        <dt className="text-sm font-semibold text-primary">{rotulo}</dt>
        <dd className="text-sm text-tertiary">{children}</dd>
    </div>
);

const TIPOS = [
    { tipo: "ingresso", titulo: "Ingressos" },
    { tipo: "produto", titulo: "Produtos" },
    { tipo: "combo", titulo: "Combos" },
] as const;

const ICONE_ITEM = { ingresso: Ticket01, produto: ShoppingBag01, combo: Package } as const;

const CardItem = ({ item }: { item: ItemCatalogo }) => {
    const Icone = ICONE_ITEM[item.tipo];
    // Ingresso: grupo e lote; combo: grupo e categoria; produto: a descrição.
    const apoio =
        item.tipo === "produto"
            ? item.descricao
            : item.tipo === "ingresso"
              ? [item.grupo, item.lote].filter(Boolean).join(" · ")
              : `${item.grupo} · ${item.categoria}`;
    return (
        <li className="flex gap-3 rounded-lg bg-primary_alt p-4 ring-1 ring-border-secondary ring-inset">
            {/* Produto mostra a foto (como na seleção); ingresso e combo, o ícone do tipo. */}
            {item.tipo === "produto" ? (
                <img src={item.imagem} alt="" className="size-10 shrink-0 rounded-lg bg-primary object-cover ring-1 ring-border-primary" />
            ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary ring-1 ring-border-primary ring-inset">
                    <Icone className="size-5 text-fg-secondary" aria-hidden="true" />
                </span>
            )}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-primary">{item.nome}</span>
                <span className="truncate text-sm text-tertiary">{apoio}</span>
                {/* Combo: o que vem dentro, ingressos e produtos, com a quantidade. */}
                {item.tipo === "combo" && (
                    <ul className="mt-2 flex flex-col gap-2 border-l border-secondary pl-3">
                        {item.componentes.map((c) => {
                            const ehProduto = c.categoria === "Produto";
                            const IconeComp = ehProduto ? ShoppingBag01 : Ticket01;
                            return (
                                <li key={`${c.nome}-${c.categoria}`} className="flex flex-col gap-0.5">
                                    <span className="flex items-center gap-1.5 text-sm text-secondary">
                                        <IconeComp className="size-3.5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                        <span className="shrink-0 font-medium text-primary tabular-nums">{c.quantidade}x</span>
                                        <span className="min-w-0 truncate">{ehProduto ? c.nome : `${c.nome} - ${c.categoria}`}</span>
                                    </span>
                                    {/* A sessão do combo é a dos ingressos dele; produto não tem sessão. */}
                                    {!ehProduto && (
                                        <span className="flex items-center gap-1.5 pl-5 text-xs text-tertiary">
                                            <Calendar className="size-3.5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                            {sessaoDoItem(item)?.curto}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
                {/* Ingresso mostra a sessão aqui; no combo ela fica em cada ingresso, e produto não tem. */}
                {item.tipo === "ingresso" && (
                    <span className="flex items-center gap-1.5 pt-1.5 text-xs text-tertiary">
                        <Calendar className="size-3.5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        {sessaoDoItem(item)?.curto}
                    </span>
                )}
            </span>
        </li>
    );
};
