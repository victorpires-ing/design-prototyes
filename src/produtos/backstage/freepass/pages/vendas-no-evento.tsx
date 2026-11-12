import { useMemo, useState } from "react";
import { ChevronRight } from "@untitledui/icons";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { comissaoBruta, comissaoDaVenda, setoresDoEvento, type CanalComissario } from "@/plataforma/comissarios";
import { BackstageLayout } from "../../components/Backstage";
import { TITULO_PAGINA } from "../../components/titulo-pagina";
import { useEventoAtual } from "../../eventos/data/eventos";
import { CompartilharLink, CopiarLink, Metrica } from "../components/comuns";
import { nomeCurto, useAcessoNoEvento, useMinhasVendas } from "../data/minhas-vendas";
import { CANAL_CURTO, dataHora, ganhoPorIngresso, precoComCodigo, linkDeVenda, moeda, numero, plural, textoComissao } from "../utils/formato";

/* ------------------------------------------------------------------ */
/*  Minhas vendas no evento em contexto, no Freepass (FCO-10 a FCO-29) */
/*                                                                     */
/*  O link para divulgar no topo, quanto ele ganha em cada ingresso e  */
/*  as vendas, pedido a pedido. Quem comprou aparece com nome curto.   */
/* ------------------------------------------------------------------ */

type Filtro = "todas" | CanalComissario;

const PASSO = 15;

export function VendasNoEvento() {
    const eventoId = useEventoAtual().id;
    const { carregando, participacoes } = useMinhasVendas();
    // Cota de cortesia vem do grupo de operação (ou da seed, sem grupo): a mesma que limita o envio (COR-94).
    const acesso = useAcessoNoEvento(eventoId);
    const p = participacoes.find((x) => x.evento.id === eventoId);
    const [filtro, setFiltro] = useState<Filtro>("todas");
    const [mostrar, setMostrar] = useState(PASSO);

    const setores = useMemo(() => (p ? setoresDoEvento(p.evento) : []), [p]);
    const ingressos = useMemo(() => setores.flatMap((s) => s.ingressos).filter((i) => !p?.vinculo.ingressos || p.vinculo.ingressos.includes(i.id)), [setores, p]);
    const vendasFiltradas = useMemo(() => (p ? (filtro === "todas" ? p.vendas : p.vendas.filter((v) => v.canal === filtro)) : []), [p, filtro]);

    if (carregando || !p)
        return (
            <BackstageLayout activeSection="comissarios" activeItem="minhas-vendas-evento">
                <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
                    {carregando ? (
                        <span role="status" aria-label="Carregando evento" className="h-64 w-full animate-pulse rounded-xl bg-secondary motion-reduce:animate-none" />
                    ) : (
                        <div className="flex flex-col gap-2">
                            <h1 className="text-lg font-semibold text-primary">Você não vende este evento</h1>
                            <p className="text-sm text-tertiary">O organizador pode ter tirado você dele. Seus outros eventos estão em Eventos.</p>
                            <Button color="secondary" size="md" href="/freepass/eventos" className="mt-2 self-start">
                                Ver meus eventos
                            </Button>
                        </div>
                    )}
                </div>
            </BackstageLayout>
        );

    const link = linkDeVenda(p.evento.slug, p.comissario.codigo);
    const vendeOnline = p.vinculo.canais.includes("online");
    const responsavel = p.papel === "responsavel";
    const canais = (["online", "bilheteria", "cortesia"] as CanalComissario[]).filter((c) => p.vinculo.canais.includes(c) || p.vendas.some((v) => v.canal === c));
    const cortesias = p.t.cortesias;

    return (
        <BackstageLayout activeSection="comissarios" activeItem="minhas-vendas-evento">
            <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
                <header className="flex flex-col gap-1">
                    <h1 className={TITULO_PAGINA}>Minhas vendas</h1>
                    <p className="text-md text-tertiary">
                        {p.organizacao}
                        {p.comissario.pessoas.length > 1 ? `, por ${p.comissario.nome}` : `, código ${p.comissario.codigo}`}
                    </p>
                </header>

                {/* O que ele mais faz: divulgar. */}
                {p.pausado ? (
                    <section className="flex flex-col gap-1 rounded-2xl bg-secondary p-5">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-primary">Vendas pausadas</h2>
                            <Badge size="sm" type="pill-color" color="gray">
                                Pausado pelo organizador
                            </Badge>
                        </div>
                        <p className="max-w-[65ch] text-sm text-tertiary">
                            {p.organizacao} pausou suas vendas neste evento. Agora o seu link e o cupom não contam vendas para você. O que você já vendeu continua aqui. Dúvidas, fale com o organizador.
                        </p>
                    </section>
                ) : p.passou ? (
                    <section className="flex flex-col gap-1 rounded-2xl bg-secondary p-5">
                        <h2 className="text-lg font-semibold text-primary">Vendas encerradas</h2>
                        <p className="text-sm text-tertiary">O evento já aconteceu. Confira abaixo o que você vendeu{responsavel ? " e o que falta receber" : ""}.</p>
                    </section>
                ) : vendeOnline ? (
                    <section className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary md:p-6">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-lg font-semibold text-primary">Seu link de venda</h2>
                            <p className="text-sm text-tertiary">
                                Quem comprar por ele conta para você.
                                {p.cond.tipo === "acrescimo"
                                    ? ` O ingresso sai ${moeda(p.cond.comissao)} mais caro por ele, e essa diferença é sua.`
                                    : p.cond.desconto
                                      ? ` E ganha ${String(p.cond.desconto).replace(".", ",")}% de desconto.`
                                      : ""}
                            </p>
                        </div>
                        <p className="rounded-lg bg-secondary px-3 py-2.5 font-mono text-sm break-all text-primary">{link}</p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <CompartilharLink link={link} texto={`Ingressos para ${p.evento.nome}`} className="w-full sm:w-auto" />
                            <CopiarLink link={link} size="md" className="w-full sm:w-auto" />
                        </div>
                        <p className="border-t border-secondary pt-4 text-sm text-tertiary">
                            Sem o link, a pessoa pode digitar o cupom <span className="font-semibold text-primary">{p.comissario.codigo}</span> no pagamento. Se ela abrir o link de outro comissário depois do seu, a compra conta para o último.
                        </p>
                    </section>
                ) : (
                    <section className="flex flex-col gap-1 rounded-2xl bg-secondary p-5">
                        <h2 className="text-lg font-semibold text-primary">Sem link neste evento</h2>
                        <p className="text-sm text-tertiary">Aqui você vende {p.vinculo.canais.map((c) => CANAL_CURTO[c].toLowerCase()).join(" e ")}. As vendas aparecem abaixo.</p>
                    </section>
                )}

                <section aria-label="Seu resultado neste evento" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {responsavel ? (
                        <Metrica rotulo="A receber" valor={moeda(p.t.aRepassar)} apoio={`${moeda(p.t.repassado)} já recebidos`} />
                    ) : (
                        <Metrica rotulo="Sua comissão" valor={moeda(p.t.comissao)} apoio="Paga ao responsável" />
                    )}
                    <Metrica rotulo="Vendido" valor={moeda(p.t.receita)} apoio={plural(p.t.vendidos, "ingresso", "ingressos")} />
                    <Metrica rotulo="Comissão gerada" valor={moeda(p.t.comissao)} apoio={p.t.estornado > 0 ? `${moeda(p.t.estornado)} estornados` : undefined} />
                    <Metrica
                        rotulo="Cortesias"
                        valor={acesso?.funcoes.includes("cortesia") && acesso.saldoCortesias !== null ? `${numero(cortesias)} de ${numero(cortesias + acesso.saldoCortesias)}` : numero(cortesias)}
                        apoio={acesso?.funcoes.includes("cortesia") ? (acesso.saldoCortesias !== null ? "Sua cota" : "Sem limite") : "Não envia aqui"}
                    >
                        {/* Atalho para o mesmo envio de cortesias do Backstage (FCO-17). */}
                        {p.funcoes.includes("cortesia") && !p.passou && (
                            <Button color="link-color" size="sm" href="/freepass/cortesias" iconTrailing={ChevronRight} className="mt-1 self-start">
                                Enviar cortesias
                            </Button>
                        )}
                    </Metrica>
                </section>

                <section className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary md:p-6">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-lg font-semibold text-primary">Quanto você ganha</h2>
                        <p className="text-sm text-tertiary">
                            {textoComissao(p.cond)}
                            {p.cond.tipo === "percentual" ? ", sobre o valor pago sem a taxa" : p.cond.tipo === "acrescimo" ? ", que você cobra além do preço do ingresso" : ""}. Cortesia não gera comissão, e pedido cancelado é estornado.
                        </p>
                    </div>
                    {ingressos.length === 0 ? (
                        <p className="text-sm text-tertiary">Nenhum ingresso liberado para você neste evento.</p>
                    ) : (
                        <ul className="flex flex-col divide-y divide-secondary">
                            {ingressos.map((i) => (
                                <li key={i.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="truncate text-sm font-medium text-primary">{i.nome}</span>
                                        <span className="truncate text-sm text-tertiary">
                                            {i.setor}, {p.cond.desconto || p.cond.tipo === "acrescimo" ? `${moeda(precoComCodigo(i.preco, p.cond))} com seu código` : moeda(i.preco)}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-right text-sm tabular-nums">
                                        <span className="block font-semibold text-primary">{moeda(ganhoPorIngresso(i.preco, p.cond))}</span>
                                        <span className="text-tertiary">por ingresso</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary">
                    <div className="flex flex-col gap-3 border-b border-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                        <h2 className="text-lg font-semibold text-primary">{responsavel && p.comissario.pessoas.length > 1 ? `Vendas de ${p.comissario.nome}` : "Suas vendas"}</h2>
                        {canais.length > 1 && (
                            <Tabs selectedKey={filtro} onSelectionChange={(k) => (setFiltro(k as Filtro), setMostrar(PASSO))} className="w-auto">
                                <TabList
                                    type="button-minimal"
                                    size="sm"
                                    aria-label="Filtrar por canal"
                                    items={[{ id: "todas", label: "Todas" }, ...canais.map((c) => ({ id: c, label: CANAL_CURTO[c] }))]}
                                />
                            </Tabs>
                        )}
                    </div>
                    {vendasFiltradas.length === 0 ? (
                        <p className="px-4 py-10 text-center text-sm text-tertiary md:px-6">
                            {p.vendas.length === 0 ? "Nenhuma venda ainda. Compartilhe seu link para começar." : "Nenhuma venda neste canal."}
                        </p>
                    ) : (
                        <ul className="flex flex-col divide-y divide-secondary">
                            {vendasFiltradas.slice(0, mostrar).map((v) => (
                                <li key={v.id} className="flex items-center gap-3 px-4 py-3 md:px-6">
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="truncate text-sm font-medium text-primary">
                                            {v.quantidade}× {[v.ingresso, v.setor].filter(Boolean).join(", ")}
                                        </span>
                                        <span className="truncate text-sm text-tertiary">
                                            {nomeCurto(v.comprador)}, {CANAL_CURTO[v.canal].toLowerCase()}, {dataHora(v.data)}
                                            {responsavel && p.comissario.pessoas.length > 1 ? `, por ${v.vendedor}` : ""}
                                        </span>
                                    </span>
                                    <span className="flex shrink-0 flex-col items-end gap-0.5 text-right text-sm tabular-nums">
                                        {v.status === "cancelada" ? (
                                            <>
                                                <Badge size="sm" type="pill-color" color="error">
                                                    Cancelado
                                                </Badge>
                                                <span className="text-tertiary">{moeda(comissaoBruta(v))} estornados</span>
                                            </>
                                        ) : v.canal === "cortesia" ? (
                                            <span className="text-tertiary">Cortesia</span>
                                        ) : (
                                            <>
                                                <span className="font-semibold text-success-primary">+{moeda(comissaoDaVenda(v))}</span>
                                                <span className="text-tertiary">de {moeda(v.face * v.quantidade)}</span>
                                            </>
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {vendasFiltradas.length > mostrar && (
                        <div className="border-t border-secondary p-4">
                            <Button color="secondary" size="md" className="w-full" onClick={() => setMostrar((m) => m + PASSO)}>
                                Mostrar mais {Math.min(PASSO, vendasFiltradas.length - mostrar)}
                            </Button>
                        </div>
                    )}
                </section>
            </div>
        </BackstageLayout>
    );
}
