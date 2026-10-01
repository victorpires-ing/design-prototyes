import { useState, type FC, type PointerEvent } from "react";
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
    /** Cartão "de gráfico": curva mais alta, com as datas no eixo x. */
    grafico?: boolean;
    /** Formata o valor de um dia, para o tooltip do gráfico. */
    formatarDia?: (valor: number) => string;
}

/**
 * Big number com a leitura de tendência junto.
 *
 * O total sozinho diz o tamanho, não a direção: dois eventos com o mesmo
 * faturamento podem estar um acelerando e o outro parando. A curva dos 30 dias
 * mostra a forma, e a variação contra a semana anterior põe número nela.
 */
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const dataCurta = (iso: string) => {
    const [, mes, dia] = iso.slice(0, 10).split("-");
    return `${Number(dia)} ${MESES[Number(mes) - 1]}`;
};

/** "17 a 23 ago" no mesmo mês; "28 jul a 3 ago" quando atravessa o mês. */
const intervalo = (de: string, ate: string) => {
    const [diaDe, mesDe] = dataCurta(de).split(" ");
    const [diaAte, mesAte] = dataCurta(ate).split(" ");
    return mesDe === mesAte ? `${diaDe} a ${diaAte} ${mesAte}` : `${diaDe} ${mesDe} a ${diaAte} ${mesAte}`;
};

/** Início, dois pontos intermediários e fim: legível sem amontoar num cartão estreito. */
function indicesDoEixo(total: number) {
    const ultimo = total - 1;
    return [...new Set([0, Math.round(ultimo / 3), Math.round((ultimo * 2) / 3), ultimo])];
}

/** Ancora pela borda perto das extremidades para o texto não vazar do cartão. */
const ancora = (pct: number) => (pct < 12 ? "translateX(0)" : pct > 88 ? "translateX(-100%)" : "translateX(-50%)");

function GraficoDiario({ serie, datas, stroke, formatar }: { serie: number[]; datas: string[]; stroke: string; formatar: (v: number) => string }) {
    const ultimo = serie.length - 1;
    const [indice, setIndice] = useState(ultimo);
    const pct = (i: number) => (i / ultimo) * 100;

    const max = Math.max(...serie);
    const min = Math.min(...serie);
    // Mesma escala do Sparkline: y de 4 a 28 num viewBox de altura 32.
    const topoPct = ((28 - ((serie[indice] - min) / (max - min || 1)) * 24) / 32) * 100;

    const aoMover = (e: PointerEvent<HTMLDivElement>) => {
        const caixa = e.currentTarget.getBoundingClientRect();
        const proporcao = Math.min(1, Math.max(0, (e.clientX - caixa.left) / caixa.width));
        setIndice(Math.round(proporcao * ultimo));
    };

    return (
        <div className="flex flex-col gap-2" onPointerMove={aoMover} onPointerLeave={() => setIndice(ultimo)}>
            {/* Tooltip sempre visível; por padrão mostra o último dia. */}
            <div className="relative h-9">
                <div
                    className="absolute top-0 rounded-lg bg-primary-solid px-3 py-2 text-sm whitespace-nowrap text-white shadow-lg"
                    style={{ left: `${pct(indice)}%`, transform: ancora(pct(indice)) }}
                >
                    <span className="text-white/70">{dataCurta(datas[indice])} · </span>
                    <span className="font-semibold tabular-nums">{formatar(serie[indice])}</span>
                </div>
            </div>

            <div className="relative h-[92px]">
                {indicesDoEixo(serie.length).map((i) => (
                    <span key={i} className="absolute inset-y-0 w-px bg-border-secondary" style={{ left: `${pct(i)}%` }} aria-hidden="true" />
                ))}
                <span className="absolute inset-y-0 w-px bg-fg-quaternary" style={{ left: `${pct(indice)}%` }} aria-hidden="true" />
                <Sparkline values={serie} stroke={stroke} className="relative h-full" />
                <span
                    className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-bg-primary"
                    style={{ left: `${pct(indice)}%`, top: `${topoPct}%`, backgroundColor: stroke }}
                    aria-hidden="true"
                />
            </div>

            <div className="relative h-5 text-sm text-quaternary tabular-nums" aria-hidden="true">
                {indicesDoEixo(serie.length).map((i) => (
                    <span key={i} className="absolute top-0 whitespace-nowrap" style={{ left: `${pct(i)}%`, transform: ancora(pct(i)) }}>
                        {dataCurta(datas[i])}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function CartaoMetrica({ icon: Icon, label, valor, ritmo, ritmoLabel, ritmoSufixo, grafico = false, formatarDia = String }: CartaoMetricaProps) {
    /* Oscilação de menos de 3% é ruído de série diária, não tendência. */
    const relevante = ritmo.variacao !== null && Math.abs(ritmo.variacao) >= 0.03;
    const subindo = (ritmo.variacao ?? 0) > 0;
    const corLinha = relevante && !subindo ? "var(--color-fg-error-secondary)" : "var(--color-fg-success-secondary)";

    const { datas } = ritmo;
    const fim = datas.at(-1);
    const semana = datas.length >= 7 ? intervalo(datas[datas.length - 7], datas[datas.length - 1]) : null;
    const semanaAnterior = datas.length >= 14 ? intervalo(datas[datas.length - 14], datas[datas.length - 8]) : null;

    return (
        <section className={cx("flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary")}>
            <div className="flex items-center gap-2">
                <Icon className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                <h3 className="text-sm font-medium text-tertiary">{label}</h3>
            </div>

            <div className="flex flex-col gap-1">
                <p className="text-display-sm font-bold text-primary tabular-nums">{valor}</p>
                {ritmo.inicio && fim && <p className="text-sm text-tertiary">Acumulado de {intervalo(ritmo.inicio, fim)}</p>}
            </div>

            {grafico && ritmo.serie.length > 1 ? (
                <GraficoDiario serie={ritmo.serie} datas={ritmo.datas} stroke={corLinha} formatar={formatarDia} />
            ) : (
                <Sparkline values={ritmo.serie} stroke={corLinha} />
            )}

            <div className={cx("flex flex-col gap-1 border-t border-secondary pt-3", grafico && "shrink-0")}>
                <span className="text-sm font-semibold text-primary tabular-nums">
                    {ritmoLabel}
                    <span className="font-normal text-tertiary">
                        {" "}
                        {ritmoSufixo}
                        {semana && (
                            <>
                                , <span className="whitespace-nowrap">de {semana}</span>
                            </>
                        )}
                    </span>
                </span>

                {/* A régua da comparação fica escrita: sem ela o % não quer dizer nada. */}
                {relevante ? (
                    <span className={cx("flex items-center gap-1 text-sm font-medium", subindo ? "text-success-primary" : "text-error-primary")}>
                        {subindo ? (
                            <ArrowUp className="size-3.5 shrink-0" aria-hidden="true" />
                        ) : (
                            <ArrowDown className="size-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span className="tabular-nums">
                            {Math.abs(ritmo.variacao!).toLocaleString("pt-BR", { style: "percent", maximumFractionDigits: 0 })}
                        </span>
                        {subindo ? "acima" : "abaixo"} {semanaAnterior ? `de ${semanaAnterior}` : "da semana anterior"}
                    </span>
                ) : (
                    <span className="text-sm text-tertiary">estável ante {semanaAnterior ?? "a semana anterior"}</span>
                )}
            </div>
        </section>
    );
}
