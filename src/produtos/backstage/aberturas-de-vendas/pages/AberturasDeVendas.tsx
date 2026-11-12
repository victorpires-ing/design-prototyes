import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarPlus01, Copy01, Edit01, Plus, SearchLg, Trash01 } from "@untitledui/icons";
import { parseDateTime } from "@internationalized/date";
import { DateTimePicker } from "@/components/application/date-picker/date-time-picker";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input, InputBase } from "@/components/base/input/input";
import { Surgir } from "@/components/foundations/transicao";
import type { AberturaDeVendas, Evento, ItemDaAbertura, ProdutoDaOrganizacao } from "@/plataforma";
import { itensDaAbertura } from "@/plataforma";
import { BackstageLayout } from "../../components/Backstage";
import { EscolhaEmLista, ListaDeEscolhas } from "../../itens/components/comuns";
import { BotaoMostrarMais, LIMIAR_FERRAMENTAS, paraBusca, useMostrarMais } from "../../itens/components/escala";
import { SeletorDeLista, type OpcaoDeLista } from "../../itens/components/SeletorDeLista";
import { SeletorDeIngressos, useResumoDeIngressos } from "../components/SeletorDeIngressos";
import { novoId, produtosDo, salvarAberturas, useCatalogo } from "../../itens/data/catalogo";
import { formatar, useTextosItens } from "../../itens/data/textos-itens";
import { AbasDeItens } from "../../components/abas-de-itens";

/* ------------------------------------------------------------------ */
/*  Aberturas de vendas (ABV)                                          */
/*                                                                     */
/*  Quando os itens do evento vendem. Cada abertura tem nome, início,  */
/*  fim e os ingressos, produtos e combos incluídos. Lê e grava no     */
/*  evento (`Evento.aberturas`); cada mudança é uma ação confirmada    */
/*  (modal ou seletor) e grava na hora.                                */
/* ------------------------------------------------------------------ */

type TipoDeItem = "ingresso" | "produto" | "combo";
const TIPOS: TipoDeItem[] = ["ingresso", "produto", "combo"];

const T = {
    titulo: "Aberturas de vendas",
    subtitulo: "Quando cada ingresso, produto e combo vende.",
    nova: "Nova abertura",
    buscar: "Buscar abertura",
    contagem: "{visiveis} de {total}",
    nada: "Nenhuma abertura com esse nome.",
    vazio: "Nenhuma abertura programada",
    vazioDica: "Crie a primeira abertura para os ingressos, produtos e combos começarem a vender.",
    carregando: "Carregando aberturas",
    estados: { aberta: "Aberta agora", agendada: "Agendada", encerrada: "Encerrada" },
    periodo: "De {inicio} até {fim}",
    duplicar: "Duplicar {nome}",
    editar: "Editar {nome}",
    excluir: "Excluir {nome}",
    duplicada: "{nome} duplicada.",
    copia: "Cópia de {nome}",
    salvo: "Alterações salvas.",
    erro: "Tente de novo: não foi possível salvar.",
    semItens: "Escolha os itens: sem eles, esta abertura não vende nada.",
    grupos: {
        ingresso: { rotulo: "Ingressos", vazio: "Nenhum ingresso", botao: "Escolher ingressos", seletor: "Ingressos de {nome}", seletorVazio: "" },
        produto: { rotulo: "Produtos", vazio: "Nenhum produto", botao: "Escolher produtos", seletor: "Produtos de {nome}", seletorVazio: "O evento ainda não vende produtos." },
        combo: { rotulo: "Combos", vazio: "Nenhum combo", botao: "Escolher combos", seletor: "Combos de {nome}", seletorVazio: "O evento ainda não tem combos." },
    } satisfies Record<TipoDeItem, { rotulo: string; vazio: string; botao: string; seletor: string; seletorVazio: string }>,
    ingressoApoio: "{setor}, sessão de {sessao}",
    ingressoApoioUnico: "{setor}",
    modal: {
        nova: "Nova abertura de vendas",
        editar: "Editar abertura",
        nome: "Nome",
        nomePlaceholder: "Ex.: Venda antecipada",
        nomeDica: "Aparece para o comprador.",
        nomeErro: "Dê um nome à abertura.",
        inicio: "Começa em",
        fim: "Termina em",
        dataErro: "Escolha data e hora.",
        fimErro: "Escolha um fim depois do começo.",
        evento: "O evento começa em {data}.",
        cancelar: "Cancelar",
        criar: "Criar abertura",
        salvar: "Salvar",
        criada: "{nome} criada.",
    },
    confirmar: {
        titulo: "Excluir {nome}?",
        dica: "Os itens dela deixam de vender neste período. Esta ação não pode ser desfeita.",
        cancelar: "Cancelar",
        excluir: "Excluir",
        excluida: "{nome} excluída.",
    },
};

type Estado = keyof typeof T.estados;
const COR: Record<Estado, "success" | "blue" | "gray"> = { aberta: "success", agendada: "blue", encerrada: "gray" };

const estadoDa = (a: AberturaDeVendas, agora = new Date()): Estado =>
    new Date(a.inicio) > agora ? "agendada" : new Date(a.fim) < agora ? "encerrada" : "aberta";

const paraData = (v?: string) => {
    if (!v) return null;
    try {
        return parseDateTime(v.slice(0, 16));
    } catch {
        return null;
    }
};

/** Itens do evento por tipo, como opções do seletor, com contexto para nomes repetidos (UI-LST-001). */
function opcoesDeItens(evento: Evento | undefined, biblioteca: ProdutoDaOrganizacao[], dataCurta: (iso: string) => string): Record<TipoDeItem, OpcaoDeLista[]> {
    if (!evento) return { ingresso: [], produto: [], combo: [] };
    const variasSessoes = evento.sessoes.length > 1;
    return {
        ingresso: evento.sessoes.flatMap((s) =>
            s.grupos.flatMap((g) =>
                g.ingressos.map((t) => ({
                    id: t.id,
                    rotulo: t.nome,
                    apoio: variasSessoes ? formatar(T.ingressoApoio, { setor: g.nome, sessao: dataCurta(s.inicio) }) : formatar(T.ingressoApoioUnico, { setor: g.nome }),
                })),
            ),
        ),
        produto: produtosDo(evento, biblioteca).map(({ produto }) => ({ id: produto.id, rotulo: produto.nome })),
        combo: (evento.combos ?? []).map((c) => ({ id: c.id, rotulo: c.nome })),
    };
}

/** Grava só o formato novo (`itens`), sem as configurações antigas. */
const comItens = (a: AberturaDeVendas, itens: ItemDaAbertura[]): AberturaDeVendas => {
    const { configuracoes: _antigas, ...resto } = a;
    return { ...resto, itens };
};

type Seletor = { aberturaId: string; tipo: TipoDeItem };

export function AberturasDeVendas() {
    const { carregando, evento, biblioteca } = useCatalogo();
    const { numero, dataCurta, dataLonga } = useTextosItens();
    const aberturas = useMemo(() => [...(evento?.aberturas ?? [])].sort((a, b) => a.inicio.localeCompare(b.inicio)), [evento?.aberturas]);
    const opcoes = useMemo(() => opcoesDeItens(evento, biblioteca, dataCurta), [evento, biblioteca, dataCurta]);
    const rotuloDe = useMemo(() => {
        const m = new Map(TIPOS.flatMap((tipo) => opcoes[tipo].map((o) => [`${tipo}:${o.id}`, o.apoio ? `${o.rotulo} (${o.apoio})` : o.rotulo] as const)));
        return m;
    }, [opcoes]);
    /** Setor de cada ingresso, para o resumo "N ingressos em M setores". */
    const setorDoIngresso = useMemo(() => new Map((evento?.sessoes ?? []).flatMap((s) => s.grupos.flatMap((g) => g.ingressos.map((t) => [t.id, g.id] as const)))), [evento?.sessoes]);

    const [modal, setModal] = useState<{ abertura?: AberturaDeVendas } | null>(null);
    const [excluir, setExcluir] = useState<AberturaDeVendas | null>(null);
    const [seletor, setSeletor] = useState<Seletor | null>(null);
    const [busca, setBusca] = useState("");
    const termo = paraBusca(busca.trim());
    const filtradas = useMemo(() => (termo ? aberturas.filter((a) => paraBusca(a.nome).includes(termo)) : aberturas), [aberturas, termo]);
    const { visiveis, restantes, mostrarMais } = useMostrarMais(filtradas);

    const gravar = async (lista: AberturaDeVendas[], mensagem = T.salvo) => {
        if (!evento) return false;
        try {
            await salvarAberturas(evento, lista);
            toast.success(mensagem);
            return true;
        } catch {
            toast.error(T.erro);
            return false;
        }
    };

    const trocar = (id: string, fn: (a: AberturaDeVendas) => AberturaDeVendas, mensagem?: string) => gravar(aberturas.map((a) => (a.id === id ? fn(a) : a)), mensagem);

    const duplicar = (a: AberturaDeVendas) => {
        const copia = comItens({ ...a, id: novoId("abv"), nome: formatar(T.copia, { nome: a.nome }) }, itensDaAbertura(a));
        void gravar([...aberturas, copia], formatar(T.duplicada, { nome: a.nome }));
    };

    const aberturaDoSeletor = seletor && aberturas.find((a) => a.id === seletor.aberturaId);

    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-aberturas">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <AbasDeItens ativa="aberturas" />
                {/* Título e subtítulo vêm do topo de Itens (página própria, BKS-17); aqui só a ação. */}
                {aberturas.length > 0 && (
                    <div className="flex justify-end">
                        <Button color="primary" size="md" iconLeading={Plus} onClick={() => setModal({})}>
                            {T.nova}
                        </Button>
                    </div>
                )}

                {carregando ? (
                    <div role="status" aria-label={T.carregando} className="flex flex-col gap-3">
                        {[0, 1].map((i) => (
                            <span key={i} aria-hidden="true" className="h-20 w-full animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                        ))}
                    </div>
                ) : aberturas.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                        <EmptyState size="sm">
                            <EmptyState.Header>
                                <EmptyState.FeaturedIcon icon={CalendarPlus01} color="gray" theme="modern" />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <EmptyState.Title>{T.vazio}</EmptyState.Title>
                                <EmptyState.Description>{T.vazioDica}</EmptyState.Description>
                            </EmptyState.Content>
                            <EmptyState.Footer>
                                <Button color="primary" size="md" iconLeading={Plus} onClick={() => setModal({})}>
                                    {T.nova}
                                </Button>
                            </EmptyState.Footer>
                        </EmptyState>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {aberturas.length > LIMIAR_FERRAMENTAS && (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <InputBase
                                    size="sm"
                                    icon={SearchLg}
                                    aria-label={T.buscar}
                                    placeholder={T.buscar}
                                    value={busca}
                                    onChange={(v: unknown) => setBusca(typeof v === "string" ? v : ((v as { target?: { value?: string } })?.target?.value ?? ""))}
                                    wrapperClassName="w-full sm:max-w-80"
                                />
                                <span role="status" className="text-sm text-tertiary tabular-nums">
                                    {formatar(T.contagem, { visiveis: numero(filtradas.length), total: numero(aberturas.length) })}
                                </span>
                            </div>
                        )}
                        <ul className="flex flex-col gap-3">
                            {visiveis.map((a) => (
                                <li key={a.id}>
                                    <CartaoDaAbertura
                                        abertura={a}
                                        rotuloDe={rotuloDe}
                                        setorDoIngresso={setorDoIngresso}
                                        onEditar={() => setModal({ abertura: a })}
                                        onDuplicar={() => duplicar(a)}
                                        onExcluir={() => setExcluir(a)}
                                        onEscolher={(tipo) => setSeletor({ aberturaId: a.id, tipo })}
                                    />
                                </li>
                            ))}
                        </ul>
                        <Surgir visivel={filtradas.length === 0}>
                            <p className="text-sm text-tertiary">{T.nada}</p>
                        </Surgir>
                        <BotaoMostrarMais restantes={restantes} onClick={mostrarMais} />
                    </div>
                )}
            </div>

            {modal && (
                <ModalDaAbertura
                    abertura={modal.abertura}
                    dataDoEvento={evento?.data ? dataLonga(evento.data) : undefined}
                    onFechar={() => setModal(null)}
                    onSalvar={async (dados) => {
                        const ok = modal.abertura
                            ? await trocar(modal.abertura.id, (a) => comItens({ ...a, ...dados }, itensDaAbertura(a)))
                            : await gravar([...aberturas, { id: novoId("abv"), ...dados, itens: [] }], formatar(T.modal.criada, { nome: dados.nome }));
                        if (ok) setModal(null);
                    }}
                />
            )}

            <ModalOverlay isOpen={!!excluir} onOpenChange={(v) => !v && setExcluir(null)} isDismissable>
                <Modal className="sm:max-w-[400px]">
                    <Dialog aria-label={excluir ? formatar(T.confirmar.titulo, { nome: excluir.nome }) : undefined}>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">{excluir && formatar(T.confirmar.titulo, { nome: excluir.nome })}</h2>
                                <p className="text-sm text-tertiary">{T.confirmar.dica}</p>
                            </div>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button color="secondary" size="md" onClick={() => setExcluir(null)}>
                                    {T.confirmar.cancelar}
                                </Button>
                                <Button
                                    color="primary-destructive"
                                    size="md"
                                    onClick={async () => {
                                        if (!excluir) return;
                                        if (await gravar(aberturas.filter((a) => a.id !== excluir.id), formatar(T.confirmar.excluida, { nome: excluir.nome }))) setExcluir(null);
                                    }}
                                >
                                    {T.confirmar.excluir}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>

            {seletor && aberturaDoSeletor && evento && seletor.tipo === "ingresso" && (
                <SeletorDeIngressos
                    titulo={formatar(T.grupos.ingresso.seletor, { nome: aberturaDoSeletor.nome })}
                    evento={evento}
                    itens={itensDaAbertura(aberturaDoSeletor).filter((i) => i.tipo === "ingresso")}
                    onFechar={() => setSeletor(null)}
                    onConfirmar={(escolhidos) => {
                        const outros = itensDaAbertura(aberturaDoSeletor).filter((i) => i.tipo !== "ingresso");
                        void trocar(aberturaDoSeletor.id, (a) => comItens(a, [...outros, ...escolhidos]));
                        setSeletor(null);
                    }}
                />
            )}
            {seletor && aberturaDoSeletor && seletor.tipo !== "ingresso" && (
                <SeletorDeLista
                    titulo={formatar(T.grupos[seletor.tipo].seletor, { nome: aberturaDoSeletor.nome })}
                    opcoes={opcoes[seletor.tipo]}
                    selecionados={itensDaAbertura(aberturaDoSeletor)
                        .filter((i) => i.tipo === seletor.tipo)
                        .map((i) => i.id)}
                    vazio={T.grupos[seletor.tipo].seletorVazio}
                    onFechar={() => setSeletor(null)}
                    onConfirmar={(ids) => {
                        const outros = itensDaAbertura(aberturaDoSeletor).filter((i) => i.tipo !== seletor.tipo);
                        void trocar(aberturaDoSeletor.id, (a) => comItens(a, [...outros, ...ids.map((id) => ({ tipo: seletor.tipo, id }))]));
                        setSeletor(null);
                    }}
                />
            )}
        </BackstageLayout>
    );
}

function CartaoDaAbertura({
    abertura,
    rotuloDe,
    setorDoIngresso,
    onEditar,
    onDuplicar,
    onExcluir,
    onEscolher,
}: {
    abertura: AberturaDeVendas;
    rotuloDe: Map<string, string>;
    setorDoIngresso: Map<string, string>;
    onEditar: () => void;
    onDuplicar: () => void;
    onExcluir: () => void;
    onEscolher: (tipo: TipoDeItem) => void;
}) {
    const { quando } = useTextosItens();
    const resumirIngressos = useResumoDeIngressos();
    const estado = estadoDa(abertura);
    const itens = itensDaAbertura(abertura);
    const ingressos = itens.filter((i) => i.tipo === "ingresso");
    /** Até 5 nomes; acima disso, contagem ("60 ingressos em 7 setores"), que escala para milhares (UI-LST-002). */
    const escolhidos = (tipo: TipoDeItem): string[] => {
        if (tipo === "ingresso" && ingressos.length > 5)
            return [resumirIngressos(ingressos.length, new Set(ingressos.map((i) => setorDoIngresso.get(i.id) ?? i.id)).size)];
        return itens.filter((i) => i.tipo === tipo).map((i) => rotuloDe.get(`${tipo}:${i.id}`) ?? i.id);
    };
    const nome = abertura.nome;

    return (
        <article className="flex flex-col rounded-2xl bg-primary ring-1 ring-secondary">
            <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 md:px-6">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h2 className="flex flex-wrap items-center gap-2">
                        <span className="text-md font-semibold text-primary">{nome}</span>
                        <Badge size="sm" type="pill-color" color={COR[estado]}>
                            {T.estados[estado]}
                        </Badge>
                    </h2>
                    <p className="text-sm text-tertiary">{formatar(T.periodo, { inicio: quando(abertura.inicio), fim: quando(abertura.fim) })}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <ButtonUtility size="sm" color="tertiary" icon={Copy01} tooltip={formatar(T.duplicar, { nome })} onClick={onDuplicar} />
                    <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip={formatar(T.editar, { nome })} onClick={onEditar} />
                    <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip={formatar(T.excluir, { nome })} onClick={onExcluir} />
                </div>
            </div>
            {/* Itens incluídos, uma linha por tipo; a linha abre a escolha. */}
            <div className="flex flex-col gap-4 px-5 pt-4 pb-5 md:px-6">
                <ListaDeEscolhas>
                    {TIPOS.map((tipo) => (
                        <EscolhaEmLista
                            key={tipo}
                            rotulo={T.grupos[tipo].rotulo}
                            escolhidos={escolhidos(tipo)}
                            vazio={T.grupos[tipo].vazio}
                            onEscolher={() => onEscolher(tipo)}
                        />
                    ))}
                </ListaDeEscolhas>
                <Surgir visivel={itens.length === 0}>
                    <p className="text-sm text-warning-primary">{T.semItens}</p>
                </Surgir>
            </div>
        </article>
    );
}

function ModalDaAbertura({
    abertura,
    dataDoEvento,
    onFechar,
    onSalvar,
}: {
    abertura?: AberturaDeVendas;
    dataDoEvento?: string;
    onFechar: () => void;
    onSalvar: (dados: Pick<AberturaDeVendas, "nome" | "inicio" | "fim">) => Promise<void>;
}) {
    const [nome, setNome] = useState(abertura?.nome ?? "");
    const [inicio, setInicio] = useState(abertura?.inicio);
    const [fim, setFim] = useState(abertura?.fim);
    const [tentou, setTentou] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const erros = {
        nome: !nome.trim() ? T.modal.nomeErro : undefined,
        inicio: !inicio ? T.modal.dataErro : undefined,
        fim: !fim ? T.modal.dataErro : inicio && fim <= inicio ? T.modal.fimErro : undefined,
    };

    const salvar = async () => {
        setTentou(true);
        if (erros.nome || erros.inicio || erros.fim || !inicio || !fim) return;
        setSalvando(true);
        await onSalvar({ nome: nome.trim(), inicio, fim });
        setSalvando(false);
    };

    return (
        <ModalOverlay isOpen onOpenChange={(v) => !v && onFechar()} isDismissable>
            <Modal className="sm:max-w-[480px]">
                <Dialog aria-label={abertura ? T.modal.editar : T.modal.nova}>
                    {/* noValidate: os erros são os da tela, não os balões do navegador. */}
                    <form
                        noValidate
                        className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary"
                        onSubmit={(e) => {
                            e.preventDefault();
                            void salvar();
                        }}
                    >
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-primary">{abertura ? T.modal.editar : T.modal.nova}</h2>
                            {dataDoEvento && <p className="text-sm text-tertiary">{formatar(T.modal.evento, { data: dataDoEvento })}</p>}
                        </div>
                        <Input
                            label={T.modal.nome}
                            placeholder={T.modal.nomePlaceholder}
                            isRequired
                            value={nome}
                            onChange={setNome}
                            isInvalid={tentou && !!erros.nome}
                            hint={tentou && erros.nome ? erros.nome : T.modal.nomeDica}
                        />
                        <DateTimePicker
                            label={T.modal.inicio}
                            granularity="minute"
                            hourCycle={24}
                            isRequired
                            value={paraData(inicio)}
                            onChange={(d) => setInicio(d ? d.toString().slice(0, 16) : undefined)}
                            isInvalid={tentou && !!erros.inicio}
                            hint={tentou ? erros.inicio : undefined}
                        />
                        <DateTimePicker
                            label={T.modal.fim}
                            granularity="minute"
                            hourCycle={24}
                            isRequired
                            value={paraData(fim)}
                            onChange={(d) => setFim(d ? d.toString().slice(0, 16) : undefined)}
                            isInvalid={tentou && !!erros.fim}
                            hint={tentou ? erros.fim : undefined}
                        />
                        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                            <Button color="secondary" size="md" onClick={onFechar}>
                                {T.modal.cancelar}
                            </Button>
                            <Button color="primary" size="md" type="submit" isLoading={salvando}>
                                {abertura ? T.modal.salvar : T.modal.criar}
                            </Button>
                        </div>
                    </form>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
