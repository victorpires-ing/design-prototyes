import { useMemo, useState } from "react";
import { geoEqualEarth, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { cx } from "@/utils/cx";
import { numberFormatter, percentFormatter } from "../data/event";
import countries110m from "../data/geo/countries-110m.json";
import brStates from "../data/geo/br-states.json";

export interface GeoRow {
    code: string;
    nome: string;
    valor: number;
}

const num = (n: number) => numberFormatter.format(n);
const pct = (n: number) => percentFormatter.format(n);

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Feat {
    type: "Feature";
    id?: string | number;
    properties: Record<string, any>;
    geometry: any;
}

// Malhas convertidas uma vez (topojson → features / geojson direto).
const WORLD: Feat[] = (feature(countries110m as any, (countries110m as any).objects.countries) as any).features;
const BRASIL: Feat[] = (brStates as any).features;

const MAPAS = {
    mundi: { feats: WORLD, w: 800, h: 400, projFn: geoEqualEarth, code: (f: Feat) => String(f.id) },
    brasil: { feats: BRASIL, w: 800, h: 520, projFn: geoMercator, code: (f: Feat) => String(f.properties?.sigla ?? "") },
};

/**
 * Mapa (choropleth) acoplado a uma tabela com barra de progresso (% do total).
 * Colore cada região pela intensidade do valor; a tabela lista em ordem decrescente.
 */
export function GeoMapTable({ mapa, rows }: { mapa: "mundi" | "brasil"; rows: GeoRow[] }) {
    const [hover, setHover] = useState<string | null>(null);
    const { feats, w, h, projFn, code } = MAPAS[mapa];

    const { total, max, byCode, visiveis, resto, outrosValor } = useMemo(() => {
        const total = rows.reduce((s, r) => s + r.valor, 0);
        const max = Math.max(...rows.map((r) => r.valor), 1);
        const byCode = new Map(rows.map((r) => [r.code, r]));
        const ordenadas = [...rows].sort((a, b) => b.valor - a.valor);
        const visiveis = ordenadas.slice(0, 4);
        const resto = ordenadas.slice(4);
        const outrosValor = resto.reduce((s, r) => s + r.valor, 0);
        return { total, max, byCode, visiveis, resto, outrosValor };
    }, [rows]);

    const path = useMemo(() => {
        const projection = projFn().fitSize([w, h], { type: "FeatureCollection", features: feats } as any);
        return geoPath(projection as any);
    }, [feats, w, h, projFn]);

    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
            {/* Mapa */}
            <div className="overflow-hidden rounded-xl bg-secondary/40 p-2 ring-1 ring-border-secondary">
                <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Mapa de distribuição">
                    {feats.map((f, i) => {
                        const c = code(f);
                        const row = byCode.get(c);
                        const v = row?.valor ?? 0;
                        const ativo = hover === c;
                        const intensidade = v > 0 ? 0.18 + 0.82 * (v / max) : 0;
                        const d = path(f as any) ?? undefined;
                        if (!d) return null;
                        return (
                            <path
                                key={c || i}
                                d={d}
                                fill={v > 0 ? "var(--color-brand-600)" : "var(--color-bg-quaternary)"}
                                fillOpacity={v > 0 ? (ativo ? 1 : intensidade) : 1}
                                stroke="var(--color-bg-primary)"
                                strokeWidth={ativo ? 1 : 0.5}
                                className={cx(v > 0 && "cursor-pointer")}
                                onMouseEnter={() => v > 0 && setHover(c)}
                                onMouseLeave={() => setHover(null)}
                            >
                                {row && <title>{`${row.nome}: ${num(v)}`}</title>}
                            </path>
                        );
                    })}
                </svg>
            </div>

            {/* Tabela: top 4 + "Outros" (o restante aparece no hover do mapa) */}
            <div className="flex flex-col gap-1">
                {visiveis.map((r) => {
                    const frac = total > 0 ? r.valor / total : 0;
                    const largura = (r.valor / max) * 100;
                    const ativo = hover === r.code;
                    return (
                        <div
                            key={r.code}
                            onMouseEnter={() => setHover(r.code)}
                            onMouseLeave={() => setHover(null)}
                            className={cx("flex flex-col gap-1.5 rounded-lg px-2 py-1.5 transition duration-100 ease-linear", ativo && "bg-primary_hover")}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <span className="min-w-0 truncate text-sm font-medium text-secondary">{r.nome}</span>
                                <span className="shrink-0 text-sm text-tertiary">
                                    <span className="font-semibold text-primary">{num(r.valor)}</span> · {pct(frac)}
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-quaternary">
                                <div className="h-full rounded-full bg-brand-solid transition-all duration-300 ease-linear" style={{ width: `${largura}%` }} />
                            </div>
                        </div>
                    );
                })}
                {resto.length > 0 && (
                    <div className="flex flex-col gap-1.5 rounded-lg px-2 py-1.5">
                        <div className="flex items-center justify-between gap-4">
                            <span className="min-w-0 truncate text-sm font-medium text-tertiary">Outros ({resto.length}) · passe o mouse no mapa</span>
                            <span className="shrink-0 text-sm text-tertiary">
                                <span className="font-semibold text-primary">{num(outrosValor)}</span> · {pct(total > 0 ? outrosValor / total : 0)}
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-quaternary">
                            <div className="h-full rounded-full bg-quaternary" style={{ width: `${Math.min(100, (outrosValor / max) * 100)}%`, backgroundColor: "var(--color-fg-quaternary)" }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
