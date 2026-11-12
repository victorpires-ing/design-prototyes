import { useCallback } from "react";
import { useLocation, useNavigate, type NavigateOptions } from "react-router";

/* ------------------------------------------------------------------ */
/*  Painéis do Backstage (BKS-60 a BKS-69)                             */
/*                                                                     */
/*  O Freepass é o Backstage com acessos e funcionalidades a menos:    */
/*  a mesma shell e os mesmos fluxos (cortesia, bilheteria), servidos  */
/*  em /freepass. O painel vem da URL, então a mesma tela do Backstage */
/*  aberta em /freepass/... já monta o menu reduzido.                  */
/* ------------------------------------------------------------------ */

export type Painel = "backstage" | "freepass";

export const painelDaRota = (pathname: string): Painel => (pathname === "/freepass" || pathname.startsWith("/freepass/") ? "freepass" : "backstage");

export function usePainel(): Painel {
    return painelDaRota(useLocation().pathname);
}

/** Início de cada painel: para onde o logo leva. */
export const INICIO_DO_PAINEL: Record<Painel, string> = {
    backstage: "/backstage/eventos",
    freepass: "/freepass",
};

/**
 * Traduz uma rota do Backstage para o painel atual. As telas compartilhadas navegam sempre com o
 * caminho do Backstage ("/backstage/itens") e esta função troca o prefixo quando estão no Freepass,
 * para o fluxo não sair do painel no meio.
 */
export function useRotaDoPainel() {
    const painel = usePainel();
    return useCallback((rota: string) => (painel === "freepass" && NO_FREEPASS.some((r) => rota === r || rota.startsWith(`${r}/`)) ? rota.replace(/^\/backstage/, "/freepass") : rota), [painel]);
}

/** Telas do Backstage que também existem no Freepass. O resto (catálogo, relatórios) fica de fora. */
const NO_FREEPASS = ["/backstage/cortesias", "/backstage/itens", "/backstage/destinatarios", "/backstage/verificacao", "/backstage/bilheteria"];

/** `navigate` que mantém o fluxo no painel atual. */
export function useNavegarNoPainel() {
    const navigate = useNavigate();
    const rota = useRotaDoPainel();
    return useCallback(
        (para: string | number, opcoes?: NavigateOptions) => (typeof para === "number" ? navigate(para) : navigate(rota(para), opcoes)),
        [navigate, rota],
    );
}
