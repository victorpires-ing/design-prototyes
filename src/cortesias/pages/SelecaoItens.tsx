import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
    Calendar,
    CheckCircle,
    ChevronLeft,
    Package,
    SearchLg,
    ShoppingCart01,
    Users01,
} from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressFeaturedIconType } from "@/components/application/progress-steps/progress-types";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../components/Backstage";
import { CortesiaSelectionPanel } from "../components/CortesiaSelectionPanel";
import {
    COMBOS,
    MAX_SELECTIONS,
    PRODUCTS,
    SESSIONS,
    type ComboEntry,
    type ProductEntry,
    type SessionSection,
} from "../data/cortesia-items";
import { FeaturedIcon } from "../../components/foundations/featured-icon/featured-icon";

const steps: ProgressFeaturedIconType[] = [
    {
        title: "Itens",
        description: "Defina a quantidade e tipo de itens",
        status: "current",
        icon: ShoppingCart01,
    },
    {
        title: "Destinatários",
        description: "Escolha para quem vai enviar",
        status: "incomplete",
        icon: Users01,
    },
    {
        title: "Verificação final",
        description: "Revisão dos destinatários e itens",
        status: "incomplete",
        icon: CheckCircle,
    },
];

export function SelecaoItens() {
    const navigate = useNavigate();
    const location = useLocation();
    const initialSelection = (location.state as { itemIds?: string[] } | null)?.itemIds ?? [];

    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSelection));
    const [searchQuery, setSearchQuery] = useState("");

    const toggleSelection = useCallback((id: string, isSelected: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (isSelected) {
                if (next.size >= MAX_SELECTIONS) return prev;
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    }, []);

    const removeSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const removeManySelections = useCallback((ids: string[]) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const id of ids) next.delete(id);
            return next;
        });
    }, []);

    const canAdvance = selectedIds.size > 0;
    const reachedLimit = selectedIds.size >= MAX_SELECTIONS;

    const handleAdvance = useCallback(() => {
        if (!canAdvance) return;
        navigate("/backstage/destinatarios", {
            state: { itemIds: Array.from(selectedIds) },
        });
    }, [canAdvance, navigate, selectedIds]);

    const query = searchQuery.trim().toLowerCase();
    const matches = (text: string) => text.toLowerCase().includes(query);

    const filteredSessions = useMemo(() => {
        if (!query) return SESSIONS;
        return SESSIONS.map((session) => ({
            ...session,
            groups: session.groups
                .map((group) => ({
                    ...group,
                    tickets: group.tickets.filter(
                        (t) =>
                            matches(t.name) ||
                            matches(t.type) ||
                            matches(group.name) ||
                            matches(session.datetime),
                    ),
                }))
                .filter((g) => g.tickets.length > 0),
        })).filter((s) => s.groups.length > 0);
    }, [query]);

    const filteredProducts = useMemo(() => {
        if (!query) return PRODUCTS;
        return PRODUCTS.filter((p) => matches(p.name));
    }, [query]);

    const filteredCombos = useMemo(() => {
        if (!query) return COMBOS;
        return COMBOS.filter((c) => matches(c.name) || matches(c.subtitle));
    }, [query]);

    return (
        <BackstageLayout activeSection="cortesias" activeItem="emissao-cortesias">
            <div className="flex min-w-0 flex-1 flex-col">
                <PageHeader
                    canAdvance={canAdvance}
                    onAdvance={handleAdvance}
                    onBack={() => navigate("/")}
                />
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

                    <div className="flex w-full gap-6">
                        <section className="flex min-w-0 flex-1 flex-col gap-4">
                            <Input
                                icon={SearchLg}
                                label="Buscar itens"
                                placeholder="Busque por nome de grupo, item ou lote"
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />

                            {filteredSessions.map((session) => (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    selectedIds={selectedIds}
                                    onToggle={toggleSelection}
                                    reachedLimit={reachedLimit}
                                />
                            ))}

                            {filteredProducts.length > 0 && (
                                <ProductsCard
                                    products={filteredProducts}
                                    selectedIds={selectedIds}
                                    onToggle={toggleSelection}
                                    reachedLimit={reachedLimit}
                                />
                            )}

                            {filteredCombos.length > 0 && (
                                <CombosCard
                                    combos={filteredCombos}
                                    selectedIds={selectedIds}
                                    onToggle={toggleSelection}
                                    reachedLimit={reachedLimit}
                                />
                            )}

                            {filteredSessions.length === 0 &&
                                filteredProducts.length === 0 &&
                                filteredCombos.length === 0 && (
                                    <p className="rounded-lg bg-secondary px-4 py-8 text-center text-sm text-tertiary">
                                        Nenhum item corresponde à busca.
                                    </p>
                                )}
                        </section>

                        <CortesiaSelectionPanel
                            selectedIds={selectedIds}
                            onRemove={removeSelection}
                            onRemoveMany={removeManySelections}
                            className="lg:mt-[24px]"
                        />
                    </div>
                </main>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Page header                                                       */
/* ------------------------------------------------------------------ */

interface PageHeaderProps {
    canAdvance: boolean;
    onAdvance: () => void;
    onBack: () => void;
}

const PageHeader = ({ canAdvance, onAdvance, onBack }: PageHeaderProps) => (
    <header className="relative flex items-center justify-between gap-3 px-6 py-6">
        <ButtonUtility size="sm" color="secondary" icon={ChevronLeft} tooltip="Voltar" onClick={onBack} />
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-display-xs font-bold text-primary">
            Enviar cortesias
        </h1>
        <Button size="md" color="primary" isDisabled={!canAdvance} onClick={onAdvance}>
            Avançar
        </Button>
    </header>
);

/* ------------------------------------------------------------------ */
/*  Section card shell                                                */
/* ------------------------------------------------------------------ */

interface ItemCardShellProps {
    icon: React.FC<{ className?: string }>;
    title: string;
    children: React.ReactNode;
}

const ItemCardShell = ({ icon: Icon, title, children }: ItemCardShellProps) => (
    <div className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary">
        <header className="flex items-center gap-3 border-b border-secondary px-4 py-3">
            <FeaturedIcon icon={Icon} color="gray" size="sm" theme="modern" />
            <h3 className="text-sm font-semibold text-primary">{title}</h3>
        </header>
        <div className="flex flex-col gap-4 p-4">{children}</div>
    </div>
);

/* ------------------------------------------------------------------ */
/*  Session card                                                      */
/* ------------------------------------------------------------------ */

interface SessionCardProps {
    session: SessionSection;
    selectedIds: Set<string>;
    onToggle: (id: string, isSelected: boolean) => void;
    reachedLimit: boolean;
}

const SessionCard = ({ session, selectedIds, onToggle, reachedLimit }: SessionCardProps) => (
    <ItemCardShell icon={Calendar} title={session.datetime}>
        {session.groups.map((group) => (
            <div key={group.name} className="flex flex-col gap-2">
                <p className="text-sm font-semibold tracking-wide text-primary">
                    {group.name}
                </p>
                <div className="flex flex-col gap-1">
                    {group.tickets.map((ticket) => (
                        <div className="flex items-center" key={ticket.id}>
                            <CheckboxRow
                                id={ticket.id}
                                label={ticket.name}
                                sublabel={''}
                                isSelected={selectedIds.has(ticket.id)}
                                isDisabledByLimit={reachedLimit}
                                onToggle={onToggle}
                            />
                            <Badge type="pill-color" color="gray" size="sm">
                                {ticket.name}
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </ItemCardShell>
);

/* ------------------------------------------------------------------ */
/*  Products card                                                     */
/* ------------------------------------------------------------------ */

interface ProductsCardProps {
    products: ProductEntry[];
    selectedIds: Set<string>;
    onToggle: (id: string, isSelected: boolean) => void;
    reachedLimit: boolean;
}

const ProductsCard = ({ products, selectedIds, onToggle, reachedLimit }: ProductsCardProps) => (
    <ItemCardShell icon={ShoppingCart01} title="Produtos">
        <div className="flex flex-col gap-2">
            {products.map((product) => {
                const isSelected = selectedIds.has(product.id);
                const disabled = !isSelected && reachedLimit;
                return (
                    <label
                        key={product.id}
                        className={cx(
                            "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition duration-100 ease-linear hover:bg-primary_hover",
                            disabled && "cursor-not-allowed opacity-50",
                        )}
                    >
                        <Checkbox
                            isSelected={isSelected}
                            isDisabled={disabled}
                            onChange={(s) => onToggle(product.id, s)}
                        />
                        <img
                            src={product.imageUrl}
                            alt=""
                            className="size-9 shrink-0 rounded-md object-cover ring-1 ring-secondary"
                        />
                        <span className="text-sm font-medium text-primary">{product.name}</span>
                    </label>
                );
            })}
        </div>
    </ItemCardShell>
);

/* ------------------------------------------------------------------ */
/*  Combos card                                                       */
/* ------------------------------------------------------------------ */

interface CombosCardProps {
    combos: ComboEntry[];
    selectedIds: Set<string>;
    onToggle: (id: string, isSelected: boolean) => void;
    reachedLimit: boolean;
}

const CombosCard = ({ combos, selectedIds, onToggle, reachedLimit }: CombosCardProps) => (
    <ItemCardShell icon={Package} title="Combos">
        <div className="flex flex-col gap-4">
            {combos.map((combo) => {
                const isSelected = selectedIds.has(combo.id);
                const disabled = !isSelected && reachedLimit;
                return (
                    <div
                        key={combo.id}
                        className={cx(
                            "flex flex-col gap-2 rounded-lg bg-secondary_subtle",
                            disabled && "opacity-50",
                        )}
                    >
                        <label className="flex cursor-pointer items-start gap-3">
                            <Checkbox
                                isSelected={isSelected}
                                isDisabled={disabled}
                                onChange={(s) => onToggle(combo.id, s)}
                                label={
                                    <span className="flex flex-col gap-0.5">
                                        <span className="text-sm font-semibold text-primary">
                                            {combo.name}
                                        </span>
                                        <span className="text-xs font-normal text-tertiary">
                                            {combo.subtitle}
                                        </span>
                                    </span>
                                }
                            />
                        </label>
                        <ul className="flex flex-col gap-1.5 ml-4">
                            {combo.subItems.map((item, i) => (
                                <li
                                    key={`${combo.id}-${i}`}
                                    className="flex items-start gap-2 text-xs text-secondary"
                                >
                                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-tertiary text-[10px] font-semibold text-secondary">
                                        {i + 1}
                                    </span>
                                    <div className="flex flex-col">
                                        <span>
                                        <span className="font-medium text-primary">{item.name}</span>
                                        <span> - </span>
                                        <span className="text-secondary">{item.type}</span>
                                        </span>
                                        <span>{item.date}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    </ItemCardShell>
);

/* ------------------------------------------------------------------ */
/*  Checkbox row (shared for tickets)                                 */
/* ------------------------------------------------------------------ */

interface CheckboxRowProps {
    id: string;
    label: string;
    sublabel: string;
    isSelected: boolean;
    isDisabledByLimit: boolean;
    onToggle: (id: string, isSelected: boolean) => void;
}

const CheckboxRow = ({
    id,
    label,
    sublabel,
    isSelected,
    isDisabledByLimit,
    onToggle,
}: CheckboxRowProps) => {
    const disabled = !isSelected && isDisabledByLimit;
    return (
        <label
            className={cx(
                "flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition duration-100 ease-linear hover:bg-primary_hover",
                disabled && "cursor-not-allowed opacity-50",
            )}
        >
            <Checkbox
                isSelected={isSelected}
                isDisabled={disabled}
                onChange={(s) => onToggle(id, s)}
                label={
                    <span className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-primary">{label}</span>
                        <span className="text-xs font-normal text-tertiary">{sublabel}</span>
                    </span>
                }
            />
        </label>
    );
};
