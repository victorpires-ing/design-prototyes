import type { ComponentType } from "react";
import { Home02, Plus, Rss01, User01 } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";

const TABS: { id: string; label: string; icon: ComponentType<{ className?: string }>; href: string; destaque?: boolean }[] = [
    { id: "inicio", label: "Início", icon: Home02, href: "/ticket-sports/hub/empresa" },
    { id: "feed", label: "Feed", icon: Rss01, href: "/ticket-sports/hub/feed" },
    { id: "perfil", label: "Perfil", icon: User01, href: "/ticket-sports/hub/perfil/editar" },
    { id: "novo", label: "Novo post", icon: Plus, href: "/ticket-sports/hub/empresa/publicar", destaque: true },
];

export function HubTabBarEmpresa({ active }: { active: string }) {
    const navigate = useNavigate();
    return (
        <nav className="absolute inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-secondary bg-primary px-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_28px_-10px_rgba(17,12,34,0.18)] md:rounded-b-3xl">
            {TABS.map((t) => {
                const isActive = t.id === active;
                if (t.destaque) {
                    return (
                        <button key={t.id} type="button" onClick={() => navigate(t.href)} className="flex flex-1 flex-col items-center gap-1">
                            <span className="flex size-9 items-center justify-center rounded-full bg-[#7C3AED] text-white shadow-md transition duration-150 hover:bg-[#6D28D9]">
                                <t.icon className="size-5" />
                            </span>
                            <span className="text-[11px] font-medium text-tertiary">{t.label}</span>
                        </button>
                    );
                }
                return (
                    <button key={t.id} type="button" onClick={() => navigate(t.href)} className="flex flex-1 flex-col items-center gap-1 pt-0.5">
                        <span
                            className={cx(
                                "flex h-7 items-center justify-center rounded-full px-4 transition duration-150 ease-out",
                                isActive ? "bg-[#7C3AED]/12 text-[#7C3AED]" : "text-tertiary",
                            )}
                        >
                            <t.icon className="size-5" strokeWidth={isActive ? 2.4 : 2} />
                        </span>
                        <span className={cx("text-[11px] transition duration-150", isActive ? "font-semibold text-[#7C3AED]" : "font-medium text-tertiary")}>
                            {t.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}
