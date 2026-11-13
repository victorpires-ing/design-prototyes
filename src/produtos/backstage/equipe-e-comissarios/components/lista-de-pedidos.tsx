import { useMemo, useState } from "react";
import { SearchLg } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { TD, TH, dataHora, moeda, plural, textoComissao } from "../../comissarios/components/comuns";
import { BotaoMostrarMais, useMostrarMais } from "../../itens/components/escala";
import { DetalhesDaLinha, ListaDaTabela, useLinhaAberta } from "../../relatorios/components/TabelaLista";
import { CANAIS_GRUPO, ROTULO_CANAL, comissaoBruta, comissaoDaVenda, type CanalGrupo } from "../data/equipe";
import type { PedidoDoGrupo } from "../data/pedidos";

const COR_CANAL: Record<CanalGrupo, "brand" | "blue" | "indigo" | "gray"> = { link: "brand", pdv: "indigo", bilheteria: "blue", cortesia: "gray" };

const CanalDoPedido = ({ canal }: { canal: CanalGrupo }) => (
    <Badge size="sm" type="pill-color" color={COR_CANAL[canal]}>
        {ROTULO_CANAL[canal]}
    </Badge>
);

const valorDoPedido = (p: PedidoDoGrupo) => (p.canal === "cortesia" ? "Cortesia" : moeda(p.valor));

/** Comissão do pedido: só vendas atribuídas ao comissário geram (ECO-16). */
function textoDaComissao(p: PedidoDoGrupo) {
    if (!p.venda) return "Sem comissão";
    if (p.venda.status === "cancelada") return "Estornada";
    if (p.venda.canal === "cortesia") return "Sem comissão";
    return moeda(comissaoDaVenda(p.venda));
}

/**
 * Pedidos do grupo em todos os canais (ECO-74): Comissário, PDV, Bilheteria online e Cortesia,
 * com filtros por pedido (uuid, por trecho), canal e vendedor. A coluna Comissão só aparece em
 * grupo com comissário.
 */
export function ListaDePedidos({
    pedidos,
    vendedores,
    comComissao,
    filtroVendedor,
    onFiltroVendedor,
}: {
    pedidos: PedidoDoGrupo[];
    /** Pessoas do grupo, com ou sem pedido (ECO-29). */
    vendedores: string[];
    comComissao: boolean;
    /** Controlado de fora quando o ranking "Por vendedor" também filtra. */
    filtroVendedor?: string;
    onFiltroVendedor?: (v: string) => void;
}) {
    const [buscaPedido, setBuscaPedido] = useState("");
    const [filtroCanal, setFiltroCanal] = useState<string>("todos");
    const [vendedorLocal, setVendedorLocal] = useState("todos");
    const vendedor = filtroVendedor ?? vendedorLocal;
    const setVendedor = onFiltroVendedor ?? setVendedorLocal;
    const canaisComPedido = CANAIS_GRUPO.filter((c) => pedidos.some((p) => p.canal === c));
    const variosVendedores = vendedores.length > 1;

    const filtrados = useMemo(() => {
        const termo = buscaPedido.trim().toLowerCase();
        return pedidos.filter(
            (p) =>
                (!termo || p.pedido.toLowerCase().includes(termo)) &&
                (filtroCanal === "todos" || p.canal === filtroCanal) &&
                (vendedor === "todos" || p.vendedor === vendedor),
        );
    }, [pedidos, buscaPedido, filtroCanal, vendedor]);
    const filtrando = !!buscaPedido.trim() || filtroCanal !== "todos" || vendedor !== "todos";
    const { visiveis, restantes, mostrarMais } = useMostrarMais(filtrados);
    const { aberta, abrir, fechar } = useLinhaAberta<PedidoDoGrupo>();

    return (
        <>
            <section className="flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary">
                <div className="flex flex-col gap-4 border-b border-secondary px-4 py-4 md:px-5">
                    <h2 className="text-lg font-semibold text-primary">Pedidos</h2>
                    {pedidos.length > 0 && (
                        <div className="flex flex-col gap-3 md:flex-row md:items-end">
                            <div className="min-w-0 flex-1">
                                <Input icon={SearchLg} aria-label="Buscar pedido" placeholder="Buscar pelo número do pedido" value={buscaPedido} onChange={setBuscaPedido} />
                            </div>
                            {canaisComPedido.length > 1 && (
                                <div className="md:w-52">
                                    <Select
                                        aria-label="Canal"
                                        selectedKey={filtroCanal}
                                        onSelectionChange={(k) => k && setFiltroCanal(String(k))}
                                        items={[{ id: "todos", label: "Todos os canais" }, ...canaisComPedido.map((c) => ({ id: c, label: ROTULO_CANAL[c] }))]}
                                    >
                                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                    </Select>
                                </div>
                            )}
                            {variosVendedores && (
                                <div className="md:w-56">
                                    <Select
                                        aria-label="Vendedor"
                                        selectedKey={vendedor}
                                        onSelectionChange={(k) => k && setVendedor(String(k))}
                                        items={[{ id: "todos", label: "Todos os vendedores" }, ...vendedores.map((n) => ({ id: n, label: n }))]}
                                    >
                                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {pedidos.length === 0 ? (
                    <p className="p-6 text-sm text-tertiary">Nenhum pedido ainda. O que as pessoas do grupo venderem ou emitirem nos canais aparece aqui.</p>
                ) : filtrados.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 p-6 text-center">
                        <p className="text-sm text-tertiary">Nenhum pedido com esses filtros.</p>
                        <Button color="secondary" size="sm" onClick={() => (setBuscaPedido(""), setFiltroCanal("todos"), setVendedor("todos"))}>
                            Limpar filtros
                        </Button>
                    </div>
                ) : (
                    <>
                        <p className="px-4 pt-3 text-sm text-tertiary md:px-5">
                            {filtrando ? plural(filtrados.length, "pedido encontrado", "pedidos encontrados") : plural(pedidos.length, "pedido", "pedidos")}
                        </p>
                        <div className="hidden overflow-x-auto xl:block">
                            <table className="w-full">
                                <thead className="bg-secondary">
                                    <tr>
                                        <th className={TH}>Data</th>
                                        <th className={TH}>Pedido</th>
                                        <th className={TH}>Item</th>
                                        <th className={TH}>Canal</th>
                                        {variosVendedores && <th className={TH}>Vendedor</th>}
                                        <th className={cx(TH, "text-right")}>Valor</th>
                                        {comComissao && <th className={cx(TH, "text-right")}>Comissão</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary">
                                    {visiveis.map((p) => (
                                        <tr key={p.id} onClick={() => abrir(p)} className={cx("cursor-pointer transition duration-100 ease-linear hover:bg-primary_hover", p.status === "cancelado" && "text-quaternary")}>
                                            <td className={cx(TD, "whitespace-nowrap tabular-nums")}>{dataHora(p.data)}</td>
                                            <td className={TD}>
                                                <span className="block font-medium text-primary tabular-nums" title={p.pedido}>
                                                    #{p.pedido.slice(0, 8)}
                                                </span>
                                                <span>{p.comprador}</span>
                                            </td>
                                            <td className={TD}>
                                                <span className="block text-primary">
                                                    {p.quantidade}× {p.item}
                                                </span>
                                                <span>{p.detalhe}</span>
                                            </td>
                                            <td className={TD}>
                                                <CanalDoPedido canal={p.canal} />
                                            </td>
                                            {variosVendedores && <td className={TD}>{p.vendedor}</td>}
                                            <td className={cx(TD, "text-right tabular-nums")}>
                                                {p.status === "cancelado" ? (
                                                    <Badge size="sm" type="pill-color" color="error">
                                                        Cancelado
                                                    </Badge>
                                                ) : (
                                                    <span className="block text-primary">{valorDoPedido(p)}</span>
                                                )}
                                                {p.venda && p.venda.desconto > 0 && <span className="block">{moeda(p.venda.desconto * p.quantidade)} de desconto</span>}
                                                {p.venda && (p.venda.acrescimo ?? 0) > 0 && <span className="block">{moeda((p.venda.acrescimo ?? 0) * p.quantidade)} a mais</span>}
                                            </td>
                                            {comComissao && (
                                                <td className={cx(TD, "text-right tabular-nums")}>
                                                    <span className={cx(p.venda && p.venda.status !== "cancelada" && p.venda.canal !== "cortesia" && "font-medium text-primary")}>{textoDaComissao(p)}</span>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <ListaDaTabela
                            className="md:flex xl:hidden"
                            rotulo="Pedidos do grupo"
                            itens={visiveis}
                            chave={(p) => p.id}
                            titulo={(p) => `${p.quantidade}× ${p.item}`}
                            apoio={(p) => `${p.comprador}, ${ROTULO_CANAL[p.canal].toLowerCase()}`}
                            destaque={(p) =>
                                p.status === "cancelado" ? (
                                    <Badge size="sm" type="pill-color" color="error">
                                        Cancelado
                                    </Badge>
                                ) : (
                                    <>
                                        <span className="font-medium">{valorDoPedido(p)}</span>
                                        {comComissao && p.venda && p.venda.canal !== "cortesia" && <span className="text-tertiary">{textoDaComissao(p)} de comissão</span>}
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
                                { rotulo: "Item", valor: [`${aberta.quantidade}× ${aberta.item}`, aberta.detalhe].filter(Boolean).join(", ") },
                                { rotulo: "Canal", valor: ROTULO_CANAL[aberta.canal] },
                                { rotulo: "Vendedor", valor: aberta.vendedor },
                                ...(aberta.status === "cancelado" ? [{ rotulo: "Status", valor: "Cancelado" }] : []),
                            ],
                        },
                        {
                            titulo: "Valores",
                            campos: [
                                { rotulo: "Valor", valor: valorDoPedido(aberta) },
                                ...(aberta.venda && aberta.venda.desconto > 0 ? [{ rotulo: "Desconto do código", valor: moeda(aberta.venda.desconto * aberta.quantidade) }] : []),
                                ...(aberta.venda && (aberta.venda.acrescimo ?? 0) > 0 ? [{ rotulo: "Valor a mais (do comissário)", valor: moeda((aberta.venda.acrescimo ?? 0) * aberta.quantidade) }] : []),
                                ...(comComissao
                                    ? [
                                          {
                                              rotulo: "Comissão",
                                              valor: !aberta.venda
                                                  ? "Sem comissão neste canal"
                                                  : aberta.venda.status === "cancelada"
                                                    ? `Estornada: ${moeda(comissaoBruta(aberta.venda))} (pedido cancelado)`
                                                    : aberta.venda.canal === "cortesia"
                                                      ? "Cortesia não gera comissão"
                                                      : `${moeda(comissaoDaVenda(aberta.venda))} (${textoComissao({ tipo: aberta.venda.tipoAplicado, comissao: aberta.venda.comissaoAplicada })})`,
                                          },
                                      ]
                                    : []),
                            ],
                        },
                    ]}
                />
            )}
        </>
    );
}
