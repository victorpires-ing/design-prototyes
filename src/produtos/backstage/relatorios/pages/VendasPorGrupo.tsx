import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, CoinsStacked01, CurrencyDollarCircle, CursorClick02, Package, Receipt, Tag01 } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ProgressBarHalfCircle } from "@/components/base/progress-indicators/progress-circles";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, dateRangeFraction, inDateRange, useRelatorioFilters } from "../components/relatorio-filters";
import { SortableHeader } from "../components/SortableHeader";
import { TransacionadoChartCard, type ChartPoint } from "../components/TransacionadoChart";
import { useSortableTable } from "../utils/useSortableTable";
import { EVENT, currencyFormatter, numberFormatter, parseEventDate } from "../data/event";
import { consultarPeriodo, GRUPOS, PERIODO_PADRAO } from "@/reports/event-dataset";

/* ------------------------------------------------------------------ */
/*  Tipos                                                             */
/* ------------------------------------------------------------------ */

interface IngressoRow {
    id: string;
    nome: string;
    estoque: number;
    vendido: number;
}

interface SetorRow {
    id: string;
    nome: string;
    estoque: number;
    vendido: number;
    ingressos?: IngressoRow[];
}

interface IngressoPorSetorRow {
    id: string;
    setor: string;
    tipoIngresso: string;
    lote: string;
    itemCombo: string;
    vendidos: number;
    estoque: number;
}

interface ComboLoteRow {
    id: string;
    lote: string;
    quantidade: number;
    valorUnitario: number;
    gmv: number;
    gmvComDesconto: number;
}

interface ComboRow {
    id: string;
    nome: string;
    quantidade: number;
    valorUnitario: number;
    gmv: number;
    gmvComDesconto: number;
    lotes?: ComboLoteRow[];
}

interface ProdutoRow {
    id: string;
    nome: string;
    quantidade: number;
    valorUnitario: number;
    gmv: number;
    gmvComDesconto: number;
}

interface CupomLoteRow {
    id: string;
    lote: string;
    quantidade: number;
    valor: number;
    valorDesconto: number;
    valorTotal: number;
}

interface CupomRow {
    id: string;
    cupom: string;
    quantidade: number;
    valor: number;
    valorDesconto: number;
    valorTotal: number;
    lotes: CupomLoteRow[];
}

/* ------------------------------------------------------------------ */
/*  Mock data (base = todas as sessões)                               */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Quantidade de ingresso por grupo — mock de um show/festival. Cada     */
/*  linha = tipo de ingresso × grupo. "Estoque" por linha é o pool        */
/*  compartilhado repetido, ou sub-limite p/ Meia/Gratuidade.             */
/*  A capacidade do grupo (p/ ocupação) está em SETOR_CAP. Nenhum item    */
/*  tem combo → itemCombo sempre "-".                                     */
/*                                                                       */
/*  Linhas ocultas por scroll (Cadeira Inferior) e grupos sem dados de    */
/*  tabela (Camarote, Lounge Oeste/Leste) foram simulados p/ casar        */
/*  com o gráfico de ocupação e o total geral de 26.183 itens.           */
/* ------------------------------------------------------------------ */

// Capacidade física de cada setor (denominador da ocupação).
const SETOR_CAP: Record<string, number> = {
    "Camarote Premium": 126,
    "Pista": 2000,
    "Arquibancada": 4300,
    "Pista Premium": 6659,
    "Cadeira Superior": 11005,
    "Cadeira Inferior": 5189,
    "Camarote": 400,
    "Lounge Oeste": 3000,
    "Lounge Leste": 3000,
};

const ingressosPorSetor: IngressoPorSetorRow[] = [
    // Camarote Premium
    { id: "ips1", setor: "Camarote Premium", tipoIngresso: "Convidado Artista", lote: "Cortesia", itemCombo: "-", vendidos: 54, estoque: 72 },
    { id: "ips2", setor: "Camarote Premium", tipoIngresso: "Open Bar", lote: "Lote único", itemCombo: "-", vendidos: 10, estoque: 40 },
    { id: "ips3", setor: "Camarote Premium", tipoIngresso: "Camarote Open", lote: "Cortesia", itemCombo: "-", vendidos: 4, estoque: 10 },
    { id: "ips4", setor: "Camarote Premium", tipoIngresso: "Patrocinador", lote: "Cortesia", itemCombo: "-", vendidos: 1, estoque: 4 },
    // Pista
    { id: "ips5", setor: "Pista", tipoIngresso: "Gratuidade - PCD", lote: "Gratuidade", itemCombo: "-", vendidos: 8, estoque: 20 },
    { id: "ips6", setor: "Pista", tipoIngresso: "Gratuidade - Maior de 60 Anos", lote: "Gratuidade", itemCombo: "-", vendidos: 37, estoque: 40 },
    { id: "ips7", setor: "Pista", tipoIngresso: "Acompanhante PCD", lote: "Gratuidade", itemCombo: "-", vendidos: 2, estoque: 15 },
    { id: "ips8", setor: "Pista", tipoIngresso: "Parceria", lote: "Cortesia", itemCombo: "-", vendidos: 35, estoque: 130 },
    { id: "ips9", setor: "Pista", tipoIngresso: "Meia-Entrada", lote: "Lote único", itemCombo: "-", vendidos: 6, estoque: 700 },
    { id: "ips10", setor: "Pista", tipoIngresso: "Inteira", lote: "Lote único", itemCombo: "-", vendidos: 7, estoque: 2000 },
    // Arquibancada
    { id: "ips11", setor: "Arquibancada", tipoIngresso: "Meia-Entrada", lote: "Lote único", itemCombo: "-", vendidos: 1683, estoque: 1714 },
    { id: "ips12", setor: "Arquibancada", tipoIngresso: "Inteira", lote: "Lote único", itemCombo: "-", vendidos: 1051, estoque: 4300 },
    { id: "ips13", setor: "Arquibancada", tipoIngresso: "Acompanhante VIP", lote: "Clube", itemCombo: "-", vendidos: 61, estoque: 4300 },
    { id: "ips14", setor: "Arquibancada", tipoIngresso: "Gratuidade - Maior de 60 Anos", lote: "Gratuidade", itemCombo: "-", vendidos: 245, estoque: 300 },
    { id: "ips15", setor: "Arquibancada", tipoIngresso: "Lote Promocional", lote: "Clube", itemCombo: "-", vendidos: 71, estoque: 4300 },
    { id: "ips16", setor: "Arquibancada", tipoIngresso: "VIP", lote: "Clube", itemCombo: "-", vendidos: 44, estoque: 4300 },
    { id: "ips17", setor: "Arquibancada", tipoIngresso: "Gratuidade - Menor de 12 Anos", lote: "Gratuidade", itemCombo: "-", vendidos: 40, estoque: 100 },
    { id: "ips18", setor: "Arquibancada", tipoIngresso: "Pré-venda Clube", lote: "Clube", itemCombo: "-", vendidos: 11, estoque: 4300 },
    { id: "ips19", setor: "Arquibancada", tipoIngresso: "Último Lote", lote: "Clube", itemCombo: "-", vendidos: 65, estoque: 4300 },
    { id: "ips20", setor: "Arquibancada", tipoIngresso: "Pré-venda", lote: "Clube", itemCombo: "-", vendidos: 93, estoque: 4300 },
    // Pista Premium
    { id: "ips21", setor: "Pista Premium", tipoIngresso: "Meia-Entrada", lote: "Lote único", itemCombo: "-", vendidos: 1337, estoque: 2406 },
    { id: "ips22", setor: "Pista Premium", tipoIngresso: "Inteira", lote: "Lote único", itemCombo: "-", vendidos: 508, estoque: 6659 },
    { id: "ips23", setor: "Pista Premium", tipoIngresso: "Pré-venda", lote: "Clube", itemCombo: "-", vendidos: 1163, estoque: 6659 },
    { id: "ips24", setor: "Pista Premium", tipoIngresso: "Gratuidade - Maior de 60 Anos", lote: "Gratuidade", itemCombo: "-", vendidos: 410, estoque: 410 },
    { id: "ips25", setor: "Pista Premium", tipoIngresso: "Último Lote", lote: "Clube", itemCombo: "-", vendidos: 314, estoque: 6659 },
    { id: "ips26", setor: "Pista Premium", tipoIngresso: "Acompanhante VIP", lote: "Clube", itemCombo: "-", vendidos: 351, estoque: 6659 },
    { id: "ips27", setor: "Pista Premium", tipoIngresso: "Convidado Artista", lote: "Cortesia", itemCombo: "-", vendidos: 139, estoque: 240 },
    { id: "ips28", setor: "Pista Premium", tipoIngresso: "VIP", lote: "Clube", itemCombo: "-", vendidos: 502, estoque: 6659 },
    { id: "ips29", setor: "Pista Premium", tipoIngresso: "Acompanhante PCD", lote: "Gratuidade", itemCombo: "-", vendidos: 20, estoque: 20 },
    { id: "ips30", setor: "Pista Premium", tipoIngresso: "Staff", lote: "Clube", itemCombo: "-", vendidos: 30, estoque: 6659 },
    { id: "ips31", setor: "Pista Premium", tipoIngresso: "Lote Promocional", lote: "Clube", itemCombo: "-", vendidos: 262, estoque: 6659 },
    { id: "ips32", setor: "Pista Premium", tipoIngresso: "Órgão Público", lote: "Cortesia", itemCombo: "-", vendidos: 14, estoque: 50 },
    { id: "ips33", setor: "Pista Premium", tipoIngresso: "Gratuidade - PCD", lote: "Gratuidade", itemCombo: "-", vendidos: 40, estoque: 40 },
    { id: "ips34", setor: "Pista Premium", tipoIngresso: "Gratuidade - Menor de 12 Anos", lote: "Gratuidade", itemCombo: "-", vendidos: 80, estoque: 80 },
    { id: "ips35", setor: "Pista Premium", tipoIngresso: "Patrocinador", lote: "Cortesia", itemCombo: "-", vendidos: 59, estoque: 158 },
    { id: "ips36", setor: "Pista Premium", tipoIngresso: "Membro Clube", lote: "Cortesia", itemCombo: "-", vendidos: 115, estoque: 150 },
    { id: "ips37", setor: "Pista Premium", tipoIngresso: "Relacionamento", lote: "Cortesia", itemCombo: "-", vendidos: 78, estoque: 134 },
    { id: "ips38", setor: "Pista Premium", tipoIngresso: "Brigada", lote: "Cortesia", itemCombo: "-", vendidos: 21, estoque: 30 },
    { id: "ips39", setor: "Pista Premium", tipoIngresso: "Resgate Clube", lote: "Cortesia", itemCombo: "-", vendidos: 9, estoque: 16 },
    { id: "ips40", setor: "Pista Premium", tipoIngresso: "Marca Parceira", lote: "Cortesia", itemCombo: "-", vendidos: 7, estoque: 26 },
    { id: "ips41", setor: "Pista Premium", tipoIngresso: "Coordenação", lote: "Cortesia", itemCombo: "-", vendidos: 3, estoque: 5 },
    { id: "ips42", setor: "Pista Premium", tipoIngresso: "Pré-venda Clube", lote: "Clube", itemCombo: "-", vendidos: 48, estoque: 6659 },
    { id: "ips43", setor: "Pista Premium", tipoIngresso: "Produção", lote: "Cortesia", itemCombo: "-", vendidos: 8, estoque: 17 },
    { id: "ips44", setor: "Pista Premium", tipoIngresso: "Bombeiro", lote: "Cortesia", itemCombo: "-", vendidos: 9, estoque: 10 },
    { id: "ips45", setor: "Pista Premium", tipoIngresso: "Acompanhante Backstage Tour", lote: "Cortesia", itemCombo: "-", vendidos: 3, estoque: 7 },
    { id: "ips46", setor: "Pista Premium", tipoIngresso: "Apoio", lote: "Cortesia", itemCombo: "-", vendidos: 10, estoque: 10 },
    { id: "ips47", setor: "Pista Premium", tipoIngresso: "Convidado", lote: "Cortesia", itemCombo: "-", vendidos: 2, estoque: 5 },
    { id: "ips48", setor: "Pista Premium", tipoIngresso: "Segurança", lote: "Cortesia", itemCombo: "-", vendidos: 3, estoque: 10 },
    { id: "ips49", setor: "Pista Premium", tipoIngresso: "Backstage Tour", lote: "Cortesia", itemCombo: "-", vendidos: 3, estoque: 7 },
    // Cadeira Superior
    { id: "ips50", setor: "Cadeira Superior", tipoIngresso: "Meia-Entrada", lote: "Lote único", itemCombo: "-", vendidos: 3877, estoque: 4114 },
    { id: "ips51", setor: "Cadeira Superior", tipoIngresso: "Inteira", lote: "Lote único", itemCombo: "-", vendidos: 2225, estoque: 11005 },
    { id: "ips52", setor: "Cadeira Superior", tipoIngresso: "Gratuidade - Menor de 12 Anos", lote: "Gratuidade", itemCombo: "-", vendidos: 285, estoque: 285 },
    { id: "ips53", setor: "Cadeira Superior", tipoIngresso: "Acompanhante VIP", lote: "Clube", itemCombo: "-", vendidos: 423, estoque: 11005 },
    { id: "ips54", setor: "Cadeira Superior", tipoIngresso: "Último Lote", lote: "Clube", itemCombo: "-", vendidos: 441, estoque: 11005 },
    { id: "ips55", setor: "Cadeira Superior", tipoIngresso: "Lote Promocional", lote: "Clube", itemCombo: "-", vendidos: 364, estoque: 11005 },
    { id: "ips56", setor: "Cadeira Superior", tipoIngresso: "VIP", lote: "Clube", itemCombo: "-", vendidos: 402, estoque: 11005 },
    { id: "ips57", setor: "Cadeira Superior", tipoIngresso: "Gratuidade - Maior de 60 Anos", lote: "Gratuidade", itemCombo: "-", vendidos: 714, estoque: 715 },
    { id: "ips58", setor: "Cadeira Superior", tipoIngresso: "Pré-venda", lote: "Clube", itemCombo: "-", vendidos: 1089, estoque: 11005 },
    { id: "ips59", setor: "Cadeira Superior", tipoIngresso: "Pré-venda Clube", lote: "Clube", itemCombo: "-", vendidos: 110, estoque: 11005 },
    { id: "ips60", setor: "Cadeira Superior", tipoIngresso: "Membro", lote: "Clube", itemCombo: "-", vendidos: 68, estoque: 11005 },
    { id: "ips61", setor: "Cadeira Superior", tipoIngresso: "Patrocinador", lote: "Cortesia", itemCombo: "-", vendidos: 7, estoque: 15 },
    { id: "ips62", setor: "Cadeira Superior", tipoIngresso: "Camarim", lote: "Cortesia", itemCombo: "-", vendidos: 11, estoque: 15 },
    // Cadeira Inferior (Meia/Gratuidade; demais linhas simuladas)
    { id: "ips63", setor: "Cadeira Inferior", tipoIngresso: "Meia-Entrada", lote: "Lote único", itemCombo: "-", vendidos: 1491, estoque: 2329 },
    { id: "ips64", setor: "Cadeira Inferior", tipoIngresso: "Gratuidade - Maior de 60 Anos", lote: "Gratuidade", itemCombo: "-", vendidos: 355, estoque: 356 },
    { id: "ips65", setor: "Cadeira Inferior", tipoIngresso: "Inteira", lote: "Lote único", itemCombo: "-", vendidos: 700, estoque: 5189 },
    { id: "ips66", setor: "Cadeira Inferior", tipoIngresso: "Pré-venda", lote: "Clube", itemCombo: "-", vendidos: 900, estoque: 5189 },
    { id: "ips67", setor: "Cadeira Inferior", tipoIngresso: "VIP", lote: "Clube", itemCombo: "-", vendidos: 400, estoque: 5189 },
    { id: "ips68", setor: "Cadeira Inferior", tipoIngresso: "Acompanhante VIP", lote: "Clube", itemCombo: "-", vendidos: 200, estoque: 5189 },
    { id: "ips69", setor: "Cadeira Inferior", tipoIngresso: "Último Lote", lote: "Clube", itemCombo: "-", vendidos: 150, estoque: 5189 },
    { id: "ips70", setor: "Cadeira Inferior", tipoIngresso: "Lote Promocional", lote: "Clube", itemCombo: "-", vendidos: 120, estoque: 5189 },
    { id: "ips71", setor: "Cadeira Inferior", tipoIngresso: "Patrocinador", lote: "Cortesia", itemCombo: "-", vendidos: 30, estoque: 60 },
    { id: "ips72", setor: "Cadeira Inferior", tipoIngresso: "Relacionamento", lote: "Cortesia", itemCombo: "-", vendidos: 40, estoque: 80 },
    { id: "ips73", setor: "Cadeira Inferior", tipoIngresso: "Membro Clube", lote: "Cortesia", itemCombo: "-", vendidos: 45, estoque: 80 },
    { id: "ips74", setor: "Cadeira Inferior", tipoIngresso: "Gratuidade - Menor de 12 Anos", lote: "Gratuidade", itemCombo: "-", vendidos: 100, estoque: 100 },
    { id: "ips75", setor: "Cadeira Inferior", tipoIngresso: "Gratuidade - PCD", lote: "Gratuidade", itemCombo: "-", vendidos: 30, estoque: 30 },
    { id: "ips76", setor: "Cadeira Inferior", tipoIngresso: "Acompanhante PCD", lote: "Gratuidade", itemCombo: "-", vendidos: 15, estoque: 15 },
    { id: "ips77", setor: "Cadeira Inferior", tipoIngresso: "Parceria", lote: "Cortesia", itemCombo: "-", vendidos: 60, estoque: 130 },
    { id: "ips78", setor: "Cadeira Inferior", tipoIngresso: "Convidado Artista", lote: "Cortesia", itemCombo: "-", vendidos: 80, estoque: 120 },
    { id: "ips79", setor: "Cadeira Inferior", tipoIngresso: "Pré-venda Clube", lote: "Clube", itemCombo: "-", vendidos: 65, estoque: 5189 },
    { id: "ips80", setor: "Cadeira Inferior", tipoIngresso: "Staff", lote: "Clube", itemCombo: "-", vendidos: 50, estoque: 5189 },
    { id: "ips81", setor: "Cadeira Inferior", tipoIngresso: "Camarim", lote: "Cortesia", itemCombo: "-", vendidos: 15, estoque: 20 },
    { id: "ips82", setor: "Cadeira Inferior", tipoIngresso: "Membro", lote: "Clube", itemCombo: "-", vendidos: 135, estoque: 5189 },
    // Camarote (simulado)
    { id: "ips83", setor: "Camarote", tipoIngresso: "Inteira", lote: "Lote único", itemCombo: "-", vendidos: 40, estoque: 400 },
    { id: "ips84", setor: "Camarote", tipoIngresso: "Gratuidade - Menor de 12 Anos", lote: "Gratuidade", itemCombo: "-", vendidos: 60, estoque: 80 },
    { id: "ips85", setor: "Camarote", tipoIngresso: "Convidado Artista", lote: "Cortesia", itemCombo: "-", vendidos: 30, estoque: 60 },
    { id: "ips86", setor: "Camarote", tipoIngresso: "Patrocinador", lote: "Cortesia", itemCombo: "-", vendidos: 30, estoque: 60 },
    // Lounge Oeste (simulado)
    { id: "ips87", setor: "Lounge Oeste", tipoIngresso: "Inteira", lote: "Lote único", itemCombo: "-", vendidos: 50, estoque: 3000 },
    { id: "ips88", setor: "Lounge Oeste", tipoIngresso: "Pré-venda", lote: "Clube", itemCombo: "-", vendidos: 120, estoque: 3000 },
    { id: "ips89", setor: "Lounge Oeste", tipoIngresso: "VIP", lote: "Clube", itemCombo: "-", vendidos: 80, estoque: 3000 },
    { id: "ips90", setor: "Lounge Oeste", tipoIngresso: "Lote Promocional", lote: "Clube", itemCombo: "-", vendidos: 30, estoque: 3000 },
    { id: "ips91", setor: "Lounge Oeste", tipoIngresso: "Último Lote", lote: "Clube", itemCombo: "-", vendidos: 50, estoque: 3000 },
    // Lounge Leste (simulado)
    { id: "ips92", setor: "Lounge Leste", tipoIngresso: "Meia-Entrada", lote: "Lote único", itemCombo: "-", vendidos: 175, estoque: 1500 },
    { id: "ips93", setor: "Lounge Leste", tipoIngresso: "Lote Promocional", lote: "Clube", itemCombo: "-", vendidos: 40, estoque: 3000 },
    { id: "ips94", setor: "Lounge Leste", tipoIngresso: "Pré-venda Clube", lote: "Clube", itemCombo: "-", vendidos: 1, estoque: 3000 },
    { id: "ips95", setor: "Lounge Leste", tipoIngresso: "Pré-venda", lote: "Clube", itemCombo: "-", vendidos: 800, estoque: 3000 },
    { id: "ips96", setor: "Lounge Leste", tipoIngresso: "VIP", lote: "Clube", itemCombo: "-", vendidos: 350, estoque: 3000 },
    { id: "ips97", setor: "Lounge Leste", tipoIngresso: "Gratuidade - Maior de 60 Anos", lote: "Gratuidade", itemCombo: "-", vendidos: 150, estoque: 200 },
    { id: "ips98", setor: "Lounge Leste", tipoIngresso: "Convidado Artista", lote: "Cortesia", itemCombo: "-", vendidos: 50, estoque: 80 },
    { id: "ips99", setor: "Lounge Leste", tipoIngresso: "Parceria", lote: "Cortesia", itemCombo: "-", vendidos: 54, estoque: 130 },
];

/* Setores derivados das linhas: vendido = soma das linhas; estoque = capacidade
   física do setor (SETOR_CAP), pois o estoque por linha é pool compartilhado. */
const setores: SetorRow[] = (() => {
    const slug = (s: string) =>
        s
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    const order: string[] = [];
    const map = new Map<string, SetorRow>();
    for (const r of ingressosPorSetor) {
        let s = map.get(r.setor);
        if (!s) {
            s = { id: slug(r.setor), nome: r.setor, estoque: SETOR_CAP[r.setor] ?? 0, vendido: 0, ingressos: [] };
            map.set(r.setor, s);
            order.push(r.setor);
        }
        s.vendido += r.vendidos;
        if (!(r.setor in SETOR_CAP)) s.estoque = Math.max(s.estoque, r.estoque);
        s.ingressos!.push({ id: r.id, nome: r.tipoIngresso, estoque: r.estoque, vendido: r.vendidos });
    }
    return order.map((n) => map.get(n)!);
})();

const combos: ComboRow[] = [
    { id: "c1", nome: "Combo Camarote + Open Bar", quantidade: 1480, valorUnitario: 379, gmv: 560440, gmvComDesconto: 560440 },
    { id: "c2", nome: "Combo VIP + Welcome Drink", quantidade: 442, valorUnitario: 680, gmv: 300608, gmvComDesconto: 300608 },
    { id: "c3", nome: "Combo Família (4 ingressos)", quantidade: 112, valorUnitario: 681, gmv: 76188, gmvComDesconto: 76188 },
    { id: "c4", nome: "Combo Premium + Estacionamento", quantidade: 22, valorUnitario: 2159, gmv: 47498, gmvComDesconto: 47498 },
    { id: "c5", nome: "Combo Casal Camarote", quantidade: 49, valorUnitario: 758, gmv: 37124, gmvComDesconto: 37124 },
    { id: "c6", nome: "Combo VIP Solo + Brinde", quantidade: 14, valorUnitario: 1368, gmv: 19152, gmvComDesconto: 19152 },
    { id: "c7", nome: "Combo Business Pista Premium", quantidade: 2, valorUnitario: 1358, gmv: 2716, gmvComDesconto: 2716 },
];

const produtos: ProdutoRow[] = [
    { id: "pr1", nome: "Kit Oficial do Festival", quantidade: 123, valorUnitario: 199.9, gmv: 24587.7, gmvComDesconto: 24587.7 },
    { id: "pr2", nome: "Boneco Colecionável - Fandom Box", quantidade: 47, valorUnitario: 107.35, gmv: 5045.3, gmvComDesconto: 5045.3 },
    { id: "pr3", nome: "Sacochila Oficial", quantidade: 126, valorUnitario: 29.9, gmv: 3767.4, gmvComDesconto: 3767.4 },
    { id: "pr4", nome: "Camisa Oficial - M", quantidade: 36, valorUnitario: 99.9, gmv: 3596.4, gmvComDesconto: 3596.4 },
    { id: "pr5", nome: "Camisa Oficial - G", quantidade: 29, valorUnitario: 99.9, gmv: 2897.1, gmvComDesconto: 2897.1 },
    { id: "pr6", nome: "Camisa Oficial - P", quantidade: 23, valorUnitario: 99.9, gmv: 2297.7, gmvComDesconto: 2297.7 },
    { id: "pr7", nome: "Copo Oficial", quantidade: 100, valorUnitario: 19.89, gmv: 1989, gmvComDesconto: 1989 },
    { id: "pr8", nome: "Camisa Oficial - GG", quantidade: 14, valorUnitario: 99.9, gmv: 1398.6, gmvComDesconto: 1398.6 },
];

// Cupons agora detalhados por lote (abrem expandindo a linha).
const cupons: CupomRow[] = [
    {
        id: "cu1",
        cupom: "FAN15",
        quantidade: 142,
        valor: 19738.0,
        valorDesconto: 2960.7,
        valorTotal: 16777.3,
        lotes: [
            { id: "cu1-l1", lote: "1º Lote", quantidade: 78, valor: 10842.0, valorDesconto: 1626.3, valorTotal: 9215.7 },
            { id: "cu1-l2", lote: "2º Lote", quantidade: 44, valor: 6116.0, valorDesconto: 917.4, valorTotal: 5198.6 },
            { id: "cu1-l3", lote: "3º Lote", quantidade: 20, valor: 2780.0, valorDesconto: 417.0, valorTotal: 2363.0 },
        ],
    },
    {
        id: "cu2",
        cupom: "VIPACCESS",
        quantidade: 38,
        valor: 13680.0,
        valorDesconto: 1368.0,
        valorTotal: 12312.0,
        lotes: [
            { id: "cu2-l1", lote: "1º Lote", quantidade: 26, valor: 9360.0, valorDesconto: 936.0, valorTotal: 8424.0 },
            { id: "cu2-l2", lote: "2º Lote", quantidade: 12, valor: 4320.0, valorDesconto: 432.0, valorTotal: 3888.0 },
        ],
    },
    {
        id: "cu3",
        cupom: "PREMIERE10",
        quantidade: 24,
        valor: 7332.0,
        valorDesconto: 733.2,
        valorTotal: 6598.8,
        lotes: [
            { id: "cu3-l1", lote: "1º Lote", quantidade: 15, valor: 4582.5, valorDesconto: 458.3, valorTotal: 4124.2 },
            { id: "cu3-l2", lote: "2º Lote", quantidade: 9, valor: 2749.5, valorDesconto: 274.9, valorTotal: 2474.6 },
        ],
    },
    {
        id: "cu4",
        cupom: "TESTE2",
        quantidade: 1,
        valor: 139.0,
        valorDesconto: 137.61,
        valorTotal: 1.39,
        lotes: [{ id: "cu4-l1", lote: "1º Lote", quantidade: 1, valor: 139.0, valorDesconto: 137.61, valorTotal: 1.39 }],
    },
];

interface MixReceitaItem {
    id: string;
    nome: string;
    quantidade: number;
    gmv: number;
    gmvComDesconto: number;
    fill: string;
}

// Mix de receita: ingressos, combos e produtos.
const mixReceita: MixReceitaItem[] = [
    { id: "ingressos", nome: "Ingressos", quantidade: 12276, gmv: 2532994.0, gmvComDesconto: 2523733.99, fill: "var(--color-utility-brand-700)" },
    { id: "combos", nome: "Combos", quantidade: 2836, gmv: 1415534.0, gmvComDesconto: 1412183.4, fill: "var(--color-utility-blue-500)" },
    { id: "produtos", nome: "Produtos", quantidade: 498, gmv: 80120.0, gmvComDesconto: 79540.0, fill: "var(--color-utility-orange-400)" },
];

const VALOR_TOTAL_BASE = 2523733.99 + 1412183.4 + 79540.0; // líquido (c/ desconto)
const VALOR_BRUTO_BASE = 2532994.0 + 1415534.0 + 80120.0; // bruto (s/ desconto)
const TOTAL_ITENS_BASE = 12276 + 2836 + 498;

// Distribuição diária das vendas na janela do evento (14–21/06/2026). Pesos somam ~1.
const DIA_BASE = [
    { dia: "14/06/2026", label: "14/6", w: 0.05 },
    { dia: "15/06/2026", label: "15/6", w: 0.07 },
    { dia: "16/06/2026", label: "16/6", w: 0.09 },
    { dia: "17/06/2026", label: "17/6", w: 0.11 },
    { dia: "18/06/2026", label: "18/6", w: 0.14 },
    { dia: "19/06/2026", label: "19/6", w: 0.19 },
    { dia: "20/06/2026", label: "20/6", w: 0.17 },
    { dia: "21/06/2026", label: "21/6", w: 0.18 },
];

/* ------------------------------------------------------------------ */
/*  Drill-down tree (Data = sessão → Tipo → Setor → Ingresso → Lote)  */
/* ------------------------------------------------------------------ */

interface TreeNode {
    id: string;
    key: string;
    label: string;
    value: number;
    estoque?: number;
    childrenLabel?: string;
    children?: TreeNode[];
}

const buildDrillTree = (): TreeNode[] => {
    const lotes = (base: number, idPrefix: string): TreeNode[] => [
        { id: `${idPrefix}-int`, key: "int", label: "Inteira", value: Math.round(base * 0.5) },
        { id: `${idPrefix}-mei`, key: "mei", label: "Meia-Entrada", value: Math.round(base * 0.42) },
        { id: `${idPrefix}-out`, key: "out", label: "Outros", value: Math.round(base * 0.08) },
    ];
    const ingressosPorSetorNodes = (setorValue: number, setorId: string): TreeNode[] => {
        const seeds = [
            { key: "mei", label: "Meia-Entrada", w: 0.42 },
            { key: "int", label: "Inteira", w: 0.26 },
            { key: "alv", label: "Pré-venda", w: 0.14 },
            { key: "glo", label: "VIP", w: 0.08 },
            { key: "gra", label: "Gratuidade", w: 0.06 },
            { key: "cor", label: "Cortesia", w: 0.04 },
        ];
        return seeds.map((s) => ({
            id: `${setorId}-${s.key}`,
            key: s.key,
            label: s.label,
            value: Math.round(setorValue * s.w),
            childrenLabel: "Tipo de público",
            children: lotes(setorValue * s.w, `${setorId}-${s.key}`),
        }));
    };
    const setoresFor = (dateId: string, base: number): TreeNode[] => {
        const seeds = [
            { key: "leste-sup", label: "Cadeira Superior", w: 0.382 },
            { key: "oeste-inf", label: "Pista Premium", w: 0.212 },
            { key: "leste-inf", label: "Cadeira Inferior", w: 0.19 },
            { key: "oeste-sup-b", label: "Arquibancada", w: 0.128 },
            { key: "andar3-leste", label: "Lounge Leste", w: 0.062 },
            { key: "andar3-oeste", label: "Lounge Oeste", w: 0.013 },
            { key: "camarote", label: "Camarote", w: 0.006 },
            { key: "sul-visit", label: "Pista", w: 0.004 },
            { key: "tribuna", label: "Camarote Premium", w: 0.003 },
        ];
        return seeds.map((s) => {
            const setorId = `${dateId}-${s.key}`;
            const setorValue = Math.round(base * s.w);
            return { id: setorId, key: s.key, label: s.label, value: setorValue, childrenLabel: "Tipo de ingresso", children: ingressosPorSetorNodes(setorValue, setorId) };
        });
    };
    // Uma "data" por sessão do evento.
    const OCUP = [0.7339, 0.61, 0.52, 0.44];
    const dates: { id: string; label: string; estoque: number; ocupacao: number }[] = EVENT.sessoes.map((s, i) => ({
        id: s.id,
        label: s.label,
        estoque: 35679,
        ocupacao: OCUP[i] ?? 0.5,
    }));
    return dates.map((d) => {
        const ingressosVendidos = Math.round(d.estoque * d.ocupacao);
        const tiposDeItem: TreeNode[] = [
            { id: `${d.id}-ingressos`, key: "ingressos", label: "Ingressos", value: ingressosVendidos, childrenLabel: "Grupo", children: setoresFor(d.id, ingressosVendidos) },
        ];
        const total = tiposDeItem.reduce((s, x) => s + x.value, 0);
        return { id: d.id, key: d.id, label: d.label, value: total, estoque: d.estoque, childrenLabel: "Tipo do item", children: tiposDeItem };
    });
};

const drillTree = buildDrillTree();

// Sem produtos avulsos — root vazio mantém o componente, mas o botão "Produtos" não renderiza.
const aggregatedProdutos: TreeNode[] = [];

const PRODUTOS_ROOT_ID = "produtos-all";
const produtosRootNode: TreeNode = {
    id: PRODUTOS_ROOT_ID,
    key: PRODUTOS_ROOT_ID,
    label: "Produtos",
    value: aggregatedProdutos.reduce((s, c) => s + c.value, 0),
    childrenLabel: "Produto",
    children: aggregatedProdutos,
};

/* ------------------------------------------------------------------ */
/*  Scaling helpers (sessão + intervalo de data afetam tudo)          */
/* ------------------------------------------------------------------ */

// Peso de cada sessão nas vendas (soma ≈ 1).
const SESSAO_PESOS = [0.34, 0.28, 0.22, 0.16];
const SESSAO_WEIGHT: Record<string, number> = { all: 1 };
EVENT.sessoes.forEach((s, i) => {
    SESSAO_WEIGHT[s.id] = SESSAO_PESOS[i] ?? 1 / EVENT.sessoes.length;
});

const scaleTree = (nodes: TreeNode[], f: number): TreeNode[] =>
    nodes.map((n) => ({ ...n, value: Math.round(n.value * f), children: n.children ? scaleTree(n.children, f) : undefined }));

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function VendasPorGrupo() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="vendas-por-grupo">
            <RelatorioFiltersProvider initialDateRange={PERIODO_PADRAO}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 md:px-6 pb-10">
                        <RelatorioPageHeader title="Vendas" filter="period" />
                        <VendasBody />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const VendasBody = () => {
    const { dateRange } = useRelatorioFilters();

    const view = useMemo(() => {
        // Fonte única: dataset do evento (src/reports) agregado pelo período.
        const ds = consultarPeriodo(dateRange);
        const f = ds.evento.fracaoPeriodoSelecionado || 0;
        const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const capOf = (nome: string) => GRUPOS.find((g) => g.nome === nome)?.capacidade ?? 0;

        // Setores = grupos de ingresso do evento (Pista, Camarote, VIP…).
        const setoresView: SetorRow[] = ds.ingressosPorGrupo.map((g) => ({
            id: slug(g.grupo),
            nome: g.grupo,
            estoque: capOf(g.grupo),
            vendido: g.vendido,
            ingressos: [{ id: `${slug(g.grupo)}-i`, nome: "Inteira", estoque: capOf(g.grupo), vendido: g.vendido }],
        }));
        const ingressosPorSetorView: IngressoPorSetorRow[] = ds.ingressosPorGrupo.map((g, i) => ({
            id: `ips${i}`,
            setor: g.grupo,
            tipoIngresso: "Inteira",
            lote: "Lote único",
            itemCombo: "-",
            vendidos: g.vendido,
            estoque: capOf(g.grupo),
        }));

        const MIX_CORES = ["var(--color-utility-brand-700)", "var(--color-utility-blue-500)", "var(--color-utility-orange-400)"];
        const mixView: MixReceitaItem[] = ds.mixDeReceita.map((m, i) => ({
            id: `mix${i}`,
            nome: m.grupo,
            quantidade: m.quantidade,
            gmv: m.valor,
            gmvComDesconto: Math.round(m.valor * 0.97),
            fill: MIX_CORES[i % MIX_CORES.length],
        }));

        // Combos/produtos/cupons/drill: re-baseados pela fração real do período.
        const combosView: ComboRow[] = combos.map((c) => {
            const quantidade = Math.round(c.quantidade * f);
            const gmv = c.gmv * f;
            const q1 = Math.round(quantidade * 0.6);
            const q2 = quantidade - q1;
            const gmv1 = gmv * 0.6;
            const gmv2 = gmv * 0.4;
            const liq1 = gmv1 * 0.92;
            const liq2 = gmv2;
            const lotes: ComboLoteRow[] = [
                { id: `${c.id}-l1`, lote: "1º Lote", quantidade: q1, valorUnitario: q1 ? gmv1 / q1 : 0, gmv: gmv1, gmvComDesconto: liq1 },
                { id: `${c.id}-l2`, lote: "2º Lote", quantidade: q2, valorUnitario: q2 ? gmv2 / q2 : 0, gmv: gmv2, gmvComDesconto: liq2 },
            ].filter((l) => l.quantidade > 0);
            return { ...c, quantidade, gmv, gmvComDesconto: liq1 + liq2, valorUnitario: quantidade ? gmv / quantidade : 0, lotes };
        });
        const produtosView: ProdutoRow[] = produtos.map((p) => ({ ...p, quantidade: Math.round(p.quantidade * f), gmv: p.gmv * f, gmvComDesconto: p.gmvComDesconto * f }));
        const cuponsView: CupomRow[] = cupons.map((c) => ({
            ...c,
            quantidade: Math.round(c.quantidade * f),
            valor: c.valor * f,
            valorDesconto: c.valorDesconto * f,
            valorTotal: c.valorTotal * f,
            lotes: c.lotes.map((l) => ({ ...l, quantidade: Math.round(l.quantidade * f), valor: l.valor * f, valorDesconto: l.valorDesconto * f, valorTotal: l.valorTotal * f })),
        }));
        const drillView = scaleTree(drillTree, f);
        const produtosRootView: TreeNode = { ...produtosRootNode, ...scaleTree([produtosRootNode], f)[0] };

        const chartData: ChartPoint[] = ds.vendasDiarias.map((d) => ({ data: d.dia, total: d.valor, quantidade: d.itens }));

        return {
            setoresView,
            ingressosPorSetorView,
            mixView,
            combosView,
            produtosView,
            cuponsView,
            drillView,
            produtosRootView,
            valorTotal: ds.totais.valorTotalBruto,
            valorTotalDesconto: ds.totais.valorTotalComDesconto,
            totalItens: ds.totais.itensVendidos,
            chartData,
        };
    }, [dateRange]);

    return (
        <>
            <MetricsRow valorTotal={view.valorTotal} valorTotalDesconto={view.valorTotalDesconto} totalItens={view.totalItens} setores={view.setoresView} />
            <TransacionadoChartCard
                data={view.chartData}
                title="Total transacionado e número de ingressos"
                subtitle="Distribuição diária de transações e ingressos vendidos"
            />
            <MixReceitaCard items={view.mixView} />
            <DrillDownGmvCard tree={view.drillView} produtosRoot={view.produtosRootView} />
            <OcupacaoPorSetorCard rows={view.ingressosPorSetorView} />
            <ComboCard rows={view.combosView} />
            <ProdutosCard rows={view.produtosView} />
            <TicketsAvulsoCard rows={view.ingressosPorSetorView} />
            <IngressosComCupomCard cupons={view.cuponsView} />
        </>
    );
};

/* ------------------------------------------------------------------ */
/*  Metrics row                                                       */
/* ------------------------------------------------------------------ */

const MetricsRow = ({
    valorTotal,
    valorTotalDesconto,
    totalItens,
    setores: setoresView,
}: {
    valorTotal: number;
    valorTotalDesconto: number;
    totalItens: number;
    setores: SetorRow[];
}) => {
    const desconto = Math.max(0, valorTotal - valorTotalDesconto);
    const ticketMedio = totalItens === 0 ? 0 : valorTotal / totalItens;
    const totalEstoque = setoresView.reduce((s, x) => s + x.estoque, 0);
    const totalVendido = setoresView.reduce((s, x) => s + x.vendido, 0);
    const cardClass = "flex-1 md:min-w-[320px] [&_p+div]:hidden";
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricsIcon03 icon={CurrencyDollarCircle} title={currencyFormatter.format(valorTotal)} subtitle="Valor total" change={null} changeTrend="positive" actions={false} className={cardClass} />
            <MetricsIcon03 icon={CoinsStacked01} title={currencyFormatter.format(valorTotalDesconto)} subtitle="Valor total c/ desconto" change={null} changeTrend="positive" actions={false} className={cardClass} />
            <MetricsIcon03 icon={Tag01} title={currencyFormatter.format(desconto)} subtitle="Desconto" change={null} changeTrend="positive" actions={false} className={cardClass} />
            <MetricsIcon03 icon={Receipt} title={currencyFormatter.format(ticketMedio)} subtitle="Ticket médio" change={null} changeTrend="positive" actions={false} className={cardClass} />
            <MetricsIcon03 icon={Package} title={numberFormatter.format(totalItens)} subtitle="Quantidade de itens" change={null} changeTrend="positive" actions={false} className={cardClass} />
            <OcupacaoMetric totalEstoque={totalEstoque} totalVendido={totalVendido} />
        </div>
    );
};

const OcupacaoMetric = ({ totalEstoque, totalVendido }: { totalEstoque: number; totalVendido: number }) => (
    <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset">
        <div className="flex h-full items-center gap-8 px-4 py-5 md:px-5">
            <div className="relative flex flex-col gap-2 shrink-0 items-center justify-center">
                <ProgressBarHalfCircle size="xs" min={0} label="Ocupação" max={totalEstoque || 1} value={totalVendido} valueFormatter={(_value: number, pct: number) => `${pct}%`} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-lg font-semibold text-primary leading-tight">
                    {numberFormatter.format(totalVendido)}
                    <span className="font-normal text-tertiary"> de {numberFormatter.format(totalEstoque)}</span>
                </p>
            </div>
        </div>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Card shell                                                        */
/* ------------------------------------------------------------------ */

const Card = ({ title, children, headerRight }: { title: string; children: React.ReactNode; headerRight?: React.ReactNode }) => (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-4">
            <h3 className="text-md font-semibold text-primary">{title}</h3>
            {headerRight}
        </header>
        {children}
    </section>
);

/* ------------------------------------------------------------------ */
/*  Mix de receita                                                    */
/* ------------------------------------------------------------------ */

const MixReceitaCard = ({ items }: { items: MixReceitaItem[] }) => {
    const totalGmvDesc = items.reduce((s, x) => s + x.gmvComDesconto, 0) || 1;
    const radialData = items.map((item) => ({ ...item, value: Math.round((item.gmvComDesconto / totalGmvDesc) * 100) }));

    return (
        <Card title="Mix de receita">
            <div className="flex flex-col gap-6 px-4 py-5 md:flex-row md:items-center md:gap-8 md:px-5">
                <div className="flex shrink-0 flex-col items-center gap-2">
                    <div className="size-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={radialData} dataKey="gmvComDesconto" innerRadius="65%" outerRadius="100%" paddingAngle={2} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                                    {radialData.map((d) => (
                                        <Cell key={d.id} fill={d.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <ul className="flex w-full flex-1 flex-col divide-y divide-secondary">
                    {radialData.map((item) => (
                        <li key={item.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:gap-4">
                            <div className="flex min-w-0 items-center gap-3 md:flex-1">
                                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-sm font-semibold text-primary">{item.nome}</span>
                                    <span className="text-sm text-tertiary">{item.value}% do total</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4 md:flex-nowrap md:gap-8">
                                <MixStat className="md:w-20" label="Quantidade" value={numberFormatter.format(item.quantidade)} />
                                <MixStat className="md:w-36" label="Valor total bruto" value={currencyFormatter.format(item.gmv)} />
                                <MixStat className="md:w-28" label="Desconto" value={currencyFormatter.format(item.gmv - item.gmvComDesconto)} />
                                <MixStat className="md:w-36" label="Valor total c/ desconto" value={currencyFormatter.format(item.gmvComDesconto)} />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
};

const MixStat = ({ label, value, className }: { label: string; value: string; className?: string }) => (
    <div className={cx("flex flex-col gap-0.5", className)}>
        <span className="text-sm text-tertiary">{label}</span>
        <span className="text-sm font-medium text-primary tabular-nums">{value}</span>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Drill-down GMV                                                    */
/* ------------------------------------------------------------------ */

const DrillDownGmvCard = ({ tree, produtosRoot }: { tree: TreeNode[]; produtosRoot: TreeNode }) => {
    const [path, setPath] = useState<string[]>([]);
    const innerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
    const columnRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const [lines, setLines] = useState<string[]>([]);
    const [lockedWidth, setLockedWidth] = useState<number | null>(null);

    const bodyRef = useRef<HTMLDivElement>(null);
    const hintFiredRef = useRef(false);
    const [showHint, setShowHint] = useState(false);

    // Reseta a navegação quando a árvore muda (ex.: troca de sessão).
    useEffect(() => {
        setPath([]);
    }, [tree]);

    useEffect(() => {
        const el = bodyRef.current;
        if (!el) return;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (hintFiredRef.current) return;
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    hintFiredRef.current = true;
                    setShowHint(true);
                    timeout = setTimeout(() => setShowHint(false), 4000);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 },
        );
        observer.observe(el);
        return () => {
            observer.disconnect();
            if (timeout) clearTimeout(timeout);
        };
    }, []);

    const columns = useMemo(() => {
        const cols: TreeNode[][] = [tree];
        for (let i = 0; i < path.length; i++) {
            let parent = cols[i].find((n) => n.id === path[i]);
            if (!parent && i === 0 && path[0] === PRODUTOS_ROOT_ID) parent = produtosRoot;
            if (!parent?.children?.length) break;
            cols.push(parent.children);
        }
        return cols;
    }, [path, tree, produtosRoot]);

    const computeLines = () => {
        const inner = innerRef.current;
        if (!inner) return;
        const innerRect = inner.getBoundingClientRect();
        const next: string[] = [];
        for (let i = 0; i < path.length; i++) {
            const fromCol = columns[i];
            const nextCol = columns[i + 1];
            if (!fromCol || !nextCol?.length) continue;
            const fromEl = itemRefs.current.get(path[i]);
            const toEl = itemRefs.current.get(nextCol[0].id);
            if (!fromEl || !toEl) continue;
            const f = fromEl.getBoundingClientRect();
            const t = toEl.getBoundingClientRect();
            const x1 = f.right - innerRect.left;
            const y1 = f.top + f.height / 2 - innerRect.top;
            const x2 = t.left - innerRect.left;
            const y2 = t.top + t.height / 2 - innerRect.top;
            const midX = (x1 + x2) / 2;
            next.push(`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`);
        }
        setLines(next);
    };

    useLayoutEffect(() => {
        computeLines();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, columns]);

    useEffect(() => {
        const handle = () => computeLines();
        window.addEventListener("resize", handle);
        return () => window.removeEventListener("resize", handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, columns]);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        let left = 0;
        if (path.length === 0) {
            left = 0;
        } else {
            const target = columnRefs.current.get(path.length);
            if (target) {
                const RIGHT_PADDING = 48;
                const desired = target.offsetLeft + target.offsetWidth + RIGHT_PADDING - container.clientWidth;
                const innerWidth = lockedWidth ?? innerRef.current?.scrollWidth ?? container.scrollWidth;
                const maxScroll = Math.max(0, innerWidth - container.clientWidth);
                left = Math.max(0, Math.min(desired, maxScroll));
            }
        }
        container.scrollTo({ left, behavior: "smooth" });
        const t = setTimeout(() => setLockedWidth(null), 420);
        return () => clearTimeout(t);
    }, [path, lockedWidth]);

    const handleSelect = (colIndex: number, id: string) => {
        const isDeselect = path[colIndex] === id;
        const willShrink = isDeselect || colIndex < path.length;
        if (willShrink && innerRef.current) setLockedWidth(innerRef.current.scrollWidth);
        setPath((prev) => {
            const next = prev.slice(0, colIndex);
            if (prev[colIndex] === id) return next;
            next[colIndex] = id;
            return next;
        });
    };

    const reset = () => {
        if (innerRef.current) setLockedWidth(innerRef.current.scrollWidth);
        setPath([]);
    };

    return (
        <Card
            title="Detalhamento das vendas"
            headerRight={
                path.length > 0 ? (
                    <button type="button" onClick={reset} className="text-sm font-medium text-brand-secondary hover:text-brand-secondary_hover">
                        Limpar seleção
                    </button>
                ) : null
            }
        >
            <div ref={bodyRef} className="relative">
                <div ref={scrollRef} className="overflow-x-auto">
                    <div
                        ref={innerRef}
                        className="relative min-w-max opacity-100"
                        style={{
                            backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--color-fg-quaternary) 25%, transparent) 1px, transparent 1px)",
                            backgroundSize: "16px 16px",
                            minWidth: lockedWidth ?? undefined,
                        }}
                    >
                        <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
                            {lines.map((d, i) => (
                                <path key={i} d={d} fill="none" stroke="var(--color-utility-brand-400)" strokeWidth={2} />
                            ))}
                        </svg>

                        <div className="relative flex items-start gap-8 px-4 py-5 md:px-5">
                            {columns.map((nodes, colIndex) => {
                                const selectedId = path[colIndex];
                                const hasSelection = !!selectedId;
                                const resolveParent = (pi: number) => {
                                    if (path[pi] === PRODUTOS_ROOT_ID && pi === 0) return produtosRoot;
                                    return columns[pi].find((n) => n.id === path[pi]);
                                };
                                const headerLabel = colIndex === 0 ? "Sessão" : resolveParent(colIndex - 1)?.childrenLabel ?? "Detalhe";
                                const parentLabel = colIndex > 0 && path[colIndex - 1] ? resolveParent(colIndex - 1)?.label : null;
                                return (
                                    <motion.div
                                        key={colIndex}
                                        ref={(el) => {
                                            columnRefs.current.set(colIndex, el);
                                        }}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.22, ease: "easeOut" }}
                                        onAnimationComplete={computeLines}
                                        className="flex w-52 shrink-0 flex-col gap-5"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-col gap-0.5 pb-2">
                                                <span className="text-sm font-semibold text-tertiary uppercase tracking-wide">{headerLabel}</span>
                                                {parentLabel && <span className="truncate text-sm text-tertiary">{parentLabel}</span>}
                                            </div>
                                            <ul className="flex flex-col gap-2">
                                                {nodes.map((node) => {
                                                    const baseSum = nodes.reduce((s, n) => s + n.value, 0);
                                                    const isDateNode = colIndex === 0 && node.estoque !== undefined;
                                                    const pct = isDateNode ? (node.value / (node.estoque ?? 1)) * 100 : baseSum === 0 ? 0 : (node.value / baseSum) * 100;
                                                    const isSelected = node.id === selectedId;
                                                    const dimmed = hasSelection && !isSelected;
                                                    const isLeaf = !node.children?.length;
                                                    return (
                                                        <li key={node.id}>
                                                            <button
                                                                ref={(el) => {
                                                                    itemRefs.current.set(node.id, el);
                                                                }}
                                                                type="button"
                                                                onClick={() => !isLeaf && handleSelect(colIndex, node.id)}
                                                                disabled={isLeaf}
                                                                className={cx(
                                                                    "flex w-full flex-col gap-1 rounded-md bg-secondary px-3 py-2.5 text-left ring-1 ring-border-secondary transition duration-100 ease-linear",
                                                                    !isLeaf && "hover:bg-secondary_hover",
                                                                    isLeaf && "cursor-default",
                                                                    isSelected && "ring-2 ring-brand",
                                                                    dimmed && "opacity-50",
                                                                )}
                                                            >
                                                                <span className={cx("truncate text-sm text-primary", isSelected ? "font-semibold" : "font-medium")}>{node.label}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-quaternary">
                                                                        <div className={cx("h-full rounded-full", isSelected ? "bg-fg-brand-primary" : "bg-utility-brand-400")} style={{ width: `${pct}%` }} />
                                                                    </div>
                                                                    <span className="shrink-0 text-sm font-medium text-primary tabular-nums">{pct.toFixed(1)}%</span>
                                                                </div>
                                                                <span className="text-sm text-tertiary tabular-nums">
                                                                    {isDateNode ? `${numberFormatter.format(node.value)} / ${numberFormatter.format(node.estoque ?? 0)}` : numberFormatter.format(node.value)}
                                                                </span>
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>

                                        {colIndex === 0 && (produtosRoot.children?.length ?? 0) > 0 && (
                                            <div className="flex flex-col gap-2">
                                                <span className="pb-2 text-sm font-semibold text-tertiary uppercase tracking-wide">Produto</span>
                                                {(() => {
                                                    const isSelected = path[0] === PRODUTOS_ROOT_ID;
                                                    const dimmed = hasSelection && !isSelected;
                                                    return (
                                                        <button
                                                            ref={(el) => {
                                                                itemRefs.current.set(PRODUTOS_ROOT_ID, el);
                                                            }}
                                                            type="button"
                                                            onClick={() => handleSelect(0, PRODUTOS_ROOT_ID)}
                                                            className={cx(
                                                                "flex w-full flex-col gap-1 rounded-md bg-secondary px-3 py-2.5 text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary_hover",
                                                                isSelected && "ring-2 ring-brand",
                                                                dimmed && "opacity-50",
                                                            )}
                                                        >
                                                            <span className={cx("truncate text-sm text-primary", isSelected ? "font-semibold" : "font-medium")}>Produtos</span>
                                                            <span className="text-sm text-tertiary">{produtosRoot.children?.length ?? 0} itens</span>
                                                            <span className="text-sm text-tertiary tabular-nums">{numberFormatter.format(produtosRoot.value)} unidades</span>
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}

                            {path.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.22, ease: "easeOut", delay: 0.05 }}
                                    className="hidden max-w-[240px] flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center md:flex"
                                >
                                    <FeaturedIcon icon={CursorClick02} color="gray" theme="modern" size="md" />
                                    <p className="text-sm font-semibold text-primary">Selecione uma sessão</p>
                                    <p className="text-sm text-tertiary">Escolha uma sessão para ver o detalhamento por tipo, grupo, ingresso, lote e tipo.</p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showHint && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-primary/85 px-6 text-center backdrop-blur-[2px] md:hidden"
                        >
                            <FeaturedIcon icon={CursorClick02} color="gray" theme="modern" size="md" />
                            <p className="text-sm font-semibold text-primary">Selecione uma sessão</p>
                            <p className="max-w-[260px] text-sm text-tertiary">Escolha uma sessão para ver o detalhamento por tipo, grupo, ingresso, lote e tipo.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Ocupação por setor                                                */
/* ------------------------------------------------------------------ */

interface OcuLote {
    id: string;
    lote: string;
    estoque: number;
    ingressos: number;
}
interface OcuItem {
    id: string;
    item: string;
    estoque: number;
    ingressos: number;
    lotes: OcuLote[];
}
interface OcuGrupo {
    id: string;
    grupo: string;
    estoque: number;
    ingressos: number;
    itens: OcuItem[];
}

const OcupacaoPorSetorCard = ({ rows }: { rows: IngressoPorSetorRow[] }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const grupos = useMemo<OcuGrupo[]>(() => {
        const gMap = new Map<string, { grupo: string; itens: Map<string, OcuLote[]> }>();
        rows.forEach((row) => {
            const lote: OcuLote = { id: row.id, lote: row.lote, estoque: row.estoque, ingressos: row.vendidos };
            const g = gMap.get(row.setor) ?? { grupo: row.setor, itens: new Map<string, OcuLote[]>() };
            const arr = g.itens.get(row.tipoIngresso) ?? [];
            arr.push(lote);
            g.itens.set(row.tipoIngresso, arr);
            gMap.set(row.setor, g);
        });
        return Array.from(gMap.values())
            .map((g) => {
                const itens: OcuItem[] = Array.from(g.itens.entries())
                    .map(([item, lotes]) => ({
                        id: `${g.grupo}|${item}`,
                        item,
                        estoque: lotes.reduce((s, x) => s + x.estoque, 0),
                        ingressos: lotes.reduce((s, x) => s + x.ingressos, 0),
                        lotes: [...lotes].sort((a, b) => b.ingressos - a.ingressos),
                    }))
                    .sort((a, b) => b.ingressos - a.ingressos);
                const ingressos = itens.reduce((s, x) => s + x.ingressos, 0);
                // Estoque do grupo = capacidade física (SETOR_CAP); fallback p/ soma dos itens.
                const estoque = SETOR_CAP[g.grupo] ?? itens.reduce((s, x) => s + x.estoque, 0);
                return { id: g.grupo, grupo: g.grupo, estoque, ingressos, itens };
            })
            .sort((a, b) => b.ingressos - a.ingressos);
    }, [rows]);

    const toggle = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    return (
        <Card title="Ocupação por grupo">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full table-fixed border-collapse">
                    <colgroup>
                        <col className="w-[46%] md:w-auto" />
                        <col className="hidden md:table-column" />
                        <col className="hidden md:table-column" />
                        <col />
                    </colgroup>
                    <thead className="bg-secondary">
                        <tr className="border-b border-secondary text-left">
                            <th className="px-4 py-3 text-sm font-semibold text-tertiary">Grupo • Ingresso • Lote</th>
                            <th className="hidden whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary md:table-cell">Estoque</th>
                            <th className="hidden whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary md:table-cell">Ingressos</th>
                            <th className="px-4 py-3 text-sm font-semibold text-tertiary">Ocupação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grupos.map((grupo) => {
                            const gExp = expanded.has(grupo.id);
                            return (
                                <Fragment key={grupo.id}>
                                    <tr
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={gExp}
                                        onClick={() => toggle(grupo.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                toggle(grupo.id);
                                            }
                                        }}
                                        className="cursor-pointer border-b border-secondary bg-primary transition duration-100 ease-linear hover:bg-primary_hover"
                                    >
                                        <td className="py-3.5 pr-4 text-sm" style={{ paddingLeft: 16 }}>
                                            <span className="flex items-center gap-2">
                                                <ChevronDown aria-hidden="true" className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", gExp && "rotate-180")} />
                                                <span className="line-clamp-2 font-bold text-primary">{grupo.grupo}</span>
                                            </span>
                                        </td>
                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-secondary md:table-cell">{numberFormatter.format(grupo.estoque)}</td>
                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold text-primary md:table-cell">{numberFormatter.format(grupo.ingressos)}</td>
                                        <td className="px-4 py-3.5">
                                            <OccupancyBar value={grupo.ingressos} total={grupo.estoque} />
                                        </td>
                                    </tr>
                                    {gExp &&
                                        grupo.itens.map((item) => {
                                            const iExp = expanded.has(item.id);
                                            return (
                                                <Fragment key={item.id}>
                                                    <tr
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-expanded={iExp}
                                                        onClick={() => toggle(item.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" || e.key === " ") {
                                                                e.preventDefault();
                                                                toggle(item.id);
                                                            }
                                                        }}
                                                        className="cursor-pointer border-b border-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                                                    >
                                                        <td className="py-3.5 pr-4 text-sm" style={{ paddingLeft: 40 }}>
                                                            <span className="flex items-center gap-2">
                                                                <ChevronDown aria-hidden="true" className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", iExp && "rotate-180")} />
                                                                <span className="line-clamp-2 font-semibold text-secondary">{item.item}</span>
                                                            </span>
                                                        </td>
                                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(item.estoque)}</td>
                                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-secondary md:table-cell">{numberFormatter.format(item.ingressos)}</td>
                                                        <td className="px-4 py-3.5">
                                                            <OccupancyBar value={item.ingressos} total={item.estoque} />
                                                        </td>
                                                    </tr>
                                                    {iExp &&
                                                        item.lotes.map((lote) => (
                                                            <tr key={lote.id} className="border-b border-secondary bg-secondary/60">
                                                                <td className="py-3 pr-4 text-sm text-tertiary" style={{ paddingLeft: 64 }}>
                                                                    <span className="line-clamp-2">{lote.lote}</span>
                                                                </td>
                                                                <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(lote.estoque)}</td>
                                                                <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(lote.ingressos)}</td>
                                                                <td className="px-4 py-3">
                                                                    <OccupancyBar value={lote.ingressos} total={lote.estoque} />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </Fragment>
                                            );
                                        })}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const OccupancyBar = ({ value, total }: { value: number; total: number }) => {
    const pct = total === 0 ? 0 : Math.round((value / total) * 100);
    const clamped = Math.min(100, Math.max(0, pct));
    return (
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-tertiary/90">
                <div className="h-full rounded-full bg-brand-solid transition-all" style={{ width: `${clamped}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right text-sm text-tertiary">{clamped}%</span>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Quantidade de ingressos por setor (tickets avulsos)               */
/* ------------------------------------------------------------------ */

/* Preço-base por grupo (setor) para estimar o valor dos tickets avulsos. */
const PRECO_SETOR: Record<string, number> = {
    "Camarote Premium": 620,
    "Pista": 180,
    "Arquibancada": 120,
    "Pista Premium": 260,
    "Cadeira Superior": 100,
    "Cadeira Inferior": 150,
    "Camarote": 480,
    "Lounge Oeste": 320,
    "Lounge Leste": 320,
};

const precoRow = (row: IngressoPorSetorRow): number => {
    const l = row.lote.toLowerCase();
    const t = row.tipoIngresso.toLowerCase();
    if (l.includes("gratuidade") || l.includes("cortesia") || t.includes("gratuidade") || t.includes("cortesia") || t.includes("staff") || t.includes("convidado") || t.includes("órgão")) return 0;
    let base = PRECO_SETOR[row.setor] ?? 150;
    if (t.includes("meia")) base = base / 2;
    return base;
};

interface TALote {
    id: string;
    lote: string;
    quantidade: number;
    valorUnitario: number;
    gmv: number;
    gmvComDesconto: number;
}
interface TAItem {
    id: string;
    item: string;
    quantidade: number;
    valorUnitario: number;
    gmv: number;
    gmvComDesconto: number;
    lotes: TALote[];
}
interface TAGrupo {
    id: string;
    grupo: string;
    quantidade: number;
    valorUnitario: number;
    gmv: number;
    gmvComDesconto: number;
    itens: TAItem[];
}

const TicketsAvulsoCard = ({ rows }: { rows: IngressoPorSetorRow[] }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const grupos = useMemo<TAGrupo[]>(() => {
        const gMap = new Map<string, { grupo: string; itens: Map<string, TALote[]> }>();
        rows.forEach((row) => {
            const preco = precoRow(row);
            const gmv = row.vendidos * preco;
            const l = row.lote.toLowerCase();
            const descPct = /promo|pré-venda|pre-venda|último|ultimo|clube/.test(l) ? 0.1 : 0;
            const lote: TALote = { id: row.id, lote: row.lote, quantidade: row.vendidos, valorUnitario: preco, gmv, gmvComDesconto: gmv * (1 - descPct) };
            const g = gMap.get(row.setor) ?? { grupo: row.setor, itens: new Map<string, TALote[]>() };
            const arr = g.itens.get(row.tipoIngresso) ?? [];
            arr.push(lote);
            g.itens.set(row.tipoIngresso, arr);
            gMap.set(row.setor, g);
        });
        const roll = (lotes: TALote[]) => ({
            quantidade: lotes.reduce((s, x) => s + x.quantidade, 0),
            gmv: lotes.reduce((s, x) => s + x.gmv, 0),
            gmvComDesconto: lotes.reduce((s, x) => s + x.gmvComDesconto, 0),
        });
        const avg = (gmv: number, q: number) => (q ? gmv / q : 0);
        return Array.from(gMap.values())
            .map((g) => {
                const itens: TAItem[] = Array.from(g.itens.entries())
                    .map(([item, lotes]) => {
                        const t = roll(lotes);
                        return { id: `${g.grupo}|${item}`, item, ...t, valorUnitario: avg(t.gmv, t.quantidade), lotes: [...lotes].sort((a, b) => b.gmv - a.gmv) };
                    })
                    .sort((a, b) => b.gmv - a.gmv);
                const t = roll(itens as unknown as TALote[]);
                return { id: g.grupo, grupo: g.grupo, ...t, valorUnitario: avg(t.gmv, t.quantidade), itens };
            })
            .sort((a, b) => b.gmv - a.gmv);
    }, [rows]);

    const totais = useMemo(
        () => ({
            quantidade: grupos.reduce((s, g) => s + g.quantidade, 0),
            gmv: grupos.reduce((s, g) => s + g.gmv, 0),
            gmvComDesconto: grupos.reduce((s, g) => s + g.gmvComDesconto, 0),
        }),
        [grupos],
    );

    const toggle = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const money = (v: number) => currencyFormatter.format(v);

    return (
        <Card title="Tickets Avulso">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full table-fixed border-collapse">
                    <colgroup>
                        <col className="w-[46%] md:w-auto" />
                        <col className="hidden md:table-column" />
                        <col className="hidden md:table-column" />
                        <col className="hidden md:table-column" />
                        <col className="hidden md:table-column" />
                        <col />
                    </colgroup>
                    <thead className="bg-secondary">
                        <tr className="border-b border-secondary text-left">
                            <th className="px-4 py-3 text-sm font-semibold text-tertiary">Grupo • Item • Lote</th>
                            <th className="hidden whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary md:table-cell">Quantidade</th>
                            <th className="hidden whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary md:table-cell">Valor unitário médio</th>
                            <th className="hidden whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary md:table-cell">Valor total bruto</th>
                            <th className="hidden whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary md:table-cell">Desconto</th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary">Valor total c/ desconto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grupos.map((grupo) => {
                            const gExp = expanded.has(grupo.id);
                            return (
                                <Fragment key={grupo.id}>
                                    <tr
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={gExp}
                                        onClick={() => toggle(grupo.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                toggle(grupo.id);
                                            }
                                        }}
                                        className="cursor-pointer border-b border-secondary bg-primary transition duration-100 ease-linear hover:bg-primary_hover"
                                    >
                                        <td className="py-3.5 pr-4 text-sm" style={{ paddingLeft: 16 }}>
                                            <span className="flex items-center gap-2">
                                                <ChevronDown aria-hidden="true" className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", gExp && "rotate-180")} />
                                                <span className="line-clamp-2 font-bold text-primary">{grupo.grupo}</span>
                                            </span>
                                        </td>
                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold text-primary md:table-cell">{numberFormatter.format(grupo.quantidade)}</td>
                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-secondary md:table-cell">{money(grupo.valorUnitario)}</td>
                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-secondary md:table-cell">{money(grupo.gmv)}</td>
                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-secondary md:table-cell">{money(grupo.gmv - grupo.gmvComDesconto)}</td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold text-primary">{money(grupo.gmvComDesconto)}</td>
                                    </tr>
                                    {gExp &&
                                        grupo.itens.map((item) => {
                                            const iExp = expanded.has(item.id);
                                            return (
                                                <Fragment key={item.id}>
                                                    <tr
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-expanded={iExp}
                                                        onClick={() => toggle(item.id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" || e.key === " ") {
                                                                e.preventDefault();
                                                                toggle(item.id);
                                                            }
                                                        }}
                                                        className="cursor-pointer border-b border-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                                                    >
                                                        <td className="py-3.5 pr-4 text-sm" style={{ paddingLeft: 40 }}>
                                                            <span className="flex items-center gap-2">
                                                                <ChevronDown aria-hidden="true" className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", iExp && "rotate-180")} />
                                                                <span className="line-clamp-2 font-semibold text-secondary">{item.item}</span>
                                                            </span>
                                                        </td>
                                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-secondary md:table-cell">{numberFormatter.format(item.quantidade)}</td>
                                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm text-tertiary md:table-cell">{money(item.valorUnitario)}</td>
                                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm text-tertiary md:table-cell">{money(item.gmv)}</td>
                                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm text-tertiary md:table-cell">{money(item.gmv - item.gmvComDesconto)}</td>
                                                        <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-secondary">{money(item.gmvComDesconto)}</td>
                                                    </tr>
                                                    {iExp &&
                                                        item.lotes.map((lote) => (
                                                            <tr key={lote.id} className="border-b border-secondary bg-secondary/60">
                                                                <td className="py-3 pr-4 text-sm text-tertiary" style={{ paddingLeft: 64 }}>
                                                                    <span className="line-clamp-2">{lote.lote}</span>
                                                                </td>
                                                                <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(lote.quantidade)}</td>
                                                                <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary md:table-cell">{money(lote.valorUnitario)}</td>
                                                                <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary md:table-cell">{money(lote.gmv)}</td>
                                                                <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary md:table-cell">{money(lote.gmv - lote.gmvComDesconto)}</td>
                                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-primary">{money(lote.gmvComDesconto)}</td>
                                                            </tr>
                                                        ))}
                                                </Fragment>
                                            );
                                        })}
                                </Fragment>
                            );
                        })}
                        <tr className="border-t-2 border-secondary bg-secondary">
                            <td className="px-4 py-3.5 text-sm font-bold text-primary">Total geral</td>
                            <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-bold text-primary md:table-cell">{numberFormatter.format(totais.quantidade)}</td>
                            <td className="hidden md:table-cell" />
                            <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-bold text-primary md:table-cell">{money(totais.gmv)}</td>
                            <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-bold text-primary md:table-cell">{money(totais.gmv - totais.gmvComDesconto)}</td>
                            <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-bold text-primary">{money(totais.gmvComDesconto)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Combo                                                             */
/* ------------------------------------------------------------------ */

const ComboCard = ({ rows }: { rows: ComboRow[] }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const accessors = useMemo(() => ({ desconto: (r: ComboRow) => r.gmv - r.gmvComDesconto }), []);
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(
        rows as unknown as Record<string, unknown>[],
        accessors as Partial<Record<string, (r: Record<string, unknown>) => string | number>>,
        { key: "gmv", dir: "desc" },
    );
    const sortedRows = sorted as unknown as ComboRow[];

    const toggle = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    return (
        <Card title="Combo">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full table-fixed border-collapse">
                    <colgroup>
                        <col className="w-[46%] md:w-auto" />
                        <col className="hidden md:table-column" />
                        <col className="hidden md:table-column" />
                        <col className="hidden md:table-column" />
                        <col className="hidden md:table-column" />
                        <col />
                    </colgroup>
                    <thead className="bg-secondary">
                        <tr className="border-b border-secondary text-left">
                            <th className="px-4 py-3 text-sm font-semibold text-tertiary"><SortableHeader label="Combo" sortKey="nome" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="hidden whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary md:table-cell"><SortableHeader label="Quantidade" align="right" sortKey="quantidade" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="hidden whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary md:table-cell"><SortableHeader label="Valor unitário médio" align="right" sortKey="valorUnitario" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="hidden whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary md:table-cell"><SortableHeader label="Valor total bruto" align="right" sortKey="gmv" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="hidden whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary md:table-cell"><SortableHeader label="Desconto" align="right" sortKey="desconto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary"><SortableHeader label="Valor total c/ desconto" align="right" sortKey="gmvComDesconto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((row) => {
                            const isExpanded = expanded.has(row.id);
                            const lotes = row.lotes ?? [];
                            return (
                                <Fragment key={row.id}>
                                    <tr
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={isExpanded}
                                        onClick={() => toggle(row.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                toggle(row.id);
                                            }
                                        }}
                                        className="cursor-pointer border-b border-secondary bg-primary transition duration-100 ease-linear hover:bg-primary_hover"
                                    >
                                        <td className="py-3.5 pr-4 text-sm" style={{ paddingLeft: 16 }}>
                                            <span className="flex items-center gap-2">
                                                <ChevronDown aria-hidden="true" className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", isExpanded && "rotate-180")} />
                                                <span className="line-clamp-2 font-bold text-primary">{row.nome}</span>
                                            </span>
                                        </td>
                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold text-primary md:table-cell">{numberFormatter.format(row.quantidade)}</td>
                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-secondary md:table-cell">{currencyFormatter.format(row.valorUnitario)}</td>
                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-secondary md:table-cell">{currencyFormatter.format(row.gmv)}</td>
                                        <td className="hidden whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-secondary md:table-cell">{currencyFormatter.format(row.gmv - row.gmvComDesconto)}</td>
                                        <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold text-primary">{currencyFormatter.format(row.gmvComDesconto)}</td>
                                    </tr>
                                    {isExpanded &&
                                        lotes.map((lote) => (
                                            <tr key={lote.id} className="border-b border-secondary bg-secondary/60">
                                                <td className="py-3 pr-4 text-sm text-tertiary" style={{ paddingLeft: 40 }}>
                                                    <span className="line-clamp-2">{lote.lote}</span>
                                                </td>
                                                <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(lote.quantidade)}</td>
                                                <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary md:table-cell">{currencyFormatter.format(lote.valorUnitario)}</td>
                                                <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary md:table-cell">{currencyFormatter.format(lote.gmv)}</td>
                                                <td className="hidden whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary md:table-cell">{currencyFormatter.format(lote.gmv - lote.gmvComDesconto)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-primary">{currencyFormatter.format(lote.gmvComDesconto)}</td>
                                            </tr>
                                        ))}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Produtos                                                          */
/* ------------------------------------------------------------------ */

const ProdutosCard = ({ rows }: { rows: ProdutoRow[] }) => {
    const accessors = useMemo(() => ({ desconto: (r: ProdutoRow) => r.gmv - r.gmvComDesconto }), []);
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(
        rows as unknown as Record<string, unknown>[],
        accessors as Partial<Record<string, (r: Record<string, unknown>) => string | number>>,
        { key: "gmv", dir: "desc" },
    );
    const sortedRows = sorted as unknown as ProdutoRow[];
    return (
        <Card title="Produtos">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            <th className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-tertiary"><SortableHeader label="Produto" sortKey="nome" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary"><SortableHeader label="Quantidade" align="right" sortKey="quantidade" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary"><SortableHeader label="Valor unitário médio" align="right" sortKey="valorUnitario" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary"><SortableHeader label="Valor total bruto" align="right" sortKey="gmv" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary"><SortableHeader label="Desconto" align="right" sortKey="desconto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary"><SortableHeader label="Valor total c/ desconto" align="right" sortKey="gmvComDesconto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((row, i) => (
                            <tr key={row.id} className={cx("transition duration-100 ease-linear hover:bg-primary_hover", i !== sortedRows.length - 1 && "border-b border-secondary")}>
                                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">{row.nome}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{numberFormatter.format(row.quantidade)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valorUnitario)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.gmv)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.gmv - row.gmvComDesconto)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.gmvComDesconto)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Ingressos com cupom (expansível por lote)                         */
/* ------------------------------------------------------------------ */

const IngressosComCupomCard = ({ cupons: cuponsView }: { cupons: CupomRow[] }) => {
    const accessors = useMemo(
        () => ({ cupom: (c: CupomRow) => c.cupom, quantidade: (c: CupomRow) => c.quantidade, valor: (c: CupomRow) => c.valor, valorDesconto: (c: CupomRow) => c.valorDesconto, valorTotal: (c: CupomRow) => c.valorTotal }),
        [],
    );
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(cuponsView as unknown as Record<string, unknown>[], accessors as Partial<Record<string, (r: Record<string, unknown>) => string | number>>, { key: "quantidade", dir: "desc" });
    const sortedCupons = sorted as unknown as CupomRow[];

    return (
        <Card title="Quantidade de ingressos com cupom">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            <th className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-tertiary"><SortableHeader label="Cupom" sortKey="cupom" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary"><SortableHeader label="Quantidade" align="right" sortKey="quantidade" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary"><SortableHeader label="Valor" align="right" sortKey="valor" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary"><SortableHeader label="Valor do Desconto" align="right" sortKey="valorDesconto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary"><SortableHeader label="Valor Total" align="right" sortKey="valorTotal" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCupons.map((row, i) => (
                            <tr key={row.id} className={cx("transition duration-100 ease-linear hover:bg-primary_hover", i !== sortedCupons.length - 1 && "border-b border-secondary")}>
                                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">{row.cupom}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{numberFormatter.format(row.quantidade)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valor)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valorDesconto)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valorTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
