import { Fragment, useMemo, useState, type ReactNode } from "react";
import { CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ClockFastForward, SearchLg, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Bar, CartesianGrid, Cell, ComposedChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ExportMenu, RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, inDateRange, matchRow, useRelatorioFilters, type FilterFieldDef } from "../components/relatorio-filters";
import { SortableHeader } from "../components/SortableHeader";
import { useSortableTable } from "../utils/useSortableTable";
import { EVENT, numberFormatter, parseEventDate } from "../data/event";
import { COMBOS } from "../data/produtos";

const HIDE_TREND_AND_MENU = "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

/* ------------------------------------------------------------------ */
/*  Réveillon Carneiros — acesso por FESTA (não por setor/catraca).    */
/*  Cada portador tem um combo (NIGHT/FULL × gênero) e faz check-in     */
/*  numa festa (Mouton 16h / Night 20–22h). NIGHT PASS só entra em      */
/*  festas Night; FULL PASS entra em todas. Dados de teste.             */
/* ------------------------------------------------------------------ */

const ddmm = (data: string) => data.slice(0, 5);
const areaOf = (descricao: string): "Mouton" | "Night" => (descricao.includes("Mouton") ? "Mouton" : "Night");
const festaHour = (label: string): number => {
    const m = label.match(/(\d{1,2})h/);
    return m ? Number(m[1]) : 16;
};

interface FestaMeta {
    id: string;
    nome: string; // ex.: "31/12 | Night"
    descricao: string;
    data: string; // dd/mm/aaaa
    area: "Mouton" | "Night";
    hour: number;
}

// Metadados de cada festa derivados das sessões do evento.
const FESTAS: FestaMeta[] = EVENT.sessoes.map((s) => {
    const area = areaOf(s.descricao);
    return { id: s.id, nome: `${ddmm(s.data)} | ${area}`, descricao: s.descricao, data: s.data, area, hour: festaHour(s.label) };
});
const festaById = new Map(FESTAS.map((f) => [f.id, f]));

// Combos elegíveis por festa: NIGHT PASS só acessa festas Night; FULL PASS, todas.
const FULL_COMBOS = COMBOS.filter((c) => c.passe === "FULL PASS");
const combosDaFesta = (area: "Mouton" | "Night") => (area === "Night" ? COMBOS : FULL_COMBOS);

const BAR_COLOR = "var(--color-brand-600)";

/* ------------------------------------------------------------------ */
/*  Árvore de validação — Festa → Combo                                */
/* ------------------------------------------------------------------ */

interface AcessoNode {
    id: string;
    nome: string;
    vendidos?: number;
    validados?: number;
    children?: AcessoNode[];
}

const sumVendidos = (node: AcessoNode): number => (node.children?.length ? node.children.reduce((s, c) => s + sumVendidos(c), 0) : node.vendidos ?? 0);
const sumValidados = (node: AcessoNode): number => (node.children?.length ? node.children.reduce((s, c) => s + sumValidados(c), 0) : node.validados ?? 0);

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
    festaId: string;
    data: string; // dd/mm/aaaa da festa (para o filtro de período)
    portador: string;
    emailPortador: string;
    cpf: string;
    comprador: string;
    emailComprador: string;
    idTransacao: string;
    idIngresso: string;
    qrCode: string;
    festa: string; // ex.: "31/12 | Night"
    festaDescricao: string;
    area: "Mouton" | "Night";
    canal: string;
    comboId: string;
    combo: string; // nome do combo
    grupo: string; // NIGHT PASS / FULL PASS
    status: StatusAcesso;
    horario?: string;
}

const CANAIS = ["Online", "Offline"];
const COMBO_NOMES = COMBOS.map((c) => c.nome);
const FESTA_NOMES = FESTAS.map((f) => f.nome);

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
const fmtMin = (m: number) => `${pad(Math.floor(m / 60), 2)}:${pad(m % 60, 2)}`;
const toMin = (h: string) => {
    const [a, b] = h.split(":").map(Number);
    return a * 60 + b;
};

// Dataset determinístico (estável entre recargas) — 480 portadores.
const portadores: PortadorAcesso[] = Array.from({ length: 480 }, (_, idx) => {
    const nome = pick(NOMES, idx * 7 + (idx % 5));
    const primeiro = nome.split(" ")[0].toLowerCase();
    const ultimo = nome.split(" ").slice(-1)[0].toLowerCase();
    const email = `${primeiro}.${ultimo}${(idx % 9) + 1}@${pick(PROVEDORES, idx)}`;
    const festa = pick(FESTAS, idx * 3 + (idx % 7));
    const combo = pick(combosDaFesta(festa.area), idx * 2 + (idx % 3));
    const validado = (idx * 13 + 7) % 100 < 82; // ~82% validados
    // Horário coerente com a festa: Mouton a partir das 15h; Night ~1h antes do início.
    const startMin = festa.area === "Mouton" ? 15 * 60 : (festa.hour - 1) * 60;
    const horarioMin = startMin + ((idx * 17) % 150);
    return {
        id: String(idx + 1),
        festaId: festa.id,
        data: festa.data,
        portador: nome,
        emailPortador: email,
        cpf: pad((12000000000 + idx * 83729123) % 100000000000, 11),
        comprador: nome,
        emailComprador: email,
        idTransacao: `TRX-${840192 - idx}`,
        idIngresso: `ING-${pad(451 + idx, 4)}`,
        qrCode: pad((idx * 48271) % 100000000, 8),
        festa: festa.nome,
        festaDescricao: festa.descricao,
        area: festa.area,
        canal: pick(CANAIS, idx + (idx % 3)),
        comboId: combo.id,
        combo: combo.nome,
        grupo: combo.passe,
        status: validado ? "validado" : "pendente",
        horario: validado ? fmtMin(horarioMin) : undefined,
    };
});

/* ------------------------------------------------------------------ */
/*  Filtros — campos do slideout global                                */
/* ------------------------------------------------------------------ */

const FILTER_FIELDS: FilterFieldDef[] = [
    { id: "canal", label: "Canal", multi: { options: CANAIS.map((c) => ({ id: c, label: c })) } },
    { id: "festa", label: "Festa", multi: { options: FESTA_NOMES.map((f) => ({ id: f, label: f })) } },
    { id: "combo", label: "Combo", multi: { options: COMBO_NOMES.map((c) => ({ id: c, label: c })) } },
    { id: "status", label: "Status", multi: { options: [{ id: "Validado", label: "Validado" }, { id: "Não validado", label: "Não validado" }] } },
];

function getFieldValue(p: PortadorAcesso, field: string): string {
    switch (field) {
        case "canal":
            return p.canal;
        case "festa":
            return p.festa;
        case "combo":
            return p.combo;
        case "status":
            return ACESSO_STATUS[p.status].label;
        default:
            return "";
    }
}

const formatCPF = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 11);
    if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
    if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
    return d;
};

const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/* ------------------------------------------------------------------ */
/*  Derivações a partir das linhas filtradas                           */
/* ------------------------------------------------------------------ */

// Histograma de check-ins em faixas de 15 min (só validados, com horário).
function buildFaixas(rows: PortadorAcesso[]): { hora: string; checkins: number }[] {
    const slots = rows.filter((r) => r.horario).map((r) => Math.floor(toMin(r.horario!) / 15) * 15);
    if (!slots.length) return [];
    const min = Math.min(...slots);
    const max = Math.max(...slots);
    const counts = new Map<number, number>();
    slots.forEach((m) => counts.set(m, (counts.get(m) ?? 0) + 1));
    const out: { hora: string; checkins: number }[] = [];
    for (let m = min; m <= max; m += 15) out.push({ hora: fmtMin(m), checkins: counts.get(m) ?? 0 });
    return out;
}

// Árvore Festa → Combo, com esperados (linhas) e validados por nó.
function buildTree(rows: PortadorAcesso[]): AcessoNode[] {
    const festaOrder = FESTAS.map((f) => f.id).filter((id) => rows.some((r) => r.festaId === id));
    return festaOrder.map((festaId) => {
        const festa = festaById.get(festaId)!;
        const rowsFesta = rows.filter((r) => r.festaId === festaId);
        const combosPresentes = COMBOS.filter((c) => rowsFesta.some((r) => r.comboId === c.id));
        return {
            id: festaId,
            nome: festa.nome,
            children: combosPresentes.map((c) => {
                const rowsCombo = rowsFesta.filter((r) => r.comboId === c.id);
                return {
                    id: `${festaId}-${c.id}`,
                    nome: c.nome,
                    vendidos: rowsCombo.length,
                    validados: rowsCombo.filter((r) => r.status === "validado").length,
                };
            }),
        };
    });
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Acesso() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="acesso">
            <RelatorioFiltersProvider fields={FILTER_FIELDS} sessoes={EVENT.sessoes}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                        <RelatorioPageHeader
                            title="Acesso"
                            filtroVariante="dropdown"
                            actions={<ExportMenu onExport={(f) => toast.success(`Exportando ${f.toUpperCase()}`, { description: "A lista de entradas será exportada." })} />}
                        />
                        <AcessoBody />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const AcessoBody = () => {
    const { dateRange, sessao, filters } = useRelatorioFilters();

    const filteredPortadores = useMemo(() => {
        const validFilters = filters.filter((f) => f.field && f.value);
        return portadores.filter((p) => {
            if (sessao !== "all" && p.festaId !== sessao) return false;
            if (!inDateRange(parseEventDate(p.data), dateRange)) return false;
            if (!matchRow(p, validFilters, getFieldValue)) return false;
            return true;
        });
    }, [dateRange, sessao, filters]);

    const totals = useMemo(() => {
        const validados = filteredPortadores.filter((p) => p.status === "validado").length;
        return { validados, pendentes: filteredPortadores.length - validados, total: filteredPortadores.length };
    }, [filteredPortadores]);

    const faixas = useMemo(() => buildFaixas(filteredPortadores), [filteredPortadores]);
    const arvore = useMemo(() => buildTree(filteredPortadores), [filteredPortadores]);

    return (
        <>
            <MetricsRow validados={totals.validados} pendentes={totals.pendentes} total={totals.total} />
            <EntradasPorFaixaCard faixas={faixas} />
            <ValidacaoPorFestaCard festas={arvore} />
            <ControleDeAcessoCard rows={filteredPortadores} />
        </>
    );
};

/* ------------------------------------------------------------------ */
/*  Métricas                                                          */
/* ------------------------------------------------------------------ */

const MetricsRow = ({ validados, pendentes, total }: { validados: number; pendentes: number; total: number }) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricsIcon03 icon={CheckCircle} title={numberFormatter.format(validados)} subtitle="Validados" change={null} changeTrend="positive" actions={false} className={HIDE_TREND_AND_MENU} />
        <MetricsIcon03 icon={ClockFastForward} title={numberFormatter.format(pendentes)} subtitle="Não validados" change={null} changeTrend="positive" actions={false} className={HIDE_TREND_AND_MENU} />
        <ValidacaoMetric validados={validados} total={total} />
    </div>
);

const ValidacaoMetric = ({ validados, total }: { validados: number; total: number }) => {
    const pct = total === 0 ? 0 : Math.round((validados / total) * 100);
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
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} style={{ stroke: "var(--color-bg-quaternary)" }} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="stroke-fg-brand-primary transition-[stroke-dashoffset] duration-500" />
            </svg>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Entradas por faixa de horário                                     */
/* ------------------------------------------------------------------ */

const ChartTooltip = ({ active, label, payload }: { active?: boolean; label?: string; payload?: { value: number | string }[] }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <div className="rounded-lg bg-primary-solid px-3 py-2.5 shadow-xl ring-1 ring-secondary_alt">
            <p className="mb-1 text-sm font-semibold text-white">{label}</p>
            <p className="text-sm text-white/70">
                <span className="font-semibold text-white">{numberFormatter.format(Number(payload[0].value))}</span> check-ins
            </p>
        </div>
    );
};

const EntradasPorFaixaCard = ({ faixas }: { faixas: { hora: string; checkins: number }[] }) => {
    const picoFaixa = faixas.reduce((a, b) => (b.checkins > a.checkins ? b : a), faixas[0] ?? { hora: "", checkins: 0 });
    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <header className="border-b border-secondary px-5 py-4">
                <h3 className="text-md font-semibold text-primary">Entradas por faixa de horário</h3>
            </header>
            {faixas.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-tertiary">Nenhum check-in corresponde aos filtros.</div>
            ) : (
                <div className="h-[280px] w-full px-2 pt-5 pb-2 md:h-[320px] md:px-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={faixas} margin={{ top: 24, right: 12, bottom: 4, left: 4 }}>
                            <CartesianGrid stroke="var(--color-border-secondary)" strokeDasharray="2 4" strokeOpacity={0.6} vertical={false} />
                            <XAxis dataKey="hora" tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={10} interval="preserveStartEnd" minTickGap={16} />
                            <YAxis tickFormatter={(v) => numberFormatter.format(Number(v))} tick={{ fill: "var(--color-text-tertiary)", fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={8} width={40} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-bg-secondary)", opacity: 0.6 }} />
                            <Bar dataKey="checkins" name="Check-ins" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                                <LabelList dataKey="checkins" position="top" offset={6} fontSize={10} fontWeight={600} fill="var(--color-text-secondary)" formatter={(v) => numberFormatter.format(Number(v))} />
                                {faixas.map((f) => (
                                    <Cell key={f.hora} fill={BAR_COLOR} fillOpacity={f.hora === picoFaixa.hora ? 1 : 0.32} />
                                ))}
                            </Bar>
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
};

/* ------------------------------------------------------------------ */
/*  Validação por festa                                               */
/* ------------------------------------------------------------------ */

const ValidacaoPorFestaCard = ({ festas }: { festas: AcessoNode[] }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const indent = (depth: number) => 16 + depth * 24;

    const toggleExpanded = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const renderNodes = (list: AcessoNode[], depth: number): ReactNode[] => {
        const out: ReactNode[] = [];
        list.forEach((node) => {
            const hasChildren = !!node.children?.length;
            const isExpanded = expanded.has(node.id);
            const vendidos = sumVendidos(node);
            const validados = sumValidados(node);

            // Taxa de validação: validados / esperados (na festa ou no combo).
            const bar: ReactNode = <OccupancyBar value={validados} total={vendidos} />;

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
                        className={cx("border-b border-secondary transition duration-100 ease-linear", depth === 0 ? "bg-primary" : "bg-secondary/60", hasChildren && "cursor-pointer hover:bg-primary_hover")}
                    >
                        <td className="py-3.5 pr-4 text-sm" style={{ paddingLeft: indent(depth) }}>
                            <span className="flex items-center gap-2">
                                <ChevronDown aria-hidden="true" className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", !hasChildren && "invisible", isExpanded && "rotate-180")} />
                                <span className={cx("line-clamp-2", labelClass)}>{node.nome}</span>
                            </span>
                        </td>
                        <td className="hidden px-4 py-3.5 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(vendidos)}</td>
                        <td className="hidden px-4 py-3.5 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(validados)}</td>
                        <td className="px-4 py-3.5">{bar}</td>
                    </tr>
                    {hasChildren && isExpanded && renderNodes(node.children!, depth + 1)}
                </Fragment>,
            );
        });
        return out;
    };

    return (
        <Card title="Validação por festa">
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
                            <th className="px-4 py-3 text-sm font-semibold text-tertiary">Festa · Combo</th>
                            <th className="hidden px-4 py-3 text-right text-sm font-semibold text-tertiary md:table-cell">Esperados</th>
                            <th className="hidden px-4 py-3 text-right text-sm font-semibold text-tertiary md:table-cell">Validados</th>
                            <th className="px-4 py-3 text-sm font-semibold text-tertiary">Taxa de validação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {festas.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-sm text-tertiary">Nenhuma festa corresponde aos filtros.</td>
                            </tr>
                        ) : (
                            renderNodes(festas, 0)
                        )}
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
/*  Controle de acesso — lista                                        */
/* ------------------------------------------------------------------ */

const PER_PAGE = 100;

const SORT_ACCESSORS: Partial<Record<string, (p: PortadorAcesso) => string | number>> = {
    portador: (p) => p.portador,
    qrCode: (p) => p.qrCode,
    festa: (p) => p.festa,
    combo: (p) => p.combo,
    canal: (p) => p.canal,
    horario: (p) => {
        if (!p.horario) return -1;
        const [h, m] = p.horario.split(":").map(Number);
        return h * 60 + m;
    },
    status: (p) => ACESSO_STATUS[p.status].label,
};

const ControleDeAcessoCard = ({ rows }: { rows: PortadorAcesso[] }) => {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<PortadorAcesso | null>(null);

    const searched = useMemo(() => {
        const term = search.trim().toLowerCase();
        const digits = search.replace(/\D/g, "");
        if (!term) return rows;
        return rows.filter((p) => {
            const haystack = [p.portador, p.comprador, p.idTransacao, p.idIngresso, p.qrCode, p.festa, p.canal, p.combo].join(" ").toLowerCase();
            const cpfMatch = digits.length > 0 && p.cpf.includes(digits);
            return haystack.includes(term) || cpfMatch;
        });
    }, [rows, search]);

    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(searched as unknown as Record<string, unknown>[], SORT_ACCESSORS as Partial<Record<string, (r: Record<string, unknown>) => string | number>>);
    const sortedRows = sorted as unknown as PortadorAcesso[];

    const totalPages = Math.max(1, Math.ceil(sortedRows.length / PER_PAGE));
    const pagina = Math.min(page, totalPages);
    const pageRows = sortedRows.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE);

    const onSearch = (v: string) => {
        setSearch(v);
        setPage(1);
    };

    return (
        <Card
            title={
                <>
                    Detalhes da lista de entrada
                    <Badge size="sm" color="gray" type="pill-color">
                        {numberFormatter.format(sortedRows.length)}
                    </Badge>
                </>
            }
        >
            <div className="flex flex-col gap-3 border-b border-secondary px-4 py-3">
                <Input
                    size="sm"
                    icon={SearchLg}
                    aria-label="Buscar entradas"
                    placeholder="Buscar por nome, CPF, Code, ID da transação ou ingresso"
                    value={search}
                    onChange={onSearch}
                    className="w-full max-w-[420px]"
                />
            </div>

            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="bg-secondary">
                        <tr className="border-b border-secondary text-left">
                            <th className="px-4 py-3 text-sm font-semibold text-tertiary"><SortableHeader label="Portador" sortKey="portador" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="hidden px-4 py-3 text-sm font-semibold text-tertiary md:table-cell"><SortableHeader label="Code" sortKey="qrCode" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="hidden px-4 py-3 text-sm font-semibold text-tertiary lg:table-cell"><SortableHeader label="Festa" sortKey="festa" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="hidden px-4 py-3 text-sm font-semibold text-tertiary xl:table-cell"><SortableHeader label="Combo" sortKey="combo" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="hidden px-4 py-3 text-sm font-semibold text-tertiary xl:table-cell"><SortableHeader label="Canal" sortKey="canal" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="hidden px-4 py-3 text-sm font-semibold text-tertiary sm:table-cell"><SortableHeader label="Horário de entrada" sortKey="horario" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="px-4 py-3 text-sm font-semibold text-tertiary"><SortableHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="px-4 py-3" aria-hidden="true" />
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-sm text-tertiary">Nenhuma entrada corresponde aos filtros.</td>
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
                                    className={cx("group cursor-pointer transition duration-100 ease-linear hover:bg-primary_hover", !isLast && "border-b border-secondary")}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar size="sm" initials={getInitials(p.portador)} status={p.status === "validado" ? "online" : undefined} />
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-sm font-medium text-primary">{p.portador}</span>
                                                <span className="truncate text-sm text-tertiary tabular-nums">{formatCPF(p.cpf)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        <span className="inline-flex items-center text-sm text-tertiary tabular-nums">
                                            {p.qrCode}
                                        </span>
                                    </td>
                                    <td className="hidden px-4 py-3 text-sm text-tertiary lg:table-cell">{p.festa}</td>
                                    <td className="hidden px-4 py-3 text-sm text-tertiary xl:table-cell">{p.combo}</td>
                                    <td className="hidden px-4 py-3 text-sm text-tertiary xl:table-cell">{p.canal}</td>
                                    <td className="hidden px-4 py-3 text-sm text-secondary tabular-nums sm:table-cell">{p.horario ?? "—"}</td>
                                    <td className="px-4 py-3">
                                        <BadgeWithDot size="sm" color={statusMeta.color} type="pill-color">
                                            {statusMeta.label}
                                        </BadgeWithDot>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <ChevronRight aria-hidden="true" className="ml-auto size-5 text-fg-quaternary transition-transform duration-100 ease-linear group-hover:translate-x-0.5" />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-tertiary tabular-nums">
                    {sortedRows.length === 0 ? "0 registros" : `${(pagina - 1) * PER_PAGE + 1}–${Math.min(pagina * PER_PAGE, sortedRows.length)} de ${numberFormatter.format(sortedRows.length)}`}
                </span>
                <div className="flex items-center gap-3 text-sm text-tertiary">
                    <span className="tabular-nums">Página {pagina} de {totalPages}</span>
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
        className={({ isEntering, isExiting }) => cx("fixed inset-0 z-50 flex justify-end bg-overlay/70 outline-hidden backdrop-blur-[2px]", isEntering && "duration-300 ease-out animate-in fade-in", isExiting && "duration-200 ease-in animate-out fade-out")}
    >
        <AriaModal className={({ isEntering, isExiting }) => cx("h-full w-full max-w-[480px] bg-primary shadow-xl outline-hidden", isEntering && "duration-300 ease-out animate-in slide-in-from-right", isExiting && "duration-200 ease-in animate-out slide-out-to-right")}>
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
                                    <DetailRow label="Code" value={row.qrCode} isMono />
                                    <DetailRow label="ID do ingresso" value={row.idIngresso} isMono />
                                    <DetailRow label="ID da transação" value={row.idTransacao} isMono />
                                    <DetailRow label="Combo" value={row.combo} />
                                    <DetailRow label="Grupo" value={row.grupo} />
                                    <DetailRow label="Festa" value={row.festaDescricao} />
                                    <DetailRow label="Área" value={row.area} />
                                    <DetailRow label="Canal" value={row.canal} />
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
        <dt className="text-sm text-tertiary">{label}</dt>
        <dd className={cx("text-sm break-words", isEmail ? "text-brand-secondary" : "text-secondary", isMono && "font-mono text-primary")}>{value}</dd>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Shared primitives                                                 */
/* ------------------------------------------------------------------ */

const Card = ({ title, children, headerRight }: { title: ReactNode; children: ReactNode; headerRight?: ReactNode }) => (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-4">
            <h3 className="flex items-center gap-2 text-md font-semibold text-primary">{title}</h3>
            {headerRight}
        </header>
        {children}
    </section>
);
