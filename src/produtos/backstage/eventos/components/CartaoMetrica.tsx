import { Fragment, useState, type FC, type PointerEvent } from "react";
import { ArrowDown, ArrowUp } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { formatar, useTextosEventos } from "../data/textos-eventos";
import type { Ritmo } from "../data/vendas";
import { Sparkline } from "./Sparkline";

interface CartaoMetricaProps {
    icon: FC<{ className?: string }>;
    label: string;
    /** Total acumulado, já formatado. */
    valor: string;
    ritmo: Ritmo;
    /** Ritmo já formatado (ex.: "R$ 7K", "27"). */
    ritmoValor: string;
    /**
     * Frase inteira do ritmo com `{valor}` no lugar do número (ex.: "{valor} por dia"), para a
     * tradução poder mover o número (UI-TXT-009). Faturamento e contagens acumulam por dia;
     * ticket médio é um valor por ingresso, e dizer "R$ 271 por dia" seria mentira.
     */
    ritmoFrase: string;
    /** Cartão "de gráfico": curva mais alta, com as datas no eixo x. */
    grafico?: boolean;
    /** Formata o valor de um dia, para o tooltip do gráfico. */
    formatarDia?: (valor: number) => string;
}

/**
 * Big number com a leitura de tendência junto.
 *
 * Tudo no cartão olha os últimos 7 dias: o total, a curva dia a dia e a
 * média por dia, comparada com os 7 dias anteriores.
 */
type Formato = (iso: string, opcoes: Intl.DateTimeFormatOptions) => string;

/** Formata uma data ISO (AAAA-MM-DD) no idioma da pessoa, ao meio-dia para o fuso não mudar o dia. */
const formatoDe =
    (locale: string): Formato =>
    (iso, opcoes) =>
        new Intl.DateTimeFormat(locale, opcoes).format(new Date(`${iso.slice(0, 10)}T12:00:00`));

/** Dia e mês curtos ("2 de nov."), para o eixo e o tooltip. */
const DIA_MES: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

/**
 * As duas pontas de um período, sem repetir o que é igual: "2" e "8 de nov."; "26 de out." e
 * "1 de nov."; com ano quando atravessa a virada. Cada ponta formatada pelo idioma.
 */
const pontas = (fmt: Formato, de: string, ate: string) => {
    const mesmoAno = de.slice(0, 4) === ate.slice(0, 4);
    const mesmoMes = mesmoAno && de.slice(5, 7) === ate.slice(5, 7);
    const comAno: Intl.DateTimeFormatOptions = { ...DIA_MES, year: "numeric" };
    return {
        de: fmt(de, mesmoMes ? { day: "numeric" } : mesmoAno ? DIA_MES : comAno),
        ate: fmt(ate, mesmoAno ? DIA_MES : comAno),
    };
};

/** Põe em destaque o `{valor}` dentro de uma frase já traduzida. */
const comValor = (frase: string, valor: string) =>
    frase.split("{valor}").map((parte, i, todas) => (
        <Fragment key={i}>
            <span className="font-normal text-tertiary">{parte}</span>
            {i < todas.length - 1 && valor}
        </Fragment>
    ));

/** Início, dois pontos intermediários e fim: legível sem amontoar num cartão estreito. */
function indicesDoEixo(total: number) {
    const ultimo = total - 1;
    return [...new Set([0, Math.round(ultimo / 3), Math.round((ultimo * 2) / 3), ultimo])];
}

/** Ancora pela borda perto das extremidades para o texto não vazar do cartão. */
const ancora = (pct: number) => (pct < 12 ? "translateX(0)" : pct > 88 ? "translateX(-100%)" : "translateX(-50%)");

function GraficoDiario({ serie, datas, stroke, formatar: formatarValor, fmt }: { serie: number[]; datas: string[]; stroke: string; formatar: (v: number) => string; fmt: Formato }) {
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
                    {/* Data e valor separados pela estrutura, não por símbolo (UI-TXT-010). */}
                    <span className="mr-2 text-white/70">{fmt(datas[indice], DIA_MES)}</span>
                    <span className="font-semibold tabular-nums">{formatarValor(serie[indice])}</span>
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
                {/* Mês só nas pontas ("1 de nov.", 3, 5, "7 de nov."): cabe no cartão estreito sem sobrepor. */}
                {indicesDoEixo(serie.length).map((i) => (
                    <span key={i} className="absolute top-0 whitespace-nowrap" style={{ left: `${pct(i)}%`, transform: ancora(pct(i)) }}>
                        {fmt(datas[i], i === 0 || i === ultimo ? DIA_MES : { day: "numeric" })}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function CartaoMetrica({ icon: Icon, label, valor, ritmo, ritmoValor, ritmoFrase, grafico = false, formatarDia = String }: CartaoMetricaProps) {
    const { t, locale } = useTextosEventos();
    const fmt = formatoDe(locale);

    /* Oscilação de menos de 3% é ruído de série diária, não tendência. */
    const relevante = ritmo.variacao !== null && Math.abs(ritmo.variacao) >= 0.03;
    const subindo = (ritmo.variacao ?? 0) > 0;
    const corLinha = relevante && !subindo ? "var(--color-fg-error-secondary)" : "var(--color-fg-success-secondary)";

    const { datas } = ritmo;
    const fim = datas.at(-1);
    const periodo = fim ? formatar(t.metricas.periodo, { intervalo: formatar(t.metricas.intervalo, pontas(fmt, datas[0], fim)) }) : null;
    const anteriores = ritmo.datasAnteriores;
    // "26 de out. a 1 de nov.": o período anterior entra na frase da comparação.
    const semanaAnterior = anteriores.length ? formatar(t.metricas.intervalo, pontas(fmt, anteriores[0], anteriores[anteriores.length - 1])) : null;
    const percentual = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(Math.abs(ritmo.variacao ?? 0));

    return (
        <section className={cx("flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary")}>
            <div className="flex items-center gap-2">
                <Icon className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                <h3 className="text-sm font-medium text-tertiary">{label}</h3>
            </div>

            <div className="flex flex-col gap-1">
                <p className="text-display-sm font-bold text-primary tabular-nums">{valor}</p>
                {periodo && <p className="text-sm text-tertiary">{periodo}</p>}
            </div>

            {grafico && ritmo.serie.length > 1 ? (
                <GraficoDiario serie={ritmo.serie} datas={ritmo.datas} stroke={corLinha} formatar={formatarDia} fmt={fmt} />
            ) : (
                <Sparkline values={ritmo.serie} stroke={corLinha} />
            )}

            <div className={cx("flex flex-col gap-1 border-t border-secondary pt-3", grafico && "shrink-0")}>
                <span className="text-sm font-semibold text-primary tabular-nums">{comValor(ritmoFrase, ritmoValor)}</span>

                {/* A régua da comparação fica escrita: sem ela o % não quer dizer nada. */}
                {relevante ? (
                    <span className={cx("flex items-center gap-1 text-sm font-medium", subindo ? "text-success-primary" : "text-error-primary")}>
                        {subindo ? (
                            <ArrowUp className="size-3.5 shrink-0" aria-hidden="true" />
                        ) : (
                            <ArrowDown className="size-3.5 shrink-0" aria-hidden="true" />
                        )}
                        {semanaAnterior
                            ? formatar(subindo ? t.metricas.acima : t.metricas.abaixo, { percentual, periodo: semanaAnterior })
                            : formatar(subindo ? t.metricas.acimaDaSemanaAnterior : t.metricas.abaixoDaSemanaAnterior, { percentual })}
                    </span>
                ) : (
                    <span className="text-sm text-tertiary">{semanaAnterior ? formatar(t.metricas.estavel, { periodo: semanaAnterior }) : t.metricas.estavelSemanaAnterior}</span>
                )}
            </div>
        </section>
    );
}
