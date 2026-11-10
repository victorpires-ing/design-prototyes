import { useMemo } from "react";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";
import { useBanco, useDoc, type Evento, type HistoricoVendas, type Pedido } from "@/plataforma";
import { agregar, type ContextoDataset, type FatoVenda, type PeriodoSelecionado } from "@/reports/event-dataset";
import { useEventoAtual } from "../../eventos/data/eventos";

/* ------------------------------------------------------------------ */
/*  Dataset de vendas do evento em contexto, lido do banco unificado.  */
/*                                                                     */
/*  Mesmo formato do dataset estático (src/reports): tabela-fato dia × */
/*  grupo agregada por `agregar`. Fontes: vendas anteriores ao gêmeo   */
/*  (historico) e pedidos pagos. Usado por Vendas e Borderô.           */
/* ------------------------------------------------------------------ */

const p2 = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const isoParaMs = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
};
const isoParaLabel = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}`;
const isoParaBr = (s: string) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
const calendario = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new CalendarDate(y, m, d);
};

/** Grupo (setor) de cada lote do evento, com capacidade e preço médio por nome de grupo. */
function mapaDoCatalogo(evento: Evento) {
    const grupoDoLote = new Map<string, string>();
    const precoDoLote = new Map<string, number>();
    const grupos = new Map<string, { capacidade: number; somaPreco: number; lotes: number }>();
    for (const s of evento.sessoes)
        for (const g of s.grupos)
            for (const t of g.ingressos)
                for (const l of t.lotes) {
                    grupoDoLote.set(l.id, g.nome);
                    precoDoLote.set(l.id, l.preco);
                    const atual = grupos.get(g.nome) ?? { capacidade: 0, somaPreco: 0, lotes: 0 };
                    atual.capacidade += l.quantidade;
                    atual.somaPreco += l.preco;
                    atual.lotes += 1;
                    grupos.set(g.nome, atual);
                }
    return { grupoDoLote, precoDoLote, grupos };
}

export interface DatasetDoEvento {
    consultar: (periodo: PeriodoSelecionado) => ReturnType<typeof agregar>;
    periodoPadrao: { start: CalendarDate; end: CalendarDate };
    grupos: ContextoDataset["grupos"];
    vazio: boolean;
}

export function montarDataset(evento: Evento, historico: HistoricoVendas | undefined, pedidos: Pedido[]): DatasetDoEvento {
    const { grupoDoLote, precoDoLote, grupos } = mapaDoCatalogo(evento);
    const linhas = new Map<string, FatoVenda>();
    const somar = (dia: string, grupo: string, categoria: string, itens: number, receita: number) => {
        if (itens <= 0 && receita <= 0) return;
        const chave = `${dia}|${categoria}|${grupo}`;
        const atual = linhas.get(chave) ?? { iso: dia, data: isoParaLabel(dia), ms: isoParaMs(dia), categoria, grupo, itens: 0, receitaBruta: 0, receitaLiquida: 0 };
        atual.itens += itens;
        atual.receitaBruta += receita;
        atual.receitaLiquida += receita;
        linhas.set(chave, atual);
    };

    // Histórico: o dia a dia é total; divide entre os grupos pela participação de cada um nas vendas.
    if (historico) {
        const porGrupo = new Map<string, { itens: number; receita: number }>();
        for (const [lote, qtd] of Object.entries(historico.porLote)) {
            const g = grupoDoLote.get(lote);
            if (!g) continue;
            const atual = porGrupo.get(g) ?? { itens: 0, receita: 0 };
            atual.itens += qtd;
            atual.receita += qtd * (precoDoLote.get(lote) ?? 0);
            porGrupo.set(g, atual);
        }
        const totalItens = [...porGrupo.values()].reduce((t, v) => t + v.itens, 0) || 1;
        const totalReceita = [...porGrupo.values()].reduce((t, v) => t + v.receita, 0) || 1;
        const hoje = new Date();
        historico.serie.forEach(([ingressos, , faturamento], i, todos) => {
            const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (todos.length - i));
            for (const [g, v] of porGrupo) somar(iso(d), g, "Ingressos", Math.round((ingressos * v.itens) / totalItens), Math.round((faturamento * v.receita) / totalReceita));
        });
    }

    for (const p of pedidos) {
        if (p.eventoId !== evento.id || p.status !== "pago") continue;
        const dia = iso(new Date(p.pagamento?.pagoEm ?? p.atualizadoEm));
        for (const item of p.itens) {
            if (item.tipo === "ingresso" && item.loteId) somar(dia, grupoDoLote.get(item.loteId) ?? item.nome, "Ingressos", item.quantidade, item.face * item.quantidade);
            else somar(dia, item.nome, "Produtos", item.quantidade, item.face * item.quantidade);
        }
    }

    const fatos = [...linhas.values()].sort((a, b) => a.ms - b.ms);
    const ctx: ContextoDataset = {
        grupos: [
            ...[...grupos.entries()].map(([nome, g]) => ({ nome, categoria: "Ingressos", capacidade: g.capacidade, precoMedio: g.lotes ? Math.round(g.somaPreco / g.lotes) : 0, validaPct: 0.92 })),
            ...[...new Set(fatos.filter((f) => f.categoria === "Produtos").map((f) => f.grupo))].map((nome) => ({ nome, categoria: "Produtos", capacidade: null, precoMedio: 0, validaPct: 0 })),
        ],
        capacidade: [...grupos.values()].reduce((t, g) => t + g.capacidade, 0),
        itensTotal: fatos.reduce((t, f) => t + f.itens, 0),
        vendasInicio: fatos[0] ? isoParaBr(fatos[0].iso) : isoParaBr(iso(new Date())),
        vendasFim: isoParaBr(evento.data.slice(0, 10)),
    };

    const inicio = fatos[0]?.iso ?? iso(new Date());
    const fimEvento = evento.data.slice(0, 10);
    const hoje = iso(new Date());
    const fim = [fimEvento, hoje, fatos[fatos.length - 1]?.iso ?? hoje].sort().pop()!;

    return {
        consultar: (periodo) => {
            const tz = getLocalTimeZone();
            const de = periodo ? periodo.start.toDate(tz).getTime() : -Infinity;
            const ate = periodo ? periodo.end.toDate(tz).getTime() + 86_400_000 - 1 : Infinity;
            return agregar(
                fatos.filter((f) => f.ms >= de && f.ms <= ate),
                ctx,
            );
        },
        periodoPadrao: { start: calendario(inicio), end: calendario(fim) },
        grupos: ctx.grupos,
        vazio: fatos.length === 0,
    };
}

/** Dataset do evento em contexto, refeito quando o banco muda. */
export function useDatasetDoEvento(): DatasetDoEvento {
    const ctx = useEventoAtual();
    const evento = useDoc("eventos", ctx.id);
    const { tabelas } = useBanco();
    return useMemo(() => {
        if (!evento) return montarDataset({ ...ctx, slug: ctx.id, produtora: ctx.produtor, sessoes: [], taxaServico: 0.1, criadoEm: ctx.data, atualizadoEm: ctx.data }, undefined, []);
        return montarDataset(evento, tabelas.historico[evento.id], Object.values(tabelas.pedidos));
    }, [evento, tabelas, ctx]);
}
