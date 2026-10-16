import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowDown, ChevronDown, SearchLg } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { InputBase } from "@/components/base/input/input";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { Tabs } from "@/components/application/tabs/tabs";
import { cx } from "@/utils/cx";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Aviso, CampoMotivo, FOCO, MOTIVO_INICIAL, Miniatura, Regra, ResumoFinanceiro, Stepper, mascararEmail } from "../pos-compra-ui";
import { AbasCarrossel, ChipLegenda, type AbaItem } from "../abas-carrossel";
import { EditorResposta } from "../respostas-ui";
import {
    PRAZO_REAL_LABEL,
    SESSOES,
    calcularTrocaItens,
    criarSolicitacao,
    disponivelPara,
    formatarMoeda,
    getConta,
    getFormulario,
    getItem,
    motivoValido,
    parearTroca,
    sessaoLabel,
    useCatalogo,
    usePerguntas,
    uuidCurto,
    validarTrocaItem,
    type CatalogoItem,
    type Motivo,
    type TipoItem,
    type Pedido,
    type PedidoItem,
    type Pergunta,
} from "../../data/pos-compra-store";
import { WizardShell } from "./WizardShell";
import { SeletorUnidades, detalheDoItem, identidadeDaLinha } from "./seletor-unidades";

type Etapa = "saem" | "entram" | "formularios" | "revisao";

const TITULO_ETAPA: Record<Etapa, string> = {
    saem: "Itens atuais",
    entram: "Novos itens",
    formularios: "Formulários",
    revisao: "Revisão",
};

const ROTULO_TIPO: Record<TipoItem, string> = { ingresso: "Ingressos", produto: "Produtos", combo: "Combos" };
/** O mesmo tipo no singular, para a frase que diz o que a busca não achou. */
const ROTULO_TIPO_SINGULAR: Record<TipoItem, string> = { ingresso: "ingresso", produto: "produto", combo: "combo" };

/** Partes da data para o chip: dia da semana em cima, dia e mês em destaque. */
const partesDaSessao = (inicio: number) => {
    const d = new Date(inicio);
    return {
        diaSemana: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        dia: d.toLocaleDateString("pt-BR", { day: "2-digit" }),
        mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    };
};

const combina = (termo: string, ...campos: Array<string | undefined>) => {
    const busca = termo.trim().toLowerCase();
    if (!busca) return true;
    return campos.some((campo) => campo?.toLowerCase().includes(busca));
};

/** Teto de unidades de um item: o estoque, o que ainda falta escolher e o que sai do pedido.
 *  Mora aqui porque a linha do catálogo e o bloco de escolhidos precisam do mesmo número. */
const tetoDoItem = (item: CatalogoItem, quantidade: number, restante: number, totalSaem: number, saindo: number) =>
    Math.min(item.estoque, quantidade + Math.max(0, restante), Math.max(0, totalSaem - saindo));

const contar = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

/** Bloqueio que depende de QUEM é a unidade que sai. "Esgotado" e "Sessão encerrada" são do
 *  item: tirar alguém da troca não libera nenhum dos dois, e oferecer isso seria mentira. */
const BLOQUEIO_DA_UNIDADE = new Set(["Sessão realizada", "Já vinculado", "Restrito"]);

interface TrocarItensWizardProps {
    pedido: Pedido;
    linhasIniciais: string[];
    onFechar: () => void;
    /** Cobrança criada: o pedido rola até o cartão novo. */
    onEnviado: (solicitacaoId: string) => void;
}

export function TrocarItensWizard({ pedido, linhasIniciais, onFechar, onEnviado }: TrocarItensWizardProps) {
    const catalogo = useCatalogo();
    const perguntas = usePerguntas();
    const linhasDisponiveis = pedido.itens.filter((l) => disponivelPara(pedido, l, "trocar"));

    const [indice, setIndice] = useState(() => (linhasDisponiveis.some((l) => linhasIniciais.includes(l.id)) ? 1 : 0));
    const [termo, setTermo] = useState("");
    const [aba, setAba] = useState("");
    const [tipo, setTipo] = useState<TipoItem>("ingresso");
    /* Aba de tipo que a busca trocou sozinha, para a tela dizer que trocou. */
    const [trocaDeTipo, setTrocaDeTipo] = useState<{ de: TipoItem; para: TipoItem } | null>(null);
    const [motivo, setMotivo] = useState<Motivo>(MOTIVO_INICIAL);
    const [aceitouSobra, setAceitouSobra] = useState(false);
    const [saem, setSaem] = useState<Record<string, boolean>>(() => Object.fromEntries(linhasIniciais.map((id) => [id, true])));
    const [entram, setEntram] = useState<Record<string, number>>({});
    /* Respostas por unidade, não por item: duas pessoas trocando para o mesmo item continuam
       com as próprias respostas. */
    const [respostasEntram, setRespostasEntram] = useState<Record<string, Record<string, string>>>({});
    const comprador = getConta(pedido.compradorId);
    /* A cobrança da troca vai para o e-mail do comprador do pedido. */
    const destino = comprador?.email ?? "";

    /* ------------------------------------------------------------------ */
    /*  O que sai                                                          */
    /* ------------------------------------------------------------------ */

    const linhasSaem = linhasDisponiveis.filter((l) => saem[l.id]);
    const totalSaem = linhasSaem.length;

    /* ------------------------------------------------------------------ */
    /*  O que entra                                                        */
    /* ------------------------------------------------------------------ */

    const doEvento = catalogo.filter((i) => i.eventoId === pedido.eventoId);
    /* As abas de tipo saem do catálogo inteiro, não do resultado da busca: senão sumiriam
       debaixo do dedo enquanto a pessoa digita. */
    const tiposDisponiveis = (["ingresso", "produto", "combo"] as TipoItem[]).filter((t) => doEvento.some((i) => i.tipo === t));
    const tipoAtivo = tiposDisponiveis.includes(tipo) ? tipo : (tiposDisponiveis[0] ?? "ingresso");
    const termoBusca = termo.trim();
    const achaItem = (i: CatalogoItem) => combina(termo, i.nome, i.grupo, i.lote, i.descricao, sessaoLabel(i));
    /* A busca varre o catálogo inteiro e a contagem por tipo vai para a aba. Antes ela só
       enxergava o tipo aberto: pedir "camiseta" com a aba em Ingressos respondia que o item não
       existe, e ele estava em Produtos, a um toque de distância. */
    const achadosPorTipo = new Map<TipoItem, number>(tiposDisponiveis.map((t): [TipoItem, number] => [t, doEvento.filter((i) => i.tipo === t && achaItem(i)).length]));
    const outrosTiposComAchado = tiposDisponiveis.filter((t) => t !== tipoAtivo && (achadosPorTipo.get(t) ?? 0) > 0);
    const candidatos = doEvento.filter((i) => i.tipo === tipoAtivo && achaItem(i));

    const sessoesDoEvento = SESSOES.filter((s) => s.eventoId === pedido.eventoId).sort((a, b) => a.inicio - b.inicio);
    /* As datas vêm do catálogo do tipo, não do resultado da busca: a data que a pessoa abriu
       precisa continuar lá enquanto ela digita. Antes a aba sem resultado saía da lista e a tela
       caía sozinha na primeira data futura, mostrando a lista de outro dia sem dizer nada. */
    const sessoesDoTipo = sessoesDoEvento.filter((s) => doEvento.some((i) => i.tipo === tipoAtivo && i.sessaoId === s.id));
    const achadosPorSessao = new Map<string, number>(sessoesDoTipo.map((s): [string, number] => [s.id, candidatos.filter((i) => i.sessaoId === s.id).length]));

    const abasDisponiveis = sessoesDoTipo.map((s) => s.id);
    /* Abre na primeira sessão que ainda vai acontecer: nada entra numa sessão encerrada, e
       cair numa delas faz a etapa nascer com uma lista inteira de item bloqueado. */
    const padrao = sessoesDoTipo.find((s) => s.inicio > Date.now())?.id ?? abasDisponiveis[0] ?? "";
    const abaAtiva = abasDisponiveis.includes(aba) ? aba : padrao;
    const sessaoAtiva = sessoesDoTipo.find((s) => s.id === abaAtiva);
    const gruposDaSessaoAtiva = [
        ...candidatos
            .filter((i) => i.sessaoId === abaAtiva)
            .reduce((grupos, item) => grupos.set(item.grupo ?? "Outros", [...(grupos.get(item.grupo ?? "Outros") ?? []), item]), new Map<string, CatalogoItem[]>())
            .entries(),
    ];
    const achadosEmOutrasDatas = candidatos.filter((i) => i.sessaoId && i.sessaoId !== abaAtiva).length;
    /* Produto e combo não têm data: viram lista direta, sem carrossel. */
    const semSessao = candidatos.filter((i) => !i.sessaoId);

    const abasDoCatalogo: AbaItem[] = sessoesDoTipo.map((sessao) => {
        const { diaSemana, dia, mes } = partesDaSessao(sessao.inicio);
        const encerrada = sessao.inicio <= Date.now();
        const achados = achadosPorSessao.get(sessao.id) ?? 0;
        return {
            id: sessao.id,
            /* Nada entra numa sessão que já aconteceu: a data continua à vista, para não
               parecer que sumiu do evento, mas não abre. */
            bloqueada: encerrada,
            conteudo: (ativo: boolean) => (
                <>
                    <ChipLegenda ativo={ativo}>{diaSemana}</ChipLegenda>
                    <span className="text-md font-bold">
                        {dia} {mes}
                    </span>
                    {/* Durante a busca a legenda vira a contagem: é ela que diz em qual data está o
                        que a pessoa procura, sem precisar abrir uma data de cada vez. */}
                    <ChipLegenda ativo={ativo}>{encerrada ? "encerrada" : termoBusca ? contar(achados, "resultado", "resultados") : sessao.horaLabel}</ChipLegenda>
                </>
            ),
        };
    });

    /* Busca sem nada no tipo aberto e com resultado em exatamente um outro: a tela troca de aba
       sozinha e diz que trocou. O efeito depende só do termo de propósito. Com o tipo nas
       dependências, abrir na mão a aba vazia era impossível: a troca automática desfazia o
       clique no mesmo instante. */
    useEffect(() => {
        if (!termoBusca || (achadosPorTipo.get(tipoAtivo) ?? 0) > 0) {
            setTrocaDeTipo(null);
            return;
        }
        const comAchado = tiposDisponiveis.filter((t) => (achadosPorTipo.get(t) ?? 0) > 0);
        if (comAchado.length !== 1) {
            setTrocaDeTipo(null);
            return;
        }
        setTipo(comAchado[0]);
        setTrocaDeTipo({ de: tipoAtivo, para: comAchado[0] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [termoBusca]);

    /* A elegibilidade é da dupla possuidor + item de destino. Escolher a referência pelo TIPO
       do item testava a regra contra outra unidade, de outro possuidor: num pedido com titulares
       diferentes, um item restrito aparecia liberado porque foi conferido com a pessoa errada.
       Agora o item só aparece liberado quando passa para TODAS as unidades que estão saindo. */
    const referenciaDoItem = (item: CatalogoItem) => linhasSaem.find((l) => validarTrocaItem(pedido, l, item)) ?? linhasSaem[0];

    const noPedidoPorItem = new Map<string, number>();
    pedido.itens.forEach((l) => noPedidoPorItem.set(l.itemId, (noPedidoPorItem.get(l.itemId) ?? 0) + 1));
    const saindoPorItem = new Map<string, number>();
    linhasSaem.forEach((l) => saindoPorItem.set(l.itemId, (saindoPorItem.get(l.itemId) ?? 0) + 1));
    const precoSaida = new Set(linhasSaem.map((l) => l.valorPago)).size === 1 ? linhasSaem[0]?.valorPago : undefined;

    const itensQueEntram = Object.entries(entram).filter(([, q]) => q > 0);
    const totalEntram = itensQueEntram.reduce((soma, [, q]) => soma + q, 0);
    const restante = totalSaem - totalEntram;
    /* Com um único item escolhido dá para nomeá-lo na instrução do limite. */
    const unicoEscolhido = itensQueEntram.length === 1 ? getItem(itensQueEntram[0][0]) : undefined;
    const destinosItens = itensQueEntram.flatMap(([itemId, q]) => {
        const item = getItem(itemId);
        return item ? Array.from({ length: q }, () => item) : [];
    });
    const pares = parearTroca(linhasSaem, destinosItens);
    const calculo = pares.length > 0 && totalEntram === totalSaem ? calcularTrocaItens(pares) : null;
    const cortesia = linhasSaem.some((l) => l.valorPago === 0);
    /* §10.2: a sobra do downgrade fica com a Ingresse e a tela exige aceite explícito. */
    const naoDevolvido = calculo?.naoDevolvido ?? 0;
    const precisaAceite = naoDevolvido > 0;
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

    /* Quem fica com qual item, pela mesma regra do seletor de unidades: o nome só entra quando
       distingue uma linha de outra. Com um titular só ele repetiria a mesma pessoa em todas as
       linhas, e a troca já é identificada pelo item que sai. */
    const titularesQueSaem = new Set(linhasSaem.map((l) => l.titularId ?? pedido.compradorId));
    const mostrarPortador = titularesQueSaem.size > 1;
    const topicosDaConta = [
        "Diferença e taxas",
        cortesia ? "cortesia" : null,
        pedido.cupom && (calculo?.descontoPerdido ?? 0) > 0 ? "cupom" : null,
        "prazo e estoque",
    ].filter(Boolean) as string[];

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

    const podeAvancar =
        etapa === "saem"
            ? totalSaem > 0
            : etapa === "entram"
              ? totalSaem > 0 && totalEntram === totalSaem && !selecaoIgual
              : etapa === "formularios"
                ? paresIncompletos.length === 0
                : Boolean(calculo) && motivoValido(motivo) && (!precisaAceite || aceitouSobra);

    /* O que falta, sempre por escrito. O botão cinza sem pista era a lacuna de duas etapas: na
       de novos itens não havia rodapé nenhum com uma unidade só saindo, e na revisão o verde do
       "2 de 2" convivia com o botão travado. O verde agora só aparece quando o botão libera. */
    const oQueFalta = () => {
        if (etapa === "saem") return totalSaem === 0 ? "Marque ao menos 1 item" : null;
        if (etapa === "entram") {
            if (totalEntram === 0) return `Escolha ${contar(totalSaem, "item", "itens")}`;
            if (totalEntram < totalSaem) return `Escolha mais ${contar(totalSaem - totalEntram, "item", "itens")}`;
            if (totalEntram > totalSaem) return `Tire ${contar(totalEntram - totalSaem, "item", "itens")}: há mais entrando do que saindo`;
            if (selecaoIgual) return "Escolha ao menos um item diferente do atual";
            return null;
        }
        if (etapa === "formularios") return paresIncompletos.length === 0 ? null : `Falta responder ${contar(paresIncompletos.length, "formulário", "formulários")}`;
        const pendentes = [
            !motivo.categoria ? "Escolha o motivo" : null,
            motivo.categoria === "outro" && !motivo.nota.trim() ? "Descreva o motivo" : null,
            !motivo.chamado.trim() ? "Falta o número do chamado" : null,
            precisaAceite && !aceitouSobra ? `Falta confirmar que ${formatarMoeda(naoDevolvido)} não voltam` : null,
        ].filter(Boolean) as string[];
        if (pendentes.length === 0) return null;
        const resto = pendentes.length - 1;
        return resto === 0 ? pendentes[0] : `${pendentes[0]} e mais ${contar(resto, "pendência", "pendências")}`;
    };
    const falta = oQueFalta();

    const rotuloAvancar = etapa === "saem" ? "Escolher os novos itens" : etapa === "entram" && comFormularios ? "Responder formulários" : "Revisar troca";

    /* Fechar sai do fluxo. Não há rascunho: a solicitação, com a cobrança, é a primeira coisa
       que o pedido registra, como nas três EFs. */
    const fechar = () => onFechar();

    const avancar = () => {
        if (etapa === "entram" && paresIncompletos.length > 0) setPrecisaFormulario(true);
        setIndice((i) => i + 1);
    };
    const voltar = () => (indice === 0 ? fechar() : setIndice((i) => i - 1));

    const cartaoCatalogo = (item: CatalogoItem) => {
        const referencia = referenciaDoItem(item);
        return (
            <LinhaCatalogo
                key={item.id}
                item={item}
                pedido={pedido}
                linhaReferencia={referencia}
                /* Na busca o resultado sai do contexto do chip de data, então a linha passa a
                   dizer de que sessão ele é. */
                mostrarSessao={Boolean(termoBusca)}
                quantidade={entram[item.id] ?? 0}
                restante={restante}
                totalSaem={totalSaem}
                precoSaida={precoSaida}
                noPedido={noPedidoPorItem.get(item.id) ?? 0}
                saindo={saindoPorItem.get(item.id) ?? 0}
                onTirarUnidade={referencia ? () => setSaem((atual) => ({ ...atual, [referencia.id]: false })) : undefined}
                onChange={(valor) => setEntram((atual) => (totalSaem === 1 ? (valor > 0 ? { [item.id]: valor } : {}) : { ...atual, [item.id]: valor }))}
            />
        );
    };

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
        const detalhes: string[] = [];
        /* O par já existe aqui; antes virava frase e o histórico tinha de reconstruir a seta. */
        const mudancas = pares.map(({ linha, novoItem }) => ({
            escopo: identidadeDaLinha(pedido, linha).nome,
            de: getItem(linha.itemId)?.nome ?? "",
            para: novoItem.nome,
        }));
        const respostasPorItem = Object.fromEntries(paresComFormulario.map(({ linha, novoItem }) => [linha.id, valoresDoPar(linha, novoItem)]));

        const id = criarSolicitacao({
            pedidoId: pedido.id,
            tipo: "troca-item",
            detalhes,
            mudancas,
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
            /* O aceite entra junto do motivo, que é o que vai para o histórico: a tela promete
               "o aceite fica registrado no histórico" e até aqui ele morria no estado local. */
            motivo: precisaAceite ? { ...motivo, nota: [motivo.nota.trim(), `Comprador aceitou não receber de volta ${formatarMoeda(naoDevolvido)}.`].filter(Boolean).join(" ") } : motivo,
        });
        if (!id) {
            toast.error("Uma das unidades entrou em outra alteração enquanto você montava esta. Confira o pedido e tente de novo.");
            return;
        }
        toast.success(calculo.total > 0 ? `Cobrança de ${formatarMoeda(calculo.total)} enviada para ${destino}.` : "Troca aplicada. Sem valor a pagar, nada foi enviado ao comprador.");
        onEnviado(id);
    };

    return (
        <WizardShell
            onClose={fechar}
            titulo="Trocar"
            subtitulo={`${comprador?.nome ?? "Comprador"} · Pedido ${uuidCurto(pedido.id)}`}
            etapas={etapas.map((e) => TITULO_ETAPA[e])}
            indiceAtual={indice}
            podeAvancar={podeAvancar}
            rotuloAvancar={rotuloAvancar}
            ultimaEtapa={etapa === "revisao"}
            rotuloConfirmar={
                !calculo
                    ? "Enviar cobrança"
                    : calculo.total === 0
                      ? "Aplicar troca sem cobrança"
                      : "Enviar cobrança"
            }
            onVoltar={voltar}
            onAvancar={avancar}
            onConfirmar={confirmar}
            infoRodape={
                falta ? (
                    <span className="text-tertiary">{falta}</span>
                ) : etapa === "revisao" && calculo && calculo.total > 0 ? (
                    `${formatarMoeda(calculo.total)} para ${mascararEmail(destino)}`
                ) : (etapa === "entram" || etapa === "formularios") && calculo ? (
                    /* O total vem para cá assim que existe. A etapa só mostrava "+R$ 60,00 por
                       unidade" na linha, que é a diferença de um item e não o preço da operação:
                       o atendente lia sessenta ao telefone numa troca de oitenta e seis. */
                    <span className="text-success-primary tabular-nums">
                        <span className="font-semibold">
                            {totalEntram} de {totalSaem}
                        </span>{" "}
                        escolhidos · <span className="font-semibold">Total {formatarMoeda(calculo.total)}</span>
                    </span>
                ) : undefined
            }
        >

            {etapa === "saem" && (
                <>
                    {/* Sem o ícone da `Regra`: aqui a frase é a instrução da etapa, a primeira
                        coisa escrita na tela, e não uma ressalva ao lado de outro conteúdo. */}
                    <p className="text-sm text-tertiary">Marque os itens que serão substituídos. Os novos vêm na próxima etapa.</p>
                    <SeletorUnidades pedido={pedido} verbo="trocar" selecao={saem} onChange={setSaem} />
                </>
            )}

            {etapa === "entram" && (
                <>
                    {/* Busca e tipo na mesma linha. O tipo era um título no meio da lista: para
                        chegar aos produtos era preciso rolar todas as datas de ingresso. */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {/* O campo vai dentro de uma div própria: o `wrapperClassName` do InputBase
                            cai num elemento interno, então o filho do flex precisa ser este div. */}
                        <div className="min-w-0 flex-1">
                            {/* `md` em vez de `sm`: abaixo de 16px o Safari do iPhone amplia a página
                                ao focar o campo e não desfaz ao sair. */}
                            <InputBase
                                size="md"
                                icon={SearchLg}
                                value={termo}
                                aria-label="Buscar item"
                                onChange={(evento) => setTermo(evento.target.value)}
                                placeholder="Busque por sessão, grupo, lote ou item"
                            />
                        </div>
                        {tiposDisponiveis.length > 1 && (
                            /* `w-auto` derruba o `w-full` que o Tabs do DS aplica; sem isso a tira
                               ocupava a linha toda e a busca encolhia até sumir. */
                            <Tabs
                                selectedKey={tipoAtivo}
                                onSelectionChange={(chave) => {
                                    setTipo(chave as TipoItem);
                                    setTrocaDeTipo(null);
                                }}
                                className="w-auto shrink-0"
                            >
                                {/* Buscando, a aba carrega a contagem: é o que mostra que o item existe
                                    em outro tipo antes de a pessoa concluir que ele não existe. */}
                                <Tabs.List
                                    type="button-border"
                                    size="sm"
                                    items={tiposDisponiveis.map((t) => ({ id: t, label: termoBusca ? `${ROTULO_TIPO[t]} ${achadosPorTipo.get(t) ?? 0}` : ROTULO_TIPO[t] }))}
                                >
                                    {({ id, label }) => <Tabs.Item id={id}>{label}</Tabs.Item>}
                                </Tabs.List>
                            </Tabs>
                        )}
                    </div>

                    {trocaDeTipo && termoBusca && (
                        <Regra>
                            Nenhum {ROTULO_TIPO_SINGULAR[trocaDeTipo.de]} para "{termo}". Abrimos {ROTULO_TIPO[trocaDeTipo.para]}, onde está o resultado.
                        </Regra>
                    )}

                    {/* Só ingresso tem data. A tira é a mesma da bilheteria, uma data por chip. */}
                    {abasDoCatalogo.length > 0 && <AbasCarrossel abas={abasDoCatalogo} ativa={abaAtiva} ariaLabel="Datas à venda" onSelecionar={setAba} />}

                    {selecaoIgual && <Aviso titulo="A seleção é igual ao que já está no pedido" descricao="Escolha pelo menos um item diferente para a troca fazer sentido." />}

                    {totalSaem > 1 && totalEntram > 0 && (
                        /* Os escolhidos ficam no topo, com o seletor à mão. Tirar uma unidade exigia
                           reencontrar a linha no meio das datas, e com a conta fechada o catálogo
                           inteiro para de aceitar toque: sem este bloco não havia saída à vista. */
                        <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                            <p className="border-b border-secondary px-4 py-3 text-sm font-semibold text-primary">Escolhidos</p>
                            <ul className="flex flex-col divide-y divide-border-secondary">
                                {itensQueEntram.map(([itemId, quantidade]) => {
                                    const item = getItem(itemId);
                                    if (!item) return null;
                                    const detalhe = detalheDoItem(item);
                                    /* Abaixo de md o seletor desce: lado a lado ele comia 120px dos 326px e o nome
                                       do item ficava numa fita de quinze caracteres. */
                                    return (
                                        <li key={itemId} className="flex gap-3 px-4 py-3 max-md:flex-col md:items-center md:justify-between">
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-primary">
                                                    {quantidade}x {item.nome}
                                                </span>
                                                {detalhe && <span className="block truncate text-sm text-tertiary">{detalhe}</span>}
                                            </span>
                                            <Stepper
                                                valor={quantidade}
                                                maximo={tetoDoItem(item, quantidade, restante, totalSaem, saindoPorItem.get(itemId) ?? 0)}
                                                rotulo={item.nome}
                                                onChange={(valor) => setEntram((atual) => ({ ...atual, [itemId]: valor }))}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {totalSaem > 1 && restante === 0 && (
                        /* Com a conta fechada o catálogo para de responder. Antes o toque morria em
                           silêncio e o atendente tocava de novo, achando que a tela travou. */
                        <Regra>
                            Limite atingido. {unicoEscolhido ? `Tire 1 de ${unicoEscolhido.nome}` : "Tire um dos escolhidos acima"} para escolher outro item.
                        </Regra>
                    )}

                    {candidatos.length === 0 &&
                        (outrosTiposComAchado.length > 0 ? (
                            /* Estado vazio que é caminho, não negativa: o item existe, só está em
                               outro tipo, e o botão leva até ele. */
                            <div className="flex flex-col items-center gap-3 rounded-xl bg-primary px-4 py-8 text-center ring-1 ring-border-secondary">
                                <p className="text-sm text-tertiary">
                                    Nenhum {ROTULO_TIPO_SINGULAR[tipoAtivo]} para "{termo}".
                                </p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {outrosTiposComAchado.map((t) => (
                                        <Button
                                            key={t}
                                            size="md"
                                            color="secondary"
                                            className="max-md:w-full"
                                            onClick={() => {
                                                setTipo(t);
                                                setTrocaDeTipo(null);
                                            }}
                                        >
                                            {achadosPorTipo.get(t) ?? 0} em {ROTULO_TIPO[t]}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="rounded-xl bg-primary px-4 py-8 text-center text-sm text-tertiary ring-1 ring-border-secondary">Nenhum item encontrado para a busca.</p>
                        ))}

                    {gruposDaSessaoAtiva.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {gruposDaSessaoAtiva.map(([grupo, itens], posicao) => (
                                <Accordion
                                    key={grupo}
                                    defaultOpen={posicao === 0 || Boolean(termoBusca)}
                                    cabecalho={
                                        <span className="flex min-w-0 flex-1 items-baseline gap-2">
                                            <span className="truncate text-sm font-semibold text-primary">{grupo}</span>
                                            <span className="shrink-0 text-sm text-tertiary">{contar(itens.length, "item", "itens")}</span>
                                        </span>
                                    }
                                >
                                    <ul className="flex flex-col divide-y divide-border-secondary">{itens.map(cartaoCatalogo)}</ul>
                                </Accordion>
                            ))}
                        </div>
                    )}

                    {sessaoAtiva && gruposDaSessaoAtiva.length === 0 && candidatos.length > 0 && (
                        /* A data aberta continua aberta mesmo sem resultado, e a tela diz onde está
                           o que a pessoa procura. Trocar de data é decisão do atendente, não efeito
                           colateral de digitar. */
                        <p className="rounded-xl bg-primary px-4 py-8 text-center text-sm text-tertiary ring-1 ring-border-secondary">
                            Nada em {sessaoAtiva.dataLabel} para "{termo}".
                            {achadosEmOutrasDatas > 0 && ` ${contar(achadosEmOutrasDatas, "resultado", "resultados")} em outras datas, nos chips acima.`}
                        </p>
                    )}

                    {semSessao.length > 0 && (
                        <ul className="flex flex-col divide-y divide-border-secondary overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">{semSessao.map(cartaoCatalogo)}</ul>
                    )}
                </>
            )}

            {etapa === "formularios" &&
                (paresComFormulario.length === 0 ? (
                    /* A etapa fica fixa depois de entrar no fluxo, então a escolha pode mudar e
                       deixá-la sem nada. Antes sobrava só a regra solta, como tela quebrada. */
                    <p className="rounded-xl bg-primary px-4 py-8 text-center text-sm text-tertiary ring-1 ring-border-secondary">
                        Nenhum item escolhido pede formulário. Pode seguir para a revisão.
                    </p>
                ) : (
                    <>
                        <Regra>As respostas que já existiam vêm da unidade que sai. Só as perguntas novas do item que entra precisam de resposta.</Regra>
                        {paresComFormulario.map(({ linha, novoItem }, posicao) => {
                            const pendentes = faltando(linha, novoItem);
                            const { nome } = identidadeDaLinha(pedido, linha);
                            const rotuloPendencia = pendentes.length === 0 ? "Respondido" : pendentes.length === 1 ? "Falta 1 resposta" : `Faltam ${pendentes.length} respostas`;
                            const corPendencia = pendentes.length === 0 ? "text-success-primary" : "text-warning-primary";
                            return (
                                <Accordion
                                    key={linha.id}
                                    defaultOpen={pendentes.length > 0 && posicao === paresComFormulario.findIndex((p) => faltando(p.linha, p.novoItem).length > 0)}
                                    cabecalho={
                                        /* No telefone a contagem desce para a terceira linha do bloco de texto. Na
                                           mesma fileira ela levava 126px dos 234 disponíveis e cortava as duas coisas
                                           que identificam o formulário: o nome do item e o de quem vai usá-lo. */
                                        <span className="flex min-w-0 flex-1 items-center gap-3">
                                            <Miniatura item={novoItem} />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-primary">{novoItem.nome}</span>
                                                <span className="block truncate text-sm text-tertiary">{nome}</span>
                                                <span className={cx("block truncate text-sm md:hidden", corPendencia)}>{rotuloPendencia}</span>
                                            </span>
                                            <span className={cx("hidden shrink-0 text-sm md:block", corPendencia)}>{rotuloPendencia}</span>
                                        </span>
                                    }
                                >
                                    {/* Sem janela de rolagem própria: quem rola é a página. Um rolador de
                                        448px dentro dela obrigava a acertar o dedo na faixa certa e perdia a
                                        posição a cada toque. */}
                                    <div className="flex flex-col gap-4 p-4">
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
                ))}

            {etapa === "revisao" && calculo && (
                <>
                    <div className="w-full overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                        <div className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-3">
                            <p className="text-sm font-semibold text-primary">Trocando</p>
                        </div>
                        {pares.length > 1 && (
                            /* O par sai de parearTroca, que ordena os dois lados por valor: quem
                               recebe o quê é decisão da ordenação, não do atendente. Calado, isso
                               vira uma escolha que ele acha que fez. */
                            <Regra className="border-b border-secondary px-4 py-3">O par de cada unidade é escolhido pelo menor valor total.</Regra>
                        )}
                        <ul className="flex flex-col divide-y divide-border-secondary">
                            {pares.map(({ linha, novoItem }) => {
                                const itemSai = getItem(linha.itemId);
                                return (
                                    /* Os dois ícones ficam na mesma coluna, à esquerda: a seta puxa o
                                       olho do item que sai para o que entra, e o ponto marca onde parou.
                                       O risco fica no texto, não na linha toda, para não cortar o ícone. */
                                    <li key={linha.id} className="flex flex-col gap-1.5 p-4">
                                        {/* Sem o nome, uma lista de pares não diz quem fica com qual item,
                                            e o pareamento foi feito por uma ordenação que ninguém viu. */}
                                        {mostrarPortador && <p className="text-sm font-semibold text-primary">{identidadeDaLinha(pedido, linha).nome}</p>}
                                        <p className="flex items-center gap-2 text-sm text-tertiary">
                                            <ArrowDown className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                            <span className="line-through">
                                                {itemSai?.nome}
                                                {detalheDoItem(itemSai) && ` · ${detalheDoItem(itemSai)}`}
                                            </span>
                                        </p>
                                        <p className="flex items-center gap-2 text-md font-semibold text-primary">
                                            <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
                                                <span className="size-1.5 rounded-full bg-fg-quaternary" />
                                            </span>
                                            <span>
                                                {novoItem.nome}
                                                {detalheDoItem(novoItem) && <span className="text-sm font-normal text-tertiary"> · {detalheDoItem(novoItem)}</span>}
                                            </span>
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* A consequência primeiro: ao telefone a conversa é "o valor é X, o senhor
                        concorda?", e a tela abria pelo cartão de motivo. O aceite da sobra mora
                        dentro deste bloco, colado ao aviso que ele aceita. */}
                    <div className="flex w-full flex-col gap-4 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                        <div className="flex items-baseline justify-between gap-4">
                            <p className="text-sm font-semibold text-primary">{calculo.total > 0 ? "Total a cobrar" : "Total"}</p>
                            <p className="text-display-xs font-bold text-primary tabular-nums">{formatarMoeda(calculo.total)}</p>
                        </div>
                        <Regra>
                            {calculo.total === 0
                                ? "Sem valor a pagar: a troca é aplicada na hora, sem link e sem prazo."
                                : `A troca só é efetivada depois do pagamento. O link vai para ${destino}, com prazo de ${PRAZO_REAL_LABEL}.`}
                        </Regra>
                        {precisaAceite && (
                            <>
                                <Aviso
                                    tom="warning"
                                    titulo={`${formatarMoeda(naoDevolvido)} não serão devolvidos`}
                                    descricao="O item novo é mais barato. A sobra abate a cobrança da troca e o que resta fica com a Ingresse: não vira devolução, crédito nem saldo."
                                />
                                <Checkbox
                                    isSelected={aceitouSobra}
                                    onChange={setAceitouSobra}
                                    label={`Confirmo, em nome do comprador, que ${formatarMoeda(naoDevolvido)} não serão devolvidos`}
                                    hint="O aceite fica registrado no histórico junto com o motivo e o chamado."
                                />
                            </>
                        )}
                    </div>

                    {/* As regras informativas eram até quatro banners empilhados acima do número que
                        o atendente precisa ler. Juntas e recolhidas, continuam a um toque. */}
                    <Accordion
                        defaultOpen={false}
                        cabecalho={
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="text-sm font-semibold text-primary">Como esta cobrança foi calculada</span>
                                <span className="truncate text-sm text-tertiary">{topicosDaConta.join(" · ")}</span>
                            </span>
                        }
                    >
                        <div className="flex flex-col gap-3 pb-3">
                            <ResumoFinanceiro linhas={calculo.linhas} semMoldura />
                            <div className="flex flex-col gap-3 px-4">
                                {cortesia && <Regra>Há cortesia na troca: unidade de cortesia não tem valor pago, então a diferença é o preço cheio do item novo.</Regra>}
                                {pedido.cupom && (calculo.descontoPerdido ?? 0) > 0 && (
                                    <Regra>
                                        Inclui {formatarMoeda(calculo.descontoPerdido ?? 0)} do cupom {pedido.cupom}: o desconto da compra não vale para o item novo, e a diferença usa o preço cheio dele.
                                    </Regra>
                                )}
                                {/* §11: criar a solicitação valida o estoque, não o reserva. */}
                                <Regra>A troca está sujeita à disponibilidade de estoque: a solicitação confere o estoque, não reserva.</Regra>
                            </div>
                        </div>
                    </Accordion>

                    {/* A burocracia por último: é o que o atendente registra depois de combinar o
                        valor, não antes. */}
                    <CampoMotivo valor={motivo} onChange={setMotivo} />
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
    mostrarSessao,
    quantidade,
    restante,
    totalSaem,
    precoSaida,
    noPedido,
    saindo,
    onChange,
    onTirarUnidade,
}: {
    item: CatalogoItem;
    pedido: Pedido;
    linhaReferencia?: PedidoItem;
    /** Na busca o item aparece fora do chip de data, então a linha carrega a sessão. */
    mostrarSessao: boolean;
    quantidade: number;
    restante: number;
    totalSaem: number;
    precoSaida?: number;
    noPedido: number;
    saindo: number;
    onChange: (valor: number) => void;
    /** Tira da troca a unidade que bloqueia este item, sem sair da etapa. */
    onTirarUnidade?: () => void;
}) => {
    const impedimento = linhaReferencia ? validarTrocaItem(pedido, linhaReferencia, item) : null;
    const bloqueado = Boolean(impedimento) && impedimento?.curto !== "Item atual";
    const maximo = bloqueado ? 0 : tetoDoItem(item, quantidade, restante, totalSaem, saindo);
    const unico = totalSaem === 1;
    const itemAtual = saindo > 0 && saindo === totalSaem;
    const naoSelecionavel = bloqueado || itemAtual;
    const escolhido = quantidade > 0;
    const diferenca = precoSaida !== undefined ? item.precoIntegral - precoSaida : undefined;
    const estoqueCurto = !bloqueado && item.estoque < totalSaem;
    const perguntasDoFormulario = getFormulario(item.formularioId)?.perguntaIds.length ?? 0;
    const sessao = sessaoLabel(item);

    /* Com várias unidades saindo, o toque na linha soma UMA, o mesmo que o mais do stepper.
       Antes ele trocava todas por este item de uma vez: refazia a escolha do zero e apagava o
       que já tinha sido marcado nos outros itens. O gesto destrutivo da etapa era o maior alvo
       da tela, mudo e sem desfazer. Quem quer as N no mesmo item chega lá pelo stepper. */
    const somavel = !naoSelecionavel && quantidade < maximo;
    const ativavel = unico ? !naoSelecionavel : somavel;
    /* Linha que não aceita mais nada fica com a cara de bloqueada. Acesa, ela recebia o toque
       sem reagir e sem mudar de aparência: o atendente tocava duas, três vezes. */
    const inerte = naoSelecionavel || (!unico && !somavel && !escolhido);
    const nomeReferencia = linhaReferencia ? identidadeDaLinha(pedido, linhaReferencia).nome : "";
    const podeTirarReferencia = Boolean(bloqueado && linhaReferencia && onTirarUnidade && totalSaem > 1 && impedimento && BLOQUEIO_DA_UNIDADE.has(impedimento.curto));

    return (
        <li
            className={cx(
                "relative flex flex-col gap-3 p-4 transition duration-100 ease-linear",
                /* O hover mora aqui, não no botão: ele cobria só o nome e os selos, e metade da
                   linha (preço, diferença, espaço vazio) ficava morta ao passar o mouse.

                   Sem fundo para o item escolhido: o rádio marcado e a quantidade no stepper já
                   dizem isso, e os escolhidos ainda aparecem reunidos no bloco acima. O fundo
                   gastava uma cor para repetir o que três lugares já diziam. */
                ativavel && "cursor-pointer hover:bg-primary_hover",
            )}
        >
            {/* A opacidade fica na fileira, não na linha inteira: o motivo do bloqueio e a saída
                dele ficam embaixo e precisam de contraste cheio. */}
            <div className={cx("flex flex-col gap-3 transition duration-100 ease-linear sm:flex-row sm:items-center sm:justify-between", inerte && "opacity-60")}>
                {/* Botão de verdade, não div com onClick: no telefone a linha não tem hover para
                    anunciar que é tocável, e o min-h garante alvo mesmo no item de uma linha só. */}
                <button
                    type="button"
                    disabled={!ativavel}
                    onClick={unico ? () => onChange(escolhido ? 0 : 1) : () => onChange(quantidade + 1)}
                    aria-pressed={unico ? escolhido : undefined}
                    className={cx(
                        "flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left transition duration-100 ease-linear max-md:min-h-16",
                        /* O pseudo-elemento se estica sobre o `li` inteiro e entrega o clique a
                           este botão, então preço, diferença e espaço vazio também escolhem o
                           item. Aninhar o stepper dentro do botão não é possível, e por isso ele
                           sobe no empilhamento logo abaixo em vez de entrar aqui. */
                        ativavel && "before:absolute before:inset-0",
                        FOCO,
                    )}
                >
                    {unico && <RadioButtonBase size="sm" isSelected={escolhido} isDisabled={naoSelecionavel} className="mt-0.5 shrink-0" />}
                    <span className="min-w-0 flex-1">
                        {!unico && <span className="sr-only">Adicionar 1 unidade de </span>}
                        <span className="block text-sm font-semibold text-primary">{item.nome}</span>
                        {item.lote && <span className="block text-sm text-tertiary">{item.lote}</span>}
                        {/* Na busca a única pista de qual dia é o item era o chip de data, que pode
                            nem ser o dele. */}
                        {mostrarSessao && sessao && <span className="block text-sm text-tertiary">{sessao}</span>}
                        {item.tipo !== "ingresso" && item.descricao && <span className="block text-sm text-tertiary">{item.descricao}</span>}
                        {(saindo > 0 || noPedido > 0 || bloqueado || estoqueCurto || perguntasDoFormulario > 0) && (
                            <span className="mt-1.5 flex flex-wrap gap-1.5">
                                {saindo > 0 && <Badge size="md" type="pill-color" color="gray">{saindo === 1 ? "Item sendo trocado" : `${saindo} itens sendo trocados`}</Badge>}
                                {saindo === 0 && noPedido > 0 && <Badge size="md" type="pill-color" color="blue">{noPedido === 1 ? "1 igual no pedido" : `${noPedido} iguais no pedido`}</Badge>}
                                {bloqueado && <Badge size="md" type="pill-color" color="error">{impedimento?.curto}</Badge>}
                                {estoqueCurto && <Badge size="md" type="pill-color" color="warning">Só {item.estoque} {item.estoque === 1 ? "disponível" : "disponíveis"}</Badge>}
                                {/* O custo da escolha fica legível no momento da escolha: escolher um
                                    item com formulário fazia o stepper crescer de três para quatro
                                    etapas no instante do toque, sem nada ter avisado. */}
                                {!bloqueado && perguntasDoFormulario > 0 && (
                                    <Badge size="md" type="pill-color" color="gray">Pede formulário · {perguntasDoFormulario === 1 ? "1 pergunta" : `${perguntasDoFormulario} perguntas`}</Badge>
                                )}
                            </span>
                        )}
                    </span>
                </button>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="sm:text-right">
                        <p className="text-sm font-semibold text-primary tabular-nums">{formatarMoeda(item.precoIntegral)}</p>
                        {/* "+R$ 60,00 por unidade" lia como preço da operação. É a diferença de um
                            item: a taxa proporcional e a cobrança da troca entram só no total. */}
                        {!bloqueado && diferenca !== undefined && diferenca !== 0 && (
                            <p className="text-sm text-tertiary tabular-nums">
                                {diferenca > 0 ? `${formatarMoeda(diferenca)} a mais que o atual` : `${formatarMoeda(Math.abs(diferenca))} a menos que o atual`}
                            </p>
                        )}
                    </div>
                    {/* Acima do alvo da linha: o stepper tem os próprios botões e precisa receber
                        o clique antes dela. O preço fica de fora de propósito, para continuar
                        valendo como parte do alvo. */}
                    {!bloqueado && !unico && !itemAtual && (
                        <span className="relative z-10 flex">
                            <Stepper valor={quantidade} maximo={maximo} rotulo={item.nome} onChange={onChange} />
                        </span>
                    )}
                </div>
            </div>

            {/* O badge dá a marca rápida e jogava fora a frase que nomeia a pessoa e o critério.
                É ela que diz por que o item não serve e, com várias unidades saindo, qual delas
                precisa sair da troca para liberá-lo. */}
            {bloqueado && impedimento?.descricao && (
                <div className="flex flex-col items-start gap-1">
                    <p className="text-sm text-tertiary">
                        {/* "o titular atual" não identifica ninguém com três unidades saindo. */}
                        {podeTirarReferencia && <span className="font-semibold text-secondary">{nomeReferencia}: </span>}
                        {impedimento.descricao}
                    </p>
                    {podeTirarReferencia && (
                        <Button size="sm" color="link-color" className="max-md:min-h-11" onClick={onTirarUnidade}>
                            Tirar a unidade de {nomeReferencia} desta troca
                        </Button>
                    )}
                </div>
            )}
        </li>
    );
};

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
