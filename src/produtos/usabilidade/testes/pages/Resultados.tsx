import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit01, LinkExternal01, PlayCircle, Users01 } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { calcularSus, classificarSus, clarityDashboardURL, usabilityStore } from "@/lib/usability";
import type { BlocoAtividade, BlocoPergunta, BlocoSus, EventoBloco, SessaoTeste, Teste } from "@/lib/usability";

function fmtDuracao(ms: number): string {
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
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

    const todosEventos = useMemo(() => sessoes.flatMap((s) => s.eventos), [sessoes]);
    const participantes = sessoes.length;
    const concluidas = sessoes.filter((s) => s.concluida).length;

    if (carregando) return <div className="min-h-screen bg-primary py-20 text-center text-sm text-tertiary">Carregando…</div>;
    if (!teste) return <div className="min-h-screen bg-primary py-20 text-center text-sm text-tertiary">Teste não encontrado.</div>;

    const atividades = teste.blocos.filter((b): b is BlocoAtividade => b.tipo === "atividade");
    const perguntas = teste.blocos.filter((b): b is BlocoPergunta => b.tipo === "pergunta");
    const susBlocos = teste.blocos.filter((b): b is BlocoSus => b.tipo === "sus");

    return (
        <div className="min-h-screen bg-primary text-primary">
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
                    <Card titulo="Participantes" valor={String(participantes)} icon={Users01} />
                    <Card titulo="Concluíram" valor={String(concluidas)} />
                    <Card titulo="Taxa de conclusão" valor={participantes ? `${Math.round((concluidas / participantes) * 100)}%` : "—"} />
                </div>

                {/* Atividades */}
                {atividades.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-sm font-semibold tracking-wide text-tertiary uppercase">Tarefas</h2>
                        {atividades.map((bloco, i) => (
                            <ResultadoAtividade key={bloco.id} bloco={bloco} numero={i + 1} eventos={todosEventos.filter((e) => e.blocoId === bloco.id && e.resultado)} />
                        ))}
                    </div>
                )}

                {/* SUS */}
                {susBlocos.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-sm font-semibold tracking-wide text-tertiary uppercase">Escala de usabilidade (SUS)</h2>
                        {susBlocos.map((bloco) => (
                            <ResultadoSus key={bloco.id} bloco={bloco} eventos={todosEventos.filter((e) => e.blocoId === bloco.id && e.resposta)} />
                        ))}
                    </div>
                )}

                {/* Perguntas */}
                {perguntas.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-sm font-semibold tracking-wide text-tertiary uppercase">Perguntas</h2>
                        {perguntas.map((bloco) => (
                            <ResultadoPergunta key={bloco.id} bloco={bloco} eventos={todosEventos.filter((e) => e.blocoId === bloco.id && e.resposta)} />
                        ))}
                    </div>
                )}

                <p className="flex items-center gap-1.5 text-xs text-quaternary">
                    <LinkExternal01 className="size-3.5" aria-hidden="true" />
                    As gravações de tela e heatmaps ficam no Clarity, filtrados por este teste. Podem levar alguns minutos para aparecer.
                </p>
            </div>
        </div>
    );
}

function ResultadoAtividade({ bloco, numero, eventos }: { bloco: BlocoAtividade; numero: number; eventos: EventoBloco[] }) {
    const sucessos = eventos.filter((e) => e.resultado === "sucesso");
    const desistencias = eventos.filter((e) => e.resultado === "desistencia");
    const tempos = sucessos.map((e) => e.duracaoMs ?? 0).filter(Boolean);
    const tempoMedio = tempos.length ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
    const taxa = eventos.length ? Math.round((sucessos.length / eventos.length) * 100) : 0;
    return (
        <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
            <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-primary">
                    {numero}. {bloco.enunciado || bloco.titulo}
                </span>
                <Badge size="sm" type="pill-color" color={taxa >= 70 ? "success" : taxa >= 40 ? "warning" : "error"}>
                    {eventos.length ? `${taxa}% sucesso` : "Sem dados"}
                </Badge>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-quaternary">
                <div className="h-full rounded-full bg-brand-solid transition-all" style={{ width: `${taxa}%` }} />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-tertiary">
                <span>{sucessos.length} concluíram</span>
                <span>{desistencias.length} desistiram</span>
                <span>Tempo médio: {tempoMedio ? fmtDuracao(tempoMedio) : "—"}</span>
            </div>
            {desistencias.some((e) => e.justificativa) && (
                <div className="flex flex-col gap-1.5 border-t border-secondary pt-3">
                    <span className="text-xs font-semibold text-tertiary">Justificativas de desistência</span>
                    {desistencias.filter((e) => e.justificativa).map((e, i) => (
                        <p key={i} className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary">{e.justificativa}</p>
                    ))}
                </div>
            )}
        </div>
    );
}

function ResultadoSus({ bloco, eventos }: { bloco: BlocoSus; eventos: EventoBloco[] }) {
    const scores = eventos.map((e) => calcularSus((e.resposta ?? []).map(Number))).filter((s): s is number => s !== null);
    const media = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
    const classe = media !== null ? classificarSus(media) : null;
    return (
        <div className="flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
            <span className="text-sm font-medium text-primary">{bloco.titulo}</span>
            {media === null ? (
                <p className="text-sm text-tertiary">Sem respostas ainda.</p>
            ) : (
                <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center justify-center rounded-xl bg-secondary px-6 py-4">
                        <span className="text-4xl font-semibold text-primary tabular-nums">{media}</span>
                        <span className="text-xs text-tertiary">de 100</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Badge size="sm" type="pill-color" color={media >= 68 ? "success" : media >= 51 ? "warning" : "error"}>
                                Nota {classe?.nota} · {classe?.adjetivo}
                            </Badge>
                        </div>
                        <span className="text-xs text-tertiary">{scores.length} {scores.length === 1 ? "resposta" : "respostas"} · referência: 68 é a média de mercado</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function ResultadoPergunta({ bloco, eventos }: { bloco: BlocoPergunta; eventos: EventoBloco[] }) {
    const respostas = eventos.flatMap((e) => e.resposta ?? []).filter((r) => r.trim());
    return (
        <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
            <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-primary">{bloco.enunciado || bloco.titulo}</span>
                <Badge size="sm" type="pill-color" color="gray">
                    {eventos.length} {eventos.length === 1 ? "resposta" : "respostas"}
                </Badge>
            </div>
            {bloco.formato === "aberta" ? (
                respostas.length === 0 ? (
                    <p className="text-xs text-tertiary">Sem respostas ainda.</p>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        {respostas.slice(0, 50).map((r, i) => (
                            <p key={i} className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary">
                                {r}
                            </p>
                        ))}
                    </div>
                )
            ) : (
                <div className="flex flex-col gap-2">
                    {bloco.opcoes.map((op) => {
                        const n = respostas.filter((r) => r === op).length;
                        const pct = respostas.length ? Math.round((n / respostas.length) * 100) : 0;
                        return (
                            <div key={op} className="flex flex-col gap-1">
                                <div className="flex justify-between text-xs text-tertiary">
                                    <span>{op}</span>
                                    <span>{n} · {pct}%</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-quaternary">
                                    <div className="h-full rounded-full bg-brand-solid" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
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
