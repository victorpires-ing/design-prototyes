export type StatusEvento = "finalizado" | "em-andamento" | "proximo";

export interface EventoIncluso {
    status: StatusEvento;
    grupo: string;
    ingresso: string;
    data: string;
    acesso: string;
}

export interface DiaEventos {
    data: string;
    eventos: EventoIncluso[];
}

export interface Transferencia {
    titular: string;
    cpf: string;
}

export interface Combo {
    id: string;
    nome: string;
    dataEvento: string;
    meuIngresso: boolean;
    defaultAberto?: boolean;
    qrCode: string;
    transferidoPara?: Transferencia;
    historicoTransferencia?: Transferencia;
    eventosInclusos: DiaEventos[];
}

export interface IngressoAvulso {
    id: string;
    grupo: string;
    ingresso: string;
    acesso: string;
    defaultAberto?: boolean;
    qrCode: string;
    transferidoPara?: Transferencia;
}

export interface DiaIngressos {
    data: string;
    ingressos: IngressoAvulso[];
}

const TITULAR: Transferencia = { titular: "William Raphael de Campos", cpf: "009.789.568-90" };

export const COMBOS: Combo[] = [
    {
        id: "combo-virada",
        nome: "Combo Show da Virada Rio de Janeiro",
        dataEvento: "24 e 31, Dez 2026",
        meuIngresso: false,
        qrCode: "INGRESSE-COMBO-VIRADA-2026",
        eventosInclusos: [],
    },
    {
        id: "combo-rir",
        nome: "Combo Rock in Rio",
        dataEvento: "4, 5 e 6, Set 2026",
        meuIngresso: true,
        defaultAberto: true,
        qrCode: "INGRESSE-COMBO-ROCKINRIO-2026-WRC",
        transferidoPara: TITULAR,
        historicoTransferencia: TITULAR,
        eventosInclusos: [
            {
                data: "04, Set 2026 - Quarta Feira",
                eventos: [
                    {
                        status: "finalizado",
                        grupo: "Grupo Palco Mundo",
                        ingresso: "Ingresso Foo Fighters",
                        data: "4, Set 2026 - Quinta Feira",
                        acesso: "Portão A, ala norte",
                    },
                    {
                        status: "em-andamento",
                        grupo: "Grupo Palco Mundo",
                        ingresso: "Chiclete com Banana",
                        data: "4, Set 2026 - Quinta Feira",
                        acesso: "Portão A, ala norte",
                    },
                ],
            },
            {
                data: "05, Set 2026 - Quinta Feira",
                eventos: [
                    {
                        status: "proximo",
                        grupo: "Grupo New Dancer Order",
                        ingresso: "É o Tchan!",
                        data: "5, Set 2026 - Sábado",
                        acesso: "Portão A, ala norte",
                    },
                ],
            },
        ],
    },
];

export const DIAS_INGRESSOS: DiaIngressos[] = [
    {
        data: "12, Jan 2027 - Quarta Feira",
        ingressos: [
            {
                id: "silver",
                grupo: "Grupo Camarote",
                ingresso: "Ingresso Silver",
                acesso: "Portão A, ala norte",
                defaultAberto: true,
                qrCode: "INGRESSE-CAMAROTE-SILVER-WRC",
                transferidoPara: TITULAR,
            },
            {
                id: "gold-12",
                grupo: "Grupo Camarote",
                ingresso: "Ingresso Gold",
                acesso: "Portão A, ala norte",
                qrCode: "INGRESSE-CAMAROTE-GOLD-WRC",
            },
        ],
    },
    {
        data: "13, Jan 2027 - Quinta Feira",
        ingressos: [
            {
                id: "maloca-1",
                grupo: "Grupo Maloca",
                ingresso: "Ingresso Gold",
                acesso: "Portão A, ala norte",
                qrCode: "INGRESSE-MALOCA-GOLD-1",
            },
            {
                id: "maloca-2",
                grupo: "Grupo Maloca",
                ingresso: "Ingresso Gold",
                acesso: "Portão A, ala norte",
                qrCode: "INGRESSE-MALOCA-GOLD-2",
            },
        ],
    },
];
