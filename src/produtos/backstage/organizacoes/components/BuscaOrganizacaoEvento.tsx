import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowDown, ArrowUp, CornerDownLeft, SearchLg } from "@untitledui/icons";
import {
    Autocomplete as AriaAutocomplete,
    Collection as AriaCollection,
    Header as AriaHeader,
    Input as AriaInput,
    ListBox as AriaListBox,
    ListBoxItem as AriaListBoxItem,
    ListBoxSection as AriaListBoxSection,
    TextField as AriaTextField,
} from "react-aria-components";
import { CommandMenuNavigationIcon } from "@/components/application/command-menus/base-components/command-menu-navigation-icon";
import { CommandShortcut } from "@/components/application/command-menus/base-components/command-shortcut";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { organizacaoDoEvento, slugificar, useBanco, type Evento } from "@/plataforma";
import { cx } from "@/utils/cx";
import { EVENTO_STATUS_BADGE_COLOR, EVENTO_STATUS_LABEL, setEventoAtual } from "../../eventos/data/eventos";
import { lerRecentes, organizacaoAtualId, setOrganizacaoAtual, useOrganizacaoVersao, useOrganizacoes, type OrganizacaoComEventos } from "../data/organizacao-atual";

/* ------------------------------------------------------------------ */
/*  Busca de organização ou evento                                     */
/*                                                                     */
/*  Um componente, dois lugares: a tela de entrada do Backstage e o    */
/*  modal de troca (⌘K) na shell. Mesmas regras: ORG-01 a ORG-12.      */
/*  Base: command menu do Untitled UI (Autocomplete + ListBox do       */
/*  React Aria), com itens próprios para organização e evento.        */
/* ------------------------------------------------------------------ */

type Item =
    | { id: string; tipo: "organizacao"; org: OrganizacaoComEventos; atual?: boolean }
    | { id: string; tipo: "evento"; evento: Evento; org?: OrganizacaoComEventos };

interface Secao {
    id: string;
    titulo: string;
    itens: Item[];
}

/** Compara sem acento e sem caixa. (O slugificar devolve "evento" para texto vazio: trate antes.) */
const normalizar = (t: string) => (t.trim() ? slugificar(t).replace(/-/g, " ") : "");

const dataCurta = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(d).replace(/\./g, "");
};

const contagem = (n: number) => (n === 0 ? "Nenhum evento ativo" : n === 1 ? "1 evento ativo" : `${n} eventos ativos`);

// Os mais próximos de hoje primeiro: quem procura um evento quase sempre quer o que está vendendo.
const pertoDeHoje = (a: Evento, b: Evento) => Math.abs(new Date(a.data).getTime() - Date.now()) - Math.abs(new Date(b.data).getTime() - Date.now());

function montarSecoes(orgs: OrganizacaoComEventos[], termo: string, variante: "pagina" | "modal"): Secao[] {
    const porId = new Map(orgs.map((o) => [o.id, o]));
    const q = normalizar(termo.trim());
    const itemEvento = (e: Evento): Item => ({ id: `ev:${e.id}`, tipo: "evento", evento: e, org: porId.get(organizacaoDoEvento(e)) });

    if (!q) {
        const atualId = variante === "modal" ? organizacaoAtualId() : null;
        const atual = atualId ? porId.get(atualId) : undefined;
        const recentes = lerRecentes()
            .filter((id) => id !== atual?.id)
            .map((id) => porId.get(id))
            .filter((o): o is OrganizacaoComEventos => !!o);
        const secoes: Secao[] = [];
        if (atual) secoes.push({ id: "atual", titulo: "Organização selecionada", itens: [{ id: `org:${atual.id}`, tipo: "organizacao", org: atual, atual: true }] });
        if (recentes.length) secoes.push({ id: "recentes", titulo: "Recentes", itens: recentes.map((o) => ({ id: `recente:${o.id}`, tipo: "organizacao", org: o })) });
        secoes.push({ id: "todas", titulo: "Todas as organizações", itens: orgs.map((o) => ({ id: `todas:${o.id}`, tipo: "organizacao", org: o })) });
        // ORG-05: o estado inicial lista organizações e eventos.
        const eventos = orgs.flatMap((o) => o.eventos).sort(pertoDeHoje);
        if (eventos.length) secoes.push({ id: "eventos", titulo: "Todos os eventos", itens: eventos.map(itemEvento) });
        return secoes;
    }

    const orgsAchadas = orgs.filter((o) => normalizar(`${o.nome} ${o.sigla}`).includes(q));
    const eventos = orgs
        .flatMap((o) => o.eventos)
        .filter((e) => e.id.toLowerCase() === termo.trim().toLowerCase() || normalizar(`${e.nome} ${e.local} ${e.cidade ?? ""}`).includes(q))
        .sort(pertoDeHoje);

    const secoes: Secao[] = [];
    if (orgsAchadas.length) secoes.push({ id: "orgs", titulo: "Organizações", itens: orgsAchadas.map((o) => ({ id: `org:${o.id}`, tipo: "organizacao", org: o })) });
    if (eventos.length) secoes.push({ id: "eventos", titulo: "Eventos", itens: eventos.map(itemEvento) });
    return secoes;
}

/** Escolha aplicada: organização → Eventos; evento → organização dele + evento em contexto → Vendas. */
export function useEscolherResultado(aoEscolher?: () => void) {
    const navigate = useNavigate();
    return (item: Item) => {
        if (item.tipo === "organizacao") {
            setOrganizacaoAtual(item.org.id);
            navigate("/backstage/eventos");
        } else {
            setOrganizacaoAtual(organizacaoDoEvento(item.evento));
            setEventoAtual(item.evento.id);
            navigate("/backstage/relatorios/vendas-por-grupo");
        }
        aoEscolher?.();
    };
}

interface BuscaProps {
    variante: "pagina" | "modal";
    /** Chamado depois de escolher (o modal fecha). */
    aoEscolher?: () => void;
    className?: string;
}

export function BuscaOrganizacaoEvento({ variante, aoEscolher, className }: BuscaProps) {
    const [termo, setTermo] = useState("");
    const { modo, erro } = useBanco();
    useOrganizacaoVersao();
    const orgs = useOrganizacoes();
    const secoes = useMemo(() => montarSecoes(orgs, termo, variante), [orgs, termo, variante]);
    const itens = useMemo(() => new Map(secoes.flatMap((s) => s.itens).map((i) => [i.id, i])), [secoes]);
    const escolher = useEscolherResultado(aoEscolher);
    const carregando = modo === "carregando" && orgs.length === 0;

    return (
        <div className={cx("relative flex min-h-0 flex-col", className)}>
            <AriaAutocomplete inputValue={termo} onInputChange={setTermo}>
                <AriaTextField aria-label="Buscar organização ou evento" autoFocus className="border-b border-secondary">
                    <div className="flex items-center gap-2 px-4 py-3.5">
                        <SearchLg className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        <AriaInput
                            placeholder="Buscar organização ou evento"
                            className="w-full bg-transparent text-md text-primary outline-hidden placeholder:text-placeholder"
                        />
                        {variante === "modal" && <CommandShortcut keys={["⌘K"]} className="max-md:hidden" />}
                    </div>
                </AriaTextField>

                {carregando ? (
                    <ListaCarregando />
                ) : erro && orgs.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                        <p className="text-sm text-tertiary">Não foi possível carregar as organizações.</p>
                        <Button size="sm" color="secondary" onClick={() => window.location.reload()}>
                            Tentar de novo
                        </Button>
                    </div>
                ) : (
                    <AriaListBox
                        aria-label="Organizações e eventos"
                        items={secoes}
                        selectionMode="none"
                        onAction={(key) => {
                            const item = itens.get(String(key));
                            if (item) escolher(item);
                        }}
                        renderEmptyState={() => (
                            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                                <p className="text-sm text-tertiary">
                                    Nenhuma organização ou evento com “<span className="font-semibold text-secondary">{termo.trim()}</span>”.
                                </p>
                                <Button size="sm" color="secondary" onClick={() => setTermo("")}>
                                    Limpar busca
                                </Button>
                            </div>
                        )}
                        className={cx(
                            "flex flex-col gap-1 overflow-y-auto pt-1 pb-2 outline-hidden",
                            variante === "modal" ? "max-h-[min(26rem,60vh)]" : "max-h-[min(30rem,calc(100vh-18rem))]",
                        )}
                    >
                        {(secao) => (
                            <AriaListBoxSection id={secao.id} className="border-b border-secondary pb-1 last:border-transparent">
                                <AriaHeader className="px-4.5 pt-2.5 pb-1 text-xs font-semibold text-tertiary">{secao.titulo}</AriaHeader>
                                <AriaCollection items={secao.itens}>{(item) => <Linha item={item} />}</AriaCollection>
                            </AriaListBoxSection>
                        )}
                    </AriaListBox>
                )}
            </AriaAutocomplete>

            <footer className="flex items-center justify-between gap-3 border-t border-secondary px-4 py-2 max-md:hidden">
                <div className="flex items-center gap-2">
                    <CommandMenuNavigationIcon type="icon" icon={ArrowUp} />
                    <CommandMenuNavigationIcon type="icon" icon={ArrowDown} />
                    <span className="text-sm font-semibold text-quaternary">para navegar</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-quaternary">para selecionar</span>
                    <CommandMenuNavigationIcon type="icon" icon={CornerDownLeft} />
                </div>
            </footer>
        </div>
    );
}

const Linha = ({ item }: { item: Item }) => {
    const rotulo = item.tipo === "organizacao" ? item.org.nome : item.evento.nome;
    return (
        <AriaListBoxItem id={item.id} textValue={rotulo} className="group block cursor-pointer px-2 py-0.5 outline-hidden">
            {({ isFocused, isFocusVisible }) => (
                <div
                    className={cx(
                        "flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-2 outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover",
                        isFocused && "bg-primary_hover",
                        isFocusVisible && "outline-2 outline-offset-2",
                    )}
                >
                    {item.tipo === "organizacao" ? <LinhaOrganizacao item={item} /> : <LinhaEvento evento={item.evento} org={item.org} />}
                </div>
            )}
        </AriaListBoxItem>
    );
};

const LinhaOrganizacao = ({ item }: { item: Extract<Item, { tipo: "organizacao" }> }) => (
    <>
        <Avatar size="sm" initials={item.org.sigla} alt="" />
        <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-primary">{item.org.nome}</span>
            <span className="truncate text-sm text-tertiary">{contagem(item.org.ativos)}</span>
        </div>
        {item.atual && (
            <Badge size="sm" type="pill-color" color="gray">
                Atual
            </Badge>
        )}
    </>
);

const LinhaEvento = ({ evento, org }: { evento: Evento; org?: OrganizacaoComEventos }) => (
    <>
        {evento.capa ? (
            <img src={evento.capa} alt="" className="size-8 shrink-0 rounded-md object-cover" />
        ) : (
            <Avatar size="sm" initials={org?.sigla ?? "?"} alt="" />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-primary">{evento.nome}</span>
            <span className="truncate text-sm text-tertiary">
                {[org?.nome ?? evento.produtora, dataCurta(evento.data), evento.cidade ?? evento.local].filter(Boolean).join(", ")}
            </span>
        </div>
        <Badge size="sm" type="pill-color" color={EVENTO_STATUS_BADGE_COLOR[evento.status]} className="shrink-0">
            {EVENTO_STATUS_LABEL[evento.status]}
        </Badge>
    </>
);

const ListaCarregando = () => (
    <div className="flex flex-col gap-1 px-2 py-2" aria-busy="true" aria-label="Carregando organizações">
        {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-2.5 py-2">
                <span className="size-8 shrink-0 animate-pulse rounded-full bg-tertiary" />
                <div className="flex flex-1 flex-col gap-1.5">
                    <span className="h-3 w-2/5 animate-pulse rounded bg-tertiary" />
                    <span className="h-3 w-1/4 animate-pulse rounded bg-tertiary" />
                </div>
            </div>
        ))}
    </div>
);
