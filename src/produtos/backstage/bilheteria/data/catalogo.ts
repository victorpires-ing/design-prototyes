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

/** Agrupador de combos — faz no carrossel o papel que a data faz nos ingressos. */
export interface ComboCategory {
    id: string;
    name: string;
    /** Agrupador sem combo disponível — o chip aparece como "Esgotado" e não é selecionável. */
    soldOut?: boolean;
    combos: ComboItem[];
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
    id: `sessao-${day}-08-${time.replace(":", "")}`,
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

/*
  Uma sessão é data + horário. Algumas datas têm mais de um horário: o carrossel
  mostra a data uma vez e o seletor de horário abaixo dele escolhe a sessão.
*/
const SEXTA_07 = { day: "07", weekday: "Sexta", longDate: "07 de agosto", month: "Ago", year: "2026" };
const SABADO_08 = { day: "08", weekday: "Sábado", longDate: "08 de agosto", month: "Ago", year: "2026" };
const DOMINGO_09 = { day: "09", weekday: "Domingo", longDate: "09 de agosto", month: "Ago", year: "2026" };
const SEXTA_14 = { day: "14", weekday: "Sexta", longDate: "14 de agosto", month: "Ago", year: "2026" };
const SABADO_15 = { day: "15", weekday: "Sábado", longDate: "15 de agosto", month: "Ago", year: "2026" };
const DOMINGO_16 = { day: "16", weekday: "Domingo", longDate: "16 de agosto", month: "Ago", year: "2026" };

export const sessions: TicketSession[] = [
    makeSession({ ...SEXTA_07, time: "14:00" }, [
        ticket("07-pista-inteira", "Pista · Inteira", "Pista", "Inteira", "1º lote", "qrcode", 389.9),
        ticket("07-pista-meia", "Pista · Meia-entrada", "Pista", "Meia-entrada", "1º lote", "facial", 194.95),
        ticket("07-premium-inteira", "Pista Premium · Inteira", "Pista Premium", "Inteira", "1º lote", "qrcode", 589.9),
        ticket("07-camarote-inteira", "Camarote · Inteira", "Camarote", "Inteira", "1º lote", "facial", 780.0),
    ]),
    makeSession({ ...SEXTA_07, time: "20:00" }, [
        ticket("07n-pista-inteira", "Pista · Inteira", "Pista", "Inteira", "1º lote", "qrcode", 419.9),
        ticket("07n-pista-meia", "Pista · Meia-entrada", "Pista", "Meia-entrada", "1º lote", "facial", 209.95),
        ticket("07n-camarote-inteira", "Camarote · Inteira", "Camarote", "Inteira", "1º lote", "facial", 820.0),
    ]),
    makeSession({ ...SABADO_08, time: "14:00" }, [
        ticket("08-passaporte-inteira", "Passaporte 2 dias · Inteira", "Pista", "Inteira", "1º lote", "qrcode", 515.97, PASSAPORTE_DESC),
        ticket("08-passaporte-meia", "Passaporte 2 dias · Meia-entrada", "Pista", "Meia-entrada", "1º lote", "facial", 257.98, PASSAPORTE_DESC),
        ticket("08-premium-inteira", "Pista Premium · Inteira", "Pista Premium", "Inteira", "2º lote", "qrcode", 649.9),
        ticket("08-camarote-inteira", "Camarote · Inteira", "Camarote", "Inteira", "2º lote", "facial", 840.0),
        ticket("08-camarote-open", "Camarote Open Bar · Inteira", "Camarote", "Inteira", "2º lote", "facial", 1180.0),
    ]),
    makeSession({ ...SABADO_08, time: "18:00", soldOut: true }, [
        ticket("08t-pista-inteira", "Pista · Inteira", "Pista", "Inteira", "2º lote", "qrcode", 449.9),
        ticket("08t-camarote-inteira", "Camarote · Inteira", "Camarote", "Inteira", "2º lote", "facial", 880.0),
    ]),
    makeSession({ ...SABADO_08, time: "22:00" }, [
        ticket("08n-pista-inteira", "Pista · Inteira", "Pista", "Inteira", "2º lote", "qrcode", 469.9),
        ticket("08n-premium-inteira", "Pista Premium · Inteira", "Pista Premium", "Inteira", "2º lote", "qrcode", 689.9),
        ticket("08n-camarote-open", "Camarote Open Bar · Inteira", "Camarote", "Inteira", "2º lote", "facial", 1240.0),
    ]),
    makeSession({ ...DOMINGO_09, time: "14:30" }, [
        ticket("09-pista-inteira", "Domingo · Inteira", "Pista", "Inteira", "2º lote", "qrcode", 389.9),
        ticket("09-pista-meia", "Domingo · Meia-entrada", "Pista", "Meia-entrada", "2º lote", "facial", 194.95),
        ticket("09-camarote-inteira", "Domingo · Camarote", "Camarote", "Inteira", "2º lote", "facial", 780.0),
    ]),
    makeSession({ ...SEXTA_14, time: "14:00" }, [
        ticket("14-pista-inteira", "Pista · Inteira", "Pista", "Inteira", "2º lote", "qrcode", 419.9),
        ticket("14-premium-inteira", "Pista Premium · Inteira", "Pista Premium", "Inteira", "2º lote", "qrcode", 619.9),
        ticket("14-camarote-inteira", "Camarote · Inteira", "Camarote", "Inteira", "2º lote", "facial", 820.0),
    ]),
    makeSession({ ...SEXTA_14, time: "20:00" }, [
        ticket("14n-pista-inteira", "Pista · Inteira", "Pista", "Inteira", "2º lote", "qrcode", 449.9),
        ticket("14n-camarote-inteira", "Camarote · Inteira", "Camarote", "Inteira", "2º lote", "facial", 860.0),
    ]),
    makeSession({ ...SABADO_15, time: "14:00" }, [
        ticket("15-pista-inteira", "Pista · Inteira", "Pista", "Inteira", "3º lote", "qrcode", 449.9),
        ticket("15-pista-meia", "Pista · Meia-entrada", "Pista", "Meia-entrada", "3º lote", "facial", 224.95),
        ticket("15-premium-inteira", "Pista Premium · Inteira", "Pista Premium", "Inteira", "3º lote", "qrcode", 679.9),
        ticket("15-camarote-open", "Camarote Open Bar · Inteira", "Camarote", "Inteira", "3º lote", "facial", 1240.0),
    ]),
    makeSession({ ...DOMINGO_16, time: "14:30", soldOut: true }, [
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

const COMBO_DESC = "Os ingressos do combo são emitidos juntos e valem para as datas e os setores da composição.";

const combo = (
    id: string,
    name: string,
    group: string,
    price: number,
    composicao: ComboComposition[],
    description = COMBO_DESC,
): ComboItem => ({
    id: `cmb-${id}`,
    name,
    group,
    type: "Inteira",
    dates: [...new Set(composicao.map((item) => item.date))],
    description,
    price,
    shortDate: composicao[0].date,
    composicao,
});

export const comboCategories: ComboCategory[] = [
    {
        id: "passaportes",
        name: "Passaportes",
        combos: [
            combo(
                "passaporte-2-dias",
                "Passaporte de 2 dias",
                "Pista",
                515.97,
                [
                    { quantity: 1, ticketName: "Sábado · Inteira", loteName: "1º lote", date: "08 de agosto • 14:00" },
                    { quantity: 1, ticketName: "Domingo · Inteira", loteName: "2º lote", date: "09 de agosto • 14:30" },
                ],
                PASSAPORTE_DESC,
            ),
            combo(
                "passaporte-camarote",
                "Passaporte de 2 dias · Camarote",
                "Camarote",
                980.0,
                [
                    { quantity: 1, ticketName: "Camarote · Inteira", loteName: "2º lote", date: "08 de agosto • 14:00" },
                    { quantity: 1, ticketName: "Domingo · Camarote", loteName: "2º lote", date: "09 de agosto • 14:30" },
                ],
                PASSAPORTE_DESC,
            ),
        ],
    },
    {
        id: "casal",
        name: "Casal",
        combos: [
            combo("casal-pista", "Combo Casal · Pista", "Pista", 701.82, [
                { quantity: 2, ticketName: "Pista · Inteira", loteName: "1º lote", date: "07 de agosto • 14:00" },
            ]),
            combo("casal-camarote", "Combo Casal · Camarote", "Camarote", 1404.0, [
                { quantity: 2, ticketName: "Camarote · Inteira", loteName: "1º lote", date: "07 de agosto • 14:00" },
            ]),
        ],
    },
    {
        id: "turma",
        name: "Turma de 4",
        combos: [
            combo("turma-pista", "Turma de 4 · Pista", "Pista", 1511.6, [
                { quantity: 4, ticketName: "Pista · Inteira", loteName: "2º lote", date: "14 de agosto • 14:00" },
            ]),
            combo("turma-premium", "Turma de 4 · Pista Premium", "Pista Premium", 2231.64, [
                { quantity: 4, ticketName: "Pista Premium · Inteira", loteName: "2º lote", date: "14 de agosto • 14:00" },
            ]),
        ],
    },
    {
        id: "encerramento",
        name: "Fim de semana de encerramento",
        soldOut: true,
        combos: [
            combo("encerramento-pista", "Encerramento · Pista", "Pista", 769.8, [
                { quantity: 1, ticketName: "Pista · Inteira", loteName: "3º lote", date: "15 de agosto • 14:00" },
                { quantity: 1, ticketName: "Encerramento · Inteira", loteName: "3º lote", date: "16 de agosto • 14:30" },
            ]),
        ],
    },
];

/** Todos os combos, na ordem dos agrupadores — o carrinho indexa por aqui. */
export const combos: ComboItem[] = comboCategories.flatMap((category) => category.combos);

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
