import { Fragment, useMemo, useState, type ReactNode } from "react";
import { CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ClockFastForward, QrCode01, SearchLg, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Bar, CartesianGrid, Cell, ComposedChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";

/* ------------------------------------------------------------------ */
/*  Formatters                                                        */
/* ------------------------------------------------------------------ */

const numberFormatter = new Intl.NumberFormat("pt-BR");

const HIDE_TREND_AND_MENU = "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

// Árvore de 3 níveis: Setor → Ingresso → Tipo. As folhas carregam vendidos/validados;
// os pais são somatórios calculados.
interface AcessoNode {
    id: string;
    nome: string;
    vendidos?: number;
    validados?: number;
    children?: AcessoNode[];
}

const setores: AcessoNode[] = [
    {
        id: "pista",
        nome: "Pista",
        children: [
            {
                id: "pista-inteira",
                nome: "Inteira",
                children: [
                    { id: "pista-inteira-l1", nome: "1º Lote", vendidos: 450, validados: 370 },
                    { id: "pista-inteira-l2", nome: "2º Lote", vendidos: 250, validados: 190 },
                ],
            },
            {
                id: "pista-meia",
                nome: "Meia-entrada",
                children: [
                    { id: "pista-meia-l1", nome: "1º Lote", vendidos: 250, validados: 200 },
                    { id: "pista-meia-l2", nome: "2º Lote", vendidos: 150, validados: 100 },
                ],
            },
            { id: "pista-cortesia", nome: "Cortesia", vendidos: 140, validados: 91 },
        ],
    },
    {
        id: "pista-premium",
        nome: "Pista Premium",
        children: [
            {
                id: "pp-inteira",
                nome: "Inteira",
                children: [
                    { id: "pp-inteira-l1", nome: "1º Lote", vendidos: 220, validados: 190 },
                    { id: "pp-inteira-l2", nome: "2º Lote", vendidos: 140, validados: 110 },
                ],
            },
            {
                id: "pp-meia",
                nome: "Meia-entrada",
                children: [
                    { id: "pp-meia-l1", nome: "1º Lote", vendidos: 120, validados: 100 },
                    { id: "pp-meia-l2", nome: "2º Lote", vendidos: 80, validados: 60 },
                ],
            },
            { id: "pp-cortesia", nome: "Cortesia", vendidos: 52, validados: 35 },
        ],
    },
    {
        id: "camarote-a",
        nome: "Camarote A",
        children: [
            {
                id: "ca-inteira",
                nome: "Inteira",
                children: [
                    { id: "ca-inteira-l1", nome: "1º Lote", vendidos: 60, validados: 54 },
                    { id: "ca-inteira-l2", nome: "2º Lote", vendidos: 40, validados: 32 },
                ],
            },
            { id: "ca-meia", nome: "Meia-entrada", vendidos: 48, validados: 38 },
        ],
    },
    {
        id: "camarote-b",
        nome: "Camarote B",
        children: [
            { id: "cb-inteira", nome: "Inteira", vendidos: 60, validados: 52 },
            { id: "cb-meia", nome: "Meia-entrada", vendidos: 26, validados: 21 },
        ],
    },
    {
        id: "camarote-central",
        nome: "Camarote Central",
        children: [
            { id: "cc-inteira", nome: "Inteira", vendidos: 40, validados: 39 },
            { id: "cc-meia", nome: "Meia-entrada", vendidos: 14, validados: 13 },
        ],
    },
    {
        id: "mesa-vip",
        nome: "Mesa VIP",
        children: [
            { id: "mv-inteira", nome: "Inteira", vendidos: 20, validados: 20 },
            { id: "mv-cortesia", nome: "Cortesia", vendidos: 12, validados: 11 },
        ],
    },
];

const sumVendidos = (node: AcessoNode): number =>
    node.children?.length ? node.children.reduce((s, c) => s + sumVendidos(c), 0) : (node.vendidos ?? 0);
const sumValidados = (node: AcessoNode): number =>
    node.children?.length ? node.children.reduce((s, c) => s + sumValidados(c), 0) : (node.validados ?? 0);

// Check-ins por faixa de 15 min — abertura 19:00, pico às 22:00.
interface Faixa {
    hora: string;
    checkins: number;
}

const faixas: Faixa[] = [
    { hora: "19:00", checkins: 20 },
    { hora: "19:15", checkins: 35 },
    { hora: "19:30", checkins: 60 },
    { hora: "19:45", checkins: 95 },
    { hora: "20:00", checkins: 130 },
    { hora: "20:15", checkins: 150 },
    { hora: "20:30", checkins: 160 },
    { hora: "20:45", checkins: 150 },
    { hora: "21:00", checkins: 130 },
    { hora: "21:15", checkins: 110 },
    { hora: "21:30", checkins: 95 },
    { hora: "21:45", checkins: 140 },
    { hora: "22:00", checkins: 451 },
];

/* ------------------------------------------------------------------ */
/*  Derived totals                                                    */
/* ------------------------------------------------------------------ */

const TOTAL_VENDIDOS = setores.reduce((s, x) => s + sumVendidos(x), 0);
const TOTAL_VALIDADOS = setores.reduce((s, x) => s + sumValidados(x), 0);
const TOTAL_PENDENTES = TOTAL_VENDIDOS - TOTAL_VALIDADOS;

const picoFaixa = faixas.reduce((a, b) => (b.checkins > a.checkins ? b : a), faixas[0]);

const BAR_COLOR = "var(--color-brand-600)";

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Acesso() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="acesso">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    <RelatorioPageHeader title="Acesso" />

                    <MetricsRow />
                    <EntradasPorFaixaCard />
                    <ValidacaoPorSetorCard />
                    <ControleDeAcessoCard />
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Métricas                                                          */
/* ------------------------------------------------------------------ */

const MetricsRow = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricsIcon03
            icon={CheckCircle}
            title={numberFormatter.format(TOTAL_VALIDADOS)}
            subtitle="Validados"
            change={null}
            changeTrend="positive"
            actions={false}
            className={HIDE_TREND_AND_MENU}
        />
        <MetricsIcon03
            icon={ClockFastForward}
            title={numberFormatter.format(TOTAL_PENDENTES)}
            subtitle="Não validados"
            change={null}
            changeTrend="positive"
            actions={false}
            className={HIDE_TREND_AND_MENU}
        />
        <ValidacaoMetric />
    </div>
);

const ValidacaoMetric = () => {
    const pct = Math.round((TOTAL_VALIDADOS / TOTAL_VENDIDOS) * 100);
    const legendas = [
        { label: "Validado", pct, className: "bg-fg-brand-primary" },
        { label: "Não validado", pct: 100 - pct, className: "bg-quaternary" },
    ];

    return (
        <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset">
            <div className="flex h-full items-center gap-6 px-4 py-5 md:px-5">
                <ValidacaoDonut value={pct} />
                <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
                    {legendas.map((item) => (
                        <li key={item.label} className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-sm text-secondary">
                                <span className={cx("size-2.5 shrink-0 rounded-full", item.className)} />
                                {item.label}
                            </span>
                            <span className="text-sm font-semibold text-primary tabular-nums">{item.pct}%</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const ValidacaoDonut = ({ value }: { value: number }) => {
    const size = 92;
    const stroke = 12;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    style={{ stroke: "var(--color-bg-quaternary)" }}
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
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Entradas por faixa de horário                                     */
/* ------------------------------------------------------------------ */

interface ChartTooltipProps {
    active?: boolean;
    label?: string;
    payload?: { value: number | string }[];
}

const ChartTooltip = ({ active, label, payload }: ChartTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="rounded-lg bg-primary-solid px-3 py-2.5 shadow-xl ring-1 ring-secondary_alt">
            <p className="mb-1 text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-white/70">
                <span className="font-semibold text-white">{numberFormatter.format(Number(payload[0].value))}</span> check-ins
            </p>
        </div>
    );
};

const EntradasPorFaixaCard = () => (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="border-b border-secondary px-5 py-4">
            <h3 className="text-md font-semibold text-primary">Entradas por faixa de horário</h3>
        </header>

        <div className="h-[280px] w-full px-2 pt-5 pb-2 md:h-[320px] md:px-4">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={faixas} margin={{ top: 24, right: 12, bottom: 4, left: 4 }}>
                    <CartesianGrid stroke="var(--color-border-secondary)" strokeDasharray="2 4" strokeOpacity={0.6} vertical={false} />
                    <XAxis
                        dataKey="hora"
                        tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        interval="preserveStartEnd"
                        minTickGap={16}
                    />
                    <YAxis
                        tickFormatter={(v) => numberFormatter.format(Number(v))}
                        tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        width={40}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-bg-secondary)", opacity: 0.6 }} />
                    <Bar dataKey="checkins" name="Check-ins" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                        <LabelList
                            dataKey="checkins"
                            position="top"
                            offset={6}
                            fontSize={10}
                            fontWeight={600}
                            fill="var(--color-text-secondary)"
                            formatter={(v) => numberFormatter.format(Number(v))}
                        />
                        {faixas.map((f) => (
                            <Cell key={f.hora} fill={BAR_COLOR} fillOpacity={f.hora === picoFaixa.hora ? 1 : 0.32} />
                        ))}
                    </Bar>
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    </section>
);

/* ------------------------------------------------------------------ */
/*  Validação por setor                                               */
/* ------------------------------------------------------------------ */

const ValidacaoPorSetorCard = () => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const indent = (depth: number) => 16 + depth * 24;

    const toggleExpanded = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const renderNodes = (list: AcessoNode[], depth: number, parent: AcessoNode | null): ReactNode[] => {
        const out: ReactNode[] = [];

        list.forEach((node) => {
            const hasChildren = !!node.children?.length;
            const isExpanded = expanded.has(node.id);
            const vendidos = sumVendidos(node);
            const validados = sumValidados(node);

            // Coluna de %: nível 0 mostra a taxa de validação do setor; níveis filhos
            // mostram QUANTO o item representa dentro do pai (fatia destacada + label),
            // como em "Ocupação por setor".
            let bar: ReactNode;
            if (depth === 0 || !parent) {
                bar = <OccupancyBar value={validados} total={vendidos} />;
            } else {
                const parentVendidos = sumVendidos(parent);
                const parentValidados = sumValidados(parent);
                const prevValidados = list.slice(0, list.indexOf(node)).reduce((s, c) => s + sumValidados(c), 0);
                const offsetPct = parentVendidos === 0 ? 0 : (prevValidados / parentVendidos) * 100;
                const widthPct = parentVendidos === 0 ? 0 : (validados / parentVendidos) * 100;
                const filledPct = parentVendidos === 0 ? 0 : (parentValidados / parentVendidos) * 100;
                const labelPct = parentValidados === 0 ? 0 : (validados / parentValidados) * 100;
                const boundaries = list.slice(0, -1).map((_, k) => {
                    const sum = list.slice(0, k + 1).reduce((s, c) => s + sumValidados(c), 0);
                    return parentVendidos === 0 ? 0 : (sum / parentVendidos) * 100;
                });
                bar = (
                    <SegmentedOccupancyBar
                        offsetPct={offsetPct}
                        widthPct={widthPct}
                        filledPct={filledPct}
                        labelPct={labelPct}
                        boundaries={boundaries}
                    />
                );
            }

            const labelClass = depth === 0 ? "font-medium text-primary" : "text-secondary";

            out.push(
                <Fragment key={node.id}>
                    <tr
                        role={hasChildren ? "button" : undefined}
                        tabIndex={hasChildren ? 0 : undefined}
                        aria-expanded={hasChildren ? isExpanded : undefined}
                        onClick={hasChildren ? () => toggleExpanded(node.id) : undefined}
                        onKeyDown={
                            hasChildren
                                ? (e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          toggleExpanded(node.id);
                                      }
                                  }
                                : undefined
                        }
                        className={cx(
                            "border-b border-secondary transition duration-100 ease-linear",
                            depth === 0 ? "bg-primary" : "bg-secondary/60",
                            hasChildren && "cursor-pointer hover:bg-primary_hover",
                        )}
                    >
                        <td className="py-3.5 pr-4 text-sm" style={{ paddingLeft: indent(depth) }}>
                            <span className="flex items-center gap-2">
                                <ChevronDown
                                    aria-hidden="true"
                                    className={cx(
                                        "size-4 shrink-0 text-fg-quaternary transition-transform duration-150",
                                        !hasChildren && "invisible",
                                        isExpanded && "rotate-180",
                                    )}
                                />
                                <span className={cx("line-clamp-2", labelClass)}>{node.nome}</span>
                            </span>
                        </td>
                        <td className="hidden px-4 py-3.5 text-right text-sm text-tertiary md:table-cell">
                            {numberFormatter.format(vendidos)}
                        </td>
                        <td className="hidden px-4 py-3.5 text-right text-sm text-tertiary md:table-cell">
                            {numberFormatter.format(validados)}
                        </td>
                        <td className="px-4 py-3.5">{bar}</td>
                    </tr>
                    {hasChildren && isExpanded && renderNodes(node.children!, depth + 1, node)}
                </Fragment>,
            );
        });

        return out;
    };

    return (
        <Card title="Validação por setor">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full table-fixed border-collapse">
                    <colgroup>
                        <col className="w-[50%] md:w-auto" />
                        <col className="hidden md:table-column" />
                        <col className="hidden md:table-column" />
                        <col />
                    </colgroup>
                    <thead className="bg-secondary">
                        <tr className="border-b border-secondary text-left">
                            <th className="px-4 py-3 text-xs font-semibold text-tertiary">Setor · Ingresso · Tipo</th>
                            <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">Vendidos</th>
                            <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">Validados</th>
                            <th className="px-4 py-3 text-xs font-semibold text-tertiary">Taxa de validação</th>
                        </tr>
                    </thead>
                    <tbody>{renderNodes(setores, 0, null)}</tbody>
                </table>
            </div>
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
                <div className="h-full rounded-full bg-brand-solid transition-all" style={{ width: `${clamped}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right text-sm text-tertiary">{clamped}%</span>
        </div>
    );
};

interface SegmentedOccupancyBarProps {
    offsetPct: number;
    widthPct: number;
    /** Porção total validada do pai (validados / vendidos %), como contexto. */
    filledPct: number;
    /** % exibido como label — quanto este item representa do pai. */
    labelPct?: number;
    /** Guias tracejadas nas fronteiras entre os itens irmãos (% ao longo da barra). */
    boundaries?: number[];
}

const SegmentedOccupancyBar = ({ offsetPct, widthPct, filledPct, labelPct, boundaries = [] }: SegmentedOccupancyBarProps) => {
    const clampedOffset = Math.min(100, Math.max(0, offsetPct));
    const clampedWidth = Math.min(100 - clampedOffset, Math.max(0, widthPct));
    const clampedFilled = Math.min(100, Math.max(0, filledPct));
    const display = Math.round(labelPct ?? widthPct);
    return (
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <div className="relative h-2 min-w-0 flex-1 overflow-visible rounded-full bg-tertiary/90">
                {/* Validado total do pai — coral esmaecido, como contexto. */}
                <div className="absolute h-full rounded-full bg-brand-solid/30 transition-all" style={{ left: 0, width: `${clampedFilled}%` }} />
                {/* Fatia deste item — coral sólido, em destaque. */}
                <div className="absolute h-full rounded-full bg-brand-solid transition-all" style={{ left: `${clampedOffset}%`, width: `${clampedWidth}%` }} />
                {/* Guias entre os itens irmãos. */}
                {boundaries.map((b, i) => (
                    <span
                        key={i}
                        aria-hidden="true"
                        className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-primary/70"
                        style={{ left: `${Math.min(100, Math.max(0, b))}%` }}
                    />
                ))}
            </div>
            <span className="w-10 shrink-0 text-right text-sm text-tertiary">{display}%</span>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Controle de acesso — lista por portador                           */
/* ------------------------------------------------------------------ */

type StatusAcesso = "validado" | "pendente";

const ACESSO_STATUS: Record<StatusAcesso, { label: string; color: "success" | "gray" }> = {
    validado: { label: "Validado", color: "success" },
    pendente: { label: "Não validado", color: "gray" },
};

interface PortadorAcesso {
    id: string;
    portador: string;
    emailPortador: string;
    cpf: string; // apenas dígitos
    comprador: string;
    emailComprador: string;
    idTransacao: string;
    idIngresso: string;
    qrCode: string;
    sessao: string;
    canal: string;
    grupo: string;
    tipoIngresso: string;
    portao?: string;
    status: StatusAcesso;
    horario?: string;
}

/* Opções de filtro (também usadas para gerar os dados mock). */
const SESSOES = ["15/06 · 16h00 — Abertura dos portões", "15/06 · 21h00 — Show principal"];
const CANAIS = ["Online", "Bilheteria", "PDV Loja"];
const GRUPOS = ["Pista", "Pista Premium", "Camarote A", "Camarote B", "Camarote Central", "Mesa VIP"];
const TIPOS = ["Inteira", "Meia-entrada", "Cortesia"];
const PORTOES = ["Portão A", "Portão B", "Portão VIP"];

const NOMES = [
    "João Barbosa", "Mariana Lopes", "Gabriel Souza", "Rafael Silva", "Camila Rodrigues",
    "Pedro Henrique Costa", "Beatriz Carvalho", "Davi Marinho", "Vinicius Cayres", "Letícia Andrade",
    "Thiago Nogueira", "Aline Ribeiro", "Larissa Almeida", "Roberto Santos", "Fernanda Dias",
    "Lucas Pereira", "Juliana Martins", "Bruno Azevedo", "Patrícia Gomes", "Marcelo Tavares",
    "Carolina Freitas", "Eduardo Ramos", "Sofia Cardoso", "Henrique Moraes",
];
const PROVEDORES = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com"];

const pad = (n: number, len: number) => String(n).padStart(len, "0");
const pick = <T,>(arr: T[], i: number): T => arr[((i % arr.length) + arr.length) % arr.length];

// Dataset determinístico (estável entre recargas) — 247 portadores para a paginação fazer sentido.
const portadores: PortadorAcesso[] = Array.from({ length: 247 }, (_, idx) => {
    const nome = pick(NOMES, idx * 7 + (idx % 5));
    const primeiro = nome.split(" ")[0].toLowerCase();
    const ultimo = nome.split(" ").slice(-1)[0].toLowerCase();
    const email = `${primeiro}.${ultimo}${(idx % 9) + 1}@${pick(PROVEDORES, idx)}`;
    const validado = (idx * 13 + 7) % 100 < 78; // ~78% validados
    return {
        id: String(idx + 1),
        portador: nome,
        emailPortador: email,
        cpf: pad((12000000000 + idx * 83729123) % 100000000000, 11),
        comprador: nome,
        emailComprador: email,
        idTransacao: `TRX-${840192 - idx}`,
        idIngresso: `ING-${pad(451 + idx, 4)}`,
        qrCode: `QR-${pad((idx * 48271) % 100000000, 8)}`,
        sessao: pick(SESSOES, Math.floor(idx / 7) + (idx % 2)),
        canal: pick(CANAIS, idx + (idx % 3)),
        grupo: pick(GRUPOS, idx * 3 + (idx % 6)),
        tipoIngresso: pick(TIPOS, idx * 2 + (idx % 3)),
        portao: validado ? pick(PORTOES, idx) : undefined,
        status: validado ? "validado" : "pendente",
        horario: validado ? `${19 + ((idx * 3) % 4)}:${pad((idx * 7) % 60, 2)}` : undefined,
    };
});

/** Aplica a máscara 000.000.000-00 a uma string de dígitos. */
const formatCPF = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 11);
    if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
    return d;
};

/** Iniciais a partir do nome completo. */
const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Select de filtro com opção "todos" no topo. */
const FilterSelect = ({
    label,
    allLabel,
    value,
    onChange,
    options,
}: {
    label: string;
    allLabel: string;
    value: string;
    onChange: (value: string) => void;
    options: { id: string; label: string }[];
}) => (
    <Select
        aria-label={label}
        size="sm"
        selectedKey={value}
        onSelectionChange={(k: React.Key) => onChange(String(k))}
        items={[{ id: "all", label: allLabel }, ...options]}
        className="w-full sm:w-auto sm:min-w-[150px]"
    >
        {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
    </Select>
);

const PER_PAGE = 100;

const ControleDeAcessoCard = () => {
    const [search, setSearch] = useState("");
    const [fSessao, setFSessao] = useState("all");
    const [fCanal, setFCanal] = useState("all");
    const [fGrupo, setFGrupo] = useState("all");
    const [fTipo, setFTipo] = useState("all");
    const [fStatus, setFStatus] = useState("all");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<PortadorAcesso | null>(null);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        const digits = search.replace(/\D/g, "");

        return portadores.filter((p) => {
            if (fSessao !== "all" && p.sessao !== fSessao) return false;
            if (fCanal !== "all" && p.canal !== fCanal) return false;
            if (fGrupo !== "all" && p.grupo !== fGrupo) return false;
            if (fTipo !== "all" && p.tipoIngresso !== fTipo) return false;
            if (fStatus !== "all" && p.status !== fStatus) return false;
            if (term) {
                const haystack = [p.portador, p.comprador, p.idTransacao, p.idIngresso, p.qrCode, p.grupo, p.canal, p.tipoIngresso].join(" ").toLowerCase();
                const cpfMatch = digits.length > 0 && p.cpf.includes(digits);
                if (!haystack.includes(term) && !cpfMatch) return false;
            }
            return true;
        });
    }, [search, fSessao, fCanal, fGrupo, fTipo, fStatus]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const pagina = Math.min(page, totalPages);
    const pageRows = filtered.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE);

    // Reseta para a 1ª página sempre que um filtro/busca muda.
    const resetTo1 = <T,>(setter: (v: T) => void) => (v: T) => {
        setter(v);
        setPage(1);
    };

    return (
        <Card
            title={
                <>
                    Detalhes da lista de entrada
                    <Badge size="sm" color="gray" type="pill-color">
                        {numberFormatter.format(filtered.length)}
                    </Badge>
                </>
            }
        >
            {/* Toolbar: busca + filtros */}
            <div className="flex flex-col gap-3 border-b border-secondary px-4 py-3">
                <Input
                    size="sm"
                    icon={SearchLg}
                    aria-label="Buscar entradas"
                    placeholder="Buscar por nome, CPF, QR Code, ID da transação ou ingresso"
                    value={search}
                    onChange={resetTo1(setSearch)}
                    className="w-full max-w-[420px]"
                />
                <div className="flex flex-wrap gap-2">
                    <FilterSelect label="Sessão" allLabel="Todas as sessões" value={fSessao} onChange={resetTo1(setFSessao)} options={SESSOES.map((s) => ({ id: s, label: s }))} />
                    <FilterSelect label="Canal" allLabel="Todos os canais" value={fCanal} onChange={resetTo1(setFCanal)} options={CANAIS.map((s) => ({ id: s, label: s }))} />
                    <FilterSelect label="Grupo" allLabel="Todos os grupos" value={fGrupo} onChange={resetTo1(setFGrupo)} options={GRUPOS.map((s) => ({ id: s, label: s }))} />
                    <FilterSelect label="Tipo de ingresso" allLabel="Todos os tipos" value={fTipo} onChange={resetTo1(setFTipo)} options={TIPOS.map((s) => ({ id: s, label: s }))} />
                    <FilterSelect
                        label="Status"
                        allLabel="Todos os status"
                        value={fStatus}
                        onChange={resetTo1(setFStatus)}
                        options={[
                            { id: "validado", label: "Validado" },
                            { id: "pendente", label: "Não validado" },
                        ]}
                    />
                </div>
            </div>

            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="bg-secondary">
                        <tr className="border-b border-secondary text-left">
                            <th className="px-4 py-3 text-xs font-semibold text-tertiary">Portador</th>
                            <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary md:table-cell">QR Code</th>
                            <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary lg:table-cell">Grupo</th>
                            <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary xl:table-cell">Tipo</th>
                            <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary xl:table-cell">Canal</th>
                            <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary sm:table-cell">Horário de entrada</th>
                            <th className="px-4 py-3 text-xs font-semibold text-tertiary">Status</th>
                            <th className="px-4 py-3" aria-hidden="true" />
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-sm text-tertiary">
                                    Nenhuma entrada corresponde aos filtros.
                                </td>
                            </tr>
                        )}
                        {pageRows.map((p, i) => {
                            const isLast = i === pageRows.length - 1;
                            const statusMeta = ACESSO_STATUS[p.status];
                            return (
                                <tr
                                    key={p.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelected(p)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setSelected(p);
                                        }
                                    }}
                                    className={cx(
                                        "group cursor-pointer transition duration-100 ease-linear hover:bg-primary_hover",
                                        !isLast && "border-b border-secondary",
                                    )}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar size="sm" initials={getInitials(p.portador)} status={p.status === "validado" ? "online" : undefined} />
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-sm font-medium text-primary">{p.portador}</span>
                                                <span className="truncate text-xs text-tertiary tabular-nums">{formatCPF(p.cpf)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        <span className="inline-flex items-center gap-1.5 text-sm text-tertiary tabular-nums">
                                            <QrCode01 aria-hidden="true" className="size-4 shrink-0 text-fg-quaternary" />
                                            {p.qrCode}
                                        </span>
                                    </td>
                                    <td className="hidden px-4 py-3 text-sm text-tertiary lg:table-cell">{p.grupo}</td>
                                    <td className="hidden px-4 py-3 text-sm text-tertiary xl:table-cell">{p.tipoIngresso}</td>
                                    <td className="hidden px-4 py-3 text-sm text-tertiary xl:table-cell">{p.canal}</td>
                                    <td className="hidden px-4 py-3 text-sm text-secondary tabular-nums sm:table-cell">{p.horario ?? "—"}</td>
                                    <td className="px-4 py-3">
                                        <BadgeWithDot size="sm" color={statusMeta.color} type="pill-color">
                                            {statusMeta.label}
                                        </BadgeWithDot>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <ChevronRight
                                            aria-hidden="true"
                                            className="ml-auto size-5 text-fg-quaternary transition-transform duration-100 ease-linear group-hover:translate-x-0.5"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Paginação — 100 registros por página */}
            <div className="flex flex-col gap-3 border-t border-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-tertiary tabular-nums">
                    {filtered.length === 0
                        ? "0 registros"
                        : `${(pagina - 1) * PER_PAGE + 1}–${Math.min(pagina * PER_PAGE, filtered.length)} de ${numberFormatter.format(filtered.length)}`}
                </span>
                <div className="flex items-center gap-3 text-sm text-tertiary">
                    <span className="tabular-nums">
                        Página {pagina} de {totalPages}
                    </span>
                    <div className="flex gap-1">
                        <ButtonUtility size="sm" color="secondary" icon={ChevronLeft} tooltip="Anterior" isDisabled={pagina <= 1} onClick={() => setPage(pagina - 1)} />
                        <ButtonUtility size="sm" color="secondary" icon={ChevronRight} tooltip="Próxima" isDisabled={pagina >= totalPages} onClick={() => setPage(pagina + 1)} />
                    </div>
                </div>
            </div>

            <AcessoDetailsSlideOut isOpen={selected !== null} row={selected} onClose={() => setSelected(null)} />
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Slideout — detalhes da entrada                                    */
/* ------------------------------------------------------------------ */

const AcessoDetailsSlideOut = ({ isOpen, row, onClose }: { isOpen: boolean; row: PortadorAcesso | null; onClose: () => void }) => (
    <AriaModalOverlay
        isOpen={isOpen}
        onOpenChange={(open) => {
            if (!open) onClose();
        }}
        isDismissable
        className={({ isEntering, isExiting }) =>
            cx(
                "fixed inset-0 z-50 flex justify-end bg-overlay/70 outline-hidden backdrop-blur-[2px]",
                isEntering && "duration-300 ease-out animate-in fade-in",
                isExiting && "duration-200 ease-in animate-out fade-out",
            )
        }
    >
        <AriaModal
            className={({ isEntering, isExiting }) =>
                cx(
                    "h-full w-full max-w-[480px] bg-primary shadow-xl outline-hidden",
                    isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                    isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                )
            }
        >
            <AriaDialog className="flex h-full flex-col outline-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-secondary px-6 py-5">
                    <h2 className="text-lg font-semibold text-primary">Detalhes da entrada</h2>
                    <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto">
                    {row && (
                        <>
                            <div className="flex items-center gap-4 px-6 pt-6 pb-5">
                                <Avatar size="lg" initials={getInitials(row.portador)} status={row.status === "validado" ? "online" : undefined} />
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <span className="truncate text-md font-semibold text-primary">{row.portador}</span>
                                    <BadgeWithDot size="sm" color={ACESSO_STATUS[row.status].color} type="pill-color" className="w-fit">
                                        {ACESSO_STATUS[row.status].label}
                                        {row.horario ? ` · ${row.horario}` : ""}
                                    </BadgeWithDot>
                                </div>
                            </div>

                            <div className="mx-6 border-t border-secondary" />

                            <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                                <h3 className="text-md font-semibold text-primary">Portador</h3>
                                <dl className="flex flex-col gap-2.5">
                                    <DetailRow label="Nome" value={row.portador} />
                                    <DetailRow label="E-mail" value={row.emailPortador} isEmail />
                                    <DetailRow label="CPF" value={formatCPF(row.cpf)} />
                                </dl>
                            </div>

                            <div className="mx-6 border-t border-secondary" />

                            <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                                <h3 className="text-md font-semibold text-primary">Ingresso</h3>
                                <dl className="flex flex-col gap-2.5">
                                    <DetailRow label="QR Code" value={row.qrCode} isMono />
                                    <DetailRow label="ID do ingresso" value={row.idIngresso} isMono />
                                    <DetailRow label="ID da transação" value={row.idTransacao} isMono />
                                    <DetailRow label="Sessão" value={row.sessao} />
                                    <DetailRow label="Canal" value={row.canal} />
                                    <DetailRow label="Grupo de ingressos" value={row.grupo} />
                                    <DetailRow label="Tipo de ingresso" value={row.tipoIngresso} />
                                    <DetailRow label="Portão de entrada" value={row.portao ?? "—"} />
                                </dl>
                            </div>

                            <div className="mx-6 border-t border-secondary" />

                            <div className="flex flex-col gap-3 px-6 pt-5 pb-6">
                                <h3 className="text-md font-semibold text-primary">Comprador</h3>
                                <dl className="flex flex-col gap-2.5">
                                    <DetailRow label="Nome" value={row.comprador} />
                                    <DetailRow label="E-mail" value={row.emailComprador} isEmail />
                                </dl>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-secondary px-6 py-4">
                    <Button size="sm" color="secondary" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
            </AriaDialog>
        </AriaModal>
    </AriaModalOverlay>
);

const DetailRow = ({ label, value, isEmail = false, isMono = false }: { label: string; value: string; isEmail?: boolean; isMono?: boolean }) => (
    <div className="flex flex-col gap-0.5">
        <dt className="text-xs text-tertiary">{label}</dt>
        <dd className={cx("text-sm break-words", isEmail ? "text-brand-secondary" : "text-secondary", isMono && "font-mono text-xs text-primary")}>
            {value}
        </dd>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Shared primitives                                                 */
/* ------------------------------------------------------------------ */

interface CardProps {
    title: ReactNode;
    children: ReactNode;
    headerRight?: ReactNode;
}

const Card = ({ title, children, headerRight }: CardProps) => (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-4">
            <h3 className="flex items-center gap-2 text-md font-semibold text-primary">{title}</h3>
            {headerRight}
        </header>
        {children}
    </section>
);
