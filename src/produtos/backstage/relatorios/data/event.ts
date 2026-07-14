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
    nome: "Visão completa",
    locale: "pt-BR",
    currency: "BRL",
    /** Código exibido em alguns lugares como prefixo de moeda. */
    currencyLabel: "R$",
    timeZone: "America/Sao_Paulo",
    tzLabel: "Horário de Brasília (GMT-3)",
    /** Janela de vendas (dd/mm/aaaa). Réveillon: vendas abrem meses antes;
     *  festa de 26/12/2026 a 02/01/2027. */
    salesStart: "22/06/2026",
    salesEnd: "08/07/2026",
    /** O evento vende apenas combos (ver data/produtos.ts). As sessões abaixo
     *  são as FESTAS (dimensão operacional) que os combos dão acesso — não são
     *  a unidade de venda, mas alimentam recortes por dia/festa nos relatórios. */
    sessoes: [
        { id: "s-2612-16", label: "26/12 16h", descricao: "Sáb · 26/12 · 16h00 · Mouton", data: "26/12/2026" },
        { id: "s-2712-16", label: "27/12 16h", descricao: "Dom · 27/12 · 16h00 · Mouton", data: "27/12/2026" },
        { id: "s-2712-22", label: "27/12 22h", descricao: "Dom · 27/12 · 22h00 · Night", data: "27/12/2026" },
        { id: "s-2812-16", label: "28/12 16h", descricao: "Seg · 28/12 · 16h00 · Mouton", data: "28/12/2026" },
        { id: "s-2812-22", label: "28/12 22h", descricao: "Seg · 28/12 · 22h00 · Night", data: "28/12/2026" },
        { id: "s-2912-16", label: "29/12 16h", descricao: "Ter · 29/12 · 16h00 · Mouton", data: "29/12/2026" },
        { id: "s-2912-22", label: "29/12 22h", descricao: "Ter · 29/12 · 22h00 · Night", data: "29/12/2026" },
        { id: "s-3012-16", label: "30/12 16h", descricao: "Qua · 30/12 · 16h00 · Mouton", data: "30/12/2026" },
        { id: "s-3112-20", label: "31/12 20h", descricao: "Qui · 31/12 · 20h00 · Réveillon (Night)", data: "31/12/2026" },
        { id: "s-0201-16", label: "02/01 16h", descricao: "Sáb · 02/01 · 16h00 · Mouton", data: "02/01/2027" },
        { id: "s-0201-22", label: "02/01 22h", descricao: "Sáb · 02/01 · 22h00 · Night", data: "02/01/2027" },
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
