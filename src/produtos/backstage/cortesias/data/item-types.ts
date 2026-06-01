export type ItemKind = "ticket" | "product" | "combo";

export type ItemStatus =
    | "aceito"
    | "cancelado"
    | "pendente"
    | "processando"
    | "erro";

export interface CortesiaItem {
    id: string;
    kind: ItemKind;
    nome: string;
    subtitulo: string;
    status: ItemStatus;
    emissor: string;
    email: string;
    documento: string;
    transferido: boolean;
    pedidoId: string;
}

export const ITEM_STATUS_META: Record<
    ItemStatus,
    {
        label: string;
        color: "success" | "error" | "warning" | "blue" | "gray" | "brand";
    }
> = {
    aceito: { label: "Aceito", color: "success" },
    cancelado: { label: "Cancelado", color: "error" },
    pendente: { label: "Pendente de cadastro", color: "warning" },
    processando: { label: "Processando", color: "blue" },
    erro: { label: "Erro", color: "error" },
};

export const ITEM_STATUS_ORDER: ItemStatus[] = [
    "aceito",
    "cancelado",
    "pendente",
    "processando",
    "erro",
];

export const ITEM_STATUS_OPTIONS = ITEM_STATUS_ORDER.map((id) => ({
    id,
    label: ITEM_STATUS_META[id].label,
}));

export const ITEM_KIND_LABEL: Record<ItemKind, string> = {
    ticket: "Ingresso",
    combo: "Combo",
    product: "Produto",
};

export const ITEM_KIND_OPTIONS: { id: ItemKind; label: string }[] = [
    { id: "ticket", label: ITEM_KIND_LABEL.ticket },
    { id: "combo", label: ITEM_KIND_LABEL.combo },
    { id: "product", label: ITEM_KIND_LABEL.product },
];
