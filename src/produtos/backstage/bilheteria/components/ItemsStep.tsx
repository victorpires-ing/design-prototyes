import { useMemo, useState } from "react";
import { Calendar, ChevronDown, FaceId, Package, QrCode01, SearchLg } from "@untitledui/icons";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { InputBase } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { combos, formatBRL, products, sessions, type ComboItem, type TicketItem } from "../data/catalogo";
import type { Cart } from "../data/carrinho";
import { QuantityStepper } from "./QuantityStepper";

export type ItemsTab = "ingressos" | "produtos" | "combos";

const TABS: Array<{ id: ItemsTab; label: string }> = [
    { id: "ingressos", label: "Ingressos" },
    { id: "produtos", label: "Produtos" },
    { id: "combos", label: "Combos" },
];

interface ItemsStepProps {
    cart: Cart;
    onQuantityChange: (id: string, quantity: number) => void;
    /** Identificação pulada — ingressos com acesso por facial não podem ser vendidos. */
    facialBlocked: boolean;
}

const matches = (term: string, ...fields: string[]) => {
    const query = term.trim().toLowerCase();
    if (!query) return true;
    return fields.some((field) => field.toLowerCase().includes(query));
};

export function ItemsStep({ cart, onQuantityChange, facialBlocked }: ItemsStepProps) {
    const [tab, setTab] = useState<ItemsTab>("ingressos");
    const [term, setTerm] = useState("");

    const visibleSessions = useMemo(
        () =>
            sessions
                .map((session) => ({
                    ...session,
                    tickets: session.tickets.filter((ticket) => matches(term, ticket.name, ticket.group, ticket.lote, session.label)),
                }))
                .filter((session) => session.tickets.length > 0),
        [term],
    );

    const visibleProducts = useMemo(() => products.filter((product) => matches(term, product.name)), [term]);
    const visibleCombos = useMemo(() => combos.filter((combo) => matches(term, combo.name, combo.group)), [term]);

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(key as ItemsTab)} className="md:w-auto md:shrink-0">
                    <TabList type="button-border" size="sm" items={TABS} className="max-md:w-full">
                        {(item) => <Tab {...item} className="max-md:flex-1" />}
                    </TabList>
                </Tabs>
                <div className="md:flex-1">
                    <InputBase
                        size="sm"
                        icon={SearchLg}
                        value={term}
                        aria-label="Buscar item"
                        onChange={(event) => setTerm(event.target.value)}
                        placeholder="Busque por nome de grupo, item"
                    />
                </div>
            </div>

            {tab === "ingressos" && (
                <div className="flex flex-col gap-3">
                    {visibleSessions.map((session, index) => (
                        <SessionAccordion
                            key={session.id}
                            label={session.label}
                            defaultOpen={index === 0}
                            tickets={session.tickets}
                            cart={cart}
                            facialBlocked={facialBlocked}
                            onQuantityChange={onQuantityChange}
                        />
                    ))}
                    {visibleSessions.length === 0 && <NoResults />}
                </div>
            )}

            {tab === "produtos" && (
                <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                    <div className="flex items-center gap-2 border-b border-secondary px-4 py-3">
                        <Package className="size-5 text-fg-quaternary" aria-hidden="true" />
                        <h2 className="text-md font-semibold text-primary">Produtos</h2>
                    </div>
                    {visibleProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 border-b border-secondary px-4 py-3 last:border-b-0">
                            <img
                                src={product.image}
                                alt=""
                                className="size-10 shrink-0 rounded-md object-cover ring-1 ring-border-secondary"
                            />
                            <div className="flex min-w-0 flex-1 flex-col">
                                <p className="truncate text-sm font-semibold text-primary">{product.name}</p>
                                <p className="text-sm font-semibold text-primary">{formatBRL(product.price)}</p>
                            </div>
                            <QuantityStepper
                                label={product.name}
                                value={cart[product.id] ?? 0}
                                onChange={(quantity) => onQuantityChange(product.id, quantity)}
                            />
                        </div>
                    ))}
                    {visibleProducts.length === 0 && <NoResults />}
                </div>
            )}

            {tab === "combos" && (
                <div className="flex flex-col gap-3">
                    {visibleCombos.map((combo, index) => (
                        <ComboCard
                            key={combo.id}
                            combo={combo}
                            defaultOpen={index === 0}
                            quantity={cart[combo.id] ?? 0}
                            onQuantityChange={(quantity) => onQuantityChange(combo.id, quantity)}
                        />
                    ))}
                    {visibleCombos.length === 0 && <NoResults />}
                </div>
            )}
        </div>
    );
}

const NoResults = () => (
    <p className="rounded-xl bg-primary px-4 py-8 text-center text-sm text-tertiary ring-1 ring-border-secondary">
        Nenhum item encontrado para a busca.
    </p>
);

interface SessionAccordionProps {
    label: string;
    tickets: TicketItem[];
    cart: Cart;
    defaultOpen: boolean;
    facialBlocked: boolean;
    onQuantityChange: (id: string, quantity: number) => void;
}

const SessionAccordion = ({ label, tickets, cart, defaultOpen, facialBlocked, onQuantityChange }: SessionAccordionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <section className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-expanded={isOpen}
                className={cx(
                    "flex w-full items-center gap-2 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover",
                    isOpen && "border-b border-secondary",
                )}
            >
                <Calendar className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                <span className="flex-1 text-md font-semibold text-primary">{label}</span>
                <ChevronDown
                    className={cx(
                        "size-5 shrink-0 text-fg-quaternary transition-transform duration-100 ease-linear",
                        isOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                />
            </button>

            {isOpen &&
                tickets.map((ticket) => {
                    const isBlocked = facialBlocked && ticket.access === "facial";
                    const AccessIcon = ticket.access === "facial" ? FaceId : QrCode01;

                    return (
                        <div
                            key={ticket.id}
                            className={cx(
                                "flex flex-col gap-2 border-b border-secondary px-4 py-4 last:border-b-0",
                                isBlocked && "opacity-50",
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <AccessIcon className="size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />
                                <p className="text-md font-semibold text-primary">{ticket.name}</p>
                            </div>
                            <p className="text-sm text-tertiary">{ticket.lote}</p>
                            <p className="text-sm text-tertiary">{ticket.description}</p>
                            {isBlocked && (
                                <p className="text-sm text-tertiary">Acesso por facial: indisponível sem identificação do comprador.</p>
                            )}
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-md font-semibold text-primary">{formatBRL(ticket.price)}</p>
                                <QuantityStepper
                                    label={ticket.name}
                                    isDisabled={isBlocked}
                                    value={isBlocked ? 0 : (cart[ticket.id] ?? 0)}
                                    onChange={(quantity) => onQuantityChange(ticket.id, quantity)}
                                />
                            </div>
                        </div>
                    );
                })}
        </section>
    );
};

interface ComboCardProps {
    combo: (typeof combos)[number];
    quantity: number;
    defaultOpen: boolean;
    onQuantityChange: (quantity: number) => void;
}

const ComboCard = ({ combo, quantity, defaultOpen, onQuantityChange }: ComboCardProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <section className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
            <div className="flex flex-col gap-2 px-4 py-4">
                <h3 className="text-md font-semibold text-primary">{combo.name}</h3>
                <div className="flex flex-wrap gap-2">
                    {combo.dates.map((date) => (
                        <span key={date} className="rounded-full px-2 py-0.5 text-sm text-tertiary ring-1 ring-border-secondary">
                            {date}
                        </span>
                    ))}
                </div>
                <p className="text-sm text-tertiary">{combo.description}</p>
                <div className="flex items-center justify-between gap-3">
                    <p className="text-md font-semibold text-primary">{formatBRL(combo.price)}</p>
                    <QuantityStepper label={combo.name} value={quantity} onChange={onQuantityChange} />
                </div>

                {isOpen && <ComboComposition entries={combo.composicao} />}
            </div>

            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-2 border-t border-secondary px-4 py-3 text-sm text-tertiary transition duration-100 ease-linear hover:bg-primary_hover"
            >
                Detalhes
                <ChevronDown
                    className={cx("size-5 transition-transform duration-100 ease-linear", isOpen && "rotate-180")}
                    aria-hidden="true"
                />
            </button>
        </section>
    );
};

/** Composição do combo — recuo com fio vertical à esquerda, como no design. */
export const ComboComposition = ({ entries }: { entries: ComboItem["composicao"] }) => (
    <ul className="mt-1 flex flex-col gap-2 border-l border-primary pl-2">
        {entries.map((entry, index) => (
            <li key={index} className="flex gap-2 text-sm">
                <span className="shrink-0 text-tertiary">{entry.quantity}x</span>
                <span className="flex min-w-0 flex-col">
                    <span className="text-secondary">
                        {entry.ticketName} <span className="text-tertiary">• {entry.loteName}</span>
                    </span>
                    <span className="text-quaternary">{entry.date}</span>
                </span>
            </li>
        ))}
    </ul>
);
