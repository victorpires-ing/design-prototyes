import { useEffect } from "react";
import { useTheme } from "@/providers/theme-provider";

/**
 * Força o tema light enquanto a tela do Ticket Sports está montada e
 * restaura o tema anterior ao desmontar. O app é voltado ao consumidor
 * final e usa sempre light.
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
