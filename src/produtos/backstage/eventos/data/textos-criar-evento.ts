import { useLocale } from "react-aria-components";
import type { TipoEvento } from "@/plataforma";

/* ------------------------------------------------------------------ */
/*  Textos da criação de evento (UI-TXT-009)                           */
/*                                                                     */
/*  Frases inteiras, com variáveis nomeadas ({nome}) que a tradução    */
/*  pode mover de lugar. Nada de juntar pedaços de frase no código.    */
/*  Datas e números são formatados pelo locale do contexto             */
/*  (I18nProvider), nunca por um "pt-BR" fixo.                         */
/*                                                                     */
/*  Por enquanto só pt-BR. pt-PT, inglês e espanhol entram aqui com    */
/*  a mesma forma (ver eventos/rules.md, Em aberto); sem tradução,     */
/*  cai no pt-BR.                                                      */
/* ------------------------------------------------------------------ */

const PT_BR = {
    subtituloComOrganizacao:
        "O evento nasce em rascunho na organização {organizacao}. Publique quando estiver pronto para vender.",
    subtituloSemOrganizacao: "O evento nasce em rascunho. Publique quando estiver pronto para vender.",
    sugestaoDeNome: "{mandante} x {visitante}",
    limparCampo: "Limpar {campo}",
    quantidadeMaxima: "Quantidade máxima: {limite}",
    imagemGrande: "Escolha uma imagem de até {maximo} KB para {campo}. A escolhida tem {tamanho} KB.",
    removerCampo: "Remover {campo}",
    semDataInicial: "Defina a data e hora inicial",
    localECidade: "{local}, {cidade}",
    buscando: "Buscando…",
    nenhumLocal: "Nenhum local encontrado",
    /** Vocabulário por tipo: frases inteiras, porque gênero e artigo mudam com a palavra (Sessão, Largada). */
    porTipo: {
        evento: {
            cronograma: "Cronograma de sessões",
            explicacao: "A primeira sessão é o início do evento. Adicione outras se o evento acontece em mais de um horário.",
            itemN: "Sessão {n}",
            removerN: "Remover sessão {n}",
            adicionar: "Adicionar sessão",
            limiteGeral: "Limite geral por pessoa",
        },
        esportivo: {
            cronograma: "Cronograma de largadas",
            explicacao: "A primeira largada é o início do evento. Adicione outras se o evento acontece em mais de um horário.",
            itemN: "Largada {n}",
            removerN: "Remover largada {n}",
            adicionar: "Adicionar largada",
            limiteGeral: "Limite geral por participante",
        },
    },
};

export type TextosCriarEvento = typeof PT_BR;

const POR_IDIOMA: Record<string, TextosCriarEvento> = {
    "pt-BR": PT_BR,
};

/** Troca {variavel} pelo valor. A ordem das variáveis fica com a frase de cada idioma. */
export const formatar = (frase: string, vars: Record<string, string | number>) => frase.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));

/** Textos e locale do contexto. */
export function useTextos() {
    const { locale } = useLocale();
    const t = POR_IDIOMA[locale] ?? POR_IDIOMA[locale.split("-")[0]] ?? PT_BR;
    return { t, locale };
}

/** Vocabulário do tipo de evento (Ingresse Sports: "largada", "participante"). */
export const vocabularioDe = (t: TextosCriarEvento, tipo: TipoEvento) => (tipo === "esportivo" ? t.porTipo.esportivo : t.porTipo.evento);
