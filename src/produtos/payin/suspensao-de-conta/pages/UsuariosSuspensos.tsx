import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { cx } from "@/utils/cx";
import { IconCheck, IconExternal } from "../components/retool/icons";
import { RBadge, RButton, RCallout, RInput, RModal, RSelect, RToast } from "../components/retool/ui";
import {
    COMPANHIAS,
    MOTIVOS,
    STATUS_COMPRA_META,
    SUSPENSOES,
    VALIDACAO_META,
    type Suspensao,
} from "../data/antifraude";

/**
 * Usuários suspensos — fila de suspensões (esquerda) e detalhe da conta
 * selecionada com validação e reativação (Figma "Usuários suspensos — app").
 */
export function UsuariosSuspensos() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();

    const [suspensoes, setSuspensoes] = useState<Suspensao[]>(SUSPENSOES);
    /** Contas já reativadas nesta sessão — saem de "ativos" e travam o botão. */
    const [reativadas, setReativadas] = useState<string[]>([]);
    const [busca, setBusca] = useState("");
    const [motivoFiltro, setMotivoFiltro] = useState("");
    const [companhiaFiltro, setCompanhiaFiltro] = useState("");
    const [validacaoFiltro, setValidacaoFiltro] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [toast, setToast] = useState<{ title: string; description: string } | null>(() => {
        const novo = params.get("novo");
        const conta = SUSPENSOES.find((s) => s.contaId === novo);
        return conta
            ? { title: "Usuário suspenso", description: `${conta.nome} foi suspenso e já aparece na lista.` }
            : null;
    });
    const [selecionadaId, setSelecionadaId] = useState(params.get("novo") ?? SUSPENSOES[0].contaId);

    const lista = useMemo(
        () =>
            suspensoes.filter((s) => {
                const termo = busca.trim().toLowerCase();
                const digitos = termo.replace(/\D/g, "");
                const casaBusca =
                    !termo ||
                    s.email.toLowerCase().includes(termo) ||
                    s.nome.toLowerCase().includes(termo) ||
                    (digitos.length >= 3 && s.contaId.includes(digitos));
                const casaMotivo = !motivoFiltro || s.motivo === motivoFiltro;
                const casaCompanhia = !companhiaFiltro || s.companhia === companhiaFiltro;
                const casaValidacao = !validacaoFiltro || s.validacao === validacaoFiltro;
                return casaBusca && casaMotivo && casaCompanhia && casaValidacao;
            }),
        [suspensoes, busca, motivoFiltro, companhiaFiltro, validacaoFiltro],
    );

    const selecionada = suspensoes.find((s) => s.contaId === selecionadaId) ?? lista[0] ?? null;
    const ativos = suspensoes.length - reativadas.length;
    const jaReativada = selecionada ? reativadas.includes(selecionada.contaId) : false;

    const reativar = () => {
        if (!selecionada) return;
        setModalAberto(false);
        setReativadas((prev) => [...prev, selecionada.contaId]);
        setSuspensoes((prev) =>
            prev.map((s) =>
                s.contaId === selecionada.contaId
                    ? { ...s, compras: s.compras.map((c) => ({ ...c, status: "ativa" as const })) }
                    : s,
            ),
        );
        setToast({
            title: "Usuário reativado",
            description: `${selecionada.nome} foi reativado e as compras, reassociadas.`,
        });
    };

    const fecharToast = () => {
        setToast(null);
        if (params.get("novo")) {
            const next = new URLSearchParams(params);
            next.delete("novo");
            setParams(next, { replace: true });
        }
    };

    return (
        <>
            <h1 className="text-[22px] font-semibold text-[var(--rt-text)]">Usuários suspensos</h1>

            <div className="flex min-w-0 flex-col gap-4 xl:flex-row">
                {/* Fila de suspensões */}
                <section className="rt-card flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="rt-card__title">Fila de suspensões</h2>
                        <RBadge tone="blue">{ativos} ativos</RBadge>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
                        <RInput
                            id="busca-suspensos"
                            label="Buscar por e-mail ou CPF"
                            placeholder="usuario@email.com"
                            value={busca}
                            onChange={setBusca}
                        />
                        <RSelect
                            id="filtro-motivo"
                            label="Motivo"
                            placeholder="Todos"
                            value={motivoFiltro}
                            onChange={setMotivoFiltro}
                            options={MOTIVOS.map((m) => ({ value: m.label, label: m.label }))}
                        />
                        <RSelect
                            id="filtro-companhia"
                            label="Companhia"
                            placeholder="Todas"
                            value={companhiaFiltro}
                            onChange={setCompanhiaFiltro}
                            options={COMPANHIAS.map((c) => ({ value: c, label: c }))}
                        />
                        <RSelect
                            id="filtro-validacao"
                            label="Validação"
                            placeholder="Todas"
                            value={validacaoFiltro}
                            onChange={setValidacaoFiltro}
                            options={Object.entries(VALIDACAO_META).map(([id, meta]) => ({ value: id, label: meta.curto }))}
                        />
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="rt-table">
                            <thead>
                                <tr>
                                    <th>Usuário</th>
                                    <th>Companhia</th>
                                    <th>Motivo</th>
                                    <th>Suspensão</th>
                                    <th className="!text-right">Compras</th>
                                    <th>Validação</th>
                                    <th>Prazo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lista.map((s) => (
                                    <tr
                                        key={s.contaId}
                                        onClick={() => setSelecionadaId(s.contaId)}
                                        className={cx("rt-row--clickable", selecionada?.contaId === s.contaId && "rt-row--selected")}
                                    >
                                        <td>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{s.nome}</span>
                                                <span className="text-[12px] text-[var(--rt-text-secondary)]">{s.email}</span>
                                            </div>
                                        </td>
                                        <td className="text-[var(--rt-text-secondary)]">{s.companhia}</td>
                                        <td>{s.motivo}</td>
                                        <td className="whitespace-nowrap text-[var(--rt-text-secondary)]">{s.suspensaoEm}</td>
                                        <td className="rt-num !text-right">{s.compras.length}</td>
                                        <td>
                                            {reativadas.includes(s.contaId) ? (
                                                <RBadge tone="success">Reativado</RBadge>
                                            ) : (
                                                <RBadge tone={VALIDACAO_META[s.validacao].tone}>{VALIDACAO_META[s.validacao].curto}</RBadge>
                                            )}
                                        </td>
                                        <td
                                            className={cx(
                                                "whitespace-nowrap",
                                                s.prazoExpirado ? "font-medium text-[var(--rt-danger)]" : "text-[var(--rt-text-secondary)]",
                                            )}
                                        >
                                            {s.prazo}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {lista.length === 0 && (
                        <p className="py-8 text-center text-[13px] text-[var(--rt-text-secondary)]">
                            Nenhuma suspensão encontrada com esses filtros.
                        </p>
                    )}
                </section>

                {/* Detalhe da conta */}
                {selecionada && (
                    <aside className="rt-card flex w-full shrink-0 flex-col xl:max-w-[420px]">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-[17px] font-semibold text-[var(--rt-text)]">{selecionada.nome}</h2>
                            <RBadge tone={jaReativada ? "success" : "purple"}>{jaReativada ? "Conta reativada" : "Conta suspensa"}</RBadge>
                        </div>
                        <p className="mt-1 text-[13px] text-[var(--rt-text-secondary)]">{selecionada.email}</p>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <RButton variant="primary" disabled={jaReativada} onClick={() => setModalAberto(true)}>
                                Reativar usuário
                            </RButton>
                            <RButton
                                variant="secondary"
                                iconTrailing={<IconExternal size={14} />}
                                onClick={() => navigate(`/payin/suspensao-de-conta/historico/${selecionada.contaId}`)}
                            >
                                Ver histórico
                            </RButton>
                        </div>

                        <Bloco titulo="DADOS DO USUÁRIO">
                            <Campo label="ID" valor={selecionada.contaId} />
                            <Campo label="Companhia" valor={selecionada.companhia} />
                            <Campo label="Telefone" valor="+55 (11) 98888-0000" />
                            <Campo label="CPF" valor="•••.•••.•••-00" />
                        </Bloco>

                        <Bloco titulo="DADOS DA SUSPENSÃO">
                            <Campo label="Motivo" valor={selecionada.motivo} />
                            <Campo label="Data" valor={selecionada.suspensaoEmCompleto} />
                            <Campo label="Analista" valor={selecionada.analista} />
                            <Campo label="Prazo das compras" valor={selecionada.prazo} destaque={selecionada.prazoExpirado} />
                            {selecionada.observacao && <Campo label="Observação" valor={selecionada.observacao} largo />}
                        </Bloco>

                        <Bloco titulo="VALIDAÇÃO">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[12px] text-[var(--rt-text-secondary)]">Status</span>
                                <span className="w-fit">
                                    <RBadge tone={VALIDACAO_META[selecionada.validacao].tone}>
                                        {VALIDACAO_META[selecionada.validacao].label}
                                    </RBadge>
                                </span>
                            </div>
                            <Campo label="Método" valor={selecionada.metodoValidacao} />
                            <Campo label="Enviado em" valor={selecionada.validacaoEnviadaEm} />
                            <Campo label="Link" valor={selecionada.linkValidacao} />
                        </Bloco>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <RButton
                                variant="secondary"
                                onClick={() =>
                                    setToast({
                                        title: "Validação reenviada",
                                        description: `Novo link enviado para ${selecionada.email}.`,
                                    })
                                }
                            >
                                Reenviar validação
                            </RButton>
                            <RButton
                                variant="secondary"
                                onClick={() =>
                                    setToast({ title: "Link copiado", description: "O link de validação está na área de transferência." })
                                }
                            >
                                Copiar link
                            </RButton>
                        </div>

                        <div className="mt-5 border-t border-[var(--rt-border)] pt-4">
                            <span className="rt-section-label">COMPRAS RELACIONADAS</span>
                            <ul className="mt-1 flex flex-col">
                                {selecionada.compras.map((compra) => (
                                    <li
                                        key={compra.id}
                                        className="flex items-center justify-between gap-3 border-b border-[var(--rt-border)] py-2.5 last:border-b-0"
                                    >
                                        <span className="min-w-0 truncate text-[13px]">{compra.evento}</span>
                                        <RBadge tone={STATUS_COMPRA_META[compra.status].tone}>
                                            {STATUS_COMPRA_META[compra.status].label}
                                        </RBadge>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>
                )}
            </div>

            {/* Confirmação de reativação */}
            {selecionada && (
                <RModal
                    isOpen={modalAberto}
                    onClose={() => setModalAberto(false)}
                    title="Confirmar reativação de usuário"
                    description={`Você está prestes a reativar ${selecionada.nome} (${selecionada.email}).`}
                    footer={
                        <>
                            <RButton variant="secondary" onClick={() => setModalAberto(false)}>
                                Cancelar
                            </RButton>
                            <RButton variant="primary" onClick={reativar}>
                                Reativar usuário
                            </RButton>
                        </>
                    }
                >
                    <dl className="mt-4 flex flex-col gap-2 rounded-[6px] bg-[var(--rt-surface-subtle)] p-3">
                        {[
                            { label: "Validação", valor: VALIDACAO_META[selecionada.validacao].curto },
                            {
                                label: "Compras a reativar",
                                valor: `${selecionada.compras.length} ${selecionada.compras.length === 1 ? "compra" : "compras"}`,
                            },
                            { label: "Companhia", valor: selecionada.companhia },
                        ].map((linha) => (
                            <div key={linha.label} className="flex items-baseline justify-between gap-4">
                                <dt className="text-[13px] text-[var(--rt-text-secondary)]">{linha.label}</dt>
                                <dd className="text-[13px] font-medium">{linha.valor}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className="mt-3">
                        <RCallout tone="success">
                            <IconCheck className="mt-px shrink-0" />
                            <span>
                                As compras ainda recuperáveis voltam ao ar e a conta deixa de estar suspensa. Compras já canceladas não são
                                recuperadas.
                            </span>
                        </RCallout>
                    </div>
                </RModal>
            )}

            {toast && <RToast title={toast.title} description={toast.description} onClose={fecharToast} />}
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Blocos do detalhe                                                 */
/* ------------------------------------------------------------------ */

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div className="mt-5 border-t border-[var(--rt-border)] pt-4">
            <span className="rt-section-label">{titulo}</span>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
        </div>
    );
}

function Campo({ label, valor, largo, destaque }: { label: string; valor: string; largo?: boolean; destaque?: boolean }) {
    return (
        <div className={cx("flex min-w-0 flex-col gap-0.5", largo && "col-span-2")}>
            <span className="text-[12px] text-[var(--rt-text-secondary)]">{label}</span>
            <span
                className={cx(
                    "text-[13px] font-medium break-words",
                    destaque ? "text-[var(--rt-danger)]" : "text-[var(--rt-text)]",
                )}
            >
                {valor}
            </span>
        </div>
    );
}
