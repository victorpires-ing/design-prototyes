import type { FC } from "react";
import { ArrowDown, ArrowUp } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { Ritmo } from "../data/vendas";
import { Sparkline } from "./Sparkline";

interface CartaoMetricaProps {
    icon: FC<{ className?: string }>;
    label: string;
    /** Total acumulado, já formatado. */
    valor: string;
    ritmo: Ritmo;
    /** Ritmo já formatado. */
    ritmoLabel: string;
    /**
     * O que o ritmo significa naquela métrica. GMV e contagens acumulam por dia;
     * ticket médio é um valor por ingresso, e dizer "R$ 271/dia" seria mentira.
     */
    ritmoSufixo: string;
    /**
     * Cartão "de gráfico": quase quadrado, com a curva ocupando a maior parte
     * da altura em vez de ser uma linha fina no rodapé. Mesmos dados, só o
     * gráfico vira o elemento dominante em vez de um apoio discreto.
     */
    grafico?: boolean;
}

/**
 * Big number com a leitura de tendência junto.
 *
 * O total sozinho diz o tamanho, não a direção: dois eventos com o mesmo
 * faturamento podem estar um acelerando e o outro parando. A curva dos 30 dias
 * mostra a forma, e a variação contra a semana anterior põe número nela.
 */
export function CartaoMetrica({ icon: Icon, label, valor, ritmo, ritmoLabel, ritmoSufixo, grafico = false }: CartaoMetricaProps) {
    /* Oscilação de menos de 3% é ruído de série diária, não tendência. */
    const relevante = ritmo.variacao !== null && Math.abs(ritmo.variacao) >= 0.03;
    const subindo = (ritmo.variacao ?? 0) > 0;

    return (
        <section className={cx("flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary", grafico && "aspect-square")}>
            <div className="flex items-center gap-2">
                <Icon className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                <h3 className="text-sm font-medium text-tertiary">{label}</h3>
            </div>

            <p className="text-display-sm font-bold text-primary tabular-nums">{valor}</p>

            <Sparkline
                values={ritmo.serie}
                stroke={relevante && !subindo ? "var(--color-fg-error-secondary)" : "var(--color-fg-success-secondary)"}
                className={grafico ? "h-auto min-h-0 flex-1" : undefined}
            />

            <div className={cx("flex flex-col gap-1 border-t border-secondary pt-3", grafico && "shrink-0")}>
                <span className="text-sm font-semibold text-primary tabular-nums">
                    {ritmoLabel}
                    <span className="font-normal text-tertiary"> {ritmoSufixo}</span>
                </span>

                {/* A régua da comparação fica escrita: sem ela o % não quer dizer nada. */}
                {relevante ? (
                    <span
                        className={cx(
                            "flex items-center gap-1 text-sm font-medium",
                            subindo ? "text-success-primary" : "text-error-primary",
                        )}
                    >
                        {subindo ? (
                            <ArrowUp className="size-3.5 shrink-0" aria-hidden="true" />
                        ) : (
                            <ArrowDown className="size-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span className="tabular-nums">
                            {Math.abs(ritmo.variacao!).toLocaleString("pt-BR", { style: "percent", maximumFractionDigits: 0 })}
                        </span>
                        {subindo ? "acima" : "abaixo"} da semana anterior
                    </span>
                ) : (
                    <span className="text-sm text-tertiary">estável ante a semana anterior</span>
                )}
            </div>
        </section>
    );
}
