import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown, ChevronRight, FilterLines, Rows01, Grid01, XClose } from "@untitledui/icons";
import {
    Dialog as AriaDialog,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import {
    CountBadge,
    FilterDropdown,
    type FilterRow,
} from "@/components/application/filter-bar/filter-dropdown-menu";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { RelatorioPageHeader } from "../components/RelatorioPageHeader";

/* ------------------------------------------------------------------ */
/*  Mock data                                                         */
/* ------------------------------------------------------------------ */

interface Transferencia {
    id: string;
    code: string;
    nomeComprador: string;
    emailComprador: string;
    cpfComprador: string;
    portadorAnteriorNome: string;
    portadorAnteriorEmail: string;
    portadorAnteriorCpf: string;
    portadorAtualNome: string;
    portadorAtualEmail: string;
    portadorAtualCpf: string;
}

const transferencias: Transferencia[] = [
    {
        id: "8131c921-794f-4b3b-9b41-d13ac8587225",
        code: "26BK5XGKXN6JHL",
        nomeComprador: "Ana Lívia Moreira Mendes",
        emailComprador: "mendesanamendes42@gmail.com",
        cpfComprador: "16774105742",
        portadorAnteriorNome: "Ana Lívia Moreira Mendes",
        portadorAnteriorEmail: "mendesanamendes42@gmail.com",
        portadorAnteriorCpf: "16774105742",
        portadorAtualNome: "Beatriz Mendes Carvalho",
        portadorAtualEmail: "bia.mendes@gmail.com",
        portadorAtualCpf: "98745632101",
    },
    {
        id: "8131c921-794f-4b3b-9b41-d13ac8587225",
        code: "2640G5GMOQI58N",
        nomeComprador: "Ana Lívia Moreira Mendes",
        emailComprador: "mendesanamendes42@gmail.com",
        cpfComprador: "16774105742",
        portadorAnteriorNome: "Ana Lívia Moreira Mendes",
        portadorAnteriorEmail: "mendesanamendes42@gmail.com",
        portadorAnteriorCpf: "16774105742",
        portadorAtualNome: "Caio Henrique Souza",
        portadorAtualEmail: "caio.souza@outlook.com",
        portadorAtualCpf: "32198745612",
    },
    {
        id: "8131c921-794f-4b3b-9b41-d13ac8587225",
        code: "26BP6X3IUH6QF1",
        nomeComprador: "Ana Lívia Moreira Mendes",
        emailComprador: "mendesanamendes42@gmail.com",
        cpfComprador: "16774105742",
        portadorAnteriorNome: "Ana Lívia Moreira Mendes",
        portadorAnteriorEmail: "mendesanamendes42@gmail.com",
        portadorAnteriorCpf: "16774105742",
        portadorAtualNome: "Daniel Pereira",
        portadorAtualEmail: "daniel.p@gmail.com",
        portadorAtualCpf: "65432109876",
    },
    {
        id: "8131c921-794f-4b3b-9b41-d13ac8587225",
        code: "267CT81YTKMD6X",
        nomeComprador: "Ana Lívia Moreira Mendes",
        emailComprador: "mendesanamendes42@gmail.com",
        cpfComprador: "16774105742",
        portadorAnteriorNome: "Ana Lívia Moreira Mendes",
        portadorAnteriorEmail: "mendesanamendes42@gmail.com",
        portadorAnteriorCpf: "16774105742",
        portadorAtualNome: "Eduarda Lima",
        portadorAtualEmail: "edu.lima@yahoo.com",
        portadorAtualCpf: "78912345601",
    },
    {
        id: "abcf9197-7acc-4857-8d9a-242cf007deff",
        code: "26DCDHZ1QQACP4",
        nomeComprador: "Vanessa Lemos de Carvalho Santos",
        emailComprador: "vanessalcs@yahoo.com.br",
        cpfComprador: "28909582804",
        portadorAnteriorNome: "Vanessa Lemos de Carvalho Santos",
        portadorAnteriorEmail: "vanessalcs@yahoo.com.br",
        portadorAnteriorCpf: "28909582804",
        portadorAtualNome: "Felipe Cardoso",
        portadorAtualEmail: "felipe.cardoso@gmail.com",
        portadorAtualCpf: "45612378901",
    },
    {
        id: "abcf9197-7acc-4857-8d9a-242cf007deff",
        code: "265Z7GJNM6PEPF",
        nomeComprador: "Vanessa Lemos de Carvalho Santos",
        emailComprador: "vanessalcs@yahoo.com.br",
        cpfComprador: "28909582804",
        portadorAnteriorNome: "Vanessa Lemos de Carvalho Santos",
        portadorAnteriorEmail: "vanessalcs@yahoo.com.br",
        portadorAnteriorCpf: "28909582804",
        portadorAtualNome: "Gabriela Nunes",
        portadorAtualEmail: "gabi.nunes@hotmail.com",
        portadorAtualCpf: "23456789012",
    },
    {
        id: "5fa1d660-c5b7-4839-92ac-ca3a97d7f0b0",
        code: "2693K0XNE0QNR0",
        nomeComprador: "Kamurata Araújo",
        emailComprador: "kamugata@gmail.com",
        cpfComprador: "46333817848",
        portadorAnteriorNome: "Kamurata Araújo",
        portadorAnteriorEmail: "kamugata@gmail.com",
        portadorAnteriorCpf: "46333817848",
        portadorAtualNome: "Henrique Tanaka",
        portadorAtualEmail: "h.tanaka@gmail.com",
        portadorAtualCpf: "11223344556",
    },
    {
        id: "541fbf99-bb19-4396-88b0-3f324d822b3c",
        code: "26A6SZZHCC8ZY2",
        nomeComprador: "Andressa Alves",
        emailComprador: "asa.andressa@gmail.com",
        cpfComprador: "38410929856",
        portadorAnteriorNome: "Andressa Alves",
        portadorAnteriorEmail: "asa.andressa@gmail.com",
        portadorAnteriorCpf: "38410929856",
        portadorAtualNome: "Isabela Ramos",
        portadorAtualEmail: "isabela.ramos@gmail.com",
        portadorAtualCpf: "99887766554",
    },
    {
        id: "e4dc45a2-a14b-4e64-a87b-184ceb5bc4a8",
        code: "2680YQA69RR2VK",
        nomeComprador: "Murilo Manzoni",
        emailComprador: "manzonimurilo@hotmail.com",
        cpfComprador: "46945053865",
        portadorAnteriorNome: "Murilo Manzoni",
        portadorAnteriorEmail: "manzonimurilo@hotmail.com",
        portadorAnteriorCpf: "46945053865",
        portadorAtualNome: "João Pedro Lima",
        portadorAtualEmail: "jp.lima@outlook.com",
        portadorAtualCpf: "55443322110",
    },
    {
        id: "64d572bf-fd42-44d3-936b-2fa4ece137f5",
        code: "266U4R6ZTPQCFT",
        nomeComprador: "Carlos Frederico Marques de Lemos",
        emailComprador: "cf.marques@live.com",
        cpfComprador: "14017922783",
        portadorAnteriorNome: "Carlos Frederico Marques de Lemos",
        portadorAnteriorEmail: "cf.marques@live.com",
        portadorAnteriorCpf: "14017922783",
        portadorAtualNome: "Luana Ferreira",
        portadorAtualEmail: "luana.f@gmail.com",
        portadorAtualCpf: "88776655443",
    },
    {
        id: "64d572bf-fd42-44d3-936b-2fa4ece137f5",
        code: "269YZ6H3KTTD4Q",
        nomeComprador: "Carlos Frederico Marques de Lemos",
        emailComprador: "cf.marques@live.com",
        cpfComprador: "14017922783",
        portadorAnteriorNome: "Carlos Frederico Marques de Lemos",
        portadorAnteriorEmail: "cf.marques@live.com",
        portadorAnteriorCpf: "14017922783",
        portadorAtualNome: "Mariana Costa",
        portadorAtualEmail: "mari.costa@yahoo.com",
        portadorAtualCpf: "33445566778",
    },
    {
        id: "f8a3c4d2-9b1e-4f5a-b6c7-d8e9f0a1b2c3",
        code: "26FXJ3WCKL9PRM",
        nomeComprador: "Ricardo Almeida Junior",
        emailComprador: "ricardo.jr@gmail.com",
        cpfComprador: "52341897612",
        portadorAnteriorNome: "Ricardo Almeida Junior",
        portadorAnteriorEmail: "ricardo.jr@gmail.com",
        portadorAnteriorCpf: "52341897612",
        portadorAtualNome: "Natália Vieira",
        portadorAtualEmail: "natalia.v@outlook.com",
        portadorAtualCpf: "11998877665",
    },
    {
        id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        code: "26GHTM8LXP2WBN",
        nomeComprador: "Patricia Santos Lima",
        emailComprador: "pat.santos@hotmail.com",
        cpfComprador: "78965412309",
        portadorAnteriorNome: "Patricia Santos Lima",
        portadorAnteriorEmail: "pat.santos@hotmail.com",
        portadorAnteriorCpf: "78965412309",
        portadorAtualNome: "Otávio Borges",
        portadorAtualEmail: "otavio.b@gmail.com",
        portadorAtualCpf: "44556677889",
    },
    {
        id: "b3c5d7e9-f1a2-4b3c-9d8e-7f6a5b4c3d2e",
        code: "26HRPK4LXNVCQE",
        nomeComprador: "Felipe Cardoso Macedo",
        emailComprador: "felipecmacedo@gmail.com",
        cpfComprador: "63245718902",
        portadorAnteriorNome: "Felipe Cardoso Macedo",
        portadorAnteriorEmail: "felipecmacedo@gmail.com",
        portadorAnteriorCpf: "63245718902",
        portadorAtualNome: "Paula Henriques",
        portadorAtualEmail: "paula.h@yahoo.com.br",
        portadorAtualCpf: "22334455667",
    },
    {
        id: "c2d4e6f8-a3b5-4c7d-8e9f-0a1b2c3d4e5f",
        code: "26JZKL9MN4PXVT",
        nomeComprador: "Renata Oliveira Costa",
        emailComprador: "renata.oc@gmail.com",
        cpfComprador: "89012345678",
        portadorAnteriorNome: "Renata Oliveira Costa",
        portadorAnteriorEmail: "renata.oc@gmail.com",
        portadorAnteriorCpf: "89012345678",
        portadorAtualNome: "Rafael Mendes",
        portadorAtualEmail: "rafa.mendes@gmail.com",
        portadorAtualCpf: "66778899001",
    },
];

/* ------------------------------------------------------------------ */
/*  Filter config                                                     */
/* ------------------------------------------------------------------ */

type FilterFieldId =
    | "code"
    | "nomeComprador"
    | "emailComprador"
    | "cpfComprador"
    | "portadorAnteriorNome"
    | "portadorAnteriorEmail"
    | "portadorAnteriorCpf"
    | "portadorAtualNome"
    | "portadorAtualEmail"
    | "portadorAtualCpf";

interface FilterFieldDef {
    id: FilterFieldId;
    label: string;
}

const FILTER_FIELDS: FilterFieldDef[] = [
    { id: "code", label: "code" },
    { id: "nomeComprador", label: "Nome Comprador" },
    { id: "emailComprador", label: "Email Comprador" },
    { id: "cpfComprador", label: "CPF Comprador" },
    { id: "portadorAnteriorNome", label: "Portador Anterior Nome" },
    { id: "portadorAnteriorEmail", label: "Portador Anterior Email" },
    { id: "portadorAnteriorCpf", label: "Portador Anterior CPF" },
    { id: "portadorAtualNome", label: "Portador Atual Nome" },
    { id: "portadorAtualEmail", label: "Portador Atual Email" },
    { id: "portadorAtualCpf", label: "Portador Atual CPF" },
];

const OPERATOR_OPTIONS_TEXT = [
    { id: "contains", label: "Contém" },
    { id: "equals", label: "Igual a" },
    { id: "does-not-contain", label: "Não contém" },
    { id: "starts-with", label: "Começa com" },
];

function getFieldValue(t: Transferencia, field: string): string {
    return (t as unknown as Record<string, string>)[field] ?? "";
}

function matchFilterValue(haystack: string, needle: string, operator: string): boolean {
    const h = haystack.toLowerCase();
    const n = needle.toLowerCase();
    switch (operator) {
        case "equals":
            return h === n;
        case "starts-with":
            return h.startsWith(n);
        case "does-not-contain":
            return !h.includes(n);
        case "contains":
        default:
            return h.includes(n);
    }
}

function matchTransferencia(t: Transferencia, rows: FilterRow[]): boolean {
    for (const r of rows) {
        if (!r.field || !r.value) continue;
        const haystack = getFieldValue(t, r.field);
        const negate = r.operator === "does-not-contain";
        const matched = negate
            ? !haystack.toLowerCase().includes(r.value.toLowerCase())
            : matchFilterValue(haystack, r.value, r.operator);
        if (!matched) return false;
    }
    return true;
}

let nextFilterId = 1;
const createEmptyFilter = (): FilterRow => ({
    id: `f${nextFilterId++}`,
    field: "",
    operator: "contains",
    value: "",
});

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

type ViewMode = "table" | "cards";

export function Transferencias() {
    const [filters, setFilters] = useState<FilterRow[]>([]);
    const [appliedCount, setAppliedCount] = useState(0);
    const [view, setView] = useState<ViewMode>("table");

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

    const filteredTransferencias = useMemo(() => {
        const valid = filters.filter((f) => f.field && f.value);
        return transferencias.filter((t) => matchTransferencia(t, valid));
    }, [filters]);

    return (
        <BackstageLayout activeSection="relatorios" activeItem="transferencias">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col gap-6 py-6 pb-10 md:px-6">
                    <RelatorioPageHeader title="Transferências do Evento" />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <FilterDropdown
                            filters={filters}
                            appliedCount={appliedCount}
                            placement="bottom start"
                            onAddFilter={handleAddFilter}
                            onRemoveFilter={handleRemoveFilter}
                            onFilterChange={handleFilterChange}
                            onApply={handleApply}
                            onClearAll={handleClearAll}
                            renderFilterRow={(
                                filter: FilterRow,
                                onChange: (patch: Partial<Omit<FilterRow, "id">>) => void,
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
                                        items={OPERATOR_OPTIONS_TEXT}
                                        selectedKey={filter.operator || null}
                                        onSelectionChange={(key: React.Key | null) =>
                                            onChange({ operator: key ? String(key) : "" })
                                        }
                                    >
                                        {(item: { id: string; label: string }) => (
                                            <Select.Item id={item.id}>
                                                {item.label}
                                            </Select.Item>
                                        )}
                                    </Select>
                                    <Input
                                        className="min-w-0 flex-1"
                                        size="sm"
                                        aria-label="Valor"
                                        placeholder="Digite um valor"
                                        value={filter.value}
                                        onChange={(value: string) => onChange({ value })}
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
                                    {appliedCount > 0 && <CountBadge count={appliedCount} />}
                                </span>
                            </Button>
                        </FilterDropdown>

                        <ButtonGroup
                            size="sm"
                            selectedKeys={[view]}
                            onSelectionChange={(keys: Set<React.Key> | "all") => {
                                if (keys === "all") return;
                                const next = [...keys][0] as ViewMode | undefined;
                                if (next) setView(next);
                            }}
                        >
                            <ButtonGroupItem id="table" iconLeading={Rows01} aria-label="Visualização em tabela" />
                            <ButtonGroupItem id="cards" iconLeading={Grid01} aria-label="Visualização em cards" />
                        </ButtonGroup>
                    </div>

                    {view === "table" ? (
                        <TransferenciasTable rows={filteredTransferencias} />
                    ) : (
                        <TransferenciasCards rows={filteredTransferencias} />
                    )}
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Transferências table                                              */
/* ------------------------------------------------------------------ */

const COLUMNS: Array<{ key: keyof Transferencia; label: string }> = [
    { key: "id", label: "ID" },
    { key: "code", label: "Código" },
    { key: "nomeComprador", label: "Nome do Comprador" },
    { key: "emailComprador", label: "Email do Comprador" },
    { key: "cpfComprador", label: "CPF do Comprador" },
    { key: "portadorAnteriorNome", label: "Nome do Portador Anterior" },
    { key: "portadorAnteriorEmail", label: "Email do Portador Anterior" },
    { key: "portadorAnteriorCpf", label: "CPF do Portador Anterior" },
    { key: "portadorAtualNome", label: "Nome do Portador Atual" },
    { key: "portadorAtualEmail", label: "Email do Portador Atual" },
    { key: "portadorAtualCpf", label: "CPF do Portador Atual" },
];

const TransferenciasTable = ({ rows }: { rows: Transferencia[] }) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const visibleRows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, safePage, pageSize]);

    return (
        <Card title="Relatório de transferência AWA">
            <div className="overflow-x-auto overflow-y-clip">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-secondary">
                        <tr className="border-b border-secondary bg-secondary text-left">
                            {COLUMNS.map((col) => (
                                <th
                                    key={col.key}
                                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-tertiary"
                                >
                                    <SortableHeader label={col.label} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={COLUMNS.length}
                                    className="px-4 py-12 text-center text-sm text-tertiary"
                                >
                                    Nenhuma transferência corresponde aos filtros aplicados.
                                </td>
                            </tr>
                        )}
                        {visibleRows.map((row, i) => (
                            <tr
                                key={`${row.id}-${row.code}`}
                                className={cx(
                                    "transition duration-100 ease-linear hover:bg-primary_hover",
                                    i !== visibleRows.length - 1 && "border-b border-secondary",
                                )}
                            >
                                {COLUMNS.map((col) => (
                                    <td
                                        key={col.key}
                                        className={cx(
                                            "whitespace-nowrap px-4 py-4 text-sm text-tertiary",
                                            col.key === "id" && "font-mono text-xs text-secondary",
                                            (col.key === "emailComprador" ||
                                                col.key === "portadorAnteriorEmail" ||
                                                col.key === "portadorAtualEmail") &&
                                                "text-brand-secondary",
                                        )}
                                    >
                                        {row[col.key]}
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
/*  Transferências cards (portador flow)                              */
/* ------------------------------------------------------------------ */

const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatCpf = (cpf: string): string => {
    const digits = cpf.replace(/\D/g, "").padStart(11, "0").slice(0, 11);
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const TransferenciasCards = ({ rows }: { rows: Transferencia[] }) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [selected, setSelected] = useState<Transferencia | null>(null);

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const visibleRows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, safePage, pageSize]);

    return (
        <>
            <Card title="Relatório de transferência AWA">
                {visibleRows.length === 0 ? (
                    <div className="px-4 py-12 text-center text-sm text-tertiary">
                        Nenhuma transferência corresponde aos filtros aplicados.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                        {visibleRows.map((row) => (
                            <TransferenciaCard
                                key={`${row.id}-${row.code}`}
                                row={row}
                                onClick={() => setSelected(row)}
                            />
                        ))}
                    </div>
                )}
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

            <TransferenciaDetailsSlideOut
                isOpen={selected !== null}
                row={selected}
                onClose={() => setSelected(null)}
            />
        </>
    );
};

const TransferenciaCard = ({
    row,
    onClick,
}: {
    row: Transferencia;
    onClick: () => void;
}) => (
    <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center gap-3 rounded-xl bg-primary p-4 text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-primary_hover"
    >
        <Avatar size="md" initials={getInitials(row.portadorAtualNome)} />
        <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-primary">
                {row.portadorAtualNome}
            </span>
            <span className="truncate font-mono text-xs text-tertiary">{row.code}</span>
        </div>
        <ChevronRight
            aria-hidden="true"
            className="size-5 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear group-hover:translate-x-0.5"
        />
    </button>
);

/* ------------------------------------------------------------------ */
/*  Transferência details slideout                                    */
/* ------------------------------------------------------------------ */

const TransferenciaDetailsSlideOut = ({
    isOpen,
    row,
    onClose,
}: {
    isOpen: boolean;
    row: Transferencia | null;
    onClose: () => void;
}) => (
    <AriaModalOverlay
        isOpen={isOpen}
        onOpenChange={(open) => {
            if (!open) onClose();
        }}
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
                    "h-full w-full max-w-[480px] bg-primary shadow-xl outline-hidden",
                    isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                    isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                )
            }
        >
            <AriaDialog className="flex h-full flex-col outline-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-secondary px-6 py-5">
                    <h2 className="text-lg font-semibold text-primary">
                        Detalhes da transferência
                    </h2>
                    <ButtonUtility
                        size="sm"
                        color="tertiary"
                        icon={XClose}
                        tooltip="Fechar"
                        onClick={onClose}
                    />
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto">
                    {row && (
                        <>
                            <div className="flex flex-col gap-1 px-6 pt-6 pb-5">
                                <span className="text-xs font-medium text-tertiary uppercase tracking-wide">
                                    Código do ingresso
                                </span>
                                <span className="font-mono text-md font-medium text-primary">
                                    {row.code}
                                </span>
                            </div>

                            <div className="mx-6 border-t border-secondary" />

                            <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                                <h3 className="text-md font-semibold text-primary">
                                    Fluxo de portador
                                </h3>
                                <HolderBlock
                                    label="Portador anterior"
                                    name={row.portadorAnteriorNome}
                                    email={row.portadorAnteriorEmail}
                                    cpf={row.portadorAnteriorCpf}
                                />
                                <div className="flex items-center gap-2 pl-1.5 text-tertiary">
                                    <ArrowRight
                                        aria-hidden="true"
                                        className="size-4 rotate-90 text-fg-quaternary"
                                    />
                                    <span className="text-xs">transferido para</span>
                                </div>
                                <HolderBlock
                                    label="Portador atual"
                                    name={row.portadorAtualNome}
                                    email={row.portadorAtualEmail}
                                    cpf={row.portadorAtualCpf}
                                    emphasis
                                />
                            </div>

                            <div className="mx-6 border-t border-secondary" />

                            <div className="flex flex-col gap-3 px-6 pt-5 pb-6">
                                <h3 className="text-md font-semibold text-primary">
                                    Comprador original
                                </h3>
                                <dl className="flex flex-col gap-2.5">
                                    <DetailRow label="Nome" value={row.nomeComprador} />
                                    <DetailRow label="E-mail" value={row.emailComprador} isEmail />
                                    <DetailRow label="CPF" value={formatCpf(row.cpfComprador)} />
                                </dl>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-secondary px-6 py-4">
                    <Button size="sm" color="secondary" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
            </AriaDialog>
        </AriaModal>
    </AriaModalOverlay>
);

const HolderBlock = ({
    label,
    name,
    email,
    cpf,
    emphasis = false,
}: {
    label: string;
    name: string;
    email: string;
    cpf: string;
    emphasis?: boolean;
}) => (
    <div
        className={cx(
            "flex items-start gap-3 rounded-lg bg-secondary p-3 ring-1 ring-border-secondary",
            emphasis && "ring-2 ring-brand",
        )}
    >
        <Avatar size="md" initials={getInitials(name)} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-xs font-medium text-tertiary uppercase tracking-wide">
                {label}
            </span>
            <span
                className={cx(
                    "truncate text-sm text-primary",
                    emphasis ? "font-semibold" : "font-medium",
                )}
            >
                {name}
            </span>
            <span className="truncate text-xs text-brand-secondary">{email}</span>
            <span className="text-xs text-tertiary tabular-nums">{formatCpf(cpf)}</span>
        </div>
    </div>
);

const DetailRow = ({
    label,
    value,
    isEmail = false,
}: {
    label: string;
    value: string;
    isEmail?: boolean;
}) => (
    <div className="flex flex-col gap-0.5">
        <dt className="text-xs text-tertiary">{label}</dt>
        <dd
            className={cx(
                "text-sm break-words",
                isEmail ? "text-brand-secondary" : "text-secondary",
            )}
        >
            {value}
        </dd>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Shared primitives (consistency with VendasPorGrupo/Transacoes)    */
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
}

const SortableHeader = ({ label }: SortableHeaderProps) => (
    <span className="inline-flex items-center">{label}</span>
);
