import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ExportMenu, RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, type FilterFieldDef } from "../components/relatorio-filters";
import { SortableHeader } from "../components/SortableHeader";
import { useSortableTable } from "../utils/useSortableTable";
import { EVENT, currencyFormatter, numberFormatter, percentFormatter } from "../data/event";
import { COMBOS, comboById } from "../data/produtos";
import {
    COMBO_COLS,
    COMISSARIOS,
    TOTAL_COMISSIONADAS,
    TOTAL_ORGANICAS,
    gmvComissionadas,
    gmvOrganicas,
    totalComissario,
    totalComissariosPorCombo,
    type ComissarioRow,
} from "../data/comissarios";

const num = (n: number) => numberFormatter.format(n);
const money = (n: number) => currencyFormatter.format(n);
const pct = (n: number) => percentFormatter.format(n);

const COR_M = "var(--color-utility-blue-400)";
const COR_F = "var(--color-utility-green-400)";

/** Faturamento comissionado por combo (unidades comissionadas × preço). */
const gmvComissionadoCombo = (comboId: string) => totalComissariosPorCombo(comboId) * (comboById(comboId)?.preco ?? 0);

/** Gênero apenas das vendas comissionadas. */
const GENERO_COMISSIONADO = {
    masculino: totalComissariosPorCombo("night-masc") + totalComissariosPorCombo("full-masc"),
    feminino: totalComissariosPorCombo("night-fem") + totalComissariosPorCombo("full-fem"),
};

const FILTROS: FilterFieldDef[] = [
    { id: "comissario", label: "Comissário", multi: { options: COMISSARIOS.map((c) => ({ id: c.id, label: c.nome })) } },
    { id: "combo", label: "Combo", multi: { options: COMBOS.map((c) => ({ id: c.id, label: c.nome })) } },
];

export function Comissarios() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="comissarios">
            <RelatorioFiltersProvider fields={FILTROS} sessoes={EVENT.sessoes}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                        <RelatorioPageHeader title="Comissários" filtroVariante="dropdown" actions={<ExportMenu />} />
                        <ComissariosBody />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const ComissariosBody = () => (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Faturamento comissionado" valor={money(gmvComissionadas)} />
            <MetricCard label="Unidades comissionadas" valor={num(TOTAL_COMISSIONADAS)} />
            <GeneroMini />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ProdutosCard />
            <OrganicoVsComissariosCard />
        </div>

        <RankingCard />
    </div>
);

/* ------------------------------------------------------------------ */
/*  Shells                                                             */
/* ------------------------------------------------------------------ */

const Secao = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <section className="flex flex-col gap-5 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary md:p-6">
        <h2 className="text-md font-semibold text-primary">{titulo}</h2>
        {children}
    </section>
);

const MetricCard = ({ label, valor }: { label: string; valor: string }) => (
    <div className="flex flex-col gap-1 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
        <span className="text-sm text-tertiary">{label}</span>
        <span className="text-display-xs font-bold text-primary">{valor}</span>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Combos (só comissionado)                                           */
/* ------------------------------------------------------------------ */

const ProdutosCard = () => (
    <Secao titulo="Combos comissionados">
        <div className="flex flex-col">
            <div className="grid grid-cols-[minmax(0,1fr)_80px_minmax(0,120px)] gap-3 border-b border-secondary pb-2 text-sm font-medium text-tertiary">
                <span>Grupo do ingresso</span>
                <span className="text-right">Unidades</span>
                <span className="text-right">Faturado</span>
            </div>
            {COMBOS.map((c) => (
                <div key={c.id} className="grid grid-cols-[minmax(0,1fr)_80px_minmax(0,120px)] gap-3 border-b border-secondary py-2.5 text-sm last:border-b-0">
                    <span className="truncate font-medium text-primary">{c.nome}</span>
                    <span className="text-right text-secondary">{num(totalComissariosPorCombo(c.id))}</span>
                    <span className="text-right text-secondary">{money(gmvComissionadoCombo(c.id))}</span>
                </div>
            ))}
            <div className="grid grid-cols-[minmax(0,1fr)_80px_minmax(0,120px)] gap-3 pt-3 text-sm font-semibold text-primary">
                <span>Total geral</span>
                <span className="text-right">{num(TOTAL_COMISSIONADAS)}</span>
                <span className="text-right">{money(gmvComissionadas)}</span>
            </div>
        </div>
    </Secao>
);

/* ------------------------------------------------------------------ */
/*  Orgânicas vs Comissários (donut, por faturamento) — único lugar     */
/*  que mostra o orgânico.                                             */
/* ------------------------------------------------------------------ */

const OrganicoVsComissariosCard = () => {
    const dados = useMemo(
        () => [
            { nome: "Vendas comissários", valor: gmvComissionadas, cor: "var(--color-utility-blue-600)" },
            { nome: "Vendas orgânicas", valor: gmvOrganicas, cor: "var(--color-utility-green-500)" },
        ],
        [],
    );
    const total = dados.reduce((s, d) => s + d.valor, 0);
    return (
        <Secao titulo="Orgânicas vs Comissários | Faturamento">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:items-center">
                <div className="relative h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={dados} dataKey="valor" nameKey="nome" innerRadius="62%" outerRadius="92%" paddingAngle={1} stroke="var(--color-bg-primary)" strokeWidth={2} isAnimationActive={false}>
                                {dados.map((d) => (
                                    <Cell key={d.nome} fill={d.cor} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-3">
                    {dados.map((d) => (
                        <div key={d.nome} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-2">
                                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.cor }} aria-hidden="true" />
                                <span className="text-sm text-secondary">{d.nome}</span>
                            </span>
                            <span className="shrink-0 text-sm text-tertiary">
                                <span className="font-semibold text-primary">{pct(d.valor / total)}</span> · {money(d.valor)}
                            </span>
                        </div>
                    ))}
                    <div className="mt-1 flex items-center justify-between gap-4 border-t border-secondary pt-3 text-sm">
                        <span className="text-tertiary">Unidades</span>
                        <span className="text-secondary">
                            {num(TOTAL_COMISSIONADAS)} comissionadas · {num(TOTAL_ORGANICAS)} orgânicas
                        </span>
                    </div>
                </div>
            </div>
        </Secao>
    );
};

/* ------------------------------------------------------------------ */
/*  Gênero (só comissionado)                                           */
/* ------------------------------------------------------------------ */

/** Card compacto de gênero (ocupa a célula de métrica). */
const GeneroMini = () => {
    const total = GENERO_COMISSIONADO.masculino + GENERO_COMISSIONADO.feminino;
    const fracM = total ? GENERO_COMISSIONADO.masculino / total : 0;
    const fracF = total ? GENERO_COMISSIONADO.feminino / total : 0;
    return (
        <div className="flex flex-col gap-2 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
            <span className="text-sm text-tertiary">Gênero | Pelo tipo de ingresso</span>
            <div className="flex h-9 w-full overflow-hidden rounded-lg">
                <div className="flex items-center justify-center" style={{ width: `${fracM * 100}%`, backgroundColor: COR_M }}>
                    <span className="truncate px-2 text-sm font-semibold text-primary">{num(GENERO_COMISSIONADO.masculino)}</span>
                </div>
                <div className="flex items-center justify-center" style={{ width: `${fracF * 100}%`, backgroundColor: COR_F }}>
                    <span className="truncate px-2 text-sm font-semibold text-primary">{num(GENERO_COMISSIONADO.feminino)}</span>
                </div>
            </div>
            <div className="flex items-center justify-between text-sm text-tertiary">
                <span>Masculino · {pct(fracM)}</span>
                <span>Feminino · {pct(fracF)}</span>
            </div>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Ranking dos comissários (ordenável)                                */
/* ------------------------------------------------------------------ */

const GRID = "grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_minmax(0,0.7fr)]";

const RankingCard = () => {
    const accessors = useMemo(
        () => ({
            nome: (c: ComissarioRow) => c.nome,
            "night-masc": (c: ComissarioRow) => c.vendas["night-masc"] ?? 0,
            "night-fem": (c: ComissarioRow) => c.vendas["night-fem"] ?? 0,
            "full-masc": (c: ComissarioRow) => c.vendas["full-masc"] ?? 0,
            "full-fem": (c: ComissarioRow) => c.vendas["full-fem"] ?? 0,
            total: (c: ComissarioRow) => totalComissario(c),
        }),
        [],
    );
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(
        COMISSARIOS as unknown as Record<string, unknown>[],
        accessors as Partial<Record<string, (r: Record<string, unknown>) => string | number>>,
        { key: "total", dir: "desc" },
    );
    const linhas = sorted as unknown as ComissarioRow[];

    return (
        <section className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
            <header className="border-b border-secondary px-5 py-4">
                <h2 className="text-md font-semibold text-primary">Ranking dos comissários</h2>
            </header>
            <div className="overflow-x-auto">
                <div className="min-w-[720px]">
                    <div className={cx("grid gap-3 border-b border-secondary bg-secondary/60 px-5 py-3 text-sm font-semibold text-tertiary", GRID)}>
                        <SortableHeader label="Comissário" sortKey="nome" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        {COMBO_COLS.map((c) => (
                            <SortableHeader key={c.id} label={c.nome} align="right" sortKey={c.id} activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        ))}
                        <SortableHeader label="Total" align="right" sortKey="total" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                    </div>
                    {linhas.map((c) => (
                        <div key={c.id} className={cx("grid gap-3 border-b border-secondary px-5 py-3 text-sm transition duration-100 ease-linear hover:bg-primary_hover", GRID)}>
                            <span className="truncate font-medium text-primary">{c.nome}</span>
                            {COMBO_COLS.map((col) => {
                                const v = c.vendas[col.id] ?? 0;
                                return (
                                    <span key={col.id} className={cx("text-right", v ? "text-secondary" : "text-quaternary")}>
                                        {v ? num(v) : "–"}
                                    </span>
                                );
                            })}
                            <span className="text-right font-semibold text-primary">{num(totalComissario(c))}</span>
                        </div>
                    ))}
                    {/* Total geral (só comissionado) */}
                    <div className={cx("grid gap-3 px-5 py-3 text-sm font-semibold text-primary", GRID)}>
                        <span>Total geral</span>
                        {COMBO_COLS.map((col) => (
                            <span key={col.id} className="text-right">
                                {num(totalComissariosPorCombo(col.id))}
                            </span>
                        ))}
                        <span className="text-right">{num(TOTAL_COMISSIONADAS)}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};
