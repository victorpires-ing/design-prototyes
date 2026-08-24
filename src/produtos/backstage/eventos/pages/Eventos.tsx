import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
    AlertTriangle,
    CheckCircle,
    CurrencyDollarCircle,
    Plus,
    Receipt,
    SearchLg,
    SlashCircle01,
    Ticket01,
    TrendUp01,
} from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { MetricsIcon03 } from "@/components/application/metrics/metrics";
import { Badge } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { InputBase } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { Sparkline } from "../components/Sparkline";
import { EVENTO_STATUS_LABEL, setEventoAtual, type Evento } from "../data/eventos";
import { alertasPorEvento, brl, brlCompacto, numero, precisaAtencao, resumos, type Alerta, type ResumoEvento } from "../data/vendas";

const HIDE_TREND_AND_MENU = "[&_.top-4.right-4]:hidden [&_.md\\:top-5]:hidden [&_p+div]:hidden";

type Filtro = "atencao" | "ativos" | "rascunhos" | "encerrados" | "todos";
type Ordem = "data" | "ocupacao" | "faturamento" | "ritmo";

const FILTROS: Array<{ id: Filtro; label: string }> = [
    { id: "atencao", label: "Precisam de atenção" },
    { id: "ativos", label: "Ativos" },
    { id: "rascunhos", label: "Rascunhos" },
    { id: "encerrados", label: "Encerrados" },
    { id: "todos", label: "Todos" },
];

const ORDENS = [
    { id: "data", label: "Data do evento" },
    { id: "ocupacao", label: "Ocupação" },
    { id: "faturamento", label: "Faturamento" },
    { id: "ritmo", label: "Ritmo de vendas" },
];

/** Camada 1 — painel da organização: como estão os eventos e onde agir hoje. */
export function Eventos() {
    const navigate = useNavigate();
    const [term, setTerm] = useState("");
    const [filtro, setFiltro] = useState<Filtro>("ativos");
    const [ordem, setOrdem] = useState<Ordem>("data");

    const todos = useMemo(resumos, []);
    const porEvento = useMemo(alertasPorEvento, []);
    const comAtencao = todos.filter((r) => precisaAtencao(porEvento.get(r.evento.id)));

    const ativos = todos.filter((r) => r.evento.status === "publicado");

    const totais = useMemo(
        () => ({
            faturamento: ativos.reduce((total, r) => total + r.faturamento, 0),
            ingressos: ativos.reduce((total, r) => total + r.vendidos, 0),
            ticket:
                ativos.reduce((t, r) => t + r.faturamento, 0) /
                Math.max(
                    1,
                    ativos.reduce((t, r) => t + r.vendidos, 0),
                ),
            ritmo: ativos.reduce((total, r) => total + r.ritmo7, 0),
        }),
        [ativos],
    );

    const visiveis = useMemo(() => {
        const query = term.trim().toLowerCase();
        const porFiltro = todos.filter((r) => {
            if (filtro === "atencao") return precisaAtencao(porEvento.get(r.evento.id));
            if (filtro === "ativos") return r.evento.status === "publicado";
            if (filtro === "rascunhos") return r.evento.status === "rascunho";
            if (filtro === "encerrados") return r.evento.status === "encerrado";
            return true;
        });
        const porBusca = query
            ? porFiltro.filter((r) => `${r.evento.nome} ${r.evento.produtor} ${r.evento.local}`.toLowerCase().includes(query))
            : porFiltro;

        return [...porBusca].sort((a, b) => {
            if (ordem === "ocupacao") return b.ocupacao - a.ocupacao;
            if (ordem === "faturamento") return b.faturamento - a.faturamento;
            if (ordem === "ritmo") return b.ritmo7 - a.ritmo7;
            return new Date(a.evento.data).getTime() - new Date(b.evento.data).getTime();
        });
    }, [todos, porEvento, term, filtro, ordem]);

    const abrir = (evento: Evento, href = "/backstage/relatorios/vendas-por-grupo") => {
        setEventoAtual(evento.id);
        navigate(href);
    };

    return (
        <BackstageLayout activeProducer="eventos" showEventContext={false}>
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-display-xs font-bold text-primary">Eventos</h1>
                        <p className="text-sm text-tertiary">
                            {ativos.length} {ativos.length === 1 ? "evento ativo" : "eventos ativos"}
                        </p>
                    </div>
                    <Button size="md" color="primary" iconLeading={Plus}>
                        Criar evento
                    </Button>
                </header>

                {/* Resumo da organização */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricsIcon03
                        icon={CurrencyDollarCircle}
                        subtitle="Faturamento confirmado"
                        title={brl(totais.faturamento)}
                        change={null}
                        changeTrend="positive"
                        actions={false}
                        className={HIDE_TREND_AND_MENU}
                    />
                    <MetricsIcon03
                        icon={Ticket01}
                        subtitle="Ingressos vendidos"
                        title={numero(totais.ingressos)}
                        change={null}
                        changeTrend="positive"
                        actions={false}
                        className={HIDE_TREND_AND_MENU}
                    />
                    <MetricsIcon03
                        icon={Receipt}
                        subtitle="Ticket médio"
                        title={brl(totais.ticket)}
                        change={null}
                        changeTrend="positive"
                        actions={false}
                        className={HIDE_TREND_AND_MENU}
                    />
                    <MetricsIcon03
                        icon={TrendUp01}
                        subtitle="Ritmo atual"
                        title={`${numero(totais.ritmo)}/dia`}
                        change={null}
                        changeTrend="positive"
                        actions={false}
                        className={HIDE_TREND_AND_MENU}
                    />
                </div>

                {/* Filtros da listagem */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {/* Rolagem lateral no mobile: quatro filtros não cabem em 375px. */}
                    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                        <ButtonGroup
                            size="sm"
                            selectedKeys={[filtro]}
                            disallowEmptySelection
                            onSelectionChange={(keys) => {
                                const next = [...keys][0];
                                if (next) setFiltro(next as Filtro);
                            }}
                        >
                            {FILTROS.map((item) => (
                                <ButtonGroupItem key={item.id} id={item.id}>
                                    {item.id === "atencao" ? `Atenção (${comAtencao.length})` : item.label}
                                </ButtonGroupItem>
                            ))}
                        </ButtonGroup>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="md:w-[260px]">
                            <InputBase
                                size="sm"
                                icon={SearchLg}
                                value={term}
                                aria-label="Buscar evento"
                                onChange={(event) => setTerm(event.target.value)}
                                placeholder="Buscar por nome, produtor ou local"
                            />
                        </div>
                        <div className="md:w-[190px]">
                            <Select
                                aria-label="Ordenar por"
                                size="sm"
                                selectedKey={ordem}
                                onSelectionChange={(key) => setOrdem(String(key) as Ordem)}
                                items={ORDENS}
                            >
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Listagem */}
                {visiveis.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center py-16">
                        <EmptyState size="sm">
                            <EmptyState.Header>
                                <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <EmptyState.Title>Nenhum evento encontrado</EmptyState.Title>
                                <EmptyState.Description>Tente outro filtro, nome, produtor ou local.</EmptyState.Description>
                            </EmptyState.Content>
                        </EmptyState>
                    </div>
                ) : (
                    <div className="@container flex flex-col divide-y divide-secondary border-b border-secondary">
                        {visiveis.map((resumo) => (
                            <EventoLinha
                                key={resumo.evento.id}
                                resumo={resumo}
                                alertas={porEvento.get(resumo.evento.id) ?? []}
                                onOpen={(href) => abrir(resumo.evento, href)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </BackstageLayout>
    );
}

const TOM_ICONE = {
    error: SlashCircle01,
    warning: AlertTriangle,
    success: CheckCircle,
} as const;

const TOM_COR = {
    error: "text-fg-error-secondary",
    warning: "text-fg-warning-secondary",
    success: "text-fg-success-secondary",
} as const;

const EventoLinha = ({ resumo, alertas, onOpen }: { resumo: ResumoEvento; alertas: Alerta[]; onOpen: (href?: string) => void }) => {
    const { evento, faturamento, meta, ritmo7, variacaoRitmo, diasParaEvento } = resumo;
    const encerrado = evento.status === "encerrado";

    return (
        <article className="relative flex flex-col transition duration-100 ease-linear hover:bg-primary_hover">
            {/* O botão principal cobre a linha inteira; os avisos ficam acima dele. */}
            <button
                type="button"
                onClick={() => onOpen()}
                className="flex flex-col gap-4 px-3 py-4 text-left outline-hidden after:absolute after:inset-0 @3xl:flex-row @3xl:items-center"
            >
                <span className="flex min-w-0 flex-1 items-center gap-3">
                    <img src={evento.cover} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                    <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-primary">{evento.nome}</h3>
                            <Badge
                                size="sm"
                                type="pill-color"
                                color={evento.status === "publicado" ? "success" : evento.status === "rascunho" ? "warning" : "gray"}
                            >
                                {EVENTO_STATUS_LABEL[evento.status]}
                            </Badge>
                        </span>
                        <span className="truncate text-sm text-tertiary">{evento.dataLabel}</span>
                        <span className="text-sm text-quaternary">
                            {encerrado ? "Evento realizado" : diasParaEvento >= 0 ? `Faltam ${diasParaEvento} dias` : "Em andamento"}
                        </span>
                    </span>
                </span>

                <span className="flex w-full flex-col gap-0.5 @3xl:w-[200px]">
                    <span className="text-sm text-tertiary">Faturamento</span>
                    <span className="text-sm font-semibold text-primary tabular-nums">{brlCompacto(faturamento)}</span>
                    {meta > 0 && (
                        <span className="text-sm text-quaternary tabular-nums">
                            {Math.round((faturamento / meta) * 100)}% da meta de {brlCompacto(meta)}
                        </span>
                    )}
                </span>

                <span className="flex w-full flex-col gap-0.5 @3xl:w-[150px]">
                    <span className="text-sm text-tertiary">Ritmo (7 dias)</span>
                    <span className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-primary tabular-nums">{numero(ritmo7)}/dia</span>
                        {!encerrado && Math.abs(variacaoRitmo) >= 0.05 && (
                            <span
                                className={cx(
                                    "text-sm font-medium tabular-nums",
                                    variacaoRitmo > 0 ? "text-success-primary" : "text-error-primary",
                                )}
                            >
                                {variacaoRitmo > 0 ? "+" : "−"}
                                {Math.round(Math.abs(variacaoRitmo) * 100)}%
                            </span>
                        )}
                    </span>
                    <Sparkline
                        values={resumo.sparkline}
                        stroke={variacaoRitmo < 0 ? "var(--color-fg-error-secondary)" : "var(--color-fg-success-secondary)"}
                    />
                </span>
            </button>

            {alertas.length > 0 && (
                <ul className="flex flex-col gap-1 px-3 pb-3">
                    {alertas.map((alerta) => {
                        const Icone = TOM_ICONE[alerta.tom];
                        return (
                            <li key={alerta.id} className="flex items-start gap-2">
                                <Icone className={cx("mt-0.5 size-4 shrink-0", TOM_COR[alerta.tom])} aria-hidden="true" />
                                <p className="text-sm text-tertiary">
                                    <span className="font-medium text-secondary">{alerta.titulo}</span> {alerta.detalhe}{" "}
                                    {/* z-10 para escapar do after:inset-0 do botão principal. */}
                                    <button
                                        type="button"
                                        onClick={() => onOpen(alerta.href)}
                                        className="relative z-10 font-semibold text-brand-secondary underline-offset-2 transition duration-100 ease-linear hover:text-brand-secondary_hover hover:underline"
                                    >
                                        {alerta.acao}
                                    </button>
                                </p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </article>
    );
};
