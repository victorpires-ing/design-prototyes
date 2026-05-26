import { useMemo, useState, type ReactNode } from "react";
import { MetricsSimple } from "@/components/application/metrics/metrics";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";

/* ------------------------------------------------------------------ */
/*  Shared constants                                                  */
/* ------------------------------------------------------------------ */

const HIDE_TREND_AND_MENU =
    "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});
const numberFormatter = new Intl.NumberFormat("pt-BR");

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

interface BorderoRow {
    id: string;
    setor: string;
    tipoIngresso: string;
    bundle: string;
    produto: string;
    quantidade: number;
    valorUnitario: number;
}

const rawBorderoRows: BorderoRow[] = [
    { id: "vip-1l-int", setor: "VIP", tipoIngresso: "Inteira", bundle: "—", produto: "1º Lote", quantidade: 800, valorUnitario: 500 },
    { id: "vip-1l-mei", setor: "VIP", tipoIngresso: "Meia", bundle: "—", produto: "1º Lote", quantidade: 400, valorUnitario: 250 },
    { id: "vip-1l-combo", setor: "VIP", tipoIngresso: "Inteira", bundle: "Combo Open Bar", produto: "1º Lote", quantidade: 100, valorUnitario: 650 },
    { id: "vip-2l-int", setor: "VIP", tipoIngresso: "Inteira", bundle: "—", produto: "2º Lote", quantidade: 380, valorUnitario: 600 },
    { id: "vip-2l-mei", setor: "VIP", tipoIngresso: "Meia", bundle: "—", produto: "2º Lote", quantidade: 220, valorUnitario: 300 },
    { id: "cam-1l-int", setor: "Camarote Premium", tipoIngresso: "Inteira", bundle: "—", produto: "1º Lote", quantidade: 500, valorUnitario: 450 },
    { id: "cam-1l-mei", setor: "Camarote Premium", tipoIngresso: "Meia", bundle: "—", produto: "1º Lote", quantidade: 300, valorUnitario: 225 },
    { id: "cam-1l-combo", setor: "Camarote Premium", tipoIngresso: "Inteira", bundle: "Combo Camarote + Open Bar", produto: "1º Lote", quantidade: 80, valorUnitario: 580 },
    { id: "cam-2l-int", setor: "Camarote Premium", tipoIngresso: "Inteira", bundle: "—", produto: "2º Lote", quantidade: 250, valorUnitario: 550 },
    { id: "cam-2l-mei", setor: "Camarote Premium", tipoIngresso: "Meia", bundle: "—", produto: "2º Lote", quantidade: 150, valorUnitario: 275 },
    { id: "pp-1l-int", setor: "Pista Premium", tipoIngresso: "Inteira", bundle: "—", produto: "1º Lote", quantidade: 3000, valorUnitario: 120 },
    { id: "pp-1l-mei", setor: "Pista Premium", tipoIngresso: "Meia", bundle: "—", produto: "1º Lote", quantidade: 1500, valorUnitario: 60 },
    { id: "pp-2l-int", setor: "Pista Premium", tipoIngresso: "Inteira", bundle: "—", produto: "2º Lote", quantidade: 1400, valorUnitario: 150 },
    { id: "pp-2l-mei", setor: "Pista Premium", tipoIngresso: "Meia", bundle: "—", produto: "2º Lote", quantidade: 500, valorUnitario: 75 },
    { id: "p-1l-int", setor: "Pista", tipoIngresso: "Inteira", bundle: "—", produto: "1º Lote", quantidade: 5000, valorUnitario: 40 },
    { id: "p-1l-mei", setor: "Pista", tipoIngresso: "Meia", bundle: "—", produto: "1º Lote", quantidade: 4000, valorUnitario: 20 },
    { id: "p-2l-int", setor: "Pista", tipoIngresso: "Inteira", bundle: "—", produto: "2º Lote", quantidade: 5500, valorUnitario: 50 },
    { id: "p-2l-cara", setor: "Pista", tipoIngresso: "Meia | Caravanas", bundle: "—", produto: "2º Lote", quantidade: 2500, valorUnitario: 25 },
    { id: "p-3l-int", setor: "Pista", tipoIngresso: "Inteira", bundle: "—", produto: "3º Lote", quantidade: 1000, valorUnitario: 60 },
    { id: "mez-1l-int", setor: "Mezanino", tipoIngresso: "Inteira", bundle: "—", produto: "1º Lote", quantidade: 1500, valorUnitario: 80 },
    { id: "mez-1l-mei", setor: "Mezanino", tipoIngresso: "Meia", bundle: "—", produto: "1º Lote", quantidade: 600, valorUnitario: 40 },
    { id: "mez-2l-int", setor: "Mezanino", tipoIngresso: "Inteira", bundle: "—", produto: "2º Lote", quantidade: 200, valorUnitario: 100 },
    { id: "mez-2l-mei", setor: "Mezanino", tipoIngresso: "Meia", bundle: "—", produto: "2º Lote", quantidade: 100, valorUnitario: 50 },
];

const borderoRows = rawBorderoRows.map((r) => ({
    ...r,
    valorTotal: r.quantidade * r.valorUnitario,
}));

const totalItens = borderoRows.reduce((s, r) => s + r.quantidade, 0);
const totalBruto = borderoRows.reduce((s, r) => s + r.valorTotal, 0);

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function Bordero() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="bordero">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    <RelatorioPageHeader title="Borderô do Evento" />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <MetricsSimple
                            type="modern"
                            trend="positive"
                            subtitle="Total de Itens"
                            title={numberFormatter.format(totalItens)}
                            footer={null}
                            className={HIDE_TREND_AND_MENU}
                        />
                        <MetricsSimple
                            type="modern"
                            trend="positive"
                            subtitle="Total transacionado"
                            title={currencyFormatter.format(totalBruto)}
                            footer={null}
                            className={HIDE_TREND_AND_MENU}
                        />
                    </div>

                    <BorderoCard />
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Borderô card                                                      */
/* ------------------------------------------------------------------ */

const BorderoCard = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const totalPages = Math.max(1, Math.ceil(borderoRows.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const visibleRows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return borderoRows.slice(start, start + pageSize);
    }, [safePage, pageSize]);

    return (
        <Card title="Borderô">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                                <SortableHeader label="Setor" />
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                                <SortableHeader label="Tipo de Ingresso" />
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                                <SortableHeader label="Bundle" />
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary">
                                <SortableHeader label="Produto" />
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                                <SortableHeader label="Quantidade" align="right" />
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                                <SortableHeader label="Valor Unitário" align="right" />
                            </th>
                            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-tertiary">
                                <SortableHeader label="Valor Total" align="right" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.map((row, i) => (
                            <tr
                                key={row.id}
                                className={cx(
                                    "transition duration-100 ease-linear hover:bg-primary_hover",
                                    i !== visibleRows.length - 1 && "border-b border-secondary",
                                )}
                            >
                                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-primary">
                                    {row.setor}
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-tertiary">
                                    {row.tipoIngresso}
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-tertiary">
                                    {row.bundle}
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-sm text-tertiary">
                                    {row.produto}
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                    {numberFormatter.format(row.quantidade)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-tertiary">
                                    {currencyFormatter.format(row.valorUnitario)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-primary">
                                    {currencyFormatter.format(row.valorTotal)}
                                </td>
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
    title: string;
    children: ReactNode;
}

const Card = ({ title, children }: CardProps) => (
    <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="border-b border-secondary px-4 py-4">
            <h3 className="text-md font-semibold text-primary">{title}</h3>
        </header>
        {children}
    </section>
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
