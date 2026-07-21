import { useEffect, useMemo, useState } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { currencyFormatter, numberFormatter } from "../data/event";

export interface ChartPoint {
    data: string;
    quantidade: number;
    total: number;
}

function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return isMobile;
}

interface ChartTooltipPayloadEntry {
    dataKey: string;
    name: string;
    value: number | string;
    color: string;
}

const ChartTooltip = ({ active, label, payload }: { active?: boolean; label?: string; payload?: ChartTooltipPayloadEntry[] }) => {
    if (!active || !payload || payload.length === 0) return null;
    const ordered = [...payload].sort((a, b) => (a.dataKey === "total" ? -1 : b.dataKey === "total" ? 1 : 0));
    return (
        <div className="rounded-lg bg-primary-solid px-3 py-2.5 shadow-xl ring-1 ring-secondary_alt">
            <p className="mb-1.5 text-sm font-semibold text-white">{label}</p>
            <ul className="flex flex-col gap-1">
                {ordered.map((entry) => {
                    const isMonetary = entry.dataKey === "total";
                    const formatted = isMonetary ? currencyFormatter.format(Number(entry.value)) : numberFormatter.format(Number(entry.value));
                    return (
                        <li key={entry.dataKey} className="flex items-center gap-2 text-sm">
                            <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: entry.color }} />
                            <span className="text-white/70">{entry.name}:</span>
                            <span className="font-semibold text-white">{formatted}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

const ChartCursor = ({ points, top = 0, height = 0 }: { points?: { x: number; y: number }[]; top?: number; height?: number }) => {
    if (!points || points.length === 0) return null;
    const x = points[0].x;
    return <line x1={x} x2={x} y1={top} y2={top + height} stroke="var(--color-border-primary)" strokeWidth={1} />;
};

const QTD_COLOR = "var(--color-utility-blue-400)";
const TOTAL_COLOR = "var(--color-bg-quaternary)";

export const TransacionadoChartCard = ({
    data,
    title,
    subtitle,
    acumulado = false,
}: {
    data: ChartPoint[];
    title: string;
    subtitle: string;
    acumulado?: boolean;
}) => {
    const isMobile = useIsMobile();
    const fontSize = isMobile ? 10 : 11;

    // Variante acumulada: soma corrente de total e quantidade.
    const series = useMemo<ChartPoint[]>(() => {
        if (!acumulado) return data;
        let total = 0;
        let quantidade = 0;
        return data.map((p) => {
            total += p.total;
            quantidade += p.quantidade;
            return { data: p.data, total, quantidade };
        });
    }, [data, acumulado]);

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <header className="flex flex-col gap-1 border-b border-secondary px-5 pt-4 pb-4">
                <h3 className="text-md font-semibold text-primary">{title}</h3>
                <p className="text-sm text-tertiary">{subtitle}</p>
            </header>

            <div className="h-[280px] w-full px-2 pt-5 pb-2 md:h-[380px] md:px-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={series} margin={{ top: isMobile ? 16 : 28, right: isMobile ? 8 : 16, bottom: isMobile ? 0 : 4, left: isMobile ? 0 : 4 }}>
                        <defs>
                            <linearGradient id="qtdAreaFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={QTD_COLOR} stopOpacity={0.28} />
                                <stop offset="80%" stopColor={QTD_COLOR} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--color-border-secondary)" strokeDasharray="2 4" strokeOpacity={0.6} vertical={false} />
                        <XAxis
                            dataKey="data"
                            tick={{ fill: "var(--color-text-tertiary)", fontSize }}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            interval={isMobile ? "preserveStartEnd" : "preserveStart"}
                            minTickGap={isMobile ? 24 : 16}
                        />
                        <YAxis yAxisId="total" orientation="left" tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`} tick={{ fill: "var(--color-text-tertiary)", fontSize }} tickLine={false} axisLine={false} tickMargin={8} width={isMobile ? 44 : 56} />
                        <YAxis yAxisId="qtd" orientation="right" tickFormatter={(v) => numberFormatter.format(Number(v))} tick={{ fill: "var(--color-text-tertiary)", fontSize }} tickLine={false} axisLine={false} tickMargin={8} width={isMobile ? 36 : 44} />
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
                        <Bar yAxisId="total" dataKey="total" name="Total Transacionado" fill={TOTAL_COLOR} fillOpacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={isMobile ? 10 : 18} />
                        <Area yAxisId="qtd" type="monotone" dataKey="quantidade" name="Quantidade de Ingressos" stroke={QTD_COLOR} strokeWidth={3} fill="url(#qtdAreaFill)" dot={false} activeDot={{ r: 6, fill: QTD_COLOR, stroke: "var(--color-bg-primary)", strokeWidth: 2 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary px-5 py-3">
                <div className="flex flex-wrap items-center gap-4 text-sm text-tertiary">
                    <span className="flex items-center gap-1.5">
                        <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ background: TOTAL_COLOR }} />
                        Total Transacionado
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: QTD_COLOR }} />
                        Quantidade de Ingressos
                    </span>
                </div>
            </footer>
        </section>
    );
};
