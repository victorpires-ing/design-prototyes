import { useMemo, useState } from "react";
import { CheckCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import {
    calcularEdicaoRespostas,
    criarSolicitacao,
    formatarMoeda,
    getFormulario,
    getItem,
    usePerguntas,
    uuidCurto,
    type Pedido,
    type Pergunta,
} from "../data/pos-compra-store";
import { FluxoModal } from "./FluxoModal";
import { EditorResposta } from "./respostas-ui";

interface Props {
    isOpen: boolean;
    pedido: Pedido;
    /** ID da linha específica (PedidoItem.id) a editar. */
    linhaId: string;
    onClose: () => void;
}

export function AlterarRespostasModal({ isOpen, pedido, linhaId, onClose }: Props) {
    const perguntas = usePerguntas();
    const linha = pedido.itens.find((l) => l.id === linhaId);
    const item = getItem(linha?.itemId ?? "");

    const [novos, setNovos] = useState<Record<string, string>>({});

    const perguntasDaLinha = useMemo((): Pergunta[] => {
        if (!linha) return [];
        return (getFormulario(item?.formularioId)?.perguntaIds ?? [])
            .map((id) => perguntas.find((p) => p.id === id))
            .filter(Boolean) as Pergunta[];
    }, [linha, item, perguntas]);

    const alteradas = Object.keys(novos).filter((id) => linha && novos[id] !== linha.respostas[id]);
    const calculo = calcularEdicaoRespostas(alteradas.length);

    const fechar = () => {
        setNovos({});
        onClose();
    };

    const confirmar = () => {
        if (!linha) return;
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
        fechar();
    };

    return (
        <FluxoModal
            isOpen={isOpen}
            largura="xl"
            titulo="Editar formulário"
            subtitulo={`Pedido ${uuidCurto(pedido.id)}${item ? ` | ${item.nome}` : ""}`}
            onClose={fechar}
            rodape={
                <>
                    <Button color="secondary" size="md" className="max-sm:w-full" onClick={fechar}>
                        Cancelar
                    </Button>
                    <Button
                        size="md"
                        iconLeading={alteradas.length > 0 ? CheckCircle : undefined}
                        isDisabled={alteradas.length === 0}
                        className="max-sm:w-full"
                        onClick={confirmar}
                    >
                        {alteradas.length > 0 ? `Gerar link de ${formatarMoeda(calculo.total)}` : "Atualizar respostas"}
                    </Button>
                </>
            }
        >
            {perguntasDaLinha.length === 0 ? (
                <p className="text-sm text-tertiary">Este item não tem formulário.</p>
            ) : (
                perguntasDaLinha.map((pergunta) => (
                    <EditorResposta
                        key={pergunta.id}
                        pergunta={pergunta}
                        valor={novos[pergunta.id] ?? linha?.respostas[pergunta.id] ?? ""}
                        valorOriginal={linha?.respostas[pergunta.id] ?? ""}
                        onChange={(valor) => setNovos((mapa) => ({ ...mapa, [pergunta.id]: valor }))}
                    />
                ))
            )}
        </FluxoModal>
    );
}
