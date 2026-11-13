import { useState } from "react";
import type { PessoaDoComissario } from "@/plataforma/comissarios";
import { cx } from "@/utils/cx";
import { FaixaDeMetricas, Metrica, Secao, TD, TH, moeda, numero, plural } from "../../comissarios/components/comuns";
import {
    CANAIS,
    CANAL_LABEL,
    canaisLigados,
    cortesiasEnviadas,
    geraComissao,
    limiteDoCanal,
    totais,
    type GrupoEquipe,
    type Totais,
    type VendaAtribuida,
} from "../data/equipe";
import type { PedidoDoGrupo } from "../data/pedidos";
import { ListaDePedidos } from "./lista-de-pedidos";

/**
 * Aba Pedidos do grupo com comissário (ECO-70 a ECO-74): métricas, venda por canal, por vendedor e
 * os pedidos de todos os canais do grupo.
 */
export function AbaVendas({
    vendas,
    pedidos,
    t,
    grupo,
    variosVendedores,
    pessoas = [],
    link,
    codigo,
}: {
    vendas: VendaAtribuida[];
    /** Pedidos de todos os canais do grupo (ECO-74). */
    pedidos: PedidoDoGrupo[];
    t: Totais;
    grupo: GrupoEquipe;
    variosVendedores: boolean;
    /** Pessoas do grupo-comissário, com o código de cada uma (ranking por vendedor, ECO-29). */
    pessoas?: PessoaDoComissario[];
    link: string;
    codigo: string;
}) {
    // "Por vendedor" filtra a lista de pedidos pela pessoa (ECO-29).
    const [filtroVendedor, setFiltroVendedor] = useState<string>("todos");
    // O filtro por vendedor lista todas as pessoas do grupo, com ou sem venda (ECO-29).
    const vendedores = pessoas.length > 0 ? pessoas.map((p) => p.nome) : [...new Set(pedidos.map((v) => v.vendedor))].sort((a, b) => a.localeCompare(b));
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

            {pessoas.length > 1 && (
                <Secao titulo="Por vendedor" descricao="Cada pessoa vende pelo próprio código; o do grupo é do responsável. A comissão é do grupo. Clique numa pessoa para ver só os pedidos dela.">
                    <div className="-mx-5 overflow-x-auto md:-mx-6">
                        <table className="w-full">
                            <thead className="bg-secondary">
                                <tr>
                                    <th className={TH}>Vendedor</th>
                                    <th className={TH}>Código</th>
                                    <th className={cx(TH, "text-right")}>Ingressos</th>
                                    <th className={cx(TH, "text-right")}>Vendido</th>
                                    <th className={cx(TH, "text-right")}>Comissão</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary">
                                {pessoas
                                    .map((p) => ({ p, t: totais(vendas.filter((v) => v.vendedor === p.nome), []) }))
                                    .sort((a, b) => b.t.receita - a.t.receita)
                                    .map(({ p, t: tp }, i) => (
                                        <tr
                                            key={p.email}
                                            onClick={() => setFiltroVendedor(filtroVendedor === p.nome ? "todos" : p.nome)}
                                            className={cx("cursor-pointer transition duration-100 ease-linear hover:bg-primary_hover", filtroVendedor === p.nome && "bg-active")}
                                        >
                                            <td className={TD}>
                                                <span className="flex items-center gap-2">
                                                    <span className="w-6 shrink-0 font-medium text-quaternary tabular-nums">{i + 1}º</span>
                                                    <span className="flex min-w-0 flex-col">
                                                        <span className="truncate font-medium text-primary">{p.nome}</span>
                                                        <span>{p.papel === "responsavel" ? "Responsável" : "Vendedor"}</span>
                                                    </span>
                                                </span>
                                            </td>
                                            <td className={cx(TD, "font-medium text-secondary")}>{p.codigo ?? "Sem código"}</td>
                                            <td className={cx(TD, "text-right tabular-nums")}>{numero(tp.vendidos)}</td>
                                            <td className={cx(TD, "text-right font-medium text-primary tabular-nums")}>{moeda(tp.receita)}</td>
                                            <td className={cx(TD, "text-right tabular-nums")}>{moeda(tp.comissao)}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </Secao>
            )}

            <ListaDePedidos pedidos={pedidos} vendedores={vendedores} comComissao filtroVendedor={filtroVendedor} onFiltroVendedor={setFiltroVendedor} />
        </>
    );
}
