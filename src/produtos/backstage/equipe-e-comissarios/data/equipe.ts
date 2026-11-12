/* ------------------------------------------------------------------ */
/*  Adaptador do Backstage para o store único de Equipe e Comissários. */
/*                                                                     */
/*  O modelo do grupo mora em @/plataforma/equipe e o estado no store  */
/*  de @/plataforma/comissarios (lido também pelo Freepass). Aqui      */
/*  entram o que depende do Backstage: o cadastro de Membros (pessoas  */
/*  exatas de cada grupo), o catálogo do evento em contexto e a        */
/*  semente dos comissários e dos exemplos.                            */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo } from "react";
import { semearExemplosDaEquipe, type Comissario, type VendaAtribuida, type Repasse } from "@/plataforma/comissarios";
import { usoDoGrupo, type GrupoEquipe } from "@/plataforma/equipe";
import { useComissariosDaOrganizacao } from "../../comissarios/data/comissarios";
import { useEventoAtual } from "../../eventos/data/eventos";
import { ITEM_POR_ID, useCatalogoDaEquipe } from "./catalogo-evento";
import { gruposDeExemplo } from "./grupos-exemplo";
import { GRUPO_MEMBROS_POR_ID, useGruposDeMembros } from "./membros";

export * from "@/plataforma/equipe";
export {
    alterarGrupo,
    criarGrupo,
    salvarCanal,
    tornarComissario,
    totais,
    comissaoDaVenda,
    normalizarCodigo,
    comissaoBruta,
    condicoesNoEvento,
    cortesiasEnviadas,
    setoresDoEvento,
    CANAIS,
    CANAL_LABEL,
    type Comissario,
    type VendaAtribuida,
    type Repasse,
    type Totais,
    type Condicoes,
} from "@/plataforma/comissarios";

export const NOME_MAX = 40;
export const BASE = "/backstage/evento/equipe";

/** Item ainda existe no catálogo do evento em contexto (itens que saíram não contam, ECO-45). */
export const itemValido = (id: string) => !!ITEM_POR_ID[id];

/** Junta os membros dos grupos de Membros e os e-mails avulsos, sem repetição. */
export function operadoresDe(grupos: string[], emails: string[]) {
    return [...new Set([...grupos.flatMap((id) => GRUPO_MEMBROS_POR_ID[id]?.emails ?? []), ...emails])];
}

/** Ligada = não foi desligada sozinha e entra por um caminho ligado: e-mail avulso ou grupo de Membros ligado (ECO-62). */
export function operadorAtivo(g: GrupoEquipe, email: string) {
    if (g.operadoresInativos.includes(email)) return false;
    if (g.emailsAvulsos.includes(email)) return true;
    return g.gruposMembrosIds.some((m) => !g.gruposInativos.includes(m) && GRUPO_MEMBROS_POR_ID[m]?.emails.includes(email));
}

/** Uso somando os canais ligados, contando só os itens do catálogo. */
export const usoNoCatalogo = (g: GrupoEquipe) => usoDoGrupo(g, itemValido);

export interface DadosDoGrupo {
    grupo: GrupoEquipe;
    comissario?: Comissario;
    vendas: VendaAtribuida[];
    repasses: Repasse[];
}

/**
 * Grupos do evento em contexto, com o comissário, as vendas e os repasses dele. Semeia os
 * comissários da organização na primeira leitura e, num evento que já tem grupos semeados, os 6
 * exemplos (ECO-06).
 */
export function useEquipeDoEvento() {
    useCatalogoDaEquipe();
    useGruposDeMembros();
    const evento = useEventoAtual();
    const { carregando, estado, organizacao } = useComissariosDaOrganizacao();
    const doEvento = useMemo(() => estado.grupos.filter((g) => g.eventoId === evento.id), [estado.grupos, evento.id]);
    const precisaExemplos = !carregando && doEvento.length > 0 && !estado.eventosComExemplos.includes(evento.id);
    useEffect(() => {
        if (precisaExemplos) semearExemplosDaEquipe(evento.id, gruposDeExemplo(evento.id, organizacao?.id ?? ""));
    }, [precisaExemplos, evento.id, organizacao?.id]);

    const grupos = useMemo<DadosDoGrupo[]>(
        () =>
            doEvento.map((grupo) => {
                // O comissário é o próprio grupo (ECO-09): lido do store, sem depender da organização gravada.
                const comissario = grupo.comissarioId ? estado.comissarios.find((c) => c.id === grupo.comissarioId) : undefined;
                return {
                    grupo,
                    comissario,
                    vendas: comissario ? estado.vendas.filter((v) => v.comissarioId === comissario.id && v.eventoId === evento.id) : [],
                    repasses: comissario ? estado.repasses.filter((r) => r.comissarioId === comissario.id && r.eventoId === evento.id) : [],
                };
            }),
        [doEvento, estado.comissarios, estado.vendas, estado.repasses, evento.id],
    );

    return { carregando, evento, organizacao, grupos };
}
