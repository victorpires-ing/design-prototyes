import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    Package,
    SearchLg,
    ShoppingCart01,
    Ticket01,
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
import { BackstageLayout } from "../../components/Backstage";
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
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

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
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

    const toggleAccordion = useCallback((id: string) => {
        setOpenAccordions((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

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

                            {filteredSessions.length > 0 && (
                                <AccordionShell
                                    icon={Ticket01}
                                    title="Ingressos"
                                    isOpen={query !== "" || openAccordions.has("ingressos")}
                                    onToggle={() => toggleAccordion("ingressos")}
                                >
                                    <div className="flex flex-col gap-3">
                                        {filteredSessions.map((session) => (
                                            <NestedAccordion
                                                key={session.id}
                                                icon={Calendar}
                                                title={session.datetime}
                                                isOpen={
                                                    query !== "" ||
                                                    openAccordions.has(`session-${session.id}`)
                                                }
                                                onToggle={() =>
                                                    toggleAccordion(`session-${session.id}`)
                                                }
                                            >
                                                <SessionContent
                                                    session={session}
                                                    selectedIds={selectedIds}
                                                    onToggle={toggleSelection}
                                                    reachedLimit={reachedLimit}
                                                />
                                            </NestedAccordion>
                                        ))}
                                    </div>
                                </AccordionShell>
                            )}

                            {filteredCombos.length > 0 && (
                                <AccordionShell
                                    icon={Package}
                                    title="Combos"
                                    isOpen={query !== "" || openAccordions.has("combos")}
                                    onToggle={() => toggleAccordion("combos")}
                                >
                                    <CombosContent
                                        combos={filteredCombos}
                                        selectedIds={selectedIds}
                                        onToggle={toggleSelection}
                                        reachedLimit={reachedLimit}
                                    />
                                </AccordionShell>
                            )}

                            {filteredProducts.length > 0 && (
                                <AccordionShell
                                    icon={ShoppingCart01}
                                    title="Produtos"
                                    isOpen={query !== "" || openAccordions.has("produtos")}
                                    onToggle={() => toggleAccordion("produtos")}
                                >
                                    <ProductsContent
                                        products={filteredProducts}
                                        selectedIds={selectedIds}
                                        onToggle={toggleSelection}
                                        reachedLimit={reachedLimit}
                                    />
                                </AccordionShell>
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
/*  Accordion primitives                                              */
/* ------------------------------------------------------------------ */

interface AccordionShellProps {
    icon: React.FC<{ className?: string }>;
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const AccordionShell = ({ icon: Icon, title, isOpen, onToggle, children }: AccordionShellProps) => (
    <div className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary">
        <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className={cx(
                "flex items-center gap-3 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover",
                isOpen && "border-b border-secondary",
            )}
        >
            <FeaturedIcon icon={Icon} color="gray" size="sm" theme="modern" />
            <h3 className="flex-1 text-sm font-semibold text-primary">{title}</h3>
            <ChevronDown
                aria-hidden="true"
                className={cx(
                    "size-4 shrink-0 text-fg-quaternary transition-transform duration-150",
                    isOpen && "rotate-180",
                )}
            />
        </button>
        {isOpen && <div className="flex flex-col gap-4 p-4">{children}</div>}
    </div>
);

interface NestedAccordionProps {
    icon: React.FC<{ className?: string }>;
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const NestedAccordion = ({ icon: Icon, title, isOpen, onToggle, children }: NestedAccordionProps) => (
    <div className="flex flex-col rounded-lg bg-secondary_subtle ring-1 ring-border-secondary">
        <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            className={cx(
                "flex items-center gap-2 px-3 py-2.5 text-left transition duration-100 ease-linear hover:bg-secondary",
                isOpen && "border-b border-secondary",
            )}
        >
            <Icon className="size-4 text-fg-quaternary" />
            <h4 className="flex-1 text-sm font-medium text-primary">{title}</h4>
            <ChevronDown
                aria-hidden="true"
                className={cx(
                    "size-4 shrink-0 text-fg-quaternary transition-transform duration-150",
                    isOpen && "rotate-180",
                )}
            />
        </button>
        {isOpen && <div className="flex flex-col gap-4 p-3">{children}</div>}
    </div>
);

/* ------------------------------------------------------------------ */
/*  Section content (no wrapper, used inside accordions)              */
/* ------------------------------------------------------------------ */

interface SessionContentProps {
    session: SessionSection;
    selectedIds: Set<string>;
    onToggle: (id: string, isSelected: boolean) => void;
    reachedLimit: boolean;
}

const SessionContent = ({ session, selectedIds, onToggle, reachedLimit }: SessionContentProps) => (
    <>
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
                                sublabel={""}
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
    </>
);

interface ProductsContentProps {
    products: ProductEntry[];
    selectedIds: Set<string>;
    onToggle: (id: string, isSelected: boolean) => void;
    reachedLimit: boolean;
}

const ProductsContent = ({ products, selectedIds, onToggle, reachedLimit }: ProductsContentProps) => (
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
                        onChange={(s: boolean) => onToggle(product.id, s)}
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
);

interface CombosContentProps {
    combos: ComboEntry[];
    selectedIds: Set<string>;
    onToggle: (id: string, isSelected: boolean) => void;
    reachedLimit: boolean;
}

const CombosContent = ({ combos, selectedIds, onToggle, reachedLimit }: CombosContentProps) => (
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
                            onChange={(s: boolean) => onToggle(combo.id, s)}
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
