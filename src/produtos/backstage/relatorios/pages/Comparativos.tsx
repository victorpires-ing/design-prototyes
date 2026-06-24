import { Fragment, useMemo, useState } from "react";
import { BarChartSquare02, Calendar, Check, CurrencyDollarCircle, Receipt, Ticket01 } from "@untitledui/icons";
import { Area, AreaChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Select } from "@/components/base/select/select";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import type { Key } from "react-aria-components";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { currencyFormatter, numberFormatter } from "../data/event";
import bannerBahia from "@/assets/event-cover.png";
import bannerSertanejo from "@/assets/gremio-poster-pacotes.jpeg";
import bannerInternacional from "@/assets/gremio-poster-tour.jpeg";
import bannerStandup from "@/assets/gremio-poster-book.jpeg";

/* ------------------------------------------------------------------ */
/*  Mock — eventos para comparar                                      */
/*  Cada evento tem uma janela de vendas própria (abertura → evento). */
/*  A comparação usa o tempo RELATIVO (dias após a abertura ou dias   */
/*  antes do evento), então eventos com datas diferentes se alinham.  */
/* ------------------------------------------------------------------ */

interface DiaSerie {
    vendas: number;
    ingressos: number;
    transacoes: number;
}

interface EventoComparativo {
    id: string;
    nome: string;
    cor: string;
    banner: string;
    dataAbertura: string;
    dataEvento: string;
    capacidade: number;
    janelaDias: number;
    serie: DiaSerie[]; // index 0 = dia da abertura; último = dia do evento
}

function mulberry32(seed: number) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Curva diária: pico no lançamento, vale no meio, rampa em direção ao
// evento e novo pico na véspera/dia do evento. Preço sobe com os lotes.
function buildSerie(janelaDias: number, totalIngressos: number, ticketBase: number, seed: number): DiaSerie[] {
    const rng = mulberry32(seed);
    const N = janelaDias;
    const pesos: number[] = [];
    for (let d = 0; d < N; d++) {
        const prox = N === 1 ? 1 : d / (N - 1);
        const lancamento = Math.exp(-d / 4) * 6;
        const rampa = Math.pow(prox, 3) * 8;
        let w = lancamento + rampa + 1;
        if (d === N - 1) w += 10;
        if (d === N - 2) w += 4;
        w *= 0.85 + 0.3 * rng();
        pesos.push(w);
    }
    const soma = pesos.reduce((s, x) => s + x, 0) || 1;
    return pesos.map((w, d) => {
        const prox = N === 1 ? 1 : d / (N - 1);
        const ingressos = Math.round((totalIngressos * w) / soma);
        const ticket = ticketBase * (0.8 + 0.5 * prox);
        const vendas = Math.round(ingressos * ticket);
        const transacoes = Math.max(ingressos > 0 ? 1 : 0, Math.round(ingressos / (1.2 + 0.5 * rng())));
        return { vendas, ingressos, transacoes };
    });
}

const EVENTOS: EventoComparativo[] = [
    { id: "bahia-vitoria", nome: "Bahia x Vitória", cor: "var(--color-utility-brand-600)", banner: bannerBahia, dataAbertura: "01/02/2026", dataEvento: "15/06/2026", capacidade: 37000, janelaDias: 135, serie: buildSerie(135, 31200, 92, 101) },
    { id: "sertanejo", nome: "Festival Sertanejo 2026", cor: "var(--color-utility-blue-500)", banner: bannerSertanejo, dataAbertura: "10/03/2026", dataEvento: "08/06/2026", capacidade: 25000, janelaDias: 90, serie: buildSerie(90, 21800, 178, 202) },
    { id: "internacional", nome: "Show Internacional", cor: "var(--color-utility-green-500)", banner: bannerInternacional, dataAbertura: "20/11/2025", dataEvento: "30/05/2026", capacidade: 45000, janelaDias: 191, serie: buildSerie(191, 40100, 318, 303) },
    { id: "standup", nome: "Stand-up Comedy Tour", cor: "var(--color-utility-orange-500)", banner: bannerStandup, dataAbertura: "01/05/2026", dataEvento: "14/06/2026", capacidade: 4000, janelaDias: 45, serie: buildSerie(45, 3820, 124, 404) },
];

const EVENTOS_POR_ID = new Map(EVENTOS.map((e) => [e.id, e]));

type Metric = "faturamento" | "ingressos" | "transacoes";
type Alignment = "abertura" | "evento";
type Mode = "acumulado" | "diario";
type WindowDays = number | "all";

const METRIC_FIELD: Record<Metric, keyof DiaSerie> = { faturamento: "vendas", ingressos: "ingressos", transacoes: "transacoes" };
const METRIC_LABEL: Record<Metric, string> = { faturamento: "Faturamento", ingressos: "Ingressos", transacoes: "Transações" };

const WINDOW_OPTIONS: { id: string; label: string }[] = [
    { id: "7", label: "7 dias" },
    { id: "15", label: "15 dias" },
    { id: "30", label: "30 dias" },
    { id: "60", label: "60 dias" },
    { id: "90", label: "90 dias" },
    { id: "all", label: "Todo o período" },
];

const METRIC_OPTIONS: { id: Metric; label: string }[] = [
    { id: "faturamento", label: "Faturamento" },
    { id: "ingressos", label: "Ingressos" },
    { id: "transacoes", label: "Transações" },
];

const fmtMetric = (v: number, metric: Metric) => (metric === "faturamento" ? currencyFormatter.format(v) : numberFormatter.format(v));

/** Faixa de índices [start, end] da série conforme alinhamento + janela. */
function windowRange(ev: EventoComparativo, alignment: Alignment, windowDays: WindowDays): [number, number] {
    const last = ev.janelaDias - 1;
    if (windowDays === "all") return [0, last];
    if (alignment === "abertura") return [0, Math.min(last, windowDays - 1)]; // primeiros N dias
    return [Math.max(0, ev.janelaDias - windowDays), last]; // últimos N dias antes do evento
}

/**
 * Valores da janela no modo escolhido.
 * - diário: valor de cada dia dentro da janela.
 * - acumulado: total corrido DESDE A ABERTURA (não reinicia na janela), recortado
 *   para a janela — então "últimos N dias" já começa com o que foi acumulado antes.
 */
function seriesValues(ev: EventoComparativo, metric: Metric, mode: Mode, range: [number, number]): number[] {
    const field = METRIC_FIELD[metric];
    const all = ev.serie.map((s) => s[field]);
    if (mode === "diario") return all.slice(range[0], range[1] + 1);
    const cum: number[] = [];
    let acc = 0;
    for (const v of all) {
        acc += v;
        cum.push(acc);
    }
    return cum.slice(range[0], range[1] + 1);
}

interface EventoTotais {
    faturamento: number;
    ingressos: number;
    transacoes: number;
    ticketMedio: number;
    pctCapacidade: number;
    picoDia: number;
}

function totaisDe(ev: EventoComparativo, range: [number, number]): EventoTotais {
    const slice = ev.serie.slice(range[0], range[1] + 1);
    const faturamento = slice.reduce((s, d) => s + d.vendas, 0);
    const ingressos = slice.reduce((s, d) => s + d.ingressos, 0);
    const transacoes = slice.reduce((s, d) => s + d.transacoes, 0);
    const picoDia = slice.reduce((m, d) => Math.max(m, d.vendas), 0);
    return {
        faturamento,
        ingressos,
        transacoes,
        ticketMedio: ingressos === 0 ? 0 : faturamento / ingressos,
        pctCapacidade: ev.capacidade === 0 ? 0 : (ingressos / ev.capacidade) * 100,
        picoDia,
    };
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Comparativos() {
    const [selectedIds, setSelectedIds] = useState<string[]>(["bahia-vitoria", "sertanejo"]);
    const [metric, setMetric] = useState<Metric>("faturamento");
    const [alignment, setAlignment] = useState<Alignment>("abertura");
    const [windowDays, setWindowDays] = useState<WindowDays>("all");

    const selectedEvents = useMemo(() => selectedIds.map((id) => EVENTOS_POR_ID.get(id)).filter(Boolean) as EventoComparativo[], [selectedIds]);

    const toggleEvent = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    return (
        <BackstageLayout activeSection="relatorios" activeItem="comparativos">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    <RelatorioPageHeader
                        title="Comparativos"
                        withFilters={false}
                        actions={
                            <ComparativoToolbar
                                metric={metric}
                                onChangeMetric={setMetric}
                                alignment={alignment}
                                onChangeAlignment={setAlignment}
                                windowDays={windowDays}
                                onChangeWindow={setWindowDays}
                            />
                        }
                    />

                    <EventPicker selectedIds={selectedIds} onToggle={toggleEvent} />

                    {selectedEvents.length < 2 ? (
                        <EmptyState />
                    ) : (
                        <>
                            <ResumoCards events={selectedEvents} metric={metric} alignment={alignment} windowDays={windowDays} />
                            <ComparativoChart events={selectedEvents} metric={metric} alignment={alignment} windowDays={windowDays} />
                            <ComparativoTable events={selectedEvents} alignment={alignment} windowDays={windowDays} />
                        </>
                    )}
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Seletor visual de eventos                                         */
/* ------------------------------------------------------------------ */

const EventPicker = ({ selectedIds, onToggle }: { selectedIds: string[]; onToggle: (id: string) => void }) => (
    <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-secondary">Eventos para comparar</span>
            <span className="text-xs text-tertiary">{selectedIds.length} selecionado{selectedIds.length === 1 ? "" : "s"}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {EVENTOS.map((ev) => {
                const selected = selectedIds.includes(ev.id);
                const t = totaisDe(ev, [0, ev.janelaDias - 1]);
                return (
                    <button
                        key={ev.id}
                        type="button"
                        onClick={() => onToggle(ev.id)}
                        aria-pressed={selected}
                        className={cx(
                            "group flex flex-col overflow-clip rounded-xl text-left transition duration-100 ease-linear",
                            selected ? "ring-2 ring-brand" : "ring-1 ring-border-secondary hover:ring-brand/40",
                        )}
                    >
                        {/* Banner */}
                        <div className="relative h-24 w-full overflow-hidden">
                            <img src={ev.banner} alt="" aria-hidden="true" className={cx("size-full object-cover transition duration-100", !selected && "opacity-90 group-hover:opacity-100")} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
                            <span className="absolute inset-x-3 bottom-2 flex items-center gap-2">
                                <span className="size-2.5 shrink-0 rounded-full ring-2 ring-white/40" style={{ backgroundColor: ev.cor }} />
                                <span className="truncate text-sm font-semibold text-white">{ev.nome}</span>
                            </span>
                            <span
                                className={cx(
                                    "absolute right-2 top-2 flex size-6 items-center justify-center rounded-full border shadow-sm transition",
                                    selected ? "border-transparent bg-brand-solid text-white" : "border-white/60 bg-black/30 text-transparent backdrop-blur-sm",
                                )}
                            >
                                <Check className="size-3.5" aria-hidden="true" />
                            </span>
                        </div>
                        {/* Info */}
                        <div className={cx("flex flex-col gap-0.5 p-3", selected ? "bg-secondary" : "bg-primary")}>
                            <span className="text-xs text-tertiary">Evento em {ev.dataEvento} · {ev.janelaDias} dias de venda</span>
                            <span className="text-sm font-medium text-secondary tabular-nums">
                                {numberFormatter.format(t.ingressos)} ingressos · {currencyFormatter.format(t.faturamento)}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    </section>
);

/* ------------------------------------------------------------------ */
/*  Barra de controles                                                */
/* ------------------------------------------------------------------ */

interface ComparativoToolbarProps {
    metric: Metric;
    onChangeMetric: (m: Metric) => void;
    alignment: Alignment;
    onChangeAlignment: (a: Alignment) => void;
    windowDays: WindowDays;
    onChangeWindow: (w: WindowDays) => void;
}

const ComparativoToolbar = ({ metric, onChangeMetric, alignment, onChangeAlignment, windowDays, onChangeWindow }: ComparativoToolbarProps) => (
    <>
        <Select
            size="sm"
            aria-label="Métrica"
            className="w-40"
            items={METRIC_OPTIONS}
            selectedKey={metric}
            onSelectionChange={(k: Key | null) => k && onChangeMetric(String(k) as Metric)}
        >
            {(item: { id: Metric; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
        </Select>

        <ButtonGroup size="sm" selectedKeys={[alignment]} onSelectionChange={(k: Set<React.Key> | "all") => k !== "all" && onChangeAlignment([...k][0] as Alignment)}>
            <ButtonGroupItem id="abertura">Após a abertura</ButtonGroupItem>
            <ButtonGroupItem id="evento">Antes do evento</ButtonGroupItem>
        </ButtonGroup>

        <Select
            size="sm"
            aria-label="Intervalo de dias"
            className="w-36"
            items={WINDOW_OPTIONS}
            selectedKey={windowDays === "all" ? "all" : String(windowDays)}
            onSelectionChange={(k: Key | null) => {
                if (k == null) return;
                const v = String(k);
                onChangeWindow(v === "all" ? "all" : Number(v));
            }}
        >
            {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
        </Select>
    </>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-primary px-6 py-16 text-center ring-1 ring-border-secondary">
        <FeaturedIcon icon={BarChartSquare02} color="gray" theme="modern" size="lg" />
        <p className="text-sm font-semibold text-primary">Selecione pelo menos dois eventos</p>
        <p className="max-w-sm text-sm text-tertiary">Escolha dois ou mais eventos acima para comparar a evolução das vendas e transações no tempo relativo.</p>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Rótulo da janela                                                  */
/* ------------------------------------------------------------------ */

const janelaLabel = (alignment: Alignment, windowDays: WindowDays) =>
    windowDays === "all" ? "no período total de vendas" : alignment === "abertura" ? `nos primeiros ${windowDays} dias` : `nos últimos ${windowDays} dias antes do evento`;

/* ------------------------------------------------------------------ */
/*  Resumo por evento                                                 */
/* ------------------------------------------------------------------ */

const ResumoCards = ({ events, metric, alignment, windowDays }: { events: EventoComparativo[]; metric: Metric; alignment: Alignment; windowDays: WindowDays }) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((ev) => {
            const t = totaisDe(ev, windowRange(ev, alignment, windowDays));
            const destaque = metric === "faturamento" ? currencyFormatter.format(t.faturamento) : metric === "ingressos" ? numberFormatter.format(t.ingressos) : numberFormatter.format(t.transacoes);
            return (
                <div key={ev.id} className="flex flex-col gap-4 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
                    <div className="flex items-start gap-3">
                        <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: ev.cor }} />
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-semibold text-primary">{ev.nome}</span>
                            <span className="text-xs text-tertiary">Evento em {ev.dataEvento}</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-semibold text-primary tabular-nums">{destaque}</p>
                        <p className="text-xs text-tertiary">
                            {METRIC_LABEL[metric]} {janelaLabel(alignment, windowDays)}
                        </p>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-secondary pt-4">
                        <Stat label="Faturamento" value={currencyFormatter.format(t.faturamento)} />
                        <Stat label="Ingressos" value={`${numberFormatter.format(t.ingressos)} · ${Math.round(t.pctCapacidade)}%`} />
                        <Stat label="Transações" value={numberFormatter.format(t.transacoes)} />
                        <Stat label="Ticket médio" value={currencyFormatter.format(t.ticketMedio)} />
                    </dl>
                </div>
            );
        })}
    </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5">
        <dt className="text-xs text-tertiary">{label}</dt>
        <dd className="text-sm font-medium text-primary tabular-nums">{value}</dd>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Gráfico comparativo                                               */
/* ------------------------------------------------------------------ */

const ComparativoChart = ({ events, metric, alignment, windowDays }: { events: EventoComparativo[]; metric: Metric; alignment: Alignment; windowDays: WindowDays }) => {
    const [mode, setMode] = useState<Mode>("acumulado");
    const { rows, xMin, xMax } = useMemo(() => {
        const rowMap = new Map<number, Record<string, number>>();
        let min = 0;
        let max = 0;
        for (const ev of events) {
            const range = windowRange(ev, alignment, windowDays);
            const vals = seriesValues(ev, metric, mode, range);
            vals.forEach((v, j) => {
                const dayFromOpen = range[0] + j;
                const x = alignment === "abertura" ? dayFromOpen : dayFromOpen - (ev.janelaDias - 1);
                min = Math.min(min, x);
                max = Math.max(max, x);
                const row = rowMap.get(x) ?? { x };
                row[ev.id] = v;
                rowMap.set(x, row);
            });
        }
        return { rows: Array.from(rowMap.values()).sort((a, b) => a.x - b.x), xMin: min, xMax: max };
    }, [events, metric, alignment, mode, windowDays]);

    const formatX = (x: number) => {
        if (x === 0) return alignment === "abertura" ? "Abertura" : "Evento";
        return alignment === "abertura" ? `+${x}d` : `${x}d`;
    };
    const formatYAxis = (v: number | string) => (metric === "faturamento" ? `R$${(Number(v) / 1000).toFixed(0)}k` : numberFormatter.format(Number(v)));
    const tooltipLabel = (label: number) =>
        alignment === "abertura"
            ? Number(label) === 0
                ? "Dia da abertura"
                : `Dia +${label} após a abertura`
            : Number(label) === 0
              ? "Dia do evento"
              : `${Math.abs(Number(label))} dias antes do evento`;
    const tooltipValue = (value: number | string) => fmtMetric(Number(value), metric);

    // Rótulos nos pontos só fazem sentido com poucos dias (até 15) — senão poluem.
    const showLabels = typeof windowDays === "number" && windowDays <= 15;
    const fmtLabel = (v: number | string) => (metric === "faturamento" ? `R$${(Number(v) / 1000).toFixed(0)}k` : numberFormatter.format(Number(v)));

    const ChartTooltip = ({ active, label, payload }: { active?: boolean; label?: number; payload?: { dataKey: string; name: string; value: number; color: string }[] }) => {
        if (!active || !payload || payload.length === 0) return null;
        const ordered = [...payload].sort((a, b) => Number(b.value) - Number(a.value));
        return (
            <div className="flex flex-col gap-1.5 rounded-lg bg-primary-solid px-3 py-2.5 shadow-lg">
                <p className="text-xs font-semibold text-white">{tooltipLabel(Number(label))}</p>
                <ul className="flex flex-col gap-1">
                    {ordered.map((entry) => (
                        <li key={entry.dataKey} className="flex items-center gap-2 text-xs">
                            <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: entry.color }} />
                            <span className="text-tooltip-supporting-text">{entry.name}</span>
                            <span className="ml-auto pl-3 font-semibold text-white tabular-nums">{tooltipValue(entry.value)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <header className="flex flex-col gap-3 border-b border-secondary px-5 py-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-md font-semibold text-primary">
                        {METRIC_LABEL[metric]} {mode === "acumulado" ? "acumulado" : "por dia"}
                    </h3>
                    <p className="text-sm text-tertiary">
                        {alignment === "abertura" ? "Alinhado pelo dia de abertura das vendas (D+0)" : "Alinhado pelo dia do evento (D-0)"} · {janelaLabel(alignment, windowDays)}
                    </p>
                </div>
                <ButtonGroup size="sm" selectedKeys={[mode]} onSelectionChange={(k: Set<React.Key> | "all") => k !== "all" && setMode([...k][0] as Mode)}>
                    <ButtonGroupItem id="acumulado">Acumulado</ButtonGroupItem>
                    <ButtonGroupItem id="diario">Diário</ButtonGroupItem>
                </ButtonGroup>
            </header>

            <div className="h-[320px] w-full px-2 pt-5 pb-2 text-tertiary md:h-[420px] md:px-4">
                <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={rows} className="[&_.recharts-text]:text-xs" margin={{ top: 16, right: 16, bottom: 4, left: 8 }}>
                            <defs>
                                {events.map((ev) => (
                                    <Fragment key={ev.id}>
                                        <linearGradient id={`vgrad-${ev.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={ev.cor} stopOpacity={0.35} />
                                            <stop offset="80%" stopColor={ev.cor} stopOpacity={0} />
                                        </linearGradient>
                                        {/* Textura de linhas verticais (estilo da referência). */}
                                        <pattern id={`vlines-${ev.id}`} width={8} height="100%" patternUnits="userSpaceOnUse">
                                            <line x1="0" y1="0" x2="0" y2="100%" stroke={ev.cor} strokeWidth={1.5} strokeOpacity={0.18} />
                                            <rect width="100%" height="100%" fill={`url(#vgrad-${ev.id})`} />
                                        </pattern>
                                    </Fragment>
                                ))}
                            </defs>
                            <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />
                            <XAxis dataKey="x" type="number" domain={[xMin, xMax]} tickFormatter={formatX} fill="currentColor" tickLine={false} axisLine={false} tickMargin={10} minTickGap={28} />
                            <YAxis tickFormatter={formatYAxis} fill="currentColor" tickLine={false} axisLine={false} tickMargin={8} width={56} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-utility-brand-600)", strokeWidth: 2 }} />
                            <ReferenceLine x={0} stroke="var(--color-border-primary)" strokeDasharray="3 3" />
                            {events.map((ev) => (
                                <Area
                                    key={ev.id}
                                    type="monotone"
                                    dataKey={ev.id}
                                    name={ev.nome}
                                    stroke={ev.cor}
                                    strokeWidth={2.5}
                                    fill={`url(#vlines-${ev.id})`}
                                    className="[&_.recharts-area-area]:translate-y-[6px] [&_.recharts-area-area]:[clip-path:inset(0_0_6px_0)]"
                                    dot={false}
                                    connectNulls
                                    isAnimationActive={false}
                                    activeDot={{ r: 4, fill: "var(--color-bg-primary)", stroke: ev.cor, strokeWidth: 2 }}
                                >
                                    {showLabels && <LabelList dataKey={ev.id} position="top" offset={10} fill="var(--color-text-primary)" fontSize={10} fontWeight={600} formatter={fmtLabel} />}
                                </Area>
                            ))}
                        </AreaChart>
                </ResponsiveContainer>
            </div>

            <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-secondary px-5 py-3">
                {events.map((ev) => (
                    <span key={ev.id} className="flex items-center gap-1.5 text-xs text-tertiary">
                        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: ev.cor }} />
                        {ev.nome}
                    </span>
                ))}
            </footer>
        </section>
    );
};

/* ------------------------------------------------------------------ */
/*  Tabela comparativa (métrica × evento)                             */
/* ------------------------------------------------------------------ */

const ComparativoTable = ({ events, alignment, windowDays }: { events: EventoComparativo[]; alignment: Alignment; windowDays: WindowDays }) => {
    const totais = events.map((ev) => ({ ev, t: totaisDe(ev, windowRange(ev, alignment, windowDays)) }));
    const linhas: { label: string; icon: typeof CurrencyDollarCircle; render: (x: { ev: EventoComparativo; t: EventoTotais }) => string }[] = [
        { label: "Faturamento", icon: CurrencyDollarCircle, render: ({ t }) => currencyFormatter.format(t.faturamento) },
        { label: "Ingressos vendidos", icon: Ticket01, render: ({ t }) => numberFormatter.format(t.ingressos) },
        { label: "% da capacidade", icon: Ticket01, render: ({ t }) => `${Math.round(t.pctCapacidade)}%` },
        { label: "Transações", icon: Receipt, render: ({ t }) => numberFormatter.format(t.transacoes) },
        { label: "Ticket médio", icon: Receipt, render: ({ t }) => currencyFormatter.format(t.ticketMedio) },
        { label: "Pico de vendas/dia", icon: CurrencyDollarCircle, render: ({ t }) => currencyFormatter.format(t.picoDia) },
        { label: "Janela de vendas", icon: Calendar, render: ({ ev }) => `${ev.janelaDias} dias` },
    ];

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <header className="flex flex-col gap-1 border-b border-secondary px-4 py-4">
                <h3 className="text-md font-semibold text-primary">Comparativo de métricas</h3>
                <p className="text-sm text-tertiary">Valores {janelaLabel(alignment, windowDays)}.</p>
            </header>
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="bg-secondary">
                        <tr className="border-b border-secondary text-left">
                            <th className="px-4 py-3 text-xs font-semibold text-tertiary">Métrica</th>
                            {totais.map(({ ev }) => (
                                <th key={ev.id} className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: ev.cor }} />
                                        {ev.nome}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.map((linha, i) => (
                            <tr key={linha.label} className={cx(i !== linhas.length - 1 && "border-b border-secondary")}>
                                <td className="whitespace-nowrap px-4 py-3.5 text-sm text-secondary">
                                    <span className="flex items-center gap-2">
                                        <linha.icon aria-hidden="true" className="size-4 shrink-0 text-fg-quaternary" />
                                        {linha.label}
                                    </span>
                                </td>
                                {totais.map((item) => (
                                    <td key={item.ev.id} className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-medium text-primary tabular-nums">
                                        {linha.render(item)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};
