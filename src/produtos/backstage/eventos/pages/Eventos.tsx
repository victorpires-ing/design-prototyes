import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router";
import { ChevronDown, CurrencyDollarCircle, DotsVertical, Plus, SearchLg, ShoppingBag01, Ticket01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { InputBase } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { DURACAO_TRANSICAO, Surgir } from "@/components/foundations/transicao";
import { useBanco } from "@/plataforma";
import { BackstageLayout } from "../../components/Backstage";
import { CartaoMetrica } from "../components/CartaoMetrica";
import { EVENTO_STATUS_BADGE_COLOR, setEventoAtual, useEventosVersao, vendasHabilitadas, type Evento } from "../data/eventos";
import { TIPOS_DE_EVENTO } from "../data/tipos-evento";
import { formatar, useFormatos, useTextosEventos } from "../data/textos-eventos";
import { ritmoDaOrganizacao, useResumos, type ResumoEvento, type RitmoOrganizacao } from "../data/vendas";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";

type Ordem = "data" | "ocupacao" | "faturamento" | "ritmo";
const ORDENS: Ordem[] = ["data", "ocupacao", "faturamento", "ritmo"];
type Metrica = "faturamento" | "produtos" | "ingressos";
const METRICAS: Metrica[] = ["faturamento", "produtos", "ingressos"];

/** Camada 1 — painel da organização: como estão os eventos e onde agir hoje. */
export function Eventos() {
    const navigate = useNavigate();
    const { t } = useTextosEventos();
    const reduzir = useReducedMotion();
    const { modo, erro } = useBanco();
    // Enquanto o banco carrega, as tabelas estão vazias: a página mostra esqueleto, não "zero" (UI-EST-007).
    const carregando = modo === "carregando";
    const [term, setTerm] = useState("");
    const [ordem, setOrdem] = useState<Ordem>("data");

    /* Toda mudança de status vem do modal global (aberto por evento na sidebar ou por
       aqui, sempre depois de setEventoAtual) — a listagem precisa recalcular ao vivo em
       vez de ficar presa ao snapshot do primeiro render. */
    useEventosVersao();
    const todos = useResumos();

    const ativos = todos.filter((r) => vendasHabilitadas(r.evento.status));


    const ritmo = useMemo(() => ritmoDaOrganizacao(ativos), [ativos]);

    const visiveis = useMemo(() => {
        const query = term.trim().toLowerCase();
        const porBusca = query ? todos.filter((r) => `${r.evento.nome} ${r.evento.produtor} ${r.evento.local}`.toLowerCase().includes(query)) : todos;

        return [...porBusca].sort((a, b) => {
            if (ordem === "ocupacao") return b.ocupacao - a.ocupacao;
            if (ordem === "faturamento") return b.faturamento - a.faturamento;
            if (ordem === "ritmo") return b.ritmo7 - a.ritmo7;
            return new Date(a.evento.data).getTime() - new Date(b.evento.data).getTime();
        });
    }, [todos, term, ordem]);

    // Entrar no evento abre Itens › Ingressos (EVT-07).
    const abrir = (evento: Evento, href = "/backstage/catalogo/ingressos") => {
        setEventoAtual(evento.id);
        navigate(href);
    };

    const editar = (evento: Evento) => {
        setEventoAtual(evento.id);
        navigate("/backstage/informacoes-evento");
    };

    // Organização sem evento: só o vazio com "Criar evento"; números, busca e ordem não têm o que mostrar (EVT-100).
    const semEventos = !carregando && todos.length === 0;

    return (
        <BackstageLayout activeProducer="eventos" showEventContext={false}>
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        <h1 className={TITULO_PAGINA}>{t.titulo}</h1>
                        <Subtitulo carregando={carregando} ativos={ativos.length} />
                    </div>
                    {!semEventos && <CriarEventoMenu />}
                </header>

                {/* Sincronização falhou depois de carregar: os dados ficam, com o aviso (UI-EST-007). */}
                <Surgir visivel={!carregando && !!erro}>
                    <p role="status" className="rounded-xl bg-warning-primary px-4 py-3 text-sm text-warning-primary ring-1 ring-border-secondary">
                        {t.semConexao}
                    </p>
                </Surgir>

                <Surgir visivel={!semEventos} gap={24}>
                    <ResumoDaOrganizacao ritmo={ritmo} carregando={carregando} />
                </Surgir>

                <section aria-labelledby="titulo-lista-eventos" className="mt-4 flex flex-col gap-4">
                    <h2 id="titulo-lista-eventos" className="sr-only">
                        {t.listaDeEventos}
                    </h2>
                    <Surgir visivel={!semEventos} gap={16}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        {/* Largura em que o placeholder cabe inteiro. */}
                        <div className="md:w-80">
                            <InputBase
                                size="sm"
                                icon={SearchLg}
                                value={term}
                                aria-label={t.buscar}
                                onChange={(event) => setTerm(event.target.value)}
                                placeholder={t.buscarPlaceholder}
                            />
                        </div>
                        <div className="md:w-[190px]">
                            <Select
                                aria-label={t.ordenarPor}
                                size="sm"
                                selectedKey={ordem}
                                onSelectionChange={(key) => setOrdem(String(key) as Ordem)}
                                items={ORDENS.map((id) => ({ id, label: t.ordens[id] }))}
                            >
                                {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                            </Select>
                        </div>
                    </div>
                    </Surgir>

                    {/* Listagem. Buscar e reordenar fazem os cartões deslizarem até o novo lugar; o vazio
                        entra e sai deslizando (UI-VIS-008). Com movimento reduzido, só troca. */}
                    {/* Dois vazios diferentes: busca sem resultado orienta a mudar o termo; organização sem
                        evento oferece criar o primeiro (UI-EST-006). */}
                    <Surgir visivel={!carregando && visiveis.length === 0}>
                        <div className="flex items-center justify-center py-16">
                            {todos.length === 0 ? (
                                <EmptyState size="sm">
                                    <EmptyState.Header>
                                        <EmptyState.FeaturedIcon icon={Ticket01} color="gray" theme="modern" />
                                    </EmptyState.Header>
                                    <EmptyState.Content>
                                        <EmptyState.Title>{t.semEventos}</EmptyState.Title>
                                        <EmptyState.Description>{t.semEventosDica}</EmptyState.Description>
                                    </EmptyState.Content>
                                    <EmptyState.Footer>
                                        <CriarEventoMenu posicao="bottom" />
                                    </EmptyState.Footer>
                                </EmptyState>
                            ) : (
                                <EmptyState size="sm">
                                    <EmptyState.Header>
                                        <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" />
                                    </EmptyState.Header>
                                    <EmptyState.Content>
                                        <EmptyState.Title>{t.nenhumEvento}</EmptyState.Title>
                                        <EmptyState.Description>{t.nenhumEventoDica}</EmptyState.Description>
                                    </EmptyState.Content>
                                </EmptyState>
                            )}
                        </div>
                    </Surgir>
                    {carregando && <EsqueletoDaLista />}
                    <div hidden={carregando} className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                        <AnimatePresence initial={false} mode="popLayout">
                            {visiveis.map((resumo) => (
                                <motion.div
                                    key={resumo.evento.id}
                                    layout={!reduzir}
                                    initial={{ opacity: 0, scale: reduzir ? 1 : 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: reduzir ? 1 : 0.96 }}
                                    transition={{ duration: reduzir ? 0.12 : DURACAO_TRANSICAO, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <EventoCard resumo={resumo} onOpen={(href) => abrir(resumo.evento, href)} onEditar={() => editar(resumo.evento)} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </section>
            </div>
        </BackstageLayout>
    );
}

const EventoCard = ({ resumo, onOpen, onEditar }: { resumo: ResumoEvento; onOpen: (href?: string) => void; onEditar: () => void }) => {
    const { evento } = resumo;
    const { t, locale } = useTextosEventos();
    // "17 de out. de 2026": formato do idioma, mês em minúscula no português (UI-TXT-009).
    const dataCurta = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(evento.data));

    return (
        // Foco do teclado no botão que cobre o cartão aparece no cartão inteiro (WCAG 2.4.7).
        <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary outline-focus-ring transition duration-100 ease-linear hover:ring-brand has-[>button:focus-visible]:outline-2 has-[>button:focus-visible]:outline-offset-2">
            {/* O botão principal cobre o cartão inteiro; o menu "..." escapa dele como irmão
                posterior no DOM (fica por cima na pintura) e para a propagação do clique,
                então nunca dispara a navegação do cartão. */}
            <button type="button" onClick={() => onOpen()} className="flex flex-col text-left outline-hidden after:absolute after:inset-0">
                <div className="aspect-[3/4] w-full overflow-hidden bg-secondary">
                    <img
                        src={evento.cover}
                        alt=""
                        aria-hidden="true"
                        className="size-full object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                    />
                </div>

                <div className="flex flex-col gap-1.5 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-tertiary">{dataCurta}</span>
                        <Badge size="sm" type="pill-color" color={EVENTO_STATUS_BADGE_COLOR[evento.status]}>
                            {t.status[evento.status]}
                        </Badge>
                    </div>
                    <h3 className="line-clamp-3 text-sm font-semibold text-primary">{evento.nome}</h3>
                </div>
            </button>

            <div className="absolute top-3 right-3 z-10">
                <Dropdown.Root>
                    <ButtonUtility
                        size="sm"
                        color="secondary"
                        icon={DotsVertical}
                        tooltip={formatar(t.maisAcoes, { evento: evento.nome })}
                        className="bg-primary/70 backdrop-blur-md"
                    />
                    <Dropdown.Popover className="w-40" placement="bottom end">
                        <Dropdown.Menu>
                            {/* Excluir volta quando houver regra de exclusão (UI-EST-005: nada de opção sem destino). */}
                            <Dropdown.Item id="editar" label={t.editar} onAction={onEditar} />
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            </div>
        </article>
    );
};

/** Subtítulo da página: conta os eventos ativos; carregando, uma linha de esqueleto. */
function Subtitulo({ carregando, ativos }: { carregando: boolean; ativos: number }) {
    const { t, plural } = useTextosEventos();
    if (carregando) return <span aria-hidden="true" className="mt-1 h-4 w-28 animate-pulse rounded bg-secondary motion-reduce:animate-none" />;
    return <p className="text-sm text-tertiary">{plural(t.eventosAtivos, ativos)}</p>;
}

/** "Criar evento" com o menu de tipos (EVT-50): no cabeçalho e no vazio da organização. */
function CriarEventoMenu({ posicao = "bottom end" }: { posicao?: "bottom" | "bottom end" }) {
    const navigate = useNavigate();
    const { t } = useTextosEventos();
    return (
        <Dropdown.Root>
            <Button size="md" color="primary" iconLeading={Plus} iconTrailing={ChevronDown}>
                {t.criarEvento}
            </Button>
            <Dropdown.Popover className="w-56" placement={posicao}>
                <Dropdown.Menu aria-label={t.tipoDoEvento} onAction={(tipo) => navigate(`/backstage/eventos/novo?tipo=${tipo}`)}>
                    {TIPOS_DE_EVENTO.map((tipo) => (
                        <Dropdown.Item key={tipo.id} id={tipo.id} label={t.tipos[tipo.id]} icon={tipo.icon} />
                    ))}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
}

/**
 * Resumo da organização. Desktop: três cartões lado a lado. Celular: os três empilhados, todos
 * visíveis, sem esconder métrica atrás de seletor ou de rolagem lateral (UI-MOB-004).
 */
function ResumoDaOrganizacao({ ritmo, carregando }: { ritmo: RitmoOrganizacao; carregando: boolean }) {
    const { t, plural } = useTextosEventos();
    const { brl, brlCompacto, numero } = useFormatos();

    const cartoes: Record<Metrica, ReactNode> = {
        faturamento: (
            <CartaoMetrica
                grafico
                icon={CurrencyDollarCircle}
                label={t.metricas.faturamento}
                formatarDia={brl}
                valor={brl(ritmo.gmv.total)}
                ritmo={ritmo.gmv}
                ritmoValor={brlCompacto(ritmo.gmv.porDia)}
                ritmoFrase={t.metricas.porDia}
            />
        ),
        produtos: (
            <CartaoMetrica
                grafico
                icon={ShoppingBag01}
                label={t.metricas.produtos}
                formatarDia={numero}
                valor={numero(ritmo.produtos.total)}
                ritmo={ritmo.produtos}
                ritmoValor={numero(ritmo.produtos.porDia)}
                ritmoFrase={plural(t.metricas.produtosPorDia, Math.round(ritmo.produtos.porDia), { valor: "{valor}" })}
            />
        ),
        ingressos: (
            <CartaoMetrica
                grafico
                icon={Ticket01}
                label={t.metricas.ingressos}
                formatarDia={numero}
                valor={numero(ritmo.ingressos.total)}
                ritmo={ritmo.ingressos}
                ritmoValor={numero(ritmo.ingressos.porDia)}
                ritmoFrase={plural(t.metricas.ingressosPorDia, Math.round(ritmo.ingressos.porDia), { valor: "{valor}" })}
            />
        ),
    };

    const esqueleto = <div aria-hidden="true" className="h-[22rem] animate-pulse rounded-xl bg-primary ring-1 ring-border-secondary motion-reduce:animate-none" />;

    return (
        <section aria-labelledby="titulo-resumo" className="flex flex-col gap-3">
            <h2 id="titulo-resumo" className="sr-only">
                {t.resumo}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {METRICAS.map((m) => (
                    <div key={m}>{carregando ? esqueleto : cartoes[m]}</div>
                ))}
            </div>
        </section>
    );
}

/** Esqueleto da lista enquanto o banco carrega: a mesma grade dos cartões de evento. */
function EsqueletoDaLista() {
    const { t } = useTextosEventos();
    return (
        <div role="status" aria-label={t.carregando} className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} aria-hidden="true" className="flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                    <div className="aspect-[3/4] w-full animate-pulse bg-secondary motion-reduce:animate-none" />
                    <div className="flex flex-col gap-2 p-3">
                        <span className="h-3.5 w-24 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
                        <span className="h-4 w-full animate-pulse rounded bg-secondary motion-reduce:animate-none" />
                    </div>
                </div>
            ))}
        </div>
    );
}
