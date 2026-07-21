declare module "statistics.js" {
    type Escala = "nominal" | "ordinal" | "interval" | "metric";

    /** Wrapper mínimo dos métodos usados no projeto (a lib expõe muitos outros). */
    export default class Statistics {
        constructor(data: Record<string, number | string>[], columns?: Record<string, Escala>, options?: Record<string, unknown>);
        arithmeticMean(column: string): number;
        median(column: string): number;
        standardDeviation(column: string): number;
        variance(column: string): number;
        minimum(column: string): number;
        maximum(column: string): number;
        correlationCoefficient(a: string, b: string): { correlationCoefficient: number; missings: number };
        linearRegression(a: string, b: string): Record<string, number>;
    }
}
