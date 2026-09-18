import { useEffect, useState } from "react";
import { AlertTriangle } from "@untitledui/icons";
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

    return (
        <div className="flex flex-col gap-2 rounded-2xl bg-warning-primary p-4 ring-1 ring-border-secondary">
            <p className="flex items-center gap-2 text-sm font-semibold text-warning-primary">
                <AlertTriangle className="size-4 shrink-0 text-fg-warning-secondary" aria-hidden="true" />
                {itens.length === 1 ? "1 pedido precisa de atenção agora" : `${itens.length} pedidos precisam de atenção agora`}
            </p>
            <ul className="flex flex-col gap-1.5">
                {itens.slice(0, 6).map((item, indice) => {
                    const evento = getEvento(item.pedido.eventoId);
                    const comprador = getConta(item.pedido.compradorId);
                    return (
                        <li key={`${item.pedido.id}-${item.tipo}-${indice}`}>
                            <button
                                type="button"
                                onClick={() => onAbrir(item.pedido.id)}
                                className={cx(
                                    "flex w-full items-center justify-between gap-3 rounded-lg bg-primary px-3 py-2 text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-primary_hover",
                                )}
                            >
                                <span className="min-w-0 truncate text-sm text-primary">
                                    {comprador?.nome ?? "Comprador"} · {evento?.nome ?? "Evento"}
                                </span>
                                <span className="shrink-0 text-sm font-semibold text-error-primary tabular-nums">
                                    {item.tipo === "falha" ? "Falha na alteração" : `expira em ${formatarContagem(item.restanteMs ?? 0)}`}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
