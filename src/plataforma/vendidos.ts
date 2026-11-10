import { useEffect, useMemo, useState } from "react";
import { useColecao } from "./db";
import { pendentesPorLote, vendidosPorLote } from "./regras";

/**
 * Vendidos por lote de todo o banco: emitidos válidos mais vendas anteriores (historico).
 * Use este hook em vez de montar o mapa na mão, para site, link de compra e Backstage
 * contarem o mesmo estoque.
 */
export function useVendidos(): Map<string, number> {
    const emitidos = useColecao("ingressos");
    const historico = useColecao("historico");
    return useMemo(() => vendidosPorLote(emitidos, historico), [emitidos, historico]);
}

/**
 * Pendentes por lote de todo o banco: pedidos em pagamento ou reservados, dentro do prazo
 * (PRAZO_DA_COMPRA_PENDENTE_MIN). Recalcula a cada 30 s para o prazo expirar sozinho.
 */
export function usePendentes(): Map<string, number> {
    const pedidos = useColecao("pedidos");
    const [agora, setAgora] = useState(() => Date.now());
    useEffect(() => {
        const id = window.setInterval(() => setAgora(Date.now()), 30_000);
        return () => window.clearInterval(id);
    }, []);
    return useMemo(() => pendentesPorLote(pedidos, agora), [pedidos, agora]);
}
