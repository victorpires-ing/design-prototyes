import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { IconChevronDown, IconGrid, IconMenu, IconSearch, IconShield } from "./retool/icons";
import "./retool/retool.css";

type ItemRail = "menu" | "apps" | "antifraude" | "consultas";

interface AntifraudeShellProps {
    children: ReactNode;
    railAtivo?: ItemRail;
    navAtiva?: "listas" | "monitores";
}

const RAIL: { id: ItemRail; icon: typeof IconMenu; label: string }[] = [
    { id: "menu", icon: IconMenu, label: "Menu" },
    { id: "apps", icon: IconGrid, label: "Aplicações" },
    { id: "antifraude", icon: IconShield, label: "Antifraude" },
    { id: "consultas", icon: IconSearch, label: "Consultas" },
];

/**
 * Shell da ferramenta interna (Retool): rail escuro à esquerda, barra
 * superior com os menus Listas/Monitores e o badge de ambiente.
 */
export function AntifraudeShell({ children, railAtivo = "antifraude", navAtiva = "listas" }: AntifraudeShellProps) {
    const navigate = useNavigate();

    return (
        <div className="rt-app flex min-h-screen">
            <nav
                aria-label="Aplicações"
                className="sticky top-0 flex h-screen w-14 shrink-0 flex-col items-center gap-1 bg-[var(--rt-rail)] py-3"
            >
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    aria-label="Início"
                    className="mb-2 grid size-8 place-items-center rounded-[6px] bg-[#f0353f] text-[13px] font-bold text-white hover:opacity-90"
                >
                    i
                </button>

                {RAIL.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        aria-label={item.label}
                        aria-current={railAtivo === item.id ? "true" : undefined}
                        className={cx(
                            "grid size-9 place-items-center rounded-[6px]",
                            railAtivo === item.id ? "bg-white/12 text-white" : "text-white/45 hover:bg-white/8 hover:text-white/80",
                        )}
                    >
                        <item.icon size={18} />
                    </button>
                ))}

                <span className="mt-auto grid size-8 place-items-center rounded-full bg-[#2c2e35] text-[11px] font-semibold text-white/80">
                    LB
                </span>
            </nav>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-40 flex h-12 items-center justify-between gap-4 border-b border-[var(--rt-border)] bg-[var(--rt-surface)] px-4">
                    <div className="flex items-center gap-1">
                        {(["listas", "monitores"] as const).map((item) => (
                            <button
                                key={item}
                                type="button"
                                className={cx(
                                    "flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[13px] font-medium capitalize",
                                    navAtiva === item
                                        ? "bg-[var(--rt-primary-tint-strong)] text-[var(--rt-primary-hover)]"
                                        : "text-[var(--rt-text-secondary)] hover:bg-[var(--rt-surface-hover)]",
                                )}
                            >
                                {item}
                                <IconChevronDown size={12} />
                            </button>
                        ))}
                    </div>

                    <span className="rounded-[4px] border border-[var(--rt-border)] bg-[var(--rt-surface-subtle)] px-2 py-1 text-[11px] font-medium text-[var(--rt-text-secondary)]">
                        Produção
                    </span>
                </header>

                <main className="flex min-w-0 flex-1 flex-col">{children}</main>
            </div>
        </div>
    );
}
