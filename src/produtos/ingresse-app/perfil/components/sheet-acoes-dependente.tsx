import type { FC } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, InfoCircle, LogIn04, RefreshCw01, Settings01, ShieldTick, Trash01, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Avatar } from "@/components/base/avatar/avatar";
import { primeiroNome, type Dependente } from "../data/dependentes";

type Acao = { id: string; icon: FC<{ className?: string }>; label: string; destrutiva?: boolean; onClick: () => void };

/**
 * "Mais opções" do dependente: o que dá para fazer com ele, conforme a condição do acesso ao perfil.
 * Quando a condição precisa de explicação (preparando, falha, conta própria), ela aparece antes das ações.
 */
export function SheetAcoesDependente({
    dependente: d,
    onFechar,
    onEntrar,
    onGerenciar,
    onHabilitar,
    onTentarDeNovo,
    onRemover,
}: {
    dependente: Dependente | null;
    onFechar: () => void;
    onEntrar: () => void;
    onGerenciar: () => void;
    onHabilitar: () => void;
    onTentarDeNovo: () => void;
    onRemover: () => void;
}) {
    const acoes: Acao[] = !d
        ? []
        : [
              ...(d.acesso === "pronto"
                  ? [
                        { id: "entrar", icon: LogIn04, label: `Entrar como ${primeiroNome(d)}`, onClick: onEntrar },
                        { id: "gerenciar", icon: Settings01, label: "Gerenciar acessos", onClick: onGerenciar },
                    ]
                  : []),
              ...(d.acesso === "nao-configurado" ? [{ id: "habilitar", icon: ShieldTick, label: "Habilitar acesso", onClick: onHabilitar }] : []),
              ...(d.acesso === "falhou" ? [{ id: "tentar", icon: RefreshCw01, label: "Tentar habilitar de novo", onClick: onTentarDeNovo }] : []),
              { id: "remover", icon: Trash01, label: "Remover dependente", destrutiva: true, onClick: onRemover },
          ];

    return (
        <AnimatePresence>
            {d && (
                <motion.div
                    key="sheet-acoes"
                    className="fixed inset-0 z-50 flex items-end justify-center bg-overlay/60"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Opções de ${d.nome}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    onClick={(e) => e.target === e.currentTarget && onFechar()}
                >
                    <motion.div
                        className="w-full max-w-md rounded-t-2xl bg-primary px-6 pt-6 pb-8 shadow-xl ring-1 ring-border-secondary"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* De quem são as opções */}
                        <div className="flex items-center gap-3">
                            <Avatar size="md" initials={d.iniciais} alt={d.nome} />
                            <div className="min-w-0 flex-1">
                                <h2 className="truncate text-lg font-bold text-primary">{d.nome}</h2>
                                <p className="text-sm text-tertiary">{d.parentesco}</p>
                            </div>
                            <button
                                type="button"
                                aria-label="Fechar"
                                onClick={onFechar}
                                className="-mr-1 flex size-6 shrink-0 items-center justify-center self-start text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>

                        <Condicao d={d} />

                        <ul className="mt-4 overflow-hidden rounded-2xl ring-1 ring-border-secondary">
                            {acoes.map((a) => (
                                <li key={a.id} className="border-b border-secondary last:border-0">
                                    <button
                                        type="button"
                                        onClick={a.onClick}
                                        className="flex w-full items-center gap-3.5 p-4 text-left transition duration-100 ease-linear active:bg-secondary"
                                    >
                                        {/* Fundo cinza como no Perfil; ícone neutro, só o de remover fica vermelho */}
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                                            <a.icon className={cx("size-5", a.destrutiva ? "text-fg-error-primary" : "text-fg-secondary")} />
                                        </span>
                                        <span className="text-md font-semibold text-primary">{a.label}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Só aparece quando a condição do acesso precisa de explicação. */
const Condicao = ({ d }: { d: Dependente }) => {
    const nome = primeiroNome(d);
    const caixa = "mt-4 flex items-start gap-3 rounded-2xl bg-secondary p-4";

    if (d.acesso === "preparando")
        return (
            <div className={caixa} role="status">
                <span className="mt-0.5 size-5 shrink-0 animate-spin rounded-full border-2 border-tertiary border-t-fg-brand-primary" aria-hidden="true" />
                <div>
                    <p className="text-sm font-semibold text-primary">Preparando o acesso</p>
                    <p className="text-sm text-tertiary">Isso pode levar alguns instantes.</p>
                </div>
            </div>
        );
    if (d.acesso === "falhou")
        return (
            <div className={caixa}>
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-fg-error-primary" aria-hidden="true" />
                <p className="text-sm text-tertiary">Não foi possível habilitar o acesso ao perfil.</p>
            </div>
        );
    if (d.acesso === "conta-propria")
        return (
            <div className={caixa}>
                <InfoCircle className="mt-0.5 size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                <p className="text-sm text-tertiary">
                    {d.contaCriadaDepois
                        ? `${nome} criou uma conta na Ingresse, por isso os acessos ao perfil foram encerrados.`
                        : `${nome} já tem conta na Ingresse, por isso não é possível habilitar o acesso.`}
                </p>
            </div>
        );
    return null;
};
