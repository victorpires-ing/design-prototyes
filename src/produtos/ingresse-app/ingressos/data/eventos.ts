/* Dados dos eventos exibidos na carteira / página de ingressos do app.
   Um evento pode ter uma lista simples de ingressos OU combos.
   Cenário de combo: todos os itens/dias inclusos compartilham o MESMO QR Code. */

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
    /** Comportamento do QR: "oculto" (libera no dia) ou "dinamico" (atualiza a cada X seg). Default: QR fixo. */
    qrModo?: "oculto" | "dinamico";
    /** Marca o item como produto/merchandising (em vez de ingresso). */
    produto?: boolean;
    /** Degradê usado como imagem ilustrativa do produto. */
    imagem?: string;
    /** Status de retirada do produto. */
    retirada?: "pendente" | "retirado";
    /** Transferência deste ingresso cobra taxa antes de concluir. */
    transferenciaPaga?: boolean;
    /** Valor da taxa de transferência (em reais). */
    taxaTransferencia?: number;
    /** Exibe o aviso de que a primeira transferência é gratuita (as próximas terão taxa). */
    primeiraTransferenciaGratis?: boolean;
    /** Nome de quem transferiu este ingresso ao usuário (cenário de nova transferência com taxa). */
    recebidoDe?: string;
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
    /** Degradê usado como imagem ilustrativa (no lugar de uma foto). */
    gradient?: string;
}

export interface Resposta {
    pergunta: string;
    resposta: string;
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
    /** Respostas do formulário preenchido na compra/inscrição. */
    questionario?: Resposta[];
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
    /** Habilita o fluxo de transferência com pagamento (cobra taxa antes de concluir). */
    transferenciaPaga?: boolean;
    /** Valor da taxa de transferência (em reais). */
    taxaTransferencia?: number;
}

const PORTADOR = "Priscilão Alcantara Raro";
const CPF = "948.943.130-44";
// Titular dos ingressos do Gop Tun (conforme referência do fluxo de transferência)
const TITULAR_GOP = "Duny Alves da Silva";
const CPF_GOP = "832.840.732-12";

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
            { id: "uniforme-oficial", title: "ARENA | Brasil x Haiti | (19/06)", tipo: "Inteira", data: "Sex, 19 jun • 15:00", portador: PORTADOR, cpf: CPF, acesso: "facial", facial: "cadastrada" },
            { id: "tshirt-bienal", title: "Produto Arena Oficial Camisa Amarela Tam G", data: "Sex, 19 jun • 15:00", portador: PORTADOR, produto: true, retirada: "pendente", imagem: arenaCamisa },
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
                    { id: "credencial-camarote", title: "Área VIP Open Bar", data: "Qui, 31 dez • 22:00", portador: PORTADOR, cpf: CPF, acesso: "facial", facial: "pendente" },
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
        date: "30 de Dez 2026",
        local: "Av. Paulista • São Paulo/SP",
        gradient: "linear-gradient(135deg,#FF4D00 0%,#1d4ed8 100%)",
        sessao: "30 de Dez 2026",
        combos: [
            {
                id: "combo-sao-silvestre",
                nome: "Kit Premium",
                dataEvento: "30 de Dez 2026",
                qr: "unico",
                inclusosTitulo: "Detalhes da inscrição",
                inclusos: [
                    {
                        nome: "Kit Premium",
                        data: "Qui, 10 dez • 10:00",
                        dataLabel: "Data da retirada",
                        dataISO: "2026-12-10",
                        endereco: "Pavilhão do Anhembi • Av. Olavo Fontoura, 1209 - São Paulo/SP",
                        gradient: "linear-gradient(135deg,#16A34A 0%,#0EA5E9 100%)",
                        conteudo: ["Camisa verde G", "Número", "Cronômetro", "Sacola"],
                    },
                ],
                titular: PORTADOR,
                cpf: CPF,
                questionario: [
                    { pergunta: "Tamanho da camiseta", resposta: "G" },
                    { pergunta: 'Equipe / assessoria (caso não possua, informe "Avulso")', resposta: "Avulso" },
                    { pergunta: "Contato de emergência (nome e telefone)", resposta: "Maria Souza • (11) 99999-0000" },
                    { pergunta: "Tipo sanguíneo", resposta: "O+" },
                ],
            },
        ],
    },
    "gop-tun": {
        id: "gop-tun",
        title: "Gop Tun Festival 2026",
        date: "Sex, 14 ago • 22:00",
        local: "Audio • São Paulo/SP",
        gradient: "linear-gradient(160deg,#ef4444 0%,#111827 55%,#0b0b0f 100%)",
        sessao: "Sex, 14 ago • 22:00",
        ingressos: [
            // 1º ingresso: primeira transferência gratuita (as próximas terão taxa)
            { id: "inteira", title: "Main Stage (11.04)", tipo: "Inteira", data: "Sex, 14 ago • 22:00", portador: TITULAR_GOP, cpf: CPF_GOP, primeiraTransferenciaGratis: true },
            // 2º ingresso: recebido de outra pessoa; nova transferência já com taxa
            { id: "meia", title: "Club Stage (11.04)", tipo: "Meia-entrada", data: "Sex, 14 ago • 22:00", portador: TITULAR_GOP, cpf: CPF_GOP, transferenciaPaga: true, taxaTransferencia: 50, recebidoDe: "Duny Alves da Silva" },
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
            { id: "samba-04jul", title: "SAMBA INDEPENDENTE | 04 Jul", tipo: "Inteira", data: "Sáb, 4 jul • 22:00", portador: PORTADOR, cpf: CPF, qrModo: "oculto" },
            { id: "samba-18jul", title: "SAMBA INDEPENDENTE | 18 Jul", tipo: "Inteira", data: "Sáb, 18 jul • 22:00", portador: PORTADOR, cpf: CPF, qrModo: "dinamico" },
        ],
    },
};

export const getEvento = (id?: string): EventoDetalhe => (id && EVENTOS[id]) || EVENTOS.arena;

/** Busca um item (ingresso ou produto) pelo evento + id, procurando na lista e dentro de combos. */
export const getItem = (eventId?: string, itemId?: string): ItemIngresso | undefined => {
    const ev = eventId ? EVENTOS[eventId] : undefined;
    if (!ev || !itemId) return undefined;
    const direto = ev.ingressos?.find((i) => i.id === itemId);
    if (direto) return direto;
    for (const c of ev.combos ?? []) {
        const dentro = c.itens?.find((i) => i.id === itemId);
        if (dentro) return dentro;
    }
    return undefined;
};

/** Busca um combo pelo evento + id. */
export const getCombo = (eventId?: string, comboId?: string): Combo | undefined => {
    const ev = eventId ? EVENTOS[eventId] : undefined;
    return ev?.combos?.find((c) => c.id === comboId);
};
