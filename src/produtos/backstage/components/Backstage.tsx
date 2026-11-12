import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ComponentType, type CSSProperties, type FC, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLocation, useNavigate } from "react-router";
import { Button as AriaButton, MenuItem as AriaMenuItem, type Key } from "react-aria-components";
import {
    Announcement01,
    UsersPlus,
    Calendar,
    LayoutGrid01,
    ChevronDown,
    ChevronRight,
    ChevronSelectorVertical,
    DotsGrid,
    CoinsHand,
    File03,
    Globe01,
    InfoCircle,
    LayoutLeft,
    LayoutTop,
    LogOut01,
    Menu02,
    Moon01,
    Settings01,
    ShoppingCart01,
    LayersTwo01,
    ClipboardCheck,
    Sun,
    Ticket01,
    XClose,
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { NavButton } from "@/components/application/app-navigation/base-components/nav-button";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { Dot } from "@/components/foundations/dot-icon";
import { cx } from "@/utils/cx";
import LogoBlack from "../../../assets/Company logo_black.svg";
import LogoWhite from "../../../assets/Company logo_white.svg";
import { AlterarStatusModal, ORDEM_STATUS } from "../eventos/components/AlterarStatusModal";
import { EVENTO_STATUS_BADGE_COLOR, EVENTO_STATUS_LABEL, eventos, setEventoAtual, setEventoStatus, useEventoAtual, useEventosVersao, type EventoStatus } from "../eventos/data/eventos";

/** Logo da Ingresse, clicável, leva para a home do Backstage.
 *  O alvo era a altura da imagem, 20px: no telefone só acertava quem mirasse bem. O padding leva
 *  o alvo a 44px e as margens negativas devolvem o espaço ao layout, para a barra do telefone não
 *  crescer 8px em toda página. */
const BrandLogo = ({ className }: { className?: string }) => {
    const navigate = useNavigate();
    const painel = usePainel();
    return (
        <button
            type="button"
            onClick={() => navigate(INICIO_DO_PAINEL[painel])}
            aria-label={painel === "freepass" ? "Ir para o início do Freepass" : "Ir para a home do Backstage"}
            className="-mx-1 -my-1.5 flex shrink-0 items-center rounded-md px-1 py-3 transition-opacity duration-100 ease-linear hover:opacity-80"
        >
            <img src={LogoBlack} alt="Ingresse" className={cx("block dark:hidden", className)} />
            <img src={LogoWhite} alt="Ingresse" className={cx("hidden dark:block", className)} />
        </button>
    );
};
import { ICONES_ORGANIZACAO } from "./icones-organizacao";
import { abrirSeletorDeOrganizacao, SeletorOrganizacaoModal } from "../organizacoes/components/SeletorOrganizacaoModal";
import { useOrganizacaoAtual } from "../organizacoes/data/organizacao-atual";
import { useTheme } from "@/providers/theme-provider";
import { ThemeToggle } from "./ThemeToggle";
import { RemixDock } from "./remix/RemixShell";
import { GuiaDeConfiguracao } from "../guia-de-configuracao/components/guia-de-configuracao";
import { AbasDeEmissao, LayoutDeRelatorios, ROTAS_COM_ABAS_DE_EMISSAO } from "./navegacao-de-secao";
import { setTodosOsEventos, useTodosOsEventos } from "./escopo-dos-relatorios";
/** Telas do evento usam o alerta do guia por aqui, sem importar de outro projeto. */
export { AlertaDoGuia, PARAMETRO_NOVO_SETOR } from "../guia-de-configuracao/components/guia-de-configuracao";
export { prepararGuiaDoEventoNovo } from "../guia-de-configuracao/data/memoria";
import { INICIO_DO_PAINEL, usePainel } from "./painel";
import "./transicao-de-tela.css";
import { USUARIO as USUARIO_FREEPASS, abrirEventoNoPainel, useAcessoNoEvento, useMinhasVendas, useSemearComissarios, type AcessoNoEvento } from "../freepass/data/minhas-vendas";
import { FUNCAO_INFO, funcaoDaTela, setVisualizacao, useFuncoesDisponiveis, useVisualizacao, type Funcao, type Visualizacao } from "../freepass/data/funcoes";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

export type BackstageSection =
    | "equipe-e-permissoes"
    | "informacoes-evento"
    | "itens"
    | "questionario"
    | "pesquisas"
    | "cortesias"
    | "equipe-e-comissarios"
    | "relatorios"
    | "comissarios"
    | "marketing";

export type BackstageItem =
    | "informacoes-gerais"
    | "permissao-envio"
    | "catalogo-itens"
    | "catalogo-ingressos"
    | "catalogo-combos"
    | "catalogo-produtos"
    | "catalogo-aberturas"
    | "catalogo-configuracoes"
    | "catalogo-questionario"
    | "emissao-cortesias"
    | "bilheteria-online"
    | "equipe-e-comissarios"
    | "vendas-por-grupo"
    | "transacoes"
    | "acesso"
    | "bordero"
    | "transferencias"
    | "comparativos"
    | "relatorio-personalizado"
    | "relatorio-questionarios"
    | "relatorio-comissarios"
    | "chave-de-acesso"
    | "minhas-vendas-evento"
    | "formularios-compra";

const DISABLED_KEYS: Key[] = [];

/** Uma única instância do modal de status vive no BackstageLayout — qualquer
 *  gatilho dentro do contexto do evento (card desktop, topo mobile, drawer
 *  mobile, ou uma página inteira como "Informações do evento") abre essa
 *  mesma instância em vez de criar a sua própria. */
const EventStatusModalContext = createContext<(statusInicial?: EventoStatus) => void>(() => {});
export const useAbrirModalDeStatus = () => useContext(EventStatusModalContext);

interface BackstageLayoutProps {
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
    activeProducer?: string;
    /** Mostra o contexto do evento (card + funcionalidades). Default: true. */
    showEventContext?: boolean;
    /** Mostra o switch flutuante de variante de layout (clássico/topbar). Default: true. */
    showLayoutSwitcher?: boolean;
    children: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Variante de layout — alterna entre a shell clássica (rails         */
/*  laterais) e a nova (barra da organização no topo). Persistida em   */
/*  localStorage para sobreviver à navegação entre páginas.            */
/* ------------------------------------------------------------------ */

type LayoutVariant = "classic" | "topbar";
const LAYOUT_STORAGE_KEY = "backstage-layout-variant";

function useLayoutVariant(): [LayoutVariant, (v: LayoutVariant) => void] {
    const [variant, setVariant] = useState<LayoutVariant>(() => {
        if (typeof window === "undefined") return "classic";
        return window.localStorage.getItem(LAYOUT_STORAGE_KEY) === "topbar" ? "topbar" : "classic";
    });
    const update = useCallback((v: LayoutVariant) => {
        setVariant(v);
        try {
            window.localStorage.setItem(LAYOUT_STORAGE_KEY, v);
        } catch {
            /* ignora ambientes sem storage */
        }
    }, []);
    return [variant, update];
}

// O switch de layout é ferramenta de protótipo: fica oculto e alterna com Shift+L.
// Estado no módulo para continuar visível ao navegar entre páginas.
let switcherVisivel = false;
const switcherListeners = new Set<() => void>();

function useSwitcherVisivel() {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const alvo = e.target as HTMLElement | null;
            const digitando = alvo?.closest("input, textarea, select, [contenteditable='true']");
            if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== "l" || digitando) return;
            switcherVisivel = !switcherVisivel;
            switcherListeners.forEach((l) => l());
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);
    return useSyncExternalStore(
        (fn) => {
            switcherListeners.add(fn);
            return () => switcherListeners.delete(fn);
        },
        () => switcherVisivel,
    );
}

/**
 * Respiro padrão entre o conteúdo da tela e a moldura do template (rails, topo, Remix), o mesmo da
 * tela de Eventos. Fica só aqui: as telas não definem padding externo próprio.
 */
const RESPIRO_DO_CONTEUDO = "px-4 pb-6 md:px-6";

export function BackstageLayout({
    activeSection,
    activeItem,
    activeProducer,
    showEventContext = true,
    showLayoutSwitcher = true,
    children,
}: BackstageLayoutProps) {
    const [menuMobile, setMenuMobile] = useState<MenuMobile>(null);
    const { pathname, search } = useLocation();
    // Navegar fecha o menu do celular (o menu do evento navega pelos links da árvore).
    useEffect(() => setMenuMobile(null), [pathname]);
    const [variant, setVariant] = useLayoutVariant();
    const mostrarSwitcher = useSwitcherVisivel();
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusInicial, setStatusInicial] = useState<EventoStatus | undefined>(undefined);
    const eventoAtual = useEventoAtual();
    // Freepass: a mesma shell, sem o que é só da produtora (BKS-60 a BKS-66).
    const freepass = usePainel() === "freepass";
    useSemearComissarios(freepass);
    // Relatórios são da organização (BKS-26): sem o menu do evento e com o item Relatórios ativo no menu da organização.
    const relatoriosNaOrganizacao = !freepass && activeSection === "relatorios";
    if (relatoriosNaOrganizacao) {
        showEventContext = false;
        activeProducer = "relatorios";
    }
    // Ao entrar nos Relatórios (BKS-27): pelo menu do evento (`?de=evento`), filtra pelo evento; por
    // qualquer outro caminho (menu da organização), abre em "Todos os eventos". Só na entrada:
    // trocar de relatório dentro deles mantém a escolha do topo.
    const deEvento = new URLSearchParams(search).get("de") === "evento";
    useLayoutEffect(() => {
        if (relatoriosNaOrganizacao && !ultimaTelaFoiRelatorio) setTodosOsEventos(!deEvento);
        ultimaTelaFoiRelatorio = relatoriosNaOrganizacao;
    }, [pathname, relatoriosNaOrganizacao, deEvento]);
    // Última tela do evento, para o "voltar para o evento" dos Relatórios.
    useEffect(() => {
        if (!showEventContext || freepass) return;
        try {
            window.sessionStorage.setItem(ULTIMA_TELA_DO_EVENTO, pathname);
        } catch {
            /* sem storage, o voltar cai em Informações do evento */
        }
    }, [showEventContext, freepass, pathname]);
    const visao = useVisualizacao();
    // Freepass por funcionalidade (FCO-85): sem menu do evento; a funcionalidade é o item ativo do
    // menu de cima e o evento se troca numa barra acima da tela.
    const porFuncao = freepass && visao === "funcionalidade";
    const funcaoAtual = porFuncao && showEventContext ? funcaoDaTela(activeSection, activeItem) : null;
    if (funcaoAtual) activeProducer = funcaoAtual;
    const railDoEvento = showEventContext && !porFuncao;
    const barraDoFreepass = freepass && <BarraDoFreepass funcao={funcaoAtual} telaDeEvento={showEventContext} />;

    const abrirModalDeStatus = useCallback((status?: EventoStatus) => {
        setStatusInicial(status);
        setStatusModalOpen(true);
    }, []);

    useEffect(() => {
        if (!menuMobile) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuMobile(null);
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [menuMobile]);

    const mobileChrome = (
        <>
            <MobileTopBar menu={menuMobile} onMenu={setMenuMobile} showEventContext={railDoEvento} telaDeEvento={showEventContext} />
            {menuMobile === "org" && (
                <PainelMobile topo="56px" rotulo="Menu da organização" onFechar={() => setMenuMobile(null)}>
                    <PainelDaOrganizacao activeProducer={activeProducer} onFechar={() => setMenuMobile(null)} />
                </PainelMobile>
            )}
            {menuMobile === "evento" && railDoEvento && (
                <PainelMobile topo="113px" rotulo="Menu do evento" onFechar={() => setMenuMobile(null)}>
                    <div className="flex-1 px-2 py-3">
                        <EventFunctionalitiesList activeSection={activeSection} activeItem={activeItem} />
                    </div>
                    {!freepass && <StatusNoMenuMobile />}
                </PainelMobile>
            )}
        </>
    );

    const statusModal = showEventContext && !freepass && (
        <AlterarStatusModal
            isOpen={statusModalOpen}
            onClose={() => setStatusModalOpen(false)}
            statusAtual={eventoAtual.status}
            statusInicial={statusInicial}
            onConfirm={(novoStatus) => setEventoStatus(eventoAtual.id, novoStatus)}
        />
    );

    // Seções que viraram um item só no menu (BKS-25): Relatórios com o menu empilhado; Emissão com abas nas listas.
    // A navegação fica fora da transição de tela, para não piscar ao trocar de relatório ou de aba.
    const tela = <TransicaoDeTela>{children}</TransicaoDeTela>;
    const abaDeEmissao = !freepass ? ROTAS_COM_ABAS_DE_EMISSAO[pathname] : undefined;
    const corpo =
        relatoriosNaOrganizacao ? (
            <LayoutDeRelatorios ativo={activeItem} topo={<EventoDosRelatorios />} voltarPara={destinoDoVoltarAoEvento}>
                {tela}
            </LayoutDeRelatorios>
        ) : abaDeEmissao ? (
            <AbasDeEmissao ativa={abaDeEmissao}>{tela}</AbasDeEmissao>
        ) : (
            tela
        );

    // Guia de configuração do evento (guia-de-configuracao/rules.md): segue o produtor pelas telas do evento.
    const guiaDeConfiguracao = showEventContext && !freepass && <GuiaDeConfiguracao eventoId={eventoAtual.id} abrirModalDeStatus={abrirModalDeStatus} />;

    if (variant === "topbar") {
        return (
            <EventStatusModalContext.Provider value={abrirModalDeStatus}>
                <div
                    className="min-h-screen bg-primary_alt"
                    style={{ "--bs-header-offset": "64px" } as CSSProperties}
                >
                    {mobileChrome}
                    <OrgTopBar activeProducer={activeProducer} telaDeEvento={showEventContext} />
                    <div className="flex flex-col gap-3 px-2 py-3 md:flex-row md:gap-6 md:px-6 md:py-6">
                        <RailDoEventoAnimado visivel={railDoEvento} folga={24} render={(fantasma) => <EventRailTop activeSection={fantasma ? undefined : activeSection} activeItem={fantasma ? undefined : activeItem} />} />
                        {/* overflow-x-clip: desenhos decorativos (círculos do estado vazio) não alargam a página no celular (BKS-19). */}
                        <main className="flex min-w-0 flex-1 flex-col overflow-x-clip">
                            <div className={cx("mx-auto flex w-full max-w-[1088px] flex-1 flex-col", RESPIRO_DO_CONTEUDO)}>
                                {barraDoFreepass}
                                {corpo}
                            </div>
                        </main>
                        {!freepass && <RemixDock />}
                    </div>
                    {showLayoutSwitcher && mostrarSwitcher && <LayoutSwitcher variant={variant} onChange={setVariant} />}
                    {statusModal}
                    {guiaDeConfiguracao}
                    {!freepass && <SeletorOrganizacaoModal />}
                </div>
            </EventStatusModalContext.Provider>
        );
    }

    return (
        <EventStatusModalContext.Provider value={abrirModalDeStatus}>
            <div className="min-h-screen bg-primary_alt">
                {mobileChrome}
                <div className="flex min-h-screen flex-col gap-3 px-2 py-3 md:flex-row md:px-3 md:py-6">
                    <ProducerRail activeProducer={activeProducer} />
                    <RailDoEventoAnimado visivel={railDoEvento} folga={12} render={(fantasma) => <EventRail activeSection={fantasma ? undefined : activeSection} activeItem={fantasma ? undefined : activeItem} />} />
                    {/* overflow-x-clip: desenhos decorativos (círculos do estado vazio) não alargam a página no celular (BKS-19). */}
                    <main className={cx("flex min-w-0 flex-1 flex-col overflow-x-clip", RESPIRO_DO_CONTEUDO)}>
                        {barraDoFreepass}
                        {corpo}
                    </main>
                    {!freepass && <RemixDock />}
                </div>
                {showLayoutSwitcher && mostrarSwitcher && <LayoutSwitcher variant={variant} onChange={setVariant} />}
                {statusModal}
                {guiaDeConfiguracao}
                {!freepass && <SeletorOrganizacaoModal />}
            </div>
        </EventStatusModalContext.Provider>
    );
}

/** Remonta a cada troca de tela para a entrada animar (BKS-15, transicao-de-tela.css). */
const TransicaoDeTela = ({ children }: { children: ReactNode }) => {
    const { pathname } = useLocation();
    const eventoId = useEventoAtual().id;
    return (
        <div key={`${pathname}:${eventoId}`} className="bs-tela flex min-w-0 flex-1 flex-col">
            {children}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Switch flutuante para alternar entre as duas shells.               */
/* ------------------------------------------------------------------ */

const LAYOUT_OPTIONS = [
    { id: "classic", icon: LayoutLeft, label: "Clássico" },
    { id: "topbar", icon: LayoutTop, label: "Novo" },
] as const;

const LayoutSwitcher = ({ variant, onChange }: { variant: LayoutVariant; onChange: (v: LayoutVariant) => void }) => (
    <div className="fixed bottom-4 right-4 z-50 hidden items-center gap-1 rounded-full bg-primary p-1 shadow-lg ring-1 ring-border-secondary md:flex">
        {LAYOUT_OPTIONS.map((opt) => {
            const active = variant === opt.id;
            return (
                <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange(opt.id)}
                    aria-pressed={active}
                    className={cx(
                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition duration-100 ease-linear",
                        active ? "bg-secondary text-primary ring-1 ring-border-secondary" : "text-tertiary hover:text-secondary_hover",
                    )}
                >
                    <opt.icon className="size-4" aria-hidden="true" />
                    {opt.label}
                </button>
            );
        })}
    </div>
);

/* ------------------------------------------------------------------ */
/*  Mobile top bar + drawer                                           */
/* ------------------------------------------------------------------ */

type MenuMobile = "org" | "evento" | null;

/** Botão de menu da barra (☰, grade ou ×), como o "_Nav menu button" do Figma. */
const BotaoDoMenu = ({ aberto, icone: Icone, rotulo, onClick }: { aberto: boolean; icone: FC<{ className?: string }>; rotulo: string; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        aria-expanded={aberto}
        aria-label={aberto ? `Fechar ${rotulo}` : `Abrir ${rotulo}`}
        className="flex shrink-0 items-center justify-center rounded-md p-2 text-fg-secondary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover focus-visible:outline-2"
    >
        {aberto ? <XClose className="size-5" aria-hidden="true" /> : <Icone className="size-5" aria-hidden="true" />}
    </button>
);

/**
 * Celular (Figma AFTER DS, "_mobile_org menu" e "navbar-event-mobile"): duas barras empilhadas.
 * A da organização (logo e grade) abre os módulos da organização; a do evento (☰, capa, nome e
 * status) abre o menu do evento. Cada uma abre o próprio painel logo abaixo dela.
 */
const MobileTopBar = ({ menu, onMenu, showEventContext, telaDeEvento }: { menu: MenuMobile; onMenu: (m: MenuMobile) => void; showEventContext?: boolean; telaDeEvento?: boolean }) => {
    const freepass = usePainel() === "freepass";
    const evento = useEventoAtual();
    const alternar = (m: Exclude<MenuMobile, null>) => onMenu(menu === m ? null : m);
    return (
        <header className="sticky top-0 z-40 md:hidden">
            <div className="flex h-14 items-center justify-between border-b border-secondary bg-primary py-3 pr-3 pl-4">
                <BrandLogo className="h-5" />
                <span className="flex items-center gap-1">
                    {freepass && <EngrenagemDoFreepass telaDeEvento={telaDeEvento} />}
                    <BotaoDoMenu aberto={menu === "org"} icone={DotsGrid} rotulo={freepass ? "menu do Freepass" : "menu da organização"} onClick={() => alternar("org")} />
                </span>
            </div>
            {/* Com o menu da organização aberto, só a barra dela fica (como no Figma). */}
            {showEventContext && menu !== "org" && (
                <div className="flex items-center gap-3 border-b border-secondary bg-primary px-4 py-2">
                    <BotaoDoMenu aberto={menu === "evento"} icone={Menu02} rotulo="menu do evento" onClick={() => alternar("evento")} />
                    <img src={evento.cover} alt="" className="h-10 w-[30px] shrink-0 rounded-xxs object-cover" />
                    <p className="line-clamp-2 min-w-0 flex-1 text-sm font-medium text-primary" title={evento.nome}>
                        {evento.nome}
                    </p>
                    <Badge size="sm" type="pill-color" color={EVENTO_STATUS_BADGE_COLOR[evento.status]} className="shrink-0">
                        {EVENTO_STATUS_LABEL[evento.status]}
                    </Badge>
                </div>
            )}
        </header>
    );
};

/** Painel aberto pela barra: fundo escurecido com desfoque e conteúdo à esquerda, 64 px antes da borda. */
const PainelMobile = ({ topo, rotulo, onFechar, children }: { topo: string; rotulo: string; onFechar: () => void; children: ReactNode }) => (
    <div className="fixed inset-x-0 bottom-0 z-30 flex md:hidden" style={{ top: topo }} role="dialog" aria-modal="true" aria-label={rotulo}>
        <button
            type="button"
            aria-label="Fechar menu"
            tabIndex={-1}
            onClick={onFechar}
            className="absolute inset-0 bg-overlay/70 backdrop-blur-[8px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
        />
        <div className="relative flex h-full w-[calc(100%-64px)] flex-col overflow-y-auto bg-primary shadow-xl motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-200">
            {children}
        </div>
    </div>
);

/** Ordem dos módulos na grade do celular, como no Figma. */
const ORDEM_ORG_MOBILE = ["eventos", "equipe", "financas", "produtos", "publico", "pedidos", "ajustes"];

/** Usuário fictício do protótipo (o mesmo do Figma). */
const USUARIO = { nome: "Olivia Rhye", email: "olivia@untitledui.com", iniciais: "OR" };

/** Menu da organização no celular: troca de organização, módulos em grade e conta no rodapé. */
const PainelDaOrganizacao = ({ activeProducer, onFechar }: { activeProducer?: string; onFechar: () => void }) => {
    const navigate = useNavigate();
    const org = useOrganizacaoAtual();
    const freepass = usePainel() === "freepass";
    const nav = useOrgNav();
    const usuario = freepass ? USUARIO_FREEPASS : USUARIO;
    const { theme, setTheme } = useTheme();
    const escuro = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    return (
        <>
            <div className="flex flex-1 flex-col gap-5 p-4">
                {/* No Freepass não há troca de organização: a pessoa vê os eventos de todas que a liberaram (BKS-63). */}
                {!freepass && (
                <button
                    type="button"
                    onClick={() => {
                        onFechar();
                        abrirSeletorDeOrganizacao();
                    }}
                    aria-label={org ? `Organização: ${org.nome}. Trocar organização` : "Trocar organização"}
                    className="relative flex w-full items-center gap-2 rounded-xl border border-secondary bg-primary_alt p-3 text-left outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover focus-visible:outline-2"
                >
                    <Avatar size="md" rounded={false} initials={org?.sigla ?? "?"} alt="" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-primary">{org?.nome ?? "Organização"}</span>
                    <ChevronSelectorVertical className="absolute top-[13px] right-[13px] size-4 text-fg-quaternary" aria-hidden="true" />
                </button>
                )}
                <nav aria-label={freepass ? "Áreas do Freepass" : "Módulos da organização"} className="grid grid-cols-3 gap-x-4 gap-y-6">
                    {(freepass ? nav : ORDEM_ORG_MOBILE.map((id) => nav.find((i) => i.id === id)!)).map((item) => {
                        const atual = activeProducer === item.id || (item.id === "eventos" && !activeProducer);
                        return (
                            <button
                                key={item.id}
                                type="button"
                                disabled={!item.href}
                                aria-current={atual ? "page" : undefined}
                                onClick={() => {
                                    if (!item.href) return;
                                    navigate(item.href);
                                    onFechar();
                                }}
                                className="group flex flex-col items-center gap-1 rounded-md outline-focus-ring focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className={cx("flex items-center justify-center rounded-md p-3 text-fg-quaternary transition duration-100 ease-linear group-enabled:group-hover:bg-primary_hover", atual && "bg-primary_hover text-fg-secondary")}>
                                    <item.icon className="size-5" />
                                </span>
                                <span className="text-center text-xs font-medium text-secondary">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
            <div className="px-4 pb-4">
                <Dropdown.Root>
                    <AriaButton className="flex w-full items-center gap-2 border-t border-secondary pt-4 text-left outline-focus-ring focus-visible:outline-2">
                        <Avatar size="md" initials={usuario.iniciais} status="online" alt="" />
                        <span className="flex min-w-0 flex-1 flex-col text-sm">
                            <span className="truncate font-semibold text-primary">{usuario.nome}</span>
                            <span className="truncate text-tertiary">{usuario.email}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    </AriaButton>
                    <Dropdown.Popover className="w-64" placement="top end">
                        <Dropdown.Menu>
                            <Dropdown.Item id="idioma" icon={Globe01} label="Alterar idioma" />
                            <Dropdown.Item
                                id="cores"
                                icon={escuro ? Moon01 : Sun}
                                label="Alterar cores"
                                addon={escuro ? "Escuro" : "Claro"}
                                onAction={() => setTheme(escuro ? "light" : "dark")}
                            />
                            <Dropdown.Separator />
                            <Dropdown.Item id="sair" icon={LogOut01} label="Sair" />
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            </div>
        </>
    );
};

const SECTION_LABELS: Record<BackstageSection, string> = {
    "equipe-e-permissoes": "Equipe e Permissões",
    "informacoes-evento": "Informações do evento",
    itens: "Itens",
    questionario: "Questionário",
    pesquisas: "Coleta de dados",
    cortesias: "Emissão de ingressos",
    "equipe-e-comissarios": "Equipe e Comissários",
    relatorios: "Relatórios",
    comissarios: "Comissários",
    marketing: "Marketing",
};

const ITEM_LABELS: Record<BackstageItem, string> = {
    "permissao-envio": "Permissão de envio",
    "catalogo-itens": "Itens",
    "catalogo-ingressos": "Ingressos",
    "catalogo-combos": "Combos",
    "catalogo-produtos": "Produtos",
    "catalogo-aberturas": "Aberturas de vendas",
    "catalogo-configuracoes": "Configurações de ingressos",
    "catalogo-questionario": "Questionário",
    "emissao-cortesias": "Cortesia",
    "bilheteria-online": "Bilheteria online",
    "equipe-e-comissarios": "Equipe e Comissários",
    "vendas-por-grupo": "Vendas",
    transacoes: "Transações",
    acesso: "Acesso",
    bordero: "Borderô",
    transferencias: "Transferências",
    comparativos: "Comparativos",
    "relatorio-personalizado": "Relatório personalizado",
    "relatorio-questionarios": "Respostas do questionário",
    "relatorio-comissarios": "Comissários",
    "chave-de-acesso": "Chave de acesso",
    "minhas-vendas-evento": "Minhas vendas",
    "formularios-compra": "Perguntas por ingresso",
};

const MobileSectionSelector = ({
    activeSection,
    activeItem,
}: {
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const sectionLabel = activeSection ? SECTION_LABELS[activeSection] : null;
    const itemLabel = activeItem ? ITEM_LABELS[activeItem] : null;
    const breadcrumb = sectionLabel
        ? itemLabel
            ? `${sectionLabel} › ${itemLabel}`
            : sectionLabel
        : "Selecionar seção";

    return (
        <div className="flex flex-col">
            <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                aria-expanded={isOpen}
                className={cx(
                    "flex items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3 text-left ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary_hover",
                    isOpen && "ring-2 ring-brand",
                )}
            >
                <span className="truncate text-sm font-semibold text-primary">
                    {breadcrumb}
                </span>
                <ChevronDown
                    className={cx(
                        "size-5 shrink-0 text-fg-secondary transition-transform duration-150",
                        isOpen && "rotate-180",
                    )}
                />
            </button>
            {isOpen && (
                <div className="mt-2 rounded-xl bg-secondary p-2 ring-1 ring-border-secondary">
                    <EventFunctionalitiesList
                        activeSection={activeSection}
                        activeItem={activeItem}
                    />
                </div>
            )}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/*  Menu de funcionalidades — versão MOBILE (accordion touch).         */
/* ------------------------------------------------------------------ */

interface EventNavItem {
    id: BackstageItem;
    label: string;
    href: string;
    novo?: boolean;
    ia?: boolean;
}
interface EventNavSection {
    id: BackstageSection;
    label: string;
    icon: FC<{ className?: string }>;
    novo?: boolean;
    /** Seção que é ela mesma o destino, sem itens (ex.: Gerenciamento de cotas). */
    href?: string;
    /** Mantém o grupo mesmo com um destino só (o nome do destino diz mais que o da seção). */
    grupo?: boolean;
    /** Vazio = seção sem destino (apenas rótulo, desabilitada). */
    items: EventNavItem[];
}

/**
 * Seção que vira um destino só (a linha leva direto à página). Vale para o desktop e o celular, que
 * leem a mesma lista: um menu, um desenho (UI-DS-003).
 */
const ehDestinoUnico = (sec: EventNavSection) => !!sec.href || (sec.items.length === 1 && !sec.grupo);
/** Página da seção que é destino único. */
const destinoDaSecao = (sec: EventNavSection) => sec.href ?? sec.items[0]?.href;
/** Telas que se dizem de outra seção, mas moram dentro de um item do menu (BKS-25): a Bilheteria é aba de Emissão de ingressos. */
const SECOES_ABRIGADAS: Record<string, string> = { bilheteria: "cortesias" };

/** Destino que ainda não existe ("#") ou seção sem destino: aparece desativado. */
const ehDesativado = (href?: string) => !href || href === "#";

/** Menu do evento. "Novo" nos itens, não no grupo: no rail de 280 px o selo cortava o nome da seção. */
const EVENT_NAV: EventNavSection[] = [
    {
        id: "informacoes-evento", label: "Informações do evento", icon: InfoCircle, items: [
            { id: "informacoes-gerais", label: "Informações do evento", href: "/backstage/informacoes-evento" },
        ],
    },
    // Ordem do menu do evento: BKS-07.
    {
        // Itens é uma página só, com abas (BKS-17, components/abas-de-itens.tsx): no menu, um destino único.
        id: "itens", label: "Itens", icon: ShoppingCart01, items: [{ id: "catalogo-ingressos", label: "Itens", href: "/backstage/catalogo/ingressos" }],
    },
    {
        // Um item só: Cortesia e Bilheteria online viram abas (BKS-25, navegacao-de-secao.tsx).
        id: "cortesias", label: "Emissão de ingressos", icon: Ticket01, items: [{ id: "emissao-cortesias", label: "Emissão de ingressos", href: "/backstage/cortesias" }],
    },
    // Equipe de operação e Comissários do evento viraram um destino só (ECO-01).
    { id: "equipe-e-comissarios", label: "Equipe e Comissários", icon: UsersPlus, novo: true, items: [{ id: "equipe-e-comissarios", label: "Equipe e Comissários", href: "/backstage/evento/equipe" }] },
    // Questionário não é item vendido: fica fora da página de Itens, num destino próprio (BKS-18).
    { id: "questionario", label: "Questionário", icon: ClipboardCheck, items: [{ id: "catalogo-questionario", label: "Questionário", href: "/backstage/catalogo/questionario" }] },
    // Um item só, direto para Chave de acesso (BKS-25).
    { id: "marketing", label: "Marketing", icon: Announcement01, items: [{ id: "chave-de-acesso", label: "Marketing", href: "/backstage/marketing/chave-de-acesso" }] },
    // Um item só: os relatórios ficam num menu empilhado dentro da tela (BKS-25, navegacao-de-secao.tsx).
    // Relatórios moram na organização (BKS-26); daqui, abre com o "voltar para o evento".
    { id: "relatorios", label: "Relatórios", icon: File03, items: [{ id: "vendas-por-grupo", label: "Relatórios", href: "/backstage/relatorios/vendas-por-grupo?de=evento" }] },
];



/**
 * Menu do evento no Freepass (BKS-65): Minhas vendas e só os canais de emissão que a produtora
 * liberou para a pessoa neste evento, com as mesmas telas do Backstage. Pausado, só Minhas vendas.
 */
function navDoFreepass(acesso: AcessoNoEvento | null): EventNavSection[] {
    const funcoes = acesso?.funcoes ?? [];
    const emissao: EventNavItem[] = [];
    if (funcoes.includes("cortesia")) emissao.push({ id: "emissao-cortesias", label: "Cortesia", href: "/freepass/cortesias" });
    if (funcoes.includes("bilheteria")) emissao.push({ id: "bilheteria-online", label: "Bilheteria online", href: "/freepass/bilheteria" });
    return [
        ...(funcoes.includes("vendas")
            ? [{ id: "comissarios" as const, label: "Minhas vendas", icon: CoinsHand, items: [{ id: "minhas-vendas-evento" as const, label: "Minhas vendas", href: "/freepass/evento/vendas" }] }]
            : []),
        ...(emissao.length > 0 ? [{ id: "cortesias" as const, label: "Emissão de ingressos", icon: Ticket01, grupo: true, items: emissao }] : []),
    ];
}

const ItemBadges = ({ item }: { item: EventNavItem }) => (
    <>
        {item.novo && <Badge size="sm" type="pill-color" color="brand">Novo</Badge>}
        {item.ia && <Badge size="sm" type="pill-color" color="brand">IA</Badge>}
    </>
);


interface ProducerRailItemProps {
    icon: ComponentType<{ className?: string }>;
    label: string;
    isActive?: boolean;
    href?: string;
}

const ProducerRailItem = ({ icon: Icon, label, isActive, href }: ProducerRailItemProps) => {
    const navigate = useNavigate();
    return (
        <button
            type="button"
            onClick={href ? () => navigate(href) : undefined}
            className={cx(
                "flex w-full flex-col items-center gap-1 rounded-md py-2 transition duration-100 ease-linear",
                isActive ? "text-secondary" : "text-tertiary hover:text-secondary_hover",
            )}
        >
            <span
                className={cx(
                    "flex size-10 items-center justify-center rounded-lg transition duration-100 ease-linear",
                    isActive ? "bg-tertiary" : "hover:bg-secondary_hover",
                )}
            >
                <Icon className="size-5" />
            </span>
            <span className="text-center text-xs font-medium leading-tight whitespace-pre-line">{label}</span>
        </button>
    );
};

/** Organização em contexto no rail clássico: avatar com a sigla; abre a troca (ORG-20). */
const OrganizacaoRail = () => {
    const org = useOrganizacaoAtual();
    if (usePainel() === "freepass") return <Avatar size="md" initials={USUARIO_FREEPASS.iniciais} alt={USUARIO_FREEPASS.nome} />;
    return (
        <button
            type="button"
            onClick={abrirSeletorDeOrganizacao}
            aria-label={org ? `Organização: ${org.nome}. Trocar organização` : "Trocar organização"}
            title={org?.nome}
            className="relative rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
        >
            <Avatar size="md" initials={org?.sigla ?? "?"} alt="" />
            <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-primary ring-1 ring-secondary">
                <ChevronDown className="size-3 text-fg-quaternary" />
            </span>
        </button>
    );
};

/** Chip da organização em contexto: barra do topo e gaveta mobile. Abre a troca (ORG-20). */
const OrganizacaoChip = ({ className, largo }: { className?: string; largo?: boolean }) => {
    const org = useOrganizacaoAtual();
    if (usePainel() === "freepass")
        return (
            <span className={cx("flex min-w-0 shrink-0 items-center gap-2", className)}>
                <Avatar size="xs" initials={USUARIO_FREEPASS.iniciais} alt="" />
                <span className="max-w-48 truncate text-sm font-semibold text-primary">{USUARIO_FREEPASS.nome}</span>
            </span>
        );
    return (
        <button
            type="button"
            onClick={abrirSeletorDeOrganizacao}
            aria-label={org ? `Organização: ${org.nome}. Trocar organização` : "Trocar organização"}
            className={cx(
                "flex min-w-0 shrink-0 items-center gap-2 rounded-full bg-secondary py-1.5 pr-2.5 pl-1.5 ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary_hover",
                largo && "w-full rounded-lg py-2",
                className,
            )}
        >
            <Avatar size="xs" initials={org?.sigla ?? "?"} alt="" />
            <span className={cx("truncate text-sm font-semibold text-primary", largo ? "flex-1 text-left" : "max-w-48")}>{org?.nome ?? "Organização"}</span>
            <ChevronDown className="size-4 shrink-0 text-fg-quaternary" />
        </button>
    );
};

const ProducerRail = ({ activeProducer }: { activeProducer?: string }) => {
    const nav = useOrgNav();
    return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[100px] shrink-0 flex-col px-1 items-center justify-between rounded-2xl bg-primary py-4 lg:flex">
        <div className="flex flex-col items-center gap-4">
            <OrganizacaoRail />
            <nav className="flex flex-col items-center gap-1">
                {nav.map((item) => (
                    <ProducerRailItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        isActive={activeProducer === item.id || (item.id === "eventos" && !activeProducer)}
                    />
                ))}
            </nav>
        </div>
        <ThemeToggle />
    </aside>
    );
};

interface EventRailProps {
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
}

/** Scrollbar suave (fino, track transparente, thumb em cor de borda) — evita
 *  o contraste alto do scrollbar global dentro do card branco do menu. */
const SOFT_SCROLLBAR =
    "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--color-border-secondary)] hover:[&::-webkit-scrollbar-thumb]:bg-[var(--color-border-primary)]";

/**
 * Rail do evento: cartão compacto e menu. Ao abrir a página, rola até o item ativo e o marca como a
 * página atual (UI-NAV-004), para ele nunca ficar abaixo da dobra.
 */
const RailDoEvento = ({ activeSection, activeItem, className }: EventRailProps & { className: string }) => {
    const ref = useRef<HTMLElement>(null);
    useEffect(() => {
        // Espera o grupo do item abrir (o menu expande num efeito) antes de medir.
        const id = window.setTimeout(() => {
            const rail = ref.current;
            if (!rail) return;
            rail.querySelectorAll('[aria-current="page"]').forEach((el) => el.removeAttribute("aria-current"));
            const linha = rail.querySelector(".item-ativo")?.closest('[role="row"]');
            if (!linha) return;
            linha.setAttribute("aria-current", "page");
            const r = rail.getBoundingClientRect();
            const l = linha.getBoundingClientRect();
            if (l.bottom > r.bottom - 12 || l.top < r.top) rail.scrollTop += l.top - r.top - r.height / 3;
        }, 60);
        return () => window.clearTimeout(id);
    }, [activeSection, activeItem]);
    return (
        <aside ref={ref} className={cx("hidden w-[280px] shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl bg-primary p-3 md:flex", SOFT_SCROLLBAR, className)}>
            <EventDetailsCard />
            <EventFunctionalitiesList activeSection={activeSection} activeItem={activeItem} />
        </aside>
    );
};

const EventRail = (props: EventRailProps) => <RailDoEvento {...props} className="sticky top-6 h-[calc(100vh-3rem)]" />;

/*
 * Entrada e saída do rail do evento (BKS-29). Cada tela monta o próprio layout, então o rail some e
 * volta a cada rota: guardamos se a tela anterior tinha rail. Entrando no evento, ele desliza da
 * esquerda para a direita; saindo para a organização, uma cópia dele desliza da direita para a
 * esquerda enquanto encolhe, e o conteúdo ocupa o espaço. Entre telas do evento, fica parado.
 */
let railNaTelaAnterior = false;
const ENTRADA_DO_RAIL = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };
const SAIDA_DO_RAIL = { duration: 0.3, ease: [0.4, 0, 1, 1] as const };

const RailDoEventoAnimado = ({ visivel, folga, render }: { visivel: boolean; folga: number; render: (fantasma: boolean) => ReactNode }) => {
    const reduzir = useReducedMotion();
    const [entra] = useState(() => visivel && !railNaTelaAnterior);
    const [sai, setSai] = useState(() => !visivel && railNaTelaAnterior);
    useEffect(() => {
        railNaTelaAnterior = visivel;
    }, [visivel]);

    if (visivel)
        return (
            <motion.div
                className="hidden shrink-0 md:block"
                initial={entra && !reduzir ? { x: -48, opacity: 0 } : false}
                animate={{ x: 0, opacity: 1 }}
                transition={ENTRADA_DO_RAIL}
            >
                {render(false)}
            </motion.div>
        );
    if (!sai || reduzir) return null;
    return (
        <motion.div
            aria-hidden="true"
            inert
            className="hidden shrink-0 overflow-hidden md:block"
            initial={{ width: 280, marginRight: 0, x: 0, opacity: 1 }}
            animate={{ width: 0, marginRight: -folga, x: -48, opacity: 0 }}
            transition={SAIDA_DO_RAIL}
            onAnimationComplete={() => setSai(false)}
        >
            <div className="h-full w-[280px]">{render(true)}</div>
        </motion.div>
    );
};

/* ------------------------------------------------------------------ */
/*  Nova shell — barra horizontal da organização no topo.              */
/* ------------------------------------------------------------------ */

const ORG_NAV: Array<{ id: string; icon: ComponentType<{ className?: string }>; label: string; href?: string }> = [
    { id: "eventos", icon: ICONES_ORGANIZACAO.eventos, label: "Eventos", href: "/backstage/eventos" },
    { id: "relatorios", icon: ICONES_ORGANIZACAO.relatorios, label: "Relatórios", href: "/backstage/relatorios/vendas-por-grupo" },
    // Comissários saiu da organização (ECO-09): o item volta a ser só Membros.
    { id: "equipe", icon: ICONES_ORGANIZACAO.membros, label: "Membros", href: "/backstage/membros" },
    { id: "financas", icon: ICONES_ORGANIZACAO.financas, label: "Finanças" },
    { id: "pedidos", icon: ICONES_ORGANIZACAO.pedidos, label: "Pedidos", href: "/backstage/pedidos" },
    { id: "produtos", icon: ICONES_ORGANIZACAO.produtos, label: "Produtos", href: "/backstage/produtos" },
    { id: "publico", icon: ICONES_ORGANIZACAO.publico, label: "Público", href: "/backstage/publico" },
    { id: "ajustes", icon: ICONES_ORGANIZACAO.ajustes, label: "Ajustes" },
];

/**
 * Freepass: só o que é da pessoa (BKS-62). Por evento: Eventos. Por funcionalidade: uma entrada
 * por funcionalidade que ela tem em algum evento. Recebimentos só para quem vende pelo link.
 */
function useOrgNav(): typeof ORG_NAV {
    const freepass = usePainel() === "freepass";
    const visao = useVisualizacao();
    const funcoes = useFuncoesDisponiveis();
    if (!freepass) return ORG_NAV;
    const recebimentos = funcoes.includes("vendas") ? [{ id: "recebimentos", icon: ICONES_ORGANIZACAO.financas, label: "Recebimentos", href: "/freepass/recebimentos" }] : [];
    if (visao === "evento") return [{ id: "eventos", icon: ICONES_ORGANIZACAO.eventos, label: "Eventos", href: "/freepass/eventos" }, ...recebimentos];
    return [...funcoes.map((f) => ({ id: f, icon: FUNCAO_INFO[f].icone, label: FUNCAO_INFO[f].rotulo, href: FUNCAO_INFO[f].lista })), ...recebimentos];
}

/* ------------------------------------------------------------------ */
/*  Freepass: engrenagem da visualização e troca de evento             */
/* ------------------------------------------------------------------ */

const VISUALIZACOES: Array<{ id: Visualizacao; label: string; icon: FC<{ className?: string }> }> = [
    { id: "evento", label: "Por evento", icon: Calendar },
    { id: "funcionalidade", label: "Por funcionalidade", icon: LayoutGrid01 },
];

/**
 * Engrenagem do canto superior direito (FCO-86): alterna entre ver por evento (como o Backstage)
 * e por funcionalidade. Numa tela de evento, fica nela; numa lista, volta para o início da visão.
 */
const EngrenagemDoFreepass = ({ telaDeEvento }: { telaDeEvento?: boolean }) => {
    const navigate = useNavigate();
    const visao = useVisualizacao();
    return (
        <Dropdown.Root>
            <ButtonUtility icon={Settings01} size="sm" color="tertiary" tooltip="Visualização do Freepass" aria-label="Visualização do Freepass" />
            <Dropdown.Popover className="w-60" placement="bottom end">
                <Dropdown.Menu
                    aria-label="Visualização do Freepass"
                    selectionMode="single"
                    selectedKeys={[visao]}
                    onAction={(k) => {
                        const nova = k as Visualizacao;
                        if (nova === visao) return;
                        setVisualizacao(nova);
                        if (!telaDeEvento) navigate("/freepass");
                    }}
                >
                    {VISUALIZACOES.map((v) => (
                        <Dropdown.Item key={v.id} id={v.id} icon={v.icon} label={v.label} />
                    ))}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
};

/** Troca de evento dentro da funcionalidade, no lugar do menu do evento (FCO-85). */
const ULTIMA_TELA_DO_EVENTO = "backstage-ultima-tela-do-evento";

/** De onde o "voltar para o evento" dos Relatórios volta: a última tela do evento aberta, ou Informações do evento. */
export function destinoDoVoltarAoEvento() {
    try {
        return window.sessionStorage.getItem(ULTIMA_TELA_DO_EVENTO) ?? "/backstage/informacoes-evento";
    } catch {
        return "/backstage/informacoes-evento";
    }
}

/** A tela anterior era um relatório? Sobrevive à troca de página (cada página monta o próprio layout). */
let ultimaTelaFoiRelatorio = false;

/** Topo dos Relatórios: qual evento está sendo visto, com a troca entre os eventos da organização (BKS-26). */
const EventoDosRelatorios = () => {
    useEventosVersao();
    const todos = useTodosOsEventos();
    return (
        <CabecaDeEvento
            legenda={todos ? "Relatórios da organização" : "Relatórios do evento"}
            atual={todos ? { id: "todos", nome: "Todos os eventos" } : undefined}
            opcoes={[{ id: "todos", nome: "Todos os eventos" }, ...eventos.map((e) => ({ id: e.id, nome: e.nome }))]}
            onEscolher={(id) => {
                if (id === "todos") return setTodosOsEventos(true);
                setTodosOsEventos(false);
                setEventoAtual(id);
            }}
        />
    );
};

/**
 * Evento em contexto com a troca de evento: capa, legenda e o nome que abre a lista. Usado na barra do
 * Freepass (eventos da pessoa) e no topo dos Relatórios (eventos da organização, BKS-26).
 */
export const CabecaDeEvento = ({
    legenda,
    opcoes,
    onEscolher,
    atual,
}: {
    legenda: string;
    opcoes: Array<{ id: string; nome: string }>;
    onEscolher: (id: string) => void;
    /** Mostra outra coisa no lugar do evento em contexto (ex.: "Todos os eventos"), com ícone no lugar da capa. */
    atual?: { id: string; nome: string };
}) => {
    const evento = useEventoAtual();
    return (
        <div className="flex min-w-0 items-center gap-3">
            {atual ? (
                <span className="flex h-10 w-[30px] shrink-0 items-center justify-center rounded-xxs bg-secondary ring-1 ring-secondary ring-inset" aria-hidden="true">
                    <LayersTwo01 className="size-4 text-fg-quaternary" />
                </span>
            ) : (
                <img src={evento.cover} alt="" className="h-10 w-[30px] shrink-0 rounded-xxs object-cover" />
            )}
            <div className="flex min-w-0 flex-col">
                <span className="text-sm text-tertiary">{legenda}</span>
                <Dropdown.Root>
                    <AriaButton className="flex min-w-0 items-center gap-1 rounded-md text-left text-md font-semibold text-primary outline-focus-ring hover:text-secondary_hover focus-visible:outline-2">
                        <span className="truncate">{atual?.nome ?? evento.nome}</span>
                        <ChevronDown className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                    </AriaButton>
                    <Dropdown.Popover className="w-80" placement="bottom start">
                        <Dropdown.Menu aria-label="Trocar evento" selectionMode="single" selectedKeys={[atual?.id ?? evento.id]} onAction={(k) => onEscolher(String(k))}>
                            {opcoes.map((o) => (
                                <Dropdown.Item key={o.id} id={o.id} label={o.nome} />
                            ))}
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown.Root>
            </div>
        </div>
    );
};

const TrocaDeEvento = ({ funcao }: { funcao: Funcao }) => {
    const { participacoes } = useMinhasVendas();
    const opcoes = participacoes.filter((p) => p.funcoes.includes(funcao));
    return (
        <CabecaDeEvento
            legenda={`${FUNCAO_INFO[funcao].titulo} do evento`}
            opcoes={opcoes.map((p) => ({ id: p.evento.id, nome: p.evento.nome }))}
            onEscolher={(id) => {
                const p = opcoes.find((x) => x.evento.id === id);
                if (p) abrirEventoNoPainel(p.evento);
            }}
        />
    );
};

/**
 * Barra acima da tela no Freepass: a troca de evento (por funcionalidade) e a engrenagem no canto
 * superior direito. No celular a engrenagem fica na barra do topo; na shell Novo, na barra da organização.
 */
const BarraDoFreepass = ({ funcao, telaDeEvento }: { funcao: Funcao | null; telaDeEvento?: boolean }) => {
    const [variant] = useLayoutVariant();
    const engrenagemAqui = variant === "classic";
    if (!funcao && !engrenagemAqui) return null;
    return (
        <div className={cx("flex items-center justify-between gap-3 pb-4", !funcao && "max-md:hidden")}>
            {funcao ? <TrocaDeEvento funcao={funcao} /> : <span />}
            {engrenagemAqui && (
                <span className="max-md:hidden">
                    <EngrenagemDoFreepass telaDeEvento={telaDeEvento} />
                </span>
            )}
        </div>
    );
};

const OrgTopBar = ({ activeProducer, telaDeEvento }: { activeProducer?: string; telaDeEvento?: boolean }) => {
    const navigate = useNavigate();
    const nav = useOrgNav();
    const freepass = usePainel() === "freepass";
    return (
        <header className="sticky top-0 z-30 hidden border-b border-secondary bg-primary md:block">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6">
                <BrandLogo className="h-6 shrink-0" />
                <span className="h-6 w-px shrink-0 bg-border-secondary" aria-hidden="true" />
                <nav className="flex items-center gap-0.5">
                    {nav.map((item) => {
                        const current = activeProducer === item.id || (item.id === "eventos" && !activeProducer);
                        return (
                            <NavButton
                                key={item.id}
                                icon={item.icon}
                                current={current}
                                href={item.href ?? "#"}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (item.href) navigate(item.href);
                                }}
                                tooltipPlacement="bottom"
                                className="text-tertiary"
                            >
                                {item.label}
                            </NavButton>
                        );
                    })}
                </nav>
                <div className="ml-auto flex items-center gap-3">
                    {freepass && <EngrenagemDoFreepass telaDeEvento={telaDeEvento} />}
                    <ThemeToggle />
                    <span className="h-6 w-px shrink-0 bg-border-secondary" aria-hidden="true" />
                    <OrganizacaoChip />
                </div>
            </div>
        </header>
    );
};

/** Menu do evento à esquerda na nova shell (offset abaixo da barra do topo). */
const EventRailTop = (props: EventRailProps) => <RailDoEvento {...props} className="sticky top-22 h-[calc(100vh-7rem)]" />;

/* Mesma paleta que BadgeWithDot usa por trás do badge de status (ver
   colors.styles[cor].addon em badges.tsx) — o ponto ao lado do nome do status
   lê como a mesma cor do badge em qualquer lugar do produto, não uma nova. */
const STATUS_DOT_COR: Record<EventoStatus, string> = {
    rascunho: "text-utility-yellow-500",
    privado: "text-utility-blue-500",
    publicado: "text-utility-green-500",
    encerrado: "text-utility-neutral-500",
};

/** Legenda curta por opção — versão enxuta da explicação mais longa que já existe em
 *  EVENTO_STATUS_DESCRICAO (usada no modal): aqui é só um lembrete de uma linha ao lado
 *  do nome, o modal continua sendo o lugar com a explicação completa antes de confirmar. */
const STATUS_DESCRICAO_CURTA: Record<EventoStatus, string> = {
    rascunho: "Vendas desligadas",
    privado: "Ligadas, só com o link",
    publicado: "Ligadas, sem restrição",
    encerrado: "Vendas encerradas",
};

/**
 * Cartão do evento no rail (desktop). A capa (banner 4:5) fica acima do nome, na largura toda do
 * cartão e sem espaçamento (BKS-24); o resto vem embaixo. O status aparece num lugar só, no seletor.
 */
const EventDetailsCard = () => {
    const evento = useEventoAtual();
    const freepass = usePainel() === "freepass";
    const encerrado = evento.status === "encerrado";

    return (
        <div className="flex flex-col gap-3 overflow-hidden rounded-2xl bg-secondary pb-3">
            <img src={evento.cover} alt="" className="aspect-[4/5] w-full object-cover" />
            <div className="flex items-start gap-3 px-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm text-tertiary">ID: {evento.id}</span>
                    <h3 className="line-clamp-2 text-sm font-bold text-primary" title={evento.nome}>
                        {evento.nome}
                    </h3>
                    <p className="truncate text-sm text-tertiary">{evento.produtor}</p>
                </div>
            </div>
            <p className="px-4 text-sm text-secondary">{evento.dataLabel}</p>
            {/* No Freepass o status é só leitura: quem muda é a produtora (BKS-64). */}
            {freepass ? (
                <Badge size="sm" type="pill-color" color={EVENTO_STATUS_BADGE_COLOR[evento.status]} className="mx-4 self-start">
                    {EVENTO_STATUS_LABEL[evento.status]}
                </Badge>
            ) : (
            <div className="flex flex-col gap-1.5 px-4">
                <span className="text-sm text-quaternary">Status do evento</span>
                <SeletorDeStatus />
                {encerrado && <p className="text-sm text-tertiary">Evento encerrado. O status não pode mais ser alterado.</p>}
            </div>
            )}
        </div>
    );
};

/** Troca de status no fim do menu do evento no celular, fixa no rodapé do painel (a barra só mostra o selo). */
const StatusNoMenuMobile = () => {
    const evento = useEventoAtual();
    return (
        <div className="sticky bottom-0 flex flex-col gap-1.5 border-t border-secondary bg-primary px-4 pt-4 pb-6">
            <span className="text-sm text-quaternary">Status do evento</span>
            <SeletorDeStatus />
            {evento.status === "encerrado" && <p className="text-sm text-tertiary">Evento encerrado. O status não pode mais ser alterado.</p>}
        </div>
    );
};

/** Lista de status do evento: escolher abre o modal, que confirma. O mesmo no desktop e no celular. */
const SeletorDeStatus = () => {
    const evento = useEventoAtual();
    const abrirModalDeStatus = useAbrirModalDeStatus();
    const encerrado = evento.status === "encerrado";
    return (
        <Dropdown.Root>
            <Button size="sm" color="secondary" className="w-full justify-between" iconTrailing={encerrado ? undefined : ChevronDown} isDisabled={encerrado}>
                <span className="flex min-w-0 items-center gap-1.5">
                    <Dot size="sm" className={STATUS_DOT_COR[evento.status]} aria-hidden="true" />
                    <span className="truncate">{EVENTO_STATUS_LABEL[evento.status]}</span>
                </span>
            </Button>
            <Dropdown.Popover className="w-64" placement="bottom start">
                <Dropdown.Menu>
                    {/* Dropdown.Item tem uma linha só; aqui são duas (nome e legenda), com as mesmas classes do item padrão. */}
                    {ORDEM_STATUS.map((status) => {
                        const isAtual = status === evento.status;
                        return (
                            <AriaMenuItem
                                key={status}
                                id={status}
                                isDisabled={isAtual}
                                textValue={EVENTO_STATUS_LABEL[status]}
                                onAction={() => abrirModalDeStatus(status)}
                                className={(state) => cx("group block cursor-pointer px-1.5 py-px outline-hidden", state.isDisabled && "cursor-not-allowed opacity-50")}
                            >
                                {(state) => (
                                    <div
                                        className={cx(
                                            "relative flex items-start gap-2 rounded-md px-2.5 py-2 outline-focus-ring transition duration-100 ease-linear",
                                            !state.isDisabled && "group-hover:bg-primary_hover",
                                            state.isFocused && "bg-primary_hover",
                                            state.isFocusVisible && "outline-2 -outline-offset-2",
                                        )}
                                    >
                                        <Dot size="sm" className={cx("mt-1 size-2 shrink-0", STATUS_DOT_COR[status])} aria-hidden="true" />
                                        <span className="flex min-w-0 flex-col">
                                            <span className="truncate text-sm font-semibold text-secondary">{EVENTO_STATUS_LABEL[status]}</span>
                                            <span className="truncate text-sm text-tertiary">{isAtual ? "Status atual" : STATUS_DESCRICAO_CURTA[status]}</span>
                                        </span>
                                    </div>
                                )}
                            </AriaMenuItem>
                        );
                    })}
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
};

interface EventFunctionalitiesListProps {
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
}

/** Item da página atual. "item-ativo" marca a linha para o rail rolar até ela e anunciar a página (UI-NAV-004). */
const ACTIVE_CLASS = "item-ativo bg-tertiary hover:bg-tertiary";

const EventFunctionalitiesList = ({ activeSection, activeItem }: EventFunctionalitiesListProps) => {
    const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(
        () => new Set(activeSection ? [activeSection] : []),
    );

    useEffect(() => {
        if (activeSection) {
            setExpandedKeys((prev) => (prev.has(activeSection) ? prev : new Set([...prev, activeSection])));
        }
    }, [activeSection]);

    const freepass = usePainel() === "freepass";
    const eventoId = useEventoAtual().id;
    const acesso = useAcessoNoEvento(eventoId, freepass);
    // Mesma lista do celular (EVENT_NAV): um menu, um desenho (UI-DS-003).
    const nav = freepass ? navDoFreepass(acesso) : EVENT_NAV;
    const desativadas: Key[] = [
        ...DISABLED_KEYS,
        ...nav.filter((sec) => !ehDestinoUnico(sec) && sec.items.length === 0).map((sec) => sec.id),
        ...nav.flatMap((sec) => sec.items.filter((it) => ehDesativado(it.href)).map((it) => it.id)),
    ];
    const ativo = (marcado: boolean) => (marcado ? ACTIVE_CLASS : undefined);

    return (
        <TreeView
            aria-label="Funcionalidades do evento"
            size="sm"
            selectionMode="none"
            disabledKeys={desativadas}
            expandedKeys={expandedKeys}
            onExpandedChange={(keys: Set<Key>) => setExpandedKeys(new Set(keys))}
        >
            {nav.map((sec) => {
                const novo = sec.novo && (
                    <Badge size="sm" type="pill-color" color="brand">
                        Novo
                    </Badge>
                );
                if (ehDestinoUnico(sec) || sec.items.length === 0) {
                    const href = destinoDaSecao(sec);
                    return (
                        <TreeView.Item key={sec.id} id={sec.id} textValue={sec.label} href={ehDesativado(href) ? undefined : href}>
                            <TreeView.ItemContent icon={sec.icon} action={novo} className={ativo(activeSection === sec.id || SECOES_ABRIGADAS[activeSection ?? ""] === sec.id)}>
                                {sec.label}
                            </TreeView.ItemContent>
                        </TreeView.Item>
                    );
                }
                return (
                    <TreeView.Item key={sec.id} id={sec.id} textValue={sec.label}>
                        <TreeView.ItemContent icon={sec.icon} action={novo}>
                            {sec.label}
                        </TreeView.ItemContent>
                        {sec.items.map((it) => (
                            <TreeView.Item
                                key={it.id}
                                id={it.id}
                                textValue={it.label}
                                href={ehDesativado(it.href) ? undefined : it.href}
                                // Entra deslizando ao abrir o grupo (UI-VIS-008); some sem movimento com redução de movimento.
                                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200"
                            >
                                <TreeView.ItemContent className={ativo(activeItem === it.id)} action={<ItemBadges item={it} />}>
                                    {it.label}
                                </TreeView.ItemContent>
                            </TreeView.Item>
                        ))}
                    </TreeView.Item>
                );
            })}
        </TreeView>
    );
};

