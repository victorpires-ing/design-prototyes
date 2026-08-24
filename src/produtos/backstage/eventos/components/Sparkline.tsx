import { cx } from "@/utils/cx";

interface SparklineProps {
    values: number[];
    className?: string;
    /** Cor da linha. Default: cor de marca. */
    stroke?: string;
}

/** Minigráfico de tendência, sem eixos — só a forma da curva. */
export function Sparkline({ values, className, stroke = "var(--color-fg-brand-primary)" }: SparklineProps) {
    if (values.length < 2) return <span className={cx("block h-8", className)} />;

    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = max - min || 1;
    const passo = 100 / (values.length - 1);
    const pontos = values.map((valor, index) => `${index * passo},${28 - ((valor - min) / span) * 24}`).join(" ");

    return (
        <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true" className={cx("h-8 w-full", className)}>
            <polyline
                points={pontos}
                fill="none"
                stroke={stroke}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
