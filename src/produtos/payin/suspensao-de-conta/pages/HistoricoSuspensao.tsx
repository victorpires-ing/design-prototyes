import { useNavigate, useParams } from "react-router";
import { cx } from "@/utils/cx";
import { AntifraudeShell } from "../components/AntifraudeShell";
import { IconArrowLeft } from "../components/retool/icons";
import { RBadge, RButton } from "../components/retool/ui";
import { SUSPENSOES, type Ocorrencia } from "../data/antifraude";

/**
 * Histórico de suspensão da conta — ocorrências em linha do tempo, com o
 * desfecho de cada uma (Figma "Histórico de suspensão — app").
 */
export function HistoricoSuspensao() {
    const navigate = useNavigate();
    const { contaId } = useParams();
    const conta = SUSPENSOES.find((s) => s.contaId === contaId);

    return (
        <AntifraudeShell navAtiva="suspensao">
            <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-4 px-6 py-6">
                <RButton
                    variant="link"
                    size="sm"
                    className="self-start"
                    icon={<IconArrowLeft size={14} />}
                    onClick={() => navigate("/payin/suspensao-de-conta?tab=suspensos")}
                >
                    Usuários suspensos
                </RButton>

                {!conta ? (
                    <p className="text-[13px] text-[var(--rt-text-secondary)]">Conta não encontrada.</p>
                ) : (
                    <>
                        <h1 className="text-[22px] font-semibold text-[var(--rt-text)]">Histórico de suspensão</h1>

                        <section className="rt-card">
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-[17px] font-semibold text-[var(--rt-text)]">{conta.nome}</h2>
                                <div className="flex shrink-0 gap-2">
                                    <RBadge tone="purple">Conta suspensa</RBadge>
                                    <RBadge tone="neutral">
                                        {conta.historico.length} {conta.historico.length === 1 ? "ocorrência" : "ocorrências"}
                                    </RBadge>
                                </div>
                            </div>

                            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <Campo label="ID do usuário" valor={conta.contaId} />
                                <Campo label="E-mail" valor={conta.email} />
                                <Campo label="Companhia" valor={conta.companhia} />
                            </dl>
                        </section>

                        <section className="rt-card">
                            <h2 className="rt-card__title">Ocorrências</h2>

                            <div className="mt-4 flex flex-col">
                                {conta.historico.map((ocorrencia, indice) => (
                                    <ItemOcorrencia
                                        key={`${ocorrencia.data}-${indice}`}
                                        ocorrencia={ocorrencia}
                                        ultima={indice === conta.historico.length - 1}
                                    />
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </AntifraudeShell>
    );
}

function ItemOcorrencia({ ocorrencia, ultima }: { ocorrencia: Ocorrencia; ultima: boolean }) {
    return (
        <div className="rt-timeline">
            <div className="rt-timeline__rail">
                <span className={cx("rt-timeline__dot", `rt-timeline__dot--${ocorrencia.situacao}`)} />
                {!ultima && <span className="rt-timeline__line" />}
            </div>

            <div className={cx("min-w-0 flex-1", !ultima && "pb-4")}>
                <div className="rounded-[var(--rt-radius-lg)] border border-[var(--rt-border)] bg-[var(--rt-surface)] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <span className="text-[15px] font-semibold text-[var(--rt-text)]">{ocorrencia.data}</span>
                        <RBadge tone={ocorrencia.situacao === "cancelada" ? "neutral" : "success"}>
                            {ocorrencia.situacao === "cancelada" ? "Cancelada" : "Ativo"}
                        </RBadge>
                    </div>

                    <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
                        <Campo label="Motivo" valor={ocorrencia.motivo} />
                        <Campo label="Companhia" valor={ocorrencia.companhia} />
                        <Campo label="Analista responsável" valor={ocorrencia.analista} />
                        <Campo label="Compras impactadas" valor={ocorrencia.comprasImpactadas} />
                        <Campo
                            label="Resultado da validação"
                            valor={ocorrencia.resultadoValidacao}
                            tom={ocorrencia.validacaoNegativa ? "negativo" : ocorrencia.resultadoValidacao === "Aprovada" ? "positivo" : undefined}
                        />
                        <Campo label="Método de validação" valor={ocorrencia.metodoValidacao} />
                    </dl>

                    <p className="mt-3 text-[12px] text-[var(--rt-text-secondary)]">{ocorrencia.resumo}</p>
                </div>
            </div>
        </div>
    );
}

function Campo({ label, valor, tom }: { label: string; valor: string; tom?: "positivo" | "negativo" }) {
    return (
        <div className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-[12px] text-[var(--rt-text-secondary)]">{label}</dt>
            <dd
                className={cx(
                    "text-[13px] font-medium break-words",
                    tom === "negativo"
                        ? "text-[var(--rt-danger)]"
                        : tom === "positivo"
                          ? "text-[var(--rt-success)]"
                          : "text-[var(--rt-text)]",
                )}
            >
                {valor}
            </dd>
        </div>
    );
}
