import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Calendar, Check, ChevronDown, Copy01, DotsHorizontal } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Tabs } from "@/components/application/tabs/tabs";
import { useClipboard } from "@/hooks/use-clipboard";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { CartaoOperacao } from "../components/CartaoOperacao";
import { FaixaRascunhos } from "../components/FaixaRascunhos";
import { FOCO, FOCO_ESCOPO, Miniatura, TextoAnimado, iniciaisDe } from "../components/pos-compra-ui";
import { TrocarItensWizard } from "../components/wizard/TrocarItensWizard";
import { TransferirTitularidadeWizard } from "../components/wizard/TransferirTitularidadeWizard";
import {
    SESSOES,
    formatarMoeda,
    getConta,
    getEvento,
    getFormulario,
    getItem,
    linhaEncerrada,
    pedidoEncerrado,
    pendenciaDaLinha,
    retomarPedido,
    solicitacaoDaLinha,
    totaisDoPedido,
    usePedidos,
    type CatalogoItem,
    type EntradaHistorico,
    type Pedido,
    type PedidoItem,
    type Rascunho,
    type Sessao,
    type TipoOperacao,
} from "../data/pos-compra-store";

type EstadoLinha = "livre" | "trocando" | "transferindo" | "editando" | "transferida" | "encerrada";

const ESTADO_POR_OPERACAO: Record<TipoOperacao, EstadoLinha> = {
    "troca-item": "trocando",
    "troca-titularidade": "transferindo",
    "alterar-respostas": "editando",
};

const estadoDaLinha = (pedido: Pedido, linha: PedidoItem): EstadoLinha => {
    if (linha.titularId) return "transferida";
    const solicitacao = solicitacaoDaLinha(pedido, linha.id);
    if (solicitacao) return ESTADO_POR_OPERACAO[solicitacao.tipo];
    if (linhaEncerrada(linha)) return "encerrada";
    return "livre";
};

/** Só o que está livre entra em uma nova operação; o resto fica visível como registro. */
const selecionavel = (pedido: Pedido, linha: PedidoItem) => !linha.titularId && !solicitacaoDaLinha(pedido, linha.id);

const ROTULO_ESTADO: Record<EstadoLinha, string> = {
    livre: "Ativo",
    trocando: "Em troca",
    transferindo: "Em transferência",
    editando: "Formulário em edição",
    transferida: "Transferido",
    encerrada: "Sessão realizada",
};

const mascararCPF = (cpf: string) => {
    const d = cpf.replace(/\D/g, "");
    return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : cpf;
};

const tituloDaSessao = (sessao: Sessao) => `${sessao.dataLabel}, ${sessao.horaLabel.replace(":", "h")}`;
const rotuloDoLote = (lote: string) => (lote.toLowerCase().startsWith("lote") ? lote : `Lote ${lote}`);
const plural = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

interface ItemDoPedido {
    item: CatalogoItem;
    linhas: PedidoItem[];
}

const interromper = (event: MouseEvent) => event.stopPropagation();

type Aba = "itens" | "operacoes" | "historico";

interface WizardAberto {
    tipo: "troca-item" | "troca-titularidade";
    linhas: string[];
    rascunho?: Rascunho;
}

export function DetalhePedido() {
    const { pedidoId } = useParams();
    const navigate = useNavigate();
    const pedidos = usePedidos();
    const pedido = pedidos.find((p) => p.id === pedidoId);
    const [aba, setAba] = useState<Aba>(() => (pedido && pedido.solicitacoes.length > 0 ? "operacoes" : "itens"));
    const [selecao, setSelecao] = useState<Record<string, boolean>>({});
    const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
    const [wizardAberto, setWizardAberto] = useState<WizardAberto | null>(null);
    const { copied, copy } = useClipboard();

    /* Sessão > item > unidades, na mesma hierarquia da bilheteria e da etapa de troca. */
    const estrutura = useMemo(() => {
        if (!pedido) return { sessoes: [], produtos: [], combos: [] };
        const porItem = new Map<string, ItemDoPedido>();
        pedido.itens.forEach((linha) => {
            const item = getItem(linha.itemId);
            if (!item) return;
            const grupo = porItem.get(item.id) ?? { item, linhas: [] };
            grupo.linhas.push(linha);
            porItem.set(item.id, grupo);
        });
        const todos = [...porItem.values()];
        const sessoes = SESSOES.filter((s) => s.eventoId === pedido.eventoId)
            .sort((a, b) => a.inicio - b.inicio)
            .map((sessao) => ({ sessao, itens: todos.filter((g) => g.item.tipo === "ingresso" && g.item.sessaoId === sessao.id) }))
            .filter((s) => s.itens.length > 0);
        return { sessoes, produtos: todos.filter((g) => g.item.tipo === "produto"), combos: todos.filter((g) => g.item.tipo === "combo") };
    }, [pedido]);

    const idsSelecionaveis = useMemo(() => (pedido ? pedido.itens.filter((l) => selecionavel(pedido, l)).map((l) => l.id) : []), [pedido]);

    if (!pedido) {
        return (
            <BackstageLayout showEventContext={false} activeProducer="pedidos">
                <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
                    <p className="text-sm text-tertiary">Pedido não encontrado.</p>
                    <Button size="md" color="secondary" iconLeading={ArrowLeft} onClick={() => navigate("/backstage/pedidos")}>
                        Voltar para pedidos
                    </Button>
                </div>
            </BackstageLayout>
        );
    }

    const evento = getEvento(pedido.eventoId);
    const comprador = getConta(pedido.compradorId);
    const totais = totaisDoPedido(pedido);
    const encerrado = pedidoEncerrado(pedido);

    const idsSelecionados = idsSelecionaveis.filter((id) => selecao[id]);
    const nSelecionados = idsSelecionados.length;
    const todosSelecionados = nSelecionados > 0 && nSelecionados === idsSelecionaveis.length;
    const algunsSelecionados = nSelecionados > 0 && !todosSelecionados;
    const indisponiveis = pedido.itens.length - idsSelecionaveis.length;

    const alternar = (ids: string[], marcar: boolean) =>
        setSelecao((atual) => {
            const proximo = { ...atual };
            ids.forEach((id) => {
                proximo[id] = marcar;
            });
            return proximo;
        });

    /* "Falha" agora vive na própria Solicitação, nunca em baseStatus — abrir uma operação numa
       linha qualquer não apaga mais silenciosamente um incidente financeiro em outra linha. Só
       "expirado" ainda precisa desse destravamento manual. */
    const retomarSePreciso = () => {
        if (pedido.status === "expirado") retomarPedido(pedido.id);
    };

    const fecharWizard = () => {
        setWizardAberto(null);
        setAba("operacoes");
    };

    const abrirTroca = (ids: string[]) => {
        retomarSePreciso();
        setSelecao({});
        setWizardAberto({ tipo: "troca-item", linhas: ids });
    };

    const irParaTransferir = (ids: string[]) => {
        retomarSePreciso();
        setSelecao({});
        setWizardAberto({ tipo: "troca-titularidade", linhas: ids });
    };

    const abrirFormulario = (linhaId: string) => {
        retomarSePreciso();
        navigate(`/backstage/pedidos/${pedido.id}/formulario`, { state: { linha: linhaId } });
    };

    const continuarRascunho = (rascunho: Rascunho) => setWizardAberto({ tipo: rascunho.tipo, linhas: rascunho.linhasSelecionadas, rascunho });

    const cartao = ({ item, linhas }: ItemDoPedido) => (
        <CartaoItem
            key={item.id}
            pedido={pedido}
            item={item}
            linhas={linhas}
            selecao={selecao}
            encerrado={encerrado}
            expandido={expandidos[item.id] ?? linhas.length <= 4}
            onExpandir={() => setExpandidos((atual) => ({ ...atual, [item.id]: !(atual[item.id] ?? linhas.length <= 4) }))}
            onAlternar={alternar}
            onEditarFormulario={abrirFormulario}
            onTrocar={abrirTroca}
            onTransferir={irParaTransferir}
        />
    );

    return (
        <BackstageLayout showEventContext={false} activeProducer="pedidos">
            <motion.div className={cx("flex min-w-0 flex-1 flex-col gap-5 p-4 md:p-6", FOCO_ESCOPO)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: "easeOut" }}>
                <div>
                    <Button size="sm" color="link-gray" iconLeading={ArrowLeft} onClick={() => navigate("/backstage/pedidos")}>
                        Detalhes do pedido
                    </Button>
                </div>

                <header className="flex items-center gap-3">
                    {evento?.capa && <img src={evento.capa} alt="" className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-border-secondary" />}
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold text-primary md:text-2xl">{evento?.nome}</h1>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                            <span className="font-mono text-sm text-tertiary">{pedido.id}</span>
                            <Button size="sm" color="link-gray" iconLeading={copied ? Check : Copy01} onClick={() => copy(pedido.id)}>
                                {copied ? "Copiado" : "Copiar"}
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
                    <div className="flex min-w-0 flex-col gap-5">
                        <FaixaRascunhos pedido={pedido} onContinuar={continuarRascunho} />

                        <Tabs selectedKey={aba} onSelectionChange={(key) => setAba(key as Aba)}>
                            <Tabs.List type="underline" size="sm">
                                <Tabs.Item id="itens">Itens</Tabs.Item>
                                <Tabs.Item id="operacoes">{pedido.solicitacoes.length > 0 ? `Operações em andamento (${pedido.solicitacoes.length})` : "Operações em andamento"}</Tabs.Item>
                                <Tabs.Item id="historico">Histórico</Tabs.Item>
                            </Tabs.List>
                        </Tabs>

                        {aba === "historico" && (
                            <section className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                <ol className="flex flex-col">
                                    {[...pedido.historico].reverse().map((entrada, indice, lista) => (
                                        <EntradaDoHistorico key={entrada.id} entrada={entrada} ultima={indice === lista.length - 1} />
                                    ))}
                                </ol>
                            </section>
                        )}

                        {aba === "operacoes" && (
                            <div className="flex flex-col gap-4">
                                {pedido.solicitacoes.length === 0 ? (
                                    <p className="rounded-2xl bg-primary px-5 py-8 text-center text-sm text-tertiary ring-1 ring-border-secondary">Nenhuma operação em andamento neste pedido.</p>
                                ) : (
                                    <AnimatePresence initial={false}>
                                        {pedido.solicitacoes.map((solicitacao) => (
                                            <motion.div key={solicitacao.id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                                                <CartaoOperacao pedido={pedido} solicitacao={solicitacao} />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        )}

                        {aba === "itens" && (
                            <div className="flex flex-col gap-4">
                                {(indisponiveis > 0 || encerrado) && (
                                    <div className="flex flex-col gap-0.5">
                                        {indisponiveis > 0 && (
                                            <p className="text-sm text-tertiary">
                                                {plural(idsSelecionaveis.length, "unidade disponível", "unidades disponíveis")} para alteração. {plural(indisponiveis, "unidade já está", "unidades já estão")} em outra operação ou com outro titular.
                                            </p>
                                        )}
                                        {encerrado && <p className="text-sm text-tertiary">As sessões deste pedido já aconteceram: só a transferência continua disponível.</p>}
                                    </div>
                                )}

                                <section className="rounded-2xl bg-primary ring-1 ring-border-secondary">
                                    <div className="sticky top-[61px] z-10 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-t-2xl border-b border-secondary bg-secondary px-6 py-3 md:top-[var(--bs-header-offset,0px)]">
                                        <Checkbox
                                            size="md"
                                            isSelected={todosSelecionados}
                                            isIndeterminate={algunsSelecionados}
                                            isDisabled={idsSelecionaveis.length === 0}
                                            onChange={(marcar) => alternar(idsSelecionaveis, marcar)}
                                            label={
                                                <span className="text-xs font-semibold text-quaternary">
                                                    <TextoAnimado>{nSelecionados > 0 ? `${nSelecionados} de ${idsSelecionaveis.length} selecionados` : "Selecionar todos"}</TextoAnimado>
                                                </span>
                                            }
                                        />
                                        {nSelecionados > 0 && (
                                            <Button size="sm" color="link-gray" onClick={() => setSelecao({})}>
                                                Limpar
                                            </Button>
                                        )}
                                        <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
                                            <Button size="sm" color="secondary" className="flex-1 sm:flex-none" isDisabled={nSelecionados === 0 || encerrado} onClick={() => abrirTroca(idsSelecionados)}>
                                                {nSelecionados > 0 ? `Trocar ${nSelecionados} itens` : "Trocar itens"}
                                            </Button>
                                            <Button size="sm" color="secondary" className="flex-1 sm:flex-none" isDisabled={nSelecionados === 0} onClick={() => irParaTransferir(idsSelecionados)}>
                                                {nSelecionados > 0 ? `Transferir ${nSelecionados} itens` : "Transferir itens"}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-5 rounded-b-2xl p-4">
                                        {estrutura.sessoes.length > 0 && (
                                            <div className="flex flex-col gap-3">
                                                <p className="text-md font-bold text-primary">Ingressos</p>
                                                <div className="flex flex-col gap-5">
                                                    {estrutura.sessoes.map(({ sessao, itens }) => (
                                                        <Secao key={sessao.id} titulo={tituloDaSessao(sessao)} icone={Calendar}>
                                                            {itens.map(cartao)}
                                                        </Secao>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {estrutura.produtos.length > 0 && (
                                            <div className="flex flex-col gap-3">
                                                <p className="text-md font-bold text-primary">Produtos</p>
                                                <div className="flex flex-col divide-y divide-border-secondary">{estrutura.produtos.map(cartao)}</div>
                                            </div>
                                        )}
                                        {estrutura.combos.length > 0 && (
                                            <div className="flex flex-col gap-3">
                                                <p className="text-md font-bold text-primary">Combos</p>
                                                <div className="flex flex-col divide-y divide-border-secondary">{estrutura.combos.map(cartao)}</div>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>

                    <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-6">
                        <section className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                            <h2 className="mb-4 text-base font-semibold text-primary">Comprador</h2>
                            <p className="text-sm font-semibold text-primary">{comprador?.nome}</p>
                            <p className="text-sm text-tertiary">{comprador?.email}</p>
                            <dl className="mt-3 flex flex-col gap-2">
                                <Linha rotulo="Documento" valor={comprador?.cpf ?? ""} />
                                <Linha rotulo="Nascimento" valor={comprador?.nascimento ?? ""} />
                                <Linha rotulo="Celular" valor={comprador?.celular ?? ""} />
                            </dl>
                            <dl className="mt-4 flex flex-col gap-2 border-t border-secondary pt-4">
                                <Linha rotulo="Valor original" valor={formatarMoeda(totais.original)} />
                                <Linha rotulo="Desconto" valor={formatarMoeda(-totais.desconto)} />
                                <div className="flex items-baseline justify-between gap-3 border-t border-secondary pt-2">
                                    <dt className="text-sm font-semibold text-primary">Valor final</dt>
                                    <dd className="text-sm font-semibold text-primary tabular-nums">{formatarMoeda(totais.final)}</dd>
                                </div>
                            </dl>
                        </section>

                        <Disclosure titulo="Dados da compra" aberta>
                            <dl className="flex flex-col gap-2">
                                <Linha rotulo="Quantidade de itens" valor={String(pedido.itens.length)} />
                                <Linha rotulo="Canal" valor={pedido.canal} />
                                <Linha rotulo="Meio de pagamento" valor={pedido.meioPagamento} />
                                <Linha rotulo="Cupom ou passkey" valor={pedido.cupom ?? "-"} />
                                <Linha rotulo="Criado em" valor={pedido.criadoEmLabel} />
                                <Linha rotulo="Atualizado em" valor={pedido.atualizadoEmLabel} />
                            </dl>
                        </Disclosure>
                    </aside>
                </div>
            </motion.div>

            {wizardAberto?.tipo === "troca-item" && <TrocarItensWizard pedido={pedido} linhasIniciais={wizardAberto.linhas} rascunhoInicial={wizardAberto.rascunho} onFechar={fecharWizard} />}
            {wizardAberto?.tipo === "troca-titularidade" && <TransferirTitularidadeWizard pedido={pedido} linhasIniciais={wizardAberto.linhas} rascunhoInicial={wizardAberto.rascunho} onFechar={fecharWizard} />}
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Lista de itens                                                     */
/* ------------------------------------------------------------------ */

const Secao = ({ titulo, icone: Icone, children }: { titulo: string; icone?: typeof Calendar; children: ReactNode }) => (
    <div className="flex flex-col gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
            {Icone && <Icone className="size-4 text-fg-quaternary" aria-hidden="true" />}
            <span className="first-letter:uppercase">{titulo}</span>
        </h3>
        <div className="flex flex-col divide-y divide-border-secondary">{children}</div>
    </div>
);

interface CartaoItemProps extends ItemDoPedido {
    pedido: Pedido;
    selecao: Record<string, boolean>;
    encerrado: boolean;
    expandido: boolean;
    onExpandir: () => void;
    onAlternar: (ids: string[], marcar: boolean) => void;
    onEditarFormulario: (linhaId: string) => void;
    onTrocar: (ids: string[]) => void;
    onTransferir: (ids: string[]) => void;
}

/** Um item do catálogo com suas unidades: o cabeçalho resume, as unidades mostram titular e situação.
 *  Três alvos de clique, nunca sobrepostos: o cabeçalho SÓ expande (nunca seleciona, mesmo com uma
 *  unidade só); o checkbox SÓ seleciona; o botão de ação SÓ inicia uma operação.
 *  Sem card próprio: os itens só se separam por um divisor (ver <Secao>) — o destaque de "tudo
 *  selecionado" vira um tingimento de fundo em vez de um anel, já que não há mais borda para colorir. */
const CartaoItem = ({ pedido, item, linhas, selecao, encerrado, expandido, onExpandir, onAlternar, onEditarFormulario, onTrocar, onTransferir }: CartaoItemProps) => {
    const idsLivres = linhas.filter((l) => selecionavel(pedido, l)).map((l) => l.id);
    const nMarcadas = idsLivres.filter((id) => selecao[id]).length;
    const todas = nMarcadas > 0 && nMarcadas === idsLivres.length;
    const total = linhas.reduce((soma, l) => soma + l.valorPago, 0);
    const varias = linhas.length > 1;
    const mostrarUnidades = varias && expandido;

    /* Com uma unidade só, não existe uma segunda linha de "unidade" — o detalhe do portador entra
       alinhado com o título do item, no mesmo cabeçalho, em vez de repetir a linha embaixo. */
    const linhaUnica = linhas[0];
    const estadoUnico = !varias ? estadoDaLinha(pedido, linhaUnica) : undefined;
    const titularUnico = !varias ? getConta(linhaUnica.titularId ?? pedido.compradorId) : undefined;
    const livreUnico = !varias && selecionavel(pedido, linhaUnica);
    const temFormularioUnico = !varias && Boolean(getFormulario(item.formularioId)?.perguntaIds.length);

    const contagem = new Map<EstadoLinha, number>();
    linhas.forEach((l) => {
        const estado = estadoDaLinha(pedido, l);
        if (estado !== "livre") contagem.set(estado, (contagem.get(estado) ?? 0) + 1);
    });
    const resumoEstados = [...contagem.entries()].map(([estado, n]) => `${n} ${ROTULO_ESTADO[estado].toLowerCase()}`).join(" · ");

    /* O cabeçalho SEMPRE só expande — nunca seleciona, mesmo quando há uma unidade só, onde antes
       o clique no cabeçalho também alternava a seleção (o mesmo alvo visual fazendo duas coisas
       diferentes dependendo de um estado invisível). Seleção é sempre o checkbox, ponto. */
    const clicarNoCabecalho = (event: MouseEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.target as Node)) return;
        if ((event.target as HTMLElement).closest("label")) return;
        if (varias) onExpandir();
    };

    const clicarNoSeletor = (event: MouseEvent<HTMLDivElement>) => {
        if (idsLivres.length === 0) return;
        if ((event.target as HTMLElement).closest("label")) return;
        event.stopPropagation();
        onAlternar(idsLivres, !todas);
    };

    return (
        <div className={cx("transition duration-100 ease-linear", todas && "bg-secondary")}>
            <div className={cx("flex items-start gap-3 py-4 transition duration-100 ease-linear", varias && "cursor-pointer hover:bg-primary_hover")} onClick={clicarNoCabecalho}>
                <div className={cx("-m-1 flex items-center gap-3 rounded-lg p-1", idsLivres.length > 0 && "cursor-pointer")} onClick={clicarNoSeletor}>
                    <Checkbox size="md" aria-label={`Selecionar todas as unidades de ${item.nome}`} isSelected={todas} isIndeterminate={nMarcadas > 0 && !todas} isDisabled={idsLivres.length === 0} onChange={(marcar) => onAlternar(idsLivres, marcar)} />
                    <Miniatura item={item} />
                </div>

                <div className={cx("flex min-w-0 flex-1 flex-col gap-0.5", estadoUnico === "transferida" && "opacity-70")}>
                    {item.grupo && <p className="text-sm text-tertiary">{item.grupo}</p>}
                    <p className="text-sm font-semibold text-primary">
                        {item.nome}
                        {item.lote && <span className="font-normal text-tertiary"> | {rotuloDoLote(item.lote)}</span>}
                    </p>
                    {item.tipo !== "ingresso" && item.descricao && <p className="text-sm text-tertiary">{item.descricao}</p>}
                    {varias ? (
                        resumoEstados && <p className="mt-1 text-sm text-tertiary">{resumoEstados}</p>
                    ) : (
                        <>
                            <p className="text-sm text-tertiary">
                                {titularUnico?.nome ?? "Participante"}
                                {titularUnico?.cpf ? ` · CPF ${mascararCPF(titularUnico.cpf)}` : titularUnico?.email ? ` · ${titularUnico.email}` : ""}
                            </p>
                            <Pendencia pedido={pedido} linha={linhaUnica} />
                        </>
                    )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-primary tabular-nums">{formatarMoeda(total)}</p>
                        <p className="text-sm text-tertiary">{plural(linhas.length, "unidade", "unidades")}</p>
                    </div>
                    {!varias && (estadoUnico === "transferida" || livreUnico) && (
                        <span className="flex items-center gap-1">
                            {estadoUnico === "transferida" && <BadgeTransferido />}
                            {livreUnico && (
                                <>
                                    {temFormularioUnico && (
                                        <Button size="sm" color="link-gray" onClick={() => onEditarFormulario(linhaUnica.id)}>
                                            Editar formulário
                                        </Button>
                                    )}
                                    <MenuAcoes rotulo={`Mais ações de ${item.nome}`} ehIngresso={item.tipo === "ingresso"} encerrado={encerrado} onTransferir={() => onTransferir([linhaUnica.id])} onTrocar={() => onTrocar([linhaUnica.id])} />
                                </>
                            )}
                        </span>
                    )}
                </div>

                {varias && (
                    <motion.span layout transition={{ duration: 0.2, ease: "easeOut" }} className="shrink-0 overflow-hidden pt-0.5" onClick={interromper}>
                        <Button size="sm" color="secondary" aria-expanded={expandido} onClick={onExpandir} iconTrailing={<ChevronDown data-icon className={cx("transition-transform duration-100 ease-linear", expandido && "rotate-180")} />}>
                            <TextoAnimado>{expandido ? `Ocultar ${linhas.length} unidades` : `Ver ${linhas.length} unidades`}</TextoAnimado>
                        </Button>
                    </motion.span>
                )}
            </div>

            <AnimatePresence initial={false}>
                {mostrarUnidades && (
                    <motion.ul key="unidades" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex flex-col divide-y divide-border-secondary overflow-hidden border-t border-secondary">
                        {linhas.map((linha, indice) => (
                            <Unidade
                                key={linha.id}
                                pedido={pedido}
                                linha={linha}
                                numero={indice + 1}
                                selecionada={Boolean(selecao[linha.id])}
                                encerrado={encerrado}
                                onAlternar={(marcar) => onAlternar([linha.id], marcar)}
                                onEditarFormulario={() => onEditarFormulario(linha.id)}
                                onTrocar={() => onTrocar([linha.id])}
                                onTransferir={() => onTransferir([linha.id])}
                            />
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

interface UnidadeProps {
    pedido: Pedido;
    linha: PedidoItem;
    numero: number;
    selecionada: boolean;
    encerrado: boolean;
    onAlternar: (marcar: boolean) => void;
    onEditarFormulario: () => void;
    onTrocar: () => void;
    onTransferir: () => void;
}

const Unidade = ({ pedido, linha, numero, selecionada, encerrado, onAlternar, onEditarFormulario, onTrocar, onTransferir }: UnidadeProps) => {
    const estado = estadoDaLinha(pedido, linha);
    const livre = selecionavel(pedido, linha);
    const titular = getConta(linha.titularId ?? pedido.compradorId);
    const item = getItem(linha.itemId);
    const temFormulario = Boolean(getFormulario(item?.formularioId)?.perguntaIds.length);

    /* A unidade não tem "expandir" — clicar na linha sempre e só alterna a seleção, diferente do
       cabeçalho do item acima (que só expande). */
    const alternarLinha = (event: MouseEvent<HTMLLIElement>) => {
        if (!event.currentTarget.contains(event.target as Node) || !livre) return;
        onAlternar(!selecionada);
    };

    return (
        <li className={cx("flex flex-wrap items-center gap-x-3 gap-y-2 py-3 transition duration-100 ease-linear", livre && "cursor-pointer", estado === "transferida" && "opacity-70")} onClick={alternarLinha}>
            <span onClick={interromper}>
                <Checkbox size="md" aria-label={`Selecionar unidade ${numero}${titular ? ` de ${titular.nome}` : ""}`} isSelected={selecionada} isDisabled={!livre} onChange={onAlternar} />
            </span>
            <span className="w-7 shrink-0 text-sm text-tertiary tabular-nums">#{numero}</span>

            <div className="flex min-w-[12rem] flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-medium text-primary">{titular?.nome ?? "Participante"}</p>
                <p className="text-sm text-tertiary">{titular?.cpf ? `CPF ${mascararCPF(titular.cpf)}` : titular?.email}</p>
                <Pendencia pedido={pedido} linha={linha} />
            </div>

            <div className="ml-auto flex items-center gap-2">
                {estado === "transferida" && <BadgeTransferido />}
                {livre && (
                    <span className="flex items-center gap-1">
                        {temFormulario && (
                            <Button size="sm" color="link-gray" onClick={onEditarFormulario}>
                                Editar formulário
                            </Button>
                        )}
                        <MenuAcoes rotulo={`Mais ações da unidade ${numero}`} ehIngresso={item?.tipo === "ingresso"} encerrado={encerrado} onTransferir={onTransferir} onTrocar={onTrocar} />
                    </span>
                )}
            </div>
        </li>
    );
};

const Pendencia = ({ pedido, linha }: { pedido: Pedido; linha: PedidoItem }) => {
    const estado = estadoDaLinha(pedido, linha);
    if (estado === "livre" || estado === "encerrada") return null;

    const pendencia = pendenciaDaLinha(pedido, linha);
    const novoItem = pendencia?.novoItemId ? getItem(pendencia.novoItemId) : undefined;
    const contaDestino = pendencia?.contaDestinoId ? getConta(pendencia.contaDestinoId) : undefined;
    const titular = linha.titularId ? getConta(linha.titularId) : undefined;

    if (estado === "trocando") {
        return (
            <p className="text-sm font-medium text-utility-blue-600">
                Trocando por {novoItem?.nome ?? "outro item"}
                {novoItem?.lote && ` | ${rotuloDoLote(novoItem.lote)}`}
            </p>
        );
    }
    if (estado === "transferindo") {
        return <p className="text-sm font-medium text-utility-blue-600">Transferindo para {contaDestino?.email ?? "novo titular"}</p>;
    }
    if (estado === "editando") return <p className="text-sm font-medium text-utility-blue-600">Formulário em edição</p>;
    return (
        <p className="text-sm text-tertiary">
            Transferido para {titular?.email ?? "outro titular"}
            {linha.transferidoEmLabel ? ` em ${linha.transferidoEmLabel}` : ""}
        </p>
    );
};

const BadgeTransferido = () => (
    <BadgeWithDot color="gray" type="pill-color" size="sm">
        Transferido
    </BadgeWithDot>
);

/** Verbos ancorados na fala real do cliente ("trocar o nome de quem vai" = transferir, não trocar
 *  item) em vez de rótulos técnicos, com uma explicação de uma frase para "titularidade". */
const MenuAcoes = ({
    rotulo,
    ehIngresso,
    encerrado,
    onTransferir,
    onTrocar,
}: {
    rotulo: string;
    ehIngresso: boolean;
    encerrado: boolean;
    onTransferir: () => void;
    onTrocar: () => void;
}) => (
    <Dropdown.Root>
        <ButtonUtility size="sm" color="tertiary" icon={DotsHorizontal} aria-label={rotulo} className="!text-fg-tertiary hover:!text-fg-secondary" />
        <Dropdown.Popover className="w-64">
            <Dropdown.Menu>
                <Dropdown.Item id="transferir" label="Transferir para outra pessoa" onAction={onTransferir} />
                <Dropdown.Item id="trocar" label={ehIngresso ? "Trocar este ingresso" : "Trocar este item"} isDisabled={encerrado} onAction={onTrocar} />
            </Dropdown.Menu>
        </Dropdown.Popover>
    </Dropdown.Root>
);

/* ------------------------------------------------------------------ */
/*  Histórico e apoio                                                  */
/* ------------------------------------------------------------------ */

const EntradaDoHistorico = ({ entrada, ultima }: { entrada: EntradaHistorico; ultima: boolean }) => {
    const [aberto, setAberto] = useState(false);
    const temDetalhes = Boolean(entrada.detalhes?.length);

    return (
        <li className="flex gap-3">
            <div className="flex flex-col items-center">
                <span
                    className={cx(
                        "mt-1.5 size-2 rounded-full",
                        entrada.estado === "concluido" && "bg-fg-success-secondary",
                        entrada.estado === "pendente" && "bg-fg-warning-secondary",
                        entrada.estado === "falha" && "bg-fg-error-secondary",
                        entrada.estado === "expirado" && "bg-fg-quaternary",
                    )}
                />
                {!ultima && <span className="mt-1 w-px flex-1 bg-border-secondary" />}
            </div>

            <div className="min-w-0 flex-1 pb-5">
                <div className="flex items-center gap-2">
                    <Avatar size="xs" initials={iniciaisDe(entrada.responsavel)} alt={entrada.responsavel} />
                    <p className="min-w-0 truncate text-sm font-medium text-secondary">{entrada.responsavel}</p>
                    <span className="shrink-0 text-sm text-quaternary">· {entrada.dataLabel}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-primary">{entrada.titulo}</p>
                    {typeof entrada.valor === "number" && entrada.valor > 0 && <p className="text-sm text-tertiary tabular-nums">{formatarMoeda(entrada.valor)}</p>}
                </div>
                <p className="text-sm text-tertiary">{entrada.descricao}</p>

                {temDetalhes && (
                    <>
                        <button
                            type="button"
                            onClick={() => setAberto((atual) => !atual)}
                            aria-expanded={aberto}
                            className={cx("mt-1 flex items-center gap-1 rounded-md text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover", FOCO)}
                        >
                            {aberto ? "Ocultar detalhes" : "Ver detalhes"}
                            <ChevronDown className={cx("size-4 transition-transform duration-100 ease-linear", aberto && "rotate-180")} aria-hidden="true" />
                        </button>
                        <AnimatePresence initial={false}>
                            {aberto && (
                                <motion.div key="detalhes" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                                    <ul className="mt-2 flex flex-col gap-1 rounded-lg bg-secondary px-3 py-2">
                                        {entrada.detalhes!.map((detalhe) => (
                                            <li key={detalhe} className="text-sm text-secondary">
                                                {detalhe}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
        </li>
    );
};

const Disclosure = ({ titulo, aberta = false, children }: { titulo: string; aberta?: boolean; children: ReactNode }) => {
    const [aberto, setAberto] = useState(aberta);
    return (
        <section className="rounded-2xl bg-primary ring-1 ring-border-secondary">
            <button type="button" onClick={() => setAberto((atual) => !atual)} aria-expanded={aberto} className={cx("flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition duration-100 ease-linear hover:bg-primary_hover", FOCO)}>
                <span className="text-base font-semibold text-primary">{titulo}</span>
                <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear", aberto && "rotate-180")} aria-hidden="true" />
            </button>
            <AnimatePresence initial={false}>
                {aberto && (
                    <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                        <div className="border-t border-secondary px-5 py-4">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

const Linha = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
    <div className="flex items-baseline justify-between gap-3">
        <dt className="shrink-0 text-sm text-tertiary">{rotulo}</dt>
        <dd className="min-w-0 truncate text-sm text-primary">{valor}</dd>
    </div>
);
