import { useMemo } from "react";
import { useLocale } from "react-aria-components";
import { formatar } from "../../eventos/data/textos-criar-evento";
import type { EstadoItem, EstadoLote } from "./catalogo";

/* ------------------------------------------------------------------ */
/*  Textos do catálogo de itens (UI-TXT-009)                           */
/*                                                                     */
/*  Frases inteiras com variáveis nomeadas. Vocabulário fixo da        */
/*  Ingresse (UI-TXT-003): setor, lote, ingresso, meia-entrada.        */
/*  Só pt-BR por enquanto; sem tradução, cai no pt-BR.                 */
/* ------------------------------------------------------------------ */

const PT_BR = {
    estado: {
        "a-venda": "À venda",
        esgotado: "Esgotado",
        pausado: "Pausado",
        agendado: "Agendado",
        encerrado: "Vendas encerradas",
        "sem-estoque": "Sem estoque",
    } satisfies Record<EstadoItem, string>,
    estadoLote: { "a-venda": "À venda", esgotado: "Esgotado", pausado: "Pausado", aguardando: "Aguardando", encerrado: "Encerrado" } satisfies Record<EstadoLote, string>,
    vendidosDe: "{vendidos} de {total} vendidos",
    disponiveis: "{n} disponíveis",
    precoFaixa: "{min} a {max}",
    salvar: "Salvar alterações",
    descartar: "Descartar",
    alteracoesNaoSalvas: "Alterações não salvas",
    salvo: "Alterações salvas.",
    erroAoSalvar: "Tente de novo: não foi possível salvar as alterações.",
    sairSemSalvar: "Sair sem salvar?",
    sairSemSalvarDica: "As alterações feitas neste item serão perdidas.",
    continuarEditando: "Continuar editando",
    sair: "Sair sem salvar",
    mudancasValem: "As mudanças valem para as próximas vendas.",
    vendas: {
        titulo: "Vendas",
        limite: "Limitar quantidade por pedido",
        minimoQtd: "Mínimo por pedido",
        limiteQtd: "Máximo por pedido",
        minimoErro: "Use um mínimo menor ou igual ao máximo.",
        resumoLimite: "até {n} por pedido",
        resumoFaixa: "de {min} a {max} por pedido",
    },
    visibilidade: {
        ativo: "À venda",
    },
};

export type TextosItens = typeof PT_BR;
const POR_IDIOMA: Record<string, TextosItens> = { "pt-BR": PT_BR };

/** Textos, locale e formatos do catálogo. Preço sem centavos quando o valor é inteiro (UI-TXT-002). */
export function useTextosItens() {
    const { locale } = useLocale();
    return useMemo(() => {
        const t = POR_IDIOMA[locale] ?? POR_IDIOMA[locale.split("-")[0]] ?? PT_BR;
        const moeda = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 2 });
        const inteiro = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
        const dataHora = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        const dataLonga = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" });
        const dataCurta = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
        const regras = new Intl.PluralRules(locale);
        return {
            t,
            locale,
            preco: (v: number) => moeda.format(v),
            numero: (v: number) => inteiro.format(v),
            quando: (iso: string) => dataHora.format(new Date(iso)),
            /** "17 de outubro de 2026 às 22:00" */
            dataLonga: (iso: string) => dataLonga.format(new Date(iso)),
            /** "17 de out." */
            dataCurta: (iso: string) => dataCurta.format(new Date(iso)),
            /** Escolhe a forma pelo número do idioma e preenche {n} formatado. */
            plural: (f: { one: string; other: string }, n: number, vars: Record<string, string | number> = {}) =>
                formatar(regras.select(n) === "one" ? f.one : f.other, { n: inteiro.format(n), ...vars }),
        };
    }, [locale]);
}

export { formatar };
