/* ------------------------------------------------------------------ */
/*  Gerador do dataset local do evento (payload que a API devolveria).  */
/*  Executar: `node src/reports/generate.mjs`                            */
/*  Emite src/reports/data/event.json (config/dimensões) e vendas.json   */
/*  (tabela-fato dia × grupo). Determinístico (seed fixa).              */
/* ------------------------------------------------------------------ */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "data");
mkdirSync(outDir, { recursive: true });

const EVENTO = {
    nome: "Réveillon Carneiros 2027",
    local: "Praia de Carneiros · Tamandaré/PE",
    moeda: "BRL",
    moedaLabel: "R$",
    fuso: "America/Sao_Paulo",
    fusoLabel: "Horário de Brasília (GMT-3)",
    diaEvento: "31/12/2026",
    vendasInicio: "01/10/2026",
    vendasFim: "31/12/2026",
};

const GRUPOS = [
    { nome: "Pista", categoria: "Ingressos", capacidade: 8000, precoMedio: 350, shareItens: 0.34, validaPct: 0.9 },
    { nome: "Pista Premium", categoria: "Ingressos", capacidade: 4000, precoMedio: 650, shareItens: 0.16, validaPct: 0.93 },
    { nome: "Front Stage", categoria: "Ingressos", capacidade: 2000, precoMedio: 1200, shareItens: 0.08, validaPct: 0.95 },
    { nome: "Lounge", categoria: "Ingressos", capacidade: 1200, precoMedio: 1800, shareItens: 0.05, validaPct: 0.96 },
    { nome: "Camarote", categoria: "Ingressos", capacidade: 800, precoMedio: 2500, shareItens: 0.035, validaPct: 0.97 },
    { nome: "Área VIP", categoria: "Ingressos", capacidade: 300, precoMedio: 4500, shareItens: 0.015, validaPct: 0.98 },
    { nome: "Combo Casal", categoria: "Combos", precoMedio: 900, shareItens: 0.05, validaPct: 0.94 },
    { nome: "Combo Open Bar", categoria: "Combos", precoMedio: 550, shareItens: 0.06, validaPct: 0.94 },
    { nome: "Estacionamento", categoria: "Produtos", precoMedio: 120, shareItens: 0.08 },
    { nome: "Copo Oficial", categoria: "Produtos", precoMedio: 40, shareItens: 0.07 },
    { nome: "Camiseta do Evento", categoria: "Produtos", precoMedio: 90, shareItens: 0.06 },
];

const TOTAL_ITENS = 20000;
const DESCONTO_MEDIO = 0.03;

const MEIOS_PAGAMENTO = [
    { meio: "Pix", pct: 63 },
    { meio: "Cartão de Crédito", pct: 27 },
    { meio: "Cartão de Débito", pct: 6 },
    { meio: "Isento / Cortesia", pct: 4 },
];
const FAIXAS_HORARIO = [
    { faixa: "20h", share: 0.06 },
    { faixa: "21h", share: 0.12 },
    { faixa: "22h", share: 0.2 },
    { faixa: "23h", share: 0.22 },
    { faixa: "00h", share: 0.16 },
    { faixa: "01h", share: 0.12 },
    { faixa: "02h", share: 0.07 },
    { faixa: "03h", share: 0.05 },
];
const PORTOES = [
    { portao: "Portão Norte", share: 0.34 },
    { portao: "Portão Sul", share: 0.3 },
    { portao: "Portão Praia", share: 0.2 },
    { portao: "Portão VIP", share: 0.16 },
];
const STATUS_TRANSACAO = [
    { status: "Aprovado", q: 0.84, v: 0.86 },
    { status: "Pendente", q: 0.06, v: 0.05 },
    { status: "Cancelado", q: 0.05, v: 0.045 },
    { status: "Estornado", q: 0.03, v: 0.03 },
    { status: "Reembolso", q: 0.02, v: 0.015 },
];
const PERGUNTAS = [
    { pergunta: "Como você vai chegar ao evento?", share: 1.0 },
    { pergunta: "Já foi ao Réveillon de Carneiros antes?", share: 0.97 },
    { pergunta: "O que mais te atrai no evento?", share: 0.93 },
    { pergunta: "Como conheceu o evento?", share: 0.89 },
];

function makeRng(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Dias da campanha com peso de vendas (rampa até a virada + fins de semana + picos).
const dias = [];
for (let d = new Date(2026, 9, 1); d <= new Date(2026, 11, 31); d.setDate(d.getDate() + 1)) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    dias.push({ iso: `${d.getFullYear()}-${mm}-${dd}`, dow: d.getDay(), mesDia: [d.getMonth(), d.getDate()] });
}
const n = dias.length;
const rng = makeRng(20261231);
const pesos = dias.map((dia, i) => {
    const frac = n > 1 ? i / (n - 1) : 1;
    const rampa = 0.3 + 1.9 * Math.pow(frac, 1.9);
    const fimDeSemana = dia.dow === 5 || dia.dow === 6 ? 1.5 : dia.dow === 0 ? 1.2 : 1;
    let pico = 1;
    if (dia.mesDia[0] === 10 && dia.mesDia[1] >= 26 && dia.mesDia[1] <= 29) pico *= 1.9; // Black Friday
    if (frac > 0.92) pico *= 2.3; // reta final
    const ruido = 0.82 + 0.36 * rng();
    return rampa * fimDeSemana * pico * ruido;
});
const somaPesos = pesos.reduce((s, p) => s + p, 0);

// Tabela-fato: uma linha por dia × grupo.
const vendas = [];
for (const g of GRUPOS) {
    const itensGrupo = Math.round(TOTAL_ITENS * g.shareItens);
    dias.forEach((dia, i) => {
        const itens = Math.round((itensGrupo * pesos[i]) / somaPesos);
        if (itens <= 0) return;
        const receitaBruta = itens * g.precoMedio;
        vendas.push({
            iso: dia.iso,
            categoria: g.categoria,
            grupo: g.nome,
            itens,
            receitaBruta,
            receitaLiquida: Math.round(receitaBruta * (1 - DESCONTO_MEDIO)),
        });
    });
}

const event = {
    evento: EVENTO,
    periodoPadrao: { start: "2026-10-01", end: "2026-12-31" },
    capacidadeIngressos: GRUPOS.filter((g) => g.categoria === "Ingressos").reduce((s, g) => s + (g.capacidade ?? 0), 0),
    grupos: GRUPOS.map(({ nome, categoria, capacidade, precoMedio, validaPct }) => ({ nome, categoria, capacidade: capacidade ?? null, precoMedio, validaPct: validaPct ?? null })),
    meiosDePagamento: MEIOS_PAGAMENTO,
    faixasHorario: FAIXAS_HORARIO,
    portoes: PORTOES,
    statusTransacao: STATUS_TRANSACAO,
    perguntas: PERGUNTAS,
};

writeFileSync(join(outDir, "event.json"), JSON.stringify(event, null, 2));
writeFileSync(join(outDir, "vendas.json"), JSON.stringify(vendas));
console.log(`event.json: 1 config · vendas.json: ${vendas.length} linhas (${dias.length} dias × ${GRUPOS.length} grupos)`);
