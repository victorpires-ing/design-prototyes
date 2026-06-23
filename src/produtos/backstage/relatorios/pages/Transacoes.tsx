import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
    Bank,
    CheckCircle,
    ClockFastForward,
    CreditCard02,
    CurrencyDollarCircle,
    RefreshCcw01,
    SearchLg,
    ShoppingCart01,
    SlashCircle01,
} from "@untitledui/icons";
import {
    Area,
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    LabelList,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ExportMenu, RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, matchRow, inDateRange, useRelatorioFilters, type FilterFieldDef } from "../components/relatorio-filters";
import { SortableHeader } from "../components/SortableHeader";
import { useSortableTable } from "../utils/useSortableTable";
import { EVENT, currencyFormatter, numberFormatter, percentFormatter, parseEventDate } from "../data/event";

/* ------------------------------------------------------------------ */
/*  Hooks                                                             */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Status + meios                                                    */
/* ------------------------------------------------------------------ */

type StatusTransacao = "aprovado" | "pendente" | "cancelado" | "estornado" | "reembolso";

const STATUS_META: Record<StatusTransacao, { label: string; icon: typeof CheckCircle; color: "success" | "warning" | "error" | "gray" }> = {
    aprovado: { label: "Aprovado", icon: CheckCircle, color: "success" },
    pendente: { label: "Pendente", icon: ClockFastForward, color: "warning" },
    cancelado: { label: "Carrinho Abandonado", icon: ShoppingCart01, color: "gray" },
    estornado: { label: "Cancelado", icon: SlashCircle01, color: "error" },
    reembolso: { label: "Reembolso", icon: RefreshCcw01, color: "warning" },
};

const STATUS_FILL: Record<StatusTransacao, string> = {
    aprovado: "var(--color-utility-green-500)",
    pendente: "var(--color-utility-yellow-500)",
    cancelado: "var(--color-utility-neutral-500)",
    estornado: "var(--color-utility-red-500)",
    reembolso: "var(--color-utility-orange-500)",
};

interface IngressoStatusRow {
    id: string;
    status: StatusTransacao;
    canal: string;
    totalIngressos: number;
    total: number;
}

interface MeioPagamentoRow {
    id: string;
    nome: string;
    icon: typeof CreditCard02;
    quantidadeTransacoes: number;
    pctQtdTransacoes: number;
    quantidadeIngressos: number;
    pctQtdIngressos: number;
    valor: number;
    pctValor: number;
}

interface ChartPoint {
    data: string;
    quantidade: number;
    total: number;
}

/* ------------------------------------------------------------------ */
/*  Mock data — gerador determinístico de transações                  */
/*  Todos os cards derivam DESTE conjunto, então qualquer filtro       */
/*  (período, sessão ou campo) recompõe todas as visões da página.     */
/* ------------------------------------------------------------------ */

interface Transacao {
    id: string;
    sessaoId: string;
    dataCriacao: string;
    ultimaAtualizacao: string;
    status: StatusTransacao;
    nomeIngresso: string;
    setor: string;
    lote: string;
    comprador: string;
    cpf: string;
    telefone: string;
    email: string;
    canal: string;
    tipoPagamento: string;
    estado: string;
    cidade: string;
    operadorVendas: string;
    valor: number;
    cupom: string;
    valorDesconto: number;
    valorFinal: number;
    qtdItem: number;
    passkey: string;
    pdv: boolean;
    bundle: boolean;
    bundleDinamico: boolean;
}

const CATALOGO = [
    { setor: "VIP", peso: 0.1, tipos: [{ nome: "VIP (Inteira)", valor: 1368, lote: "Lote 2" }, { nome: "VIP (Meia)", valor: 684, lote: "Lote 2" }] },
    { setor: "Camarote Premium", peso: 0.12, tipos: [{ nome: "Camarote (Inteira)", valor: 980, lote: "Lote 2" }, { nome: "Camarote (Meia)", valor: 490, lote: "Lote 2" }] },
    { setor: "Pista Premium", peso: 0.22, tipos: [{ nome: "Pista Premium (Inteira)", valor: 520, lote: "Lote 1" }, { nome: "Pista Premium (Meia)", valor: 260, lote: "Lote 1" }] },
    { setor: "Pista", peso: 0.46, tipos: [{ nome: "Pista (Inteira)", valor: 240, lote: "Lote 3" }, { nome: "Pista (Meia)", valor: 120, lote: "Lote 3" }] },
    { setor: "Mezanino", peso: 0.1, tipos: [{ nome: "Mezanino (Inteira)", valor: 300, lote: "Lote 1" }, { nome: "Mezanino (Meia)", valor: 150, lote: "Lote 1" }] },
];

const PRIMEIROS = ["Adriano", "Mariana", "Pedro", "Camila", "Roberto", "Larissa", "Vinicius", "Davi", "Beatriz", "Gustavo", "Fernanda", "Rafael", "Juliana", "Bruno", "Aline", "Thiago", "Patrícia", "Lucas", "Carolina", "Felipe"];
const SOBRENOMES = ["Albuquerque", "Lopes Ferreira", "Henrique Costa", "Rodrigues", "Santos Júnior", "Almeida", "Cayres", "Marinho da Silva", "Oliveira", "Souza", "Pereira", "Carvalho", "Ribeiro", "Gomes", "Martins", "Araújo", "Barbosa", "Nunes"];
const LOCAIS = [
    { estado: "SP", cidade: "São Paulo", ddd: "11" },
    { estado: "SP", cidade: "Campinas", ddd: "19" },
    { estado: "RJ", cidade: "Rio de Janeiro", ddd: "21" },
    { estado: "MG", cidade: "Belo Horizonte", ddd: "31" },
    { estado: "BA", cidade: "Salvador", ddd: "71" },
    { estado: "PR", cidade: "Curitiba", ddd: "41" },
    { estado: "RS", cidade: "Porto Alegre", ddd: "51" },
];
const OPERADORES = ["Operadora Estação Central", "Bilheteria Arena", "PDV Shopping Norte"];
const CUPONS = [
    { cupom: "FAN15", pct: 0.15 },
    { cupom: "VIPACCESS", pct: 0.1 },
    { cupom: "PREMIERE10", pct: 0.1 },
];

/** dd/mm/aaaa a partir de um offset (em dias) sobre a data de início de vendas. */
const SALES_START_DATE = parseEventDate(EVENT.salesStart)!;
const SALES_TOTAL_DAYS =
    Math.round((parseEventDate(EVENT.salesEnd)!.getTime() - SALES_START_DATE.getTime()) / 86_400_000) + 1;

const pad = (n: number, size = 2) => String(n).padStart(size, "0");
const fmtDateTime = (d: Date) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;

function mulberry32(seed: number) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const transacoes: Transacao[] = (() => {
    const rng = mulberry32(20260615);
    const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
    const pickWeighted = <T extends { peso: number }>(arr: T[]): T => {
        const total = arr.reduce((s, x) => s + x.peso, 0);
        let r = rng() * total;
        for (const x of arr) {
            r -= x.peso;
            if (r <= 0) return x;
        }
        return arr[arr.length - 1];
    };
    const rows: Transacao[] = [];
    const COUNT = 2400;
    for (let i = 0; i < COUNT; i++) {
        // Data enviesada para o fim da janela (rampa em direção ao evento), com pico no anúncio.
        let dayOffset: number;
        if (rng() < 0.16) {
            dayOffset = Math.floor(rng() * 8); // pico de anúncio (1ª semana)
        } else {
            dayOffset = Math.floor((SALES_TOTAL_DAYS - 1) * Math.pow(rng(), 0.55));
        }
        const created = new Date(SALES_START_DATE);
        created.setDate(created.getDate() + dayOffset);
        created.setHours(Math.floor(rng() * 24), Math.floor(rng() * 60));
        const updated = new Date(created.getTime() + Math.floor(rng() * 30) * 60_000);

        const statusRoll = rng();
        const status: StatusTransacao =
            statusRoll < 0.86 ? "aprovado" : statusRoll < 0.91 ? "pendente" : statusRoll < 0.96 ? "cancelado" : statusRoll < 0.98 ? "estornado" : "reembolso";

        const cat = pickWeighted(CATALOGO);
        const tipo = pick(cat.tipos);
        const qtdItem = rng() < 0.82 ? 1 : rng() < 0.7 ? 2 : rng() < 0.7 ? 3 : 4;
        const valor = tipo.valor * qtdItem;

        const temCupom = rng() < 0.12;
        const cupomDef = temCupom ? pick(CUPONS) : null;
        const valorDesconto = cupomDef ? Math.round(valor * cupomDef.pct * 100) / 100 : 0;
        const valorFinal = Math.round((valor - valorDesconto) * 100) / 100;

        const isPdv = rng() < 0.1;
        const canal = isPdv ? "PDV" : "Online";
        const tipoPagamento = rng() < 0.42 ? "Pix" : "Cartão de Crédito";
        const local = pick(LOCAIS);
        const nome = `${pick(PRIMEIROS)} ${pick(SOBRENOMES)}`;
        const emailUser = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]+/g, ".");
        const email = `${emailUser}${Math.floor(rng() * 90 + 10)}@${pick(["gmail.com", "outlook.com", "hotmail.com", "yahoo.com"])}`;
        const cpf = String(Math.floor(rng() * 9e10 + 1e10));
        const telefone = `+55${local.ddd}9${String(Math.floor(rng() * 9e7 + 1e7))}`;
        const sessao = pick(EVENT.sessoes);

        rows.push({
            id: `${pad(Math.floor(rng() * 9e7), 8)}-${pad(Math.floor(rng() * 9000), 4)}-4${pad(Math.floor(rng() * 900), 3)}-${pad(Math.floor(rng() * 9000), 4)}`,
            sessaoId: sessao.id,
            dataCriacao: fmtDateTime(created),
            ultimaAtualizacao: fmtDateTime(updated),
            status,
            nomeIngresso: tipo.nome,
            setor: cat.setor,
            lote: tipo.lote,
            comprador: nome,
            cpf,
            telefone,
            email,
            canal,
            tipoPagamento,
            estado: local.estado,
            cidade: local.cidade,
            operadorVendas: isPdv ? pick(OPERADORES) : "—",
            valor,
            cupom: cupomDef?.cupom ?? "—",
            valorDesconto,
            valorFinal,
            qtdItem,
            passkey: cat.setor === "VIP" && rng() < 0.4 ? "VIP2026" : "—",
            pdv: isPdv,
            bundle: rng() < 0.08,
            bundleDinamico: rng() < 0.04,
        });
    }
    // Ordena do mais recente para o mais antigo (como uma lista de transações real).
    rows.sort((a, b) => (parseEventDate(b.dataCriacao)?.getTime() ?? 0) - (parseEventDate(a.dataCriacao)?.getTime() ?? 0));
    return rows;
})();

/* ------------------------------------------------------------------ */
/*  Filtros — definição de campos (usada pelo slideout global)         */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([, m]) => ({ id: m.label, label: m.label }));
const CANAL_OPTIONS = [
    { id: "Online", label: "Online" },
    { id: "PDV", label: "PDV" },
];
const MEIO_PAGAMENTO_OPTIONS = [
    { id: "Pix", label: "Pix" },
    { id: "Cartão de Crédito", label: "Cartão de Crédito" },
];
const SETOR_OPTIONS = CATALOGO.map((c) => ({ id: c.setor, label: c.setor }));

const FILTER_FIELDS: FilterFieldDef[] = [
    { id: "status", label: "Status", multi: { options: STATUS_OPTIONS } },
    { id: "canal", label: "Canal", multi: { options: CANAL_OPTIONS } },
    { id: "meioPagamento", label: "Meio de Pagamento", multi: { options: MEIO_PAGAMENTO_OPTIONS } },
    { id: "setor", label: "Setor", multi: { options: SETOR_OPTIONS } },
    { id: "email", label: "Email" },
    { id: "cpf", label: "CPF" },
    { id: "passkey", label: "Passkey" },
    { id: "nomeComprador", label: "Nome Comprador" },
    { id: "operador", label: "Operador de Vendas" },
    { id: "tipoIngresso", label: "Tipo do Ingresso" },
    { id: "idTransacao", label: "ID Transação" },
    { id: "cupom", label: "Cupom" },
];

function getFieldValue(t: Transacao, field: string): string {
    switch (field) {
        case "status":
            return STATUS_META[t.status].label;
        case "canal":
            return t.canal;
        case "meioPagamento":
            return t.tipoPagamento;
        case "email":
            return t.email;
        case "cpf":
            return t.cpf;
        case "passkey":
            return t.passkey;
        case "nomeComprador":
            return t.comprador;
        case "operador":
            return t.operadorVendas;
        case "setor":
            return t.setor;
        case "tipoIngresso":
            return t.nomeIngresso;
        case "idTransacao":
            return t.id;
        case "cupom":
            return t.cupom;
        default:
            return "";
    }
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Transacoes() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="transacoes">
            <RelatorioFiltersProvider fields={FILTER_FIELDS} sessoes={EVENT.sessoes}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                        <RelatorioPageHeader
                            title="Transações"
                            actions={<ExportMenu onExport={(f) => toast.success(`Exportando ${f.toUpperCase()}`, { description: "As transações serão exportadas." })} />}
                        />
                        <TransacoesBody />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const TransacoesBody = () => {
    const { dateRange, sessao, filters } = useRelatorioFilters();

    const filtered = useMemo(() => {
        const validFilters = filters.filter((f) => f.field && f.value);
        return transacoes.filter((t) => {
            if (sessao !== "all" && t.sessaoId !== sessao) return false;
            if (!inDateRange(parseEventDate(t.dataCriacao), dateRange)) return false;
            if (!matchRow(t, validFilters, getFieldValue)) return false;
            return true;
        });
    }, [dateRange, sessao, filters]);

    const totalFinal = useMemo(() => filtered.reduce((s, t) => s + t.valorFinal, 0), [filtered]);

    const statusRows = useMemo<IngressoStatusRow[]>(() => {
        const order: StatusTransacao[] = ["aprovado", "pendente", "cancelado", "estornado", "reembolso"];
        return order
            .map((status) => {
                const rows = filtered.filter((t) => t.status === status);
                if (!rows.length) return null;
                const canais = new Set(rows.map((r) => r.canal));
                return {
                    id: status,
                    status,
                    canal: canais.size > 1 ? "Online + PDV" : [...canais][0],
                    totalIngressos: rows.reduce((s, r) => s + r.qtdItem, 0),
                    total: rows.reduce((s, r) => s + r.valorFinal, 0),
                };
            })
            .filter(Boolean) as IngressoStatusRow[];
    }, [filtered]);

    const meiosRows = useMemo<MeioPagamentoRow[]>(() => {
        const defs = [
            { id: "pix", nome: "Pix", icon: Bank, match: "Pix" },
            { id: "cartao", nome: "Cartão de Crédito", icon: CreditCard02, match: "Cartão de Crédito" },
        ];
        const totalTx = filtered.length || 1;
        const totalIng = filtered.reduce((s, r) => s + r.qtdItem, 0) || 1;
        const totalVal = filtered.reduce((s, r) => s + r.valorFinal, 0) || 1;
        return defs
            .map((d) => {
                const rows = filtered.filter((t) => t.tipoPagamento === d.match);
                if (!rows.length) return null;
                const qtdTx = rows.length;
                const qtdIng = rows.reduce((s, r) => s + r.qtdItem, 0);
                const val = rows.reduce((s, r) => s + r.valorFinal, 0);
                return {
                    id: d.id,
                    nome: d.nome,
                    icon: d.icon,
                    quantidadeTransacoes: qtdTx,
                    pctQtdTransacoes: qtdTx / totalTx,
                    quantidadeIngressos: qtdIng,
                    pctQtdIngressos: qtdIng / totalIng,
                    valor: val,
                    pctValor: val / totalVal,
                };
            })
            .filter(Boolean) as MeioPagamentoRow[];
    }, [filtered]);

    const chartData = useMemo<ChartPoint[]>(() => {
        const byDay = new Map<number, { d: Date; quantidade: number; total: number }>();
        for (const t of filtered) {
            const d = parseEventDate(t.dataCriacao);
            if (!d) continue;
            const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const acc = byDay.get(key) ?? { d: new Date(key), quantidade: 0, total: 0 };
            acc.quantidade += t.qtdItem;
            acc.total += t.valorFinal;
            byDay.set(key, acc);
        }
        return [...byDay.values()]
            .sort((a, b) => a.d.getTime() - b.d.getTime())
            .map((x) => ({ data: `${x.d.getDate()}/${x.d.getMonth() + 1}`, quantidade: x.quantidade, total: Math.round(x.total) }));
    }, [filtered]);

    return (
        <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <TotalTransacionadoCard total={totalFinal} />
            </div>
            <IngressosValorPorStatusCard rows={statusRows} />
            <TransacionadoChartCard data={chartData} />
            <MeioPagamentosCard rows={meiosRows} />
            <ListaTransacoesCard rows={filtered} />
        </>
    );
};

/* ------------------------------------------------------------------ */
/*  Total transacionado (big number)                                  */
/* ------------------------------------------------------------------ */

const TotalTransacionadoCard = ({ total }: { total: number }) => (
    <MetricsIcon03
        icon={CurrencyDollarCircle}
        title={currencyFormatter.format(total)}
        subtitle="Total transacionado"
        change={null}
        changeTrend="positive"
        actions={false}
        className="h-full [&_p+div]:hidden"
    />
);

/* ------------------------------------------------------------------ */
/*  Quantidade de ingressos e valor por status                        */
/* ------------------------------------------------------------------ */

const IngressosValorPorStatusCard = ({ rows }: { rows: IngressoStatusRow[] }) => {
    if (rows.length === 0) {
        return (
            <Card title="Quantidade de Ingressos e Valor por status">
                <div className="px-4 py-12 text-center text-sm text-tertiary">Nenhum status corresponde aos filtros.</div>
            </Card>
        );
    }
    const totalValor = rows.reduce((s, r) => s + r.total, 0);
    return (
        <Card title="Quantidade de Ingressos e Valor por status">
            <div className="flex flex-col gap-6 px-4 py-5 md:flex-row md:items-center md:gap-8 md:px-5">
                <div className="flex shrink-0 flex-col items-center gap-2">
                    <div className="size-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={rows} dataKey="total" innerRadius="65%" outerRadius="100%" paddingAngle={2} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                                    {rows.map((r) => (
                                        <Cell key={r.id} fill={STATUS_FILL[r.status]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <span className="text-xs font-medium text-tertiary">Distribuição por valor</span>
                </div>

                <ul className="flex w-full flex-1 flex-col divide-y divide-secondary">
                    {rows.map((row) => {
                        const meta = STATUS_META[row.status];
                        const pct = totalValor === 0 ? 0 : Math.round((row.total / totalValor) * 100);
                        return (
                            <li key={row.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:gap-4">
                                <div className="flex min-w-0 items-center gap-3 md:flex-1">
                                    <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: STATUS_FILL[row.status] }} />
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <span className="text-sm font-semibold text-primary">{meta.label}</span>
                                        <span className="text-xs text-tertiary">{pct}% · {row.canal}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 md:flex md:gap-8">
                                    <StatBlock className="md:w-32" label="Total ingressos" value={numberFormatter.format(row.totalIngressos)} />
                                    <StatBlock className="md:w-36" label="Total" value={currencyFormatter.format(row.total)} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Chart                                                             */
/* ------------------------------------------------------------------ */

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
                        <li key={entry.dataKey} className="flex items-center gap-2 text-xs">
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
const TOTAL_COLOR = "var(--color-brand-600)";

const TransacionadoChartCard = ({ data }: { data: ChartPoint[] }) => {
    const isMobile = useIsMobile();
    const fontSize = isMobile ? 10 : 11;
    const [metric, setMetric] = useState<"total" | "quantidade">("total");

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <header className="flex flex-col gap-3 border-b border-secondary px-5 pt-4 pb-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-md font-semibold text-primary">Total transacionado e número de ingressos</h3>
                    <p className="text-sm text-tertiary">Distribuição diária de transações e ingressos vendidos</p>
                </div>
                <ButtonGroup
                    size="sm"
                    selectedKeys={[metric]}
                    onSelectionChange={(keys: Set<React.Key> | "all") => {
                        if (keys === "all") return;
                        const next = [...keys][0] as "total" | "quantidade" | undefined;
                        if (next) setMetric(next);
                    }}
                >
                    <ButtonGroupItem id="total">Total</ButtonGroupItem>
                    <ButtonGroupItem id="quantidade">Quantidade</ButtonGroupItem>
                </ButtonGroup>
            </header>

            <div className="h-[280px] w-full px-2 pt-5 pb-2 md:h-[380px] md:px-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: isMobile ? 16 : 28, right: isMobile ? 8 : 16, bottom: isMobile ? 0 : 4, left: isMobile ? 0 : 4 }}>
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
                        <Bar yAxisId="total" dataKey="total" name="Total Transacionado" fill={TOTAL_COLOR} radius={[3, 3, 0, 0]} maxBarSize={isMobile ? 10 : 18}>
                            {metric === "total" && data.length <= 20 && (
                                <LabelList dataKey="total" position="top" fill="var(--color-text-primary)" fontSize={isMobile ? 9 : 11} fontWeight={600} offset={isMobile ? 6 : 8} formatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`} />
                            )}
                        </Bar>
                        <Area yAxisId="qtd" type="monotone" dataKey="quantidade" name="Quantidade de Ingressos" stroke={QTD_COLOR} strokeWidth={2.5} fill="url(#qtdAreaFill)" dot={false} activeDot={{ r: 6, fill: QTD_COLOR, stroke: "var(--color-bg-primary)", strokeWidth: 2 }}>
                            {metric === "quantidade" && data.length <= 20 && (
                                <LabelList dataKey="quantidade" position="top" fill="var(--color-text-primary)" fontSize={isMobile ? 9 : 11} fontWeight={600} offset={isMobile ? 16 : 30} formatter={(v) => numberFormatter.format(Number(v))} />
                            )}
                        </Area>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary px-5 py-3">
                <div className="flex flex-wrap items-center gap-4 text-xs text-tertiary">
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

/* ------------------------------------------------------------------ */
/*  Meio de Pagamentos                                                */
/* ------------------------------------------------------------------ */

const MEIO_FILL: Record<string, string> = {
    pix: "var(--color-utility-green-500)",
    cartao: "var(--color-utility-blue-500)",
};

const MeioPagamentosCard = ({ rows }: { rows: MeioPagamentoRow[] }) => {
    if (rows.length === 0) {
        return (
            <Card title="Meio de Pagamentos">
                <div className="px-4 py-12 text-center text-sm text-tertiary">Nenhum meio corresponde aos filtros.</div>
            </Card>
        );
    }
    const fillFor = (id: string) => MEIO_FILL[id] ?? "var(--color-utility-gray-400)";
    return (
        <Card title="Meio de Pagamentos">
            <div className="flex flex-col gap-6 px-4 py-5 md:flex-row md:items-center md:gap-8 md:px-5">
                <div className="flex shrink-0 flex-col items-center gap-2">
                    <div className="size-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={rows} dataKey="valor" innerRadius="65%" outerRadius="100%" paddingAngle={2} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                                    {rows.map((r) => (
                                        <Cell key={r.id} fill={fillFor(r.id)} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <span className="text-xs font-medium text-tertiary">Distribuição por valor</span>
                </div>

                <ul className="flex w-full flex-1 flex-col divide-y divide-secondary">
                    {rows.map((row) => (
                        <li key={row.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:gap-4">
                            <div className="flex min-w-0 items-center gap-3 md:flex-1">
                                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: fillFor(row.id) }} />
                                <row.icon aria-hidden="true" className="size-4 shrink-0 text-fg-quaternary" />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-sm font-semibold text-primary">{row.nome}</span>
                                    <span className="text-xs text-tertiary">{percentFormatter.format(row.pctValor)} do valor</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 md:flex md:gap-8">
                                <StatBlock className="md:w-28" label="Transações" value={`${numberFormatter.format(row.quantidadeTransacoes)} · ${percentFormatter.format(row.pctQtdTransacoes)}`} />
                                <StatBlock className="md:w-28" label="Ingressos" value={`${numberFormatter.format(row.quantidadeIngressos)} · ${percentFormatter.format(row.pctQtdIngressos)}`} />
                                <StatBlock className="md:w-36" label="Valor" value={currencyFormatter.format(row.valor)} />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Lista de transações                                               */
/* ------------------------------------------------------------------ */

const TRANSACAO_COLUMNS: Array<{ key: keyof Transacao | "status"; label: string; align?: "right" }> = [
    { key: "id", label: "ID" },
    { key: "dataCriacao", label: "Data de Criação" },
    { key: "ultimaAtualizacao", label: "Última Atualização" },
    { key: "status", label: "Status" },
    { key: "nomeIngresso", label: "Nome do Ingresso" },
    { key: "setor", label: "Setor" },
    { key: "lote", label: "Lote" },
    { key: "comprador", label: "Comprador" },
    { key: "cpf", label: "CPF do Comprador" },
    { key: "telefone", label: "Telefone do Comprador" },
    { key: "email", label: "Email do Comprador" },
    { key: "canal", label: "Canal" },
    { key: "tipoPagamento", label: "Tipo de Pagamento" },
    { key: "estado", label: "Estado" },
    { key: "cidade", label: "Cidade" },
    { key: "operadorVendas", label: "Operador de Vendas" },
    { key: "valor", label: "Valor", align: "right" },
    { key: "cupom", label: "Cupom" },
    { key: "valorDesconto", label: "Valor Desconto", align: "right" },
    { key: "valorFinal", label: "Valor Final", align: "right" },
    { key: "qtdItem", label: "Qtd. de Itens", align: "right" },
    { key: "passkey", label: "Passkey" },
    { key: "pdv", label: "PDV" },
    { key: "bundle", label: "Bundle" },
    { key: "bundleDinamico", label: "Bundle Dinâmico" },
];

const renderTransacaoCell = (row: Transacao, key: keyof Transacao | "status"): ReactNode => {
    if (key === "status") {
        const meta = STATUS_META[row.status];
        return <span className="font-medium text-primary">{meta.label}</span>;
    }
    const value = row[key];
    if (typeof value === "boolean") return value ? "Sim" : "Não";
    if (key === "valor" || key === "valorDesconto" || key === "valorFinal") return currencyFormatter.format(Number(value));
    if (key === "qtdItem") return numberFormatter.format(Number(value));
    return String(value);
};

const SORT_ACCESSORS: Partial<Record<string, (t: Transacao) => string | number>> = {
    status: (t) => STATUS_META[t.status].label,
    dataCriacao: (t) => parseEventDate(t.dataCriacao)?.getTime() ?? 0,
    ultimaAtualizacao: (t) => parseEventDate(t.ultimaAtualizacao)?.getTime() ?? 0,
};

const ListaTransacoesCard = ({ rows }: { rows: Transacao[] }) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [search, setSearch] = useState("");

    const searched = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter((t) =>
            [t.id, STATUS_META[t.status].label, t.setor, t.comprador, t.cpf, t.telefone, t.email].join(" ").toLowerCase().includes(term),
        );
    }, [rows, search]);

    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(
        searched as unknown as Record<string, unknown>[],
        SORT_ACCESSORS as Partial<Record<string, (r: Record<string, unknown>) => string | number>>,
    );

    useEffect(() => {
        setPage(1);
    }, [search, rows]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const visibleRows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return (sorted as unknown as Transacao[]).slice(start, start + pageSize);
    }, [sorted, safePage, pageSize]);

    return (
        <Card
            title={
                <>
                    Lista de transações
                    <Badge size="sm" color="gray" type="pill-color">
                        {numberFormatter.format(sorted.length)}
                    </Badge>
                </>
            }
        >
            <div className="flex flex-col gap-3 border-b border-secondary px-4 py-3 lg:flex-row lg:items-center">
                <Input
                    size="sm"
                    icon={SearchLg}
                    aria-label="Buscar transações"
                    placeholder="Buscar por ID, setor ou comprador"
                    value={search}
                    onChange={setSearch}
                    className="lg:max-w-xs lg:flex-1"
                />
            </div>

            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            {TRANSACAO_COLUMNS.map((col) => (
                                <th key={String(col.key)} className={cx("whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary", col.align === "right" && "text-right")}>
                                    <SortableHeader label={col.label} align={col.align} sortKey={String(col.key)} activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.length === 0 && (
                            <tr>
                                <td colSpan={TRANSACAO_COLUMNS.length} className="px-4 py-12 text-center text-sm text-tertiary">
                                    Nenhuma transação corresponde aos filtros aplicados.
                                </td>
                            </tr>
                        )}
                        {visibleRows.map((row, i) => (
                            <tr key={row.id} className={cx("transition duration-100 ease-linear hover:bg-primary_hover", i !== visibleRows.length - 1 && "border-b border-secondary")}>
                                {TRANSACAO_COLUMNS.map((col) => (
                                    <td key={String(col.key)} className={cx("whitespace-nowrap px-4 py-4 text-sm text-tertiary", col.align === "right" && "text-right", col.key === "id" && "font-mono text-xs text-secondary")}>
                                        {renderTransacaoCell(row, col.key)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PaginationCardAdvanced
                page={safePage}
                total={totalPages}
                pageSize={pageSize}
                onPageChange={(p: number) => setPage(p)}
                onPageSizeChange={(size: number) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />
        </Card>
    );
};

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

const StatBlock = ({ label, value, className }: { label: string; value: string; className?: string }) => (
    <div className={cx("flex flex-col gap-0.5", className)}>
        <span className="text-xs text-tertiary">{label}</span>
        <span className="text-sm font-medium text-primary tabular-nums">{value}</span>
    </div>
);
