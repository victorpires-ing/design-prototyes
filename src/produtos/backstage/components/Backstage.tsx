import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import type { Key } from "react-aria-components";
import {
    Announcement01,
    Bank,
    Calendar,
    ChevronDown,
    Eye,
    File03,
    InfoCircle,
    Menu02,
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
import { ThemeToggle } from "./ThemeToggle";

export type BackstageSection =
    | "informacoes-evento"
    | "itens"
    | "cortesias"
    | "relatorios"
    | "marketing";

export type BackstageItem =
    | "permissao-envio"
    | "emissao-cortesias"
    | "vendas-por-grupo"
    | "transacoes"
    | "acesso"
    | "bordero"
    | "transferencias";

const DISABLED_KEYS: Key[] = ["informacoes-evento", "itens", "permissao-envio", "marketing"];

interface BackstageLayoutProps {
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
    children: ReactNode;
}

export function BackstageLayout({ activeSection, activeItem, children }: BackstageLayoutProps) {
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
        <div className="min-h-screen bg-primary">
            <MobileTopBar onOpenMenu={() => setIsMobileMenuOpen(true)} />
            <MobileDrawer
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                activeSection={activeSection}
                activeItem={activeItem}
            />
            <div className="flex min-h-screen gap-3 px-3 py-3 md:py-6">
                <ProducerRail />
                <EventRail activeSection={activeSection} activeItem={activeItem} />
                {children}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Mobile top bar + drawer                                           */
/* ------------------------------------------------------------------ */

const MobileTopBar = ({ onOpenMenu }: { onOpenMenu: () => void }) => (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-secondary bg-primary px-4 py-3 md:hidden">
        <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Abrir menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
        >
            <Menu02 className="size-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
            <img
                src="/event-cover.png"
                alt=""
                className="size-9 shrink-0 rounded-md object-cover"
            />
            <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-primary">
                    Semana Santa dos Milagres 2026
                </span>
                <span className="truncate text-xs text-tertiary">ID: 1234 · Rascunho</span>
            </div>
        </div>
    </header>
);

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
}

const MobileDrawer = ({ isOpen, onClose, activeSection, activeItem }: MobileDrawerProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex md:hidden">
            <button
                type="button"
                aria-label="Fechar menu"
                onClick={onClose}
                className="absolute inset-0 bg-overlay"
            />
            <aside className="relative flex h-full w-[85%] max-w-[340px] flex-col gap-3 overflow-y-auto bg-secondary p-3 shadow-xl">
                <div className="flex items-center justify-between gap-2">
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
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar menu"
                        className="flex size-9 items-center justify-center rounded-md text-fg-secondary transition duration-100 ease-linear hover:bg-tertiary"
                    >
                        <XClose className="size-5" />
                    </button>
                </div>

                <nav className="grid grid-cols-5 gap-1 rounded-xl bg-tertiary p-2">
                    <MobileProducerNavItem icon={Calendar} label="Eventos" isActive />
                    <MobileProducerNavItem icon={UsersPlus} label="Equipe" />
                    <MobileProducerNavItem icon={Bank} label="Finanças" />
                    <MobileProducerNavItem icon={Users01} label="Público" />
                    <MobileProducerNavItem icon={Settings01} label="Ajustes" />
                </nav>

                <EventDetailsCard />
                <EventFunctionalitiesList activeSection={activeSection} activeItem={activeItem} />

                <div className="mt-auto pt-2">
                    <ThemeToggle />
                </div>
            </aside>
        </div>
    );
};

const MobileProducerNavItem = ({ icon: Icon, label, isActive }: ProducerRailItemProps) => (
    <button
        type="button"
        className={cx(
            "flex flex-col items-center gap-1 rounded-md px-1 py-2 transition duration-100 ease-linear",
            isActive ? "text-secondary" : "text-tertiary hover:text-secondary_hover",
        )}
    >
        <span
            className={cx(
                "flex size-9 items-center justify-center rounded-lg transition duration-100 ease-linear",
                isActive ? "bg-primary" : "hover:bg-secondary_hover",
            )}
        >
            <Icon className="size-5" />
        </span>
        <span className="truncate text-[10px] font-medium">{label}</span>
    </button>
);

interface ProducerRailItemProps {
    icon: ComponentType<{ className?: string }>;
    label: string;
    isActive?: boolean;
}

const ProducerRailItem = ({ icon: Icon, label, isActive }: ProducerRailItemProps) => (
    <button
        type="button"
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
        <span className="text-xs font-medium">{label}</span>
    </button>
);

const ProducerRail = () => (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[72px] shrink-0 flex-col items-center justify-between rounded-2xl bg-secondary py-4 lg:flex">
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
                <ProducerRailItem icon={Calendar} label="Eventos" isActive />
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
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[280px] shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl bg-secondary p-3 md:flex">
        <EventDetailsCard />
        <EventFunctionalitiesList activeSection={activeSection} activeItem={activeItem} />
    </aside>
);

const EventDetailsCard = () => (
    <div className="flex flex-col gap-4 rounded-2xl bg-tertiary p-3">
        <div className="relative aspect-[256/292] w-full overflow-hidden rounded-2xl bg-tertiary">
            <img
                src="/event-cover.png"
                alt="Semana Santa dos Milagres 2026"
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
            <h3 className="text-md font-bold text-primary">Semana Santa dos Milagres 2026</h3>
            <p className="text-sm text-tertiary">Casa Marceneiro - Milagres - Passo…</p>
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
                <TreeView.Item id="vendas-por-grupo" textValue="Vendas por grupo" href="/backstage/relatorios/vendas-por-grupo">
                    <TreeView.ItemContent className={itemClass("vendas-por-grupo")}>Vendas por grupo</TreeView.ItemContent>
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
            </TreeView.Item>
        </TreeView>
    );
};
