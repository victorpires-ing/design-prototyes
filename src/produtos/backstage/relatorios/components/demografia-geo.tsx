import { Cell, Pie, PieChart, ResponsiveContainer, Treemap } from "recharts";
import { GeoMapTable } from "./GeoMapTable";
import { numberFormatter, percentFormatter } from "../data/event";
import { ESTADOS, GENERO, IDADE, PAISES, TOTAL_COMPRADORES } from "../data/publico";

const num = (n: number) => numberFormatter.format(n);
const pct = (n: number) => percentFormatter.format(n);

const COR_M = "var(--color-utility-blue-400)";
const COR_F = "var(--color-utility-green-400)";
const IDADE_CORES = [
    "var(--color-utility-blue-500)",
    "var(--color-utility-blue-400)",
    "var(--color-utility-green-500)",
    "var(--color-utility-green-400)",
    "var(--color-utility-orange-400)",
    "var(--color-utility-purple-400)",
    "var(--color-utility-neutral-400)",
];

/** Métricas demográficas (gênero + faixa etária) — vão no topo do relatório. */
export function DemografiaMetrics() {
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
            <GeneroCard />
            <div className="lg:col-span-2">
                <IdadeCard />
            </div>
        </div>
    );
}

/** Seções geográficas (país + estado) — mapa + tabela. */
export function GeografiaSecoes() {
    return (
        <>
            <Secao titulo="Compradores por país">
                <GeoMapTable mapa="mundi" rows={PAISES.map((p) => ({ code: p.code, nome: p.nome, valor: p.masculino + p.feminino }))} />
            </Secao>
            <Secao titulo="Compradores por estado">
                <GeoMapTable mapa="brasil" rows={ESTADOS.map((e) => ({ code: e.code, nome: e.nome, valor: e.masculino + e.feminino }))} />
            </Secao>
        </>
    );
}

const Secao = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <section className="flex flex-col gap-5 rounded-xl bg-primary p-5 ring-1 ring-border-secondary md:p-6">
        <h2 className="text-md font-semibold text-primary">{titulo}</h2>
        {children}
    </section>
);

interface DonutDatum {
    nome: string;
    valor: number;
    cor: string;
}

/** Donut de distribuição por valor (padrão do gráfico de status). */
const DonutDistribuicao = ({ dados }: { dados: DonutDatum[] }) => (
    <div className="flex shrink-0 flex-col items-center gap-2">
        <div className="size-44">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={dados} dataKey="valor" nameKey="nome" innerRadius="65%" outerRadius="100%" paddingAngle={2} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                        {dados.map((d) => (
                            <Cell key={d.nome} fill={d.cor} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
        <span className="text-sm font-medium text-tertiary">Distribuição</span>
    </div>
);

/** Item da lista ao lado do donut (bolinha + label + % + valor). */
const DonutLista = ({ dados, total }: { dados: DonutDatum[]; total: number }) => (
    <ul className="flex w-full flex-1 flex-col divide-y divide-secondary">
        {dados.map((d) => (
            <li key={d.nome} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                    <span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: d.cor }} />
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-semibold text-primary">{d.nome}</span>
                        <span className="text-sm text-tertiary">{pct(d.valor / total)}</span>
                    </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">{num(d.valor)}</span>
            </li>
        ))}
    </ul>
);

/** Gênero dos compradores (donut + lista, padrão de status). */
const GeneroCard = () => {
    const total = TOTAL_COMPRADORES || 1;
    const dados: DonutDatum[] = [
        { nome: "Masculino", valor: GENERO.masculino, cor: COR_M },
        { nome: "Feminino", valor: GENERO.feminino, cor: COR_F },
    ];
    return (
        <div className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
            <span className="text-sm text-tertiary">Gênero dos compradores</span>
            <div className="flex flex-col items-center gap-6">
                <DonutDistribuicao dados={dados} />
                <DonutLista dados={dados} total={total} />
            </div>
        </div>
    );
};

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Célula do treemap: retângulo colorido com faixa + % (quando cabe). */
const TreemapCelula = ({ x, y, width, height, nome, valor, cor, total }: any) => {
    const cabe = width > 56 && height > 38;
    const p = pct(valor / total);
    return (
        <g>
            <rect x={x} y={y} width={width} height={height} rx={4} fill={cor} stroke="var(--color-bg-primary)" strokeWidth={2}>
                <title>{`${nome}: ${num(valor)} · ${p}`}</title>
            </rect>
            {cabe && (
                <>
                    <text x={x + 10} y={y + 21} fill="#fff" fontSize={13} fontWeight={600}>{nome}</text>
                    <text x={x + 10} y={y + 38} fill="rgba(255,255,255,0.85)" fontSize={12}>{p}</text>
                </>
            )}
        </g>
    );
};

/** Faixa etária como treemap. */
const IdadeCard = () => {
    const faixas = IDADE.map((f, i) => ({ nome: f.faixa, valor: f.masculino + f.feminino, cor: IDADE_CORES[i % IDADE_CORES.length] }));
    const total = faixas.reduce((s, f) => s + f.valor, 0) || 1;
    return (
        <div className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
            <span className="text-sm text-tertiary">Faixa etária</span>
            <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                        data={faixas}
                        dataKey="valor"
                        nameKey="nome"
                        aspectRatio={16 / 9}
                        isAnimationActive={false}
                        content={<TreemapCelula total={total} />}
                    />
                </ResponsiveContainer>
            </div>
        </div>
    );
};
