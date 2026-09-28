import { ReactNode, useState } from "react";
import { ChevronDown } from "@untitledui/icons";
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

    return (
        <div className={cx("w-full space-y-px", className)}>
            {Array.isArray(children)
                ? children.map((child) => {
                      if (child.type === AccordionItem) {
                          const isOpen = openItems.has(child.props.value);
                          return (
                              <div
                                  key={child.props.value}
                                  className={cx("border border-secondary rounded-lg overflow-hidden", child.props.className)}
                              >
                                  <button
                                      onClick={() => toggleItem(child.props.value)}
                                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-secondary_hover transition-colors"
                                  >
                                      {child.props.trigger}
                                      <ChevronDown
                                          className={cx("size-4 text-fg-quaternary transition-transform", isOpen && "rotate-180")}
                                          aria-hidden="true"
                                      />
                                  </button>
                                  {isOpen && (
                                      <div className="border-t border-secondary px-4 py-3 bg-secondary_subtle">{child.props.children}</div>
                                  )}
                              </div>
                          );
                      }
                      return child;
                  })
                : children}
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
