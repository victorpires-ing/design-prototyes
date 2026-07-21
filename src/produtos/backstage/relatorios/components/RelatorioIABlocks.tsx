import { motion } from "motion/react";
import { Trash01 } from "@untitledui/icons";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { ProgressBarHalfCircle } from "@/components/base/progress-indicators/progress-circles";
import { cx } from "@/utils/cx";
import type { Bloco, Formato } from "../data/relatorio-ia";
import { currencyFormatter, numberFormatter } from "../data/event";

const CORES = ["var(--color-utility-brand-700)", "var(--color-utility-blue-500)", "var(--color-utility-orange-400)", "var(--color-utility-pink-500)", "var(--color-utility-green-500)", "var(--color-utility-gray-400)"];

const fmt = (v: number, f?: Formato) => (f === "moeda" ? currencyFormatter.format(v) : f === "pct" ? `${v}%` : numberFormatter.format(v));

const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <section className="flex h-full flex-col gap-3 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
        {title && <h3 className="text-md font-semibold text-primary">{title}</h3>}
        {children}
    </section>
);

const eixo = { fill: "var(--color-text-tertiary)", fontSize: 11 };

/** Quanto cada bloco (não-metric) ocupa na grade de 2 colunas: pequenos = 1, densos = 2. */
function spanClasse(b: Bloco): string {
    switch (b.tipo) {
        case "medidor":
            return ""; // gauge é compacto → 1 coluna
        case "pizza":
            return b.dados.length > 4 ? "md:col-span-2" : ""; // poucas fatias cabem em 1 coluna
        case "barras":
            return b.dados.length > 5 ? "@md:col-span-2" : ""; // ranking/comparação curta → 1 coluna
        default:
            return "@md:col-span-2"; // linha (temporal), dispersão, tabela e texto pedem largura
    }
}

export function RelatorioIABlocks({ blocos, ids, onRemover }: { blocos: Bloco[]; ids?: string[]; onRemover?: (i: number) => void }) {
    // Mantém o índice original (para remoção) ao separar metrics do restante.
    const itens = blocos.map((bloco, i) => ({ bloco, i, id: ids?.[i] ?? String(i) }));
    const metrics = itens.filter((x) => x.bloco.tipo === "metric");
    const outros = itens.filter((x) => x.bloco.tipo !== "metric");

    const item = (bloco: Bloco, i: number, id: string, className?: string) => (
        <motion.div
            key={id}
            data-block-id={id}
            layout
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className={cx("group/bloco relative h-full scroll-mt-28", className)}
        >
            {onRemover && (
                <button
                    type="button"
                    onClick={() => onRemover(i)}
                    aria-label="Remover do relatório"
                    className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg bg-primary text-fg-quaternary opacity-0 ring-1 ring-border-secondary transition duration-100 ease-linear group-hover/bloco:opacity-100 hover:text-fg-error-secondary"
                >
                    <Trash01 className="size-4" aria-hidden="true" />
                </button>
            )}
            <BlocoView bloco={bloco} />
        </motion.div>
    );

    // Uma métrica sozinha ocupa a largura toda; 2 ou 3+ se distribuem em colunas.
    const metricCols = metrics.length <= 1 ? "grid-cols-1" : metrics.length === 2 ? "grid-cols-1 @sm:grid-cols-2" : "grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-3";

    return (
        // @container: as grades se adaptam à LARGURA DO CONTAINER (chat estreito → 1 coluna; relatório largo → 2–3).
        <div className="@container flex flex-col gap-4">
            {/* Metrics agrupados no topo. */}
            {metrics.length > 0 && <div className={cx("grid items-stretch gap-4", metricCols)}>{metrics.map(({ bloco, i, id }) => item(bloco, i, id))}</div>}
            {/* Demais blocos: pequenos ocupam 1, densos ocupam 2. Lado a lado = mesma altura. */}
            {outros.length > 0 && (
                <div className="grid grid-cols-1 items-stretch gap-4 @md:grid-cols-2">{outros.map(({ bloco, i, id }) => item(bloco, i, id, spanClasse(bloco)))}</div>
            )}
        </div>
    );
}

function BlocoView({ bloco }: { bloco: Bloco }) {
    switch (bloco.tipo) {
        case "metric":
            return (
                <section className="flex h-full flex-col gap-1 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
                    <span className="text-sm text-tertiary">{bloco.titulo}</span>
                    <span className="text-display-xs font-semibold text-primary">{bloco.valor}</span>
                    {bloco.ajuda && <span className="text-sm text-tertiary">{bloco.ajuda}</span>}
                </section>
            );
        case "medidor":
            return (
                <Card title={bloco.titulo}>
                    <div className="flex flex-1 items-center gap-6">
                        <ProgressBarHalfCircle size="md" min={0} max={100} value={bloco.pct} valueFormatter={(_v: number, pct: number) => `${pct}%`} />
                        {bloco.detalhe && <span className="text-sm text-tertiary">{bloco.detalhe}</span>}
                    </div>
                </Card>
            );
        case "texto":
            return (
                <Card title={bloco.titulo}>
                    <p className="whitespace-pre-wrap text-sm text-secondary">{bloco.conteudo}</p>
                </Card>
            );
        case "barras":
            return (
                <Card title={bloco.titulo}>
                    <div className="min-h-64 w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bloco.dados} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                                <CartesianGrid stroke="var(--color-border-secondary)" strokeDasharray="2 4" vertical={false} />
                                <XAxis dataKey="nome" tick={eixo} tickLine={false} axisLine={false} interval={0} />
                                <YAxis tick={eixo} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => fmt(Number(v), bloco.formato)} />
                                <Tooltip formatter={(v) => fmt(Number(v), bloco.formato)} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border-secondary)" }} />
                                <Bar dataKey="valor" radius={[4, 4, 0, 0]} maxBarSize={48}>
                                    {bloco.dados.map((_, i) => (
                                        <Cell key={i} fill={CORES[i % CORES.length]} />
                                    ))}
                                    {bloco.dados.length <= 12 && (
                                        <LabelList dataKey="valor" position="top" fill="var(--color-text-secondary)" fontSize={11} fontWeight={600} formatter={(v: number) => fmt(Number(v), bloco.formato)} />
                                    )}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            );
        case "linha":
            return (
                <Card title={bloco.titulo}>
                    <div className="min-h-64 w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={bloco.dados} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                                <CartesianGrid stroke="var(--color-border-secondary)" strokeDasharray="2 4" vertical={false} />
                                <XAxis dataKey="nome" tick={eixo} tickLine={false} axisLine={false} />
                                <YAxis tick={eixo} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => fmt(Number(v), bloco.formato)} />
                                <Tooltip formatter={(v) => fmt(Number(v), bloco.formato)} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border-secondary)" }} />
                                <Line type="monotone" dataKey="valor" stroke="var(--color-utility-brand-600)" strokeWidth={3} dot={bloco.dados.length <= 31 ? { r: 3, fill: "var(--color-utility-brand-600)" } : false}>
                                    {bloco.dados.length <= 12 && (
                                        <LabelList dataKey="valor" position="top" fill="var(--color-text-secondary)" fontSize={11} fontWeight={600} offset={10} formatter={(v: number) => fmt(Number(v), bloco.formato)} />
                                    )}
                                </Line>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            );
        case "dispersao": {
            const xs = bloco.dados.map((p) => p.x);
            const minX = xs.length ? Math.min(...xs) : 0;
            const maxX = xs.length ? Math.max(...xs) : 0;
            const reta = [
                { x: minX, y: bloco.ajuste.a * minX + bloco.ajuste.b },
                { x: maxX, y: bloco.ajuste.a * maxX + bloco.ajuste.b },
            ];
            return (
                <Card title={bloco.titulo}>
                    <div className="min-h-64 w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                                <CartesianGrid stroke="var(--color-border-secondary)" strokeDasharray="2 4" />
                                <XAxis type="number" dataKey="x" name={bloco.rotuloX} tick={eixo} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(Number(v), bloco.formatoX)} />
                                <YAxis type="number" dataKey="y" name={bloco.rotuloY} tick={eixo} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => fmt(Number(v), bloco.formatoY)} />
                                <ZAxis range={[45, 45]} />
                                <Tooltip
                                    cursor={{ strokeDasharray: "3 3" }}
                                    formatter={(v, n) => fmt(Number(v), n === bloco.rotuloY ? bloco.formatoY : bloco.formatoX)}
                                    contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border-secondary)" }}
                                />
                                <Scatter data={bloco.dados} fill="var(--color-utility-brand-500)" fillOpacity={0.55} />
                                <Scatter data={reta} line={{ stroke: "var(--color-utility-brand-700)", strokeWidth: 2 }} shape={() => <g />} legendType="none" isAnimationActive={false} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    {bloco.ajuda && <span className="text-sm font-medium text-brand-secondary">{bloco.ajuda}</span>}
                </Card>
            );
        }
        case "pizza": {
            const total = bloco.dados.reduce((s, d) => s + d.valor, 0) || 1;
            return (
                <Card title={bloco.titulo}>
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                        <div className="h-52 w-52 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={bloco.dados} dataKey="valor" nameKey="nome" innerRadius="55%" outerRadius="100%" paddingAngle={2} stroke="none">
                                        {bloco.dados.map((_, i) => (
                                            <Cell key={i} fill={CORES[i % CORES.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => numberFormatter.format(Number(v))} contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border-secondary)" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <ul className="flex min-w-0 flex-1 flex-col gap-2">
                            {bloco.dados.map((d, i) => (
                                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="flex items-center gap-2 text-secondary">
                                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: CORES[i % CORES.length] }} />
                                        {d.nome}
                                    </span>
                                    <span className="font-semibold text-primary tabular-nums">{Math.round((d.valor / total) * 100)}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>
            );
        }
        case "tabela":
            return (
                <Card title={bloco.titulo}>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-secondary text-left">
                                    {bloco.colunas.map((c, i) => (
                                        <th key={i} className={cxTh(i)}>{c}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {bloco.linhas.map((linha, r) => (
                                    <tr key={r} className="border-b border-secondary last:border-b-0">
                                        {linha.map((cel, c) => (
                                            <td key={c} className={cxTd(c)}>{typeof cel === "number" ? numberFormatter.format(cel) : cel}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            );
        default:
            return null;
    }
}

const cxTh = (i: number) => `whitespace-nowrap px-3 py-2.5 text-sm font-semibold text-tertiary ${i === 0 ? "" : "text-right"}`;
const cxTd = (i: number) => `whitespace-nowrap px-3 py-3 text-sm ${i === 0 ? "font-medium text-primary" : "text-right text-tertiary"}`;
