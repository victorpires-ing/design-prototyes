import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, CurrencyDollarCircle, CursorClick02, Receipt } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ProgressBarHalfCircle } from "@/components/base/progress-indicators/progress-circles";
import { MetricsSimple } from "@/components/application/metrics/metrics";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";

/* ------------------------------------------------------------------ */
/*  Formatters                                                        */
/* ------------------------------------------------------------------ */

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});
const numberFormatter = new Intl.NumberFormat("pt-BR");

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
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

interface CupomRow {
    id: string;
    cupom: string;
    quantidade: number;
    valor: number;
    valorDesconto: number;
    valorTotal: number;
}

const setores: SetorRow[] = [
    {
        id: "vip",
        nome: "VIP",
        estoque: 2000,
        vendido: 1800,
        ingressos: [
            { id: "vip-1l-int", nome: "VIP - 1º Lote (Inteira)", estoque: 800, vendido: 800 },
            { id: "vip-1l-mei", nome: "VIP - 1º Lote (Meia)", estoque: 400, vendido: 400 },
            { id: "vip-2l-int", nome: "VIP - 2º Lote (Inteira)", estoque: 500, vendido: 380 },
            { id: "vip-2l-mei", nome: "VIP - 2º Lote (Meia)", estoque: 300, vendido: 220 },
        ],
    },
    {
        id: "camarote",
        nome: "Camarote Premium",
        estoque: 1500,
        vendido: 1200,
        ingressos: [
            { id: "cam-1l-int", nome: "Camarote - 1º Lote (Inteira)", estoque: 500, vendido: 500 },
            { id: "cam-1l-mei", nome: "Camarote - 1º Lote (Meia)", estoque: 300, vendido: 300 },
            { id: "cam-2l-int", nome: "Camarote - 2º Lote (Inteira)", estoque: 400, vendido: 250 },
            { id: "cam-2l-mei", nome: "Camarote - 2º Lote (Meia)", estoque: 300, vendido: 150 },
        ],
    },
    {
        id: "pista-premium",
        nome: "Pista Premium",
        estoque: 8000,
        vendido: 6400,
        ingressos: [
            { id: "pp-1l-int", nome: "Pista Premium - 1º Lote (Inteira)", estoque: 3000, vendido: 3000 },
            { id: "pp-1l-mei", nome: "Pista Premium - 1º Lote (Meia)", estoque: 1500, vendido: 1500 },
            { id: "pp-2l-int", nome: "Pista Premium - 2º Lote (Inteira)", estoque: 2500, vendido: 1400 },
            { id: "pp-2l-mei", nome: "Pista Premium - 2º Lote (Meia)", estoque: 1000, vendido: 500 },
        ],
    },
    {
        id: "pista",
        nome: "Pista",
        estoque: 20000,
        vendido: 18000,
        ingressos: [
            { id: "p-1l-int", nome: "Pista - 1º Lote (Inteira)", estoque: 5000, vendido: 5000 },
            { id: "p-1l-mei", nome: "Pista - 1º Lote (Meia)", estoque: 4000, vendido: 4000 },
            { id: "p-2l-int", nome: "Pista - 2º Lote (Inteira)", estoque: 6000, vendido: 5500 },
            { id: "p-2l-mei", nome: "Pista - 2º Lote (Meia)", estoque: 3000, vendido: 2500 },
            { id: "p-3l-int", nome: "Pista - 3º Lote (Inteira)", estoque: 2000, vendido: 1000 },
        ],
    },
    {
        id: "mezanino",
        nome: "Mezanino",
        estoque: 5807,
        vendido: 2400,
        ingressos: [
            { id: "mez-1l-int", nome: "Mezanino - 1º Lote (Inteira)", estoque: 2000, vendido: 1500 },
            { id: "mez-1l-mei", nome: "Mezanino - 1º Lote (Meia)", estoque: 1500, vendido: 600 },
            { id: "mez-2l-int", nome: "Mezanino - 2º Lote (Inteira)", estoque: 1500, vendido: 200 },
            { id: "mez-2l-mei", nome: "Mezanino - 2º Lote (Meia)", estoque: 807, vendido: 100 },
        ],
    },
];

const ingressosPorSetor: IngressoPorSetorRow[] = [
    { id: "ips1", setor: "VIP", tipoIngresso: "Inteira", lote: "1º Lote", itemCombo: "Combo Camarote + Open Bar", vendidos: 800, estoque: 800 },
    { id: "ips2", setor: "VIP", tipoIngresso: "Meia", lote: "1º Lote", itemCombo: "—", vendidos: 400, estoque: 400 },
    { id: "ips3", setor: "VIP", tipoIngresso: "Inteira", lote: "2º Lote", itemCombo: "—", vendidos: 380, estoque: 500 },
    { id: "ips4", setor: "VIP", tipoIngresso: "Meia", lote: "2º Lote", itemCombo: "—", vendidos: 220, estoque: 300 },
    { id: "ips5", setor: "Camarote Premium", tipoIngresso: "Inteira", lote: "1º Lote", itemCombo: "Combo Camarote + Open Bar", vendidos: 500, estoque: 500 },
    { id: "ips6", setor: "Camarote Premium", tipoIngresso: "Meia", lote: "1º Lote", itemCombo: "—", vendidos: 300, estoque: 300 },
    { id: "ips7", setor: "Camarote Premium", tipoIngresso: "Inteira", lote: "2º Lote", itemCombo: "—", vendidos: 250, estoque: 400 },
    { id: "ips8", setor: "Pista Premium", tipoIngresso: "Inteira", lote: "1º Lote", itemCombo: "—", vendidos: 3000, estoque: 3000 },
    { id: "ips9", setor: "Pista Premium", tipoIngresso: "Meia", lote: "1º Lote", itemCombo: "—", vendidos: 1500, estoque: 1500 },
    { id: "ips10", setor: "Pista Premium", tipoIngresso: "Inteira", lote: "2º Lote", itemCombo: "—", vendidos: 1400, estoque: 2500 },
    { id: "ips11", setor: "Pista", tipoIngresso: "Inteira", lote: "1º Lote", itemCombo: "—", vendidos: 5000, estoque: 5000 },
    { id: "ips12", setor: "Pista", tipoIngresso: "Meia | Caravanas", lote: "2º Lote", itemCombo: "—", vendidos: 2500, estoque: 3000 },
    { id: "ips13", setor: "Mezanino", tipoIngresso: "Inteira", lote: "1º Lote", itemCombo: "—", vendidos: 1500, estoque: 2000 },
];

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
    { id: "pr1", nome: "Kit Oficial #SantaSanta26", quantidade: 123, valorUnitario: 199.9, gmv: 24587.7, gmvComDesconto: 24587.7 },
    { id: "pr2", nome: "Boneco Bot_Gs - Fandom Box", quantidade: 47, valorUnitario: 107.35, gmv: 5045.3, gmvComDesconto: 5045.3 },
    { id: "pr3", nome: "Sacochila Oficial", quantidade: 126, valorUnitario: 29.9, gmv: 3767.4, gmvComDesconto: 3767.4 },
    { id: "pr4", nome: "Camisa Oficial - M", quantidade: 36, valorUnitario: 99.9, gmv: 3596.4, gmvComDesconto: 3596.4 },
    { id: "pr5", nome: "Camisa Oficial - G", quantidade: 29, valorUnitario: 99.9, gmv: 2897.1, gmvComDesconto: 2897.1 },
    { id: "pr6", nome: "Camisa Oficial - P", quantidade: 23, valorUnitario: 99.9, gmv: 2297.7, gmvComDesconto: 2297.7 },
    { id: "pr7", nome: "Copo Oficial", quantidade: 100, valorUnitario: 19.89, gmv: 1989, gmvComDesconto: 1989 },
    { id: "pr8", nome: "Camisa Oficial - GG", quantidade: 14, valorUnitario: 99.9, gmv: 1398.6, gmvComDesconto: 1398.6 },
];

const cupons: CupomRow[] = [
    { id: "cu1", cupom: "FAN15", quantidade: 142, valor: 19738.0, valorDesconto: 2960.7, valorTotal: 16777.3 },
    { id: "cu2", cupom: "VIPACCESS", quantidade: 38, valor: 13680.0, valorDesconto: 1368.0, valorTotal: 12312.0 },
    { id: "cu3", cupom: "PREMIERE10", quantidade: 24, valor: 7332.0, valorDesconto: 733.2, valorTotal: 6598.8 },
    { id: "cu4", cupom: "TESTE2", quantidade: 1, valor: 139.0, valorDesconto: 137.61, valorTotal: 1.39 },
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function VendasPorGrupo() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="vendas-por-grupo">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 md:px-6 pb-10">
                    <RelatorioPageHeader title="Vendas" />

                    <MetricsRow />
                    <MixReceitaCard />
                    <DrillDownGmvCard />
                    <OcupacaoPorSetorCard />
                    <QuantidadeIngressosPorSetorCard />
                    <ComboCard />
                    <ProdutosCard />
                    <IngressosComCupomCard />
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Metrics row                                                       */
/* ------------------------------------------------------------------ */

const HIDE_TREND_AND_MENU =
    "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

const VALOR_TOTAL = 2888877.13;
const TOTAL_ITENS = 37307;
const TICKET_MEDIO = VALOR_TOTAL / TOTAL_ITENS;

const TOTAL_ESTOQUE = setores.reduce((s, x) => s + x.estoque, 0);
const TOTAL_VENDIDO = setores.reduce((s, x) => s + x.vendido, 0);

const MetricsRow = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricsIcon03
            icon={CurrencyDollarCircle}
            title={currencyFormatter.format(VALOR_TOTAL)}
            subtitle="Valor total"
            change={null}
            changeTrend="positive"
            actions={false}
            className="flex-1 md:min-w-[320px] [&_p+div]:hidden"
        />
        <MetricsIcon03
            icon={Receipt}
            title={currencyFormatter.format(TICKET_MEDIO)}
            subtitle="Ticket médio"
            change={null}
            changeTrend="positive"
            actions={false}
            className="flex-1 md:min-w-[320px] [&_p+div]:hidden"
        />
        <OcupacaoMetric />
    </div>
);

const OcupacaoMetric = () => (
    <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset">
        <div className="flex h-full items-center gap-8 px-4 py-5 md:px-5">
            <div className="relative flex flex-col gap-2 shrink-0 items-center justify-center">
                <ProgressBarHalfCircle
                    size="xs"
                    min={0}
                    label="Ocupação"
                    max={TOTAL_ESTOQUE}
                    value={TOTAL_VENDIDO}
                    valueFormatter={(_value: number, pct: number) => `${pct}%`}
                />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-lg font-semibold text-primary leading-tight">
                    {numberFormatter.format(TOTAL_VENDIDO)}
                    <span className="font-normal text-tertiary">
                        {" "}
                        de {numberFormatter.format(TOTAL_ESTOQUE)}
                    </span>
                </p>
            </div>
        </div>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Card shell                                                        */
/* ------------------------------------------------------------------ */

interface CardProps {
    title: string;
    children: React.ReactNode;
    headerRight?: React.ReactNode;
}

const Card = ({ title, children, headerRight }: CardProps) => (
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

interface MixReceitaItem {
    id: string;
    nome: string;
    quantidade: number;
    gmv: number;
    gmvComDesconto: number;
    fill: string;
}

const mixReceita: MixReceitaItem[] = [
    {
        id: "ingressos",
        nome: "Ingressos",
        quantidade: 33500,
        gmv: 2612500.0,
        gmvComDesconto: 2479350.0,
        fill: "var(--color-utility-brand-700)",
    },
    {
        id: "combos",
        nome: "Combos",
        quantidade: 3807,
        gmv: 1100000.0,
        gmvComDesconto: 1043726.0,
        fill: "var(--color-utility-brand-500)",
    },
    {
        id: "produtos",
        nome: "Produtos",
        quantidade: 498,
        gmv: 48578.9,
        gmvComDesconto: 45579.2,
        fill: "var(--color-utility-brand-300)",
    },
];

const MixReceitaCard = () => {
    const totalGmvDesc = mixReceita.reduce((s, x) => s + x.gmvComDesconto, 0);
    const radialData = mixReceita.map((item) => ({
        ...item,
        value: Math.round((item.gmvComDesconto / totalGmvDesc) * 100),
    }));

    return (
        <Card title="Mix de receita">
            <div className="flex flex-col gap-6 px-4 py-5 md:flex-row md:items-center md:gap-8 md:px-5">
                <div className="flex shrink-0 flex-col items-center gap-2">
                    <div className="size-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={radialData}
                                    dataKey="gmvComDesconto"
                                    innerRadius="65%"
                                    outerRadius="100%"
                                    paddingAngle={2}
                                    startAngle={90}
                                    endAngle={-270}
                                    stroke="none"
                                    isAnimationActive={false}
                                >
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
                        <li
                            key={item.id}
                            className="flex flex-col gap-3 teste py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:gap-4"
                        >
                            <div className="flex min-w-0 items-center gap-3 md:flex-1">
                                <span
                                    className="size-3 shrink-0 rounded-full"
                                    style={{ backgroundColor: item.fill }}
                                />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-sm font-semibold text-primary">
                                        {item.nome}
                                    </span>
                                    <span className="text-xs text-tertiary">
                                        {item.value}% do total
                                    </span>
                                </div>
                            </div>
                            <div className="flex grid-cols-3 gap-4 md:flex md:gap-8">
                                <MixStat
                                    className="md:w-20"
                                    label="Quantidade"
                                    value={numberFormatter.format(item.quantidade)}
                                />
                                <MixStat
                                    className="md:w-36"
                                    label="Valor total bruto"
                                    value={currencyFormatter.format(item.gmv)}
                                />
                                <MixStat
                                    className="md:w-36"
                                    label="Valor total c/ desconto"
                                    value={currencyFormatter.format(item.gmvComDesconto)}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
};

const MixStat = ({
    label,
    value,
    className,
}: {
    label: string;
    value: string;
    className?: string;
}) => (
    <div className={cx("flex flex-col gap-0.5", className)}>
        <span className="text-xs text-tertiary">{label}</span>
        <span className="text-sm font-medium text-primary tabular-nums">
            {value}
        </span>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Drill-down GMV (data → setor → ingresso → lote → tipo)            */
/* ------------------------------------------------------------------ */

interface TreeNode {
    id: string;
    /** Stable key — same across dates so we can aggregate when many dates are selected. */
    key: string;
    label: string;
    /** Quantity sold (used for sums and proportional %). */
    value: number;
    /** Total stock available — only set on date nodes (for occupancy display). */
    estoque?: number;
    childrenLabel?: string;
    children?: TreeNode[];
}

// Generates the drill-down tree. Each date carries its stock + sold qty.
// Children: Ingressos and Combos (Produtos are NOT date-bound — they're
// aggregated separately at the col-0 level). Drill-down for Ingressos:
// Setor → Ingresso → Lote → Tipo. Combos are leaves.
const buildDrillTree = (): TreeNode[] => {
    const tipos = (base: number, idPrefix: string): TreeNode[] => [
        { id: `${idPrefix}-int`, key: "int", label: "Inteira", value: Math.round(base * 0.62) },
        { id: `${idPrefix}-mei`, key: "mei", label: "Meia", value: Math.round(base * 0.3) },
        { id: `${idPrefix}-pro`, key: "pro", label: "Promo", value: Math.round(base * 0.08) },
    ];
    const lotes = (base: number, idPrefix: string): TreeNode[] => [
        {
            id: `${idPrefix}-1l`,
            key: "1l",
            label: "1º Lote",
            value: Math.round(base * 0.5),
            childrenLabel: "Tipo",
            children: tipos(base * 0.5, `${idPrefix}-1l`),
        },
        {
            id: `${idPrefix}-2l`,
            key: "2l",
            label: "2º Lote",
            value: Math.round(base * 0.35),
            childrenLabel: "Tipo",
            children: tipos(base * 0.35, `${idPrefix}-2l`),
        },
        {
            id: `${idPrefix}-3l`,
            key: "3l",
            label: "3º Lote",
            value: Math.round(base * 0.15),
            childrenLabel: "Tipo",
            children: tipos(base * 0.15, `${idPrefix}-3l`),
        },
    ];
    const ingressosPorSetor = (
        setorValue: number,
        setorId: string,
        setorLabel: string,
    ): TreeNode[] => {
        const seeds = [
            { key: "1l-int", label: `${setorLabel} 1º Lote (Inteira)`, w: 0.4 },
            { key: "1l-mei", label: `${setorLabel} 1º Lote (Meia)`, w: 0.25 },
            { key: "2l-int", label: `${setorLabel} 2º Lote (Inteira)`, w: 0.2 },
            { key: "2l-mei", label: `${setorLabel} 2º Lote (Meia)`, w: 0.15 },
        ];
        return seeds.map((s) => ({
            id: `${setorId}-${s.key}`,
            key: s.key,
            label: s.label,
            value: Math.round(setorValue * s.w),
            childrenLabel: "Lote",
            children: lotes(setorValue * s.w, `${setorId}-${s.key}`),
        }));
    };
    const setoresFor = (dateId: string, base: number): TreeNode[] => {
        const seeds = [
            { key: "vip", label: "VIP", w: 0.28 },
            { key: "cam", label: "Camarote Premium", w: 0.24 },
            { key: "pp", label: "Pista Premium", w: 0.22 },
            { key: "p", label: "Pista", w: 0.2 },
            { key: "mez", label: "Mezanino", w: 0.06 },
        ];
        return seeds.map((s) => {
            const setorId = `${dateId}-${s.key}`;
            const setorValue = Math.round(base * s.w);
            return {
                id: setorId,
                key: s.key,
                label: s.label,
                value: setorValue,
                childrenLabel: "Ingresso",
                children: ingressosPorSetor(setorValue, setorId, s.label),
            };
        });
    };
    const combosFor = (dateId: string, base: number): TreeNode[] => {
        const seeds = [
            { key: "c1", label: "Combo Camarote + Open Bar", w: 0.5 },
            { key: "c2", label: "Combo VIP + Welcome Drink", w: 0.27 },
            { key: "c3", label: "Combo Família (4 ingressos)", w: 0.1 },
            { key: "c4", label: "Combo Premium + Estacionamento", w: 0.07 },
            { key: "c5", label: "Combo Casal Camarote", w: 0.04 },
            { key: "c6", label: "Combo VIP Solo + Brinde", w: 0.02 },
        ];
        return seeds.map((s) => ({
            id: `${dateId}-${s.key}`,
            key: s.key,
            label: s.label,
            value: Math.round(base * s.w),
        }));
    };
    const dates: {
        id: string;
        label: string;
        estoque: number;
        ocupacao: number;
        comboRatio: number;
    }[] = [
        // Início devagar
        { id: "d1", label: "01 mai", estoque: 6000, ocupacao: 0.32, comboRatio: 0.04 },
        // Lotado (efeito esgotamento)
        { id: "d2", label: "08 mai", estoque: 12000, ocupacao: 0.94, comboRatio: 0.18 },
        // Sessão pequena, ocupação média-alta
        { id: "d3", label: "15 mai", estoque: 4500, ocupacao: 0.71, comboRatio: 0.09 },
        // Sessão grande, ocupação intermediária
        { id: "d4", label: "22 mai", estoque: 15000, ocupacao: 0.48, comboRatio: 0.12 },
    ];
    return dates.map((d) => {
        const ingressosVendidos = Math.round(d.estoque * d.ocupacao);
        const comboQty = Math.round(ingressosVendidos * d.comboRatio);
        const tiposDeItem: TreeNode[] = [
            {
                id: `${d.id}-ingressos`,
                key: "ingressos",
                label: "Ingressos",
                value: ingressosVendidos,
                childrenLabel: "Setor",
                children: setoresFor(d.id, ingressosVendidos),
            },
            {
                id: `${d.id}-combos`,
                key: "combos",
                label: "Combos",
                value: comboQty,
                childrenLabel: "Combo",
                children: combosFor(d.id, comboQty),
            },
        ];
        const total = tiposDeItem.reduce((s, x) => s + x.value, 0);
        return {
            id: d.id,
            key: d.id,
            label: d.label,
            value: total,
            estoque: d.estoque,
            childrenLabel: "Tipo do item",
            children: tiposDeItem,
        };
    });
};

const drillTree = buildDrillTree();

// Produtos aren't date-bound — aggregated qty list (one row per produto).
const aggregatedProdutos: TreeNode[] = (() => {
    const seeds = [
        { key: "pr1", label: "Kit Oficial #SantaSanta26", w: 0.45 },
        { key: "pr2", label: "Camisa Oficial - M", w: 0.18 },
        { key: "pr3", label: "Sacochila Oficial", w: 0.12 },
        { key: "pr4", label: "Boneco Bot_Gs - Fandom Box", w: 0.1 },
        { key: "pr5", label: "Camisa Oficial - G", w: 0.08 },
        { key: "pr6", label: "Camisa Oficial - P", w: 0.04 },
        { key: "pr7", label: "Copo Oficial", w: 0.03 },
    ];
    const totalQty = 1200;
    return seeds.map((s) => ({
        id: s.key,
        key: s.key,
        label: s.label,
        value: Math.round(totalQty * s.w),
    }));
})();

// Synthetic root node for produtos so the user can drill into the list from col 0.
const PRODUTOS_ROOT_ID = "produtos-all";
const produtosRootNode: TreeNode = {
    id: PRODUTOS_ROOT_ID,
    key: PRODUTOS_ROOT_ID,
    label: "Produtos",
    value: aggregatedProdutos.reduce((s, c) => s + c.value, 0),
    childrenLabel: "Produto",
    children: aggregatedProdutos,
};

const DrillDownGmvCard = () => {
    const [path, setPath] = useState<string[]>([]);
    const innerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
    const columnRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const [lines, setLines] = useState<string[]>([]);
    const [lockedWidth, setLockedWidth] = useState<number | null>(null);

    // Overlay de dica (mobile): aparece por 4s quando 50% da seção entra na tela.
    const bodyRef = useRef<HTMLDivElement>(null);
    const hintFiredRef = useRef(false);
    const [showHint, setShowHint] = useState(false);

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
        const cols: TreeNode[][] = [drillTree];
        for (let i = 0; i < path.length; i++) {
            let parent = cols[i].find((n) => n.id === path[i]);
            // First level can also reference the combos virtual root.
            if (!parent && i === 0 && path[0] === PRODUTOS_ROOT_ID) {
                parent = produtosRootNode;
            }
            if (!parent?.children?.length) break;
            cols.push(parent.children);
        }
        return cols;
    }, [path]);

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
                const desired =
                    target.offsetLeft +
                    target.offsetWidth +
                    RIGHT_PADDING -
                    container.clientWidth;
                const innerWidth =
                    lockedWidth ??
                    innerRef.current?.scrollWidth ??
                    container.scrollWidth;
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
        if (willShrink && innerRef.current) {
            setLockedWidth(innerRef.current.scrollWidth);
        }
        setPath((prev) => {
            const next = prev.slice(0, colIndex);
            if (prev[colIndex] === id) return next;
            next[colIndex] = id;
            return next;
        });
    };

    const reset = () => {
        if (innerRef.current) {
            setLockedWidth(innerRef.current.scrollWidth);
        }
        setPath([]);
    };

    return (
        <Card
            title="Detalhamento das vendas"
            headerRight={
                path.length > 0 ? (
                    <button
                        type="button"
                        onClick={reset}
                        className="text-sm font-medium text-brand-secondary hover:text-brand-secondary_hover"
                    >
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
                        backgroundImage:
                            "radial-gradient(circle, color-mix(in srgb, var(--color-fg-quaternary) 25%, transparent) 1px, transparent 1px)",
                        backgroundSize: "16px 16px",
                        minWidth: lockedWidth ?? undefined,
                    }}
                >
                    <svg
                        className="pointer-events-none absolute inset-0 size-full"
                        aria-hidden="true"
                    >
                        {lines.map((d, i) => (
                            <path
                                key={i}
                                d={d}
                                fill="none"
                                stroke="var(--color-utility-brand-400)"
                                strokeWidth={2}
                            />
                        ))}
                    </svg>

                    <div className="relative flex items-start gap-8 px-4 py-5 md:px-5">
                        {columns.map((nodes, colIndex) => {
                            const selectedId = path[colIndex];
                            const hasSelection = !!selectedId;
                            const resolveParent = (pi: number) => {
                                if (path[pi] === PRODUTOS_ROOT_ID && pi === 0)
                                    return produtosRootNode;
                                return columns[pi].find((n) => n.id === path[pi]);
                            };
                            const headerLabel =
                                colIndex === 0
                                    ? "Data"
                                    : resolveParent(colIndex - 1)?.childrenLabel ??
                                      "Detalhe";
                            const parentLabel =
                                colIndex > 0 && path[colIndex - 1]
                                    ? resolveParent(colIndex - 1)?.label
                                    : null;
                            return (
                                <motion.div
                                    key={colIndex}
                                    ref={(el) => {
                                        columnRefs.current.set(colIndex, el);
                                    }}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        duration: 0.22,
                                        ease: "easeOut",
                                    }}
                                    onAnimationComplete={computeLines}
                                    className="flex w-52 shrink-0 flex-col gap-5"
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col gap-0.5 pb-2">
                                            <span className="text-xs font-semibold text-tertiary uppercase tracking-wide">
                                                {headerLabel}
                                            </span>
                                            {parentLabel && (
                                                <span className="truncate text-xs text-tertiary">
                                                    {parentLabel}
                                                </span>
                                            )}
                                        </div>
                                        <ul className="flex flex-col gap-2">
                                            {nodes.map((node) => {
                                                const baseSum = nodes.reduce(
                                                    (s, n) => s + n.value,
                                                    0,
                                                );
                                                const isDateNode =
                                                    colIndex === 0 &&
                                                    node.estoque !== undefined;
                                                // Dates show occupancy (vendido / estoque).
                                                // Other items: % of column sum.
                                                const pct = isDateNode
                                                    ? (node.value / (node.estoque ?? 1)) *
                                                      100
                                                    : baseSum === 0
                                                      ? 0
                                                      : (node.value / baseSum) * 100;
                                                const isSelected =
                                                    node.id === selectedId;
                                                const dimmed =
                                                    hasSelection && !isSelected;
                                                const isLeaf = !node.children?.length;
                                                return (
                                                    <li key={node.id}>
                                                        <button
                                                            ref={(el) => {
                                                                itemRefs.current.set(
                                                                    node.id,
                                                                    el,
                                                                );
                                                            }}
                                                            type="button"
                                                            onClick={() =>
                                                                !isLeaf &&
                                                                handleSelect(
                                                                    colIndex,
                                                                    node.id,
                                                                )
                                                            }
                                                            disabled={isLeaf}
                                                            className={cx(
                                                                "flex w-full flex-col gap-1 rounded-md bg-secondary px-3 py-2.5 text-left ring-1 ring-border-secondary transition duration-100 ease-linear",
                                                                !isLeaf &&
                                                                    "hover:bg-secondary_hover",
                                                                isLeaf &&
                                                                    "cursor-default",
                                                                isSelected &&
                                                                    "ring-2 ring-brand",
                                                                dimmed &&
                                                                    "opacity-50",
                                                            )}
                                                        >
                                                            <span
                                                                className={cx(
                                                                    "truncate text-xs text-primary",
                                                                    isSelected
                                                                        ? "font-semibold"
                                                                        : "font-medium",
                                                                )}
                                                            >
                                                                {node.label}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-quaternary">
                                                                    <div
                                                                        className={cx(
                                                                            "h-full rounded-full",
                                                                            isSelected
                                                                                ? "bg-fg-brand-primary"
                                                                                : "bg-utility-brand-400",
                                                                        )}
                                                                        style={{
                                                                            width: `${pct}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="shrink-0 text-xs font-medium text-primary tabular-nums">
                                                                    {pct.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-tertiary tabular-nums">
                                                                {isDateNode
                                                                    ? `${numberFormatter.format(node.value)} / ${numberFormatter.format(node.estoque ?? 0)}`
                                                                    : numberFormatter.format(
                                                                          node.value,
                                                                      )}
                                                            </span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>

                                    {colIndex === 0 && (
                                        <div className="flex flex-col gap-2">
                                            <span className="pb-2 text-xs font-semibold text-tertiary uppercase tracking-wide">
                                                Produto
                                            </span>
                                            {(() => {
                                                const isSelected =
                                                    path[0] === PRODUTOS_ROOT_ID;
                                                const dimmed =
                                                    hasSelection && !isSelected;
                                                // Produtos don't have estoque — show qty only.
                                                return (
                                                    <button
                                                        ref={(el) => {
                                                            itemRefs.current.set(
                                                                PRODUTOS_ROOT_ID,
                                                                el,
                                                            );
                                                        }}
                                                        type="button"
                                                        onClick={() =>
                                                            handleSelect(
                                                                0,
                                                                PRODUTOS_ROOT_ID,
                                                            )
                                                        }
                                                        className={cx(
                                                            "flex w-full flex-col gap-1 rounded-md bg-secondary px-3 py-2.5 text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary_hover",
                                                            isSelected &&
                                                                "ring-2 ring-brand",
                                                            dimmed && "opacity-50",
                                                        )}
                                                    >
                                                        <span
                                                            className={cx(
                                                                "truncate text-xs text-primary",
                                                                isSelected
                                                                    ? "font-semibold"
                                                                    : "font-medium",
                                                            )}
                                                        >
                                                            Produtos
                                                        </span>
                                                        <span className="text-xs text-tertiary">
                                                            {aggregatedProdutos.length}{" "}
                                                            itens
                                                        </span>
                                                        <span className="text-xs text-tertiary tabular-nums">
                                                            {numberFormatter.format(
                                                                produtosRootNode.value,
                                                            )}{" "}
                                                            unidades
                                                        </span>
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
                                transition={{
                                    duration: 0.22,
                                    ease: "easeOut",
                                    delay: 0.05,
                                }}
                                className="hidden max-w-[240px] flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center md:flex"
                            >
                                <FeaturedIcon
                                    icon={CursorClick02}
                                    color="gray"
                                    theme="modern"
                                    size="md"
                                />
                                <p className="text-sm font-semibold text-primary">
                                    Selecione uma data
                                </p>
                                <p className="text-xs text-tertiary">
                                    Escolha um dia para ver o detalhamento por tipo, setor,
                                    ingresso, lote e tipo.
                                </p>
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
                            <p className="text-sm font-semibold text-primary">Selecione uma data</p>
                            <p className="max-w-[260px] text-xs text-tertiary">
                                Escolha um dia para ver o detalhamento por tipo, setor, ingresso, lote e tipo.
                            </p>
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

const OcupacaoPorSetorCard = () => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set(["s2"]));

    const toggleExpanded = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

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
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">Setor</th>
                        <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">
                            Estoque
                        </th>
                        <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">
                            Vendido
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            <span className="inline-flex items-center gap-1">
                                Taxa de ocupação
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {setores.map((setor, i) => {
                        const isExpanded = expanded.has(setor.id);
                        const hasIngressos = !!setor.ingressos?.length;
                        const isLast = i === setores.length - 1;
                        return (
                            <Fragment key={setor.id}>
                                <tr
                                    role={hasIngressos ? "button" : undefined}
                                    tabIndex={hasIngressos ? 0 : undefined}
                                    aria-expanded={hasIngressos ? isExpanded : undefined}
                                    onClick={
                                        hasIngressos
                                            ? () => toggleExpanded(setor.id)
                                            : undefined
                                    }
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
                                    className={cx(
                                        "transition duration-100 ease-linear",
                                        hasIngressos &&
                                            "cursor-pointer hover:bg-primary_hover",
                                        !isLast && !isExpanded && "border-b border-secondary",
                                        isExpanded && "border-b border-secondary",
                                    )}
                                >
                                    <td className="px-2 py-4 md:px-4">
                                        {hasIngressos && (
                                            <ChevronDown
                                                aria-hidden="true"
                                                className={cx(
                                                    "size-4 text-fg-quaternary transition-transform duration-150",
                                                    isExpanded && "rotate-180",
                                                )}
                                            />
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-primary">
                                        <span className="line-clamp-2">{setor.nome}</span>
                                    </td>
                                    <td className="hidden px-4 py-4 text-right text-sm text-tertiary md:table-cell">
                                        {numberFormatter.format(setor.estoque)}
                                    </td>
                                    <td className="hidden px-4 py-4 text-right text-sm text-tertiary md:table-cell">
                                        {numberFormatter.format(setor.vendido)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <OccupancyBar
                                            value={setor.vendido}
                                            total={setor.estoque}
                                        />
                                    </td>
                                </tr>
                                {isExpanded &&
                                    setor.ingressos?.map((ingresso, j, arr) => {
                                        const isLastIngresso = j === arr.length - 1;
                                        const previousSum = arr
                                            .slice(0, j)
                                            .reduce((sum, prev) => sum + prev.vendido, 0);
                                        const offsetPct =
                                            setor.estoque === 0
                                                ? 0
                                                : (previousSum / setor.estoque) * 100;
                                        const widthPct =
                                            setor.estoque === 0
                                                ? 0
                                                : (ingresso.vendido / setor.estoque) * 100;
                                        const filledPct =
                                            setor.estoque === 0
                                                ? 0
                                                : (setor.vendido / setor.estoque) * 100;
                                        const labelPct =
                                            setor.vendido === 0
                                                ? 0
                                                : (ingresso.vendido / setor.vendido) * 100;
                                        const boundaries = arr
                                            .slice(0, -1)
                                            .map((_, idx) => {
                                                const sum = arr
                                                    .slice(0, idx + 1)
                                                    .reduce((s, x) => s + x.vendido, 0);
                                                return setor.estoque === 0
                                                    ? 0
                                                    : (sum / setor.estoque) * 100;
                                            });
                                        return (
                                            <tr
                                                key={ingresso.id}
                                                className={cx(
                                                    "bg-secondary",
                                                    isLastIngresso &&
                                                        !isLast &&
                                                        "border-b border-secondary",
                                                )}
                                            >
                                                <td className="px-2 py-3 md:px-4" />
                                                <td className="px-4 py-3 pl-10 text-sm text-secondary">
                                                    <span className="line-clamp-2">
                                                        {ingresso.nome}
                                                    </span>
                                                </td>
                                                <td className="hidden px-4 py-3 md:table-cell" />
                                                <td className="hidden px-4 py-3 text-right text-sm text-tertiary md:table-cell">
                                                    {numberFormatter.format(ingresso.vendido)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <SegmentedOccupancyBar
                                                        offsetPct={offsetPct}
                                                        widthPct={widthPct}
                                                        filledPct={filledPct}
                                                        labelPct={labelPct}
                                                        boundaries={boundaries}
                                                    />
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

interface OccupancyBarProps {
    value: number;
    total: number;
}

const OccupancyBar = ({ value, total }: OccupancyBarProps) => {
    const pct = total === 0 ? 0 : Math.round((value / total) * 100);
    const clamped = Math.min(100, Math.max(0, pct));
    return (
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-tertiary/90">
                <div
                    className="h-full rounded-full bg-brand-solid transition-all"
                    style={{ width: `${clamped}%` }}
                />
            </div>
            <span className="w-10 shrink-0 text-right text-sm text-tertiary">{clamped}%</span>
        </div>
    );
};

interface SegmentedOccupancyBarProps {
    offsetPct: number;
    widthPct: number;
    /** Total filled portion of the parent setor (vendida / estoque %). */
    filledPct: number;
    /** Percentage shown as the textual label (defaults to widthPct). */
    labelPct?: number;
    /** Vertical dashed guides at these % positions across the bar. */
    boundaries?: number[];
}

const SegmentedOccupancyBar = ({
    offsetPct,
    widthPct,
    filledPct,
    labelPct,
    boundaries = [],
}: SegmentedOccupancyBarProps) => {
    const clampedOffset = Math.min(100, Math.max(0, offsetPct));
    const clampedWidth = Math.min(100 - clampedOffset, Math.max(0, widthPct));
    const clampedFilled = Math.min(100, Math.max(0, filledPct));
    const display = Math.round(labelPct ?? widthPct);
    return (
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <div className="relative h-2 min-w-0 flex-1 overflow-visible rounded-full bg-tertiary/90">
                {/* Tertiary fill — total filled in details (parent's vendida / estoque). */}
                <div
                    className="absolute h-full rounded-full bg-quaternary transition-all"
                    style={{ left: 0, width: `${clampedFilled}%` }}
                />
                {/* Brand-colored slice — this ingresso's portion. */}
                <div
                    className="absolute h-full rounded-full bg-brand-solid transition-all"
                    style={{ left: `${clampedOffset}%`, width: `${clampedWidth}%` }}
                />
            </div>
            <span className="w-10 shrink-0 text-right text-sm text-tertiary">{display}%</span>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Quantidade de ingressos por setor                                 */
/* ------------------------------------------------------------------ */

const QuantidadeIngressosPorSetorCard = () => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const grupos = useMemo(() => {
        const map = new Map<string, { setor: string; rows: typeof ingressosPorSetor; vendidos: number; estoque: number }>();
        ingressosPorSetor.forEach((row) => {
            const g = map.get(row.setor) ?? { setor: row.setor, rows: [], vendidos: 0, estoque: 0 };
            g.rows.push(row);
            g.vendidos += row.vendidos;
            g.estoque += row.estoque;
            map.set(row.setor, g);
        });
        return Array.from(map.values());
    }, []);

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
                    <col className="w-[55%] md:w-auto" />
                    <col className="hidden md:table-column" />
                    <col className="hidden md:table-column" />
                    <col />
                    <col />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="px-2 py-3 md:px-4" aria-hidden="true" />
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">Setor</th>
                        <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary md:table-cell">Lote</th>
                        <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary md:table-cell">Item Combo</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-tertiary">Ingressos Vendidos</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-tertiary">Estoque</th>
                    </tr>
                </thead>
                <tbody>
                    {grupos.map((grupo, i) => {
                        const isExpanded = expanded.has(grupo.setor);
                        const isLast = i === grupos.length - 1;
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
                                    className={cx(
                                        "cursor-pointer transition duration-100 ease-linear hover:bg-primary_hover",
                                        (!isLast || isExpanded) && "border-b border-secondary",
                                    )}
                                >
                                    <td className="px-2 py-4 md:px-4">
                                        <ChevronDown
                                            aria-hidden="true"
                                            className={cx("size-4 text-fg-quaternary transition-transform duration-150", isExpanded && "rotate-180")}
                                        />
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium text-primary">
                                        <span className="line-clamp-2">{grupo.setor}</span>
                                    </td>
                                    <td className="hidden px-4 py-4 md:table-cell" />
                                    <td className="hidden px-4 py-4 md:table-cell" />
                                    <td className="px-4 py-4 text-right text-sm font-medium text-primary">
                                        {numberFormatter.format(grupo.vendidos)}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm text-tertiary">
                                        {numberFormatter.format(grupo.estoque)}
                                    </td>
                                </tr>
                                {isExpanded &&
                                    grupo.rows.map((row, j) => (
                                        <tr key={row.id} className={cx("bg-secondary", (!isLast || j !== grupo.rows.length - 1) && "border-b border-secondary")}>
                                            <td className="px-2 py-3 md:px-4" />
                                            <td className="px-4 py-3 pl-10 text-sm text-secondary">
                                                <span className="line-clamp-2">{row.tipoIngresso}</span>
                                            </td>
                                            <td className="hidden px-4 py-3 text-sm text-tertiary md:table-cell">{row.lote}</td>
                                            <td className="hidden px-4 py-3 text-sm text-tertiary md:table-cell">{row.itemCombo}</td>
                                            <td className="px-4 py-3 text-right text-sm text-tertiary">{numberFormatter.format(row.vendidos)}</td>
                                            <td className="px-4 py-3 text-right text-sm text-tertiary">{numberFormatter.format(row.estoque)}</td>
                                        </tr>
                                    ))}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Sortable header                                                   */
/* ------------------------------------------------------------------ */

interface SortableHeaderProps {
    label: string;
    align?: "left" | "right";
}

const SortableHeader = ({ label, align = "left" }: SortableHeaderProps) => (
    <span className={cx("inline-flex items-center", align === "right" && "justify-end")}>
        {label}
    </span>
);

/* ------------------------------------------------------------------ */
/*  Combo                                                             */
/* ------------------------------------------------------------------ */

const ComboCard = () => (
    <Card title="Combo">
        <div className="overflow-x-auto overflow-y-clip">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Item Combo" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Quantidade" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor Unitário" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor total bruto" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor total c/ desconto" align="right" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {combos.map((row, i) => (
                        <tr
                            key={row.id}
                            className={cx(
                                "transition duration-100 ease-linear hover:bg-primary_hover",
                                i !== combos.length - 1 && "border-b border-secondary",
                            )}
                        >
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">
                                {row.nome}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {numberFormatter.format(row.quantidade)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.valorUnitario)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.gmv)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.gmvComDesconto)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

/* ------------------------------------------------------------------ */
/*  Produtos                                                          */
/* ------------------------------------------------------------------ */

const ProdutosCard = () => (
    <Card title="Produtos">
        <div className="overflow-x-auto overflow-y-clip">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Produto" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Qtd" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor Unitário" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor total bruto" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor total c/ desconto" align="right" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {produtos.map((row, i) => (
                        <tr
                            key={row.id}
                            className={cx(
                                "transition duration-100 ease-linear hover:bg-primary_hover",
                                i !== produtos.length - 1 && "border-b border-secondary",
                            )}
                        >
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">
                                {row.nome}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {numberFormatter.format(row.quantidade)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.valorUnitario)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.gmv)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.gmvComDesconto)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

/* ------------------------------------------------------------------ */
/*  Ingressos com cupom                                               */
/* ------------------------------------------------------------------ */

const IngressosComCupomCard = () => (
    <Card title="Quantidade de ingressos com cupom">
        <div className="overflow-x-auto overflow-y-clip">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Cupom" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Quantidade" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor do Desconto" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor Total" align="right" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {cupons.map((row, i) => (
                        <tr
                            key={row.id}
                            className={cx(
                                "transition duration-100 ease-linear hover:bg-primary_hover",
                                i !== cupons.length - 1 && "border-b border-secondary",
                            )}
                        >
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">
                                {row.cupom}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {numberFormatter.format(row.quantidade)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.valor)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.valorDesconto)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.valorTotal)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);
