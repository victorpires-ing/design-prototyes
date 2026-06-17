export const RESUMO = {
    semanaFeitos: 3,
    semanaMeta: 5,
    sequenciaAtual: 7,
    melhorSequencia: 12,
    taxaConclusao: 84,
    treinosMes: 18,
};

export interface Barra {
    label: string;
    valor: number;
}

export const BARRAS: Record<"semana" | "mes" | "ano", Barra[]> = {
    semana: [
        { label: "Seg", valor: 45 },
        { label: "Ter", valor: 0 },
        { label: "Qua", valor: 60 },
        { label: "Qui", valor: 30 },
        { label: "Sex", valor: 55 },
        { label: "Sáb", valor: 80 },
        { label: "Dom", valor: 0 },
    ],
    mes: [
        { label: "S1", valor: 4 },
        { label: "S2", valor: 5 },
        { label: "S3", valor: 3 },
        { label: "S4", valor: 6 },
    ],
    ano: [
        { label: "J", valor: 14 },
        { label: "F", valor: 12 },
        { label: "M", valor: 18 },
        { label: "A", valor: 16 },
        { label: "M", valor: 20 },
        { label: "J", valor: 18 },
        { label: "J", valor: 22 },
        { label: "A", valor: 19 },
        { label: "S", valor: 21 },
        { label: "O", valor: 17 },
        { label: "N", valor: 23 },
        { label: "D", valor: 18 },
    ],
};

// últimas 5 semanas (linhas) x 7 dias — 0 nenhum, 1 leve, 2 médio, 3 forte
export const HEATMAP: number[][] = [
    [1, 0, 2, 1, 2, 3, 0],
    [2, 0, 3, 1, 2, 3, 0],
    [1, 1, 2, 0, 3, 2, 1],
    [2, 0, 3, 2, 2, 3, 0],
    [3, 1, 2, 1, 3, 0, 0],
];

// Calendário — meses em ordem cronológica (o último é o mês atual)
export interface MesCalendario {
    nome: string;
    primeiroDiaSemana: number; // 0=Dom · 1=Seg ... 6=Sáb (dia da semana do dia 1)
    diasNoMes: number;
    hoje: number | null; // dia atual (só no mês corrente)
    treinados: number[]; // dias em que efetivamente treinou
}

export const MESES: MesCalendario[] = [
    { nome: "Março 2026", primeiroDiaSemana: 0, diasNoMes: 31, hoje: null, treinados: [2, 4, 6, 9, 13, 16, 18, 23, 25, 27, 30] },
    { nome: "Abril 2026", primeiroDiaSemana: 3, diasNoMes: 30, hoje: null, treinados: [1, 3, 8, 10, 15, 17, 22, 24, 25, 29] },
    { nome: "Maio 2026", primeiroDiaSemana: 5, diasNoMes: 31, hoje: null, treinados: [1, 4, 6, 8, 13, 15, 18, 22, 25, 27, 29] },
    { nome: "Junho 2026", primeiroDiaSemana: 1, diasNoMes: 30, hoje: 14, treinados: [1, 3, 5, 6, 8, 12] },
];

export const MES_ATUAL_INDEX = MESES.length - 1;

export const INSIGHTS = [
    { emoji: "💡", texto: "Quartas e sábados são seus dias mais fortes. Mantenha o ritmo!" },
    { emoji: "🎯", texto: "Faltam 2 treinos para bater seu recorde de 12 dias seguidos." },
];
