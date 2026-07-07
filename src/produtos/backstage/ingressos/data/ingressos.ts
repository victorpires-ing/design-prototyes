export interface Lote {
    id: string;
    name: string;
    /** Exibe a badge "Auto" (virada automática). */
    auto?: boolean;
    virada: string; // ex.: "25/07 às 10:00"
    preco: string;
    emissoes: string;
}

export interface Ingresso {
    id: string;
    name: string;
    active: boolean;
    /** Ex.: "1 de 6 lotes à venda" */
    lotesLabel: string;
    /** Badge da coluna "Virada de lote" (ex.: "Individual" / "Automática"). */
    virada: string;
    preco: string;
    /** Faixa de preço (ex.: "até R$ 180,00"), exibida abaixo do preço. */
    precoAte?: string;
    emissoes: string;
    pendente: string;
    lotes: Lote[];
}

export interface Grupo {
    id: string;
    name: string;
    emissoes: string;
    pendentes: string;
    acesso: string;
    ingressos: Ingresso[];
}

export interface Sessao {
    id: string;
    /** Ex.: "10/09/2026 às 21:30" */
    label: string;
    /** Ex.: "Quinta-feira" */
    diaSemana: string;
    grupos: Grupo[];
}

/* ----------------------------------------------------------------------------
   Massa de dados do evento "Botafogo x Chapecoense" (Copa do Brasil).
   Estrutura gerada: 3 sessões × 4 grupos × 5 tipos de ingresso × 6 lotes.
---------------------------------------------------------------------------- */

const SESSAO_DEFS = [
    { key: "s1", label: "10/09/2026 às 21:30", diaSemana: "Quinta-feira" },
    { key: "s2", label: "17/09/2026 às 21:30", diaSemana: "Quinta-feira" },
    { key: "s3", label: "24/09/2026 às 21:30", diaSemana: "Quinta-feira" },
];

const GRUPO_DEFS = [
    { key: "norte", name: "Arquibancada Norte", acesso: "Portão A" },
    { key: "sul", name: "Arquibancada Sul", acesso: "Portão B" },
    { key: "cadeira", name: "Cadeira Inferior", acesso: "Portão C" },
    { key: "premium", name: "Setor Premium", acesso: "Portão VIP" },
];

const TIPO_DEFS = [
    { key: "inteira", name: "Inteira", base: 80 },
    { key: "meia", name: "Meia-entrada", base: 40 },
    { key: "socio", name: "Sócio Botafogo", base: 30 },
    { key: "visitante", name: "Torcida Visitante", base: 100 },
    { key: "estudante", name: "Estudante", base: 40 },
];

const LOTE_DATAS = ["25/07 às 10:00", "01/08 às 10:00", "10/08 às 10:00", "20/08 às 10:00", "01/09 às 10:00", "08/09 às 10:00"];

const brl = (v: number) => `R$ ${v},00`;

const buildLotes = (prefix: string, base: number): Lote[] =>
    Array.from({ length: 6 }, (_, i) => ({
        id: `${prefix}-l${i + 1}`,
        name: `Lote ${i + 1}`,
        auto: i === 0,
        virada: LOTE_DATAS[i],
        preco: brl(base + i * 20),
        emissoes: `0 de ${100 + i * 20}`,
    }));

const buildIngressos = (prefix: string): Ingresso[] =>
    TIPO_DEFS.map((t) => {
        const id = `${prefix}-${t.key}`;
        return {
            id,
            name: t.name,
            active: true,
            lotesLabel: "1 de 6 lotes à venda",
            virada: "Individual",
            preco: brl(t.base),
            precoAte: `até ${brl(t.base + 100)}`,
            emissoes: "0 de 900",
            pendente: "0 pendente",
            lotes: buildLotes(id, t.base),
        };
    });

export const SESSOES: Sessao[] = SESSAO_DEFS.map((s) => ({
    id: s.key,
    label: s.label,
    diaSemana: s.diaSemana,
    grupos: GRUPO_DEFS.map((g) => {
        const gid = `${s.key}-${g.key}`;
        return {
            id: gid,
            name: g.name,
            emissoes: "0 de 4.500",
            pendentes: "0",
            acesso: g.acesso,
            ingressos: buildIngressos(gid),
        };
    }),
}));
