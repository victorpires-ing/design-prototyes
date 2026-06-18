/* Dados dos eventos exibidos na carteira / página de ingressos do app.
   Um evento pode ter uma lista simples de ingressos OU combos.
   Cenário de combo: todos os itens/dias inclusos compartilham o MESMO QR Code. */
import kitEventoImg from "../../assets/kit-evento.png";

export interface ItemIngresso {
    id: string;
    title: string;
    tipo?: string;
    data: string;
    portador: string;
    cpf?: string;
    /** Forma de acesso do ingresso. Default: "qr". */
    acesso?: "qr" | "facial";
}

export type ComboStatus = "finalizado" | "hoje" | "proximo";

export interface ComboIncluso {
    status?: ComboStatus;
    grupo?: string;
    nome: string;
    data?: string;
    /** Rótulo da data (default "Data do evento"). Ex.: "Data da retirada". */
    dataLabel?: string;
    /** Data ISO (YYYY-MM-DD) usada apenas para ordenar (mais próximo primeiro). */
    dataISO?: string;
    acesso?: string;
    /** Endereço próprio do item (ex.: local de retirada do kit, diferente da corrida). */
    endereco?: string;
    /** Itens contidos (ex.: o que vem dentro do kit). */
    conteudo?: string[];
    /** Imagem ilustrativa do item (ex.: foto do kit). */
    imagem?: string;
}

export interface Combo {
    id: string;
    nome: string;
    dataEvento: string;
    /** "individual" = cada item tem seu próprio QR; "unico" = um QR para todos os inclusos. */
    qr: "individual" | "unico";
    // qr "individual"
    itens?: ItemIngresso[];
    // qr "unico"
    inclusosTitulo?: string; // ex.: "Eventos inclusos"
    inclusos?: ComboIncluso[];
    titular?: string;
    cpf?: string;
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
}

const PORTADOR = "Priscilão Alcantara Raro";
const CPF = "948.943.130-44";

export const EVENTOS: Record<string, EventoDetalhe> = {
    arena: {
        id: "arena",
        title: "ARENA BRASILEIRA 2026",
        date: "Sex, 19 jun • 15:00",
        local: "Parque Ibirapuera • São Paulo/SP",
        gradient: "linear-gradient(150deg, #22C55E 0%, #0EA5E9 55%, #F59E0B 100%)",
        sessao: "Sex, 19 jun • 15:00",
        ingressos: [
            { id: "1", title: "ARENA | Brasil x Haiti | (19/06)", tipo: "Inteira", data: "Sex, 19 jun • 15:00", portador: PORTADOR, cpf: CPF },
            { id: "2", title: "ARENA | Brasil x Haiti | (19/06)", tipo: "Inteira", data: "Sex, 19 jun • 15:00", portador: PORTADOR, cpf: CPF },
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
                    { id: "kit-reveillon", title: "Arena", data: "Qui, 31 dez • 22:00", portador: PORTADOR, cpf: CPF, acesso: "qr" },
                    { id: "credencial-camarote", title: "Área VIP Open Bar", data: "Qui, 31 dez • 22:00", portador: PORTADOR, cpf: CPF, acesso: "facial" },
                ],
            },
            {
                id: "programacao-reveillon",
                nome: "Aquecimento ano novo",
                dataEvento: "28, 29, 30 e 31, Dez 2026",
                qr: "unico",
                inclusosTitulo: "Itens do combo",
                inclusos: [
                    {
                        status: "finalizado",
                        grupo: "Esquenta Copacabana",
                        nome: "DJ na areia",
                        data: "28, Dez 2026 - Segunda Feira",
                        dataISO: "2026-12-28",
                        acesso: "Setor Praia • Posto 4",
                    },
                    {
                        status: "finalizado",
                        grupo: "Pré-Réveillon",
                        nome: "Show nacional",
                        data: "29, Dez 2026 - Terça Feira",
                        dataISO: "2026-12-29",
                        acesso: "Setor Praia • Posto 4",
                    },
                    {
                        status: "hoje",
                        grupo: "Ensaio da virada",
                        nome: "Pocket show",
                        data: "30, Dez 2026 - Quarta Feira",
                        dataISO: "2026-12-30",
                        acesso: "Setor Praia • Posto 4",
                    },
                    {
                        status: "proximo",
                        grupo: "Réveillon",
                        nome: "Queima de fogos",
                        data: "31, Dez 2026 - Quinta Feira",
                        dataISO: "2026-12-31",
                        acesso: "Setor Praia • Posto 4",
                    },
                ],
                titular: PORTADOR,
                cpf: CPF,
            },
        ],
    },
    "sao-silvestre": {
        id: "sao-silvestre",
        title: "São Silvestre 2026",
        date: "Qui, 31 dez • 08:00",
        local: "Av. Paulista • São Paulo/SP",
        gradient: "linear-gradient(135deg,#FF4D00 0%,#1d4ed8 100%)",
        sessao: "Qui, 31 dez • 08:00",
        combos: [
            {
                id: "combo-sao-silvestre",
                nome: "Combo São Silvestre",
                dataEvento: "Qui, 31 dez • 08:00",
                qr: "unico",
                inclusosTitulo: "Itens do combo",
                inclusos: [
                    { status: "proximo", nome: "Acesso ao evento", data: "Qui, 31 dez • 08:00", dataISO: "2026-12-31", acesso: "Largada • Av. Paulista" },
                    {
                        status: "proximo",
                        nome: "Kit do atleta",
                        data: "Qui, 10 dez • 10:00",
                        dataLabel: "Data da retirada",
                        dataISO: "2026-12-10",
                        endereco: "Pavilhão do Anhembi • Av. Olavo Fontoura, 1209 - São Paulo/SP",
                        imagem: kitEventoImg,
                        conteudo: ["Camisa verde G", "Número", "Cronômetro", "Sacola"],
                    },
                ],
                titular: PORTADOR,
                cpf: CPF,
            },
        ],
    },
};

export const getEvento = (id?: string): EventoDetalhe => (id && EVENTOS[id]) || EVENTOS.arena;
