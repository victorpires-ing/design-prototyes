import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { SearchLg } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { useTodosOsEventos } from "../../components/escopo-dos-relatorios";
import { setEventoAtual, useEventoAtual } from "../../eventos/data/eventos";
import { BotaoMostrarMais, paraBusca, useMostrarMais } from "../../itens/components/escala";
import { ListaDaTabela } from "../../relatorios/components/TabelaLista";
import { FaixaDeMetricas, Metrica, TD, TH, moeda, numero, plural, textoComissao } from "../components/comuns";
import { totais, useComissariosDaOrganizacao, type Comissario, type Totais } from "../data/comissarios";

/* ------------------------------------------------------------------ */
/*  Relatório de Comissários (COM-110 a COM-115, ECO-26)               */
/*                                                                     */
/*  O antigo painel de Comissários da organização, sem cadastro: o     */
/*  comissário é um grupo de Equipe e Comissários com o canal          */
/*  Comissário. Soma os grupos-comissário dos eventos do escopo        */
/*  ("Todos os eventos" ou o evento escolhido no topo dos Relatórios). */
/* ------------------------------------------------------------------ */

type Ordem = "vendas" | "repassar" | "nome";

interface Linha {
    c: Comissario;
    eventoId: string;
    evento: string;
    t: Totais;
}

export function RelatorioComissarios() {
    const navigate = useNavigate();
    const todos = useTodosOsEventos();
    const eventoAtual = useEventoAtual();
    const { carregando, organizacao, comissarios, estado } = useComissariosDaOrganizacao();
    const [busca, setBusca] = useState("");
    const [ordem, setOrdem] = useState<Ordem>("vendas");

    const linhas = useMemo<Linha[]>(() => {
        const nomeDoEvento = (id: string) => organizacao?.eventos?.find((e) => e.id === id)?.nome ?? "Evento";
        return estado.vinculos
            .filter((v) => (todos || v.eventoId === eventoAtual.id) && comissarios.some((c) => c.id === v.comissarioId))
            .map((v) => {
                const c = comissarios.find((x) => x.id === v.comissarioId)!;
                return {
                    c,
                    eventoId: v.eventoId,
                    evento: nomeDoEvento(v.eventoId),
                    t: totais(
                        estado.vendas.filter((x) => x.comissarioId === c.id),
                        estado.repasses.filter((x) => x.comissarioId === c.id),
                    ),
                };
            });
    }, [estado, comissarios, organizacao, todos, eventoAtual.id]);

    const geral = useMemo(() => totais(linhas.flatMap((l) => estado.vendas.filter((x) => x.comissarioId === l.c.id)), linhas.flatMap((l) => estado.repasses.filter((x) => x.comissarioId === l.c.id))), [linhas, estado]);

    const termo = paraBusca(busca.trim());
    const ordenadas = useMemo(() => {
        const filtradas = termo ? linhas.filter((l) => paraBusca(`${l.c.nome} ${l.c.codigo} ${l.c.email} ${l.evento}`).includes(termo)) : linhas;
        const porOrdem = [...filtradas].sort((a, b) =>
            ordem === "nome" ? a.c.nome.localeCompare(b.c.nome) : ordem === "repassar" ? b.t.aRepassar - a.t.aRepassar : b.t.receita - a.t.receita,
        );
        // Desativados no fim (o grupo desativado é o comissário pausado).
        return [...porOrdem.filter((l) => l.c.ativo), ...porOrdem.filter((l) => !l.c.ativo)];
    }, [linhas, termo, ordem]);
    const { visiveis, restantes, mostrarMais } = useMostrarMais(ordenadas);
    const ranking = useMemo(() => new Map([...linhas].sort((a, b) => b.t.receita - a.t.receita).map((l, i) => [l.c.id, i + 1])), [linhas]);

    const abrir = (l: Linha) => {
        setEventoAtual(l.eventoId);
        navigate(`/backstage/evento/equipe/${l.c.id}?aba=vendas`);
    };

    return (
        <BackstageLayout activeSection="relatorios" activeItem="relatorio-comissarios">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <h1>Comissários</h1>
                {carregando ? (
                    <div role="status" aria-label="Carregando comissários" className="flex flex-col gap-3">
                        <span aria-hidden="true" className="h-24 w-full animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                        <span aria-hidden="true" className="h-64 w-full animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                    </div>
                ) : linhas.length === 0 ? (
                    <div className="rounded-2xl bg-primary px-6 py-16 text-center ring-1 ring-secondary">
                        <p className="text-md font-semibold text-primary">{todos ? "Nenhum comissário na organização" : "Nenhum comissário neste evento"}</p>
                        <p className="mt-1 text-sm text-tertiary">Um grupo vira comissário quando o canal Comissário é configurado em Equipe e Comissários, no menu do evento.</p>
                    </div>
                ) : (
                    <>
                        <FaixaDeMetricas>
                            <Metrica rotulo="Comissários ativos" valor={numero(linhas.filter((l) => l.c.ativo).length)} apoio={plural(linhas.length, "grupo-comissário", "grupos-comissário")} />
                            <Metrica rotulo="Vendido por comissários" valor={moeda(geral.receita)} apoio={plural(geral.vendidos, "ingresso", "ingressos")} />
                            <Metrica rotulo="Comissão gerada" valor={moeda(geral.comissao)} apoio={geral.estornado > 0 ? `${moeda(geral.estornado)} estornados em cancelamentos` : undefined} />
                            <Metrica rotulo="A repassar" valor={moeda(geral.aRepassar)} apoio={`${moeda(geral.repassado)} já repassados`} />
                        </FaixaDeMetricas>

                        <section className="flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary">
                            <div className="flex flex-col gap-3 border-b border-secondary px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
                                <div className="w-full md:max-w-xs">
                                    <Input icon={SearchLg} aria-label="Buscar comissário" placeholder="Nome, código, e-mail ou evento" value={busca} onChange={setBusca} />
                                </div>
                                <div className="flex flex-wrap gap-1" role="group" aria-label="Ordenar por">
                                    {(
                                        [
                                            ["vendas", "Mais vendas"],
                                            ["repassar", "A repassar"],
                                            ["nome", "Nome"],
                                        ] as const
                                    ).map(([id, rotulo]) => (
                                        <button
                                            key={id}
                                            type="button"
                                            aria-pressed={ordem === id}
                                            onClick={() => setOrdem(id)}
                                            className={cx(
                                                "rounded-md px-3 py-2 text-sm font-semibold transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-focus-ring",
                                                ordem === id ? "bg-active text-primary" : "text-tertiary hover:bg-primary_hover hover:text-secondary",
                                            )}
                                        >
                                            {rotulo}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {ordenadas.length === 0 ? (
                                <p className="p-6 text-center text-sm text-tertiary">Nenhum comissário com esse nome, código, e-mail ou evento.</p>
                            ) : (
                                <>
                                    <table className="hidden w-full md:table">
                                        <thead className="bg-secondary">
                                            <tr>
                                                <th className={TH}>Comissário</th>
                                                {todos && <th className={TH}>Evento</th>}
                                                <th className={cx(TH, "text-right")}>Vendido</th>
                                                <th className={cx(TH, "text-right")}>Comissão</th>
                                                <th className={cx(TH, "text-right")}>A repassar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-secondary">
                                            {visiveis.map((l) => (
                                                <tr key={l.c.id} onClick={() => abrir(l)} className="cursor-pointer transition duration-100 ease-linear hover:bg-primary_hover">
                                                    <td className={TD}>
                                                        <div className="flex items-start gap-2">
                                                            {ordem === "vendas" && l.c.ativo && <span className="w-6 shrink-0 font-medium text-quaternary tabular-nums">{ranking.get(l.c.id)}º</span>}
                                                            <div className="flex min-w-0 flex-col">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        abrir(l);
                                                                    }}
                                                                    className="truncate text-left font-medium text-primary outline-focus-ring hover:underline focus-visible:outline-2"
                                                                >
                                                                    {l.c.nome}
                                                                </button>
                                                                <span>
                                                                    {l.c.codigo}, {textoComissao(l.c.padrao)}
                                                                </span>
                                                            </div>
                                                            {!l.c.ativo && (
                                                                <Badge size="sm" type="pill-color" color="gray">
                                                                    Grupo inativo
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {todos && <td className={TD}>{l.evento}</td>}
                                                    <td className={cx(TD, "text-right tabular-nums")}>
                                                        <span className="block font-medium text-primary">{moeda(l.t.receita)}</span>
                                                        <span>{plural(l.t.vendidos, "ingresso", "ingressos")}</span>
                                                    </td>
                                                    <td className={cx(TD, "text-right tabular-nums")}>{moeda(l.t.comissao)}</td>
                                                    <td className={cx(TD, "text-right font-medium tabular-nums", l.t.aRepassar > 0 ? "text-primary" : "text-tertiary")}>{moeda(l.t.aRepassar)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <ListaDaTabela
                                        rotulo="Comissários"
                                        itens={visiveis}
                                        chave={(l) => l.c.id}
                                        titulo={(l) => l.c.nome}
                                        apoio={(l) => (todos ? l.evento : l.c.codigo)}
                                        destaque={(l) => (
                                            <>
                                                <span className="font-medium">{moeda(l.t.receita)}</span>
                                                <span className="text-tertiary">{moeda(l.t.aRepassar)} a repassar</span>
                                            </>
                                        )}
                                        onAbrir={abrir}
                                    />
                                    {restantes > 0 && (
                                        <div className="border-t border-secondary p-4">
                                            <BotaoMostrarMais restantes={restantes} onClick={mostrarMais} />
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </>
                )}
            </div>
        </BackstageLayout>
    );
}
