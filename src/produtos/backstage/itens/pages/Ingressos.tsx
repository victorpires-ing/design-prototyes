import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Reorder, useDragControls, useReducedMotion } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import { Heading as AriaHeading } from "react-aria-components";
import { toast } from "sonner";
import { ChevronDown, Edit01, Plus, SearchLg, Ticket01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Toggle } from "@/components/base/toggle/toggle";
import { DURACAO_TRANSICAO, Surgir } from "@/components/foundations/transicao";
import type { Evento, Grupo, Sessao, TipoIngresso } from "@/plataforma";
import { loteAtual } from "@/plataforma";
import { cx } from "@/utils/cx";
import { AlertaDoGuia, BackstageLayout, PARAMETRO_NOVO_SETOR } from "../../components/Backstage";
import { CamposDeVendas, EstadoBadge, useResumoDasVendas } from "../components/comuns";
import { BotaoChaves } from "../components/VerChaves";
import { Alca, mover } from "../components/Alca";
import { AcoesEmLote, AvisoDeEscala, BarraDeFiltros, BotaoMostrarMais, CaixaDeSelecao, paraBusca, useMostrarMais, useSelecao } from "../components/escala";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import type { EstadoItem } from "../data/catalogo";
import type { RegrasDeVenda } from "@/plataforma";
import {
    comIngresso,
    comSetor,
    estadoComAbertura,
    janelaDoIngresso,
    faixaDePreco,
    ofertaDoSetor,
    quantidadeDoIngresso,
    salvarSessoes,
    semSetor,
    setorNovo,
    useCatalogo,
    pendentesDoIngresso,
    vendidosDoIngresso,
    vendidosDoSetor,
} from "../data/catalogo";
import { formatar, useTextosItens } from "../data/textos-itens";
import { AbasDeItens } from "../../components/abas-de-itens";

/* ------------------------------------------------------------------ */
/*  Ingressos (ITM-01 a ITM-19)                                        */
/*                                                                     */
/*  Setores como cartões (capacidade, acesso e a soma dos lotes        */
/*  conferida contra a capacidade); dentro de cada setor, os           */
/*  ingressos. A linha abre o ingresso, onde tudo se edita; o toggle   */
/*  da linha pausa ou volta a vender na hora.                          */
/* ------------------------------------------------------------------ */

const T = {
    titulo: "Ingressos",
    subtitulo: { one: "{n} ingresso em {setores}", other: "{n} ingressos em {setores}" },
    setores: { one: "{n} setor", other: "{n} setores" },
    novoSetor: "Novo setor",
    criarIngresso: "Criar ingresso",
    novoIngresso: "Novo ingresso no setor",
    editarSetor: "Editar setor {setor}",
    sessao: "Sessão de {data}",
    capacidade: "Capacidade de {n}",
    vendidosDoSetor: "{vendidos} de {oferta} vendidos",
    vendidosCurto: "{vendidos} de {total}",
    setorCriado: "Setor {setor} criado. Agora crie os ingressos dele.",
    setorRemovido: "Setor {setor} removido.",
    acimaDaCapacidade: "Os lotes somam {oferta}, acima da capacidade de {capacidade}. Ajuste os lotes ou a capacidade.",
    acessoComTipo: "Entrada: {acesso}, {tipo}",
    tipoAcesso: { qr: "com código QR", facial: "com reconhecimento facial" },
    tipoAcessoRotulo: "Como as pessoas entram",
    tipoAcessoDica: "Vale para todos os ingressos deste setor.",
    tipoAcessoOpcoes: { qr: "Código QR", facial: "Reconhecimento facial" },
    tipoAcessoErro: "Escolha como as pessoas entram neste setor.",
    loteAVenda: "{lote} à venda",
    semLoteAVenda: "Nenhum lote à venda",
    vender: "Vender {ingresso}",
    aVenda: "À venda",
    ordemSalva: "Ordem salva. A compra já mostra a nova ordem.",
    desfazer: "Desfazer",
    pausado: "{ingresso} pausado. Ele para de vender na hora.",
    voltou: "{ingresso} voltou a vender.",
    setorVazio: "Nenhum ingresso neste setor.",
    vazioTitulo: "Crie o primeiro ingresso",
    vazioDica: "Comece por um setor (Pista, Camarote) e os ingressos dele. Sem ingresso, o evento não tem o que vender.",
    buscar: "Buscar ingresso ou setor",
    todosEstados: "Todos os estados",
    todasSessoes: "Todas as sessões",
    todosSetores: "Todos os setores",
    nadaNoFiltro: "Nenhum ingresso encontrado",
    nadaNoFiltroDica: "Tente outro nome ou limpe os filtros.",
    limparFiltros: "Limpar filtros",
    abreEm: "Abre em {quando}",
    pausarTitulo: { one: "Pausar {n} ingresso?", other: "Pausar {n} ingressos?" },
    pausarDescricao: "Eles param de vender na hora, em todas as aberturas. Dá para desfazer logo depois.",
    pausarConfirmar: { one: "Pausar {n} ingresso", other: "Pausar {n} ingressos" },
    sessaoTitulo: { one: "Sessão de {data}, {n} ingresso", other: "Sessão de {data}, {n} ingressos" },
    pausar: "Pausar",
    retomar: "Voltar a vender",
    ajustarPreco: "Ajustar preço",
    aplicarRegras: "Aplicar regras de venda",
    pausadosLote: { one: "{n} ingresso pausado.", other: "{n} ingressos pausados." },
    retomadosLote: { one: "{n} ingresso voltou a vender.", other: "{n} ingressos voltaram a vender." },
    precoAjustado: { one: "Preço de {n} ingresso ajustado.", other: "Preço de {n} ingressos ajustado." },
    regrasAplicadas: { one: "Regras de venda aplicadas a {n} ingresso.", other: "Regras de venda aplicadas a {n} ingressos." },
};


/** Estados que a lista pode mostrar, na ordem do filtro (ITM-10, ITM-12). */
const ESTADOS: EstadoItem[] = ["a-venda", "agendado", "sem-abertura", "encerrado", "pausado", "esgotado", "sem-estoque"];

export function Ingressos() {
    const navigate = useNavigate();
    const { carregando, evento, vendidos } = useCatalogo();
    const { t, plural, quando, dataLonga } = useTextosItens();
    const [modalSetor, setModalSetor] = useState<{ sessaoId: string; setor?: Grupo } | null>(null);
    const [busca, setBusca] = useState("");
    const [estado, setEstado] = useState("todos");
    const [sessaoId, setSessaoId] = useState("todos");
    const [setorNome, setSetorNome] = useState("todos");
    const [modalLote, setModalLote] = useState<"preco" | "regras" | "pausar" | null>(null);
    // Cópia local para arrastar sem esperar o banco; grava ao soltar (ITM-08).
    const [local, setLocal] = useState<Sessao[]>([]);
    const localRef = useRef<Sessao[]>([]);
    localRef.current = local;
    useEffect(() => setLocal(evento?.sessoes ?? []), [evento?.sessoes]);
    const selecao = useSelecao();

    const sessoes = local.length || !evento ? local : evento.sessoes;
    const setores = sessoes.flatMap((s) => s.grupos);
    const todosIngressos = setores.flatMap((g) => g.ingressos);
    const totalIngressos = todosIngressos.length;
    const nomesDeSetor = [...new Set(setores.map((g) => g.nome))];

    // "Criar" no passo de setores do guia de configuração chega com ?novoSetor=1 e abre o modal (GDC-11).
    const [parametros, setParametros] = useSearchParams();
    useEffect(() => {
        if (carregando || !parametros.has(PARAMETRO_NOVO_SETOR) || !sessoes.length) return;
        setModalSetor({ sessaoId: sessoes[0].id });
        setParametros((p) => {
            p.delete(PARAMETRO_NOVO_SETOR);
            return p;
        }, { replace: true });
    }, [carregando, parametros, sessoes.length]);

    // Filtro aplicado à árvore sessão > setor > ingressos (UI-LST-001).
    const termo = paraBusca(busca.trim());
    const filtrando = !!termo || estado !== "todos" || sessaoId !== "todos" || setorNome !== "todos";
    const arvore = useMemo(
        () =>
            sessoes
                .filter((s) => sessaoId === "todos" || s.id === sessaoId)
                .map((s) => ({
                    sessao: s,
                    setores: s.grupos
                        .filter((g) => setorNome === "todos" || g.nome === setorNome)
                        .map((g) => ({
                            setor: g,
                            ingressos: g.ingressos.filter(
                                (tp) => (!termo || paraBusca(`${tp.nome} ${g.nome}`).includes(termo)) && (estado === "todos" || estadoComAbertura(tp, vendidos, evento?.aberturas) === estado),
                            ),
                        }))
                        .filter((x) => !filtrando || x.ingressos.length > 0),
                }))
                .filter((x) => !filtrando || x.setores.length > 0),
        [sessoes, sessaoId, setorNome, termo, estado, vendidos, filtrando, evento?.aberturas],
    );
    const filtrados = arvore.flatMap((a) => a.setores.flatMap((x) => x.ingressos));
    const comSelecao = totalIngressos > 1;

    /** Grava a ordem atual (a ordem do fluxo de compra), com "Desfazer". */
    const salvarOrdem = async (prox: Sessao[]) => {
        if (!evento) return;
        const antes = evento.sessoes;
        if (JSON.stringify(prox.map((s) => s.grupos.map((g) => [g.id, g.ingressos.map((i) => i.id)]))) === JSON.stringify(antes.map((s) => s.grupos.map((g) => [g.id, g.ingressos.map((i) => i.id)])))) return;
        try {
            await salvarSessoes(evento, prox);
            toast.success(T.ordemSalva, { action: { label: T.desfazer, onClick: () => salvarSessoes(evento, antes) } });
        } catch {
            toast.error(t.erroAoSalvar);
            setLocal(antes);
        }
    };
    const reordenarSetores = (sessaoId: string, grupos: Grupo[]) => setLocal((l) => l.map((s) => (s.id === sessaoId ? { ...s, grupos } : s)));
    const reordenarIngressos = (setorId: string, ingressos: TipoIngresso[]) =>
        setLocal((l) => l.map((s) => ({ ...s, grupos: s.grupos.map((g) => (g.id === setorId ? { ...g, ingressos } : g)) })));
    /** Teclado: move um passo e grava na hora. */
    const moverSetorPorTeclado = (sessaoId: string, i: number, delta: -1 | 1) => {
        const prox = localRef.current.map((s) => (s.id === sessaoId ? { ...s, grupos: mover(s.grupos, i, i + delta) } : s));
        setLocal(prox);
        salvarOrdem(prox);
    };
    const moverIngressoPorTeclado = (setorId: string, i: number, delta: -1 | 1) => {
        const prox = localRef.current.map((s) => ({ ...s, grupos: s.grupos.map((g) => (g.id === setorId ? { ...g, ingressos: mover(g.ingressos, i, i + delta) } : g)) }));
        setLocal(prox);
        salvarOrdem(prox);
    };
    // Arrastar só sem filtro: com a lista filtrada, a posição de cada item fica ambígua.
    const podeArrastar = !filtrando;
    const chaveFiltro = `${termo}|${estado}|${sessaoId}|${setorNome}`;
    useEffect(() => selecao.limpar(), [chaveFiltro]);

    const limparFiltros = () => {
        setBusca("");
        setEstado("todos");
        setSessaoId("todos");
        setSetorNome("todos");
    };

    /** Aplica uma mudança a todos os ingressos selecionados, numa gravação só. */
    const emLote = async (fn: (tp: TipoIngresso) => TipoIngresso, mensagem: { one: string; other: string }) => {
        if (!evento) return;
        const n = selecao.tamanho;
        const antes = evento.sessoes;
        const prox = evento.sessoes.map((s) => ({ ...s, grupos: s.grupos.map((g) => ({ ...g, ingressos: g.ingressos.map((tp) => (selecao.tem(tp.id) ? fn(tp) : tp)) })) }));
        try {
            await salvarSessoes(evento, prox);
            // Toda ação em lote pode voltar atrás: com milhares de ingressos, um clique errado custa caro (ITM-82).
            toast.success(plural(mensagem, n), { action: { label: T.desfazer, onClick: () => salvarSessoes(evento, antes) } });
            selecao.limpar();
            setModalLote(null);
        } catch {
            toast.error(t.erroAoSalvar);
        }
    };

    const selecionados = todosIngressos.filter((tp) => selecao.tem(tp.id));

    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-ingressos">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <AbasDeItens ativa="ingressos" />
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="sr-only">{T.titulo}</h2>
                        {carregando ? (
                            <span aria-hidden="true" className="h-4 w-48 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
                        ) : (
                            <p className="text-md text-tertiary">{plural(T.subtitulo, totalIngressos, { setores: plural(T.setores, setores.length) })}</p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {/* Ingresso nasce dentro de um setor ("Novo ingresso no setor"), então o topo só cria setor (ITM-68). */}
                        <Button color="primary" size="md" iconLeading={Plus} isDisabled={carregando || !sessoes.length} onClick={() => setModalSetor({ sessaoId: sessoes[0]?.id ?? "" })}>
                            {T.novoSetor}
                        </Button>
                    </div>
                </header>

                <AlertaDoGuia eventoId={evento?.id} />

                <AvisoDeEscala />

                {!carregando && (
                    <BarraDeFiltros
                        total={totalIngressos}
                        visiveis={filtrados.length}
                        busca={busca}
                        onBusca={setBusca}
                        placeholder={T.buscar}
                        onLimpar={limparFiltros}
                        filtros={[
                            { id: "estado", rotulo: "Estado", valor: estado, onChange: setEstado, opcoes: [{ id: "todos", label: T.todosEstados }, ...ESTADOS.map((e) => ({ id: e, label: t.estado[e] }))] },
                            ...(sessoes.length > 1
                                ? [{ id: "sessao", rotulo: "Sessão", valor: sessaoId, onChange: setSessaoId, opcoes: [{ id: "todos", label: T.todasSessoes }, ...sessoes.map((s) => ({ id: s.id, label: quando(s.inicio) }))] }]
                                : []),
                            ...(nomesDeSetor.length > 1
                                ? [{ id: "setor", rotulo: "Setor", valor: setorNome, onChange: setSetorNome, opcoes: [{ id: "todos", label: T.todosSetores }, ...nomesDeSetor.map((n) => ({ id: n, label: n }))] }]
                                : []),
                        ]}
                    />
                )}

                {carregando ? (
                    <Esqueleto />
                ) : totalIngressos === 0 && setores.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                        <EmptyState size="sm">
                            <EmptyState.Header>
                                <EmptyState.FeaturedIcon icon={Ticket01} color="gray" theme="modern" />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <EmptyState.Title>{T.vazioTitulo}</EmptyState.Title>
                                <EmptyState.Description>{T.vazioDica}</EmptyState.Description>
                            </EmptyState.Content>
                            <EmptyState.Footer>
                                <Button color="primary" size="md" iconLeading={Plus} onClick={() => setModalSetor({ sessaoId: sessoes[0]?.id ?? "" })}>
                                    {T.novoSetor}
                                </Button>
                            </EmptyState.Footer>
                        </EmptyState>
                    </div>
                ) : filtrando && filtrados.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                        <EmptyState size="sm">
                            <EmptyState.Header>
                                <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <EmptyState.Title>{T.nadaNoFiltro}</EmptyState.Title>
                                <EmptyState.Description>{T.nadaNoFiltroDica}</EmptyState.Description>
                            </EmptyState.Content>
                            <EmptyState.Footer>
                                <Button color="secondary" size="md" onClick={limparFiltros}>
                                    {T.limparFiltros}
                                </Button>
                            </EmptyState.Footer>
                        </EmptyState>
                    </div>
                ) : (
                    arvore.map(({ sessao, setores: setoresDaSessao }, idx) => {
                        const cartao = (setor: Grupo, ingressos: TipoIngresso[], alca?: ReactNode) => (
                            <CartaoDoSetor
                                evento={evento!}
                                setor={setor}
                                ingressos={ingressos}
                                selecao={comSelecao ? selecao : null}
                                alca={alca}
                                arrastavel={podeArrastar}
                                onReordenar={(lista) => reordenarIngressos(setor.id, lista)}
                                onSoltar={() => salvarOrdem(localRef.current)}
                                onMoverPorTeclado={(i, d) => moverIngressoPorTeclado(setor.id, i, d)}
                                onEditar={() => setModalSetor({ sessaoId: sessao.id, setor })}
                                onNovoIngresso={() => navigate(`/backstage/catalogo/ingressos/novo?setor=${setor.id}`)}
                            />
                        );
                        // A ordem dos setores e dos ingressos é a ordem do fluxo de compra: alça no hover (ITM-08).
                        const conteudo = podeArrastar ? (
                            <Reorder.Group as="div" axis="y" values={sessao.grupos} onReorder={(grupos: Grupo[]) => reordenarSetores(sessao.id, grupos)} className="flex flex-col gap-4">
                                {sessao.grupos.map((setor, i) => (
                                    <SetorArrastavel
                                        key={setor.id}
                                        setor={setor}
                                        onSoltar={() => salvarOrdem(localRef.current)}
                                        render={(alca) => cartao(setor, setor.ingressos, alca)}
                                        onMoverPorTeclado={(d) => moverSetorPorTeclado(sessao.id, i, d)}
                                    />
                                ))}
                            </Reorder.Group>
                        ) : (
                            setoresDaSessao.map(({ setor, ingressos }) => <div key={`${setor.id}-${chaveFiltro}`}>{cartao(setor, ingressos)}</div>)
                        );
                        // Com uma sessão só, o título da sessão não agrega: some (UI-VIS-014).
                        if (arvore.length === 1 && sessoes.length === 1) {
                            return (
                                <div key={sessao.id} className="flex flex-col gap-4">
                                    {conteudo}
                                </div>
                            );
                        }
                        const n = setoresDaSessao.reduce((s, x) => s + x.ingressos.length, 0);
                        return (
                            <SessaoRecolhivel key={`${sessao.id}-${chaveFiltro}`} titulo={plural(T.sessaoTitulo, n, { data: dataLonga(sessao.inicio) })} abertaInicial={idx < 2 || arvore.length <= 3}>
                                {conteudo}
                            </SessaoRecolhivel>
                        );
                    })
                )}

                {comSelecao && (
                    <AcoesEmLote selecionados={selecao.tamanho} totalDoFiltro={filtrados.length} onSelecionarTodos={() => selecao.definir(filtrados.map((x) => x.id))} onLimpar={selecao.limpar}>
                        <Button color="secondary" size="sm" onClick={() => setModalLote("pausar")}>
                            {T.pausar}
                        </Button>
                        <Button color="secondary" size="sm" onClick={() => emLote((tp) => ({ ...tp, ativo: true }), T.retomadosLote)}>
                            {T.retomar}
                        </Button>
                        <Button color="secondary" size="sm" onClick={() => setModalLote("preco")}>
                            {T.ajustarPreco}
                        </Button>
                        <Button color="primary" size="sm" onClick={() => setModalLote("regras")}>
                            {T.aplicarRegras}
                        </Button>
                    </AcoesEmLote>
                )}
            </div>

            {evento && modalSetor && <ModalSetor evento={evento} sessaoId={modalSetor.sessaoId} setor={modalSetor.setor} onFechar={() => setModalSetor(null)} />}
            {modalLote === "preco" && (
                <ModalAjustarPreco
                    selecionados={selecionados}
                    vendidos={vendidos}
                    onFechar={() => setModalLote(null)}
                    onAplicar={(fn) => emLote(fn, T.precoAjustado)}
                />
            )}
            {modalLote === "pausar" && <ModalPausarEmLote quantidade={selecao.tamanho} onFechar={() => setModalLote(null)} onPausar={() => emLote((tp) => ({ ...tp, ativo: false }), T.pausadosLote)} />}
            {modalLote === "regras" && <ModalRegrasEmLote quantidade={selecao.tamanho} onFechar={() => setModalLote(null)} onAplicar={(vendas) => emLote((tp) => ({ ...tp, vendas }), T.regrasAplicadas)} />}
        </BackstageLayout>
    );
}


/** Sessão recolhível: com dezenas de sessões, só as primeiras abrem (UI-LST-001). */
function SessaoRecolhivel({ titulo, abertaInicial, children }: { titulo: string; abertaInicial: boolean; children: ReactNode }) {
    const [aberta, setAberta] = useState(abertaInicial);
    return (
        <section className="flex flex-col gap-4">
            <h2>
                <button
                    type="button"
                    aria-expanded={aberta}
                    onClick={() => setAberta((a) => !a)}
                    className="flex w-full items-center gap-2 rounded-lg text-left text-lg font-semibold text-primary outline-focus-ring focus-visible:outline-2"
                >
                    <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-200 motion-reduce:transition-none", !aberta && "-rotate-90")} aria-hidden="true" />
                    {titulo}
                </button>
            </h2>
            <Surgir visivel={aberta}>
                <div className="flex flex-col gap-4">{children}</div>
            </Surgir>
        </section>
    );
}


/** Setor dentro da lista arrastável: cria os controles de arrastar e entrega a alça ao cartão. */
function SetorArrastavel({ setor, render, onSoltar, onMoverPorTeclado }: { setor: Grupo; render: (alca: ReactNode) => ReactNode; onSoltar: () => void; onMoverPorTeclado: (d: -1 | 1) => void }) {
    const controles = useDragControls();
    const reduzir = useReducedMotion();
    return (
        <Reorder.Item as="div" value={setor} dragListener={false} dragControls={controles} onDragEnd={onSoltar} transition={{ duration: reduzir ? 0 : DURACAO_TRANSICAO }} className="group/setor">
            {render(<Alca grupo="setor" nome={setor.nome} onPointerDown={(e) => controles.start(e)} onMover={onMoverPorTeclado} />)}
        </Reorder.Item>
    );
}

function IngressoArrastavel({ tipo, children, onSoltar, onMoverPorTeclado }: { tipo: TipoIngresso; children: (alca: ReactNode) => ReactNode; onSoltar: () => void; onMoverPorTeclado: (d: -1 | 1) => void }) {
    const controles = useDragControls();
    const reduzir = useReducedMotion();
    return (
        <Reorder.Item value={tipo} dragListener={false} dragControls={controles} onDragEnd={onSoltar} transition={{ duration: reduzir ? 0 : DURACAO_TRANSICAO }} className="group/linha border-b border-secondary bg-primary last:border-b-0">
            {children(<Alca grupo="linha" nome={tipo.nome} onPointerDown={(e) => controles.start(e)} onMover={onMoverPorTeclado} />)}
        </Reorder.Item>
    );
}

function CartaoDoSetor({
    evento,
    setor,
    ingressos,
    selecao,
    alca,
    arrastavel,
    onReordenar,
    onSoltar,
    onMoverPorTeclado,
    onEditar,
    onNovoIngresso,
}: {
    evento: Evento;
    setor: Grupo;
    ingressos: TipoIngresso[];
    selecao: ReturnType<typeof useSelecao> | null;
    alca?: ReactNode;
    arrastavel: boolean;
    onReordenar: (lista: TipoIngresso[]) => void;
    onSoltar: () => void;
    onMoverPorTeclado: (i: number, d: -1 | 1) => void;
    onEditar: () => void;
    onNovoIngresso: () => void;
}) {
    const { vendidos, pendentes } = useCatalogo();
    const { numero } = useTextosItens();
    const oferta = ofertaDoSetor(setor);
    const acima = setor.capacidade != null && oferta > setor.capacidade;
    // Setor com dezenas de ingressos mostra os primeiros e "Mostrar mais" (UI-LST-001).
    const { visiveis, restantes, mostrarMais } = useMostrarMais(ingressos);

    return (
        <article aria-labelledby={`setor-${setor.id}`} className={cx("flex flex-col rounded-2xl bg-primary ring-1 ring-secondary", acima && "ring-2 ring-fg-warning-secondary")}>
            <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4 md:px-6">
                <div className="flex min-w-0 items-start gap-2">
                {alca && <div className="-ml-3 md:-ml-4">{alca}</div>}
                <div className="flex min-w-0 flex-col gap-1">
                    <h3 id={`setor-${setor.id}`} className="text-lg font-semibold text-primary">
                        {setor.nome}
                    </h3>
                    {/* Dados do setor em linhas próprias, sem símbolo separador (UI-TXT-010). */}
                    <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-tertiary">
                        <div>
                            <dt className="sr-only">Vendidos</dt>
                            <dd>{formatar(T.vendidosDoSetor, { vendidos: numero(vendidosDoSetor(setor, vendidos) - setor.ingressos.reduce((n, t) => n + pendentesDoIngresso(t, pendentes), 0)), oferta: numero(oferta) })}</dd>
                        </div>
                        <div>
                            <dt className="sr-only">Capacidade</dt>
                            <dd>{formatar(T.capacidade, { n: numero(setor.capacidade ?? oferta) })}</dd>
                        </div>
                        {/* Tipo de acesso é obrigatório no setor (ITM-04): sempre há o que mostrar. */}
                        <div>
                            <dt className="sr-only">Acesso</dt>
                            <dd>
                                {setor.acesso
                                    ? formatar(T.acessoComTipo, { acesso: setor.acesso, tipo: T.tipoAcesso[setor.tipoAcesso ?? "qr"] })
                                    : T.tipoAcessoOpcoes[setor.tipoAcesso ?? "qr"]}
                            </dd>
                        </div>
                    </dl>
                </div>
                </div>
                <ButtonUtility icon={Edit01} color="tertiary" tooltip={formatar(T.editarSetor, { setor: setor.nome })} onClick={onEditar} />
            </header>

            {/* Estoque conferido contra a capacidade (ITM-05). */}
            <Surgir visivel={acima}>
                <p role="status" className="mx-5 mb-4 rounded-lg bg-warning-primary px-3 py-2 text-sm text-warning-primary md:mx-6">
                    {formatar(T.acimaDaCapacidade, { oferta: numero(oferta), capacidade: numero(setor.capacidade ?? 0) })}
                </p>
            </Surgir>

            {arrastavel && visiveis.length > 1 ? (
                <Reorder.Group as="ul" axis="y" values={visiveis} onReorder={(prox: TipoIngresso[]) => onReordenar([...prox, ...ingressos.slice(prox.length)])} className="flex flex-col border-t border-secondary">
                    {visiveis.map((tp, i) => (
                        <IngressoArrastavel key={tp.id} tipo={tp} onSoltar={onSoltar} onMoverPorTeclado={(d) => onMoverPorTeclado(i, d)}>
                            {(a) => <LinhaDoIngresso evento={evento} tipo={tp} selecao={selecao} alca={a} />}
                        </IngressoArrastavel>
                    ))}
                </Reorder.Group>
            ) : (
                <ul className="flex flex-col border-t border-secondary">
                    {visiveis.map((tp) => (
                        <li key={tp.id} className="border-b border-secondary last:border-b-0">
                            {/* Sem alça (um ingresso só), o espaço dela fica: a caixa e o nome alinham com os outros setores. */}
                            <LinhaDoIngresso evento={evento} tipo={tp} selecao={selecao} alca={arrastavel ? <span aria-hidden="true" className="block size-8 shrink-0" /> : undefined} />
                        </li>
                    ))}
                    {ingressos.length === 0 && <li className="px-5 py-4 text-sm text-tertiary md:px-6">{T.setorVazio}</li>}
                </ul>
            )}

            {restantes > 0 && (
                <div className="border-t border-secondary px-5 py-3 md:px-6">
                    <BotaoMostrarMais restantes={restantes} onClick={mostrarMais} />
                </div>
            )}
            <div className="border-t border-secondary px-3 py-2 md:px-4">
                <Button color="tertiary" size="sm" iconLeading={Plus} onClick={onNovoIngresso}>
                    {T.novoIngresso}
                </Button>
            </div>
        </article>
    );
}

function LinhaDoIngresso({ evento, tipo, selecao, alca }: { evento: Evento; tipo: TipoIngresso; selecao: ReturnType<typeof useSelecao> | null; alca?: ReactNode }) {
    const navigate = useNavigate();
    const { vendidos, pendentes } = useCatalogo();
    const { t, preco, numero, quando } = useTextosItens();
    const resumoVendas = useResumoDasVendas();
    const estado = estadoComAbertura(tipo, vendidos, evento.aberturas);
    const janela = estado === "agendado" ? janelaDoIngresso(tipo.id, evento.aberturas) : null;
    const faixa = faixaDePreco(tipo);
    const atual = loteAtual(tipo, vendidos);

    const alternar = async (ativo: boolean) => {
        const antes = evento.sessoes;
        try {
            await salvarSessoes(evento, comIngresso(evento, { ...tipo, ativo }));
            // Mesmo comportamento do toggle do detalhe: grava na hora e dá para desfazer (ITM-03, ITM-32).
            toast.success(formatar(ativo ? T.voltou : T.pausado, { ingresso: tipo.nome }), { action: { label: T.desfazer, onClick: () => salvarSessoes(evento, antes) } });
        } catch {
            toast.error(t.erroAoSalvar);
        }
    };

    return (
        <div className="relative flex items-start gap-3 px-5 py-4 transition duration-100 ease-linear outline-focus-ring hover:bg-primary_hover has-[[data-linha]:focus-visible]:outline-2 has-[[data-linha]:focus-visible]:-outline-offset-2 md:items-center md:px-6">
            {alca && <div className="-mt-1 -ml-3 flex items-center md:mt-0 md:-ml-4">{alca}</div>}
            {selecao && (
                <div className="mt-1 md:mt-0">
                    <CaixaDeSelecao rotulo={tipo.nome} marcado={selecao.tem(tipo.id)} onChange={(on) => selecao.alternar(tipo.id, on)} />
                </div>
            )}
            {/* Nome e dados numa coluna só: no celular os dados descem alinhados ao nome, não à borda da linha. */}
            <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-6">
                {/* O botão do nome cobre a linha (after:inset-0); toggle e chaves ficam por cima (z-10) sem abrir o item. */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <button
                        type="button"
                        data-linha
                        onClick={() => navigate(`/backstage/catalogo/ingressos/${tipo.id}`)}
                        className="flex flex-wrap items-center gap-2 text-left outline-hidden after:absolute after:inset-0"
                    >
                        <span className="text-md font-semibold text-primary">{tipo.nome}</span>
                        {/* Badge só quando foge do normal: À venda e Pausado o toggle já diz (ITM-10). */}
                        {estado !== "a-venda" && estado !== "pausado" && <EstadoBadge estado={estado} />}
                    </button>
                    <span className="text-sm text-tertiary">{atual ? formatar(T.loteAVenda, { lote: atual.nome }) : T.semLoteAVenda}</span>
                    {janela?.janela === "agendado" && <span className="text-sm text-tertiary">{formatar(T.abreEm, { quando: quando(janela.inicio) })}</span>}
                    {resumoVendas(tipo.vendas) && <span className="truncate text-sm text-tertiary">{resumoVendas(tipo.vendas)}</span>}
                    <BotaoChaves tipo={tipo} onEditar={() => navigate(`/backstage/catalogo/ingressos/${tipo.id}`)} />
                </div>
                <div className="flex items-center justify-between gap-6 md:justify-end">
                    <dl className="flex gap-6 text-sm">
                        <div className="flex flex-col md:items-end">
                            <dt className="text-tertiary">Preço</dt>
                            <dd className="font-medium text-primary tabular-nums">{faixa.min === faixa.max ? preco(faixa.min) : formatar(t.precoFaixa, { min: preco(faixa.min), max: preco(faixa.max) })}</dd>
                        </div>
                        <div className="flex flex-col md:items-end">
                            <dt className="text-tertiary">Vendidos</dt>
                            <dd className="font-medium text-primary tabular-nums">
                                {formatar(T.vendidosCurto, { vendidos: numero(vendidosDoIngresso(tipo, vendidos) - pendentesDoIngresso(tipo, pendentes)), total: numero(quantidadeDoIngresso(tipo)) })}
                            </dd>
                        </div>
                    </dl>
                    {/* Rótulo visível acima do toggle, como Preço e Vendidos ao lado (UI-FRM-005). */}
                    <div className="relative z-10 flex flex-col gap-1 text-sm md:items-end">
                        <span className="text-tertiary" aria-hidden="true">
                            {T.aVenda}
                        </span>
                        {/* Área de toque de 44 px em volta do toggle (WCAG 2.5.8), sem mudar o desenho. */}
                        <Toggle aria-label={formatar(T.vender, { ingresso: tipo.nome })} isSelected={tipo.ativo} onChange={alternar} className="relative before:absolute before:-inset-x-3 before:-inset-y-3 before:content-['']" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Criar ou editar setor: nome único na sessão, acesso e capacidade. Remover só sem ingressos. */
function ModalSetor({ evento, sessaoId: sessaoInicial, setor, onFechar }: { evento: Evento; sessaoId: string; setor?: Grupo; onFechar: () => void }) {
    const { t, dataLonga } = useTextosItens();
    const [sessaoId, setSessaoId] = useState(sessaoInicial);
    const [nome, setNome] = useState(setor?.nome ?? "");
    const [acesso, setAcesso] = useState(setor?.acesso ?? "");
    const [capacidade, setCapacidade] = useState(setor?.capacidade != null ? String(setor.capacidade) : "");
    const [tipoAcesso, setTipoAcesso] = useState<Grupo["tipoAcesso"]>(setor?.tipoAcesso);
    const [tentou, setTentou] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const sessao = evento.sessoes.find((s) => s.id === sessaoId);
    const repetido = !!sessao?.grupos.some((g) => g.id !== setor?.id && g.nome.trim().toLowerCase() === nome.trim().toLowerCase());
    const erroNome = !nome.trim() ? "Dê um nome ao setor." : repetido ? "Escolha outro nome: já existe um setor com esse nome nesta sessão." : undefined;
    // Capacidade é obrigatória (ITM-04): número inteiro maior que zero.
    const capacidadeNum = Math.round(Number(capacidade));
    const erroCapacidade = !capacidade.trim() || !(capacidadeNum > 0) ? "Informe a lotação do setor." : undefined;

    const salvar = async () => {
        setTentou(true);
        if (erroNome || erroCapacidade || !tipoAcesso) return;
        setSalvando(true);
        const base = setor ?? setorNovo(nome);
        const prox: Grupo = { ...base, nome: nome.trim(), tipoAcesso, acesso: acesso.trim() || undefined, capacidade: capacidadeNum };
        try {
            await salvarSessoes(evento, comSetor(evento, sessaoId, prox));
            toast.success(setor ? t.salvo : formatar(T.setorCriado, { setor: prox.nome }));
            onFechar();
        } catch {
            toast.error(t.erroAoSalvar);
            setSalvando(false);
        }
    };

    const remover = async () => {
        if (!setor) return;
        try {
            const antes = evento.sessoes;
            await salvarSessoes(evento, semSetor(evento, setor.id));
            toast.success(formatar(T.setorRemovido, { setor: setor.nome }), { action: { label: T.desfazer, onClick: () => salvarSessoes(evento, antes) } });
            onFechar();
        } catch {
            toast.error(t.erroAoSalvar);
        }
    };

    return (
        <ModalOverlay isOpen onOpenChange={(v) => !v && onFechar()} isDismissable>
            <Modal className="sm:max-w-[480px]">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-1">
                            <AriaHeading slot="title" className="text-lg font-semibold text-primary">{setor ? "Editar setor" : "Novo setor"}</AriaHeading>
                            <p className="text-sm text-tertiary">Setor é a área do evento com entrada e lotação próprias, como Pista ou Camarote.</p>
                        </div>
                        {evento.sessoes.length > 1 && !setor && (
                            <Select label="Sessão" selectedKey={sessaoId} onSelectionChange={(k) => k && setSessaoId(String(k))} items={evento.sessoes.map((s) => ({ id: s.id, label: dataLonga(s.inicio) }))}>
                                {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
                            </Select>
                        )}
                        <Input label="Nome do setor" isRequired value={nome} onChange={setNome} placeholder="Ex.: Pista" isInvalid={tentou && !!erroNome} hint={tentou ? erroNome : undefined} />
                        {/* Obrigatório: o tipo de acesso define como a portaria valida os ingressos do setor. */}
                        <div className="flex flex-col gap-2">
                            <RadioGroup aria-label={T.tipoAcessoRotulo} value={tipoAcesso ?? null} onChange={(v) => setTipoAcesso(v as Grupo["tipoAcesso"])}>
                                <span className="text-sm font-medium text-secondary">
                                    {T.tipoAcessoRotulo}
                                    <span className="text-brand-tertiary"> *</span>
                                </span>
                                <RadioButton value="qr" label={T.tipoAcessoOpcoes.qr} />
                                <RadioButton value="facial" label={T.tipoAcessoOpcoes.facial} />
                            </RadioGroup>
                            <span className={cx("text-sm", tentou && !tipoAcesso ? "text-error-primary" : "text-tertiary")}>{tentou && !tipoAcesso ? T.tipoAcessoErro : T.tipoAcessoDica}</span>
                        </div>
                        <Input label="Acesso na portaria" value={acesso} onChange={setAcesso} placeholder="Ex.: Portão A" hint="Aparece no ingresso. Opcional." />
                        <Input
                            label="Capacidade"
                            type="number"
                            inputMode="numeric"
                            isRequired
                            value={capacidade}
                            onChange={setCapacidade}
                            placeholder="Ex.: 1200"
                            isInvalid={tentou && !!erroCapacidade}
                            hint={tentou && erroCapacidade ? erroCapacidade : "Lotação do setor. A soma dos lotes é conferida contra ela."}
                        />
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {setor ? (
                                setor.ingressos.length === 0 ? (
                                    <Button color="tertiary-destructive" size="md" onClick={remover}>
                                        Remover setor
                                    </Button>
                                ) : (
                                    <span className="text-sm text-tertiary">Para remover o setor, remova antes os ingressos dele.</span>
                                )
                            ) : (
                                <span />
                            )}
                            <div className="flex flex-col-reverse gap-3 sm:flex-row">
                                <Button color="secondary" size="md" onClick={onFechar}>
                                    Cancelar
                                </Button>
                                <Button color="primary" size="md" onClick={salvar} isLoading={salvando}>
                                    {setor ? "Salvar setor" : "Criar setor"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

function Esqueleto() {
    return (
        <div role="status" aria-label="Carregando ingressos" className="flex flex-col gap-4">
            {[0, 1].map((i) => (
                <div key={i} aria-hidden="true" className="flex flex-col gap-3 rounded-2xl bg-primary p-6 ring-1 ring-secondary">
                    <span className="h-5 w-32 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
                    <span className="h-4 w-64 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
                    <span className="mt-2 h-14 w-full animate-pulse rounded-lg bg-secondary motion-reduce:animate-none" />
                    <span className="h-14 w-full animate-pulse rounded-lg bg-secondary motion-reduce:animate-none" />
                </div>
            ))}
        </div>
    );
}

/* ---------------- ações em lote ---------------- */

type ModoPreco = "percentual" | "valor";

/**
 * Ajusta o preço do lote à venda de cada ingresso selecionado (ou de todos os lotes), em % ou em
 * reais, com prévia de antes e depois antes de confirmar.
 */
function ModalAjustarPreco({
    selecionados,
    vendidos,
    onFechar,
    onAplicar,
}: {
    selecionados: TipoIngresso[];
    vendidos: Map<string, number>;
    onFechar: () => void;
    onAplicar: (fn: (tp: TipoIngresso) => TipoIngresso) => void;
}) {
    const { preco, plural } = useTextosItens();
    const [modo, setModo] = useState<ModoPreco>("percentual");
    const [direcao, setDirecao] = useState<"aumentar" | "diminuir">("aumentar");
    const [quanto, setQuanto] = useState("");
    const [alvo, setAlvo] = useState<"atual" | "todos">("atual");
    const n = Number(quanto.replace(",", ".")) || 0;
    const ajustar = (v: number) => {
        const delta = modo === "percentual" ? (v * n) / 100 : n;
        return Math.max(0, Math.round((direcao === "aumentar" ? v + delta : v - delta) * 100) / 100);
    };
    const aplicar = (tp: TipoIngresso): TipoIngresso => {
        const atual = loteAtual(tp, vendidos);
        return { ...tp, lotes: tp.lotes.map((l) => (alvo === "todos" || l.id === atual?.id ? { ...l, preco: ajustar(l.preco) } : l)) };
    };
    const exemplos = selecionados.slice(0, 3).map((tp) => {
        const l = loteAtual(tp, vendidos) ?? tp.lotes[0];
        return l ? { nome: tp.nome, antes: preco(l.preco), depois: preco(ajustar(l.preco)) } : null;
    });

    return (
        <ModalOverlay isOpen onOpenChange={(v) => !v && onFechar()} isDismissable>
            <Modal className="sm:max-w-[480px]">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-1">
                            <AriaHeading slot="title" className="text-lg font-semibold text-primary">{plural({ one: "Ajustar preço de {n} ingresso", other: "Ajustar preço de {n} ingressos" }, selecionados.length)}</AriaHeading>
                            <p className="text-sm text-tertiary">As mudanças valem para as próximas vendas.</p>
                        </div>
                        <RadioGroup aria-label="Direção" value={direcao} onChange={(v) => setDirecao(v as "aumentar" | "diminuir")}>
                            <RadioButton value="aumentar" label="Aumentar" />
                            <RadioButton value="diminuir" label="Diminuir" />
                        </RadioGroup>
                        <div className="grid grid-cols-2 gap-3">
                            <Select label="Como ajustar" selectedKey={modo} onSelectionChange={(k) => k && setModo(k as ModoPreco)} items={[{ id: "percentual", label: "Em porcentagem" }, { id: "valor", label: "Em reais" }]}>
                                {(i) => <Select.Item id={i.id}>{i.label}</Select.Item>}
                            </Select>
                            <Input label={modo === "percentual" ? "Porcentagem" : "Valor em reais"} inputMode="decimal" value={quanto} onChange={setQuanto} placeholder={modo === "percentual" ? "Ex.: 10" : "Ex.: 20"} />
                        </div>
                        <RadioGroup aria-label="Quais lotes" value={alvo} onChange={(v) => setAlvo(v as "atual" | "todos")}>
                            <RadioButton value="atual" label="Só o lote à venda de cada ingresso" />
                            <RadioButton value="todos" label="Todos os lotes" />
                        </RadioGroup>
                        <div className="flex flex-col gap-1 rounded-lg bg-secondary px-4 py-3 text-sm" role="status">
                            <span className="font-medium text-primary">Prévia</span>
                            {exemplos.map(
                                (e, i) =>
                                    e && (
                                        <span key={i} className="text-tertiary">
                                            {formatar("{nome}: de {antes} para {depois}", e)}
                                        </span>
                                    ),
                            )}
                            {selecionados.length > 3 && <span className="text-tertiary">{plural({ one: "E mais {n} ingresso.", other: "E mais {n} ingressos." }, selecionados.length - 3)}</span>}
                        </div>
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button color="secondary" size="md" onClick={onFechar}>
                                Cancelar
                            </Button>
                            <Button color="primary" size="md" isDisabled={n <= 0} onClick={() => onAplicar(aplicar)}>
                                Aplicar preço
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/** Aplica as mesmas regras de venda a todos os selecionados (substitui as de cada um). */
function ModalRegrasEmLote({ quantidade, onFechar, onAplicar }: { quantidade: number; onFechar: () => void; onAplicar: (v: RegrasDeVenda | undefined) => void }) {
    const { plural } = useTextosItens();
    const [vendas, setVendas] = useState<RegrasDeVenda | undefined>(undefined);
    // Aplicar sem mexer apagaria os limites de todos os selecionados sem a pessoa perceber.
    const [mexeu, setMexeu] = useState(false);
    return (
        <ModalOverlay isOpen onOpenChange={(v) => !v && onFechar()} isDismissable>
            <Modal className="sm:max-w-[560px]">
                <Dialog>
                    <div className="flex max-h-[85dvh] w-full flex-col gap-5 overflow-y-auto rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-1">
                            <AriaHeading slot="title" className="text-lg font-semibold text-primary">{plural({ one: "Regras de venda de {n} ingresso", other: "Regras de venda de {n} ingressos" }, quantidade)}</AriaHeading>
                            <p className="text-sm text-tertiary">Estas regras substituem as que cada ingresso tem hoje.</p>
                        </div>
                        <CamposDeVendas
                            valor={vendas}
                            onChange={(v) => {
                                setVendas(v);
                                setMexeu(true);
                            }}
                        />
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button color="secondary" size="md" onClick={onFechar}>
                                Cancelar
                            </Button>
                            <Button color="primary" size="md" isDisabled={!mexeu} onClick={() => onAplicar(vendas)}>
                                Aplicar regras
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/** Pausar em lote para a venda de muitos ingressos de uma vez: confirma com o número e o efeito (ITM-82). */
function ModalPausarEmLote({ quantidade, onFechar, onPausar }: { quantidade: number; onFechar: () => void; onPausar: () => void }) {
    const { plural } = useTextosItens();
    return (
        <ModalOverlay isOpen onOpenChange={(v) => !v && onFechar()} isDismissable>
            <Modal className="sm:max-w-[440px]">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-1">
                            <AriaHeading slot="title" className="text-lg font-semibold text-primary">
                                {plural(T.pausarTitulo, quantidade)}
                            </AriaHeading>
                            <p className="text-sm text-tertiary">{T.pausarDescricao}</p>
                        </div>
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button color="secondary" size="md" onClick={onFechar}>
                                Cancelar
                            </Button>
                            <Button color="primary" size="md" onClick={onPausar}>
                                {plural(T.pausarConfirmar, quantidade)}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
