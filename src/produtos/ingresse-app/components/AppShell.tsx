import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Home02, LogOut01, SearchLg, Ticket02, User01 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { AppToast } from "./AppToast";
import { ThemeToggle } from "./ThemeToggle";
import "./marca-ingresse.css";
import { sairDoPerfil, usePerfilAtivo } from "./perfil-ativo";

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
                        showTabBar && (perfil ? "pb-44" : "pb-24"),
                        bottomBar && "bg-secondary pb-36",
                        scrollClassName,
                    )}
                >
                    {children}
                </div>

                {/* Simulação de "Entrar como [dependente]": deixa claro qual perfil está em uso e como sair.
                    Não é a troca de perfis definitiva — por isso só aparece nas telas com a tab bar. */}
                {perfil && showTabBar && (
                    <div className="absolute inset-x-0 bottom-[84px] z-30 px-4 pb-2">
                        <div className="flex items-center gap-3 rounded-2xl bg-primary p-3 shadow-lg ring-1 ring-border-secondary">
                            <Avatar size="sm" initials={perfil.iniciais} alt={perfil.nome} />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-tertiary">Você está no perfil de</p>
                                <p className="truncate text-sm font-semibold text-primary">{perfil.nome}</p>
                            </div>
                            <Button
                                size="sm"
                                color="secondary"
                                iconLeading={LogOut01}
                                onClick={() => {
                                    sairDoPerfil();
                                    navigate("/ingresse-app/perfil/dependentes");
                                }}
                            >
                                Voltar ao meu perfil
                            </Button>
                        </div>
                    </div>
                )}

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
