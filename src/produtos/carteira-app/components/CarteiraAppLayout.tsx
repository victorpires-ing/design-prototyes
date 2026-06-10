import type { ComponentType, ReactNode } from "react";
import { Bell01, Home01, Ticket01, User01, Wallet01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { useForceLightTheme } from "./use-light-theme";

export type CarteiraAppTab = "inicio" | "meus-ingressos" | "carteira" | "perfil";

interface TabDef {
    id: CarteiraAppTab;
    label: string;
    icon: ComponentType<{ className?: string }>;
    href: string;
}

const TABS: TabDef[] = [
    { id: "inicio", label: "Início", icon: Home01, href: "/carteira-app" },
    { id: "meus-ingressos", label: "Ingressos", icon: Ticket01, href: "/carteira-app/meus-ingressos" },
    { id: "carteira", label: "Carteira", icon: Wallet01, href: "/carteira-app/carteira" },
    { id: "perfil", label: "Perfil", icon: User01, href: "/carteira-app/perfil" },
];

interface CarteiraAppLayoutProps {
    title: string;
    activeTab?: CarteiraAppTab;
    /** Conteúdo do header à direita (ex: ação). Default: sino de notificações. */
    headerAction?: ReactNode;
    children: ReactNode;
}

export function CarteiraAppLayout({ title, activeTab, headerAction, children }: CarteiraAppLayoutProps) {
    const navigate = useNavigate();
    useForceLightTheme();

    return (
        <div className="flex min-h-screen justify-center bg-secondary md:py-6">
            {/* moldura mobile */}
            <div className="relative flex min-h-screen w-full max-w-md flex-col bg-primary md:min-h-[calc(100vh-3rem)] md:rounded-3xl md:shadow-xl md:ring-1 md:ring-border-secondary">
                <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-secondary bg-primary/90 px-5 py-4 backdrop-blur-md md:rounded-t-3xl">
                    <h1 className="text-lg font-bold text-primary">{title}</h1>
                    {headerAction ?? (
                        <button
                            type="button"
                            aria-label="Notificações"
                            className="flex size-9 items-center justify-center rounded-full text-fg-secondary transition duration-100 ease-linear hover:bg-secondary"
                        >
                            <Bell01 className="size-5" />
                        </button>
                    )}
                </header>

                <main className="flex flex-1 flex-col overflow-y-auto px-5 pt-4 pb-24">{children}</main>

                {/* tab bar */}
                <nav className="absolute inset-x-0 bottom-0 flex items-stretch justify-around border-t border-secondary bg-primary/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:rounded-b-3xl">
                    {TABS.map((tab) => {
                        const isActive = tab.id === activeTab;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => navigate(tab.href)}
                                className={cx(
                                    "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 transition duration-100 ease-linear",
                                    isActive ? "text-brand-secondary" : "text-tertiary hover:text-secondary_hover",
                                )}
                            >
                                <tab.icon className="size-6" />
                                <span className="text-xs font-medium">{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
