import { useMemo } from "react";
import {
    ArrowUpRight,
    AlertTriangle,
    CheckCircle,
    Zap,
    Ticket02,
    TrendUp01,
    ShoppingBag03,
    Gift01,
} from "@untitledui/icons";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";

/* ------------------------------------------------------------------ */
/*  Formatters                                                        */
/* ------------------------------------------------------------------ */

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
});
const currencyFull = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});
const compact = new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
});
const number = new Intl.NumberFormat("pt-BR");

/* ------------------------------------------------------------------ */
/*  Mock data (mesma base do V1, reapresentada)                       */
/* ------------------------------------------------------------------ */

interface SetorV2 {
    id: string;
    nome: string;
    estoque: number;
    vendido: number;
}

const setores: SetorV2[] = [
    { id: "vip", nome: "VIP", estoque: 2000, vendido: 1800 },
    { id: "camarote", nome: "Camarote Premium", estoque: 1500, vendido: 1200 },
    { id: "pista-premium", nome: "Pista Premium", estoque: 8000, vendido: 6400 },
    { id: "pista", nome: "Pista", estoque: 20000, vendido: 18000 },
    { id: "mezanino", nome: "Mezanino", estoque: 5807, vendido: 2400 },
];

const topIngressos = [
    { id: "p-1l-int", nome: "Pista - 1º Lote (Inteira)", setor: "Pista", vendido: 5000 },
    { id: "p-2l-int", nome: "Pista - 2º Lote (Inteira)", setor: "Pista", vendido: 5500 },
    { id: "p-1l-mei", nome: "Pista - 1º Lote (Meia)", setor: "Pista", vendido: 4000 },
    { id: "pp-1l-int", nome: "Pista Premium - 1º Lote (Inteira)", setor: "Pista Premium", vendido: 3000 },
    { id: "p-2l-mei", nome: "Pista - 2º Lote (Meia)", setor: "Pista", vendido: 2500 },
];

const mixReceita = [
    { id: "ingressos", nome: "Ingressos", valor: 2479350.0, icon: Ticket02 },
    { id: "combos", nome: "Combos", valor: 1043726.0, icon: Gift01 },
    { id: "produtos", nome: "Produtos", valor: 45579.2, icon: ShoppingBag03 },
];

const PIE_COLORS = [
    "var(--color-utility-brand-600, #7f56d9)",
    "var(--color-utility-pink-500, #ee46bc)",
    "var(--color-utility-blue-500, #2e90fa)",
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function VendasPorGrupoV2() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="vendas-por-grupo">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-5 py-6 md:px-6 md:gap-6 pb-10">
                    <RelatorioPageHeader title="Vendas por grupo" />

                    <HeroOcupacao />
                    <MixReceitaCard />
                    <SetoresRanking />
                    <TopIngressosCard />
                    <InsightsList />
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Hero — ocupação geral + KPIs                                      */
/* ------------------------------------------------------------------ */

const HeroOcupacao = () => {
    const totalEstoque = setores.reduce((s, x) => s + x.estoque, 0);
    const totalVendido = setores.reduce((s, x) => s + x.vendido, 0);
    const pct = Math.round((totalVendido / totalEstoque) * 100);
    const gmv = 2888877.13;
    const ticketMedio = gmv / 37307;

    return (
        <section className="relative overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary px-5 py-6 md:px-8 md:py-8">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-utility-brand-100/40 blur-3xl"
            />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                    <RadialGauge value={pct} />
                    <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Badge size="sm" color="success" type="pill-color">
                                <ArrowUpRight className="size-3" />
                                +12,4%
                            </Badge>
                            <span className="text-xs text-tertiary">vs. último evento</span>
                        </div>
                        <p className="text-display-xs font-semibold text-primary md:text-display-sm">
                            {number.format(totalVendido)}{" "}
                            <span className="text-md font-normal text-tertiary">
                                de {number.format(totalEstoque)} ingressos
                            </span>
                        </p>
                        <p className="text-sm text-tertiary">
                            Atualizado há poucos segundos
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-6">
                    <KpiBlock
                        label="GMV"
                        value={currency.format(gmv)}
                        sublabel="receita bruta"
                    />
                    <KpiBlock
                        label="Ticket médio"
                        value={currencyFull.format(ticketMedio)}
                        sublabel="por item"
                    />
                </div>
            </div>
        </section>
    );
};

const KpiBlock = ({
    label,
    value,
    sublabel,
}: {
    label: string;
    value: string;
    sublabel: string;
}) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-tertiary uppercase tracking-wide">
            {label}
        </span>
        <span className="text-lg font-semibold text-primary md:text-xl">{value}</span>
        <span className="text-xs text-tertiary">{sublabel}</span>
    </div>
);

const RadialGauge = ({ value }: { value: number }) => {
    const size = 112;
    const stroke = 12;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    className="stroke-quaternary"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="stroke-fg-brand-primary transition-[stroke-dashoffset] duration-500"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-display-xs font-semibold text-primary">
                    {value}%
                </span>
                <span className="text-[10px] font-medium text-tertiary uppercase">
                    Ocupação
                </span>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Mix de receita (donut + lista)                                    */
/* ------------------------------------------------------------------ */

const MixReceitaCard = () => {
    const total = mixReceita.reduce((s, x) => s + x.valor, 0);
    const data = useMemo(
        () => mixReceita.map((x, i) => ({ ...x, color: PIE_COLORS[i] })),
        [],
    );

    return (
        <SectionCard
            title="Mix de receita"
            subtitle="De onde vem o faturamento do evento"
        >
            <div className="flex flex-col items-center gap-6 px-5 py-6 md:flex-row md:gap-8">
                <div className="relative flex shrink-0 items-center justify-center">
                    <div className="size-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="valor"
                                    innerRadius="68%"
                                    outerRadius="100%"
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {data.map((d) => (
                                        <Cell key={d.id} fill={d.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-tertiary uppercase tracking-wide">
                            Total
                        </span>
                        <span className="text-lg font-semibold text-primary">
                            {currency.format(total)}
                        </span>
                    </div>
                </div>

                <div className="flex w-full flex-1 flex-col gap-3">
                    {data.map((item) => {
                        const pct = Math.round((item.valor / total) * 100);
                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-3"
                            >
                                <span
                                    className="inline-block size-3 shrink-0 rounded-sm"
                                    style={{ backgroundColor: item.color }}
                                />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span className="text-sm font-medium text-primary">
                                            {item.nome}
                                        </span>
                                        <span className="text-sm font-semibold text-primary tabular-nums">
                                            {pct}%
                                        </span>
                                    </div>
                                    <span className="text-xs text-tertiary">
                                        {currencyFull.format(item.valor)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </SectionCard>
    );
};

/* ------------------------------------------------------------------ */
/*  Ranking de setores                                                */
/* ------------------------------------------------------------------ */

const SetoresRanking = () => {
    const sorted = [...setores].sort(
        (a, b) => b.vendido / b.estoque - a.vendido / a.estoque,
    );

    return (
        <SectionCard
            title="Ranking de setores"
            subtitle="Ordenado por taxa de ocupação"
        >
            <ul className="divide-y divide-secondary">
                {sorted.map((setor, i) => {
                    const pct = Math.round((setor.vendido / setor.estoque) * 100);
                    const status =
                        pct >= 85 ? "hot" : pct >= 60 ? "ok" : "low";
                    return (
                        <li
                            key={setor.id}
                            className="flex items-center gap-4 px-5 py-4 transition duration-100 ease-linear hover:bg-primary_hover"
                        >
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary tabular-nums">
                                {i + 1}
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <div className="flex items-baseline justify-between gap-3">
                                    <span className="truncate text-sm font-semibold text-primary">
                                        {setor.nome}
                                    </span>
                                    <span className="text-sm font-semibold text-primary tabular-nums">
                                        {pct}%
                                    </span>
                                </div>
                                <div className="relative h-2 w-full overflow-hidden rounded-full bg-quaternary">
                                    <div
                                        className={cx(
                                            "h-full rounded-full transition-[width] duration-500",
                                            status === "hot" &&
                                                "bg-fg-success-secondary",
                                            status === "ok" && "bg-fg-brand-primary",
                                            status === "low" &&
                                                "bg-fg-warning-secondary",
                                        )}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs text-tertiary">
                                    <span>
                                        {number.format(setor.vendido)} /{" "}
                                        {number.format(setor.estoque)} ingressos
                                    </span>
                                    <StatusBadge status={status} />
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </SectionCard>
    );
};

const StatusBadge = ({ status }: { status: "hot" | "ok" | "low" }) => {
    if (status === "hot")
        return (
            <Badge size="sm" color="success" type="pill-color">
                <Zap className="size-3" /> em alta
            </Badge>
        );
    if (status === "low")
        return (
            <Badge size="sm" color="warning" type="pill-color">
                atenção
            </Badge>
        );
    return (
        <Badge size="sm" color="brand" type="pill-color">
            estável
        </Badge>
    );
};

/* ------------------------------------------------------------------ */
/*  Top ingressos                                                     */
/* ------------------------------------------------------------------ */

const TopIngressosCard = () => {
    const sorted = [...topIngressos].sort((a, b) => b.vendido - a.vendido);
    const max = sorted[0].vendido;

    return (
        <SectionCard
            title="Top ingressos"
            subtitle="Mais vendidos no evento"
            icon={TrendUp01}
        >
            <ul className="flex flex-col gap-3 px-5 py-5">
                {sorted.map((ing, i) => {
                    const pct = (ing.vendido / max) * 100;
                    return (
                        <li
                            key={ing.id}
                            className="flex items-center gap-3"
                        >
                            <span
                                className={cx(
                                    "flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold tabular-nums",
                                    i === 0
                                        ? "bg-brand-solid text-white"
                                        : "bg-secondary text-secondary",
                                )}
                            >
                                {i + 1}
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <div className="flex items-baseline justify-between gap-3">
                                    <span className="truncate text-sm font-medium text-primary">
                                        {ing.nome}
                                    </span>
                                    <span className="text-sm font-semibold text-primary tabular-nums">
                                        {compact.format(ing.vendido)}
                                    </span>
                                </div>
                                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-quaternary">
                                    <div
                                        className="h-full rounded-full bg-fg-brand-primary"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="text-xs text-tertiary">
                                    {ing.setor}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </SectionCard>
    );
};

/* ------------------------------------------------------------------ */
/*  Insights                                                          */
/* ------------------------------------------------------------------ */

const InsightsList = () => (
    <SectionCard
        title="Insights"
        subtitle="Pontos de atenção e oportunidades"
    >
        <ul className="flex flex-col gap-3 px-5 py-5">
            <InsightItem
                tone="warning"
                icon={AlertTriangle}
                title="Mezanino com baixa ocupação"
                body="Apenas 41% dos ingressos foram vendidos. Considere ativar uma promoção ou redistribuir lotes."
            />
            <InsightItem
                tone="success"
                icon={CheckCircle}
                title="Pista quase esgotada"
                body="90% de ocupação. Avalie liberar um próximo lote ou ampliar o estoque do setor."
            />
            <InsightItem
                tone="success"
                icon={Zap}
                title="VIP performando acima do esperado"
                body="90% de ocupação com ticket alto — bom indicador de aceitação do upsell."
            />
        </ul>
    </SectionCard>
);

const InsightItem = ({
    tone,
    icon,
    title,
    body,
}: {
    tone: "success" | "warning";
    icon: React.FC<{ className?: string }>;
    title: string;
    body: string;
}) => (
    <li className="flex items-start gap-3 rounded-lg bg-secondary_subtle p-4 ring-1 ring-border-secondary">
        <FeaturedIcon
            icon={icon}
            color={tone === "success" ? "success" : "warning"}
            theme="light"
            size="sm"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold text-primary">{title}</span>
            <span className="text-sm text-tertiary">{body}</span>
        </div>
    </li>
);

/* ------------------------------------------------------------------ */
/*  Section shell                                                     */
/* ------------------------------------------------------------------ */

const SectionCard = ({
    title,
    subtitle,
    icon: Icon,
    children,
}: {
    title: string;
    subtitle?: string;
    icon?: React.FC<{ className?: string }>;
    children: React.ReactNode;
}) => (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="flex items-start gap-3 border-b border-secondary px-5 py-4">
            {Icon && (
                <FeaturedIcon icon={Icon} color="gray" theme="modern" size="sm" />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="text-md font-semibold text-primary">{title}</h3>
                {subtitle && (
                    <p className="text-xs text-tertiary">{subtitle}</p>
                )}
            </div>
        </header>
        {children}
    </section>
);
