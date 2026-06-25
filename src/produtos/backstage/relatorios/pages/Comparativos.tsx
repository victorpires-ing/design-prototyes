import { Fragment, useMemo, useState } from "react";
import { BarChartSquare02, Calendar, Check, CurrencyDollarCircle, Receipt, Rocket02, Sliders02, Ticket01, TrendUp01, Trophy01, XClose } from "@untitledui/icons";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import type { Key } from "react-aria-components";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Select } from "@/components/base/select/select";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { SortableHeader } from "../components/SortableHeader";
import { useSortableTable } from "../utils/useSortableTable";
import { currencyFormatter, numberFormatter, parseEventDate } from "../data/event";
import bStbSp26 from "@/assets/event-cover.png";
import bStbSp25 from "@/assets/gremio-poster-pacotes.jpeg";
import bTwb26 from "@/assets/gremio-poster-tour.jpeg";
import bTwb25 from "@/assets/gremio-poster-taca.jpeg";
import bCena from "@/assets/gremio-poster-book.jpeg";
import bSolomun from "@/assets/gremio-hero.webp";

/* ------------------------------------------------------------------ */
/*  Mock — edições de eventos (vários anos por evento)                */
/* ------------------------------------------------------------------ */

interface DiaSerie {
    vendas: number; // bruto do dia
    ingressos: number;
    transacoes: number;
}

interface EventoComparativo {
    id: string;
    nome: string;
    curto: string;
    ano: number;
    cor: string;
    banner: string;
    dataAbertura: string;
    dataEvento: string;
    capacidade: number;
    janelaDias: number;
    taxaPct: number; // taxa retida (bruto → líquido)
    serie: DiaSerie[];
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

interface Peak {
    center: number;
    width: number;
    height: number;
}

function buildSerie(janelaDias: number, totalIngressos: number, ticketBase: number, seed: number, peaks: Peak[]): DiaSerie[] {
    const rng = mulberry32(seed);
    const N = janelaDias;
    const pesos: number[] = [];
    for (let d = 0; d < N; d++) {
        const prox = N === 1 ? 1 : d / (N - 1);
        let w = Math.exp(-d / 6) * 4.5 + Math.pow(prox, 3) * 4 + 0.8;
        for (const p of peaks) w += p.height * Math.exp(-((prox - p.center) ** 2) / (2 * p.width * p.width));
        if (d === N - 1) w += 7;
        if (d === N - 2) w += 3;
        w *= 0.88 + 0.24 * rng();
        pesos.push(Math.max(0.05, w));
    }
    const soma = pesos.reduce((s, x) => s + x, 0) || 1;
    return pesos.map((w, d) => {
        const prox = N === 1 ? 1 : d / (N - 1);
        const ingressos = Math.round((totalIngressos * w) / soma);
        const ticket = ticketBase * (0.8 + 0.45 * prox);
        return { vendas: Math.round(ingressos * ticket), ingressos, transacoes: Math.max(ingressos > 0 ? 1 : 0, Math.round(ingressos / (1.2 + 0.5 * rng()))) };
    });
}

const PALETTE = [
    "var(--color-utility-brand-600)",
    "var(--color-utility-blue-500)",
    "var(--color-utility-green-500)",
    "var(--color-utility-orange-500)",
    "var(--color-utility-purple-500)",
    "var(--color-utility-pink-500)",
    "var(--color-utility-indigo-500)",
    "var(--color-utility-yellow-500)",
];

const diasEntre = (a: string, b: string) => Math.round((parseEventDate(b)!.getTime() - parseEventDate(a)!.getTime()) / 86_400_000) + 1;

interface EdicaoSpec {
    id: string;
    nome: string;
    curto: string;
    ano: number;
    banner: string;
    abertura: string;
    evento: string;
    capacidade: number;
    ingressos: number;
    ticket: number;
    taxaPct: number;
    seed: number;
    peaks: Peak[];
}

const SPECS: EdicaoSpec[] = [
    { id: "stb-sp-2026", nome: "Só Track Boa Festival 2026 :: São Paulo", curto: "STB SP 26", ano: 2026, banner: bStbSp26, abertura: "15/12/2025", evento: "18/04/2026", capacidade: 55000, ingressos: 50284, ticket: 396, taxaPct: 0.0001, seed: 14, peaks: [{ center: 0.4, width: 0.04, height: 12 }, { center: 0.8, width: 0.05, height: 7 }] },
    { id: "stb-sp-2025", nome: "Só Track Boa Festival São Paulo 2025", curto: "STB SP 25", ano: 2025, banner: bStbSp25, abertura: "18/12/2024", evento: "19/04/2025", capacidade: 62000, ingressos: 56809, ticket: 320, taxaPct: 0.004, seed: 13, peaks: [{ center: 0.42, width: 0.045, height: 11 }, { center: 0.82, width: 0.05, height: 7 }] },
    { id: "twb-2026", nome: "TIME WARP BRASIL 2026", curto: "TWB 26", ano: 2026, banner: bTwb26, abertura: "12/06/2026", evento: "10/10/2026", capacidade: 18000, ingressos: 15654, ticket: 405, taxaPct: 0.0005, seed: 34, peaks: [{ center: 0.5, width: 0.04, height: 11 }, { center: 0.85, width: 0.05, height: 6 }] },
    { id: "twb-2025", nome: "TIME WARP BRASIL 2025", curto: "TWB 25", ano: 2025, banner: bTwb25, abertura: "09/06/2025", evento: "11/10/2025", capacidade: 22000, ingressos: 18867, ticket: 314, taxaPct: 0.027, seed: 33, peaks: [{ center: 0.52, width: 0.045, height: 10 }, { center: 0.84, width: 0.05, height: 6 }] },
    { id: "cena-2022", nome: "Festival CENA 2K22", curto: "CENA 22", ano: 2022, banner: bCena, abertura: "01/03/2022", evento: "09/07/2022", capacidade: 14000, ingressos: 9800, ticket: 150, taxaPct: 0, seed: 41, peaks: [{ center: 0.5, width: 0.06, height: 8 }] },
    { id: "solomun-2024", nome: "SOLOMUN :: CWB 31/10", curto: "SOLOMUN 24", ano: 2024, banner: bSolomun, abertura: "01/08/2024", evento: "31/10/2024", capacidade: 13000, ingressos: 11543, ticket: 410, taxaPct: 0, seed: 51, peaks: [{ center: 0.55, width: 0.05, height: 9 }, { center: 0.88, width: 0.04, height: 6 }] },
];

const EVENTOS: EventoComparativo[] = SPECS.map((s, i) => {
    const janelaDias = diasEntre(s.abertura, s.evento);
    return {
        id: s.id,
        nome: s.nome,
        curto: s.curto,
        ano: s.ano,
        cor: PALETTE[i % PALETTE.length],
        banner: s.banner,
        dataAbertura: s.abertura,
        dataEvento: s.evento,
        capacidade: s.capacidade,
        janelaDias,
        taxaPct: s.taxaPct,
        serie: buildSerie(janelaDias, s.ingressos, s.ticket, s.seed, s.peaks),
    };
});

const EVENTOS_POR_ID = new Map(EVENTOS.map((e) => [e.id, e]));

type Metric = "faturamento" | "ingressos" | "transacoes";
type Alignment = "abertura" | "evento";
type Mode = "acumulado" | "diario";
type WindowDays = number | "all";

const METRIC_FIELD: Record<Metric, keyof DiaSerie> = { faturamento: "vendas", ingressos: "ingressos", transacoes: "transacoes" };
const METRIC_LABEL: Record<Metric, string> = { faturamento: "Faturamento líquido", ingressos: "Ingressos", transacoes: "Transações" };

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

function windowRange(ev: EventoComparativo, alignment: Alignment, windowDays: WindowDays): [number, number] {
    const last = ev.janelaDias - 1;
    if (windowDays === "all") return [0, last];
    if (alignment === "abertura") return [0, Math.min(last, windowDays - 1)];
    return [Math.max(0, ev.janelaDias - windowDays), last];
}

function seriesValues(ev: EventoComparativo, metric: Metric, mode: Mode, range: [number, number]): number[] {
    const field = METRIC_FIELD[metric];
    const all = ev.serie.map((s) => s[field]);
    let result: number[];
    if (mode === "diario") {
        result = all.slice(range[0], range[1] + 1);
    } else {
        const cum: number[] = [];
        let acc = 0;
        for (const v of all) {
            acc += v;
            cum.push(acc);
        }
        result = cum.slice(range[0], range[1] + 1);
    }
    if (metric === "faturamento") return result.map((v) => v * (1 - ev.taxaPct)); // líquido
    return result;
}

interface EventoTotais {
    bruto: number;
    liquido: number;
    ingressos: number;
    transacoes: number;
    ticketMedio: number;
    pctCapacidade: number;
    picoDia: number;
}

function totaisDe(ev: EventoComparativo, range: [number, number]): EventoTotais {
    const slice = ev.serie.slice(range[0], range[1] + 1);
    const bruto = slice.reduce((s, d) => s + d.vendas, 0);
    const liquido = bruto * (1 - ev.taxaPct);
    const ingressos = slice.reduce((s, d) => s + d.ingressos, 0);
    const transacoes = slice.reduce((s, d) => s + d.transacoes, 0);
    const picoDia = slice.reduce((m, d) => Math.max(m, d.vendas), 0);
    return {
        bruto,
        liquido,
        ingressos,
        transacoes,
        ticketMedio: ingressos === 0 ? 0 : liquido / ingressos,
        pctCapacidade: ev.capacidade === 0 ? 0 : (ingressos / ev.capacidade) * 100,
        picoDia,
    };
}

const metricDestaque = (t: EventoTotais, metric: Metric) =>
    metric === "faturamento" ? currencyFormatter.format(t.liquido) : numberFormatter.format(metric === "ingressos" ? t.ingressos : t.transacoes);

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Comparativos() {
    const [selectedIds, setSelectedIds] = useState<string[]>(["stb-sp-2025", "stb-sp-2026"]);
    const [metric, setMetric] = useState<Metric>("faturamento");
    const [alignment, setAlignment] = useState<Alignment>("evento");
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
                        actions={<ComparativoControls metric={metric} onChangeMetric={setMetric} alignment={alignment} onChangeAlignment={setAlignment} windowDays={windowDays} onChangeWindow={setWindowDays} />}
                    />

                    <EventPicker selectedIds={selectedIds} onToggle={toggleEvent} />

                    {selectedEvents.length < 2 ? (
                        <EmptyState />
                    ) : (
                        <>
                            <InsightCards events={selectedEvents} />
                            <ResumoCards events={selectedEvents} metric={metric} alignment={alignment} windowDays={windowDays} />
                            <ComparativoChart events={selectedEvents} metric={metric} alignment={alignment} windowDays={windowDays} />
                            <AnoContraAnoChart events={selectedEvents} />
                            <CohortCard events={selectedEvents} metric={metric} alignment={alignment} />
                            <ComparativoTable events={selectedEvents} alignment={alignment} windowDays={windowDays} />
                        </>
                    )}
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Seletor de eventos (com busca, escala p/ muitos)                  */
/* ------------------------------------------------------------------ */

const EventPicker = ({ selectedIds, onToggle }: { selectedIds: string[]; onToggle: (id: string) => void }) => (
    <section className="flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-secondary">Eventos para comparar</span>
            <span className="text-xs text-tertiary">
                {selectedIds.length} selecionado{selectedIds.length === 1 ? "" : "s"}
            </span>
        </div>

        <ul className="flex flex-col overflow-clip rounded-lg ring-1 ring-border-secondary">
            {EVENTOS.map((ev) => {
                const selected = selectedIds.includes(ev.id);
                const t = totaisDe(ev, [0, ev.janelaDias - 1]);
                return (
                    <li key={ev.id} className="border-b border-secondary last:border-b-0">
                        <button
                            type="button"
                            onClick={() => onToggle(ev.id)}
                            aria-pressed={selected}
                            className={cx("flex w-full items-center gap-3 px-3 py-2.5 text-left transition duration-100 ease-linear hover:bg-primary_hover", selected && "bg-secondary/60")}
                        >
                            {/* [] */}
                            <span className={cx("flex size-5 shrink-0 items-center justify-center rounded-md border transition", selected ? "border-transparent bg-brand-solid text-white" : "border-primary text-transparent")}>
                                <Check className="size-3.5" aria-hidden="true" />
                            </span>
                            {/* {banner} */}
                            <img src={ev.banner} alt="" aria-hidden="true" className="size-10 shrink-0 rounded-md object-cover ring-1 ring-border-secondary" />
                            {/* nome */}
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm font-medium text-primary">{ev.nome}</span>
                                <span className="text-xs text-tertiary">Evento em {ev.dataEvento}</span>
                            </span>
                            <span className="hidden shrink-0 text-right text-xs text-tertiary tabular-nums sm:block">
                                {numberFormatter.format(t.ingressos)} ing. · {currencyFormatter.format(t.liquido)}
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    </section>
);

/* ------------------------------------------------------------------ */
/*  Controles (inline desktop / bottom sheet mobile)                  */
/* ------------------------------------------------------------------ */

interface ControlsProps {
    metric: Metric;
    onChangeMetric: (m: Metric) => void;
    alignment: Alignment;
    onChangeAlignment: (a: Alignment) => void;
    windowDays: WindowDays;
    onChangeWindow: (w: WindowDays) => void;
}

const MetricField = ({ metric, onChange, className }: { metric: Metric; onChange: (m: Metric) => void; className?: string }) => (
    <Select size="sm" aria-label="Métrica" className={className} items={METRIC_OPTIONS} selectedKey={metric} onSelectionChange={(k: Key | null) => k && onChange(String(k) as Metric)}>
        {(item: { id: Metric; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
    </Select>
);

const AlignmentField = ({ alignment, onChange, className }: { alignment: Alignment; onChange: (a: Alignment) => void; className?: string }) => (
    <ButtonGroup size="sm" selectedKeys={[alignment]} onSelectionChange={(k: Set<React.Key> | "all") => k !== "all" && onChange([...k][0] as Alignment)} className={className}>
        <ButtonGroupItem id="abertura">Após a abertura</ButtonGroupItem>
        <ButtonGroupItem id="evento">Antes do evento</ButtonGroupItem>
    </ButtonGroup>
);

const WindowField = ({ windowDays, onChange, className }: { windowDays: WindowDays; onChange: (w: WindowDays) => void; className?: string }) => (
    <Select
        size="sm"
        aria-label="Intervalo de dias"
        className={className}
        items={WINDOW_OPTIONS}
        selectedKey={windowDays === "all" ? "all" : String(windowDays)}
        onSelectionChange={(k: Key | null) => {
            if (k == null) return;
            const v = String(k);
            onChange(v === "all" ? "all" : Number(v));
        }}
    >
        {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
    </Select>
);

const SheetField = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-secondary">{label}</span>
        {children}
    </div>
);

const ComparativoControls = (props: ControlsProps) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <div className="hidden items-center gap-3 lg:flex">
                <MetricField metric={props.metric} onChange={props.onChangeMetric} className="w-40" />
                <AlignmentField alignment={props.alignment} onChange={props.onChangeAlignment} />
                <WindowField windowDays={props.windowDays} onChange={props.onChangeWindow} className="w-36" />
            </div>

            <Button size="md" color="secondary" iconLeading={Sliders02} className="lg:hidden" onClick={() => setOpen(true)}>
                Ajustar
            </Button>

            <AriaModalOverlay
                isOpen={open}
                onOpenChange={setOpen}
                isDismissable
                className={({ isEntering, isExiting }) => cx("fixed inset-0 z-50 flex items-end justify-center bg-overlay/70 backdrop-blur-[2px]", isEntering && "duration-200 ease-out animate-in fade-in", isExiting && "duration-150 ease-in animate-out fade-out")}
            >
                <AriaModal className={({ isEntering, isExiting }) => cx("w-full max-w-xl rounded-t-2xl bg-primary shadow-xl outline-hidden", isEntering && "duration-300 ease-out animate-in slide-in-from-bottom", isExiting && "duration-200 ease-in animate-out slide-out-to-bottom")}>
                    <AriaDialog className="flex flex-col gap-5 p-5 outline-hidden">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold text-primary">Ajustar comparação</h2>
                            <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={() => setOpen(false)} />
                        </div>
                        <SheetField label="Métrica">
                            <MetricField metric={props.metric} onChange={props.onChangeMetric} className="w-full" />
                        </SheetField>
                        <SheetField label="Alinhar por">
                            <AlignmentField alignment={props.alignment} onChange={props.onChangeAlignment} className="w-full" />
                        </SheetField>
                        <SheetField label="Intervalo de dias">
                            <WindowField windowDays={props.windowDays} onChange={props.onChangeWindow} className="w-full" />
                        </SheetField>
                        <Button size="lg" color="primary" onClick={() => setOpen(false)}>
                            Ver comparação
                        </Button>
                    </AriaDialog>
                </AriaModal>
            </AriaModalOverlay>
        </>
    );
};

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-primary px-6 py-16 text-center ring-1 ring-border-secondary">
        <FeaturedIcon icon={BarChartSquare02} color="gray" theme="modern" size="lg" />
        <p className="text-sm font-semibold text-primary">Selecione pelo menos dois eventos</p>
        <p className="max-w-sm text-sm text-tertiary">Escolha dois ou mais eventos (ou edições de anos diferentes) para comparar como cada um performou.</p>
    </div>
);

const janelaLabel = (alignment: Alignment, windowDays: WindowDays) =>
    windowDays === "all" ? "no período total de vendas" : alignment === "abertura" ? `nos primeiros ${windowDays} dias` : `nos últimos ${windowDays} dias antes do evento`;

/* ------------------------------------------------------------------ */
/*  Insights em linguagem simples                                     */
/* ------------------------------------------------------------------ */

const InsightCards = ({ events }: { events: EventoComparativo[] }) => {
    const stats = useMemo(
        () =>
            events.map((ev) => {
                const total = totaisDe(ev, [0, ev.janelaDias - 1]);
                // Dias até atingir metade do PRÓPRIO total de ingressos (ritmo, sem depender de capacidade).
                const metade = total.ingressos / 2;
                let cum = 0;
                let diasMetade = ev.serie.length;
                for (let d = 0; d < ev.serie.length; d++) {
                    cum += ev.serie[d].ingressos;
                    if (cum >= metade) {
                        diasMetade = d + 1;
                        break;
                    }
                }
                const ultimos15 = ev.serie.slice(Math.max(0, ev.serie.length - 15)).reduce((s, x) => s + x.ingressos, 0);
                const retaFinal = total.ingressos > 0 ? ultimos15 / total.ingressos : 0;
                return { ev, total, diasMetade, retaFinal };
            }),
        [events],
    );

    const maiorBilheteria = stats.reduce((a, b) => (b.total.liquido > a.total.liquido ? b : a));
    const maisRapido = stats.reduce((a, b) => (b.diasMetade < a.diasMetade ? b : a));
    const melhorRetaFinal = stats.reduce((a, b) => (b.retaFinal > a.retaFinal ? b : a));

    const cards = [
        { icon: Trophy01, color: "warning" as const, eyebrow: "Maior bilheteria", ev: maiorBilheteria.ev, valor: currencyFormatter.format(maiorBilheteria.total.liquido) },
        { icon: Rocket02, color: "brand" as const, eyebrow: "Vendeu mais rápido", ev: maisRapido.ev, valor: `Atingiu metade das vendas em ${maisRapido.diasMetade} dias` },
        { icon: TrendUp01, color: "success" as const, eyebrow: "Melhor reta final", ev: melhorRetaFinal.ev, valor: `${Math.round(melhorRetaFinal.retaFinal * 100)}% das vendas nos últimos 15 dias` },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {cards.map((c) => (
                <div key={c.eyebrow} className="flex items-start gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary md:p-5">
                    <FeaturedIcon icon={c.icon} color={c.color} theme="light" size="md" className="shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-xs font-medium text-tertiary">{c.eyebrow}</span>
                        <span className="flex items-center gap-1.5">
                            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: c.ev.cor }} />
                            <span className="truncate text-md font-semibold text-primary">{c.ev.nome}</span>
                        </span>
                        <span className="text-sm text-tertiary">{c.valor}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Resumo por evento                                                 */
/* ------------------------------------------------------------------ */

const ResumoCards = ({ events, metric, alignment, windowDays }: { events: EventoComparativo[]; metric: Metric; alignment: Alignment; windowDays: WindowDays }) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((ev) => {
            const t = totaisDe(ev, windowRange(ev, alignment, windowDays));
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
                        <p className="text-2xl font-semibold text-primary tabular-nums">{metricDestaque(t, metric)}</p>
                        <p className="text-xs text-tertiary">
                            {METRIC_LABEL[metric]} {janelaLabel(alignment, windowDays)}
                        </p>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-secondary pt-4">
                        <Stat label="Valor líquido" value={currencyFormatter.format(t.liquido)} />
                        <Stat label="Valor bruto" value={currencyFormatter.format(t.bruto)} />
                        <Stat label="Ingressos" value={numberFormatter.format(t.ingressos)} />
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
/*  Gráfico comparativo (tempo relativo)                              */
/* ------------------------------------------------------------------ */

const ComparativoChart = ({ events, metric, alignment, windowDays }: { events: EventoComparativo[]; metric: Metric; alignment: Alignment; windowDays: WindowDays }) => {
    const [mode, setMode] = useState<Mode>("diario");

    const { rows, xMin, xMax, lastIdxByEvent } = useMemo(() => {
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
        const rows = Array.from(rowMap.values()).sort((a, b) => a.x - b.x);
        const lastIdxByEvent: Record<string, number> = {};
        rows.forEach((r, i) => {
            for (const ev of events) if (r[ev.id] != null) lastIdxByEvent[ev.id] = i;
        });
        return { rows, xMin: min, xMax: max, lastIdxByEvent };
    }, [events, metric, alignment, mode, windowDays]);

    const formatX = (x: number) => (x === 0 ? (alignment === "abertura" ? "Abertura" : "Evento") : alignment === "abertura" ? `${x} dias` : `${Math.abs(x)} dias`);
    const formatYAxis = (v: number | string) => (metric === "faturamento" ? `R$${(Number(v) / 1000).toFixed(0)}k` : numberFormatter.format(Number(v)));
    const tooltipLabel = (label: number) =>
        alignment === "abertura"
            ? Number(label) === 0
                ? "Dia da abertura das vendas"
                : `${label} dias após a abertura`
            : Number(label) === 0
              ? "Dia do evento"
              : `${Math.abs(Number(label))} dias antes do evento`;
    const tooltipValue = (value: number | string) => fmtMetric(Number(value), metric);

    const showLabels = typeof windowDays === "number" && windowDays <= 15;
    const fmtLabel = (v: number | string) => (metric === "faturamento" ? `R$${(Number(v) / 1000).toFixed(0)}k` : numberFormatter.format(Number(v)));
    const useFill = events.length <= 2;

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
                    <h3 className="text-md font-semibold text-primary">{`${METRIC_LABEL[metric]} ${mode === "acumulado" ? "acumulado" : "por dia"}`}</h3>
                    <p className="text-sm text-tertiary">{alignment === "abertura" ? "Contado a partir do dia em que as vendas abriram" : "Contado a partir do dia do evento (0 = dia do show)"} · {janelaLabel(alignment, windowDays)}</p>
                </div>
                <ButtonGroup size="sm" selectedKeys={[mode]} onSelectionChange={(k: Set<React.Key> | "all") => k !== "all" && setMode([...k][0] as Mode)}>
                    <ButtonGroupItem id="diario">Por dia</ButtonGroupItem>
                    <ButtonGroupItem id="acumulado">Acumulado</ButtonGroupItem>
                </ButtonGroup>
            </header>

            <div className="h-[320px] w-full px-2 pt-5 pb-2 text-tertiary md:h-[420px] md:px-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rows} className="[&_.recharts-text]:text-xs" margin={{ top: 16, right: 84, bottom: 4, left: 8 }}>
                        <defs>
                            {events.map((ev) => (
                                <Fragment key={ev.id}>
                                    <linearGradient id={`vgrad-${ev.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={ev.cor} stopOpacity={0.35} />
                                        <stop offset="80%" stopColor={ev.cor} stopOpacity={0} />
                                    </linearGradient>
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
                        <ReferenceLine x={0} stroke="var(--color-border-primary)" strokeDasharray="3 3" label={{ value: alignment === "abertura" ? "Abertura" : "Evento", position: "insideTopLeft", fontSize: 10, fill: "var(--color-text-tertiary)" }} />
                        {events.map((ev) => (
                            <Area
                                key={ev.id}
                                type="monotone"
                                dataKey={ev.id}
                                name={ev.curto}
                                stroke={ev.cor}
                                strokeWidth={2.5}
                                fill={useFill ? `url(#vlines-${ev.id})` : "none"}
                                className={useFill ? "[&_.recharts-area-area]:translate-y-[6px] [&_.recharts-area-area]:[clip-path:inset(0_0_6px_0)]" : undefined}
                                dot={false}
                                connectNulls
                                isAnimationActive={false}
                                activeDot={{ r: 4, fill: "var(--color-bg-primary)", stroke: ev.cor, strokeWidth: 2 }}
                            >
                                {showLabels && <LabelList dataKey={ev.id} position="top" offset={10} fill="var(--color-text-primary)" fontSize={10} fontWeight={600} formatter={fmtLabel} />}
                                <LabelList
                                    dataKey={ev.id}
                                    content={(p: { x?: number; y?: number; index?: number }) =>
                                        p.index === lastIdxByEvent[ev.id] && p.x != null && p.y != null ? (
                                            <text x={p.x + 8} y={p.y} dy={4} fontSize={11} fontWeight={600} fill={ev.cor} textAnchor="start">
                                                {ev.curto}
                                            </text>
                                        ) : null
                                    }
                                />
                            </Area>
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
};

/* ------------------------------------------------------------------ */
/*  Ano contra Ano (faturamento líquido por mês de calendário)        */
/* ------------------------------------------------------------------ */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const AnoContraAnoChart = ({ events }: { events: EventoComparativo[] }) => {
    const rows = useMemo(() => {
        // Faturamento líquido por (evento, mês de calendário da venda) — cada evento é uma série.
        const porEvento = new Map<string, number[]>();
        for (const ev of events) {
            const inicio = parseEventDate(ev.dataAbertura)!;
            const arr = new Array(12).fill(0);
            ev.serie.forEach((s, d) => {
                const date = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + d);
                arr[date.getMonth()] += s.vendas * (1 - ev.taxaPct);
            });
            porEvento.set(ev.id, arr);
        }
        return MESES.map((mes, mi) => {
            const row: Record<string, number | string> = { mes };
            events.forEach((ev) => {
                row[ev.id] = porEvento.get(ev.id)![mi];
            });
            return row;
        });
    }, [events]);

    const ChartTooltip = ({ active, label, payload }: { active?: boolean; label?: string; payload?: { dataKey: string; value: number; color: string }[] }) => {
        if (!active || !payload || payload.length === 0) return null;
        const ordered = [...payload].filter((e) => Number(e.value) > 0).sort((a, b) => Number(b.value) - Number(a.value));
        if (ordered.length === 0) return null;
        return (
            <div className="flex flex-col gap-1.5 rounded-lg bg-primary-solid px-3 py-2.5 shadow-lg">
                <p className="text-xs font-semibold text-white capitalize">{label}</p>
                <ul className="flex flex-col gap-1">
                    {ordered.map((entry) => (
                        <li key={entry.dataKey} className="flex items-center gap-2 text-xs">
                            <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: entry.color }} />
                            <span className="text-tooltip-supporting-text">{EVENTOS_POR_ID.get(entry.dataKey)?.curto ?? entry.dataKey}</span>
                            <span className="ml-auto pl-3 font-semibold text-white tabular-nums">{currencyFormatter.format(Number(entry.value))}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <header className="flex flex-col gap-1 border-b border-secondary px-5 py-4">
                <h3 className="text-md font-semibold text-primary">Faturamento por mês</h3>
                <p className="text-sm text-tertiary">Quando, no calendário, cada evento faturou — uma cor por evento selecionado.</p>
            </header>
            <div className="h-[300px] w-full px-2 pt-5 pb-2 text-tertiary md:h-[360px] md:px-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows} className="[&_.recharts-text]:text-xs" margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                        <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />
                        <XAxis dataKey="mes" fill="currentColor" tickLine={false} axisLine={false} tickMargin={10} />
                        <YAxis tickFormatter={(v) => `R$${(Number(v) / 1_000_000).toFixed(0)}mi`} fill="currentColor" tickLine={false} axisLine={false} tickMargin={8} width={56} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-bg-secondary)", opacity: 0.5 }} />
                        {events.map((ev) => (
                            <Bar key={ev.id} dataKey={ev.id} name={ev.curto} fill={ev.cor} radius={[3, 3, 0, 0]} maxBarSize={22} isAnimationActive={false} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-secondary px-5 py-3">
                {events.map((ev) => (
                    <span key={ev.id} className="flex items-center gap-1.5 text-xs text-tertiary">
                        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: ev.cor }} />
                        {ev.curto}
                    </span>
                ))}
            </footer>
        </section>
    );
};

/* ------------------------------------------------------------------ */
/*  Cohort — evento × período                                         */
/* ------------------------------------------------------------------ */

interface CohortBucket {
    id: string;
    label: string;
    lo: number;
    hi: number;
}

const COHORT_BUCKETS_ABERTURA: CohortBucket[] = [
    { id: "b1", label: "1–7 dias", lo: 0, hi: 6 },
    { id: "b2", label: "8–14", lo: 7, hi: 13 },
    { id: "b3", label: "15–21", lo: 14, hi: 20 },
    { id: "b4", label: "22–30", lo: 21, hi: 29 },
    { id: "b5", label: "31–45", lo: 30, hi: 44 },
    { id: "b6", label: "46–60", lo: 45, hi: 59 },
    { id: "b7", label: "61–90", lo: 60, hi: 89 },
    { id: "b8", label: "91–120", lo: 90, hi: 119 },
    { id: "b9", label: "120+", lo: 120, hi: Infinity },
];

const COHORT_BUCKETS_EVENTO: CohortBucket[] = [
    { id: "e9", label: "120+ dias", lo: 120, hi: Infinity },
    { id: "e8", label: "91–120", lo: 90, hi: 119 },
    { id: "e7", label: "61–90", lo: 60, hi: 89 },
    { id: "e6", label: "46–60", lo: 45, hi: 59 },
    { id: "e5", label: "31–45", lo: 30, hi: 44 },
    { id: "e4", label: "22–30", lo: 21, hi: 29 },
    { id: "e3", label: "15–21", lo: 14, hi: 20 },
    { id: "e2", label: "8–14", lo: 7, hi: 13 },
    { id: "e1", label: "Últimos 7", lo: 0, hi: 6 },
];

interface CohortRow {
    ev: EventoComparativo;
    nome: string;
    total: number;
    values: Record<string, number>;
    maxRow: number;
    pico?: CohortBucket;
}

const cohortTotalDisplay = (row: CohortRow, metric: Metric) =>
    metric === "faturamento" ? currencyFormatter.format(row.total * (1 - row.ev.taxaPct)) : numberFormatter.format(row.total);

const CohortCard = ({ events, metric, alignment }: { events: EventoComparativo[]; metric: Metric; alignment: Alignment }) => {
    const buckets = alignment === "abertura" ? COHORT_BUCKETS_ABERTURA : COHORT_BUCKETS_EVENTO;
    const field = METRIC_FIELD[metric];

    const rows = useMemo<CohortRow[]>(
        () =>
            events.map((ev) => {
                const values: Record<string, number> = {};
                let total = 0;
                ev.serie.forEach((s, d) => {
                    total += s[field];
                    const rel = alignment === "abertura" ? d : ev.janelaDias - 1 - d;
                    const b = buckets.find((b) => rel >= b.lo && rel <= b.hi);
                    if (b) values[b.id] = (values[b.id] ?? 0) + s[field];
                });
                let maxRow = 0;
                let pico: CohortBucket | undefined;
                buckets.forEach((b) => {
                    const v = values[b.id] ?? 0;
                    if (v > maxRow) {
                        maxRow = v;
                        pico = b;
                    }
                });
                return { ev, nome: ev.nome, total, values, maxRow, pico };
            }),
        [events, buckets, field, alignment],
    );

    const accessors = useMemo(() => {
        const acc: Record<string, (r: CohortRow) => string | number> = { nome: (r) => r.nome, total: (r) => r.total };
        buckets.forEach((b) => {
            acc[b.id] = (r) => r.values[b.id] ?? 0;
        });
        return acc;
    }, [buckets]);

    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(rows as unknown as Record<string, unknown>[], accessors as Partial<Record<string, (r: Record<string, unknown>) => string | number>>, { key: "total", dir: "desc" });
    const sortedRows = sorted as unknown as CohortRow[];

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <header className="flex flex-col gap-1 border-b border-secondary px-4 py-4">
                <h3 className="text-md font-semibold text-primary">Em que momento cada evento vendeu</h3>
                <p className="text-sm text-tertiary">% do total de cada evento por faixa {alignment === "abertura" ? "de dias após a abertura" : "de dias antes do evento"}. Cor mais forte = pico de vendas.</p>
            </header>

            <div className="hidden overflow-x-auto overflow-y-clip md:block">
                <table className="w-full border-collapse">
                    <thead className="bg-secondary">
                        <tr className="border-b border-secondary text-left">
                            <th className="sticky left-0 z-10 whitespace-nowrap bg-secondary px-4 py-3 text-xs font-semibold text-tertiary">
                                <SortableHeader label="Evento" sortKey="nome" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                            </th>
                            {buckets.map((b) => (
                                <th key={b.id} className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                                    <SortableHeader label={b.label} align="right" sortKey={b.id} activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                                </th>
                            ))}
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                                <SortableHeader label="Total" align="right" sortKey="total" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((row, i) => (
                            <tr key={row.ev.id} className={cx(i !== sortedRows.length - 1 && "border-b border-secondary")}>
                                <td className="sticky left-0 z-10 whitespace-nowrap bg-primary px-4 py-3">
                                    <span className="flex items-center gap-2">
                                        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: row.ev.cor }} />
                                        <span className="text-sm font-medium text-primary">{row.ev.curto}</span>
                                    </span>
                                </td>
                                {buckets.map((b) => {
                                    const has = b.id in row.values;
                                    const v = row.values[b.id] ?? 0;
                                    const pct = row.total > 0 ? v / row.total : 0;
                                    const intensity = row.maxRow > 0 ? v / row.maxRow : 0;
                                    return (
                                        <td
                                            key={b.id}
                                            className={cx("px-4 py-3 text-right text-sm tabular-nums", intensity > 0.55 ? "font-semibold text-white" : "text-primary")}
                                            style={has ? { backgroundColor: `color-mix(in srgb, ${row.ev.cor} ${Math.round((0.08 + 0.78 * intensity) * 100)}%, transparent)` } : undefined}
                                        >
                                            {has ? `${Math.round(pct * 100)}%` : "—"}
                                        </td>
                                    );
                                })}
                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-primary tabular-nums">{cohortTotalDisplay(row, metric)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ul className="flex flex-col divide-y divide-secondary md:hidden">
                {sortedRows.map((row) => (
                    <li key={row.ev.id} className="flex flex-col gap-3 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="flex min-w-0 items-center gap-2">
                                <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: row.ev.cor }} />
                                <span className="truncate text-sm font-medium text-primary">{row.ev.nome}</span>
                            </span>
                            <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{cohortTotalDisplay(row, metric)}</span>
                        </div>
                        <div className="flex h-16 items-end gap-1">
                            {buckets.map((b) => {
                                const v = row.values[b.id] ?? 0;
                                const intensity = row.maxRow > 0 ? v / row.maxRow : 0;
                                return (
                                    <span
                                        key={b.id}
                                        className="flex-1 rounded-t-sm"
                                        style={{ height: `${Math.max(v > 0 ? 8 : 2, intensity * 100)}%`, backgroundColor: v > 0 ? `color-mix(in srgb, ${row.ev.cor} ${Math.round((0.35 + 0.65 * intensity) * 100)}%, transparent)` : "var(--color-bg-quaternary)" }}
                                    />
                                );
                            })}
                        </div>
                        <span className="text-xs text-tertiary">
                            {row.pico ? (
                                <>
                                    Pico: <span className="font-medium text-secondary">{row.pico.label}</span> {alignment === "abertura" ? "após a abertura" : "antes do evento"} ({Math.round(((row.values[row.pico.id] ?? 0) / (row.total || 1)) * 100)}% das vendas)
                                </>
                            ) : (
                                "Sem dados"
                            )}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
};

/* ------------------------------------------------------------------ */
/*  Tabela comparativa (métrica × evento)                             */
/* ------------------------------------------------------------------ */

const ComparativoTable = ({ events, alignment, windowDays }: { events: EventoComparativo[]; alignment: Alignment; windowDays: WindowDays }) => {
    const totais = events.map((ev) => ({ ev, t: totaisDe(ev, windowRange(ev, alignment, windowDays)) }));
    const linhas: { label: string; icon: typeof CurrencyDollarCircle; render: (x: { ev: EventoComparativo; t: EventoTotais }) => string }[] = [
        { label: "Valor líquido", icon: CurrencyDollarCircle, render: ({ t }) => currencyFormatter.format(t.liquido) },
        { label: "Valor bruto", icon: CurrencyDollarCircle, render: ({ t }) => currencyFormatter.format(t.bruto) },
        { label: "Ingressos vendidos", icon: Ticket01, render: ({ t }) => numberFormatter.format(t.ingressos) },
        { label: "Transações", icon: Receipt, render: ({ t }) => numberFormatter.format(t.transacoes) },
        { label: "Ticket médio", icon: Receipt, render: ({ t }) => currencyFormatter.format(t.ticketMedio) },
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
                            <th className="sticky left-0 z-10 bg-secondary px-4 py-3 text-xs font-semibold text-tertiary">Métrica</th>
                            {totais.map(({ ev }) => (
                                <th key={ev.id} className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: ev.cor }} />
                                        {ev.curto}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.map((linha, i) => (
                            <tr key={linha.label} className={cx(i !== linhas.length - 1 && "border-b border-secondary")}>
                                <td className="sticky left-0 z-10 whitespace-nowrap bg-primary px-4 py-3.5 text-sm text-secondary">
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
