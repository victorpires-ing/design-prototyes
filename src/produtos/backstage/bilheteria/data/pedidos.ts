/** Mock dos pedidos emitidos pela bilheteria online. */

export type PedidoStatus = "pendente" | "aprovado" | "cancelado";
export type PedidoTipo = "link" | "saldo";

export interface PedidoItem {
    id: string;
    /** Quantidade comprada desse item. */
    quantity: number;
    name: string;
    /** `{Grupo_nome} • {Sessão}` ou a composição resumida do combo. */
    subtitle?: string;
    /** Lote do ingresso, quando o item é um ingresso. */
    lote?: string;
}

export interface Pedido {
    id: string;
    status: PedidoStatus;
    tipo: PedidoTipo;
    /** Nome do ingresso/lote que dá título ao slideout. */
    title: string;
    sessions: string;
    sessionShort: string;
    emissor: string;
    destinatario: string;
    /** ISO curto — usado para ordenar. */
    dataVenda: string;
    dataVendaLabel: string;
    valor: number;
    paymentLink: string;
    itens: PedidoItem[];
    /** Data/hora do último reenvio do link de pagamento. */
    resentAt?: string;
}

export const PEDIDO_STATUS_META: Record<PedidoStatus, { label: string; color: "warning" | "success" | "gray" }> = {
    pendente: { label: "Pendente", color: "warning" },
    aprovado: { label: "Aprovado", color: "success" },
    cancelado: { label: "Cancelado", color: "gray" },
};

export const PEDIDO_TIPO_LABEL: Record<PedidoTipo, string> = {
    link: "Link de pagamento",
    saldo: "Saldo do produtor",
};

const PAYMENT_LINK = "cart.ingresse.com/971c14dc-89ba-41dd-a469-cad4a1fde120";

const baseItens = (): PedidoItem[] => [
    { id: "it-1", quantity: 2, name: "Passaporte 2 dias - Inteira", subtitle: "Pista • 08 de agosto às 14:00", lote: "1º lote" },
    { id: "it-2", quantity: 1, name: "Copo oficial do evento" },
    { id: "it-3", quantity: 1, name: "Passaporte de 2 dias", subtitle: "Combo • 2 sessões" },
    {
        id: "it-4",
        quantity: 1,
        name: "Nome muito longo para um item de ingresso - Meia-entrada",
        subtitle: "Camarote inferior direito • 27/09 15:00",
        lote: "3º lote",
    },
    { id: "it-5", quantity: 1, name: "Domingo - Inteira", subtitle: "Pista • 09 de agosto às 14:30", lote: "2º lote" },
];

const EMISSORES = ["nome@exemplo.com", "operacao@exemplo.com", "bilheteria@exemplo.com"];

function buildPedidos(): Pedido[] {
    const rows: Array<[PedidoStatus, PedidoTipo, string, number]> = [
        ["pendente", "link", "26/05/2026", 198.0],
        ["pendente", "link", "26/05/2026", 198.0],
        ["pendente", "saldo", "26/05/2026", 220.0],
        ["aprovado", "saldo", "25/05/2026", 89.0],
        ["aprovado", "link", "25/05/2026", 340.0],
        ["aprovado", "link", "24/05/2026", 250.0],
        ["aprovado", "link", "23/05/2026", 240.0],
        ["cancelado", "saldo", "23/05/2026", 49.0],
        ["cancelado", "saldo", "22/05/2026", 115.0],
        ["cancelado", "saldo", "22/05/2026", 1500.0],
        ["aprovado", "link", "21/05/2026", 430.0],
        ["pendente", "link", "21/05/2026", 76.5],
        ["aprovado", "saldo", "20/05/2026", 610.0],
        ["cancelado", "link", "19/05/2026", 92.0],
        ["aprovado", "saldo", "19/05/2026", 1230.9],
        ["pendente", "saldo", "18/05/2026", 310.0],
        ["aprovado", "link", "18/05/2026", 145.0],
        ["aprovado", "link", "17/05/2026", 88.0],
        ["cancelado", "saldo", "16/05/2026", 260.0],
        ["aprovado", "saldo", "15/05/2026", 512.4],
    ];

    return rows.map(([status, tipo, data, valor], index) => {
        const [dd, mm, yyyy] = data.split("/");
        return {
            id: `123e4567-e89b-12d3-a456-${(426614174000 + index).toString()}`,
            status,
            tipo,
            title: "PASSAPORTE - SÁBADO + DOMINGO - LOTE 2 - LOTE 2",
            sessions: "08 de ago de 2026 - 14:00 | 09 de ago de 2026 - 14:00",
            sessionShort: "Sáb, 08/08 • às 14h00",
            emissor: EMISSORES[index % EMISSORES.length],
            destinatario: "joaosilva@gmail.com",
            dataVenda: `${yyyy}-${mm}-${dd}`,
            dataVendaLabel: data,
            valor,
            paymentLink: PAYMENT_LINK,
            itens: baseItens(),
        };
    });
}

export const pedidos: Pedido[] = buildPedidos();

export const pedidosResumo = {
    aprovados: 123,
    pendentes: 96,
    cancelados: 96,
};

export const emissores = EMISSORES;
