import { useNavigate, useParams } from "react-router";
import { AntifraudeShell } from "../components/AntifraudeShell";
import { IconArrowLeft } from "../components/retool/icons";
import { RBadge, RButton, RCallout, RKeyValue } from "../components/retool/ui";
import { STATUS_COMPRA_META, USUARIOS_SUSPENSOS } from "../data/antifraude";

/**
 * Desfecho de uma conta suspensa. Quando a certeza de fraude é alta, o
 * reembolso é imediato — sem janela de validação e sem contato com o
 * usuário (Figma "Alta certeza de fraude — reembolso direto").
 */
export function Desfecho() {
    const navigate = useNavigate();
    const { contaId } = useParams();
    const usuario = USUARIOS_SUSPENSOS.find((u) => u.contaId === contaId);

    return (
        <AntifraudeShell>
            <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2 px-6 py-6">
                <RButton
                    variant="link"
                    size="sm"
                    className="self-start"
                    icon={<IconArrowLeft size={14} />}
                    onClick={() => navigate("/payin/suspensao-de-conta?tab=suspensos")}
                >
                    Usuários suspensos
                </RButton>

                {!usuario ? (
                    <p className="text-[13px] text-[var(--rt-text-secondary)]">Usuário não encontrado.</p>
                ) : (
                    <>
                        <span className="text-[13px] text-[var(--rt-text-secondary)]">
                            {usuario.altaCerteza ? "Desfecho — reembolso imediato (sem validação)" : "Desfecho — aguardando validação"}
                        </span>

                        <section className="rt-card">
                            <div className="flex items-start justify-between gap-4">
                                <h1 className="text-[17px] font-semibold text-[var(--rt-text)]">{usuario.nome}</h1>
                                <RBadge tone="purple">Conta suspensa</RBadge>
                            </div>
                            <p className="mt-1 text-[13px] text-[var(--rt-text-secondary)]">{usuario.email}</p>

                            <div className="mt-4">
                                <RCallout tone={usuario.altaCerteza ? "danger" : "warning"}>
                                    {usuario.altaCerteza
                                        ? "Alta certeza de fraude — reembolso feito diretamente, sem janela de validação e sem contato com o usuário."
                                        : "As compras estão suspensas e a conta segue suspensa até o fim da janela de validação."}
                                </RCallout>
                            </div>

                            <div className="mt-5 border-t border-[var(--rt-border)] pt-4">
                                <span className="rt-section-label">Decisão</span>
                                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4">
                                    <RKeyValue label="Motivo" value={usuario.motivo} />
                                    <RKeyValue label="Ação" value={usuario.acao} tone={usuario.altaCerteza ? "danger" : undefined} />
                                    <RKeyValue label="Analista" value={usuario.analista} />
                                    <RKeyValue label="Data" value={usuario.data} />
                                </dl>
                            </div>

                            <div className="mt-5 border-t border-[var(--rt-border)] pt-4">
                                <span className="rt-section-label">Compras relacionadas</span>
                                <ul className="mt-2 flex flex-col">
                                    {usuario.compras.map((compra) => (
                                        <li
                                            key={compra.id}
                                            className="flex items-center justify-between gap-4 border-b border-[var(--rt-border)] py-2.5 last:border-b-0"
                                        >
                                            <div className="flex min-w-0 flex-col">
                                                <span className="text-[13px] font-medium">{compra.evento}</span>
                                                <span className="text-[12px] text-[var(--rt-text-secondary)]">
                                                    {compra.dataEvento} · {compra.companhia}
                                                </span>
                                            </div>
                                            <RBadge tone={STATUS_COMPRA_META[compra.status].tone}>
                                                {STATUS_COMPRA_META[compra.status].label}
                                            </RBadge>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </AntifraudeShell>
    );
}
