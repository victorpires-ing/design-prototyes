import { useCallback, useMemo, useState, type Key } from "react";
import { useLocation, useNavigate } from "react-router";
import {
    ArrowLeft,
    CheckCircle,
    Edit01,
    Menu02,
    SearchLg,
    ShoppingCart01,
    Table,
    Trash01,
    Users01,
} from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressFeaturedIconType } from "@/components/application/progress-steps/progress-types";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../components/Backstage";
import { ConfirmRemoveEmailModal, EditEmailModal } from "../components/EmailModals";
import { showSuccessToast } from "../utils/toast";
import {
    getItemDetails,
    type ComboItemDetails,
    type ItemDetails,
    type ProductItemDetails,
    type TicketItemDetails,
} from "../data/cortesia-items";
import { useCortesiasStore } from "../data/cortesias-store";

const steps: ProgressFeaturedIconType[] = [
    {
        title: "Itens",
        description: "Defina a quantidade e tipo de itens",
        status: "complete",
        icon: ShoppingCart01,
    },
    {
        title: "Destinatários",
        description: "Escolha para quem vai enviar",
        status: "complete",
        icon: Users01,
    },
    {
        title: "Verificação final",
        description: "Revisão dos destinatários e itens",
        status: "current",
        icon: CheckCircle,
    },
];

interface RouteState {
    itemIds?: string[];
    emails?: string[];
}

const DEFAULT_PAGE_SIZE = 10;

type CadastroFilter = "all" | "com" | "sem";

const CADASTRO_FILTER_OPTIONS = [
    { id: "all", label: "Todos os cadastros" },
    { id: "com", label: "Apenas cadastrados" },
    { id: "sem", label: "Apenas sem cadastro" },
];

const FALLBACK_EMAILS = Array.from(
    { length: 24 },
    (_, i) => `convidado${String(i + 1).padStart(3, "0")}@exemplo.com`,
);
const FALLBACK_ITEM_IDS = ["tk-1-1", "tk-1-4", "prod-1", "combo-1"];

/** Deterministic hash for stable "tem/sem cadastro" assignment per e-mail. */
function emailHash(email: string): number {
    let h = 0;
    for (let i = 0; i < email.length; i++) {
        h = ((h << 5) - h + email.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

/** ~40% of e-mails are marked "sem cadastro" (deterministic, hash-based). */
function emailHasCadastro(email: string): boolean {
    return emailHash(email) % 10 >= 4;
}


export function VerificacaoFinal() {
    const navigate = useNavigate();
    const location = useLocation();
    const routeState = (location.state as RouteState | null) ?? {};

    const itemIds = routeState.itemIds?.length ? routeState.itemIds : FALLBACK_ITEM_IDS;
    const incomingEmails = routeState.emails?.length ? routeState.emails : FALLBACK_EMAILS;

    const [emails, setEmails] = useState<string[]>(incomingEmails);
    const [orderName, setOrderName] = useState("Envio de cortesia");
    const [sendQrCode, setSendQrCode] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [viewMode, setViewMode] = useState<"list" | "table">("list");
    const [editingEmail, setEditingEmail] = useState<string | null>(null);
    const [removingEmail, setRemovingEmail] = useState<string | null>(null);
    const [cadastroFilter, setCadastroFilter] = useState<CadastroFilter>("all");

    // Group the selected items by kind once.
    const groupedItems = useMemo(() => {
        const tickets: TicketItemDetails[] = [];
        const products: ProductItemDetails[] = [];
        const combos: ComboItemDetails[] = [];
        for (const id of itemIds) {
            const details = getItemDetails(id);
            if (!details) continue;
            if (details.kind === "ticket") tickets.push(details);
            else if (details.kind === "product") products.push(details);
            else combos.push(details);
        }
        return { tickets, products, combos };
    }, [itemIds]);

    const itemsPerRecipient = itemIds.length;

    const emailOccurrences = useMemo(() => {
        const map = new Map<string, number>();
        for (const e of emails) map.set(e, (map.get(e) ?? 0) + 1);
        return map;
    }, [emails]);

    const activeEmails = useMemo(() => {
        // Unique emails, sorted: "sem cadastro" first, then alphabetical.
        return Array.from(emailOccurrences.keys()).sort((a, b) => {
            const aCad = emailHasCadastro(a);
            const bCad = emailHasCadastro(b);
            if (aCad !== bCad) return aCad ? 1 : -1;
            return a.localeCompare(b);
        });
    }, [emailOccurrences]);

    const filteredEmails = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return activeEmails.filter((e) => {
            // Cadastro filter
            if (cadastroFilter !== "all") {
                const hasCad = emailHasCadastro(e);
                if (cadastroFilter === "com" && !hasCad) return false;
                if (cadastroFilter === "sem" && hasCad) return false;
            }
            // Search filter
            if (q && !e.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [activeEmails, searchQuery, cadastroFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredEmails.length / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const visibleEmails = filteredEmails.slice(
        safePage * pageSize,
        (safePage + 1) * pageSize,
    );

    // Trash button → open confirm modal (does not remove yet).
    const handleRemove = useCallback((email: string) => {
        setRemovingEmail(email);
    }, []);

    // Pencil button → open edit modal (only "sem cadastro" reach this handler).
    const handleEdit = useCallback((email: string) => {
        setEditingEmail(email);
    }, []);

    const handleConfirmRemove = useCallback(() => {
        if (!removingEmail) return;
        setEmails((prev) => prev.filter((e) => e !== removingEmail));
        setRemovingEmail(null);
    }, [removingEmail]);

    const handleSaveEdit = useCallback((newEmail: string) => {
        setEmails((prev) => {
            if (!editingEmail) return prev;
            // Drop duplicates that would result from the rename.
            const seen = new Set<string>();
            const out: string[] = [];
            for (const e of prev) {
                const next = e === editingEmail ? newEmail : e;
                if (seen.has(next)) continue;
                seen.add(next);
                out.push(next);
            }
            return out;
        });
        setEditingEmail(null);
    }, [editingEmail]);

    const { addPedido } = useCortesiasStore();

    const handleSubmit = useCallback(() => {
        addPedido({
            nome: orderName,
            emails,
            itemIds,
        });
        showSuccessToast(
            "Pedido enviado",
            `${activeEmails.length} ${
                activeEmails.length === 1 ? "destinatário foi notificado" : "destinatários foram notificados"
            }.`,
        );
        navigate("/backstage/cortesias");
    }, [orderName, emails, activeEmails, itemIds, addPedido, navigate]);

    const handleBack = useCallback(() => {
        navigate("/backstage/destinatarios", { state: { itemIds } });
    }, [itemIds, navigate]);

    return (
        <BackstageLayout activeSection="cortesias" activeItem="emissao-cortesias">
            <div className="flex min-w-0 flex-1 flex-col">
                <PageHeader onBack={handleBack} onSubmit={handleSubmit} />
                <main className="flex flex-1 flex-col gap-8 px-6 py-6">
                    <Progress.IconsWithText
                        items={steps}
                        size="sm"
                        type="icon"
                        orientation="horizontal"
                        className="max-w-[760px] self-center max-md:hidden"
                    />
                    <Progress.IconsWithText
                        items={steps}
                        size="sm"
                        type="icon"
                        orientation="vertical"
                        className="w-full md:hidden"
                    />

                    <div className="flex flex-col gap-4 -mb-4">
                        <div className="flex max-w-md flex-col">
                            <Input
                                label="Nome do pedido"
                                isRequired
                                placeholder="Envio de cortesia"
                                hint="Esse nome será exibido apenas no backstage"
                                value={orderName}
                                onChange={(v: string) => setOrderName(v)}
                            />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <Input
                                    size="sm"
                                    icon={SearchLg}
                                    placeholder="Busque por e-mail"
                                    aria-label="Busque por e-mail"
                                    value={searchQuery}
                                    onChange={(v: string) => {
                                        setSearchQuery(v);
                                        setPage(0);
                                    }}
                                />
                            </div>
                            <div className="w-full sm:w-56">
                                <Select
                                    size="sm"
                                    aria-label="Filtrar por cadastro"
                                    selectedKey={cadastroFilter}
                                    onSelectionChange={(key: Key) => {
                                        setCadastroFilter(key as CadastroFilter);
                                        setPage(0);
                                    }}
                                    items={CADASTRO_FILTER_OPTIONS}
                                >
                                    {(item: { id: string; label: string }) => (
                                        <Select.Item id={item.id}>{item.label}</Select.Item>
                                    )}
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <Checkbox
                                isSelected={sendQrCode}
                                onChange={setSendQrCode}
                                label="Também enviar QR Code por e-mail"
                            />
                            <div className="flex items-center gap-4">
                                <p className="text-sm text-tertiary">
                                    Cada um dos{" "}
                                    <span className="font-semibold text-primary">
                                        {activeEmails.length}
                                    </span>{" "}
                                    destinatários receberá{" "}
                                    <span className="font-semibold text-primary">
                                        {itemsPerRecipient}{" "}
                                        {itemsPerRecipient === 1 ? "item" : "itens"}
                                    </span>{" "}
                                    por e-mail
                                </p>
                                <ButtonGroup
                                    size="sm"
                                    selectedKeys={new Set([viewMode])}
                                    onSelectionChange={(keys) => {
                                        const k = Array.from(keys as Set<Key>)[0];
                                        if (k) setViewMode(k as "list" | "table");
                                    }}
                                    disallowEmptySelection
                                    aria-label="Alternar visualização"
                                >
                                    <ButtonGroupItem id="list" iconLeading={Menu02} aria-label="Lista" />
                                    <ButtonGroupItem id="table" iconLeading={Table} aria-label="Tabela" />
                                </ButtonGroup>
                            </div>
                        </div>
                    </div>

                    {visibleEmails.length === 0 ? (
                        <div className="rounded-xl bg-secondary_subtle px-6 py-16 text-center text-sm text-tertiary ring-1 ring-border-secondary">
                            Nenhum destinatário encontrado.
                        </div>
                    ) : viewMode === "list" ? (
                        <div className="flex flex-col gap-4">
                            {visibleEmails.map((email) => (
                                <RecipientCard
                                    key={email}
                                    email={email}
                                    quantity={emailOccurrences.get(email) ?? 1}
                                    hasCadastro={emailHasCadastro(email)}
                                    tickets={groupedItems.tickets}
                                    products={groupedItems.products}
                                    combos={groupedItems.combos}
                                    onEdit={() => handleEdit(email)}
                                    onRemove={() => handleRemove(email)}
                                />
                            ))}
                        </div>
                    ) : (
                        <RecipientTable
                            emails={visibleEmails}
                            occurrences={emailOccurrences}
                            items={[
                                ...groupedItems.tickets,
                                ...groupedItems.products,
                                ...groupedItems.combos,
                            ]}
                            onEdit={handleEdit}
                            onRemove={handleRemove}
                        />
                    )}

                    {visibleEmails.length > 0 && (
                        <div className="rounded-xl bg-primary ring-1 ring-border-secondary">
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
                    )}
                </main>
            </div>

            <EditEmailModal
                isOpen={editingEmail !== null}
                email={editingEmail ?? ""}
                onClose={() => setEditingEmail(null)}
                onSave={handleSaveEdit}
            />
            <ConfirmRemoveEmailModal
                isOpen={removingEmail !== null}
                email={removingEmail ?? ""}
                onClose={() => setRemovingEmail(null)}
                onConfirm={handleConfirmRemove}
            />
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Page header                                                       */
/* ------------------------------------------------------------------ */

interface PageHeaderProps {
    onBack: () => void;
    onSubmit: () => void;
}

const PageHeader = ({ onBack, onSubmit }: PageHeaderProps) => (
    <header className="relative flex items-center justify-between gap-3 px-6 py-6">
        <Button size="sm" color="secondary" iconLeading={ArrowLeft} onClick={onBack}>
            Destinatários
        </Button>
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-display-xs font-bold text-primary">
            Enviar cortesias
        </h1>
        <Button size="md" color="primary" onClick={onSubmit}>
            Enviar cortesias
        </Button>
    </header>
);

/* ------------------------------------------------------------------ */
/*  Recipient card                                                    */
/* ------------------------------------------------------------------ */

interface RecipientCardProps {
    email: string;
    quantity: number;
    hasCadastro: boolean;
    tickets: TicketItemDetails[];
    products: ProductItemDetails[];
    combos: ComboItemDetails[];
    onEdit: () => void;
    onRemove: () => void;
}

const RecipientCard = ({
    email,
    quantity,
    hasCadastro,
    tickets,
    products,
    combos,
    onEdit,
    onRemove,
}: RecipientCardProps) => (
    <div className="rounded-xl bg-secondary ring-1 ring-border-secondary">
        <header className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium text-primary">{email}</span>
                <Badge
                    size="sm"
                    type="pill-color"
                    color={hasCadastro ? "gray" : "warning"}
                >
                    {hasCadastro ? "Cadastrado" : "Sem cadastro"}
                </Badge>
            </div>
            <div className="flex shrink-0 items-center gap-1">
                {!hasCadastro && (
                    <ButtonUtility
                        size="xs"
                        color="tertiary"
                        icon={Edit01}
                        tooltip="Editar"
                        onClick={onEdit}
                    />
                )}
                <ButtonUtility
                    size="xs"
                    color="tertiary"
                    icon={Trash01}
                    tooltip="Remover"
                    onClick={onRemove}
                />
            </div>
        </header>
        <div className="mx-2 mb-2 rounded-lg bg-primary p-4">
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
                {tickets.map((t) => (
                    <TicketLine key={t.id} item={t} quantity={quantity} />
                ))}
                {products.map((p) => (
                    <ProductLine key={p.id} item={p} quantity={quantity} />
                ))}
                {combos.map((c) => (
                    <ComboLine key={c.id} item={c} quantity={quantity} />
                ))}
            </div>
        </div>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Item lines (per kind)                                             */
/* ------------------------------------------------------------------ */

const Quantity = ({ value = 1 }: { value?: number }) => (
    <span className="text-xs text-tertiary">{value}x</span>
);

const TicketLine = ({
    item,
    quantity = 1,
}: {
    item: TicketItemDetails;
    quantity?: number;
}) => (
    <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 items-baseline gap-1.5">
            <Quantity value={quantity} />
            <span className="truncate text-sm font-medium text-primary">
                {item.name} <span className="text-tertiary">- {item.ticketType}</span>
            </span>
        </div>
        <span className="truncate pl-5 text-xs text-tertiary">
            {item.groupName} · {item.sessionDate}
        </span>
    </div>
);

const ProductLine = ({
    item,
    quantity = 1,
}: {
    item: ProductItemDetails;
    quantity?: number;
}) => (
    <div className="flex min-w-0 items-center gap-2">
        <img
            src={item.imageUrl}
            alt=""
            className="size-8 shrink-0 rounded-md object-cover ring-1 ring-secondary"
        />
        <Quantity value={quantity} />
        <span className="truncate text-sm font-medium text-primary">{item.name}</span>
    </div>
);

const ComboLine = ({
    item,
    quantity = 1,
}: {
    item: ComboItemDetails;
    quantity?: number;
}) => (
    <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 items-baseline gap-1.5">
            <Quantity value={quantity} />
            <span className="truncate text-sm font-medium text-primary">{item.name}</span>
        </div>
        <span className="truncate pl-5 text-xs text-tertiary">{item.subtitle}</span>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Recipient table (alternative view)                                */
/* ------------------------------------------------------------------ */

interface RecipientTableProps {
    emails: string[];
    occurrences: Map<string, number>;
    items: ItemDetails[];
    onEdit: (email: string) => void;
    onRemove: (email: string) => void;
}

const RecipientTable = ({
    emails,
    occurrences,
    items,
    onEdit,
    onRemove,
}: RecipientTableProps) => (
    <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
        <table className="w-full border-collapse">
            <thead>
                <tr className="border-b border-secondary bg-secondary_subtle text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-tertiary">Destinatário</th>
                    <th className="px-4 py-3 text-xs font-semibold text-tertiary">Item</th>
                    <th className="px-4 py-3 text-xs font-semibold text-tertiary">Cadastro</th>
                    <th className="w-24 px-4 py-3" aria-label="Ações" />
                </tr>
            </thead>
            <tbody>
                {emails.flatMap((email, emailIndex) => {
                    const hasCadastro = emailHasCadastro(email);
                    const quantity = occurrences.get(email) ?? 1;
                    return items.map((item, itemIndex) => {
                        const isFirstItem = itemIndex === 0;
                        const isLastItemOfLastEmail =
                            itemIndex === items.length - 1 && emailIndex === emails.length - 1;
                        const isLastItemOfEmail = itemIndex === items.length - 1;
                        return (
                            <tr
                                key={`${email}::${item.id}`}
                                className={cx(
                                    "transition duration-100 ease-linear hover:bg-primary_hover",
                                    !isLastItemOfLastEmail && "border-b",
                                    isLastItemOfEmail ? "border-secondary" : "border-secondary/40",
                                )}
                            >
                                <td className="px-4 py-3 align-top">
                                    {isFirstItem && (
                                        <span className="text-sm font-medium text-primary">
                                            {email}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <span className="text-sm text-primary">
                                        <span className="text-tertiary">{quantity}x </span>
                                        {itemDisplayName(item)}
                                    </span>
                                    {itemDisplaySublabel(item) && (
                                        <p className="text-xs text-tertiary">
                                            {itemDisplaySublabel(item)}
                                        </p>
                                    )}
                                </td>
                                <td className="px-4 py-3 align-top">
                                    {isFirstItem && (
                                        <Badge
                                            size="sm"
                                            type="pill-color"
                                            color={hasCadastro ? "gray" : "warning"}
                                        >
                                            {hasCadastro ? "Cadastrado" : "Sem cadastro"}
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3 align-top text-right">
                                    {isFirstItem && (
                                        <div className="flex justify-end gap-1">
                                            {!hasCadastro && (
                                                <ButtonUtility
                                                    size="xs"
                                                    color="tertiary"
                                                    icon={Edit01}
                                                    tooltip="Editar"
                                                    onClick={() => onEdit(email)}
                                                />
                                            )}
                                            <ButtonUtility
                                                size="xs"
                                                color="tertiary"
                                                icon={Trash01}
                                                tooltip="Remover"
                                                onClick={() => onRemove(email)}
                                            />
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    });
                })}
            </tbody>
        </table>
    </div>
);

function itemDisplayName(item: ItemDetails): string {
    if (item.kind === "ticket") return `${item.name} - ${item.ticketType}`;
    return item.name;
}

function itemDisplaySublabel(item: ItemDetails): string | null {
    if (item.kind === "ticket") return `${item.groupName} · ${item.sessionDate}`;
    if (item.kind === "combo") return item.subtitle;
    return null;
}

