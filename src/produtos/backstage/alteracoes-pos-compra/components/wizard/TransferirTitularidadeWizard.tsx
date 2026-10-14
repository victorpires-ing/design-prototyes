import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Copy01, SearchLg } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { Aviso, CampoMotivo, FOCO, MOTIVO_INICIAL, Miniatura, Regra, ResumoFinanceiro, SetaParaBaixo, iniciaisDe, mascararCPF, mascararEmail } from "../pos-compra-ui";
import {
    OPERADOR_ATUAL,
    TIPO_OPERACAO_LABEL,
    buscarContas,
    calcularTrocaTitularidade,
    criarSolicitacao,
    disponivelPara,
    formatarMoeda,
    getConta,
    getFormulario,
    getItem,
    getRascunho,
    motivoValido,
    novoRascunhoId,
    removerRascunho,
    salvarRascunho,
    titularDaLinha,
    usePerguntas,
    useRascunhos,
    uuidCurto,
    validarNovoTitular,
    type Conta,
    type Motivo,
    type Pedido,
    type PedidoItem,
    type Pergunta,
    type Rascunho,
} from "../../data/pos-compra-store";
import { WizardShell } from "./WizardShell";
import { ResumoUnidades, SeletorUnidades, avisarRascunhoSalvo, detalheDoItem } from "./seletor-unidades";

/*
  Sem etapa de formulário: a titularidade NÃO altera respostas. O novo possuidor
  herda todas (576978948 §4 e H-23); mudar resposta é a Troca de perguntas, feita
  depois e como operação separada (§10, C12).
*/
type Etapa = "itens" | "destinatario" | "revisao";

const TITULO_ETAPA: Record<Etapa, string> = {
    itens: "Itens",
    destinatario: "Destinatário",
    formularios: "Formulários",
    revisao: "Revisão",
};

interface TransferirTitularidadeWizardProps {
    pedido: Pedido;
    linhasIniciais: string[];
    rascunhoInicial?: Rascunho;
    onFechar: () => void;
    /** Cobrança criada: o pedido rola até o cartão novo. */
    onEnviado: (solicitacaoId: string) => void;
}

export function TransferirTitularidadeWizard({ pedido, linhasIniciais, rascunhoInicial, onFechar, onEnviado }: TransferirTitularidadeWizardProps) {
    const perguntas = usePerguntas();
    const rascunhos = useRascunhos(pedido.id);
    const rascunhoId = useState(() => rascunhoInicial?.id ?? novoRascunhoId())[0];

    /* Retomar de verdade: destinatário, busca, respostas e motivo voltam como estavam. Antes a
       retomada restaurava só a seleção e a etapa, e as etapas seguintes abriam em branco. */
    const contaInicial = rascunhoInicial?.titularPorLinha ? getConta(Object.values(rascunhoInicial.titularPorLinha)[0] ?? "") : undefined;
    const linhasDisponiveis = pedido.itens.filter((l) => disponivelPara(pedido, l, "transferir"));
    const pedidas = rascunhoInicial?.linhasSelecionadas ?? linhasIniciais;
    const perdidas = rascunhoInicial ? pedidas.filter((id) => !linhasDisponiveis.some((l) => l.id === id)).length : 0;

    const [indice, setIndice] = useState(() => (linhasDisponiveis.some((l) => linhasIniciais.includes(l.id)) ? 1 : 0));
    const [busca, setBusca] = useState(rascunhoInicial?.busca ?? contaInicial?.nome ?? "");
    const [motivo, setMotivo] = useState<Motivo>(rascunhoInicial?.motivo ?? MOTIVO_INICIAL);
    const [selecionada, setSelecionada] = useState<Conta | null>(contaInicial ?? null);
    const [selecao, setSelecao] = useState<Record<string, boolean>>(() => Object.fromEntries(pedidas.map((id) => [id, true])));
    const [aberta, setAberta] = useState<string | null>(null);
    const destino = selecionada?.email ?? "";

    const linhas = linhasDisponiveis.filter((l) => selecao[l.id]);
    const calculo = calcularTrocaTitularidade(linhas.length);
    const titularAtual = linhas[0] ? titularDaLinha(pedido, linhas[0]) : undefined;
    const comprador = getConta(pedido.compradorId);
    const emOutroRascunho = rascunhos.find((r) => r.id !== rascunhoId && r.linhasSelecionadas.some((id) => selecao[id]));

    /* ------------------------------------------------------------------ */
    /*  Destinatário: busca por nome, e-mail ou CPF, contra toda a base     */
    /* ------------------------------------------------------------------ */

    const termo = busca.trim();
    const encontradas = buscarContas(termo);
    const bloqueiosDaConta = (conta: Conta) => linhas.map((linha) => ({ linha, bloqueio: validarNovoTitular(pedido, linha, conta, linhas) })).filter((b) => b.bloqueio);
    const bloqueiosPorLinha = selecionada ? bloqueiosDaConta(selecionada) : [];

    /* ------------------------------------------------------------------ */
    /*  Formulários                                                        */
    /* ------------------------------------------------------------------ */

    const perguntasDaLinha = (linha: PedidoItem): Pergunta[] => (getFormulario(getItem(linha.itemId)?.formularioId)?.perguntaIds ?? []).map((id) => perguntas.find((p) => p.id === id)).filter(Boolean) as Pergunta[];
    const comFormulario = linhas.filter((linha) => perguntasDaLinha(linha).length > 0);
    /* ------------------------------------------------------------------ */
    /*  Etapas                                                             */
    /* ------------------------------------------------------------------ */

    /* "Itens" é sempre a primeira etapa: vindo de uma linha, ela já nasce concluída e o fluxo
       começa no destinatário, mas "Alterar" e "Voltar" levam até ela sem fechar o overlay. */
    const etapas: Etapa[] = ["itens", "destinatario", "revisao"];
    const etapa = etapas[Math.min(indice, etapas.length - 1)];

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
              : Boolean(selecionada) && motivoValido(motivo);

    const rotuloAvancar = etapa === "itens" ? "Escolher destinatário" : "Revisar transferência";

    const salvarProgresso = (proximaEtapa: string, destinatario: Conta | null = selecionada) =>
        salvarRascunho({
            id: rascunhoId,
            pedidoId: pedido.id,
            tipo: "troca-titularidade",
            etapa: proximaEtapa,
            linhasSelecionadas: linhas.map((l) => l.id),
            titularPorLinha: destinatario ? Object.fromEntries(linhas.map((l) => [l.id, destinatario.id])) : undefined,
            motivo,
            busca,
            operador: OPERADOR_ATUAL,
        });

    /* Fechar nunca perde trabalho: se já havia algo além da unidade escolhida, guarda o rascunho
       e avisa, com "Descartar". Abrir e fechar sem fazer nada não deixa rastro. */
    const fechar = () => {
        const fezAlgo = Boolean(rascunhoInicial || selecionada || termo || motivo.nota.trim() || motivo.chamado.trim());
        if (fezAlgo && linhas.length > 0) {
            salvarProgresso(etapa);
            avisarRascunhoSalvo(getRascunho(rascunhoId));
        }
        onFechar();
    };

    const avancar = () => {
        salvarProgresso(etapas[Math.min(indice + 1, etapas.length - 1)]);
        setIndice((i) => i + 1);
    };
    const voltar = () => (indice === 0 ? fechar() : setIndice((i) => i - 1));
    const incluir = (ids: string[]) => setSelecao((atual) => ({ ...atual, ...Object.fromEntries(ids.map((id) => [id, true])) }));

    /* Clicar no card já escolhe e avança. Só não avança quando a conta está bloqueada para algum
       item: aí fica na etapa, e o aviso abaixo da lista explica por quê. */
    const escolherDestinatario = (conta: Conta) => {
        setSelecionada(conta);
        if (bloqueiosDaConta(conta).length > 0) return;
        salvarProgresso(etapas[Math.min(indice + 1, etapas.length - 1)], conta);
        setIndice((i) => i + 1);
    };

    const confirmar = () => {
        if (!selecionada) return;

        /* H-23: o novo possuidor herda as respostas como estão. A titularidade não as altera. */
        const porItem = new Map<string, number>();
        linhas.forEach((l) => porItem.set(l.itemId, (porItem.get(l.itemId) ?? 0) + 1));
        const detalhes = [
            ...[...porItem.entries()].map(([itemId, quantidade]) => {
                const item = getItem(itemId);
                return [`${quantidade}x ${item?.nome}`, detalheDoItem(item)].filter(Boolean).join(" · ");
            }),
            `De ${titularAtual?.nome} para ${selecionada.nome} (${selecionada.email})`,
        ];

        const id = criarSolicitacao({
            pedidoId: pedido.id,
            tipo: "troca-titularidade",
            detalhes,
            linhasAfetadas: linhas.map((l) => l.id),
            resumo: `${linhas.length} ${linhas.length === 1 ? "item transferido" : "itens transferidos"} para ${selecionada.nome}. Comprador original preservado.`,
            calculo,
            /* Só o possuidor muda. As respostas seguem como estão, herdadas (H-23). */
            aplicar: { titularPorLinha: Object.fromEntries(linhas.map((l) => [l.id, selecionada.id])) },
            reservas: [],
            canalEnvio: "email",
            destinatarioEnvio: destino,
            motivo,
        });
        if (!id) {
            toast.error("Uma das unidades entrou em outra alteração enquanto você montava esta. Confira o pedido e tente de novo.");
            return;
        }

        removerRascunho(rascunhoId);
        toast.success(`Cobrança de transferência enviada para ${destino}.`);
        onEnviado(id);
    };

    const colunaEstreita = etapa === "destinatario" || etapa === "revisao";

    return (
        <WizardShell
            isOpen
            onClose={fechar}
            titulo="Transferir"
            subtitulo={`${comprador?.nome ?? "Comprador"} · Pedido ${uuidCurto(pedido.id)}`}
            etapas={etapas.map((e) => TITULO_ETAPA[e])}
            indiceAtual={indice}
            podeAvancar={podeAvancar}
            ocultarRodape={etapa === "destinatario"}
            rotuloAvancar={rotuloAvancar}
            ultimaEtapa={etapa === "revisao"}
            rotuloConfirmar={`Enviar cobrança de ${formatarMoeda(calculo.total)} para ${mascararEmail(destino)}`}
            onVoltar={voltar}
            onAvancar={avancar}
            onConfirmar={confirmar}
        >
            <div className={cx("flex w-full flex-col gap-5", colunaEstreita && "items-center")}>
                {perdidas > 0 && (
                    <div className="w-full">
                        <Aviso tom="warning" titulo={perdidas === 1 ? "1 unidade saiu desta transferência" : `${perdidas} unidades saíram desta transferência`} descricao="Elas já estão em outra alteração ou com outro titular." />
                    </div>
                )}
                {emOutroRascunho && (
                    <div className="w-full">
                        <Aviso tom="warning" titulo={`Unidade também está num rascunho de ${TIPO_OPERACAO_LABEL[emOutroRascunho.tipo].toLowerCase()}`} descricao={`Não enviado, de ${emOutroRascunho.operador}. Rascunho não trava a unidade: quem enviar primeiro vale.`} />
                    </div>
                )}

                {etapa === "itens" && (
                    <div className="flex w-full flex-col gap-4">
                        <SeletorUnidades pedido={pedido} verbo="transferir" selecao={selecao} onChange={setSelecao} />
                    </div>
                )}

                {etapa === "destinatario" && (
                    <>
                        <ResumoUnidades pedido={pedido} linhas={linhas} verbo="transferir" titulo="Transferindo" onAlterar={() => setIndice(0)} onIncluir={incluir} />
                        <SetaParaBaixo />

                        {(
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
                                    {/* V08: sem conta a operação é bloqueada. O fluxo NÃO cria conta (§4, C14). */}
                                    {termo && encontradas.length === 0 ? (
                                        <Aviso
                                            tom="warning"
                                            titulo="Conta não encontrada"
                                            descricao="O novo participante precisa se cadastrar antes da troca. A transferência não cria conta: oriente o cadastro e retome depois."
                                        />
                                    ) : (
                                        <Regra>Busque pelo nome, não precisa saber o e-mail ou CPF de cor.</Regra>
                                    )}
                                </div>

                                {encontradas.length > 0 && (
                                    <div className="w-full rounded-2xl bg-primary ring-1 ring-border-secondary">
                                        <div className="px-5 pt-5 pb-3">
                                            <p className="text-base font-semibold text-primary">{encontradas.length === 1 ? "Conta encontrada" : "Contas encontradas"}</p>
                                            <p className="text-sm text-tertiary">Confira o nome e o e-mail antes de continuar. Clicar escolhe a pessoa e já avança.</p>
                                        </div>
                                        <ul className="flex flex-col divide-y divide-border-secondary border-t border-secondary">
                                            {encontradas.map((conta) => {
                                                const ativa = selecionada?.id === conta.id;
                                                return (
                                                    <li key={conta.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => escolherDestinatario(conta)}
                                                            aria-pressed={ativa}
                                                            className={cx("flex w-full items-center gap-3 px-5 py-4 text-left transition duration-100 ease-linear last:rounded-b-2xl hover:bg-primary_hover", ativa && "bg-secondary", FOCO)}
                                                        >
                                                            <Avatar size="md" initials={iniciaisDe(conta.nome)} alt={conta.nome} />
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block text-sm font-semibold text-primary">{conta.nome}</span>
                                                                <span className="block truncate text-sm text-tertiary">
                                                                    {conta.email}
                                                                    {conta.cpf && ` · CPF ${mascararCPF(conta.cpf)}`}
                                                                </span>
                                                            </span>
                                                            <ChevronRight className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                {selecionada && bloqueiosPorLinha.length > 0 && (
                                    <div className="w-full">
                                        <Aviso
                                            titulo={bloqueiosPorLinha.length === linhas.length ? `Não dá para transferir assim para ${selecionada.nome}` : `${bloqueiosPorLinha.length} ${bloqueiosPorLinha.length === 1 ? "unidade não pode" : "unidades não podem"} ir para ${selecionada.nome}`}
                                            descricao={bloqueiosPorLinha[0].bloqueio?.descricao}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {etapa === "revisao" && selecionada && (
                    <>
                        <ResumoUnidades pedido={pedido} linhas={linhas} verbo="transferir" titulo="Transferindo" onAlterar={() => setIndice(0)} onIncluir={incluir} />
                        <SetaParaBaixo />

                        <div className="flex w-full flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                            <div>
                                <p className="text-base font-semibold text-primary">Tudo certo para transferir?</p>
                                <p className="mt-1 text-sm text-tertiary">
                                    {linhas.length === 1 ? "Esta unidade passa" : `Estas ${linhas.length} unidades passam`} de <span className="font-medium text-primary">{titularAtual?.nome}</span> para{" "}
                                    <span className="font-medium text-primary">{selecionada.nome}</span> assim que a taxa for paga. O link vai para o e-mail de {selecionada.nome}, que é quem paga.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl bg-secondary p-4">
                                <Avatar size="md" initials={iniciaisDe(selecionada.nome)} alt={selecionada.nome} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-primary">{selecionada.nome}</p>
                                    <p className="truncate text-sm text-tertiary">{selecionada.email}</p>
                                </div>
                            </div>

                            {/* §8 E4: o resumo declara a herança das respostas e o que o novo
                                possuidor poderá alterar. Alterar resposta aqui não existe. */}
                            {comFormulario.length > 0 && (
                                <div className="flex flex-col gap-1 border-t border-secondary pt-4">
                                    <p className="text-sm font-semibold text-primary">Respostas do formulário</p>
                                    <p className="text-sm text-tertiary">
                                        Herdadas pelo novo possuidor, sem alteração. Para mudar alguma, faça uma troca de perguntas depois que a transferência
                                        concluir.
                                    </p>
                                </div>
                            )}
                        </div>

                        <CampoMotivo valor={motivo} onChange={setMotivo} />

                        <div className="w-full">
                            <ResumoFinanceiro linhas={calculo.linhas} />
                        </div>
                    </>
                )}
            </div>
        </WizardShell>
    );
}
