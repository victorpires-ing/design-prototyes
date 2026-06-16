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
        datetime: "16 de agosto às 16:00",
        groups: [
            {
                name: "Cadeira Superior Norte",
                tickets: [
                    { id: "tk-1", name: "Esquadrão de Aço", type: "Lote único" },
                    { id: "tk-2", name: "Inteira", type: "Lote único" },
                    { id: "tk-3", name: "Meia-entrada", type: "Lote único" },
                    { id: "tk-4", name: "Idoso 60+", type: "Lote único" },
                ],
            },
            {
                name: "Cadeira Superior Leste",
                tickets: [
                    { id: "tk-5", name: "Sócio Associação", type: "Lote único" },
                    { id: "tk-6", name: "Inteira", type: "Lote único" },
                    { id: "tk-7", name: "Meia-entrada", type: "Lote único" },
                    { id: "tk-8", name: "Meia-entrada idoso", type: "Lote único" },
                ],
            },
            {
                name: "Cadeira Norte",
                tickets: [
                    { id: "tk-9", name: "Esquadrão de Aço", type: "Lote único" },
                    { id: "tk-10", name: "Esquadrão na Fonte", type: "Lote único" },
                    { id: "tk-11", name: "Inteira", type: "Lote único" },
                    { id: "tk-12", name: "Meia-entrada", type: "Lote único" },
                    { id: "tk-13", name: "Dependente criança menor que 12 anos", type: "Lote único" },
                ],
            },
            {
                name: "Cadeira Leste",
                tickets: [
                    { id: "tk-14", name: "Sócio Associação", type: "Lote único" },
                    { id: "tk-15", name: "Inteira", type: "Lote único" },
                    { id: "tk-16", name: "Meia-entrada", type: "Lote único" },
                    { id: "tk-17", name: "Idoso 60+", type: "Lote único" },
                ],
            },
            {
                name: "Cadeira Especial Superior",
                tickets: [
                    { id: "tk-18", name: "Inteira", type: "Lote único" },
                    { id: "tk-19", name: "Meia-entrada", type: "Lote único" },
                    { id: "tk-20", name: "Meia-entrada idoso", type: "Lote único" },
                ],
            },
            {
                name: "Visitante Superior",
                tickets: [
                    { id: "tk-21", name: "Inteira", type: "Lote único" },
                    { id: "tk-22", name: "Meia-entrada", type: "Lote único" },
                ],
            },
            {
                name: "Cadeira Sudeste Inferior",
                tickets: [
                    { id: "tk-23", name: "Esquadrão na Fonte", type: "Lote único" },
                    { id: "tk-24", name: "Inteira", type: "Lote único" },
                    { id: "tk-25", name: "Meia-entrada", type: "Lote único" },
                    { id: "tk-26", name: "Dependente criança menor que 12 anos", type: "Lote único" },
                ],
            },
            {
                name: "Cadeira Sudeste Intermediário",
                tickets: [
                    { id: "tk-27", name: "Inteira", type: "Lote único" },
                    { id: "tk-28", name: "Meia-entrada", type: "Lote único" },
                    { id: "tk-29", name: "Idoso 60+", type: "Lote único" },
                ],
            },
            {
                name: "Cadeira Especial Inferior",
                tickets: [
                    { id: "tk-30", name: "Sócio Associação", type: "Lote único" },
                    { id: "tk-31", name: "Inteira", type: "Lote único" },
                    { id: "tk-32", name: "Meia-entrada", type: "Lote único" },
                    { id: "tk-33", name: "Meia-entrada idoso", type: "Lote único" },
                ],
            },
        ],
    },
];

export const PRODUCTS: ProductEntry[] = [];

export const COMBOS: ComboEntry[] = [];

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
