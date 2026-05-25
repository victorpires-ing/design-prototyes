import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, SearchLg, SlashCircle01, XClose } from "@untitledui/icons";
import {
    Dialog as AriaDialog,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import type { Selection } from "react-aria-components";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { MultiSelect } from "@/components/base/select/multi-select";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { cx } from "@/utils/cx";
import {
    useCortesiasStore,
    type Pedido as PedidoSummaryStore,
    type PedidoStatus as StorePedidoStatus,
} from "../data/cortesias-store";
import type { CortesiaItem } from "../data/item-types";
import { CancelConfirmModal } from "./CancelConfirmModal";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type PedidoStatus = StorePedidoStatus;

export type PedidoSummary = PedidoSummaryStore;

type ItemStatus = CortesiaItem["status"];

/* ------------------------------------------------------------------ */
/*  Static option lists                                               */
/* ------------------------------------------------------------------ */

const ITEM_STATUS_META: Record<
    ItemStatus,
    { label: string; color: "success" | "error" | "warning" | "blue" | "gray" | "brand" }
> = {
    aceito: { label: "Aceito", color: "success" },
    cancelado: { label: "Cancelado", color: "error" },
    pendente: { label: "Pendente de cadastro", color: "warning" },
    processando: { label: "Processando", color: "blue" },
    erro: { label: "Erro", color: "error" },
};

const ITEM_STATUS_OPTIONS: { id: ItemStatus; label: string }[] = [
    { id: "aceito", label: "Aceito" },
    { id: "cancelado", label: "Cancelado" },
    { id: "pendente", label: "Pendente de cadastro" },
    { id: "processando", label: "Processando" },
    { id: "erro", label: "Erro" },
];

const PEDIDO_STATUS_META: Record<PedidoStatus, { label: string; color: "success" | "error" }> = {
    emitido: { label: "Emitido", color: "success" },
    cancelado: { label: "Cancelado", color: "error" },
};

const DEFAULT_PAGE_SIZE = 100;

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export interface PedidoDetailsSlideOutProps {
    isOpen: boolean;
    pedido: PedidoSummary | null;
    /** If provided, only items for this destinatário are shown / cancellable. */
    destinatarioEmail?: string | null;
    onClose: () => void;
    onCancelPedido: (id: string) => void;
}

export function PedidoDetailsSlideOut({
    isOpen,
    pedido,
    destinatarioEmail,
    onClose,
    onCancelPedido,
}: PedidoDetailsSlideOutProps) {
    const {
        itens: allItens,
        cancelItens: storeCancelItens,
    } = useCortesiasStore();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [statusKeys, setStatusKeys] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [showCancelPedidoConfirm, setShowCancelPedidoConfirm] = useState(false);
    const [showCancelSelectedConfirm, setShowCancelSelectedConfirm] = useState(false);

    const itens = useMemo(() => {
        if (!pedido) return [];
        return allItens.filter((it) => {
            if (it.pedidoId !== pedido.id) return false;
            if (destinatarioEmail && it.email !== destinatarioEmail) return false;
            return true;
        });
    }, [allItens, pedido, destinatarioEmail]);

    // Reset transient state every time the slideout opens for a different pedido.
    useEffect(() => {
        if (isOpen && pedido) {
            setSelectedIds(new Set());
            setSearch("");
            setStatusKeys(new Set());
            setPage(0);
            setShowCancelPedidoConfirm(false);
            setShowCancelSelectedConfirm(false);
        }
    }, [isOpen, pedido, destinatarioEmail]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return itens.filter((it) => {
            if (statusKeys.size > 0 && !statusKeys.has(it.status)) return false;
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
    }, [itens, search, statusKeys]);

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

    const requestCancelSelected = useCallback(() => {
        if (selectedIds.size === 0) return;
        setShowCancelSelectedConfirm(true);
    }, [selectedIds]);

    const confirmCancelSelected = useCallback(() => {
        storeCancelItens(selectedIds);
        setSelectedIds(new Set());
        setShowCancelSelectedConfirm(false);
    }, [selectedIds, storeCancelItens]);

    const requestCancelPedido = useCallback(() => {
        setShowCancelPedidoConfirm(true);
    }, []);

    const confirmCancelPedido = useCallback(() => {
        if (!pedido) return;
        // Parent handler calls store.cancelPedido which already cascades to items.
        onCancelPedido(pedido.id);
        setShowCancelPedidoConfirm(false);
    }, [pedido, onCancelPedido]);

    const selectedItensList = useMemo(
        () => itens.filter((it) => selectedIds.has(it.id)),
        [itens, selectedIds],
    );

    const handleStatusSelection = (selection: Selection) => {
        if (selection === "all") {
            setStatusKeys(new Set(ITEM_STATUS_OPTIONS.map((o) => o.id)));
        } else {
            setStatusKeys(new Set(Array.from(selection).map(String)));
        }
        setPage(0);
    };

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

    const statusMeta = pedido ? PEDIDO_STATUS_META[pedido.status] : null;
    const isPedidoCancelado = pedido?.status === "cancelado";

    return (
        <>
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
                        "h-full w-full max-w-[760px] bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                        isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                    )
                }
            >
                <AriaDialog className="flex h-full flex-col outline-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 border-b border-secondary px-6 py-5">
                        <h2 className="text-lg font-semibold text-primary">
                            Detalhes do pedido
                        </h2>
                        <ButtonUtility
                            size="sm"
                            color="tertiary"
                            icon={XClose}
                            tooltip="Fechar"
                            onClick={onClose}
                        />
                    </div>

                    {/* Scrollable content */}
                    <div className="flex flex-1 flex-col overflow-y-auto">
                        {pedido && (
                            <div className="flex flex-col gap-4 px-6 pt-6 pb-5">
                                <h3
                                    className="text-md font-semibold break-words text-primary"
                                    title={pedido.nome}
                                >
                                    {pedido.nome}
                                </h3>
                                <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                                    <DetailRow label="Status:">
                                        {statusMeta && (
                                            <BadgeWithDot
                                                size="sm"
                                                type="modern"
                                                color={statusMeta.color}
                                            >
                                                {statusMeta.label}
                                            </BadgeWithDot>
                                        )}
                                    </DetailRow>
                                    <DetailRow label="Emissor responsável:">
                                        <span className="text-sm text-secondary">
                                            {pedido.emissor}
                                        </span>
                                    </DetailRow>
                                    <DetailRow label="ID do pedido:">
                                        <span
                                            className="text-sm break-all text-secondary"
                                            title={pedido.id}
                                        >
                                            {pedido.id}
                                        </span>
                                    </DetailRow>
                                    <DetailRow label="Data de envio:">
                                        <span className="text-sm text-secondary">
                                            {pedido.dataEnvio}
                                        </span>
                                    </DetailRow>
                                </dl>
                            </div>
                        )}

                        <div className="mx-6 border-t border-secondary" />

                        <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                            <h3 className="text-md font-semibold text-primary">Ações</h3>
                            <div>
                                <Button
                                    size="sm"
                                    color="secondary"
                                    iconLeading={SlashCircle01}
                                    isDisabled={isPedidoCancelado}
                                    onClick={requestCancelPedido}
                                >
                                    Cancelar pedido completo
                                </Button>
                            </div>
                        </div>

                        <div className="px-6 pb-6">
                            <div className="rounded-xl bg-primary ring-1 ring-border-secondary">
                                <div className="grid grid-cols-1 gap-3 border-b border-secondary px-4 py-4 md:grid-cols-[1fr_180px_180px] md:px-6">
                                    <Input
                                        label="Busca"
                                        size="sm"
                                        icon={SearchLg}
                                        placeholder="Buscar por nome, e-mail, ID ou Documento"
                                        value={search}
                                        onChange={(v: string) => {
                                            setSearch(v);
                                            setPage(0);
                                        }}
                                    />
                                    <MultiSelect
                                        label="Status"
                                        size="sm"
                                        aria-label="Status"
                                        placeholder="Todos"
                                        items={ITEM_STATUS_OPTIONS}
                                        selectedKeys={statusKeys}
                                        onSelectionChange={handleStatusSelection}
                                        onReset={() => setStatusKeys(new Set())}
                                        onSelectAll={() =>
                                            setStatusKeys(
                                                new Set(ITEM_STATUS_OPTIONS.map((o) => o.id)),
                                            )
                                        }
                                        showSearch={false}
                                        selectedCountFormatter={(count) =>
                                            count === ITEM_STATUS_OPTIONS.length
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

                                <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-secondary bg-secondary px-4 py-3 md:px-6">
                                    <p className="text-sm text-tertiary">
                                        {selectedIds.size === 0
                                            ? "Nenhum item selecionado"
                                            : `${selectedIds.size} ${selectedIds.size === 1 ? "item selecionado" : "itens selecionados"}`}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            color="secondary"
                                            isDisabled={selectedIds.size === 0}
                                            onClick={clearSelection}
                                        >
                                            Limpar seleção
                                        </Button>
                                        <Button
                                            size="sm"
                                            color="primary-destructive"
                                            isDisabled={selectedIds.size === 0}
                                            onClick={requestCancelSelected}
                                        >
                                            Cancelar itens selecionados
                                        </Button>
                                    </div>
                                </div>

                                <ItensTable
                                    rows={visibleRows}
                                    selectedIds={selectedIds}
                                    allOnPageSelected={allOnPageSelected}
                                    someOnPageSelected={someOnPageSelected}
                                    onToggleSelect={toggleSelect}
                                    onToggleAllOnPage={toggleAllOnPage}
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
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-secondary px-6 py-4">
                        <Button size="sm" color="secondary" onClick={onClose}>
                            Fechar
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>

        <CancelConfirmModal
            isOpen={showCancelPedidoConfirm}
            onClose={() => setShowCancelPedidoConfirm(false)}
            onConfirm={confirmCancelPedido}
            title="Cancelar este pedido de cortesia?"
            description={
                <>
                    Você está prestes a cancelar o pedido{" "}
                    <span className="font-medium text-primary">{pedido?.id}</span>. Isso
                    interromperá o envio para todos os destinatários vinculados a este
                    pedido. Esta ação não pode ser desfeita.
                </>
            }
            confirmLabel="Cancelar pedido"
            cancelLabel="Manter pedido"
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
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

interface DetailRowProps {
    label: string;
    children: React.ReactNode;
}

const DetailRow = ({ label, children }: DetailRowProps) => (
    <div className="flex flex-wrap items-center gap-2">
        <dt className="text-sm text-tertiary">{label}</dt>
        <dd className="text-sm text-secondary">{children}</dd>
    </div>
);

interface ItensTableProps {
    rows: CortesiaItem[];
    selectedIds: Set<string>;
    allOnPageSelected: boolean;
    someOnPageSelected: boolean;
    onToggleSelect: (id: string, selected: boolean) => void;
    onToggleAllOnPage: (selected: boolean) => void;
}

const ItensTable = ({
    rows,
    selectedIds,
    allOnPageSelected,
    someOnPageSelected,
    onToggleSelect,
    onToggleAllOnPage,
}: ItensTableProps) => {
    if (rows.length === 0) {
        return (
            <div className="px-6 py-12 text-center text-sm text-tertiary">
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
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            <span className="inline-flex items-center gap-1">
                                Status
                                <ArrowDown
                                    aria-hidden="true"
                                    className="size-3.5 text-fg-quaternary"
                                />
                            </span>
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-tertiary">
                            Destinatário
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => {
                        const isSelected = selectedIds.has(row.id);
                        const meta = ITEM_STATUS_META[row.status];
                        const showEmail = row.status !== "cancelado" || row.email;
                        const isCheckboxDisabled =
                            row.status === "cancelado" || row.status === "erro";
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
                                        isDisabled={isCheckboxDisabled}
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
                                <td className="px-4 py-3">
                                    {row.status === "cancelado" && !showEmail ? (
                                        <span className="text-sm text-tertiary">-</span>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-primary">
                                                    {row.email}
                                                </span>
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
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
