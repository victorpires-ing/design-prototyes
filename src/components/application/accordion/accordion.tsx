import { Children, isValidElement, type ReactElement, type ReactNode, useId, useState } from "react";
import { ChevronDown } from "@untitledui/icons";
import { Surgir } from "@/components/foundations/transicao";
import { cx } from "@/utils/cx";

type AccordionType = "single" | "multiple";

interface AccordionProps {
    children: ReactNode;
    type?: AccordionType;
    collapsible?: boolean;
    className?: string;
}

interface AccordionItemProps {
    value: string;
    trigger: ReactNode;
    children: ReactNode;
    className?: string;
}

function Accordion({ children, type = "single", collapsible = false, className }: AccordionProps) {
    const [openItems, setOpenItems] = useState<Set<string>>(new Set());

    const toggleItem = (value: string) => {
        const newSet = new Set(openItems);
        if (newSet.has(value)) {
            newSet.delete(value);
        } else {
            if (type === "single" && !collapsible) {
                newSet.clear();
            }
            newSet.add(value);
        }
        setOpenItems(newSet);
    };

    const baseId = useId();
    // Children.toArray aceita um item só, listas e fragmentos de .map (antes, um item só não aparecia).
    const itens = Children.toArray(children);

    return (
        <div className={cx("w-full space-y-px", className)}>
            {itens.map((child) => {
                if (!isValidElement(child) || child.type !== AccordionItem) return child;
                const props = (child as ReactElement<AccordionItemProps>).props;
                const isOpen = openItems.has(props.value);
                const painelId = `${baseId}-${props.value}`;
                return (
                    <div key={props.value} className={cx("border border-secondary rounded-lg overflow-hidden", props.className)}>
                        <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={painelId}
                            onClick={() => toggleItem(props.value)}
                            className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left outline-focus-ring hover:bg-secondary_hover transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
                        >
                            {props.trigger}
                            <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                        </button>
                        {/* Abre e fecha deslizando a altura (UI-VIS-008). */}
                        <Surgir visivel={isOpen}>
                            <div id={painelId} role="region" className="border-t border-secondary px-4 py-3 bg-secondary_subtle">
                                {props.children}
                            </div>
                        </Surgir>
                    </div>
                );
            })}
        </div>
    );
}

function AccordionItem({ value, trigger, children, className }: AccordionItemProps) {
    return null;
}

// Compound component pattern
const AccordionComponent = Accordion as typeof Accordion & {
    Item: typeof AccordionItem;
};

AccordionComponent.Item = AccordionItem;

export { Accordion, AccordionComponent };
export type { AccordionProps, AccordionItemProps };
