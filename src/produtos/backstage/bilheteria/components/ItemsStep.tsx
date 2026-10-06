import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronLeft, ChevronRight, FaceId, Package, QrCode01, SearchLg } from "@untitledui/icons";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { InputBase } from "@/components/base/input/input";
import { Badge } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { formatBRL, products, sessions, type ComboItem, type TicketItem, type TicketSession } from "../data/catalogo";
import type { Cart } from "../data/carrinho";
import { QuantityStepper } from "./QuantityStepper";

export type ItemsTab = "ingressos" | "produtos";

const TABS: Array<{ id: ItemsTab; label: string }> = [
    { id: "ingressos", label: "Ingressos" },
    { id: "produtos", label: "Produtos" },
];

interface ItemsStepProps {
    cart: Cart;
    onQuantityChange: (id: string, quantity: number) => void;
    /** Identificação pulada — ingressos com acesso por face não podem ser vendidos. */
    facialBlocked: boolean;
    /**
     * Quantos ingressos ainda cabem no limite do evento. `undefined` quando não
     * há limite: venda sem identificação, ou evento sem limite configurado.
     * Ao zerar, o + dos ingressos trava, em vez de deixar passar e acusar depois.
     */
    ingressosRestantes?: number;
}

const matches = (term: string, ...fields: string[]) => {
    const query = term.trim().toLowerCase();
    if (!query) return true;
    return fields.some((field) => field.toLowerCase().includes(query));
};

export function ItemsStep({ cart, onQuantityChange, facialBlocked, ingressosRestantes }: ItemsStepProps) {
    const [tab, setTab] = useState<ItemsTab>("ingressos");
    const [term, setTerm] = useState("");
    const [sessionId, setSessionId] = useState(sessions[0].id);

    /*
      Direção do slide: a aba nova entra do lado para onde o dedo foi, e a antiga
      sai pelo lado oposto. Sem isso a troca pisca no lugar e não diz nada.
    */
    const tabIndex = TABS.findIndex((item) => item.id === tab);
    const previousTabIndex = useRef(tabIndex);
    const direction = tabIndex >= previousTabIndex.current ? 1 : -1;
    useEffect(() => {
        previousTabIndex.current = tabIndex;
    }, [tabIndex]);

    /*
      A busca filtra dentro de cada data, não entre elas: o carrossel continua
      mostrando a agenda inteira e marca quais datas têm resultado, para o
      operador não achar que o item sumiu do evento.
    */
    const filteredSessions = useMemo(
        () =>
            sessions.map((session) => ({
                ...session,
                tickets: session.tickets.filter((ticket) => matches(term, ticket.name, ticket.group, ticket.lote, session.label)),
            })),
        [term],
    );

    const selectedSession = filteredSessions.find((session) => session.id === sessionId) ?? filteredSessions[0];

    /** Quantas outras datas têm resultado — evita concluir que o item sumiu do evento. */
    const outrasDatasComResultado = filteredSessions.filter(
        (session) => session.id !== selectedSession.id && session.tickets.length > 0,
    ).length;

    /** Ingressos da data escolhida, agrupados pelo nome do grupo, na ordem do catálogo. */
    const ticketGroups = useMemo(() => {
        const groups = new Map<string, TicketItem[]>();
        for (const ticket of selectedSession.tickets) {
            const current = groups.get(ticket.group);
            if (current) current.push(ticket);
            else groups.set(ticket.group, [ticket]);
        }
        return [...groups.entries()].map(([name, items]) => ({ name, items }));
    }, [selectedSession]);

    const visibleProducts = useMemo(() => products.filter((product) => matches(term, product.name)), [term]);

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

            <div className="overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, x: direction * 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -24 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                        {tab === "ingressos" ? (
                        <div className="flex flex-col gap-4">
                            <DateCarousel
                                sessions={filteredSessions}
                                selectedId={selectedSession.id}
                                isFiltering={term.trim().length > 0}
                                onSelect={setSessionId}
                            />

                            <div className="flex flex-col gap-3">
                                {ticketGroups.map((group) => (
                                    <GroupAccordion
                                        key={group.name}
                                        name={group.name}
                                        tickets={group.items}
                                        cart={cart}
                                        facialBlocked={facialBlocked}
                                        ingressosRestantes={ingressosRestantes}
                                        onQuantityChange={onQuantityChange}
                                    />
                                ))}
                                {ticketGroups.length === 0 && (
                                    <NoResults
                                        message={
                                            outrasDatasComResultado > 0
                                                ? `Nenhum item nesta data. A busca encontrou resultados em ${outrasDatasComResultado === 1 ? "outra data" : `outras ${outrasDatasComResultado} datas`}.`
                                                : "Nenhum item encontrado para a busca."
                                        }
                                    />
                                )}
                            </div>
                        </div>
                        ) : (
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
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

const NoResults = ({ message = "Nenhum item encontrado para a busca." }: { message?: string }) => (
    <p className="rounded-xl bg-primary px-4 py-8 text-center text-sm text-tertiary ring-1 ring-border-secondary">{message}</p>
);

interface DateCarouselProps {
    sessions: TicketSession[];
    selectedId: string;
    /** Com busca ativa, as datas sem resultado ficam sinalizadas. */
    isFiltering: boolean;
    onSelect: (id: string) => void;
}

/** Carrossel horizontal de datas — uma data por vez, rolagem por toque ou pelas setas. */
const DateCarousel = ({ sessions, selectedId, isFiltering, onSelect }: DateCarouselProps) => {
    const trackRef = useRef<HTMLDivElement>(null);
    /* Seta só aparece quando há data para aquele lado — sem botão que não leva a lugar nenhum. */
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);

    const syncArrows = () => {
        const track = trackRef.current;
        if (!track) return;
        setHasPrevious(track.scrollLeft > 1);
        setHasNext(Math.ceil(track.scrollLeft + track.clientWidth) < track.scrollWidth);
    };

    useEffect(() => {
        syncArrows();
        const track = trackRef.current;
        if (!track) return;
        const observer = new ResizeObserver(syncArrows);
        observer.observe(track);
        return () => observer.disconnect();
    }, [sessions.length]);

    const scrollBy = (direction: 1 | -1) => {
        const track = trackRef.current;
        if (!track) return;
        track.scrollBy({ left: direction * Math.max(track.clientWidth * 0.8, 160), behavior: "smooth" });
    };

    return (
        <div className="flex items-center gap-2">
            {hasPrevious && (
                <ButtonUtility
                    size="xs"
                    color="tertiary"
                    icon={ChevronLeft}
                    tooltip="Datas anteriores"
                    onClick={() => scrollBy(-1)}
                    className="shrink-0 max-md:hidden"
                />
            )}

            <div
                ref={trackRef}
                role="radiogroup"
                aria-label="Data da sessão"
                onScroll={syncArrows}
                className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {sessions.map((session) => {
                    const isSelected = session.id === selectedId;
                    const isEmpty = isFiltering && session.tickets.length === 0;

                    return (
                        <button
                            key={session.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            disabled={session.soldOut}
                            onClick={() => onSelect(session.id)}
                            className={cx(
                                "flex h-[72px] w-[87px] shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-center transition duration-100 ease-linear",
                                /*
                                  O chip escolhido inverte em relação à superfície: os tokens alpha
                                  viram branco no dark, que é o chip claro do design, e preto no light.
                                */
                                isSelected
                                    ? "bg-alpha-black text-alpha-white"
                                    : "bg-secondary text-primary ring-1 ring-border-secondary",
                                session.soldOut && "cursor-not-allowed opacity-60",
                                isEmpty && !isSelected && "opacity-50",
                            )}
                        >
                            <span className={cx("text-sm", isSelected ? "text-alpha-white/70" : "text-tertiary")}>
                                {session.weekday}
                            </span>
                            <span className="text-md font-semibold">
                                {session.day} {session.month}
                            </span>
                            {session.soldOut ? (
                                <span className="rounded-md bg-tertiary px-1.5 text-sm text-secondary">Esgotado</span>
                            ) : (
                                <span className={cx("text-sm", isSelected ? "text-alpha-white/70" : "text-tertiary")}>
                                    {session.year}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {hasNext && (
                <ButtonUtility
                    size="xs"
                    color="tertiary"
                    icon={ChevronRight}
                    tooltip="Próximas datas"
                    onClick={() => scrollBy(1)}
                    className="shrink-0 max-md:hidden"
                />
            )}
        </div>
    );
};

interface GroupAccordionProps {
    name: string;
    tickets: TicketItem[];
    cart: Cart;
    facialBlocked: boolean;
    ingressosRestantes?: number;
    onQuantityChange: (id: string, quantity: number) => void;
}

/** Ingressos da data selecionada, reunidos sob o nome do grupo. */
const GroupAccordion = ({ name, tickets, cart, facialBlocked, ingressosRestantes, onQuantityChange }: GroupAccordionProps) => {
    const [isOpen, setIsOpen] = useState(true);

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
                <span className="flex-1 text-md font-semibold text-primary">{name}</span>
                <Badge size="sm" type="pill-color" color="gray">
                    {tickets.length}
                </Badge>
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
                            <div className="flex flex-wrap items-center gap-2">
                                <AccessIcon className="size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />
                                <p className="text-md font-semibold text-primary">{ticket.name}</p>
                                {/* Deixa claro na lista por que o item não pode ser vendido. */}
                                {isBlocked && (
                                    <Badge size="sm" type="pill-color" color="gray">
                                        Bloqueado
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-tertiary">{ticket.lote}</p>
                            <p className="text-sm text-tertiary">{ticket.description}</p>
                            {isBlocked && (
                                <p className="text-sm text-tertiary">Acesso por face: indisponível sem identificação do comprador.</p>
                            )}
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-md font-semibold text-primary">{formatBRL(ticket.price)}</p>
                                <QuantityStepper
                                    label={ticket.name}
                                    isDisabled={isBlocked}
                                    value={isBlocked ? 0 : (cart[ticket.id] ?? 0)}
                                    maxValue={
                                        ingressosRestantes === undefined
                                            ? undefined
                                            : (cart[ticket.id] ?? 0) + ingressosRestantes
                                    }
                                    onChange={(quantity) => onQuantityChange(ticket.id, quantity)}
                                />
                            </div>
                        </div>
                    );
                })}
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
