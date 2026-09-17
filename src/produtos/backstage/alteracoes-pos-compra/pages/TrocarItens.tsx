import { useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ArrowDown, Calendar, ChevronDown, ChevronLeft, SearchLg } from "@untitledui/icons";
import { toast } from "sonner";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputBase } from "@/components/base/input/input";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import {
    Aviso,
    EtapaCompacta,
    EtapaJustificativa,
    FOCO,
    ItensSelecionados,
    Miniatura,
    Regra,
    ResumoFinanceiro,
    Stepper,
    useRolou,
} from "../components/pos-compra-ui";
import { EditorResposta } from "../components/respostas-ui";
import {
    SESSOES,
    calcularTrocaItens,
    criarSolicitacao,
    formatarMoeda,
    getFormulario,
    getItem,
    respostasCompletas,
    sessaoDoItem,
    sessaoLabel,
    solicitacaoDaLinha,
    useCatalogo,
    usePedidos,
    usePerguntas,
    uuidCurto,
    validarTrocaItem,
    type CatalogoItem,
    type Pedido,
    type PedidoItem,
    type Pergunta,
    type Sessao,
    type TipoItem,
} from "../data/pos-compra-store";

type Etapa = "saem" | "entram" | "formularios" | "justificativa" | "revisao";

const TITULO_ETAPA: Record<Etapa, string> = {
    saem: "Itens que saem",
    entram: "Itens que entram",
    formularios: "Formulários",
    justificativa: "Justificativa",
    revisao: "Revisão",
};

const LABEL_TIPO: Record<TipoItem, string> = { ingresso: "Ingressos", produto: "Produtos", combo: "Combos" };

const combina = (termo: string, ...campos: Array<string | undefined>) => {
    const busca = termo.trim().toLowerCase();
    if (!busca) return true;
    return campos.some((campo) => campo?.toLowerCase().includes(busca));
};

const detalheDoItem = (item?: CatalogoItem) => [item?.lote, sessaoDoItem(item) ? sessaoLabel(item) : null].filter(Boolean).join(" | ");

const interromper = (event: MouseEvent) => event.stopPropagation();

export function TrocarItens() {
    const { pedidoId } = useParams();
    const navigate = useNavigate();
    const linhasIniciais = (useLocation().state as { linhas?: string[] } | null)?.linhas ?? [];
    const pedidos = usePedidos();
    const catalogo = useCatalogo();
    const perguntas = usePerguntas();
    const pedido = pedidos.find((p) => p.id === pedidoId);

    const [indice, setIndice] = useState(0);
    const [termo, setTermo] = useState("");
    const [justificativa, setJustificativa] = useState("");
    /** Linhas do pedido que saem. Chegam marcadas quando a escolha foi feita na lista do pedido. */
    const [saem, setSaem] = useState<Record<string, boolean>>(() => Object.fromEntries(linhasIniciais.map((id) => [id, true])));
    /** Quantas unidades de cada item do catálogo entram no lugar. */
    const [entram, setEntram] = useState<Record<string, number>>({});
    const [respostasEntram, setRespostasEntram] = useState<Record<string, Record<string, string>>>({});
    const rolou = useRolou();

    if (!pedido) {
        return (
            <BackstageLayout showEventContext={false} activeProducer="pedidos">
                <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
                    <p className="text-sm text-tertiary">Pedido não encontrado.</p>
                    <Button size="md" color="secondary" onClick={() => navigate("/backstage/pedidos")}>
                        Voltar para pedidos
                    </Button>
                </div>
            </BackstageLayout>
        );
    }

    const voltarAoPedido = () => navigate(`/backstage/pedidos/${pedido.id}`);

    /* ------------------------------------------------------------------ */
    /*  O que sai                                                          */
    /* ------------------------------------------------------------------ */

    const linhasDisponiveis = pedido.itens.filter((l) => !l.titularId && !solicitacaoDaLinha(pedido, l.id));
    /* Com a escolha feita na lista do pedido, a etapa "itens que saem" não precisa existir. */
    const selecaoPrevia = linhasDisponiveis.some((l) => linhasIniciais.includes(l.id));
    const linhasSaem = linhasDisponiveis.filter((l) => saem[l.id]);
    const totalSaem = linhasSaem.length;
    const linhasPorTipo = (Object.keys(LABEL_TIPO) as TipoItem[])
        .map((tipo) => ({ tipo, linhas: linhasDisponiveis.filter((l) => (getItem(l.itemId)?.tipo ?? "produto") === tipo) }))
        .filter((g) => g.linhas.length > 0);

    const alternarSaida = (id: string) => setSaem((atual) => ({ ...atual, [id]: !atual[id] }));

    /* ------------------------------------------------------------------ */
    /*  O que entra                                                        */
    /* ------------------------------------------------------------------ */

    /* A troca vale entre qualquer combinação de tipos — ingresso por produto, produto por ingresso etc. */
    const candidatos = catalogo.filter(
        (i) => i.eventoId === pedido.eventoId && combina(termo, i.nome, i.grupo, i.lote, i.descricao, sessaoLabel(i)),
    );
    const sessoes = SESSOES.filter((s) => s.eventoId === pedido.eventoId)
        .sort((a, b) => a.inicio - b.inicio)
        .map((sessao) => {
            const grupos = new Map<string, CatalogoItem[]>();
            candidatos
                .filter((i) => i.sessaoId === sessao.id)
                .forEach((item) => grupos.set(item.grupo ?? "Outros", [...(grupos.get(item.grupo ?? "Outros") ?? []), item]));
            return { sessao, grupos: [...grupos.entries()] };
        })
        .filter(({ grupos }) => grupos.length > 0);
    const produtos = candidatos.filter((i) => !i.sessaoId && i.tipo === "produto");
    const combos = candidatos.filter((i) => !i.sessaoId && i.tipo === "combo");

    /* Referência para validar o catálogo: prefere uma linha do mesmo tipo (compara lote, sessão etc. com
       mais sentido); sem uma do mesmo tipo, cai em qualquer linha que esteja saindo — a troca vale entre
       tipos diferentes, então o catálogo não pode ficar sem validação nesse caso. */
    const referenciaPorTipo = new Map<TipoItem, PedidoItem>();
    linhasSaem.forEach((l) => {
        const tipo = getItem(l.itemId)?.tipo;
        if (tipo && !referenciaPorTipo.has(tipo)) referenciaPorTipo.set(tipo, l);
    });
    const referenciaDoItem = (item: CatalogoItem) => referenciaPorTipo.get(item.tipo) ?? linhasSaem[0];

    /* Para o cartão dizer "já no pedido" e mostrar a diferença por unidade. */
    const noPedidoPorItem = new Map<string, number>();
    pedido.itens.forEach((l) => noPedidoPorItem.set(l.itemId, (noPedidoPorItem.get(l.itemId) ?? 0) + 1));
    const saindoPorItem = new Map<string, number>();
    linhasSaem.forEach((l) => saindoPorItem.set(l.itemId, (saindoPorItem.get(l.itemId) ?? 0) + 1));
    const precoSaida = new Set(linhasSaem.map((l) => l.valorPago)).size === 1 ? linhasSaem[0]?.valorPago : undefined;

    const itensQueEntram = Object.entries(entram).filter(([, q]) => q > 0);
    const totalEntram = itensQueEntram.reduce((soma, [, q]) => soma + q, 0);
    const destinos = itensQueEntram.flatMap(([itemId, q]) => {
        const item = getItem(itemId);
        return item ? Array.from({ length: q }, () => item) : [];
    });
    /* Pareia origem e destino na ordem escolhida: N que saem para N que entram. */
    const pares = linhasSaem
        .map((linha, i) => ({ linha, novoItem: destinos[i] }))
        .filter((p): p is { linha: PedidoItem; novoItem: CatalogoItem } => Boolean(p.novoItem));
    const calculo = pares.length > 0 ? calcularTrocaItens(pares) : null;
    /* Agrupa os pares 1:1 pelo par de itens (origem, destino): quem troca 3 unidades do mesmo item pelo
       mesmo item de destino vê uma linha só, com a quantidade somada, em vez de 3 linhas repetidas. */
    const paresAgrupados = [
        ...pares
            .reduce((mapa, { linha, novoItem }) => {
                const itemSai = getItem(linha.itemId);
                const chave = `${linha.itemId}→${novoItem.id}`;
                const atual = mapa.get(chave) ?? {
                    chave,
                    saiNome: itemSai?.nome ?? "",
                    saiDetalhe: sessaoLabel(itemSai),
                    entraNome: novoItem.nome,
                    entraDetalhe: sessaoLabel(novoItem),
                    quantidade: 0,
                };
                atual.quantidade++;
                return mapa.set(chave, atual);
            }, new Map<string, { chave: string; saiNome: string; saiDetalhe?: string; entraNome: string; entraDetalhe?: string; quantidade: number }>())
            .values(),
    ];
    /* Sair e entrar com exatamente os mesmos itens não é troca: seria só cobrar taxa. */
    const selecaoIgual =
        totalSaem > 0 &&
        linhasSaem.map((l) => l.itemId).sort().join("|") ===
            itensQueEntram
                .flatMap(([id, q]) => Array<string>(q).fill(id))
                .sort()
                .join("|");

    /* ------------------------------------------------------------------ */
    /*  Formulários dos itens que entram                                   */
    /* ------------------------------------------------------------------ */

    const formularios = itensQueEntram
        .map(([itemId, quantidade]) => {
            const item = getItem(itemId);
            const perguntasDoItem = (getFormulario(item?.formularioId)?.perguntaIds ?? [])
                .map((id) => perguntas.find((p) => p.id === id))
                .filter(Boolean) as Pergunta[];
            return { itemId, item, quantidade, perguntas: perguntasDoItem };
        })
        .filter((f) => f.perguntas.length > 0);
    /* O item que entra é novo no pedido: a resposta parte já preenchida, como um comprador que teria
       respondido na hora da compra — a mesma lógica usada para completar os formulários da transferência. */
    const valoresEntram = (itemId: string): Record<string, string> => ({ ...respostasCompletas(itemId), ...(respostasEntram[itemId] ?? {}) });
    const respondido = (itemId: string, pergunta: Pergunta) => (valoresEntram(itemId)[pergunta.id] ?? "").trim() !== "";
    const formulariosCompletos = formularios.every((f) => f.perguntas.every((p) => respondido(f.itemId, p)));

    /* ------------------------------------------------------------------ */
    /*  Etapas                                                             */
    /* ------------------------------------------------------------------ */

    const etapas: Etapa[] = [
        ...(selecaoPrevia ? [] : (["saem"] as Etapa[])),
        "entram",
        ...(formularios.length > 0 ? (["formularios"] as Etapa[]) : []),
        "justificativa",
        "revisao",
    ];
    const etapa = etapas[Math.min(indice, etapas.length - 1)];
    const progressItems: ProgressIconType[] = etapas.map((e, i) => ({
        title: TITULO_ETAPA[e],
        description: "",
        status: i < indice ? "complete" : i === indice ? "current" : "incomplete",
    }));

    const podeAvancar =
        etapa === "saem"
            ? totalSaem > 0
            : etapa === "entram"
              ? totalSaem > 0 && totalEntram === totalSaem && !selecaoIgual
              : etapa === "formularios"
                ? formulariosCompletos
                : etapa === "justificativa"
                  ? justificativa.trim().length > 0
                  : Boolean(calculo);

    const rotuloAvancar =
        etapa === "saem"
            ? "Escolher o que entra"
            : etapa === "entram" && formularios.length > 0
              ? "Preencher formulários"
              : etapa === "justificativa"
                ? "Revisar troca"
                : "Justificar";

    const voltar = () => (indice === 0 ? voltarAoPedido() : setIndice((i) => i - 1));

    const cartaoCatalogo = (item: CatalogoItem) => (
        <LinhaCatalogo
            key={item.id}
            item={item}
            pedido={pedido}
            linhaReferencia={referenciaDoItem(item)}
            quantidade={entram[item.id] ?? 0}
            restante={totalSaem - totalEntram}
            totalSaem={totalSaem}
            precoSaida={precoSaida}
            noPedido={noPedidoPorItem.get(item.id) ?? 0}
            saindo={saindoPorItem.get(item.id) ?? 0}
            onChange={(valor) =>
                setEntram((atual) =>
                    /* 1 unidade saindo é escolha única: marcar outro item desmarca o anterior, nunca soma. */
                    totalSaem === 1 ? (valor > 0 ? { [item.id]: valor } : {}) : { ...atual, [item.id]: valor },
                )
            }
        />
    );

    const renderSessao = ({ sessao, grupos }: (typeof sessoes)[number], primeiraSessao: boolean) => (
        <div key={sessao.id} className="flex flex-col gap-2">
            <CabecalhoSessao sessao={sessao} />
            {grupos.map(([grupo, itens], posicao) => (
                <Accordion
                    key={grupo}
                    defaultOpen={(primeiraSessao && posicao === 0) || Boolean(termo.trim())}
                    cabecalho={
                        <span className="flex min-w-0 flex-1 items-baseline gap-2">
                            <span className="truncate text-sm font-semibold text-primary">{grupo}</span>
                            <span className="shrink-0 text-sm text-tertiary">{itens.length === 1 ? "1 item" : `${itens.length} itens`}</span>
                        </span>
                    }
                >
                    <ul className="flex flex-col gap-2 p-3">{itens.map(cartaoCatalogo)}</ul>
                </Accordion>
            ))}
        </div>
    );

    const confirmar = () => {
        if (!calculo || pares.length === 0) return;

        const porItem = new Map<string, { nome: string; quantidade: number }>();
        linhasSaem.forEach((l) => {
            const anterior = porItem.get(l.itemId) ?? { nome: getItem(l.itemId)?.nome ?? "", quantidade: 0 };
            anterior.quantidade++;
            porItem.set(l.itemId, anterior);
        });
        const resumoSaem = [...porItem.values()].map((v) => `${v.quantidade}x ${v.nome}`).join(", ");
        const resumoEntram = itensQueEntram.map(([itemId, q]) => `${q}x ${getItem(itemId)?.nome}`).join(", ");
        const detalhe = (prefixo: string, item?: CatalogoItem) => [prefixo, item?.lote, sessaoDoItem(item) ? sessaoLabel(item) : null].filter(Boolean).join(" · ");
        const detalhes = [
            ...linhasSaem.map((l) => detalhe(`Sai 1x ${getItem(l.itemId)?.nome}`, getItem(l.itemId))),
            ...itensQueEntram.map(([id, q]) => detalhe(`Entra ${q}x ${getItem(id)?.nome}`, getItem(id))),
            ...formularios.flatMap(({ itemId }) =>
                Object.entries(valoresEntram(itemId))
                    .filter(([, valor]) => valor)
                    .map(([perguntaId, valor]) => `${getItem(itemId)?.nome} | ${perguntas.find((p) => p.id === perguntaId)?.label}: ${valor}`),
            ),
            `Justificativa: ${justificativa.trim()}`,
        ];

        /* Uma resposta por item que entra, aplicada a todas as unidades pareadas dele. */
        const respostasPorItem = Object.fromEntries(
            pares.filter(({ novoItem }) => formularios.some((f) => f.itemId === novoItem.id)).map(({ linha, novoItem }) => [linha.id, valoresEntram(novoItem.id)]),
        );

        criarSolicitacao({
            pedidoId: pedido.id,
            tipo: "troca-item",
            detalhes,
            linhasAfetadas: pares.map(({ linha }) => linha.id),
            resumo: `${resumoSaem} para ${resumoEntram}.`,
            calculo,
            aplicar: {
                trocas: pares.map(({ linha, novoItem }) => ({ pedidoItemId: linha.id, novoItemId: novoItem.id })),
                respostasPorItem: Object.keys(respostasPorItem).length > 0 ? respostasPorItem : undefined,
            },
            reservas: pares.map(({ novoItem }) => ({ tipo: "item" as const, itemId: novoItem.id })),
        });
        toast.success("Cobrança de troca gerada com sucesso.");
        voltarAoPedido();
    };

    /* ------------------------------------------------------------------ */
    /*  Render                                                             */
    /* ------------------------------------------------------------------ */

    return (
        <BackstageLayout showEventContext={false} activeProducer="pedidos">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className={cx("sticky top-[61px] z-20 flex flex-wrap items-center justify-between gap-3 bg-primary_alt px-4 py-4 transition-colors duration-150 md:top-[var(--bs-header-offset,0px)] md:px-6 md:py-5", rolou && "border-b border-secondary")}>
                    <ButtonUtility size="md" color="secondary" icon={ChevronLeft} tooltip="Voltar" onClick={voltar} />
                    <div className="flex flex-col items-center text-center max-md:order-last max-md:w-full md:pointer-events-none md:absolute md:left-1/2 md:-translate-x-1/2">
                        <h1 className="text-display-xs font-bold text-primary">Trocar itens</h1>
                        <p className="text-sm text-tertiary">
                            Pedido {uuidCurto(pedido.id)}
                            {totalSaem > 0 && ` · ${totalSaem} ${totalSaem === 1 ? "item sai" : "itens saem"}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {etapa !== "revisao" ? (
                            <Button size="md" isDisabled={!podeAvancar} onClick={() => setIndice((i) => i + 1)}>
                                {rotuloAvancar}
                            </Button>
                        ) : (
                            <Button size="md" isDisabled={!calculo} onClick={confirmar}>
                                Cobrar troca de {formatarMoeda(calculo?.total ?? 0)}
                            </Button>
                        )}
                    </div>
                </header>

                <main className="flex flex-1 flex-col items-center gap-8 px-6 pb-10">
                    <Progress.IconsWithText items={progressItems} type="number" size="sm" orientation="horizontal" className="max-w-[480px] max-md:hidden" />
                    <EtapaCompacta atual={Math.min(indice, etapas.length - 1)} titulos={etapas.map((e) => TITULO_ETAPA[e])} className="md:hidden" />

                    <section className="flex w-full max-w-2xl flex-col gap-5">
                        {etapa === "saem" && (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Regra>Marque o que sai do pedido. O que entra vem na próxima etapa.</Regra>
                                    {linhasDisponiveis.length > 1 && (
                                        <Button
                                            size="sm"
                                            color="link-color"
                                            onClick={() =>
                                                setSaem(totalSaem === linhasDisponiveis.length ? {} : Object.fromEntries(linhasDisponiveis.map((l) => [l.id, true])))
                                            }
                                        >
                                            {totalSaem === linhasDisponiveis.length ? "Limpar" : "Selecionar todos"}
                                        </Button>
                                    )}
                                </div>

                                {linhasDisponiveis.length === 0 && <Aviso tom="warning" titulo="Este pedido não tem itens livres para troca." />}

                                {linhasPorTipo.map(({ tipo, linhas }) => (
                                    <div key={tipo} className="flex flex-col gap-2">
                                        {linhasPorTipo.length > 1 && <p className="px-1 text-sm font-semibold text-secondary">{LABEL_TIPO[tipo]}</p>}
                                        <ul className="flex flex-col gap-2">
                                            {linhas.map((linha) => {
                                                const item = getItem(linha.itemId);
                                                const marcada = Boolean(saem[linha.id]);
                                                const detalhe = detalheDoItem(item);
                                                return (
                                                    <li
                                                        key={linha.id}
                                                        onClick={() => alternarSaida(linha.id)}
                                                        className={cx(
                                                            "flex cursor-pointer items-center gap-3 rounded-xl p-4 ring-1 transition duration-100 ease-linear",
                                                            marcada ? "bg-secondary ring-border-brand" : "bg-primary ring-border-secondary hover:bg-primary_hover",
                                                        )}
                                                    >
                                                        <span onClick={interromper}>
                                                            <Checkbox size="sm" aria-label={`Selecionar ${item?.nome}`} isSelected={marcada} onChange={() => alternarSaida(linha.id)} />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-sm font-semibold text-primary">{item?.nome}</span>
                                                            {detalhe && <span className="block text-sm text-tertiary">{detalhe}</span>}
                                                        </span>
                                                        <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{formatarMoeda(linha.valorPago)}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                ))}
                            </>
                        )}

                        {etapa === "entram" && (
                            <>
                                <ItensSelecionados
                                    linhas={linhasSaem}
                                    titulo={`Trocando (${totalSaem})`}
                                    acao={
                                        <Button size="sm" color="link-color" onClick={selecaoPrevia ? voltarAoPedido : () => setIndice(0)}>
                                            Alterar
                                        </Button>
                                    }
                                />

                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Regra>{totalSaem === 1 ? "Escolha o item que entra no lugar." : "Distribua as unidades que saem entre os itens que entram."}</Regra>
                                    <span className={cx("text-sm tabular-nums", totalEntram === totalSaem ? "text-success-primary" : "text-tertiary")}>
                                        {totalSaem === 1 ? (
                                            totalEntram === 1 ? "Item escolhido" : "Nenhum item escolhido"
                                        ) : (
                                            <>
                                                <span className="font-semibold">
                                                    {totalEntram} de {totalSaem}
                                                </span>{" "}
                                                {totalEntram === totalSaem ? "escolhidos" : `escolhidos · faltam ${totalSaem - totalEntram}`}
                                            </>
                                        )}
                                    </span>
                                </div>

                                <InputBase
                                    size="sm"
                                    icon={SearchLg}
                                    value={termo}
                                    aria-label="Buscar item"
                                    onChange={(evento) => setTermo(evento.target.value)}
                                    placeholder="Busque por sessão, grupo, lote ou item"
                                />

                                {selecaoIgual && (
                                    <Aviso titulo="A seleção é igual ao que já está no pedido" descricao="Escolha pelo menos um item diferente para a troca fazer sentido." />
                                )}

                                {candidatos.length === 0 && (
                                    <p className="rounded-xl bg-primary px-4 py-8 text-center text-sm text-tertiary ring-1 ring-border-secondary">Nenhum item encontrado para a busca.</p>
                                )}

                                {sessoes.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        {(produtos.length > 0 || combos.length > 0) && <p className="px-1 text-sm font-semibold text-secondary">Ingressos</p>}
                                        {sessoes.map((entrada, indice) => renderSessao(entrada, indice === 0))}
                                    </div>
                                )}

                                {[
                                    { rotulo: "Produtos", itens: produtos, outros: sessoes.length > 0 || combos.length > 0 },
                                    { rotulo: "Combos", itens: combos, outros: sessoes.length > 0 || produtos.length > 0 },
                                ]
                                    .filter((secao) => secao.itens.length > 0)
                                    .map((secao) => (
                                        <div key={secao.rotulo} className="flex flex-col gap-2">
                                            {secao.outros && <p className="px-1 text-sm font-semibold text-secondary">{secao.rotulo}</p>}
                                            <ul className="flex flex-col gap-2">
                                                {secao.itens.map(cartaoCatalogo)}
                                            </ul>
                                        </div>
                                    ))}
                            </>
                        )}

                        {etapa === "formularios" && (
                            <>
                                <Regra>Cada item que entra tem o próprio formulário. Uma resposta vale para todas as unidades daquele item.</Regra>
                                {formularios.map((formulario, posicao) => {
                                    const completo = formulario.perguntas.every((p) => respondido(formulario.itemId, p));
                                    return (
                                        <Accordion
                                            key={formulario.itemId}
                                            defaultOpen={posicao === 0}
                                            cabecalho={
                                                <span className="flex min-w-0 flex-1 items-center gap-3">
                                                    {formulario.item && <Miniatura item={formulario.item} />}
                                                    <span className="block min-w-0 flex-1 truncate text-sm font-semibold text-primary">
                                                        {formulario.quantidade}x {formulario.item?.nome}
                                                    </span>
                                                    <span className={cx("shrink-0 text-sm", completo ? "text-success-primary" : "text-warning-primary")}>
                                                        {completo ? "Respondido" : "Falta responder"}
                                                    </span>
                                                </span>
                                            }
                                        >
                                            <div className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto p-4">
                                                {formulario.perguntas.map((pergunta) => (
                                                    <EditorResposta
                                                        key={pergunta.id}
                                                        pergunta={pergunta}
                                                        valor={valoresEntram(formulario.itemId)[pergunta.id] ?? ""}
                                                        valorOriginal=""
                                                        onChange={(valor) =>
                                                            setRespostasEntram((atual) => ({
                                                                ...atual,
                                                                [formulario.itemId]: { ...(atual[formulario.itemId] ?? {}), [pergunta.id]: valor },
                                                            }))
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </Accordion>
                                    );
                                })}
                            </>
                        )}

                        {etapa === "justificativa" && (
                            <EtapaJustificativa
                                descricao="Explique por que essa troca está sendo feita. Isso fica registrado no histórico do pedido."
                                valor={justificativa}
                                onChange={setJustificativa}
                            />
                        )}

                        {etapa === "revisao" && calculo && (
                            <>
                                <div className="w-full overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                                    <p className="border-b border-secondary px-4 py-3 text-sm font-semibold text-primary">Trocando</p>
                                    <ul className="flex flex-col divide-y divide-border-secondary">
                                        {paresAgrupados.map((par) => (
                                            <li key={par.chave} className="flex flex-col gap-2 p-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm text-tertiary line-through">
                                                        {par.quantidade}x {par.saiNome}
                                                    </p>
                                                    {par.saiDetalhe && <p className="text-sm text-tertiary line-through">{par.saiDetalhe}</p>}
                                                </div>
                                                <ArrowDown className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-primary">
                                                        {par.quantidade}x {par.entraNome}
                                                    </p>
                                                    {par.entraDetalhe && <p className="text-sm text-tertiary">{par.entraDetalhe}</p>}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {calculo.semCredito && <Aviso tom="warning" titulo="Há itens mais baratos na troca. A diferença deles não gera crédito nem reembolso." />}

                                <div className="w-full rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                                    <p className="mb-1 text-sm font-semibold text-primary">Justificativa</p>
                                    <p className="text-sm text-tertiary">{justificativa.trim()}</p>
                                </div>

                                <ResumoFinanceiro linhas={calculo.linhas} />
                                <Regra>As vagas ficam reservadas por 1 hora. Nada é aplicado antes do pagamento.</Regra>
                            </>
                        )}
                    </section>
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Peças                                                              */
/* ------------------------------------------------------------------ */

const LinhaCatalogo = ({
    item,
    pedido,
    linhaReferencia,
    quantidade,
    restante,
    totalSaem,
    precoSaida,
    noPedido,
    saindo,
    onChange,
}: {
    item: CatalogoItem;
    pedido: Pedido;
    linhaReferencia?: PedidoItem;
    quantidade: number;
    restante: number;
    totalSaem: number;
    /** Valor pago pelas unidades que saem, quando é o mesmo para todas. */
    precoSaida?: number;
    noPedido: number;
    saindo: number;
    onChange: (valor: number) => void;
}) => {
    const impedimento = linhaReferencia ? validarTrocaItem(pedido, linhaReferencia, item) : null;
    const bloqueado = Boolean(impedimento) && impedimento?.curto !== "Item atual";
    /* Nunca pode virar mais unidades desse item do que "sobra" fora do que já é esse mesmo item saindo —
       senão parte da troca seria só devolver o item para o próprio lugar. */
    const maximo = bloqueado ? 0 : Math.min(item.estoque, quantidade + Math.max(0, restante), Math.max(0, totalSaem - saindo));
    /* Uma unidade só: o cartão vira uma opção de escolha única, sem contador. */
    const unico = totalSaem === 1;
    /* O próprio item que está saindo aparece na lista: não faz sentido "trocar" por ele mesmo. Vale tanto
       para uma unidade quanto para um lote em massa, desde que TODO o lote seja desse mesmo item. */
    const itemAtual = saindo > 0 && saindo === totalSaem;
    const naoSelecionavel = bloqueado || itemAtual;
    const escolhido = quantidade > 0;
    const diferenca = precoSaida !== undefined ? item.precoIntegral - precoSaida : undefined;
    const estoqueCurto = !bloqueado && item.estoque < totalSaem;

    return (
        <li
            onClick={unico && !naoSelecionavel ? () => onChange(escolhido ? 0 : 1) : undefined}
            aria-pressed={unico ? escolhido : undefined}
            className={cx(
                "flex flex-col gap-3 rounded-xl p-4 ring-1 transition duration-100 ease-linear sm:flex-row sm:items-center sm:justify-between",
                naoSelecionavel ? "bg-primary opacity-60 ring-border-secondary" : escolhido ? "bg-secondary ring-border-brand" : "bg-primary ring-border-secondary",
                unico && !naoSelecionavel && "cursor-pointer hover:bg-primary_hover",
            )}
        >
            <div className="flex min-w-0 flex-1 items-start gap-3">
                {unico && <RadioButtonBase size="sm" isSelected={escolhido} isDisabled={naoSelecionavel} className="mt-0.5 shrink-0" />}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-primary">{item.nome}</p>
                    {item.lote && <p className="text-sm text-tertiary">{item.lote}</p>}
                    {item.tipo !== "ingresso" && item.descricao && <p className="text-sm text-tertiary">{item.descricao}</p>}
                    {(saindo > 0 || noPedido > 0 || bloqueado || estoqueCurto) && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {saindo > 0 && (
                                <Badge size="sm" type="pill-color" color="gray">
                                    {saindo === 1 ? "Item sendo trocado" : `${saindo} itens sendo trocados`}
                                </Badge>
                            )}
                            {saindo === 0 && noPedido > 0 && (
                                <Badge size="sm" type="pill-color" color="blue">
                                    {noPedido === 1 ? "1 igual no pedido" : `${noPedido} iguais no pedido`}
                                </Badge>
                            )}
                            {bloqueado && (
                                <Badge size="sm" type="pill-color" color="error">
                                    {impedimento?.curto}
                                </Badge>
                            )}
                            {estoqueCurto && (
                                <Badge size="sm" type="pill-color" color="warning">
                                    Só {item.estoque} {item.estoque === 1 ? "disponível" : "disponíveis"}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="sm:text-right">
                    <p className="text-sm font-semibold text-primary tabular-nums">{formatarMoeda(item.precoIntegral)}</p>
                    {!bloqueado && diferenca !== undefined && diferenca !== 0 && (
                        <p className="text-sm text-tertiary tabular-nums">
                            {diferenca > 0 ? `+${formatarMoeda(diferenca)} por unidade` : `${formatarMoeda(diferenca)} por unidade`}
                        </p>
                    )}
                </div>
                {!bloqueado && !unico && !itemAtual && (
                    <div className="flex items-center" onClick={interromper}>
                        <Stepper valor={quantidade} maximo={maximo} rotulo={item.nome} onChange={onChange} />
                    </div>
                )}
            </div>
        </li>
    );
};

const CabecalhoSessao = ({ sessao }: { sessao: Sessao }) => (
    <div className="flex items-center gap-2 px-1 pt-1">
        <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
        <span className="text-sm font-semibold text-secondary first-letter:uppercase">
            {sessao.dataLabel}, {sessao.horaLabel}
        </span>
        {sessao.inicio <= Date.now() && <span className="text-sm text-tertiary">· sessão encerrada</span>}
    </div>
);

const Accordion = ({ cabecalho, defaultOpen, children }: { cabecalho: ReactNode; defaultOpen: boolean; children: ReactNode }) => {
    const [aberto, setAberto] = useState(defaultOpen);
    return (
        <section className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
            <button
                type="button"
                onClick={() => setAberto((atual) => !atual)}
                aria-expanded={aberto}
                className={cx(
                    "flex w-full items-center gap-2 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover",
                    aberto && "border-b border-secondary",
                    FOCO,
                )}
            >
                {cabecalho}
                <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear", aberto && "rotate-180")} aria-hidden="true" />
            </button>
            <AnimatePresence initial={false}>
                {aberto && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};
