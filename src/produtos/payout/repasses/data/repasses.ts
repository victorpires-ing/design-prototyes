/** Situação do repasse de um evento para o organizador. */
export type StatusRepasse = "agendado" | "processando" | "pago" | "bloqueado";

export interface Repasse {
    id: string;
    evento: string;
    organizador: string;
    /** Conta de destino, já mascarada (protótipo — nunca use dados reais). */
    contaDestino: string;
    /** Data prevista/efetiva do crédito, em ISO (YYYY-MM-DD). */
    data: string;
    status: StatusRepasse;
    /** Valores em centavos para evitar imprecisão de ponto flutuante. */
    bruto: number;
    taxaServico: number;
    taxaAntecipacao: number;
    estornos: number;
    /** Motivo do bloqueio — presente apenas quando `status === "bloqueado"`. */
    motivoBloqueio?: string;
}

export const STATUS_META: Record<StatusRepasse, { label: string; cor: "gray" | "blue" | "success" | "warning" | "error" }> = {
    agendado: { label: "Agendado", cor: "gray" },
    processando: { label: "Em processamento", cor: "blue" },
    pago: { label: "Pago", cor: "success" },
    bloqueado: { label: "Bloqueado", cor: "error" },
};

/** Valor líquido do repasse (bruto menos taxas e estornos). */
export const liquido = (r: Repasse) => r.bruto - r.taxaServico - r.taxaAntecipacao - r.estornos;

export const formatarValor = (centavos: number) =>
    (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatarData = (iso: string) => {
    const [ano, mes, dia] = iso.split("-");
    return `${dia}/${mes}/${ano}`;
};

export const REPASSES: Repasse[] = [
    {
        id: "rp-1042",
        evento: "Festival Beira-Mar 2026",
        organizador: "Beira-Mar Produções",
        contaDestino: "Itaú •••• 4417",
        data: "2026-08-26",
        status: "processando",
        bruto: 48_720_00,
        taxaServico: 4_872_00,
        taxaAntecipacao: 0,
        estornos: 1_240_00,
    },
    {
        id: "rp-1041",
        evento: "Grêmio x Internacional — Arena",
        organizador: "Arena Eventos",
        contaDestino: "Bradesco •••• 9002",
        data: "2026-08-25",
        status: "bloqueado",
        bruto: 132_400_00,
        taxaServico: 13_240_00,
        taxaAntecipacao: 2_648_00,
        estornos: 0,
        motivoBloqueio: "Dados bancários divergentes do CNPJ cadastrado",
    },
    {
        id: "rp-1040",
        evento: "São Silvestre — Corrida de Rua",
        organizador: "Silvestre Sports",
        contaDestino: "Nubank •••• 3311",
        data: "2026-08-24",
        status: "agendado",
        bruto: 27_150_00,
        taxaServico: 2_715_00,
        taxaAntecipacao: 0,
        estornos: 380_00,
    },
    {
        id: "rp-1039",
        evento: "Stand-up: Turnê Nacional",
        organizador: "Risada Produções",
        contaDestino: "Itaú •••• 7788",
        data: "2026-08-21",
        status: "pago",
        bruto: 19_880_00,
        taxaServico: 1_988_00,
        taxaAntecipacao: 397_00,
        estornos: 0,
    },
    {
        id: "rp-1038",
        evento: "Expo Games — Pavilhão 3",
        organizador: "Expo Brasil",
        contaDestino: "Santander •••• 1205",
        data: "2026-08-19",
        status: "pago",
        bruto: 76_300_00,
        taxaServico: 7_630_00,
        taxaAntecipacao: 0,
        estornos: 2_100_00,
    },
];
