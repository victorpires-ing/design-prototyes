import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AntifraudeShell } from "../components/AntifraudeShell";
import { ConfirmarSuspensaoModal } from "../components/ConfirmarSuspensaoModal";
import { IconArrowLeft, IconCheck, IconSearch, IconUser } from "../components/retool/icons";
import { RBadge, RButton, RCallout, RCard, RChoice, REmpty, RInput, RKeyValue, RSelect, RTextArea } from "../components/retool/ui";
import {
    MOTIVOS,
    STATUS_COMPRA_META,
    buscarContas,
    comprasDaConta,
    type Compra,
    type ResultadoBusca,
} from "../data/antifraude";

/** `undefined` = ainda não buscou; `null` = buscou e não achou. */
type Resultado = ResultadoBusca | null | undefined;

/**
 * Suspender usuário — busca por e-mail/CPF, seleção da conta, revisão das
 * compras impactadas, motivo e confirmação (Figma "Suspender usuário").
 */
export function SuspenderUsuario() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const emailInicial = params.get("email") ?? "";

    const [termo, setTermo] = useState(emailInicial);
    const [resultado, setResultado] = useState<Resultado>(undefined);
    const [contaId, setContaId] = useState<string | null>(null);
    const [motivoId, setMotivoId] = useState("");
    const [observacao, setObservacao] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [concluido, setConcluido] = useState(false);

    const buscar = (valor: string) => {
        const encontrado = buscarContas(valor);
        setResultado(encontrado);
        setContaId(encontrado?.contas[0]?.id ?? null);
        setMotivoId("");
        setObservacao("");
        setConcluido(false);
    };

    // Busca automática quando a tela é aberta a partir da fila de análise.
    useEffect(() => {
        if (emailInicial) buscar(emailInicial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emailInicial]);

    const conta = useMemo(() => resultado?.contas.find((c) => c.id === contaId) ?? null, [resultado, contaId]);
    const compras = useMemo(() => (conta ? comprasDaConta(conta.id) : []), [conta]);
    const motivo = useMemo(() => MOTIVOS.find((m) => m.id === motivoId) ?? null, [motivoId]);
    const podeSuspender = Boolean(conta && motivo && conta.status === "normal");

    if (concluido && conta && motivo) {
        return (
            <AntifraudeShell>
                <SuspensaoConcluida
                    nome={conta.nome}
                    compras={compras}
                    reembolsoImediato={Boolean(motivo.reembolsoImediato)}
                    onNovaSuspensao={() => {
                        setTermo("");
                        setResultado(undefined);
                        setContaId(null);
                        setMotivoId("");
                        setObservacao("");
                        setConcluido(false);
                    }}
                    onVerSuspensos={() => navigate("/payin/suspensao-de-conta?tab=suspensos")}
                />
            </AntifraudeShell>
        );
    }

    return (
        <AntifraudeShell>
            <div className="mx-auto flex w-full max-w-[960px] flex-col gap-4 px-6 py-6 pb-28">
                <div className="flex flex-col gap-2">
                    <RButton
                        variant="link"
                        size="sm"
                        className="self-start"
                        icon={<IconArrowLeft size={14} />}
                        onClick={() => navigate("/payin/suspensao-de-conta")}
                    >
                        Fila de análise
                    </RButton>
                    <h1 className="text-[22px] font-semibold text-[var(--rt-text)]">Suspender usuário</h1>
                </div>

                {/* Buscar usuário */}
                <RCard
                    title="Buscar usuário"
                    description="Busque qualquer usuário por e-mail ou CPF — inclusive quem não veio de uma transação suspeita (ex.: determinação judicial)."
                >
                    <div className="mt-4 flex items-end gap-2">
                        <div className="flex-1">
                            <RInput
                                id="busca-usuario"
                                label="Buscar por e-mail ou CPF"
                                placeholder="usuario@email.com ou 000.000.000-00"
                                icon={<IconSearch />}
                                value={termo}
                                onChange={setTermo}
                                onEnter={() => buscar(termo)}
                            />
                        </div>
                        <RButton variant="primary" onClick={() => buscar(termo)} disabled={termo.trim().length === 0}>
                            Buscar
                        </RButton>
                    </div>

                    {resultado === null && (
                        <REmpty
                            icon={<IconUser size={18} />}
                            title="Nenhum usuário encontrado"
                            description="Verifique o e-mail ou CPF e tente novamente."
                        />
                    )}
                </RCard>

                {resultado && conta && (
                    <>
                        {/* Usuário encontrado */}
                        <RCard
                            title="Usuário encontrado"
                            action={
                                <RBadge tone={conta.status === "suspensa" ? "purple" : "neutral"}>
                                    {conta.status === "suspensa" ? "Conta suspensa" : "Conta normal"}
                                </RBadge>
                            }
                        >
                            <p className="mt-1 text-[13px] text-[var(--rt-text-secondary)]">
                                {resultado.contas.length > 1
                                    ? `${resultado.contas.length} contas vinculadas a este e-mail — selecione a conta correta:`
                                    : "Conta única vinculada a este e-mail."}
                            </p>

                            {resultado.contas.length > 1 && (
                                <div role="radiogroup" aria-label="Contas vinculadas" className="mt-3 flex flex-col gap-2">
                                    {resultado.contas.map((item) => (
                                        <RChoice
                                            key={item.id}
                                            selected={item.id === contaId}
                                            onSelect={() => setContaId(item.id)}
                                            title={item.nome}
                                            subtitle={`ID ${item.id} · ${item.telefone}`}
                                        />
                                    ))}
                                </div>
                            )}

                            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-[var(--rt-border)] pt-4 sm:grid-cols-3">
                                <RKeyValue label="Nome" value={conta.nome} />
                                <RKeyValue label="ID do usuário" value={conta.id} />
                                <RKeyValue label="E-mail" value={conta.email} />
                                <RKeyValue label="Telefone" value={conta.telefone} />
                                <RKeyValue label="CPF" value={conta.cpf} />
                                <RKeyValue label="Companhia" value={conta.companhia} />
                            </dl>
                        </RCard>

                        {/* Compras impactadas */}
                        <RCard title="Compras impactadas">
                            <div className="mt-3">
                                <RCallout>
                                    <span>
                                        Este usuário possui{" "}
                                        <strong className="font-semibold text-[var(--rt-primary-hover)]">
                                            {compras.length} {compras.length === 1 ? "compra" : "compras"}
                                        </strong>{" "}
                                        que {compras.length === 1 ? "será suspensa" : "serão suspensas"}.
                                    </span>
                                </RCallout>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <table className="rt-table">
                                    <thead>
                                        <tr>
                                            <th>Evento</th>
                                            <th>Data do evento</th>
                                            <th>ID da compra</th>
                                            <th>Status</th>
                                            <th>Companhia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {compras.map((compra) => (
                                            <tr key={compra.id}>
                                                <td className="font-medium">{compra.evento}</td>
                                                <td className="text-[var(--rt-text-secondary)]">{compra.dataEvento}</td>
                                                <td className="rt-num text-[var(--rt-text-secondary)]">{compra.id}</td>
                                                <td>
                                                    <RBadge tone={STATUS_COMPRA_META[compra.status].tone}>
                                                        {STATUS_COMPRA_META[compra.status].label}
                                                    </RBadge>
                                                </td>
                                                <td className="text-[var(--rt-text-secondary)]">{compra.companhia}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </RCard>

                        {/* Motivo da suspensão */}
                        <RCard title="Motivo da suspensão">
                            <div className="mt-4 flex flex-col gap-4">
                                <RSelect
                                    id="motivo"
                                    label="Motivo"
                                    required
                                    placeholder="Selecione o motivo"
                                    value={motivoId}
                                    onChange={setMotivoId}
                                    options={MOTIVOS.map((m) => ({
                                        value: m.id,
                                        label: m.reembolsoImediato ? `${m.label} — reembolso imediato` : m.label,
                                    }))}
                                />

                                <RTextArea
                                    id="observacao"
                                    label="Observação (opcional)"
                                    placeholder="Ex.: cartão usado em múltiplos pedidos no fim de semana."
                                    rows={3}
                                    value={observacao}
                                    onChange={setObservacao}
                                />

                                {motivo?.reembolsoImediato && (
                                    <RCallout tone="danger">
                                        Alta certeza de fraude — o reembolso é feito diretamente, sem janela de validação e sem contato com o usuário.
                                    </RCallout>
                                )}
                            </div>
                        </RCard>
                    </>
                )}
            </div>

            {/* Barra de ação fixa */}
            {resultado && conta && (
                <div className="sticky bottom-0 border-t border-[var(--rt-border)] bg-[var(--rt-surface)]">
                    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-[var(--rt-text)]">
                                {compras.length} {compras.length === 1 ? "compra será suspensa" : "compras serão suspensas"}
                            </span>
                            <span className="text-[12px] text-[var(--rt-text-secondary)]">
                                A conta permanecerá suspensa mesmo após o prazo das compras.
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <RButton variant="secondary" onClick={() => navigate("/payin/suspensao-de-conta")}>
                                Cancelar
                            </RButton>
                            <RButton variant="danger" disabled={!podeSuspender} onClick={() => setModalAberto(true)}>
                                Suspender usuário
                            </RButton>
                        </div>
                    </div>
                </div>
            )}

            {conta && motivo && (
                <ConfirmarSuspensaoModal
                    isOpen={modalAberto}
                    onClose={() => setModalAberto(false)}
                    onConfirmar={() => {
                        setModalAberto(false);
                        setConcluido(true);
                    }}
                    conta={conta}
                    motivo={motivo}
                    totalCompras={compras.length}
                />
            )}
        </AntifraudeShell>
    );
}

/** Desfecho da suspensão (Figma "Suspensão realizada (sucesso)"). */
function SuspensaoConcluida({
    nome,
    compras,
    reembolsoImediato,
    onNovaSuspensao,
    onVerSuspensos,
}: {
    nome: string;
    compras: Compra[];
    reembolsoImediato: boolean;
    onNovaSuspensao: () => void;
    onVerSuspensos: () => void;
}) {
    return (
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2 px-6 py-8">
            <span className="text-[13px] text-[var(--rt-text-secondary)]">Suspensão concluída</span>

            <div className="rt-card flex flex-col items-center">
                <span className="grid size-12 place-items-center rounded-full bg-[var(--rt-purple-tint)] text-[var(--rt-purple)]">
                    <IconCheck size={22} />
                </span>
                <h1 className="mt-3 text-[17px] font-semibold text-[var(--rt-text)]">Usuário suspenso</h1>
                <p className="mt-1 text-center text-[13px] text-[var(--rt-text-secondary)]">
                    {nome} foi suspenso. {compras.length} {compras.length === 1 ? "compra entrou" : "compras entraram"} em suspensão e{" "}
                    {reembolsoImediato ? "o reembolso foi feito diretamente." : "a jornada de validação foi disparada."}
                </p>

                <div className="mt-5 w-full border-t border-[var(--rt-border)] pt-4">
                    <span className="rt-section-label">{reembolsoImediato ? "Compras reembolsadas" : "Compras suspensas"}</span>
                    <ul className="mt-2 flex flex-col">
                        {compras.map((compra) => (
                            <li
                                key={compra.id}
                                className="flex items-center justify-between gap-4 border-b border-[var(--rt-border)] py-2.5 last:border-b-0"
                            >
                                <span className="text-[13px] font-medium">{compra.evento}</span>
                                <RBadge tone="purple">{reembolsoImediato ? "Reembolsada" : "Suspensa"}</RBadge>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="mt-4 w-full text-[12px] text-[var(--rt-text-secondary)]">
                    O usuário passa a aparecer em Usuários suspensos e a ocorrência foi registrada no histórico.
                </p>

                <div className="mt-5 flex w-full gap-2">
                    <RButton variant="secondary" className="flex-1" onClick={onNovaSuspensao}>
                        Suspender outro usuário
                    </RButton>
                    <RButton variant="primary" className="flex-1" onClick={onVerSuspensos}>
                        Ver usuários suspensos
                    </RButton>
                </div>
            </div>
        </div>
    );
}
