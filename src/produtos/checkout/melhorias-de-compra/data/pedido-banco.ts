import { useEffect, useSyncExternalStore } from "react";
import { useSearchParams } from "react-router";
import { dataHoraCurta, lerDoc, useDoc, type Evento, type Pedido } from "@/plataforma";

/* ------------------------------------------------------------------ */
/*  Pedido do banco unificado em pagamento                             */
/*                                                                     */
/*  Chega por ?pedido=<id> (vindo do link de compra) e fica guardado   */
/*  na aba, porque as telas de cartão e de não autorizado navegam sem  */
/*  o parâmetro. Sem pedido, o checkout segue com o mock "Vai safadão".*/
/* ------------------------------------------------------------------ */

const KEY = "checkout:pedido-atual";
let atual: string | null = typeof window === "undefined" ? null : sessionStorage.getItem(KEY);
const ouvintes = new Set<() => void>();

function definir(id: string | null) {
    if (id === atual) return;
    atual = id;
    try {
        if (id) sessionStorage.setItem(KEY, id);
        else sessionStorage.removeItem(KEY);
    } catch {
        /* só em memória */
    }
    ouvintes.forEach((l) => l());
}

export const limparPedidoAtual = () => definir(null);
export const pedidoAtualId = () => atual;

/** Lê ?pedido= da URL (quando houver) e devolve o pedido em pagamento. */
export function usePedidoCheckout(): { pedido: Pedido; evento?: Evento; sessao?: string } | null {
    const [params] = useSearchParams();
    const daUrl = params.get("pedido");
    // A URL com ?pedido= define o pedido; a rota base sem parâmetro (protótipo antigo) limpa.
    useEffect(() => {
        if (daUrl) definir(daUrl);
    }, [daUrl]);
    const id = useSyncExternalStore(
        (l) => {
            ouvintes.add(l);
            return () => ouvintes.delete(l);
        },
        () => daUrl ?? atual,
        () => null,
    );
    const pedido = useDoc("pedidos", id);
    const evento = useDoc("eventos", pedido?.eventoId);
    if (!pedido) return null;
    const sessaoId = pedido.itens.find((i) => i.sessaoId)?.sessaoId;
    const inicio = evento?.sessoes.find((s) => s.id === sessaoId)?.inicio ?? evento?.data;
    return { pedido, evento, sessao: inicio ? dataHoraCurta(inicio) : undefined };
}

/** Total do pedido atual sem proteção e sem juros, para cálculos fora de componente. */
export const totalBaseDoPedidoAtual = (): number | null => (atual ? (lerDoc("pedidos", atual)?.total ?? null) : null);
