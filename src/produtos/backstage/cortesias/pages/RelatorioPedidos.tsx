import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type Key,
    type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router";
import {
    Check,
    DownloadCloud01,
    Edit01,
    Eye,
    HelpCircle,
    RefreshCcw01,
    SearchLg,
    SlashCircle01,
    XClose,
    SwitchHorizontal01
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
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { BackstageLayout } from "../../components/Backstage";
import { CancelConfirmModal } from "../components/CancelConfirmModal";
import { ItemDetailsSlideOut } from "../components/ItemDetailsSlideOut";
import { PedidoDetailsSlideOut } from "../components/PedidoDetailsSlideOut";
import {
    ITEM_STATUS_META,
    ITEM_STATUS_OPTIONS,
    type CortesiaItem,
} from "../data/item-types";
import {
    useCortesiasStore,
    type Pedido,
    type PedidoStatus,
} from "../data/cortesias-store";
import { showSuccessToast } from "../utils/toast";


/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

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

const DEFAULT_PAGE_SIZE = 100;

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function RelatorioPedidos() {
    const navigate = useNavigate();
    const { pedidos } = useCortesiasStore();
    const [activeTab, setActiveTab] = useState<"pedidos" | "itens">("pedidos");

    const handleEmitir = useCallback(() => navigate("/backstage/itens"), [navigate]);
    const handleExport = useCallback(() => console.log("Exportar relatório"), []);

    const isEmpty = pedidos.length === 0;

    return (
        <BackstageLayout activeSection="cortesias" activeItem="emissao-cortesias">
            <div className="flex min-w-0 flex-1 flex-col">
                {isEmpty ? (
                    <EmptyState onEmitir={handleEmitir} />
                ) : (
                    <>
                        <PageHeader onEmitir={handleEmitir} />
                        <main className="flex flex-1 flex-col gap-6 px-6 py-6">
                            <Tabs
                                selectedKey={activeTab}
                                onSelectionChange={(key: Key) =>
                                    setActiveTab(key as "pedidos" | "itens")
                                }
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
                    </>
                )}
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                       */
/* ------------------------------------------------------------------ */

interface EmptyStateProps {
    onEmitir: () => void;
}

const EmptyState = ({ onEmitir }: EmptyStateProps) => (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
        <div className="z-10 flex max-w-xl flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-1">
                <p className="text-display-md font-normal italic text-tertiary">
                    Distribua itens
                </p>
                <h2 className="text-display-md font-bold text-primary">
                    para convidados especiais
                </h2>
            </div>
            <p className="max-w-md text-md text-tertiary">
                Leve mais pessoas para o seu evento com convites exclusivos e fáceis de
                enviar.
            </p>
            <Button size="lg" color="primary" onClick={onEmitir}>
                Emitir cortesias
            </Button>
        </div>

        <EmptyStateIllustration />
    </main>
);

const EmptyStateIllustration = () => (
    <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 flex w-[640px] max-w-full -translate-x-1/2 flex-col gap-3 opacity-30"
    >
        {[0, 1].map((card) => (
            <div
                key={card}
                className="flex flex-col gap-3 rounded-2xl border border-secondary bg-secondary_subtle p-5"
                style={{ transform: `translateX(${card === 0 ? "-12px" : "12px"})` }}
            >
                {[0, 1, 2].map((row) => (
                    <div key={row} className="flex items-center gap-3">
                        <div className="h-3 w-24 rounded-full bg-quaternary" />
                        <div className="h-3 flex-1 rounded-full bg-quaternary" />
                        <div className="h-3 w-16 rounded-full bg-quaternary" />
                    </div>
                ))}
            </div>
        ))}
    </div>
);

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
    emissorOptions: { id: string; label: string }[];
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
    emissorOptions,
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
            onEmissorKeysChange(new Set(emissorOptions.map((o) => o.id)));
        } else {
            onEmissorKeysChange(new Set(Array.from(selection).map(String)));
        }
    };

    return (
        <div className="grid grid-cols-1 gap-3 border-b border-secondary px-4 py-4 md:grid-cols-[minmax(0,350px)_220px_240px] md:px-6">
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
                items={emissorOptions}
                selectedKeys={emissorKeys}
                onSelectionChange={handleEmissorSelection}
                onReset={() => onEmissorKeysChange(new Set())}
                onSelectAll={() =>
                    onEmissorKeysChange(new Set(emissorOptions.map((o) => o.id)))
                }
                selectedCountFormatter={(count) =>
                    count === emissorOptions.length
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
    const {
        pedidos,
        cancelPedido: storeCancelPedido,
        cancelPedidos: storeCancelPedidos,
        renamePedido,
    } = useCortesiasStore();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [statusKeys, setStatusKeys] = useState<Set<string>>(new Set());
    const [emissorKeys, setEmissorKeys] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [detailsPedidoId, setDetailsPedidoId] = useState<string | null>(null);
    const [pendingCancelPedidoId, setPendingCancelPedidoId] = useState<string | null>(null);
    const [showCancelSelectedConfirm, setShowCancelSelectedConfirm] = useState(false);

    const emissorOptions = useMemo(() => {
        const names = Array.from(new Set(pedidos.map((p) => p.emissor)));
        return names.sort().map((name) => ({ id: name, label: name }));
    }, [pedidos]);

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
                    if (row.status === "cancelado") continue;
                    if (isSelected) next.add(row.id);
                    else next.delete(row.id);
                }
                return next;
            });
        },
        [visibleRows],
    );

    const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

    const cancelPedidoNow = useCallback(
        (id: string) => storeCancelPedido(id),
        [storeCancelPedido],
    );

    const requestCancelPedido = useCallback((id: string) => {
        setPendingCancelPedidoId(id);
    }, []);

    const confirmCancelPedido = useCallback(() => {
        if (pendingCancelPedidoId) cancelPedidoNow(pendingCancelPedidoId);
        setPendingCancelPedidoId(null);
    }, [pendingCancelPedidoId, cancelPedidoNow]);

    const requestCancelSelected = useCallback(() => {
        if (selectedIds.size === 0) return;
        setShowCancelSelectedConfirm(true);
    }, [selectedIds]);

    const confirmCancelSelected = useCallback(() => {
        storeCancelPedidos(selectedIds);
        setSelectedIds(new Set());
        setShowCancelSelectedConfirm(false);
    }, [selectedIds, storeCancelPedidos]);

    const handleDetails = useCallback((id: string) => {
        setDetailsPedidoId(id);
    }, []);

    const handleCloseDetails = useCallback(() => setDetailsPedidoId(null), []);

    const detailsPedido = useMemo(
        () => (detailsPedidoId ? pedidos.find((p) => p.id === detailsPedidoId) ?? null : null),
        [detailsPedidoId, pedidos],
    );

    const pendingCancelPedido = useMemo(
        () =>
            pendingCancelPedidoId
                ? pedidos.find((p) => p.id === pendingCancelPedidoId) ?? null
                : null,
        [pendingCancelPedidoId, pedidos],
    );

    const selectedPedidosList = useMemo(
        () => pedidos.filter((p) => selectedIds.has(p.id)),
        [pedidos, selectedIds],
    );

    const metrics = useMemo<Metric[]>(
        () => [
            {
                label: "Pedidos emitidos",
                value: pedidos.filter((p) => p.status === "emitido").length,
            },
            {
                label: "Pedidos cancelados",
                value: pedidos.filter((p) => p.status === "cancelado").length,
            },
        ],
        [pedidos],
    );

    const selectableVisibleRows = useMemo(
        () => visibleRows.filter((r) => r.status !== "cancelado"),
        [visibleRows],
    );
    const pageSelectedCount = selectableVisibleRows.reduce(
        (acc, r) => acc + (selectedIds.has(r.id) ? 1 : 0),
        0,
    );
    const allOnPageSelected =
        selectableVisibleRows.length > 0 &&
        pageSelectedCount === selectableVisibleRows.length;
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
                    emissorOptions={emissorOptions}
                />

                <SelectionBar
                    selectedCount={selectedIds.size}
                    emptyLabel="Nenhum pedido selecionado"
                    singular="pedido selecionado"
                    plural="pedidos selecionados"
                    cancelLabel="Cancelar pedidos selecionados"
                    onClear={clearSelection}
                    onCancel={requestCancelSelected}
                />

                <PedidosTable
                    rows={visibleRows}
                    selectedIds={selectedIds}
                    allOnPageSelected={allOnPageSelected}
                    someOnPageSelected={someOnPageSelected}
                    onToggleSelect={toggleSelect}
                    onToggleAllOnPage={toggleAllOnPage}
                    onCancel={requestCancelPedido}
                    onDetails={handleDetails}
                    onRename={renamePedido}
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

            <PedidoDetailsSlideOut
                isOpen={detailsPedido !== null}
                pedido={detailsPedido}
                onClose={handleCloseDetails}
                onCancelPedido={cancelPedidoNow}
            />

            <CancelConfirmModal
                isOpen={pendingCancelPedido !== null}
                onClose={() => setPendingCancelPedidoId(null)}
                onConfirm={confirmCancelPedido}
                title="Cancelar este pedido de cortesia?"
                description={
                    <>
                        Você está prestes a cancelar o pedido{" "}
                        <span className="font-medium text-primary">
                            {pendingCancelPedido?.id}
                        </span>
                        . Isso interromperá o envio para todos os destinatários vinculados
                        a este pedido. Esta ação não pode ser desfeita.
                    </>
                }
                confirmLabel="Cancelar pedido"
                cancelLabel="Manter pedido"
            />

            <CancelConfirmModal
                isOpen={showCancelSelectedConfirm}
                onClose={() => setShowCancelSelectedConfirm(false)}
                onConfirm={confirmCancelSelected}
                title={`Cancelar ${selectedPedidosList.length} ${selectedPedidosList.length === 1 ? "pedido selecionado" : "pedidos selecionados"}?`}
                description="Os itens dos pedidos selecionados terão os QR codes invalidados e você precisará gerar novos convites caso mude de ideia."
                listLabel="Pedidos cancelados"
                listItems={selectedPedidosList.map((p) => (
                    <span className="block truncate" title={p.id}>
                        {p.id}
                    </span>
                ))}
                confirmLabel="Cancelar pedidos"
                cancelLabel="Manter pedidos"
            />
        </>
    );
};

/* ------------------------------------------------------------------ */
/*  Pedidos table                                                     */
/* ------------------------------------------------------------------ */

interface EditableNomeCellProps {
    value: string;
    onSave: (nome: string) => void;
}

const EditableNomeCell = ({ value, onSave }: EditableNomeCellProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!isEditing) setDraft(value);
    }, [value, isEditing]);

    useLayoutEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const commit = () => {
        const next = draft.trim();
        if (next && next !== value) onSave(next);
        setIsEditing(false);
    };

    const cancel = () => {
        setDraft(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            commit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
        }
    };

    if (isEditing) {
        return (
            <div className="flex max-w-[320px] items-center gap-1">
                <input
                    ref={inputRef}
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={commit}
                    aria-label="Nome do pedido"
                    className="min-w-0 flex-1 rounded-md bg-primary px-2 py-1 text-sm text-primary outline-none ring-1 ring-brand"
                />
                <ButtonUtility
                    size="xs"
                    color="tertiary"
                    icon={Check}
                    tooltip="Salvar"
                    onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                    onClick={commit}
                />
                <ButtonUtility
                    size="xs"
                    color="tertiary"
                    icon={XClose}
                    tooltip="Cancelar"
                    onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                    onClick={cancel}
                />
            </div>
        );
    }

    return (
        <div className="group/nome flex max-w-[320px] items-center gap-2">
            <span className="block min-w-0 flex-1 truncate" title={value}>
                {value}
            </span>
            <ButtonUtility
                size="xs"
                color="tertiary"
                icon={Edit01}
                tooltip="Editar nome"
                className="opacity-0 transition group-hover/nome:opacity-100 focus-visible:opacity-100"
                onClick={() => setIsEditing(true)}
            />
        </div>
    );
};

interface PedidosTableProps {
    rows: Pedido[];
    selectedIds: Set<string>;
    allOnPageSelected: boolean;
    someOnPageSelected: boolean;
    onToggleSelect: (id: string, selected: boolean) => void;
    onToggleAllOnPage: (selected: boolean) => void;
    onCancel: (id: string) => void;
    onDetails: (id: string) => void;
    onRename: (id: string, nome: string) => void;
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
    onRename,
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
                                        isDisabled={isCancelled}
                                        onChange={(s) => onToggleSelect(row.id, s)}
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm text-tertiary">
                                    <span className="block max-w-[160px] truncate" title={row.id}>
                                        {row.id}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-primary">
                                    <EditableNomeCell
                                        value={row.nome}
                                        onSave={(nome) => onRename(row.id, nome)}
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm text-secondary">{row.emissor}</td>
                                <td className="px-4 py-3">
                                    <BadgeWithDot size="sm" type="modern" color={meta.color}>
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
    const {
        itens,
        cancelItem: storeCancelItem,
        cancelItens: storeCancelItens,
    } = useCortesiasStore();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [statusKeys, setStatusKeys] = useState<Set<string>>(new Set());
    const [emissorKeys, setEmissorKeys] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [pendingCancelItemId, setPendingCancelItemId] = useState<string | null>(null);
    const [showCancelSelectedConfirm, setShowCancelSelectedConfirm] = useState(false);
    const [detailsItemId, setDetailsItemId] = useState<string | null>(null);

    const emissorOptions = useMemo(() => {
        const names = Array.from(new Set(itens.map((it) => it.emissor)));
        return names.sort().map((name) => ({ id: name, label: name }));
    }, [itens]);

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
                    if (row.status === "cancelado" || row.status === "erro") continue;
                    if (isSelected) next.add(row.id);
                    else next.delete(row.id);
                }
                return next;
            });
        },
        [visibleRows],
    );

    const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

    const cancelItemNow = useCallback(
        (id: string) => storeCancelItem(id),
        [storeCancelItem],
    );

    const requestCancelItem = useCallback((id: string) => {
        setPendingCancelItemId(id);
    }, []);

    const confirmCancelItem = useCallback(() => {
        if (pendingCancelItemId) cancelItemNow(pendingCancelItemId);
        setPendingCancelItemId(null);
    }, [pendingCancelItemId, cancelItemNow]);

    const requestCancelSelected = useCallback(() => {
        if (selectedIds.size === 0) return;
        setShowCancelSelectedConfirm(true);
    }, [selectedIds]);

    const confirmCancelSelected = useCallback(() => {
        storeCancelItens(selectedIds);
        setSelectedIds(new Set());
        setShowCancelSelectedConfirm(false);
    }, [selectedIds, storeCancelItens]);

    const pendingCancelItem = useMemo(
        () =>
            pendingCancelItemId
                ? itens.find((it) => it.id === pendingCancelItemId) ?? null
                : null,
        [pendingCancelItemId, itens],
    );

    const selectedItensList = useMemo(
        () => itens.filter((it) => selectedIds.has(it.id)),
        [itens, selectedIds],
    );

    const handleResend = useCallback(
        (id: string) => {
            const item = itens.find((it) => it.id === id);
            if (!item) return;
            showSuccessToast(
                "Cortesia reenviada",
                `Reenviamos ${item.nome} para ${item.email}`,
            );
        },
        [itens],
    );

    const handleDetails = useCallback((id: string) => {
        setDetailsItemId(id);
    }, []);

    const detailsItem = useMemo(
        () => (detailsItemId ? itens.find((it) => it.id === detailsItemId) ?? null : null),
        [detailsItemId, itens],
    );

    const metrics = useMemo<Metric[]>(
        () => [
            {
                label: "Itens totais",
                value: itens.length,
            },
            {
                label: "Itens com cadastro pendente",
                value: itens.filter((it) => it.status === "pendente").length,
            },
            {
                label: "Itens cancelados",
                value: itens.filter((it) => it.status === "cancelado").length,
            },
            {
                label: "Itens validados",
                value: itens.filter((it) => it.status === "aceito").length,
            },
        ],
        [itens],
    );

    const selectableVisibleRows = useMemo(
        () =>
            visibleRows.filter(
                (r) => r.status !== "cancelado" && r.status !== "erro",
            ),
        [visibleRows],
    );
    const pageSelectedCount = selectableVisibleRows.reduce(
        (acc, r) => acc + (selectedIds.has(r.id) ? 1 : 0),
        0,
    );
    const allOnPageSelected =
        selectableVisibleRows.length > 0 &&
        pageSelectedCount === selectableVisibleRows.length;
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
                    emissorOptions={emissorOptions}
                />

                <SelectionBar
                    selectedCount={selectedIds.size}
                    emptyLabel="Nenhum item selecionado"
                    singular="item selecionado"
                    plural="itens selecionados"
                    cancelLabel="Cancelar itens selecionados"
                    onClear={clearSelection}
                    onCancel={requestCancelSelected}
                />

                <ItensTable
                    rows={visibleRows}
                    selectedIds={selectedIds}
                    allOnPageSelected={allOnPageSelected}
                    someOnPageSelected={someOnPageSelected}
                    onToggleSelect={toggleSelect}
                    onToggleAllOnPage={toggleAllOnPage}
                    onCancel={requestCancelItem}
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

            <CancelConfirmModal
                isOpen={pendingCancelItem !== null}
                onClose={() => setPendingCancelItemId(null)}
                onConfirm={confirmCancelItem}
                title="Cancelar este item?"
                description={
                    pendingCancelItem ? (
                        <>
                            <span className="font-medium text-primary">
                                {pendingCancelItem.email}
                            </span>{" "}
                            terá o QR code para{" "}
                            <span className="font-medium text-primary">
                                {pendingCancelItem.nome}
                            </span>{" "}
                            invalidado e você precisará gerar novos convites caso mude de ideia.
                            Esta ação não pode ser desfeita.
                        </>
                    ) : null
                }
                confirmLabel="Cancelar cortesia"
                cancelLabel="Manter cortesia"
            />

            <CancelConfirmModal
                isOpen={showCancelSelectedConfirm}
                onClose={() => setShowCancelSelectedConfirm(false)}
                onConfirm={confirmCancelSelected}
                title={`Cancelar ${selectedItensList.length} ${selectedItensList.length === 1 ? "item selecionado" : "itens selecionados"}?`}
                description="Os itens selecionados terão os QR codes invalidados e você precisará gerar novos convites caso mude de ideia."
                listLabel="Itens cancelados"
                listItems={selectedItensList.map((it) => (
                    <div className="flex flex-col">
                        <span className="font-medium text-primary">{it.nome}</span>
                        <span className="text-xs text-tertiary">{it.subtitulo}</span>
                    </div>
                ))}
                confirmLabel="Cancelar itens"
                cancelLabel="Manter itens"
            />

            <ItemDetailsSlideOut
                isOpen={detailsItem !== null}
                item={detailsItem}
                onClose={() => setDetailsItemId(null)}
                onCancel={cancelItemNow}
                onResend={handleResend}
            />
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
                        const isErro = row.status === "erro";
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
                                        isDisabled={isCancelled || isErro}
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
                                    <BadgeWithDot size="sm" type="modern" color={meta.color}>
                                        {meta.label}
                                    </BadgeWithDot>
                                </td>
                                <td className="px-4 py-3 text-sm text-secondary">{row.emissor}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-primary">{row.email}</span>
                                            {row.transferido && (
                                                <Tooltip title="Transferido">
                                                    <TooltipTrigger>
                                                        <SwitchHorizontal01
                                                            aria-label="Transferido"
                                                            className="size-4 text-utility-sky-500"
                                                        />
                                                    </TooltipTrigger>
                                                </Tooltip>
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
