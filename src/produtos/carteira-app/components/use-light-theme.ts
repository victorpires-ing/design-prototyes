import { useEffect } from "react";
import { useTheme } from "@/providers/theme-provider";

/**
 * Força o tema light enquanto a tela do carteira-app está montada e
 * restaura o tema anterior ao desmontar. Usa o próprio ThemeProvider
 * (setTheme) para evitar conflito com o efeito que aplica a classe dark.
 * O carteira-app é um app voltado ao consumidor final e sempre usa light.
 */
export function useForceLightTheme() {
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const previous = theme;
        setTheme("light");
        return () => setTheme(previous);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
