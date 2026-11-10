import { useMemo } from "react";
import { useLocale } from "react-aria-components";
import { formatar } from "./textos-criar-evento";

/* ------------------------------------------------------------------ */
/*  Textos da página de Eventos (UI-TXT-009)                           */
/*                                                                     */
/*  Frases inteiras, com variáveis nomeadas, e plural pelo idioma      */
/*  (Intl.PluralRules). Datas, números e percentuais são formatados    */
/*  pelo locale do contexto. Por enquanto só pt-BR; sem tradução, cai  */
/*  no pt-BR (ver eventos/rules.md, Em aberto).                        */
/* ------------------------------------------------------------------ */

const PT_BR = {
    titulo: "Eventos",
    eventosAtivos: { one: "{n} evento ativo", other: "{n} eventos ativos" },
    criarEvento: "Criar evento",
    tipoDoEvento: "Tipo do evento",
    buscar: "Buscar evento",
    buscarPlaceholder: "Buscar por nome, produtor ou local",
    ordenarPor: "Ordenar por",
    resumo: "Resumo das vendas dos eventos ativos",
    carregando: "Carregando eventos",
    semConexao: "Sem conexão com o banco: os números podem estar desatualizados. A página tenta de novo sozinha.",
    semEventos: "Nenhum evento ainda",
    semEventosDica: "Crie o primeiro evento da organização para começar a vender.",
    listaDeEventos: "Lista de eventos",
    ordens: { data: "Data do evento", ocupacao: "Ocupação", faturamento: "Faturamento", ritmo: "Ritmo de vendas" },
    status: { rascunho: "Rascunho", privado: "Privado", publicado: "Publicado", encerrado: "Encerrado" },
    tipos: { futebol: "Futebol", show: "Shows e festas", esportivo: "Evento esportivo" },
    nenhumEvento: "Nenhum evento encontrado",
    nenhumEventoDica: "Tente outro nome, produtor ou local.",
    maisAcoes: "Mais ações para {evento}",
    editar: "Editar",
    metricas: {
        faturamento: "Faturamento confirmado",
        produtos: "Produtos vendidos",
        ingressos: "Ingressos vendidos",
        porDia: "{valor} por dia",
        produtosPorDia: { one: "{valor} produto por dia", other: "{valor} produtos por dia" },
        ingressosPorDia: { one: "{valor} ingresso por dia", other: "{valor} ingressos por dia" },
        intervalo: "{de} a {ate}",
        periodo: "De {intervalo}",
        acima: "{percentual} acima de {periodo}",
        abaixo: "{percentual} abaixo de {periodo}",
        estavel: "Estável em relação a {periodo}",
        acimaDaSemanaAnterior: "{percentual} acima da semana anterior",
        abaixoDaSemanaAnterior: "{percentual} abaixo da semana anterior",
        estavelSemanaAnterior: "Estável em relação à semana anterior",
    },
};

export type TextosEventos = typeof PT_BR;
type Plural = { one: string; other: string };

const POR_IDIOMA: Record<string, TextosEventos> = { "pt-BR": PT_BR };

/** Moeda e números no idioma da pessoa. "R$ 8 mil" no compacto, sem o "K" do inglês. */
export function useFormatos() {
    const { locale } = useLocale();
    return useMemo(() => {
        const moeda = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
        const compacto = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
        const inteiro = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
        return {
            brl: (v: number) => moeda.format(v),
            brlCompacto: (v: number) => compacto.format(v),
            numero: (v: number) => inteiro.format(Math.round(v)),
        };
    }, [locale]);
}

export function useTextosEventos() {
    const { locale } = useLocale();
    const t = POR_IDIOMA[locale] ?? POR_IDIOMA[locale.split("-")[0]] ?? PT_BR;
    const regras = new Intl.PluralRules(locale);
    /** Escolhe a forma pelo número e preenche as variáveis. */
    const plural = (formas: Plural, n: number, vars: Record<string, string | number> = {}) =>
        formatar(regras.select(n) === "one" ? formas.one : formas.other, { n, ...vars });
    return { t, locale, plural };
}

export { formatar };
