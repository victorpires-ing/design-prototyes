/* Eventos da Carteira Web (além da São Silvestre, que tem dados próprios em sao-silvestre.ts).
   Replicados do app (ingresse-app/ingressos/data/eventos.ts), com a Camila como titular.
   Um evento tem uma lista simples de ingressos OU combos. */

import arenaCamisa from "../assets/arena-camisa.png";

export interface ItemIngresso {
    id: string;
    title: string;
    tipo?: string;
    data: string;
    portador: string;
    cpf?: string;
    /** Forma de acesso do ingresso. Default: "qr". */
    acesso?: "qr" | "facial";
    /** Estado do cadastro facial (apenas quando acesso === "facial"). Default: "pendente". */
    facial?: "pendente" | "cadastrada";
    /** Comportamento do QR: "oculto" (libera no dia) ou "dinamico" (atualiza a cada 30 s). Default: QR fixo. */
    qrModo?: "oculto" | "dinamico";
    /** Marca o item como produto/merchandising (em vez de ingresso). */
    produto?: boolean;
    imagem?: string;
    retirada?: "pendente" | "retirado";
    /** Nome de quem transferiu este ingresso para a conta. */
    recebidoDe?: string;
}

export type ComboStatus = "finalizado" | "hoje" | "proximo";

export interface ComboIncluso {
    status?: ComboStatus;
    grupo?: string;
    nome: string;
    data?: string;
    acesso?: string;
}

export interface Combo {
    id: string;
    nome: string;
    dataEvento: string;
    /** "individual" = cada item tem seu próprio QR; "unico" = um QR para todos os inclusos. */
    qr: "individual" | "unico";
    itens?: ItemIngresso[];
    inclusosTitulo?: string;
    inclusos?: ComboIncluso[];
}

export interface EventoDetalhe {
    id: string;
    title: string;
    date: string;
    local: string;
    gradient: string;
    sessao: string;
    ingressos?: ItemIngresso[];
    combos?: Combo[];
    /** Evento já aconteceu (aba Passados): sem QR e sem ações. */
    finalizado?: boolean;
}

const TITULAR = "Camila Ferreira Rocha";
const CPF = "832.840.732-12";

export const EVENTOS: Record<string, EventoDetalhe> = {
    "gop-tun": {
        id: "gop-tun",
        title: "Gop Tun Festival 2026",
        date: "11 de Abr 2026",
        local: "Audio • São Paulo/SP",
        gradient: "linear-gradient(160deg,#ef4444 0%,#111827 55%,#0b0b0f 100%)",
        sessao: "11 de Abr 2026",
        ingressos: [
            { id: "inteira", title: "Main Stage (11.04)", tipo: "Inteira", data: "11 de Abr 2026", portador: TITULAR, cpf: CPF },
            { id: "meia", title: "Club Stage (11.04)", tipo: "Meia-entrada", data: "11 de Abr 2026", portador: TITULAR, cpf: CPF, recebidoDe: "Duny Alves da Silva" },
        ],
    },
    arena: {
        id: "arena",
        title: "ARENA BRASILEIRA 2026",
        date: "Sex, 19 jun • 15:00",
        local: "Parque Ibirapuera • São Paulo/SP",
        gradient: "linear-gradient(150deg,#16a34a 0%,#2563eb 50%,#f59e0b 100%)",
        sessao: "Sex, 19 jun • 15:00",
        ingressos: [
            { id: "1", title: "ARENA | Brasil x Haiti | (19/06)", tipo: "Inteira", data: "Sex, 19 jun • 15:00", portador: TITULAR, cpf: CPF },
            { id: "uniforme-oficial", title: "ARENA | Brasil x Haiti | (19/06)", tipo: "Inteira", data: "Sex, 19 jun • 15:00", portador: TITULAR, cpf: CPF, acesso: "facial", facial: "cadastrada" },
            { id: "tshirt-bienal", title: "Produto Arena Oficial Camisa Amarela Tam G", data: "Sex, 19 jun • 15:00", portador: TITULAR, produto: true, retirada: "pendente", imagem: arenaCamisa },
        ],
    },
    "samba-independente": {
        id: "samba-independente",
        title: "SAMBA INDEPENDENTE DOS BONS COSTUMES",
        date: "4 e 18 Jul • 2026",
        local: "Fundição Progresso • Rio de Janeiro/RJ",
        gradient: "linear-gradient(135deg,#F59E0B 0%,#DB2777 55%,#7C3AED 100%)",
        sessao: "4 e 18 de Jul • 2026",
        ingressos: [
            { id: "samba-04jul", title: "SAMBA INDEPENDENTE | 04 Jul", tipo: "Inteira", data: "Sáb, 4 jul • 22:00", portador: TITULAR, cpf: CPF, qrModo: "oculto" },
            { id: "samba-18jul", title: "SAMBA INDEPENDENTE | 18 Jul", tipo: "Inteira", data: "Sáb, 18 jul • 22:00", portador: TITULAR, cpf: CPF, qrModo: "dinamico" },
        ],
    },
    "reveillon-copacabana": {
        id: "reveillon-copacabana",
        title: "Réveillon Copacabana 2027",
        date: "Qui, 31 dez • 22:00",
        local: "Praia de Copacabana • Rio de Janeiro/RJ",
        gradient: "linear-gradient(135deg,#1d4ed8 0%,#9333ea 55%,#f59e0b 100%)",
        sessao: "Qui, 31 dez • 22:00",
        combos: [
            {
                id: "combo-reveillon",
                nome: "Combo Réveillon",
                dataEvento: "Qui, 31 dez • 22:00",
                qr: "individual",
                itens: [
                    { id: "kit-reveillon", title: "Arena", data: "Qui, 31 dez • 22:00", portador: TITULAR, cpf: CPF, acesso: "qr" },
                    { id: "credencial-camarote", title: "Área VIP Open Bar", data: "Qui, 31 dez • 22:00", portador: TITULAR, cpf: CPF, acesso: "facial", facial: "pendente" },
                ],
            },
            {
                id: "programacao-reveillon",
                nome: "Aquecimento ano novo",
                dataEvento: "28, 29, 30 e 31, Dez 2026",
                qr: "unico",
                inclusosTitulo: "Itens do combo",
                inclusos: [
                    { status: "finalizado", grupo: "Esquenta Copacabana", nome: "DJ na areia", data: "28, Dez 2026 - Segunda Feira", acesso: "Setor Praia • Posto 4" },
                    { status: "finalizado", grupo: "Pré-Réveillon", nome: "Show nacional", data: "29, Dez 2026 - Terça Feira", acesso: "Setor Praia • Posto 4" },
                    { status: "hoje", grupo: "Ensaio da virada", nome: "Pocket show", data: "30, Dez 2026 - Quarta Feira", acesso: "Setor Praia • Posto 4" },
                    { status: "proximo", grupo: "Réveillon", nome: "Queima de fogos", data: "31, Dez 2026 - Quinta Feira", acesso: "Setor Praia • Posto 4" },
                ],
            },
        ],
    },
    lolla: {
        id: "lolla",
        title: "Lollapalooza 2025",
        date: "Sex, 28 mar • 12:00",
        local: "Autódromo de Interlagos • São Paulo/SP",
        gradient: "linear-gradient(135deg,#db2777 0%,#7c3aed 100%)",
        sessao: "Sex, 28 mar • 12:00",
        finalizado: true,
        ingressos: [
            { id: "lolla-1", title: "Lolla Day | 28/03", tipo: "Inteira", data: "Sex, 28 mar • 12:00", portador: TITULAR, cpf: CPF },
            { id: "lolla-2", title: "Lolla Day | 28/03", tipo: "Meia-entrada", data: "Sex, 28 mar • 12:00", portador: TITULAR, cpf: CPF },
        ],
    },
    verao: {
        id: "verao",
        title: "Festival de Verão 2024",
        date: "Sáb, 27 jan • 16:00",
        local: "Parque de Exposições • Salvador/BA",
        gradient: "linear-gradient(135deg,#0ea5e9 0%,#22c55e 100%)",
        sessao: "Sáb, 27 jan • 16:00",
        finalizado: true,
        ingressos: Array.from({ length: 4 }, (_, i) => ({
            id: `verao-${i + 1}`,
            title: "Pista | 27/01",
            tipo: i < 2 ? "Inteira" : "Meia-entrada",
            data: "Sáb, 27 jan • 16:00",
            portador: TITULAR,
            cpf: CPF,
        })),
    },
};

/** Eventos montados a partir do banco unificado (ver data/plataforma.ts); preenchido pela carteira. */
export const EVENTOS_DO_BANCO: Record<string, EventoDetalhe> = {};

export const getEvento = (id?: string) => (id ? (EVENTOS[id] ?? EVENTOS_DO_BANCO[id]) : undefined);

/** Busca um ingresso/produto pelo evento + id, na lista e dentro de combos. */
export const getItem = (ev: EventoDetalhe, itemId: string): ItemIngresso | undefined =>
    ev.ingressos?.find((i) => i.id === itemId) ?? ev.combos?.flatMap((c) => c.itens ?? []).find((i) => i.id === itemId);

/** Recorte do evento para o perfil ativo ("Entrar como"): só os itens do dependente, com ele como titular. */
export const paraOPerfil = (ev: EventoDetalhe, perfil: { nome: string; cpf: string; carteira: { eventId: string; itens: string[] }[] } | null): EventoDetalhe => {
    if (!perfil) return ev;
    const itens = perfil.carteira.find((c) => c.eventId === ev.id)?.itens ?? [];
    return {
        ...ev,
        combos: undefined,
        ingressos: (ev.ingressos ?? []).filter((i) => itens.includes(i.id)).map((i) => ({ ...i, portador: perfil.nome, cpf: perfil.cpf })),
    };
};
