import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { cx } from "@/utils/cx";
import { AntifraudeShell } from "../components/AntifraudeShell";
import { IconBan, IconCalendar, IconCheck, IconExternal } from "../components/retool/icons";
import { RButton, RKeyValue, RSelect, RTabs } from "../components/retool/ui";
import { UsuariosSuspensos } from "./UsuariosSuspensos";
import {
    FERRAMENTAS,
    OPERADORES,
    STATUS_ANALISE,
    TRANSACOES,
    moeda,
    numero,
    type Transacao,
} from "../data/antifraude";

type Aba = "fila" | "suspensos";

/**
 * Reanálise — fila de análise de transações com painel de decisão e a
 * lista de usuários suspensos (Figma "Reanálise").
 */
export function Reanalise() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const aba: Aba = params.get("tab") === "suspensos" ? "suspensos" : "fila";

    const [transacoes, setTransacoes] = useState<Transacao[]>(TRANSACOES);
    const [selecionadaId, setSelecionadaId] = useState(TRANSACOES[0].id);
    const [statusFiltro, setStatusFiltro] = useState("");
    const [operadorFiltro, setOperadorFiltro] = useState("");

    const lista = useMemo(
        () => (statusFiltro ? transacoes.filter((t) => t.decisao === statusFiltro) : transacoes),
        [transacoes, statusFiltro],
    );
    const selecionada = transacoes.find((t) => t.id === selecionadaId) ?? lista[0] ?? null;

    const metricas = useMemo(() => {
        const total = transacoes.reduce((acc, t) => acc + t.valor, 0);
        const suspeitas = transacoes.filter((t) => t.alertaEvento !== null);
        const semDecisao = transacoes.filter((t) => t.decisao === "sem-decisao");
        return [
            { label: "Total de Transações", valor: total, qtd: transacoes.length },
            { label: "Atribuídas", valor: total, qtd: transacoes.length },
            { label: "Total de Suspeitas", valor: suspeitas.reduce((acc, t) => acc + t.valor, 0), qtd: suspeitas.length },
            { label: "Total sem decisão", valor: semDecisao.reduce((acc, t) => acc + t.valor, 0), qtd: semDecisao.length },
        ];
    }, [transacoes]);

    const aprovar = (id: string) => setTransacoes((prev) => prev.map((t) => (t.id === id ? { ...t, decisao: "aprovada" } : t)));

    const trocarAba = (proxima: Aba) => {
        const next = new URLSearchParams(params);
        if (proxima === "fila") next.delete("tab");
        else next.set("tab", proxima);
        setParams(next);
    };

    return (
        <AntifraudeShell>
            <div className="flex min-w-0 flex-col gap-4 px-5 py-4">
                <RTabs
                    value={aba}
                    onChange={trocarAba}
                    items={[
                        { id: "fila", label: "Fila de análise" },
                        { id: "suspensos", label: "Usuários suspensos" },
                    ]}
                />

                {aba === "fila" ? (
                    <>
                        {/* Filtros */}
                        <section className="rt-card flex flex-col gap-4 !p-4 lg:flex-row lg:items-end lg:gap-6">
                            <div className="w-full lg:w-[260px]">
                                <span className="rt-label">Data do evento</span>
                                <RButton variant="secondary" className="w-full !justify-start" icon={<IconCalendar />}>
                                    24 ago 2026 – 08 set 2026
                                </RButton>
                            </div>

                            <div className="w-full lg:w-[220px]">
                                <RSelect
                                    id="filtro-status"
                                    label="Status da análise"
                                    placeholder="Todos"
                                    value={statusFiltro}
                                    onChange={setStatusFiltro}
                                    options={STATUS_ANALISE.map((s) => ({ value: s.id, label: s.label }))}
                                />
                            </div>

                            <div className="w-full lg:w-[220px]">
                                <RSelect
                                    id="filtro-operador"
                                    label="Operadores"
                                    placeholder="Todos"
                                    value={operadorFiltro}
                                    onChange={setOperadorFiltro}
                                    options={OPERADORES.map((nome) => ({ value: nome, label: nome }))}
                                />
                            </div>
                        </section>

                        <div className="flex min-w-0 flex-col gap-4 xl:flex-row">
                            {/* Fila */}
                            <section className="rt-card flex min-w-0 flex-1 flex-col">
                                <h1 className="text-[17px] font-semibold text-[var(--rt-text)]">Transações para análise</h1>

                                <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                                    {metricas.map((m) => (
                                        <div key={m.label} className="flex flex-col gap-0.5">
                                            <dt className="text-[12px] text-[var(--rt-text-secondary)]">{m.label}</dt>
                                            <dd className="rt-num text-[20px] font-semibold text-[var(--rt-text)]">{moeda.format(m.valor)}</dd>
                                            <span className="text-[11px] text-[var(--rt-text-tertiary)]">
                                                Quantidade de transações: {numero.format(m.qtd)}
                                            </span>
                                        </div>
                                    ))}
                                </dl>

                                <div className="mt-4 overflow-x-auto">
                                    <table className="rt-table">
                                        <thead>
                                            <tr>
                                                <th>company</th>
                                                <th>is_eventAlert</th>
                                                <th className="!text-right">amount</th>
                                                <th>payment_date</th>
                                                <th>event_date</th>
                                                <th>event_id</th>
                                                <th>event_name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lista.map((t) => (
                                                <tr
                                                    key={t.id}
                                                    onClick={() => setSelecionadaId(t.id)}
                                                    className={cx(
                                                        "rt-row--clickable",
                                                        selecionada?.id === t.id
                                                            ? "rt-row--selected"
                                                            : t.decisao === "aprovada"
                                                              ? "rt-row--approved"
                                                              : t.decisao === "suspensa"
                                                                ? "rt-row--alert"
                                                                : undefined,
                                                    )}
                                                >
                                                    <td>{t.companhia}</td>
                                                    <td className="rt-num">{t.alertaEvento ?? ""}</td>
                                                    <td className="rt-num !text-right font-medium">{moeda.format(t.valor)}</td>
                                                    <td className="rt-num whitespace-nowrap">{t.dataPagamento}</td>
                                                    <td className="whitespace-nowrap">{t.dataEvento}</td>
                                                    <td className="max-w-[110px] truncate">{t.idEvento}</td>
                                                    <td className="max-w-[220px] truncate">{t.nomeEvento}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-3 flex items-center justify-between text-[12px] text-[var(--rt-text-secondary)]">
                                    <span>
                                        Mostrando 1–{lista.length} de {numero.format(lista.length)}
                                    </span>
                                    <span>Página 1 de 1</span>
                                </div>
                            </section>

                            {/* Painel lateral: decisão + dados */}
                            <div className="flex w-full shrink-0 flex-col gap-4 xl:max-w-[340px]">
                                <section className="rt-card flex flex-col gap-4">
                                    <h2 className="rt-card__title">Decisão</h2>

                                    <RKeyValue label="Orientação" value={selecionada?.orientacao} />

                                    <div className="flex flex-col gap-2">
                                        <span className="text-[12px] text-[var(--rt-text-secondary)]">Links e ferramentas</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {FERRAMENTAS.map((ferramenta) => (
                                                <button key={ferramenta} type="button" className="rt-tool">
                                                    <IconExternal size={11} />
                                                    {ferramenta}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <RButton
                                            variant="danger-outline"
                                            className="flex-1"
                                            icon={<IconBan />}
                                            disabled={!selecionada}
                                            onClick={() =>
                                                selecionada &&
                                                navigate(
                                                    `/payin/suspensao-de-conta/suspender-usuario?email=${encodeURIComponent(selecionada.emailUsuario)}`,
                                                )
                                            }
                                        >
                                            Suspender
                                        </RButton>
                                        <RButton
                                            variant="secondary"
                                            className="flex-1"
                                            icon={<IconCheck />}
                                            disabled={!selecionada || selecionada.decisao === "aprovada"}
                                            onClick={() => selecionada && aprovar(selecionada.id)}
                                        >
                                            Aprovar
                                        </RButton>
                                    </div>
                                </section>

                                <section className="rt-card flex flex-col gap-3">
                                    <h2 className="rt-card__title">Dados</h2>

                                    <dl className="flex flex-col gap-3">
                                        <Linha label="Companhia" valor={selecionada?.companhia} />
                                        <Linha label="ID do pagamento" valor={selecionada?.idPagamento} />
                                        <Linha label="E-mail do usuário" valor={selecionada?.emailUsuario} />
                                        <Linha label="ID do evento" valor={selecionada?.idEvento} />
                                        <Linha label="Nome do evento" valor={selecionada?.nomeEvento} />
                                        <Linha label="Data do evento" valor={selecionada?.dataEvento} />
                                        <Linha label="Valor da transação" valor={selecionada ? moeda.format(selecionada.valor) : undefined} />
                                    </dl>

                                    <span className="text-right text-[11px] text-[var(--rt-text-tertiary)]">All queries completed.</span>
                                </section>
                            </div>
                        </div>
                    </>
                ) : (
                    <UsuariosSuspensos />
                )}
            </div>
        </AntifraudeShell>
    );
}

function Linha({ label, valor }: { label: string; valor?: string }) {
    return (
        <div className="flex min-w-0 items-start justify-between gap-4">
            <dt className="shrink-0 text-[12px] text-[var(--rt-text-secondary)]">{label}</dt>
            <dd className="min-w-0 text-right text-[13px] font-medium break-words text-[var(--rt-text)]">{valor ?? "—"}</dd>
        </div>
    );
}
