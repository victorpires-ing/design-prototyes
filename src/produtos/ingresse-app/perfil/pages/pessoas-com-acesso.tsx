import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, InfoCircle, LogOut01 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { AppShell } from "../../components/AppShell";
import { mostrarToast } from "../../components/AppToast";
import { StatusBar } from "../../components/StatusBar";
import { SheetConfirmacao } from "../components/sheet-confirmacao";
import { consequenciaDaSaida, getDependente, primeiroNome, removerAcesso, useDependentes, type PessoaComAcesso } from "../data/dependentes";

const VOLTAR = "/ingresse-app/perfil/dependentes";

const PAPEL = { administrador: "Administrador", acesso: "Pessoa com acesso" } as const;

/**
 * "Acessos ao perfil": quem pode entrar no perfil do dependente. O administrador remove qualquer pessoa;
 * quem só tem acesso remove apenas o próprio. Não há convite: cada pessoa habilita pelo próprio vínculo.
 */
export function PessoasComAcesso() {
    const navigate = useNavigate();
    const { id } = useParams();
    useDependentes();
    const dep = getDependente(id);
    const [aRemover, setARemover] = useState<PessoaComAcesso | null>(null);
    const [removendo, setRemovendo] = useState(false);

    if (!dep || dep.acesso !== "pronto") return <Navigate to={VOLTAR} replace />;

    const nome = primeiroNome(dep);
    const eu = dep.pessoas.find((p) => p.voce);
    const souAdmin = eu?.papel === "administrador";
    // Administrador primeiro; depois, por ordem de chegada.
    const pessoas = [...dep.pessoas].sort((a, b) => (a.papel === b.papel ? 0 : a.papel === "administrador" ? -1 : 1));

    const souEu = aRemover?.voce;
    const consequencia = aRemover ? consequenciaDaSaida(dep, aRemover.id) : null;
    const descricao = !aRemover
        ? undefined
        : !souEu
          ? `${primeiroNome(aRemover)} não poderá mais entrar no perfil de ${nome}. Para voltar, precisará habilitar o acesso de novo.`
          : consequencia?.tipo === "desativa"
            ? `Você é a única pessoa com acesso, então o perfil gerenciado de ${nome} será desativado. ${nome} continua nos seus dependentes.`
            : consequencia?.tipo === "transfere"
              ? `Você não poderá mais entrar no perfil de ${nome}. A administração passa para ${consequencia.para.nome}, que tem acesso há mais tempo.`
              : `Você não poderá mais entrar no perfil de ${nome}. ${nome} continua nos seus dependentes.`;

    const confirmar = () => {
        if (!aRemover) return;
        const pessoa = aRemover;
        setRemovendo(true);
        window.setTimeout(() => {
            removerAcesso(dep.id, pessoa.id);
            setRemovendo(false);
            setARemover(null);
            if (pessoa.voce) {
                mostrarToast("Seu acesso foi removido", `${nome} continua nos seus dependentes.`);
                navigate(VOLTAR);
            } else {
                mostrarToast(`Acesso de ${primeiroNome(pessoa)} removido`);
            }
        }, 900);
    };

    return (
        <AppShell
            showTabBar={false}
            scrollClassName="bg-secondary"
            bottomBar={
                eu && (
                    <div className="pointer-events-auto absolute inset-x-0 bottom-0 border-t border-secondary bg-primary px-5 pt-3 pb-6">
                        <Button size="lg" color="secondary-destructive" iconLeading={LogOut01} className="w-full" onClick={() => setARemover(eu)}>
                            Remover meu acesso
                        </Button>
                    </div>
                )
            }
        >
            <div className="min-h-full bg-secondary">
                <StatusBar tone="dark" />

                <div className="px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={() => navigate(VOLTAR)}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="pt-4 text-2xl font-bold text-primary">Acessos ao perfil</h1>
                    <p className="mt-1 text-sm text-tertiary">Quem pode entrar no perfil de {dep.nome}.</p>
                </div>

                <div className="px-5 pt-5">
                    <ul className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                        <AnimatePresence initial={false}>
                            {pessoas.map((p) => (
                                <motion.li
                                    key={p.id}
                                    layout
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex items-center gap-3 border-b border-secondary p-4 last:border-0"
                                >
                                    <Avatar size="md" initials={p.iniciais} alt={p.nome} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-md font-semibold text-primary">
                                            {p.nome}
                                            {p.voce && <span className="font-normal text-tertiary"> (você)</span>}
                                        </p>
                                        <p className="text-sm text-tertiary">{PAPEL[p.papel]}</p>
                                    </div>
                                    {/* Só o administrador remove outras pessoas; o próprio acesso sai pelo botão do rodapé. */}
                                    {souAdmin && !p.voce && (
                                        <Button size="sm" color="tertiary-destructive" onClick={() => setARemover(p)}>
                                            Remover
                                        </Button>
                                    )}
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>

                    <div className="mt-4 flex items-start gap-2 px-1">
                        <InfoCircle className="mt-0.5 size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        <p className="text-sm text-tertiary">
                            {souAdmin
                                ? `Cada pessoa habilita o próprio acesso pelo cadastro de ${nome} como dependente.`
                                : `Só o administrador pode remover outras pessoas.`}
                        </p>
                    </div>
                </div>
            </div>

            <SheetConfirmacao
                aberto={Boolean(aRemover)}
                titulo={souEu ? `Remover seu acesso ao perfil de ${nome}?` : `Remover o acesso de ${aRemover ? primeiroNome(aRemover) : ""}?`}
                descricao={descricao}
                confirmar={souEu ? "Remover meu acesso" : "Remover acesso"}
                destrutivo
                carregando={removendo}
                onConfirmar={confirmar}
                onCancelar={() => setARemover(null)}
            />
        </AppShell>
    );
}
