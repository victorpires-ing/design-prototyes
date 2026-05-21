import { type ComponentType, type ReactNode } from "react";
import {
    Announcement01,
    Bank,
    Calendar,
    ChevronDown,
    ChevronUp,
    Eye,
    File03,
    InfoCircle,
    Settings01,
    ShoppingCart01,
    Ticket01,
    Users01,
    UsersPlus,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import { ThemeToggle } from "./ThemeToggle";

export type BackstageSection =
    | "informacoes-evento"
    | "itens"
    | "cortesias"
    | "relatorios"
    | "marketing";

export type BackstageItem = "permissao-envio" | "emissao-cortesias";

interface BackstageLayoutProps {
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
    children: ReactNode;
}

export function BackstageLayout({ activeSection, activeItem, children }: BackstageLayoutProps) {
    return (
        <div className="min-h-screen bg-primary">
            <div className="flex min-h-screen gap-3 px-3 py-6">
                <ProducerRail />
                <EventRail activeSection={activeSection} activeItem={activeItem} />
                {children}
            </div>
        </div>
    );
}

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

interface FunctionalitiesItem {
    id: BackstageSection;
    label: string;
    icon: ComponentType<{ className?: string }>;
    badge?: ReactNode;
    children?: { id: BackstageItem; label: string }[];
}

const functionalities: FunctionalitiesItem[] = [
    { id: "informacoes-evento", label: "Informações do evento", icon: InfoCircle },
    { id: "itens", label: "Itens", icon: ShoppingCart01 },
    {
        id: "cortesias",
        label: "Cortesias",
        icon: Ticket01,
        badge: (
            <Badge size="sm" type="pill-color" color="error">
                Novo
            </Badge>
        ),
        children: [
            { id: "permissao-envio", label: "Permissão de envio" },
            { id: "emissao-cortesias", label: "Emissão de cortesias" },
        ],
    },
    { id: "relatorios", label: "Relatórios", icon: File03 },
    { id: "marketing", label: "Marketing", icon: Announcement01 },
];

interface EventFunctionalitiesListProps {
    activeSection?: BackstageSection;
    activeItem?: BackstageItem;
}

const EventFunctionalitiesList = ({ activeSection, activeItem }: EventFunctionalitiesListProps) => (
    <nav className="flex flex-col gap-1 px-1">
        {functionalities.map((item) => {
            const isOpen = activeSection === item.id;
            const Chevron = isOpen ? ChevronUp : ChevronDown;
            return (
                <div key={item.id} className="flex flex-col gap-1">
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-sm px-2 py-2 text-left text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-secondary_hover"
                    >
                        <item.icon className="size-4 shrink-0 text-fg-quaternary" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge}
                        <Chevron className="size-4 shrink-0 text-fg-quaternary" />
                    </button>
                    {isOpen && item.children && (
                        <div className="flex flex-col gap-0.5 pl-6">
                            {item.children.map((child) => {
                                const isActive = activeItem === child.id;
                                return (
                                    <button
                                        key={child.id}
                                        type="button"
                                        className={cx(
                                            "rounded-sm px-2 py-2 text-left text-sm font-semibold transition duration-100 ease-linear",
                                            isActive
                                                ? "bg-tertiary text-secondary_hover"
                                                : "text-tertiary hover:bg-secondary_hover hover:text-secondary_hover",
                                        )}
                                    >
                                        {child.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        })}
    </nav>
);
