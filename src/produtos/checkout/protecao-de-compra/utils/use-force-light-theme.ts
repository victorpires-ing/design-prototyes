import { useEffect } from "react";
import { useTheme } from "@/providers/theme-provider";

/** O carrinho é um site público: sempre em light, mesmo com o app em dark. */
export function useForceLightTheme() {
    const { theme, setTheme } = useTheme();
    useEffect(() => {
        const previous = theme;
        setTheme("light");
        return () => setTheme(previous);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
