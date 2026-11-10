import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { PauseCircle, PlayCircle, Plus, SearchLg, ShoppingBag01, Trash01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputBase } from "@/components/base/input/input";
import { DURACAO_TRANSICAO, Surgir } from "@/components/foundations/transicao";
import type { ProdutoDaOrganizacao, ProdutoNoEvento } from "@/plataforma";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";
import { BackstageLayout } from "../../components/Backstage";
import { estadoDoProduto, precoDoProduto, produtosDo, salvarProdutosDoEvento, useCatalogo, type EstadoItem, type ProdutoNoCatalogo } from "../data/catalogo";
import { formatar, useTextosItens } from "../data/textos-itens";
import { EstadoBadge } from "../components/comuns";
import { AcoesEmLote, AvisoDeEscala, BarraDeFiltros, BotaoMostrarMais, CaixaDeSelecao, LIMIAR_FERRAMENTAS, paraBusca, useMostrarMais, useSelecao } from "../components/escala";

/* ------------------------------------------------------------------ */
/*  Produtos do evento (ITM)                                           */
/*                                                                     */
/*  O produto é da organização (biblioteca); o evento escolhe quais    */
/*  vende, com preço e estoque próprios. A lista mostra cada produto   */
/*  inteiro numa linha; o detalhe edita tudo a partir dele.            */
/* ------------------------------------------------------------------ */

/** Textos desta tela (UI-TXT-009): frases inteiras, plural por Intl.PluralRules. */
const TEXTOS = {
    titulo: "Produtos",
    produtosNoEvento: { one: "{n} produto neste evento", other: "{n} produtos neste evento" },
    adicionar: "Adicionar produtos",
    listaDeProdutos: "Produtos do evento",
    carregando: "Carregando produtos",
    vazioTitulo: "Nenhum produto neste evento",
    vazioDica: "Escolha produtos da biblioteca da organização ou crie um novo.",
    disponiveis: { one: "{n} disponível", other: "{n} disponíveis" },
    abrir: "Abrir {nome}",
    buscar: "Buscar produto",
    filtroEstado: "Estado",
    todosOsEstados: "Todos os estados",
    nenhumNoFiltro: "Nenhum produto com esses filtros.",
    lote: {
        pausar: "Pausar",
        voltar: "Voltar a vender",
        remover: "Remover do evento",
        pausados: { one: "{n} produto pausado.", other: "{n} produtos pausados." },
        voltaram: { one: "{n} produto voltou a vender.", other: "{n} produtos voltaram a vender." },
        removidos: { one: "{n} produto removido do evento.", other: "{n} produtos removidos do evento." },
        confirmarTitulo: { one: "Remover {n} produto do evento?", other: "Remover {n} produtos do evento?" },
        confirmarDica: { one: "Ele continua na biblioteca da organização.", other: "Eles continuam na biblioteca da organização." },
        cancelar: "Cancelar",
        confirmar: "Remover",
    },
    modal: {
        titulo: "Adicionar produtos",
        dica: "Os produtos entram pausados e sem estoque. Eles começam a vender quando você definir o estoque e ligar a venda em cada um.",
        buscar: "Buscar produto",
        buscarPlaceholder: "Buscar por nome",
        jaNoEvento: "Já no evento",
        nenhum: "Nenhum produto com esse nome.",
        contagem: "{visiveis} de {total}",
        selecionarTodos: { one: "Selecionar {n} da busca", other: "Selecionar todos os {n} da busca" },
        limparSelecao: "Limpar seleção",
        bibliotecaVazia: "A biblioteca da organização ainda não tem produtos.",
        selecionados: { zero: "Nenhum selecionado", one: "{n} selecionado", other: "{n} selecionados" },
        criarNovo: "Criar produto na organização",
        cancelar: "Cancelar",
        confirmar: "Adicionar",
        adicionados: { one: "{n} produto adicionado ao evento.", other: "{n} produtos adicionados ao evento." },
    },
};

type Plural = { zero?: string; one: string; other: string };

function usePlural() {
    const { locale, numero } = useTextosItens();
    const regras = useMemo(() => new Intl.PluralRules(locale), [locale]);
    return (frase: Plural, n: number) => formatar(n === 0 ? (frase.zero ?? frase.other) : regras.select(n) === "one" ? frase.one : frase.other, { n: numero(n) });
}

export function Produtos() {
    const navigate = useNavigate();
    const plural = usePlural();
    const reduzir = useReducedMotion();
    const { t } = useTextosItens();
    const { carregando, evento, biblioteca } = useCatalogo();
    const [adicionando, setAdicionando] = useState(false);
    const [busca, setBusca] = useState("");
    const [estado, setEstado] = useState<EstadoItem | "todos">("todos");
    const [confirmarRemocao, setConfirmarRemocao] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const selecao = useSelecao();

    const produtos = useMemo(() => produtosDo(evento, biblioteca), [evento, biblioteca]);
    const vazio = !carregando && produtos.length === 0;
    // Com um produto só, nada de seleção nem ações em lote (UI-LST-001).
    const comSelecao = produtos.length > 1;

    const filtrados = useMemo(() => {
        const q = paraBusca(busca.trim());
        return produtos.filter((p) => (!q || paraBusca(p.produto.nome).includes(q)) && (estado === "todos" || estadoDoProduto(p.noEvento) === estado));
    }, [produtos, busca, estado]);
    const pagina = useMostrarMais(filtrados);

    // Mudou a busca ou o filtro: volta ao começo da lista e esquece a seleção, que era de outro recorte.
    const aoFiltrar = (aplicar: () => void) => {
        aplicar();
        pagina.reiniciar();
        selecao.limpar();
    };

    const opcoesDeEstado: { id: EstadoItem | "todos"; label: string }[] = [
        { id: "todos", label: TEXTOS.todosOsEstados },
        ...(["a-venda", "pausado", "sem-estoque", "agendado", "encerrado"] as const).map((id) => ({ id, label: t.estado[id] })),
    ];

    /** Grava a lista nova de uma vez só, avisa com plural e limpa a seleção. */
    const emLote = async (proxima: ProdutoNoEvento[], aviso: Plural) => {
        if (!evento) return;
        const n = selecao.tamanho;
        setSalvando(true);
        try {
            await salvarProdutosDoEvento(evento, proxima);
            toast.success(plural(aviso, n));
            selecao.limpar();
            setConfirmarRemocao(false);
        } catch {
            toast.error(t.erroAoSalvar);
        } finally {
            setSalvando(false);
        }
    };
    const definirAtivo = (ativo: boolean) =>
        emLote(
            (evento?.produtos ?? []).map((p) => (selecao.tem(p.produtoId) ? { ...p, ativo } : p)),
            ativo ? TEXTOS.lote.voltaram : TEXTOS.lote.pausados,
        );
    const removerSelecionados = () =>
        emLote(
            (evento?.produtos ?? []).filter((p) => !selecao.tem(p.produtoId)),
            TEXTOS.lote.removidos,
        );

    const botaoAdicionar = (
        <Button size="md" color="primary" iconLeading={Plus} onClick={() => setAdicionando(true)} isDisabled={carregando}>
            {TEXTOS.adicionar}
        </Button>
    );

    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-produtos">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <h1 className={TITULO_PAGINA}>{TEXTOS.titulo}</h1>
                        {carregando ? (
                            <span aria-hidden="true" className="mt-1 h-4 w-40 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
                        ) : (
                            <p className="text-sm text-tertiary">{plural(TEXTOS.produtosNoEvento, produtos.length)}</p>
                        )}
                    </div>
                    {botaoAdicionar}
                </header>

                <AvisoDeEscala />

                <section aria-labelledby="titulo-lista-produtos" className="flex flex-col gap-4">
                    <h2 id="titulo-lista-produtos" className="sr-only">
                        {TEXTOS.listaDeProdutos}
                    </h2>

                    <Surgir visivel={vazio}>
                        <div className="flex items-center justify-center py-16">
                            <EmptyState size="sm">
                                <EmptyState.Header>
                                    <EmptyState.FeaturedIcon icon={ShoppingBag01} color="gray" theme="modern" />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <EmptyState.Title>{TEXTOS.vazioTitulo}</EmptyState.Title>
                                    <EmptyState.Description>{TEXTOS.vazioDica}</EmptyState.Description>
                                </EmptyState.Content>
                                <EmptyState.Footer>{botaoAdicionar}</EmptyState.Footer>
                            </EmptyState>
                        </div>
                    </Surgir>

                    {!carregando && (
                        <BarraDeFiltros
                            total={produtos.length}
                            visiveis={filtrados.length}
                            busca={busca}
                            onBusca={(v) => aoFiltrar(() => setBusca(v))}
                            placeholder={TEXTOS.buscar}
                            filtros={[
                                {
                                    id: "estado",
                                    rotulo: TEXTOS.filtroEstado,
                                    valor: estado,
                                    opcoes: opcoesDeEstado,
                                    onChange: (v) => aoFiltrar(() => setEstado(v as EstadoItem | "todos")),
                                },
                            ]}
                            onLimpar={() =>
                                aoFiltrar(() => {
                                    setBusca("");
                                    setEstado("todos");
                                })
                            }
                        />
                    )}

                    {carregando && <EsqueletoDaLista />}

                    <Surgir visivel={!carregando && produtos.length > 0 && filtrados.length === 0}>
                        <p className="py-8 text-center text-sm text-tertiary">{TEXTOS.nenhumNoFiltro}</p>
                    </Surgir>

                    <ul hidden={carregando} className="flex flex-col gap-3 empty:hidden">
                        <AnimatePresence initial={false} mode="popLayout">
                            {pagina.visiveis.map((p) => (
                                <motion.li
                                    key={p.produto.id}
                                    layout={!reduzir}
                                    initial={{ opacity: 0, y: reduzir ? 0 : 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: reduzir ? 0 : -8 }}
                                    transition={{ duration: reduzir ? 0.12 : DURACAO_TRANSICAO, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <LinhaDoProduto
                                        item={p}
                                        onAbrir={() => navigate(`/backstage/catalogo/produtos/${p.produto.id}`)}
                                        selecao={comSelecao ? { marcado: selecao.tem(p.produto.id), onChange: (on) => selecao.alternar(p.produto.id, on) } : undefined}
                                    />
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>

                    {!carregando && <BotaoMostrarMais restantes={pagina.restantes} onClick={pagina.mostrarMais} />}
                </section>

                {comSelecao && (
                    <AcoesEmLote
                        selecionados={selecao.tamanho}
                        totalDoFiltro={filtrados.length}
                        onSelecionarTodos={() => selecao.definir(filtrados.map((p) => p.produto.id))}
                        onLimpar={selecao.limpar}
                    >
                        <Button color="secondary" size="sm" iconLeading={PauseCircle} onClick={() => definirAtivo(false)} isDisabled={salvando}>
                            {TEXTOS.lote.pausar}
                        </Button>
                        <Button color="secondary" size="sm" iconLeading={PlayCircle} onClick={() => definirAtivo(true)} isDisabled={salvando}>
                            {TEXTOS.lote.voltar}
                        </Button>
                        <Button color="secondary-destructive" size="sm" iconLeading={Trash01} onClick={() => setConfirmarRemocao(true)} isDisabled={salvando}>
                            {TEXTOS.lote.remover}
                        </Button>
                    </AcoesEmLote>
                )}
            </div>

            <ModalOverlay isOpen={confirmarRemocao} onOpenChange={(v) => !salvando && setConfirmarRemocao(v)} isDismissable={!salvando}>
                <Modal className="sm:max-w-[400px]">
                    <Dialog aria-label={plural(TEXTOS.lote.confirmarTitulo, selecao.tamanho)}>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">{plural(TEXTOS.lote.confirmarTitulo, selecao.tamanho)}</h2>
                                <p className="text-sm text-tertiary">{plural(TEXTOS.lote.confirmarDica, selecao.tamanho)}</p>
                            </div>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button color="secondary" size="md" onClick={() => setConfirmarRemocao(false)} isDisabled={salvando}>
                                    {TEXTOS.lote.cancelar}
                                </Button>
                                <Button color="primary-destructive" size="md" onClick={removerSelecionados} isLoading={salvando}>
                                    {TEXTOS.lote.confirmar}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>

            <AdicionarProdutos aberto={adicionando} onFechar={() => setAdicionando(false)} />
        </BackstageLayout>
    );
}

/** Linha-cartão: celular empilha (imagem e nome em cima; preço, estoque e estado embaixo); desktop em uma linha. */
function LinhaDoProduto({
    item,
    onAbrir,
    selecao,
}: {
    item: ProdutoNoCatalogo;
    onAbrir: () => void;
    /** Só com mais de um produto no evento. */
    selecao?: { marcado: boolean; onChange: (on: boolean) => void };
}) {
    const { preco } = useTextosItens();
    const plural = usePlural();
    const { produto, noEvento } = item;

    return (
        // Foco do teclado no botão que cobre a linha aparece no cartão inteiro (WCAG 2.4.7).
        <article className="relative flex items-start rounded-2xl bg-primary ring-1 ring-secondary outline-focus-ring transition duration-100 ease-linear hover:ring-brand has-[>button:focus-visible]:outline-2 has-[>button:focus-visible]:outline-offset-2 md:items-center">
            {selecao && (
                <div className="flex h-18 shrink-0 items-center pt-4 pl-4 md:h-auto md:self-stretch md:pt-0">
                    <CaixaDeSelecao rotulo={produto.nome} marcado={selecao.marcado} onChange={selecao.onChange} />
                </div>
            )}
            <button
                type="button"
                onClick={onAbrir}
                aria-label={formatar(TEXTOS.abrir, { nome: produto.nome })}
                className="flex w-full min-w-0 flex-1 flex-col gap-3 p-4 text-left outline-hidden after:absolute after:inset-0 md:flex-row md:items-center md:gap-6"
            >
                <span className="flex min-w-0 flex-1 items-center gap-3">
                    <ImagemDoProduto produto={produto} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-md font-semibold text-primary">{produto.nome}</span>
                    </span>
                </span>
                <span className="flex flex-wrap items-center gap-x-4 gap-y-2 md:flex-nowrap md:justify-end">
                    <span className="text-md font-semibold text-primary tabular-nums md:w-24 md:text-right">{preco(precoDoProduto(item))}</span>
                    <span className="text-sm text-tertiary tabular-nums md:w-32 md:text-right">{plural(TEXTOS.disponiveis, Math.max(0, noEvento.estoque))}</span>
                    <span className="md:flex md:w-32 md:justify-end">
                        <EstadoBadge estado={estadoDoProduto(noEvento)} />
                    </span>
                </span>
            </button>
        </article>
    );
}

function ImagemDoProduto({ produto }: { produto: ProdutoDaOrganizacao }) {
    return (
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
            {produto.imagem ? (
                <img src={produto.imagem} alt="" aria-hidden="true" className="size-full object-cover" />
            ) : (
                <ShoppingBag01 className="size-6 text-fg-quaternary" aria-hidden="true" />
            )}
        </span>
    );
}

/** Esqueleto enquanto o banco carrega: as mesmas linhas da lista. */
function EsqueletoDaLista() {
    return (
        <div role="status" aria-label={TEXTOS.carregando} className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
                <div key={i} aria-hidden="true" className="flex items-center gap-3 rounded-2xl bg-primary p-4 ring-1 ring-secondary">
                    <span className="size-14 shrink-0 animate-pulse rounded-lg bg-secondary motion-reduce:animate-none" />
                    <span className="flex min-w-0 flex-1 flex-col gap-2">
                        <span className="h-4 w-40 max-w-full animate-pulse rounded bg-secondary motion-reduce:animate-none" />
                        <span className="h-3.5 w-64 max-w-full animate-pulse rounded bg-secondary motion-reduce:animate-none" />
                    </span>
                </div>
            ))}
        </div>
    );
}

/**
 * Seletor de produtos da biblioteca (padrão "Add products"): busca, marca vários e adiciona de uma
 * vez. Os que já estão no evento aparecem marcados e desabilitados.
 */
function AdicionarProdutos({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
    const navigate = useNavigate();
    const plural = usePlural();
    const { t, preco, numero } = useTextosItens();
    const { evento, biblioteca } = useCatalogo();
    const [busca, setBusca] = useState("");
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
    const [salvando, setSalvando] = useState(false);

    const noEvento = useMemo(() => new Set((evento?.produtos ?? []).map((p) => p.produtoId)), [evento]);
    const filtrados = useMemo(() => {
        const q = paraBusca(busca.trim());
        return q ? biblioteca.filter((p) => paraBusca(p.nome).includes(q)) : biblioteca;
    }, [biblioteca, busca]);
    const pagina = useMostrarMais(filtrados);
    const visiveis = pagina.visiveis;
    // Busca, contagem e "selecionar todos" só quando a biblioteca passa de uma tela (UI-LST-001).
    const ferramentas = biblioteca.length > LIMIAR_FERRAMENTAS;
    const marcaveis = useMemo(() => filtrados.filter((p) => !noEvento.has(p.id)).map((p) => p.id), [filtrados, noEvento]);
    const todosMarcados = marcaveis.length > 0 && marcaveis.every((id) => selecionados.has(id));

    const fechar = () => {
        onFechar();
        setBusca("");
        setSelecionados(new Set());
        pagina.reiniciar();
    };

    const buscar = (v: string) => {
        setBusca(v);
        pagina.reiniciar();
    };

    // Soma à seleção atual: o que já foi marcado em outra busca continua marcado.
    const marcarTodos = () => setSelecionados((atual) => new Set([...atual, ...marcaveis]));

    const marcar = (id: string, on: boolean) =>
        setSelecionados((atual) => {
            const prox = new Set(atual);
            if (on) prox.add(id);
            else prox.delete(id);
            return prox;
        });

    const adicionar = async () => {
        if (!evento || selecionados.size === 0) return;
        // Entram pausados e sem estoque, pelo preço base: só vendem quando o produtor definir estoque e ligar.
        const novos: ProdutoNoEvento[] = biblioteca.filter((p) => selecionados.has(p.id) && !noEvento.has(p.id)).map((p) => ({ produtoId: p.id, estoque: 0, ativo: false }));
        setSalvando(true);
        try {
            await salvarProdutosDoEvento(evento, [...(evento.produtos ?? []), ...novos]);
            toast.success(plural(TEXTOS.modal.adicionados, novos.length));
            fechar();
        } catch {
            toast.error(t.erroAoSalvar);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <ModalOverlay isOpen={aberto} onOpenChange={(v) => !v && !salvando && fechar()} isDismissable={!salvando}>
            <Modal className="sm:max-w-[560px]">
                <Dialog aria-label={TEXTOS.modal.titulo}>
                    <div className="flex max-h-[min(720px,85dvh)] w-full min-w-0 flex-col rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-4 border-b border-secondary p-5 sm:p-6">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">{TEXTOS.modal.titulo}</h2>
                                <p className="text-sm text-tertiary">{TEXTOS.modal.dica}</p>
                            </div>
                            {ferramentas && (
                                <div className="flex flex-col gap-2">
                                    <InputBase
                                        size="sm"
                                        icon={SearchLg}
                                        value={busca}
                                        aria-label={TEXTOS.modal.buscar}
                                        placeholder={TEXTOS.modal.buscarPlaceholder}
                                        onChange={(e) => buscar(e.target.value)}
                                    />
                                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                                        <span role="status" className="text-sm text-tertiary tabular-nums">
                                            {formatar(TEXTOS.modal.contagem, { visiveis: numero(filtrados.length), total: numero(biblioteca.length) })}
                                        </span>
                                        {todosMarcados ? (
                                            <Button color="link-gray" size="sm" onClick={() => setSelecionados(new Set())}>
                                                {TEXTOS.modal.limparSelecao}
                                            </Button>
                                        ) : (
                                            marcaveis.length > 1 && (
                                                <Button color="link-color" size="sm" onClick={marcarTodos}>
                                                    {plural(TEXTOS.modal.selecionarTodos, marcaveis.length)}
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <Surgir visivel={filtrados.length === 0}>
                                <p className="px-5 py-8 text-center text-sm text-tertiary sm:px-6">{biblioteca.length === 0 ? TEXTOS.modal.bibliotecaVazia : TEXTOS.modal.nenhum}</p>
                            </Surgir>
                            <ul className="flex flex-col">
                                {visiveis.map((p) => {
                                    const ja = noEvento.has(p.id);
                                    return (
                                        <li key={p.id} className="border-b border-secondary last:border-b-0">
                                            <Checkbox
                                                isSelected={ja || selecionados.has(p.id)}
                                                isDisabled={ja}
                                                onChange={(on) => marcar(p.id, on)}
                                                className="w-full cursor-pointer items-center gap-3 px-5 py-3 hover:bg-primary_hover sm:px-6 [&>div:last-child]:min-w-0 [&>div:last-child]:flex-1"
                                                label={
                                                    <span className="flex min-w-0 items-center gap-3">
                                                        <ImagemDoProduto produto={p} />
                                                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                            <span className="truncate text-sm font-medium text-primary">{p.nome}</span>
                                                            <span className="text-sm font-normal text-tertiary tabular-nums">{preco(p.precoBase)}</span>
                                                        </span>
                                                        {ja && (
                                                            <Badge size="sm" type="pill-color" color="gray" className="shrink-0">
                                                                {TEXTOS.modal.jaNoEvento}
                                                            </Badge>
                                                        )}
                                                    </span>
                                                }
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                            {pagina.restantes > 0 && (
                                <div className="border-t border-secondary px-5 py-4 sm:px-6">
                                    <BotaoMostrarMais restantes={pagina.restantes} onClick={pagina.mostrarMais} />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-secondary p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <Button color="link-color" size="md" className="self-start sm:self-center" onClick={() => navigate("/backstage/produtos/novo")}>
                                {TEXTOS.modal.criarNovo}
                            </Button>
                            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                                <span className="text-sm text-tertiary" role="status">
                                    {plural(TEXTOS.modal.selecionados, selecionados.size)}
                                </span>
                                <div className="flex gap-3">
                                    <Button color="secondary" size="md" onClick={fechar} isDisabled={salvando}>
                                        {TEXTOS.modal.cancelar}
                                    </Button>
                                    <Button color="primary" size="md" onClick={adicionar} isLoading={salvando} isDisabled={selecionados.size === 0}>
                                        {TEXTOS.modal.confirmar}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
