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

const HIDE_TREND_AND_MENU = "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

/* ------------------------------------------------------------------ */
/*  Tree types + helpers                                              */
/* ------------------------------------------------------------------ */

type ColType = "int" | "currency";
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

const fmt = (value: number, type: ColType) => (type === "currency" ? currencyFormatter.format(value) : numberFormatter.format(value));

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
/*  Mock data — 3 visões                                              */
/* ------------------------------------------------------------------ */

const MACRO_COLUMNS: ColDef[] = [
    { label: "Ingressos", type: "int" },
    { label: "Validados", type: "int" },
    { label: "No-Show", type: "int" },
    { label: "Valor unitário", type: "currency" },
    { label: "Faturado", type: "currency" },
];

const macroData: TreeNode[] = [
    {
        label: "ONLINE",
        children: [
            {
                label: "Superior Leste",
                children: [
                    { label: "Inteira", values: [2126, 0, 2126, 80, 170080], changed: true },
                    { label: "Meia-Entrada", values: [2014, 0, 2014, 40, 80560] },
                    { label: "Diamante", values: [318, 0, 318, 200, 63600] },
                ],
            },
            {
                label: "Gramado Leste",
                children: [
                    { label: "Inteira", values: [2401, 0, 2401, 150, 360150] },
                    { label: "Meia-Entrada", values: [1552, 0, 1552, 75, 116400] },
                    { label: "Ouro", values: [251, 0, 251, 300, 75300] },
                ],
            },
            {
                label: "Gold Premium Sul – Bebidas não alcoólicas e comida à vontade",
                children: [
                    { label: "Inteira", values: [321, 0, 321, 220, 70620], changed: true },
                    { label: "Meia-Entrada", values: [404, 0, 404, 110, 44440] },
                ],
            },
        ],
    },
    {
        label: "IMPRESSO/BILHETERIA",
        children: [
            {
                label: "Superior Sul",
                children: [
                    { label: "Inteira", values: [289, 0, 289, 80, 23120], changed: true },
                    { label: "Meia-Entrada", values: [241, 0, 241, 40, 9640] },
                    { label: "Acompanhante", values: [68, 0, 68, 80, 5440] },
                ],
            },
            {
                label: "Adversário (Superior Visitante)",
                children: [
                    { label: "Inteira", values: [1688, 0, 1688, 130, 219440], changed: true },
                    { label: "Meia-Entrada", values: [980, 0, 980, 65, 63700] },
                ],
            },
            {
                label: "Camarote",
                children: [{ label: "Inteira", values: [210, 0, 210, 400, 84000] }],
            },
        ],
    },
];

const PDV_COLUMNS: ColDef[] = [
    { label: "Ingressos", type: "int" },
    { label: "Valor unitário", type: "currency" },
    { label: "Faturado", type: "currency" },
];

const pdvData: TreeNode[] = [
    {
        label: "Bilheteria Arena do Grêmio",
        children: [
            {
                label: "Superior Sul",
                children: [
                    { label: "Inteira", values: [289, 80, 23120] },
                    { label: "Meia-Entrada", values: [241, 40, 9640] },
                ],
            },
            {
                label: "Adversário (Superior Visitante)",
                children: [
                    { label: "Inteira", values: [1688, 130, 219440], changed: true },
                    { label: "Meia-Entrada", values: [980, 65, 63700] },
                ],
            },
        ],
    },
    {
        label: "Loja Oficial Grêmio - Arena",
        children: [
            {
                label: "Gramado Leste",
                children: [
                    { label: "Inteira", values: [2401, 150, 360150], changed: true },
                    { label: "Meia-Entrada", values: [1552, 75, 116400] },
                    { label: "Ouro", values: [251, 300, 75300] },
                ],
            },
        ],
    },
    {
        label: "Loja Oficial Grêmio - Shopping Iguatemi",
        children: [
            {
                label: "Superior Leste",
                children: [
                    { label: "Inteira", values: [2126, 80, 170080] },
                    { label: "Meia-Entrada", values: [2014, 40, 80560] },
                ],
            },
            {
                label: "Camarote",
                children: [{ label: "Inteira", values: [210, 400, 84000], changed: true }],
            },
        ],
    },
];

const meiosData: TreeNode[] = [
    {
        label: "Bilheteria Arena do Grêmio",
        children: [
            { label: "Cartão de Crédito", values: [612, 120, 73440] },
            { label: "Cartão de Débito", values: [438, 95, 41610] },
            { label: "Dinheiro", values: [205, 60, 12300], changed: true },
            { label: "PIX", values: [3258, 78, 254124] },
        ],
    },
    {
        label: "Loja Oficial Grêmio - Arena",
        children: [
            { label: "Cartão de Crédito", values: [684, 110, 75240] },
            { label: "Cartão de Débito", values: [312, 95, 29640] },
            { label: "Dinheiro", values: [98, 80, 7840], changed: true },
            { label: "PIX", values: [2410, 95, 228950] },
        ],
    },
];

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
    { id: "c1", hora: "há 1 min", tipo: "venda", canal: "Online", descricao: "Superior Leste · Inteira", ingressos: 4, valor: 320 },
    { id: "c2", hora: "há 2 min", tipo: "venda", canal: "Impresso/Bilheteria", descricao: "Superior Sul · Inteira", ingressos: 5, valor: 400 },
    { id: "c3", hora: "há 3 min", tipo: "cancelamento", canal: "Impresso/Bilheteria", descricao: "Adversário (Superior Visitante) · Inteira", ingressos: -1, valor: -130 },
    { id: "c4", hora: "há 4 min", tipo: "estorno", canal: "Online", descricao: "Gold Premium Sul · Inteira", ingressos: -1, valor: -220 },
];

type BorderoView = "macro" | "pdv" | "meios";

const VIEWS: Record<BorderoView, { nodes: TreeNode[]; columns: ColDef[]; firstCol: string }> = {
    macro: { nodes: macroData, columns: MACRO_COLUMNS, firstCol: "Canal · Setor · Tipo" },
    pdv: { nodes: pdvData, columns: PDV_COLUMNS, firstCol: "PDV · Setor · Tipo" },
    meios: { nodes: meiosData, columns: PDV_COLUMNS, firstCol: "PDV · Meio de pagamento" },
};

/* ------------------------------------------------------------------ */
/*  Scaling (sessão + intervalo de data afetam todas as visões)        */
/* ------------------------------------------------------------------ */

// Jogo único: a sessão da partida concentra 100% das vendas.
const SESSAO_WEIGHT: Record<string, number> = { all: 1, [EVENT.sessoes[0].id]: 1 };

// Escala valores de quantidade/faturado; mantém colunas de "valor unitário" intactas.
const scaleNodes = (nodes: TreeNode[], columns: ColDef[], factor: number): TreeNode[] =>
    nodes.map((n) => ({
        ...n,
        values: n.values?.map((v, i) => (columns[i]?.label === "Valor unitário" ? v : Math.round(v * factor * 100) / 100)),
        children: n.children ? scaleNodes(n.children, columns, factor) : undefined,
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
    const [view, setView] = useState<BorderoView>("macro");
    const [acknowledged, setAcknowledged] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const factor = (SESSAO_WEIGHT[sessao] ?? 1) * dateRangeFraction(dateRange);

    const scaled = useMemo(
        () => ({
            macro: scaleNodes(macroData, MACRO_COLUMNS, factor),
            pdv: scaleNodes(pdvData, PDV_COLUMNS, factor),
            meios: scaleNodes(meiosData, PDV_COLUMNS, factor),
        }),
        [factor],
    );

    const activeNodes = view === "macro" ? scaled.macro : view === "pdv" ? scaled.pdv : scaled.meios;
    const activeMeta = VIEWS[view];

    const macroGrand = useMemo(() => grandTotalOf(scaled.macro), [scaled.macro]);
    const totalIngressos = macroGrand[0] ?? 0;
    const totalFaturado = macroGrand[4] ?? 0;
    const ticketMedio = totalIngressos === 0 ? 0 : totalFaturado / totalIngressos;

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
                <MetricsIcon03 icon={CurrencyDollarCircle} subtitle="Total faturado" title={currencyFormatter.format(totalFaturado)} change={null} changeTrend="positive" actions={false} className={HIDE_TREND_AND_MENU} />
                <MetricsIcon03 icon={Ticket01} subtitle="Total de ingressos" title={numberFormatter.format(totalIngressos)} change={null} changeTrend="positive" actions={false} className={HIDE_TREND_AND_MENU} />
                <MetricsIcon03 icon={Receipt} subtitle="Ticket médio" title={currencyFormatter.format(ticketMedio)} change={null} changeTrend="positive" actions={false} className={HIDE_TREND_AND_MENU} />
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
                                { id: "macro", label: "Visão macro" },
                                { id: "pdv", label: "Por PDV" },
                                { id: "meios", label: "Por meios de pagamento" },
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
