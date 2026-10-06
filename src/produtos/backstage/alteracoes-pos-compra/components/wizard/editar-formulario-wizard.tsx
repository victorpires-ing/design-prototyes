import { useState } from "react";
import { toast } from "sonner";
import { CampoMotivo, MOTIVO_INICIAL, Regra, ResumoFinanceiro, mascararEmail } from "../pos-compra-ui";
import { ComparativoResposta, EditorResposta, RespostaLinha } from "../respostas-ui";
import {
    calcularEdicaoRespostas,
    criarSolicitacao,
    formatarMoeda,
    getConta,
    getFormulario,
    getItem,
    motivoValido,
    usePerguntas,
    uuidCurto,
    type Motivo,
    type Pedido,
    type Pergunta,
} from "../../data/pos-compra-store";
import { WizardShell } from "./WizardShell";
import { ResumoUnidades } from "./seletor-unidades";

type Etapa = "respostas" | "revisao";

/**
 * Formulário de uma unidade, no mesmo overlay das outras alterações (antes era uma rota à parte,
 * que desmontava o pedido e perdia a rolagem a cada ida e volta). Abre em leitura: consultar
 * "qual tamanho de camiseta eu escolhi?" não tem o custo nem o risco de alterar.
 */
export function EditarFormularioWizard({ pedido, linhaId, onFechar, onEnviado }: { pedido: Pedido; linhaId: string; onFechar: () => void; onEnviado: (solicitacaoId: string) => void }) {
    const perguntas = usePerguntas();
    const [etapa, setEtapa] = useState<Etapa>("respostas");
    const [editando, setEditando] = useState(false);
    const [novos, setNovos] = useState<Record<string, string>>({});
    const [motivo, setMotivo] = useState<Motivo>(MOTIVO_INICIAL);

    const linha = pedido.itens.find((l) => l.id === linhaId);
    const item = getItem(linha?.itemId ?? "");
    const comprador = getConta(pedido.compradorId);
    const destino = comprador?.email ?? "";
    const perguntasDoItem = (getFormulario(item?.formularioId)?.perguntaIds ?? []).map((id) => perguntas.find((p) => p.id === id)).filter(Boolean) as Pergunta[];

    if (!linha) return null;

    const valorDaResposta = (perguntaId: string) => novos[perguntaId] ?? linha.respostas[perguntaId] ?? "";
    const alteradas = Object.keys(novos).filter((id) => novos[id] !== (linha.respostas[id] ?? ""));
    const calculo = calcularEdicaoRespostas(alteradas.length);

    const avancar = () => {
        if (!editando) setEditando(true);
        else setEtapa("revisao");
    };
    const voltar = () => {
        if (etapa === "revisao") setEtapa("respostas");
        else if (editando) {
            setEditando(false);
            setNovos({});
        } else onFechar();
    };

    const confirmar = () => {
        const novasRespostas = { ...linha.respostas, ...Object.fromEntries(alteradas.map((id) => [id, novos[id]])) };
        const id = criarSolicitacao({
            pedidoId: pedido.id,
            tipo: "alterar-respostas",
            detalhes: alteradas.map((perguntaId) => {
                const pergunta = perguntas.find((p) => p.id === perguntaId);
                return `${pergunta?.label}: ${linha.respostas[perguntaId] || "sem resposta"} para ${novos[perguntaId]}`;
            }),
            linhasAfetadas: [linha.id],
            resumo: `${alteradas.length} ${alteradas.length === 1 ? "resposta alterada" : "respostas alteradas"} em ${item?.nome}.`,
            calculo,
            aplicar: { respostasPorItem: { [linha.id]: novasRespostas } },
            reservas: alteradas.flatMap((perguntaId) => {
                const pergunta = perguntas.find((p) => p.id === perguntaId);
                const controlaEstoque = pergunta?.opcoes.some((o) => o.valor === novos[perguntaId] && typeof o.estoque === "number");
                return controlaEstoque ? [{ tipo: "resposta" as const, perguntaId, valor: novos[perguntaId] }] : [];
            }),
            /* Antes a cobrança saía sem canal nem destino, e o histórico gravava "para undefined". */
            canalEnvio: "email",
            destinatarioEnvio: destino,
            motivo,
        });
        if (!id) {
            toast.error("Esta unidade entrou em outra alteração enquanto você editava. Confira o pedido e tente de novo.");
            return;
        }
        toast.success(`Cobrança da edição enviada para ${destino}.`);
        onEnviado(id);
    };

    return (
        <WizardShell
            isOpen
            onClose={onFechar}
            titulo="Formulário"
            subtitulo={`${comprador?.nome ?? "Comprador"} · Pedido ${uuidCurto(pedido.id)}`}
            etapas={editando || etapa === "revisao" ? ["Respostas", "Revisão"] : ["Respostas"]}
            indiceAtual={etapa === "revisao" ? 1 : 0}
            podeAvancar={etapa === "respostas" ? !editando || alteradas.length > 0 : motivoValido(motivo)}
            rotuloAvancar={editando ? "Revisar alteração" : "Editar respostas"}
            ultimaEtapa={etapa === "revisao"}
            rotuloConfirmar={`Enviar cobrança de ${formatarMoeda(calculo.total)} para ${mascararEmail(destino)}`}
            onVoltar={voltar}
            onAvancar={avancar}
            onConfirmar={confirmar}
        >
            <ResumoUnidades pedido={pedido} linhas={[linha]} verbo="formulario" titulo={editando || etapa === "revisao" ? "Editando" : "Respostas de"} />

            {etapa === "respostas" && !editando && (
                <div className="rounded-2xl bg-primary px-5 py-2 ring-1 ring-border-secondary">
                    <div className="flex flex-col divide-y divide-border-secondary">
                        {perguntasDoItem.map((pergunta) => (
                            <RespostaLinha key={pergunta.id} pergunta={pergunta} valor={linha.respostas[pergunta.id] || "Sem resposta"} />
                        ))}
                    </div>
                </div>
            )}

            {etapa === "respostas" && editando && (
                <>
                    <Regra>Mude só o que precisa. A edição custa {formatarMoeda(calculo.total)} por vez, não importa quantas respostas mudem.</Regra>
                    <div className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                        {perguntasDoItem.map((pergunta) => (
                            <EditorResposta key={pergunta.id} pergunta={pergunta} valor={valorDaResposta(pergunta.id)} valorOriginal={linha.respostas[pergunta.id] ?? ""} onChange={(valor) => setNovos((mapa) => ({ ...mapa, [pergunta.id]: valor }))} />
                        ))}
                    </div>
                </>
            )}

            {etapa === "revisao" && (
                <>
                    <div className="w-full rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                        <p className="mb-2 text-sm font-semibold text-primary">{alteradas.length === 1 ? "Resposta alterada" : `${alteradas.length} respostas alteradas`}</p>
                        <div className="flex flex-col divide-y divide-border-secondary">
                            {alteradas.map((id) => (
                                <ComparativoResposta key={id} pergunta={perguntas.find((p) => p.id === id)} de={linha.respostas[id]} para={novos[id]} />
                            ))}
                        </div>
                    </div>
                    <CampoMotivo valor={motivo} onChange={setMotivo} />
                    <ResumoFinanceiro linhas={calculo.linhas} />
                    <Regra>As respostas novas valem assim que o pagamento for confirmado. O link vai para {destino}.</Regra>
                </>
            )}
        </WizardShell>
    );
}
