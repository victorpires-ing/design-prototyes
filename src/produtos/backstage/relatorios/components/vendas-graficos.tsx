import { useMemo, useState } from "react";
import { Area, BarChart, Bar, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Badge } from "@/components/base/badges/badges";
import { currencyFormatter, numberFormatter } from "../data/event";
import type { DiaVenda } from "../data/vendas-diarias";

const num = (n: number) => numberFormatter.format(n);
const kMoney = (n: number) => (n >= 1000 ? `R$${(n / 1000).toFixed(0)}k` : `R$${n}`);
const money = (n: number) => currencyFormatter.format(n);

const COR_M = "var(--color-utility-blue-400)";
const COR_F = "var(--color-utility-green-400)";
const COR_REALIZADO = "var(--color-utility-green-500)";
const COR_META = "var(--color-utility-red-500)";

const eixoX = {
    dataKey: "data",
    tick: { fill: "var(--color-text-tertiary)", fontSize: 11 },
    tickLine: false,
    axisLine: false,
    tickMargin: 10,
    interval: "preserveStartEnd" as const,
    minTickGap: 28,
};

/** Legenda padrão: rodapé à esquerda com separador no topo. */
function LegendaRodape({ itens, direita }: { itens: { cor: string; label: string; traco?: boolean }[]; direita?: React.ReactNode }) {
    return (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary px-5 py-3 text-sm text-tertiary">
            <div className="flex flex-wrap items-center gap-4">
                {itens.map((i) => (
                    <span key={i.label} className="flex items-center gap-1.5">
                        {i.traco ? (
                            <span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ background: i.cor }} />
                        ) : (
                            <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: i.cor }} />
                        )}
                        {i.label}
                    </span>
                ))}
            </div>
            {direita}
        </footer>
    );
}

/* ------------------------------------------------------------------ */
/*  Vendas por dia | Por gênero (Quantidade/Faturamento × Diário/Acum) */
/* ------------------------------------------------------------------ */

export function VendasPorGeneroCard({ dias }: { dias: DiaVenda[] }) {
    const [metric, setMetric] = useState<"quantidade" | "faturamento">("quantidade");
    const [visao, setVisao] = useState<"diario" | "acumulado">("diario");

    const dados = useMemo(() => {
        let accM = 0;
        let accF = 0;
        return dias.map((d) => {
            const m = metric === "quantidade" ? d.mascQtd : d.mascFat;
            const f = metric === "quantidade" ? d.femQtd : d.femFat;
            accM += m;
            accF += f;
            return { data: d.data, masc: visao === "acumulado" ? accM : m, fem: visao === "acumulado" ? accF : f };
        });
    }, [dias, metric, visao]);

    const fmtY = (v: number | string) => (metric === "faturamento" ? kMoney(Number(v)) : num(Number(v)));

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <header className="flex flex-col gap-3 border-b border-secondary px-5 pt-4 pb-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-md font-semibold text-primary">Vendas por dia · por gênero</h3>
                    <p className="text-sm text-tertiary">{metric === "quantidade" ? "Unidades" : "Faturamento"} {visao === "acumulado" ? "acumulado" : "por dia"}, por gênero</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <ButtonGroup size="sm" selectedKeys={[metric]} onSelectionChange={(k: Set<React.Key> | "all") => { if (k !== "all") { const n = [...k][0]; if (n) setMetric(n as "quantidade" | "faturamento"); } }}>
                        <ButtonGroupItem id="quantidade">Quantidade</ButtonGroupItem>
                        <ButtonGroupItem id="faturamento">Faturamento</ButtonGroupItem>
                    </ButtonGroup>
                    <ButtonGroup size="sm" selectedKeys={[visao]} onSelectionChange={(k: Set<React.Key> | "all") => { if (k !== "all") { const n = [...k][0]; if (n) setVisao(n as "diario" | "acumulado"); } }}>
                        <ButtonGroupItem id="diario">Diário</ButtonGroupItem>
                        <ButtonGroupItem id="acumulado">Acumulado</ButtonGroupItem>
                    </ButtonGroup>
                </div>
            </header>

            <div className="h-[300px] w-full px-2 pt-5 pb-2 md:h-[360px] md:px-4">
                <ResponsiveContainer width="100%" height="100%">
                    {visao === "acumulado" ? (
                        <LineChart data={dados} margin={{ top: 16, right: 16, bottom: 4, left: 4 }}>
                            <CartesianGrid stroke="var(--color-border-secondary)" strokeDasharray="2 4" strokeOpacity={0.6} vertical={false} />
                            <XAxis {...eixoX} />
                            <YAxis tickFormatter={fmtY} tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }} tickLine={false} axisLine={false} width={56} />
                            <Tooltip content={<GeneroTooltip metric={metric} />} />
                            <Line type="monotone" dataKey="masc" name="Masculino" stroke={COR_M} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                            <Line type="monotone" dataKey="fem" name="Feminino" stroke={COR_F} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                        </LineChart>
                    ) : (
                        <BarChart data={dados} margin={{ top: 16, right: 16, bottom: 4, left: 4 }} barGap={2}>
                            <CartesianGrid stroke="var(--color-border-secondary)" strokeDasharray="2 4" strokeOpacity={0.6} vertical={false} />
                            <XAxis {...eixoX} />
                            <YAxis tickFormatter={fmtY} tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }} tickLine={false} axisLine={false} width={56} />
                            <Tooltip cursor={{ fill: "var(--color-bg-secondary)", opacity: 0.5 }} content={<GeneroTooltip metric={metric} />} />
                            <Bar dataKey="masc" name="Masculino" fill={COR_M} radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={14} />
                            <Bar dataKey="fem" name="Feminino" fill={COR_F} radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={14} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>

            <LegendaRodape itens={[{ cor: COR_M, label: "Masculino" }, { cor: COR_F, label: "Feminino" }]} />
        </section>
    );
}

const GeneroTooltip = ({ active, payload, label, metric }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; metric: "quantidade" | "faturamento" }) => {
    if (!active || !payload?.length) return null;
    const fmt = (v: number) => (metric === "faturamento" ? money(v) : num(v));
    return (
        <div className="rounded-lg bg-primary-solid px-3 py-2.5 shadow-xl ring-1 ring-secondary_alt">
            <p className="mb-1 text-sm font-semibold text-white">{label}</p>
            {payload.map((p) => (
                <p key={p.name} className="text-sm text-white/70">
                    <span className="mr-1 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: p.color }} /> {p.name}: <span className="font-semibold text-white">{fmt(Number(p.value))}</span>
                </p>
            ))}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Meta diária acumulada (realizado vs meta) — meta = soma das sessões */
/* ------------------------------------------------------------------ */

export function MetaVendasCard({ dias, meta }: { dias: DiaVenda[]; meta: number }) {
    const dados = useMemo(() => {
        const n = dias.length || 1;
        const metaDiaria = meta / n;
        let acc = 0;
        return dias.map((d, i) => {
            acc += d.mascFat + d.femFat;
            return { data: d.data, realizado: acc, meta: Math.round(metaDiaria * (i + 1)) };
        });
    }, [dias, meta]);
    const realizadoFinal = dados.length ? dados[dados.length - 1].realizado : 0;
    const acimaDaMeta = realizadoFinal >= meta;
    const atingido = meta ? realizadoFinal / meta : 0;

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <header className="flex flex-col gap-3 border-b border-secondary px-5 pt-4 pb-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-md font-semibold text-primary">Meta diária acumulada</h3>
                    <p className="text-sm text-tertiary">Receita acumulada vs meta diária ({money(dias.length ? Math.round(meta / dias.length) : 0)}/dia)</p>
                </div>
                <Badge size="md" type="pill-color" color={acimaDaMeta ? "success" : "error"}>
                    {acimaDaMeta ? "Acima da meta" : "Abaixo da meta"} · {(atingido * 100).toFixed(0)}%
                </Badge>
            </header>

            <div className="h-[300px] w-full px-2 pt-5 pb-2 md:h-[360px] md:px-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dados} margin={{ top: 16, right: 16, bottom: 4, left: 4 }}>
                        <defs>
                            <linearGradient id="realizadoFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={COR_REALIZADO} stopOpacity={0.3} />
                                <stop offset="85%" stopColor={COR_REALIZADO} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--color-border-secondary)" strokeDasharray="2 4" strokeOpacity={0.6} vertical={false} />
                        <XAxis {...eixoX} />
                        <YAxis tickFormatter={(v) => kMoney(Number(v))} tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }} tickLine={false} axisLine={false} width={56} />
                        <Tooltip content={<MetaTooltip />} />
                        <Area type="monotone" dataKey="realizado" name="Realizado (acumulado)" stroke={COR_REALIZADO} strokeWidth={3} fill="url(#realizadoFill)" dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="meta" name="Meta diária" stroke={COR_META} strokeWidth={2} strokeDasharray="6 5" dot={false} isAnimationActive={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <LegendaRodape
                itens={[{ cor: COR_REALIZADO, label: `Realizado ${money(realizadoFinal)}` }, { cor: COR_META, label: "Meta diária", traco: true }]}
                direita={
                    <span>
                        Meta do evento: <span className="font-semibold text-secondary">{money(meta)}</span>
                    </span>
                }
            />
        </section>
    );
}

const MetaTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg bg-primary-solid px-3 py-2.5 shadow-xl ring-1 ring-secondary_alt">
            <p className="mb-1 text-sm font-semibold text-white">{label}</p>
            {payload.map((p) => (
                <p key={p.name} className="text-sm text-white/70">
                    <span className="mr-1 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: p.color }} /> {p.name}: <span className="font-semibold text-white">{money(Number(p.value))}</span>
                </p>
            ))}
        </div>
    );
};
