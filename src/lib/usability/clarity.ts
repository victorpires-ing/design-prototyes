/**
 * Microsoft Clarity — carregado SOMENTE durante uma sessão de teste de
 * usabilidade, para que o projeto do Clarity contenha exclusivamente
 * gravações de teste. Cada sessão é etiquetada com tags filtráveis no
 * dashboard (teste_id, sessao_id, device_id, tarefa).
 */

const PROJECT_ID = (import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined) ?? "x6oia64l2e";

type ClarityFn = (...args: unknown[]) => void;

declare global {
    interface Window {
        clarity?: ClarityFn & { q?: unknown[] };
    }
}

let carregado = false;

/** Injeta o snippet do Clarity uma única vez. */
export function carregarClarity() {
    if (carregado || typeof window === "undefined" || !PROJECT_ID) return;
    carregado = true;

    // Stub que enfileira chamadas até o script real carregar.
    window.clarity =
        window.clarity ||
        function (...args: unknown[]) {
            (window.clarity!.q = window.clarity!.q || []).push(args);
        };

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${PROJECT_ID}`;
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(script, first);
}

/** Define uma tag custom filtrável no Clarity. */
export function clarityTag(chave: string, valor: string) {
    window.clarity?.("set", chave, valor);
}

/** Identifica o participante/sessão. */
export function clarityIdentify(id: string) {
    window.clarity?.("identify", id);
}

/** URL do dashboard de gravações filtrado por uma tag. */
export function clarityDashboardURL(chave: string, valor: string): string {
    return `https://clarity.microsoft.com/projects/view/${PROJECT_ID}/impressions?CustomTag=${encodeURIComponent(
        `${chave}:${valor}`,
    )}`;
}
