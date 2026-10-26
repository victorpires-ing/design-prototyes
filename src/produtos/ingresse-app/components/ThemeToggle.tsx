import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon01, Sun } from "@untitledui/icons";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

const resolveSystemTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

/** Alterna claro/escuro. No app fica fora do frame do celular (visível só no desktop). */
export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();
    const [systemTheme, setSystemTheme] = useState<"light" | "dark">(resolveSystemTheme);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = () => setSystemTheme(mq.matches ? "dark" : "light");
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const isDark = (theme === "system" ? systemTheme : theme) === "dark";
    const alternar = useCallback(() => setTheme(isDark ? "light" : "dark"), [isDark, setTheme]);

    return (
        <button
            type="button"
            onClick={alternar}
            role="switch"
            aria-checked={isDark}
            aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
            title={isDark ? "Tema claro" : "Tema escuro"}
            className={cx(
                "flex items-center gap-2 rounded-full bg-primary py-2 pr-4 pl-3 text-sm font-semibold text-secondary shadow-lg ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-primary_hover active:scale-95",
                className,
            )}
        >
            <span className="relative flex size-5 items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                        key={isDark ? "moon" : "sun"}
                        initial={{ y: 8, opacity: 0, rotate: -45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -8, opacity: 0, rotate: 45 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute flex items-center justify-center text-fg-secondary"
                    >
                        {isDark ? <Moon01 className="size-5" /> : <Sun className="size-5" />}
                    </motion.span>
                </AnimatePresence>
            </span>
            {isDark ? "Escuro" : "Claro"}
        </button>
    );
}
