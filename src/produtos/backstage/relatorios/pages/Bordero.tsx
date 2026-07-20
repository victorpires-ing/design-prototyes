import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, CurrencyDollarCircle, Receipt, Ticket01, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { toast } from "sonner";
import { AlertFloating } from "@/components/application/alerts/alerts";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ExportMenu, RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, dateRangeFraction, useRelatorioFilters } from "../components/relatorio-filters";
import { SortableHeader } from "../components/SortableHeader";
import { useSortableTable } from "../utils/useSortableTable";
import { EVENT, currencyFormatter, numberFormatter } from "../data/event";
import { consultarPeriodo, PERIODO_PADRAO } from "@/reports/event-dataset";

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
/*  Mock data — 3 visões                                              */
/* ------------------------------------------------------------------ */

const MACRO_COLUMNS: ColDef[] = [
    { label: "Bundle", type: "text" },
    { label: "Produto", type: "text" },
    { label: "Quantidade", type: "int" },
    { label: "Valor unitário", type: "currency" },
    { label: "Valor Total", type: "currency" },
];

const macroData: TreeNode[] = [
    {
        label: "BILHETERIA",
        children: [
            {
                label: "Tribuna",
                children: [
                    { label: "Família Jogadores", values: [0, 0, 54, 0, 0] },
                    { label: "Estádio", values: [0, 0, 4, 0, 0] },
                    { label: "Patrocinador", values: [0, 0, 1, 0, 0] },
                ],
            },
            {
                label: "Sul (Visitante)",
                children: [
                    { label: "Gratuidade - PCD", values: [0, 0, 8, 0, 0] },
                    { label: "Gratuidade - Maior de 60 Anos", values: [0, 0, 37, 0, 0] },
                    { label: "Acompanhante PCD", values: [0, 0, 2, 0, 0] },
                    { label: "Reciprocidade", values: [0, 0, 35, 0, 0] },
                ],
            },
            {
                label: "Oeste Superior B",
                children: [
                    { label: "Gratuidade - Maior de 60 Anos", values: [0, 0, 245, 0, 0] },
                    { label: "Gratuidade - Menor de 12 Anos", values: [0, 0, 40, 0, 0] },
                ],
            },
            {
                label: "Oeste Inferior",
                children: [
                    { label: "Gratuidade - Maior de 60 Anos", values: [0, 0, 410, 0, 0] },
                    { label: "Familia Jogadores", values: [0, 0, 139, 0, 0] },
                    { label: "Acompanhante PCD", values: [0, 0, 20, 0, 0] },
                    { label: "FERJ", values: [0, 0, 14, 0, 0] },
                    { label: "Gratuidade - PCD", values: [0, 0, 40, 0, 0] },
                    { label: "Gratuidade - Menor de 12 Anos", values: [0, 0, 80, 0, 0] },
                    { label: "Patrocinador", values: [0, 0, 59, 0, 0] },
                    { label: "Sócio Proprietário", values: [0, 0, 115, 0, 0] },
                    { label: "Relacionamento", values: [0, 0, 78, 0, 0] },
                    { label: "BEPE", values: [0, 0, 21, 0, 0] },
                    { label: "Resgate OFF Rio", values: [0, 0, 9, 0, 0] },
                    { label: "NIKE", values: [0, 0, 7, 0, 0] },
                    { label: "CPE Estado Maior", values: [0, 0, 3, 0, 0] },
                    { label: "Aquecimento", values: [0, 0, 8, 0, 0] },
                    { label: "Bombeiro (DDP)", values: [0, 0, 9, 0, 0] },
                    { label: "Acompanhante Backstage Tour", values: [0, 0, 3, 0, 0] },
                    { label: "3º BATALHÃO", values: [0, 0, 10, 0, 0] },
                    { label: "Intervalo", values: [0, 0, 2, 0, 0] },
                    { label: "24 DP", values: [0, 0, 3, 0, 0] },
                    { label: "Backstage Tour", values: [0, 0, 3, 0, 0] },
                ],
            },
            {
                label: "Leste Superior",
                children: [
                    { label: "Gratuidade - Menor de 12 Anos", values: [0, 0, 285, 0, 0] },
                    { label: "Gratuidade - Maior de 60 Anos", values: [0, 0, 714, 0, 0] },
                    { label: "Patrocinador", values: [0, 0, 7, 0, 0] },
                    { label: "Bateria", values: [0, 0, 11, 0, 0] },
                ],
            },
            {
                label: "Leste Inferior",
                children: [
                    { label: "Gratuidade - Maior de 60 Anos", values: [0, 0, 355, 0, 0] },
                    { label: "Patrocinador", values: [0, 0, 30, 0, 0] },
                    { label: "Relacionamento", values: [0, 0, 40, 0, 0] },
                    { label: "Sócio Proprietário", values: [0, 0, 45, 0, 0] },
                    { label: "Gratuidade - Menor de 12 Anos", values: [0, 0, 100, 0, 0] },
                    { label: "Gratuidade - PCD", values: [0, 0, 30, 0, 0] },
                    { label: "Acompanhante PCD", values: [0, 0, 15, 0, 0] },
                    { label: "Reciprocidade", values: [0, 0, 60, 0, 0] },
                    { label: "Familia Jogadores", values: [0, 0, 80, 0, 0] },
                    { label: "Bateria", values: [0, 0, 15, 0, 0] },
                ],
            },
            {
                label: "Camarote",
                children: [
                    { label: "Gratuidade - Menor de 12 Anos", values: [0, 0, 60, 0, 0] },
                    { label: "Família Jogadores", values: [0, 0, 30, 0, 0] },
                    { label: "Patrocinador", values: [0, 0, 30, 0, 0] },
                ],
            },
            {
                label: "3º Andar Leste",
                children: [
                    { label: "Gratuidade - Maior de 60 Anos", values: [0, 0, 150, 0, 0] },
                    { label: "Família Jogadores", values: [0, 0, 50, 0, 0] },
                    { label: "Reciprocidade", values: [0, 0, 54, 0, 0] },
                ],
            },
        ],
    },
    {
        label: "ONLINE",
        children: [
            {
                label: "Tribuna",
                children: [
                    { label: "Futebol", values: [0, 0, 10, 120, 1200] },
                ],
            },
            {
                label: "Sul (Visitante)",
                children: [
                    { label: "Meia-Entrada", values: [0, 0, 6, 40, 240] },
                    { label: "Inteira", values: [0, 0, 7, 80, 560] },
                ],
            },
            {
                label: "Oeste Superior B",
                children: [
                    { label: "Meia-Entrada", values: [0, 0, 1683, 30, 50490] },
                    { label: "Inteira", values: [0, 0, 1051, 60, 63060] },
                    { label: "Acompanhante Glorioso", values: [0, 0, 61, 24, 1464] },
                    { label: "Branco", values: [0, 0, 71, 30, 2130] },
                    { label: "Glorioso", values: [0, 0, 44, 0, 0] },
                    { label: "Alvinegro OFF Rio", values: [0, 0, 11, 12, 132] },
                    { label: "Preto", values: [0, 0, 65, 24, 1560] },
                    { label: "Alvinegro", values: [0, 0, 93, 0, 0] },
                ],
            },
            {
                label: "Oeste Inferior",
                children: [
                    { label: "Meia-Entrada", values: [0, 0, 1337, 50, 66850] },
                    { label: "Inteira", values: [0, 0, 508, 100, 50800] },
                    { label: "Alvinegro", values: [0, 0, 1163, 0, 0] },
                    { label: "Preto", values: [0, 0, 314, 20, 6280] },
                    { label: "Acompanhante Glorioso", values: [0, 0, 351, 40, 14040] },
                    { label: "Glorioso", values: [0, 0, 502, 0, 0] },
                    { label: "Funcionário Glorioso", values: [0, 0, 30, 0, 0] },
                    { label: "Branco", values: [0, 0, 262, 30, 7860] },
                    { label: "Alvinegro OFF Rio", values: [0, 0, 48, 20, 960] },
                ],
            },
            {
                label: "Leste Superior",
                children: [
                    { label: "Meia-Entrada", values: [0, 0, 3877, 20, 77540] },
                    { label: "Inteira", values: [0, 0, 2225, 40, 89000] },
                    { label: "Acompanhante Glorioso", values: [0, 0, 423, 16, 6768] },
                    { label: "Preto", values: [0, 0, 441, 15, 6615] },
                    { label: "Branco", values: [0, 0, 364, 20, 7280] },
                    { label: "Glorioso", values: [0, 0, 402, 0, 0] },
                    { label: "Alvinegro", values: [0, 0, 1089, 0, 0] },
                    { label: "Alvinegro OFF Rio", values: [0, 0, 110, 8, 880] },
                    { label: "Sócio Torcida", values: [0, 0, 68, 0, 0] },
                ],
            },
            {
                label: "Leste Inferior",
                children: [
                    { label: "Meia-Entrada", values: [0, 0, 1491, 40, 59640] },
                    { label: "Inteira", values: [0, 0, 700, 80, 56000] },
                    { label: "Alvinegro", values: [0, 0, 900, 0, 0] },
                    { label: "Glorioso", values: [0, 0, 400, 0, 0] },
                    { label: "Acompanhante Glorioso", values: [0, 0, 200, 40, 8000] },
                    { label: "Preto", values: [0, 0, 150, 20, 3000] },
                    { label: "Branco", values: [0, 0, 120, 30, 3600] },
                    { label: "Alvinegro OFF Rio", values: [0, 0, 65, 20, 1300] },
                    { label: "Funcionário Glorioso", values: [0, 0, 50, 0, 0] },
                    { label: "Sócio Torcida", values: [0, 0, 135, 0, 0] },
                ],
            },
            {
                label: "Camarote",
                children: [
                    { label: "Inteira", values: [0, 0, 40, 60, 2400] },
                ],
            },
            {
                label: "3º Andar Oeste",
                children: [
                    { label: "Inteira", values: [0, 0, 50, 60, 3000] },
                    { label: "Alvinegro", values: [0, 0, 120, 0, 0] },
                    { label: "Glorioso", values: [0, 0, 80, 0, 0] },
                    { label: "Branco", values: [0, 0, 30, 30, 900] },
                    { label: "Preto", values: [0, 0, 50, 0, 0] },
                ],
            },
            {
                label: "3º Andar Leste",
                children: [
                    { label: "Meia-Entrada", values: [0, 0, 175, 20, 3500] },
                    { label: "Branco", values: [0, 0, 40, 30, 1200] },
                    { label: "Alvinegro OFF Rio", values: [0, 0, 1, 24, 24] },
                    { label: "Alvinegro", values: [0, 0, 800, 0, 0] },
                    { label: "Glorioso", values: [0, 0, 350, 0, 0] },
                ],
            },
        ],
    },
];

const PDV_COLUMNS: ColDef[] = [
    { label: "Quantidade", type: "int" },
    { label: "Valor unitário", type: "currency" },
    { label: "Valor Total", type: "currency" },
];

const pdvData: TreeNode[] = [
    {
        label: "Bilheteria Estádio Nilton Santos",
        children: [
            {
                label: "Tribuna",
                children: [{ label: "Futebol", values: [10, 120, 1200] }],
            },
            {
                label: "Sul (Visitante)",
                children: [
                    { label: "Inteira", values: [7, 80, 560], changed: true },
                    { label: "Meia-Entrada", values: [6, 40, 240] },
                ],
            },
        ],
    },
    {
        label: "Loja Oficial Botafogo - Nilton Santos",
        children: [
            {
                label: "Oeste Inferior",
                children: [
                    { label: "Meia-Entrada", values: [1337, 50, 66850], changed: true },
                    { label: "Inteira", values: [508, 100, 50800] },
                ],
            },
        ],
    },
    {
        label: "Loja Oficial Botafogo - Shopping Rio Sul",
        children: [
            {
                label: "Leste Inferior",
                children: [
                    { label: "Meia-Entrada", values: [1491, 40, 59640] },
                    { label: "Inteira", values: [700, 80, 56000], changed: true },
                ],
            },
        ],
    },
];

const meiosData: TreeNode[] = [
    {
        label: "Bilheteria Estádio Nilton Santos",
        children: [
            { label: "Dinheiro", values: [23, 150, 3450], changed: true },
            { label: "Cartão de Débito", values: [10, 90, 900] },
        ],
    },
    {
        label: "Loja Oficial Botafogo - Shopping Rio Sul",
        children: [
            { label: "Cartão de Crédito", values: [320, 95, 30400] },
            { label: "PIX", values: [1800, 55, 99000], changed: true },
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
    produtos: number;
    valor: number;
}

const CHANGE_META: Record<ChangeType, { label: string; color: "success" | "gray" | "error" }> = {
    venda: { label: "Venda", color: "success" },
    cancelamento: { label: "Cancelamento", color: "gray" },
    estorno: { label: "Estorno", color: "error" },
};

const changedTransacoes: BorderoChange[] = [
    { id: "c1", hora: "28/12 10h12", tipo: "cancelamento", canal: "Online", descricao: "Pista · Inteira + Camiseta oficial", ingressos: -1, produtos: -1, valor: -239.9 },
    { id: "c2", hora: "29/12 14h30", tipo: "estorno", canal: "Online", descricao: "Camarote · VIP + Copo colecionável + Kit do festival", ingressos: -2, produtos: -2, valor: -958.8 },
    { id: "c3", hora: "30/12 09h05", tipo: "estorno", canal: "Online", descricao: "Pista · Meia-entrada", ingressos: -1, produtos: 0, valor: -90 },
    { id: "c4", hora: "30/12 23h50", tipo: "cancelamento", canal: "Impresso/Bilheteria", descricao: "Pista Premium · Inteira + Kit do festival", ingressos: -1, produtos: -1, valor: -318.9 },
    { id: "c5", hora: "31/12 11h20", tipo: "estorno", canal: "Online", descricao: "Front Stage · VIP + 2 produtos", ingressos: -3, produtos: -2, valor: -1179.7 },
];

type BorderoView = "macro" | "pdv" | "meios";

/* ------------------------------------------------------------------ */
/*  Visões geradas a partir do dataset do evento (src/reports).        */
/* ------------------------------------------------------------------ */

type DsBordero = ReturnType<typeof consultarPeriodo>;
const _u = (valor: number, qtd: number) => (qtd ? Math.round(valor / qtd) : 0);
// Nó de grupo dividido em Inteira/Meia. `pad` alinha o tamanho do array de valores às colunas.
const _grupoNode = (grupo: string, qtd: number, valor: number, pad: boolean): TreeNode => {
    const int = Math.round(qtd * 0.6);
    const mei = qtd - int;
    const vint = Math.round(valor * 0.6);
    const vmei = valor - vint;
    const row = (q: number, v: number) => (pad ? [0, 0, q, _u(v, q), v] : [q, _u(v, q), v]);
    return {
        label: grupo,
        children: [
            { label: "Inteira", values: row(int, vint) },
            { label: "Meia-entrada", values: row(mei, vmei) },
        ],
    };
};
const _canal = (ds: DsBordero, label: string, frac: number): TreeNode => ({
    label,
    children: [
        ...ds.ingressosPorGrupo.map((g) => _grupoNode(g.grupo, Math.round(g.vendido * frac), Math.round(g.valor * frac), true)),
        ...ds.mixDeReceita
            .filter((m) => m.grupo !== "Ingressos")
            .map((m) => ({ label: m.grupo, values: [0, 0, Math.round(m.quantidade * frac), _u(m.valor, m.quantidade), Math.round(m.valor * frac)] })),
    ],
});

/** Gera as três visões do borderô a partir do dataset do período selecionado. */
function gerarVisoes(ds: DsBordero): Record<BorderoView, TreeNode[]> {
    return {
        macro: [_canal(ds, "ONLINE", 0.96), _canal(ds, "BILHETERIA", 0.04)],
        pdv: [
            { label: "Loja Oficial Réveillon Carneiros", children: ds.ingressosPorGrupo.map((g) => _grupoNode(g.grupo, Math.round(g.vendido * 0.96), Math.round(g.valor * 0.96), false)) },
            { label: "Bilheteria Praia de Carneiros", children: ds.ingressosPorGrupo.map((g) => _grupoNode(g.grupo, Math.round(g.vendido * 0.04), Math.round(g.valor * 0.04), false)) },
        ],
        meios: [
            {
                label: "Todos os canais",
                children: ds.meiosDePagamento.map((m) => ({
                    label: m.meio,
                    values: [Math.round((ds.totais.itensVendidos * m.pct) / 100), 0, Math.round((ds.totais.valorTotalBruto * m.pct) / 100)],
                })),
            },
        ],
    };
}

const VIEWS: Record<BorderoView, { columns: ColDef[]; firstCol: string }> = {
    macro: { columns: MACRO_COLUMNS, firstCol: "Canal · Grupo · Ingresso" },
    pdv: { columns: PDV_COLUMNS, firstCol: "PDV · Grupo · Ingresso" },
    meios: { columns: PDV_COLUMNS, firstCol: "Canal · Meio de pagamento" },
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
            <RelatorioFiltersProvider initialDateRange={PERIODO_PADRAO}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                        <RelatorioPageHeader
                            title="Borderô"
                            withFilters={false}
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

    const scaled = useMemo(() => gerarVisoes(consultarPeriodo(dateRange)), [dateRange]);

    const activeNodes = view === "macro" ? scaled.macro : view === "pdv" ? scaled.pdv : scaled.meios;
    const activeMeta = VIEWS[view];

    const macroGrand = useMemo(() => grandTotalOf(scaled.macro), [scaled.macro]);
    const totalIngressos = macroGrand[2] ?? 0;
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
                    description={`${changedCount} ${changedCount === 1 ? "transação alterou" : "transações alteraram"} o borderô desde o fim do evento.`}
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
        className="fixed inset-0 z-50 flex justify-end outline-hidden"
    >
        <AriaModal className={({ isEntering, isExiting }) => cx("h-full w-full max-w-[520px] bg-primary shadow-xl outline-hidden", isEntering && "duration-300 ease-out animate-in slide-in-from-right", isExiting && "duration-200 ease-in animate-out slide-out-to-right")}>
            <AriaDialog className="flex h-full flex-col outline-hidden">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-secondary px-6 py-5">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-lg font-semibold text-primary">Transações desde o fim do evento</h2>
                        <p className="text-sm text-tertiary">Alterações que impactaram o borderô.</p>
                    </div>
                    <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                </div>

                <ul className="flex min-h-0 flex-1 flex-col divide-y divide-secondary overflow-y-auto px-6">
                    {changes.map((change) => {
                        const meta = CHANGE_META[change.tipo];
                        return (
                            <li key={change.id} className="flex flex-col gap-2 py-4 first:pt-6 last:pb-6">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 flex-col">
                                        <span className="text-sm font-medium text-primary">{change.descricao}</span>
                                        <span className="text-sm text-tertiary">{change.canal} · {change.hora}</span>
                                    </div>
                                    <Badge size="sm" color={meta.color} type="pill-color">
                                        {meta.label}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-tertiary">
                                    <span>
                                        Ingressos: <b className={cx("tabular-nums", change.ingressos >= 0 ? "text-success-primary" : "text-error-primary")}>{signed(change.ingressos, false)}</b>
                                    </span>
                                    {change.produtos !== 0 && (
                                        <span>
                                            Produtos: <b className={cx("tabular-nums", change.produtos >= 0 ? "text-success-primary" : "text-error-primary")}>{signed(change.produtos, false)}</b>
                                        </span>
                                    )}
                                    <span>
                                        Faturado: <b className={cx("tabular-nums", change.valor >= 0 ? "text-success-primary" : "text-error-primary")}>{signed(change.valor, true)}</b>
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                <div className="flex items-center justify-end gap-2 border-t border-secondary px-6 py-4">
                    <Button size="sm" color="secondary" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
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
                        <th className="px-4 py-3 text-sm font-semibold text-tertiary">
                            <SortableHeader label={firstCol} sortKey="label" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        {columns.map((col, i) => (
                            <th key={col.label} className={cx("whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-tertiary", i < lastCol && "hidden md:table-cell")}>
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
