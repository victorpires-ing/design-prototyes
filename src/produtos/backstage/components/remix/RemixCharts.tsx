import { useState } from "react";
import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { numero } from "../../eventos/data/vendas";
import type { Bloco } from "./remix-respostas";

/** Gráficos exclusivos do Remix — cada barra com seu próprio gradiente. */

const formatar = (valor: number, formato?: "moeda" | "numero" | "pct") => {
    if (formato === "moeda")
        return valor >= 1_000_000 ? `R$ ${(valor / 1_000_000).toFixed(1).replace(".", ",")}M` : `R$ ${numero(valor / 1000)}K`;
    if (formato === "pct") return `${Math.round(valor * 100)}%`;
    return numero(valor);
};

export type AbrirEvento = (eventoId: string, href: string) => void;

export function BlocoRemix({ bloco, onAbrirEvento }: { bloco: Bloco; onAbrirEvento?: AbrirEvento }) {
    if (bloco.tipo === "barras") return <Barras bloco={bloco} />;
    if (bloco.tipo === "rosca") return <Rosca bloco={bloco} />;
    if (bloco.tipo === "destaque") return <Destaque rotulo={bloco.rotulo} valor={bloco.valor} />;
    if (bloco.tipo === "agrupada") return <Agrupada bloco={bloco} />;
    if (bloco.tipo === "registros") return <Registros bloco={bloco} />;
    if (bloco.tipo === "linha") return <Linha bloco={bloco} />;
    return <Lista bloco={bloco} onAbrirEvento={onAbrirEvento} />;
}

/** Número em destaque — usado sozinho ou como cabeçalho de outro cartão. */
export const Destaque = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
    <div className="flex flex-col gap-1 rounded-xl bg-primary p-4">
        <span className="text-sm text-tertiary">{rotulo}</span>
        <span className="text-display-sm font-bold text-primary tabular-nums">{valor}</span>
    </div>
);

const Agrupada = ({ bloco }: { bloco: Extract<Bloco, { tipo: "agrupada" }> }) => (
    <div className="flex flex-col gap-5">
        {bloco.grupos.map((grupo) => (
            <div key={grupo.titulo} className="flex flex-col gap-2">
                <h4 className="text-md font-bold text-primary">{grupo.titulo}</h4>
                {grupo.linhas.map((linha) => (
                    <div key={linha.label} className="flex items-baseline gap-2 text-sm">
                        <span className="shrink-0 text-tertiary">{linha.label}</span>
                        {/* Linha pontilhada ligando rótulo e valor, como no design. */}
                        <span aria-hidden="true" className="min-w-4 flex-1 border-b border-dashed border-border-secondary" />
                        <span className="shrink-0 text-secondary tabular-nums">{linha.valor}</span>
                    </div>
                ))}
            </div>
        ))}
    </div>
);

const Registros = ({ bloco }: { bloco: Extract<Bloco, { tipo: "registros" }> }) => (
    <ul className="flex flex-col divide-y divide-border-secondary">
        {bloco.itens.map((item, i) => (
            <li key={i} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-primary">{item.titulo}</span>
                    <span className="truncate text-sm text-tertiary">{item.sub}</span>
                </span>
                <span
                    className={
                        item.negativo ? "shrink-0 text-sm text-error-primary tabular-nums" : "shrink-0 text-sm text-primary tabular-nums"
                    }
                >
                    {item.valor}
                </span>
            </li>
        ))}
    </ul>
);

/**
 * Série mensal: o ponto destacado tem uma guia vertical que desce até os
 * chevrons — clicar move a guia inteira, então dá para se localizar na série.
 */
const Linha = ({ bloco }: { bloco: Extract<Bloco, { tipo: "linha" }> }) => {
    const [indice, setIndice] = useState(bloco.destaque);

    /** Alturas em px: o overlay precisa das mesmas coordenadas do SVG. */
    const ALTURA_GRAFICO = 150;
    const ALTURA_CHEVRONS = 36;
    const largura = 300;
    const maximo = Math.max(...bloco.dados.map((d) => d.valor));
    const minimo = Math.min(...bloco.dados.map((d) => d.valor));
    const span = maximo - minimo || 1;

    const x = (i: number) => (i / (bloco.dados.length - 1)) * largura;
    const y = (valor: number) => ALTURA_GRAFICO - ((valor - minimo) / span) * (ALTURA_GRAFICO - 24) - 12;
    const caminho = bloco.dados.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.valor)}`).join(" ");

    const ponto = bloco.dados[indice];
    const pontoY = y(ponto.valor);
    const pctX = (indice / (bloco.dados.length - 1)) * 100;
    // Perto da base não cabe o balão abaixo do ponto — aí ele vira para cima, sem cobrir o ponto.
    const balaoAcima = pontoY + 70 > ALTURA_GRAFICO;

    const irPara = (proximo: number) => setIndice(Math.min(bloco.dados.length - 1, Math.max(0, proximo)));

    return (
        <div className="flex flex-col gap-2">
            <div className="relative" style={{ height: ALTURA_GRAFICO + ALTURA_CHEVRONS }}>
                <svg
                    viewBox={`0 0 ${largura} ${ALTURA_GRAFICO}`}
                    preserveAspectRatio="none"
                    className="w-full"
                    style={{ height: ALTURA_GRAFICO }}
                    role="img"
                    aria-label="Histórico de vendas"
                >
                    {[0.25, 0.5, 0.75].map((f) => (
                        <line
                            key={f}
                            x1={0}
                            x2={largura}
                            y1={ALTURA_GRAFICO * f}
                            y2={ALTURA_GRAFICO * f}
                            stroke="var(--color-border-secondary)"
                            strokeWidth={1}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                    <path
                        d={caminho}
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth={2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>

                {/* Guia + balão + chevrons andam juntos: um único grupo que desliza no eixo X. */}
                <div className="absolute inset-y-0 transition-[left] duration-200 ease-out" style={{ left: `${pctX}%` }} aria-hidden="true">
                    <span
                        className="absolute w-px -translate-x-1/2 bg-border-primary"
                        style={{ top: pontoY, height: ALTURA_GRAFICO + ALTURA_CHEVRONS / 2 - pontoY }}
                    />
                    <span
                        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F97066] ring-4 ring-[#F97066]/20"
                        style={{ top: pontoY }}
                    />
                    <div
                        className={cx(
                            "absolute flex -translate-x-1/2 flex-col items-center rounded-lg bg-secondary px-3 py-2 whitespace-nowrap ring-1 ring-[#2563EB]",
                            balaoAcima ? "-translate-y-[calc(100%+12px)]" : "translate-y-3",
                        )}
                        style={{ top: pontoY }}
                    >
                        <span className="text-sm font-semibold text-primary tabular-nums">{numero(ponto.valor)}</span>
                        <span className="text-sm text-tertiary">{ponto.mes} 2026</span>
                    </div>
                </div>

                {/* Os chevrons ficam no pé da guia e acompanham o mês selecionado. */}
                <div
                    className="absolute bottom-0 flex -translate-x-1/2 items-center rounded-lg bg-primary ring-1 ring-border-secondary transition-[left] duration-200 ease-out"
                    style={{ left: `${pctX}%` }}
                >
                    <button
                        type="button"
                        aria-label="Mês anterior"
                        disabled={indice === 0}
                        onClick={() => irPara(indice - 1)}
                        className="flex size-8 items-center justify-center rounded-l-lg text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary_hover disabled:opacity-50"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <span aria-hidden="true" className="h-4 w-px bg-border-secondary" />
                    <button
                        type="button"
                        aria-label="Próximo mês"
                        disabled={indice === bloco.dados.length - 1}
                        onClick={() => irPara(indice + 1)}
                        className="flex size-8 items-center justify-center rounded-r-lg text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary_hover disabled:opacity-50"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>

            {/* Rótulos posicionados no mesmo X dos pontos, não distribuídos por igual. */}
            <div className="relative h-5">
                {bloco.dados.map((d, i) =>
                    i % 2 === 0 ? (
                        <span
                            key={d.mes}
                            className="absolute -translate-x-1/2 text-sm text-tertiary"
                            style={{ left: `${(i / (bloco.dados.length - 1)) * 100}%` }}
                        >
                            {d.mes}
                        </span>
                    ) : null,
                )}
            </div>
        </div>
    );
};

/**
 * Rosca de raio variável: cada fatia tem o mesmo ângulo e o raio proporcional
 * ao valor. Recharts não modela isso, então é SVG na mão.
 */
const Rosca = ({ bloco }: { bloco: Extract<Bloco, { tipo: "rosca" }> }) => {
    const tamanho = 240;
    const centro = tamanho / 2;
    const raioMin = 34;
    const raioMax = centro - 26;
    const fatia = (Math.PI * 2) / bloco.dados.length;

    const arco = (indice: number, raio: number) => {
        const inicio = indice * fatia - Math.PI / 2;
        const fim = inicio + fatia - 0.03;
        const x1 = centro + raioMin * Math.cos(inicio);
        const y1 = centro + raioMin * Math.sin(inicio);
        const x2 = centro + raio * Math.cos(inicio);
        const y2 = centro + raio * Math.sin(inicio);
        const x3 = centro + raio * Math.cos(fim);
        const y3 = centro + raio * Math.sin(fim);
        const x4 = centro + raioMin * Math.cos(fim);
        const y4 = centro + raioMin * Math.sin(fim);
        return `M ${x1} ${y1} L ${x2} ${y2} A ${raio} ${raio} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${raioMin} ${raioMin} 0 0 0 ${x1} ${y1} Z`;
    };

    return (
        <div className="flex flex-col gap-4">
            <svg
                viewBox={`0 0 ${tamanho} ${tamanho}`}
                className="mx-auto h-auto w-full max-w-[240px]"
                role="img"
                aria-label="Ocupação por sessão"
            >
                {/* Trilho da rosca — o restante da capacidade. */}
                <circle cx={centro} cy={centro} r={raioMax} fill="var(--color-bg-quaternary)" />
                {bloco.dados.map((item, i) => (
                    <path key={item.nome} d={arco(i, raioMin + (raioMax - raioMin) * Math.max(0.08, item.valor))} fill={item.cor} />
                ))}
                {bloco.dados.map((item, i) => {
                    const angulo = i * fatia - Math.PI / 2 + fatia / 2;
                    const raio = raioMax + 12;
                    return (
                        <text
                            key={`l-${item.nome}`}
                            x={centro + raio * Math.cos(angulo)}
                            y={centro + raio * Math.sin(angulo)}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="var(--color-text-primary)"
                            className="text-[11px] font-semibold"
                        >
                            {Math.round(item.valor * 100)}%
                        </text>
                    );
                })}
            </svg>

            <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
                {bloco.dados.map((item) => (
                    <li key={item.nome} className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-2 text-sm text-tertiary">
                            <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: item.cor }} />
                            <span className="truncate">{item.nome}</span>
                        </span>
                        <span className="text-md font-semibold text-primary tabular-nums">{Math.round(item.valor * 100)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Lista = ({ bloco, onAbrirEvento }: { bloco: Extract<Bloco, { tipo: "lista" }>; onAbrirEvento?: AbrirEvento }) => (
    <ul className="flex flex-col divide-y divide-border-secondary">
        {bloco.itens.map((item) => {
            const conteudo = (
                <>
                    {item.cover && <img src={item.cover} alt="" className="size-10 shrink-0 rounded-md object-cover" />}
                    <span className="flex min-w-0 flex-1 flex-col text-left">
                        <span className="truncate text-sm text-secondary">{item.label}</span>
                        {item.sub && <span className="truncate text-sm text-tertiary">{item.sub}</span>}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{item.valor}</span>
                </>
            );

            // Item com evento vira botão: abre o painel daquele evento.
            return (
                <li key={item.label}>
                    {item.eventoId && item.href && onAbrirEvento ? (
                        <button
                            type="button"
                            onClick={() => onAbrirEvento(item.eventoId!, item.href!)}
                            className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2.5 transition duration-100 ease-linear hover:bg-primary_hover"
                        >
                            {conteudo}
                            <ChevronRight className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 py-2.5">{conteudo}</div>
                    )}
                </li>
            );
        })}
    </ul>
);
