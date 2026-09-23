import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, SearchLg, Users01 } from "@untitledui/icons";
import { toast } from "sonner";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ExportMenu, RelatorioPageHeader } from "../components/RelatorioPageHeader";
import { RelatorioFiltersProvider, inDateRange, useRelatorioFilters } from "../components/relatorio-filters";
import { SortableHeader } from "../components/SortableHeader";
import { useSortableTable } from "../utils/useSortableTable";
import { EVENT, numberFormatter } from "../data/event";
import { LISTA_DE_ESPERA, type InteressadoListaEspera } from "../data/lista-de-espera";

const HIDE_TREND_AND_MENU = "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";
const PER_PAGE = 20;

const dataHoraFormatter = new Intl.DateTimeFormat(EVENT.locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: EVENT.timeZone,
});

const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/* ------------------------------------------------------------------ */
/*  Download (.CSV gerado no browser; Excel mockado como nos demais)   */
/* ------------------------------------------------------------------ */

const baixarCsv = (rows: InteressadoListaEspera[]) => {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const linhas = [
        ["Nome", "E-mail", "Telefone", "Data de interesse"].map(escape).join(";"),
        ...rows.map((r) => [r.nome, r.email, r.telefone, dataHoraFormatter.format(r.dataInteresse)].map(escape).join(";")),
    ];
    // BOM para o Excel abrir acentos corretamente.
    const blob = new Blob(["﻿" + linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lista-de-espera.csv";
    a.click();
    URL.revokeObjectURL(url);
};

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function ListaDeEspera() {
    return (
        <BackstageLayout activeSection="relatorios" activeItem="lista-de-espera">
            <RelatorioFiltersProvider>
                <div className="flex min-w-0 flex-1 flex-col">
                    <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                        <ListaDeEsperaBody />
                    </main>
                </div>
            </RelatorioFiltersProvider>
        </BackstageLayout>
    );
}

const ListaDeEsperaBody = () => {
    const { dateRange } = useRelatorioFilters();
    const [search, setSearch] = useState("");

    const noPeriodo = useMemo(() => LISTA_DE_ESPERA.filter((r) => inDateRange(r.dataInteresse, dateRange)), [dateRange]);

    const rows = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return noPeriodo;
        const digits = search.replace(/\D/g, "");
        return noPeriodo.filter(
            (r) => `${r.nome} ${r.email}`.toLowerCase().includes(term) || (digits.length > 0 && r.telefone.replace(/\D/g, "").includes(digits)),
        );
    }, [noPeriodo, search]);

    const onExport = (format: "excel" | "csv" | "pdf") => {
        if (format === "csv") {
            baixarCsv(rows);
            toast.success("Lista de espera baixada", { description: `${numberFormatter.format(rows.length)} pessoas no arquivo .CSV.` });
            return;
        }
        toast.success(`Exportando ${format.toUpperCase()}`, { description: "A lista de espera será exportada." });
    };

    return (
        <>
            <RelatorioPageHeader
                title="Lista de espera"
                filter="period"
                splitControls
                actions={<ExportMenu formats={["excel", "csv"]} onExport={onExport} />}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <MetricsIcon03
                    icon={Users01}
                    subtitle="Pessoas na lista de espera"
                    title={numberFormatter.format(noPeriodo.length)}
                    change={null}
                    changeTrend="positive"
                    actions={false}
                    className={HIDE_TREND_AND_MENU}
                />
            </div>

            <ListaCard rows={rows} search={search} onSearch={setSearch} />
        </>
    );
};

/* ------------------------------------------------------------------ */
/*  Tabela                                                            */
/* ------------------------------------------------------------------ */

const SORT_ACCESSORS: Partial<Record<string, (r: InteressadoListaEspera) => string | number>> = {
    nome: (r) => r.nome,
    email: (r) => r.email,
    telefone: (r) => r.telefone,
    dataInteresse: (r) => r.dataInteresse.getTime(),
};

const ListaCard = ({ rows, search, onSearch }: { rows: InteressadoListaEspera[]; search: string; onSearch: (v: string) => void }) => {
    const [page, setPage] = useState(1);

    const { sorted, sortKey, sortDir, toggleSort } = useSortableTable(
        rows as unknown as Record<string, unknown>[],
        SORT_ACCESSORS as Partial<Record<string, (r: Record<string, unknown>) => string | number>>,
        { key: "dataInteresse", dir: "desc" },
    );
    const sortedRows = sorted as unknown as InteressadoListaEspera[];

    const totalPages = Math.max(1, Math.ceil(sortedRows.length / PER_PAGE));
    const pagina = Math.min(page, totalPages);
    const pageRows = sortedRows.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE);

    return (
        <section className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
            <header className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-4">
                <h3 className="flex items-center gap-2 text-md font-semibold text-primary">
                    Pessoas interessadas
                    <Badge size="sm" color="gray" type="pill-color">
                        {numberFormatter.format(sortedRows.length)}
                    </Badge>
                </h3>
            </header>

            <div className="flex flex-col gap-3 border-b border-secondary px-4 py-3">
                <Input
                    size="sm"
                    icon={SearchLg}
                    aria-label="Buscar na lista de espera"
                    placeholder="Buscar por nome, e-mail ou telefone"
                    value={search}
                    onChange={(v) => {
                        onSearch(v);
                        setPage(1);
                    }}
                    className="w-full max-w-[420px]"
                />
            </div>

            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="bg-secondary">
                        <tr className="border-b border-secondary text-left">
                            <th className="px-4 py-3 text-sm font-semibold text-tertiary">
                                <SortableHeader label="Nome" sortKey="nome" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                            </th>
                            <th className="hidden px-4 py-3 text-sm font-semibold text-tertiary md:table-cell">
                                <SortableHeader label="E-mail" sortKey="email" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                            </th>
                            <th className="px-4 py-3 text-sm font-semibold text-tertiary">
                                <SortableHeader label="Telefone" sortKey="telefone" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                            </th>
                            <th className="px-4 py-3 text-sm font-semibold text-tertiary">
                                <SortableHeader label="Data de interesse" sortKey="dataInteresse" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-sm text-tertiary">
                                    Ninguém na lista de espera corresponde à busca.
                                </td>
                            </tr>
                        )}
                        {pageRows.map((r, i) => (
                            <tr key={r.id} className={cx(i < pageRows.length - 1 && "border-b border-secondary")}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar size="sm" initials={getInitials(r.nome)} />
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate text-sm font-medium text-primary">{r.nome}</span>
                                            <span className="truncate text-sm text-tertiary md:hidden">{r.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden px-4 py-3 text-sm text-tertiary md:table-cell">{r.email}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-tertiary tabular-nums">{r.telefone}</td>
                                <td className="px-4 py-3 text-sm text-secondary tabular-nums">{dataHoraFormatter.format(r.dataInteresse)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-secondary px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-tertiary tabular-nums">
                    {sortedRows.length === 0
                        ? "0 registros"
                        : `${(pagina - 1) * PER_PAGE + 1}–${Math.min(pagina * PER_PAGE, sortedRows.length)} de ${numberFormatter.format(sortedRows.length)}`}
                </span>
                <div className="flex items-center gap-3 text-sm text-tertiary">
                    <span className="tabular-nums">Página {pagina} de {totalPages}</span>
                    <div className="flex gap-1">
                        <ButtonUtility size="sm" color="secondary" icon={ChevronLeft} tooltip="Anterior" isDisabled={pagina <= 1} onClick={() => setPage(pagina - 1)} />
                        <ButtonUtility size="sm" color="secondary" icon={ChevronRight} tooltip="Próxima" isDisabled={pagina >= totalPages} onClick={() => setPage(pagina + 1)} />
                    </div>
                </div>
            </div>
        </section>
    );
};
