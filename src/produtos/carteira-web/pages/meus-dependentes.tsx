import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    DotsVertical,
    InfoCircle,
    LogIn04,
    RefreshCw01,
    ShieldTick,
    Trash01,
    UserPlus01,
    UserX01,
    Users01,
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BotaoFechar, Confirmacao, Dialogo } from "../components/dialogo";
import { HabilitarAcesso } from "../components/habilitar-acesso";
import { VoltarTitulo } from "../components/evento-desktop";
import { WebShell } from "../components/web-shell";
import { mostrarToast } from "../components/WebToast";
import {
    getDependente,
    iniciarHabilitacao,
    primeiroNome,
    removeDependente,
    removerAcesso,
    simularContaCriada,
    simularFalhaNaProxima,
    useDependentes,
    type Dependente,
} from "../data/dependentes";
import { entrarNoPerfil } from "../data/perfil-ativo";

type Status = "carregando" | "erro" | "ok";

/* Cenários de teste pela URL (só na 1ª carga), os mesmos do app:
   ?estado=erro          → falha ao carregar a lista
   ?cenario=falha        → a próxima habilitação de acesso não conclui
   ?cenario=conta-criada → Mariana criou a própria conta e os acessos foram encerrados */
const params = () => new URLSearchParams(window.location.search);

/**
 * "Meus dependentes" do site, agora dentro da Carteira Web (mesmo header, dá para voltar).
 * Lista como a de produção (parentesco, nascimento e CPF) + o fluxo de multicontas do app:
 * frase do acesso, mais opções (entrar, remover meu acesso, habilitar, remover) e a habilitação por código.
 */
export function MeusDependentes() {
    return <WebShell>{(compact) => <Conteudo compact={compact} />}</WebShell>;
}

function Conteudo({ compact }: { compact: boolean }) {
    const navigate = useNavigate();
    const lista = useDependentes();
    const [status, setStatus] = useState<Status>("carregando");
    const jaTentou = useRef(false);

    const [opcoes, setOpcoes] = useState<Dependente | null>(null);
    const [aHabilitar, setAHabilitar] = useState<Dependente | null>(null);
    const [aRemover, setARemover] = useState<Dependente | null>(null);
    const [aRemoverAcesso, setARemoverAcesso] = useState<Dependente | null>(null);
    const [removendo, setRemovendo] = useState(false);
    // Habilitação por código: ocupa a área da página (sem sair do header)
    const [habilitando, setHabilitando] = useState<string | null>(null);

    // Fecha as opções e, logo depois, abre a confirmação (sem disputar com o que está fechando).
    const depoisDeFechar = (fn: () => void) => {
        setOpcoes(null);
        window.setTimeout(fn, compact ? 250 : 0);
    };

    const entrarComo = (d: Dependente) => {
        entrarNoPerfil({ id: d.id, nome: d.nome, iniciais: d.iniciais, cpf: d.cpf, carteira: d.carteira });
        navigate("/carteira-web");
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

    const carregar = () => {
        setStatus("carregando");
        window.setTimeout(() => {
            if (params().get("estado") === "erro" && !jaTentou.current) {
                jaTentou.current = true;
                setStatus("erro");
                return;
            }
            setStatus("ok");
        }, 1200);
    };
    useEffect(() => {
        const cenario = params().get("cenario");
        if (cenario === "falha") simularFalhaNaProxima();
        if (cenario === "conta-criada") simularContaCriada("d1");
        carregar();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [habilitando]);

    const handlers = (d: Dependente): Handlers => ({
        onEntrar: () => {
            setOpcoes(null);
            entrarComo(d);
        },
        onRemoverAcesso: () => depoisDeFechar(() => setARemoverAcesso(d)),
        onHabilitar: () => depoisDeFechar(() => setAHabilitar(d)),
        onTentarDeNovo: () => {
            setOpcoes(null);
            iniciarHabilitacao(d.id);
        },
        onRemover: () => depoisDeFechar(() => setARemover(d)),
    });

    const depHabilitando = getDependente(habilitando ?? undefined);
    if (depHabilitando) {
        return (
            <HabilitarAcesso
                key={depHabilitando.id}
                dependente={depHabilitando}
                compact={compact}
                onVoltar={() => setHabilitando(null)}
                onEntrar={() => entrarComo(depHabilitando)}
            />
        );
    }

    const corpo =
        status === "carregando" ? (
            <SkeletonLista compact={compact} />
        ) : status === "erro" ? (
            <div className="flex flex-col items-center px-5 pt-16 text-center">
                <FeaturedIcon icon={AlertTriangle} color="error" theme="modern" size="lg" />
                <p className="mt-4 text-md font-semibold text-primary">Algo deu errado</p>
                <p className="mt-1 text-sm text-tertiary">Não foi possível carregar seus dependentes. Tente novamente em alguns instantes.</p>
                <Button size="md" color="primary" className="mt-5" onClick={carregar}>
                    Tentar novamente
                </Button>
            </div>
        ) : lista.length === 0 ? (
            <div className="flex flex-col items-center px-5 pt-16 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-fg-quaternary ring-1 ring-border-secondary">
                    <Users01 className="size-6" />
                </span>
                <p className="mt-4 text-md font-semibold text-primary">Nenhum dependente cadastrado</p>
                <p className="mt-1 text-sm text-tertiary">Use “Cadastrar dependente” para adicionar o primeiro.</p>
            </div>
        ) : (
            <div className={cx("flex flex-col", compact ? "gap-3 px-5 pt-5 pb-32" : "gap-4")}>
                <AnimatePresence mode="popLayout" initial={false}>
                    {lista.map((d) => (
                        <motion.div
                            key={d.id}
                            layout
                            exit={{ opacity: 0, scale: 0.9, x: 40 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {compact ? (
                                <CardMobile d={d} onOpcoes={() => setOpcoes(d)} onRemover={() => setARemover(d)} />
                            ) : (
                                <CardDesktop d={d} onRemover={() => setARemover(d)} handlers={handlers(d)} />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        );

    const dialogos = (
        <>
            {/* Mais opções no celular: o bottom sheet do app */}
            {compact && (
                <Dialogo aberto={Boolean(opcoes)} compact label={`Opções de ${opcoes?.nome ?? ""}`} onFechar={() => setOpcoes(null)}>
                    {opcoes && (
                        <>
                            <div className="flex items-center gap-3">
                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-lg font-bold text-primary">{opcoes.nome}</h2>
                                    <p className="text-sm text-tertiary">{opcoes.parentesco}</p>
                                </div>
                                <BotaoFechar onClick={() => setOpcoes(null)} />
                            </div>
                            <Condicao d={opcoes} />
                            <ListaDeAcoes d={opcoes} handlers={handlers(opcoes)} />
                        </>
                    )}
                </Dialogo>
            )}

            <Confirmacao
                aberto={Boolean(aRemover)}
                compact={compact}
                titulo={`Remover ${aRemover?.nome ?? ""}?`}
                descricao="Você não poderá desfazer essa ação."
                confirmar="Remover dependente"
                destrutivo
                carregando={removendo}
                onConfirmar={confirmarRemocao}
                onCancelar={() => setARemover(null)}
            />

            <Confirmacao
                aberto={Boolean(aRemoverAcesso)}
                compact={compact}
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
            <Confirmacao
                aberto={Boolean(aHabilitar)}
                compact={compact}
                titulo={`Habilitar acesso ao perfil de ${aHabilitar ? primeiroNome(aHabilitar) : ""}?`}
                descricao={
                    aHabilitar && (
                        <>
                            <span className="block">
                                Você poderá usar esse perfil pela sua conta, sem precisar de outro login, e acessar apenas os ingressos que você comprou ou atribuiu a ele.
                            </span>
                            <span className="mt-2 block">Na próxima etapa, vamos confirmar sua identidade com um código.</span>
                        </>
                    )
                }
                confirmar="Confirmar identidade"
                onConfirmar={() => {
                    const id = aHabilitar!.id;
                    setAHabilitar(null);
                    setHabilitando(id);
                }}
                onCancelar={() => setAHabilitar(null)}
            />
        </>
    );

    if (compact) {
        return (
            <div className="relative flex min-h-0 flex-1 flex-col">
                <div className="scrollbar-hide flex-1 overflow-y-auto bg-secondary">
                    <div className="px-5 pt-4">
                        <button
                            type="button"
                            aria-label="Voltar"
                            onClick={() => navigate("/carteira-web")}
                            className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <h1 className="pt-4 text-2xl font-bold text-primary">Meus dependentes</h1>
                    </div>
                    {corpo}
                </div>
                {status === "ok" && (
                    <div className="absolute inset-x-0 bottom-0 border-t border-secondary bg-primary px-5 pt-3 pb-6">
                        <Button size="lg" color="primary" iconLeading={UserPlus01} className="w-full">
                            Cadastrar dependente
                        </Button>
                    </div>
                )}
                {dialogos}
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-5rem)] bg-secondary">
            {/* Faixa branca com voltar + título (padrão das páginas internas) */}
            <VoltarTitulo titulo="Meus dependentes" onBack={() => navigate("/carteira-web")}>
                {/* Ação única e central da tela: botão com ícone à esquerda, como no Figma */}
                <Button size="md" color="primary" iconLeading={UserPlus01}>
                    Cadastrar dependente
                </Button>
            </VoltarTitulo>
            <div className="mx-auto max-w-[1440px] px-14 pt-6 pb-28">{corpo}</div>
            {dialogos}
        </div>
    );
}

/* ============================== Cards ============================== */

/** Sua relação com o perfil do dependente (ou a conta própria dele). Mesma frase do app. */
const fraseDoAcesso = (d: Dependente) => {
    if (d.acesso === "pronto") return "Você tem acesso a este perfil";
    if (d.acesso === "conta-propria") return "Possui conta própria";
    if (d.acesso === "preparando") return "Preparando acesso ao perfil";
    return "Acesso não habilitado";
};

const Frase = ({ d }: { d: Dependente }) => (
    <p className={cx("flex items-center gap-1.5 text-sm", d.acesso === "pronto" ? "text-utility-blue-700" : "text-secondary")}>
        {d.acesso === "preparando" && <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-tertiary border-t-fg-brand-primary" aria-hidden="true" />}
        {fraseDoAcesso(d)}
    </p>
);

/** Desktop: linha como a de produção (dados à direita) + nome e frase do acesso; as opções abrem num menu. */
function CardDesktop({ d, onRemover, handlers }: { d: Dependente; onRemover: () => void; handlers: Handlers }) {
    const acoes = acoesDe(d, handlers);
    // Menu sem travar a rolagem (isNonModal): o fechar ao clicar fora e com Esc fica por nossa conta
    const [menuAberto, setMenuAberto] = useState(false);
    const rotulo = `Mais opções de ${d.nome}`;
    useEffect(() => {
        if (!menuAberto) return;
        const fora = (e: PointerEvent) => {
            const alvo = e.target as Element | null;
            if (alvo?.closest('[role="menu"]') || alvo?.closest(`[aria-label="${rotulo}"]`)) return;
            setMenuAberto(false);
        };
        const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
        document.addEventListener("pointerdown", fora);
        document.addEventListener("keydown", esc);
        return () => {
            document.removeEventListener("pointerdown", fora);
            document.removeEventListener("keydown", esc);
        };
    }, [menuAberto, rotulo]);
    const nota = notaDaCondicao(d);
    // Ações críticas (remover) ficam separadas das demais, como pede o menu do DS
    const comuns = acoes.filter((a) => !a.destrutiva);
    const criticas = acoes.filter((a) => a.destrutiva);
    const executar = (id: string | number) => acoes.find((a) => a.id === id)?.onClick();

    return (
        <div className="flex items-center gap-8 rounded-2xl bg-primary px-5 py-4 shadow-xs ring-1 ring-border-secondary">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* Bolinha com as iniciais, no lugar da foto */}
                <Avatar size="md" initials={d.iniciais} alt={d.nome} />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-md font-bold text-primary">{d.nome}</p>
                    <Frase d={d} />
                </div>
            </div>
            {/* Cada coluna na largura do próprio conteúdo + o mesmo espaço entre elas (e alinhadas de um card para o outro) */}
            <div className="flex shrink-0 gap-8">
                <Dado valor={d.parentesco} label="Parentesco" className="w-16" />
                <Dado valor={d.nascimento} label="Data de nascimento" className="w-[116px]" />
                <Dado valor={d.cpf} label="CPF" className="w-[116px]" />
            </div>
            {/* Conta própria: remover é a única ação, então a lixeira fica direto no card (como hoje) */}
            {d.acesso === "conta-propria" ? (
                <Button size="md" color="secondary" iconLeading={Trash01} aria-label={`Remover ${d.nome}`} onClick={onRemover} />
            ) : (
                /* Desktop: menu suspenso do DS (Dropdown); no celular continua o bottom sheet do app */
                <Dropdown.Root isOpen={menuAberto} onOpenChange={setMenuAberto}>
                    <Button size="md" color="secondary" iconLeading={DotsVertical} aria-label={rotulo} />
                    {/* isNonModal: não trava a rolagem da página ao abrir (a barra sumia e o conteúdo "puxava" para a direita); fecha ao clicar fora ou com Esc */}
                    <Dropdown.Popover className="w-64" isNonModal>
                        <Dropdown.Menu onAction={executar} aria-label={`Opções de ${d.nome}`}>
                            {nota ? (
                                <Dropdown.Section>
                                    <Dropdown.SectionHeader className="flex items-start gap-2 px-4 pt-2 pb-2.5 text-xs text-tertiary">
                                        {nota}
                                    </Dropdown.SectionHeader>
                                </Dropdown.Section>
                            ) : null}
                            {nota ? <Dropdown.Separator /> : null}
                            {comuns.map((a) => (
                                <Dropdown.Item key={a.id} id={a.id} icon={a.icon} label={a.label} />
                            ))}
                            {comuns.length > 0 ? <Dropdown.Separator /> : null}
                            {criticas.map((a) => (
                                <Dropdown.Item key={a.id} id={a.id} icon={emVermelho(a.icon)} label={a.label} />
                            ))}
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            )}
        </div>
    );
}

/** Ícone das ações críticas no vermelho da marca, como no app (o cx troca a cor neutra que o item do DS aplica). */
const vermelhos = new Map<FC<{ className?: string }>, FC<{ className?: string }>>();
const emVermelho = (Icon: FC<{ className?: string }>) => {
    if (!vermelhos.has(Icon)) {
        const Vermelho: FC<{ className?: string }> = ({ className, ...props }) => <Icon {...props} className={cx(className, "text-fg-brand-primary")} />;
        vermelhos.set(Icon, Vermelho);
    }
    return vermelhos.get(Icon)!;
};

/** Explicação curta da condição, no topo do menu do desktop (mesmos textos do app). */
const notaDaCondicao = (d: Dependente) => {
    if (d.acesso === "preparando")
        return (
            <>
                <span className="mt-0.5 size-3.5 shrink-0 animate-spin rounded-full border-2 border-tertiary border-t-fg-brand-primary" aria-hidden="true" />
                <span>Preparando o acesso. Isso pode levar alguns instantes.</span>
            </>
        );
    if (d.acesso === "falhou")
        return (
            <>
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-fg-error-primary" aria-hidden="true" />
                <span>Não foi possível habilitar o acesso ao perfil.</span>
            </>
        );
    return null;
};

/** Dado do dependente: título pequeno em cima e o valor embaixo (como no app). */
const Dado = ({ valor, label, className }: { valor: string; label: string; className: string }) => (
    <div className={className}>
        <p className="text-xs text-tertiary">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold text-primary tabular-nums">{valor}</p>
    </div>
);

/** Celular: o card do app (nome, frase e os dados em linhas). */
const CardMobile = ({ d, onOpcoes, onRemover }: { d: Dependente; onOpcoes: () => void; onRemover: () => void }) => (
    <div className="rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
        <div className="flex items-center gap-3">
            <Avatar size="md" initials={d.iniciais} alt={d.nome} />
            <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <p className="w-full truncate text-md font-bold text-primary">{d.nome}</p>
                <Frase d={d} />
            </div>
            {d.acesso === "conta-propria" ? (
                <button
                    type="button"
                    aria-label={`Remover ${d.nome}`}
                    onClick={onRemover}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear active:scale-90 active:bg-secondary active:text-fg-error-primary"
                >
                    <Trash01 className="size-5" />
                </button>
            ) : (
                <button
                    type="button"
                    aria-label={`Mais opções de ${d.nome}`}
                    onClick={onOpcoes}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear active:scale-90 active:bg-secondary"
                >
                    <DotsVertical className="size-5" />
                </button>
            )}
        </div>
        <dl className="-mx-4 mt-3 flex flex-col gap-2 border-t border-tertiary px-4 pt-3">
            {[
                ["Data de nascimento", d.nascimento],
                ["CPF", d.cpf],
                ["Parentesco", d.parentesco],
            ].map(([label, valor]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                    <dt className="text-sm text-tertiary">{label}</dt>
                    <dd className="text-sm font-semibold text-primary tabular-nums">{valor}</dd>
                </div>
            ))}
        </dl>
    </div>
);

/* ============================== Ações ============================== */

type Handlers = { onEntrar: () => void; onRemoverAcesso: () => void; onHabilitar: () => void; onTentarDeNovo: () => void; onRemover: () => void };
type Acao = { id: string; icon: FC<{ className?: string }>; label: string; destrutiva?: boolean; onClick: () => void };

/** O que dá para fazer com o dependente, conforme a condição do acesso (mesmas ações do app). */
const acoesDe = (d: Dependente, h: Handlers): Acao[] => [
        ...(d.acesso === "pronto"
            ? [
                  { id: "entrar", icon: LogIn04, label: `Entrar como ${primeiroNome(d)}`, onClick: h.onEntrar },
                  { id: "remover-acesso", icon: UserX01, label: "Remover meu acesso", destrutiva: true, onClick: h.onRemoverAcesso },
              ]
            : []),
        ...(d.acesso === "nao-configurado" ? [{ id: "habilitar", icon: ShieldTick, label: "Habilitar acesso", onClick: h.onHabilitar }] : []),
        ...(d.acesso === "falhou" ? [{ id: "tentar", icon: RefreshCw01, label: "Tentar habilitar de novo", onClick: h.onTentarDeNovo }] : []),
        { id: "remover", icon: Trash01, label: "Remover dependente", destrutiva: true, onClick: h.onRemover },
];

function ListaDeAcoes({ d, handlers }: { d: Dependente; handlers: Handlers }) {
    const acoes = acoesDe(d, handlers);
    return (
        <ul className="mt-4 overflow-hidden rounded-2xl ring-1 ring-border-secondary first:mt-0">
            {acoes.map((a) => (
                <li key={a.id} className="border-b border-secondary last:border-0">
                    <button
                        type="button"
                        role="menuitem"
                        onClick={a.onClick}
                        className="flex w-full items-center gap-3.5 p-3.5 text-left transition duration-100 ease-linear hover:bg-secondary/60 active:bg-secondary"
                    >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                            <a.icon className={cx("size-5", a.destrutiva ? "text-fg-brand-primary" : "text-fg-secondary")} />
                        </span>
                        <span className="text-sm font-semibold text-primary">{a.label}</span>
                    </button>
                </li>
            ))}
        </ul>
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

/* Skeleton da lista enquanto os dependentes carregam. */
const SkeletonLista = ({ compact }: { compact: boolean }) => (
    <div className={cx("flex animate-pulse flex-col", compact ? "gap-3 px-5 pt-5" : "gap-4")}>
        {[0, 1, 2].map((i) => (
            <div key={i} className={cx("rounded-2xl bg-primary ring-1 ring-border-secondary", compact ? "flex items-center gap-3 p-4" : "flex items-center gap-8 px-5 py-5")}>
                <div className="size-10 shrink-0 rounded-full bg-tertiary" />
                <div className="flex flex-1 flex-col gap-2">
                    <div className="h-4 w-48 rounded-full bg-tertiary" />
                    <div className="h-3 w-36 rounded-full bg-tertiary" />
                </div>
                {!compact && [0, 1, 2].map((j) => <div key={j} className="h-3 w-24 rounded-full bg-tertiary" />)}
                {!compact && <div className="size-11 rounded-lg bg-tertiary" />}
            </div>
        ))}
    </div>
);
