import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowLeft, Trash01, UserPlus01, Users01, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";
import { consumirUltimoAdicionado, getDependentes, removeDependente, type Dependente } from "../data/dependentes";

type Status = "carregando" | "erro" | "ok";

export function Dependentes() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<Status>("carregando");
    const [lista, setLista] = useState<Dependente[]>([]);
    const [aExcluir, setAExcluir] = useState<Dependente | null>(null);
    const [removendo, setRemovendo] = useState(false);
    const [pressionado, setPressionado] = useState<string | null>(null);
    // Id do dependente recém-cadastrado, para animar a entrada + destaque temporário.
    const [novoId] = useState<string | null>(() => consumirUltimoAdicionado());
    const [destacado, setDestacado] = useState<string | null>(null);
    // Permite pré-visualizar o estado de erro via ?estado=erro (apenas na 1ª carga).
    const jaTentou = useRef(false);

    // Carregamento dos dependentes: mostra skeleton e então resolve (ok/erro).
    const carregar = () => {
        setStatus("carregando");
        window.setTimeout(() => {
            const forcarErro = new URLSearchParams(window.location.search).get("estado") === "erro";
            if (forcarErro && !jaTentou.current) {
                jaTentou.current = true;
                setStatus("erro");
                return;
            }
            setLista([...getDependentes()]);
            setStatus("ok");
            setDestacado(novoId);
        }, 1600);
    };
    useEffect(carregar, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        const id = aExcluir.id;
        setRemovendo(true);
        window.setTimeout(() => {
            removeDependente(id);
            setRemovendo(false);
            setAExcluir(null);
            // Sucesso: recarrega a lista usando o skeleton.
            carregar();
        }, 900);
    };

    // Barra inferior muda conforme o estado (some no carregamento, vira "Tentar novamente" no erro).
    const bottomBar =
        status === "carregando" ? undefined : (
            <div className="pointer-events-auto absolute inset-x-0 bottom-0 border-t border-secondary bg-primary px-5 pt-3 pb-6">
                {status === "erro" ? (
                    <Button size="lg" color="primary" className="w-full" onClick={carregar}>
                        Tentar novamente
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        color="primary"
                        iconLeading={UserPlus01}
                        className="w-full"
                        onClick={() => navigate("/ingresse-app/perfil/dependentes/cadastrar")}
                    >
                        Cadastrar dependente
                    </Button>
                )}
            </div>
        );

    return (
        <AppShell showTabBar={false} scrollClassName="bg-secondary" bottomBar={bottomBar}>
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

                {status === "carregando" && <SkeletonLista />}

                {status === "erro" && (
                    <div className="flex flex-col items-center px-5 pt-16 text-center">
                        <FeaturedIcon icon={AlertTriangle} color="error" theme="modern" size="lg" />
                        <p className="mt-4 text-md font-semibold text-primary">Algo deu errado</p>
                        <p className="mt-1 text-sm text-tertiary">Não foi possível carregar seus dependentes. Tente novamente em alguns instantes.</p>
                    </div>
                )}

                {status === "ok" &&
                    (lista.length === 0 ? (
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
                            <AnimatePresence mode="popLayout" initial={false}>
                            {lista.map((d) => (
                                <motion.div
                                    key={d.id}
                                    layout
                                    initial={d.id === novoId ? { opacity: 0, y: -16, scale: 0.97 } : false}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, x: 40 }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    className={cx(
                                        "rounded-2xl bg-primary p-4 ring-1 transition-shadow duration-700 ease-out",
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
                            </AnimatePresence>
                        </div>
                    ))}
            </div>

            {/* Confirmação de exclusão — bottom sheet */}
            <AnimatePresence>
            {aExcluir && (
                <motion.div
                    key="sheet-overlay"
                    className="fixed inset-0 z-50 flex items-end justify-center bg-overlay/60"
                    role="dialog"
                    aria-modal="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <motion.div
                        className="w-full max-w-md rounded-t-2xl bg-primary px-6 pt-6 pb-8 shadow-xl ring-1 ring-border-secondary"
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-primary">Remover {aExcluir.nome}?</h2>
                            <button
                                type="button"
                                aria-label="Fechar"
                                disabled={removendo}
                                onClick={() => setAExcluir(null)}
                                className="-mr-1 flex size-6 shrink-0 items-center justify-center text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary disabled:opacity-50"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-tertiary">Você não poderá desfazer essa ação.</p>
                        <div className="mt-6 flex flex-col gap-3">
                            <Button size="lg" color="primary-destructive" className="w-full" isLoading={removendo} onClick={confirmarExclusao}>
                                Remover dependente
                            </Button>
                            <Button size="lg" color="secondary" className="w-full" isDisabled={removendo} onClick={() => setAExcluir(null)}>
                                Cancelar
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
        </AppShell>
    );
}

/* Skeleton da lista enquanto os dependentes carregam. */
const SkeletonLista = () => (
    <div className="flex animate-pulse flex-col gap-3 px-5 pt-5 pb-8">
        {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                <div className="flex items-center gap-3">
                    <div className="size-10 shrink-0 rounded-full bg-tertiary" />
                    <div className="h-4 flex-1 rounded-full bg-tertiary" />
                    <div className="size-9 shrink-0 rounded-lg bg-tertiary" />
                </div>
                <div className="mt-3 flex flex-col gap-2.5 border-t border-tertiary pt-3">
                    {[0, 1, 2].map((j) => (
                        <div key={j} className="flex items-center justify-between gap-3">
                            <div className="h-3 w-28 rounded-full bg-tertiary" />
                            <div className="h-3 w-20 rounded-full bg-tertiary" />
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
);

const Linha = ({ label, valor }: { label: string; valor: string }) => (
    <div className="flex items-center justify-between gap-3">
        <dt className="text-sm text-tertiary">{label}</dt>
        <dd className="text-sm font-semibold text-primary tabular-nums">{valor}</dd>
    </div>
);
