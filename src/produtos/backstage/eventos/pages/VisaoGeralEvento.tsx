import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { InputBase } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { OcupacaoBar } from "../components/OcupacaoBar";
import { Sparkline } from "../components/Sparkline";
import { useEventoAtual } from "../data/eventos";
import { addMarco, removeMarco, TIPO_MARCO_LABEL, useMarcos, type TipoMarco } from "../data/marcos";
import { brl, brlCompacto, HOJE, numero, resumoDoEvento, type Sessao } from "../data/vendas";

const TIPOS = (Object.keys(TIPO_MARCO_LABEL) as TipoMarco[]).map((id) => ({ id, label: TIPO_MARCO_LABEL[id] }));

/** Camada 2 — o painel operacional de um evento. */
export function VisaoGeralEvento() {
    const evento = useEventoAtual();
    const resumo = useMemo(() => resumoDoEvento(evento), [evento]);
    const marcos = useMarcos(evento.id);

    const [tipo, setTipo] = useState<TipoMarco>("lote");
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [data, setData] = useState(HOJE.toISOString().slice(0, 10));

    const salvarMarco = () => {
        if (!titulo.trim()) return;
        addMarco({ eventoId: evento.id, data, tipo, titulo: titulo.trim(), descricao: descricao.trim() || undefined });
        setTitulo("");
        setDescricao("");
    };

    if (!resumo.vendas) {
        return (
            <BackstageLayout activeSection="visao-geral" activeItem="visao-geral">
                <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                    <h1 className="text-display-xs font-bold text-primary">Visão geral</h1>
                    <p className="text-sm text-tertiary">Este evento ainda não tem vendas para acompanhar.</p>
                </div>
            </BackstageLayout>
        );
    }

    const { vendas } = resumo;
    const ambientes = [...new Set(vendas.sessoes.map((s) => s.ambiente))];
    const totalPagamentos = vendas.pagamentos.reduce((total, p) => total + p.qtd, 0);
    const serieGrafico = vendas.serie.slice(-60).map((dia) => ({ ...dia, label: dia.dataISO.slice(5) }));

    return (
        <BackstageLayout activeSection="visao-geral" activeItem="visao-geral">
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-display-xs font-bold text-primary">Visão geral</h1>
                        <p className="text-sm text-tertiary">
                            {evento.dataLabel} · {resumo.diasParaEvento >= 0 ? `faltam ${resumo.diasParaEvento} dias` : "evento realizado"}
                        </p>
                    </div>
                    <Badge
                        size="sm"
                        type="pill-color"
                        color={resumo.ocupacao >= 0.7 ? "success" : resumo.ocupacao >= 0.4 ? "warning" : "error"}
                    >
                        {Math.round(resumo.ocupacao * 100)}% de ocupação
                    </Badge>
                </header>

                {/* Faturamento contra meta */}
                <section className="flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                            <p className="text-sm text-tertiary">Faturamento confirmado</p>
                            <p className="text-display-sm font-bold text-primary">{brl(resumo.faturamento)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                            <p className="text-sm text-tertiary">Meta {brlCompacto(resumo.meta)}</p>
                            <p className="text-sm font-semibold text-secondary tabular-nums">
                                {Math.round((resumo.faturamento / resumo.meta) * 100)}% atingido
                            </p>
                        </div>
                    </div>

                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-quaternary">
                        <span
                            className="absolute inset-y-0 left-0 rounded-full bg-brand-solid"
                            style={{ width: `${Math.min(100, (resumo.faturamento / resumo.meta) * 100)}%` }}
                            aria-hidden="true"
                        />
                        <span
                            className="absolute inset-y-0 w-0.5 bg-fg-warning-secondary"
                            style={{ left: `${Math.min(100, (resumo.projecao / resumo.meta) * 100)}%` }}
                            aria-hidden="true"
                            title="Projeção no ritmo atual"
                        />
                    </div>

                    <p className="text-sm text-tertiary">
                        No ritmo atual, a projeção para o dia do evento é{" "}
                        <strong className="font-semibold text-secondary">{brlCompacto(resumo.projecao)}</strong> —{" "}
                        {Math.round((resumo.projecao / resumo.meta) * 100)}% da meta.
                    </p>
                </section>

                {/* Capacidade por sessão */}
                <section className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary">
                    <header className="flex flex-col gap-0.5 border-b border-secondary px-5 py-4">
                        <h2 className="text-md font-semibold text-primary">Capacidade por sessão</h2>
                        <p className="text-sm text-tertiary">
                            {vendas.sessoes.length} {vendas.sessoes.length === 1 ? "sessão" : "sessões"} em{" "}
                            {ambientes.length === 1 ? ambientes[0] : `${ambientes.length} ambientes`} · barra dividida por canal de venda
                        </p>
                    </header>

                    {ambientes.map((ambiente) => (
                        <div key={ambiente} className="flex flex-col">
                            {ambientes.length > 1 && (
                                <p className="border-b border-secondary bg-secondary px-5 py-2 text-sm font-medium text-secondary">
                                    {ambiente}
                                </p>
                            )}
                            {vendas.sessoes
                                .filter((s) => s.ambiente === ambiente)
                                .map((sessao) => (
                                    <SessaoLinha key={sessao.id} sessao={sessao} />
                                ))}
                        </div>
                    ))}
                </section>

                {/* Velocidade de vendas */}
                <section className="flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-md font-semibold text-primary">Velocidade de vendas</h2>
                        <p className="text-sm text-tertiary">Ingressos por dia e o efeito de cada marco na curva</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <VelocidadeCard
                            label="Últimos 7 dias"
                            valor={`${numero(resumo.ritmo7)}/dia`}
                            variacao={resumo.variacaoRitmo}
                            serie={resumo.sparkline.slice(-7)}
                        />
                        <VelocidadeCard
                            label="Últimos 30 dias"
                            valor={`${numero(resumo.sparkline.reduce((t, v) => t + v, 0) / Math.max(1, resumo.sparkline.length))}/dia`}
                            serie={resumo.sparkline}
                        />
                        <VelocidadeCard label="Ticket médio atual" valor={brl(resumo.ticketMedio)} />
                    </div>

                    <div className="h-[220px] w-full text-tertiary">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={serieGrafico}
                                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                                className="[&_.recharts-text]:text-sm"
                            >
                                <defs>
                                    <linearGradient id="grad-velocidade" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--color-utility-brand-500)" stopOpacity={0.35} />
                                        <stop offset="90%" stopColor="var(--color-utility-brand-500)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="currentColor" className="text-utility-neutral-100" />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={32}
                                    fill="currentColor"
                                />
                                <YAxis tickLine={false} axisLine={false} width={44} fill="currentColor" />
                                <Tooltip
                                    cursor={{ stroke: "var(--color-utility-brand-600)", strokeWidth: 2 }}
                                    content={({ active, payload, label }) =>
                                        active && payload?.length ? (
                                            <div className="rounded-lg bg-primary-solid px-3 py-2 shadow-lg">
                                                <p className="text-sm font-semibold text-white">{label}</p>
                                                <p className="text-sm text-tooltip-supporting-text">
                                                    {numero(Number(payload[0].value))} ingressos
                                                </p>
                                            </div>
                                        ) : null
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="ingressos"
                                    stroke="var(--color-utility-brand-500)"
                                    strokeWidth={2}
                                    fill="url(#grad-velocidade)"
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Marcos & anotações */}
                <section className="flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-md font-semibold text-primary">Marcos & anotações</h2>
                        <p className="text-sm text-tertiary">
                            Registre o que causou cada pico ou queda — virada de lote, anúncio de atração, ação de marketing, evento
                            externo.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                        <div className="flex flex-col gap-1.5 lg:w-[150px]">
                            <label htmlFor="marco-data" className="text-sm font-medium text-secondary">
                                Data
                            </label>
                            <InputBase id="marco-data" size="sm" type="date" value={data} onChange={(e) => setData(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1.5 lg:w-[190px]">
                            <span className="text-sm font-medium text-secondary">Tipo</span>
                            <Select
                                aria-label="Tipo do marco"
                                size="sm"
                                selectedKey={tipo}
                                onSelectionChange={(k) => setTipo(String(k) as TipoMarco)}
                                items={TIPOS}
                            >
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                        </div>
                        <div className="flex flex-1 flex-col gap-1.5">
                            <label htmlFor="marco-titulo" className="text-sm font-medium text-secondary">
                                Título
                            </label>
                            <InputBase
                                id="marco-titulo"
                                size="sm"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="ex.: virou o lote 5"
                            />
                        </div>
                        <div className="flex flex-1 flex-col gap-1.5">
                            <label htmlFor="marco-desc" className="text-sm font-medium text-secondary">
                                Descrição
                            </label>
                            <InputBase
                                id="marco-desc"
                                size="sm"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder="Opcional"
                            />
                        </div>
                        <Button size="sm" color="primary" iconLeading={Plus} isDisabled={!titulo.trim()} onClick={salvarMarco}>
                            Salvar
                        </Button>
                    </div>

                    {marcos.length === 0 ? (
                        <p className="text-sm text-tertiary">Nenhuma anotação ainda.</p>
                    ) : (
                        <ul className="flex flex-col divide-y divide-border-secondary">
                            {marcos.map((marco) => (
                                <li key={marco.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                                    <span className="w-20 shrink-0 text-sm text-tertiary tabular-nums">
                                        {marco.data.split("-").reverse().slice(0, 2).join("/")}
                                    </span>
                                    <Badge size="sm" type="modern" color="gray">
                                        {TIPO_MARCO_LABEL[marco.tipo]}
                                    </Badge>
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <p className="text-sm font-medium text-primary">{marco.titulo}</p>
                                        {marco.descricao && <p className="text-sm text-tertiary">{marco.descricao}</p>}
                                    </div>
                                    <ButtonUtility
                                        size="xs"
                                        color="tertiary"
                                        icon={Trash01}
                                        tooltip="Remover anotação"
                                        onClick={() => removeMarco(marco.id)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Métodos de pagamento */}
                <section className="flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-md font-semibold text-primary">Métodos de pagamento</h2>
                        <p className="text-sm text-tertiary">Distribuição das transações confirmadas</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {vendas.pagamentos.map((pagamento) => (
                            <div key={pagamento.tipo} className="flex flex-col gap-1 rounded-lg bg-secondary p-4">
                                <p className="text-sm text-tertiary">{pagamento.tipo}</p>
                                <p className="text-display-xs font-bold text-primary tabular-nums">{numero(pagamento.qtd)}</p>
                                <p className="text-sm text-quaternary tabular-nums">
                                    {Math.round((pagamento.qtd / totalPagamentos) * 100)}%
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </BackstageLayout>
    );
}

const SessaoLinha = ({ sessao }: { sessao: Sessao }) => {
    const vendidos = sessao.vendas.ingresse + sessao.vendas.parceiro + sessao.vendas.cortesia;
    const ocupacao = vendidos / sessao.capacidade;
    const restante = sessao.capacidade - vendidos;

    return (
        <div className="flex flex-col gap-2 border-b border-secondary px-5 py-4 last:border-b-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-primary">{sessao.nome}</h3>
                <span className="flex items-baseline gap-3 text-sm tabular-nums">
                    <span className={cx("font-semibold", ocupacao < 0.35 ? "text-error-primary" : "text-primary")}>
                        {Math.round(ocupacao * 100)}%
                    </span>
                    <span className="text-tertiary">{numero(restante)} disponíveis</span>
                </span>
            </div>
            <OcupacaoBar porCanal={sessao.vendas} capacidade={sessao.capacidade} withLegend />
        </div>
    );
};

const VelocidadeCard = ({ label, valor, variacao, serie }: { label: string; valor: string; variacao?: number; serie?: number[] }) => (
    <div className="flex flex-col gap-1 rounded-lg bg-secondary p-4">
        <p className="text-sm text-tertiary">{label}</p>
        <p className="flex items-baseline gap-2">
            <span className="text-display-xs font-bold text-primary tabular-nums">{valor}</span>
            {variacao != null && Math.abs(variacao) >= 0.05 && (
                <span className={cx("text-sm font-medium tabular-nums", variacao > 0 ? "text-success-primary" : "text-error-primary")}>
                    {variacao > 0 ? "+" : "−"}
                    {Math.round(Math.abs(variacao) * 100)}%
                </span>
            )}
        </p>
        {serie && <Sparkline values={serie} stroke="var(--color-utility-brand-500)" />}
    </div>
);
