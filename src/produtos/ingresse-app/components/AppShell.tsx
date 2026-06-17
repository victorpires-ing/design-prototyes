import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Home02, SearchLg, Ticket02, User01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export type AppTab = "inicio" | "buscar" | "ingressos" | "perfil";

const TABS: { id: AppTab; label: string; icon: typeof Home02; to?: string }[] = [
    { id: "inicio", label: "Início", icon: Home02, to: "/ingresse-app" },
    { id: "buscar", label: "Buscar", icon: SearchLg },
    { id: "ingressos", label: "Ingressos", icon: Ticket02, to: "/ingresse-app/ingressos" },
    { id: "perfil", label: "Perfil", icon: User01, to: "/ingresse-app/perfil" },
];

interface AppShellProps {
    activeTab?: AppTab;
    showTabBar?: boolean;
    children: ReactNode;
}

/** Shell mobile (frame de celular + tab bar inferior) reaproveitável entre as telas do app. */
export function AppShell({ activeTab, showTabBar = true, children }: AppShellProps) {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen justify-center bg-secondary md:py-8">
            <div className="relative flex min-h-screen w-full max-w-[420px] flex-col overflow-hidden bg-primary md:h-[860px] md:min-h-0 md:rounded-[2.5rem] md:shadow-2xl md:ring-1 md:ring-border-secondary">
                <div className={cx("scrollbar-hide flex-1 overflow-y-auto", showTabBar && "pb-24")}>{children}</div>

                {showTabBar && (
                    <nav className="absolute inset-x-0 bottom-0 flex items-center justify-around border-t border-secondary bg-primary px-2 pt-2 pb-4">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const active = tab.id === activeTab;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => tab.to && navigate(tab.to)}
                                    className="flex flex-1 flex-col items-center gap-1 rounded-lg py-1 transition duration-100 ease-linear"
                                >
                                    <Icon className={cx("size-6", active ? "text-fg-brand-primary" : "text-fg-quaternary")} />
                                    <span className={cx("text-xs", active ? "font-semibold text-brand-secondary" : "text-tertiary")}>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                )}
            </div>
        </div>
    );
}
