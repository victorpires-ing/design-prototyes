import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ChevronLeft } from "@untitledui/icons";
import { toast } from "sonner";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressIconType } from "@/components/application/progress-steps/progress-types";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { EtapaCompacta, EtapaJustificativa, ResumoFinanceiro, useRolou } from "../components/pos-compra-ui";
import { ComparativoResposta, EditorResposta } from "../components/respostas-ui";
import {
    calcularEdicaoRespostas,
    criarSolicitacao,
    formatarMoeda,
    getEvento,
    getFormulario,
    getItem,
    sessaoDoItem,
    sessaoLabel,
    usePedidos,
    usePerguntas,
    uuidCurto,
    type CatalogoItem,
    type Pedido,
    type Pergunta,
} from "../data/pos-compra-store";

type Etapa = "formulario" | "justificativa" | "revisao";

const TITULO_ETAPA: Record<Etapa, string> = { formulario: "Formulário", justificativa: "Justificativa", revisao: "Revisão" };

const detalheDoItem = (item?: CatalogoItem) => [item?.lote, sessaoDoItem(item) ? sessaoLabel(item) : null].filter(Boolean).join(" | ");

export function EditarFormulario() {
    const { pedidoId } = useParams();
    const navigate = useNavigate();
    const linhaId = (useLocation().state as { linha?: string } | null)?.linha;
    const pedidos = usePedidos();
    const perguntas = usePerguntas();
    const pedido = pedidos.find((p) => p.id === pedidoId);
    const rolou = useRolou();

    const [indice, setIndice] = useState(0);
    const [novos, setNovos] = useState<Record<string, string>>({});
    const [justificativa, setJustificativa] = useState("");

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
    const linha = pedido.itens.find((l) => l.id === linhaId);

    if (!linha) {
        return (
            <BackstageLayout showEventContext={false} activeProducer="pedidos">
                <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
                    <p className="text-sm text-tertiary">Item não encontrado no pedido.</p>
                    <Button size="md" color="secondary" onClick={voltarAoPedido}>
                        Voltar ao pedido
                    </Button>
                </div>
            </BackstageLayout>
        );
    }

    const item = getItem(linha.itemId);
    const perguntasDoItem = (getFormulario(item?.formularioId)?.perguntaIds ?? [])
        .map((id) => perguntas.find((p) => p.id === id))
        .filter(Boolean) as Pergunta[];

    const valorDaResposta = (perguntaId: string) => novos[perguntaId] ?? linha.respostas[perguntaId] ?? "";
    const alteradas = Object.keys(novos).filter((id) => novos[id] !== (linha.respostas[id] ?? ""));
    const calculo = calcularEdicaoRespostas(alteradas.length);

    const etapas: Etapa[] = ["formulario", "justificativa", "revisao"];
    const etapa = etapas[Math.min(indice, etapas.length - 1)];
    const progressItems: ProgressIconType[] = etapas.map((e, i) => ({
        title: TITULO_ETAPA[e],
        description: "",
        status: i < indice ? "complete" : i === indice ? "current" : "incomplete",
    }));

    const podeAvancar =
        etapa === "formulario" ? alteradas.length > 0 : etapa === "justificativa" ? justificativa.trim().length > 0 : true;
    const voltar = () => (indice === 0 ? voltarAoPedido() : setIndice((i) => i - 1));

    const confirmar = () => {
        const novasRespostas = { ...linha.respostas, ...Object.fromEntries(alteradas.map((id) => [id, novos[id]])) };

        criarSolicitacao({
            pedidoId: pedido.id,
            tipo: "alterar-respostas",
            detalhes: [
                item?.nome ?? "Item",
                ...alteradas.map((id) => {
                    const pergunta = perguntas.find((p) => p.id === id);
                    return `${pergunta?.label}: ${linha.respostas[id] ?? "sem resposta"} → ${novos[id]}`;
                }),
                `Justificativa: ${justificativa.trim()}`,
            ],
            linhasAfetadas: [linha.id],
            resumo: `${alteradas.length} ${alteradas.length === 1 ? "resposta alterada" : "respostas alteradas"}.`,
            calculo,
            aplicar: { respostasPorItem: { [linha.id]: novasRespostas } },
            reservas: alteradas.flatMap((perguntaId) => {
                const pergunta = perguntas.find((p) => p.id === perguntaId);
                const controlaEstoque = pergunta?.opcoes.some((o) => o.valor === novos[perguntaId] && typeof o.estoque === "number");
                return controlaEstoque ? [{ tipo: "resposta" as const, perguntaId, valor: novos[perguntaId] }] : [];
            }),
        });

        toast.success("Cobrança de alteração gerada com sucesso.");
        voltarAoPedido();
    };

    return (
        <BackstageLayout showEventContext={false} activeProducer="pedidos">
            <div className="flex min-w-0 flex-1 flex-col">
                <header
                    className={cx(
                        "sticky top-[61px] z-20 flex flex-wrap items-center justify-between gap-3 bg-primary_alt px-4 py-4 transition-colors duration-150 md:top-[var(--bs-header-offset,0px)] md:px-6 md:py-5",
                        rolou && "border-b border-secondary",
                    )}
                >
                    <ButtonUtility size="md" color="secondary" icon={ChevronLeft} tooltip="Voltar" onClick={voltar} />
                    <div className="flex flex-col items-center text-center max-md:order-last max-md:w-full md:pointer-events-none md:absolute md:left-1/2 md:-translate-x-1/2">
                        <h1 className="text-display-xs font-bold text-primary">Editar formulário</h1>
                        <p className="text-sm text-tertiary">Pedido {uuidCurto(pedido.id)}</p>
                    </div>
                    {etapa !== "revisao" ? (
                        <Button size="md" isDisabled={!podeAvancar} onClick={() => setIndice((i) => i + 1)}>
                            {etapa === "formulario" ? "Justificar" : "Ver resumo"}
                        </Button>
                    ) : (
                        <Button size="md" onClick={confirmar}>
                            Cobrar alteração de {formatarMoeda(calculo.total)}
                        </Button>
                    )}
                </header>

                <main className="flex flex-1 flex-col items-center gap-8 px-6 pb-10">
                    <Progress.IconsWithText items={progressItems} type="number" size="sm" orientation="horizontal" className="max-w-[320px] max-md:hidden" />
                    <EtapaCompacta atual={indice} titulos={etapas.map((e) => TITULO_ETAPA[e])} className="md:hidden" />

                    <section className={cx("flex w-full flex-col gap-5", etapa === "revisao" ? "max-w-md items-center" : "max-w-2xl")}>
                        <CartaoItem pedido={pedido} item={item} />

                        {etapa === "formulario" &&
                            (perguntasDoItem.length === 0 ? (
                                <p className="text-sm text-tertiary">Este item não tem formulário.</p>
                            ) : (
                                <div className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                                    {perguntasDoItem.map((pergunta) => (
                                        <EditorResposta
                                            key={pergunta.id}
                                            pergunta={pergunta}
                                            valor={valorDaResposta(pergunta.id)}
                                            valorOriginal={linha.respostas[pergunta.id] ?? ""}
                                            onChange={(valor) => setNovos((mapa) => ({ ...mapa, [pergunta.id]: valor }))}
                                        />
                                    ))}
                                </div>
                            ))}

                        {etapa === "justificativa" && (
                            <EtapaJustificativa
                                descricao="Explique por que essa alteração está sendo feita. Isso fica registrado no histórico do pedido."
                                valor={justificativa}
                                onChange={setJustificativa}
                            />
                        )}

                        {etapa === "revisao" && (
                            <>
                                {alteradas.length > 0 && (
                                    <div className="w-full rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                                        <p className="mb-2 text-sm font-semibold text-primary">Respostas alteradas</p>
                                        <div className="flex flex-col divide-y divide-border-secondary">
                                            {alteradas.map((id) => (
                                                <ComparativoResposta key={id} pergunta={perguntas.find((p) => p.id === id)} de={linha.respostas[id]} para={novos[id]} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="w-full rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                                    <p className="mb-1 text-sm font-semibold text-primary">Justificativa</p>
                                    <p className="text-sm text-tertiary">{justificativa.trim()}</p>
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

/** O item sendo editado, no mesmo estilo de ingresso usado na transferência — sem a seta, já que aqui
    não há "para onde" as respostas vão: elas ficam na própria unidade. */
const CartaoItem = ({ pedido, item }: { pedido: Pedido; item?: CatalogoItem }) => {
    const evento = getEvento(pedido.eventoId);
    const detalhe = detalheDoItem(item);

    return (
        <div className="w-full overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
            <div className="px-5 pt-5 pb-4">
                <p className="text-sm text-tertiary">{evento?.nome}</p>
                <p className="mt-1 text-xl font-semibold text-primary">{item?.nome ?? "Item"}</p>
                <p className="text-sm text-tertiary">{detalhe || `Pedido ${uuidCurto(pedido.id)}`}</p>
            </div>

            <Picote />

            <div className="px-5 pt-3 pb-5">
                <p className="text-sm text-tertiary">As respostas abaixo valem para esta unidade do pedido.</p>
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
