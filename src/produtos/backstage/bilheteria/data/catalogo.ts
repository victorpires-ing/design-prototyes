/**
 * Mock do catálogo vendável na bilheteria online.
 *
 * Modelo Ingresse: grupo > ingresso > lote. Um combo é um bundle de ingressos
 * (aqui sempre fixo, com a composição declarada em `composicao`).
 */

export type AccessType = "qrcode" | "facial";

export interface TicketItem {
    id: string;
    name: string;
    lote: string;
    group: string;
    type: string;
    access: AccessType;
    description: string;
    price: number;
}

export interface TicketSession {
    id: string;
    /** Rótulo da sessão, como aparece no cabeçalho do accordion. */
    label: string;
    /** Data curta usada no resumo — `{DD} de {month} • {HH:MM}`. */
    shortDate: string;
    tickets: TicketItem[];
}

export interface ProductItem {
    id: string;
    name: string;
    price: number;
    image: string;
}

export interface ComboComposition {
    quantity: number;
    ticketName: string;
    loteName: string;
    date: string;
}

export interface ComboItem {
    id: string;
    name: string;
    group: string;
    type: string;
    dates: string[];
    description: string;
    price: number;
    shortDate: string;
    composicao: ComboComposition[];
}

const PASSAPORTE_DESC =
    "Os ingressos de PASSAPORTE são válidos para SÁBADO e DOMINGO (08 e 09 de agosto). As vendas para sexta-feira ocorrem separadamente.";

export const sessions: TicketSession[] = [
    {
        id: "sessao-08-08",
        label: "08 de agosto às 14:00",
        shortDate: "08 de agosto • 14:00",
        tickets: [
            {
                id: "tkt-passaporte-inteira",
                name: "Passaporte 2 dias — Inteira",
                lote: "1º lote",
                group: "Pista",
                type: "Inteira",
                access: "qrcode",
                description: PASSAPORTE_DESC,
                price: 515.97,
            },
            {
                id: "tkt-passaporte-meia",
                name: "Passaporte 2 dias — Meia-entrada",
                lote: "1º lote",
                group: "Pista",
                type: "Meia-entrada",
                access: "facial",
                description: PASSAPORTE_DESC,
                price: 515.97,
            },
        ],
    },
    {
        id: "sessao-09-08",
        label: "09 de agosto às 14:30",
        shortDate: "09 de agosto • 14:30",
        tickets: [
            {
                id: "tkt-domingo-inteira",
                name: "Domingo — Inteira",
                lote: "2º lote",
                group: "Pista",
                type: "Inteira",
                access: "qrcode",
                description: PASSAPORTE_DESC,
                price: 389.9,
            },
            {
                id: "tkt-domingo-vip",
                name: "Domingo — Camarote",
                lote: "2º lote",
                group: "Camarote",
                type: "Inteira",
                access: "facial",
                description: PASSAPORTE_DESC,
                price: 780.0,
            },
        ],
    },
];

export const products: ProductItem[] = [
    {
        id: "prd-copo",
        name: "Copo oficial do evento",
        price: 515.97,
        image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&q=80",
    },
    {
        id: "prd-camiseta",
        name: "Camiseta oficial do evento",
        price: 515.97,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80",
    },
];

export const combos: ComboItem[] = [
    {
        id: "cmb-passaporte-2-dias",
        name: "Passaporte de 2 dias",
        group: "Pista",
        type: "Inteira",
        dates: ["sáb, 01/03/26 • 00:00", "dom, 02/03/26 • 00:00"],
        description: PASSAPORTE_DESC,
        price: 515.97,
        shortDate: "01 de março • 00:00",
        composicao: [
            { quantity: 1, ticketName: "Sábado — Inteira", loteName: "1º lote", date: "01 de março • 00:00" },
            { quantity: 1, ticketName: "Domingo — Inteira", loteName: "1º lote", date: "02 de março • 00:00" },
        ],
    },
    {
        id: "cmb-passaporte-vip",
        name: "Passaporte de 2 dias — Camarote",
        group: "Camarote",
        type: "Inteira",
        dates: ["sáb, 01/03/26 • 00:00", "dom, 02/03/26 • 00:00"],
        description: PASSAPORTE_DESC,
        price: 980.0,
        shortDate: "01 de março • 00:00",
        composicao: [
            { quantity: 1, ticketName: "Sábado — Camarote", loteName: "1º lote", date: "01 de março • 00:00" },
            { quantity: 1, ticketName: "Domingo — Camarote", loteName: "1º lote", date: "02 de março • 00:00" },
        ],
    },
];

/* ------------------------------------------------------------------ */
/*  Compradores                                                        */
/* ------------------------------------------------------------------ */

export interface Buyer {
    /** Identifica a conta — e-mails podem se repetir entre contas. */
    id: string;
    name: string;
    email: string;
    /** WhatsApp da conta, já formatado. */
    phone?: string;
    /** Documento já mascarado, como o backend devolve. */
    maskedDocument?: string;
    initials: string;
}

const knownBuyers: Array<Buyer & { document?: string }> = [
    {
        id: "acc-joao",
        name: "João Silva",
        phone: "(11) 98812-4477",
        email: "joaosilva@gmail.com",
        document: "12345678910",
        maskedDocument: "CPF •••.•••.123-10",
        initials: "JS",
    },
    {
        id: "acc-maria",
        name: "Maria Cunha",
        phone: "(21) 99640-1382",
        email: "maria.cunha@gmail.com",
        document: "98765432100",
        maskedDocument: "CPF •••.•••.432-00",
        initials: "MC",
    },
    // Duas contas com o mesmo e-mail — o passo 1 precisa deixar escolher qual delas.
    {
        id: "acc-ana",
        name: "Ana Ribeiro",
        phone: "(31) 99125-7708",
        email: "familia@gmail.com",
        document: "11122233344",
        maskedDocument: "CPF •••.•••.233-44",
        initials: "AR",
    },
    {
        id: "acc-carlos",
        name: "Carlos Ribeiro",
        phone: "(31) 98431-2260",
        email: "familia@gmail.com",
        document: "55566677788",
        maskedDocument: "CPF •••.•••.677-88",
        initials: "CR",
    },
];

export const isEmail = (value: string) => value.includes("@");

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** Um e-mail pode estar em mais de uma conta; documento é sempre único. */
export function findBuyers(term: string): Buyer[] {
    const value = term.trim().toLowerCase();
    if (!value) return [];

    if (isEmail(value)) {
        return knownBuyers.filter((buyer) => buyer.email === value);
    }

    const digits = onlyDigits(value);
    if (!digits) return [];
    return knownBuyers.filter((buyer) => buyer.document === digits);
}

export const formatBRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
