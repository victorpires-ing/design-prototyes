import { useEffect } from "react";
import { useTheme } from "@/providers/theme-provider";

/** Força o tema light enquanto o canal (consumer) está montado. */
export function useForceLightTheme() {
    const { theme, setTheme } = useTheme();
    useEffect(() => {
        const previous = theme;
        setTheme("light");
        return () => setTheme(previous);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
