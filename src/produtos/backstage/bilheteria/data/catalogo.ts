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
    /** Rótulo da sessão, como aparece no cabeçalho da lista. */
    label: string;
    /** Data curta usada no resumo — `{DD} de {month} • {HH:MM}`. */
    shortDate: string;
    /** Partes da data, usadas nos chips do carrossel de seleção. */
    weekday: string;
    day: string;
    month: string;
    year: string;
    time: string;
    /** Data sem ingresso disponível — o chip aparece como "Esgotado" e não é selecionável. */
    soldOut?: boolean;
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

const GERAL_DESC = "Entrada válida apenas para a data e o horário selecionados. Sujeito à disponibilidade do lote.";

const PASSAPORTE_DESC =
    "Os ingressos de PASSAPORTE são válidos para SÁBADO e DOMINGO (08 e 09 de agosto). As vendas para sexta-feira ocorrem separadamente.";

const ticket = (
    id: string,
    name: string,
    group: string,
    type: string,
    lote: string,
    access: AccessType,
    price: number,
    description = GERAL_DESC,
): TicketItem => ({ id: `tkt-${id}`, name, group, type, lote, access, price, description });

interface SessionSpec {
    day: string;
    weekday: string;
    longDate: string;
    month: string;
    year: string;
    time: string;
    soldOut?: boolean;
}

const makeSession = ({ day, weekday, longDate, month, year, time, soldOut }: SessionSpec, tickets: TicketItem[]): TicketSession => ({
    id: `sessao-${day}-08`,
    label: `${longDate} às ${time}`,
    shortDate: `${longDate} • ${time}`,
    weekday,
    day,
    month,
    year,
    time,
    soldOut,
    tickets,
});

export const sessions: TicketSession[] = [
    makeSession({ day: "07", weekday: "Sexta", longDate: "07 de agosto", month: "Ago", year: "2026", time: "14:00" }, [
        ticket("07-pista-inteira", "Pista · Inteira", "Pista", "Inteira", "1º lote", "qrcode", 389.9),
        ticket("07-pista-meia", "Pista · Meia-entrada", "Pista", "Meia-entrada", "1º lote", "facial", 194.95),
        ticket("07-premium-inteira", "Pista Premium · Inteira", "Pista Premium", "Inteira", "1º lote", "qrcode", 589.9),
        ticket("07-camarote-inteira", "Camarote · Inteira", "Camarote", "Inteira", "1º lote", "facial", 780.0),
    ]),
    makeSession({ day: "08", weekday: "Sábado", longDate: "08 de agosto", month: "Ago", year: "2026", time: "14:00" }, [
        ticket("08-passaporte-inteira", "Passaporte 2 dias · Inteira", "Pista", "Inteira", "1º lote", "qrcode", 515.97, PASSAPORTE_DESC),
        ticket("08-passaporte-meia", "Passaporte 2 dias · Meia-entrada", "Pista", "Meia-entrada", "1º lote", "facial", 257.98, PASSAPORTE_DESC),
        ticket("08-premium-inteira", "Pista Premium · Inteira", "Pista Premium", "Inteira", "2º lote", "qrcode", 649.9),
        ticket("08-camarote-inteira", "Camarote · Inteira", "Camarote", "Inteira", "2º lote", "facial", 840.0),
        ticket("08-camarote-open", "Camarote Open Bar · Inteira", "Camarote", "Inteira", "2º lote", "facial", 1180.0),
    ]),
    makeSession({ day: "09", weekday: "Domingo", longDate: "09 de agosto", month: "Ago", year: "2026", time: "14:30" }, [
        ticket("09-pista-inteira", "Domingo · Inteira", "Pista", "Inteira", "2º lote", "qrcode", 389.9),
        ticket("09-pista-meia", "Domingo · Meia-entrada", "Pista", "Meia-entrada", "2º lote", "facial", 194.95),
        ticket("09-camarote-inteira", "Domingo · Camarote", "Camarote", "Inteira", "2º lote", "facial", 780.0),
    ]),
    makeSession({ day: "14", weekday: "Sexta", longDate: "14 de agosto", month: "Ago", year: "2026", time: "14:00" }, [
        ticket("14-pista-inteira", "Pista · Inteira", "Pista", "Inteira", "2º lote", "qrcode", 419.9),
        ticket("14-premium-inteira", "Pista Premium · Inteira", "Pista Premium", "Inteira", "2º lote", "qrcode", 619.9),
        ticket("14-camarote-inteira", "Camarote · Inteira", "Camarote", "Inteira", "2º lote", "facial", 820.0),
    ]),
    makeSession({ day: "15", weekday: "Sábado", longDate: "15 de agosto", month: "Ago", year: "2026", time: "14:00" }, [
        ticket("15-pista-inteira", "Pista · Inteira", "Pista", "Inteira", "3º lote", "qrcode", 449.9),
        ticket("15-pista-meia", "Pista · Meia-entrada", "Pista", "Meia-entrada", "3º lote", "facial", 224.95),
        ticket("15-premium-inteira", "Pista Premium · Inteira", "Pista Premium", "Inteira", "3º lote", "qrcode", 679.9),
        ticket("15-camarote-open", "Camarote Open Bar · Inteira", "Camarote", "Inteira", "3º lote", "facial", 1240.0),
    ]),
    makeSession({ day: "16", weekday: "Domingo", longDate: "16 de agosto", month: "Ago", year: "2026", time: "14:30", soldOut: true }, [
        ticket("16-pista-inteira", "Encerramento · Inteira", "Pista", "Inteira", "3º lote", "qrcode", 409.9),
        ticket("16-camarote-inteira", "Encerramento · Camarote", "Camarote", "Inteira", "3º lote", "facial", 860.0),
    ]),
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
            { quantity: 1, ticketName: "Sábado · Inteira", loteName: "1º lote", date: "01 de março • 00:00" },
            { quantity: 1, ticketName: "Domingo · Inteira", loteName: "1º lote", date: "02 de março • 00:00" },
        ],
    },
    {
        id: "cmb-passaporte-vip",
        name: "Passaporte de 2 dias · Camarote",
        group: "Camarote",
        type: "Inteira",
        dates: ["sáb, 01/03/26 • 00:00", "dom, 02/03/26 • 00:00"],
        description: PASSAPORTE_DESC,
        price: 980.0,
        shortDate: "01 de março • 00:00",
        composicao: [
            { quantity: 1, ticketName: "Sábado · Camarote", loteName: "1º lote", date: "01 de março • 00:00" },
            { quantity: 1, ticketName: "Domingo · Camarote", loteName: "1º lote", date: "02 de março • 00:00" },
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

/* ------------------------------------------------------------------ */
/*  Configuração do evento                                             */
/*                                                                     */
/*  Pontos levantados na apresentação do MVP: o limite por documento só */
/*  faz sentido quando há documento, e eventos com facial ou            */
/*  credenciamento não                                                  */
/*  podem admitir venda anônima.                                       */
/* ------------------------------------------------------------------ */

export const EVENTO = {
    /** Limite de ingressos por documento configurado no evento. `0` = sem limite. */
    limitePorDocumento: 4,
    /**
     * Liga a exigência de identificar o comprador. Fica ativo em eventos com
     * acesso por face ou credenciamento, onde o ingresso nasce nominal.
     */
    identificacaoObrigatoria: false,
    /** Dias até o link de pagamento expirar. */
    validadeLinkDias: 3,
};

/*
 * "1 ingresso" / "4 ingressos": o limite é configurável e chega a valer 1.
 * Documento, não CPF: quem compra pode se identificar por passaporte, e a
 * busca do passo 1 já fala em documento.
 */
export const ingressosPorDocumento = (limite: number) =>
    `${limite} ${limite === 1 ? "ingresso" : "ingressos"} por documento`;

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
