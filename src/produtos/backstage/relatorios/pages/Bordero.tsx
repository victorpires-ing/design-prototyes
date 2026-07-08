import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, CurrencyDollarCircle, Receipt, Ticket01, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { toast } from "sonner";
import { AlertFloating } from "@/components/application/alerts/alerts";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ExportMenu, RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, dateRangeFraction, useRelatorioFilters } from "../components/relatorio-filters";
import { SortableHeader } from "../components/SortableHeader";
import { useSortableTable } from "../utils/useSortableTable";
import { EVENT, currencyFormatter, numberFormatter } from "../data/event";
import { COMBOS, TOTAL_GMV } from "../data/produtos";

const HIDE_TREND_AND_MENU = "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

/* ------------------------------------------------------------------ */
/*  Tree types + helpers                                              */
/* ------------------------------------------------------------------ */

type ColType = "int" | "currency" | "text";
interface ColDef {
    label: string;
    type: ColType;
}

interface TreeNode {
    label: string;
    values?: number[];
    children?: TreeNode[];
    changed?: boolean;
}

const fmt = (value: number, type: ColType) => (type === "text" ? "-" : type === "currency" ? currencyFormatter.format(value) : numberFormatter.format(value));

const subtotalOf = (node: TreeNode): number[] => {
    if (node.values) return node.values;
    return (node.children ?? []).reduce<number[]>((acc, child) => {
        const cs = subtotalOf(child);
        return cs.map((v, i) => (acc[i] ?? 0) + v);
    }, []);
};

const grandTotalOf = (nodes: TreeNode[]): number[] =>
    nodes.reduce<number[]>((acc, node) => {
        const s = subtotalOf(node);
        return s.map((v, i) => (acc[i] ?? 0) + v);
    }, []);

/* ------------------------------------------------------------------ */
/*  Mock — borderô por combo (bruto → taxa → líquido). O Réveillon      */
/*  vende 100% online (sem PDV/bilheteria); visões por combo, grupo e   */
/*  meio de pagamento.                                                  */
/* ------------------------------------------------------------------ */

const TAXA_PCT = 0.1; // taxa de serviço retida (bruto → líquido)
const generoLabel = (g: string) => (g === "MASCULINO" ? "Masculino" : "Feminino");

// Colunas financeiras — mesmas em todas as visões.
const FIN_COLUMNS: ColDef[] = [
    { label: "Quantidade", type: "int" },
    { label: "Valor bruto", type: "currency" },
    { label: "Taxa", type: "currency" },
    { label: "Valor líquido", type: "currency" },
];

const leaf = (label: string, qtd: number, bruto: number): TreeNode => {
    const taxa = Math.round(bruto * TAXA_PCT);
    return { label, values: [qtd, bruto, taxa, bruto - taxa] };
};
const comboLeaf = (c: (typeof COMBOS)[number]): TreeNode => leaf(generoLabel(c.genero), c.quantidade, c.preco * c.quantidade);
const combosDoGrupo = (grupo: string) => COMBOS.filter((c) => c.grupo === grupo);

// Por combo: Canal (Online) → Grupo → Combo.
const macroData: TreeNode[] = [
    {
        label: "Online",
        children: [
            { label: "NIGHT PASS", children: combosDoGrupo("NIGHT PASS").map(comboLeaf) },
            { label: "FULL PASS", children: combosDoGrupo("FULL PASS").map(comboLeaf) },
        ],
    },
];

// Por grupo: Grupo → Combo.
const grupoData: TreeNode[] = [
    { label: "NIGHT PASS", children: combosDoGrupo("NIGHT PASS").map(comboLeaf) },
    { label: "FULL PASS", children: combosDoGrupo("FULL PASS").map(comboLeaf) },
];

// Por meio de pagamento: distribui o total por pesos plausíveis (100% online).
const MEIOS: { nome: string; peso: number }[] = [
    { nome: "Pix", peso: 0.548 },
    { nome: "Cartão de Crédito", peso: 0.312 },
    { nome: "NuPay", peso: 0.058 },
    { nome: "Apple Pay", peso: 0.042 },
    { nome: "Google Pay", peso: 0.026 },
    { nome: "Cartão de Débito", peso: 0.014 },
];
const TOTAL_QTD = COMBOS.reduce((s, c) => s + c.quantidade, 0);
const meiosData: TreeNode[] = [
    {
        label: "Online",
        children: MEIOS.map((m) => leaf(m.nome, Math.round(TOTAL_QTD * m.peso), Math.round(TOTAL_GMV * m.peso))),
    },
];

/* ---- Alterações recentes (banner + slideout) ---- */
type ChangeType = "venda" | "cancelamento" | "estorno";

interface BorderoChange {
    id: string;
    hora: string;
    tipo: ChangeType;
    canal: string;
    descricao: string;
    ingressos: number;
    valor: number;
}

const CHANGE_META: Record<ChangeType, { label: string; color: "success" | "gray" | "error" }> = {
    venda: { label: "Venda", color: "success" },
    cancelamento: { label: "Cancelamento", color: "gray" },
    estorno: { label: "Estorno", color: "error" },
};

const changedTransacoes: BorderoChange[] = [
    { id: "c1", hora: "há 1 min", tipo: "venda", canal: "Online", descricao: "FULL PASS | Feminino", ingressos: 1, valor: 9800 },
    { id: "c2", hora: "há 2 min", tipo: "venda", canal: "Online", descricao: "NIGHT PASS | Masculino", ingressos: 2, valor: 7800 },
    { id: "c3", hora: "há 4 min", tipo: "cancelamento", canal: "Online", descricao: "NIGHT PASS | Feminino", ingressos: -1, valor: -3900 },
    { id: "c4", hora: "há 6 min", tipo: "estorno", canal: "Online", descricao: "FULL PASS | Masculino", ingressos: -1, valor: -9800 },
];

type BorderoView = "combo" | "grupo" | "meios";

const VIEWS: Record<BorderoView, { nodes: TreeNode[]; columns: ColDef[]; firstCol: string }> = {
    combo: { nodes: macroData, columns: FIN_COLUMNS, firstCol: "Canal · Grupo · Combo" },
    grupo: { nodes: grupoData, columns: FIN_COLUMNS, firstCol: "Grupo · Combo" },
    meios: { nodes: meiosData, columns: FIN_COLUMNS, firstCol: "Canal · Meio de pagamento" },
};

/* ------------------------------------------------------------------ */
/*  Escala (sessão + intervalo de data)                                */
/* ------------------------------------------------------------------ */

const SESSAO_WEIGHT: Record<string, number> = { all: 1 };

const scaleNodes = (nodes: TreeNode[], _columns: ColDef[], factor: number): TreeNode[] =>
    nodes.map((n) => ({
        ...n,
        values: n.values?.map((v) => Math.round(v * factor)),
        children: n.children ? scaleNodes(n.children, _columns, factor) : undefined,
    }));

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Bordero() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="bordero">
            <RelatorioFiltersProvider sessoes={EVENT.sessoes}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                        <RelatorioPageHeader
                            title="Borderô"
                            filtroVariante="dropdown"
                            mostrarPeriodo={false}
                            actions={<ExportMenu onExport={(f) => toast.success(`Exportando ${f.toUpperCase()}`, { description: "O borderô será exportado." })} />}
                        />
                        <BorderoBody />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const BorderoBody = () => {
    const { dateRange, sessao } = useRelatorioFilters();
    const [view, setView] = useState<BorderoView>("combo");
    const [acknowledged, setAcknowledged] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const factor = (SESSAO_WEIGHT[sessao] ?? 1) * dateRangeFraction(dateRange);

    const scaled = useMemo(
        () => ({
            combo: scaleNodes(macroData, FIN_COLUMNS, factor),
            grupo: scaleNodes(grupoData, FIN_COLUMNS, factor),
            meios: scaleNodes(meiosData, FIN_COLUMNS, factor),
        }),
        [factor],
    );

    const activeNodes = scaled[view];
    const activeMeta = VIEWS[view];

    const grand = useMemo(() => grandTotalOf(scaled.combo), [scaled.combo]);
    const totalIngressos = grand[0] ?? 0;
    const totalFaturado = grand[1] ?? 0;
    const totalLiquido = grand[3] ?? 0;

    const changedCount = changedTransacoes.length;
    const showBanner = changedCount > 0 && !acknowledged;

    return (
        <>
            {showBanner && (
                <AlertFloating
                    color="warning"
                    title="Borderô atualizado"
                    description={`${changedCount} ${changedCount === 1 ? "transação alterou" : "transações alteraram"} o borderô nos últimos 5 minutos.`}
                    confirmLabel="Detalhes"
                    onConfirm={() => setDetailsOpen(true)}
                    dismissLabel="Marcar como visto"
                    onClose={() => setAcknowledged(true)}
                />
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricsIcon03 icon={CurrencyDollarCircle} subtitle="Valor bruto" title={currencyFormatter.format(totalFaturado)} change={null} changeTrend="positive" actions={false} className={HIDE_TREND_AND_MENU} />
                <MetricsIcon03 icon={Receipt} subtitle="Valor líquido" title={currencyFormatter.format(totalLiquido)} change={null} changeTrend="positive" actions={false} className={HIDE_TREND_AND_MENU} />
                <MetricsIcon03 icon={Ticket01} subtitle="Combos vendidos" title={numberFormatter.format(totalIngressos)} change={null} changeTrend="positive" actions={false} className={HIDE_TREND_AND_MENU} />
            </div>

            <section className="flex flex-col overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
                <header className="flex flex-col gap-3 border-b border-secondary px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-md font-semibold text-primary">Detalhamento do borderô</h3>
                    <Tabs
                        selectedKey={view}
                        onSelectionChange={(value: React.Key) => {
                            setView(value as BorderoView);
                            setAcknowledged(false);
                        }}
                        className="w-auto shrink-0"
                    >
                        <TabList
                            type="button-minimal"
                            items={[
                                { id: "combo", label: "Por combo" },
                                { id: "grupo", label: "Por grupo" },
                                { id: "meios", label: "Por meio de pagamento" },
                            ]}
                        />
                    </Tabs>
                </header>

                <TreeTable key={view} nodes={activeNodes} columns={activeMeta.columns} firstCol={activeMeta.firstCol} />
            </section>

            <BorderoChangesSlideout isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} changes={changedTransacoes} />
        </>
    );
};

/* ------------------------------------------------------------------ */
/*  Slideout — detalhes das transações                                */
/* ------------------------------------------------------------------ */

const signed = (value: number, currency: boolean) => {
    const formatted = currency ? currencyFormatter.format(Math.abs(value)) : numberFormatter.format(Math.abs(value));
    return `${value >= 0 ? "+" : "−"}${formatted}`;
};

const BorderoChangesSlideout = ({ isOpen, onClose, changes }: { isOpen: boolean; onClose: () => void; changes: BorderoChange[] }) => (
    <AriaModalOverlay
        isOpen={isOpen}
        onOpenChange={(open) => !open && onClose()}
        isDismissable
        className={({ isEntering, isExiting }) => cx("fixed inset-0 z-50 flex justify-end bg-overlay/70 outline-hidden backdrop-blur-[2px]", isEntering && "duration-300 ease-out animate-in fade-in", isExiting && "duration-200 ease-in animate-out fade-out")}
    >
        <AriaModal className={({ isEntering, isExiting }) => cx("h-full w-full max-w-[440px] bg-primary shadow-xl outline-hidden", isEntering && "duration-300 ease-out animate-in slide-in-from-right", isExiting && "duration-200 ease-in animate-out slide-out-to-right")}>
            <AriaDialog className="flex h-full flex-col outline-hidden">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-secondary px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-md font-semibold text-primary">Transações dos últimos 5 minutos</h2>
                        <p className="text-sm text-tertiary">Alterações que impactaram o borderô.</p>
                    </div>
                    <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                </div>

                <ul className="flex min-h-0 flex-1 flex-col divide-y divide-secondary overflow-y-auto px-5">
                    {changes.map((change) => {
                        const meta = CHANGE_META[change.tipo];
                        return (
                            <li key={change.id} className="flex flex-col gap-2 py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 flex-col">
                                        <span className="text-sm font-medium text-primary">{change.descricao}</span>
                                        <span className="text-xs text-tertiary">{change.canal} · {change.hora}</span>
                                    </div>
                                    <Badge size="sm" color={meta.color} type="pill-color">
                                        {meta.label}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-tertiary">
                                    <span>
                                        Ingressos: <b className={cx("tabular-nums", change.ingressos >= 0 ? "text-success-primary" : "text-error-primary")}>{signed(change.ingressos, false)}</b>
                                    </span>
                                    <span>
                                        Faturado: <b className={cx("tabular-nums", change.valor >= 0 ? "text-success-primary" : "text-error-primary")}>{signed(change.valor, true)}</b>
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </AriaDialog>
        </AriaModal>
    </AriaModalOverlay>
);

/* ------------------------------------------------------------------ */
/*  Tree table (com ordenação dos nós de topo)                        */
/* ------------------------------------------------------------------ */

const TreeTable = ({ nodes, columns, firstCol }: { nodes: TreeNode[]; columns: ColDef[]; firstCol: string }) => {
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
    const lastCol = columns.length - 1;
    const indent = (depth: number) => 16 + depth * 24;

    const accessors = useMemo(() => {
        const acc: Record<string, (n: TreeNode) => string | number> = { label: (n) => n.label };
        columns.forEach((_, i) => {
            acc[`c${i}`] = (n) => subtotalOf(n)[i] ?? 0;
        });
        return acc;
    }, [columns]);

    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(nodes as unknown as Record<string, unknown>[], accessors as Partial<Record<string, (r: Record<string, unknown>) => string | number>>);
    const sortedNodes = sorted as unknown as TreeNode[];

    const grand = grandTotalOf(nodes);

    const toggle = (key: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });

    const metricCell = (value: number, colIdx: number, valueClass: string) => (
        <td key={colIdx} className={cx("whitespace-nowrap px-4 py-3.5 text-right text-sm", colIdx < lastCol && "hidden md:table-cell", valueClass)}>
            {fmt(value, columns[colIdx].type)}
        </td>
    );

    const renderNodes = (list: TreeNode[], depth: number, prefix: string): ReactNode[] => {
        const out: ReactNode[] = [];
        list.forEach((node, idx) => {
            const key = `${prefix}-${idx}`;
            if (node.children) {
                const isExpanded = expanded.has(key);
                const sub = subtotalOf(node);
                const labelClass = depth === 0 ? "font-bold text-primary" : "font-semibold text-secondary";
                const valueClass = depth === 0 ? "font-semibold text-primary" : "font-medium text-secondary";
                out.push(
                    <Fragment key={key}>
                        <tr
                            role="button"
                            tabIndex={0}
                            aria-expanded={isExpanded}
                            onClick={() => toggle(key)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    toggle(key);
                                }
                            }}
                            className={cx("cursor-pointer border-b border-secondary transition duration-100 ease-linear hover:bg-primary_hover", depth === 0 && "bg-primary")}
                        >
                            <td className="py-3.5 pr-4 text-sm" style={{ paddingLeft: indent(depth) }}>
                                <span className="flex items-center gap-2">
                                    <ChevronDown aria-hidden="true" className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", isExpanded && "rotate-180")} />
                                    <span className={cx("line-clamp-2", labelClass)}>{node.label}</span>
                                </span>
                            </td>
                            {sub.map((v, i) => metricCell(v, i, valueClass))}
                        </tr>
                        {isExpanded && renderNodes(node.children!, depth + 1, key)}
                    </Fragment>,
                );
                return;
            }
            out.push(
                <tr key={key} className="border-b border-secondary bg-secondary/60">
                    <td className="py-3 pr-4 text-sm text-tertiary" style={{ paddingLeft: indent(depth) }}>
                        <span className="line-clamp-2">{node.label}</span>
                    </td>
                    {node.values!.map((v, i) => metricCell(v, i, i === lastCol ? "font-medium text-primary" : "text-tertiary"))}
                </tr>,
            );
        });
        return out;
    };

    return (
        <div className="overflow-x-auto overflow-y-clip">
            <table className="w-full table-fixed border-collapse">
                <colgroup>
                    <col className="w-[60%] md:w-auto" />
                    {columns.map((_, i) => (
                        <col key={i} className={i < lastCol ? "hidden md:table-column" : undefined} />
                    ))}
                </colgroup>
                <thead className="bg-secondary">
                    <tr className="border-b border-secondary text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label={firstCol} sortKey="label" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        {columns.map((col, i) => (
                            <th key={col.label} className={cx("whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary", i < lastCol && "hidden md:table-cell")}>
                                <SortableHeader label={col.label} align="right" sortKey={`c${i}`} activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {renderNodes(sortedNodes, 0, "n")}
                    <tr className="border-t-2 border-secondary bg-secondary">
                        <td className="px-4 py-3.5 text-sm font-bold text-primary">Total geral</td>
                        {grand.map((v, i) => (
                            <td key={i} className={cx("whitespace-nowrap px-4 py-3.5 text-right text-sm font-bold text-primary", i < lastCol && "hidden md:table-cell")}>
                                {fmt(v, columns[i].type)}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
