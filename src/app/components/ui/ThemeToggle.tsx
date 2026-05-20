import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon01, Sun } from "@untitledui/icons";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

const resolveSystemTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
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
