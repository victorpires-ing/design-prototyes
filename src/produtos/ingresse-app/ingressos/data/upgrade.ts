/* Dados do fluxo de troca/upgrade de ingresso.
   Regra: só é possível trocar por um novo ingresso de valor IGUAL ou SUPERIOR
   ao atual, pagando a diferença. Opções de valor menor não são exibidas.

   Cobertura: eventos com catálogo próprio (arena, gop-tun) usam os valores
   definidos aqui; qualquer outro evento/ingresso da carteira recebe um catálogo
   genérico gerado on-the-fly, para o fluxo funcionar em todos os ingressos. */

import { EVENTOS, getItem, type EventoDetalhe, type ItemIngresso } from "./eventos";

export interface OpcaoIngresso {
    id: string;
    nome: string;
    lote: string;
    valor: number;
}

export interface GrupoIngresso {
    nome: string;
    opcoes: OpcaoIngresso[];
}

interface CatalogoEvento {
    /** Valor atual (de face) do ingresso, por item. */
    valorAtualPorItem: Record<string, number>;
    /** Valor efetivamente pago na compra inicial — base para calcular a diferença. */
    valorCompraInicialPorItem: Record<string, number>;
    /** Valor de face padrão quando o item não está no mapa acima. */
    atualPadrao?: number;
    /** Valor pago padrão quando o item não está no mapa acima. */
    compraInicialPadrao?: number;
    /** Data/hora do ingresso exibida nas linhas do resumo (ex.: "02/03/26 - 21:00"). */
    dataResumo: string;
    sessaoDia: string;
    sessaoData: string;
    grupos: GrupoIngresso[];
}

const CATALOGO: Record<string, CatalogoEvento> = {
    arena: {
        valorAtualPorItem: { "1": 59, "uniforme-oficial": 59 },
        valorCompraInicialPorItem: { "1": 59, "uniforme-oficial": 59 },
        dataResumo: "02/03/26 - 21:00",
        sessaoDia: "Sábado",
        sessaoData: "05 de abril de 2025 às 16h",
        grupos: [
            {
                nome: "Arena",
                opcoes: [
                    { id: "arena-inteira", nome: "Inteira", lote: "1 Lote", valor: 219.9 },
                    { id: "arena-meia", nome: "Meia-entrada", lote: "1 Lote", valor: 119.9 },
                    { id: "arena-social", nome: "Meia-entrada social", lote: "1 Lote", valor: 59 },
                ],
            },
        ],
    },
    "gop-tun": {
        valorAtualPorItem: { inteira: 150, meia: 90 },
        valorCompraInicialPorItem: { inteira: 120, meia: 70 },
        dataResumo: "11/04/26 - 22:00",
        sessaoDia: "Sexta-feira",
        sessaoData: "11 de abril de 2026 às 22h",
        grupos: [
            {
                nome: "Main Stage",
                opcoes: [
                    { id: "main-inteira", nome: "Inteira", lote: "1 Lote", valor: 150 },
                    { id: "main-meia", nome: "Meia-entrada", lote: "1 Lote", valor: 90 },
                ],
            },
            {
                nome: "Área VIP",
                opcoes: [
                    { id: "vip-inteira", nome: "Inteira", lote: "1 Lote", valor: 280 },
                    { id: "vip-backstage", nome: "Backstage", lote: "1 Lote", valor: 450 },
                ],
            },
        ],
    },
};

/** Gera um catálogo genérico para eventos sem catálogo próprio.
 *  Sempre resulta em ao menos 3 opções de valor ≥ ao atual (+ 1 abaixo, oculta pelo filtro). */
function gerarConfig(evento: EventoDetalhe, item?: ItemIngresso): CatalogoEvento {
    const base = 99.9;
    return {
        valorAtualPorItem: {},
        valorCompraInicialPorItem: {},
        atualPadrao: base,
        compraInicialPadrao: base,
        dataResumo: item?.data ?? evento.sessao,
        sessaoDia: "",
        sessaoData: evento.sessao,
        grupos: [
            {
                nome: "Ingressos",
                opcoes: [
                    { id: `${evento.id}-inteira`, nome: "Inteira", lote: "1 Lote", valor: base },
                    { id: `${evento.id}-premium`, nome: "Pista Premium", lote: "1 Lote", valor: base + 70 },
                    { id: `${evento.id}-camarote`, nome: "Camarote", lote: "1 Lote", valor: base + 180 },
                    { id: `${evento.id}-meia`, nome: "Meia-entrada", lote: "1 Lote", valor: base - 40 },
                ],
            },
        ],
    };
}

export interface CatalogoTroca {
    atualNome: string;
    atualTipo?: string;
    /** Valor de face do ingresso atual (piso para a regra "igual ou superior"). */
    atualValor: number;
    /** Valor pago na compra inicial (base do cálculo da diferença). */
    valorCompraInicial: number;
    /** Data/hora exibida nas linhas do resumo. */
    dataResumo: string;
    sessaoDia: string;
    sessaoData: string;
    grupos: GrupoIngresso[];
}

export const getCatalogoTroca = (eventId?: string, itemId?: string): CatalogoTroca | undefined => {
    const evento = eventId ? EVENTOS[eventId] : undefined;
    if (!evento) return undefined;

    const item = getItem(eventId, itemId);
    const cfg = CATALOGO[eventId] ?? gerarConfig(evento, item);

    const atualValor =
        (itemId ? cfg.valorAtualPorItem[itemId] : undefined) ?? cfg.atualPadrao ?? Object.values(cfg.valorAtualPorItem)[0] ?? 0;
    const valorCompraInicial =
        (itemId ? cfg.valorCompraInicialPorItem[itemId] : undefined) ?? cfg.compraInicialPadrao ?? Object.values(cfg.valorCompraInicialPorItem)[0] ?? atualValor;

    return {
        atualNome: item?.title ?? evento.title,
        atualTipo: item?.tipo,
        atualValor,
        valorCompraInicial,
        dataResumo: cfg.dataResumo,
        sessaoDia: cfg.sessaoDia,
        sessaoData: cfg.sessaoData,
        grupos: cfg.grupos,
    };
};

export const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
