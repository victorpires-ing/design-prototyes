import { CANAL_COR, CANAL_LABEL, type Canal } from "../data/vendas";
import { cx } from "@/utils/cx";

interface OcupacaoBarProps {
    porCanal: Record<Canal, number>;
    capacidade: number;
    className?: string;
    /** Mostra a legenda com a contagem por canal. */
    withLegend?: boolean;
}

const ORDEM: Canal[] = ["ingresse", "parceiro", "cortesia"];

/** Barra de ocupação segmentada por canal de venda. */
export function OcupacaoBar({ porCanal, capacidade, className, withLegend }: OcupacaoBarProps) {
    const largura = (valor: number) => `${capacidade ? (valor / capacidade) * 100 : 0}%`;

    return (
        <div className={cx("flex flex-col gap-1.5", className)}>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-quaternary">
                {ORDEM.map((canal) => (
                    <span
                        key={canal}
                        className="h-full first:rounded-l-full last:rounded-r-full"
                        style={{ width: largura(porCanal[canal]), background: CANAL_COR[canal] }}
                        aria-hidden="true"
                    />
                ))}
            </div>

            {withLegend && (
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {ORDEM.filter((canal) => porCanal[canal] > 0).map((canal) => (
                        <li key={canal} className="flex items-center gap-1.5 text-sm text-tertiary">
                            <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: CANAL_COR[canal] }} />
                            {CANAL_LABEL[canal]}
                            <span className="font-medium text-secondary tabular-nums">{porCanal[canal].toLocaleString("pt-BR")}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
