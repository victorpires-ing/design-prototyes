import { loteAtual, type Evento } from "@/plataforma";
import type { DataEvento, Ingresso } from "./combos";
import { TAXA_PADRAO, TAXA_PRODUTO_PADRAO } from "./combos";
import { DEFAULT_CONFIG, type EventConfig } from "./config";

/* ------------------------------------------------------------------ */
/*  Adaptador: evento do banco unificado → config da seleção           */
/*                                                                     */
/*  Cada sessão vira uma "data" de venda avulsa; cada ingresso ativo   */
/*  entra com o lote à venda agora. A chave do carrinho fica           */
/*  `data:<sessaoId>:<ingressoId>`, o que deixa o pedido apontar de    */
/*  volta para o catálogo.                                             */
/* ------------------------------------------------------------------ */

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const p2 = (n: number) => String(n).padStart(2, "0");

export function eventoParaConfig(ev: Evento, vendidos: Map<string, number>): EventConfig {
    const ingressos: Ingresso[] = [];
    const datas: DataEvento[] = [];
    const quantitativo: EventConfig["quantitativoPorGrupo"] = {};

    for (const s of ev.sessoes) {
        const d = new Date(s.inicio);
        const itens: string[] = [];
        for (const g of s.grupos) {
            const q = (quantitativo[g.nome] ??= { ofertados: 0, ofertadosMeia: 0 });
            for (const t of g.ingressos) {
                const total = t.lotes.reduce((a, l) => a + l.quantidade, 0);
                q.ofertados += total;
                if (t.beneficio === "meia-entrada") q.ofertadosMeia += total;
                if (!t.ativo) continue;
                const lote = loteAtual(t, vendidos);
                ingressos.push({
                    id: t.id,
                    nome: t.nome.toUpperCase(),
                    grupo: g.nome.toUpperCase(),
                    lote: (lote ?? t.lotes[t.lotes.length - 1])?.nome.toUpperCase(),
                    descricao: t.descricao,
                    preco: (lote ?? t.lotes[t.lotes.length - 1])?.preco ?? 0,
                    beneficio: t.beneficio,
                    cotaEsgotada: !lote,
                });
                itens.push(t.id);
            }
        }
        datas.push({
            id: s.id,
            iso: s.inicio.slice(0, 16),
            diaSemana: Number.isNaN(d.getTime()) ? "" : DIAS[d.getDay()],
            dia: Number.isNaN(d.getTime()) ? "" : p2(d.getDate()),
            mes: Number.isNaN(d.getTime()) ? "" : MESES[d.getMonth()],
            ano: Number.isNaN(d.getTime()) ? "" : String(d.getFullYear()),
            hora: Number.isNaN(d.getTime()) ? undefined : `${p2(d.getHours())}h${p2(d.getMinutes())}`,
            itens,
            produtos: [],
        });
    }

    return {
        ...DEFAULT_CONFIG,
        nome: ev.nome,
        capa: ev.capa ?? "",
        logo: "",
        mapa: "",
        selo: "",
        corDestaque: "",
        exibirVoltar: true,
        taxaServico: { ...TAXA_PADRAO, aliquota: ev.taxaServico },
        taxaProduto: TAXA_PRODUTO_PADRAO,
        quantitativoPorGrupo: Object.fromEntries(Object.entries(quantitativo).map(([k, v]) => [k.toUpperCase(), v])),
        percentualMeiaVendido: null,
        exibir: { ...DEFAULT_CONFIG.exibir, datas: true, combosFixos: false, combosDinamicos: false },
        ingressos,
        produtos: [],
        datas,
        combosFixos: [],
        combosDinamicos: [],
        perguntas: [],
        cupons: [],
    };
}
