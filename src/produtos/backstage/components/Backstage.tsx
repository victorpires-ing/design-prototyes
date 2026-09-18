import { createContext, useCallback, useContext, useEffect, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { MenuItem as AriaMenuItem, type Key } from "react-aria-components";
import {
    Announcement01,
    Bank,
    Calendar,
    ChevronDown,
    Eye,
    File03,
    Globe01,
    InfoCircle,
    LayoutLeft,
    LayoutTop,
    LogOut01,
    Menu02,
    Package,
    Settings01,
    ShoppingCart01,
    Ticket01,
    Users01,
    UsersPlus,
    XClose,
} from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { NavButton } from "@/components/application/app-navigation/base-components/nav-button";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { Dot } from "@/components/foundations/dot-icon";
import { cx } from "@/utils/cx";
import LogoBlack from "../../../assets/Company logo_black.svg";
import LogoWhite from "../../../assets/Company logo_white.svg";
import { AlterarStatusModal, ORDEM_STATUS } from "../eventos/components/AlterarStatusModal";
import { EVENTO_STATUS_BADGE_COLOR, EVENTO_STATUS_LABEL, setEventoStatus, useEventoAtual, type EventoStatus } from "../eventos/data/eventos";

/** Logo da Ingresse — clicável, leva para a home do Backstage. */
const BrandLogo = ({ className }: { className?: string }) => {
    const navigate = useNavigate();
    return (
        <button
            type="button"
            onClick={() => navigate("/backstage/home")}
            aria-label="Ir para a home do Backstage"
            className="flex shrink-0 items-center rounded-md transition-opacity duration-100 ease-linear hover:opacity-80"
        >
            <img src={LogoBlack} alt="Ingresse" className={cx("block dark:hidden", className)} />
            <img src={LogoWhite} alt="Ingresse" className={cx("hidden dark:block", className)} />
        </button>
    );
};
import { ThemeToggle } from "./ThemeToggle";
import { RemixDock } from "./remix/RemixShell";

export type BackstageSection =
    | "equipe-e-permissoes"
    | "informacoes-evento"
    | "itens"
    | "pesquisas"
    | "cortesias"
    | "equipe-de-operacao"
    | "relatorios"
    | "marketing";

export type BackstageItem =
    | "informacoes-gerais"
    | "permissao-envio"
    | "catalogo-itens"
    | "catalogo-ingressos"
    | "catalogo-combos"
    | "catalogo-produtos"
    | "catalogo-aberturas"
    | "emissao-cortesias"
    | "bilheteria-online"
    | "grupos-operacao"
    | "vendas-por-grupo"
    | "transacoes"
    | "acesso"
    | "bordero"
    | "transferencias"
    | "comparativos"
    | "relatorio-personalizado"
    | "relatorio-questionarios"
    | "chave-de-acesso"
    | "formularios-compra";

const DISABLED_KEYS: Key[] = ["catalogo-combos", "catalogo-produtos"];

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

export function BackstageLayout({
    activeSection,
    activeItem,
    activeProducer,
    showEventContext = true,
    showLayoutSwitcher = true,
    children,
}: BackstageLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [variant, setVariant] = useLayoutVariant();
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusInicial, setStatusInicial] = useState<EventoStatus | undefined>(undefined);
    const eventoAtual = useEventoAtual();

    const abrirModalDeStatus = useCallback((status?: EventoStatus) => {
        setStatusInicial(status);
        setStatusModalOpen(true);
    }, []);

    useEffect(() => {
        if (!isMobileMenuOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsMobileMenuOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [isMobileMenuOpen]);

    const mobileChrome = (
        <>
            <MobileTopBar onOpenMenu={() => setIsMobileMenuOpen(true)} showEventContext={showEventContext} />
            <MobileDrawer
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                showEventContext={showEventContext}
                activeProducer={activeProducer}
                activeSection={activeSection}
                activeItem={activeItem}
            />
        </>
    );

    const statusModal = showEventContext && (
        <AlterarStatusModal
            isOpen={statusModalOpen}
            onClose={() => setStatusModalOpen(false)}
            statusAtual={eventoAtual.status}
            statusInicial={statusInicial}
            onConfirm={(novoStatus) => setEventoStatus(eventoAtual.id, novoStatus)}
        />
    );

    if (variant === "topbar") {
        return (
            <EventStatusModalContext.Provider value={abrirModalDeStatus}>
                <div
                    className="min-h-screen bg-primary_alt"
                    style={{ "--bs-header-offset": "64px" } as CSSProperties}
                >
                    {mobileChrome}
                    <OrgTopBar activeProducer={activeProducer} />
                    <div className="flex flex-col gap-3 px-2 py-3 md:flex-row md:gap-6 md:px-6 md:py-6">
                        {showEventContext && <EventRailTop activeSection={activeSection} activeItem={activeItem} />}
                        <main className="flex min-w-0 flex-1 flex-col">
                            <div className="mx-auto flex w-full max-w-[1088px] flex-1 flex-col">{children}</div>
                        </main>
                        <RemixDock />
                    </div>
                    {showLayoutSwitcher && <LayoutSwitcher variant={variant} onChange={setVariant} />}
                    {statusModal}
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
                    {showEventContext && <EventRail activeSection={activeSection} activeItem={activeItem} />}
                    {children}
                    <RemixDock />
                </div>
                {showLayoutSwitcher && <LayoutSwitcher variant={variant} onChange={setVariant} />}
                {statusModal}
            </div>
        </EventStatusModalContext.Provider>
    );
}

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

const MobileTopBar = ({ onOpenMenu, showEventContext }: { onOpenMenu: () => void; showEventContext?: boolean }) => {
    const evento = useEventoAtual();
    const abrirModalDeStatus = useAbrirModalDeStatus();
    return (
        <header className="sticky top-0 z-30 md:hidden">
            <div className="flex items-center justify-between gap-3 border-b border-secondary bg-primary px-4 py-3">
                <BrandLogo className="h-5" />
                <button
                    type="button"
                    onClick={onOpenMenu}
                    aria-label="Abrir menu"
                    className="flex size-9 shrink-0 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
                >
                    <Menu02 className="size-5" />
                </button>
            </div>
            {showEventContext && (
                <div className="flex items-center gap-2.5 border-b border-secondary bg-primary px-4 py-2">
                    <img src={evento.cover} alt="" className="size-9 shrink-0 rounded-md object-cover" />
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm leading-tight font-semibold text-primary">{evento.nome}</span>
                        <span className="text-sm text-tertiary">ID: {evento.id}</span>
                    </div>
                    <Badge size="sm" type="pill-color" color={EVENTO_STATUS_BADGE_COLOR[evento.status]}>
                        {EVENTO_STATUS_LABEL[evento.status]}
                    </Badge>
                    {evento.status !== "encerrado" && (
                        <ButtonUtility
                            className="size-11"
                            color="tertiary"
                            icon={ChevronDown}
                            tooltip="Alterar status do evento"
                            onClick={() => abrirModalDeStatus()}
                        />
                    )}
                </div>
            )}
        </header>
    );
};

const MobileEventCard = () => {
    const evento = useEventoAtual();
    const abrirModalDeStatus = useAbrirModalDeStatus();
    return (
        <div className="flex items-start gap-3 rounded-xl bg-secondary p-3">
            <img src={evento.cover} alt={evento.nome} className="size-16 shrink-0 rounded-lg object-cover" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                    <span className="text-sm text-tertiary">ID: {evento.id}</span>
                    <div className="flex items-center gap-1">
                        <Badge size="sm" type="pill-color" color={EVENTO_STATUS_BADGE_COLOR[evento.status]}>
                            {EVENTO_STATUS_LABEL[evento.status]}
                        </Badge>
                        {evento.status !== "encerrado" && (
                            <ButtonUtility
                                className="size-11"
                                color="tertiary"
                                icon={ChevronDown}
                                tooltip="Alterar status do evento"
                                onClick={() => abrirModalDeStatus()}
                            />
                        )}
                    </div>
                </div>
                <p className="text-sm font-semibold leading-snug text-primary line-clamp-2">{evento.nome}</p>
            </div>
        </div>
    );
};

const SECTION_LABELS: Record<BackstageSection, string> = {
    "equipe-e-permissoes": "Equipe e Permissões",
    "informacoes-evento": "Informações do evento",
    itens: "Itens",
    pesquisas: "Coleta de dados",
    cortesias: "Emissão de ingressos",
    "equipe-de-operacao": "Equipe de operação",
    relatorios: "Relatórios",
    marketing: "Marketing",
};

const ITEM_LABELS: Record<BackstageItem, string> = {
    "permissao-envio": "Permissão de envio",
    "catalogo-itens": "Itens",
    "catalogo-ingressos": "Ingressos",
    "catalogo-combos": "Combos",
    "catalogo-produtos": "Produtos",
    "catalogo-aberturas": "Aberturas de vendas",
    "emissao-cortesias": "Cortesia",
    "bilheteria-online": "Bilheteria online",
    "grupos-operacao": "Grupos de operação",
    "vendas-por-grupo": "Vendas",
    transacoes: "Transações",
    acesso: "Acesso",
    bordero: "Borderô",
    transferencias: "Transferências",
    comparativos: "Comparativos",
    "relatorio-personalizado": "Relatório personalizado",
    "relatorio-questionarios": "Questionários",
    "chave-de-acesso": "Chave de acesso",
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

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    showEventContext?: boolean;
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
    activeProducer?: string;
}

const PRODUCER_NAV: Array<{
    id: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    href?: string;
    children?: Array<{ id: string; label: string }>;
}> = [
    { id: "eventos", icon: Calendar, label: "Eventos", href: "/backstage/" },
    { id: "pedidos", icon: ShoppingCart01, label: "Pedidos", href: "/backstage/pedidos" },
    { id: "permissao", icon: UsersPlus, label: "Permissão", href: "/backstage/permissao-envio" },
    { id: "produtos", icon: Package, label: "Produtos" },
    {
        id: "publico",
        icon: Users01,
        label: "Público",
        children: [{ id: "segmentos", label: "Segmentos" }],
    },
    {
        id: "ajustes",
        icon: Settings01,
        label: "Ajustes",
        children: [
            { id: "termos", label: "Termos de uso" },
            { id: "organizacao", label: "Organização" },
        ],
    },
];

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
    icon: ComponentType<{ className?: string }>;
    novo?: boolean;
    /** Vazio = seção sem destino (apenas rótulo, desabilitada). */
    items: EventNavItem[];
}

const EVENT_NAV: EventNavSection[] = [
    {
        id: "informacoes-evento", label: "Informações do evento", icon: InfoCircle, items: [
            { id: "informacoes-gerais", label: "Informações do evento", href: "/backstage/informacoes-evento" },
        ],
    },
    { id: "equipe-de-operacao", label: "Equipe de operação", icon: UsersPlus, novo: true, items: [{ id: "grupos-operacao", label: "Grupos de operação", href: "/backstage/equipe-de-operacao" }] },
    {
        id: "itens", label: "Itens", icon: ShoppingCart01, items: [
            { id: "catalogo-ingressos", label: "Ingressos", href: "/backstage/catalogo/ingressos" },
            { id: "catalogo-combos", label: "Combos", href: "/backstage/catalogo/ingressos" },
            { id: "catalogo-produtos", label: "Produtos", href: "/backstage/catalogo/ingressos", novo: true },
        ],
    },
    {
        id: "cortesias", label: "Emissão de ingressos", icon: Ticket01, novo: true, items: [
            { id: "emissao-cortesias", label: "Cortesia", href: "/backstage/cortesias" },
            { id: "bilheteria-online", label: "Bilheteria online", href: "/backstage/bilheteria" },
        ],
    },
    {
        id: "relatorios", label: "Relatórios", icon: File03, items: [
            { id: "vendas-por-grupo", label: "Vendas", href: "/backstage/relatorios/vendas-por-grupo" },
            { id: "transacoes", label: "Transações", href: "/backstage/relatorios/transacoes" },
            { id: "acesso", label: "Acesso", href: "/backstage/relatorios/acesso" },
            { id: "bordero", label: "Borderô", href: "/backstage/relatorios/bordero" },
            { id: "transferencias", label: "Transferências", href: "/backstage/relatorios/transferencias" },
            { id: "comparativos", label: "Comparativos", href: "/backstage/relatorios/comparativos", novo: true },
            { id: "relatorio-questionarios", label: "Questionários", href: "/backstage/relatorios/questionarios" },
            { id: "relatorio-personalizado", label: "Relatório personalizado", href: "/backstage/relatorios/relatorio-personalizado", ia: true },
        ],
    },
    { id: "marketing", label: "Marketing", icon: Announcement01, items: [{ id: "chave-de-acesso", label: "Chave de acesso", href: "/backstage/marketing/chave-de-acesso" }] },
];

const ItemBadges = ({ item }: { item: EventNavItem }) => (
    <>
        {item.novo && <Badge size="sm" type="pill-color" color="error">Novo</Badge>}
        {item.ia && <Badge size="sm" type="pill-color" color="brand">IA</Badge>}
    </>
);

const MobileEventNav = ({ activeSection, activeItem, onNavigate }: { activeSection?: BackstageSection; activeItem?: BackstageItem; onNavigate: (href: string) => void }) => {
    const [open, setOpen] = useState<Set<string>>(() => new Set(activeSection ? [activeSection] : []));
    const toggle = (id: string) => setOpen((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const rowBase = "flex items-center gap-3 rounded-lg px-3 py-3 text-left transition duration-100 ease-linear";

    return (
        <div className="flex flex-col gap-0.5">
            {EVENT_NAV.map((sec) => {
                const active = activeSection === sec.id;
                const rowCls = cx(rowBase, active ? "bg-tertiary text-primary" : "text-secondary hover:bg-tertiary");
                const badge = sec.novo && <Badge size="sm" type="pill-color" color="error">Novo</Badge>;

                // Sem destino → apenas rótulo (desabilitado).
                if (sec.items.length === 0) {
                    return (
                        <div key={sec.id} className={cx(rowBase, "cursor-not-allowed text-tertiary opacity-60")}>
                            <sec.icon className="size-5 shrink-0 text-fg-quaternary" />
                            <span className="flex-1 text-sm font-medium">{sec.label}</span>
                        </div>
                    );
                }

                // Um único destino → a própria seção vira link.
                if (sec.items.length === 1) {
                    return (
                        <button key={sec.id} type="button" onClick={() => onNavigate(sec.items[0].href)} className={rowCls}>
                            <sec.icon className="size-5 shrink-0 text-fg-secondary" />
                            <span className="flex-1 text-sm font-medium">{sec.label}</span>
                            {badge}
                        </button>
                    );
                }

                // Vários destinos → accordion.
                const isOpen = open.has(sec.id);
                return (
                    <div key={sec.id} className="flex flex-col">
                        <button type="button" onClick={() => toggle(sec.id)} aria-expanded={isOpen} className={rowCls}>
                            <sec.icon className="size-5 shrink-0 text-fg-secondary" />
                            <span className="flex-1 text-sm font-medium">{sec.label}</span>
                            {badge}
                            <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", isOpen && "rotate-180")} />
                        </button>
                        {isOpen && (
                            <div className="flex flex-col gap-0.5 py-1 pl-11">
                                {sec.items.map((it) => (
                                    <button
                                        key={it.id}
                                        type="button"
                                        onClick={() => onNavigate(it.href)}
                                        className={cx("flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition duration-100 ease-linear", activeItem === it.id ? "bg-tertiary font-medium text-primary" : "text-secondary hover:bg-tertiary")}
                                    >
                                        <span className="flex-1">{it.label}</span>
                                        <ItemBadges item={it} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const MobileDrawer = ({ isOpen, onClose, showEventContext, activeSection, activeItem, activeProducer }: MobileDrawerProps) => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    if (!isOpen) return null;
    const toggle = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    return (
        <div className="fixed inset-0 z-50 flex md:hidden">
            <aside className="relative flex h-full w-[85%] max-w-[340px] flex-col gap-1 overflow-y-auto bg-secondary p-3 shadow-xl">
                <div className="flex items-center justify-between gap-2 pb-2">
                    <BrandLogo className="h-5" />
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar menu"
                        className="flex size-9 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-tertiary"
                    >
                        <XClose className="size-5" />
                    </button>
                </div>

                {showEventContext && (
                    <div className="mb-1 flex flex-col gap-3 border-b border-secondary pb-3">
                        <MobileEventCard />
                        <div className="flex flex-col gap-1">
                            <span className="px-1 text-xs font-semibold tracking-wide text-quaternary uppercase">Funcionalidades do evento</span>
                            <MobileEventNav
                                activeSection={activeSection}
                                activeItem={activeItem}
                                onNavigate={(href) => { navigate(href); onClose(); }}
                            />
                        </div>
                    </div>
                )}

                <nav className="flex flex-col gap-0.5">
                    {PRODUCER_NAV.map((entry) => {
                        const isActive = entry.id === (activeProducer ?? "eventos");
                        const isExpanded = expanded.has(entry.id);
                        const hasChildren = !!entry.children?.length;
                        return (
                            <div key={entry.id} className="flex flex-col">
                                <button
                                    type="button"
                                    onClick={
                                        hasChildren
                                            ? () => toggle(entry.id)
                                            : entry.href
                                              ? () => {
                                                    navigate(entry.href!);
                                                    onClose();
                                                }
                                              : undefined
                                    }
                                    className={cx(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition duration-100 ease-linear",
                                        isActive
                                            ? "bg-tertiary text-primary"
                                            : "text-secondary hover:bg-tertiary",
                                    )}
                                >
                                    <entry.icon className="size-5 shrink-0 text-fg-secondary" />
                                    <span className="flex-1 text-sm font-medium">
                                        {entry.label}
                                    </span>
                                    {hasChildren && (
                                        <ChevronDown
                                            className={cx(
                                                "size-4 shrink-0 text-fg-quaternary transition-transform duration-150",
                                                isExpanded && "rotate-180",
                                            )}
                                        />
                                    )}
                                </button>
                                {hasChildren && isExpanded && (
                                    <div className="flex flex-col gap-0.5 pl-11">
                                        {entry.children?.map((child) => (
                                            <button
                                                key={child.id}
                                                type="button"
                                                className="rounded-md px-3 py-2 text-left text-sm text-secondary transition duration-100 ease-linear hover:bg-tertiary"
                                            >
                                                {child.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="mt-auto flex flex-col gap-2 pt-4">
                    <button
                        type="button"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-secondary transition duration-100 ease-linear hover:bg-tertiary"
                    >
                        <Globe01 className="size-5 shrink-0 text-fg-secondary" />
                        <span className="text-sm font-medium">Alterar idioma</span>
                    </button>
                    <button
                        type="button"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-secondary transition duration-100 ease-linear hover:bg-tertiary"
                    >
                        <LogOut01 className="size-5 shrink-0 text-fg-secondary" />
                        <span className="text-sm font-medium">Sair</span>
                    </button>
                    <button
                        type="button"
                        className="flex items-center justify-between gap-3 rounded-full bg-tertiary px-3 py-2 ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                    >
                        <span className="flex items-center gap-2">
                            <span className="flex size-6 items-center justify-center overflow-hidden rounded-full bg-secondary-solid text-[10px] font-bold text-white">
                                OR
                            </span>
                            <span className="text-sm font-medium text-primary">
                                {"{org_name}"}
                            </span>
                        </span>
                        <ChevronDown className="size-4 text-fg-quaternary" />
                    </button>
                </div>

                <div className="pt-2">
                    <ThemeToggle />
                </div>
            </aside>
            <button
                type="button"
                aria-label="Fechar menu"
                onClick={onClose}
                className="flex-1 bg-overlay"
            />
        </div>
    );
};

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
                "flex flex-col items-center gap-1 rounded-md px-2 py-2 transition duration-100 ease-linear",
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

const ProducerRail = ({ activeProducer }: { activeProducer?: string }) => (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[72px] shrink-0 flex-col items-center justify-between rounded-2xl bg-primary py-4 lg:flex">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <span className="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-secondary-solid text-xs font-bold text-white">
                    eng
                </span>
                <button
                    type="button"
                    className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-primary ring-1 ring-secondary"
                    aria-label="Trocar produtor"
                >
                    <ChevronDown className="size-3 text-fg-quaternary" />
                </button>
            </div>
            <nav className="flex flex-col items-center gap-1">
                <ProducerRailItem icon={Calendar} label="Eventos" href="/backstage/" isActive={activeProducer === "eventos" || !activeProducer} />
                <ProducerRailItem icon={UsersPlus} label="Equipe" />
                <ProducerRailItem icon={Bank} label="Finanças" />
                <ProducerRailItem
                    icon={ShoppingCart01}
                    label="Pedidos"
                    href="/backstage/pedidos"
                    isActive={activeProducer === "pedidos"}
                />
                <ProducerRailItem icon={Users01} label="Público" href="/backstage/publico" isActive={activeProducer === "publico"} />
                <ProducerRailItem icon={Settings01} label="Ajustes" />
            </nav>
        </div>
        <ThemeToggle />
    </aside>
);

interface EventRailProps {
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
}

/** Scrollbar suave (fino, track transparente, thumb em cor de borda) — evita
 *  o contraste alto do scrollbar global dentro do card branco do menu. */
const SOFT_SCROLLBAR =
    "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--color-border-secondary)] hover:[&::-webkit-scrollbar-thumb]:bg-[var(--color-border-primary)]";

const EventRail = ({ activeSection, activeItem }: EventRailProps) => (
    <aside className={cx("sticky top-6 hidden h-[calc(100vh-3rem)] w-[280px] shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl bg-primary p-3 md:flex", SOFT_SCROLLBAR)}>
        <EventDetailsCard />
        <EventFunctionalitiesList activeSection={activeSection} activeItem={activeItem} />
    </aside>
);

/* ------------------------------------------------------------------ */
/*  Nova shell — barra horizontal da organização no topo.              */
/* ------------------------------------------------------------------ */

const ORG_NAV: Array<{ id: string; icon: ComponentType<{ className?: string }>; label: string; href?: string }> = [
    { id: "eventos", icon: Calendar, label: "Eventos", href: "/backstage/" },
    { id: "equipe", icon: UsersPlus, label: "Equipe" },
    { id: "financas", icon: Bank, label: "Finanças" },
    { id: "pedidos", icon: ShoppingCart01, label: "Pedidos", href: "/backstage/pedidos" },
    { id: "publico", icon: Users01, label: "Público" },
    { id: "ajustes", icon: Settings01, label: "Ajustes" },
];

const OrgTopBar = ({ activeProducer }: { activeProducer?: string }) => {
    const navigate = useNavigate();
    return (
        <header className="sticky top-0 z-30 hidden border-b border-secondary bg-primary md:block">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6">
                <BrandLogo className="h-6 shrink-0" />
                <span className="h-6 w-px shrink-0 bg-border-secondary" aria-hidden="true" />
                <nav className="flex items-center gap-0.5">
                    {ORG_NAV.map((item) => {
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
                    <ThemeToggle />
                    <span className="h-6 w-px shrink-0 bg-border-secondary" aria-hidden="true" />
                    <button
                        type="button"
                        className="flex shrink-0 items-center gap-2 rounded-full bg-secondary py-1.5 pr-2.5 pl-1.5 ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary_hover"
                    >
                        <span className="flex size-6 items-center justify-center overflow-hidden rounded-full bg-secondary-solid text-[10px] font-bold text-white">
                            eng
                        </span>
                        <span className="text-sm font-semibold text-primary">Ingresse</span>
                        <ChevronDown className="size-4 text-fg-quaternary" />
                    </button>
                </div>
            </div>
        </header>
    );
};

/** Menu do evento à esquerda na nova shell (offset abaixo da barra do topo). */
const EventRailTop = ({ activeSection, activeItem }: EventRailProps) => (
    <aside className={cx("sticky top-22 hidden h-[calc(100vh-7rem)] w-[280px] shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl bg-primary p-3 md:flex", SOFT_SCROLLBAR)}>
        <EventDetailsCard />
        <EventFunctionalitiesList activeSection={activeSection} activeItem={activeItem} />
    </aside>
);

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
    rascunho: "Vendas desabilitadas",
    privado: "Visível só com link",
    publicado: "Visível no site da Ingresse",
    encerrado: "Vendas encerradas",
};

const EventDetailsCard = () => {
    const evento = useEventoAtual();
    const abrirModalDeStatus = useAbrirModalDeStatus();
    const encerrado = evento.status === "encerrado";

    return (
        <div className="flex flex-col gap-4 rounded-2xl bg-secondary p-3">
            <div className="relative aspect-[256/292] w-full overflow-hidden rounded-2xl bg-secondary">
                <img src={evento.cover} alt={evento.nome} className="size-full object-cover" />
                <Badge size="sm" type="pill-color" color={EVENTO_STATUS_BADGE_COLOR[evento.status]} className="absolute top-3 left-3">
                    {EVENTO_STATUS_LABEL[evento.status]}
                </Badge>
                <div className="absolute bottom-3 right-3 flex w-12 flex-col items-center rounded-xl bg-white/50 px-2 py-3 text-primary backdrop-blur-md">
                    <span className="text-[10px] font-medium tracking-wide uppercase">{evento.weekday}</span>
                    <span className="text-base font-bold leading-tight">{evento.day}</span>
                    <span className="text-[10px] font-medium tracking-wide uppercase">{evento.month}</span>
                </div>
            </div>
            <div className="flex flex-col gap-0.5 px-1">
                <span className="text-sm text-tertiary">ID: {evento.id}</span>
                <h3 className="text-md font-bold text-primary">{evento.nome}</h3>
                <p className="text-sm text-tertiary">{evento.produtor}</p>
            </div>
            <div className="flex flex-col gap-1.5 px-1">
                <span className="text-sm text-quaternary">Status do evento</span>
                <div className="flex items-center gap-2">
                    {/* Teste: dropdown real em vez do botão que só abria o modal direto — a
                        seta agora tem uma função de verdade (abre a lista aqui do lado) e o
                        ponto de cor dá o mesmo sinal do badge sem precisar ler o texto. Cada
                        opção já pré-seleciona a escolha no modal em vez de aplicar na hora:
                        a lista fica rápida para escolher, mas quem confirma — com o texto de
                        apoio de cada status e o aviso de "não pode ser desfeito" — continua
                        sendo só o modal, não dois lugares reimplementando a mesma coisa. */}
                    <Dropdown.Root>
                        <Button size="sm" color="secondary" className="flex-1 justify-between" iconTrailing={encerrado ? undefined : ChevronDown} isDisabled={encerrado}>
                            <span className="flex min-w-0 items-center gap-1.5">
                                <Dot size="sm" className={STATUS_DOT_COR[evento.status]} aria-hidden="true" />
                                <span className="truncate">{EVENTO_STATUS_LABEL[evento.status]}</span>
                            </span>
                        </Button>
                        <Dropdown.Popover className="w-64" placement="bottom start">
                            <Dropdown.Menu>
                                {/* Dropdown.Item só tem uma linha de texto (label) — o rótulo
                                    curto sozinho não deixa espaço pra legenda de apoio, então
                                    o item aqui é montado na mão com o MenuItem do React Aria
                                    por baixo do Dropdown, reaproveitando as mesmas classes de
                                    hover/foco do item padrão, só com duas linhas em vez de uma. */}
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
                                                    <Dot size="sm" className={cx("mt-1 shrink-0 size-2", STATUS_DOT_COR[status])} aria-hidden="true" />
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
                    <button
                        type="button"
                        disabled
                        aria-label="Pré-visualizar evento (em breve)"
                        className="flex size-9 shrink-0 cursor-not-allowed items-center justify-center rounded-md bg-primary text-fg-secondary opacity-50 ring-1 ring-border-primary shadow-xs"
                    >
                        <Eye className="size-4" />
                    </button>
                </div>
                {encerrado && <p className="px-1 text-sm text-tertiary">Evento encerrado. O status não pode mais ser alterado.</p>}
            </div>
        </div>
    );
};

interface EventFunctionalitiesListProps {
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
}

const ACTIVE_CLASS = "bg-tertiary hover:bg-tertiary";

const EventFunctionalitiesList = ({ activeSection, activeItem }: EventFunctionalitiesListProps) => {
    const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(
        () => new Set(activeSection ? [activeSection] : []),
    );

    useEffect(() => {
        if (activeSection) {
            setExpandedKeys((prev) => (prev.has(activeSection) ? prev : new Set([...prev, activeSection])));
        }
    }, [activeSection]);

    const itemClass = (id: BackstageItem) => (activeItem === id ? ACTIVE_CLASS : undefined);

    return (
        <TreeView
            aria-label="Funcionalidades do evento"
            size="sm"
            selectionMode="none"
            disabledKeys={DISABLED_KEYS}
            expandedKeys={expandedKeys}
            onExpandedChange={(keys: Set<Key>) => setExpandedKeys(new Set(keys))}
        >
            <TreeView.Item id="informacoes-evento" textValue="Informações do evento" href="/backstage/informacoes-evento">
                <TreeView.ItemContent icon={InfoCircle} className={activeSection === "informacoes-evento" ? ACTIVE_CLASS : undefined}>
                    Informações do evento
                </TreeView.ItemContent>
            </TreeView.Item>

            <TreeView.Item id="equipe-de-operacao" textValue="Equipe de operação" href="/backstage/equipe-de-operacao">
                <TreeView.ItemContent
                    icon={UsersPlus}
                    className={activeSection === "equipe-de-operacao" ? ACTIVE_CLASS : undefined}
                >
                    Equipe de operação
                </TreeView.ItemContent>
            </TreeView.Item>

            <TreeView.Item id="itens" textValue="Itens">
                <TreeView.ItemContent icon={ShoppingCart01}>Itens</TreeView.ItemContent>
                <TreeView.Item id="catalogo-ingressos" textValue="Ingressos" href="/backstage/catalogo/ingressos">
                    <TreeView.ItemContent className={itemClass("catalogo-ingressos")}>Ingressos</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="catalogo-combos" textValue="Combos">
                    <TreeView.ItemContent className={itemClass("catalogo-combos")}>Combos</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="catalogo-produtos" textValue="Produtos">
                    <TreeView.ItemContent className={itemClass("catalogo-produtos")}>Produtos</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="catalogo-aberturas" textValue="Aberturas de vendas" href="/backstage/catalogo/aberturas-de-vendas">
                    <TreeView.ItemContent className={itemClass("catalogo-aberturas")}>Aberturas de vendas</TreeView.ItemContent>
                </TreeView.Item>
            </TreeView.Item>

            <TreeView.Item id="cortesias" textValue="Emissão de ingressos">
                <TreeView.ItemContent icon={Ticket01}>Emissão de ingressos</TreeView.ItemContent>
                <TreeView.Item id="emissao-cortesias" textValue="Cortesia" href="/backstage/cortesias">
                    <TreeView.ItemContent className={itemClass("emissao-cortesias")}>Cortesia</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="bilheteria-online" textValue="Bilheteria online" href="/backstage/bilheteria">
                    <TreeView.ItemContent className={itemClass("bilheteria-online")}>Bilheteria online</TreeView.ItemContent>
                </TreeView.Item>
            </TreeView.Item>

            <TreeView.Item id="relatorios" textValue="Relatórios">
                <TreeView.ItemContent icon={File03}>Relatórios</TreeView.ItemContent>
                <TreeView.Item id="vendas-por-grupo" textValue="Vendas" href="/backstage/relatorios/vendas-por-grupo">
                    <TreeView.ItemContent className={itemClass("vendas-por-grupo")}>Vendas</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="transacoes" textValue="Transações" href="/backstage/relatorios/transacoes">
                    <TreeView.ItemContent className={itemClass("transacoes")}>Transações</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="acesso" textValue="Acesso" href="/backstage/relatorios/acesso">
                    <TreeView.ItemContent className={itemClass("acesso")}>Acesso</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="bordero" textValue="Borderô" href="/backstage/relatorios/bordero">
                    <TreeView.ItemContent className={itemClass("bordero")}>Borderô</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="transferencias" textValue="Transferências" href="/backstage/relatorios/transferencias">
                    <TreeView.ItemContent className={itemClass("transferencias")}>Transferências</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="comparativos" textValue="Comparativos" href="/backstage/relatorios/comparativos">
                    <TreeView.ItemContent className={itemClass("comparativos")}>Comparativos</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="relatorio-questionarios" textValue="Questionários" href="/backstage/relatorios/questionarios">
                    <TreeView.ItemContent className={itemClass("relatorio-questionarios")}>Questionários</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="relatorio-personalizado" textValue="Relatório personalizado" href="/backstage/relatorios/relatorio-personalizado">
                    <TreeView.ItemContent
                        className={itemClass("relatorio-personalizado")}
                        action={
                            <Badge size="sm" type="pill-color" color="brand">
                                IA
                            </Badge>
                        }
                    >
                        Relatório personalizado
                    </TreeView.ItemContent>
                </TreeView.Item>
            </TreeView.Item>

            <TreeView.Item id="marketing" textValue="Marketing">
                <TreeView.ItemContent icon={Announcement01}>Marketing</TreeView.ItemContent>
                <TreeView.Item id="chave-de-acesso" textValue="Chave de acesso" href="/backstage/marketing/chave-de-acesso">
                    <TreeView.ItemContent className={itemClass("chave-de-acesso")}>Chave de acesso</TreeView.ItemContent>
                </TreeView.Item>
            </TreeView.Item>

        </TreeView>
    );
};
