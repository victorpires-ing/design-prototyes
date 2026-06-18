import { useEffect } from "react";
import { useTheme } from "@/providers/theme-provider";

const HUB_THEME_KEY = "hub-theme";
export type HubTheme = "light" | "dark";

/** Lê a preferência de tema do Hub salva pelo usuário (padrão: claro). */
export function getHubTheme(): HubTheme {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem(HUB_THEME_KEY) as HubTheme) === "dark" ? "dark" : "light";
}

/** Salva a preferência de tema do Hub. */
export function setHubTheme(theme: HubTheme) {
    if (typeof window !== "undefined") localStorage.setItem(HUB_THEME_KEY, theme);
}

/**
 * Aplica a preferência de tema do Hub (claro ou versão noturna) enquanto a tela
 * está montada e restaura o tema anterior ao desmontar. A preferência é
 * escolhida pelo usuário em Editar perfil e vale para todo o app.
 */
export function useHubTheme() {
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        const previous = theme;
        setTheme(getHubTheme());
        return () => setTheme(previous);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
