import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { BackstageLayout } from "../../components/Backstage";
import { idDoCartao } from "../components/CartaoOperacao";
import { EditarFormularioWizard } from "../components/wizard/editar-formulario-wizard";
import { TransferirTitularidadeWizard } from "../components/wizard/TransferirTitularidadeWizard";
import { TrocarItensWizard } from "../components/wizard/TrocarItensWizard";
import { getConta, retomarPedido, usePedidos, useRascunhos, uuidCurto, type Verbo } from "../data/pos-compra-store";

/**
 * Os três fluxos de alteração como TELA, não como modal — o padrão da bilheteria.
 *
 * O que o modal não dava: endereço. O rascunho já era salvo, mas fechar o overlay não deixava
 * nenhum caminho de volta para ele, e recarregar a página perdia o fluxo inteiro. Agora a unidade
 * escolhida e o rascunho viajam na URL, então recarregar, voltar pelo navegador e colar o link
 * para um colega levam todos ao mesmo lugar.
 *
 * `?linhas=` são as unidades que o operador escolheu antes de entrar (pelo kebab de uma linha ou
 * pelo botão em massa). `?rascunho=` retoma um rascunho salvo.
 */
const WIZARD_DO_VERBO: Record<Verbo, string> = { transferir: "Transferir", trocar: "Trocar", formulario: "Formulário" };

export function AlterarPedido({ verbo }: { verbo: Verbo }) {
    const { pedidoId } = useParams();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const pedidos = usePedidos();
    const pedido = pedidos.find((p) => p.id === pedidoId);
    const rascunhos = useRascunhos(pedidoId ?? "");

    const linhas = (params.get("linhas") ?? "").split(",").filter(Boolean);
    const rascunho = rascunhos.find((r) => r.id === params.get("rascunho"));
    const comprador = pedido ? getConta(pedido.compradorId) : undefined;
    const voltarPara = `/backstage/pedidos/${pedidoId}`;

    useEffect(() => {
        if (!pedido) return;
        const anterior = document.title;
        document.title = `${WIZARD_DO_VERBO[verbo]} · Pedido ${uuidCurto(pedido.id)} · Backstage`;
        return () => {
            document.title = anterior;
        };
    }, [pedido?.id, verbo]);

    /* Um pedido expirado volta a valer quando o operador entra para mexer nele. Ficava no `abrir`
       do detalhe; com o fluxo em rota própria, o gatilho é chegar aqui. */
    useEffect(() => {
        if (pedido?.status === "expirado") retomarPedido(pedido.id);
    }, [pedido?.id, pedido?.status]);

    if (!pedido) {
        return (
            <BackstageLayout showEventContext={false} activeProducer="pedidos">
                <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
                    <p className="text-sm text-tertiary">Pedido não encontrado.</p>
                    <div>
                        <Button size="md" color="secondary" iconLeading={ArrowLeft} onClick={() => navigate("/backstage/pedidos")}>
                            Voltar para pedidos
                        </Button>
                    </div>
                </div>
            </BackstageLayout>
        );
    }

    const fechar = () => navigate(voltarPara);
    /* Volta ao pedido já com o cartão da operação recém-criada no foco, que é o que o overlay
       fazia por estado interno e agora atravessa a navegação. */
    const enviado = (solicitacaoId: string) => navigate(`${voltarPara}?focar=${idDoCartao(solicitacaoId)}`);

    const comum = { pedido, rascunhoInicial: rascunho, onFechar: fechar, onEnviado: enviado };

    return (
        <BackstageLayout showEventContext={false} activeProducer="pedidos">
            {verbo === "transferir" && <TransferirTitularidadeWizard {...comum} linhasIniciais={linhas} />}
            {verbo === "trocar" && <TrocarItensWizard {...comum} linhasIniciais={linhas} />}
            {verbo === "formulario" &&
                (linhas[0] ? (
                    <EditarFormularioWizard pedido={pedido} linhaId={linhas[0]} onFechar={fechar} onEnviado={enviado} />
                ) : (
                    <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
                        <p className="text-sm text-tertiary">Escolha a unidade cujo formulário você quer editar.</p>
                        <div>
                            <Button size="md" color="secondary" iconLeading={ArrowLeft} onClick={fechar}>
                                Voltar para o pedido
                            </Button>
                        </div>
                    </div>
                ))}
        </BackstageLayout>
    );
}
