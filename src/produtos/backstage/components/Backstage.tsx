import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useNavigate } from "react-router";
import type { Key } from "react-aria-components";
import {
    Announcement01,
    Bank,
    BarChartSquare02,
    Calendar,
    ChevronDown,
    Eye,
    File03,
    Globe01,
    InfoCircle,
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
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { cx } from "@/utils/cx";
import LogoBlack from "../../../assets/Company logo_black.svg";
import LogoWhite from "../../../assets/Company logo_white.svg";
import eventCover from "../../../assets/event-cover.png";

const BrandLogo = ({ className }: { className?: string }) => (
    <>
        <img src={LogoBlack} alt="Ingresse" className={cx("block dark:hidden", className)} />
        <img src={LogoWhite} alt="Ingresse" className={cx("hidden dark:block", className)} />
    </>
);
import { ThemeToggle } from "./ThemeToggle";

export type BackstageSection =
    | "informacoes-evento"
    | "itens"
    | "pesquisas"
    | "cortesias"
    | "relatorios"
    | "marketing";

export type BackstageItem =
    | "permissao-envio"
    | "catalogo-itens"
    | "catalogo-ingressos"
    | "catalogo-combos"
    | "catalogo-produtos"
    | "emissao-cortesias"
    | "vendas-por-grupo"
    | "transacoes"
    | "acesso"
    | "bordero"
    | "transferencias"
    | "chave-de-acesso"
    | "formularios-compra";

const DISABLED_KEYS: Key[] = ["informacoes-evento", "permissao-envio", "catalogo-combos", "catalogo-produtos"];

interface BackstageLayoutProps {
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
    activeProducer?: string;
    /** Mostra o contexto do evento (card + funcionalidades). Default: true. */
    showEventContext?: boolean;
    children: ReactNode;
}

export function BackstageLayout({
    activeSection,
    activeItem,
    activeProducer,
    showEventContext = true,
    children,
}: BackstageLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    return (
        <div className="min-h-screen bg-secondary dark:bg-[#0a0a0a]">
            <MobileTopBar onOpenMenu={() => setIsMobileMenuOpen(true)} />
            <MobileDrawer
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
            <div className="flex min-h-screen flex-col gap-3 px-3 py-3 md:flex-row md:py-6">
                {showEventContext && (
                    <div className="flex flex-col gap-3 md:hidden">
                        <MobileEventCard />
                        <MobileSectionSelector
                            activeSection={activeSection}
                            activeItem={activeItem}
                        />
                    </div>
                )}
                <ProducerRail activeProducer={activeProducer} />
                {showEventContext && <EventRail activeSection={activeSection} activeItem={activeItem} />}
                {children}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Mobile top bar + drawer                                           */
/* ------------------------------------------------------------------ */

const MobileTopBar = ({ onOpenMenu }: { onOpenMenu: () => void }) => (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-secondary bg-primary px-4 py-3 md:hidden">
        <BrandLogo className="h-5" />
        <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Abrir menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
        >
            <Menu02 className="size-5" />
        </button>
    </header>
);

const MobileEventCard = () => (
    <div className="flex items-start gap-3 rounded-xl bg-secondary p-3">
        <img
            src={eventCover}
            alt="Bahia x Vitória"
            className="size-16 shrink-0 rounded-lg object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
                <span className="text-xs text-tertiary">ID: XWNE7K</span>
                <Badge size="sm" type="pill-color" color="success">
                    Publicado
                </Badge>
            </div>
            <p className="text-sm font-semibold leading-snug text-primary line-clamp-2">
                Bahia x Vitória
            </p>
        </div>
    </div>
);

const SECTION_LABELS: Record<BackstageSection, string> = {
    "informacoes-evento": "Informações do evento",
    itens: "Itens",
    pesquisas: "Coleta de dados",
    cortesias: "Cortesias",
    relatorios: "Relatórios",
    marketing: "Marketing",
};

const ITEM_LABELS: Record<BackstageItem, string> = {
    "permissao-envio": "Permissão de envio",
    "catalogo-itens": "Itens",
    "catalogo-ingressos": "Ingressos",
    "catalogo-combos": "Combos",
    "catalogo-produtos": "Produtos",
    "emissao-cortesias": "Emissão de cortesias",
    "vendas-por-grupo": "Vendas",
    transacoes: "Transações",
    acesso: "Acesso",
    bordero: "Borderô",
    transferencias: "Transferências",
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
}

const PRODUCER_NAV: Array<{
    id: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    href?: string;
    children?: Array<{ id: string; label: string }>;
}> = [
    { id: "eventos", icon: Calendar, label: "Eventos", href: "/backstage/" },
    { id: "permissao", icon: UsersPlus, label: "Permissão" },
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

const MobileDrawer = ({ isOpen, onClose }: MobileDrawerProps) => {
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

                <nav className="flex flex-col gap-0.5">
                    {PRODUCER_NAV.map((entry) => {
                        const isActive = entry.id === "eventos";
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
                <ProducerRailItem icon={Users01} label="Público" />
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

const EventRail = ({ activeSection, activeItem }: EventRailProps) => (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[280px] shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl bg-primary p-3 md:flex">
        <EventDetailsCard />
        <EventFunctionalitiesList activeSection={activeSection} activeItem={activeItem} />
    </aside>
);

const EventDetailsCard = () => (
    <div className="flex flex-col gap-4 rounded-2xl bg-secondary p-3">
        <div className="relative aspect-[256/292] w-full overflow-hidden rounded-2xl bg-secondary">
            <img
                src={eventCover}
                alt="Bahia x Vitória"
                className="size-full object-cover"
            />
            <span className="absolute top-3 left-3 rounded-xl bg-white/50 px-3 py-1 text-[12px] font-medium tracking-wide text-primary uppercase backdrop-blur-md">
                Rascunho
            </span>
            <div className="absolute bottom-3 right-3 flex w-12 flex-col items-center rounded-xl bg-white/50 px-2 py-3 text-primary backdrop-blur-md">
                <span className="text-[10px] font-medium tracking-wide uppercase">Sex</span>
                <span className="text-base font-bold leading-tight">27</span>
                <span className="text-[10px] font-medium tracking-wide uppercase">Dez</span>
            </div>
        </div>
        <div className="flex flex-col gap-0.5 px-1">
            <span className="text-xs text-tertiary">ID: 1234</span>
            <h3 className="text-md font-bold text-primary">Bahia x Vitória</h3>
            <p className="text-sm text-tertiary">Arena Fonte Nova - Salvador, BA</p>
        </div>
        <div className="flex items-center gap-2 px-1">
            <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-fg-secondary ring-1 ring-border-primary shadow-xs transition duration-100 ease-linear hover:bg-primary_hover"
                aria-label="Pré-visualizar evento"
            >
                <Eye className="size-4" />
            </button>
            <Button size="sm" color="primary" className="flex-1">
                Publicar evento
            </Button>
        </div>
    </div>
);

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
            <TreeView.Item id="informacoes-evento" textValue="Informações do evento">
                <TreeView.ItemContent icon={InfoCircle}>Informações do evento</TreeView.ItemContent>
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
                    <TreeView.ItemContent
                        className={itemClass("catalogo-produtos")}
                        action={
                            <Badge size="sm" type="pill-color" color="error">
                                Novo
                            </Badge>
                        }
                    >
                        Produtos
                    </TreeView.ItemContent>
                </TreeView.Item>
            </TreeView.Item>

            <TreeView.Item id="cortesias" textValue="Cortesias">
                <TreeView.ItemContent
                    icon={Ticket01}
                    action={
                        <Badge size="sm" type="pill-color" color="error">
                            Novo
                        </Badge>
                    }
                >
                    Cortesias
                </TreeView.ItemContent>
                <TreeView.Item id="permissao-envio" textValue="Permissão de envio">
                    <TreeView.ItemContent>Permissão de envio</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="emissao-cortesias" textValue="Emissão de cortesias" href="/backstage/cortesias">
                    <TreeView.ItemContent className={itemClass("emissao-cortesias")}>Emissão de cortesias</TreeView.ItemContent>
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
            </TreeView.Item>

            <TreeView.Item id="marketing" textValue="Marketing">
                <TreeView.ItemContent icon={Announcement01}>Marketing</TreeView.ItemContent>
                <TreeView.Item id="chave-de-acesso" textValue="Chave de acesso" href="/backstage/marketing/chave-de-acesso">
                    <TreeView.ItemContent className={itemClass("chave-de-acesso")}>Chave de acesso</TreeView.ItemContent>
                </TreeView.Item>
            </TreeView.Item>

            <TreeView.Item id="pesquisas" textValue="Coleta de dados">
                <TreeView.ItemContent
                    icon={BarChartSquare02}
                    action={
                        <Badge size="sm" type="pill-color" color="error">
                            Novo
                        </Badge>
                    }
                >
                    Coleta de dados
                </TreeView.ItemContent>
                <TreeView.Item id="formularios-compra" textValue="Perguntas por ingresso" href="/backstage/pesquisas">
                    <TreeView.ItemContent className={itemClass("formularios-compra")}>
                        <span className="flex items-center gap-2 ml-2">
                            • Perguntas por ingresso
                        </span>
                    </TreeView.ItemContent>
                </TreeView.Item>
            </TreeView.Item>
        </TreeView>
    );
};
