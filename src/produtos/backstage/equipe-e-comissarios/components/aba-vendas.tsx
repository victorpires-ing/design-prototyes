import { useMemo, useState } from "react";
import { SearchLg } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { CanalBadge, FaixaDeMetricas, Metrica, Secao, TD, TH, dataHora, moeda, numero, plural, textoComissao } from "../../comissarios/components/comuns";
import { BotaoMostrarMais, useMostrarMais } from "../../itens/components/escala";
import { DetalhesDaLinha, ListaDaTabela, useLinhaAberta } from "../../relatorios/components/TabelaLista";
import {
    CANAIS,
    CANAL_LABEL,
    canaisLigados,
    comissaoBruta,
    comissaoDaVenda,
    cortesiasEnviadas,
    geraComissao,
    limiteDoCanal,
    type GrupoEquipe,
    type Totais,
    type VendaAtribuida,
} from "../data/equipe";

/**
 * Aba Vendas do grupo com comissário (ECO-70 a ECO-73): métricas, venda por canal e os pedidos
 * atribuídos ao comissário neste evento.
 */
export function AbaVendas({
    vendas,
    t,
    grupo,
    variosVendedores,
    link,
    codigo,
}: {
    vendas: VendaAtribuida[];
    t: Totais;
    grupo: GrupoEquipe;
    variosVendedores: boolean;
    link: string;
    codigo: string;
}) {
    // Filtros dos pedidos (COM-53): pedido (uuid, por trecho), canal e vendedor.
    const [buscaPedido, setBuscaPedido] = useState("");
    const [filtroCanal, setFiltroCanal] = useState<string>("todos");
    const [filtroVendedor, setFiltroVendedor] = useState<string>("todos");
    const canaisComVenda = CANAIS.filter((c) => vendas.some((v) => v.canal === c));
    const vendedores = [...new Set(vendas.map((v) => v.vendedor))].sort((a, b) => a.localeCompare(b));
    const filtradas = useMemo(() => {
        const termo = buscaPedido.trim().toLowerCase();
        return vendas.filter(
            (v) =>
                (!termo || v.pedido.toLowerCase().includes(termo)) &&
                (filtroCanal === "todos" || v.canal === filtroCanal) &&
                (filtroVendedor === "todos" || v.vendedor === filtroVendedor),
        );
    }, [vendas, buscaPedido, filtroCanal, filtroVendedor]);
    const filtrando = !!buscaPedido.trim() || filtroCanal !== "todos" || filtroVendedor !== "todos";
    const { visiveis, restantes, mostrarMais } = useMostrarMais(filtradas);
    const { aberta, abrir, fechar } = useLinhaAberta<VendaAtribuida>();
    const cortesias = cortesiasEnviadas(vendas);
    // Canais do grupo que contam para o comissário: link, PDV e Bilheteria com comissão, e Cortesia.
    const ligados = canaisLigados(grupo);
    const ativos = new Set<string>([
        ...(ligados.includes("link") ? ["online"] : []),
        ...(ligados.some((c) => (c === "pdv" || c === "bilheteria") && geraComissao(grupo, c, grupo.canais[c])) ? ["bilheteria"] : []),
        ...(ligados.includes("cortesia") ? ["cortesia"] : []),
    ]);
    const temCortesia = ligados.includes("cortesia");
    const cota = temCortesia && grupo.canais.cortesia ? limiteDoCanal(grupo.canais.cortesia) : null;

    return (
        <>
            <FaixaDeMetricas>
                <Metrica rotulo="Vendido" valor={moeda(t.receita)} apoio={plural(t.vendidos, "ingresso", "ingressos")} />
                <Metrica
                    rotulo="Cortesias enviadas"
                    valor={temCortesia && cota ? `${numero(cortesias)} de ${numero(cota)}` : numero(cortesias)}
                    apoio={temCortesia ? (cota ? "Cota do canal Cortesia" : "Sem limite no canal Cortesia") : "Canal Cortesia desligado"}
                />
                <Metrica rotulo="Comissão gerada" valor={moeda(t.comissao)} apoio={t.cancelados > 0 ? `${plural(t.cancelados, "ingresso cancelado", "ingressos cancelados")}, ${moeda(t.estornado)} estornados` : undefined} />
                <Metrica rotulo="A repassar" valor={moeda(t.aRepassar)} apoio={`${moeda(t.repassado)} já repassados`} destaque={t.aRepassar > 0} />
            </FaixaDeMetricas>

            <Secao titulo="Venda por canal">
                <dl className="grid gap-4 sm:grid-cols-3">
                    {CANAIS.map((canal) => (
                        <div key={canal} className="flex flex-col gap-1">
                            <dt className="text-sm text-tertiary">{canal === "bilheteria" ? "PDV e bilheteria" : CANAL_LABEL[canal]}</dt>
                            <dd className="text-lg font-semibold text-primary tabular-nums">
                                {canal === "cortesia" ? plural(t.porCanal.cortesia.quantidade, "cortesia", "cortesias") : moeda(t.porCanal[canal].receita)}
                            </dd>
                            <dd className="text-sm text-tertiary">
                                {!ativos.has(canal)
                                    ? canal === "online" ? "Link desligado" : canal === "bilheteria" ? "Sem canal com comissão" : "Canal desligado"
                                    : canal === "online"
                                      ? `Link e cupom ${codigo}`
                                      : canal === "bilheteria"
                                        ? plural(t.porCanal.bilheteria.quantidade, "ingresso", "ingressos")
                                        : "Sem comissão"}
                            </dd>
                        </div>
                    ))}
                </dl>
                {ligados.includes("link") && (
                    <div className="flex flex-col gap-0.5 border-t border-secondary pt-5">
                        <p className="text-sm font-semibold text-primary">Link de venda</p>
                        <p className="text-sm break-all text-tertiary">{link}</p>
                    </div>
                )}
            </Secao>

            <section className="flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary">
                <div className="flex flex-col gap-4 border-b border-secondary px-4 py-4 md:px-5">
                    <h2 className="text-lg font-semibold text-primary">Pedidos</h2>
                    {vendas.length > 0 && (
                        <div className="flex flex-col gap-3 md:flex-row md:items-end">
                            <div className="min-w-0 flex-1">
                                <Input icon={SearchLg} aria-label="Buscar pedido" placeholder="Buscar pelo número do pedido" value={buscaPedido} onChange={setBuscaPedido} />
                            </div>
                            {canaisComVenda.length > 1 && (
                                <div className="md:w-48">
                                    <Select
                                        aria-label="Canal"
                                        selectedKey={filtroCanal}
                                        onSelectionChange={(k) => k && setFiltroCanal(String(k))}
                                        items={[{ id: "todos", label: "Todos os canais" }, ...canaisComVenda.map((c) => ({ id: c, label: CANAL_LABEL[c] }))]}
                                    >
                                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                    </Select>
                                </div>
                            )}
                            {vendedores.length > 1 && (
                                <div className="md:w-56">
                                    <Select
                                        aria-label="Vendedor"
                                        selectedKey={filtroVendedor}
                                        onSelectionChange={(k) => k && setFiltroVendedor(String(k))}
                                        items={[{ id: "todos", label: "Todos os vendedores" }, ...vendedores.map((n) => ({ id: n, label: n }))]}
                                    >
                                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {vendas.length === 0 ? (
                    <p className="p-6 text-sm text-tertiary">Nenhuma venda ainda. Quando alguém comprar pelo link ou cupom, o pedido aparece aqui.</p>
                ) : filtradas.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <p className="text-sm text-tertiary">Nenhum pedido com esses filtros.</p>
                        <Button color="secondary" size="sm" onClick={() => (setBuscaPedido(""), setFiltroCanal("todos"), setFiltroVendedor("todos"))}>
                            Limpar filtros
                        </Button>
                    </div>
                ) : (
                    <>
                        {filtrando && <p className="px-4 pt-3 text-sm text-tertiary md:px-5">{plural(filtradas.length, "pedido encontrado", "pedidos encontrados")}</p>}
                        <div className="hidden overflow-x-auto xl:block">
                            <table className="w-full">
                                <thead className="bg-secondary">
                                    <tr>
                                        <th className={TH}>Data</th>
                                        <th className={TH}>Pedido</th>
                                        <th className={TH}>Ingresso</th>
                                        <th className={TH}>Canal</th>
                                        {variosVendedores && <th className={TH}>Vendedor</th>}
                                        <th className={cx(TH, "text-right")}>Valor</th>
                                        <th className={cx(TH, "text-right")}>Comissão</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary">
                                    {visiveis.map((v) => (
                                        <tr key={v.id} className={cx(v.status === "cancelada" && "text-quaternary")}>
                                            <td className={cx(TD, "whitespace-nowrap tabular-nums")}>{dataHora(v.data)}</td>
                                            <td className={TD}>
                                                <span className="block font-medium text-primary tabular-nums" title={v.pedido}>
                                                    #{v.pedido.slice(0, 8)}
                                                </span>
                                                <span>{v.comprador}</span>
                                            </td>
                                            <td className={TD}>
                                                <span className="block text-primary">
                                                    {v.quantidade}× {v.ingresso}
                                                </span>
                                                <span>{v.setor}</span>
                                            </td>
                                            <td className={TD}>
                                                <CanalBadge canal={v.canal} />
                                            </td>
                                            {variosVendedores && <td className={TD}>{v.vendedor}</td>}
                                            <td className={cx(TD, "text-right tabular-nums")}>
                                                <span className="block text-primary">{v.canal === "cortesia" ? "Cortesia" : moeda(v.face * v.quantidade)}</span>
                                                {v.desconto > 0 && <span>{moeda(v.desconto * v.quantidade)} de desconto</span>}
                                                {(v.acrescimo ?? 0) > 0 && <span>{moeda((v.acrescimo ?? 0) * v.quantidade)} a mais</span>}
                                            </td>
                                            <td className={cx(TD, "text-right tabular-nums")}>
                                                {v.status === "cancelada" ? (
                                                    <Badge size="sm" type="pill-color" color="error">
                                                        Estornada
                                                    </Badge>
                                                ) : v.canal === "cortesia" ? (
                                                    "Sem comissão"
                                                ) : (
                                                    <span className="font-medium text-primary">{moeda(comissaoDaVenda(v))}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <ListaDaTabela
                            className="md:flex xl:hidden"
                            rotulo="Pedidos do comissário"
                            itens={visiveis}
                            chave={(v) => v.id}
                            titulo={(v) => `${v.quantidade}× ${v.ingresso}`}
                            apoio={(v) => `${v.comprador}, ${CANAL_LABEL[v.canal].toLowerCase()}`}
                            destaque={(v) =>
                                v.status === "cancelada" ? (
                                    <Badge size="sm" type="pill-color" color="error">
                                        Estornada
                                    </Badge>
                                ) : (
                                    <>
                                        <span className="font-medium">{v.canal === "cortesia" ? "Cortesia" : moeda(v.face * v.quantidade)}</span>
                                        {v.canal !== "cortesia" && <span className="text-tertiary">{moeda(comissaoDaVenda(v))} de comissão</span>}
                                    </>
                                )
                            }
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

            {aberta && (
                <DetalhesDaLinha
                    titulo={`Pedido #${aberta.pedido.slice(0, 8)}`}
                    subtitulo={dataHora(aberta.data)}
                    onFechar={fechar}
                    grupos={[
                        {
                            campos: [
                                { rotulo: "Número do pedido", valor: aberta.pedido },
                                { rotulo: "Comprador", valor: aberta.comprador },
                                { rotulo: "Ingresso", valor: `${aberta.quantidade}× ${aberta.ingresso}, ${aberta.setor}` },
                                { rotulo: "Canal", valor: CANAL_LABEL[aberta.canal] },
                                ...(variosVendedores ? [{ rotulo: "Vendedor", valor: aberta.vendedor }] : []),
                            ],
                        },
                        {
                            titulo: "Valores",
                            campos: [
                                { rotulo: "Valor", valor: aberta.canal === "cortesia" ? "Cortesia" : moeda(aberta.face * aberta.quantidade) },
                                ...(aberta.desconto > 0 ? [{ rotulo: "Desconto do código", valor: moeda(aberta.desconto * aberta.quantidade) }] : []),
                                ...((aberta.acrescimo ?? 0) > 0 ? [{ rotulo: "Valor a mais (do comissário)", valor: moeda((aberta.acrescimo ?? 0) * aberta.quantidade) }] : []),
                                {
                                    rotulo: "Comissão",
                                    valor:
                                        aberta.status === "cancelada"
                                            ? `Estornada: ${moeda(comissaoBruta(aberta))} (pedido cancelado)`
                                            : aberta.canal === "cortesia"
                                              ? "Cortesia não gera comissão"
                                              : `${moeda(comissaoDaVenda(aberta))} (${textoComissao({ tipo: aberta.tipoAplicado, comissao: aberta.comissaoAplicada })})`,
                                },
                            ],
                        },
                    ]}
                />
            )}
        </>
    );
}
