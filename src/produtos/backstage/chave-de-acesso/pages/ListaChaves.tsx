import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
    AlertCircle,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronLeftDouble,
    ChevronRight,
    ChevronRightDouble,
    Copy01,
    Edit01,
    Key01,
    LinkBroken02,
    SearchLg,
    Trash01,
    XClose,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { EditarLimiteModal } from "../components/EditarLimiteModal";
import { ConfirmModal } from "../components/ConfirmModal";

type Filter = "todas" | "ativas" | "inativas";

interface ChaveRow {
    id: number;
    code: string;
    ingressos: number;
    /** Quantidade de vezes que a chave já foi usada. */
    used: number;
    /** Limite de uso. `null` = ilimitado (∞). */
    limit: number | null;
}

const TOTAL = 95;
const ROWS = Array.from({ length: TOTAL }, (_, i): ChaveRow => ({
    id: i,
    code: "W3X931LG",
    ingressos: 5,
    used: i % 3 === 0 ? 100000 : i % 5 === 0 ? 50 : 0,
    limit: i % 3 === 1 ? null : 100000,
}));

const fmt = (n: number) => n.toLocaleString("pt-BR");
const fmtLimit = (limit: number | null) => (limit === null ? "∞" : fmt(limit));
const INITIAL_ACTIVE = new Set(ROWS.filter((r) => r.id % 4 === 0 || r.id % 4 === 1).map((r) => r.id));

/** Lista de páginas com reticências (ex.: 1 2 3 … 8 9 10). */
const getPageList = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set<number>([1, 2, 3, total - 2, total - 1, total, current - 1, current, current + 1]);
    const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const result: (number | "...")[] = [];
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) result.push("...");
        result.push(p);
    });
    return result;
};

const ROWS_PER_PAGE = 10;

export function ListaChaves() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("todas");
    const [active, setActive] = useState<Set<number>>(INITIAL_ACTIVE);
    const [page, setPage] = useState(1);
    const [rows, setRows] = useState<ChaveRow[]>(ROWS);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    // Chaves recém-criadas começam "processando"; cada uma fica pronta individualmente em até 6s.
    const [processing, setProcessing] = useState<Set<number>>(() => new Set(ROWS.map((r) => r.id)));

    useEffect(() => {
        const timers = ROWS.map((row, i) => {
            const delay = Math.min(6000, 1800 + i * 450);
            return setTimeout(() => {
                // 1) Habilita a linha (sai do processamento).
                setProcessing((prev) => {
                    const next = new Set(prev);
                    next.delete(row.id);
                    return next;
                });
                // 2) Um instante depois, ativa o status — o toggle desliza suavemente.
                setTimeout(() => setActive((prev) => new Set(prev).add(row.id)), 250);
            }, delay);
        });
        return () => timers.forEach(clearTimeout);
    }, []);
    // Edição do limite de uso de uma linha por vez.
    const [edit, setEdit] = useState<{ id: number; value: string; status: "editing" | "validating" | "error" } | null>(null);
    const [successId, setSuccessId] = useState<number | null>(null);
    const [isEditLimitOpen, setIsEditLimitOpen] = useState(false);
    const [isDesvincularOpen, setIsDesvincularOpen] = useState(false);
    const [isAtivarOpen, setIsAtivarOpen] = useState(false);
    const [isDesativarOpen, setIsDesativarOpen] = useState(false);
    const [isRemoverOpen, setIsRemoverOpen] = useState(false);
    const abrirAdicionarVinculos = () => navigate("/backstage/marketing/chave-de-acesso/vincular-itens", { state: { adicionar: true } });
    // Ações unitárias (por linha).
    const [desvincularRowId, setDesvincularRowId] = useState<number | null>(null);
    const [removerRowId, setRemoverRowId] = useState<number | null>(null);

    // Feedback de sucesso (toast com check verde) reutilizado por todas as ações.
    const showSuccess = (message: string) =>
        toast.success(message, { icon: <CheckCircle className="size-5 text-fg-success-primary" /> });
    const successMassa = (count: number, participio: string) =>
        showSuccess(
            count === 1
                ? `1 chave de acesso ${participio} com sucesso.`
                : `${count} chaves de acesso ${participio}s com sucesso.`,
        );

    const removerChave = (id: number) => {
        setRows((prev) => prev.filter((row) => row.id !== id));
        setSelectedRows((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const editarLimiteSelecionadas = (limit: number | null) => {
        const count = selectedRows.size;
        setRows((prev) => prev.map((row) => (selectedRows.has(row.id) ? { ...row, limit } : row)));
        // Mantém a seleção inicial das chaves após sair do modal.
        setIsEditLimitOpen(false);
        successMassa(count, "atualizada");
    };

    const startEdit = (row: ChaveRow) => {
        setSuccessId(null);
        setEdit({ id: row.id, value: row.limit === null ? "" : String(row.limit), status: "editing" });
    };

    const submitEdit = (row: ChaveRow) => {
        if (!edit || edit.id !== row.id || edit.status === "validating") return;
        const raw = edit.value;
        setEdit({ id: row.id, value: raw, status: "validating" });
        // Simula a validação (loading) antes de aplicar.
        setTimeout(() => {
            const newLimit = parseInt(raw.replace(/\D/g, ""), 10);
            if (!raw.trim() || Number.isNaN(newLimit)) {
                setEdit(null);
                return;
            }
            if (newLimit < row.used) {
                setEdit({ id: row.id, value: raw, status: "error" });
                // O erro/tooltip some após 15 segundos.
                setTimeout(() => setEdit((cur) => (cur && cur.id === row.id && cur.status === "error" ? null : cur)), 15000);
                return;
            }
            setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, limit: newLimit } : r)));
            setEdit(null);
            setSuccessId(row.id);
            // O ícone de sucesso some após 5 segundos.
            setTimeout(() => setSuccessId((cur) => (cur === row.id ? null : cur)), 5000);
        }, 1100);
    };

    const filtered = useMemo(() => {
        return rows.filter((row) => {
            if (search && !row.code.toLowerCase().includes(search.toLowerCase())) return false;
            if (filter === "ativas") return active.has(row.id);
            if (filter === "inativas") return !active.has(row.id);
            return true;
        });
    }, [search, filter, active, rows]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const pageRows = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

    // Chaves em processamento não podem ser selecionadas.
    const selectable = filtered.filter((row) => !processing.has(row.id));
    const allSelected = selectable.length > 0 && selectable.every((row) => selectedRows.has(row.id));
    const someSelected = selectable.some((row) => selectedRows.has(row.id));
    const toggleAll = (checked: boolean) => setSelectedRows(checked ? new Set(selectable.map((row) => row.id)) : new Set());
    const toggleRow = (id: number, checked: boolean) =>
        setSelectedRows((prev) => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });

    // Status das chaves selecionadas (define qual ação de status mostrar).
    const selectedArray = [...selectedRows];
    // Mostra "Ativar" se houver alguma selecionada inativa, e "Desativar" se houver alguma ativa.
    // Assim: só ativas → só Desativar; só inativas → só Ativar; status mistos → as duas.
    const hasSelectedInactive = selectedArray.some((id) => !active.has(id));
    const hasSelectedActive = selectedArray.some((id) => active.has(id));

    // Ações em massa mantêm a seleção inicial das chaves.
    const ativarSelecionadas = () => setActive((prev) => new Set([...prev, ...selectedRows]));
    const desativarSelecionadas = () =>
        setActive((prev) => {
            const next = new Set(prev);
            selectedRows.forEach((id) => next.delete(id));
            return next;
        });
    const excluirSelecionadas = () => {
        setRows((prev) => prev.filter((row) => !selectedRows.has(row.id)));
        setSelectedRows(new Set());
    };

    const toggleActive = (id: number) =>
        setActive((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    return (
        <BackstageLayout activeSection="marketing" activeItem="chave-de-acesso">
            <div className="flex min-w-0 flex-1 flex-col px-4 py-6 md:px-6 md:h-[calc(100dvh-3rem)] md:overflow-hidden">
                <header className="flex shrink-0 items-center justify-between gap-3">
                    <h1 className="text-display-xs font-bold text-primary">Chave de acesso</h1>
                    <div className="flex items-center gap-3">
                        <Button size="lg" color="secondary">
                            Exportar
                        </Button>
                        <Button
                            size="lg"
                            color="primary"
                            onClick={() => navigate("/backstage/marketing/chave-de-acesso", { state: { create: true } })}
                        >
                            Nova chave de acesso
                        </Button>
                    </div>
                </header>

                <div className="mt-6 flex flex-col overflow-hidden rounded-xl ring-1 ring-border-secondary md:min-h-0 md:flex-1">
                    {/* Toolbar */}
                    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-secondary p-4">
                        <div className="w-80 max-w-full">
                            <Input icon={SearchLg} placeholder="Buscar chaves de acesso" value={search} onChange={setSearch} />
                        </div>
                        <ButtonGroup
                            selectedKeys={[filter]}
                            onSelectionChange={(keys) => {
                                const value = [...keys][0] as Filter;
                                if (value) {
                                    setFilter(value);
                                    setPage(1);
                                }
                            }}
                        >
                            <ButtonGroupItem id="todas">Todas</ButtonGroupItem>
                            <ButtonGroupItem id="ativas">Ativas</ButtonGroupItem>
                            <ButtonGroupItem id="inativas">Inativas</ButtonGroupItem>
                        </ButtonGroup>
                    </div>

                    {/* Barra de ações em massa — aparece com 2+ selecionadas ou ao "selecionar todos" */}
                    <AnimatePresence initial={false}>
                        {(selectedRows.size > 1 || allSelected) && (
                            <motion.div
                                key="bulk-bar"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="shrink-0 overflow-hidden [.dark-mode_&]:bg-secondary"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary px-4 py-3">
                                    <span className="text-sm font-semibold text-primary">
                                        {selectedRows.size}{" "}
                                        {selectedRows.size === 1 ? "chave de acesso selecionada" : "chaves de acesso selecionadas"}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {hasSelectedInactive && (
                                            <Button size="sm" color="secondary" onClick={() => setIsAtivarOpen(true)}>
                                                Ativar
                                            </Button>
                                        )}
                                        {hasSelectedActive && (
                                            <Button size="sm" color="secondary" onClick={() => setIsDesativarOpen(true)}>
                                                Desativar
                                            </Button>
                                        )}
                                        <Button size="sm" color="secondary" onClick={() => setIsEditLimitOpen(true)}>
                                            Editar limite
                                        </Button>
                                        <Button size="sm" color="secondary" onClick={abrirAdicionarVinculos}>
                                            Adicionar vínculos
                                        </Button>
                                        <Button size="sm" color="secondary" onClick={() => setIsDesvincularOpen(true)}>
                                            Desvincular
                                        </Button>
                                        <Button size="sm" color="secondary" onClick={() => setIsRemoverOpen(true)}>
                                            Remover
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Cabeçalho da tabela */}
                    <div className="flex shrink-0 items-center gap-4 border-b border-secondary px-4 py-2.5">
                        <Checkbox
                            size="sm"
                            aria-label="Selecionar todas as chaves"
                            isSelected={allSelected}
                            isIndeterminate={someSelected && !allSelected}
                            onChange={toggleAll}
                        />
                        <span className="flex-1 text-xs font-semibold text-tertiary">Status</span>
                        <span className="w-56 text-right text-xs font-semibold text-tertiary">Uso</span>
                        <span className="w-32 text-right text-xs font-semibold text-tertiary">Ações</span>
                    </div>

                    {/* Linhas (área de scroll com scrollbar sempre visível) */}
                    <div className="flex-1 overflow-y-scroll md:min-h-0">
                    {pageRows.map((row) => {
                        const isProcessing = processing.has(row.id);
                        return (
                        <div key={row.id} className="flex items-center gap-4 border-b border-secondary px-4 py-4">
                            <Checkbox
                                size="sm"
                                aria-label={`Selecionar ${row.code}`}
                                isDisabled={isProcessing}
                                isSelected={selectedRows.has(row.id)}
                                onChange={(checked) => toggleRow(row.id, checked)}
                            />
                            <div className="flex flex-1 items-center gap-3">
                                <Toggle
                                    size="sm"
                                    isDisabled={isProcessing}
                                    isSelected={!isProcessing && active.has(row.id)}
                                    onChange={() => toggleActive(row.id)}
                                />
                                <div className={cx("flex flex-col transition-opacity duration-300 ease-out", isProcessing && "opacity-50")}>
                                    <span className="text-sm font-semibold text-primary">{row.code}</span>
                                    <span className="text-sm text-tertiary">{row.ingressos} ingressos associados</span>
                                </div>
                                <AnimatePresence>
                                    {isProcessing && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25, ease: "easeOut" }}
                                            className="flex items-center gap-2 pl-2"
                                        >
                                            <div className="size-5 shrink-0 animate-spin rounded-full border-2 border-secondary border-t-brand" />
                                            <span className="text-sm text-tertiary">Preparando chave de acesso...</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className={cx("relative flex w-56 items-center justify-end gap-1.5 transition-opacity duration-300 ease-out", isProcessing && "opacity-50 pointer-events-none")}>
                                {(() => {
                                    const isEditing = edit?.id === row.id;
                                    const status = isEditing ? edit!.status : null;

                                    // Ícone de estado (loading / erro / sucesso).
                                    const icon =
                                        status === "validating" ? (
                                            <div className="size-5 shrink-0 animate-spin rounded-full border-2 border-secondary border-t-brand" />
                                        ) : status === "error" ? (
                                            <AlertCircle className="size-5 shrink-0 text-fg-error-primary" />
                                        ) : !isEditing && successId === row.id ? (
                                            <CheckCircle className="size-5 shrink-0 text-fg-success-primary" />
                                        ) : null;

                                    return (
                                        <>
                                            {icon}

                                            {isEditing ? (
                                                <>
                                                    <span className="text-sm text-secondary">{fmt(row.used)} de</span>
                                                    <input
                                                        autoFocus
                                                        value={edit!.value}
                                                        onChange={(e) =>
                                                            setEdit({ id: row.id, value: e.target.value, status: status === "error" ? "editing" : status! })
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") submitEdit(row);
                                                        }}
                                                        onBlur={() => submitEdit(row)}
                                                        disabled={status === "validating"}
                                                        aria-label="Novo limite de uso"
                                                        className="h-9 w-20 rounded-lg bg-primary px-2.5 text-sm text-primary ring-1 ring-primary outline-hidden ring-inset [.dark-mode_&]:bg-white [.dark-mode_&]:text-[#0c0e12]"
                                                    />

                                                    {status === "error" && (
                                                        <div className="absolute right-8 bottom-full z-10 mb-2 w-64 rounded-lg bg-primary-solid p-3 text-left shadow-lg">
                                                            <p className="text-sm font-semibold text-white">Limite não alterado</p>
                                                            <p className="mt-1 text-xs text-white/80">
                                                                O novo limite não pode ser menor que a quantidade de vezes que o código já foi usado.
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-sm text-secondary">
                                                        {fmt(row.used)} de {fmtLimit(row.limit)}
                                                    </span>
                                                    {successId !== row.id && (
                                                        <ButtonUtility
                                                            size="xs"
                                                            color="tertiary"
                                                            icon={Edit01}
                                                            tooltip="Editar limite de uso"
                                                            onClick={() => startEdit(row)}
                                                            className="[.dark-mode_&]:hover:bg-white [.dark-mode_&]:hover:text-[#0c0e12]"
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                            <div className={cx("flex w-32 items-center justify-end gap-1 transition-opacity duration-300 ease-out", isProcessing && "opacity-50 pointer-events-none")}>
                                <RowAction icon={Copy01} tooltip="Copiar link" />
                                <RowAction icon={Key01} tooltip="Editar vínculo de chave de acesso" onClick={abrirAdicionarVinculos} />
                                <RowAction icon={LinkBroken02} tooltip="Desvincular tudo" onClick={() => setDesvincularRowId(row.id)} />
                                <RowAction icon={Trash01} tooltip="Remover chave de acesso" onClick={() => setRemoverRowId(row.id)} />
                            </div>
                        </div>
                        );
                    })}
                    </div>

                    {/* Paginação (fixa) */}
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-secondary px-4 py-3">
                        <div className="flex items-center gap-3 text-sm text-secondary">
                            <span>Página</span>
                            <span className="flex h-9 min-w-9 items-center justify-center rounded-lg px-2 font-medium text-primary ring-1 ring-border-primary ring-inset">
                                {currentPage}
                            </span>
                            <span>de {totalPages}</span>
                            <span className="ml-2">Linhas por página</span>
                            <span className="flex h-9 items-center gap-1.5 rounded-lg px-3 font-medium text-primary ring-1 ring-border-primary ring-inset">
                                {ROWS_PER_PAGE}
                                <ChevronDown className="size-4 text-fg-quaternary" />
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <PageNav icon={ChevronLeftDouble} label="Primeira" disabled={currentPage === 1} onClick={() => setPage(1)} />
                            <PageNav icon={ChevronLeft} label="Anterior" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} />
                            {getPageList(currentPage, totalPages).map((p, i) =>
                                p === "..." ? (
                                    <span key={`e${i}`} className="flex size-9 items-center justify-center text-sm text-tertiary">
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPage(p)}
                                        className={cx(
                                            "flex size-9 items-center justify-center rounded-lg text-sm font-medium transition duration-100 ease-linear",
                                            p === currentPage ? "bg-secondary text-primary" : "text-tertiary hover:bg-primary_hover hover:text-secondary",
                                        )}
                                    >
                                        {p}
                                    </button>
                                ),
                            )}
                            <PageNav icon={ChevronRight} label="Próxima" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} />
                            <PageNav icon={ChevronRightDouble} label="Última" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)} />
                        </div>
                    </div>
                </div>
            </div>

            <EditarLimiteModal
                isOpen={isEditLimitOpen}
                onClose={() => setIsEditLimitOpen(false)}
                onSave={editarLimiteSelecionadas}
            />

            <ConfirmModal
                isOpen={isDesvincularOpen}
                onClose={() => setIsDesvincularOpen(false)}
                onConfirm={() => {
                    const count = selectedRows.size;
                    setIsDesvincularOpen(false);
                    successMassa(count, "desvinculada");
                }}
                icon={LinkBroken02}
                title="Deseja desvincular as chaves de acesso selecionadas?"
                description="Ao desvincular as chaves de acesso selecionadas, os itens ficarão visíveis para o público se não tiverem nenhum outra chave associada."
                confirmLabel="Desvincular"
            />

            <ConfirmModal
                isOpen={isAtivarOpen}
                onClose={() => setIsAtivarOpen(false)}
                onConfirm={() => {
                    const count = selectedRows.size;
                    ativarSelecionadas();
                    setIsAtivarOpen(false);
                    successMassa(count, "ativada");
                }}
                icon={XClose}
                title="Deseja ativar as chaves de acesso selecionadas?"
                description="Ao ativá-las, essas chaves voltarão a liberar os itens vinculados."
                confirmLabel="Ativar"
            />

            <ConfirmModal
                isOpen={isDesativarOpen}
                onClose={() => setIsDesativarOpen(false)}
                onConfirm={() => {
                    const count = selectedRows.size;
                    desativarSelecionadas();
                    setIsDesativarOpen(false);
                    successMassa(count, "desativada");
                }}
                icon={XClose}
                title="Deseja desativar as chaves de acesso selecionadas?"
                description="Ao desativá-los, os itens continuarão ocultos no fluxo de compra, mas o fluxo de liberação deixará de funcionar."
                confirmLabel="Desativar"
            />

            <ConfirmModal
                isOpen={isRemoverOpen}
                onClose={() => setIsRemoverOpen(false)}
                onConfirm={() => {
                    const count = selectedRows.size;
                    excluirSelecionadas();
                    setIsRemoverOpen(false);
                    successMassa(count, "removida");
                }}
                icon={Trash01}
                title="Deseja remover as chaves de acesso selecionadas?"
                description="Ao excluir, os itens ficarão visíveis para o público se não tiverem nenhuma outra chave de acesso associada."
                confirmLabel="Remover"
            />

            {/* Ações unitárias */}
            <ConfirmModal
                isOpen={desvincularRowId !== null}
                onClose={() => setDesvincularRowId(null)}
                onConfirm={() => {
                    setDesvincularRowId(null);
                    showSuccess("Chave de acesso desvinculada com sucesso.");
                }}
                icon={LinkBroken02}
                title="Deseja desvincular esta chave de acesso de todos os itens?"
                description="Ao desvinculá-la, esta chave deixará de liberar todos os itens associados e eles não poderão mais ser acessados por ela no fluxo de compra."
                confirmLabel="Desvincular"
            />

            <ConfirmModal
                isOpen={removerRowId !== null}
                onClose={() => setRemoverRowId(null)}
                onConfirm={() => {
                    if (removerRowId !== null) removerChave(removerRowId);
                    setRemoverRowId(null);
                    showSuccess("Chave de acesso removida com sucesso.");
                }}
                icon={Trash01}
                title="Deseja remover esta chave de acesso?"
                description="Essa ação removerá a chave permanentemente e ela não poderá mais ser usada."
                confirmLabel="Remover"
            />
        </BackstageLayout>
    );
}

const RowAction = ({ icon, tooltip, onClick }: { icon: typeof Copy01; tooltip: string; onClick?: () => void }) => (
    <ButtonUtility size="sm" color="tertiary" icon={icon} tooltip={tooltip} tooltipPlacement="bottom" onClick={onClick} />
);

const PageNav = ({ icon: Icon, label, disabled, onClick }: { icon: typeof ChevronLeft; label: string; disabled: boolean; onClick: () => void }) => (
    <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className="flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-secondary disabled:cursor-not-allowed disabled:opacity-50"
    >
        <Icon className="size-5" />
    </button>
);
