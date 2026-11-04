import { useEffect } from "react";
import { useTheme } from "@/providers/theme-provider";

/** Força tema light enquanto a tela está montada (carteira web do consumidor é sempre light). */
export function useForceLightTheme() {
    const { theme, setTheme } = useTheme();
    useEffect(() => {
        const previous = theme;
        setTheme("light");
        return () => setTheme(previous);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
