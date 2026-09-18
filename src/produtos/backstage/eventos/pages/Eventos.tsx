import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
    CurrencyDollarCircle,
    DotsVertical,
    Plus,
    SearchLg,
    ShoppingBag01,
    Ticket01,
} from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Badge } from "@/components/base/badges/badges";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { InputBase } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { BackstageLayout } from "../../components/Backstage";
import { RemixMark } from "../../components/remix/RemixPanel";
import { useRemix } from "../../components/remix/remix-context";
import { CriarEventoModal } from "../../components/CriarEventoModal";
import { CartaoMetrica } from "../components/CartaoMetrica";
import { EVENTO_STATUS_BADGE_COLOR, EVENTO_STATUS_LABEL, setEventoAtual, useEventosVersao, vendasHabilitadas, type Evento } from "../data/eventos";
import {
    alertasPorEvento,
    brl,
    brlCompacto,
    numero,
    precisaAtencao,
    resumos,
    ritmoDaOrganizacao,
    type ResumoEvento,
} from "../data/vendas";

type Filtro = "atencao" | "ativos" | "rascunhos" | "encerrados" | "todos";
type Ordem = "data" | "ocupacao" | "faturamento" | "ritmo";

const FILTROS: Array<{ id: Filtro; label: string }> = [
    { id: "atencao", label: "Precisam de atenção" },
    { id: "ativos", label: "Ativos" },
    { id: "rascunhos", label: "Rascunhos" },
    { id: "encerrados", label: "Encerrados" },
    { id: "todos", label: "Todos" },
];

const ORDENS = [
    { id: "data", label: "Data do evento" },
    { id: "ocupacao", label: "Ocupação" },
    { id: "faturamento", label: "Faturamento" },
    { id: "ritmo", label: "Ritmo de vendas" },
];

/** Camada 1 — painel da organização: como estão os eventos e onde agir hoje. */
export function Eventos() {
    const navigate = useNavigate();
    const { abrir: abrirRemix } = useRemix();
    const [term, setTerm] = useState("");
    const [filtro, setFiltro] = useState<Filtro>("ativos");
    const [ordem, setOrdem] = useState<Ordem>("data");
    const [criarAberto, setCriarAberto] = useState(false);

    /* Toda mudança de status vem do modal global (aberto por evento na sidebar ou por
       aqui, sempre depois de setEventoAtual) — a listagem precisa recalcular ao vivo em
       vez de ficar presa ao snapshot do primeiro render. */
    const versaoEventos = useEventosVersao();
    const todos = useMemo(resumos, [versaoEventos]);
    const porEvento = useMemo(alertasPorEvento, []);
    const comAtencao = todos.filter((r) => precisaAtencao(porEvento.get(r.evento.id)));

    const ativos = todos.filter((r) => vendasHabilitadas(r.evento.status));

    const totais = useMemo(() => {
        const faturamento = ativos.reduce((total, r) => total + r.faturamento, 0);
        const ingressos = ativos.reduce((total, r) => total + r.vendidos, 0);
        const itens = ativos.reduce(
            (total, r) => total + (r.vendas?.serie ?? []).reduce((t, d) => t + d.ingressos + d.produtos, 0),
            0,
        );
        return { faturamento, ingressos, itens, ticket: faturamento / Math.max(1, ingressos) };
    }, [ativos]);

    const ritmo = useMemo(() => ritmoDaOrganizacao(ativos), [ativos]);

    const visiveis = useMemo(() => {
        const query = term.trim().toLowerCase();
        const porFiltro = todos.filter((r) => {
            if (filtro === "atencao") return precisaAtencao(porEvento.get(r.evento.id));
            if (filtro === "ativos") return vendasHabilitadas(r.evento.status);
            if (filtro === "rascunhos") return r.evento.status === "rascunho";
            if (filtro === "encerrados") return r.evento.status === "encerrado";
            return true;
        });
        const porBusca = query
            ? porFiltro.filter((r) => `${r.evento.nome} ${r.evento.produtor} ${r.evento.local}`.toLowerCase().includes(query))
            : porFiltro;

        return [...porBusca].sort((a, b) => {
            if (ordem === "ocupacao") return b.ocupacao - a.ocupacao;
            if (ordem === "faturamento") return b.faturamento - a.faturamento;
            if (ordem === "ritmo") return b.ritmo7 - a.ritmo7;
            return new Date(a.evento.data).getTime() - new Date(b.evento.data).getTime();
        });
    }, [todos, porEvento, term, filtro, ordem]);

    const abrir = (evento: Evento, href = "/backstage/relatorios/vendas-por-grupo") => {
        setEventoAtual(evento.id);
        navigate(href);
    };

    const editar = (evento: Evento) => {
        setEventoAtual(evento.id);
        navigate("/backstage/informacoes-evento");
    };

    return (
        <BackstageLayout activeProducer="eventos" showEventContext={false}>
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-display-xs font-bold text-primary">Eventos</h1>
                        <p className="text-sm text-tertiary">
                            {ativos.length} {ativos.length === 1 ? "evento ativo" : "eventos ativos"}
                        </p>
                    </div>
                    <Button size="md" color="primary" iconLeading={Plus} onClick={() => setCriarAberto(true)}>
                        Criar evento
                    </Button>
                </header>

                <CriarEventoModal
                    isOpen={criarAberto}
                    onClose={() => setCriarAberto(false)}
                    onCriado={() => {
                        toast.success("Evento criado como rascunho.");
                        navigate("/backstage/informacoes-evento");
                    }}
                />

                {/* Resumo da organização */}
                <section className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h2 className="text-md font-semibold text-primary">Eventos ativos</h2>
                        {/*
                          "Ritmo" é o termo da casa, mas sozinho não diz de que janela
                          se fala. A definição fica escrita uma vez, no topo, em vez de
                          repetida em cada cartão.
                        */}
                        <p className="text-sm text-tertiary">
                            Abaixo do total, o <strong className="font-semibold text-secondary">ritmo</strong>: média por dia dos últimos 7
                            dias, comparada com os 7 anteriores. A curva mostra os últimos 30 dias.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <CartaoMetrica
                            grafico
                            icon={CurrencyDollarCircle}
                            label="GMV confirmado"
                            valor={brl(totais.faturamento)}
                            ritmo={ritmo.gmv}
                            ritmoLabel={brlCompacto(ritmo.gmv.porDia)}
                            ritmoSufixo="por dia"
                        />
                        <CartaoMetrica
                            grafico
                            icon={ShoppingBag01}
                            label="Itens vendidos"
                            valor={numero(totais.itens)}
                            ritmo={ritmo.itens}
                            ritmoLabel={numero(ritmo.itens.porDia)}
                            ritmoSufixo="itens por dia"
                        />
                        <CartaoMetrica
                            grafico
                            icon={Ticket01}
                            label="Ingressos vendidos"
                            valor={numero(totais.ingressos)}
                            ritmo={ritmo.ingressos}
                            ritmoLabel={numero(ritmo.ingressos.porDia)}
                            ritmoSufixo="ingressos por dia"
                        />
                        {/* Quarto lugar da fileira: em vez de repetir mais um número (ticket
                            médio já cabe dentro dos outros três em espírito), um convite
                            direto para perguntar — o Remix já existe no produto e sabe
                            responder sobre os eventos da organização; só faltava um ponto
                            de entrada aqui. */}
                        <button
                            type="button"
                            onClick={() => abrirRemix()}
                            className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-xl bg-brand-solid p-5 text-center transition duration-100 ease-linear hover:bg-brand-solid_hover"
                        >
                            <RemixMark className="size-8 text-white" />
                            <span className="flex flex-col gap-1">
                                <span className="text-sm font-semibold text-white">Pergunte ao Remix</span>
                                <span className="text-sm text-white/80">Tire dúvidas sobre o desempenho dos eventos</span>
                            </span>
                        </button>
                    </div>
                </section>

                {/* Listagem: filtros, busca e ordenação vivem dentro do mesmo cartão dos
                    eventos, sempre presente (mesmo vazio), para o contêiner não aparecer e
                    desaparecer conforme o resultado da busca. */}
                <div className="flex flex-col gap-4 rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        {/* Rolagem lateral no mobile: quatro filtros não cabem em 375px. */}
                        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                            <ButtonGroup
                                size="sm"
                                selectedKeys={[filtro]}
                                disallowEmptySelection
                                onSelectionChange={(keys) => {
                                    const next = [...keys][0];
                                    if (next) setFiltro(next as Filtro);
                                }}
                            >
                                {FILTROS.map((item) => (
                                    <ButtonGroupItem key={item.id} id={item.id}>
                                        {item.id === "atencao" ? `Atenção (${comAtencao.length})` : item.label}
                                    </ButtonGroupItem>
                                ))}
                            </ButtonGroup>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="md:w-[260px]">
                                <InputBase
                                    size="sm"
                                    icon={SearchLg}
                                    value={term}
                                    aria-label="Buscar evento"
                                    onChange={(event) => setTerm(event.target.value)}
                                    placeholder="Buscar por nome, produtor ou local"
                                />
                            </div>
                            <div className="md:w-[190px]">
                                <Select
                                    aria-label="Ordenar por"
                                    size="sm"
                                    selectedKey={ordem}
                                    onSelectionChange={(key) => setOrdem(String(key) as Ordem)}
                                    items={ORDENS}
                                >
                                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Listagem */}
                    {visiveis.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center py-16">
                            <EmptyState size="sm">
                                <EmptyState.Header>
                                    <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <EmptyState.Title>Nenhum evento encontrado</EmptyState.Title>
                                    <EmptyState.Description>Tente outro filtro, nome, produtor ou local.</EmptyState.Description>
                                </EmptyState.Content>
                            </EmptyState>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                            {visiveis.map((resumo) => (
                                <EventoCard
                                    key={resumo.evento.id}
                                    resumo={resumo}
                                    onOpen={(href) => abrir(resumo.evento, href)}
                                    onEditar={() => editar(resumo.evento)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </BackstageLayout>
    );
}

const EventoCard = ({
    resumo,
    onOpen,
    onEditar,
}: {
    resumo: ResumoEvento;
    onOpen: (href?: string) => void;
    onEditar: () => void;
}) => {
    const { evento } = resumo;
    const dataCurta = `${evento.day} ${evento.month} ${new Date(evento.data).getFullYear()}`;

    return (
        <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary transition duration-100 ease-linear hover:ring-brand">
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
                            {EVENTO_STATUS_LABEL[evento.status]}
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
                        tooltip={`Mais ações para ${evento.nome}`}
                        className="bg-primary/70 backdrop-blur-md"
                    />
                    <Dropdown.Popover className="w-40" placement="bottom end">
                        <Dropdown.Menu>
                            <Dropdown.Item id="editar" label="Editar" onAction={onEditar} />
                            <Dropdown.Item
                                id="excluir"
                                label="Excluir"
                                onAction={() => toast.error("Exclusão de evento ainda não está disponível neste protótipo.")}
                            />
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            </div>
        </article>
    );
};
