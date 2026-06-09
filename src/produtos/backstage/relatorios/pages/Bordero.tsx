import { Fragment, useState, type ReactNode } from "react";
import { ChevronDown, CurrencyDollarCircle, Receipt, Ticket01, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { AlertFloating } from "@/components/application/alerts/alerts";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";

/* ------------------------------------------------------------------ */
/*  Formatters                                                        */
/* ------------------------------------------------------------------ */

const HIDE_TREND_AND_MENU = "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numberFormatter = new Intl.NumberFormat("pt-BR");

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
    /** Leaf metric values, aligned to the columns. */
    values?: number[];
    children?: TreeNode[];
    /** Linha que mudou nos últimos 5 minutos. */
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

// Ingressos · Validados · No-Show · Valor unitário · Faturado
const MACRO_COLUMNS: ColDef[] = [
    { label: "Ingressos", type: "int" },
    { label: "Validados", type: "int" },
    { label: "No-Show", type: "int" },
    { label: "Valor unitário", type: "currency" },
    { label: "Faturado", type: "currency" },
];

const macroData: TreeNode[] = [
    {
        label: "IMPRESSO/BILHETERIA",
        children: [
            {
                label: "PDV Visitante - Superior Norte",
                children: [
                    { label: "Inteira", values: [3, 0, 3, 120, 180] },
                    { label: "Meia", values: [1, 0, 1, 30, 30] },
                ],
            },
            {
                label: "PDV Inferior Norte",
                children: [
                    { label: "Inteira", values: [28, 0, 28, 200, 1120], changed: true },
                    { label: "Meia", values: [107, 0, 107, 100, 2140] },
                ],
            },
            {
                label: "PDV Inferior Sul",
                children: [
                    { label: "Inteira", values: [28, 0, 28, 200, 1120] },
                    { label: "Meia", values: [168, 0, 168, 220, 3360] },
                ],
            },
            {
                label: "PDV Setor Premium",
                children: [
                    { label: "Inteira", values: [4, 0, 4, 400, 800], changed: true },
                    { label: "Meia", values: [3, 0, 3, 200, 300] },
                ],
            },
        ],
    },
    {
        label: "online",
        children: [
            {
                label: "Site - Pista",
                children: [
                    { label: "Inteira", values: [120, 0, 120, 50, 6000] },
                    { label: "Meia", values: [80, 0, 80, 25, 2000] },
                ],
            },
            {
                label: "Site - Camarote",
                children: [{ label: "Inteira", values: [40, 0, 40, 300, 12000], changed: true }],
            },
        ],
    },
];

// Ingressos · Valor unitário · Faturado
const PDV_COLUMNS: ColDef[] = [
    { label: "Ingressos", type: "int" },
    { label: "Valor unitário", type: "currency" },
    { label: "Faturado", type: "currency" },
];

const pdvData: TreeNode[] = [
    {
        label: "PDV Fortaleza - AMOR ETERNO",
        children: [
            { label: "PDV Superior Sul", children: [{ label: "Meia-Entrada AMOR ETERNO", values: [9, 30, 270] }] },
            {
                label: "PDV Inferior Sul",
                children: [
                    { label: "Inteira AMOR ETERNO", values: [1, 40, 40] },
                    { label: "Meia-Entrada AMOR ETERNO", values: [6, 20, 120] },
                ],
            },
        ],
    },
    {
        label: "PDV Fortaleza - BRAVO",
        children: [{ label: "PDV Superior Central", children: [{ label: "Meia-Entrada BRAVO", values: [49, 40, 1960], changed: true }] }],
    },
    {
        label: "PDV Fortaleza - PICI",
        children: [
            {
                label: "PDV Superior Sul",
                children: [
                    { label: "Inteira PICI", values: [24, 60, 1440] },
                    { label: "Meia-Entrada PICI", values: [12, 30, 360] },
                ],
            },
            { label: "PDV Setor Premium", children: [{ label: "Inteira PICI", values: [4, 200, 800], changed: true }] },
        ],
    },
];

const meiosData: TreeNode[] = [
    {
        label: "PDV Fortaleza - AMOR ETERNO",
        children: [
            { label: "Cartão de Crédito", values: [1, 20, 20] },
            { label: "Cartão de Débito", values: [1, 40, 40] },
            { label: "Dinheiro", values: [11, 110, 300], changed: true },
            { label: "PIX", values: [9, 110, 230] },
        ],
    },
    {
        label: "PDV Fortaleza - PICI",
        children: [
            { label: "Cartão de Crédito", values: [29, 715, 1845] },
            { label: "Cartão de Débito", values: [37, 605, 1745] },
            { label: "Dinheiro", values: [45, 575, 1975], changed: true },
            { label: "PIX", values: [51, 575, 2315] },
        ],
    },
];

/* Transações que alteraram o borderô nos últimos 5 minutos. */
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
    { id: "c1", hora: "há 1 min", tipo: "venda", canal: "Online", descricao: "Site - Camarote · Inteira", ingressos: 2, valor: 600 },
    { id: "c2", hora: "há 2 min", tipo: "venda", canal: "Impresso/Bilheteria", descricao: "PDV Inferior Norte · Inteira", ingressos: 5, valor: 1000 },
    { id: "c3", hora: "há 3 min", tipo: "cancelamento", canal: "Impresso/Bilheteria", descricao: "PDV Setor Premium · Inteira", ingressos: -1, valor: -400 },
    { id: "c4", hora: "há 4 min", tipo: "estorno", canal: "Online", descricao: "Site - Pista · Meia", ingressos: -2, valor: -50 },
];

const macroGrand = grandTotalOf(macroData);
const totalIngressos = macroGrand[0] ?? 0;
const totalFaturado = macroGrand[4] ?? 0;
const ticketMedio = totalIngressos === 0 ? 0 : totalFaturado / totalIngressos;

type BorderoView = "macro" | "pdv" | "meios";

const VIEWS: Record<BorderoView, { nodes: TreeNode[]; columns: ColDef[]; firstCol: string }> = {
    macro: { nodes: macroData, columns: MACRO_COLUMNS, firstCol: "Canal · Grupo · Tipo" },
    pdv: { nodes: pdvData, columns: PDV_COLUMNS, firstCol: "PDV · Setor · Tipo" },
    meios: { nodes: meiosData, columns: PDV_COLUMNS, firstCol: "PDV · Meio de pagamento" },
};

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Bordero() {
    const [view, setView] = useState<BorderoView>("macro");
    const [acknowledged, setAcknowledged] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const active = VIEWS[view];
    const changedCount = changedTransacoes.length;
    const showBanner = changedCount > 0 && !acknowledged;

    return (
        <BackstageLayout activeSection="relatorios" activeItem="bordero">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    <RelatorioPageHeader title="Borderô" />

                    {/* Métricas */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <MetricsIcon03
                            icon={CurrencyDollarCircle}
                            subtitle="Total faturado"
                            title={currencyFormatter.format(totalFaturado)}
                            change={null}
                            changeTrend="positive"
                            actions={false}
                            className={HIDE_TREND_AND_MENU}
                        />
                        <MetricsIcon03
                            icon={Ticket01}
                            subtitle="Total de ingressos"
                            title={numberFormatter.format(totalIngressos)}
                            change={null}
                            changeTrend="positive"
                            actions={false}
                            className={HIDE_TREND_AND_MENU}
                        />
                        <MetricsIcon03
                            icon={Receipt}
                            subtitle="Ticket médio"
                            title={currencyFormatter.format(ticketMedio)}
                            change={null}
                            changeTrend="positive"
                            actions={false}
                            className={HIDE_TREND_AND_MENU}
                        />
                    </div>

                    {/* Aviso de variação t → t+5min */}
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

                    {/* Tabs + tabela */}
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

                        <TreeTable key={view} nodes={active.nodes} columns={active.columns} firstCol={active.firstCol} />
                    </section>
                </main>
            </div>

            <BorderoChangesSlideout isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} changes={changedTransacoes} />
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Slideout — detalhes das transações                                */
/* ------------------------------------------------------------------ */

const signed = (value: number, currency: boolean) => {
    const formatted = currency ? currencyFormatter.format(Math.abs(value)) : numberFormatter.format(Math.abs(value));
    return `${value >= 0 ? "+" : "−"}${formatted}`;
};

interface BorderoChangesSlideoutProps {
    isOpen: boolean;
    onClose: () => void;
    changes: BorderoChange[];
}

const BorderoChangesSlideout = ({ isOpen, onClose, changes }: BorderoChangesSlideoutProps) => (
    <AriaModalOverlay
        isOpen={isOpen}
        onOpenChange={(open) => !open && onClose()}
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
                    "h-full w-full max-w-[440px] bg-primary shadow-xl outline-hidden",
                    isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                    isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                )
            }
        >
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
                                        <span className="text-xs text-tertiary">
                                            {change.canal} · {change.hora}
                                        </span>
                                    </div>
                                    <Badge size="sm" color={meta.color} type="pill-color">
                                        {meta.label}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-tertiary">
                                    <span>
                                        Ingressos:{" "}
                                        <b className={cx("tabular-nums", change.ingressos >= 0 ? "text-success-primary" : "text-error-primary")}>
                                            {signed(change.ingressos, false)}
                                        </b>
                                    </span>
                                    <span>
                                        Faturado:{" "}
                                        <b className={cx("tabular-nums", change.valor >= 0 ? "text-success-primary" : "text-error-primary")}>
                                            {signed(change.valor, true)}
                                        </b>
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
/*  Tree table (mesmo visual de "Ocupação por setor")                 */
/* ------------------------------------------------------------------ */

interface TreeTableProps {
    nodes: TreeNode[];
    columns: ColDef[];
    firstCol: string;
}

const TreeTable = ({ nodes, columns, firstCol }: TreeTableProps) => {
    // Começa tudo fechado.
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
    const grand = grandTotalOf(nodes);
    const lastCol = columns.length - 1;
    const indent = (depth: number) => 16 + depth * 24;

    const toggle = (key: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });

    const metricCell = (value: number, colIdx: number, valueClass: string) => (
        <td
            key={colIdx}
            className={cx("whitespace-nowrap px-4 py-3.5 text-right text-sm", colIdx < lastCol && "hidden md:table-cell", valueClass)}
        >
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
                // Nível 0 (canal/PDV) mais forte; níveis internos um pouco mais leves.
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
                            className={cx(
                                "cursor-pointer border-b border-secondary transition duration-100 ease-linear hover:bg-primary_hover",
                                depth === 0 && "bg-primary",
                            )}
                        >
                            <td className="py-3.5 pr-4 text-sm" style={{ paddingLeft: indent(depth) }}>
                                <span className="flex items-center gap-2">
                                    <ChevronDown
                                        aria-hidden="true"
                                        className={cx(
                                            "size-4 shrink-0 text-fg-quaternary transition-transform duration-150",
                                            isExpanded && "rotate-180",
                                        )}
                                    />
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
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">{firstCol}</th>
                        {columns.map((col, i) => (
                            <th
                                key={col.label}
                                className={cx(
                                    "whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary",
                                    i < lastCol && "hidden md:table-cell",
                                )}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {renderNodes(nodes, 0, "n")}
                    <tr className="border-t-2 border-secondary bg-secondary">
                        <td className="px-4 py-3.5 text-sm font-bold text-primary">Total geral</td>
                        {grand.map((v, i) => (
                            <td
                                key={i}
                                className={cx(
                                    "whitespace-nowrap px-4 py-3.5 text-right text-sm font-bold text-primary",
                                    i < lastCol && "hidden md:table-cell",
                                )}
                            >
                                {fmt(v, columns[i].type)}
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
