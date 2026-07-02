import { useEffect } from "react";
import { useTheme } from "@/providers/theme-provider";

/**
 * Força a visão noturna (dark) enquanto a tela do produto TS Academy está
 * montada e restaura o tema anterior ao desmontar.
 */
export function useDarkTheme() {
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const previous = theme;
        setTheme("dark");
        return () => setTheme(previous);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
