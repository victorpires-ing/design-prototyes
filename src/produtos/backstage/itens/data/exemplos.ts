/* ------------------------------------------------------------------ */
/*  Listas de exemplo do catálogo (fictícias)                          */
/*                                                                     */
/*  Chaves de acesso: em produção vêm de Marketing › Chave de acesso   */
/*  do evento (lá também em mock). Segmentações vêm de Público › */
/*  Segmentações da organização.                                       */
/* ------------------------------------------------------------------ */

const PREFIXOS = ["VIP", "PROMO", "IMPRENSA", "PARCEIRO", "STAFF", "CONVITE"];

/** 600 chaves de exemplo, determinísticas, no formato de Marketing (letras e números). */
export const CHAVES_DE_EXEMPLO: string[] = Array.from({ length: 600 }, (_, i) => {
    const prefixo = PREFIXOS[i % PREFIXOS.length];
    const sufixo = ((i * 7919 + 104729) % 1679616).toString(36).toUpperCase().padStart(4, "0");
    return `${prefixo}${sufixo}`;
});

/** Segmentações da organização: as mesmas de Público (aprovação de solicitações). */
export { SEGMENTACOES } from "../../publico/components/DecisaoModal";
