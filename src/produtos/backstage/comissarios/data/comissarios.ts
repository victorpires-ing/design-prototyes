import { useEffect, useMemo } from "react";
import { semear, useEstadoComissarios } from "@/plataforma/comissarios";
import { setOrganizacaoAtual, useOrganizacaoAtual, useOrganizacoes } from "../../organizacoes/data/organizacao-atual";

/* ------------------------------------------------------------------ */
/*  Adaptador do Backstage para o store de comissários da plataforma.  */
/*  O store (tipos, cálculos e ações) mora em @/plataforma/comissarios,*/
/*  porque o Freepass lê os mesmos dados na jornada do comissário.     */
/* ------------------------------------------------------------------ */

export * from "@/plataforma/comissarios";

/**
 * Comissários da organização em contexto (semeia na primeira leitura). Com `idDoLink`, um link
 * direto para um comissário de outra organização troca a organização em contexto para a dele
 * (COM-07), em vez de dizer que ele não existe.
 */
export function useComissariosDaOrganizacao(idDoLink?: string) {
    const org = useOrganizacaoAtual();
    const todas = useOrganizacoes();
    const e = useEstadoComissarios();
    const orgId = org?.id ?? "";
    const dono = idDoLink ? (e.comissarios.find((c) => c.id === idDoLink)?.organizacaoId ?? idDoLink.match(/^(.+)-com-\d+$/)?.[1]) : undefined;
    const trocando = !!org && !!dono && dono !== org.id && todas.some((o) => o.id === dono);
    useEffect(() => {
        if (trocando && dono) setOrganizacaoAtual(dono);
    }, [trocando, dono]);
    if (org && !e.semeadas.includes(orgId)) queueMicrotask(() => semear(orgId, org.eventos ?? []));
    const comissarios = useMemo(() => e.comissarios.filter((c) => c.organizacaoId === orgId), [e.comissarios, orgId]);
    return { carregando: trocando || !org || !e.semeadas.includes(orgId), organizacao: org, comissarios, estado: e };
}
