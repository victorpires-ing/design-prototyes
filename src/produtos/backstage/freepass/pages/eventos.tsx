import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { Calendar, ChevronRight, MarkerPin06, Ticket01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { TITULO_PAGINA } from "../../components/titulo-pagina";
import { CopiarLink, FaixaDeMetricas, Metrica } from "../components/comuns";
import { FUNCAO_INFO, useFuncoesDisponiveis, useVisualizacao, type Funcao } from "../data/funcoes";
import { USUARIO, abrirEventoNoPainel, useMinhasVendas, type Participacao } from "../data/minhas-vendas";
import { dataDoEvento, linkDeVenda, moeda, numero, plural } from "../utils/formato";

/* ------------------------------------------------------------------ */
/*  Listas de eventos do Freepass (FCO-01 a FCO-09, FCO-80 a FCO-89)   */
/*                                                                     */
/*  Sem `funcao`: Eventos, a visão por evento (como o Backstage): todo */
/*  evento em que a pessoa faz alguma coisa, e abrir leva ao menu do   */
/*  evento. Com `funcao`: a visão por funcionalidade, só os eventos    */
/*  dela, e abrir leva direto à tela.                                  */
/* ------------------------------------------------------------------ */

type Aba = "todos" | "vem-ai" | "ja-passou";

/** `/freepass`: abre o início da visualização escolhida na engrenagem (FCO-86). */
export function InicioFreepass() {
    const visao = useVisualizacao();
    const funcoes = useFuncoesDisponiveis();
    const { carregando } = useMinhasVendas();
    if (carregando) return null;
    if (visao === "funcionalidade" && funcoes[0]) return <Navigate to={FUNCAO_INFO[funcoes[0]].lista} replace />;
    return <Navigate to="/freepass/eventos" replace />;
}

export function EventosFreepass({ funcao }: { funcao?: Funcao }) {
    const { carregando, participacoes: todas } = useMinhasVendas();
    const [aba, setAba] = useState<Aba>("todos");
    const participacoes = funcao ? todas.filter((p) => p.funcoes.includes(funcao)) : todas;
    const vemAi = participacoes.filter((p) => !p.passou);
    const jaPassou = participacoes.filter((p) => p.passou).reverse();
    // Todos: os que vêm primeiro, depois os que já passaram (FCO-03).
    const todosEventos = [...vemAi, ...jaPassou];
    const daAba = aba === "vem-ai" ? vemAi : aba === "ja-passou" ? jaPassou : todosEventos;
    const organizacoes = new Set(participacoes.map((p) => p.organizacao)).size;
    const deOrganizadores = organizacoes > 1 ? `, de ${numero(organizacoes)} organizadores` : "";

    // O resumo em dinheiro só existe para quem vende pelo link (FCO-02, FCO-81).
    // Os números seguem a aba escolhida (FCO-07); o resumo continua na tela mesmo se a aba não tiver venda, para não pular.
    const vendemEmAlgum = participacoes.some((p) => p.funcoes.includes("vendas"));
    const vendem = daAba.filter((p) => p.funcoes.includes("vendas"));
    const mostrarResumo = (funcao === undefined || funcao === "vendas") && vendemEmAlgum;

    const titulo = funcao ? FUNCAO_INFO[funcao].titulo : "Eventos";
    const descricao = funcao
        ? `${FUNCAO_INFO[funcao].descricao.replace(/\.$/, "")}${deOrganizadores ? ` (${deOrganizadores.slice(2)})` : ""}.`
        : `Oi, ${USUARIO.primeiroNome}. Os eventos em que você tem acesso${deOrganizadores}. Abra um para ver o que pode fazer nele.`;

    return (
        <BackstageLayout activeProducer={funcao ?? "eventos"} showEventContext={false}>
            <div className="flex min-w-0 flex-1 flex-col gap-8">
                <header className="flex flex-col gap-1">
                    <h1 className={TITULO_PAGINA}>{titulo}</h1>
                    <p className="max-w-[65ch] text-md text-tertiary">{descricao}</p>
                </header>

                {carregando ? (
                    <div role="status" aria-label="Carregando eventos" className="flex flex-col gap-4">
                        <span aria-hidden="true" className="h-36 w-full animate-pulse rounded-xl bg-secondary motion-reduce:animate-none" />
                        <span aria-hidden="true" className="h-64 w-full animate-pulse rounded-xl bg-secondary motion-reduce:animate-none" />
                    </div>
                ) : participacoes.length === 0 ? (
                    <div className="flex justify-center py-16">
                        <EmptyState size="sm">
                            <EmptyState.Header>
                                <EmptyState.FeaturedIcon icon={Ticket01} color="gray" theme="modern" />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <EmptyState.Title>{funcao ? `Nenhum evento em ${FUNCAO_INFO[funcao].titulo}` : "Você ainda não tem acesso a nenhum evento"}</EmptyState.Title>
                                <EmptyState.Description>Quando um organizador liberar um evento para você, ele aparece aqui.</EmptyState.Description>
                            </EmptyState.Content>
                        </EmptyState>
                    </div>
                ) : (
                    <>
                        {mostrarResumo && <ResumoDeVendas vendem={vendem} responsavel={participacoes.some((p) => p.funcoes.includes("vendas") && p.papel === "responsavel")} />}

                        <Tabs selectedKey={aba} onSelectionChange={(k) => setAba(k as Aba)} className="gap-5">
                            <TabList type="underline" size="sm" aria-label="Seus eventos">
                                {/* Contagem como texto: o Tab do DS só desenha o badge quando o valor é verdadeiro, e o 0 saía solto ao lado do nome. */}
                                <Tab id="todos" badge={String(todosEventos.length)}>
                                    Todos
                                </Tab>
                                <Tab id="vem-ai" badge={String(vemAi.length)}>
                                    Vem aí
                                </Tab>
                                <Tab id="ja-passou" badge={String(jaPassou.length)}>
                                    Já passou
                                </Tab>
                            </TabList>
                            <TabPanel id="todos">
                                <GradeDeEventos lista={todosEventos} funcao={funcao} vazio="Nenhum evento ainda." />
                            </TabPanel>
                            <TabPanel id="vem-ai">
                                <GradeDeEventos lista={vemAi} funcao={funcao} vazio="Nenhum evento à venda agora. Quando um organizador liberar um evento, ele aparece aqui." />
                            </TabPanel>
                            <TabPanel id="ja-passou">
                                <GradeDeEventos lista={jaPassou} funcao={funcao} vazio="Nenhum evento passado ainda." />
                            </TabPanel>
                        </Tabs>
                    </>
                )}
            </div>
        </BackstageLayout>
    );
}

/** Quanto falta receber primeiro; depois vendido, comissão e cortesias (FCO-02). */
/** `responsavel` vem de todos os eventos, não da aba: o primeiro cartão não troca ao mudar de aba. */
function ResumoDeVendas({ vendem, responsavel }: { vendem: Participacao[]; responsavel: boolean }) {
    const somar = (f: (p: Participacao) => number) => vendem.reduce((s, p) => s + f(p), 0);
    const aReceber = somar((p) => p.t.aRepassar);
    const recebido = somar((p) => p.t.repassado);
    const comissao = somar((p) => p.t.comissao);
    const estornado = somar((p) => p.t.estornado);
    return (
        <section aria-label="Resumo das suas vendas">
            <FaixaDeMetricas>
                {responsavel ? (
                    <Metrica rotulo="A receber" valor={moeda(aReceber)} apoio={`${moeda(recebido)} já recebidos`}>
                        <Button color="link-color" size="sm" href="/freepass/recebimentos" iconTrailing={ChevronRight}>
                            Ver recebimentos
                        </Button>
                    </Metrica>
                ) : (
                    <Metrica rotulo="Comissão das suas vendas" valor={moeda(comissao)} apoio="O pagamento vai para o responsável do grupo" />
                )}
                <Metrica rotulo="Vendido" valor={moeda(somar((p) => p.t.receita))} apoio={plural(somar((p) => p.t.vendidos), "ingresso", "ingressos")} />
                <Metrica rotulo="Comissão gerada" valor={moeda(comissao)} apoio={estornado > 0 ? `${moeda(estornado)} estornados em cancelamentos` : "Só pedidos pagos contam"} />
                <Metrica rotulo="Cortesias enviadas" valor={numero(somar((p) => p.t.cortesias))} apoio="Não geram comissão" />
            </FaixaDeMetricas>
        </section>
    );
}

function GradeDeEventos({ lista, funcao, vazio }: { lista: Participacao[]; funcao?: Funcao; vazio: string }) {
    if (lista.length === 0) return <p className="rounded-xl bg-secondary px-6 py-12 text-center text-sm text-tertiary">{vazio}</p>;
    return (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((p) => (
                <li key={`${p.comissario.id}-${p.evento.id}`}>
                    <CartaoDoEvento p={p} funcao={funcao} />
                </li>
            ))}
        </ul>
    );
}

/**
 * Cartão do evento (FCO-04, FCO-82). O cartão todo abre: na visão por evento, a primeira
 * funcionalidade do evento (o menu do evento mostra as outras); na visão por funcionalidade, a tela
 * dela. Os números mudam com o que a pessoa faz ali. Copiar o link fica à mão, sem abrir.
 */
function CartaoDoEvento({ p, funcao }: { p: Participacao; funcao?: Funcao }) {
    const navigate = useNavigate();
    const destino = funcao ?? p.funcoes[0];
    const href = destino ? FUNCAO_INFO[destino].tela : null;
    const abrir = () => {
        if (!href) return;
        abrirEventoNoPainel(p.evento);
        navigate(href);
    };
    const foco: Funcao | null = funcao ?? (p.funcoes.includes("vendas") ? "vendas" : p.funcoes.includes("cortesia") ? "cortesia" : p.funcoes[0] ?? null);
    const podeCompartilhar = foco === "vendas" && p.vinculo.canais.includes("online") && !p.passou && !p.pausado;
    const cota = p.vinculo.cotaCortesia;

    return (
        <article
            onClick={abrir}
            className={cx(
                "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary transition duration-150 ease-linear",
                href ? "cursor-pointer hover:ring-brand" : "cursor-not-allowed",
                (p.passou || p.pausado) && "bg-secondary_subtle",
            )}
        >
            <div className="flex gap-4 p-4">
                {p.evento.capa ? (
                    <img src={p.evento.capa} alt="" className="h-24 w-[72px] shrink-0 rounded-lg object-cover" />
                ) : (
                    <span className="h-24 w-[72px] shrink-0 rounded-lg bg-tertiary" aria-hidden="true" />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-sm text-tertiary">{p.organizacao}</p>
                    <h2 className="line-clamp-2 text-md font-semibold text-primary">
                        {href ? (
                            <Link
                                to={href}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    abrirEventoNoPainel(p.evento);
                                }}
                                className="outline-focus-ring focus-visible:outline-2"
                            >
                                {p.evento.nome}
                            </Link>
                        ) : (
                            p.evento.nome
                        )}
                    </h2>
                    <span className="flex items-center gap-1.5 text-sm text-tertiary">
                        <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        {dataDoEvento(p.evento.data)}
                    </span>
                    {p.evento.local && (
                        <span className="flex items-center gap-1.5 text-sm text-tertiary">
                            <MarkerPin06 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                            <span className="truncate">{p.evento.local}</span>
                        </span>
                    )}
                </div>
            </div>

            {foco === "vendas" ? (
                <dl className="grid grid-cols-2 gap-3 border-t border-secondary px-4 py-3">
                    <Dado rotulo="Vendido" valor={moeda(p.t.receita)} />
                    <Dado rotulo={p.papel === "responsavel" ? "A receber" : "Comissão"} valor={moeda(p.papel === "responsavel" ? p.t.aRepassar : p.t.comissao)} />
                </dl>
            ) : foco === "cortesia" ? (
                <dl className="grid grid-cols-2 gap-3 border-t border-secondary px-4 py-3">
                    <Dado rotulo="Cortesias enviadas" valor={cota ? `${numero(p.t.cortesias)} de ${numero(cota)}` : numero(p.t.cortesias)} />
                    <Dado rotulo="Ainda pode enviar" valor={cota ? numero(Math.max(0, cota - p.t.cortesias)) : "Sem limite"} />
                </dl>
            ) : null}

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-secondary px-4 py-3">
                {p.pausado && p.funcoes.length === 0 ? (
                    <Badge size="sm" type="pill-color" color="gray">
                        Pausado pelo organizador
                    </Badge>
                ) : p.passou ? (
                    <span className="text-sm text-tertiary">Vendas encerradas</span>
                ) : funcao ? (
                    <span className="text-sm text-tertiary">{p.pausado ? "Pausado pelo organizador" : foco === "vendas" ? `Código ${p.codigo}` : "Abrir"}</span>
                ) : (
                    // Visão por evento: o que dá para fazer aqui, como rótulo (não abre nada sozinho).
                    <span className="flex flex-wrap gap-1.5">
                        {p.funcoes.map((f) => (
                            <Badge key={f} size="sm" type="pill-color" color="gray">
                                {FUNCAO_INFO[f].rotulo}
                            </Badge>
                        ))}
                    </span>
                )}
                {podeCompartilhar && (
                    <span onClick={(e) => e.stopPropagation()}>
                        <CopiarLink link={linkDeVenda(p.evento.slug, p.codigo)} />
                    </span>
                )}
            </div>
        </article>
    );
}

const Dado = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
    <div className="flex flex-col gap-0.5">
        <dt className="text-sm text-tertiary">{rotulo}</dt>
        <dd className="text-md font-semibold text-primary tabular-nums">{valor}</dd>
    </div>
);
