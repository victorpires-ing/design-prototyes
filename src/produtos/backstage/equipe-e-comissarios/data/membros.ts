/* ------------------------------------------------------------------ */
/*  Grupos de Membros como origem de operadores (EO3-09).              */
/*                                                                     */
/*  Vêm do cadastro de Membros da organização                          */
/*  (`components/membros-store.ts`), o mesmo da tela Membros. Antes    */
/*  era uma lista inventada só deste fluxo. As listas são espelhos:    */
/*  refazem quando um grupo ou membro muda em Membros.                 */
/* ------------------------------------------------------------------ */

import { useSyncExternalStore } from "react";
import { assinarMembros, lerMembros } from "../../components/membros-store";

export interface GrupoMembros {
    id: string;
    nome: string;
    emails: string[];
}

export const GRUPOS_MEMBROS: GrupoMembros[] = [];
export const GRUPO_MEMBROS_POR_ID: Record<string, GrupoMembros> = {};

let versao = 0;
const ouvintes = new Set<() => void>();

function espelhar() {
    const { membros, grupos } = lerMembros();
    const emailDe = new Map(membros.map((m) => [m.id, m.email]));
    // O grupo do sistema ("Todos os eventos") não é origem de operadores.
    const lista = grupos
        .filter((g) => !g.sistema)
        .map((g) => ({ id: g.id, nome: g.nome, emails: g.membroIds.map((id) => emailDe.get(id)).filter((e): e is string => !!e) }));
    GRUPOS_MEMBROS.splice(0, GRUPOS_MEMBROS.length, ...lista);
    for (const k of Object.keys(GRUPO_MEMBROS_POR_ID)) delete GRUPO_MEMBROS_POR_ID[k];
    for (const g of lista) GRUPO_MEMBROS_POR_ID[g.id] = g;
    versao++;
    ouvintes.forEach((o) => o());
}

assinarMembros(espelhar);
espelhar();

/** Assina os grupos de Membros: a tela redesenha quando eles mudam. */
export function useGruposDeMembros() {
    return useSyncExternalStore(
        (fn) => {
            ouvintes.add(fn);
            return () => ouvintes.delete(fn);
        },
        () => versao,
        () => 0,
    );
}
