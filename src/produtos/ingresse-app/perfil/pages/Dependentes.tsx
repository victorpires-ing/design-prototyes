import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowLeft, DotsVertical, Trash01, UserPlus01, Users01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { AppShell } from "../../components/AppShell";
import { mostrarToast } from "../../components/AppToast";
import { StatusBar } from "../../components/StatusBar";
import { entrarNoPerfil } from "../../components/perfil-ativo";
import { SheetAcoesDependente } from "../components/sheet-acoes-dependente";
import { SheetConfirmacao } from "../components/sheet-confirmacao";
import { consumirUltimoAdicionado, type Dependente, iniciarHabilitacao, primeiroNome, removeDependente, removerAcesso, simularContaCriada, simularFalhaNaProxima, useDependentes } from "../data/dependentes";

type Status = "carregando" | "erro" | "ok";

/* Cenários de teste pela URL (só na 1ª carga):
   ?estado=erro          → falha ao carregar a lista
   ?cenario=falha        → a próxima habilitação de acesso não conclui
   ?cenario=conta-criada → Mariana criou a própria conta e os acessos foram encerrados */
const params = () => new URLSearchParams(window.location.search);

/**
 * Lista de dependentes como sempre foi (nome + dados do cadastro). No lugar da lixeira, "mais opções" abre
 * um bottom sheet com as ações do dependente: entrar, remover meu acesso, habilitar e remover o dependente.
 */
export function Dependentes() {
    const navigate = useNavigate();
    const lista = useDependentes();
    const [status, setStatus] = useState<Status>("carregando");
    // Id do dependente recém-cadastrado, para animar a entrada + destaque temporário.
    const [novoId] = useState<string | null>(() => consumirUltimoAdicionado());
    const [destacado, setDestacado] = useState<string | null>(null);
    const jaTentou = useRef(false);
    // "Mais opções" de um dependente e as confirmações que saem dele.
    const [opcoes, setOpcoes] = useState<Dependente | null>(null);
    const [aHabilitar, setAHabilitar] = useState<Dependente | null>(null);
    const [aRemover, setARemover] = useState<Dependente | null>(null);
    const [removendo, setRemovendo] = useState(false);
    const [aRemoverAcesso, setARemoverAcesso] = useState<Dependente | null>(null);

    // Fecha o sheet de opções e, logo depois, faz a ação (a confirmação sobe sem disputar com o sheet que desce).
    const depoisDeFechar = (fn: () => void) => {
        setOpcoes(null);
        window.setTimeout(fn, 250);
    };

    const entrarComo = (d: Dependente) => {
        entrarNoPerfil({ id: d.id, nome: d.nome, iniciais: d.iniciais, cpf: d.cpf, carteira: d.carteira });
        navigate("/ingresse-app/ingressos");
    };

    const confirmarRemocao = () => {
        if (!aRemover) return;
        const d = aRemover;
        setRemovendo(true);
        window.setTimeout(() => {
            removeDependente(d.id);
            setRemovendo(false);
            setARemover(null);
            mostrarToast("Dependente removido", d.nome);
        }, 900);
    };

    const confirmarRemocaoDeAcesso = () => {
        if (!aRemoverAcesso) return;
        const d = aRemoverAcesso;
        setRemovendo(true);
        window.setTimeout(() => {
            removerAcesso(d.id);
            setRemovendo(false);
            setARemoverAcesso(null);
            mostrarToast("Seu acesso foi removido", `${primeiroNome(d)} continua nos seus dependentes.`);
        }, 900);
    };

    // Carregamento dos dependentes: mostra skeleton e então resolve (ok/erro).
    const carregar = () => {
        setStatus("carregando");
        window.setTimeout(() => {
            if (params().get("estado") === "erro" && !jaTentou.current) {
                jaTentou.current = true;
                setStatus("erro");
                return;
            }
            setStatus("ok");
            setDestacado(novoId);
        }, 1600);
    };
    useEffect(() => {
        const cenario = params().get("cenario");
        if (cenario === "falha") simularFalhaNaProxima();
        if (cenario === "conta-criada") simularContaCriada("d1");
        carregar();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!destacado) return;
        const t = window.setTimeout(() => setDestacado(null), 1600);
        return () => window.clearTimeout(t);
    }, [destacado]);

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
                        onClick={() => navigate("/ingresse-app/perfil")}
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
                                            {/* Bolinha com as iniciais, no lugar da foto */}
                                            <Avatar size="md" initials={d.iniciais} alt={d.nome} />
                                            {/* Nome em cima e, embaixo, uma frase curta sobre o acesso (sem badge) */}
                                            <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                                                <p className="w-full truncate text-md font-bold text-primary">{d.nome}</p>
                                                <p
                                                    className={cx(
                                                        "flex items-center gap-1.5 text-sm",
                                                        d.acesso === "pronto" ? "text-utility-blue-700" : "text-secondary",
                                                    )}
                                                >
                                                    {/* Habilitação em andamento: um loading pequeno junto da frase */}
                                                    {d.acesso === "preparando" && (
                                                        <span
                                                            className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-tertiary border-t-fg-brand-primary"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    {fraseDoAcesso(d)}
                                                </p>
                                            </div>
                                            {/* Conta própria: remover é a única ação, então volta a lixeira direto no card */}
                                            {d.acesso === "conta-propria" ? (
                                                <button
                                                    type="button"
                                                    aria-label={`Remover ${d.nome}`}
                                                    onClick={() => setARemover(d)}
                                                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear active:scale-90 active:bg-secondary active:text-fg-error-primary"
                                                >
                                                    <Trash01 className="size-5" />
                                                </button>
                                            ) : (
                                                /* No lugar da lixeira: "mais opções" abre as ações do dependente */
                                                <button
                                                    type="button"
                                                    aria-label={`Mais opções de ${d.nome}`}
                                                    onClick={() => setOpcoes(d)}
                                                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear active:scale-90 active:bg-secondary"
                                                >
                                                    <DotsVertical className="size-5" />
                                                </button>
                                            )}
                                        </div>

                                        <dl className="-mx-4 mt-3 flex flex-col gap-2 border-t border-tertiary px-4 pt-3">
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

            <SheetAcoesDependente
                dependente={opcoes}
                onFechar={() => setOpcoes(null)}
                onEntrar={() => opcoes && entrarComo(opcoes)}
                onRemoverAcesso={() => {
                    const d = opcoes;
                    depoisDeFechar(() => setARemoverAcesso(d));
                }}
                onHabilitar={() => {
                    const d = opcoes;
                    depoisDeFechar(() => setAHabilitar(d));
                }}
                onTentarDeNovo={() => {
                    const d = opcoes;
                    setOpcoes(null);
                    if (d) iniciarHabilitacao(d.id);
                }}
                onRemover={() => {
                    const d = opcoes;
                    depoisDeFechar(() => setARemover(d));
                }}
            />

            <SheetConfirmacao
                aberto={Boolean(aRemover)}
                titulo={`Remover ${aRemover?.nome ?? ""}?`}
                descricao="Você não poderá desfazer essa ação."
                confirmar="Remover dependente"
                destrutivo
                carregando={removendo}
                onConfirmar={confirmarRemocao}
                onCancelar={() => setARemover(null)}
            />

            <SheetConfirmacao
                aberto={Boolean(aRemoverAcesso)}
                titulo={`Remover seu acesso ao perfil de ${aRemoverAcesso ? primeiroNome(aRemoverAcesso) : ""}?`}
                descricao={
                    aRemoverAcesso &&
                    `Você não poderá mais acessar esse perfil pela sua conta. ${primeiroNome(aRemoverAcesso)} continuará na sua lista de dependentes, sem alterações no cadastro ou nos ingressos.`
                }
                confirmar="Remover meu acesso"
                destrutivo
                carregando={removendo}
                onConfirmar={confirmarRemocaoDeAcesso}
                onCancelar={() => setARemoverAcesso(null)}
            />

            {/* Habilitar acesso: o que a permissão significa, antes do código */}
            <SheetConfirmacao
                aberto={Boolean(aHabilitar)}
                titulo={`Habilitar acesso ao perfil de ${aHabilitar ? primeiroNome(aHabilitar) : ""}?`}
                descricao={
                    aHabilitar && (
                        <>
                            <span className="block">
                                Você poderá usar esse perfil pela sua conta, sem precisar de outro login, e acessar apenas os ingressos que você comprou ou
                                atribuiu a ele.
                            </span>
                            <span className="mt-2 block">Na próxima etapa, vamos confirmar sua identidade com um código.</span>
                        </>
                    )
                }
                confirmar="Confirmar identidade"
                onConfirmar={() => {
                    const id = aHabilitar!.id;
                    setAHabilitar(null);
                    navigate(`/ingresse-app/perfil/dependentes/${id}/habilitar`);
                }}
                onCancelar={() => setAHabilitar(null)}
            />
        </AppShell>
    );
}

/** Sua relação com o perfil do dependente (ou a conta própria dele). Sempre aparece abaixo do nome: em azul só quando você tem acesso; nos demais casos, em cinza. */
const fraseDoAcesso = (d: Dependente) => {
    if (d.acesso === "pronto") return "Você tem acesso a este perfil";
    if (d.acesso === "conta-propria") return "Possui conta própria";
    if (d.acesso === "preparando") return "Preparando acesso ao perfil";
    return "Acesso não habilitado";
};

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
                <div className="mt-3 flex flex-col gap-2.5 pt-3">
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
