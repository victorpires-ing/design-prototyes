import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Trash01, UserPlus01, Users01, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";
import { consumirUltimoAdicionado, getDependentes, removeDependente, type Dependente } from "../data/dependentes";

export function Dependentes() {
    const navigate = useNavigate();
    const [lista, setLista] = useState<Dependente[]>(() => [...getDependentes()]);
    const [aExcluir, setAExcluir] = useState<Dependente | null>(null);
    const [pressionado, setPressionado] = useState<string | null>(null);
    // Id do dependente recém-cadastrado, para animar a entrada + destaque temporário.
    const [novoId] = useState<string | null>(() => consumirUltimoAdicionado());
    const [destacado, setDestacado] = useState<string | null>(novoId);

    useEffect(() => {
        if (!destacado) return;
        const t = window.setTimeout(() => setDestacado(null), 1600);
        return () => window.clearTimeout(t);
    }, [destacado]);

    // Ao tocar na lixeira: ícone fica vermelho (transição) e então abre a confirmação.
    const pedirExclusao = (d: Dependente) => {
        setPressionado(d.id);
        window.setTimeout(() => {
            setPressionado(null);
            setAExcluir(d);
        }, 180);
    };

    const confirmarExclusao = () => {
        if (!aExcluir) return;
        removeDependente(aExcluir.id);
        setLista([...getDependentes()]);
        setAExcluir(null);
    };

    return (
        <AppShell
            showTabBar={false}
            scrollClassName="bg-secondary"
            bottomBar={
                <div className="pointer-events-auto absolute inset-x-0 bottom-0 border-t border-secondary bg-primary px-5 pt-3 pb-6">
                    <Button
                        size="lg"
                        color="primary"
                        iconLeading={UserPlus01}
                        className="w-full"
                        onClick={() => navigate("/ingresse-app/perfil/dependentes/cadastrar")}
                    >
                        Cadastrar dependente
                    </Button>
                </div>
            }
        >
            <div className="min-h-full bg-secondary">
                <StatusBar tone="dark" />

                {/* Cabeçalho */}
                <div className="px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={() => navigate(-1)}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="pt-4 text-2xl font-bold text-primary">Dependentes</h1>
                </div>

                {lista.length === 0 ? (
                    /* Estado vazio */
                    <div className="flex flex-col items-center px-5 pt-16 text-center">
                        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-fg-quaternary ring-1 ring-border-secondary">
                            <Users01 className="size-6" />
                        </span>
                        <p className="mt-4 text-md font-semibold text-primary">Nenhum dependente cadastrado</p>
                        <p className="mt-1 text-sm text-tertiary">Toque em “Cadastrar dependente” para adicionar o primeiro.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 px-5 pt-5 pb-8">
                        {lista.map((d) => (
                            <motion.div
                                key={d.id}
                                initial={d.id === novoId ? { opacity: 0, y: -16, scale: 0.97 } : false}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className={cx(
                                    "rounded-2xl bg-primary p-4 ring-1 transition-all duration-700 ease-out",
                                    destacado === d.id ? "ring-2 ring-brand" : "ring-border-secondary",
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar size="md" initials={d.iniciais} alt={d.nome} />
                                    <p className="min-w-0 flex-1 truncate text-md font-bold text-primary">{d.nome}</p>
                                    <button
                                        type="button"
                                        aria-label={`Excluir ${d.nome}`}
                                        onClick={() => pedirExclusao(d)}
                                        className={cx(
                                            "flex size-9 shrink-0 items-center justify-center rounded-lg transition-all duration-150 ease-out active:scale-90",
                                            pressionado === d.id ? "bg-secondary text-fg-error-primary" : "text-fg-quaternary",
                                        )}
                                    >
                                        <Trash01 className="size-5" />
                                    </button>
                                </div>

                                <dl className="mt-3 flex flex-col gap-2 border-t border-tertiary pt-3">
                                    <Linha label="Data de nascimento" valor={d.nascimento} />
                                    <Linha label="CPF" valor={d.cpf} />
                                    <Linha label="Parentesco" valor={d.parentesco} />
                                </dl>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmação de exclusão — bottom sheet */}
            {aExcluir && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay/60" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-t-2xl bg-primary px-6 pt-6 pb-8 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-primary">Remover {aExcluir.nome}?</h2>
                            <button
                                type="button"
                                aria-label="Fechar"
                                onClick={() => setAExcluir(null)}
                                className="-mr-1 flex size-6 shrink-0 items-center justify-center text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-tertiary">Você não poderá desfazer essa ação.</p>
                        <div className="mt-6 flex flex-col gap-3">
                            <Button size="lg" color="primary-destructive" className="w-full" onClick={confirmarExclusao}>
                                Remover dependente
                            </Button>
                            <Button size="lg" color="secondary" className="w-full" onClick={() => setAExcluir(null)}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}

const Linha = ({ label, valor }: { label: string; valor: string }) => (
    <div className="flex items-center justify-between gap-3">
        <dt className="text-sm text-tertiary">{label}</dt>
        <dd className="text-sm font-semibold text-primary tabular-nums">{valor}</dd>
    </div>
);
