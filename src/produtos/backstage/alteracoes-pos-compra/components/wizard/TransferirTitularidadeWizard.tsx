import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowDown, ChevronDown, Copy01, SearchLg } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { Aviso, EtapaJustificativa, FOCO, Miniatura, Regra, ResumoFinanceiro, iniciaisDe } from "../pos-compra-ui";
import { ComparativoResposta, EditorResposta } from "../respostas-ui";
import {
    buscarContas,
    calcularTrocaTitularidade,
    criarSolicitacao,
    getEvento,
    getFormulario,
    getItem,
    novoRascunhoId,
    removerRascunho,
    salvarRascunho,
    sessaoDoItem,
    sessaoLabel,
    solicitacaoDaLinha,
    titularDaLinha,
    usePerguntas,
    validarNovoTitular,
    type CanalEnvio,
    type CatalogoItem,
    type Conta,
    type Pedido,
    type PedidoItem,
    type Pergunta,
    type Rascunho,
} from "../../data/pos-compra-store";
import { WizardShell } from "./WizardShell";
import { EtapaEnvio, isEmailValido, isTelefoneValido } from "./EtapaEnvio";
import { CadastroContaInline } from "./CadastroContaInline";

type Etapa = "itens" | "destinatario" | "formularios" | "revisao";

const TITULO_ETAPA: Record<Etapa, string> = {
    itens: "Itens",
    destinatario: "Destinatário",
    formularios: "Formulários",
    revisao: "Revisão",
};

const detalheDoItem = (item?: CatalogoItem) => [item?.lote, sessaoDoItem(item) ? sessaoLabel(item) : null].filter(Boolean).join(" | ");

const interromper = (event: MouseEvent) => event.stopPropagation();

interface TransferirTitularidadeWizardProps {
    pedido: Pedido;
    linhasIniciais: string[];
    rascunhoInicial?: Rascunho;
    onFechar: () => void;
}

export function TransferirTitularidadeWizard({ pedido, linhasIniciais, rascunhoInicial, onFechar }: TransferirTitularidadeWizardProps) {
    const perguntas = usePerguntas();
    const rascunhoId = useState(() => rascunhoInicial?.id ?? novoRascunhoId())[0];

    const [indice, setIndice] = useState(0);
    const [busca, setBusca] = useState("");
    const [justificativa, setJustificativa] = useState(rascunhoInicial?.motivo?.detalhe ?? "");
    const [selecionada, setSelecionada] = useState<Conta | null>(null);
    const [cadastrando, setCadastrando] = useState(false);
    const [selecao, setSelecao] = useState<Record<string, boolean>>(() => Object.fromEntries((rascunhoInicial?.linhasSelecionadas ?? linhasIniciais).map((id) => [id, true])));
    const [respostasPorLinha, setRespostasPorLinha] = useState<Record<string, Record<string, string>>>({});
    const [aberta, setAberta] = useState<string | null>(null);
    const [canal, setCanal] = useState<CanalEnvio>("email");
    const [destino, setDestino] = useState("");

    /* ------------------------------------------------------------------ */
    /*  Itens                                                              */
    /* ------------------------------------------------------------------ */

    const linhasDisponiveis = pedido.itens.filter((l) => !l.titularId && !solicitacaoDaLinha(pedido, l.id));
    const selecaoPrevia = linhasDisponiveis.some((l) => linhasIniciais.includes(l.id));
    const linhas = linhasDisponiveis.filter((l) => selecao[l.id]);
    const calculo = calcularTrocaTitularidade(linhas.length);

    const alternar = (id: string) => setSelecao((atual) => ({ ...atual, [id]: !atual[id] }));

    const rotuloDaLinha = (linha: PedidoItem) => {
        const item = getItem(linha.itemId);
        const irmas = linhas.filter((l) => l.itemId === linha.itemId);
        return { nome: item?.nome ?? "Item", detalhe: detalheDoItem(item), unidade: irmas.length > 1 ? `Unidade ${irmas.indexOf(linha) + 1} de ${irmas.length}` : "" };
    };

    /* ------------------------------------------------------------------ */
    /*  Destinatário — busca por nome, e-mail ou CPF, contra toda a base    */
    /* ------------------------------------------------------------------ */

    const termo = busca.trim();
    const encontradas = buscarContas(termo);

    /* Restrição validada LINHA A LINHA contra o item daquela linha específica — nunca mais "o
       primeiro item segmentado do pedido inteiro" travando ou liberando transferências por engano. */
    const bloqueiosPorLinha = selecionada ? linhas.map((linha) => ({ linha, bloqueio: validarNovoTitular(pedido, linha, selecionada) })).filter((b) => b.bloqueio) : [];

    /* ------------------------------------------------------------------ */
    /*  Formulários                                                        */
    /* ------------------------------------------------------------------ */

    const perguntasDaLinha = (linha: PedidoItem): Pergunta[] => (getFormulario(getItem(linha.itemId)?.formularioId)?.perguntaIds ?? []).map((id) => perguntas.find((p) => p.id === id)).filter(Boolean) as Pergunta[];
    const comFormulario = linhas.filter((linha) => perguntasDaLinha(linha).length > 0);
    const valoresDaLinha = (linha: PedidoItem) => respostasPorLinha[linha.id] ?? linha.respostas;
    const respondidas = (linha: PedidoItem) => perguntasDaLinha(linha).filter((p) => (valoresDaLinha(linha)[p.id] ?? "").trim() !== "").length;
    const linhaCompleta = (linha: PedidoItem) => respondidas(linha) === perguntasDaLinha(linha).length;
    const completas = comFormulario.filter(linhaCompleta).length;
    const formularioCompleto = completas === comFormulario.length;
    const alteracoesDaLinha = (linha: PedidoItem) => perguntasDaLinha(linha).map((p) => p.id).filter((id) => (valoresDaLinha(linha)[id] ?? "") !== (linha.respostas[id] ?? ""));

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

    const etapas: Etapa[] = [...(selecaoPrevia ? [] : (["itens"] as Etapa[])), "destinatario", ...(comFormulario.length > 0 ? (["formularios"] as Etapa[]) : []), "revisao"];
    const etapa = etapas[Math.min(indice, etapas.length - 1)];
    const destinoValido = canal === "email" ? isEmailValido(destino) : isTelefoneValido(destino);

    /* O índice nasce em 0 porque `etapas` só existe depois de itens/destinatário/formulários
       serem computados a partir do rascunho. Uma vez montado com esses valores já restaurados,
       pulamos direto para a etapa salva em vez de reaplicar o fluxo do zero. */
    useEffect(() => {
        if (!rascunhoInicial) return;
        const alvo = etapas.indexOf(rascunhoInicial.etapa as Etapa);
        if (alvo >= 0) setIndice(alvo);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const podeAvancar =
        etapa === "itens"
            ? linhas.length > 0
            : etapa === "destinatario"
              ? Boolean(selecionada) && bloqueiosPorLinha.length === 0
              : etapa === "formularios"
                ? formularioCompleto
                : justificativa.trim().length > 0 && destinoValido;

    const rotuloAvancar = etapa === "itens" ? "Escolher destinatário" : etapa === "destinatario" && comFormulario.length > 0 ? "Preencher formulários" : "Ver resumo";

    const salvarProgresso = (proximaEtapa: string) =>
        salvarRascunho({
            id: rascunhoId,
            pedidoId: pedido.id,
            tipo: "troca-titularidade",
            etapa: proximaEtapa,
            linhasSelecionadas: linhas.map((l) => l.id),
            titularPorLinha: selecionada ? Object.fromEntries(linhas.map((l) => [l.id, selecionada.id])) : undefined,
            respostasPorLinha,
            motivo: justificativa ? { categoria: "outro", detalhe: justificativa } : undefined,
            aguardandoCadastroDe: cadastrando ? busca : undefined,
            operador: "Operador do backoffice",
        });

    const avancar = () => {
        salvarProgresso(etapas[Math.min(indice + 1, etapas.length - 1)]);
        setIndice((i) => i + 1);
    };
    const voltar = () => (indice === 0 ? onFechar() : setIndice((i) => i - 1));
    const minimizar = () => {
        salvarProgresso(etapa);
        toast.message("Rascunho salvo. Continue quando quiser, pelo pedido.");
        onFechar();
    };
    const alterarItens = () => (selecaoPrevia ? onFechar() : setIndice(etapas.indexOf("itens")));

    const confirmar = () => {
        if (!selecionada) return;

        const respostasPorItem = Object.fromEntries(comFormulario.filter((linha) => alteracoesDaLinha(linha).length > 0).map((linha) => [linha.id, { ...valoresDaLinha(linha) }]));

        const porItem = new Map<string, number>();
        linhas.forEach((l) => porItem.set(l.itemId, (porItem.get(l.itemId) ?? 0) + 1));
        const detalhes = [
            ...[...porItem.entries()].map(([itemId, quantidade]) => {
                const item = getItem(itemId);
                return [`${quantidade}x ${item?.nome}`, item?.lote, sessaoDoItem(item) ? sessaoLabel(item) : null].filter(Boolean).join(" · ");
            }),
            `De ${titularDaLinha(pedido, linhas[0])?.nome} para ${selecionada.nome} (${selecionada.email})`,
            `Justificativa: ${justificativa.trim()}`,
        ];

        criarSolicitacao({
            pedidoId: pedido.id,
            tipo: "troca-titularidade",
            detalhes,
            linhasAfetadas: linhas.map((l) => l.id),
            resumo: `${linhas.length} ${linhas.length === 1 ? "item transferido" : "itens transferidos"} para ${selecionada.nome}. Comprador original preservado.`,
            calculo,
            aplicar: { titularPorLinha: Object.fromEntries(linhas.map((l) => [l.id, selecionada.id])), respostasPorItem: Object.keys(respostasPorItem).length > 0 ? respostasPorItem : undefined },
            reservas: [],
            canalEnvio: canal,
            destinatarioEnvio: destino,
        });

        removerRascunho(rascunhoId);
        toast.success("Cobrança de transferência enviada.");
        onFechar();
    };

    const colunaEstreita = etapa === "destinatario";

    return (
        <WizardShell
            isOpen
            onClose={onFechar}
            titulo="Transferir titularidade"
            subtitulo={linhas.length > 0 ? `${linhas.length} ${linhas.length === 1 ? "item" : "itens"}` : undefined}
            etapas={etapas.map((e) => TITULO_ETAPA[e])}
            indiceAtual={indice}
            podeAvancar={podeAvancar}
            rotuloAvancar={rotuloAvancar}
            ultimaEtapa={etapa === "revisao"}
            rotuloConfirmar="Enviar cobrança"
            onVoltar={voltar}
            onAvancar={avancar}
            onConfirmar={confirmar}
            onMinimizar={indice > 0 ? minimizar : undefined}
        >
            <div className={cx("flex w-full flex-col gap-5", colunaEstreita && "items-center")}>
                {etapa === "itens" && (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Regra>Marque o que muda de titular. Quem recebe vem na próxima etapa.</Regra>
                            {linhasDisponiveis.length > 1 && (
                                <Button size="sm" color="link-color" onClick={() => setSelecao(linhas.length === linhasDisponiveis.length ? {} : Object.fromEntries(linhasDisponiveis.map((l) => [l.id, true])))}>
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
                                        className={cx("flex cursor-pointer items-center gap-3 rounded-xl p-4 ring-1 transition duration-100 ease-linear", marcada ? "bg-secondary ring-border-brand" : "bg-primary ring-border-secondary hover:bg-primary_hover")}
                                    >
                                        <span onClick={interromper}>
                                            <Checkbox size="sm" aria-label={`Selecionar ${item?.nome}`} isSelected={marcada} onChange={() => alternar(linha.id)} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold text-primary">{item?.nome}</span>
                                            {detalhe && <span className="block text-sm text-tertiary">{detalhe}</span>}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}

                {etapa === "destinatario" && (
                    <>
                        <CartaoItens pedido={pedido} linhas={linhas} acao={<Button size="sm" color="link-color" onClick={alterarItens}>Alterar</Button>} />
                        <SetaParaBaixo />

                        {cadastrando ? (
                            <CadastroContaInline
                                nomeInicial={busca}
                                linhas={linhas}
                                onCriada={(conta) => {
                                    setSelecionada(conta);
                                    setCadastrando(false);
                                }}
                                onCancelar={() => setCadastrando(false)}
                            />
                        ) : (
                            <>
                                <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                    <Input
                                        icon={SearchLg}
                                        label="Nome, e-mail ou CPF de quem vai receber"
                                        placeholder="Nome completo, e-mail ou CPF"
                                        value={busca}
                                        onChange={(valor) => {
                                            setBusca(valor);
                                            setSelecionada(null);
                                        }}
                                    />
                                    {termo && encontradas.length === 0 ? (
                                        <Aviso
                                            titulo="Conta não encontrada"
                                            descricao="Você pode cadastrar essa pessoa agora, sem sair da transferência."
                                        />
                                    ) : (
                                        <Regra>Busque pelo nome, não precisa saber o e-mail ou CPF de cor.</Regra>
                                    )}
                                    {termo && encontradas.length === 0 && (
                                        <Button size="sm" color="secondary" className="w-fit" onClick={() => setCadastrando(true)}>
                                            Cadastrar {busca.trim()}
                                        </Button>
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
                                                            className={cx("flex w-full items-center gap-3 px-5 py-4 text-left transition duration-100 ease-linear last:rounded-b-2xl hover:bg-primary_hover", ativa && "bg-secondary", FOCO)}
                                                        >
                                                            <Avatar size="md" initials={iniciaisDe(conta.nome)} alt={conta.nome} />
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block text-sm font-semibold text-primary">{conta.nome}</span>
                                                                <span className="block truncate text-sm text-tertiary">{conta.email} | CPF {conta.cpf}</span>
                                                            </span>
                                                            <RadioButtonBase size="sm" isSelected={ativa} className="shrink-0" />
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                {selecionada && selecionada.id === (linhas[0]?.titularId ?? pedido.compradorId) && (
                                    <div className="w-full">
                                        <Aviso titulo="Conta já é a titular" descricao="Selecione outra conta para a transferência." />
                                    </div>
                                )}

                                {selecionada && bloqueiosPorLinha.length > 0 && (
                                    <div className="w-full">
                                        <Aviso
                                            titulo={`${bloqueiosPorLinha.length} ${bloqueiosPorLinha.length === 1 ? "item não pode" : "itens não podem"} ir para ${selecionada.nome}`}
                                            descricao={`${bloqueiosPorLinha.map(({ linha, bloqueio }) => `${getItem(linha.itemId)?.nome}: ${bloqueio?.descricao}`).join(" · ")}`}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {etapa === "formularios" && selecionada && (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Regra>Responda com os dados de {selecionada.nome}. Cada item tem o próprio formulário.</Regra>
                            <span className={cx("text-sm", formularioCompleto ? "text-success-primary" : "text-tertiary")}>
                                <span className="font-semibold tabular-nums">{completas} de {comFormulario.length}</span> {comFormulario.length === 1 ? "formulário completo" : "formulários completos"}
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
                                            className={cx("flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover", aberto && "rounded-b-none border-b border-secondary", FOCO)}
                                        >
                                            {item && <Miniatura item={item} />}
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-semibold text-primary">
                                                    {rotulo.nome}
                                                    {rotulo.unidade && <span className="font-normal text-tertiary"> · {rotulo.unidade}</span>}
                                                </span>
                                                {rotulo.detalhe && <span className="block truncate text-sm text-tertiary">{rotulo.detalhe}</span>}
                                            </span>
                                            <span className={cx("shrink-0 text-sm tabular-nums", completa ? "text-success-primary" : "text-warning-primary")}>{feitas} de {perguntasDoItem.length} respondidas</span>
                                            <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear", aberto && "rotate-180")} aria-hidden="true" />
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {aberto && (
                                                <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
                                                    <div className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto px-4 py-4">
                                                        {perguntasDoItem.map((pergunta) => (
                                                            <EditorResposta key={pergunta.id} pergunta={pergunta} valor={valoresDaLinha(linha)[pergunta.id] ?? ""} valorOriginal={linha.respostas[pergunta.id] ?? ""} onChange={(valor) => setRespostasPorLinha((mapa) => ({ ...mapa, [linha.id]: { ...valoresDaLinha(linha), [pergunta.id]: valor } }))} />
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
                                    {linhas.length === 1 ? "Este item passa" : `Estes ${linhas.length} itens passam`} de <span className="font-medium text-primary">{titularDaLinha(pedido, linhas[0])?.nome}</span> para{" "}
                                    <span className="font-medium text-primary">{selecionada.nome}</span> assim que o link for pago.
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
                                                        <ComparativoResposta key={id} pergunta={perguntas.find((p) => p.id === id)} de={linha.respostas[id]} para={valoresDaLinha(linha)[id]} />
                                                    ))}
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        <EtapaJustificativa
                            descricao="Explique por que essa transferência está sendo feita. Isso fica registrado no histórico do pedido."
                            valor={justificativa}
                            onChange={setJustificativa}
                            destinatario="novo titular"
                        />

                        <div className="w-full">
                            <ResumoFinanceiro linhas={calculo.linhas} />
                        </div>

                        <EtapaEnvio
                            destinatarioSugerido={selecionada ?? undefined}
                            resumo={`${selecionada?.nome ?? "quem vai receber"} vai receber ${linhas.length === 1 ? "1 item" : `${linhas.length} itens`} do seu pedido.`}
                            total={calculo.total}
                            canal={canal}
                            destino={destino}
                            onCanalChange={setCanal}
                            onDestinoChange={setDestino}
                        />
                    </>
                )}
            </div>
        </WizardShell>
    );
}

/* ------------------------------------------------------------------ */
/*  Peças no estilo da carteira                                        */
/* ------------------------------------------------------------------ */

const CartaoItens = ({ pedido, linhas, acao }: { pedido: Pedido; linhas: PedidoItem[]; acao?: ReactNode }) => {
    const evento = getEvento(pedido.eventoId);
    const grupos = new Map<string, { item?: CatalogoItem; quantidade: number }>();
    linhas.forEach((linha) => {
        const atual = grupos.get(linha.itemId) ?? { item: getItem(linha.itemId), quantidade: 0 };
        atual.quantidade++;
        grupos.set(linha.itemId, atual);
    });
    const lista = [...grupos.values()];
    const unico = linhas.length === 1 ? lista[0] : undefined;

    return (
        <div className="w-full overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
                <div className="min-w-0">
                    <p className="text-sm text-tertiary">{evento?.nome}</p>
                    <p className="mt-1 text-xl font-semibold text-primary">{unico ? unico.item?.nome : `${linhas.length} itens do pedido`}</p>
                    <p className="text-sm text-tertiary">{unico ? detalheDoItem(unico.item) : `${linhas.length} itens selecionados`}</p>
                </div>
                {acao}
            </div>
            <Picote />
            <div className="px-5 pt-3 pb-5">
                {unico ? (
                    <p className="text-sm text-tertiary">O item será reemitido e ficará vinculado ao CPF de quem receber.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {lista.map(({ item, quantidade }) => {
                            const detalhe = detalheDoItem(item);
                            return (
                                <li key={item?.id ?? quantidade} className="flex items-baseline justify-between gap-3">
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium text-primary">{quantidade}x {item?.nome}</span>
                                        {detalhe && <span className="block text-sm text-tertiary">{detalhe}</span>}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

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
