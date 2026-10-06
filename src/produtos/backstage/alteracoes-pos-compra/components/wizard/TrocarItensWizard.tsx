import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowDown, Calendar, ChevronDown, SearchLg } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { InputBase } from "@/components/base/input/input";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { cx } from "@/utils/cx";
import { Aviso, CampoMotivo, FOCO, MOTIVO_INICIAL, Miniatura, Regra, ResumoFinanceiro, SetaParaBaixo, Stepper, mascararEmail } from "../pos-compra-ui";
import { EditorResposta } from "../respostas-ui";
import {
    OPERADOR_ATUAL,
    SESSOES,
    TIPO_OPERACAO_LABEL,
    calcularTrocaItens,
    criarSolicitacao,
    disponivelPara,
    formatarMoeda,
    getConta,
    getFormulario,
    getItem,
    getRascunho,
    motivoValido,
    novoRascunhoId,
    parearTroca,
    removerRascunho,
    salvarRascunho,
    sessaoLabel,
    useCatalogo,
    usePerguntas,
    useRascunhos,
    uuidCurto,
    validarTrocaItem,
    type CatalogoItem,
    type Motivo,
    type Pedido,
    type PedidoItem,
    type Pergunta,
    type Rascunho,
} from "../../data/pos-compra-store";
import { WizardShell } from "./WizardShell";
import { ResumoUnidades, SeletorUnidades, avisarRascunhoSalvo, detalheDoItem, identidadeDaLinha } from "./seletor-unidades";

type Etapa = "saem" | "entram" | "formularios" | "revisao";

const TITULO_ETAPA: Record<Etapa, string> = {
    saem: "Itens que saem",
    entram: "Itens que entram",
    formularios: "Formulários",
    revisao: "Revisão",
};

const combina = (termo: string, ...campos: Array<string | undefined>) => {
    const busca = termo.trim().toLowerCase();
    if (!busca) return true;
    return campos.some((campo) => campo?.toLowerCase().includes(busca));
};

const interromper = (event: MouseEvent) => event.stopPropagation();

interface TrocarItensWizardProps {
    pedido: Pedido;
    linhasIniciais: string[];
    /** Retomando um rascunho salvo: chega com a seleção, os destinos, as respostas e o motivo. */
    rascunhoInicial?: Rascunho;
    onFechar: () => void;
    /** Cobrança criada: o pedido rola até o cartão novo. */
    onEnviado: (solicitacaoId: string) => void;
}

export function TrocarItensWizard({ pedido, linhasIniciais, rascunhoInicial, onFechar, onEnviado }: TrocarItensWizardProps) {
    const catalogo = useCatalogo();
    const perguntas = usePerguntas();
    const rascunhos = useRascunhos(pedido.id);
    const rascunhoId = useState(() => rascunhoInicial?.id ?? novoRascunhoId())[0];

    const linhasDisponiveis = pedido.itens.filter((l) => disponivelPara(pedido, l, "trocar"));
    const pedidas = rascunhoInicial?.linhasSelecionadas ?? linhasIniciais;
    const perdidas = rascunhoInicial ? pedidas.filter((id) => !linhasDisponiveis.some((l) => l.id === id)).length : 0;

    const [indice, setIndice] = useState(() => (linhasDisponiveis.some((l) => linhasIniciais.includes(l.id)) ? 1 : 0));
    const [termo, setTermo] = useState("");
    const [motivo, setMotivo] = useState<Motivo>(rascunhoInicial?.motivo ?? MOTIVO_INICIAL);
    const [saem, setSaem] = useState<Record<string, boolean>>(() => Object.fromEntries(pedidas.map((id) => [id, true])));
    const [entram, setEntram] = useState<Record<string, number>>(() => {
        const contagem: Record<string, number> = {};
        Object.values(rascunhoInicial?.destinoPorLinha ?? {}).forEach((itemId) => {
            contagem[itemId] = (contagem[itemId] ?? 0) + 1;
        });
        return contagem;
    });
    /* Respostas por unidade, não por item: duas pessoas trocando para o mesmo item continuam
       com as próprias respostas. */
    const [respostasEntram, setRespostasEntram] = useState<Record<string, Record<string, string>>>(rascunhoInicial?.respostasPorLinha ?? {});
    const comprador = getConta(pedido.compradorId);
    /* A cobrança da troca vai para o e-mail do comprador do pedido. */
    const destino = comprador?.email ?? "";

    /* ------------------------------------------------------------------ */
    /*  O que sai                                                          */
    /* ------------------------------------------------------------------ */

    const linhasSaem = linhasDisponiveis.filter((l) => saem[l.id]);
    const totalSaem = linhasSaem.length;
    const emOutroRascunho = rascunhos.find((r) => r.id !== rascunhoId && r.linhasSelecionadas.some((id) => saem[id]));
    const incluir = (ids: string[]) => setSaem((atual) => ({ ...atual, ...Object.fromEntries(ids.map((id) => [id, true])) }));

    /* ------------------------------------------------------------------ */
    /*  O que entra                                                        */
    /* ------------------------------------------------------------------ */

    const candidatos = catalogo.filter((i) => i.eventoId === pedido.eventoId && combina(termo, i.nome, i.grupo, i.lote, i.descricao, sessaoLabel(i)));
    const sessoes = SESSOES.filter((s) => s.eventoId === pedido.eventoId)
        .sort((a, b) => a.inicio - b.inicio)
        .map((sessao) => {
            const grupos = new Map<string, CatalogoItem[]>();
            candidatos.filter((i) => i.sessaoId === sessao.id).forEach((item) => grupos.set(item.grupo ?? "Outros", [...(grupos.get(item.grupo ?? "Outros") ?? []), item]));
            return { sessao, grupos: [...grupos.entries()] };
        })
        .filter(({ grupos }) => grupos.length > 0);
    const produtos = candidatos.filter((i) => !i.sessaoId && i.tipo === "produto");
    const combos = candidatos.filter((i) => !i.sessaoId && i.tipo === "combo");

    const referenciaDoItem = (item: CatalogoItem) => linhasSaem.find((l) => getItem(l.itemId)?.tipo === item.tipo) ?? linhasSaem[0];

    const noPedidoPorItem = new Map<string, number>();
    pedido.itens.forEach((l) => noPedidoPorItem.set(l.itemId, (noPedidoPorItem.get(l.itemId) ?? 0) + 1));
    const saindoPorItem = new Map<string, number>();
    linhasSaem.forEach((l) => saindoPorItem.set(l.itemId, (saindoPorItem.get(l.itemId) ?? 0) + 1));
    const precoSaida = new Set(linhasSaem.map((l) => l.valorPago)).size === 1 ? linhasSaem[0]?.valorPago : undefined;

    const itensQueEntram = Object.entries(entram).filter(([, q]) => q > 0);
    const totalEntram = itensQueEntram.reduce((soma, [, q]) => soma + q, 0);
    const destinosItens = itensQueEntram.flatMap(([itemId, q]) => {
        const item = getItem(itemId);
        return item ? Array.from({ length: q }, () => item) : [];
    });
    const pares = parearTroca(linhasSaem, destinosItens);
    const calculo = pares.length > 0 && totalEntram === totalSaem ? calcularTrocaItens(pares) : null;
    const selecaoIgual =
        totalSaem > 0 &&
        linhasSaem
            .map((l) => l.itemId)
            .sort()
            .join("|") ===
            itensQueEntram
                .flatMap(([id, q]) => Array<string>(q).fill(id))
                .sort()
                .join("|");

    /* ------------------------------------------------------------------ */
    /*  Formulários: herdados da unidade que sai, nada inventado           */
    /* ------------------------------------------------------------------ */

    const perguntasDoItem = (item?: CatalogoItem) => (getFormulario(item?.formularioId)?.perguntaIds ?? []).map((id) => perguntas.find((p) => p.id === id)).filter(Boolean) as Pergunta[];
    /* A pessoa é a mesma: as perguntas em comum vêm das respostas dela; as novas começam em
       branco e são obrigatórias. Antes o item que entrava nascia com respostas inventadas
       (primeira opção com estoque, um "atestado-medico.pdf") e a etapa já aparecia completa. */
    const valoresDoPar = (linha: PedidoItem, novoItem: CatalogoItem) => {
        const herdadas = Object.fromEntries(perguntasDoItem(novoItem).flatMap((p) => (linha.respostas[p.id] ? [[p.id, linha.respostas[p.id]]] : [])));
        return { ...herdadas, ...(respostasEntram[linha.id] ?? {}) };
    };
    const faltando = (linha: PedidoItem, novoItem: CatalogoItem) => perguntasDoItem(novoItem).filter((p) => !(valoresDoPar(linha, novoItem)[p.id] ?? "").trim());
    const paresComFormulario = pares.filter(({ novoItem }) => perguntasDoItem(novoItem).length > 0);
    const paresIncompletos = paresComFormulario.filter(({ linha, novoItem }) => faltando(linha, novoItem).length > 0);
    const [precisaFormulario, setPrecisaFormulario] = useState(false);

    /* ------------------------------------------------------------------ */
    /*  Etapas                                                             */
    /* ------------------------------------------------------------------ */

    /* A etapa de formulários só existe quando o item que entra tem pergunta sem resposta. Ela
       fica fixa depois de entrar no fluxo, para o stepper não mudar de tamanho enquanto a pessoa
       responde. */
    const comFormularios = precisaFormulario || paresIncompletos.length > 0;
    const etapas: Etapa[] = ["saem", "entram", ...(comFormularios ? (["formularios"] as Etapa[]) : []), "revisao"];
    const etapa = etapas[Math.min(indice, etapas.length - 1)];

    useEffect(() => {
        if (!rascunhoInicial) return;
        const alvo = etapas.indexOf(rascunhoInicial.etapa as Etapa);
        if (alvo >= 0) setIndice(alvo);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const podeAvancar =
        etapa === "saem"
            ? totalSaem > 0
            : etapa === "entram"
              ? totalSaem > 0 && totalEntram === totalSaem && !selecaoIgual
              : etapa === "formularios"
                ? paresIncompletos.length === 0
                : Boolean(calculo) && motivoValido(motivo);

    const rotuloAvancar = etapa === "saem" ? "Escolher o que entra" : etapa === "entram" && comFormularios ? "Responder formulários" : "Revisar troca";

    const salvarProgresso = (proximaEtapa: string) => {
        const destinoPorLinha: Record<string, string> = {};
        pares.forEach(({ linha, novoItem }) => (destinoPorLinha[linha.id] = novoItem.id));
        salvarRascunho({
            id: rascunhoId,
            pedidoId: pedido.id,
            tipo: "troca-item",
            etapa: proximaEtapa,
            linhasSelecionadas: linhasSaem.map((l) => l.id),
            destinoPorLinha,
            respostasPorLinha: respostasEntram,
            motivo,
            operador: OPERADOR_ATUAL,
        });
    };

    const fechar = () => {
        const fezAlgo = Boolean(rascunhoInicial || totalEntram > 0 || motivo.nota.trim() || Object.keys(respostasEntram).length);
        if (fezAlgo && totalSaem > 0) {
            salvarProgresso(etapa);
            avisarRascunhoSalvo(getRascunho(rascunhoId));
        }
        onFechar();
    };

    const avancar = () => {
        if (etapa === "entram" && paresIncompletos.length > 0) setPrecisaFormulario(true);
        salvarProgresso(etapas[Math.min(indice + 1, etapas.length - 1)]);
        setIndice((i) => i + 1);
    };
    const voltar = () => (indice === 0 ? fechar() : setIndice((i) => i - 1));

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
            onChange={(valor) => setEntram((atual) => (totalSaem === 1 ? (valor > 0 ? { [item.id]: valor } : {}) : { ...atual, [item.id]: valor }))}
            onTodas={() => setEntram({ [item.id]: totalSaem })}
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
                    <ul className="flex flex-col divide-y divide-border-secondary">{itens.map(cartaoCatalogo)}</ul>
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
        const detalhes = pares.map(({ linha, novoItem }) => `${getItem(linha.itemId)?.nome} para ${novoItem.nome} · ${identidadeDaLinha(pedido, linha).nome}`);
        const respostasPorItem = Object.fromEntries(paresComFormulario.map(({ linha, novoItem }) => [linha.id, valoresDoPar(linha, novoItem)]));

        const id = criarSolicitacao({
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
            canalEnvio: "email",
            destinatarioEnvio: destino,
            motivo,
        });
        if (!id) {
            toast.error("Uma das unidades entrou em outra alteração enquanto você montava esta. Confira o pedido e tente de novo.");
            return;
        }
        removerRascunho(rascunhoId);
        toast.success(`Cobrança de troca enviada para ${destino}.`);
        onEnviado(id);
    };

    const cortesia = linhasSaem.some((l) => l.valorPago === 0);

    return (
        <WizardShell
            isOpen
            onClose={fechar}
            titulo="Trocar"
            subtitulo={`${comprador?.nome ?? "Comprador"} · Pedido ${uuidCurto(pedido.id)}`}
            etapas={etapas.map((e) => TITULO_ETAPA[e])}
            indiceAtual={indice}
            podeAvancar={podeAvancar}
            rotuloAvancar={rotuloAvancar}
            ultimaEtapa={etapa === "revisao"}
            rotuloConfirmar={calculo ? `Enviar cobrança de ${formatarMoeda(calculo.total)} para ${mascararEmail(destino)}` : "Enviar cobrança"}
            onVoltar={voltar}
            onAvancar={avancar}
            onConfirmar={confirmar}
        >
            {perdidas > 0 && (
                <Aviso tom="warning" titulo={perdidas === 1 ? "1 unidade saiu desta troca" : `${perdidas} unidades saíram desta troca`} descricao="Elas já estão em outra alteração, com outro titular ou a sessão já aconteceu." />
            )}
            {emOutroRascunho && (
                <Aviso tom="warning" titulo={`Unidade também está num rascunho de ${TIPO_OPERACAO_LABEL[emOutroRascunho.tipo].toLowerCase()}`} descricao={`Não enviado, de ${emOutroRascunho.operador}. Rascunho não trava a unidade: quem enviar primeiro vale.`} />
            )}

            {etapa === "saem" && (
                <>
                    <Regra>Marque o que sai do pedido. O que entra vem na próxima etapa.</Regra>
                    <SeletorUnidades pedido={pedido} verbo="trocar" selecao={saem} onChange={setSaem} />
                </>
            )}

            {etapa === "entram" && (
                <>
                    <ResumoUnidades pedido={pedido} linhas={linhasSaem} verbo="trocar" titulo={`Trocando (${totalSaem})`} onAlterar={() => setIndice(0)} onIncluir={incluir} />
                    <SetaParaBaixo />

                    {/* Com uma unidade só, o rádio do item já diz o que foi escolhido: instrução e
                        contador só aparecem quando há unidades para distribuir. */}
                    {totalSaem > 1 && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Regra>Clique num item para trocar todas as unidades por ele, ou distribua pelas quantidades.</Regra>
                            <span className={cx("text-sm tabular-nums", totalEntram === totalSaem ? "text-success-primary" : "text-tertiary")}>
                                <span className="font-semibold">
                                    {totalEntram} de {totalSaem}
                                </span>{" "}
                                {totalEntram === totalSaem ? "escolhidos" : `escolhidos · faltam ${totalSaem - totalEntram}`}
                            </span>
                        </div>
                    )}

                    <InputBase size="sm" icon={SearchLg} value={termo} aria-label="Buscar item" onChange={(evento) => setTermo(evento.target.value)} placeholder="Busque por sessão, grupo, lote ou item" />

                    {selecaoIgual && <Aviso titulo="A seleção é igual ao que já está no pedido" descricao="Escolha pelo menos um item diferente para a troca fazer sentido." />}

                    {candidatos.length === 0 && <p className="rounded-xl bg-primary px-4 py-8 text-center text-sm text-tertiary ring-1 ring-border-secondary">Nenhum item encontrado para a busca.</p>}

                    {sessoes.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {(produtos.length > 0 || combos.length > 0) && <p className="px-1 text-sm font-semibold text-secondary">Ingressos</p>}
                            {sessoes.map((entrada, i) => renderSessao(entrada, i === 0))}
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
                                <ul className="flex flex-col divide-y divide-border-secondary overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">{secao.itens.map(cartaoCatalogo)}</ul>
                            </div>
                        ))}
                </>
            )}

            {etapa === "formularios" && (
                <>
                    <Regra>As respostas que já existiam vêm da unidade que sai. Só as perguntas novas do item que entra precisam de resposta.</Regra>
                    {paresComFormulario.map(({ linha, novoItem }, posicao) => {
                        const pendentes = faltando(linha, novoItem);
                        const { nome } = identidadeDaLinha(pedido, linha);
                        return (
                            <Accordion
                                key={linha.id}
                                defaultOpen={pendentes.length > 0 && posicao === paresComFormulario.findIndex((p) => faltando(p.linha, p.novoItem).length > 0)}
                                cabecalho={
                                    <span className="flex min-w-0 flex-1 items-center gap-3">
                                        <Miniatura item={novoItem} />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-primary">{novoItem.nome}</span>
                                            <span className="block truncate text-sm text-tertiary">{nome}</span>
                                        </span>
                                        <span className={cx("shrink-0 text-sm", pendentes.length === 0 ? "text-success-primary" : "text-warning-primary")}>
                                            {pendentes.length === 0 ? "Respondido" : pendentes.length === 1 ? "Falta 1 resposta" : `Faltam ${pendentes.length} respostas`}
                                        </span>
                                    </span>
                                }
                            >
                                <div className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto p-4">
                                    {perguntasDoItem(novoItem).map((pergunta) => (
                                        <EditorResposta
                                            key={pergunta.id}
                                            pergunta={pergunta}
                                            valor={valoresDoPar(linha, novoItem)[pergunta.id] ?? ""}
                                            valorOriginal={linha.respostas[pergunta.id] ?? ""}
                                            onChange={(valor) => setRespostasEntram((atual) => ({ ...atual, [linha.id]: { ...(atual[linha.id] ?? {}), [pergunta.id]: valor } }))}
                                        />
                                    ))}
                                </div>
                            </Accordion>
                        );
                    })}
                </>
            )}

            {etapa === "revisao" && calculo && (
                <>
                    <div className="w-full overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                        <div className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-3">
                            <p className="text-sm font-semibold text-primary">Trocando</p>
                        </div>
                        <ul className="flex flex-col divide-y divide-border-secondary">
                            {pares.map(({ linha, novoItem }) => {
                                const itemSai = getItem(linha.itemId);
                                return (
                                    <li key={linha.id} className="flex flex-col gap-1.5 p-4">
                                        <p className="text-sm font-medium text-primary">{identidadeDaLinha(pedido, linha).nome}</p>
                                        <p className="text-sm text-tertiary line-through">
                                            {itemSai?.nome}
                                            {detalheDoItem(itemSai) && ` · ${detalheDoItem(itemSai)}`}
                                        </p>
                                        <ArrowDown className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                        <p className="text-sm font-semibold text-primary">
                                            {novoItem.nome}
                                            {detalheDoItem(novoItem) && <span className="font-normal text-tertiary"> · {detalheDoItem(novoItem)}</span>}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {pares.length > 1 && <Regra>Quando as unidades pagaram valores diferentes, o sistema forma os pares do jeito que resulta no menor total.</Regra>}
                    {calculo.semCredito && <Aviso tom="warning" titulo="Há itens mais baratos na troca." descricao="A diferença deles não gera crédito nem reembolso." />}
                    {pedido.cupom && (calculo.descontoPerdido ?? 0) > 0 && (
                        <Aviso tom="warning" titulo={`Inclui ${formatarMoeda(calculo.descontoPerdido ?? 0)} do cupom ${pedido.cupom}`} descricao="O desconto da compra não vale para o item novo: a diferença usa o preço cheio dele." />
                    )}
                    {cortesia && <Aviso tom="warning" titulo="Há cortesia na troca." descricao="Unidade de cortesia não tem valor pago: a diferença é o preço cheio do item novo." />}

                    <CampoMotivo valor={motivo} onChange={setMotivo} />

                    <ResumoFinanceiro linhas={calculo.linhas} />
                    <Regra>As vagas ficam reservadas por 1 hora. Nada é aplicado antes do pagamento. O link vai para {destino}.</Regra>
                </>
            )}
        </WizardShell>
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
    onTodas,
}: {
    item: CatalogoItem;
    pedido: Pedido;
    linhaReferencia?: PedidoItem;
    quantidade: number;
    restante: number;
    totalSaem: number;
    precoSaida?: number;
    noPedido: number;
    saindo: number;
    onChange: (valor: number) => void;
    /** Várias unidades saindo: um clique no item troca todas por ele, sem mexer no stepper. */
    onTodas: () => void;
}) => {
    const impedimento = linhaReferencia ? validarTrocaItem(pedido, linhaReferencia, item) : null;
    const bloqueado = Boolean(impedimento) && impedimento?.curto !== "Item atual";
    const maximo = bloqueado ? 0 : Math.min(item.estoque, quantidade + Math.max(0, restante), Math.max(0, totalSaem - saindo));
    const unico = totalSaem === 1;
    const itemAtual = saindo > 0 && saindo === totalSaem;
    const naoSelecionavel = bloqueado || itemAtual;
    const escolhido = quantidade > 0;
    const diferenca = precoSaida !== undefined ? item.precoIntegral - precoSaida : undefined;
    const estoqueCurto = !bloqueado && item.estoque < totalSaem;

    return (
        <li
            onClick={naoSelecionavel ? undefined : unico ? () => onChange(escolhido ? 0 : 1) : item.estoque >= totalSaem ? onTodas : undefined}
            aria-pressed={unico ? escolhido : undefined}
            className={cx(
                "flex flex-col gap-3 p-4 transition duration-100 ease-linear sm:flex-row sm:items-center sm:justify-between",
                naoSelecionavel ? "opacity-60" : escolhido && "bg-secondary",
                !naoSelecionavel && (unico || item.estoque >= totalSaem) && "cursor-pointer hover:bg-primary_hover",
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
                            {saindo > 0 && <Badge size="md" type="pill-color" color="gray">{saindo === 1 ? "Item sendo trocado" : `${saindo} itens sendo trocados`}</Badge>}
                            {saindo === 0 && noPedido > 0 && <Badge size="md" type="pill-color" color="blue">{noPedido === 1 ? "1 igual no pedido" : `${noPedido} iguais no pedido`}</Badge>}
                            {bloqueado && <Badge size="md" type="pill-color" color="error">{impedimento?.curto}</Badge>}
                            {estoqueCurto && <Badge size="md" type="pill-color" color="warning">Só {item.estoque} {item.estoque === 1 ? "disponível" : "disponíveis"}</Badge>}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="sm:text-right">
                    <p className="text-sm font-semibold text-primary tabular-nums">{formatarMoeda(item.precoIntegral)}</p>
                    {!bloqueado && diferenca !== undefined && diferenca !== 0 && (
                        <p className="text-sm text-tertiary tabular-nums">{diferenca > 0 ? `+${formatarMoeda(diferenca)} por unidade` : `${formatarMoeda(diferenca)} por unidade`}</p>
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

const CabecalhoSessao = ({ sessao }: { sessao: { dataLabel: string; horaLabel: string; inicio: number } }) => (
    <div className="flex items-center gap-2 px-1 pt-1">
        <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
        <span className="text-sm font-semibold text-secondary first-letter:uppercase">{sessao.dataLabel}, {sessao.horaLabel}</span>
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
                className={cx("flex w-full items-center gap-2 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover", aberto && "border-b border-secondary", FOCO)}
            >
                {cabecalho}
                <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear", aberto && "rotate-180")} aria-hidden="true" />
            </button>
            <AnimatePresence initial={false}>
                {aberto && (
                    <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};
