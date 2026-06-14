import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit01, LinkExternal01, PlayCircle, Users01 } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { clarityDashboardURL, usabilityStore } from "@/lib/usability";
import type { SessaoTeste, Teste } from "@/lib/usability";

function fmtDuracao(ms: number): string {
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function Resultados() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [teste, setTeste] = useState<Teste | null>(null);
    const [sessoes, setSessoes] = useState<SessaoTeste[]>([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        if (!id) return;
        setCarregando(true);
        Promise.all([usabilityStore.getTeste(id), usabilityStore.listSessoes(id)]).then(([t, s]) => {
            setTeste(t);
            setSessoes(s);
            setCarregando(false);
        });
    }, [id]);

    const metricas = useMemo(() => {
        const participantes = sessoes.length;
        const concluidas = sessoes.filter((s) => s.concluida).length;
        const porAtividade = (teste?.atividades ?? []).map((atividade) => {
            const eventos = sessoes.flatMap((s) => s.eventos).filter((e) => e.atividadeId === atividade.id && e.resultado);
            const sucessos = eventos.filter((e) => e.resultado === "sucesso");
            const desistencias = eventos.filter((e) => e.resultado === "desistencia");
            const tempos = sucessos.map((e) => e.duracaoMs ?? 0).filter(Boolean);
            const tempoMedio = tempos.length ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
            const taxa = eventos.length ? Math.round((sucessos.length / eventos.length) * 100) : 0;
            return { atividade, sucessos: sucessos.length, desistencias: desistencias.length, total: eventos.length, taxa, tempoMedio };
        });
        return { participantes, concluidas, porAtividade };
    }, [sessoes, teste]);

    if (carregando) return <div className="min-h-screen bg-quaternary py-20 text-center text-sm text-tertiary">Carregando…</div>;
    if (!teste) return <div className="min-h-screen bg-quaternary py-20 text-center text-sm text-tertiary">Teste não encontrado.</div>;

    return (
        <div className="min-h-screen bg-quaternary text-primary">
            <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
                <div className="flex flex-col gap-4">
                    <Button size="sm" color="link-gray" iconLeading={ArrowLeft} onClick={() => navigate("/testes")} className="self-start">
                        Voltar
                    </Button>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-semibold text-primary">{teste.nome}</h1>
                            <p className="text-sm text-tertiary">Resultados do teste de usabilidade</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" color="secondary" iconLeading={Edit01} onClick={() => navigate(`/testes/${teste.id}/editar`)}>
                                Editar
                            </Button>
                            <Button size="sm" color="primary" iconLeading={PlayCircle} href={clarityDashboardURL("teste_id", teste.id)} target="_blank">
                                Ver gravações (Clarity)
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Cards de topo */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Card titulo="Participantes" valor={String(metricas.participantes)} icon={Users01} />
                    <Card titulo="Concluíram" valor={String(metricas.concluidas)} />
                    <Card
                        titulo="Taxa de conclusão"
                        valor={metricas.participantes ? `${Math.round((metricas.concluidas / metricas.participantes) * 100)}%` : "—"}
                    />
                </div>

                {/* Por atividade */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-sm font-semibold tracking-wide text-tertiary uppercase">Por tarefa</h2>
                    {metricas.porAtividade.map(({ atividade, sucessos, desistencias, taxa, tempoMedio, total }, i) => (
                        <div key={atividade.id} className="flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-sm font-medium text-primary">
                                    {i + 1}. {atividade.enunciado}
                                </span>
                                <Badge size="sm" type="pill-color" color={taxa >= 70 ? "success" : taxa >= 40 ? "warning" : "error"}>
                                    {total ? `${taxa}% sucesso` : "Sem dados"}
                                </Badge>
                            </div>
                            {/* Barra de progresso da taxa */}
                            <div className="h-2 w-full overflow-hidden rounded-full bg-quaternary">
                                <div className="h-full rounded-full bg-brand-solid transition-all" style={{ width: `${taxa}%` }} />
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-tertiary">
                                <span>{sucessos} concluíram</span>
                                <span>{desistencias} desistiram</span>
                                <span>Tempo médio: {tempoMedio ? fmtDuracao(tempoMedio) : "—"}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="flex items-center gap-1.5 text-xs text-quaternary">
                    <LinkExternal01 className="size-3.5" aria-hidden="true" />
                    As gravações de tela e heatmaps ficam no Clarity, filtrados por este teste. Podem levar alguns minutos para aparecer.
                </p>
            </div>
        </div>
    );
}

function Card({ titulo, valor, icon: Icon }: { titulo: string; valor: string; icon?: typeof Users01 }) {
    return (
        <div className="flex flex-col gap-1 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
            <span className="flex items-center gap-1.5 text-xs text-tertiary">
                {Icon && <Icon className="size-3.5" aria-hidden="true" />}
                {titulo}
            </span>
            <span className="text-2xl font-semibold text-primary tabular-nums">{valor}</span>
        </div>
    );
}
