import { EVENT, parseEventDate } from "./event";
import { COMBOS } from "./produtos";

/* ------------------------------------------------------------------ */
/*  Série diária de vendas por gênero (mock determinístico) sobre a     */
/*  janela de vendas do Réveillon. Alimenta os gráficos "por dia".      */
/* ------------------------------------------------------------------ */

export interface DiaVenda {
    data: string; // dd/mm (rótulo)
    dataISO: string; // dd/mm/aaaa (para filtrar por período)
    mascQtd: number;
    femQtd: number;
    mascFat: number;
    femFat: number;
}

const start = parseEventDate(EVENT.salesStart)!;
const end = parseEventDate(EVENT.salesEnd)!;
const DIAS = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

// Totais por gênero (unidades e faturamento) derivados do catálogo.
const totQtd = (g: "MASCULINO" | "FEMININO") => COMBOS.filter((c) => c.genero === g).reduce((s, c) => s + c.quantidade, 0);
const totFat = (g: "MASCULINO" | "FEMININO") => COMBOS.filter((c) => c.genero === g).reduce((s, c) => s + c.quantidade * c.preco, 0);
const QTD_M = totQtd("MASCULINO"); // 444
const QTD_F = totQtd("FEMININO"); // 396
const FAT_M = totFat("MASCULINO");
const FAT_F = totFat("FEMININO");

function mulberry32(seed: number) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Distribui `total` inteiro entre os dias segundo pesos (maior resto). */
function distribuir(total: number, pesos: number[]): number[] {
    const soma = pesos.reduce((s, x) => s + x, 0) || 1;
    const raw = pesos.map((w) => (total * w) / soma);
    const base = raw.map(Math.floor);
    let resto = total - base.reduce((s, x) => s + x, 0);
    const ordem = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < resto; k++) base[ordem[k % ordem.length].i]++;
    return base;
}

const pad = (n: number) => String(n).padStart(2, "0");

export const VENDAS_DIARIAS: DiaVenda[] = (() => {
    const rng = mulberry32(20260915);
    // Peso por dia: rampa crescente rumo ao evento + pico no lançamento + disparada final.
    const pesosM: number[] = [];
    const pesosF: number[] = [];
    for (let d = 0; d < DIAS; d++) {
        const prox = DIAS === 1 ? 1 : d / (DIAS - 1);
        let w = Math.exp(-d / 10) * 3 + Math.pow(prox, 3.2) * 9 + 0.5;
        if (prox > 0.9) w += 8 * (prox - 0.9) * 10; // últimos dias disparam
        const base = w * (0.85 + 0.3 * rng());
        pesosM.push(base * (0.9 + 0.2 * rng()));
        pesosF.push(base * (0.9 + 0.2 * rng()));
    }
    const mQ = distribuir(QTD_M, pesosM);
    const fQ = distribuir(QTD_F, pesosF);
    const ticketM = FAT_M / QTD_M;
    const ticketF = FAT_F / QTD_F;
    return Array.from({ length: DIAS }, (_, d) => {
        const dt = new Date(start.getTime() + d * 86_400_000);
        return {
            data: `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}`,
            dataISO: `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`,
            mascQtd: mQ[d],
            femQtd: fQ[d],
            mascFat: Math.round(mQ[d] * ticketM),
            femFat: Math.round(fQ[d] * ticketF),
        };
    });
})();

/* ------------------------------------------------------------------ */
/*  Meta de vendas — definida POR SESSÃO (festa). A meta exibida no     */
/*  gráfico é a soma das metas das sessões em escopo no filtro.         */
/* ------------------------------------------------------------------ */

const META_AREA: Record<string, number> = { Night: 700_000, Mouton: 420_000 };
const areaOf = (label: string) => (label.includes("16h") ? "Mouton" : "Night");

/** Meta (R$) de cada sessão, por id. */
export const META_SESSAO: Record<string, number> = Object.fromEntries(EVENT.sessoes.map((s) => [s.id, META_AREA[areaOf(s.label)]]));

/** Soma das metas das sessões informadas (ou de todas, quando "all"/vazio). */
export function metaTotal(sessaoIds?: string[]): number {
    const ids = sessaoIds && sessaoIds.length ? sessaoIds : EVENT.sessoes.map((s) => s.id);
    return ids.reduce((s, id) => s + (META_SESSAO[id] ?? 0), 0);
}
