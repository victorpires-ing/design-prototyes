import type { CanalComissario, Condicoes } from "@/plataforma/comissarios";

/* Formatação da jornada do comissário no Freepass. */

const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const INTEIRO = new Intl.NumberFormat("pt-BR");
const DATA = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
const DATA_HORA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const DIA = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export const moeda = (v: number) => MOEDA.format(v);
export const numero = (v: number) => INTEIRO.format(v);
export const plural = (n: number, um: string, varios: string) => `${numero(n)} ${n === 1 ? um : varios}`;
export const dataDoEvento = (iso: string) => DATA.format(new Date(iso)).replace(/\./g, "");
export const dataHora = (iso: string) => DATA_HORA.format(new Date(iso));
export const dia = (iso: string) => DIA.format(new Date(iso)).replace(/\./g, "");

export const textoComissao = (c: Pick<Condicoes, "tipo" | "comissao">) =>
    c.tipo === "acrescimo" ? `${moeda(c.comissao)} a mais em cada ingresso` : c.tipo === "fixo" ? `${moeda(c.comissao)} por ingresso` : `${String(c.comissao).replace(".", ",")}% de cada ingresso`;

export const linkDeVenda = (slug: string, codigo: string) => `ingresse.com/e/${slug}?ref=${codigo}`;

/** Quanto o comissário ganha num ingresso e quanto quem compra paga com o código (vêm do store da plataforma). */
export { ganhoPorIngresso, precoComCodigo } from "@/plataforma/comissarios";

export const CANAL_CURTO: Record<CanalComissario, string> = { online: "Link", bilheteria: "Bilheteria", cortesia: "Cortesia" };
