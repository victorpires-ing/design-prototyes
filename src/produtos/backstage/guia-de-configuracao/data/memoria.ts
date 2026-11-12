import { useSyncExternalStore } from "react";

/*
 * Decisões do produtor sobre o guia, por evento, em localStorage (sobrevivem ao F5):
 * - fechado: o painel não volta; sobra o alerta do que trava a venda (GDC-10).
 * - minimizado: "agora não"; o painel vira só a faixa (GDC-08).
 * - expandido: o produtor abriu o painel de propósito; no celular ele começa recolhido (GDC-15).
 * - holofote-pendente: marcado só na criação do evento; a apresentação toca uma vez e se apaga (GDC-14).
 *
 * Estado no módulo + useSyncExternalStore: o painel (no layout) e o alerta (em Itens › Ingressos)
 * leem a mesma memória sem precisar de provider.
 */
type Marca = "fechado" | "minimizado" | "expandido" | "holofote-pendente";

const PREFIXO = "backstage-guia-configuracao:";
const chave = (marca: Marca, eventoId: string) => `${PREFIXO}${marca}:${eventoId}`;

const ouvintes = new Set<() => void>();
let versao = 0;
const avisar = () => {
    versao += 1;
    ouvintes.forEach((fn) => fn());
};
const assinar = (fn: () => void) => {
    ouvintes.add(fn);
    return () => ouvintes.delete(fn);
};

/** Ler falha para `false` (mostra o guia); escrever falha em silêncio. */
function ler(marca: Marca, eventoId: string): boolean {
    try {
        return window.localStorage.getItem(chave(marca, eventoId)) === "true";
    } catch {
        return memoria.has(chave(marca, eventoId));
    }
}

/** Reserva para quando o storage está bloqueado: vale só nesta aba. */
const memoria = new Set<string>();

export function marcar(marca: Marca, eventoId: string, valor: boolean) {
    const k = chave(marca, eventoId);
    if (valor) memoria.add(k);
    else memoria.delete(k);
    try {
        if (valor) window.localStorage.setItem(k, "true");
        else window.localStorage.removeItem(k);
    } catch {
        /* sem storage, a decisão vale só nesta aba */
    }
    avisar();
}

export interface MemoriaDoGuia {
    fechado: boolean;
    minimizado: boolean;
    expandido: boolean;
    holofotePendente: boolean;
}

export function useMemoriaDoGuia(eventoId: string | undefined): MemoriaDoGuia {
    useSyncExternalStore(assinar, () => versao, () => 0);
    if (!eventoId) return { fechado: false, minimizado: false, expandido: false, holofotePendente: false };
    return {
        fechado: ler("fechado", eventoId),
        minimizado: ler("minimizado", eventoId),
        expandido: ler("expandido", eventoId),
        holofotePendente: ler("holofote-pendente", eventoId),
    };
}

/** Chamado só pela criação de evento: guia aberto e holofote a tocar uma vez (GDC-14). */
export function prepararGuiaDoEventoNovo(eventoId: string) {
    marcar("fechado", eventoId, false);
    marcar("minimizado", eventoId, false);
    // Recém-criado, o guia abre também no celular, e não recolhe quando o holofote acaba (GDC-15).
    marcar("expandido", eventoId, true);
    marcar("holofote-pendente", eventoId, true);
}
