import { useMemo } from "react";
import { lerColecao, useBanco, type HistoricoVendas, type Pedido, type Evento as EventoBanco } from "@/plataforma";
import { eventos, useEventosVersao, type Evento } from "./eventos";

/**
 * Métricas de venda por evento, lidas do banco unificado (src/plataforma).
 *
 * Soma duas fontes: as vendas anteriores ao gêmeo (coleção `historico`, só nos eventos da seed)
 * e os pedidos pagos de verdade (site, link, bilheteria, cortesia). A listagem da organização, o
 * painel do evento e o Remix leem daqui, então contam a mesma história.
 */

/** Meio-dia de hoje: evita que fuso horário empurre a data para o dia vizinho. */
const agora = new Date();
export const HOJE = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 12);

export type Canal = "ingresse" | "bilheteria" | "cortesia";

export const CANAL_LABEL: Record<Canal, string> = {
    ingresse: "Ingresse",
    bilheteria: "Bilheteria",
    cortesia: "Cortesias",
};

export const CANAL_COR: Record<Canal, string> = {
    ingresse: "var(--color-utility-blue-500)",
    bilheteria: "var(--color-utility-orange-500)",
    cortesia: "var(--color-utility-gray-400)",
};

/** Um setor (grupo) de uma sessão, com estoque e vendidos por canal. */
export interface Sessao {
    id: string;
    nome: string;
    ambiente: string;
    dataLabel: string;
    capacidade: number;
    vendas: Record<Canal, number>;
}

export interface DiaVenda {
    /** Dias desde a abertura das vendas. */
    dia: number;
    dataISO: string;
    ingressos: number;
    /** Produtos e combos vendidos no dia — camiseta, copo, consumação. */
    produtos: number;
    faturamento: number;
}

export interface VendasEvento {
    eventoId: string;
    aberturaISO: string;
    metaFaturamento: number;
    sessoes: Sessao[];
    serie: DiaVenda[];
    pagamentos: Array<{ tipo: string; qtd: number }>;
}

/* ------------------------------------------------------------------ */
/*  Leitura do banco                                                   */
/* ------------------------------------------------------------------ */

const diasEntre = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86_400_000);
const addDias = (date: Date, dias: number) => new Date(date.getTime() + dias * 86_400_000);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const CANAL_DO_PEDIDO: Record<Pedido["canal"], Canal> = { site: "ingresse", link: "ingresse", app: "ingresse", bilheteria: "bilheteria", cortesia: "cortesia" };
const METODO_LABEL: Record<NonNullable<Pedido["pagamento"]>["metodo"], string> = {
    credito: "Cartão de crédito",
    pix: "Pix",
    debito: "Cartão de débito",
    dinheiro: "Dinheiro",
    saldo: "Saldo do produtor",
    cortesia: "Cortesia",
};

const dataCurta = (inicio: string) => {
    const d = new Date(inicio);
    return Number.isNaN(d.getTime()) ? inicio : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
};

interface Fontes {
    evento?: EventoBanco;
    historico?: HistoricoVendas;
    pedidos: Pedido[];
}

function montar(eventoId: string, { evento, historico, pedidos }: Fontes): VendasEvento | null {
    const pagos = pedidos.filter((p) => p.eventoId === eventoId && p.status === "pago");
    if (!evento || (!historico && pagos.length === 0)) return null;

    // Vendidos por lote e por canal: histórico + pedidos pagos.
    const porLote = new Map<string, Record<Canal, number>>();
    const somar = (lote: string, canal: Canal, qtd: number) => {
        const atual = porLote.get(lote) ?? { ingresse: 0, bilheteria: 0, cortesia: 0 };
        atual[canal] += qtd;
        porLote.set(lote, atual);
    };
    if (historico) {
        const total = Object.values(historico.porLote).reduce((t, v) => t + v, 0) || 1;
        const fracao: Record<Canal, number> = {
            ingresse: historico.porCanal.online / total,
            bilheteria: historico.porCanal.bilheteria / total,
            cortesia: historico.porCanal.cortesia / total,
        };
        for (const [lote, qtd] of Object.entries(historico.porLote)) {
            const bilheteria = Math.round(qtd * fracao.bilheteria);
            const cortesia = Math.round(qtd * fracao.cortesia);
            somar(lote, "bilheteria", bilheteria);
            somar(lote, "cortesia", cortesia);
            somar(lote, "ingresse", qtd - bilheteria - cortesia);
        }
    }
    for (const p of pagos) for (const item of p.itens) if (item.tipo === "ingresso" && item.loteId) somar(item.loteId, CANAL_DO_PEDIDO[p.canal], item.quantidade);

    const sessoes: Sessao[] = evento.sessoes.flatMap((s) =>
        s.grupos.map((g) => {
            const vendas: Record<Canal, number> = { ingresse: 0, bilheteria: 0, cortesia: 0 };
            let capacidade = 0;
            for (const t of g.ingressos)
                for (const l of t.lotes) {
                    capacidade += l.quantidade;
                    const v = porLote.get(l.id);
                    if (v) (Object.keys(vendas) as Canal[]).forEach((c) => (vendas[c] += v[c]));
                }
            // Evento de uma sessão agrupa pelo local; com várias, cada sessão vira um bloco pela data.
            const ambiente = evento.sessoes.length > 1 ? `Sessão de ${dataCurta(s.inicio)}` : evento.local;
            return { id: g.id, nome: g.nome, ambiente, dataLabel: dataCurta(s.inicio), capacidade, vendas };
        }),
    );

    // Série diária, de ponta a ponta até hoje: histórico termina ontem, pedidos entram no dia em que foram pagos.
    const porDia = new Map<string, { ingressos: number; produtos: number; faturamento: number }>();
    const somarDia = (data: string, ingressos: number, produtos: number, faturamento: number) => {
        const atual = porDia.get(data) ?? { ingressos: 0, produtos: 0, faturamento: 0 };
        atual.ingressos += ingressos;
        atual.produtos += produtos;
        atual.faturamento += faturamento;
        porDia.set(data, atual);
    };
    historico?.serie.forEach(([ingressos, produtos, faturamento], i, todos) => somarDia(iso(addDias(HOJE, i - todos.length)), ingressos, produtos, faturamento));
    for (const p of pagos) {
        const data = iso(new Date(p.pagamento?.pagoEm ?? p.atualizadoEm));
        const ingressos = p.itens.filter((i) => i.tipo === "ingresso").reduce((t, i) => t + i.quantidade, 0);
        const produtos = p.itens.filter((i) => i.tipo === "produto").reduce((t, i) => t + i.quantidade, 0);
        somarDia(data, ingressos, produtos, p.subtotal);
    }
    const datas = [...porDia.keys()].sort();
    const abertura = new Date(`${datas[0] ?? iso(HOJE)}T12:00`);
    const serie: DiaVenda[] = [];
    for (let dia = 0, d = abertura; d <= HOJE; dia++, d = addDias(d, 1)) {
        const valores = porDia.get(iso(d)) ?? { ingressos: 0, produtos: 0, faturamento: 0 };
        serie.push({ dia, dataISO: iso(d), ...valores });
    }

    const pagamentos = new Map<string, number>((historico?.pagamentos ?? []).map((p) => [p.tipo, p.qtd]));
    for (const p of pagos) if (p.pagamento) pagamentos.set(METODO_LABEL[p.pagamento.metodo], (pagamentos.get(METODO_LABEL[p.pagamento.metodo]) ?? 0) + 1);

    return {
        eventoId,
        aberturaISO: iso(abertura),
        metaFaturamento: historico?.meta ?? 0,
        sessoes,
        serie,
        pagamentos: [...pagamentos.entries()].map(([tipo, qtd]) => ({ tipo, qtd })).filter((p) => p.qtd > 0),
    };
}

const fontesAtuais = () => ({
    eventos: new Map(lerColecao("eventos").map((e) => [e.id, e])),
    historicos: new Map(lerColecao("historico").map((h) => [h.eventoId, h])),
    pedidos: lerColecao("pedidos"),
});

/** Vendas do evento no estado atual do banco (sem assinar mudanças; nas telas, use os hooks). */
export const vendasDoEvento = (eventoId: string) => {
    const f = fontesAtuais();
    return montar(eventoId, { evento: f.eventos.get(eventoId), historico: f.historicos.get(eventoId), pedidos: f.pedidos });
};

/* ------------------------------------------------------------------ */
/*  Métricas derivadas                                                 */
/* ------------------------------------------------------------------ */

export interface ResumoEvento {
    evento: Evento;
    vendas: VendasEvento | null;
    capacidade: number;
    vendidos: number;
    porCanal: Record<Canal, number>;
    ocupacao: number;
    faturamento: number;
    meta: number;
    ticketMedio: number;
    /** Ingressos/dia nos últimos 7 dias. */
    ritmo7: number;
    /** Variação do ritmo contra os 7 dias anteriores. */
    variacaoRitmo: number;
    diasParaEvento: number;
    /** Projeção de faturamento no dia do evento, limitada pela capacidade. */
    projecao: number;
    sparkline: number[];
}

const somaCanais = (sessoes: Sessao[]): Record<Canal, number> =>
    sessoes.reduce(
        (acc, s) => ({
            ingresse: acc.ingresse + s.vendas.ingresse,
            bilheteria: acc.bilheteria + s.vendas.bilheteria,
            cortesia: acc.cortesia + s.vendas.cortesia,
        }),
        { ingresse: 0, bilheteria: 0, cortesia: 0 },
    );

export function resumoDoEvento(evento: Evento): ResumoEvento {
    const vendas = vendasDoEvento(evento.id);
    const diasParaEvento = diasEntre(HOJE, new Date(evento.data));

    if (!vendas) {
        return {
            evento,
            vendas: null,
            capacidade: 0,
            vendidos: 0,
            porCanal: { ingresse: 0, bilheteria: 0, cortesia: 0 },
            ocupacao: 0,
            faturamento: 0,
            meta: 0,
            ticketMedio: 0,
            ritmo7: 0,
            variacaoRitmo: 0,
            diasParaEvento,
            projecao: 0,
            sparkline: [],
        };
    }

    const capacidade = vendas.sessoes.reduce((total, s) => total + s.capacidade, 0);
    const porCanal = somaCanais(vendas.sessoes);
    const vendidos = porCanal.ingresse + porCanal.bilheteria + porCanal.cortesia;
    const faturamento = vendas.serie.reduce((total, d) => total + d.faturamento, 0);

    const ultimos7 = vendas.serie.slice(-7);
    const anteriores7 = vendas.serie.slice(-14, -7);
    const ritmo7 = ultimos7.reduce((t, d) => t + d.ingressos, 0) / Math.max(1, ultimos7.length);
    const ritmoAnterior = anteriores7.reduce((t, d) => t + d.ingressos, 0) / Math.max(1, anteriores7.length);

    const faturamentoDia7 = ultimos7.reduce((t, d) => t + d.faturamento, 0) / Math.max(1, ultimos7.length);
    const ticketMedio = vendidos ? faturamento / vendidos : 0;
    // O ritmo atual projetado até o dia do evento não pode passar do teto físico:
    // vender toda a capacidade pelo ticket médio praticado.
    const teto = capacidade * ticketMedio;
    const projecao = Math.min(teto, faturamento + Math.max(0, diasParaEvento) * faturamentoDia7);

    return {
        evento,
        vendas,
        capacidade,
        vendidos,
        porCanal,
        ocupacao: capacidade ? vendidos / capacidade : 0,
        faturamento,
        meta: vendas.metaFaturamento,
        ticketMedio,
        ritmo7,
        variacaoRitmo: ritmoAnterior ? ritmo7 / ritmoAnterior - 1 : 0,
        diasParaEvento,
        projecao,
        sparkline: vendas.serie.slice(-30).map((d) => d.ingressos),
    };
}

export const resumos = () => eventos.map(resumoDoEvento);

/** Resumos de todos os eventos, atualizados quando o banco muda. */
export function useResumos(): ResumoEvento[] {
    const { tabelas } = useBanco();
    // A lista de eventos muda com a organização em contexto, sem o banco mudar.
    const versaoEventos = useEventosVersao();
    return useMemo(() => resumos(), [tabelas, versaoEventos]);
}

/** Resumo de um evento, atualizado quando o banco muda. */
export function useResumoDoEvento(evento: Evento): ResumoEvento {
    const { tabelas } = useBanco();
    return useMemo(() => resumoDoEvento(evento), [evento, tabelas]);
}

/* ------------------------------------------------------------------ */
/*  Alertas — o que precisa de atenção hoje                            */
/* ------------------------------------------------------------------ */

export type AlertaTom = "error" | "warning" | "success";

export interface Alerta {
    id: string;
    evento: Evento;
    tom: AlertaTom;
    titulo: string;
    detalhe: string;
    acao: string;
    href: string;
    /** Pergunta que o Remix responde sobre esse sinal. */
    pergunta: string;
}

const pct = (valor: number) => `${Math.round(Math.abs(valor) * 100)}%`;

export function alertas(): Alerta[] {
    const lista: Alerta[] = [];

    for (const resumo of resumos()) {
        const { evento, diasParaEvento } = resumo;
        if (evento.status === "encerrado") continue;

        if (evento.status === "rascunho" && diasParaEvento <= 60) {
            lista.push({
                id: `${evento.id}-rascunho`,
                evento,
                tom: "error",
                titulo: "Ainda em rascunho",
                detalhe: `Faltam ${diasParaEvento} dias e as vendas ainda não estão ligadas. Nenhum ingresso pode ser vendido.`,
                acao: "Alterar status",
                href: "/backstage/informacoes-evento",
                pergunta: "O que falta para ligar as vendas deste evento?",
            });
            continue;
        }

        if (resumo.variacaoRitmo <= -0.25) {
            lista.push({
                id: `${evento.id}-ritmo`,
                evento,
                tom: "warning",
                titulo: `Ritmo caiu ${pct(resumo.variacaoRitmo)}`,
                detalhe: `De ${Math.round(resumo.ritmo7 / (1 + resumo.variacaoRitmo))} para ${Math.round(resumo.ritmo7)} ingressos/dia na última semana.`,
                acao: "Ver velocidade",
                href: "/backstage/evento/visao-geral",
                pergunta: "Como está o ritmo de vendas?",
            });
        }

        if (resumo.meta && resumo.projecao < resumo.meta * 0.9 && diasParaEvento > 0) {
            lista.push({
                id: `${evento.id}-meta`,
                evento,
                tom: "warning",
                titulo: "Meta em risco",
                detalhe: `No ritmo atual chega a ${pct(resumo.projecao / resumo.meta)} da meta até o dia do evento.`,
                acao: "Ver painel",
                href: "/backstage/evento/visao-geral",
                pergunta: "Vou bater a meta de faturamento?",
            });
        }

        const sessoesFracas = (resumo.vendas?.sessoes ?? []).filter(
            (s) => s.capacidade > 0 && (s.vendas.ingresse + s.vendas.bilheteria + s.vendas.cortesia) / s.capacidade < 0.35,
        );
        if (sessoesFracas.length && diasParaEvento <= 150) {
            lista.push({
                id: `${evento.id}-sessao`,
                evento,
                tom: "warning",
                titulo: `${sessoesFracas.length} ${sessoesFracas.length === 1 ? "sessão abaixo" : "sessões abaixo"} de 35%`,
                detalhe: sessoesFracas.map((s) => s.nome).join(", "),
                acao: "Ver capacidade",
                href: "/backstage/evento/visao-geral",
                pergunta: "Qual está sendo a ocupação por sessão?",
            });
        }

        if (resumo.variacaoRitmo >= 0.4) {
            lista.push({
                id: `${evento.id}-acelerou`,
                evento,
                tom: "success",
                titulo: `Ritmo acelerou ${pct(resumo.variacaoRitmo)}`,
                detalhe: `${Math.round(resumo.ritmo7)} ingressos/dia na última semana — bom momento para virar o lote.`,
                acao: "Ver lotes",
                href: "/backstage/catalogo/ingressos",
                pergunta: "Como está o ritmo de vendas?",
            });
        }
    }

    const ordem: Record<AlertaTom, number> = { error: 0, warning: 1, success: 2 };
    return lista.sort((a, b) => ordem[a.tom] - ordem[b.tom]);
}

/** Alertas agrupados por evento, para exibir dentro da própria linha. */
export function alertasPorEvento(): Map<string, Alerta[]> {
    const mapa = new Map<string, Alerta[]>();
    for (const alerta of alertas()) {
        const atuais = mapa.get(alerta.evento.id) ?? [];
        atuais.push(alerta);
        mapa.set(alerta.evento.id, atuais);
    }
    return mapa;
}

/** Um evento "precisa de atenção" quando tem alerta de erro ou aviso. */
export const precisaAtencao = (lista: Alerta[] = []) => lista.some((a) => a.tom !== "success");

/* ------------------------------------------------------------------ */
/*  Formatação                                                         */
/* ------------------------------------------------------------------ */

export const brl = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const brlCompacto = (valor: number) =>
    valor >= 1_000_000
        ? `R$ ${(valor / 1_000_000).toFixed(1).replace(".", ",")}M`
        : valor >= 1000
          ? `R$ ${Math.round(valor / 1000)}K`
          : brl(valor);

export const numero = (valor: number) => Math.round(valor).toLocaleString("pt-BR");

/* ------------------------------------------------------------------ */
/*  Ritmo da organização                                               */
/*                                                                     */
/*  Ritmo é a média por dia dos últimos 7 dias, comparada com os 7     */
/*  anteriores. Total responde "quanto já vendi"; ritmo responde "como */
/*  estou vendendo agora", que é a pergunta que muda decisão.          */
/* ------------------------------------------------------------------ */

export interface Ritmo {
    /** Média por dia nos últimos 7 dias. */
    porDia: number;
    /** Variação contra os 7 dias anteriores. `null` quando não há base de comparação. */
    variacao: number | null;
    /** Últimos 7 dias, para o gráfico. */
    serie: number[];
    /** Data ISO de cada ponto de `serie`, para o eixo x. */
    datas: string[];
    /** Soma dos últimos 7 dias, o período analisado no cartão. */
    total: number;
    /** Datas dos 7 dias anteriores, a base da comparação. */
    datasAnteriores: string[];
}

export interface RitmoOrganizacao {
    gmv: Ritmo;
    produtos: Ritmo;
    ingressos: Ritmo;
    ticket: Ritmo;
}

const JANELA = 7;

const media = (valores: number[]) => (valores.length ? valores.reduce((t, v) => t + v, 0) / valores.length : 0);

const montaRitmo = (serie: number[], datas: string[]): Ritmo => {
    const recentes = serie.slice(-JANELA);
    const anteriores = serie.slice(-JANELA * 2, -JANELA);
    const porDia = media(recentes);
    const base = media(anteriores);
    return {
        porDia,
        variacao: base > 0 ? porDia / base - 1 : null,
        serie: recentes,
        datas: datas.slice(-JANELA),
        total: recentes.reduce((t, v) => t + v, 0),
        datasAnteriores: datas.slice(-JANELA * 2, -JANELA),
    };
};

/**
 * Soma o dia a dia de todos os eventos numa linha só. Eventos abrem vendas em
 * datas diferentes, então a chave é a data do calendário, não o dia de venda.
 */
export function ritmoDaOrganizacao(lista: ResumoEvento[]): RitmoOrganizacao {
    const porData = new Map<string, { gmv: number; ingressos: number; produtos: number }>();

    for (const resumo of lista) {
        for (const dia of resumo.vendas?.serie ?? []) {
            const atual = porData.get(dia.dataISO) ?? { gmv: 0, ingressos: 0, produtos: 0 };
            atual.gmv += dia.faturamento;
            atual.ingressos += dia.ingressos;
            atual.produtos += dia.produtos;
            porData.set(dia.dataISO, atual);
        }
    }

    // Só dias fechados: o dia de hoje ainda não acabou e puxaria a curva para baixo,
    // sugerindo uma queda que não aconteceu (EVT-03).
    const hoje = iso(HOJE);
    const ordenados = [...porData.entries()].filter(([data]) => data < hoje).sort(([a], [b]) => a.localeCompare(b));
    const datas = ordenados.map(([data]) => data);
    const dias = ordenados.map(([, valores]) => valores);

    /* Ticket médio do dia, não média dos tickets: dia sem venda distorceria. */
    const serieTicket = dias.map((d) => (d.ingressos ? d.gmv / d.ingressos : 0));

    return {
        gmv: montaRitmo(dias.map((d) => d.gmv), datas),
        produtos: montaRitmo(dias.map((d) => d.produtos), datas),
        ingressos: montaRitmo(dias.map((d) => d.ingressos), datas),
        ticket: montaRitmo(serieTicket, datas),
    };
}
