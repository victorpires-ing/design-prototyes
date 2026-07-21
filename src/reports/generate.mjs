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

/* ---- Catálogo demográfico: compradores com idade + localização ---- */
// Faixas etárias e UFs; a geração cria correlações (tiers premium tendem a
// ser mais velhos; PE concentra o público local) para análises de inferência.
const FAIXAS = [
    { faixa: "18–24", lo: 18, hi: 24, peso: 0.28 },
    { faixa: "25–34", lo: 25, hi: 34, peso: 0.36 },
    { faixa: "35–44", lo: 35, hi: 44, peso: 0.2 },
    { faixa: "45–54", lo: 45, hi: 54, peso: 0.1 },
    { faixa: "55+", lo: 55, hi: 72, peso: 0.06 },
];
const UFS = [
    { uf: "PE", peso: 0.34 },
    { uf: "SP", peso: 0.18 },
    { uf: "RJ", peso: 0.12 },
    { uf: "BA", peso: 0.1 },
    { uf: "MG", peso: 0.08 },
    { uf: "CE", peso: 0.06 },
    { uf: "PB", peso: 0.05 },
    { uf: "DF", peso: 0.04 },
    { uf: "Outros", peso: 0.03 },
];

const rngC = makeRng(20270101);
const pickPeso = (arr) => {
    let r = rngC() * arr.reduce((s, x) => s + x.peso, 0);
    for (const x of arr) {
        r -= x.peso;
        if (r <= 0) return x;
    }
    return arr[arr.length - 1];
};
const ingressos = GRUPOS.filter((g) => g.categoria === "Ingressos");
const ingressosPorPreco = [...ingressos].sort((a, b) => a.precoMedio - b.precoMedio); // barato → caro

const compradores = [];
for (let i = 0; i < 2400; i++) {
    const f = pickPeso(FAIXAS);
    const idade = f.lo + Math.floor(rngC() * (f.hi - f.lo + 1));
    const uf = pickPeso(UFS).uf;
    // Correlação: quanto mais velho, maior a chance de grupo premium (índice mais alto).
    const bias = (idade - 18) / 54; // 0..1
    const idx = Math.min(ingressosPorPreco.length - 1, Math.floor((rngC() * 0.6 + bias * 0.4) * ingressosPorPreco.length));
    const grupo = ingressosPorPreco[idx];
    const valor = Math.round(grupo.precoMedio * (rngC() < 0.4 ? 0.5 : 1)); // meia/inteira
    compradores.push({ idade, uf, grupo: grupo.nome, valor });
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
    faixasEtarias: FAIXAS,
    ufs: UFS.map((u) => u.uf),
};

writeFileSync(join(outDir, "event.json"), JSON.stringify(event, null, 2));
writeFileSync(join(outDir, "vendas.json"), JSON.stringify(vendas));
writeFileSync(join(outDir, "compradores.json"), JSON.stringify(compradores));
console.log(`event.json · vendas.json: ${vendas.length} linhas · compradores.json: ${compradores.length}`);
