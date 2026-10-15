import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { BackstageLayout } from "../../components/Backstage";
import { idDoCartao } from "../components/CartaoOperacao";
import { EditarFormularioWizard } from "../components/wizard/editar-formulario-wizard";
import { SeletorUnidades } from "../components/wizard/seletor-unidades";
import { WizardShell } from "../components/wizard/WizardShell";
import { TransferirTitularidadeWizard } from "../components/wizard/TransferirTitularidadeWizard";
import { TrocarItensWizard } from "../components/wizard/TrocarItensWizard";
import { getConta, retomarPedido, usePedidos, useRascunhos, uuidCurto, type Pedido, type Verbo } from "../data/pos-compra-store";

/**
 * Os três fluxos de alteração como TELA, não como modal — o padrão da bilheteria.
 *
 * O que o modal não dava: endereço. O rascunho já era salvo, mas fechar o overlay não deixava
 * nenhum caminho de volta para ele, e recarregar a página perdia o fluxo inteiro. Agora a unidade
 * escolhida e o rascunho viajam na URL, então recarregar, voltar pelo navegador e colar o link
 * para um colega levam todos ao mesmo lugar.
 *
 * `?linhas=` são as unidades que o operador escolheu antes de entrar. `?rascunho=` retoma um
 * rascunho salvo.
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
    /* O formulário é de uma unidade por vez e a porta do pedido não diz qual: a escolha
       acontece aqui, na primeira tela do fluxo. */
    const [escolhida, setEscolhida] = useState<string | null>(null);
    const rascunho = rascunhos.find((r) => r.id === params.get("rascunho"));
    const comprador = pedido ? getConta(pedido.compradorId) : undefined;
    const subtitulo = pedido ? `${comprador?.nome ?? "Comprador"} · Pedido ${uuidCurto(pedido.id)}` : "";
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
                ((linhas[0] ?? escolhida) ? (
                    <EditarFormularioWizard pedido={pedido} linhaId={(linhas[0] ?? escolhida) as string} onFechar={fechar} onEnviado={enviado} />
                ) : (
                    <EscolherUnidade pedido={pedido} subtitulo={subtitulo} onFechar={fechar} onEscolher={setEscolhida} />
                ))}
        </BackstageLayout>
    );
}

/**
 * Escolher de qual unidade é o formulário.
 *
 * O cartão da unidade sempre manda o `?linhas=` dela, então na prática esta tela não aparece.
 * Ela existe para o link que chega sem a unidade (colado pela metade, editado à mão): antes
 * isso dava um texto pedindo a escolha e um botão de voltar, sem nada para escolher. Uma
 * unidade por vez, porque é assim que o formulário existe: marcar um item troca o anterior.
 */
const EscolherUnidade = ({ pedido, subtitulo, onFechar, onEscolher }: { pedido: Pedido; subtitulo: string; onFechar: () => void; onEscolher: (linhaId: string) => void }) => {
    const [selecao, setSelecao] = useState<Record<string, boolean>>({});
    const marcada = Object.keys(selecao).find((id) => selecao[id]);

    return (
        <WizardShell
            onClose={onFechar}
            titulo="Editar formulário"
            subtitulo={subtitulo}
            etapas={[]}
            indiceAtual={0}
            podeAvancar={Boolean(marcada)}
            rotuloAvancar="Abrir formulário"
            ultimaEtapa={false}
            rotuloConfirmar=""
            onVoltar={onFechar}
            onAvancar={() => marcada && onEscolher(marcada)}
            onConfirmar={() => undefined}
            infoRodape={marcada ? "1 unidade escolhida" : "Escolha a unidade"}
        >
            <SeletorUnidades pedido={pedido} verbo="formulario" selecao={selecao} onChange={setSelecao} unica />
        </WizardShell>
    );
};
