import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Home02, SearchLg, Ticket02, User01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { AppToast } from "./AppToast";
import { ThemeToggle } from "./ThemeToggle";
import "./marca-ingresse.css";
import { FOTO_MINHA_CONTA, usePerfilAtivo } from "./perfil-ativo";

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
    /** Barra de ações fixa no rodapé do frame (acompanha o scroll). */
    bottomBar?: ReactNode;
    /** Classe extra para a área de scroll (ex.: "bg-secondary" para fundo cinza). */
    scrollClassName?: string;
    children: ReactNode;
}

/** Shell mobile (frame de celular + tab bar inferior) reaproveitável entre as telas do app. */
export function AppShell({ activeTab, showTabBar = true, bottomBar, scrollClassName, children }: AppShellProps) {
    const navigate = useNavigate();
    const perfil = usePerfilAtivo();

    // Interações no vermelho da marca só no app: a classe vai no <html> para alcançar também os sheets em portal.
    useEffect(() => {
        document.documentElement.classList.add("marca-ingresse");
        return () => document.documentElement.classList.remove("marca-ingresse");
    }, []);

    return (
        <div className="relative flex min-h-screen justify-center bg-secondary md:py-8">
            {/* Fora do celular: alterna claro/escuro (só aparece quando sobra área ao redor do frame) */}
            <div className="fixed top-6 right-6 z-50 hidden md:block">
                <ThemeToggle />
            </div>

            <div className="relative flex h-dvh w-full max-w-[420px] flex-col overflow-hidden bg-primary md:h-[calc(100dvh-4rem)] md:max-h-[860px] md:min-h-0 md:rounded-[2.5rem] md:shadow-2xl md:ring-1 md:ring-border-secondary">
                <div
                    className={cx(
                        "scrollbar-hide min-h-0 flex-1 overflow-y-auto",
                        showTabBar && "pb-24",
                        bottomBar && "bg-secondary pb-36",
                        scrollClassName,
                    )}
                >
                    {children}
                </div>

                {bottomBar && <div className="pointer-events-none absolute inset-0 z-20">{bottomBar}</div>}

                {/* Notificações do app, dentro da moldura do celular */}
                <AppToast ancora={bottomBar ? "barra-de-acoes" : showTabBar ? "tab-bar" : "rodape"} />

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
                                    {/* A aba Perfil mostra a bolinha do perfil em uso: a sua foto ou, num dependente, as iniciais dele */}
                                    {tab.id === "perfil" ? (
                                        <span
                                            className={cx(
                                                "flex size-6 items-center justify-center overflow-hidden rounded-full bg-tertiary text-[10px] font-semibold text-secondary ring-offset-1 ring-offset-bg-primary",
                                                active ? "ring-2 ring-fg-brand-primary" : "ring-1 ring-border-primary",
                                            )}
                                            aria-label={perfil ? `Perfil de ${perfil.nome}` : "Seu perfil"}
                                        >
                                            {perfil ? perfil.iniciais : <img src={FOTO_MINHA_CONTA} alt="" className="size-full object-cover" />}
                                        </span>
                                    ) : (
                                        <Icon className={cx("size-6", active ? "text-fg-brand-primary" : "text-fg-quaternary")} />
                                    )}
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
