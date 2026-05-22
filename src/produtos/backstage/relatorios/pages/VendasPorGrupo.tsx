import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp, Ticket01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { MetricsSimple } from "@/components/application/metrics/metrics";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";

/* ------------------------------------------------------------------ */
/*  Formatters                                                        */
/* ------------------------------------------------------------------ */

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});
const numberFormatter = new Intl.NumberFormat("pt-BR");

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

interface DetalheItem {
    id: string;
    nome: string;
    quantidade: number;
    gmv: number;
    gmvComDesconto: number;
}

interface IngressoRow {
    id: string;
    nome: string;
    estoque: number;
    vendida: number;
}

interface SetorRow {
    id: string;
    nome: string;
    estoque: number;
    vendida: number;
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

interface ComboRow {
    id: string;
    nome: string;
    quantidade: number;
    valorUnitario: number;
    gmv: number;
    gmvComDesconto: number;
}

interface ProdutoRow {
    id: string;
    nome: string;
    quantidade: number;
    valorUnitario: number;
    gmv: number;
    gmvComDesconto: number;
}

interface CupomRow {
    id: string;
    cupom: string;
    quantidade: number;
    valor: number;
    valorDesconto: number;
    valorTotal: number;
}

const detalheItens: DetalheItem[] = [
    {
        id: "ingresso-individual",
        nome: "Ingresso Individual",
        quantidade: 33500,
        gmv: 2612500.0,
        gmvComDesconto: 2479350.0,
    },
    {
        id: "combo-camarote",
        nome: "Combo Camarote + Open Bar",
        quantidade: 3807,
        gmv: 276377.13,
        gmvComDesconto: 263500.0,
    },
];

const setores: SetorRow[] = [
    {
        id: "vip",
        nome: "VIP",
        estoque: 2000,
        vendida: 1800,
        ingressos: [
            { id: "vip-1l-int", nome: "VIP - 1º Lote (Inteira)", estoque: 800, vendida: 800 },
            { id: "vip-1l-mei", nome: "VIP - 1º Lote (Meia)", estoque: 400, vendida: 400 },
            { id: "vip-2l-int", nome: "VIP - 2º Lote (Inteira)", estoque: 500, vendida: 380 },
            { id: "vip-2l-mei", nome: "VIP - 2º Lote (Meia)", estoque: 300, vendida: 220 },
        ],
    },
    {
        id: "camarote",
        nome: "Camarote Premium",
        estoque: 1500,
        vendida: 1200,
        ingressos: [
            { id: "cam-1l-int", nome: "Camarote - 1º Lote (Inteira)", estoque: 500, vendida: 500 },
            { id: "cam-1l-mei", nome: "Camarote - 1º Lote (Meia)", estoque: 300, vendida: 300 },
            { id: "cam-2l-int", nome: "Camarote - 2º Lote (Inteira)", estoque: 400, vendida: 250 },
            { id: "cam-2l-mei", nome: "Camarote - 2º Lote (Meia)", estoque: 300, vendida: 150 },
        ],
    },
    {
        id: "pista-premium",
        nome: "Pista Premium",
        estoque: 8000,
        vendida: 6400,
        ingressos: [
            { id: "pp-1l-int", nome: "Pista Premium - 1º Lote (Inteira)", estoque: 3000, vendida: 3000 },
            { id: "pp-1l-mei", nome: "Pista Premium - 1º Lote (Meia)", estoque: 1500, vendida: 1500 },
            { id: "pp-2l-int", nome: "Pista Premium - 2º Lote (Inteira)", estoque: 2500, vendida: 1400 },
            { id: "pp-2l-mei", nome: "Pista Premium - 2º Lote (Meia)", estoque: 1000, vendida: 500 },
        ],
    },
    {
        id: "pista",
        nome: "Pista",
        estoque: 20000,
        vendida: 18000,
        ingressos: [
            { id: "p-1l-int", nome: "Pista - 1º Lote (Inteira)", estoque: 5000, vendida: 5000 },
            { id: "p-1l-mei", nome: "Pista - 1º Lote (Meia)", estoque: 4000, vendida: 4000 },
            { id: "p-2l-int", nome: "Pista - 2º Lote (Inteira)", estoque: 6000, vendida: 5500 },
            { id: "p-2l-mei", nome: "Pista - 2º Lote (Meia)", estoque: 3000, vendida: 2500 },
            { id: "p-3l-int", nome: "Pista - 3º Lote (Inteira)", estoque: 2000, vendida: 1000 },
        ],
    },
    {
        id: "mezanino",
        nome: "Mezanino",
        estoque: 5807,
        vendida: 2400,
        ingressos: [
            { id: "mez-1l-int", nome: "Mezanino - 1º Lote (Inteira)", estoque: 2000, vendida: 1500 },
            { id: "mez-1l-mei", nome: "Mezanino - 1º Lote (Meia)", estoque: 1500, vendida: 600 },
            { id: "mez-2l-int", nome: "Mezanino - 2º Lote (Inteira)", estoque: 1500, vendida: 200 },
            { id: "mez-2l-mei", nome: "Mezanino - 2º Lote (Meia)", estoque: 807, vendida: 100 },
        ],
    },
];

const ingressosPorSetor: IngressoPorSetorRow[] = [
    { id: "ips1", setor: "VIP", tipoIngresso: "Inteira", lote: "1º Lote", itemCombo: "Combo Camarote + Open Bar", vendidos: 800, estoque: 800 },
    { id: "ips2", setor: "VIP", tipoIngresso: "Meia", lote: "1º Lote", itemCombo: "—", vendidos: 400, estoque: 400 },
    { id: "ips3", setor: "VIP", tipoIngresso: "Inteira", lote: "2º Lote", itemCombo: "—", vendidos: 380, estoque: 500 },
    { id: "ips4", setor: "VIP", tipoIngresso: "Meia", lote: "2º Lote", itemCombo: "—", vendidos: 220, estoque: 300 },
    { id: "ips5", setor: "Camarote Premium", tipoIngresso: "Inteira", lote: "1º Lote", itemCombo: "Combo Camarote + Open Bar", vendidos: 500, estoque: 500 },
    { id: "ips6", setor: "Camarote Premium", tipoIngresso: "Meia", lote: "1º Lote", itemCombo: "—", vendidos: 300, estoque: 300 },
    { id: "ips7", setor: "Camarote Premium", tipoIngresso: "Inteira", lote: "2º Lote", itemCombo: "—", vendidos: 250, estoque: 400 },
    { id: "ips8", setor: "Pista Premium", tipoIngresso: "Inteira", lote: "1º Lote", itemCombo: "—", vendidos: 3000, estoque: 3000 },
    { id: "ips9", setor: "Pista Premium", tipoIngresso: "Meia", lote: "1º Lote", itemCombo: "—", vendidos: 1500, estoque: 1500 },
    { id: "ips10", setor: "Pista Premium", tipoIngresso: "Inteira", lote: "2º Lote", itemCombo: "—", vendidos: 1400, estoque: 2500 },
    { id: "ips11", setor: "Pista", tipoIngresso: "Inteira", lote: "1º Lote", itemCombo: "—", vendidos: 5000, estoque: 5000 },
    { id: "ips12", setor: "Pista", tipoIngresso: "Meia | Caravanas", lote: "2º Lote", itemCombo: "—", vendidos: 2500, estoque: 3000 },
    { id: "ips13", setor: "Mezanino", tipoIngresso: "Inteira", lote: "1º Lote", itemCombo: "—", vendidos: 1500, estoque: 2000 },
];

const combos: ComboRow[] = [
    { id: "c1", nome: "Combo Camarote + Open Bar", quantidade: 1480, valorUnitario: 379, gmv: 560440, gmvComDesconto: 560440 },
    { id: "c2", nome: "Combo VIP + Welcome Drink", quantidade: 442, valorUnitario: 680, gmv: 300608, gmvComDesconto: 300608 },
    { id: "c3", nome: "Combo Família (4 ingressos)", quantidade: 112, valorUnitario: 681, gmv: 76188, gmvComDesconto: 76188 },
    { id: "c4", nome: "Combo Premium + Estacionamento", quantidade: 22, valorUnitario: 2159, gmv: 47498, gmvComDesconto: 47498 },
    { id: "c5", nome: "Combo Casal Camarote", quantidade: 49, valorUnitario: 758, gmv: 37124, gmvComDesconto: 37124 },
    { id: "c6", nome: "Combo VIP Solo + Brinde", quantidade: 14, valorUnitario: 1368, gmv: 19152, gmvComDesconto: 19152 },
    { id: "c7", nome: "Combo Business Pista Premium", quantidade: 2, valorUnitario: 1358, gmv: 2716, gmvComDesconto: 2716 },
];

const produtos: ProdutoRow[] = [
    { id: "pr1", nome: "Kit Oficial #SantaSanta26", quantidade: 123, valorUnitario: 199.9, gmv: 24587.7, gmvComDesconto: 24587.7 },
    { id: "pr2", nome: "Boneco Bot_Gs - Fandom Box", quantidade: 47, valorUnitario: 107.35, gmv: 5045.3, gmvComDesconto: 5045.3 },
    { id: "pr3", nome: "Sacochila Oficial", quantidade: 126, valorUnitario: 29.9, gmv: 3767.4, gmvComDesconto: 3767.4 },
    { id: "pr4", nome: "Camisa Oficial - M", quantidade: 36, valorUnitario: 99.9, gmv: 3596.4, gmvComDesconto: 3596.4 },
    { id: "pr5", nome: "Camisa Oficial - G", quantidade: 29, valorUnitario: 99.9, gmv: 2897.1, gmvComDesconto: 2897.1 },
    { id: "pr6", nome: "Camisa Oficial - P", quantidade: 23, valorUnitario: 99.9, gmv: 2297.7, gmvComDesconto: 2297.7 },
    { id: "pr7", nome: "Copo Oficial", quantidade: 100, valorUnitario: 19.89, gmv: 1989, gmvComDesconto: 1989 },
    { id: "pr8", nome: "Camisa Oficial - GG", quantidade: 14, valorUnitario: 99.9, gmv: 1398.6, gmvComDesconto: 1398.6 },
];

const cupons: CupomRow[] = [
    { id: "cu1", cupom: "FAN15", quantidade: 142, valor: 19738.0, valorDesconto: 2960.7, valorTotal: 16777.3 },
    { id: "cu2", cupom: "VIPACCESS", quantidade: 38, valor: 13680.0, valorDesconto: 1368.0, valorTotal: 12312.0 },
    { id: "cu3", cupom: "PREMIERE10", quantidade: 24, valor: 7332.0, valorDesconto: 733.2, valorTotal: 6598.8 },
    { id: "cu4", cupom: "TESTE2", quantidade: 1, valor: 139.0, valorDesconto: 137.61, valorTotal: 1.39 },
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function VendasPorGrupo() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="vendas-por-grupo">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center md:px-6 py-6">
                    <h1 className="text-display-xs font-bold text-primary">Relatórios</h1>
                </header>
                <main className="flex flex-1 flex-col gap-6 md:px-6 pb-10">
                    <h2 className="text-lg font-semibold text-primary">Vendas por grupo</h2>

                    <MetricsRow />
                    <DetalhePorItemCard />
                    <OcupacaoPorSetorCard />
                    <ComboCard />
                    <ProdutosCard />
                    <IngressosComCupomCard />
                    <QuantidadeIngressosPorSetorCard />
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Metrics row                                                       */
/* ------------------------------------------------------------------ */

const HIDE_TREND_AND_MENU =
    "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

const MetricsRow = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricsSimple
            type="modern"
            trend="positive"
            subtitle="Valor total"
            title={currencyFormatter.format(2888877.13)}
            footer={null}
            className={HIDE_TREND_AND_MENU}
        />
        <MetricsSimple
            type="modern"
            trend="positive"
            subtitle="Total de itens"
            title={numberFormatter.format(37307)}
            footer={null}
            className={HIDE_TREND_AND_MENU}
        />
    </div>
);

/* ------------------------------------------------------------------ */
/*  Card shell                                                        */
/* ------------------------------------------------------------------ */

interface CardProps {
    title: string;
    children: React.ReactNode;
}

const Card = ({ title, children }: CardProps) => (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="border-b border-secondary px-4 py-4">
            <h3 className="text-md font-semibold text-primary">{title}</h3>
        </header>
        {children}
    </section>
);

/* ------------------------------------------------------------------ */
/*  Detalhe por Item                                                  */
/* ------------------------------------------------------------------ */

const DetalhePorItemCard = () => (
    <Card title="Detalhe por Item">
        <div className="flex flex-col">
            {detalheItens.map((item, i) => (
                <div
                    key={item.id}
                    className={cx(
                        "flex flex-col gap-4 px-4 py-4 transition duration-100 ease-linear hover:bg-primary_hover md:flex-row md:items-center",
                        i !== detalheItens.length - 1 && "border-b border-secondary",
                    )}
                >
                    <div className="flex min-w-0 items-center gap-3 md:flex-1">
                        <FeaturedIcon
                            icon={Ticket01}
                            color="gray"
                            theme="gradient"
                            size="md"
                        />
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-primary">
                            {item.nome}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-6 md:gap-8">
                        <StatBlock label="Quantidade" value={numberFormatter.format(item.quantidade)} />
                        <StatBlock label="GMV" value={currencyFormatter.format(item.gmv)} />
                        <StatBlock
                            label="GMV com Desconto"
                            value={currencyFormatter.format(item.gmvComDesconto)}
                        />
                    </div>
                </div>
            ))}
        </div>
    </Card>
);

interface StatBlockProps {
    label: string;
    value: string;
}

const StatBlock = ({ label, value }: StatBlockProps) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-xs text-tertiary">{label}</span>
        <span className="text-sm font-medium text-primary">{value}</span>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Ocupação por setor                                                */
/* ------------------------------------------------------------------ */

const OcupacaoPorSetorCard = () => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set(["s2"]));

    const toggleExpanded = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <Card title="Ocupação por setor">
            <table className="w-full table-fixed border-collapse">
                <colgroup>
                    <col className="w-[38%] md:w-auto" />
                    <col className="hidden md:table-column" />
                    <col className="hidden md:table-column" />
                    <col />
                    <col className="w-10 md:w-32" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">Setor</th>
                        <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">
                            Estoque
                        </th>
                        <th className="hidden px-4 py-3 text-right text-xs font-semibold text-tertiary md:table-cell">
                            Vendida
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            <span className="inline-flex items-center gap-1">
                                Taxa de ocupação <ChevronDown className="size-3.5" />
                            </span>
                        </th>
                        <th className="px-2 py-3 md:px-4" aria-label="Ações" />
                    </tr>
                </thead>
                <tbody>
                    {setores.map((setor, i) => {
                        const isExpanded = expanded.has(setor.id);
                        const hasIngressos = !!setor.ingressos?.length;
                        const isLast = i === setores.length - 1;
                        return (
                            <Fragment key={setor.id}>
                                <tr
                                    className={cx(
                                        "transition duration-100 ease-linear hover:bg-primary_hover",
                                        !isLast && !isExpanded && "border-b border-secondary",
                                        isExpanded && "border-b border-secondary",
                                    )}
                                >
                                    <td className="px-4 py-4 text-sm text-primary">
                                        <span className="line-clamp-2">{setor.nome}</span>
                                    </td>
                                    <td className="hidden px-4 py-4 text-right text-sm text-tertiary md:table-cell">
                                        {numberFormatter.format(setor.estoque)}
                                    </td>
                                    <td className="hidden px-4 py-4 text-right text-sm text-tertiary md:table-cell">
                                        {numberFormatter.format(setor.vendida)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <OccupancyBar value={setor.vendida} total={setor.estoque} />
                                    </td>
                                    <td className="px-2 py-4 md:px-4">
                                        <div className="flex justify-end">
                                            <Button
                                                size="sm"
                                                color="link-gray"
                                                iconTrailing={isExpanded ? ChevronUp : ChevronDown}
                                                isDisabled={!hasIngressos}
                                                onClick={() => toggleExpanded(setor.id)}
                                                aria-label={isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                                            >
                                                <span className="hidden md:inline">Detalhes</span>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                                {isExpanded &&
                                    setor.ingressos?.map((ingresso, j) => {
                                        const isLastIngresso = j === setor.ingressos!.length - 1;
                                        return (
                                            <tr
                                                key={ingresso.id}
                                                className={cx(
                                                    "bg-secondary transition duration-100 ease-linear hover:bg-secondary",
                                                    isLastIngresso && !isLast && "border-b border-secondary",
                                                )}
                                            >
                                                <td className="px-4 py-3 pl-10 text-sm text-secondary">
                                                    <span className="line-clamp-2">{ingresso.nome}</span>
                                                </td>
                                                <td className="hidden px-4 py-3 text-right text-sm text-tertiary md:table-cell">
                                                    {numberFormatter.format(ingresso.estoque)}
                                                </td>
                                                <td className="hidden px-4 py-3 text-right text-sm text-tertiary md:table-cell">
                                                    {numberFormatter.format(ingresso.vendida)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <OccupancyBar
                                                        value={ingresso.vendida}
                                                        total={setor.vendida}
                                                    />
                                                </td>
                                                <td className="px-2 py-3 md:px-4" />
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

interface OccupancyBarProps {
    value: number;
    total: number;
}

const OccupancyBar = ({ value, total }: OccupancyBarProps) => {
    const pct = total === 0 ? 0 : Math.round((value / total) * 100);
    const clamped = Math.min(100, Math.max(0, pct));
    return (
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-quaternary">
                <div
                    className="h-full rounded-full bg-brand-solid transition-all"
                    style={{ width: `${clamped}%` }}
                />
            </div>
            <span className="w-10 shrink-0 text-right text-sm text-tertiary">{clamped}%</span>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Quantidade de ingressos por setor                                 */
/* ------------------------------------------------------------------ */

const QuantidadeIngressosPorSetorCard = () => (
    <Card title="Quantidade de Ingresso por Setor">
        <div className="overflow-x-auto overflow-y-clip">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Setor" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Tipo Ingresso" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Lote" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Item Combo" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Ingressos Vendidos" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Estoque" align="right" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {ingressosPorSetor.map((row, i) => (
                        <tr
                            key={row.id}
                            className={cx(
                                "transition duration-100 ease-linear hover:bg-primary_hover",
                                i !== ingressosPorSetor.length - 1 && "border-b border-secondary",
                            )}
                        >
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-primary">
                                {row.setor}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-tertiary">
                                {row.tipoIngresso}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-tertiary">
                                {row.lote}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-tertiary">
                                {row.itemCombo}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {numberFormatter.format(row.vendidos)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {numberFormatter.format(row.estoque)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

/* ------------------------------------------------------------------ */
/*  Sortable header                                                   */
/* ------------------------------------------------------------------ */

interface SortableHeaderProps {
    label: string;
    align?: "left" | "right";
}

const SortableHeader = ({ label, align = "left" }: SortableHeaderProps) => (
    <span className={cx("inline-flex items-center", align === "right" && "justify-end")}>
        {label}
    </span>
);

/* ------------------------------------------------------------------ */
/*  Combo                                                             */
/* ------------------------------------------------------------------ */

const ComboCard = () => (
    <Card title="Combo">
        <div className="overflow-x-auto overflow-y-clip">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Item Combo" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Quantidade" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor Unitário" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="GMV" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="GMV com Desconto" align="right" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {combos.map((row, i) => (
                        <tr
                            key={row.id}
                            className={cx(
                                "transition duration-100 ease-linear hover:bg-primary_hover",
                                i !== combos.length - 1 && "border-b border-secondary",
                            )}
                        >
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">
                                {row.nome}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {numberFormatter.format(row.quantidade)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.valorUnitario)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.gmv)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.gmvComDesconto)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

/* ------------------------------------------------------------------ */
/*  Produtos                                                          */
/* ------------------------------------------------------------------ */

const ProdutosCard = () => (
    <Card title="Produtos">
        <div className="overflow-x-auto overflow-y-clip">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Produto" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Qtd" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor Unitário" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="GMV" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="GMV com Desconto" align="right" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {produtos.map((row, i) => (
                        <tr
                            key={row.id}
                            className={cx(
                                "transition duration-100 ease-linear hover:bg-primary_hover",
                                i !== produtos.length - 1 && "border-b border-secondary",
                            )}
                        >
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">
                                {row.nome}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {numberFormatter.format(row.quantidade)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.valorUnitario)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.gmv)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.gmvComDesconto)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

/* ------------------------------------------------------------------ */
/*  Ingressos com cupom                                               */
/* ------------------------------------------------------------------ */

const IngressosComCupomCard = () => (
    <Card title="Quantidade de ingressos com cupom">
        <div className="overflow-x-auto overflow-y-clip">
            <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-secondary">
                    <tr className="border-b border-secondary bg-secondary text-left">
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                            <SortableHeader label="Cupom" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Quantidade" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor do Desconto" align="right" />
                        </th>
                        <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                            <SortableHeader label="Valor Total" align="right" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {cupons.map((row, i) => (
                        <tr
                            key={row.id}
                            className={cx(
                                "transition duration-100 ease-linear hover:bg-primary_hover",
                                i !== cupons.length - 1 && "border-b border-secondary",
                            )}
                        >
                            <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">
                                {row.cupom}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {numberFormatter.format(row.quantidade)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.valor)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.valorDesconto)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                {currencyFormatter.format(row.valorTotal)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);
