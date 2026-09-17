import { useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ArrowDown, ChevronDown, ChevronLeft, Copy01, SearchLg } from "@untitledui/icons";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { Aviso, EtapaCompacta, FOCO, Miniatura, Regra, ResumoFinanceiro, useRolou } from "../components/pos-compra-ui";
import { ComparativoResposta, EditorResposta } from "../components/respostas-ui";
import {
    CONTAS,
    calcularTrocaTitularidade,
    criarSolicitacao,
    formatarMoeda,
    getConta,
    getEvento,
    getFormulario,
    getItem,
    sessaoDoItem,
    sessaoLabel,
    solicitacaoDaLinha,
    titularDaLinha,
    usePedidos,
    usePerguntas,
    uuidCurto,
    type CatalogoItem,
    type Conta,
    type Pedido,
    type PedidoItem,
    type Pergunta,
} from "../data/pos-compra-store";

type Etapa = "itens" | "destinatario" | "formularios" | "revisao";

const TITULO_ETAPA: Record<Etapa, string> = {
    itens: "Itens",
    destinatario: "Destinatário",
    formularios: "Formulários",
    revisao: "Revisão",
};

const soDigitos = (texto: string) => texto.replace(/\D/g, "");

const iniciaisDe = (nome: string) =>
    nome
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase() ?? "")
        .join("");

const detalheDoItem = (item?: CatalogoItem) => [item?.lote, sessaoDoItem(item) ? sessaoLabel(item) : null].filter(Boolean).join(" | ");

const interromper = (event: MouseEvent) => event.stopPropagation();

export function TransferirTitularidade() {
    const { pedidoId } = useParams();
    const navigate = useNavigate();
    const linhasIniciais = (useLocation().state as { linhas?: string[] } | null)?.linhas ?? [];
    const pedidos = usePedidos();
    const perguntas = usePerguntas();
    const pedido = pedidos.find((p) => p.id === pedidoId);

    const [indice, setIndice] = useState(0);
    const [busca, setBusca] = useState("");
    const [selecionada, setSelecionada] = useState<Conta | null>(null);
    /** Linhas que vão mudar de titular. Chegam marcadas quando a escolha foi feita na lista do pedido. */
    const [selecao, setSelecao] = useState<Record<string, boolean>>(() => Object.fromEntries(linhasIniciais.map((id) => [id, true])));
    const [respostasPorLinha, setRespostasPorLinha] = useState<Record<string, Record<string, string>>>({});
    const [aberta, setAberta] = useState<string | null>(null);
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
    /*  Itens                                                              */
    /* ------------------------------------------------------------------ */

    const linhasDisponiveis = pedido.itens.filter((l) => !l.titularId && !solicitacaoDaLinha(pedido, l.id));
    /* Com a escolha feita na lista do pedido, a etapa de itens não precisa existir. */
    const selecaoPrevia = linhasDisponiveis.some((l) => linhasIniciais.includes(l.id));
    const linhas = linhasDisponiveis.filter((l) => selecao[l.id]);
    const calculo = calcularTrocaTitularidade(linhas.length);

    const alternar = (id: string) => setSelecao((atual) => ({ ...atual, [id]: !atual[id] }));

    const rotuloDaLinha = (linha: PedidoItem) => {
        const item = getItem(linha.itemId);
        const irmas = linhas.filter((l) => l.itemId === linha.itemId);
        return {
            nome: item?.nome ?? "Item",
            detalhe: detalheDoItem(item),
            unidade: irmas.length > 1 ? `Unidade ${irmas.indexOf(linha) + 1} de ${irmas.length}` : "",
        };
    };

    /* ------------------------------------------------------------------ */
    /*  Destinatário                                                       */
    /* ------------------------------------------------------------------ */

    const termo = busca.trim().toLowerCase();
    const digitos = soDigitos(termo);
    const encontradas = termo
        ? CONTAS.filter((c) => c.email.toLowerCase().includes(termo) || (digitos.length >= 3 && soDigitos(c.cpf).includes(digitos)))
        : [];

    const bloqueioDaConta =
        selecionada && selecionada.id === pedido.compradorId
            ? { titulo: "Esta conta já é a compradora do pedido", descricao: "Busque outra conta para receber os itens." }
            : null;

    /* A segmentação só pode ser checada depois de saber quem recebe. */
    const restricaoDoItem = (segmentacao?: string): string | null => {
        if (!selecionada) return null;
        if (segmentacao === "feminino" && selecionada.genero !== "F") return "restrito ao público feminino";
        if (segmentacao === "socio" && !selecionada.socio) return "exclusivo para sócios";
        return null;
    };
    const restritas = linhas
        .map((linha) => ({ item: getItem(linha.itemId), motivo: restricaoDoItem(getItem(linha.itemId)?.segmentacao) }))
        .filter((r) => r.motivo);

    /* ------------------------------------------------------------------ */
    /*  Formulários: as perguntas vêm do formulário do item                */
    /* ------------------------------------------------------------------ */

    const perguntasDaLinha = (linha: PedidoItem): Pergunta[] =>
        (getFormulario(getItem(linha.itemId)?.formularioId)?.perguntaIds ?? [])
            .map((id) => perguntas.find((p) => p.id === id))
            .filter(Boolean) as Pergunta[];
    const comFormulario = linhas.filter((linha) => perguntasDaLinha(linha).length > 0);
    const valoresDaLinha = (linha: PedidoItem) => respostasPorLinha[linha.id] ?? linha.respostas;
    const respondidas = (linha: PedidoItem) => perguntasDaLinha(linha).filter((p) => (valoresDaLinha(linha)[p.id] ?? "").trim() !== "").length;
    const linhaCompleta = (linha: PedidoItem) => respondidas(linha) === perguntasDaLinha(linha).length;
    const completas = comFormulario.filter(linhaCompleta).length;
    const formularioCompleto = completas === comFormulario.length;
    const alteracoesDaLinha = (linha: PedidoItem) =>
        perguntasDaLinha(linha)
            .map((p) => p.id)
            .filter((id) => (valoresDaLinha(linha)[id] ?? "") !== (linha.respostas[id] ?? ""));

    const copiarRespostas = (origem: PedidoItem, destinos: PedidoItem[]) =>
        setRespostasPorLinha((mapa) => {
            const valores = mapa[origem.id] ?? origem.respostas;
            const proximo = { ...mapa };
            destinos.forEach((linha) => {
                const copia = { ...(proximo[linha.id] ?? linha.respostas) };
                perguntasDaLinha(linha).forEach((p) => {
                    if (p.id in valores) copia[p.id] = valores[p.id];
                });
                proximo[linha.id] = copia;
            });
            return proximo;
        });

    /* ------------------------------------------------------------------ */
    /*  Etapas                                                             */
    /* ------------------------------------------------------------------ */

    const etapas: Etapa[] = [
        ...(selecaoPrevia ? [] : (["itens"] as Etapa[])),
        "destinatario",
        ...(comFormulario.length > 0 ? (["formularios"] as Etapa[]) : []),
        "revisao",
    ];
    const etapa = etapas[Math.min(indice, etapas.length - 1)];
    const progressItems: ProgressIconType[] = etapas.map((e, i) => ({
        title: TITULO_ETAPA[e],
        description: "",
        status: i < indice ? "complete" : i === indice ? "current" : "incomplete",
    }));

    const podeAvancar =
        etapa === "itens"
            ? linhas.length > 0
            : etapa === "destinatario"
              ? Boolean(selecionada) && !bloqueioDaConta && restritas.length === 0
              : etapa === "formularios"
                ? formularioCompleto
                : true;

    const rotuloAvancar =
        etapa === "itens" ? "Escolher destinatário" : etapa === "destinatario" && comFormulario.length > 0 ? "Preencher formulários" : "Ver resumo";

    /* O motivo de o botão estar travado fica ao lado dele. */
    const motivoBloqueio =
        etapa === "itens" && linhas.length === 0
            ? "Marque pelo menos um item."
            : etapa === "destinatario" && !selecionada
              ? "Escolha quem vai receber."
              : etapa === "destinatario" && bloqueioDaConta
                ? "Essa conta já é a compradora do pedido."
                : etapa === "destinatario" && restritas.length > 0
                  ? `${restritas.length} ${restritas.length === 1 ? "item não pode" : "itens não podem"} ir para essa conta.`
                  : null;

    const voltar = () => (indice === 0 ? voltarAoPedido() : setIndice((i) => i - 1));
    const alterarItens = () => (selecaoPrevia ? voltarAoPedido() : setIndice(etapas.indexOf("itens")));

    const confirmar = () => {
        if (!selecionada) return;

        const respostasPorItem = Object.fromEntries(
            comFormulario.filter((linha) => alteracoesDaLinha(linha).length > 0).map((linha) => [linha.id, { ...valoresDaLinha(linha) }]),
        );

        const porItem = new Map<string, number>();
        linhas.forEach((l) => porItem.set(l.itemId, (porItem.get(l.itemId) ?? 0) + 1));
        const detalhes = [
            ...[...porItem.entries()].map(([itemId, quantidade]) => {
                const item = getItem(itemId);
                return [`${quantidade}x ${item?.nome}`, item?.lote, sessaoDoItem(item) ? sessaoLabel(item) : null].filter(Boolean).join(" · ");
            }),
            `De ${titularDaLinha(pedido, linhas[0])?.nome} para ${selecionada.nome} (${selecionada.email})`,
            ...comFormulario.flatMap((linha) => {
                const rotulo = rotuloDaLinha(linha);
                return alteracoesDaLinha(linha).map((id) => {
                    const pergunta = perguntas.find((p) => p.id === id);
                    const prefixo = [rotulo.nome, rotulo.unidade].filter(Boolean).join(" · ");
                    return `${prefixo} | ${pergunta?.label}: ${linha.respostas[id] || "sem resposta"} para ${valoresDaLinha(linha)[id]}`;
                });
            }),
        ];

        criarSolicitacao({
            pedidoId: pedido.id,
            tipo: "troca-titularidade",
            detalhes,
            linhasAfetadas: linhas.map((l) => l.id),
            resumo: `${linhas.length} ${linhas.length === 1 ? "item transferido" : "itens transferidos"} para ${selecionada.nome}. Comprador original preservado.`,
            calculo,
            aplicar: {
                titularPorLinha: Object.fromEntries(linhas.map((l) => [l.id, selecionada.id])),
                respostasPorItem: Object.keys(respostasPorItem).length > 0 ? respostasPorItem : undefined,
            },
            reservas: [],
        });

        voltarAoPedido();
    };

    /* ------------------------------------------------------------------ */
    /*  Render                                                             */
    /* ------------------------------------------------------------------ */

    const colunaEstreita = etapa === "destinatario" || etapa === "revisao";

    return (
        <BackstageLayout showEventContext={false} activeProducer="pedidos">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className={cx("sticky top-[61px] z-20 flex flex-wrap items-center justify-between gap-3 bg-primary_alt px-4 py-4 transition-colors duration-150 md:top-[var(--bs-header-offset,0px)] md:px-6 md:py-5", rolou && "border-b border-secondary")}>
                    <ButtonUtility size="md" color="secondary" icon={ChevronLeft} tooltip="Voltar" onClick={voltar} />
                    <div className="flex flex-col items-center text-center max-md:order-last max-md:w-full md:pointer-events-none md:absolute md:left-1/2 md:-translate-x-1/2">
                        <h1 className="text-display-xs font-bold text-primary">Transferir titularidade</h1>
                        <p className="text-sm text-tertiary">
                            Pedido {uuidCurto(pedido.id)}
                            {linhas.length > 0 && ` · ${linhas.length} ${linhas.length === 1 ? "item" : "itens"}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {motivoBloqueio && <p className="max-w-[220px] text-right text-sm text-tertiary">{motivoBloqueio}</p>}
                        {etapa !== "revisao" ? (
                            <Button size="md" isDisabled={!podeAvancar} onClick={() => setIndice((i) => i + 1)}>
                                {rotuloAvancar}
                            </Button>
                        ) : (
                            <Button size="md" onClick={confirmar}>
                                Gerar link de {formatarMoeda(calculo.total)}
                            </Button>
                        )}
                    </div>
                </header>

                <main className="flex flex-1 flex-col items-center gap-8 px-6 pb-10">
                    <Progress.IconsWithText items={progressItems} type="number" size="sm" orientation="horizontal" className="max-w-[480px] max-md:hidden" />
                    <EtapaCompacta atual={Math.min(indice, etapas.length - 1)} titulos={etapas.map((e) => TITULO_ETAPA[e])} className="md:hidden" />

                    <section className={cx("flex w-full flex-col gap-5", colunaEstreita ? "max-w-md items-center" : "max-w-2xl")}>
                        {etapa === "itens" && (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Regra>Marque o que muda de titular. Quem recebe vem na próxima etapa.</Regra>
                                    {linhasDisponiveis.length > 1 && (
                                        <Button
                                            size="sm"
                                            color="link-color"
                                            onClick={() =>
                                                setSelecao(linhas.length === linhasDisponiveis.length ? {} : Object.fromEntries(linhasDisponiveis.map((l) => [l.id, true])))
                                            }
                                        >
                                            {linhas.length === linhasDisponiveis.length ? "Limpar" : "Selecionar todos"}
                                        </Button>
                                    )}
                                </div>

                                {linhasDisponiveis.length === 0 && <Aviso tom="warning" titulo="Este pedido não tem itens livres para transferir." />}

                                <ul className="flex flex-col gap-2">
                                    {linhasDisponiveis.map((linha) => {
                                        const item = getItem(linha.itemId);
                                        const marcada = Boolean(selecao[linha.id]);
                                        const detalhe = detalheDoItem(item);
                                        return (
                                            <li
                                                key={linha.id}
                                                onClick={() => alternar(linha.id)}
                                                className={cx(
                                                    "flex cursor-pointer items-center gap-3 rounded-xl p-4 ring-1 transition duration-100 ease-linear",
                                                    marcada ? "bg-secondary ring-border-brand" : "bg-primary ring-border-secondary hover:bg-primary_hover",
                                                )}
                                            >
                                                <span onClick={interromper}>
                                                    <Checkbox size="sm" aria-label={`Selecionar ${item?.nome}`} isSelected={marcada} onChange={() => alternar(linha.id)} />
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
                            </>
                        )}

                        {etapa === "destinatario" && (
                            <>
                                <CartaoItens
                                    pedido={pedido}
                                    linhas={linhas}
                                    acao={
                                        <Button size="sm" color="link-color" onClick={alterarItens}>
                                            Alterar
                                        </Button>
                                    }
                                />

                                <SetaParaBaixo />

                                <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                    <Input
                                        icon={SearchLg}
                                        label="E-mail ou CPF de quem vai receber"
                                        placeholder="nome@email.com ou 000.000.000-00"
                                        value={busca}
                                        onChange={(valor) => {
                                            setBusca(valor);
                                            setSelecionada(null);
                                        }}
                                    />
                                    {termo && encontradas.length === 0 ? (
                                        <Aviso titulo="Conta não encontrada" descricao="Confira os dados ou peça o cadastro prévio com esse e-mail." />
                                    ) : (
                                        <Regra>Quem recebe precisa já ter conta na plataforma.</Regra>
                                    )}
                                </div>

                                {encontradas.length > 0 && (
                                    <div className="w-full rounded-2xl bg-primary ring-1 ring-border-secondary">
                                        <div className="px-5 pt-5 pb-3">
                                            <p className="text-base font-semibold text-primary">{encontradas.length === 1 ? "Conta encontrada" : "Contas encontradas"}</p>
                                            <p className="text-sm text-tertiary">Confira o nome e o e-mail antes de continuar.</p>
                                        </div>
                                        <ul className="flex flex-col divide-y divide-border-secondary border-t border-secondary">
                                            {encontradas.map((conta) => {
                                                const ativa = selecionada?.id === conta.id;
                                                return (
                                                    <li key={conta.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelecionada(conta)}
                                                            aria-pressed={ativa}
                                                            className={cx(
                                                                "flex w-full items-center gap-3 px-5 py-4 text-left transition duration-100 ease-linear last:rounded-b-2xl hover:bg-primary_hover",
                                                                ativa && "bg-secondary",
                                                                FOCO,
                                                            )}
                                                        >
                                                            <Avatar size="md" initials={iniciaisDe(conta.nome)} alt={conta.nome} />
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block text-sm font-semibold text-primary">{conta.nome}</span>
                                                                <span className="block truncate text-sm text-tertiary">
                                                                    {conta.email} | CPF {conta.cpf}
                                                                </span>
                                                            </span>
                                                            <RadioButtonBase size="sm" isSelected={ativa} className="shrink-0" />
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                {bloqueioDaConta && (
                                    <div className="w-full">
                                        <Aviso titulo={bloqueioDaConta.titulo} descricao={bloqueioDaConta.descricao} />
                                    </div>
                                )}

                                {selecionada && restritas.length > 0 && (
                                    <div className="w-full">
                                        <Aviso
                                            titulo={`${restritas.length} ${restritas.length === 1 ? "item não pode" : "itens não podem"} ir para ${selecionada.nome}`}
                                            descricao={`${restritas.map((r) => `${r.item?.nome}: ${r.motivo}`).join(" · ")}. Volte à lista e tire ${restritas.length === 1 ? "esse item" : "esses itens"} da seleção, ou escolha outra conta.`}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {etapa === "formularios" && selecionada && (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <Regra>Responda com os dados de {selecionada.nome}. Cada item tem o próprio formulário.</Regra>
                                    <span className={cx("text-sm", formularioCompleto ? "text-success-primary" : "text-tertiary")}>
                                        <span className="font-semibold tabular-nums">
                                            {completas} de {comFormulario.length}
                                        </span>{" "}
                                        {comFormulario.length === 1 ? "formulário completo" : "formulários completos"}
                                    </span>
                                </div>

                                <ul className="flex flex-col gap-2">
                                    {comFormulario.map((linha, posicao) => {
                                        const rotulo = rotuloDaLinha(linha);
                                        const item = getItem(linha.itemId);
                                        const perguntasDoItem = perguntasDaLinha(linha);
                                        const abertoId = aberta ?? comFormulario[0].id;
                                        const aberto = abertoId === linha.id;
                                        const feitas = respondidas(linha);
                                        const completa = feitas === perguntasDoItem.length;
                                        const anterior = comFormulario[posicao - 1];
                                        const outras = comFormulario.filter((l) => l.id !== linha.id);

                                        return (
                                            <li key={linha.id} className="rounded-xl bg-primary ring-1 ring-border-secondary">
                                                <button
                                                    type="button"
                                                    aria-expanded={aberto}
                                                    onClick={() => setAberta(aberto ? "" : linha.id)}
                                                    className={cx(
                                                        "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover",
                                                        aberto && "rounded-b-none border-b border-secondary",
                                                        FOCO,
                                                    )}
                                                >
                                                    {item && <Miniatura item={item} />}
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-semibold text-primary">
                                                            {rotulo.nome}
                                                            {rotulo.unidade && <span className="font-normal text-tertiary"> · {rotulo.unidade}</span>}
                                                        </span>
                                                        {rotulo.detalhe && <span className="block truncate text-sm text-tertiary">{rotulo.detalhe}</span>}
                                                    </span>
                                                    <span className={cx("shrink-0 text-sm tabular-nums", completa ? "text-success-primary" : "text-warning-primary")}>
                                                        {feitas} de {perguntasDoItem.length} respondidas
                                                    </span>
                                                    <ChevronDown
                                                        className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear", aberto && "rotate-180")}
                                                        aria-hidden="true"
                                                    />
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
                                                            <div className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto px-4 py-4">
                                                                {perguntasDoItem.map((pergunta) => (
                                                                    <EditorResposta
                                                                        key={pergunta.id}
                                                                        pergunta={pergunta}
                                                                        valor={valoresDaLinha(linha)[pergunta.id] ?? ""}
                                                                        valorOriginal={linha.respostas[pergunta.id] ?? ""}
                                                                        onChange={(valor) =>
                                                                            setRespostasPorLinha((mapa) => ({
                                                                                ...mapa,
                                                                                [linha.id]: { ...valoresDaLinha(linha), [pergunta.id]: valor },
                                                                            }))
                                                                        }
                                                                    />
                                                                ))}
                                                            </div>

                                                            {outras.length > 0 && (
                                                                <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-secondary px-4 py-3">
                                                                    {anterior && (
                                                                        <Button size="sm" color="link-gray" iconLeading={Copy01} onClick={() => copiarRespostas(anterior, [linha])}>
                                                                            Repetir respostas do item anterior
                                                                        </Button>
                                                                    )}
                                                                    <Button size="sm" color="link-color" onClick={() => copiarRespostas(linha, outras)}>
                                                                        Aplicar estas respostas {outras.length === 1 ? "ao outro item" : `aos outros ${outras.length} itens`}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </>
                        )}

                        {etapa === "revisao" && selecionada && (
                            <>
                                <CartaoItens pedido={pedido} linhas={linhas} />

                                <SetaParaBaixo />

                                <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                    <div>
                                        <p className="text-base font-semibold text-primary">Tudo certo para transferir?</p>
                                        <p className="mt-1 text-sm text-tertiary">
                                            {linhas.length === 1 ? "Este item passa" : `Estes ${linhas.length} itens passam`} de{" "}
                                            <span className="font-medium text-primary">{titularDaLinha(pedido, linhas[0])?.nome}</span> para{" "}
                                            <span className="font-medium text-primary">{selecionada.nome}</span> assim que o link for pago.{" "}
                                            {getConta(pedido.compradorId)?.nome} continua como comprador do pedido.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-xl bg-secondary p-4">
                                        <Avatar size="md" initials={iniciaisDe(selecionada.nome)} alt={selecionada.nome} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-primary">{selecionada.nome}</p>
                                            <p className="truncate text-sm text-tertiary">{selecionada.email}</p>
                                        </div>
                                    </div>

                                    {comFormulario.some((linha) => alteracoesDaLinha(linha).length > 0) && (
                                        <div className="flex flex-col gap-3 border-t border-secondary pt-4">
                                            <p className="text-sm font-semibold text-primary">Respostas alteradas</p>
                                            {comFormulario
                                                .filter((linha) => alteracoesDaLinha(linha).length > 0)
                                                .map((linha) => {
                                                    const rotulo = rotuloDaLinha(linha);
                                                    return (
                                                        <div key={linha.id}>
                                                            <p className="text-sm text-tertiary">{[rotulo.nome, rotulo.unidade].filter(Boolean).join(" · ")}</p>
                                                            {alteracoesDaLinha(linha).map((id) => (
                                                                <ComparativoResposta
                                                                    key={id}
                                                                    pergunta={perguntas.find((p) => p.id === id)}
                                                                    de={linha.respostas[id]}
                                                                    para={valoresDaLinha(linha)[id]}
                                                                />
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>

                                <div className="w-full">
                                    <ResumoFinanceiro linhas={calculo.linhas} />
                                </div>
                            </>
                        )}
                    </section>
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Peças no estilo da carteira                                        */
/* ------------------------------------------------------------------ */

/** O que está sendo transferido, como um ingresso: evento, item e um picote antes dos detalhes. */
const CartaoItens = ({ pedido, linhas, acao }: { pedido: Pedido; linhas: PedidoItem[]; acao?: ReactNode }) => {
    const evento = getEvento(pedido.eventoId);
    const grupos = new Map<string, { item?: CatalogoItem; quantidade: number; total: number }>();
    linhas.forEach((linha) => {
        const atual = grupos.get(linha.itemId) ?? { item: getItem(linha.itemId), quantidade: 0, total: 0 };
        atual.quantidade++;
        atual.total += linha.valorPago;
        grupos.set(linha.itemId, atual);
    });
    const lista = [...grupos.values()];
    const unico = linhas.length === 1 ? lista[0] : undefined;
    const total = linhas.reduce((soma, l) => soma + l.valorPago, 0);

    return (
        <div className="w-full overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
                <div className="min-w-0">
                    <p className="text-sm text-tertiary">{evento?.nome}</p>
                    <p className="mt-1 text-xl font-semibold text-primary">{unico ? unico.item?.nome : `${linhas.length} itens do pedido`}</p>
                    <p className="text-sm text-tertiary">{unico ? detalheDoItem(unico.item) || `Pedido ${uuidCurto(pedido.id)}` : `Pedido ${uuidCurto(pedido.id)} · ${formatarMoeda(total)}`}</p>
                </div>
                {acao}
            </div>

            <Picote />

            <div className="px-5 pt-3 pb-5">
                {unico ? (
                    <p className="text-sm text-tertiary">O item será reemitido e ficará vinculado ao CPF de quem receber.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {lista.map(({ item, quantidade, total: subtotal }) => {
                            const detalhe = detalheDoItem(item);
                            return (
                                <li key={item?.id ?? quantidade} className="flex items-baseline justify-between gap-3">
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium text-primary">
                                            {quantidade}x {item?.nome}
                                        </span>
                                        {detalhe && <span className="block text-sm text-tertiary">{detalhe}</span>}
                                    </span>
                                    <span className="shrink-0 text-sm text-tertiary tabular-nums">{formatarMoeda(subtotal)}</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

/** Divisor picotado: os círculos usam o fundo da página e são cortados pelo overflow do cartão. */
const Picote = () => (
    <div className="relative h-5" aria-hidden="true">
        <span className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full bg-primary_alt ring-1 ring-border-secondary" />
        <span className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full bg-primary_alt ring-1 ring-border-secondary" />
        <span className="absolute top-1/2 right-5 left-5 border-t border-dashed border-secondary" />
    </div>
);

const SetaParaBaixo = () => (
    <span className="flex size-11 items-center justify-center rounded-full bg-primary shadow-xs ring-1 ring-border-secondary" aria-hidden="true">
        <ArrowDown className="size-5 text-fg-secondary" />
    </span>
);
