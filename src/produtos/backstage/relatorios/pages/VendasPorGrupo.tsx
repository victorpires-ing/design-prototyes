import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, CurrencyDollarCircle, CursorClick02, Receipt } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { ProgressBarHalfCircle } from "@/components/base/progress-indicators/progress-circles";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { DemografiaMetrics, GeografiaSecoes } from "../components/demografia-geo";
import { MetaVendasCard, VendasPorGeneroCard } from "../components/vendas-graficos";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, dateRangeFraction, inDateRange, useRelatorioFilters } from "../components/relatorio-filters";
import { SortableHeader } from "../components/SortableHeader";
import { useSortableTable } from "../utils/useSortableTable";
import { EVENT, currencyFormatter, numberFormatter, parseEventDate } from "../data/event";
import { COMBOS, GRUPOS, INGRESSOS, PRODUTOS, TOTAL_GMV, TOTAL_GMV_PRODUTOS, TOTAL_PRODUTOS, TOTAL_UNIDADES } from "../data/produtos";
import { VENDAS_DIARIAS, metaTotal } from "../data/vendas-diarias";

/* ------------------------------------------------------------------ */
/*  Tipos                                                             */
/* ------------------------------------------------------------------ */

interface IngressoRow {
    id: string;
    nome: string;
    estoque: number;
    vendido: number;
}

interface SetorRow {
    id: string;
    nome: string;
    estoque: number;
    vendido: number;
    ingressos?: IngressoRow[];
}

interface IngressoPorSetorRow {
    id: string;
    setor: string;
    tipoIngresso: string;
    lote: string;
    itemCombo: string;
    vendidos: number;
    estoque: number;
}

interface ComboLoteDetalhe {
    id: string;
    lote: string;
    quantidade: number;
    valorUnitario: number;
    gmv: number;
    desconto: number;
    gmvComDesconto: number;
}

interface ComboRow {
    id: string;
    nome: string;
    quantidade: number;
    valorUnitario: number;
    gmv: number;
    desconto: number;
    gmvComDesconto: number;
    lotes: ComboLoteDetalhe[];
}

interface ProdutoRow {
    id: string;
    nome: string;
    quantidade: number;
    valorUnitario: number;
    gmv: number;
    gmvComDesconto: number;
}

interface CupomLoteRow {
    id: string;
    lote: string;
    quantidade: number;
    valor: number;
    valorDesconto: number;
    valorTotal: number;
}

interface CupomRow {
    id: string;
    cupom: string;
    quantidade: number;
    valor: number;
    valorDesconto: number;
    valorTotal: number;
    lotes: CupomLoteRow[];
}

/* ------------------------------------------------------------------ */
/*  Mock data (base = todas as sessões)                               */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Réveillon Carneiros — vende só combos. "Setor" = festa × área       */
/*  (Mouton 16h / Night 20–22h). Cada combo dá acesso às festas que      */
/*  inclui: NIGHT PASS → festas noturnas; FULL PASS → todas.             */
/*  Dados de teste, propositalmente discrepantes da produção.           */
/* ------------------------------------------------------------------ */

const ddmm = (data: string) => data.slice(0, 5);
const areaOf = (label: string) => (label.includes("16h") ? "Mouton" : "Night");
const setorNome = (s: { data: string; label: string }) => `${ddmm(s.data)} | ${areaOf(s.label)}`;
const combosNaSessao = (sid: string) => COMBOS.filter((c) => c.sessoes.includes(sid));

// Capacidade por festa×área (denominador da ocupação).
const CAP_AREA: Record<string, number> = { Night: 6500, Mouton: 4200 };
const SETOR_CAP: Record<string, number> = Object.fromEntries(EVENT.sessoes.map((s) => [setorNome(s), CAP_AREA[areaOf(s.label)]]));

// Cada linha = um INGRESSO real (grupo > ingresso > lote) na festa. O combo é
// uma dimensão à parte; aqui contamos os ingressos entregues por festa.
// itemCombo = combos (passes) que dão acesso àquele ingresso.
const ingressosPorSetor: IngressoPorSetorRow[] = EVENT.sessoes.flatMap((s) => {
    const grupo = GRUPOS.find((g) => g.sessaoId === s.id);
    const ings = INGRESSOS.filter((i) => i.grupoId === grupo?.id);
    const area = areaOf(s.label);
    return ings.map((ing) => {
        const passes = Array.from(new Set(COMBOS.filter((c) => c.itens.includes(ing.id)).map((c) => c.passe)));
        return {
            id: `ips-${s.id}-${ing.id}`,
            setor: setorNome(s),
            tipoIngresso: ing.nome,
            lote: ing.lotes[0]?.nome ?? "1º lote",
            itemCombo: passes.join(" · "),
            vendidos: ing.quantidade,
            estoque: Math.round(CAP_AREA[area] / 2),
        };
    });
});

/* Setores derivados das linhas: vendido = soma das linhas (frequência na festa);
   estoque = capacidade física da festa×área (SETOR_CAP). */
const setores: SetorRow[] = (() => {
    const slug = (s: string) =>
        s
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    const order: string[] = [];
    const map = new Map<string, SetorRow>();
    for (const r of ingressosPorSetor) {
        let s = map.get(r.setor);
        if (!s) {
            s = { id: slug(r.setor), nome: r.setor, estoque: SETOR_CAP[r.setor] ?? 0, vendido: 0, ingressos: [] };
            map.set(r.setor, s);
            order.push(r.setor);
        }
        s.vendido += r.vendidos;
        s.ingressos!.push({ id: r.id, nome: r.tipoIngresso, estoque: r.estoque, vendido: r.vendidos });
    }
    return order.map((n) => map.get(n)!);
})();

// Combos vendidos (tabela): nome do combo + seus lotes (padrão de produção).
const combos: ComboRow[] = COMBOS.map((c) => {
    const lotes: ComboLoteDetalhe[] = c.lotes.map((l) => {
        const gmv = l.preco * l.quantidade;
        const desconto = Math.round(gmv * 0.006);
        return { id: l.id, lote: l.nome, quantidade: l.quantidade, valorUnitario: l.preco, gmv, desconto, gmvComDesconto: gmv - desconto };
    });
    const gmv = lotes.reduce((s, l) => s + l.gmv, 0);
    const desconto = lotes.reduce((s, l) => s + l.desconto, 0);
    const quantidade = lotes.reduce((s, l) => s + l.quantidade, 0);
    return { id: c.id, nome: c.nome, quantidade, valorUnitario: Math.round(gmv / quantidade), gmv, desconto, gmvComDesconto: gmv - desconto, lotes };
});

// Produtos avulsos (dimensão distinta de ingresso e combo).
const produtos: ProdutoRow[] = PRODUTOS.map((p) => {
    const gmv = p.preco * p.quantidade;
    return { id: p.id, nome: p.nome, quantidade: p.quantidade, valorUnitario: p.preco, gmv, gmvComDesconto: Math.round(gmv * 0.966) };
});

// Cupons do Réveillon (abrem expandindo a linha, detalhados por grupo).
const cupons: CupomRow[] = [
    {
        id: "cu1",
        cupom: "CARNEIROS10",
        quantidade: 42,
        valor: 234600,
        valorDesconto: 23460,
        valorTotal: 211140,
        lotes: [
            { id: "cu1-l1", lote: "NIGHT PASS", quantidade: 30, valor: 117000, valorDesconto: 11700, valorTotal: 105300 },
            { id: "cu1-l2", lote: "FULL PASS", quantidade: 12, valor: 117600, valorDesconto: 11760, valorTotal: 105840 },
        ],
    },
    {
        id: "cu2",
        cupom: "NIGHT2027",
        quantidade: 26,
        valor: 101400,
        valorDesconto: 15210,
        valorTotal: 86190,
        lotes: [{ id: "cu2-l1", lote: "NIGHT PASS", quantidade: 26, valor: 101400, valorDesconto: 15210, valorTotal: 86190 }],
    },
    {
        id: "cu3",
        cupom: "FULLVIP",
        quantidade: 9,
        valor: 88200,
        valorDesconto: 7056,
        valorTotal: 81144,
        lotes: [{ id: "cu3-l1", lote: "FULL PASS", quantidade: 9, valor: 88200, valorDesconto: 7056, valorTotal: 81144 }],
    },
];

interface MixReceitaItem {
    id: string;
    nome: string;
    quantidade: number;
    gmv: number;
    gmvComDesconto: number;
    fill: string;
}

// Réveillon: 100% da receita vem de combos.
const mixReceita: MixReceitaItem[] = [
    { id: "combos", nome: "Combos", quantidade: TOTAL_UNIDADES, gmv: TOTAL_GMV, gmvComDesconto: Math.round(TOTAL_GMV * 0.966), fill: "var(--color-utility-brand-700)" },
    { id: "produtos", nome: "Produtos", quantidade: TOTAL_PRODUTOS, gmv: TOTAL_GMV_PRODUTOS, gmvComDesconto: Math.round(TOTAL_GMV_PRODUTOS * 0.966), fill: "var(--color-utility-blue-500)" },
];

const VALOR_TOTAL_BASE = TOTAL_GMV;
const TOTAL_ITENS_BASE = TOTAL_UNIDADES;

/* ------------------------------------------------------------------ */
/*  Drill-down (Festa → Grupo do combo → Gênero)                       */
/* ------------------------------------------------------------------ */

interface TreeNode {
    id: string;
    key: string;
    label: string;
    value: number;
    estoque?: number;
    childrenLabel?: string;
    children?: TreeNode[];
}

const generoLabel = (g: string) => (g === "MASCULINO" ? "Masculino" : "Feminino");
const grupoSlug = (g: string) => (g === "NIGHT PASS" ? "night" : "full");

// Detalhamento das vendas: Sessão → Tipo de produto → (Combos) Setor → Ingresso → Lote.
const buildDrillTree = (): TreeNode[] =>
    EVENT.sessoes.map((s) => {
        const combosS = combosNaSessao(s.id);
        // Setor = passe (NIGHT/FULL) que cobre a sessão.
        const setores: TreeNode[] = (["NIGHT PASS", "FULL PASS"] as const)
            .filter((g) => combosS.some((c) => c.passe === g))
            .map((g) => {
                const cg = combosS.filter((c) => c.passe === g);
                // Ingresso = variante (gênero) dentro do passe; abaixo, os lotes do combo.
                const ingressos: TreeNode[] = cg.map((c) => ({
                    id: `${s.id}-${c.id}`,
                    key: c.genero,
                    label: generoLabel(c.genero),
                    value: c.quantidade,
                    childrenLabel: "Lote",
                    children: c.lotes.map((l) => ({ id: `${s.id}-${c.id}-${l.id}`, key: l.id, label: l.nome, value: l.quantidade })),
                }));
                return {
                    id: `${s.id}-${grupoSlug(g)}`,
                    key: grupoSlug(g),
                    label: g,
                    value: cg.reduce((a, c) => a + c.quantidade, 0),
                    childrenLabel: "Ingresso",
                    children: ingressos,
                };
            });
        const combosNode: TreeNode = {
            id: `${s.id}-combos`,
            key: "combos",
            label: "Combos",
            value: setores.reduce((a, x) => a + x.value, 0),
            childrenLabel: "Setor",
            children: setores,
        };

        // Ingressos (vendas diretas): Setor (grupo da festa) → Ingresso → Lote.
        const gruposS = GRUPOS.filter((g) => g.sessaoId === s.id);
        const setoresIng: TreeNode[] = gruposS.map((g) => {
            const ings = INGRESSOS.filter((i) => i.grupoId === g.id);
            const ingressos: TreeNode[] = ings.map((ing) => ({
                id: `${s.id}-ing-${ing.id}`,
                key: ing.id,
                label: ing.nome,
                value: ing.vendaDireta,
                childrenLabel: "Lote",
                children: ing.lotes.map((l) => ({ id: `${s.id}-ing-${l.id}`, key: l.id, label: l.nome, value: l.quantidade })),
            }));
            return {
                id: `${s.id}-grupo-${g.id}`,
                key: g.id,
                label: g.nome,
                value: ings.reduce((a, i) => a + i.vendaDireta, 0),
                childrenLabel: "Ingresso",
                children: ingressos,
            };
        });
        const ingressosNode: TreeNode = {
            id: `${s.id}-ingressos`,
            key: "ingressos",
            label: "Ingressos",
            value: setoresIng.reduce((a, x) => a + x.value, 0),
            childrenLabel: "Setor",
            children: setoresIng,
        };

        const total = combosNode.value + ingressosNode.value;
        return { id: s.id, key: s.id, label: s.descricao, value: total, estoque: CAP_AREA[areaOf(s.label)], childrenLabel: "Tipo de produto", children: [combosNode, ingressosNode] };
    });

const drillTree = buildDrillTree();

// Produtos avulsos (dimensão distinta) — alimenta o drill-down "Produtos".
const aggregatedProdutos: TreeNode[] = PRODUTOS.map((p) => ({ id: `prod-${p.id}`, key: p.id, label: p.nome, value: p.quantidade }));

const PRODUTOS_ROOT_ID = "produtos-all";
const produtosRootNode: TreeNode = {
    id: PRODUTOS_ROOT_ID,
    key: PRODUTOS_ROOT_ID,
    label: "Produtos",
    value: TOTAL_PRODUTOS,
    childrenLabel: "Produto",
    children: aggregatedProdutos,
};

/* ------------------------------------------------------------------ */
/*  Scaling helpers                                                    */
/* ------------------------------------------------------------------ */

// Combos são vendidos para o evento todo (não por festa) → sessão não escala a
// venda; apenas filtra as colunas do drill. Sessões desconhecidas caem em 1.
const SESSAO_WEIGHT: Record<string, number> = { all: 1 };

const scaleTree = (nodes: TreeNode[], f: number): TreeNode[] =>
    nodes.map((n) => ({ ...n, value: Math.round(n.value * f), children: n.children ? scaleTree(n.children, f) : undefined }));

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function VendasPorGrupo() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="vendas-por-grupo">
            <RelatorioFiltersProvider sessoes={EVENT.sessoes}>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 md:px-6 pb-10">
                        <RelatorioPageHeader title="Vendas" filtroVariante="dropdown" />
                        <VendasBody />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const VendasBody = () => {
    const { dateRange, sessao } = useRelatorioFilters();

    const view = useMemo(() => {
        const sessionWeight = SESSAO_WEIGHT[sessao] ?? 1;
        const dateFraction = dateRangeFraction(dateRange);
        const vendaFactor = sessionWeight * dateFraction;
        const capFactor = sessionWeight;

        const setoresView: SetorRow[] = setores.map((s) => ({
            ...s,
            estoque: Math.round(s.estoque * capFactor),
            vendido: Math.round(s.vendido * vendaFactor),
            ingressos: s.ingressos?.map((i) => ({ ...i, estoque: Math.round(i.estoque * capFactor), vendido: Math.round(i.vendido * vendaFactor) })),
        }));

        const ingressosPorSetorView: IngressoPorSetorRow[] = ingressosPorSetor.map((r) => ({
            ...r,
            vendidos: Math.round(r.vendidos * vendaFactor),
            estoque: Math.round(r.estoque * capFactor),
        }));

        const mixView: MixReceitaItem[] = mixReceita.map((m) => ({
            ...m,
            quantidade: Math.round(m.quantidade * vendaFactor),
            gmv: m.gmv * vendaFactor,
            gmvComDesconto: m.gmvComDesconto * vendaFactor,
        }));

        const combosView: ComboRow[] = combos.map((c) => ({
            ...c,
            quantidade: Math.round(c.quantidade * vendaFactor),
            gmv: c.gmv * vendaFactor,
            desconto: c.desconto * vendaFactor,
            gmvComDesconto: c.gmvComDesconto * vendaFactor,
            lotes: c.lotes.map((l) => ({ ...l, quantidade: Math.round(l.quantidade * vendaFactor), gmv: l.gmv * vendaFactor, desconto: l.desconto * vendaFactor, gmvComDesconto: l.gmvComDesconto * vendaFactor })),
        }));
        const produtosView: ProdutoRow[] = produtos.map((p) => ({ ...p, quantidade: Math.round(p.quantidade * dateFraction), gmv: p.gmv * dateFraction, gmvComDesconto: p.gmvComDesconto * dateFraction }));
        const cuponsView: CupomRow[] = cupons.map((c) => ({
            ...c,
            quantidade: Math.round(c.quantidade * vendaFactor),
            valor: c.valor * vendaFactor,
            valorDesconto: c.valorDesconto * vendaFactor,
            valorTotal: c.valorTotal * vendaFactor,
            lotes: c.lotes.map((l) => ({ ...l, quantidade: Math.round(l.quantidade * vendaFactor), valor: l.valor * vendaFactor, valorDesconto: l.valorDesconto * vendaFactor, valorTotal: l.valorTotal * vendaFactor })),
        }));

        // Drill: filtra colunas pela sessão e escala os valores pelo intervalo de data.
        const drillFiltered = sessao === "all" ? drillTree : drillTree.filter((n) => n.id === sessao);
        const drillView = scaleTree(drillFiltered, dateFraction);
        const produtosRootView: TreeNode = { ...produtosRootNode, ...scaleTree([produtosRootNode], dateFraction)[0] };

        const valorTotal = VALOR_TOTAL_BASE * vendaFactor;
        const totalItens = Math.round(TOTAL_ITENS_BASE * vendaFactor);

        return { setoresView, ingressosPorSetorView, mixView, combosView, produtosView, cuponsView, drillView, produtosRootView, valorTotal, totalItens };
    }, [dateRange, sessao]);

    // Série diária recortada pelo mesmo período do filtro (todos os gráficos olham o mesmo intervalo).
    const dias = useMemo(() => VENDAS_DIARIAS.filter((d) => inDateRange(parseEventDate(d.dataISO), dateRange)), [dateRange]);
    // Meta = soma das metas das sessões em escopo (todas, ou a sessão filtrada).
    const metaSel = useMemo(() => metaTotal(sessao === "all" ? undefined : [sessao]), [sessao]);

    return (
        <>
            <MetricsRow valorTotal={view.valorTotal} totalItens={view.totalItens} setores={view.setoresView} />
            <DemografiaMetrics />
            <MetaVendasCard dias={dias} meta={metaSel} />
            <MixReceitaCard items={view.mixView} />
            <VendasPorGeneroCard dias={dias} />
            <GeografiaSecoes />
            <DrillDownGmvCard tree={view.drillView} produtosRoot={view.produtosRootView} />
            <OcupacaoPorSetorCard setores={view.setoresView} />
            <QuantidadeIngressosPorSetorCard rows={view.ingressosPorSetorView} />
            <IngressosComCupomCard cupons={view.cuponsView} />
        </>
    );
};

/* ------------------------------------------------------------------ */
/*  Metrics row                                                       */
/* ------------------------------------------------------------------ */

const MetricsRow = ({ valorTotal, totalItens, setores: setoresView }: { valorTotal: number; totalItens: number; setores: SetorRow[] }) => {
    const ticketMedio = totalItens === 0 ? 0 : valorTotal / totalItens;
    const totalEstoque = setoresView.reduce((s, x) => s + x.estoque, 0);
    const totalVendido = setoresView.reduce((s, x) => s + x.vendido, 0);
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricsIcon03 icon={CurrencyDollarCircle} title={currencyFormatter.format(valorTotal)} subtitle="Valor total" change={null} changeTrend="positive" actions={false} className="flex-1 md:min-w-[320px] [&_p+div]:hidden" />
            <MetricsIcon03 icon={Receipt} title={currencyFormatter.format(ticketMedio)} subtitle="Ticket médio" change={null} changeTrend="positive" actions={false} className="flex-1 md:min-w-[320px] [&_p+div]:hidden" />
            <OcupacaoMetric totalEstoque={totalEstoque} totalVendido={totalVendido} />
        </div>
    );
};

const OcupacaoMetric = ({ totalEstoque, totalVendido }: { totalEstoque: number; totalVendido: number }) => (
    <div className="rounded-xl bg-primary shadow-xs ring-1 ring-secondary ring-inset">
        <div className="flex h-full items-center gap-8 px-4 py-5 md:px-5">
            <div className="relative flex flex-col gap-2 shrink-0 items-center justify-center">
                <ProgressBarHalfCircle size="xs" min={0} label="Ocupação" max={totalEstoque || 1} value={totalVendido} valueFormatter={(_value: number, pct: number) => `${pct}%`} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-lg font-semibold text-primary leading-tight">
                    {numberFormatter.format(totalVendido)}
                    <span className="font-normal text-tertiary"> de {numberFormatter.format(totalEstoque)}</span>
                </p>
            </div>
        </div>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Card shell                                                        */
/* ------------------------------------------------------------------ */

const Card = ({ title, children, headerRight }: { title: string; children: React.ReactNode; headerRight?: React.ReactNode }) => (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-4">
            <h3 className="text-md font-semibold text-primary">{title}</h3>
            {headerRight}
        </header>
        {children}
    </section>
);

/* ------------------------------------------------------------------ */
/*  Mix de receita                                                    */
/* ------------------------------------------------------------------ */

const MixReceitaCard = ({ items }: { items: MixReceitaItem[] }) => {
    const totalGmvDesc = items.reduce((s, x) => s + x.gmvComDesconto, 0) || 1;
    const radialData = items.map((item) => ({ ...item, value: Math.round((item.gmvComDesconto / totalGmvDesc) * 100) }));

    return (
        <Card title="Mix de receita">
            <div className="flex flex-col gap-6 px-4 py-5 md:flex-row md:items-center md:gap-8 md:px-5">
                <div className="flex shrink-0 flex-col items-center gap-2">
                    <div className="size-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={radialData} dataKey="gmvComDesconto" innerRadius="65%" outerRadius="100%" paddingAngle={2} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                                    {radialData.map((d) => (
                                        <Cell key={d.id} fill={d.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <ul className="flex w-full flex-1 flex-col divide-y divide-secondary">
                    {radialData.map((item) => (
                        <li key={item.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:gap-4">
                            <div className="flex min-w-0 items-center gap-3 md:flex-1">
                                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="text-sm font-semibold text-primary">{item.nome}</span>
                                    <span className="text-xs text-tertiary">{item.value}% do total</span>
                                </div>
                            </div>
                            <div className="flex grid-cols-3 gap-4 md:flex md:gap-8">
                                <MixStat className="md:w-20" label="Quantidade" value={numberFormatter.format(item.quantidade)} />
                                <MixStat className="md:w-36" label="Valor total bruto" value={currencyFormatter.format(item.gmv)} />
                                <MixStat className="md:w-36" label="Valor total c/ desconto" value={currencyFormatter.format(item.gmvComDesconto)} />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
};

const MixStat = ({ label, value, className }: { label: string; value: string; className?: string }) => (
    <div className={cx("flex flex-col gap-0.5", className)}>
        <span className="text-xs text-tertiary">{label}</span>
        <span className="text-sm font-medium text-primary tabular-nums">{value}</span>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Drill-down GMV                                                    */
/* ------------------------------------------------------------------ */

const DrillDownGmvCard = ({ tree, produtosRoot }: { tree: TreeNode[]; produtosRoot: TreeNode }) => {
    const [path, setPath] = useState<string[]>([]);
    const innerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
    const columnRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const [lines, setLines] = useState<string[]>([]);
    const [lockedWidth, setLockedWidth] = useState<number | null>(null);

    const bodyRef = useRef<HTMLDivElement>(null);
    const hintFiredRef = useRef(false);
    const [showHint, setShowHint] = useState(false);

    // Reseta a navegação quando a árvore muda (ex.: troca de sessão).
    useEffect(() => {
        setPath([]);
    }, [tree]);

    useEffect(() => {
        const el = bodyRef.current;
        if (!el) return;
        let timeout: ReturnType<typeof setTimeout> | undefined;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (hintFiredRef.current) return;
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    hintFiredRef.current = true;
                    setShowHint(true);
                    timeout = setTimeout(() => setShowHint(false), 4000);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 },
        );
        observer.observe(el);
        return () => {
            observer.disconnect();
            if (timeout) clearTimeout(timeout);
        };
    }, []);

    const columns = useMemo(() => {
        const cols: TreeNode[][] = [tree];
        for (let i = 0; i < path.length; i++) {
            let parent = cols[i].find((n) => n.id === path[i]);
            if (!parent && i === 0 && path[0] === PRODUTOS_ROOT_ID) parent = produtosRoot;
            if (!parent?.children?.length) break;
            cols.push(parent.children);
        }
        return cols;
    }, [path, tree, produtosRoot]);

    const computeLines = () => {
        const inner = innerRef.current;
        if (!inner) return;
        const innerRect = inner.getBoundingClientRect();
        const next: string[] = [];
        for (let i = 0; i < path.length; i++) {
            const fromCol = columns[i];
            const nextCol = columns[i + 1];
            if (!fromCol || !nextCol?.length) continue;
            const fromEl = itemRefs.current.get(path[i]);
            const toEl = itemRefs.current.get(nextCol[0].id);
            if (!fromEl || !toEl) continue;
            const f = fromEl.getBoundingClientRect();
            const t = toEl.getBoundingClientRect();
            const x1 = f.right - innerRect.left;
            const y1 = f.top + f.height / 2 - innerRect.top;
            const x2 = t.left - innerRect.left;
            const y2 = t.top + t.height / 2 - innerRect.top;
            const midX = (x1 + x2) / 2;
            next.push(`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`);
        }
        setLines(next);
    };

    useLayoutEffect(() => {
        computeLines();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, columns]);

    useEffect(() => {
        const handle = () => computeLines();
        window.addEventListener("resize", handle);
        return () => window.removeEventListener("resize", handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, columns]);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        let left = 0;
        if (path.length === 0) {
            left = 0;
        } else {
            const target = columnRefs.current.get(path.length);
            if (target) {
                const RIGHT_PADDING = 48;
                const desired = target.offsetLeft + target.offsetWidth + RIGHT_PADDING - container.clientWidth;
                const innerWidth = lockedWidth ?? innerRef.current?.scrollWidth ?? container.scrollWidth;
                const maxScroll = Math.max(0, innerWidth - container.clientWidth);
                left = Math.max(0, Math.min(desired, maxScroll));
            }
        }
        container.scrollTo({ left, behavior: "smooth" });
        const t = setTimeout(() => setLockedWidth(null), 420);
        return () => clearTimeout(t);
    }, [path, lockedWidth]);

    const handleSelect = (colIndex: number, id: string) => {
        const isDeselect = path[colIndex] === id;
        const willShrink = isDeselect || colIndex < path.length;
        if (willShrink && innerRef.current) setLockedWidth(innerRef.current.scrollWidth);
        setPath((prev) => {
            const next = prev.slice(0, colIndex);
            if (prev[colIndex] === id) return next;
            next[colIndex] = id;
            return next;
        });
    };

    const reset = () => {
        if (innerRef.current) setLockedWidth(innerRef.current.scrollWidth);
        setPath([]);
    };

    return (
        <Card
            title="Detalhamento das vendas"
            headerRight={
                path.length > 0 ? (
                    <button type="button" onClick={reset} className="text-sm font-medium text-brand-secondary hover:text-brand-secondary_hover">
                        Limpar seleção
                    </button>
                ) : null
            }
        >
            <div ref={bodyRef} className="relative">
                <div ref={scrollRef} className="overflow-x-auto">
                    <div
                        ref={innerRef}
                        className="relative min-w-max opacity-100"
                        style={{
                            backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--color-fg-quaternary) 25%, transparent) 1px, transparent 1px)",
                            backgroundSize: "16px 16px",
                            minWidth: lockedWidth ?? undefined,
                        }}
                    >
                        <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
                            {lines.map((d, i) => (
                                <path key={i} d={d} fill="none" stroke="var(--color-utility-brand-400)" strokeWidth={2} />
                            ))}
                        </svg>

                        <div className="relative flex items-start gap-8 px-4 py-5 md:px-5">
                            {columns.map((nodes, colIndex) => {
                                const selectedId = path[colIndex];
                                const hasSelection = !!selectedId;
                                const resolveParent = (pi: number) => {
                                    if (path[pi] === PRODUTOS_ROOT_ID && pi === 0) return produtosRoot;
                                    return columns[pi].find((n) => n.id === path[pi]);
                                };
                                const headerLabel = colIndex === 0 ? "Data da sessão" : resolveParent(colIndex - 1)?.childrenLabel ?? "Detalhe";
                                const parentLabel = colIndex > 0 && path[colIndex - 1] ? resolveParent(colIndex - 1)?.label : null;
                                return (
                                    <motion.div
                                        key={colIndex}
                                        ref={(el) => {
                                            columnRefs.current.set(colIndex, el);
                                        }}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.22, ease: "easeOut" }}
                                        onAnimationComplete={computeLines}
                                        className="flex w-52 shrink-0 flex-col gap-5"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-col gap-0.5 pb-2">
                                                <span className="text-xs font-semibold text-tertiary uppercase tracking-wide">{headerLabel}</span>
                                                {parentLabel && <span className="truncate text-xs text-tertiary">{parentLabel}</span>}
                                            </div>
                                            <ul className="flex flex-col gap-2">
                                                {nodes.map((node) => {
                                                    const baseSum = nodes.reduce((s, n) => s + n.value, 0);
                                                    const isDateNode = colIndex === 0 && node.estoque !== undefined;
                                                    const pct = isDateNode ? (node.value / (node.estoque ?? 1)) * 100 : baseSum === 0 ? 0 : (node.value / baseSum) * 100;
                                                    const isSelected = node.id === selectedId;
                                                    const dimmed = hasSelection && !isSelected;
                                                    const isLeaf = !node.children?.length;
                                                    return (
                                                        <li key={node.id}>
                                                            <button
                                                                ref={(el) => {
                                                                    itemRefs.current.set(node.id, el);
                                                                }}
                                                                type="button"
                                                                onClick={() => !isLeaf && handleSelect(colIndex, node.id)}
                                                                disabled={isLeaf}
                                                                className={cx(
                                                                    "flex w-full flex-col gap-1 rounded-md bg-secondary px-3 py-2.5 text-left ring-1 ring-border-secondary transition duration-100 ease-linear",
                                                                    !isLeaf && "hover:bg-secondary_hover",
                                                                    isLeaf && "cursor-default",
                                                                    isSelected && "ring-2 ring-brand",
                                                                    dimmed && "opacity-50",
                                                                )}
                                                            >
                                                                <span className={cx("truncate text-xs text-primary", isSelected ? "font-semibold" : "font-medium")}>{node.label}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-quaternary">
                                                                        <div className={cx("h-full rounded-full", isSelected ? "bg-fg-brand-primary" : "bg-utility-brand-400")} style={{ width: `${pct}%` }} />
                                                                    </div>
                                                                    <span className="shrink-0 text-xs font-medium text-primary tabular-nums">{pct.toFixed(1)}%</span>
                                                                </div>
                                                                <span className="text-xs text-tertiary tabular-nums">
                                                                    {isDateNode ? `${numberFormatter.format(node.value)} / ${numberFormatter.format(node.estoque ?? 0)}` : numberFormatter.format(node.value)}
                                                                </span>
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>

                                        {colIndex === 0 && (produtosRoot.children?.length ?? 0) > 0 && (
                                            <div className="flex flex-col gap-2">
                                                <span className="pb-2 text-xs font-semibold text-tertiary uppercase tracking-wide">Produto</span>
                                                {(() => {
                                                    const isSelected = path[0] === PRODUTOS_ROOT_ID;
                                                    const dimmed = hasSelection && !isSelected;
                                                    return (
                                                        <button
                                                            ref={(el) => {
                                                                itemRefs.current.set(PRODUTOS_ROOT_ID, el);
                                                            }}
                                                            type="button"
                                                            onClick={() => handleSelect(0, PRODUTOS_ROOT_ID)}
                                                            className={cx(
                                                                "flex w-full flex-col gap-1 rounded-md bg-secondary px-3 py-2.5 text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary_hover",
                                                                isSelected && "ring-2 ring-brand",
                                                                dimmed && "opacity-50",
                                                            )}
                                                        >
                                                            <span className={cx("truncate text-xs text-primary", isSelected ? "font-semibold" : "font-medium")}>Produtos</span>
                                                            <span className="text-xs text-tertiary">{produtosRoot.children?.length ?? 0} itens</span>
                                                            <span className="text-xs text-tertiary tabular-nums">{numberFormatter.format(produtosRoot.value)} unidades</span>
                                                        </button>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}

                            {path.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.22, ease: "easeOut", delay: 0.05 }}
                                    className="hidden max-w-[240px] flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center md:flex"
                                >
                                    <FeaturedIcon icon={CursorClick02} color="gray" theme="modern" size="md" />
                                    <p className="text-sm font-semibold text-primary">Selecione uma sessão</p>
                                    <p className="text-xs text-tertiary">Escolha uma sessão para ver o detalhamento por tipo, setor, ingresso, lote e tipo.</p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {showHint && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-primary/85 px-6 text-center backdrop-blur-[2px] md:hidden"
                        >
                            <FeaturedIcon icon={CursorClick02} color="gray" theme="modern" size="md" />
                            <p className="text-sm font-semibold text-primary">Selecione uma sessão</p>
                            <p className="max-w-[260px] text-xs text-tertiary">Escolha uma sessão para ver o detalhamento por tipo, setor, ingresso, lote e tipo.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Ocupação por setor                                                */
/* ------------------------------------------------------------------ */

const OcupacaoPorSetorCard = ({ setores: setoresView }: { setores: SetorRow[] }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggleExpanded = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const accessors = useMemo(
        () => ({ nome: (s: SetorRow) => s.nome, estoque: (s: SetorRow) => s.estoque, vendido: (s: SetorRow) => s.vendido, ocupacao: (s: SetorRow) => (s.estoque === 0 ? 0 : s.vendido / s.estoque) }),
        [],
    );
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(setoresView as unknown as Record<string, unknown>[], accessors as Partial<Record<string, (r: Record<string, unknown>) => string | number>>, { key: "vendido", dir: "desc" });
    const sortedSetores = sorted as unknown as SetorRow[];

    return (
        <Card title="Ocupação por setor">
            <table className="w-full table-fixed border-collapse">
                <colgroup>
                    <col className="w-10 md:w-12" />
                    <col className="w-[38%] md:w-auto" />
                    <col className="hidden md:table-column" />
                    <col className="hidden md:table-column" />
                    <col />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="px-2 py-3 md:px-4" aria-hidden="true" />
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Setor" sortKey="nome" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">
                            <SortableHeader label="Estoque" align="right" sortKey="estoque" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">
                            <SortableHeader label="Vendido" align="right" sortKey="vendido" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Taxa de ocupação" sortKey="ocupacao" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedSetores.map((setor, i) => {
                        const isExpanded = expanded.has(setor.id);
                        const hasIngressos = !!setor.ingressos?.length;
                        const isLast = i === sortedSetores.length - 1;
                        return (
                            <Fragment key={setor.id}>
                                <tr
                                    role={hasIngressos ? "button" : undefined}
                                    tabIndex={hasIngressos ? 0 : undefined}
                                    aria-expanded={hasIngressos ? isExpanded : undefined}
                                    onClick={hasIngressos ? () => toggleExpanded(setor.id) : undefined}
                                    onKeyDown={
                                        hasIngressos
                                            ? (e) => {
                                                  if (e.key === "Enter" || e.key === " ") {
                                                      e.preventDefault();
                                                      toggleExpanded(setor.id);
                                                  }
                                              }
                                            : undefined
                                    }
                                    className={cx("transition duration-100 ease-linear", hasIngressos && "cursor-pointer hover:bg-primary_hover", !isLast && !isExpanded && "border-b border-secondary", isExpanded && "border-b border-secondary")}
                                >
                                    <td className="px-2 py-4 md:px-4">{hasIngressos && <ChevronDown aria-hidden="true" className={cx("size-4 text-fg-quaternary transition-transform duration-150", isExpanded && "rotate-180")} />}</td>
                                    <td className="px-4 py-4 text-sm text-primary">
                                        <span className="line-clamp-2">{setor.nome}</span>
                                    </td>
                                    <td className="hidden px-4 py-4 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(setor.estoque)}</td>
                                    <td className="hidden px-4 py-4 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(setor.vendido)}</td>
                                    <td className="px-4 py-4">
                                        <OccupancyBar value={setor.vendido} total={setor.estoque} />
                                    </td>
                                </tr>
                                {isExpanded &&
                                    setor.ingressos?.map((ingresso, j, arr) => {
                                        const isLastIngresso = j === arr.length - 1;
                                        return (
                                            <tr key={ingresso.id} className={cx("bg-secondary", isLastIngresso && !isLast && "border-b border-secondary")}>
                                                <td className="px-2 py-3 md:px-4" />
                                                <td className="px-4 py-3 pl-10 text-sm text-secondary">
                                                    <span className="line-clamp-2">{ingresso.nome}</span>
                                                </td>
                                                <td className="hidden px-4 py-3 md:table-cell" />
                                                <td className="hidden px-4 py-3 text-right text-sm text-tertiary md:table-cell">{numberFormatter.format(ingresso.vendido)}</td>
                                                <td className="px-4 py-3">
                                                    <OccupancyBar value={ingresso.vendido} total={setor.vendido} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>
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
/*  Quantidade de ingressos por setor (tickets avulsos)               */
/* ------------------------------------------------------------------ */

interface GrupoSetor {
    setor: string;
    rows: IngressoPorSetorRow[];
    vendidos: number;
    estoque: number;
}

const QuantidadeIngressosPorSetorCard = ({ rows }: { rows: IngressoPorSetorRow[] }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const grupos = useMemo(() => {
        const map = new Map<string, GrupoSetor>();
        rows.forEach((row) => {
            const g = map.get(row.setor) ?? { setor: row.setor, rows: [], vendidos: 0, estoque: 0 };
            g.rows.push(row);
            g.vendidos += row.vendidos;
            // Estoque do setor = capacidade física (SETOR_CAP); fallback p/ máximo das linhas.
            g.estoque = SETOR_CAP[row.setor] ?? Math.max(g.estoque, row.estoque);
            map.set(row.setor, g);
        });
        return Array.from(map.values());
    }, [rows]);

    const accessors = useMemo(
        () => ({ setor: (g: GrupoSetor) => g.setor, vendidos: (g: GrupoSetor) => g.vendidos, estoque: (g: GrupoSetor) => g.estoque }),
        [],
    );
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(grupos as unknown as Record<string, unknown>[], accessors as Partial<Record<string, (r: Record<string, unknown>) => string | number>>, { key: "vendidos", dir: "desc" });
    const sortedGrupos = sorted as unknown as GrupoSetor[];

    const totalVendidos = grupos.reduce((s, g) => s + g.vendidos, 0);
    const totalEstoque = grupos.reduce((s, g) => s + g.estoque, 0);

    const toggle = (setor: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(setor)) next.delete(setor);
            else next.add(setor);
            return next;
        });

    return (
        <Card title="Quantidade de Ingresso por Setor">
            <table className="w-full table-fixed border-collapse">
                <colgroup>
                    <col className="w-10 md:w-12" />
                    <col className="w-[42%] md:w-auto" />
                    <col className="hidden md:table-column" />
                    <col className="hidden md:table-column" />
                    <col />
                    <col />
                    <col className="hidden lg:table-column" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="px-2 py-3 md:px-4" aria-hidden="true" />
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Setor" sortKey="setor" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary md:table-cell">Lote</th>
                        <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary md:table-cell">Item Combo</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Vendidos" align="right" sortKey="vendidos" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Estoque" align="right" sortKey="estoque" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        </th>
                        <th className="hidden px-4 py-3 text-xs font-semibold text-tertiary lg:table-cell">Ocupação</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedGrupos.map((grupo) => {
                        const isExpanded = expanded.has(grupo.setor);
                        return (
                            <Fragment key={grupo.setor}>
                                <tr
                                    role="button"
                                    tabIndex={0}
                                    aria-expanded={isExpanded}
                                    onClick={() => toggle(grupo.setor)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            toggle(grupo.setor);
                                        }
                                    }}
                                    className="cursor-pointer border-b border-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                                >
                                    <td className="px-2 py-4 md:px-4">
                                        <ChevronDown aria-hidden="true" className={cx("size-4 text-fg-quaternary transition-transform duration-150", isExpanded && "rotate-180")} />
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium text-primary">
                                        <span className="line-clamp-2">{grupo.setor}</span>
                                    </td>
                                    <td className="hidden px-4 py-4 md:table-cell" />
                                    <td className="hidden px-4 py-4 md:table-cell" />
                                    <td className="px-4 py-4 text-right text-sm font-medium text-primary">{numberFormatter.format(grupo.vendidos)}</td>
                                    <td className="px-4 py-4 text-right text-sm text-tertiary">{numberFormatter.format(grupo.estoque)}</td>
                                    <td className="hidden px-4 py-4 lg:table-cell">
                                        <OccupancyBar value={grupo.vendidos} total={grupo.estoque} />
                                    </td>
                                </tr>
                                {isExpanded &&
                                    grupo.rows.map((row) => (
                                        <tr key={row.id} className="border-b border-secondary bg-secondary">
                                            <td className="px-2 py-3 md:px-4" />
                                            <td className="px-4 py-3 pl-10 text-sm text-secondary">
                                                <span className="line-clamp-2">{row.tipoIngresso}</span>
                                            </td>
                                            <td className="hidden px-4 py-3 text-sm text-tertiary md:table-cell">{row.lote}</td>
                                            <td className="hidden px-4 py-3 text-sm text-tertiary md:table-cell">{row.itemCombo}</td>
                                            <td className="px-4 py-3 text-right text-sm text-tertiary">{numberFormatter.format(row.vendidos)}</td>
                                            <td className="px-4 py-3 text-right text-sm text-tertiary">{numberFormatter.format(row.estoque)}</td>
                                            <td className="hidden px-4 py-3 lg:table-cell">
                                                <OccupancyBar value={row.vendidos} total={grupo.vendidos} />
                                            </td>
                                        </tr>
                                    ))}
                            </Fragment>
                        );
                    })}
                    <tr className="bg-secondary font-semibold">
                        <td className="px-2 py-3 md:px-4" />
                        <td className="px-4 py-3 text-sm text-primary">Total</td>
                        <td className="hidden px-4 py-3 md:table-cell" />
                        <td className="hidden px-4 py-3 md:table-cell" />
                        <td className="px-4 py-3 text-right text-sm text-primary">{numberFormatter.format(totalVendidos)}</td>
                        <td className="px-4 py-3 text-right text-sm text-primary">{numberFormatter.format(totalEstoque)}</td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                            <OccupancyBar value={totalVendidos} total={totalEstoque} />
                        </td>
                    </tr>
                </tbody>
            </table>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Combo                                                             */
/* ------------------------------------------------------------------ */

const ComboCard = ({ rows }: { rows: ComboRow[] }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(rows as unknown as Record<string, unknown>[], undefined, { key: "gmv", dir: "desc" });
    const sortedRows = sorted as unknown as ComboRow[];
    const toggle = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    return (
        <Card title="Combos">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            <th className="w-10 px-2 py-3 md:px-4" aria-hidden="true" />
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary"><SortableHeader label="Combo" sortKey="nome" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Quantidade" align="right" sortKey="quantidade" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor unitário médio" align="right" sortKey="valorUnitario" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor total bruto" align="right" sortKey="gmv" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Desconto" align="right" sortKey="desconto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor total c/ desconto" align="right" sortKey="gmvComDesconto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((row, i) => {
                            const isExpanded = expanded.has(row.id);
                            const isLast = i === sortedRows.length - 1;
                            return (
                                <Fragment key={row.id}>
                                    <tr
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={isExpanded}
                                        onClick={() => toggle(row.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                toggle(row.id);
                                            }
                                        }}
                                        className={cx("cursor-pointer transition duration-100 ease-linear hover:bg-primary_hover", (!isLast || isExpanded) && "border-b border-secondary")}
                                    >
                                        <td className="px-2 py-4 md:px-4">
                                            <ChevronDown aria-hidden="true" className={cx("size-4 text-fg-quaternary transition-transform duration-150", isExpanded && "rotate-180")} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">{row.nome}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{numberFormatter.format(row.quantidade)}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valorUnitario)}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.gmv)}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.desconto)}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.gmvComDesconto)}</td>
                                    </tr>
                                    {isExpanded &&
                                        row.lotes.map((lote) => (
                                            <tr key={lote.id} className="border-b border-secondary bg-secondary">
                                                <td className="px-2 py-3 md:px-4" />
                                                <td className="whitespace-nowrap px-4 py-3 pl-10 text-sm text-secondary">{lote.lote}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{numberFormatter.format(lote.quantidade)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{currencyFormatter.format(lote.valorUnitario)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{currencyFormatter.format(lote.gmv)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{currencyFormatter.format(lote.desconto)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{currencyFormatter.format(lote.gmvComDesconto)}</td>
                                            </tr>
                                        ))}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Produtos                                                          */
/* ------------------------------------------------------------------ */

const ProdutosCard = ({ rows }: { rows: ProdutoRow[] }) => {
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(rows as unknown as Record<string, unknown>[], undefined, { key: "gmv", dir: "desc" });
    const sortedRows = sorted as unknown as ProdutoRow[];
    return (
        <Card title="Produtos">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary"><SortableHeader label="Produto" sortKey="nome" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Qtd" align="right" sortKey="quantidade" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor Unitário" align="right" sortKey="valorUnitario" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor total bruto" align="right" sortKey="gmv" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor total c/ desconto" align="right" sortKey="gmvComDesconto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((row, i) => (
                            <tr key={row.id} className={cx("transition duration-100 ease-linear hover:bg-primary_hover", i !== sortedRows.length - 1 && "border-b border-secondary")}>
                                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">{row.nome}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{numberFormatter.format(row.quantidade)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valorUnitario)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.gmv)}</td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.gmvComDesconto)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

/* ------------------------------------------------------------------ */
/*  Ingressos com cupom (expansível por lote)                         */
/* ------------------------------------------------------------------ */

const IngressosComCupomCard = ({ cupons: cuponsView }: { cupons: CupomRow[] }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const accessors = useMemo(
        () => ({ cupom: (c: CupomRow) => c.cupom, quantidade: (c: CupomRow) => c.quantidade, valor: (c: CupomRow) => c.valor, valorDesconto: (c: CupomRow) => c.valorDesconto, valorTotal: (c: CupomRow) => c.valorTotal }),
        [],
    );
    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(cuponsView as unknown as Record<string, unknown>[], accessors as Partial<Record<string, (r: Record<string, unknown>) => string | number>>, { key: "quantidade", dir: "desc" });
    const sortedCupons = sorted as unknown as CupomRow[];

    const toggle = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    return (
        <Card title="Quantidade de ingressos com cupom">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            <th className="w-10 px-2 py-3 md:px-4" aria-hidden="true" />
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary"><SortableHeader label="Cupom" sortKey="cupom" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Quantidade" align="right" sortKey="quantidade" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor" align="right" sortKey="valor" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor do Desconto" align="right" sortKey="valorDesconto" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary"><SortableHeader label="Valor Total" align="right" sortKey="valorTotal" activeKey={sortKey} dir={sortDir} onSort={toggleSort} /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCupons.map((row, i) => {
                            const isExpanded = expanded.has(row.id);
                            const isLast = i === sortedCupons.length - 1;
                            return (
                                <Fragment key={row.id}>
                                    <tr
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={isExpanded}
                                        onClick={() => toggle(row.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                toggle(row.id);
                                            }
                                        }}
                                        className={cx("cursor-pointer transition duration-100 ease-linear hover:bg-primary_hover", (!isLast || isExpanded) && "border-b border-secondary")}
                                    >
                                        <td className="px-2 py-4 md:px-4">
                                            <ChevronDown aria-hidden="true" className={cx("size-4 text-fg-quaternary transition-transform duration-150", isExpanded && "rotate-180")} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">{row.cupom}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{numberFormatter.format(row.quantidade)}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valor)}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valorDesconto)}</td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">{currencyFormatter.format(row.valorTotal)}</td>
                                    </tr>
                                    {isExpanded &&
                                        row.lotes.map((lote, j) => (
                                            <tr key={lote.id} className={cx("bg-secondary", (!isLast || j !== row.lotes.length - 1) && "border-b border-secondary")}>
                                                <td className="px-2 py-3 md:px-4" />
                                                <td className="whitespace-nowrap px-4 py-3 pl-10 text-sm text-secondary">{lote.lote}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{numberFormatter.format(lote.quantidade)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{currencyFormatter.format(lote.valor)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{currencyFormatter.format(lote.valorDesconto)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-tertiary">{currencyFormatter.format(lote.valorTotal)}</td>
                                            </tr>
                                        ))}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
