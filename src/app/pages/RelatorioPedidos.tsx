import { useCallback, useMemo, useState, type Key } from "react";
import { useNavigate } from "react-router";
import {
    DownloadCloud01,
    Eye,
    HelpCircle,
    RefreshCcw01,
    SearchLg,
    SlashCircle01,
} from "@untitledui/icons";
import type { Selection } from "react-aria-components";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { MultiSelect } from "@/components/base/select/multi-select";
import { Tabs } from "@/components/application/tabs/tabs";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../components/Backstage";

/* ------------------------------------------------------------------ */
/*  Shared mock helpers                                               */
/* ------------------------------------------------------------------ */

const MOCK_EMISSORES = [
    "Maria Silva",
    "João Souza",
    "Ana Costa",
    "Pedro Lima",
    "Camila Almeida",
];

const MOCK_NOMES = [
    "Cortesias de imprensa — Sessão noite",
    "Convidados VIP camarote duplo",
    "Equipe de produção — turno 1",
    "Patrocinadores ouro",
    "Influenciadores parceiros 2026",
    "Convidados do palco",
    "Cortesias para retransmissão",
    "Equipe de segurança",
    "Imprensa local — abertura",
    "Convidados especiais do festival",
];

const MOCK_ITENS = [
    { nome: "Pista — Inteira", sub: "Festival Multidate · 21/05" },
    { nome: "Camarote — Meia", sub: "Festival Multidate · 21/05" },
    { nome: "VIP — Cortesia", sub: "Festival Multidate · 22/05" },
    { nome: "Pista Premium — Inteira", sub: "Festival Multidate · 22/05" },
    { nome: "Backstage — Cortesia", sub: "Festival Multidate · 23/05" },
    { nome: "Camarote Open Bar — Inteira", sub: "Festival Multidate · 23/05" },
];

const MOCK_DESTINATARIOS = [
    "olivia.rhye@untitledui.com",
    "phoenix.baker@untitledui.com",
    "lana.steiner@untitledui.com",
    "demi.wilkinson@untitledui.com",
    "candice.wu@untitledui.com",
    "natali.craig@untitledui.com",
    "drew.cano@untitledui.com",
    "orlando.diggs@untitledui.com",
    "andi.lane@untitledui.com",
    "kate.morrison@untitledui.com",
];

function pad(n: number, length: number) {
    return n.toString().padStart(length, "0");
}

function makeMockUuid(seed: number): string {
    const a = pad((seed * 16807) % 0xffffffff, 8);
    const b = pad((seed * 48271) % 0xffff, 4);
    const c = pad((seed * 17389) % 0xffff, 4);
    return `${a.slice(0, 8)}-${b}-${c.slice(0, 4)}-${pad(seed % 0xffff, 4)}-${pad(
        (seed * 7919) % 0xffffffffff,
        12,
    ).slice(0, 12)}`;
}

function formatDate(base: Date, offsetDays: number, offsetHours: number) {
    const d = new Date(base);
    d.setDate(d.getDate() - offsetDays);
    d.setHours(d.getHours() - offsetHours);
    return `${pad(d.getDate(), 2)}/${pad(d.getMonth() + 1, 2)}/${d.getFullYear()} ${pad(
        d.getHours(),
        2,
    )}:${pad(d.getMinutes(), 2)}`;
}

function makeMockDoc(seed: number) {
    const raw = pad(((seed * 13) % 1_000_000_000) + 100_000_000, 11);
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`;
}

/* ------------------------------------------------------------------ */
/*  Pedidos                                                           */
/* ------------------------------------------------------------------ */

type PedidoStatus = "emitido" | "cancelado";

interface Pedido {
    id: string;
    nome: string;
    emissor: string;
    status: PedidoStatus;
    dataEnvio: string;
}

function buildMockPedidos(): Pedido[] {
    const base = new Date("2026-05-21T18:30:00");
    return Array.from({ length: 100 }, (_, i) => ({
        id: makeMockUuid(i + 1),
        nome: MOCK_NOMES[i % MOCK_NOMES.length],
        emissor: MOCK_EMISSORES[i % MOCK_EMISSORES.length],
        status: i % 9 === 0 ? "cancelado" : "emitido",
        dataEnvio: formatDate(base, i, i * 2),
    }));
}

const PEDIDO_STATUS_OPTIONS = [
    { id: "emitido", label: "Emitido" },
    { id: "cancelado", label: "Cancelado" },
];

const PEDIDO_STATUS_META: Record<
    PedidoStatus,
    { label: string; color: "success" | "error" }
> = {
    emitido: { label: "Emitido", color: "success" },
    cancelado: { label: "Cancelado", color: "error" },
};

/* ------------------------------------------------------------------ */
/*  Itens                                                             */
/* ------------------------------------------------------------------ */

type ItemStatus = "aceito" | "cancelado" | "pendente" | "processando" | "erro";

interface CortesiaItem {
    id: string;
    nome: string;
    subtitulo: string;
    status: ItemStatus;
    emissor: string;
    email: string;
    documento: string;
    transferido: boolean;
}

const ITEM_STATUS_META: Record<
    ItemStatus,
    {
        label: string;
        color: "success" | "error" | "warning" | "blue" | "gray" | "brand";
    }
> = {
    aceito: { label: "Aceito", color: "success" },
    cancelado: { label: "Cancelado", color: "error" },
    pendente: { label: "Pendente de cadastro", color: "warning" },
    processando: { label: "Processando", color: "blue" },
    erro: { label: "Erro", color: "error" },
};

const ITEM_STATUS_ORDER: ItemStatus[] = [
    "aceito",
    "cancelado",
    "pendente",
    "processando",
    "erro",
];

const ITEM_STATUS_OPTIONS = ITEM_STATUS_ORDER.map((id) => ({
    id,
    label: ITEM_STATUS_META[id].label,
}));

function pickItemStatus(seed: number): ItemStatus {
    const m = seed % 11;
    if (m === 0 || m === 3) return "aceito";
    if (m === 1) return "cancelado";
    if (m === 5) return "pendente";
    if (m === 7) return "processando";
    if (m === 9) return "erro";
    return "aceito";
}

function buildMockItens(): CortesiaItem[] {
    return Array.from({ length: 100 }, (_, i) => {
        const item = MOCK_ITENS[i % MOCK_ITENS.length];
        return {
            id: makeMockUuid(i + 1),
            nome: item.nome,
            subtitulo: item.sub,
            status: pickItemStatus(i + 1),
            emissor: MOCK_EMISSORES[i % MOCK_EMISSORES.length],
            email: MOCK_DESTINATARIOS[i % MOCK_DESTINATARIOS.length],
            documento: makeMockDoc(i + 1),
            transferido: i % 6 === 0,
        };
    });
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const DEFAULT_PAGE_SIZE = 100;

const EMISSOR_OPTIONS = MOCK_EMISSORES.map((name) => ({ id: name, label: name }));

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function RelatorioPedidos() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"pedidos" | "itens">("pedidos");

    const handleEmitir = useCallback(() => navigate("/backstage"), [navigate]);
    const handleExport = useCallback(() => console.log("Exportar relatório"), []);

    return (
        <BackstageLayout activeSection="cortesias" activeItem="emissao-cortesias">
            <div className="flex min-w-0 flex-1 flex-col">
                <PageHeader onEmitir={handleEmitir} />
                <main className="flex flex-1 flex-col gap-6 px-6 py-6">
                    <Tabs
                        selectedKey={activeTab}
                        onSelectionChange={(key: Key) => setActiveTab(key as "pedidos" | "itens")}
                    >
                        <Tabs.List type="underline" size="sm">
                            <Tabs.Item id="pedidos">Pedidos</Tabs.Item>
                            <Tabs.Item id="itens">Itens</Tabs.Item>
                        </Tabs.List>
                    </Tabs>

                    {activeTab === "pedidos" ? (
                        <PedidosTabView onExport={handleExport} />
                    ) : (
                        <ItensTabView onExport={handleExport} />
                    )}
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Page header                                                       */
/* ------------------------------------------------------------------ */

interface PageHeaderProps {
    onEmitir: () => void;
}

const PageHeader = ({ onEmitir }: PageHeaderProps) => (
    <header className="flex items-center justify-between gap-3 px-6 py-6">
        <h1 className="text-display-xs font-bold text-primary">Cortesias</h1>
        <Button size="md" color="primary" onClick={onEmitir}>
            Emitir cortesia
        </Button>
    </header>
);

/* ------------------------------------------------------------------ */
/*  Metrics row                                                       */
/* ------------------------------------------------------------------ */

interface Metric {
    label: string;
    value: number;
}

const numberFormatter = new Intl.NumberFormat("pt-BR");

const MetricsRow = ({ metrics }: { metrics: Metric[] }) => (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
            <div
                key={m.label}
                className="flex flex-col gap-1 rounded-xl bg-primary p-4 ring-1 ring-border-secondary"
            >
                <p className="text-sm text-tertiary">{m.label}</p>
                <p className="text-display-sm font-semibold text-primary">
                    {numberFormatter.format(m.value)}
                </p>
            </div>
        ))}
    </div>
);

/* ------------------------------------------------------------------ */
/*  Filters bar                                                       */
/* ------------------------------------------------------------------ */

interface FiltersBarProps {
    search: string;
    searchPlaceholder: string;
    onSearchChange: (v: string) => void;
    statusKeys: Set<string>;
    onStatusKeysChange: (keys: Set<string>) => void;
    statusOptions: { id: string; label: string }[];
    emissorKeys: Set<string>;
    onEmissorKeysChange: (keys: Set<string>) => void;
}

const FiltersBar = ({
    search,
    searchPlaceholder,
    onSearchChange,
    statusKeys,
    onStatusKeysChange,
    statusOptions,
    emissorKeys,
    onEmissorKeysChange,
}: FiltersBarProps) => {
    const handleStatusSelection = (selection: Selection) => {
        if (selection === "all") {
            onStatusKeysChange(new Set(statusOptions.map((o) => o.id)));
        } else {
            onStatusKeysChange(new Set(Array.from(selection).map(String)));
        }
    };

    const handleEmissorSelection = (selection: Selection) => {
        if (selection === "all") {
            onEmissorKeysChange(new Set(EMISSOR_OPTIONS.map((o) => o.id)));
        } else {
            onEmissorKeysChange(new Set(Array.from(selection).map(String)));
        }
    };

    return (
        <div className="grid grid-cols-1 gap-3 border-b border-secondary px-4 py-4 md:grid-cols-[1fr_220px_240px] md:px-6">
            <Input
                label="Busca"
                size="sm"
                icon={SearchLg}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(v: string) => onSearchChange(v)}
            />
            <MultiSelect
                label="Status"
                size="sm"
                aria-label="Status"
                placeholder="Todos"
                items={statusOptions}
                selectedKeys={statusKeys}
                onSelectionChange={handleStatusSelection}
                onReset={() => onStatusKeysChange(new Set())}
                onSelectAll={() =>
                    onStatusKeysChange(new Set(statusOptions.map((o) => o.id)))
                }
                showSearch={false}
                selectedCountFormatter={(count) =>
                    count === statusOptions.length
                        ? "Todos"
                        : `${count} ${count === 1 ? "selecionado" : "selecionados"}`
                }
            >
                {(item) => (
                    <MultiSelect.Item
                        id={item.id}
                        selectionIndicator="checkbox"
                        selectionIndicatorAlign="left"
                    >
                        {item.label}
                    </MultiSelect.Item>
                )}
            </MultiSelect>
            <MultiSelect
                label="Emissor responsável"
                size="sm"
                aria-label="Emissor responsável"
                placeholder="Todos"
                items={EMISSOR_OPTIONS}
                selectedKeys={emissorKeys}
                onSelectionChange={handleEmissorSelection}
                onReset={() => onEmissorKeysChange(new Set())}
                onSelectAll={() =>
                    onEmissorKeysChange(new Set(EMISSOR_OPTIONS.map((o) => o.id)))
                }
                selectedCountFormatter={(count) =>
                    count === EMISSOR_OPTIONS.length
                        ? "Todos"
                        : `${count} ${count === 1 ? "selecionado" : "selecionados"}`
                }
            >
                {(item) => (
                    <MultiSelect.Item
                        id={item.id}
                        selectionIndicator="checkbox"
                        selectionIndicatorAlign="left"
                    >
                        {item.label}
                    </MultiSelect.Item>
                )}
            </MultiSelect>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Selection bar (sticky)                                            */
/* ------------------------------------------------------------------ */

interface SelectionBarProps {
    selectedCount: number;
    emptyLabel: string;
    singular: string;
    plural: string;
    cancelLabel: string;
    onClear: () => void;
    onCancel: () => void;
}

const SelectionBar = ({
    selectedCount,
    emptyLabel,
    singular,
    plural,
    cancelLabel,
    onClear,
    onCancel,
}: SelectionBarProps) => (
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-secondary bg-secondary px-4 py-3 md:px-6">
        <p className="text-sm text-tertiary">
            {selectedCount === 0
                ? emptyLabel
                : `${selectedCount} ${selectedCount === 1 ? singular : plural}`}
        </p>
        <div className="flex items-center gap-2">
            <Button
                size="sm"
                color="secondary"
                isDisabled={selectedCount === 0}
                onClick={onClear}
            >
                Limpar seleção
            </Button>
            <Button
                size="sm"
                color="primary-destructive"
                isDisabled={selectedCount === 0}
                onClick={onCancel}
            >
                {cancelLabel}
            </Button>
        </div>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Pedidos tab                                                       */
/* ------------------------------------------------------------------ */

interface PedidosTabViewProps {
    onExport: () => void;
}

const PedidosTabView = ({ onExport }: PedidosTabViewProps) => {
    const [pedidos, setPedidos] = useState<Pedido[]>(() => buildMockPedidos());
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [statusKeys, setStatusKeys] = useState<Set<string>>(new Set());
    const [emissorKeys, setEmissorKeys] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return pedidos.filter((p) => {
            if (statusKeys.size > 0 && !statusKeys.has(p.status)) return false;
            if (emissorKeys.size > 0 && !emissorKeys.has(p.emissor)) return false;
            if (q) {
                const matches =
                    p.id.toLowerCase().includes(q) || p.nome.toLowerCase().includes(q);
                if (!matches) return false;
            }
            return true;
        });
    }, [pedidos, search, statusKeys, emissorKeys]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const visibleRows = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

    const toggleSelect = useCallback((id: string, isSelected: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (isSelected) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const toggleAllOnPage = useCallback(
        (isSelected: boolean) => {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                for (const row of visibleRows) {
                    if (isSelected) next.add(row.id);
                    else next.delete(row.id);
                }
                return next;
            });
        },
        [visibleRows],
    );

    const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

    const cancelPedido = useCallback((id: string) => {
        setPedidos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "cancelado" as const } : p)),
        );
    }, []);

    const cancelSelected = useCallback(() => {
        if (selectedIds.size === 0) return;
        setPedidos((prev) =>
            prev.map((p) =>
                selectedIds.has(p.id) ? { ...p, status: "cancelado" as const } : p,
            ),
        );
        setSelectedIds(new Set());
    }, [selectedIds]);

    const handleDetails = useCallback((id: string) => {
        console.log("Detalhes do pedido", id);
    }, []);

    const metrics = useMemo<Metric[]>(
        () => [
            { label: "Itens emitidos", value: 12_444 },
            { label: "Itens pendentes de cadastro", value: 96 },
            { label: "Itens cancelados", value: 96 },
            { label: "Itens validados", value: 96 },
        ],
        [],
    );

    const pageSelectedCount = visibleRows.reduce(
        (acc, r) => acc + (selectedIds.has(r.id) ? 1 : 0),
        0,
    );
    const allOnPageSelected =
        visibleRows.length > 0 && pageSelectedCount === visibleRows.length;
    const someOnPageSelected = pageSelectedCount > 0 && !allOnPageSelected;

    return (
        <>
            <MetricsRow metrics={metrics} />

            <div className="flex justify-end">
                <Button
                    size="sm"
                    color="secondary"
                    iconLeading={DownloadCloud01}
                    onClick={onExport}
                >
                    Exportar em CSV
                </Button>
            </div>

            <div className="rounded-xl bg-primary ring-1 ring-border-secondary">
                <FiltersBar
                    search={search}
                    searchPlaceholder="Buscar por id ou nome do pedido"
                    onSearchChange={(v) => {
                        setSearch(v);
                        setPage(0);
                    }}
                    statusKeys={statusKeys}
                    onStatusKeysChange={(keys) => {
                        setStatusKeys(keys);
                        setPage(0);
                    }}
                    statusOptions={PEDIDO_STATUS_OPTIONS}
                    emissorKeys={emissorKeys}
                    onEmissorKeysChange={(keys) => {
                        setEmissorKeys(keys);
                        setPage(0);
                    }}
                />

                <SelectionBar
                    selectedCount={selectedIds.size}
                    emptyLabel="Nenhum pedido selecionado"
                    singular="pedido selecionado"
                    plural="pedidos selecionados"
                    cancelLabel="Cancelar pedidos selecionados"
                    onClear={clearSelection}
                    onCancel={cancelSelected}
                />

                <PedidosTable
                    rows={visibleRows}
                    selectedIds={selectedIds}
                    allOnPageSelected={allOnPageSelected}
                    someOnPageSelected={someOnPageSelected}
                    onToggleSelect={toggleSelect}
                    onToggleAllOnPage={toggleAllOnPage}
                    onCancel={cancelPedido}
                    onDetails={handleDetails}
                />

                <PaginationCardAdvanced
                    page={safePage + 1}
                    total={totalPages}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p - 1)}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(0);
                    }}
                />
            </div>
        </>
    );
};

/* ------------------------------------------------------------------ */
/*  Pedidos table                                                     */
/* ------------------------------------------------------------------ */

interface PedidosTableProps {
    rows: Pedido[];
    selectedIds: Set<string>;
    allOnPageSelected: boolean;
    someOnPageSelected: boolean;
    onToggleSelect: (id: string, selected: boolean) => void;
    onToggleAllOnPage: (selected: boolean) => void;
    onCancel: (id: string) => void;
    onDetails: (id: string) => void;
}

const PedidosTable = ({
    rows,
    selectedIds,
    allOnPageSelected,
    someOnPageSelected,
    onToggleSelect,
    onToggleAllOnPage,
    onCancel,
    onDetails,
}: PedidosTableProps) => {
    if (rows.length === 0) {
        return (
            <div className="px-6 py-16 text-center text-sm text-tertiary">
                Nenhum pedido encontrado.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-secondary bg-secondary_subtle text-left">
                        <th className="w-10 px-4 py-3 md:px-6">
                            <Checkbox
                                aria-label="Selecionar todos da página"
                                isSelected={allOnPageSelected}
                                isIndeterminate={someOnPageSelected}
                                onChange={(s) => onToggleAllOnPage(s)}
                            />
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">id</th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">Nome</th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            Emissor responsável
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            Data de envio
                        </th>
                        <th className="w-24 px-4 py-3" aria-label="Ações" />
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => {
                        const isSelected = selectedIds.has(row.id);
                        const isCancelled = row.status === "cancelado";
                        const meta = PEDIDO_STATUS_META[row.status];
                        return (
                            <tr
                                key={row.id}
                                className={cx(
                                    "transition duration-100 ease-linear hover:bg-primary_hover",
                                    i !== rows.length - 1 && "border-b border-secondary",
                                )}
                            >
                                <td className="px-4 py-3 md:px-6">
                                    <Checkbox
                                        aria-label={`Selecionar pedido ${row.id}`}
                                        isSelected={isSelected}
                                        onChange={(s) => onToggleSelect(row.id, s)}
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm text-tertiary">
                                    <span className="block max-w-[160px] truncate" title={row.id}>
                                        {row.id}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-primary">
                                    <span className="block max-w-[260px] truncate" title={row.nome}>
                                        {row.nome}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-secondary">{row.emissor}</td>
                                <td className="px-4 py-3">
                                    <BadgeWithDot size="sm" type="pill-color" color={meta.color}>
                                        {meta.label}
                                    </BadgeWithDot>
                                </td>
                                <td className="px-4 py-3 text-sm whitespace-nowrap text-tertiary">
                                    {row.dataEnvio}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-1">
                                        <ButtonUtility
                                            size="xs"
                                            color="tertiary"
                                            icon={SlashCircle01}
                                            tooltip="Cancelar"
                                            isDisabled={isCancelled}
                                            onClick={() => onCancel(row.id)}
                                        />
                                        <ButtonUtility
                                            size="xs"
                                            color="tertiary"
                                            icon={Eye}
                                            tooltip="Detalhes"
                                            onClick={() => onDetails(row.id)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Itens tab                                                         */
/* ------------------------------------------------------------------ */

interface ItensTabViewProps {
    onExport: () => void;
}

const ItensTabView = ({ onExport }: ItensTabViewProps) => {
    const [itens, setItens] = useState<CortesiaItem[]>(() => buildMockItens());
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [statusKeys, setStatusKeys] = useState<Set<string>>(new Set());
    const [emissorKeys, setEmissorKeys] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return itens.filter((it) => {
            if (statusKeys.size > 0 && !statusKeys.has(it.status)) return false;
            if (emissorKeys.size > 0 && !emissorKeys.has(it.emissor)) return false;
            if (q) {
                const matches =
                    it.id.toLowerCase().includes(q) ||
                    it.nome.toLowerCase().includes(q) ||
                    it.email.toLowerCase().includes(q) ||
                    it.documento.toLowerCase().includes(q);
                if (!matches) return false;
            }
            return true;
        });
    }, [itens, search, statusKeys, emissorKeys]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const visibleRows = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

    const toggleSelect = useCallback((id: string, isSelected: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (isSelected) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const toggleAllOnPage = useCallback(
        (isSelected: boolean) => {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                for (const row of visibleRows) {
                    if (isSelected) next.add(row.id);
                    else next.delete(row.id);
                }
                return next;
            });
        },
        [visibleRows],
    );

    const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

    const cancelItem = useCallback((id: string) => {
        setItens((prev) =>
            prev.map((it) => (it.id === id ? { ...it, status: "cancelado" as const } : it)),
        );
    }, []);

    const cancelSelected = useCallback(() => {
        if (selectedIds.size === 0) return;
        setItens((prev) =>
            prev.map((it) =>
                selectedIds.has(it.id) ? { ...it, status: "cancelado" as const } : it,
            ),
        );
        setSelectedIds(new Set());
    }, [selectedIds]);

    const handleResend = useCallback((id: string) => {
        console.log("Reenviar item", id);
    }, []);

    const handleDetails = useCallback((id: string) => {
        console.log("Detalhes do item", id);
    }, []);

    const metrics = useMemo<Metric[]>(
        () => [
            { label: "Emitidas", value: 12_444 },
            { label: "Pendente de cadastro", value: 96 },
            { label: "Canceladas", value: 96 },
            { label: "Validadas", value: 9_624 },
        ],
        [],
    );

    const pageSelectedCount = visibleRows.reduce(
        (acc, r) => acc + (selectedIds.has(r.id) ? 1 : 0),
        0,
    );
    const allOnPageSelected =
        visibleRows.length > 0 && pageSelectedCount === visibleRows.length;
    const someOnPageSelected = pageSelectedCount > 0 && !allOnPageSelected;

    return (
        <>
            <MetricsRow metrics={metrics} />

            <div className="flex justify-end">
                <Button
                    size="sm"
                    color="secondary"
                    iconLeading={DownloadCloud01}
                    onClick={onExport}
                >
                    Exportar em CSV
                </Button>
            </div>

            <div className="rounded-xl bg-primary ring-1 ring-border-secondary">
                <FiltersBar
                    search={search}
                    searchPlaceholder="Buscar por nome, e-mail, ID ou Documento"
                    onSearchChange={(v) => {
                        setSearch(v);
                        setPage(0);
                    }}
                    statusKeys={statusKeys}
                    onStatusKeysChange={(keys) => {
                        setStatusKeys(keys);
                        setPage(0);
                    }}
                    statusOptions={ITEM_STATUS_OPTIONS}
                    emissorKeys={emissorKeys}
                    onEmissorKeysChange={(keys) => {
                        setEmissorKeys(keys);
                        setPage(0);
                    }}
                />

                <SelectionBar
                    selectedCount={selectedIds.size}
                    emptyLabel="Nenhum item selecionado"
                    singular="item selecionado"
                    plural="itens selecionados"
                    cancelLabel="Cancelar itens selecionados"
                    onClear={clearSelection}
                    onCancel={cancelSelected}
                />

                <ItensTable
                    rows={visibleRows}
                    selectedIds={selectedIds}
                    allOnPageSelected={allOnPageSelected}
                    someOnPageSelected={someOnPageSelected}
                    onToggleSelect={toggleSelect}
                    onToggleAllOnPage={toggleAllOnPage}
                    onCancel={cancelItem}
                    onResend={handleResend}
                    onDetails={handleDetails}
                />

                <PaginationCardAdvanced
                    page={safePage + 1}
                    total={totalPages}
                    pageSize={pageSize}
                    onPageChange={(p) => setPage(p - 1)}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(0);
                    }}
                />
            </div>
        </>
    );
};

/* ------------------------------------------------------------------ */
/*  Itens table                                                       */
/* ------------------------------------------------------------------ */

interface ItensTableProps {
    rows: CortesiaItem[];
    selectedIds: Set<string>;
    allOnPageSelected: boolean;
    someOnPageSelected: boolean;
    onToggleSelect: (id: string, selected: boolean) => void;
    onToggleAllOnPage: (selected: boolean) => void;
    onCancel: (id: string) => void;
    onResend: (id: string) => void;
    onDetails: (id: string) => void;
}

const ItensTable = ({
    rows,
    selectedIds,
    allOnPageSelected,
    someOnPageSelected,
    onToggleSelect,
    onToggleAllOnPage,
    onCancel,
    onResend,
    onDetails,
}: ItensTableProps) => {
    if (rows.length === 0) {
        return (
            <div className="px-6 py-16 text-center text-sm text-tertiary">
                Nenhum item encontrado.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b border-secondary bg-secondary_subtle text-left">
                        <th className="w-10 px-4 py-3 md:px-6">
                            <Checkbox
                                aria-label="Selecionar todos da página"
                                isSelected={allOnPageSelected}
                                isIndeterminate={someOnPageSelected}
                                onChange={(s) => onToggleAllOnPage(s)}
                            />
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">Item</th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            <span className="inline-flex items-center gap-1">
                                Emissor responsável
                                <HelpCircle
                                    aria-hidden="true"
                                    className="size-3.5 text-fg-quaternary"
                                />
                            </span>
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            Destinatário
                        </th>
                        <th className="w-32 px-4 py-3" aria-label="Ações" />
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => {
                        const isSelected = selectedIds.has(row.id);
                        const isCancelled = row.status === "cancelado";
                        const meta = ITEM_STATUS_META[row.status];
                        return (
                            <tr
                                key={row.id}
                                className={cx(
                                    "transition duration-100 ease-linear hover:bg-primary_hover",
                                    i !== rows.length - 1 && "border-b border-secondary",
                                )}
                            >
                                <td className="px-4 py-3 md:px-6">
                                    <Checkbox
                                        aria-label={`Selecionar item ${row.id}`}
                                        isSelected={isSelected}
                                        onChange={(s) => onToggleSelect(row.id, s)}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-medium text-primary">
                                            {row.nome}
                                        </span>
                                        <span className="text-xs text-tertiary">
                                            {row.subtitulo}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <BadgeWithDot size="sm" type="pill-color" color={meta.color}>
                                        {meta.label}
                                    </BadgeWithDot>
                                </td>
                                <td className="px-4 py-3 text-sm text-secondary">{row.emissor}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-primary">{row.email}</span>
                                            {row.transferido && (
                                                <Badge size="sm" color="gray" type="modern">
                                                    Transferido
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-tertiary">
                                            Documento: {row.documento}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-1">
                                        <ButtonUtility
                                            size="xs"
                                            color="tertiary"
                                            icon={SlashCircle01}
                                            tooltip="Cancelar"
                                            isDisabled={isCancelled}
                                            onClick={() => onCancel(row.id)}
                                        />
                                        <ButtonUtility
                                            size="xs"
                                            color="tertiary"
                                            icon={RefreshCcw01}
                                            tooltip="Reenviar"
                                            onClick={() => onResend(row.id)}
                                        />
                                        <ButtonUtility
                                            size="xs"
                                            color="tertiary"
                                            icon={Eye}
                                            tooltip="Detalhes"
                                            onClick={() => onDetails(row.id)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
