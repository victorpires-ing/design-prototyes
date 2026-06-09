import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getLocalTimeZone, today } from "@internationalized/date";
import type { DateValue, Selection } from "react-aria-components";
import {
    Bank,
    CheckCircle,
    ChevronDown,
    ClockFastForward,
    CreditCard02,
    CurrencyDollarCircle,
    FilterLines,
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
import { Badge } from "@/components/base/badges/badges";
import {
    CountBadge,
    FilterDropdown,
    type FilterRow,
} from "@/components/application/filter-bar/filter-dropdown-menu";
import { DateRangePicker } from "@/components/application/date-picker/date-range-picker";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { Button } from "@/components/base/buttons/button";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Input } from "@/components/base/input/input";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Select } from "@/components/base/select/select";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";

/* ------------------------------------------------------------------ */
/*  Shared constants                                                  */
/* ------------------------------------------------------------------ */

const HIDE_TREND_AND_MENU =
    "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

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
/*  Formatters                                                        */
/* ------------------------------------------------------------------ */

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});
const numberFormatter = new Intl.NumberFormat("pt-BR");
const percentFormatter = new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

type StatusTransacao = "aprovado" | "pendente" | "cancelado" | "estornado" | "reembolso";

const STATUS_META: Record<
    StatusTransacao,
    {
        label: string;
        icon: typeof CheckCircle;
        color: "success" | "warning" | "error" | "gray";
    }
> = {
    aprovado: { label: "Aprovado", icon: CheckCircle, color: "success" },
    pendente: { label: "Pendente", icon: ClockFastForward, color: "warning" },
    cancelado: { label: "Carrinho Abandonado", icon: ShoppingCart01, color: "gray" },
    estornado: { label: "Cancelado", icon: SlashCircle01, color: "error" },
    reembolso: { label: "Reembolso", icon: RefreshCcw01, color: "warning" },
};

interface IngressoStatusRow {
    id: string;
    status: StatusTransacao;
    canal: string;
    totalIngressos: number;
    total: number;
}

const ingressosPorStatus: IngressoStatusRow[] = [
    { id: "ap", status: "aprovado", canal: "Online", totalIngressos: 11124, total: 2798311.19 },
    { id: "pe", status: "pendente", canal: "Online", totalIngressos: 384, total: 95616.0 },
    { id: "ca", status: "cancelado", canal: "Online", totalIngressos: 127, total: 31750.0 },
    { id: "es", status: "estornado", canal: "Online", totalIngressos: 64, total: 16000.0 },
    { id: "re", status: "reembolso", canal: "Online", totalIngressos: 41, total: 10250.0 },
];

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

const meiosPagamento: MeioPagamentoRow[] = [
    {
        id: "pix",
        nome: "Pix",
        icon: Bank,
        quantidadeTransacoes: 2368,
        pctQtdTransacoes: 0.375,
        quantidadeIngressos: 3554,
        pctQtdIngressos: 0.319,
        valor: 842254.57,
        pctValor: 0.301,
    },
    {
        id: "cartao",
        nome: "Cartão de Crédito",
        icon: CreditCard02,
        quantidadeTransacoes: 3945,
        pctQtdTransacoes: 0.625,
        quantidadeIngressos: 7570,
        pctQtdIngressos: 0.681,
        valor: 1956056.62,
        pctValor: 0.699,
    },
];

interface ChartPoint {
    data: string;
    quantidade: number;
    total: number;
}

const chartData: ChartPoint[] = [
    { data: "4/4", quantidade: 2540, total: 638570 },
    { data: "5/4", quantidade: 787, total: 197887 },
    { data: "6/4", quantidade: 552, total: 138750 },
    { data: "7/4", quantidade: 320, total: 80450 },
    { data: "8/4", quantidade: 287, total: 72148 },
    { data: "9/4", quantidade: 248, total: 62356 },
    { data: "10/4", quantidade: 259, total: 65117 },
    { data: "11/4", quantidade: 198, total: 49786 },
    { data: "12/4", quantidade: 153, total: 38478 },
    { data: "13/4", quantidade: 89, total: 22384 },
    { data: "14/4", quantidade: 102, total: 25653 },
    { data: "15/4", quantidade: 94, total: 23641 },
    { data: "16/4", quantidade: 120, total: 30187 },
    { data: "17/4", quantidade: 87, total: 21879 },
    { data: "18/4", quantidade: 90, total: 22631 },
    { data: "19/4", quantidade: 128, total: 32193 },
    { data: "20/4", quantidade: 83, total: 20872 },
    { data: "22/4", quantidade: 110, total: 27664 },
    { data: "24/4", quantidade: 104, total: 26152 },
    { data: "26/4", quantidade: 116, total: 29173 },
    { data: "28/4", quantidade: 158, total: 39738 },
    { data: "1/5", quantidade: 215, total: 54068 },
    { data: "3/5", quantidade: 273, total: 68665 },
    { data: "5/5", quantidade: 318, total: 79973 },
    { data: "8/5", quantidade: 358, total: 90034 },
    { data: "11/5", quantidade: 515, total: 129541 },
    { data: "14/5", quantidade: 358, total: 90042 },
    { data: "17/5", quantidade: 86, total: 21632 },
    { data: "19/5", quantidade: 32, total: 8050 },
];

interface Transacao {
    id: string;
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

const transacoes: Transacao[] = [
    {
        id: "023fcb61-8493-4c9a-98ca-68d35b5c5c07",
        dataCriacao: "22/5/2026, 00:14",
        ultimaAtualizacao: "22/5/2026, 00:15",
        status: "aprovado",
        nomeIngresso: "Meia",
        setor: "DOMINGO (11/10)",
        lote: "Lote 3",
        comprador: "Adriano Albuquerque",
        cpf: "11180301412",
        telefone: "+5513996179250",
        email: "adrianofilho2009@gmail.com",
        canal: "Online",
        tipoPagamento: "Pix",
        estado: "—",
        cidade: "—",
        operadorVendas: "—",
        valor: 199.0,
        cupom: "—",
        valorDesconto: 0,
        valorFinal: 199.0,
        qtdItem: 1,
        passkey: "—",
        pdv: false,
        bundle: false,
        bundleDinamico: false,
    },
    {
        id: "c61d7db2-3ac4-4fa5-8d99-3f74f3e62e90",
        dataCriacao: "22/5/2026, 00:13",
        ultimaAtualizacao: "22/5/2026, 00:14",
        status: "aprovado",
        nomeIngresso: "Meia",
        setor: "SÁBADO (10/10)",
        lote: "Lote 3",
        comprador: "Davi Marinho da Silva",
        cpf: "50332360830",
        telefone: "+5511986215159",
        email: "davim222@hotmail.com",
        canal: "Online",
        tipoPagamento: "Cartão de Crédito",
        estado: "SP",
        cidade: "São Paulo",
        operadorVendas: "—",
        valor: 199.0,
        cupom: "—",
        valorDesconto: 0,
        valorFinal: 199.0,
        qtdItem: 1,
        passkey: "—",
        pdv: false,
        bundle: false,
        bundleDinamico: false,
    },
    {
        id: "12da9cde-e5be-4431-b299-b10b7aee7cac",
        dataCriacao: "21/5/2026, 23:01",
        ultimaAtualizacao: "21/5/2026, 23:02",
        status: "aprovado",
        nomeIngresso: "Meia",
        setor: "SÁBADO (10/10)",
        lote: "Lote 3",
        comprador: "Vinicius Cayres",
        cpf: "45659058841",
        telefone: "+5511999007839",
        email: "cayres2000@gmail.com",
        canal: "Online",
        tipoPagamento: "Cartão de Crédito",
        estado: "SP",
        cidade: "São Paulo",
        operadorVendas: "—",
        valor: 199.0,
        cupom: "—",
        valorDesconto: 0,
        valorFinal: 199.0,
        qtdItem: 1,
        passkey: "—",
        pdv: false,
        bundle: false,
        bundleDinamico: false,
    },
    {
        id: "8a124f30-9b21-4c11-bb14-a87e3d2c4519",
        dataCriacao: "21/5/2026, 19:42",
        ultimaAtualizacao: "21/5/2026, 19:43",
        status: "aprovado",
        nomeIngresso: "Inteira - Combo Camarote + Open Bar",
        setor: "DOMINGO (11/10) - PREMIUM",
        lote: "Lote 2",
        comprador: "Mariana Lopes Ferreira",
        cpf: "32145678912",
        telefone: "+5521987654321",
        email: "mariana.lopes@gmail.com",
        canal: "Online",
        tipoPagamento: "Cartão de Crédito",
        estado: "RJ",
        cidade: "Rio de Janeiro",
        operadorVendas: "—",
        valor: 758.0,
        cupom: "FAN15",
        valorDesconto: 113.7,
        valorFinal: 644.3,
        qtdItem: 1,
        passkey: "—",
        pdv: false,
        bundle: true,
        bundleDinamico: false,
    },
    {
        id: "4e8b2a17-5d3c-4ee9-b412-7f9a6d1c8e23",
        dataCriacao: "21/5/2026, 18:30",
        ultimaAtualizacao: "21/5/2026, 18:35",
        status: "pendente",
        nomeIngresso: "Meia | Caravanas",
        setor: "SÁBADO (10/10)",
        lote: "Lote 3",
        comprador: "Pedro Henrique Costa",
        cpf: "78912345607",
        telefone: "+5531998877665",
        email: "pedrohcosta@outlook.com",
        canal: "Online",
        tipoPagamento: "Pix",
        estado: "MG",
        cidade: "Belo Horizonte",
        operadorVendas: "—",
        valor: 99.5,
        cupom: "—",
        valorDesconto: 0,
        valorFinal: 99.5,
        qtdItem: 1,
        passkey: "—",
        pdv: false,
        bundle: false,
        bundleDinamico: false,
    },
    {
        id: "2c9f5a08-3b7e-4ad1-9c08-6e4b2f8d3a91",
        dataCriacao: "21/5/2026, 17:15",
        ultimaAtualizacao: "21/5/2026, 17:16",
        status: "aprovado",
        nomeIngresso: "VIP - 1º Lote (Inteira)",
        setor: "VIP",
        lote: "Lote 1",
        comprador: "Camila Rodrigues",
        cpf: "98765432100",
        telefone: "+5511912345678",
        email: "camila.rodrigues@gmail.com",
        canal: "PDV",
        tipoPagamento: "Cartão de Crédito",
        estado: "SP",
        cidade: "Campinas",
        operadorVendas: "Operadora Estação Central",
        valor: 1368.0,
        cupom: "—",
        valorDesconto: 0,
        valorFinal: 1368.0,
        qtdItem: 1,
        passkey: "VIP2026",
        pdv: true,
        bundle: false,
        bundleDinamico: false,
    },
    {
        id: "f5a37b29-1c4d-4e8b-a213-7d9c8e6f4b15",
        dataCriacao: "21/5/2026, 15:22",
        ultimaAtualizacao: "21/5/2026, 15:48",
        status: "cancelado",
        nomeIngresso: "Camarote - 2º Lote (Inteira)",
        setor: "Camarote Premium",
        lote: "Lote 2",
        comprador: "Roberto Santos Júnior",
        cpf: "12378945612",
        telefone: "+5571988776655",
        email: "roberto.sj@yahoo.com",
        canal: "Online",
        tipoPagamento: "Cartão de Crédito",
        estado: "BA",
        cidade: "Salvador",
        operadorVendas: "—",
        valor: 681.0,
        cupom: "VIPACCESS",
        valorDesconto: 68.1,
        valorFinal: 612.9,
        qtdItem: 1,
        passkey: "—",
        pdv: false,
        bundle: false,
        bundleDinamico: true,
    },
    {
        id: "9d1e4c52-8f6a-4b27-c513-2a9b7f3e8d61",
        dataCriacao: "21/5/2026, 14:08",
        ultimaAtualizacao: "21/5/2026, 14:09",
        status: "aprovado",
        nomeIngresso: "Pista Premium - 1º Lote (Meia)",
        setor: "Pista Premium",
        lote: "Lote 1",
        comprador: "Larissa Almeida",
        cpf: "65498712345",
        telefone: "+5511933445566",
        email: "lari.almeida@hotmail.com",
        canal: "Online",
        tipoPagamento: "Pix",
        estado: "SP",
        cidade: "São Paulo",
        operadorVendas: "—",
        valor: 379.0,
        cupom: "PREMIERE10",
        valorDesconto: 37.9,
        valorFinal: 341.1,
        qtdItem: 1,
        passkey: "—",
        pdv: false,
        bundle: false,
        bundleDinamico: false,
    },
];

/* ------------------------------------------------------------------ */
/*  Filter state                                                      */
/* ------------------------------------------------------------------ */

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

function matchFilterValue(haystack: string, needle: string, operator: string): boolean {
    const h = haystack.toLowerCase();
    const n = needle.toLowerCase();
    switch (operator) {
        case "equals":
        case "is":
            return h === n;
        case "is-not":
            return h !== n;
        case "starts-with":
            return h.startsWith(n);
        case "does-not-contain":
            return !h.includes(n);
        case "contains":
        default:
            return h.includes(n);
    }
}

function matchTransacao(t: Transacao, rows: FilterRow[]): boolean {
    for (const r of rows) {
        if (!r.field || !r.value) continue;
        const haystack = getFieldValue(t, r.field);
        const values = r.value
            .split(",")
            .map((v: string) => v.trim())
            .filter(Boolean);
        if (!values.length) continue;
        const negate = r.operator === "is-not" || r.operator === "does-not-contain";
        const matched = negate
            ? values.every((v: string) => matchFilterValue(haystack, v, r.operator))
            : values.some((v: string) => matchFilterValue(haystack, v, r.operator));
        if (!matched) return false;
    }
    return true;
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Transacoes() {
    const [filters, setFilters] = useState<FilterRow[]>([]);
    const [appliedCount, setAppliedCount] = useState(0);

    const handleAddFilter = useCallback(() => {
        setFilters((prev) => [...prev, createEmptyFilter()]);
    }, []);

    const handleRemoveFilter = useCallback((id: string) => {
        setFilters((prev) => prev.filter((f) => f.id !== id));
    }, []);

    const handleFilterChange = useCallback(
        (id: string, patch: Partial<Omit<FilterRow, "id">>) => {
            setFilters((prev) =>
                prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
            );
        },
        [],
    );

    const handleApply = useCallback((applied: FilterRow[]) => {
        const valid = applied.filter((f) => f.field && f.value);
        setAppliedCount(valid.length);
    }, []);

    const handleClearAll = useCallback(() => {
        setFilters([]);
        setAppliedCount(0);
    }, []);

    const filteredTransacoes = useMemo(() => {
        const valid = filters.filter((f) => f.field && f.value);
        return transacoes.filter((t) => matchTransacao(t, valid));
    }, [filters]);

    const totalFinal = useMemo(
        () => filteredTransacoes.reduce((s, t) => s + t.valorFinal, 0),
        [filteredTransacoes],
    );

    const filteredStatus = useMemo(() => {
        const statusFilter = filters.find((f) => f.field === "status" && f.value);
        if (!statusFilter) return ingressosPorStatus;
        const labels = statusFilter.value
            .split(",")
            .map((v: string) => v.trim())
            .filter(Boolean);
        if (!labels.length) return ingressosPorStatus;
        const isNot = statusFilter.operator === "is-not";
        return ingressosPorStatus.filter((r) => {
            const inSet = labels.includes(STATUS_META[r.status].label);
            return isNot ? !inSet : inSet;
        });
    }, [filters]);

    const filteredMeios = useMemo(() => {
        const meioFilter = filters.find(
            (f) => f.field === "meioPagamento" && f.value,
        );
        if (!meioFilter) return meiosPagamento;
        const names = meioFilter.value
            .split(",")
            .map((v: string) => v.trim())
            .filter(Boolean);
        if (!names.length) return meiosPagamento;
        const isNot = meioFilter.operator === "is-not";
        return meiosPagamento.filter((m) => {
            const inSet = names.includes(m.nome);
            return isNot ? !inSet : inSet;
        });
    }, [filters]);

    return (
        <BackstageLayout activeSection="relatorios" activeItem="transacoes">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    <RelatorioPageHeader
                        title="Transações"
                        actions={
                            <FilterDropdown
                                filters={filters}
                                appliedCount={appliedCount}
                                placement="bottom end"
                                onAddFilter={handleAddFilter}
                                onRemoveFilter={handleRemoveFilter}
                                onFilterChange={handleFilterChange}
                                onApply={handleApply}
                                onClearAll={handleClearAll}
                                renderFilterRow={(
                                    filter: FilterRow,
                                    onChange: (
                                        patch: Partial<Omit<FilterRow, "id">>,
                                    ) => void,
                                ) => (
                                    <>
                                        <Select
                                            className="max-w-40 flex-1"
                                            size="sm"
                                            aria-label="Campo"
                                            placeholder="Selecione"
                                            items={FILTER_FIELDS}
                                            selectedKey={filter.field || null}
                                            onSelectionChange={(key: React.Key | null) =>
                                                onChange({
                                                    field: key ? String(key) : "",
                                                    value: "",
                                                })
                                            }
                                        >
                                            {(item: FilterFieldDef) => (
                                                <Select.Item id={item.id}>
                                                    {item.label}
                                                </Select.Item>
                                            )}
                                        </Select>
                                        <Select
                                            className="max-w-40 flex-1"
                                            size="sm"
                                            aria-label="Operador"
                                            placeholder="Operador"
                                            items={
                                                FILTER_FIELDS.find(
                                                    (f) => f.id === filter.field,
                                                )?.multi
                                                    ? OPERATOR_OPTIONS_MULTI
                                                    : OPERATOR_OPTIONS_TEXT
                                            }
                                            selectedKey={filter.operator || null}
                                            onSelectionChange={(key: React.Key | null) =>
                                                onChange({
                                                    operator: key ? String(key) : "",
                                                })
                                            }
                                        >
                                            {(item: { id: string; label: string }) => (
                                                <Select.Item id={item.id}>
                                                    {item.label}
                                                </Select.Item>
                                            )}
                                        </Select>
                                        <FilterValueInput
                                            filter={filter}
                                            onChange={onChange}
                                        />
                                    </>
                                )}
                            >
                                <Button
                                    color="secondary"
                                    size="sm"
                                    iconLeading={FilterLines}
                                    iconTrailing={ChevronDown}
                                    className={cx(
                                        "max-h-9",
                                        appliedCount > 0 && "bg-primary_hover",
                                    )}
                                >
                                    <span className="flex items-center gap-1.5">
                                        Filtros
                                        {appliedCount > 0 && (
                                            <CountBadge count={appliedCount} />
                                        )}
                                    </span>
                                </Button>
                            </FilterDropdown>
                        }
                    />

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <TotalTransacionadoCard total={totalFinal} />
                    </div>
                        <IngressosValorPorStatusCard rows={filteredStatus} />

                    <TransacionadoChartCard />
                    <MeioPagamentosCard rows={filteredMeios} />
                    <ListaTransacoesCard rows={filteredTransacoes} />
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Filters bar                                                       */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = [
    { id: "Aprovado", label: "Aprovado" },
    { id: "Pendente", label: "Pendente" },
    { id: "Carrinho Abandonado", label: "Carrinho Abandonado" },
    { id: "Cancelado", label: "Cancelado" },
    { id: "Reembolso", label: "Reembolso" },
];

const CANAL_OPTIONS = [
    { id: "Online", label: "Online" },
    { id: "PDV", label: "PDV" },
];

const MEIO_PAGAMENTO_OPTIONS = [
    { id: "Pix", label: "Pix" },
    { id: "Cartão de Crédito", label: "Cartão de Crédito" },
];

type FilterFieldId =
    | "status"
    | "canal"
    | "meioPagamento"
    | "email"
    | "cpf"
    | "passkey"
    | "nomeComprador"
    | "operador"
    | "setor"
    | "tipoIngresso"
    | "idTransacao"
    | "cupom";

interface FilterFieldDef {
    id: FilterFieldId;
    label: string;
    multi?: { options: { id: string; label: string }[] };
}

const FILTER_FIELDS: FilterFieldDef[] = [
    { id: "status", label: "Status", multi: { options: STATUS_OPTIONS } },
    { id: "canal", label: "Canal", multi: { options: CANAL_OPTIONS } },
    {
        id: "meioPagamento",
        label: "Meio de Pagamento",
        multi: { options: MEIO_PAGAMENTO_OPTIONS },
    },
    { id: "email", label: "Email" },
    { id: "cpf", label: "CPF" },
    { id: "passkey", label: "Passkey" },
    { id: "nomeComprador", label: "Nome Comprador" },
    { id: "operador", label: "Operador de Vendas" },
    { id: "setor", label: "Setor" },
    { id: "tipoIngresso", label: "Tipo do Ingresso" },
    { id: "idTransacao", label: "ID Transação" },
    { id: "cupom", label: "Cupom" },
];

const OPERATOR_OPTIONS_MULTI = [
    { id: "is", label: "É" },
    { id: "is-not", label: "Não é" },
];

const OPERATOR_OPTIONS_TEXT = [
    { id: "contains", label: "Contém" },
    { id: "equals", label: "Igual a" },
    { id: "does-not-contain", label: "Não contém" },
    { id: "starts-with", label: "Começa com" },
];

const FilterValueInput = ({
    filter,
    onChange,
}: {
    filter: FilterRow;
    onChange: (patch: Partial<Omit<FilterRow, "id">>) => void;
}) => {
    const def = FILTER_FIELDS.find((f) => f.id === filter.field);

    if (def?.multi) {
        const options = def.multi.options;
        const selectedKeys: Selection = filter.value
            ? new Set(filter.value.split(",").filter(Boolean))
            : new Set();
        const count = selectedKeys instanceof Set ? selectedKeys.size : 0;

        return (
            <MultiSelect
                className="min-w-0 flex-1"
                size="sm"
                aria-label="Valor"
                placeholder="Selecione"
                items={options}
                selectedKeys={selectedKeys}
                onSelectionChange={(keys: Selection) => {
                    if (keys === "all") {
                        onChange({ value: options.map((o) => o.id).join(",") });
                    } else {
                        onChange({ value: Array.from(keys).join(",") });
                    }
                }}
                supportingText={count > 0 ? `${count} selecionados` : undefined}
                onReset={() => onChange({ value: "" })}
                onSelectAll={() =>
                    onChange({ value: options.map((o) => o.id).join(",") })
                }
            >
                {(item: { id: string; label: string }) => (
                    <MultiSelect.Item
                        id={item.id}
                        selectionIndicator="checkbox"
                        selectionIndicatorAlign="left"
                    >
                        {item.label}
                    </MultiSelect.Item>
                )}
            </MultiSelect>
        );
    }

    return (
        <Input
            className="min-w-0 flex-1"
            size="sm"
            aria-label="Valor"
            placeholder="Digite um valor"
            value={filter.value}
            onChange={(value: string) => onChange({ value })}
        />
    );
};

let nextFilterId = 1;
const createEmptyFilter = (): FilterRow => ({
    id: `f${nextFilterId++}`,
    field: "",
    operator: "is",
    value: "",
});

/* ------------------------------------------------------------------ */
/*  Total transacionado (big number)                                  */
/* ------------------------------------------------------------------ */

interface TotalTransacionadoCardProps {
    total: number;
}

const TotalTransacionadoCard = ({ total }: TotalTransacionadoCardProps) => (
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
/*  Quantidade de ingressos e valor por status (DetalhePorItem-like)  */
/* ------------------------------------------------------------------ */

interface IngressosValorPorStatusCardProps {
    rows: IngressoStatusRow[];
}

const STATUS_FILL: Record<StatusTransacao, string> = {
    aprovado: "var(--color-utility-green-500)",
    pendente: "var(--color-utility-yellow-500)",
    cancelado: "var(--color-utility-neutral-500)",
    estornado: "var(--color-utility-red-500)",
    reembolso: "var(--color-utility-orange-500)",
};

const IngressosValorPorStatusCard = ({ rows }: IngressosValorPorStatusCardProps) => {
    if (rows.length === 0) {
        return (
            <Card title="Quantidade de Ingressos e Valor por status">
                <div className="px-4 py-12 text-center text-sm text-tertiary">
                    Nenhum status corresponde aos filtros.
                </div>
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
                                <Pie
                                    data={rows}
                                    dataKey="total"
                                    innerRadius="65%"
                                    outerRadius="100%"
                                    paddingAngle={2}
                                    startAngle={90}
                                    endAngle={-270}
                                    stroke="none"
                                    isAnimationActive={false}
                                >
                                    {rows.map((r) => (
                                        <Cell key={r.id} fill={STATUS_FILL[r.status]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <span className="text-xs font-medium text-tertiary">
                        Distribuição por valor
                    </span>
                </div>

                <ul className="flex w-full flex-1 flex-col divide-y divide-secondary">
                    {rows.map((row) => {
                        const meta = STATUS_META[row.status];
                        const pct =
                            totalValor === 0
                                ? 0
                                : Math.round((row.total / totalValor) * 100);
                        return (
                            <li
                                key={row.id}
                                className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:gap-4"
                            >
                                <div className="flex min-w-0 items-center gap-3 md:flex-1">
                                    <span
                                        className="size-3 shrink-0 rounded-full"
                                        style={{
                                            backgroundColor: STATUS_FILL[row.status],
                                        }}
                                    />
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <span className="text-sm font-semibold text-primary">
                                            {meta.label}
                                        </span>
                                        <span className="text-xs text-tertiary">
                                            {pct}% · {row.canal}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 md:flex md:gap-8">
                                    <StatBlock
                                        className="md:w-32"
                                        label="Total ingressos"
                                        value={numberFormatter.format(row.totalIngressos)}
                                    />
                                    <StatBlock
                                        className="md:w-36"
                                        label="Total"
                                        value={currencyFormatter.format(row.total)}
                                    />
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

interface ChartTooltipProps {
    active?: boolean;
    label?: string;
    payload?: ChartTooltipPayloadEntry[];
}

const ChartTooltip = ({ active, label, payload }: ChartTooltipProps) => {
    if (!active || !payload || payload.length === 0) return null;
    // Bars render first → ensure line/area appears last in the list
    const ordered = [...payload].sort((a, b) =>
        a.dataKey === "total" ? -1 : b.dataKey === "total" ? 1 : 0,
    );
    return (
        <div className="rounded-lg bg-primary-solid px-3 py-2.5 shadow-xl ring-1 ring-secondary_alt">
            <p className="mb-1.5 text-sm font-semibold text-white">{label}</p>
            <ul className="flex flex-col gap-1">
                {ordered.map((entry) => {
                    const isMonetary = entry.dataKey === "total";
                    const formatted = isMonetary
                        ? currencyFormatter.format(Number(entry.value))
                        : numberFormatter.format(Number(entry.value));
                    return (
                        <li
                            key={entry.dataKey}
                            className="flex items-center gap-2 text-xs"
                        >
                            <span
                                aria-hidden="true"
                                className="size-2 shrink-0 rounded-full"
                                style={{ background: entry.color }}
                            />
                            <span className="text-white/70">{entry.name}:</span>
                            <span className="font-semibold text-white">
                                {formatted}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

interface ChartCursorProps {
    points?: { x: number; y: number }[];
    top?: number;
    height?: number;
}

const ChartCursor = ({ points, top = 0, height = 0 }: ChartCursorProps) => {
    if (!points || points.length === 0) return null;
    const x = points[0].x;
    return (
        <line
            x1={x}
            x2={x}
            y1={top}
            y2={top + height}
            stroke="var(--color-border-primary)"
            strokeWidth={1}
        />
    );
};

// Cor adaptável para a série de quantidade (visível no claro e no escuro).
const QTD_COLOR = "var(--color-utility-blue-400)";
const TOTAL_COLOR = "var(--color-brand-600)";

const TransacionadoChartCard = () => {
    const isMobile = useIsMobile();
    const fontSize = isMobile ? 10 : 11;
    const [metric, setMetric] = useState<"total" | "quantidade">("total");

    // Período de vendas do evento — limita o range e gera os presets do projeto.
    const { salesStart, salesEnd, salesPresets } = useMemo(() => {
        const tz = getLocalTimeZone();
        const end = today(tz);
        const start = end.subtract({ days: chartData.length - 1 });
        return {
            salesStart: start,
            salesEnd: end,
            salesPresets: {
                last7: { label: "Últimos 7 dias de vendas", value: { start: end.subtract({ days: 6 }), end } },
                last15: { label: "Últimos 15 dias de vendas", value: { start: end.subtract({ days: 14 }), end } },
                last30: { label: "Últimos 30 dias de vendas", value: { start: end.subtract({ days: 29 }), end } },
                allSales: { label: "Todo o período de vendas", value: { start, end } },
            },
        };
    }, []);

    const [range, setRange] = useState<{ start: DateValue; end: DateValue } | null>(salesPresets.last7.value);

    const visibleChartData = useMemo(() => {
        if (!range) return chartData;
        const tz = getLocalTimeZone();
        const days = Math.round((range.end.toDate(tz).getTime() - range.start.toDate(tz).getTime()) / 86400000) + 1;
        if (days >= chartData.length) return chartData;
        return chartData.slice(-Math.max(1, days));
    }, [range]);

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <header className="flex flex-col gap-3 border-b border-secondary px-5 pt-4 pb-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-md font-semibold text-primary">
                        Total transacionado e número de ingressos
                    </h3>
                    <p className="text-sm text-tertiary">
                        Distribuição diária de transações e ingressos vendidos
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                    <DateRangePicker
                        value={range}
                        onChange={setRange}
                        minValue={salesStart}
                        maxValue={salesEnd}
                        presets={salesPresets}
                        className="shrink-0"
                    />
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
                </div>
            </header>

            <div className="h-[280px] w-full px-2 pt-5 pb-2 md:h-[380px] md:px-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={visibleChartData}
                        margin={{
                            top: isMobile ? 16 : 28,
                            right: isMobile ? 8 : 16,
                            bottom: isMobile ? 0 : 4,
                            left: isMobile ? 0 : 4,
                        }}
                    >
                        <defs>
                            <linearGradient id="qtdAreaFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={QTD_COLOR} stopOpacity={0.28} />
                                <stop offset="80%" stopColor={QTD_COLOR} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            stroke="var(--color-border-secondary)"
                            strokeDasharray="2 4"
                            strokeOpacity={0.6}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="data"
                            tick={{ fill: "var(--color-text-tertiary)", fontSize }}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            interval={isMobile ? "preserveStartEnd" : "preserveStart"}
                            minTickGap={isMobile ? 24 : 12}
                        />
                        <YAxis
                            yAxisId="total"
                            orientation="left"
                            tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`}
                            tick={{ fill: "var(--color-text-tertiary)", fontSize }}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={isMobile ? 44 : 56}
                        />
                        <YAxis
                            yAxisId="qtd"
                            orientation="right"
                            tickFormatter={(v) => numberFormatter.format(Number(v))}
                            tick={{ fill: "var(--color-text-tertiary)", fontSize }}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            width={isMobile ? 36 : 44}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={<ChartCursor />} />
                        <Bar
                            yAxisId="total"
                            dataKey="total"
                            name="Total Transacionado"
                            fill={TOTAL_COLOR}
                            radius={[3, 3, 0, 0]}
                            maxBarSize={isMobile ? 14 : 26}
                        >
                            {!isMobile && metric === "total" && (
                                <LabelList
                                    dataKey="total"
                                    position="top"
                                    fill="var(--color-text-primary)"
                                    fontSize={11}
                                    fontWeight={600}
                                    offset={8}
                                    formatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`}
                                />
                            )}
                        </Bar>
                        <Area
                            yAxisId="qtd"
                            type="monotone"
                            dataKey="quantidade"
                            name="Quantidade de Ingressos"
                            stroke={QTD_COLOR}
                            strokeWidth={2.5}
                            fill="url(#qtdAreaFill)"
                            dot={{
                                r: isMobile ? 3 : 4,
                                fill: "var(--color-bg-primary)",
                                stroke: QTD_COLOR,
                                strokeWidth: 2,
                            }}
                            activeDot={{
                                r: 6,
                                fill: QTD_COLOR,
                                stroke: "var(--color-bg-primary)",
                                strokeWidth: 2,
                            }}
                        >
                            {!isMobile && metric === "quantidade" && (
                                <LabelList
                                    dataKey="quantidade"
                                    position="top"
                                    fill="var(--color-text-primary)"
                                    fontSize={11}
                                    fontWeight={600}
                                    offset={30}
                                    formatter={(v) => numberFormatter.format(Number(v))}
                                />
                            )}
                        </Area>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary px-5 py-3">
                {/* Legenda do gráfico (estática) */}
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

interface MeioPagamentosCardProps {
    rows: MeioPagamentoRow[];
}

const MEIO_FILL: Record<string, string> = {
    pix: "var(--color-utility-green-500)",
    cartao: "var(--color-utility-blue-500)",
};

const MeioPagamentosCard = ({ rows }: MeioPagamentosCardProps) => {
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
                                <Pie
                                    data={rows}
                                    dataKey="valor"
                                    innerRadius="65%"
                                    outerRadius="100%"
                                    paddingAngle={2}
                                    startAngle={90}
                                    endAngle={-270}
                                    stroke="none"
                                    isAnimationActive={false}
                                >
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
                                <StatBlock
                                    className="md:w-28"
                                    label="Transações"
                                    value={`${numberFormatter.format(row.quantidadeTransacoes)} · ${percentFormatter.format(row.pctQtdTransacoes)}`}
                                />
                                <StatBlock
                                    className="md:w-28"
                                    label="Ingressos"
                                    value={`${numberFormatter.format(row.quantidadeIngressos)} · ${percentFormatter.format(row.pctQtdIngressos)}`}
                                />
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
    if (key === "valor" || key === "valorDesconto" || key === "valorFinal") {
        return currencyFormatter.format(Number(value));
    }
    if (key === "qtdItem") return numberFormatter.format(Number(value));
    return String(value);
};

interface ListaTransacoesCardProps {
    rows: Transacao[];
}

const parseTxDate = (s: string): Date | null => {
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!m) return null;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
};

const ListaTransacoesCard = ({ rows }: ListaTransacoesCardProps) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [search, setSearch] = useState("");
    const [statusKeys, setStatusKeys] = useState<Selection>(new Set());
    const [dateRange, setDateRange] = useState<{ start: DateValue; end: DateValue } | null>(null);

    // Filtros locais da lista: busca (id, status, setor, dados do comprador), status e data.
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        const statusSet =
            statusKeys !== "all" && statusKeys instanceof Set && statusKeys.size > 0
                ? new Set(Array.from(statusKeys, String))
                : null;
        const tz = getLocalTimeZone();
        const startMs = dateRange ? dateRange.start.toDate(tz).getTime() : null;
        const endMs = dateRange ? dateRange.end.toDate(tz).getTime() + 86_400_000 - 1 : null;

        return rows.filter((t) => {
            if (term) {
                const haystack = [t.id, STATUS_META[t.status].label, t.setor, t.comprador, t.cpf, t.telefone, t.email]
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(term)) return false;
            }
            if (statusSet && !statusSet.has(STATUS_META[t.status].label)) return false;
            if (startMs != null && endMs != null) {
                const d = parseTxDate(t.dataCriacao);
                if (!d) return false;
                const ms = d.getTime();
                if (ms < startMs || ms > endMs) return false;
            }
            return true;
        });
    }, [rows, search, statusKeys, dateRange]);

    // Volta para a primeira página sempre que os filtros mudam.
    useEffect(() => {
        setPage(1);
    }, [search, statusKeys, dateRange]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const visibleRows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage, pageSize]);

    return (
        <Card
            title={
                <>
                    Lista de transações
                    <Badge size="sm" color="gray" type="pill-color">
                        {numberFormatter.format(filtered.length)}
                    </Badge>
                </>
            }
        >
            {/* Toolbar: busca, filtro de status e período */}
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
                <div className="flex flex-col gap-3 lg:ml-auto lg:flex-row lg:items-center">
                    <MultiSelect
                        size="sm"
                        aria-label="Filtrar por status"
                        placeholder="Status"
                        items={STATUS_OPTIONS}
                        selectedKeys={statusKeys}
                        onSelectionChange={setStatusKeys}
                        className="w-full lg:w-44"
                    >
                        {(item: { id: string; label: string }) => (
                            <MultiSelect.Item id={item.id} selectionIndicator="checkbox" selectionIndicatorAlign="left">
                                {item.label}
                            </MultiSelect.Item>
                        )}
                    </MultiSelect>
                    <DateRangePicker value={dateRange} onChange={setDateRange} className="shrink-0" />
                </div>
            </div>

            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            {TRANSACAO_COLUMNS.map((col) => (
                                <th
                                    key={String(col.key)}
                                    className={cx(
                                        "whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary",
                                        col.align === "right" && "text-right",
                                    )}
                                >
                                    <SortableHeader label={col.label} align={col.align} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={TRANSACAO_COLUMNS.length}
                                    className="px-4 py-12 text-center text-sm text-tertiary"
                                >
                                    Nenhuma transação corresponde aos filtros aplicados.
                                </td>
                            </tr>
                        )}
                        {visibleRows.map((row, i) => (
                            <tr
                                key={row.id}
                                className={cx(
                                    "transition duration-100 ease-linear hover:bg-primary_hover",
                                    i !== visibleRows.length - 1 && "border-b border-secondary",
                                )}
                            >
                                {TRANSACAO_COLUMNS.map((col) => (
                                    <td
                                        key={String(col.key)}
                                        className={cx(
                                            "whitespace-nowrap px-4 py-4 text-sm text-tertiary",
                                            col.align === "right" && "text-right",
                                            col.key === "id" && "font-mono text-xs text-secondary",
                                        )}
                                    >
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
/*  Shared primitives (consistency with VendasPorGrupo)               */
/* ------------------------------------------------------------------ */

interface CardProps {
    title: ReactNode;
    children: ReactNode;
    headerRight?: ReactNode;
}

const Card = ({ title, children, headerRight }: CardProps) => (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-4">
            <h3 className="flex items-center gap-2 text-md font-semibold text-primary">
                {title}
            </h3>
            {headerRight}
        </header>
        {children}
    </section>
);

interface StatBlockProps {
    label: string;
    value: string;
    className?: string;
}

const StatBlock = ({ label, value, className }: StatBlockProps) => (
    <div className={cx("flex flex-col gap-0.5", className)}>
        <span className="text-xs text-tertiary">{label}</span>
        <span className="text-sm font-medium text-primary tabular-nums">{value}</span>
    </div>
);

interface SortableHeaderProps {
    label: string;
    align?: "left" | "right";
}

const SortableHeader = ({ label, align = "left" }: SortableHeaderProps) => (
    <span className={cx("inline-flex items-center", align === "right" && "justify-end")}>
        {label}
    </span>
);
