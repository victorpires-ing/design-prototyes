import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, CurrencyDollarCircle, CursorClick02, Receipt } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ProgressBarHalfCircle } from "@/components/base/progress-indicators/progress-circles";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, dateRangeFraction, useRelatorioFilters } from "../components/relatorio-filters";
import { SortableHeader } from "../components/SortableHeader";
import { useSortableTable } from "../utils/useSortableTable";
import { EVENT, currencyFormatter, numberFormatter } from "../data/event";

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

interface ComboRow {
    id: string;
    nome: string;
    quantidade: number;
    valorUnitario: number;
    gmv: number;
    gmvComDesconto: number;
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
/*  Quantidade de ingresso por setor — espelha o relatório real de      */
/*  futebol (Grêmio x Santos). Cada linha = tipo de ingresso × setor.   */
/*  "Estoque" é a capacidade do pool compartilhado do setor (repetida    */
/*  por linha, como no relatório); Meia-Entrada tem sub-limite próprio.  */
/*  Nenhum item tem combo → itemCombo sempre "-".                        */
/*                                                                       */
/*  Setores sem print de tabela (Gold Leste, Camarote, Arquibancada     */
/*  Norte, Adversário) e linhas ocultas por scroll (Gramado Sul, Gold    */
/*  Norte) foram simulados p/ casar com o gráfico de ocupação e o total  */
/*  geral de 27.121 itens.                                               */
/* ------------------------------------------------------------------ */

const ingressosPorSetor: IngressoPorSetorRow[] = [
    // Superior Sul
    { id: "ips1", setor: "Superior Sul", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 289, estoque: 2003 },
    { id: "ips2", setor: "Superior Sul", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 241, estoque: 901 },
    { id: "ips3", setor: "Superior Sul", tipoIngresso: "Acompanhante", lote: "Acompanhante", itemCombo: "-", vendidos: 68, estoque: 2003 },
    { id: "ips4", setor: "Superior Sul", tipoIngresso: "Ouro", lote: "Ouro", itemCombo: "-", vendidos: 8, estoque: 2003 },
    { id: "ips5", setor: "Superior Sul", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 23, estoque: 2003 },
    { id: "ips6", setor: "Superior Sul", tipoIngresso: "Infantil", lote: "Infantil", itemCombo: "-", vendidos: 23, estoque: 2003 },
    { id: "ips7", setor: "Superior Sul", tipoIngresso: "Acompanhante Ouro", lote: "Acompanhante Ouro", itemCombo: "-", vendidos: 3, estoque: 2003 },
    { id: "ips8", setor: "Superior Sul", tipoIngresso: "Acompanhante Diamante", lote: "Acompanhante Diamante", itemCombo: "-", vendidos: 9, estoque: 2003 },
    { id: "ips9", setor: "Superior Sul", tipoIngresso: "Juvenil", lote: "Juvenil", itemCombo: "-", vendidos: 2, estoque: 2003 },
    // Superior Oeste
    { id: "ips10", setor: "Superior Oeste", tipoIngresso: "Acompanhante", lote: "Acompanhante", itemCombo: "-", vendidos: 284, estoque: 2585 },
    { id: "ips11", setor: "Superior Oeste", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 409, estoque: 1163 },
    { id: "ips12", setor: "Superior Oeste", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 520, estoque: 2585 },
    { id: "ips13", setor: "Superior Oeste", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 56, estoque: 2585 },
    { id: "ips14", setor: "Superior Oeste", tipoIngresso: "Infantil", lote: "Infantil", itemCombo: "-", vendidos: 81, estoque: 2585 },
    { id: "ips15", setor: "Superior Oeste", tipoIngresso: "Juvenil", lote: "Juvenil", itemCombo: "-", vendidos: 9, estoque: 2585 },
    { id: "ips16", setor: "Superior Oeste", tipoIngresso: "Acompanhante Ouro", lote: "Acompanhante Ouro", itemCombo: "-", vendidos: 12, estoque: 2585 },
    { id: "ips17", setor: "Superior Oeste", tipoIngresso: "Ouro", lote: "Ouro", itemCombo: "-", vendidos: 14, estoque: 2585 },
    { id: "ips18", setor: "Superior Oeste", tipoIngresso: "Acompanhante Diamante", lote: "Acompanhante Diamante", itemCombo: "-", vendidos: 30, estoque: 2585 },
    { id: "ips19", setor: "Superior Oeste", tipoIngresso: "Acompanhante..", lote: "ac", itemCombo: "-", vendidos: 1, estoque: 10 },
    { id: "ips20", setor: "Superior Oeste", tipoIngresso: "Acompanhante.", lote: "Acompanhante.", itemCombo: "-", vendidos: 1, estoque: 2585 },
    // Superior Norte
    { id: "ips21", setor: "Superior Norte", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 437, estoque: 1089 },
    { id: "ips22", setor: "Superior Norte", tipoIngresso: "Acompanhante Ouro", lote: "Acompanhante Ouro", itemCombo: "-", vendidos: 17, estoque: 1089 },
    { id: "ips23", setor: "Superior Norte", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 240, estoque: 490 },
    { id: "ips24", setor: "Superior Norte", tipoIngresso: "Acompanhante", lote: "Acompanhante", itemCombo: "-", vendidos: 205, estoque: 1089 },
    { id: "ips25", setor: "Superior Norte", tipoIngresso: "Ouro", lote: "Ouro", itemCombo: "-", vendidos: 30, estoque: 1089 },
    { id: "ips26", setor: "Superior Norte", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 61, estoque: 1089 },
    { id: "ips27", setor: "Superior Norte", tipoIngresso: "Infantil", lote: "Infantil", itemCombo: "-", vendidos: 49, estoque: 1089 },
    { id: "ips28", setor: "Superior Norte", tipoIngresso: "Acompanhante Diamante", lote: "Acompanhante Diamante", itemCombo: "-", vendidos: 30, estoque: 1089 },
    { id: "ips29", setor: "Superior Norte", tipoIngresso: "Juvenil", lote: "Juvenil", itemCombo: "-", vendidos: 6, estoque: 1089 },
    // Superior Leste
    { id: "ips30", setor: "Superior Leste", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 2126, estoque: 5303 },
    { id: "ips31", setor: "Superior Leste", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 2014, estoque: 2386 },
    { id: "ips32", setor: "Superior Leste", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 318, estoque: 5303 },
    { id: "ips33", setor: "Superior Leste", tipoIngresso: "Infantil", lote: "Infantil", itemCombo: "-", vendidos: 181, estoque: 5303 },
    { id: "ips34", setor: "Superior Leste", tipoIngresso: "Acompanhante", lote: "Acompanhante", itemCombo: "-", vendidos: 385, estoque: 5303 },
    { id: "ips35", setor: "Superior Leste", tipoIngresso: "Ouro", lote: "Ouro", itemCombo: "-", vendidos: 60, estoque: 5303 },
    { id: "ips36", setor: "Superior Leste", tipoIngresso: "Acompanhante Diamante", lote: "Acompanhante Diamante", itemCombo: "-", vendidos: 153, estoque: 5303 },
    { id: "ips37", setor: "Superior Leste", tipoIngresso: "Juvenil", lote: "Juvenil", itemCombo: "-", vendidos: 32, estoque: 5303 },
    { id: "ips38", setor: "Superior Leste", tipoIngresso: "Acompanhante Ouro", lote: "Acompanhante Ouro", itemCombo: "-", vendidos: 33, estoque: 5303 },
    // Gramado Sul (linhas do meio simuladas — ocultas por scroll no print)
    { id: "ips39", setor: "Gramado Sul", tipoIngresso: "Inteira", lote: "Lote único", itemCombo: "-", vendidos: 5, estoque: 50 },
    { id: "ips40", setor: "Gramado Sul", tipoIngresso: "Acompanhante Diamante", lote: "Acompanhante Diamante", itemCombo: "-", vendidos: 108, estoque: 2955 },
    { id: "ips41", setor: "Gramado Sul", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 771, estoque: 2955 },
    { id: "ips42", setor: "Gramado Sul", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 620, estoque: 1300 },
    { id: "ips43", setor: "Gramado Sul", tipoIngresso: "Acompanhante", lote: "Acompanhante", itemCombo: "-", vendidos: 280, estoque: 2955 },
    { id: "ips44", setor: "Gramado Sul", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 95, estoque: 2955 },
    { id: "ips45", setor: "Gramado Sul", tipoIngresso: "Infantil", lote: "Infantil", itemCombo: "-", vendidos: 70, estoque: 2955 },
    { id: "ips46", setor: "Gramado Sul", tipoIngresso: "Ouro", lote: "Ouro", itemCombo: "-", vendidos: 60, estoque: 2955 },
    { id: "ips47", setor: "Gramado Sul", tipoIngresso: "Acompanhante Ouro", lote: "Acompanhante Ouro", itemCombo: "-", vendidos: 25, estoque: 2955 },
    { id: "ips48", setor: "Gramado Sul", tipoIngresso: "Juvenil", lote: "Juvenil", itemCombo: "-", vendidos: 20, estoque: 2955 },
    { id: "ips49", setor: "Gramado Sul", tipoIngresso: "PCR", lote: "PCR", itemCombo: "-", vendidos: 1, estoque: 12 },
    // Gramado Oeste
    { id: "ips50", setor: "Gramado Oeste", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 598, estoque: 1172 },
    { id: "ips51", setor: "Gramado Oeste", tipoIngresso: "Acompanhante", lote: "Acompanhante", itemCombo: "-", vendidos: 339, estoque: 2605 },
    { id: "ips52", setor: "Gramado Oeste", tipoIngresso: "Infantil", lote: "Infantil", itemCombo: "-", vendidos: 157, estoque: 2605 },
    { id: "ips53", setor: "Gramado Oeste", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 605, estoque: 2605 },
    { id: "ips54", setor: "Gramado Oeste", tipoIngresso: "Acompanhante Diamante", lote: "Acompanhante Diamante", itemCombo: "-", vendidos: 81, estoque: 2605 },
    { id: "ips55", setor: "Gramado Oeste", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 138, estoque: 2605 },
    { id: "ips56", setor: "Gramado Oeste", tipoIngresso: "Ouro", lote: "Ouro", itemCombo: "-", vendidos: 92, estoque: 2605 },
    { id: "ips57", setor: "Gramado Oeste", tipoIngresso: "Juvenil", lote: "Juvenil", itemCombo: "-", vendidos: 28, estoque: 2605 },
    { id: "ips58", setor: "Gramado Oeste", tipoIngresso: "Acompanhante Ouro", lote: "Acompanhante Ouro", itemCombo: "-", vendidos: 51, estoque: 2605 },
    { id: "ips59", setor: "Gramado Oeste", tipoIngresso: "Acompanhante.", lote: "Acompanhante.", itemCombo: "-", vendidos: 9, estoque: 2605 },
    { id: "ips60", setor: "Gramado Oeste", tipoIngresso: "Acompanhante..", lote: "Inteira", itemCombo: "-", vendidos: 1, estoque: 1 },
    // Gramado Leste
    { id: "ips61", setor: "Gramado Leste", tipoIngresso: "Acompanhante", lote: "Acompanhante", itemCombo: "-", vendidos: 172, estoque: 5319 },
    { id: "ips62", setor: "Gramado Leste", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 1552, estoque: 2131 },
    { id: "ips63", setor: "Gramado Leste", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 2401, estoque: 5319 },
    { id: "ips64", setor: "Gramado Leste", tipoIngresso: "Infantil", lote: "Infantil", itemCombo: "-", vendidos: 177, estoque: 5319 },
    { id: "ips65", setor: "Gramado Leste", tipoIngresso: "Ouro", lote: "Ouro", itemCombo: "-", vendidos: 251, estoque: 5319 },
    { id: "ips66", setor: "Gramado Leste", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 273, estoque: 5319 },
    { id: "ips67", setor: "Gramado Leste", tipoIngresso: "Acompanhante Diamante", lote: "Acompanhante Diamante", itemCombo: "-", vendidos: 183, estoque: 5319 },
    { id: "ips68", setor: "Gramado Leste", tipoIngresso: "Acompanhante Ouro", lote: "Acompanhante Ouro", itemCombo: "-", vendidos: 163, estoque: 5319 },
    { id: "ips69", setor: "Gramado Leste", tipoIngresso: "Juvenil", lote: "Juvenil", itemCombo: "-", vendidos: 43, estoque: 5319 },
    { id: "ips70", setor: "Gramado Leste", tipoIngresso: "PCR", lote: "PCR", itemCombo: "-", vendidos: 3, estoque: 24 },
    { id: "ips71", setor: "Gramado Leste", tipoIngresso: "Acompanhante.", lote: "Acompanhante.", itemCombo: "-", vendidos: 1, estoque: 5319 },
    // Gold Premium Sul – Bebidas não alcoólicas e comida à vontade
    { id: "ips72", setor: "Gold Premium Sul – Bebidas não alcoólicas e comida à vontade", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 321, estoque: 1559 },
    { id: "ips73", setor: "Gold Premium Sul – Bebidas não alcoólicas e comida à vontade", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 404, estoque: 702 },
    { id: "ips74", setor: "Gold Premium Sul – Bebidas não alcoólicas e comida à vontade", tipoIngresso: "Infantil", lote: "Infantil", itemCombo: "-", vendidos: 78, estoque: 1559 },
    { id: "ips75", setor: "Gold Premium Sul – Bebidas não alcoólicas e comida à vontade", tipoIngresso: "Inteira.", lote: "Inteira.", itemCombo: "-", vendidos: 271, estoque: 276 },
    { id: "ips76", setor: "Gold Premium Sul – Bebidas não alcoólicas e comida à vontade", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 66, estoque: 1559 },
    { id: "ips77", setor: "Gold Premium Sul – Bebidas não alcoólicas e comida à vontade", tipoIngresso: "Ouro", lote: "Ouro", itemCombo: "-", vendidos: 27, estoque: 1559 },
    { id: "ips78", setor: "Gold Premium Sul – Bebidas não alcoólicas e comida à vontade", tipoIngresso: "Juvenil", lote: "Juvenil", itemCombo: "-", vendidos: 12, estoque: 1559 },
    { id: "ips79", setor: "Gold Premium Sul – Bebidas não alcoólicas e comida à vontade", tipoIngresso: "PMR", lote: "PMR", itemCombo: "-", vendidos: 1, estoque: 16 },
    { id: "ips80", setor: "Gold Premium Sul – Bebidas não alcoólicas e comida à vontade", tipoIngresso: "PNE", lote: "PNE", itemCombo: "-", vendidos: 1, estoque: 77 },
    // Gold Oeste (blocos numerados, lote único)
    { id: "ips81", setor: "Gold Oeste", tipoIngresso: "Bloco - A08", lote: "Lote único", itemCombo: "-", vendidos: 1, estoque: 50 },
    { id: "ips82", setor: "Gold Oeste", tipoIngresso: "Bloco - A09", lote: "Lote único", itemCombo: "-", vendidos: 1, estoque: 50 },
    { id: "ips83", setor: "Gold Oeste", tipoIngresso: "Bloco - A10", lote: "Lote único", itemCombo: "-", vendidos: 1, estoque: 50 },
    { id: "ips84", setor: "Gold Oeste", tipoIngresso: "Bloco - A11", lote: "Lote único", itemCombo: "-", vendidos: 1, estoque: 50 },
    { id: "ips85", setor: "Gold Oeste", tipoIngresso: "Bloco - B07", lote: "Lote único", itemCombo: "-", vendidos: 1, estoque: 50 },
    { id: "ips86", setor: "Gold Oeste", tipoIngresso: "Bloco - B08", lote: "Lote único", itemCombo: "-", vendidos: 1, estoque: 50 },
    { id: "ips87", setor: "Gold Oeste", tipoIngresso: "Bloco - B09", lote: "Lote único", itemCombo: "-", vendidos: 1, estoque: 50 },
    { id: "ips88", setor: "Gold Oeste", tipoIngresso: "Bloco - B10", lote: "Lote único", itemCombo: "-", vendidos: 1, estoque: 50 },
    { id: "ips89", setor: "Gold Oeste", tipoIngresso: "Bloco - B11", lote: "Lote único", itemCombo: "-", vendidos: 1, estoque: 50 },
    { id: "ips90", setor: "Gold Oeste", tipoIngresso: "Bloco - B12", lote: "Lote único", itemCombo: "-", vendidos: 1, estoque: 50 },
    // Gold Norte (Meia-Entrada do print; demais tipos simulados)
    { id: "ips91", setor: "Gold Norte", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 186, estoque: 776 },
    { id: "ips92", setor: "Gold Norte", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 380, estoque: 1940 },
    { id: "ips93", setor: "Gold Norte", tipoIngresso: "Acompanhante", lote: "Acompanhante", itemCombo: "-", vendidos: 90, estoque: 1940 },
    { id: "ips94", setor: "Gold Norte", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 45, estoque: 1940 },
    { id: "ips95", setor: "Gold Norte", tipoIngresso: "Infantil", lote: "Infantil", itemCombo: "-", vendidos: 35, estoque: 1940 },
    { id: "ips96", setor: "Gold Norte", tipoIngresso: "Ouro", lote: "Ouro", itemCombo: "-", vendidos: 20, estoque: 1940 },
    { id: "ips97", setor: "Gold Norte", tipoIngresso: "Juvenil", lote: "Juvenil", itemCombo: "-", vendidos: 8, estoque: 1940 },
    { id: "ips98", setor: "Gold Norte", tipoIngresso: "Acompanhante Diamante", lote: "Acompanhante Diamante", itemCombo: "-", vendidos: 12, estoque: 1940 },
    // Gold Leste (sem print de tabela — simulado p/ ocupação ~97%)
    { id: "ips99", setor: "Gold Leste", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 560, estoque: 1200 },
    { id: "ips100", setor: "Gold Leste", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 380, estoque: 480 },
    { id: "ips101", setor: "Gold Leste", tipoIngresso: "Acompanhante", lote: "Acompanhante", itemCombo: "-", vendidos: 95, estoque: 1200 },
    { id: "ips102", setor: "Gold Leste", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 55, estoque: 1200 },
    { id: "ips103", setor: "Gold Leste", tipoIngresso: "Infantil", lote: "Infantil", itemCombo: "-", vendidos: 40, estoque: 1200 },
    { id: "ips104", setor: "Gold Leste", tipoIngresso: "Ouro", lote: "Ouro", itemCombo: "-", vendidos: 22, estoque: 1200 },
    { id: "ips105", setor: "Gold Leste", tipoIngresso: "Acompanhante Diamante", lote: "Acompanhante Diamante", itemCombo: "-", vendidos: 12, estoque: 1200 },
    // Camarote (sem print de tabela — simulado p/ ocupação ~100%)
    { id: "ips106", setor: "Camarote", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 210, estoque: 300 },
    { id: "ips107", setor: "Camarote", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 70, estoque: 120 },
    { id: "ips108", setor: "Camarote", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 20, estoque: 300 },
    // Arquibancada Norte (sem print de tabela — simulado p/ ocupação ~98%)
    { id: "ips109", setor: "Arquibancada Norte", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 1480, estoque: 3000 },
    { id: "ips110", setor: "Arquibancada Norte", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 980, estoque: 1200 },
    { id: "ips111", setor: "Arquibancada Norte", tipoIngresso: "Acompanhante", lote: "Acompanhante", itemCombo: "-", vendidos: 240, estoque: 3000 },
    { id: "ips112", setor: "Arquibancada Norte", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 120, estoque: 3000 },
    { id: "ips113", setor: "Arquibancada Norte", tipoIngresso: "Infantil", lote: "Infantil", itemCombo: "-", vendidos: 75, estoque: 3000 },
    { id: "ips114", setor: "Arquibancada Norte", tipoIngresso: "Ouro", lote: "Ouro", itemCombo: "-", vendidos: 30, estoque: 3000 },
    { id: "ips115", setor: "Arquibancada Norte", tipoIngresso: "Juvenil", lote: "Juvenil", itemCombo: "-", vendidos: 15, estoque: 3000 },
    // Adversário (Superior Visitante) (sem print de tabela — simulado p/ ocupação ~25%)
    { id: "ips116", setor: "Adversário (Superior Visitante)", tipoIngresso: "Inteira", lote: "Inteira", itemCombo: "-", vendidos: 1688, estoque: 11668 },
    { id: "ips117", setor: "Adversário (Superior Visitante)", tipoIngresso: "Meia-Entrada", lote: "Meia-Entrada", itemCombo: "-", vendidos: 980, estoque: 5246 },
    { id: "ips118", setor: "Adversário (Superior Visitante)", tipoIngresso: "Acompanhante", lote: "Acompanhante", itemCombo: "-", vendidos: 140, estoque: 11668 },
    { id: "ips119", setor: "Adversário (Superior Visitante)", tipoIngresso: "Infantil", lote: "Infantil", itemCombo: "-", vendidos: 65, estoque: 11668 },
    { id: "ips120", setor: "Adversário (Superior Visitante)", tipoIngresso: "Diamante", lote: "Diamante", itemCombo: "-", vendidos: 30, estoque: 11668 },
    { id: "ips121", setor: "Adversário (Superior Visitante)", tipoIngresso: "Juvenil", lote: "Juvenil", itemCombo: "-", vendidos: 14, estoque: 11668 },
];

/* Setores derivados das linhas acima: vendido = soma das linhas; estoque =
   capacidade do pool (máximo entre as linhas, pois o estoque é compartilhado). */
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
            s = { id: slug(r.setor), nome: r.setor, estoque: 0, vendido: 0, ingressos: [] };
            map.set(r.setor, s);
            order.push(r.setor);
        }
        s.vendido += r.vendidos;
        s.estoque = Math.max(s.estoque, r.estoque);
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
    { id: "pr1", nome: "Kit Oficial #BahxVit", quantidade: 123, valorUnitario: 199.9, gmv: 24587.7, gmvComDesconto: 24587.7 },
    { id: "pr2", nome: "Boneco Mascote - Fandom Box", quantidade: 47, valorUnitario: 107.35, gmv: 5045.3, gmvComDesconto: 5045.3 },
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

// Futebol vende apenas ingressos avulsos (sem combos nem produtos).
const mixReceita: MixReceitaItem[] = [
    { id: "ingressos", nome: "Ingresso Avulso", quantidade: 27121, gmv: 1634183.0, gmvComDesconto: 1634183.0, fill: "var(--color-utility-brand-700)" },
];

const VALOR_TOTAL_BASE = 1634183.0;
const TOTAL_ITENS_BASE = 27121;

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
            { key: "int", label: "Inteira", w: 0.46 },
            { key: "mei", label: "Meia-Entrada", w: 0.4 },
            { key: "dia", label: "Diamante", w: 0.06 },
            { key: "our", label: "Ouro", w: 0.04 },
            { key: "inf", label: "Infantil", w: 0.04 },
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
            { key: "sup-leste", label: "Superior Leste", w: 0.196 },
            { key: "gra-leste", label: "Gramado Leste", w: 0.192 },
            { key: "arq-norte", label: "Arquibancada Norte", w: 0.108 },
            { key: "adversario", label: "Adversário (Superior Visitante)", w: 0.108 },
            { key: "gra-oeste", label: "Gramado Oeste", w: 0.077 },
            { key: "gra-sul", label: "Gramado Sul", w: 0.076 },
            { key: "sup-oeste", label: "Superior Oeste", w: 0.052 },
            { key: "gold-prem-sul", label: "Gold Premium Sul", w: 0.044 },
            { key: "gold-leste", label: "Gold Leste", w: 0.043 },
            { key: "sup-norte", label: "Superior Norte", w: 0.04 },
            { key: "gold-norte", label: "Gold Norte", w: 0.029 },
            { key: "sup-sul", label: "Superior Sul", w: 0.025 },
            { key: "camarote", label: "Camarote", w: 0.011 },
        ];
        return seeds.map((s) => {
            const setorId = `${dateId}-${s.key}`;
            const setorValue = Math.round(base * s.w);
            return { id: setorId, key: s.key, label: s.label, value: setorValue, childrenLabel: "Tipo de ingresso", children: ingressosPorSetorNodes(setorValue, setorId) };
        });
    };
    // Jogo único: uma só "data" (a sessão da partida). Futebol vende apenas ingressos.
    const dates: { id: string; label: string; estoque: number; ocupacao: number }[] = [
        { id: EVENT.sessoes[0].id, label: EVENT.sessoes[0].label, estoque: 41576, ocupacao: 0.6523 },
    ];
    return dates.map((d) => {
        const ingressosVendidos = Math.round(d.estoque * d.ocupacao);
        const tiposDeItem: TreeNode[] = [
            { id: `${d.id}-ingressos`, key: "ingressos", label: "Ingressos", value: ingressosVendidos, childrenLabel: "Setor", children: setoresFor(d.id, ingressosVendidos) },
        ];
        const total = tiposDeItem.reduce((s, x) => s + x.value, 0);
        return { id: d.id, key: d.id, label: d.label, value: total, estoque: d.estoque, childrenLabel: "Tipo do item", children: tiposDeItem };
    });
};

const drillTree = buildDrillTree();

// Sem produtos no futebol — root vazio mantém o componente, mas o botão "Produtos" não renderiza.
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

// Jogo único: a sessão da partida concentra 100% das vendas.
const SESSAO_WEIGHT: Record<string, number> = { all: 1, [EVENT.sessoes[0].id]: 1 };

const scaleTree = (nodes: TreeNode[], f: number): TreeNode[] =>
    nodes.map((n) => ({ ...n, value: Math.round(n.value * f), children: n.children ? scaleTree(n.children, f) : undefined }));

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function VendasPorGrupo() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="vendas-por-grupo">
            <RelatorioFiltersProvider sessoes={EVENT.sessoes}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 md:px-6 pb-10">
                        <RelatorioPageHeader title="Vendas" />
                        <VendasBody />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const VendasBody = () => {
    const { dateRange, sessao } = useRelatorioFilters();

    const view = useMemo(() => {
        const sessionWeight = SESSAO_WEIGHT[sessao] ?? 1;
        const dateFraction = dateRangeFraction(dateRange);
        const vendaFactor = sessionWeight * dateFraction;
        const capFactor = sessionWeight;

        const setoresView: SetorRow[] = setores.map((s) => ({
            ...s,
            estoque: Math.round(s.estoque * capFactor),
            vendido: Math.round(s.vendido * vendaFactor),
            ingressos: s.ingressos?.map((i) => ({ ...i, estoque: Math.round(i.estoque * capFactor), vendido: Math.round(i.vendido * vendaFactor) })),
        }));

        const ingressosPorSetorView: IngressoPorSetorRow[] = ingressosPorSetor.map((r) => ({
            ...r,
            vendidos: Math.round(r.vendidos * vendaFactor),
            estoque: Math.round(r.estoque * capFactor),
        }));

        const mixView: MixReceitaItem[] = mixReceita.map((m) => ({
            ...m,
            quantidade: Math.round(m.quantidade * vendaFactor),
            gmv: m.gmv * vendaFactor,
            gmvComDesconto: m.gmvComDesconto * vendaFactor,
        }));

        const combosView: ComboRow[] = combos.map((c) => ({ ...c, quantidade: Math.round(c.quantidade * vendaFactor), gmv: c.gmv * vendaFactor, gmvComDesconto: c.gmvComDesconto * vendaFactor }));
        const produtosView: ProdutoRow[] = produtos.map((p) => ({ ...p, quantidade: Math.round(p.quantidade * dateFraction), gmv: p.gmv * dateFraction, gmvComDesconto: p.gmvComDesconto * dateFraction }));
        const cuponsView: CupomRow[] = cupons.map((c) => ({
            ...c,
            quantidade: Math.round(c.quantidade * vendaFactor),
            valor: c.valor * vendaFactor,
            valorDesconto: c.valorDesconto * vendaFactor,
            valorTotal: c.valorTotal * vendaFactor,
            lotes: c.lotes.map((l) => ({ ...l, quantidade: Math.round(l.quantidade * vendaFactor), valor: l.valor * vendaFactor, valorDesconto: l.valorDesconto * vendaFactor, valorTotal: l.valorTotal * vendaFactor })),
        }));

        // Drill: filtra colunas pela sessão e escala os valores pelo intervalo de data.
        const drillFiltered = sessao === "all" ? drillTree : drillTree.filter((n) => n.id === sessao);
        const drillView = scaleTree(drillFiltered, dateFraction);
        const produtosRootView: TreeNode = { ...produtosRootNode, ...scaleTree([produtosRootNode], dateFraction)[0] };

        const valorTotal = VALOR_TOTAL_BASE * vendaFactor;
        const totalItens = Math.round(TOTAL_ITENS_BASE * vendaFactor);

        return { setoresView, ingressosPorSetorView, mixView, combosView, produtosView, cuponsView, drillView, produtosRootView, valorTotal, totalItens };
    }, [dateRange, sessao]);

    return (
        <>
            <MetricsRow valorTotal={view.valorTotal} totalItens={view.totalItens} setores={view.setoresView} />
            <MixReceitaCard items={view.mixView} />
            <DrillDownGmvCard tree={view.drillView} produtosRoot={view.produtosRootView} />
            <OcupacaoPorSetorCard setores={view.setoresView} />
            <QuantidadeIngressosPorSetorCard rows={view.ingressosPorSetorView} />
            <IngressosComCupomCard cupons={view.cuponsView} />
        </>
    );
};

/* ------------------------------------------------------------------ */
/*  Metrics row                                                       */
/* ------------------------------------------------------------------ */

const MetricsRow = ({ valorTotal, totalItens, setores: setoresView }: { valorTotal: number; totalItens: number; setores: SetorRow[] }) => {
    const ticketMedio = totalItens === 0 ? 0 : valorTotal / totalItens;
    const totalEstoque = setoresView.reduce((s, x) => s + x.estoque, 0);
    const totalVendido = setoresView.reduce((s, x) => s + x.vendido, 0);
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricsIcon03 icon={CurrencyDollarCircle} title={currencyFormatter.format(valorTotal)} subtitle="Valor total" change={null} changeTrend="positive" actions={false} className="flex-1 md:min-w-[320px] [&_p+div]:hidden" />
            <MetricsIcon03 icon={Receipt} title={currencyFormatter.format(ticketMedio)} subtitle="Ticket médio" change={null} changeTrend="positive" actions={false} className="flex-1 md:min-w-[320px] [&_p+div]:hidden" />
            <OcupacaoMetric totalEstoque={totalEstoque} totalVendido={totalVendido} />
        </div>
    );
};

const OcupacaoMetric = ({ totalEstoque, totalVendido }: { totalEstoque: number; totalVendido: number }) => (
    <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset">
        <div className="flex h-full items-center gap-8 px-4 py-5 md:px-5">
            <div className="relative flex flex-col gap-2 shrink-0 items-center justify-center">
                <ProgressBarHalfCircle size="xs" min={0} label="Lotação" max={totalEstoque || 1} value={totalVendido} valueFormatter={(_value: number, pct: number) => `${pct}%`} />
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
                                    <span className="text-xs text-tertiary">{item.value}% do total</span>
                                </div>
                            </div>
                            <div className="flex grid-cols-3 gap-4 md:flex md:gap-8">
                                <MixStat className="md:w-20" label="Quantidade" value={numberFormatter.format(item.quantidade)} />
                                <MixStat className="md:w-36" label="Valor total bruto" value={currencyFormatter.format(item.gmv)} />
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
        <span className="text-xs text-tertiary">{label}</span>
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
                                                <span className="text-xs font-semibold text-tertiary uppercase tracking-wide">{headerLabel}</span>
                                                {parentLabel && <span className="truncate text-xs text-tertiary">{parentLabel}</span>}
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
                                                                <span className={cx("truncate text-xs text-primary", isSelected ? "font-semibold" : "font-medium")}>{node.label}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-quaternary">
                                                                        <div className={cx("h-full rounded-full", isSelected ? "bg-fg-brand-primary" : "bg-utility-brand-400")} style={{ width: `${pct}%` }} />
                                                                    </div>
                                                                    <span className="shrink-0 text-xs font-medium text-primary tabular-nums">{pct.toFixed(1)}%</span>
                                                                </div>
                                                                <span className="text-xs text-tertiary tabular-nums">
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
                                                <span className="pb-2 text-xs font-semibold text-tertiary uppercase tracking-wide">Produto</span>
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
                                                            <span className={cx("truncate text-xs text-primary", isSelected ? "font-semibold" : "font-medium")}>Produtos</span>
                                                            <span className="text-xs text-tertiary">{produtosRoot.children?.length ?? 0} itens</span>
                                                            <span className="text-xs text-tertiary tabular-nums">{numberFormatter.format(produtosRoot.value)} unidades</span>
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
                                    <p className="text-xs text-tertiary">Escolha uma sessão para ver o detalhamento por tipo, setor, ingresso, lote e tipo.</p>
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
                            <p className="max-w-[260px] text-xs text-tertiary">Escolha uma sessão para ver o detalhamento por tipo, setor, ingresso, lote e tipo.</p>
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

const OcupacaoPorSetorCard = ({ setores: setoresView }: { setores: SetorRow[] }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set(["superior-leste"]));

    const toggleExpanded = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const accessors = useMemo(
        () => ({ nome: (s: SetorRow) => s.nome, estoque: (s: SetorRow) => s.estoque, vendido: (s: SetorRow) => s.vendido, ocupacao: (s: SetorRow) => (s.estoque === 0 ? 0 : s.vendido / s.estoque) }),
        [],
    );
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(setoresView as unknown as Record<string, unknown>[], accessors as Partial<Record<string, (r: Record<string, unknown>) => string | number>>, { key: "vendido", dir: "desc" });
    const sortedSetores = sorted as unknown as SetorRow[];

    return (
        <Card title="Ocupação por setor">
            <table className="w-full table-fixed border-collapse">
                <colgroup>
                    <col className="w-10 md:w-12" />
                    <col className="w-[38%] md:w-auto" />
                    <col className="hidden md:table-column" />
                    <col className="hidden md:table-column" />
                    <col />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="px-2 py-3 md:px-4" aria-hidden="true" />
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Setor" sortKey="nome" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">
                            <SortableHeader label="Estoque" align="right" sortKey="estoque" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">
                            <SortableHeader label="Vendido" align="right" sortKey="vendido" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Taxa de ocupação" sortKey="ocupacao" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedSetores.map((setor, i) => {
                        const isExpanded = expanded.has(setor.id);
                        const hasIngressos = !!setor.ingressos?.length;
                        const isLast = i === sortedSetores.length - 1;
                        return (
                            <Fragment key={setor.id}>
                                <tr
                                    role={hasIngressos ? "button" : undefined}
                                    tabIndex={hasIngressos ? 0 : undefined}
                                    aria-expanded={hasIngressos ? isExpanded : undefined}
                                    onClick={hasIngressos ? () => toggleExpanded(setor.id) : undefined}
                                    onKeyDown={
                                        hasIngressos
                                            ? (e) => {
                                                  if (e.key === "Enter" || e.key === " ") {
                                                      e.preventDefault();
                                                      toggleExpanded(setor.id);
                                                  }
                                              }
                                            : undefined
                                    }
                                    className={cx("transition duration-100 ease-linear", hasIngressos && "cursor-pointer hover:bg-primary_hover", !isLast && !isExpanded && "border-b border-secondary", isExpanded && "border-b border-secondary")}
                                >
                                    <td className="px-2 py-4 md:px-4">{hasIngressos && <ChevronDown aria-hidden="true" className={cx("size-4 text-fg-quaternary transition-transform duration-150", isExpanded && "rotate-180")} />}</td>
                                    <td className="px-4 py-4 text-sm text-primary">
                                        <span className="line-clamp-2">{setor.nome}</span>
                                    </td>
                                    <td className="hidden px-4 py-4 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(setor.estoque)}</td>
                                    <td className="hidden px-4 py-4 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(setor.vendido)}</td>
                                    <td className="px-4 py-4">
                                        <OccupancyBar value={setor.vendido} total={setor.estoque} />
                                    </td>
                                </tr>
                                {isExpanded &&
                                    setor.ingressos?.map((ingresso, j, arr) => {
                                        const isLastIngresso = j === arr.length - 1;
                                        const previousSum = arr.slice(0, j).reduce((sum, prev) => sum + prev.vendido, 0);
                                        const offsetPct = setor.estoque === 0 ? 0 : (previousSum / setor.estoque) * 100;
                                        const widthPct = setor.estoque === 0 ? 0 : (ingresso.vendido / setor.estoque) * 100;
                                        const filledPct = setor.estoque === 0 ? 0 : (setor.vendido / setor.estoque) * 100;
                                        const labelPct = setor.vendido === 0 ? 0 : (ingresso.vendido / setor.vendido) * 100;
                                        const boundaries = arr.slice(0, -1).map((_, idx) => {
                                            const sum = arr.slice(0, idx + 1).reduce((s, x) => s + x.vendido, 0);
                                            return setor.estoque === 0 ? 0 : (sum / setor.estoque) * 100;
                                        });
                                        return (
                                            <tr key={ingresso.id} className={cx("bg-secondary", isLastIngresso && !isLast && "border-b border-secondary")}>
                                                <td className="px-2 py-3 md:px-4" />
                                                <td className="px-4 py-3 pl-10 text-sm text-secondary">
                                                    <span className="line-clamp-2">{ingresso.nome}</span>
                                                </td>
                                                <td className="hidden px-4 py-3 md:table-cell" />
                                                <td className="hidden px-4 py-3 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(ingresso.vendido)}</td>
                                                <td className="px-4 py-3">
                                                    <SegmentedOccupancyBar offsetPct={offsetPct} widthPct={widthPct} filledPct={filledPct} labelPct={labelPct} boundaries={boundaries} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
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

const SegmentedOccupancyBar = ({ offsetPct, widthPct, filledPct, labelPct, boundaries = [] }: { offsetPct: number; widthPct: number; filledPct: number; labelPct?: number; boundaries?: number[] }) => {
    const clampedOffset = Math.min(100, Math.max(0, offsetPct));
    const clampedWidth = Math.min(100 - clampedOffset, Math.max(0, widthPct));
    const clampedFilled = Math.min(100, Math.max(0, filledPct));
    const display = Math.round(labelPct ?? widthPct);
    void boundaries;
    return (
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <div className="relative h-2 min-w-0 flex-1 overflow-visible rounded-full bg-tertiary/90">
                <div className="absolute h-full rounded-full bg-quaternary transition-all" style={{ left: 0, width: `${clampedFilled}%` }} />
                <div className="absolute h-full rounded-full bg-brand-solid transition-all" style={{ left: `${clampedOffset}%`, width: `${clampedWidth}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right text-sm text-tertiary">{display}%</span>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Quantidade de ingressos por setor (tickets avulsos)               */
/* ------------------------------------------------------------------ */

interface GrupoSetor {
    setor: string;
    rows: IngressoPorSetorRow[];
    vendidos: number;
    estoque: number;
}

const QuantidadeIngressosPorSetorCard = ({ rows }: { rows: IngressoPorSetorRow[] }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const grupos = useMemo(() => {
        const map = new Map<string, GrupoSetor>();
        rows.forEach((row) => {
            const g = map.get(row.setor) ?? { setor: row.setor, rows: [], vendidos: 0, estoque: 0 };
            g.rows.push(row);
            g.vendidos += row.vendidos;
            // Estoque é o pool compartilhado do setor (repetido por linha), não a soma.
            g.estoque = Math.max(g.estoque, row.estoque);
            map.set(row.setor, g);
        });
        return Array.from(map.values());
    }, [rows]);

    const accessors = useMemo(
        () => ({ setor: (g: GrupoSetor) => g.setor, vendidos: (g: GrupoSetor) => g.vendidos, estoque: (g: GrupoSetor) => g.estoque }),
        [],
    );
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(grupos as unknown as Record<string, unknown>[], accessors as Partial<Record<string, (r: Record<string, unknown>) => string | number>>, { key: "vendidos", dir: "desc" });
    const sortedGrupos = sorted as unknown as GrupoSetor[];

    const totalVendidos = grupos.reduce((s, g) => s + g.vendidos, 0);
    const totalEstoque = grupos.reduce((s, g) => s + g.estoque, 0);

    const toggle = (setor: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(setor)) next.delete(setor);
            else next.add(setor);
            return next;
        });

    return (
        <Card title="Quantidade de Ingresso por Setor">
            <table className="w-full table-fixed border-collapse">
                <colgroup>
                    <col className="w-10 md:w-12" />
                    <col className="w-[42%] md:w-auto" />
                    <col className="hidden md:table-column" />
                    <col className="hidden md:table-column" />
                    <col />
                    <col />
                    <col className="hidden lg:table-column" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="px-2 py-3 md:px-4" aria-hidden="true" />
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Setor" sortKey="setor" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary md:table-cell">Lote</th>
                        <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary md:table-cell">Item Combo</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Vendidos" align="right" sortKey="vendidos" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Estoque" align="right" sortKey="estoque" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary lg:table-cell">Ocupação</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedGrupos.map((grupo) => {
                        const isExpanded = expanded.has(grupo.setor);
                        return (
                            <Fragment key={grupo.setor}>
                                <tr
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={isExpanded}
                                    onClick={() => toggle(grupo.setor)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            toggle(grupo.setor);
                                        }
                                    }}
                                    className="cursor-pointer border-b border-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                                >
                                    <td className="px-2 py-4 md:px-4">
                                        <ChevronDown aria-hidden="true" className={cx("size-4 text-fg-quaternary transition-transform duration-150", isExpanded && "rotate-180")} />
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium text-primary">
                                        <span className="line-clamp-2">{grupo.setor}</span>
                                    </td>
                                    <td className="hidden px-4 py-4 md:table-cell" />
                                    <td className="hidden px-4 py-4 md:table-cell" />
                                    <td className="px-4 py-4 text-right text-sm font-medium text-primary">{numberFormatter.format(grupo.vendidos)}</td>
                                    <td className="px-4 py-4 text-right text-sm text-tertiary">{numberFormatter.format(grupo.estoque)}</td>
                                    <td className="hidden px-4 py-4 lg:table-cell">
                                        <OccupancyBar value={grupo.vendidos} total={grupo.estoque} />
                                    </td>
                                </tr>
                                {isExpanded &&
                                    grupo.rows.map((row) => (
                                        <tr key={row.id} className="border-b border-secondary bg-secondary">
                                            <td className="px-2 py-3 md:px-4" />
                                            <td className="px-4 py-3 pl-10 text-sm text-secondary">
                                                <span className="line-clamp-2">{row.tipoIngresso}</span>
                                            </td>
                                            <td className="hidden px-4 py-3 text-sm text-tertiary md:table-cell">{row.lote}</td>
                                            <td className="hidden px-4 py-3 text-sm text-tertiary md:table-cell">{row.itemCombo}</td>
                                            <td className="px-4 py-3 text-right text-sm text-tertiary">{numberFormatter.format(row.vendidos)}</td>
                                            <td className="px-4 py-3 text-right text-sm text-tertiary">{numberFormatter.format(row.estoque)}</td>
                                            <td className="hidden px-4 py-3 lg:table-cell">
                                                <OccupancyBar value={row.vendidos} total={row.estoque} />
                                            </td>
                                        </tr>
                                    ))}
                            </Fragment>
                        );
                    })}
                    <tr className="bg-secondary font-semibold">
                        <td className="px-2 py-3 md:px-4" />
                        <td className="px-4 py-3 text-sm text-primary">Total</td>
                        <td className="hidden px-4 py-3 md:table-cell" />
                        <td className="hidden px-4 py-3 md:table-cell" />
                        <td className="px-4 py-3 text-right text-sm text-primary">{numberFormatter.format(totalVendidos)}</td>
                        <td className="px-4 py-3 text-right text-sm text-primary">{numberFormatter.format(totalEstoque)}</td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                            <OccupancyBar value={totalVendidos} total={totalEstoque} />
                        </td>
                    </tr>
                </tbody>
            </table>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Combo                                                             */
/* ------------------------------------------------------------------ */

const ComboCard = ({ rows }: { rows: ComboRow[] }) => {
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(rows as unknown as Record<string, unknown>[], undefined, { key: "gmv", dir: "desc" });
    const sortedRows = sorted as unknown as ComboRow[];
    return (
        <Card title="Combo">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary"><SortableHeader label="Item Combo" sortKey="nome" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Quantidade" align="right" sortKey="quantidade" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor Unitário" align="right" sortKey="valorUnitario" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor total bruto" align="right" sortKey="gmv" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor total c/ desconto" align="right" sortKey="gmvComDesconto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((row, i) => (
                            <tr key={row.id} className={cx("transition duration-100 ease-linear hover:bg-primary_hover", i !== sortedRows.length - 1 && "border-b border-secondary")}>
                                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">{row.nome}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{numberFormatter.format(row.quantidade)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valorUnitario)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.gmv)}</td>
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
/*  Produtos                                                          */
/* ------------------------------------------------------------------ */

const ProdutosCard = ({ rows }: { rows: ProdutoRow[] }) => {
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(rows as unknown as Record<string, unknown>[], undefined, { key: "gmv", dir: "desc" });
    const sortedRows = sorted as unknown as ProdutoRow[];
    return (
        <Card title="Produtos">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary"><SortableHeader label="Produto" sortKey="nome" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Qtd" align="right" sortKey="quantidade" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor Unitário" align="right" sortKey="valorUnitario" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor total bruto" align="right" sortKey="gmv" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor total c/ desconto" align="right" sortKey="gmvComDesconto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((row, i) => (
                            <tr key={row.id} className={cx("transition duration-100 ease-linear hover:bg-primary_hover", i !== sortedRows.length - 1 && "border-b border-secondary")}>
                                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">{row.nome}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{numberFormatter.format(row.quantidade)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valorUnitario)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.gmv)}</td>
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
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const accessors = useMemo(
        () => ({ cupom: (c: CupomRow) => c.cupom, quantidade: (c: CupomRow) => c.quantidade, valor: (c: CupomRow) => c.valor, valorDesconto: (c: CupomRow) => c.valorDesconto, valorTotal: (c: CupomRow) => c.valorTotal }),
        [],
    );
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(cuponsView as unknown as Record<string, unknown>[], accessors as Partial<Record<string, (r: Record<string, unknown>) => string | number>>, { key: "quantidade", dir: "desc" });
    const sortedCupons = sorted as unknown as CupomRow[];

    const toggle = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    return (
        <Card title="Quantidade de ingressos com cupom">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            <th className="w-10 px-2 py-3 md:px-4" aria-hidden="true" />
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary"><SortableHeader label="Cupom" sortKey="cupom" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Quantidade" align="right" sortKey="quantidade" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor" align="right" sortKey="valor" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor do Desconto" align="right" sortKey="valorDesconto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor Total" align="right" sortKey="valorTotal" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCupons.map((row, i) => {
                            const isExpanded = expanded.has(row.id);
                            const isLast = i === sortedCupons.length - 1;
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
                                        className={cx("cursor-pointer transition duration-100 ease-linear hover:bg-primary_hover", (!isLast || isExpanded) && "border-b border-secondary")}
                                    >
                                        <td className="px-2 py-4 md:px-4">
                                            <ChevronDown aria-hidden="true" className={cx("size-4 text-fg-quaternary transition-transform duration-150", isExpanded && "rotate-180")} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">{row.cupom}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{numberFormatter.format(row.quantidade)}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valor)}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valorDesconto)}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valorTotal)}</td>
                                    </tr>
                                    {isExpanded &&
                                        row.lotes.map((lote, j) => (
                                            <tr key={lote.id} className={cx("bg-secondary", (!isLast || j !== row.lotes.length - 1) && "border-b border-secondary")}>
                                                <td className="px-2 py-3 md:px-4" />
                                                <td className="whitespace-nowrap px-4 py-3 pl-10 text-sm text-secondary">{lote.lote}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{numberFormatter.format(lote.quantidade)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{currencyFormatter.format(lote.valor)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{currencyFormatter.format(lote.valorDesconto)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{currencyFormatter.format(lote.valorTotal)}</td>
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
