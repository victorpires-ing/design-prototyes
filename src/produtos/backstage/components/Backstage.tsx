import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import type { Key } from "react-aria-components";
import {
    Announcement01,
    Bank,
    BarChartSquare02,
    Calendar,
    ChevronDown,
    ChevronRight,
    ChevronSelectorVertical,
    DotsGrid,
    Eye,
    File03,
    Globe01,
    InfoCircle,
    LayoutLeft,
    LayoutTop,
    LogOut01,
    Menu02,
    Moon01,
    Package,
    SearchLg,
    Settings01,
    ShoppingBag03,
    ShoppingCart01,
    Sun,
    Ticket01,
    UserSquare,
    Users01,
    UsersPlus,
    XClose,
} from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { NavButton } from "@/components/application/app-navigation/base-components/nav-button";
import { TreeView } from "@/components/application/tree-view/tree-view";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";
import { EVENTO_STATUS_LABEL, useEventoAtual } from "../eventos/data/eventos";
import { RemixProvider } from "./remix/remix-context";
import { RemixDock, RemixLauncher } from "./remix/RemixShell";
import LogoBlack from "../../../assets/Company logo_black.svg";
import LogoWhite from "../../../assets/Company logo_white.svg";

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

export type BackstageSection =
    | "visao-geral"
    | "bilheteria"
    | "equipe-e-permissoes"
    | "informacoes-evento"
    | "itens"
    | "pesquisas"
    | "cortesias"
    | "equipe-de-operacao"
    | "relatorios"
    | "marketing";

export type BackstageItem =
    | "visao-geral"
    | "bilheteria-online"
    | "permissao-envio"
    | "catalogo-itens"
    | "catalogo-ingressos"
    | "catalogo-combos"
    | "catalogo-produtos"
    | "catalogo-aberturas"
    | "emissao-cortesias"
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

const DISABLED_KEYS: Key[] = ["informacoes-evento", "catalogo-combos", "catalogo-produtos"];

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

const SWITCHER_STORAGE_KEY = "backstage-layout-switcher-visivel";

/**
 * O switch de layout é uma ferramenta de protótipo, não de produto: fica
 * escondido e só aparece com Shift+L. A escolha persiste entre as telas.
 */
function useLayoutSwitcherVisivel(): boolean {
    const [visivel, setVisivel] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem(SWITCHER_STORAGE_KEY) === "1";
    });

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (!event.shiftKey || event.key.toLowerCase() !== "l" || event.metaKey || event.ctrlKey || event.altKey) return;

            // Não intercepta enquanto o usuário digita.
            const alvo = event.target as HTMLElement | null;
            if (alvo?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(alvo?.tagName ?? "")) return;

            event.preventDefault();
            setVisivel((atual) => {
                const proximo = !atual;
                try {
                    window.localStorage.setItem(SWITCHER_STORAGE_KEY, proximo ? "1" : "0");
                } catch {
                    /* storage indisponível — vale só para esta sessão */
                }
                return proximo;
            });
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return visivel;
}

export function BackstageLayout(props: BackstageLayoutProps) {
    return (
        <RemixProvider>
            <BackstageShell {...props} />
        </RemixProvider>
    );
}

function BackstageShell({
    activeSection,
    activeItem,
    activeProducer,
    showEventContext = true,
    showLayoutSwitcher = true,
    children,
}: BackstageLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [variant, setVariant] = useLayoutVariant();
    const switcherVisivel = useLayoutSwitcherVisivel();

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
            <MobileTopBar onOpenMenu={() => setIsMobileMenuOpen(true)} />
            <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </>
    );

    const mobileContext = showEventContext && <MobileEventNav activeSection={activeSection} activeItem={activeItem} />;

    if (variant === "topbar") {
        return (
            <div
                className={cx(
                    "min-h-screen bg-secondary md:[--bs-header-offset:64px] dark:bg-[#0a0a0a]",
                    showEventContext ? "[--bs-header-offset:120px]" : "[--bs-header-offset:56px]",
                )}
            >
                {mobileChrome}
                <OrgTopBar activeProducer={activeProducer} />
                {mobileContext}
                <div className="flex flex-col gap-3 px-3 py-3 md:flex-row md:gap-6 md:px-6 md:py-6">
                    {showEventContext && <EventRailTop activeSection={activeSection} activeItem={activeItem} />}
                    <main className="flex min-w-0 flex-1 flex-col">
                        <div className="mx-auto flex w-full max-w-[1088px] flex-1 flex-col">{children}</div>
                    </main>
                    <RemixDock />
                </div>
                {showLayoutSwitcher && switcherVisivel && <LayoutSwitcher variant={variant} onChange={setVariant} />}
                <RemixLauncher />
            </div>
        );
    }

    return (
        <div
            className={cx(
                "min-h-screen bg-secondary md:[--bs-header-offset:0px] dark:bg-[#0a0a0a]",
                showEventContext ? "[--bs-header-offset:120px]" : "[--bs-header-offset:56px]",
            )}
        >
            {mobileChrome}
            {mobileContext}
            <div className="flex flex-col gap-3 px-3 py-3 md:flex-row md:min-h-screen md:py-6">
                <ProducerRail activeProducer={activeProducer} />
                {showEventContext && <EventRail activeSection={activeSection} activeItem={activeItem} />}
                {children}
                <RemixDock />
            </div>
            {showLayoutSwitcher && switcherVisivel && <LayoutSwitcher variant={variant} onChange={setVariant} />}
            <RemixLauncher />
        </div>
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
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full bg-primary p-1 shadow-lg ring-1 ring-border-secondary">
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
/*  Animação das gavetas mobile                                        */
/* ------------------------------------------------------------------ */

const SHEET_EASE = [0.32, 0.72, 0, 1] as const;
const sheetTransition = { duration: 0.28, ease: SHEET_EASE };

/** Entrada escalonada dos itens dentro da gaveta. */
const listVariants = {
    hidden: {},
    visible: { transition: { delayChildren: 0.12, staggerChildren: 0.035 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
};

/* ------------------------------------------------------------------ */
/*  Navegação da organização                                           */
/* ------------------------------------------------------------------ */

interface OrgSection {
    id: string;
    icon: ComponentType<{ className?: string }>;
    label: string;
    href?: string;
}

/** Seções da organização — compartilhadas pelo rail, pela topbar e pelo menu mobile. */
const ORG_SECTIONS: OrgSection[] = [
    { id: "eventos", icon: Calendar, label: "Eventos", href: "/backstage/eventos" },
    { id: "membros", icon: UserSquare, label: "Membros" },
    { id: "financas", icon: Bank, label: "Finanças" },
    { id: "produtos", icon: ShoppingBag03, label: "Produtos" },
    { id: "publico", icon: Users01, label: "Público", href: "/backstage/publico" },
    { id: "ajustes", icon: Settings01, label: "Ajustes" },
];

const ORG_NAME = "{org_name}";
const ORG_INITIALS = "OR";
const RECENT_ORGS = ["Ingresse Produções", "Arena das Dunas", "Casa Marceneiro"];

const CURRENT_USER = {
    name: "Olivia Rhye",
    email: "olivia@untitledui.com",
    avatar: "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80",
};

/* ------------------------------------------------------------------ */
/*  Mobile top bar + menu da organização                              */
/* ------------------------------------------------------------------ */

const MobileTopBar = ({ onOpenMenu }: { onOpenMenu: () => void }) => (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-3 border-b border-secondary bg-primary px-4 md:hidden">
        <BrandLogo className="h-5" />
        <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Abrir menu da organização"
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
        >
            <DotsGrid className="size-5" />
        </button>
    </header>
);

/**
 * Barra do evento no mobile: mostra capa, nome e status e abre a lista de
 * funcionalidades numa gaveta, como no `navbar-event-mobile` do design system.
 */
const MobileEventNav = ({ activeSection, activeItem }: EventRailProps) => {
    const evento = useEventoAtual();
    const { pathname } = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    // Navegar por um item da árvore fecha a gaveta.
    useEffect(() => setIsOpen(false), [pathname]);

    useEffect(() => {
        if (!isOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [isOpen]);

    const bar = (
        <div className="flex items-center gap-3 border-b border-secondary bg-primary px-4 py-3">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-expanded={isOpen}
                aria-label={isOpen ? "Fechar funcionalidades do evento" : "Abrir funcionalidades do evento"}
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
            >
                {isOpen ? <XClose className="size-5" /> : <Menu02 className="size-5" />}
            </button>
            <img src={evento.cover} alt="" className="size-10 shrink-0 rounded-md object-cover" />
            <p className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold text-primary">{evento.nome}</p>
            <Badge size="sm" type="pill-color" color={evento.status === "publicado" ? "success" : "gray"}>
                {EVENTO_STATUS_LABEL[evento.status]}
            </Badge>
        </div>
    );

    return (
        <div className="sticky top-14 z-[45] md:hidden">
            {bar}

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-x-0 bottom-0 z-[60] flex top-[var(--bs-header-offset,120px)]">
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={sheetTransition}
                            className="flex w-[84%] max-w-[340px] flex-col overflow-y-auto bg-primary shadow-xl"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.12, duration: 0.22 }}
                                className="p-3 [&_[role=row]]:min-h-10"
                            >
                                <EventFunctionalitiesList activeSection={activeSection} activeItem={activeItem} size="md" />
                            </motion.div>
                        </motion.div>
                        <motion.button
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={sheetTransition}
                            aria-label="Fechar funcionalidades do evento"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 bg-overlay/70"
                        />
                    </div>
                )}
            </AnimatePresence>
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
    { id: "eventos", icon: Calendar, label: "Eventos", href: "/backstage/eventos" },
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

const MobileDrawer = ({ isOpen, onClose }: MobileDrawerProps) => {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    // `system` precisa ser resolvido para mostrar o tema realmente em uso.
    const isDark =
        theme === "system" ? typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches : theme === "dark";
    const [isOrgSwitcherOpen, setIsOrgSwitcherOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsOrgSwitcherOpen(false);
            setIsUserMenuOpen(false);
        }
    }, [isOpen]);

    const go = (href?: string) => {
        if (href) navigate(href);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex md:hidden">
                    <motion.aside
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={sheetTransition}
                        className="relative flex h-full w-[84%] max-w-[340px] flex-col bg-primary shadow-xl"
                    >
                        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-secondary px-4">
                            <BrandLogo className="h-5" />
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Fechar menu"
                                className="flex size-9 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </header>

                        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
                            {/* Seletor de organização */}
                            <div className="relative flex flex-col">
                                <button
                                    type="button"
                                    onClick={() => setIsOrgSwitcherOpen((open) => !open)}
                                    aria-expanded={isOrgSwitcherOpen}
                                    className="flex items-center gap-3 rounded-lg bg-secondary p-3 text-left transition duration-100 ease-linear hover:bg-secondary_hover"
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-tertiary text-sm font-semibold text-secondary">
                                        {ORG_INITIALS}
                                    </span>
                                    <span className="flex-1 truncate text-sm font-semibold text-primary">{ORG_NAME}</span>
                                    <ChevronSelectorVertical className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                </button>

                                {isOrgSwitcherOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.16, ease: "easeOut" }}
                                        className="absolute inset-x-0 top-full z-10 mt-2 flex flex-col rounded-lg bg-primary py-1 shadow-lg ring-1 ring-border-secondary"
                                    >
                                        <MenuRow icon={Settings01} label="Configurar organização" onClick={onClose} />
                                        <p className="px-3 pt-2 pb-1 text-sm text-tertiary">Recentes</p>
                                        {RECENT_ORGS.map((org) => (
                                            <button
                                                key={org}
                                                type="button"
                                                onClick={onClose}
                                                className="flex items-center gap-3 px-3 py-2 text-left transition duration-100 ease-linear hover:bg-primary_hover"
                                            >
                                                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-tertiary text-sm font-semibold text-secondary">
                                                    {ORG_INITIALS}
                                                </span>
                                                <span className="flex-1 truncate text-sm text-primary">{org}</span>
                                            </button>
                                        ))}
                                        <div className="p-2">
                                            <Button size="sm" color="secondary" iconLeading={SearchLg} className="w-full">
                                                Pesquisar
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Seções da organização */}
                            <motion.nav
                                variants={listVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-3 gap-x-2 gap-y-6"
                            >
                                {ORG_SECTIONS.map((section) => (
                                    <motion.button
                                        key={section.id}
                                        variants={itemVariants}
                                        type="button"
                                        onClick={() => go(section.href)}
                                        className="flex flex-col items-center gap-2 rounded-lg py-2 transition-colors duration-100 ease-linear hover:bg-secondary"
                                    >
                                        <section.icon className="size-6 text-fg-secondary" />
                                        <span className="text-sm text-secondary">{section.label}</span>
                                    </motion.button>
                                ))}
                            </motion.nav>
                        </div>

                        {/* Conta do usuário */}
                        <div className="shrink-0 border-t border-secondary p-4">
                            {isUserMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.16, ease: "easeOut" }}
                                    className="mb-2 flex flex-col rounded-lg bg-primary py-1 shadow-lg ring-1 ring-border-secondary"
                                >
                                    <MenuRow icon={Globe01} label="Alterar idioma" onClick={() => setIsUserMenuOpen(false)} />
                                    <MenuRow
                                        icon={isDark ? Moon01 : Sun}
                                        label="Alterar cores"
                                        trailing={<span className="text-sm text-tertiary">{isDark ? "Escuro" : "Claro"}</span>}
                                        onClick={() => setTheme(isDark ? "light" : "dark")}
                                    />
                                    <MenuRow icon={LogOut01} label="Sair" onClick={() => setIsUserMenuOpen(false)} />
                                </motion.div>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsUserMenuOpen((open) => !open)}
                                aria-expanded={isUserMenuOpen}
                                className="flex w-full items-center gap-3 rounded-lg p-1 text-left transition duration-100 ease-linear hover:bg-secondary"
                            >
                                <Avatar src={CURRENT_USER.avatar} alt={CURRENT_USER.name} size="md" status="online" />
                                <span className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-semibold text-primary">{CURRENT_USER.name}</span>
                                    <span className="truncate text-sm text-tertiary">{CURRENT_USER.email}</span>
                                </span>
                                <ChevronRight className="size-5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                            </button>
                        </div>
                    </motion.aside>

                    <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={sheetTransition}
                        aria-label="Fechar menu"
                        onClick={onClose}
                        className="flex-1 bg-overlay/70"
                    />
                </div>
            )}
        </AnimatePresence>
    );
};

interface MenuRowProps {
    icon: ComponentType<{ className?: string }>;
    label: string;
    trailing?: ReactNode;
    onClick?: () => void;
}

const MenuRow = ({ icon: Icon, label, trailing, onClick }: MenuRowProps) => (
    <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 px-3 py-2 text-left transition duration-100 ease-linear hover:bg-primary_hover"
    >
        <Icon className="size-5 shrink-0 text-fg-quaternary" />
        <span className="flex-1 truncate text-sm text-primary">{label}</span>
        {trailing}
    </button>
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
                {ORG_SECTIONS.map((section) => (
                    <ProducerRailItem
                        key={section.id}
                        icon={section.icon}
                        label={section.label}
                        href={section.href}
                        isActive={activeProducer === section.id || (section.id === "eventos" && !activeProducer)}
                    />
                ))}
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
    <aside
        className={cx(
            "sticky top-6 hidden h-[calc(100vh-3rem)] w-[280px] shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl bg-primary p-3 md:flex",
            SOFT_SCROLLBAR,
        )}
    >
        <EventDetailsCard />
        <EventFunctionalitiesList activeSection={activeSection} activeItem={activeItem} />
    </aside>
);

/* ------------------------------------------------------------------ */
/*  Nova shell — barra horizontal da organização no topo.              */
/* ------------------------------------------------------------------ */

const ORG_NAV = ORG_SECTIONS;

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
    <aside
        className={cx(
            "sticky top-22 hidden h-[calc(100vh-7rem)] w-[280px] shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl bg-primary p-3 md:flex",
            SOFT_SCROLLBAR,
        )}
    >
        <EventDetailsCard />
        <EventFunctionalitiesList activeSection={activeSection} activeItem={activeItem} />
    </aside>
);

const EventDetailsCard = () => {
    const evento = useEventoAtual();

    return (
        <div className="flex flex-col gap-4 rounded-2xl bg-secondary p-3">
            <div className="relative aspect-[256/292] w-full overflow-hidden rounded-2xl bg-secondary">
                <img src={evento.cover} alt={evento.nome} className="size-full object-cover" />
                <span className="absolute top-3 left-3 rounded-xl bg-white/50 px-3 py-1 text-[12px] font-medium tracking-wide text-primary uppercase backdrop-blur-md">
                    {EVENTO_STATUS_LABEL[evento.status]}
                </span>
                <div className="absolute right-3 bottom-3 flex w-12 flex-col items-center rounded-xl bg-white/50 px-2 py-3 text-primary backdrop-blur-md">
                    <span className="text-[10px] font-medium tracking-wide uppercase">{evento.weekday}</span>
                    <span className="text-base leading-tight font-bold">{evento.day}</span>
                    <span className="text-[10px] font-medium tracking-wide uppercase">{evento.month}</span>
                </div>
            </div>
            <div className="flex flex-col gap-0.5 px-1">
                <span className="text-xs text-tertiary">ID: {evento.id}</span>
                <h3 className="text-md font-bold text-primary">{evento.nome}</h3>
                <p className="text-sm text-tertiary">{evento.produtor}</p>
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
                    {evento.status === "publicado" ? "Ver evento" : "Publicar evento"}
                </Button>
            </div>
        </div>
    );
};

interface EventFunctionalitiesListProps {
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
    /** `md` deixa as linhas com 40px — usado na gaveta mobile. */
    size?: "sm" | "md";
}

const ACTIVE_CLASS = "bg-tertiary hover:bg-tertiary";

const EventFunctionalitiesList = ({ activeSection, activeItem, size = "sm" }: EventFunctionalitiesListProps) => {
    const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(() => new Set(activeSection ? [activeSection] : []));

    useEffect(() => {
        if (activeSection) {
            setExpandedKeys((prev) => (prev.has(activeSection) ? prev : new Set([...prev, activeSection])));
        }
    }, [activeSection]);

    const itemClass = (id: BackstageItem) => (activeItem === id ? ACTIVE_CLASS : undefined);

    return (
        <TreeView
            aria-label="Funcionalidades do evento"
            size={size}
            selectionMode="none"
            disabledKeys={DISABLED_KEYS}
            expandedKeys={expandedKeys}
            onExpandedChange={(keys: Set<Key>) => setExpandedKeys(new Set(keys))}
        >
            <TreeView.Item id="visao-geral" textValue="Visão geral" href="/backstage/evento/visao-geral">
                <TreeView.ItemContent icon={BarChartSquare02} className={activeSection === "visao-geral" ? ACTIVE_CLASS : undefined}>
                    Visão geral
                </TreeView.ItemContent>
            </TreeView.Item>

            <TreeView.Item id="informacoes-evento" textValue="Informações do evento">
                <TreeView.ItemContent icon={InfoCircle}>Informações do evento</TreeView.ItemContent>
            </TreeView.Item>

            <TreeView.Item id="equipe-de-operacao" textValue="Equipe de operação" href="/backstage/equipe-de-operacao">
                <TreeView.ItemContent icon={UsersPlus} className={activeSection === "equipe-de-operacao" ? ACTIVE_CLASS : undefined}>
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

            <TreeView.Item id="bilheteria" textValue="Bilheteria">
                <TreeView.ItemContent icon={ShoppingCart01}>Bilheteria</TreeView.ItemContent>
                <TreeView.Item id="bilheteria-online" textValue="Bilheteria online" href="/backstage/bilheteria">
                    <TreeView.ItemContent className={itemClass("bilheteria-online")}>Bilheteria online</TreeView.ItemContent>
                </TreeView.Item>
            </TreeView.Item>

            <TreeView.Item id="cortesias" textValue="Cortesias">
                <TreeView.ItemContent icon={Ticket01}>Cortesias</TreeView.ItemContent>
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
                <TreeView.Item id="comparativos" textValue="Comparativos" href="/backstage/relatorios/comparativos">
                    <TreeView.ItemContent className={itemClass("comparativos")}>Comparativos</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item id="relatorio-questionarios" textValue="Questionários" href="/backstage/relatorios/questionarios">
                    <TreeView.ItemContent className={itemClass("relatorio-questionarios")}>Questionários</TreeView.ItemContent>
                </TreeView.Item>
                <TreeView.Item
                    id="relatorio-personalizado"
                    textValue="Relatório personalizado"
                    href="/backstage/relatorios/relatorio-personalizado"
                >
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
