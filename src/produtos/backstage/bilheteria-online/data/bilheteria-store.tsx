/* ------------------------------------------------------------------ */
/*  Store da Bilheteria Online (in-memory, escopo do protótipo).       */
/* ------------------------------------------------------------------ */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { EVENTO_TEM_ITENS, type Comprador } from "./bilheteria-data";

export type PedidoStatus = "pendente" | "aprovado" | "cancelado";
export type PedidoTipo = "link" | "saldo" | "pix" | "debito";

export interface PedidoItem {
    itemId: string;
    qtd: number;
}

export interface Pedido {
    id: string;
    status: PedidoStatus;
    tipo: PedidoTipo;
    /** Ausente em venda sem identificação. */
    comprador?: Comprador;
    itens: PedidoItem[];
    valor: number;
    data: string; // dd/mm/aaaa
    emissor: string;
    /** Link de pagamento (quando tipo === "link"). */
    link?: string;
    /** Código Pix copia e cola (quando tipo === "pix"). */
    pixCode?: string;
}

export interface NovoPedido {
    tipo: PedidoTipo;
    comprador?: Comprador;
    itens: PedidoItem[];
    valor: number;
}

const EMISSOR = "nome@exemplo.com";

const hoje = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const idPedido = () => {
    const hex = (n: number) => Math.floor(n).toString(16).padStart(4, "0");
    const t = Date.now();
    return `${hex(t % 0xffff)}${hex((t / 7) % 0xffff)}-${hex((t / 13) % 0xffff)}-${hex((t / 17) % 0xffff)}`;
};

const linkPagamento = (id: string) => `cart.ingresse.com/${id.replace(/-/g, "").slice(0, 24)}`;

/** Código Pix copia e cola (mock no formato EMV). */
const pixCopiaECola = (id: string, valor: number) => {
    const chave = id.replace(/-/g, "").toUpperCase();
    const v = valor.toFixed(2);
    return `00020126580014BR.GOV.BCB.PIX0136${chave}5204000053039865406${v}5802BR5913Ingresse6009SAO PAULO62070503***6304ABCD`;
};

/** Métodos que já saem aprovados na venda de balcão (débito por aproximação / saldo). */
const aprovaNaHora = (t: PedidoTipo) => t === "saldo" || t === "debito";

interface BilheteriaContextValue {
    pedidos: Pedido[];
    temItens: boolean;
    criarPedido: (dados: NovoPedido) => Pedido;
    cancelarPedido: (id: string) => void;
}

const BilheteriaContext = createContext<BilheteriaContextValue | null>(null);

export function BilheteriaProvider({ children }: { children: ReactNode }) {
    // Começa vazio: cai no estado inicial ("Comece a vender") e popula ao vender.
    const [pedidos, setPedidos] = useState<Pedido[]>([]);

    const criarPedido = useCallback((dados: NovoPedido) => {
        const id = idPedido();
        const novo: Pedido = {
            id,
            status: aprovaNaHora(dados.tipo) ? "aprovado" : "pendente",
            tipo: dados.tipo,
            comprador: dados.comprador,
            itens: dados.itens,
            valor: dados.valor,
            data: hoje(),
            emissor: EMISSOR,
            link: dados.tipo === "link" ? linkPagamento(id) : undefined,
            pixCode: dados.tipo === "pix" ? pixCopiaECola(id, dados.valor) : undefined,
        };
        setPedidos((prev) => [novo, ...prev]);
        return novo;
    }, []);

    const cancelarPedido = useCallback((id: string) => {
        setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, status: "cancelado" } : p)));
    }, []);

    const value = useMemo<BilheteriaContextValue>(() => ({ pedidos, temItens: EVENTO_TEM_ITENS, criarPedido, cancelarPedido }), [pedidos, criarPedido, cancelarPedido]);

    return <BilheteriaContext.Provider value={value}>{children}</BilheteriaContext.Provider>;
}

export function useBilheteria() {
    const ctx = useContext(BilheteriaContext);
    if (!ctx) throw new Error("useBilheteria deve ser usado dentro de <BilheteriaProvider>.");
    return ctx;
}

export const STATUS_META: Record<PedidoStatus, { label: string; color: "warning" | "success" | "error" }> = {
    pendente: { label: "Pendente", color: "warning" },
    aprovado: { label: "Aprovado", color: "success" },
    cancelado: { label: "Cancelado", color: "error" },
};

export const TIPO_LABEL: Record<PedidoTipo, string> = {
    link: "Link de pagamento",
    saldo: "Saldo do produtor",
    pix: "Pix",
    debito: "Cartão de débito",
};
