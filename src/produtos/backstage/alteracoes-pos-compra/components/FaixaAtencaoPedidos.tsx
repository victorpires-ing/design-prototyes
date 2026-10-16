import { useEffect, useId, useState } from "react";
import { AlertTriangle, ChevronDown } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { formatarContagem } from "./pos-compra-ui";
import { getConta, getEvento, type Pedido } from "../data/pos-compra-store";

const JANELA_URGENTE_MS = 15 * 60 * 1000;

interface ItemAtencao {
    pedido: Pedido;
    tipo: "expira" | "falha";
    restanteMs?: number;
}

/** Visão consolidada entre pedidos: hoje o prazo só existe dentro do pedido já aberto, então
 *  uma cobrança prestes a expirar (ou uma falha) só é percebida por acaso. Computada no cliente
 *  sobre os pedidos já carregados — funciona para o volume atual desta base; precisaria virar
 *  consulta de servidor se a lista crescer muito além de um carregamento único. */
export function FaixaAtencaoPedidos({ pedidos, onAbrir }: { pedidos: Pedido[]; onAbrir: (pedidoId: string) => void }) {
    const [, forcar] = useState(0);
    /* No telefone a faixa nasce recolhida: aberta, ela custava ~140px e empurrava a busca e o
       primeiro pedido para fora da primeira tela. O resumo continua dizendo quantos pedidos
       pedem atenção, então a urgência não some. A partir de md a lista está sempre aberta. */
    const [recolhida, setRecolhida] = useState(true);
    const idLista = useId();

    useEffect(() => {
        const id = window.setInterval(() => forcar((n) => n + 1), 15_000);
        return () => window.clearInterval(id);
    }, []);

    const agora = Date.now();
    const itens: ItemAtencao[] = [];
    pedidos.forEach((pedido) => {
        if (pedido.status === "falha") {
            itens.push({ pedido, tipo: "falha" });
            return;
        }
        pedido.solicitacoes.forEach((solicitacao) => {
            if (solicitacao.estado !== "aguardando") return;
            const restante = solicitacao.expiraEm - agora;
            if (restante > 0 && restante <= JANELA_URGENTE_MS) itens.push({ pedido, tipo: "expira", restanteMs: restante });
        });
    });
    itens.sort((a, b) => (a.restanteMs ?? -1) - (b.restanteMs ?? -1));

    if (itens.length === 0) return null;

    const titulo = itens.length === 1 ? "1 pedido precisa de atenção agora" : `${itens.length} pedidos precisam de atenção agora`;

    return (
        <div className="flex flex-col gap-2 rounded-2xl bg-warning-primary p-3 ring-1 ring-border-secondary md:p-4">
            <p className="hidden items-center gap-2 text-sm font-semibold text-warning-primary md:flex">
                <AlertTriangle className="size-4 shrink-0 text-fg-warning-secondary" aria-hidden="true" />
                {titulo}
            </p>

            {/* O mesmo texto vira botão só no telefone. Um botão único com os estilos dos dois
                tamanhos deixaria no desktop um alvo de teclado que não alterna nada visível. */}
            <button
                type="button"
                onClick={() => setRecolhida((atual) => !atual)}
                aria-expanded={!recolhida}
                aria-controls={idLista}
                className="flex w-full items-center gap-2 py-3 text-left text-sm font-semibold text-warning-primary md:hidden"
            >
                <AlertTriangle className="size-4 shrink-0 text-fg-warning-secondary" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{titulo}</span>
                <ChevronDown
                    className={cx("size-5 shrink-0 transition-transform duration-100 ease-linear", !recolhida && "rotate-180")}
                    aria-hidden="true"
                />
            </button>

            <ul id={idLista} className={cx("flex-col gap-1.5 md:flex", recolhida ? "hidden" : "flex")}>
                {itens.slice(0, 6).map((item, indice) => {
                    const evento = getEvento(item.pedido.eventoId);
                    const comprador = getConta(item.pedido.compradorId);
                    return (
                        <li key={`${item.pedido.id}-${item.tipo}-${indice}`}>
                            <button
                                type="button"
                                onClick={() => onAbrir(item.pedido.id)}
                                className={cx(
                                    "flex w-full gap-3 rounded-lg bg-primary px-3 text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-primary_hover",
                                    /* Numa linha só, o prazo roubava ~130px dos 326px e o nome do
                                       comprador cortava por volta do caractere 28: dois pedidos do
                                       mesmo comprador ficavam iguais. Empilhado, o alvo também sai
                                       de 36px para 66px. */
                                    "max-md:flex-col max-md:gap-0.5 max-md:py-3",
                                    "md:items-center md:justify-between md:py-2",
                                )}
                            >
                                <span className="min-w-0 truncate text-sm text-primary">
                                    {comprador?.nome ?? "Comprador"}
                                    <span className="max-md:hidden"> · {evento?.nome ?? "Evento"}</span>
                                </span>
                                <span className="flex min-w-0 items-baseline gap-2 md:shrink-0">
                                    <span className="min-w-0 flex-1 truncate text-sm text-tertiary md:hidden">
                                        {evento?.nome ?? "Evento"}
                                    </span>
                                    <span className="shrink-0 text-sm font-semibold text-error-primary tabular-nums">
                                        {item.tipo === "falha" ? "Falha na alteração" : `expira em ${formatarContagem(item.restanteMs ?? 0)}`}
                                    </span>
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
