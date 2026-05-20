export interface TicketEntry {
    id: string;
    name: string;
    type: string;
}

export interface GroupSection {
    name: string;
    tickets: TicketEntry[];
}

export interface SessionSection {
    id: string;
    datetime: string;
    groups: GroupSection[];
}

export interface ProductEntry {
    id: string;
    name: string;
    imageUrl: string;
}

export interface ComboSubItem {
    name: string;
    type: string;
    date: string;
}

export interface ComboEntry {
    id: string;
    name: string;
    subtitle: string;
    subItems: ComboSubItem[];
}

export const MAX_SELECTIONS = 10;

export const SESSIONS: SessionSection[] = [
    {
        id: "session-1",
        datetime: "08 de agosto às 14:00",
        groups: [
            {
                name: "Pista",
                tickets: [
                    { id: "tk-1-1", name: "Inteira", type: "Lote 1" },
                    { id: "tk-1-2", name: "Meia-entrada", type: "Lote 1" },
                    { id: "tk-1-3", name: "Solidária", type: "Lote único" },
                ],
            },
            {
                name: "VIP",
                tickets: [
                    { id: "tk-1-4", name: "Inteira", type: "Lote 1" },
                    { id: "tk-1-5", name: "Meia-entrada", type: "Lote 1" },
                    { id: "tk-1-6", name: "Camarote duplo", type: "Lote único" },
                ],
            },
        ],
    },
    {
        id: "session-2",
        datetime: "09 de agosto às 12:00",
        groups: [
            {
                name: "Pista",
                tickets: [
                    { id: "tk-2-1", name: "Inteira", type: "Lote 2" },
                    { id: "tk-2-2", name: "Meia-entrada", type: "Lote 2" },
                ],
            },
        ],
    },
];

export const PRODUCTS: ProductEntry[] = [
    { id: "prod-1", name: "Camiseta oficial Semana Santa", imageUrl: "/event-cover.png" },
    { id: "prod-2", name: "Caneca comemorativa 2026", imageUrl: "/event-cover.png" },
];

export const COMBOS: ComboEntry[] = [
    {
        id: "combo-1",
        name: "Combo Família",
        subtitle: "Sessão 1 + 1 produto",
        subItems: [
            { name: "Inteira", type: "Pista", date: "08 de ago · 14:00" },
            { name: "Meia-entrada", type: "Pista", date: "08 de ago · 14:00" },
            { name: "Camiseta oficial", type: "Produto", date: "—" },
        ],
    },
    {
        id: "combo-2",
        name: "Combo VIP Casal",
        subtitle: "Sessão 1 + brinde",
        subItems: [
            { name: "Inteira", type: "VIP", date: "08 de ago · 14:00" },
            { name: "Inteira", type: "VIP", date: "08 de ago · 14:00" },
            { name: "Caneca 2026", type: "Brinde", date: "—" },
        ],
    },
];

/* ------------------------------------------------------------------ */
/*  Resolver: id → typed details                                      */
/* ------------------------------------------------------------------ */

export type ItemKind = "ticket" | "product" | "combo";

export interface TicketItemDetails {
    id: string;
    kind: "ticket";
    name: string;
    groupName: string;
    ticketType: string;
    sessionDate: string;
}

export interface ProductItemDetails {
    id: string;
    kind: "product";
    name: string;
    imageUrl: string;
}

export interface ComboItemDetails {
    id: string;
    kind: "combo";
    name: string;
    subtitle: string;
    subItems: ComboSubItem[];
}

export type ItemDetails = TicketItemDetails | ProductItemDetails | ComboItemDetails;

let registry: Map<string, ItemDetails> | null = null;

function buildRegistry(): Map<string, ItemDetails> {
    const map = new Map<string, ItemDetails>();
    for (const session of SESSIONS) {
        for (const group of session.groups) {
            for (const t of group.tickets) {
                map.set(t.id, {
                    id: t.id,
                    kind: "ticket",
                    name: t.name,
                    groupName: group.name,
                    ticketType: t.type,
                    sessionDate: session.datetime,
                });
            }
        }
    }
    for (const p of PRODUCTS) {
        map.set(p.id, {
            id: p.id,
            kind: "product",
            name: p.name,
            imageUrl: p.imageUrl,
        });
    }
    for (const c of COMBOS) {
        map.set(c.id, {
            id: c.id,
            kind: "combo",
            name: c.name,
            subtitle: c.subtitle,
            subItems: c.subItems,
        });
    }
    return map;
}

export function getItemDetails(id: string): ItemDetails | undefined {
    if (!registry) registry = buildRegistry();
    return registry.get(id);
}

/** Convenience: returns a compact {label, sublabel} description for an id. */
export function getItemSummary(id: string): { label: string; sublabel: string } | undefined {
    const details = getItemDetails(id);
    if (!details) return undefined;
    if (details.kind === "ticket") {
        return {
            label: `${details.name} • ${details.groupName}`,
            sublabel: `${details.ticketType} · ${details.sessionDate}`,
        };
    }
    if (details.kind === "product") {
        return { label: details.name, sublabel: "Produto" };
    }
    return { label: details.name, sublabel: details.subtitle };
}
