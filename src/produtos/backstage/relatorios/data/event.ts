/* ------------------------------------------------------------------ */
/*  Meta canônica do evento (compartilhada por todas as páginas de     */
/*  relatório). Fonte única de fuso horário, moeda, janela de vendas   */
/*  e sessões — para manter dados mockados coerentes entre as telas.   */
/* ------------------------------------------------------------------ */

export interface Sessao {
    /** Chave estável usada em filtros e agregações. */
    id: string;
    /** Rótulo curto exibido em chips/filtros (ex.: "15/06"). */
    label: string;
    /** Descrição completa (ex.: "Domingo · 15/06 · 18h00"). */
    descricao: string;
    /** Data da sessão em formato dd/mm/aaaa. */
    data: string;
}

export const EVENT = {
    nome: "Botafogo x Chapecoense - Copa do Brasil",
    locale: "pt-BR",
    currency: "BRL",
    /** Código exibido em alguns lugares como prefixo de moeda. */
    currencyLabel: "R$",
    timeZone: "America/Sao_Paulo",
    tzLabel: "Horário de Brasília (GMT-3)",
    /** Janela de vendas (dd/mm/aaaa). Futebol: vendas abrem 7 dias antes do jogo.
     *  Abertura 14/06/2026; partida 21/06/2026. */
    salesStart: "14/06/2026",
    salesEnd: "21/06/2026",
    sessoes: [
        { id: "s-21-06", label: "21/06", descricao: "Sexta · 21/06 · 22h00", data: "21/06/2026" },
        { id: "s-22-06", label: "22/06", descricao: "Sábado · 22/06 · 22h00", data: "22/06/2026" },
        { id: "s-28-06", label: "28/06", descricao: "Sexta · 28/06 · 22h00", data: "28/06/2026" },
        { id: "s-29-06", label: "29/06", descricao: "Sábado · 29/06 · 22h00", data: "29/06/2026" },
    ] as Sessao[],
} as const;

/* ------------------------------------------------------------------ */
/*  Formatters derivados (substituem os duplicados em cada página).    */
/* ------------------------------------------------------------------ */

export const currencyFormatter = new Intl.NumberFormat(EVENT.locale, {
    style: "currency",
    currency: EVENT.currency,
});

export const numberFormatter = new Intl.NumberFormat(EVENT.locale);

export const percentFormatter = new Intl.NumberFormat(EVENT.locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

/** Formata uma data dd/mm/aaaa (ou Date) no padrão do evento. */
export const dateFormatter = new Intl.DateTimeFormat(EVENT.locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: EVENT.timeZone,
});

/** Converte uma string dd/mm/aaaa[, HH:MM] num Date local (ou null). */
export const parseEventDate = (s: string): Date | null => {
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
    if (!m) return null;
    return new Date(
        Number(m[3]),
        Number(m[2]) - 1,
        Number(m[1]),
        m[4] ? Number(m[4]) : 0,
        m[5] ? Number(m[5]) : 0,
    );
};
