import { useEffect, useRef, useState, type FC, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation, useNavigate, useParams } from "react-router";
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Edit01, HelpCircle, HomeLine, User01, Users01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Toggle } from "@/components/base/toggle/toggle";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ModalDesativar } from "../components/modal-desativar";
import { ModalEditarOperadores } from "../components/modal-editar-operadores";
import { BadgeInativo, BarraUso, TemaCotas } from "../components/ui-cotas";
import { apoioDoItem, estoqueDoItem, ITEM_POR_ID, SESSAO_POR_ID } from "../data/catalogo-evento";
import { GRUPO_MEMBROS_POR_ID } from "../data/membros";
import { itensValidos, limiteDoGrupo, plural, ROTULO_ATUACAO, ROTULO_COTA, useEquipeV3, usadasDoGrupo, type GrupoCotas } from "../data/equipe-v3-store";

const BASE = "/backstage/equipe-de-operacao/v3";

export function DetalheGrupoV3() {
    const navigate = useNavigate();
    const { grupoId = "" } = useParams();
    const { getGrupo, toggleOperador, operadorAtivo, toggleGrupoMembros, grupoMembrosAtivo, setOperadores } = useEquipeV3();
    const grupo = getGrupo(grupoId);
    // Desligar pede confirmação: uma pessoa ou um grupo de Membros inteiro.
    const [desligando, setDesligando] = useState<{ tipo: "operador" | "grupo"; id: string } | null>(null);
    const [editandoOperadores, setEditandoOperadores] = useState(false);

    // Voltar de "Editar itens" (ou abrir o grupo) começa do topo, não onde a tela anterior estava.
    useEffect(() => {
        window.scrollTo({ top: 0 });
    }, [grupoId]);

    // Voltando de "Editar itens", a lista "recarrega" (halo no card + linhas em cascata) só nesta chegada.
    const location = useLocation();
    const [atualizado] = useState(() => Boolean((location.state as { atualizado?: boolean } | null)?.atualizado));
    useEffect(() => {
        if (atualizado) navigate(location.pathname, { replace: true, state: null });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const voltar = () => navigate(BASE);

    if (!grupo) {
        return (
            <BackstageLayout activeSection="gerenciamento-cotas" railVariant="gestao-operacao">
                <TemaCotas className="items-center justify-center gap-4 py-20 text-center">
                    <p className="text-sm text-tertiary">Grupo não encontrado.</p>
                    <Button size="md" color="secondary" onClick={voltar}>
                        Voltar para a listagem
                    </Button>
                </TemaCotas>
            </BackstageLayout>
        );
    }

    return (
        <BackstageLayout activeSection="gerenciamento-cotas" railVariant="gestao-operacao">
            <TemaCotas>
                <header className="p-6">
                    <nav aria-label="Breadcrumb" className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => navigate("/backstage/")}
                            aria-label="Início"
                            className="rounded-md p-1 text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover"
                        >
                            <HomeLine className="size-5" aria-hidden="true" />
                        </button>
                        <ChevronRight className="size-4 text-[var(--color-border-primary)]" aria-hidden="true" />
                        <button
                            type="button"
                            onClick={voltar}
                            className="rounded-md px-2 py-1 text-sm font-semibold text-tertiary transition duration-100 ease-linear hover:bg-primary_hover hover:text-secondary"
                        >
                            Gerenciamento de cotas
                        </button>
                        <ChevronRight className="size-4 text-[var(--color-border-primary)]" aria-hidden="true" />
                        <span aria-current="page" className="rounded-md bg-tertiary px-2 py-1 text-sm font-semibold text-secondary">
                            Detalhes
                        </span>
                    </nav>
                </header>

                <main className="flex flex-1 flex-col gap-6 px-6 pb-6">
                    <div className="flex items-center gap-4 pb-3">
                        <ButtonUtility size="sm" color="secondary" icon={ChevronLeft} tooltip="Voltar" onClick={voltar} />
                        <div className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-primary">{grupo.nome}</span>
                                {!grupo.ativo && <BadgeInativo />}
                            </span>
                            <span className="text-xs text-tertiary">
                                {plural(grupo.operadores.length, "operador", "operadores")} • {ROTULO_COTA[grupo.cota.tipo]}
                            </span>
                        </div>
                    </div>

                    <CardItensECotas grupo={grupo} atualizado={atualizado} onEditar={() => navigate(`${BASE}/${grupo.id}/editar?etapa=itens`)} />

                    <section className="flex flex-col gap-3 rounded-2xl bg-primary px-5 py-4 ring-1 ring-border-secondary ring-inset">
                        {/* Operadores vêm dos grupos de Membros e de e-mails avulsos; aqui só liga e desliga. */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-0.5">
                                <h2 className="text-sm font-semibold text-primary">Operadores</h2>
                                {/* Total sem repetir quem está em mais de um grupo. */}
                                <span className="text-sm text-tertiary">{plural(grupo.operadores.length, "pessoa", "pessoas")} no total</span>
                            </div>
                            <Button size="sm" color="tertiary" iconLeading={Edit01} onClick={() => setEditandoOperadores(true)}>
                                Editar operadores
                            </Button>
                        </div>
                        {/* Separado como na criação: um bloco por grupo de Membros e, por último, quem entrou por e-mail. */}
                        <div className="flex flex-col gap-3 pb-1">
                            {grupo.gruposMembrosIds.map((m) => {
                                const membros = GRUPO_MEMBROS_POR_ID[m];
                                if (!membros) return null;
                                const ligado = grupoMembrosAtivo(grupo, m);
                                return (
                                    <BlocoOperadores
                                        key={m}
                                        icone={Users01}
                                        titulo={`${membros.nome} – ${plural(membros.emails.length, "membro", "membros")}`}
                                        toggle={{
                                            ligado,
                                            rotulo: `${ligado ? "Desativar" : "Ativar"} o grupo ${membros.nome}`,
                                            onChange: () => (ligado ? setDesligando({ tipo: "grupo", id: m }) : toggleGrupoMembros(grupo.id, m)),
                                        }}
                                    >
                                        {membros.emails.map((email) => (
                                            <LinhaOperador
                                                key={email}
                                                email={email}
                                                emitidos={grupo.emitidosPorOperador[email] ?? 0}
                                                ativo={ligado && operadorAtivo(grupo, email)}
                                                // Com o grupo desligado, a pessoa fica desligada junto e só volta religando o grupo.
                                                bloqueado={!ligado}
                                                onChange={(ativo) => (ativo ? setDesligando({ tipo: "operador", id: email }) : toggleOperador(grupo.id, email))}
                                            />
                                        ))}
                                    </BlocoOperadores>
                                );
                            })}
                            {grupo.emailsAvulsos.length > 0 && (
                                <BlocoOperadores
                                    icone={User01}
                                    titulo={`Adicionadas individualmente – ${plural(grupo.emailsAvulsos.length, "pessoa", "pessoas")}`}
                                >
                                    {grupo.emailsAvulsos.map((email) => {
                                        const ativo = operadorAtivo(grupo, email);
                                        return (
                                            <LinhaOperador
                                                key={email}
                                                email={email}
                                                emitidos={grupo.emitidosPorOperador[email] ?? 0}
                                                ativo={ativo}
                                                onChange={() => (ativo ? setDesligando({ tipo: "operador", id: email }) : toggleOperador(grupo.id, email))}
                                            />
                                        );
                                    })}
                                </BlocoOperadores>
                            )}
                        </div>
                    </section>
                </main>

                <ModalEditarOperadores
                    grupo={editandoOperadores ? grupo : null}
                    onCancelar={() => setEditandoOperadores(false)}
                    onSalvar={(grupos, emails) => {
                        setOperadores(grupo.id, grupos, emails);
                        setEditandoOperadores(false);
                    }}
                />

                <ModalDesativar
                    aberto={Boolean(desligando)}
                    titulo={desligando?.tipo === "grupo" ? "Desativar grupo de membros?" : "Desativar operador?"}
                    descricao={
                        desligando?.tipo === "grupo" ? (
                            <>
                                Ao desativar, os membros de <span className="font-medium text-secondary">{GRUPO_MEMBROS_POR_ID[desligando.id]?.nome}</span>{" "}
                                deixam de ter acesso aos ingressos deste grupo. Você poderá ativá-lo novamente quando quiser.
                            </>
                        ) : (
                            <>
                                Ao desativar, <span className="font-medium text-secondary">{desligando?.id}</span> deixa de ter acesso aos ingressos deste
                                grupo. Você poderá ativá-lo novamente quando quiser.
                            </>
                        )
                    }
                    acao={desligando?.tipo === "grupo" ? "Desativar grupo" : "Desativar operador"}
                    onCancelar={() => setDesligando(null)}
                    onConfirmar={() => {
                        if (desligando?.tipo === "grupo") toggleGrupoMembros(grupo.id, desligando.id);
                        else if (desligando) toggleOperador(grupo.id, desligando.id);
                        setDesligando(null);
                    }}
                />
            </TemaCotas>
        </BackstageLayout>
    );
}

/* --------------------------- Operadores ---------------------------- */

const BlocoOperadores = ({
    icone: Icone,
    titulo,
    toggle,
    children,
}: {
    icone: FC<{ className?: string }>;
    titulo: string;
    /** Só os grupos de Membros: liga/desliga todos os membros de uma vez. */
    toggle?: { ligado: boolean; rotulo: string; onChange: () => void };
    children: ReactNode;
}) => (
    <section className="flex flex-col gap-3 rounded-lg bg-primary_alt px-4 pt-3 pb-4 ring-1 ring-border-secondary ring-inset">
        <div className="flex min-h-6 items-center gap-2">
            {toggle && <Toggle size="sm" isSelected={toggle.ligado} onChange={toggle.onChange} aria-label={toggle.rotulo} />}
            <Icone
                className={cx("size-4 shrink-0 text-fg-quaternary transition-opacity duration-300", toggle && !toggle.ligado && "opacity-50")}
                aria-hidden="true"
            />
            <h3 className={cx("truncate text-sm font-medium text-secondary transition-opacity duration-300", toggle && !toggle.ligado && "opacity-50")}>
                {titulo}
            </h3>
        </div>
        {/* Com o toggle do grupo, as pessoas recuam até o ícone (36px do toggle + 8px de gap): ficam "dentro" do grupo. */}
        <ul className={cx("flex flex-col gap-4", toggle && "pl-11")}>{children}</ul>
    </section>
);

const LinhaOperador = ({
    email,
    emitidos,
    ativo,
    bloqueado = false,
    onChange,
}: {
    email: string;
    emitidos: number;
    ativo: boolean;
    /** Grupo desligado: o toggle da pessoa fica travado. */
    bloqueado?: boolean;
    onChange: (ativo: boolean) => void;
}) => {
    // Inativo: e-mail e "emitidos" a 50%, só o toggle segue a 100% — como os cards da listagem.
    const apagado = cx("transition-opacity duration-300 ease-out", !ativo && "opacity-50");
    return (
        <li className="flex items-center gap-4">
            <span className="flex min-w-0 flex-1 items-center gap-2">
                <Toggle
                    size="sm"
                    isSelected={ativo}
                    isDisabled={bloqueado}
                    onChange={() => onChange(ativo)}
                    aria-label={ativo ? `Desativar ${email}` : `Ativar ${email}`}
                />
                <span className={cx("truncate text-sm text-secondary", apagado)}>{email}</span>
            </span>
            <span className={cx("shrink-0 text-sm font-medium text-secondary tabular-nums", apagado)}>{plural(emitidos, "emitido", "emitidos")}</span>
        </li>
    );
};

/* ------------------------- Itens e cotas -------------------------- */

const CardItensECotas = ({ grupo, atualizado, onEditar }: { grupo: GrupoCotas; atualizado: boolean; onEditar: () => void }) => {
    const tipo = grupo.cota.tipo;
    const limite = limiteDoGrupo(grupo);
    const usadas = usadasDoGrupo(grupo);
    const itens = itensValidos(grupo);
    const { setCotaItem, setCotaTotal } = useEquipeV3();
    // Uma cota editando por vez (um item, ou "total" na compartilhada).
    const [editando, setEditando] = useState<string | null>(null);

    return (
        <section className="relative flex flex-col gap-3 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary ring-inset">
            {/* Halo: um anel da marca que se abre em volta do card e some, uma vez, ao voltar da edição */}
            {atualizado && (
                <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    // O contorno acende na cor da marca e o anel se abre para fora, apagando junto.
                    initial={{ boxShadow: "0 0 0 0px rgba(255, 39, 26, 0.7), inset 0 0 0 1px rgba(255, 74, 64, 1)" }}
                    animate={{ boxShadow: "0 0 0 20px rgba(255, 39, 26, 0), inset 0 0 0 1px rgba(255, 74, 64, 0)" }}
                    transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                />
            )}
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-60 flex-col gap-1">
                    <div className="flex items-center gap-1">
                        <h2 className="text-sm font-medium whitespace-nowrap text-primary">
                            {ROTULO_ATUACAO[grupo.atuacao]} · {ROTULO_COTA[tipo]}
                        </h2>
                        {/* Sem cota, o número de referência de cada item é o estoque: o tooltip explica isso */}
                        {tipo === "sem-limite" && (
                            <Tooltip
                                title={<span className="font-normal whitespace-nowrap">Sem cota definida: o limite de cada item é o estoque disponível.</span>}
                                placement="right"
                                arrow
                            >
                                <TooltipTrigger
                                    aria-label="Como o limite é calculado"
                                    className="flex text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover"
                                >
                                    <HelpCircle className="size-4" aria-hidden="true" />
                                </TooltipTrigger>
                            </Tooltip>
                        )}
                    </div>
                    {/* Só a compartilhada tem um saldo único do grupo para mostrar no topo. */}
                    {tipo === "compartilhada" && limite !== null && (
                        <CotaDoItem
                            variante="topo"
                            nome="grupo"
                            uso={usadas}
                            cota={limite}
                            editando={editando === "total"}
                            onEditar={() => setEditando("total")}
                            onCancelar={() => setEditando(null)}
                            onSalvar={(n) => {
                                setCotaTotal(grupo.id, n);
                                setEditando(null);
                            }}
                        />
                    )}
                </div>
                <Button size="sm" color="tertiary" iconLeading={Edit01} onClick={onEditar}>
                    Editar itens
                </Button>
            </div>

            <div className="h-px bg-[var(--color-border-secondary)]" />

            {/* Grade com subgrid: a coluna de uso tem a largura do maior texto, e todas as barras acompanham. */}
            <ul className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-4">
                {itens.map((id, idx) => {
                    const item = ITEM_POR_ID[id];
                    const uso = grupo.usoPorItem[id] ?? 0;
                    const cotaItem = grupo.cota.porItem[id] ?? 0;
                    return (
                        <motion.li
                            key={id}
                            // Ao voltar da edição as linhas reaparecem em cascata, de cima para baixo.
                            initial={atualizado ? { opacity: 0, y: 8 } : false}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.15 + idx * 0.05 }}
                            className="col-span-2 grid grid-cols-subgrid items-center"
                        >
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="text-sm font-medium text-primary">{item.nome}</span>
                                <span className="text-xs text-tertiary">{apoioDoItem(item)}</span>
                                <span className="text-xs text-tertiary">{SESSAO_POR_ID[item.sessaoId]?.curto}</span>
                            </span>
                            {tipo === "por-item" ? (
                                <CotaDoItem
                                    nome={item.nome}
                                    uso={uso}
                                    cota={cotaItem}
                                    editando={editando === id}
                                    onEditar={() => setEditando(id)}
                                    onCancelar={() => setEditando(null)}
                                    onSalvar={(n) => {
                                        setCotaItem(grupo.id, id, n);
                                        setEditando(null);
                                    }}
                                />
                            ) : tipo === "sem-limite" ? (
                                // Sem cota: a referência é o estoque do item, só para leitura (sem lápis).
                                <span className="flex min-w-[131px] flex-col gap-2">
                                    <span className="text-sm font-medium whitespace-nowrap text-secondary tabular-nums">
                                        {uso} de {Math.max(estoqueDoItem(item), uso)} emissões
                                    </span>
                                    <BarraUso usadas={uso} total={Math.max(estoqueDoItem(item), uso)} />
                                </span>
                            ) : (
                                <span className="justify-self-end text-sm font-medium whitespace-nowrap text-secondary tabular-nums">
                                    {plural(uso, "emissão", "emissões")}
                                </span>
                            )}
                        </motion.li>
                    );
                })}
            </ul>
        </section>
    );
};

/* ---------------------------- Cota do item ---------------------------- */

const soNumero = (v: string) => Number(v.replace(/\D/g, "").slice(0, 6)) || 0;

/** Tempo simulado da validação no servidor e quanto tempo cada feedback fica na tela. */
const TEMPO_VALIDANDO = 900;
const TEMPO_ERRO = 15000;
const TEMPO_SUCESSO = 3000;

type Estado = "exibindo" | "editando" | "validando" | "erro";

/**
 * Uso e barra da cota, com o lápis ao lado. Serve à linha de item (cota por item) e ao topo
 * do card (cota compartilhada); no topo o status fica à direita, para a barra seguir alinhada ao título.
 * O lápis abre um campo no lugar do uso; Enter ou
 * clicar fora valida (com loading), e o resultado aparece à esquerda: check de sucesso, ou
 * ícone de erro com tooltip já aberto, que some em 15s ou no X. Esc cancela.
 */
const CotaDoItem = ({
    variante = "item",
    nome,
    uso,
    cota,
    editando,
    onEditar,
    onCancelar,
    onSalvar,
}: {
    variante?: "item" | "topo";
    nome: string;
    uso: number;
    cota: number;
    editando: boolean;
    onEditar: () => void;
    onCancelar: () => void;
    onSalvar: (n: number) => void;
}) => {
    const [valor, setValor] = useState(cota);
    const [estado, setEstado] = useState<Estado>("exibindo");
    const [erro, setErro] = useState<{
        titulo: string;
        descricao: string;
    } | null>(null);
    const [sucesso, setSucesso] = useState(false);
    const tentado = useRef<number | null>(null);
    // Esc desmonta o campo; o blur que vem junto não deve validar.
    const cancelado = useRef(false);

    // Outra linha começou a editar: esta volta a exibir.
    useEffect(() => {
        if (!editando) {
            setEstado("exibindo");
            setErro(null);
        }
    }, [editando]);

    useEffect(() => {
        if (!erro) return;
        const t = setTimeout(() => setErro(null), TEMPO_ERRO);
        return () => clearTimeout(t);
    }, [erro]);

    useEffect(() => {
        if (!sucesso) return;
        const t = setTimeout(() => setSucesso(false), TEMPO_SUCESSO);
        return () => clearTimeout(t);
    }, [sucesso]);

    const abrir = () => {
        setValor(cota);
        setErro(null);
        setSucesso(false);
        tentado.current = null;
        cancelado.current = false;
        setEstado("editando");
        onEditar();
    };

    const validar = () => {
        if (cancelado.current || estado === "validando") return;
        // Sem mudança: só fecha o campo.
        if (valor === cota) return onCancelar();
        // Mesmo valor que acabou de dar erro: não valida de novo.
        if (estado === "erro" && valor === tentado.current) return;

        tentado.current = valor;
        setErro(null);
        setEstado("validando");
        setTimeout(() => {
            if (valor <= 0) {
                setErro({
                    titulo: "Cota inválida",
                    descricao: "Informe uma quantidade maior que zero.",
                });
                return setEstado("erro");
            }
            if (valor < uso) {
                setErro({
                    titulo: "Cota menor que o já emitido",
                    descricao: `Informe ${uso} ou mais.`,
                });
                return setEstado("erro");
            }
            onSalvar(valor);
            setSucesso(true);
        }, TEMPO_VALIDANDO);
    };

    const teclas = (e: KeyboardEvent) => {
        if (e.key === "Enter") validar();
        if (e.key === "Escape") {
            cancelado.current = true;
            onCancelar();
        }
    };

    const noCampo = editando && estado !== "exibindo";

    const topo = variante === "topo";

    // Slot de status: loading, erro ou sucesso.
    const status = (
        <span className="relative flex size-5 shrink-0 items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
                {noCampo && estado === "validando" && (
                    <motion.span key="validando" {...fade} className="flex">
                        <Spinner />
                    </motion.span>
                )}
                {noCampo && estado === "erro" && (
                    <motion.span key="erro" {...fade} className="flex">
                        <AlertCircle className="size-5 text-fg-error-secondary" aria-hidden="true" />
                    </motion.span>
                )}
                {!noCampo && sucesso && (
                    <motion.span key="sucesso" {...fade} className="flex">
                        <CheckCircle className="size-5 text-fg-success-secondary" aria-label="Cota atualizada" />
                    </motion.span>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {noCampo && erro && (
                    <motion.div
                        role="alert"
                        initial={{ opacity: 0, y: 4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="tooltip-cotas absolute bottom-full left-1/2 z-20 mb-2.5 flex w-max max-w-64 -translate-x-1/2 items-start gap-2 rounded-lg bg-primary-solid py-3 pr-2 pl-3 shadow-lg"
                    >
                        <span className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-white">{erro.titulo}</span>
                            <span className="text-xs font-normal text-tooltip-supporting-text">{erro.descricao}</span>
                        </span>
                        <button
                            type="button"
                            aria-label="Fechar"
                            // mousedown: não tira o foco do campo (senão o blur validaria de novo).
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setErro(null)}
                            className="flex rounded text-tooltip-supporting-text transition duration-100 ease-linear hover:text-white"
                        >
                            <XClose className="size-4" aria-hidden="true" />
                        </button>
                        <svg viewBox="0 0 100 100" className="absolute top-full left-1/2 size-2.5 -translate-x-1/2 fill-bg-primary-solid" aria-hidden="true">
                            <path d="M0,0 L35.858,35.858 Q50,50 64.142,35.858 L100,0 Z" />
                        </svg>
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );

    const conteudo = (
        <AnimatePresence mode="wait" initial={false}>
            {noCampo ? (
                <motion.div key="campo" {...fade} className={topo ? "w-[167px]" : "min-w-[167px] flex-1"}>
                    <Input
                        size="sm"
                        inputMode="numeric"
                        aria-label={`Cota de ${nome}`}
                        value={valor ? String(valor) : ""}
                        placeholder="0"
                        onChange={(v) => setValor(soNumero(v))}
                        onKeyDown={teclas}
                        onBlur={validar}
                        isReadOnly={estado === "validando"}
                        wrapperClassName={cx("bg-primary_alt", estado === "erro" && "ring-error_subtle")}
                        autoFocus
                    />
                </motion.div>
            ) : topo ? (
                <motion.div key="uso" {...fade} className="flex items-center gap-3">
                    {/* Barra com largura fixa: um número grande alarga o texto, nunca encolhe a barra. */}
                    <BarraUso usadas={uso} total={cota} className="w-60 shrink-0" />
                    <span className="flex items-center gap-1">
                        <span className="text-sm font-medium whitespace-nowrap text-secondary tabular-nums">
                            {uso} de {cota}
                        </span>
                        <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar cota" aria-label="Editar cota do grupo" onClick={abrir} />
                    </span>
                </motion.div>
            ) : (
                <motion.div key="uso" {...fade} className="flex flex-1 items-center gap-1">
                    <span className="flex min-w-[131px] flex-1 flex-col gap-2">
                        {/* Nunca quebra: o número de referência fica sempre numa linha. */}
                        <span className="text-sm font-medium whitespace-nowrap text-secondary tabular-nums">
                            {uso} de {cota} emissões
                        </span>
                        <BarraUso usadas={uso} total={cota} />
                    </span>
                    <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar cota" aria-label={`Editar cota de ${nome}`} onClick={abrir} />
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="flex items-center gap-2">
            {topo ? (
                <>
                    {conteudo}
                    {status}
                </>
            ) : (
                <>
                    {status}
                    {conteudo}
                </>
            )}
        </div>
    );
};

const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15, ease: "easeOut" },
} as const;

/** Spinner pequeno no padrão "line-simple" do DS (o LoadingIndicator começa em 32px). */
const Spinner = () => (
    <svg className="size-5 animate-spin" viewBox="0 0 32 32" fill="none" role="status" aria-label="Validando">
        <circle className="stroke-bg-tertiary" cx="16" cy="16" r="13" strokeWidth="4" />
        <circle className="stroke-fg-brand-primary" cx="16" cy="16" r="13" strokeWidth="4" strokeDasharray="82" strokeDashoffset="60" strokeLinecap="round" />
    </svg>
);
