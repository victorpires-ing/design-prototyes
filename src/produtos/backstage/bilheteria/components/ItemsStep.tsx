import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { ChevronDown, ChevronLeft, ChevronRight, FaceId, Package, QrCode01, SearchLg, Ticket02 } from "@untitledui/icons";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { InputBase } from "@/components/base/input/input";
import { Badge } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { comboCategories, formatBRL, products, sessions, type ComboItem, type TicketItem, type TicketSession } from "../data/catalogo";
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

/*
  Direção do slide: o conteúdo novo entra do lado para onde o operador foi
  (aba, data ou agrupador à direita entra pela direita) e o antigo sai pelo
  lado oposto. Sem isso a troca pisca no lugar e não diz nada.
*/
const useDirection = (index: number) => {
    const previous = useRef(index);
    const direction = index >= previous.current ? 1 : -1;
    useEffect(() => {
        previous.current = index;
    }, [index]);
    return direction;
};

/** Chave da data de uma sessão: sessões no mesmo dia dividem o chip do carrossel. */
const dayKey = (session: { day: string; month: string; year: string }) => `dia-${session.year}-${session.month}-${session.day}`;

/** Itens agrupados pelo nome do grupo (Pista, Camarote…), na ordem do catálogo. */
const groupByName = <T extends { group: string }>(items: T[]) => {
    const groups = new Map<string, T[]>();
    for (const item of items) {
        const current = groups.get(item.group);
        if (current) current.push(item);
        else groups.set(item.group, [item]);
    }
    return [...groups.entries()].map(([name, entries]) => ({ name, items: entries }));
};

/** Quando a busca esvazia o agrupador escolhido, diz se há resultado nos outros. */
const emptyMessage = (others: number, here: string, one: string, many: (count: number) => string) =>
    others > 0 ? `Nenhum item ${here}. A busca encontrou resultados em ${others === 1 ? one : many(others)}.` : "Nenhum item encontrado para a busca.";

export function ItemsStep({ cart, onQuantityChange, facialBlocked, ingressosRestantes }: ItemsStepProps) {
    const [tab, setTab] = useState<ItemsTab>("ingressos");
    const [term, setTerm] = useState("");
    const [dayId, setDayId] = useState(dayKey(sessions[0]));
    /* Horário escolhido em cada data: voltar a uma data reabre o horário que estava nela. */
    const [timeByDay, setTimeByDay] = useState<Record<string, string>>({});
    const [categoryId, setCategoryId] = useState(comboCategories.find((category) => !category.soldOut)?.id ?? comboCategories[0].id);
    const isFiltering = term.trim().length > 0;

    const direction = useDirection(TABS.findIndex((item) => item.id === tab));

    /*
      A busca filtra dentro de cada data, não entre elas: o carrossel continua
      mostrando a agenda inteira e marca quais datas têm resultado, para o
      operador não achar que o item sumiu do evento. Os agrupadores de combo
      seguem a mesma regra.
    */
    const filteredSessions = useMemo(
        () =>
            sessions.map((session) => ({
                ...session,
                tickets: session.tickets.filter((ticket) => matches(term, ticket.name, ticket.group, ticket.lote, session.label)),
            })),
        [term],
    );
    /* O carrossel mostra cada data uma vez; os horários dela ficam no seletor logo abaixo. */
    const days = useMemo(() => {
        const byDay = new Map<string, typeof filteredSessions>();
        for (const session of filteredSessions) {
            const key = dayKey(session);
            byDay.set(key, [...(byDay.get(key) ?? []), session]);
        }
        return [...byDay.entries()].map(([id, daySessions]) => ({
            id,
            weekday: daySessions[0].weekday,
            day: daySessions[0].day,
            month: daySessions[0].month,
            year: daySessions[0].year,
            soldOut: daySessions.every((session) => session.soldOut),
            sessions: daySessions,
        }));
    }, [filteredSessions]);
    const selectedDay = days.find((day) => day.id === dayId) ?? days[0];
    const selectedSession =
        selectedDay.sessions.find((session) => session.id === timeByDay[selectedDay.id]) ??
        selectedDay.sessions.find((session) => !session.soldOut) ??
        selectedDay.sessions[0];
    const dayDirection = useDirection(days.findIndex((day) => day.id === selectedDay.id));
    const timeDirection = useDirection(selectedDay.sessions.findIndex((session) => session.id === selectedSession.id));
    const ticketGroups = useMemo(() => groupByName(selectedSession.tickets), [selectedSession]);
    const otherSessionsWithResults = filteredSessions.filter((session) => session.id !== selectedSession.id && session.tickets.length > 0).length;

    const filteredCategories = useMemo(
        () =>
            comboCategories.map((category) => ({
                ...category,
                combos: category.combos.filter((item) => matches(term, item.name, item.group, category.name)),
            })),
        [term],
    );
    const selectedCategory = filteredCategories.find((category) => category.id === categoryId) ?? filteredCategories[0];
    const categoryDirection = useDirection(filteredCategories.findIndex((category) => category.id === selectedCategory.id));
    const comboGroups = useMemo(() => groupByName(selectedCategory.combos), [selectedCategory]);
    const otherCategoriesWithResults = filteredCategories.filter(
        (category) => category.id !== selectedCategory.id && category.combos.length > 0,
    ).length;

    const visibleProducts = useMemo(() => products.filter((product) => matches(term, product.name)), [term]);

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-6">
            {/* Busca à esquerda e abas à direita, na mesma altura: as abas esticam até a altura do campo. */}
            <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-12">
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
                <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(key as ItemsTab)} className="md:w-auto md:shrink-0">
                    <TabList type="button-border" size="sm" items={TABS} className="max-md:w-full md:h-full">
                        {(item) => <Tab {...item} className="max-md:flex-1 md:h-full md:py-0" />}
                    </TabList>
                </Tabs>
            </div>

            <div className="overflow-hidden">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                    <motion.div key={tab} custom={direction} variants={SLIDE_FADE} initial="enter" animate="center" exit="exit" transition={TRANSICAO}>
                        {tab === "ingressos" && (
                            <div className="flex flex-col gap-4">
                                <ChipCarousel
                                    items={days}
                                    selectedId={selectedDay.id}
                                    ariaLabel="Data da sessão"
                                    previousLabel="Datas anteriores"
                                    nextLabel="Próximas datas"
                                    isEmpty={(day) => isFiltering && day.sessions.every((session) => session.tickets.length === 0)}
                                    onSelect={setDayId}
                                    chipClassName="w-[87px]"
                                    renderChip={(day, isSelected) => (
                                        <>
                                            <ChipCaption isSelected={isSelected}>{day.weekday}</ChipCaption>
                                            <span className="text-md font-semibold">
                                                {day.day} {day.month}
                                            </span>
                                            {day.soldOut ? <SoldOutTag /> : <ChipCaption isSelected={isSelected}>{day.year}</ChipCaption>}
                                        </>
                                    )}
                                />

                                {/* A data nova traz os horários dela; trocar só o horário desliza apenas a lista. */}
                                <AnimatePresence mode="wait" initial={false} custom={dayDirection}>
                                    <motion.div
                                        key={selectedDay.id}
                                        custom={dayDirection}
                                        variants={SLIDE_FADE}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={TRANSICAO}
                                        className="flex flex-col gap-4"
                                    >
                                        <TimeSelector
                                            sessions={selectedDay.sessions}
                                            selectedId={selectedSession.id}
                                            cart={cart}
                                            isFiltering={isFiltering}
                                            onSelect={(id) => setTimeByDay((current) => ({ ...current, [selectedDay.id]: id }))}
                                        />

                                        <AnimatePresence mode="wait" initial={false} custom={timeDirection}>
                                            <motion.div
                                                key={selectedSession.id}
                                                custom={timeDirection}
                                                variants={SLIDE_FADE}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={TRANSICAO}
                                                className="flex flex-col gap-3"
                                            >
                                                {ticketGroups.map((group) => (
                                                    <GroupAccordion key={group.name} name={group.name}>
                                                        {group.items.map((ticket) => (
                                                            <TicketRow
                                                                key={ticket.id}
                                                                ticket={ticket}
                                                                cart={cart}
                                                                facialBlocked={facialBlocked}
                                                                ingressosRestantes={ingressosRestantes}
                                                                onQuantityChange={onQuantityChange}
                                                            />
                                                        ))}
                                                    </GroupAccordion>
                                                ))}
                                                {ticketGroups.length === 0 && (
                                                    <NoResults
                                                        message={emptyMessage(otherSessionsWithResults, "neste horário", "outro horário", (count) => `outros ${count} horários`)}
                                                    />
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        )}

                        {tab === "combos" && (
                            <div className="flex flex-col gap-4">
                                <ChipCarousel
                                    items={filteredCategories}
                                    selectedId={selectedCategory.id}
                                    ariaLabel="Agrupador de combos"
                                    previousLabel="Agrupadores anteriores"
                                    nextLabel="Próximos agrupadores"
                                    isEmpty={(category) => isFiltering && category.combos.length === 0}
                                    onSelect={setCategoryId}
                                    /* Nome no lugar da data: o chip cresce com o nome, até duas linhas. */
                                    chipClassName="min-w-[87px] max-w-[160px] px-3"
                                    renderChip={(category) => (
                                        <>
                                            <span className="line-clamp-2 text-md font-semibold">{category.name}</span>
                                            {category.soldOut && <SoldOutTag />}
                                        </>
                                    )}
                                />

                                <AnimatePresence mode="wait" initial={false} custom={categoryDirection}>
                                    <motion.div
                                        key={selectedCategory.id}
                                        custom={categoryDirection}
                                        variants={SLIDE_FADE}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={TRANSICAO}
                                        className="flex flex-col gap-3"
                                    >
                                        {comboGroups.map((group) => (
                                            <GroupAccordion key={group.name} name={group.name}>
                                                {group.items.map((item) => (
                                                    <ComboRow key={item.id} combo={item} cart={cart} onQuantityChange={onQuantityChange} />
                                                ))}
                                            </GroupAccordion>
                                        ))}
                                        {comboGroups.length === 0 && (
                                            <NoResults
                                                message={emptyMessage(otherCategoriesWithResults, "neste agrupador", "outro agrupador", (count) => `outros ${count} agrupadores`)}
                                            />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
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
                                        <img src={product.image} alt="" className="size-10 shrink-0 rounded-md object-cover ring-1 ring-border-secondary" />
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

const TRANSICAO = { duration: 0.18, ease: "easeOut" } as const;

/*
  Variantes com `custom`: quem sai também recebe a direção da troca atual, e não
  a da troca anterior, que é o que ficaria gravado nas props do elemento que saiu.
*/
const SLIDE_FADE: Variants = {
    enter: (direction: number) => ({ opacity: 0, x: direction * 24 }),
    center: { opacity: 1, x: 0 },
    exit: (direction: number) => ({ opacity: 0, x: direction * -24 }),
};

/*
  A seta entra deslizando do próprio lado e abre o espaço aos poucos (largura e
  margem), para o carrossel não pular quando ela aparece ou some. O recorte vale
  só durante a animação: parada, a seta precisa mostrar o anel de foco inteiro.
*/
const SetaAnimada = ({ lado, children }: { lado: -1 | 1; children: ReactNode }) => {
    const [recortar, setRecortar] = useState(false);
    const fechada = { opacity: 0, x: lado * 8, width: 0, marginLeft: 0, marginRight: 0 };
    return (
        <motion.div
            initial={fechada}
            animate={{ opacity: 1, x: 0, width: "auto", marginLeft: lado === 1 ? 8 : 0, marginRight: lado === -1 ? 8 : 0 }}
            exit={fechada}
            transition={TRANSICAO}
            onAnimationStart={() => setRecortar(true)}
            onAnimationComplete={() => setRecortar(false)}
            className={cx("shrink-0 max-md:hidden", recortar && "overflow-hidden")}
        >
            {children}
        </motion.div>
    );
};

const NoResults = ({ message = "Nenhum item encontrado para a busca." }: { message?: string }) => (
    <p className="rounded-xl bg-primary px-4 py-8 text-center text-sm text-tertiary ring-1 ring-border-secondary">{message}</p>
);

const ChipCaption = ({ isSelected, children }: { isSelected: boolean; children: ReactNode }) => (
    <span className={cx("text-sm", isSelected ? "text-alpha-white/70" : "text-tertiary")}>{children}</span>
);

const SoldOutTag = () => <span className="rounded-md bg-tertiary px-1.5 text-sm text-secondary">Esgotado</span>;

interface ChipCarouselProps<T extends { id: string; soldOut?: boolean }> {
    items: T[];
    selectedId: string;
    ariaLabel: string;
    previousLabel: string;
    nextLabel: string;
    /** Com busca ativa, os chips sem resultado ficam sinalizados. */
    isEmpty: (item: T) => boolean;
    onSelect: (id: string) => void;
    /** Largura do chip: fixa para datas, flexível para nomes. */
    chipClassName?: string;
    renderChip: (item: T, isSelected: boolean) => ReactNode;
}

/** Carrossel horizontal de chips (datas ou agrupadores) — um por vez, rolagem por toque ou pelas setas. */
const ChipCarousel = <T extends { id: string; soldOut?: boolean }>({
    items,
    selectedId,
    ariaLabel,
    previousLabel,
    nextLabel,
    isEmpty,
    onSelect,
    chipClassName,
    renderChip,
}: ChipCarouselProps<T>) => {
    const trackRef = useRef<HTMLDivElement>(null);
    /* Seta só aparece quando há chip para aquele lado — sem botão que não leva a lugar nenhum. */
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
    }, [items.length]);

    const scrollBy = (direction: 1 | -1) => {
        const track = trackRef.current;
        if (!track) return;
        track.scrollBy({ left: direction * Math.max(track.clientWidth * 0.8, 160), behavior: "smooth" });
    };

    return (
        <div className="flex items-center">
            <AnimatePresence initial={false}>
                {hasPrevious && (
                    <SetaAnimada key="anteriores" lado={-1}>
                        <ButtonUtility size="xs" color="tertiary" icon={ChevronLeft} tooltip={previousLabel} onClick={() => scrollBy(-1)} />
                    </SetaAnimada>
                )}
            </AnimatePresence>

            <div
                ref={trackRef}
                role="radiogroup"
                aria-label={ariaLabel}
                onScroll={syncArrows}
                className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {items.map((item) => {
                    const isSelected = item.id === selectedId;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            disabled={item.soldOut}
                            onClick={() => onSelect(item.id)}
                            className={cx(
                                "flex h-[72px] shrink-0 snap-start flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-center transition duration-100 ease-linear",
                                chipClassName,
                                /*
                                  O chip escolhido inverte em relação à superfície: os tokens alpha
                                  viram branco no dark, que é o chip claro do design, e preto no light.
                                */
                                isSelected ? "bg-alpha-black text-alpha-white" : "bg-secondary text-primary ring-1 ring-border-secondary",
                                item.soldOut && "cursor-not-allowed opacity-60",
                                isEmpty(item) && !isSelected && "opacity-50",
                            )}
                        >
                            {renderChip(item, isSelected)}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence initial={false}>
                {hasNext && (
                    <SetaAnimada key="proximas" lado={1}>
                        <ButtonUtility size="xs" color="tertiary" icon={ChevronRight} tooltip={nextLabel} onClick={() => scrollBy(1)} />
                    </SetaAnimada>
                )}
            </AnimatePresence>
        </div>
    );
};

interface TimeSelectorProps {
    sessions: TicketSession[];
    selectedId: string;
    cart: Cart;
    /** Com busca ativa, os horários sem resultado ficam sinalizados. */
    isFiltering: boolean;
    onSelect: (id: string) => void;
}

/**
 * Horários da data escolhida, como no marketplace: abas sublinhadas com a
 * quantidade já no carrinho de cada horário. Horário esgotado fica riscado e
 * não pode ser escolhido.
 */
const TimeSelector = ({ sessions: daySessions, selectedId, cart, isFiltering, onSelect }: TimeSelectorProps) => (
    <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-secondary">Horários disponíveis</p>
        <Tabs
            selectedKey={selectedId}
            onSelectionChange={(key) => onSelect(String(key))}
            disabledKeys={daySessions.filter((session) => session.soldOut).map((session) => session.id)}
        >
            <TabList type="underline" size="sm" aria-label="Horário da sessão" className="overflow-x-auto [scrollbar-width:none]">
                {daySessions.map((session) => {
                    const inCart = session.tickets.reduce((total, ticket) => total + (cart[ticket.id] ?? 0), 0);
                    return (
                        <Tab
                            key={session.id}
                            id={session.id}
                            className={cx(
                                "px-3",
                                session.soldOut && "cursor-not-allowed opacity-50",
                                isFiltering && session.tickets.length === 0 && session.id !== selectedId && "opacity-50",
                            )}
                        >
                            <span className={cx(session.soldOut && "line-through")}>{session.time}</span>
                            {session.soldOut && <span className="sr-only">esgotado</span>}
                            {inCart > 0 && (
                                <Badge size="md" type="pill-color" color="gray">
                                    {inCart}
                                </Badge>
                            )}
                        </Tab>
                    );
                })}
            </TabList>
        </Tabs>
    </div>
);

/** Itens do agrupador escolhido, reunidos sob o nome do grupo. Começa fechado. */
const GroupAccordion = ({ name, children }: { name: string; children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <section className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2 px-4 py-3 text-left transition duration-100 ease-linear hover:bg-primary_hover"
            >
                <span className="flex-1 text-md font-semibold text-primary">{name}</span>
                <ChevronDown
                    className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-200 ease-out", isOpen && "rotate-180")}
                    aria-hidden="true"
                />
            </button>

            {/* Abre e fecha pela altura, com fade; a borda vem junto com o conteúdo, sem piscar no cabeçalho. */}
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="itens"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={TRANSICAO}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-secondary">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

const ROW = "flex flex-col gap-2 border-b border-secondary px-4 py-4 last:border-b-0";

interface TicketRowProps {
    ticket: TicketItem;
    cart: Cart;
    facialBlocked: boolean;
    ingressosRestantes?: number;
    onQuantityChange: (id: string, quantity: number) => void;
}

const TicketRow = ({ ticket, cart, facialBlocked, ingressosRestantes, onQuantityChange }: TicketRowProps) => {
    const isBlocked = facialBlocked && ticket.access === "facial";
    const AccessIcon = ticket.access === "facial" ? FaceId : QrCode01;

    return (
        <div className={cx(ROW, isBlocked && "opacity-50")}>
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
            {isBlocked && <p className="text-sm text-tertiary">Acesso por face: indisponível sem identificação do comprador.</p>}
            <div className="flex items-center justify-between gap-3">
                <p className="text-md font-semibold text-primary">{formatBRL(ticket.price)}</p>
                <QuantityStepper
                    label={ticket.name}
                    isDisabled={isBlocked}
                    value={isBlocked ? 0 : (cart[ticket.id] ?? 0)}
                    maxValue={ingressosRestantes === undefined ? undefined : (cart[ticket.id] ?? 0) + ingressosRestantes}
                    onChange={(quantity) => onQuantityChange(ticket.id, quantity)}
                />
            </div>
        </div>
    );
};

/** Combo: um bundle de ingressos. A composição mostra o que vai ser emitido. Não conta para o limite por documento. */
const ComboRow = ({ combo, cart, onQuantityChange }: { combo: ComboItem; cart: Cart; onQuantityChange: (id: string, quantity: number) => void }) => (
    <div className={ROW}>
        <div className="flex items-center gap-2">
            <Ticket02 className="size-5 shrink-0 text-fg-brand-primary" aria-hidden="true" />
            <p className="text-md font-semibold text-primary">{combo.name}</p>
        </div>
        <ComboComposition entries={combo.composicao} />
        <p className="text-sm text-tertiary">{combo.description}</p>
        <div className="flex items-center justify-between gap-3">
            <p className="text-md font-semibold text-primary">{formatBRL(combo.price)}</p>
            <QuantityStepper label={combo.name} value={cart[combo.id] ?? 0} onChange={(quantity) => onQuantityChange(combo.id, quantity)} />
        </div>
    </div>
);

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
