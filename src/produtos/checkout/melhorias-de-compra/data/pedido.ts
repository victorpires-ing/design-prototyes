/* Pedido mockado do checkout (evento "Vai safadão"). */

export const EVENTO = {
    nome: "Vai safadão",
    local: "Belém - PA",
    sessao: "Sab, 13/06/26 às 13h00",
};

export const PRECO_ITENS = 140;
export const PRECO_PROTECAO = 10;
export const TAXA_SERVICO = 15;
export const TAXA_PROCESSAMENTO = 20;

/** Juros mensais aplicados a partir da 3ª parcela. */
const JUROS_MES = 0.0249;
const PARCELAS_SEM_JUROS = 2;
export const MAX_PARCELAS = 12;
export const PARCELAS_VISIVEIS = 6;
export const PARCELA_POPULAR = 6;

export const PIX_CODIGO = "00020126580014br.gov.bcb.pix0136a1f35204000053039865802BR";

export interface Parcela {
    n: number;
    valor: number;
    total: number;
    semJuros: boolean;
}

/** Tabela de parcelamento sobre o total sem juros (tabela Price a partir da 3ª). */
export function calcularParcelas(base: number): Parcela[] {
    return Array.from({ length: MAX_PARCELAS }, (_, i) => {
        const n = i + 1;
        if (n <= PARCELAS_SEM_JUROS) return { n, valor: base / n, total: base, semJuros: true };
        const valor = (base * JUROS_MES) / (1 - Math.pow(1 + JUROS_MES, -n));
        return { n, valor, total: valor * n, semJuros: false };
    });
}

export const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
