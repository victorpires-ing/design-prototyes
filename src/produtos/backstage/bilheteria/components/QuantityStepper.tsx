import { Minus, Plus } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface QuantityStepperProps {
    value: number;
    onChange: (value: number) => void;
    max?: number;
    isDisabled?: boolean;
    label: string;
}

/** Contador de quantidade `− 00 +` usado nas listas de itens e no resumo. */
export function QuantityStepper({ value, onChange, max = 99, isDisabled, label }: QuantityStepperProps) {
    const buttonClass =
        "flex size-9 shrink-0 items-center justify-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary_hover disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div
            className={cx(
                "flex items-center rounded-lg bg-primary ring-1 ring-border-primary shadow-xs ring-inset",
                isDisabled && "cursor-not-allowed opacity-50",
            )}
        >
            <button
                type="button"
                aria-label={`Remover uma unidade de ${label}`}
                disabled={isDisabled || value <= 0}
                onClick={() => onChange(Math.max(0, value - 1))}
                className={cx(buttonClass, "rounded-l-lg")}
            >
                <Minus className="size-4" aria-hidden="true" />
            </button>
            <span aria-live="polite" className="min-w-9 text-center text-sm font-medium tabular-nums text-primary">
                {value.toString().padStart(2, "0")}
            </span>
            <button
                type="button"
                aria-label={`Adicionar uma unidade de ${label}`}
                disabled={isDisabled || value >= max}
                onClick={() => onChange(Math.min(max, value + 1))}
                className={cx(buttonClass, "rounded-r-lg")}
            >
                <Plus className="size-4" aria-hidden="true" />
            </button>
        </div>
    );
}
