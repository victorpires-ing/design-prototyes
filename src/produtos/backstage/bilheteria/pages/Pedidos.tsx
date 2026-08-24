import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowDown, ArrowUp, Calendar, ChevronRight, Eye, FilterLines, SearchLg, SlashCircle01, Tag01 } from "@untitledui/icons";
import { toast } from "sonner";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputBase } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { CancelPedidosModal } from "../components/CancelPedidosModal";
import { PedidoDetailsSlideOut, type ResendChannel } from "../components/PedidoDetailsSlideOut";
import { formatBRL } from "../data/catalogo";
import { PEDIDO_STATUS_META, PEDIDO_TIPO_LABEL, type Pedido } from "../data/pedidos";
import { cancelPedidos, formatDateTime, registerResend, usePedidos } from "../data/pedidos-store";

const STATUS_OPTIONS = [
    { id: "todos", label: "Todos" },
    { id: "pendente", label: "Pendente" },
    { id: "aprovado", label: "Aprovado" },
    { id: "cancelado", label: "Cancelado" },
];

const TODOS = { id: "todos", label: "Todos" };

export function PedidosBilheteria() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    /** `?sem-itens=1` demonstra o empty state de evento sem itens cadastrados. */
    const hasCatalog = searchParams.get("sem-itens") !== "1";

    const rows = usePedidos();
    const [term, setTerm] = useState("");
    const [status, setStatus] = useState<string>("todos");
    const [emissor, setEmissor] = useState<string>("todos");
    const [sortAsc, setSortAsc] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selected, setSelected] = useState<string[]>([]);
    const [detail, setDetail] = useState<Pedido | null>(null);
    const [pendingCancel, setPendingCancel] = useState<Pedido[] | null>(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const filtered = useMemo(() => {
        const query = term.trim().toLowerCase();
        return rows
            .filter((row) => (status === "todos" ? true : row.status === status))
            .filter((row) => (emissor === "todos" ? true : row.emissor === emissor))
            .filter((row) => (query ? `${row.id} ${row.destinatario}`.toLowerCase().includes(query) : true))
            .sort((a, b) => (sortAsc ? a.dataVenda.localeCompare(b.dataVenda) : b.dataVenda.localeCompare(a.dataVenda)));
    }, [rows, term, status, emissor, sortAsc]);

    const emissorOptions = useMemo(
        () => [TODOS, ...[...new Set(rows.map((row) => row.emissor))].map((email) => ({ id: email, label: email }))],
        [rows],
    );

    const resumo = useMemo(
        () => ({
            aprovados: rows.filter((row) => row.status === "aprovado").length,
            pendentes: rows.filter((row) => row.status === "pendente").length,
            cancelados: rows.filter((row) => row.status === "cancelado").length,
        }),
        [rows],
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    const cancellableVisible = visible.filter((row) => row.status !== "cancelado");
    const allVisibleSelected = cancellableVisible.length > 0 && cancellableVisible.every((row) => selected.includes(row.id));

    const toggleRow = (id: string) =>
        setSelected((current) => (current.includes(id) ? current.filter((it) => it !== id) : [...current, id]));

    const toggleAll = () =>
        setSelected((current) =>
            allVisibleSelected
                ? current.filter((id) => !cancellableVisible.some((row) => row.id === id))
                : [...new Set([...current, ...cancellableVisible.map((row) => row.id)])],
        );

    const applyCancel = (targets: Pedido[]) => {
        const ids = targets.map((row) => row.id);
        cancelPedidos(ids);
        setSelected((current) => current.filter((id) => !ids.includes(id)));
        setDetail((current) => (current && ids.includes(current.id) ? { ...current, status: "cancelado" } : current));
        toast.success(targets.length === 1 ? "Pedido cancelado" : `${targets.length} pedidos cancelados`);
    };

    const handleResend = (pedido: Pedido, canal: ResendChannel) => {
        const at = formatDateTime(new Date());
        registerResend(pedido.id, at);
        setDetail((current) => (current && current.id === pedido.id ? { ...current, resentAt: at } : current));
        toast.success(canal === "email" ? "Link reenviado por e-mail!" : "Link aberto no WhatsApp");
    };

    return (
        <BackstageLayout activeSection="bilheteria" activeItem="bilheteria-online">
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-display-xs font-bold text-primary">Bilheteria online</h1>
                    {rows.length > 0 && (
                        <Button size="md" color="primary" onClick={() => navigate("/backstage/bilheteria/vender")}>
                            Vender ingressos
                        </Button>
                    )}
                </header>

                {rows.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center py-16">
                        <EmptyState size="sm">
                            <EmptyState.Header>
                                <EmptyState.FeaturedIcon icon={Tag01} color="gray" theme="modern" />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <EmptyState.Title>
                                    {hasCatalog ? "Venda ingressos online para seu evento" : "Configure algum item antes de vender."}
                                </EmptyState.Title>
                                <EmptyState.Description>
                                    {hasCatalog
                                        ? "Crie convites exclusivos, compartilhe o link com seus convidados e acompanhe as vendas em tempo real."
                                        : "É necessário ter itens cadastrados no evento para vender online."}
                                </EmptyState.Description>
                            </EmptyState.Content>
                            <EmptyState.Footer>
                                <Button
                                    size="md"
                                    color="primary"
                                    onClick={() => navigate(hasCatalog ? "/backstage/bilheteria/vender" : "/backstage/catalogo/ingressos")}
                                >
                                    Comece a vender
                                </Button>
                            </EmptyState.Footer>
                        </EmptyState>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-3">
                            <MetricCard label="Pedidos aprovados" value={resumo.aprovados} />
                            <MetricCard label="Pedidos pendentes" value={resumo.pendentes} />
                            <MetricCard label="Pedidos cancelados" value={resumo.cancelados} />
                        </div>

                        <section className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary">
                            {/* Filtros */}
                            <div className="flex flex-col gap-3 p-4 md:flex-row md:items-end md:gap-4">
                                <div className="flex flex-col gap-1.5 md:w-[240px]">
                                    <label htmlFor="pedidos-busca" className="text-sm font-medium text-secondary">
                                        Busca
                                    </label>
                                    <InputBase
                                        id="pedidos-busca"
                                        size="sm"
                                        icon={SearchLg}
                                        value={term}
                                        onChange={(event) => setTerm(event.target.value)}
                                        placeholder="Buscar por pedido ou e-mail do comprador"
                                    />
                                </div>

                                <Button
                                    size="sm"
                                    color="secondary"
                                    iconLeading={FilterLines}
                                    iconTrailing={ChevronRight}
                                    onClick={() => setShowMobileFilters((open) => !open)}
                                    className="md:hidden"
                                >
                                    Filtros
                                </Button>

                                <div className={cx("flex flex-col gap-3 md:flex-row md:gap-4", !showMobileFilters && "max-md:hidden")}>
                                    <div className="flex flex-col gap-1.5 md:w-[160px]">
                                        <span className="text-sm font-medium text-secondary">Status</span>
                                        <Select
                                            aria-label="Status"
                                            size="sm"
                                            selectedKey={status}
                                            onSelectionChange={(key) => {
                                                setStatus(String(key));
                                                setPage(1);
                                            }}
                                            items={STATUS_OPTIONS}
                                        >
                                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-1.5 md:w-[200px]">
                                        <span className="text-sm font-medium text-secondary">Emissor responsável</span>
                                        <Select
                                            aria-label="Emissor responsável"
                                            size="sm"
                                            selectedKey={emissor}
                                            onSelectionChange={(key) => {
                                                setEmissor(String(key));
                                                setPage(1);
                                            }}
                                            items={emissorOptions}
                                        >
                                            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Barra de seleção */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-y border-secondary bg-secondary px-4 py-3">
                                <p className="text-sm text-tertiary">
                                    {selected.length === 0
                                        ? "Nenhum pedido selecionado"
                                        : `${selected.length} ${selected.length === 1 ? "pedido selecionado" : "pedidos selecionados"}`}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" color="secondary" isDisabled={selected.length === 0} onClick={() => setSelected([])}>
                                        Limpar seleção
                                    </Button>
                                    <Button
                                        size="sm"
                                        color="primary-destructive"
                                        isDisabled={selected.length === 0}
                                        onClick={() => setPendingCancel(rows.filter((row) => selected.includes(row.id)))}
                                    >
                                        Cancelar itens selecionados
                                    </Button>
                                </div>
                            </div>

                            {/* Tabela — desktop */}
                            <div className="overflow-x-auto max-md:hidden">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-secondary text-left">
                                            <th className="w-12 px-4 py-3">
                                                <Checkbox
                                                    size="sm"
                                                    aria-label="Selecionar todos os pedidos da página"
                                                    isSelected={allVisibleSelected}
                                                    isDisabled={cancellableVisible.length === 0}
                                                    onChange={toggleAll}
                                                />
                                            </th>
                                            <Th>Pagamento</Th>
                                            <Th>Tipo</Th>
                                            <Th>Pedido</Th>
                                            <Th>Emissor responsável</Th>
                                            <th className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setSortAsc((asc) => !asc)}
                                                    className="flex items-center gap-1 text-sm font-medium text-tertiary transition duration-100 ease-linear hover:text-secondary_hover"
                                                >
                                                    Data da venda
                                                    {sortAsc ? (
                                                        <ArrowUp className="size-4" aria-hidden="true" />
                                                    ) : (
                                                        <ArrowDown className="size-4" aria-hidden="true" />
                                                    )}
                                                </button>
                                            </th>
                                            <Th>Valor</Th>
                                            <th className="w-24 px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visible.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-b border-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                                            >
                                                <td className="px-4 py-4">
                                                    <Checkbox
                                                        size="sm"
                                                        aria-label={`Selecionar pedido ${row.id}`}
                                                        isSelected={selected.includes(row.id)}
                                                        isDisabled={row.status === "cancelado"}
                                                        onChange={() => toggleRow(row.id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <BadgeWithDot size="sm" type="pill-color" color={PEDIDO_STATUS_META[row.status].color}>
                                                        {PEDIDO_STATUS_META[row.status].label}
                                                    </BadgeWithDot>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-tertiary">{PEDIDO_TIPO_LABEL[row.tipo]}</td>
                                                <td className="max-w-[180px] truncate px-4 py-4 text-sm font-medium text-secondary">
                                                    {row.id}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-tertiary">{row.emissor}</td>
                                                <td className="px-4 py-4 text-sm whitespace-nowrap text-tertiary">{row.dataVendaLabel}</td>
                                                <td className="px-4 py-4 text-sm whitespace-nowrap text-tertiary">
                                                    {formatBRL(row.valor)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <ButtonUtility
                                                            size="xs"
                                                            color="tertiary"
                                                            icon={SlashCircle01}
                                                            tooltip="Cancelar"
                                                            isDisabled={row.status === "cancelado"}
                                                            onClick={() => setPendingCancel([row])}
                                                        />
                                                        <ButtonUtility
                                                            size="xs"
                                                            color="tertiary"
                                                            icon={Eye}
                                                            tooltip="Detalhes"
                                                            onClick={() => setDetail(row)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Lista — mobile */}
                            <div className="flex flex-col gap-3 p-4 md:hidden">
                                <p className="text-sm text-tertiary">
                                    Exibindo {visible.length === 0 ? 0 : (safePage - 1) * pageSize + 1}-
                                    {(safePage - 1) * pageSize + visible.length} de {filtered.length} pedidos
                                </p>
                                {visible.map((row) => (
                                    <div key={row.id} className="flex items-start gap-3 rounded-xl bg-secondary p-3">
                                        <Checkbox
                                            size="sm"
                                            aria-label={`Selecionar pedido ${row.id}`}
                                            isSelected={selected.includes(row.id)}
                                            isDisabled={row.status === "cancelado"}
                                            onChange={() => toggleRow(row.id)}
                                            className="mt-1"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setDetail(row)}
                                            className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                                        >
                                            <BadgeWithDot size="sm" type="pill-color" color={PEDIDO_STATUS_META[row.status].color}>
                                                {PEDIDO_STATUS_META[row.status].label}
                                            </BadgeWithDot>
                                            <p className="w-full truncate text-sm font-semibold text-primary">{row.id}</p>
                                            <p className="text-sm text-tertiary">{PEDIDO_TIPO_LABEL[row.tipo]}</p>
                                            <p className="flex items-center gap-1.5 text-sm text-tertiary">
                                                <Calendar className="size-4" aria-hidden="true" />
                                                {row.dataVendaLabel}
                                                <span className="pl-2 text-secondary">{formatBRL(row.valor)}</span>
                                            </p>
                                        </button>
                                        <ChevronRight className="mt-1 size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                    </div>
                                ))}
                            </div>

                            {filtered.length === 0 && (
                                <p className="px-4 py-12 text-center text-sm text-tertiary">Nenhum pedido encontrado para os filtros.</p>
                            )}

                            <PaginationCardAdvanced
                                page={safePage}
                                total={totalPages}
                                pageSize={pageSize}
                                onPageChange={setPage}
                                onPageSizeChange={(size: number) => {
                                    setPageSize(size);
                                    setPage(1);
                                }}
                            />
                        </section>
                    </>
                )}
            </div>

            <PedidoDetailsSlideOut
                pedido={detail}
                onClose={() => setDetail(null)}
                onCancelPedido={(pedido) => setPendingCancel([pedido])}
                onResend={handleResend}
            />

            <CancelPedidosModal
                pedidos={pendingCancel}
                onClose={() => setPendingCancel(null)}
                onConfirm={(targets) => {
                    applyCancel(targets);
                    setPendingCancel(null);
                }}
            />
        </BackstageLayout>
    );
}

const Th = ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-sm font-medium whitespace-nowrap text-tertiary">{children}</th>
);

const MetricCard = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col gap-2 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
        <p className="text-sm text-tertiary">{label}</p>
        <p className="text-display-sm font-bold text-primary">{value}</p>
    </div>
);
