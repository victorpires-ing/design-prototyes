import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon01, Sun } from "@untitledui/icons";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

/* ------------------------------------------------------------------ */
/*  Theme toggle (product-local)                                      */
/* ------------------------------------------------------------------ */

const resolveSystemTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();
    const [systemTheme, setSystemTheme] = useState<"light" | "dark">(resolveSystemTheme);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => setSystemTheme(mq.matches ? "dark" : "light");
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const effectiveTheme = theme === "system" ? systemTheme : theme;
    const isDark = effectiveTheme === "dark";

    const handleToggle = useCallback(() => {
        setTheme(isDark ? "light" : "dark");
    }, [isDark, setTheme]);

    return (
        <button
            type="button"
            onClick={handleToggle}
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            title={isDark ? "Tema claro" : "Tema escuro"}
            className={cx(
                "relative flex size-9 items-center justify-center overflow-hidden rounded-md bg-primary text-fg-secondary ring-1 ring-border-primary shadow-xs transition duration-100 ease-linear hover:bg-primary_hover",
                className,
            )}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={isDark ? "moon" : "sun"}
                    initial={{ y: 8, opacity: 0, rotate: -45 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: -8, opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="flex items-center justify-center"
                >
                    {isDark ? <Moon01 className="size-5" /> : <Sun className="size-5" />}
                </motion.span>
            </AnimatePresence>
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Layout shell                                                      */
/* ------------------------------------------------------------------ */

export interface FutebolNavItem {
    id: string;
    label: string;
    href: string;
}

const DEFAULT_NAV: FutebolNavItem[] = [
    { id: "jogos", label: "Jogos", href: "#jogos" },
    { id: "ingressos", label: "Ingressos", href: "#ingressos" },
    { id: "clube", label: "Clube", href: "#clube" },
];

export interface FutebolLayoutProps {
    children: ReactNode;
    /** Highlighted nav item id. */
    activeItem?: string;
    /** Override the default navigation entries. */
    navItems?: FutebolNavItem[];
}

export function FutebolLayout({
    children,
    activeItem,
    navItems = DEFAULT_NAV,
}: FutebolLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-primary text-primary">
            <header className="sticky top-0 z-40 border-b border-secondary bg-primary/80 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
                    <a href="#" className="flex items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-solid text-sm font-bold text-white">
                            ⚽
                        </span>
                        <span className="text-lg font-semibold text-primary">Futebol</span>
                    </a>

                    <nav className="hidden items-center gap-1 md:flex">
                        {navItems.map((item) => (
                            <a
                                key={item.id}
                                href={item.href}
                                className={cx(
                                    "rounded-md px-3 py-2 text-sm font-medium transition duration-100 ease-linear hover:bg-primary_hover",
                                    activeItem === item.id
                                        ? "text-brand-secondary"
                                        : "text-secondary hover:text-secondary_hover",
                                )}
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-secondary">
                <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-tertiary md:flex-row md:px-8">
                    <span>© 2026 Futebol — protótipo de landing pages.</span>
                    <span>Feito com Untitled UI</span>
                </div>
            </footer>
        </div>
    );
}
