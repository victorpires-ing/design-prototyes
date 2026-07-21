/* ------------------------------------------------------------------ */
/*  Eventos com cortesia (mock) — usados na Visualização do Freepass.  */
/* ------------------------------------------------------------------ */

import type { EnvioRegistro } from "./envios-store";

const CAMISETA = "https://images.tcdn.com.br/img/img_prod/809258/camiseta_preta_malha_pv_manga_curta_gola_redonda_267_1_948ec668619667388dfc700bf588df6d.jpg";
const COPO = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS21PlM10zA_d7HWEz0mF0IaGFSNQqKoBLvzAM7zV3GyA&s=10";

export type TipoItem = "ingresso" | "produto" | "combo";

export interface ItemCortesia {
    id: string;
    tipo: TipoItem;
    nome: string;
    /** Data/horário da sessão (ingresso e combo). */
    data?: string;
    /** Detalhe do combo: "{nome do ingresso} +N". */
    detalhe?: string;
    /** Foto do produto (apenas itens do tipo "produto"). */
    foto?: string;
    disponivel: number;
    total: number;
    /** Histórico de envios/resgates já realizados (eventos passados). */
    historico?: EnvioRegistro[];
}

export interface EventoCortesia {
    id: string;
    nome: string;
    data: string;
    local: string;
    /** Nº de cortesias que o portador tem nesse evento. */
    cortesias: number;
    /** Capa (pôster) do evento. */
    capa?: string;
    /** Classes de gradiente para a imagem placeholder (fallback). */
    gradiente: string;
    /** Evento que já aconteceu (aba "Já passou"). */
    passado?: boolean;
    /** Cortesia recém-recebida — exibe selo "Novo" na carteira. */
    novo?: boolean;
    itens: ItemCortesia[];
}

export const EVENTOS_CORTESIA: EventoCortesia[] = [
    {
        id: "festa-julina-iate",
        nome: "35ª Festa Julina do Iate",
        data: "05 de Jul 2026",
        local: "Iate Clube do Rio de Janeiro",
        cortesias: 65,
        capa: "https://kraken.ingresse.com/event/posters/103648/large/1783529683.620794.jpg",
        gradiente: "from-[#ff8a3d] to-[#ff271a]",
        passado: true,
        itens: [
            {
                id: "ing-pista",
                tipo: "ingresso",
                nome: "Pista",
                data: "Dom, 05 jul • 20:00",
                disponivel: 18,
                total: 30,
                historico: [
                    { id: "h1", destinatario: "Você", email: "voce@ingresse.com", quantidade: 2, status: "resgatado", data: "28 jun 2026" },
                    { id: "h2", destinatario: "Marina Cardoso", email: "marina.cardoso@gmail.com", quantidade: 4, status: "resgatado", data: "29 jun 2026" },
                    { id: "h3", destinatario: "Thiago Ribeiro", email: "thiago.ribeiro@hotmail.com", quantidade: 3, status: "aberto", data: "30 jun 2026" },
                    { id: "h4", destinatario: "Isabela Souza", email: "isabela.souza@gmail.com", quantidade: 3, status: "enviado", data: "01 jul 2026" },
                ],
            },
            {
                id: "ing-area-vip",
                tipo: "ingresso",
                nome: "Área VIP",
                data: "Dom, 05 jul • 20:00",
                disponivel: 9,
                total: 20,
                historico: [
                    { id: "h5", destinatario: "Você", email: "voce@ingresse.com", quantidade: 2, status: "resgatado", data: "28 jun 2026" },
                    { id: "h6", destinatario: "Rafael Nunes", email: "rafael.nunes@gmail.com", quantidade: 5, status: "resgatado", data: "30 jun 2026" },
                    { id: "h7", destinatario: "Camila Prado", email: "camila.prado@outlook.com", quantidade: 4, status: "aberto", data: "02 jul 2026" },
                ],
            },
            {
                id: "prod-camiseta",
                tipo: "produto",
                nome: "Camiseta oficial",
                foto: CAMISETA,
                disponivel: 22,
                total: 25,
                historico: [{ id: "h8", destinatario: "Você", email: "voce@ingresse.com", quantidade: 3, status: "resgatado", data: "29 jun 2026" }],
            },
        ],
    },
    {
        id: "arpoador-inverno",
        nome: "Arpoador de Inverno",
        data: "02 de Ago 2026",
        local: "Arpoador, Rio de Janeiro",
        cortesias: 48,
        capa: "https://kraken.ingresse.com/event/posters/100202/large/1781368733.1610947.jpg",
        gradiente: "from-[#4facfe] to-[#00c2ff]",
        itens: [
            { id: "ing-pista", tipo: "ingresso", nome: "Pista", data: "Dom, 02 ago • 16:00", disponivel: 28, total: 30 },
            { id: "ing-front-stage", tipo: "ingresso", nome: "Front Stage", data: "Dom, 02 ago • 16:00", disponivel: 12, total: 20 },
        ],
    },
    {
        id: "motiro-mumuzinho",
        nome: "Motirô — Mumuzinho — Casinha da Copa",
        data: "09 de Ago 2026",
        local: "Casinha da Copa, Rio de Janeiro",
        cortesias: 72,
        capa: "https://kraken.ingresse.com/event/posters/93992/large/1783627115.0283313.jpg",
        gradiente: "from-[#f7971e] to-[#ffd200]",
        novo: true,
        itens: [
            { id: "ing-pista", tipo: "ingresso", nome: "Pista", data: "Dom, 09 ago • 18:00", disponivel: 30, total: 40 },
            { id: "ing-camarote", tipo: "ingresso", nome: "Camarote", data: "Dom, 09 ago • 18:00", disponivel: 14, total: 20 },
            { id: "combo-casal", tipo: "combo", nome: "Combo Casal", detalhe: "Pista + Open Bar +1", data: "Dom, 09 ago • 18:00", disponivel: 20, total: 25 },
        ],
    },
    {
        id: "village-funk-room",
        nome: "Village 2026 : FUNK ROOM c/ Mc Cabelinho & Syon Trio (Arena)",
        data: "22 de Ago 2026",
        local: "Village Arena, São Paulo",
        cortesias: 90,
        capa: "https://kraken.ingresse.com/event/posters/91540/large/1775501504.7453728.jpg",
        gradiente: "from-[#ff4a40] to-[#ff271a]",
        itens: [
            { id: "ing-arena", tipo: "ingresso", nome: "Arena", data: "Sáb, 22 ago • 22:00", disponivel: 40, total: 50 },
            { id: "prod-copo", tipo: "produto", nome: "Copo oficial", foto: COPO, disponivel: 16, total: 20 },
            { id: "combo-funk-room", tipo: "combo", nome: "Combo Funk Room", detalhe: "Arena + Open Bar +2", data: "Sáb, 22 ago • 22:00", disponivel: 24, total: 30 },
        ],
    },
];

export const getEvento = (id: string): EventoCortesia | undefined => EVENTOS_CORTESIA.find((e) => e.id === id);
