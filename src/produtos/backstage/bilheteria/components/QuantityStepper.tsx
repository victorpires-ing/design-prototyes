import { InputNumber } from "@/components/base/input/input-number";

interface QuantityStepperProps {
    value: number;
    onChange: (value: number) => void;
    isDisabled?: boolean;
    label: string;
    /** Teto da quantidade. Trava o + e também o valor digitado. */
    maxValue?: number;
}

/**
 * Contador de quantidade do passo 2 e do resumo.
 *
 * Usa o `InputNumber` horizontal do DS: além dos botões − e +, dá para digitar
 * a quantidade direto, o que importa em venda de lote grande.
 */
export function QuantityStepper({ value, onChange, isDisabled, label, maxValue }: QuantityStepperProps) {
    return (
        <InputNumber
            size="sm"
            orientation="horizontal"
            value={value}
            minValue={0}
            maxValue={maxValue}
            isDisabled={isDisabled}
            onChange={(next) => onChange(Number.isNaN(next) ? 0 : next)}
            aria-label={`Quantidade de ${label}`}
            inputClassName="text-center tabular-nums"
            className="w-[120px] shrink-0"
        />
    );
}
