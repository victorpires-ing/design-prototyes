export type ItemTipo = "ingresso" | "combo";

export interface PreVendaItem {
    id: string;
    nome: string;
    grupo: string;
    tipo: ItemTipo;
    /** Ticket médio das ofertas. null = "Sem ofertas". */
    ticketMedio: number | null;
    /** Faixa de preço das ofertas [min, max]. Ausente quando não há ofertas. */
    faixa?: [number, number];
    /** Valor mínimo configurado para a oferta. */
    valorMinimo: number;
    /** Limite de unidades na pré-venda. */
    limite: number;
}

/**
 * Gera 100 itens participantes da pré-venda.
 * - O primeiro item é um ingresso "Sem ofertas".
 * - A cada 7 itens entra um combo.
 * - Os demais são ingressos com ticket médio R$ 250 e faixa R$ 200–R$ 300.
 */
export const preVendaItens: PreVendaItem[] = Array.from({ length: 100 }, (_, i) => {
    const isCombo = i > 0 && i % 7 === 0;
    const semOfertas = i === 0;
    return {
        id: `item-${i + 1}`,
        nome: isCombo ? "Nome do combo" : "Nome do ingresso",
        grupo: "Nome do grupo",
        tipo: isCombo ? "combo" : "ingresso",
        ticketMedio: semOfertas ? null : 250,
        faixa: semOfertas ? undefined : [200, 300],
        valorMinimo: 100,
        limite: 100,
    };
});
