import { useMemo } from "react";
import { Ticket01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import {
    getItemDetails,
    MAX_SELECTIONS,
    type ComboItemDetails,
    type ItemDetails,
    type ProductItemDetails,
    type TicketItemDetails,
} from "../data/cortesia-items";

interface CortesiaSelectionPanelProps {
    selectedIds: Set<string>;
    onRemove: (id: string) => void;
    onRemoveMany: (ids: string[]) => void;
    className?: string;
}

export function CortesiaSelectionPanel({
    selectedIds,
    onRemove,
    onRemoveMany,
    className,
}: CortesiaSelectionPanelProps) {
    const count = selectedIds.size;
    const isEmpty = count === 0;

    const grouped = useMemo(() => {
        const ingressos: ItemDetails[] = [];
        const produtos: ProductItemDetails[] = [];
        for (const id of selectedIds) {
            const details = getItemDetails(id);
            if (!details) continue;
            if (details.kind === "product") produtos.push(details);
            else ingressos.push(details);
        }
        return { ingressos, produtos };
    }, [selectedIds]);

    return (
        <aside
            className={cx(
                "sticky top-6 hidden h-[450px] w-[330px] shrink-0 flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary lg:flex",
                className,
            )}
        >
            <header className="flex bg-secondary shrink-0 items-baseline justify-between gap-2 border-b border-secondary px-4 py-3.5">
                <h3 className="text-sm font-semibold text-primary">Cortesias</h3>
                <span className="text-xs text-tertiary">
                    {count} de {MAX_SELECTIONS} cortesias selecionadas
                </span>
            </header>

            {isEmpty ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                    <FeaturedIcon icon={Ticket01} color="brand" theme="gradient" size="xl" />
                    <p className="text-md text-primary">
                        Você ainda não <br />selecionou cortesias
                    </p>
                </div>
            ) : (
                <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
                    {grouped.ingressos.length > 0 && (
                        <SectionGroup
                            title="Ingressos"
                            onClear={() => onRemoveMany(grouped.ingressos.map((i) => i.id))}
                        >
                            {grouped.ingressos.map((item) =>
                                item.kind === "combo" ? (
                                    <ComboRow key={item.id} item={item} onRemove={onRemove} />
                                ) : (
                                    <TicketRow
                                        key={item.id}
                                        item={item as TicketItemDetails}
                                        onRemove={onRemove}
                                    />
                                ),
                            )}
                        </SectionGroup>
                    )}

                    {grouped.produtos.length > 0 && (
                        <SectionGroup
                            title="Produtos"
                            onClear={() => onRemoveMany(grouped.produtos.map((p) => p.id))}
                        >
                            {grouped.produtos.map((item) => (
                                <ProductRow key={item.id} item={item} onRemove={onRemove} />
                            ))}
                        </SectionGroup>
                    )}
                </div>
            )}
        </aside>
    );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                   */
/* ------------------------------------------------------------------ */

interface SectionGroupProps {
    title: string;
    onClear: () => void;
    children: React.ReactNode;
}

const SectionGroup = ({ title, onClear, children }: SectionGroupProps) => (
    <section className="flex flex-col gap-3">
        <header className="flex items-center gap-3">
            <h4 className="shrink-0 text-sm font-semibold text-primary">{title}</h4>
            <span
                className="flex-1 border-t border-dashed border-secondary"
                aria-hidden="true"
            />
            <Button size="xs" color="link-gray" onClick={onClear}>
                Limpar tudo
            </Button>
        </header>
        <div className="flex flex-col gap-4">{children}</div>
    </section>
);

/* ------------------------------------------------------------------ */
/*  Row variants                                                      */
/* ------------------------------------------------------------------ */

interface RowProps<T> {
    item: T;
    onRemove: (id: string) => void;
}

const TicketRow = ({ item, onRemove }: RowProps<TicketItemDetails>) => (
    <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-primary">{item.name}</span>
            <span className="truncate text-sm text-tertiary">
                {item.groupName} - {item.ticketType}
            </span>
            <span className="truncate text-xs text-tertiary">{item.sessionDate}</span>
        </div>
        <Button size="xs" color="link-gray" onClick={() => onRemove(item.id)}>
            Remover
        </Button>
    </div>
);

const ProductRow = ({ item, onRemove }: RowProps<ProductItemDetails>) => (
    <div className="flex items-center gap-3">
        <img
            src={item.imageUrl}
            alt=""
            className="size-10 shrink-0 rounded-md object-cover ring-1 ring-secondary"
        />
        <span className="flex-1 truncate text-sm font-medium text-primary">{item.name}</span>
        <Button size="xs" color="link-gray" onClick={() => onRemove(item.id)}>
            Remover
        </Button>
    </div>
);

const ComboRow = ({ item, onRemove }: RowProps<ComboItemDetails>) => (
    <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-primary">{item.name}</span>
                <span className="truncate text-sm text-tertiary">{item.subtitle}</span>
            </div>
            <Button size="xs" color="link-gray" onClick={() => onRemove(item.id)}>
                Remover
            </Button>
        </div>
        <ul className="flex flex-col gap-2.5">
            {item.subItems.map((sub, i) => (
                <li key={`${item.id}-sub-${i}`} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-quaternary text-[10px] font-semibold text-white">
                        {i + 1}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-primary">
                            {sub.name}
                        </span>
                        <span className="truncate text-sm text-tertiary">{sub.type}</span>
                        {sub.date && (
                            <span className="truncate text-xs text-tertiary">{sub.date}</span>
                        )} 
                    </div>
                </li>
            ))}
        </ul>
    </div>
);
