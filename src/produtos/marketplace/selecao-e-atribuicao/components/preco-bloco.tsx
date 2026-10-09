import { cx } from "@/utils/cx";
import { ariaPreco, brl, legendaMultipla, legendaPreco, multiplicar, type Preco } from "../utils/preco";

/**
 * A única forma de renderizar dinheiro para o consumidor.
 *
 * Invariante que o componente existe para proteger (Decreto 13.108/2026,
 * art. 4º VI e art. 7º): o número dominante é sempre o total, e a composição
 * aparece colada a ele, em reais e sem nenhuma interação. Nunca itemização sem
 * total, nunca total sem itemização.
 */

/**
 * Três degraus de verdade. Antes o total era `text-md` (16px) contra
 * metadados de 14px: 2px de diferença não cria hierarquia, cria uma parede de
 * texto uniforme. O preço agora salta, e a composição recua para `text-sm`
 * sem peso, em vez de disputar atenção com `font-medium`.
 */
const TAMANHOS = {
    /** Linha do resumo: ali o destaque é do total, não de cada item. */
    sm: "text-sm font-semibold text-primary tabular-nums",
    md: "text-lg font-bold text-primary tabular-nums",
    lg: "text-xl font-bold text-primary tabular-nums",
    xl: "text-display-xs font-bold text-primary tabular-nums",
} as const;

interface PrecoBlocoProps {
    /** Preço unitário. A multiplicação por `qtd` acontece aqui, nunca no chamador. */
    preco: Preco;
    qtd?: number;
    tamanho?: keyof typeof TAMANHOS;
    /** "completa" escreve "de taxa de serviço" por extenso. */
    forma?: "curta" | "completa";
    /** Rótulo acima do valor, ex.: "Total a pagar". */
    rotulo?: string;
    /** Qualificador antes do número, ex.: "A partir de". Nunca depois. */
    prefixo?: string;
    /** Como a composição nomeia o valor de face: "ingresso", "combo". */
    base?: string;
    className?: string;
}

export function PrecoBloco({ preco, qtd = 1, tamanho = "md", forma = "curta", rotulo, prefixo, base, className }: PrecoBlocoProps) {
    const total = multiplicar(preco, qtd);
    const composicao = qtd > 1 ? legendaMultipla(preco, qtd, base) : legendaPreco(preco, forma, base);

    return (
        <div className={cx("flex flex-col gap-0.5", className)}>
            {rotulo && <span className="text-sm font-medium text-tertiary">{rotulo}</span>}
            <span aria-label={`${prefixo ? `${prefixo} ` : ""}${ariaPreco(preco, qtd)}`}>
                <span aria-hidden="true" className="flex flex-wrap items-baseline gap-x-1.5">
                    {prefixo && <span className="text-sm text-tertiary">{prefixo}</span>}
                    <span className={TAMANHOS[tamanho]}>{brl(total.total)}</span>
                </span>
            </span>
            {composicao && (
                <span aria-hidden="true" className="text-sm text-quaternary tabular-nums">
                    {composicao}
                </span>
            )}
        </div>
    );
}
