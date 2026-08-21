import { combos, products, sessions, type AccessType } from "./catalogo";

export type CartKind = "ingresso" | "produto" | "combo";

/** Quantidades por id de item. Um único mapa cobre ingressos, produtos e combos. */
export type Cart = Record<string, number>;

export interface CartLine {
    id: string;
    kind: CartKind;
    quantity: number;
    name: string;
    /** `{grupo} - {tipo}` — só para ingressos e combos. */
    meta?: string;
    /** `{DD} de {mês} • {HH:MM}` — só para ingressos e combos. */
    date?: string;
    unitPrice: number;
    access?: AccessType;
    /** Composição do combo, para o bloco "Detalhes". */
    composicao?: Array<{ quantity: number; ticketName: string; loteName: string; date: string }>;
}

const catalogIndex = (): Record<string, CartLine> => {
    const index: Record<string, CartLine> = {};

    for (const session of sessions) {
        for (const ticket of session.tickets) {
            index[ticket.id] = {
                id: ticket.id,
                kind: "ingresso",
                quantity: 0,
                name: ticket.name,
                meta: `${ticket.group} - ${ticket.type}`,
                date: session.shortDate,
                unitPrice: ticket.price,
                access: ticket.access,
            };
        }
    }

    for (const product of products) {
        index[product.id] = {
            id: product.id,
            kind: "produto",
            quantity: 0,
            name: product.name,
            unitPrice: product.price,
        };
    }

    for (const combo of combos) {
        index[combo.id] = {
            id: combo.id,
            kind: "combo",
            quantity: 0,
            name: combo.name,
            meta: `${combo.group} - ${combo.type}`,
            date: combo.shortDate,
            unitPrice: combo.price,
            composicao: combo.composicao,
        };
    }

    return index;
};

const INDEX = catalogIndex();

export function cartLines(cart: Cart): CartLine[] {
    return Object.entries(cart)
        .filter(([, quantity]) => quantity > 0)
        .map(([id, quantity]) => ({ ...INDEX[id], quantity }))
        .filter((line) => Boolean(line.id));
}

export function cartLinesByKind(cart: Cart, kind: CartKind): CartLine[] {
    return cartLines(cart).filter((line) => line.kind === kind);
}

export const cartTotal = (cart: Cart) => cartLines(cart).reduce((total, line) => total + line.unitPrice * line.quantity, 0);

export const cartCount = (cart: Cart) => cartLines(cart).reduce((total, line) => total + line.quantity, 0);
