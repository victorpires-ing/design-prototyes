import { useEffect, useRef } from "react";
import { useTheme } from "@/providers/theme-provider";

/* Dois efeitos de página inteira que a campanha precisa enquanto está montada.
   Moravam na moldura de protótipo; a moldura saiu, eles continuam. */

/* Fontes da campanha. Carregadas só enquanto a LP está montada para não vazar
   para o resto do app — mesmo padrão da LP São Silvestre. */
/* Boldonse tem um peso único e nenhum eixo variável: pedir `wght` na URL devolve
   HTTP 400. Sora vai até 800, não 900. */
const FONTES_HREF =
    "https://fonts.googleapis.com/css2?family=Boldonse&family=Inter:opsz,wght@14..32,400..900&family=Sora:wght@300..800&display=swap";

export function useFontesDaCampanha() {
    useEffect(() => {
        const pre1 = document.createElement("link");
        pre1.rel = "preconnect";
        pre1.href = "https://fonts.googleapis.com";

        const pre2 = document.createElement("link");
        pre2.rel = "preconnect";
        pre2.href = "https://fonts.gstatic.com";
        pre2.crossOrigin = "anonymous";

        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = FONTES_HREF;

        document.head.append(pre1, pre2, css);
        return () => {
            pre1.remove();
            pre2.remove();
            css.remove();
        };
    }, []);
}

/* A campanha é sempre escura e com cor própria: o tema do app não pode
   interferir. Forçamos light no ThemeProvider (que é a fonte autoritativa) e
   restauramos no unmount. */
export function useTemaFixo() {
    const { theme, setTheme } = useTheme();
    const anterior = useRef(theme);
    useEffect(() => {
        setTheme("light");
        return () => setTheme(anterior.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
