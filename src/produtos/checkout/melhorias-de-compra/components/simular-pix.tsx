import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { pagarPedido } from "@/plataforma";
import { useCheckout } from "../data/checkout-store";
import { PRECO_PROTECAO } from "../data/pedido";
import { usePedidoCheckout } from "../data/pedido-banco";

/**
 * Controle do protótipo: no mundo real o Pix confirma sozinho quando o banco avisa.
 * Aqui, um clique faz o papel do banco e aprova o pedido do banco unificado.
 */
export function SimularPix() {
    const navigate = useNavigate();
    const doBanco = usePedidoCheckout();
    const { protecao } = useCheckout();
    const [pagando, setPagando] = useState(false);
    if (!doBanco || doBanco.pedido.status !== "aguardando-pagamento") return null;

    const pagar = async () => {
        setPagando(true);
        await pagarPedido(doBanco.pedido.id, "pix", { protecao: protecao === "com" ? PRECO_PROTECAO : 0 });
        navigate(`/checkout/melhorias-de-compra/confirmado?pedido=${doBanco.pedido.id}`);
    };

    return (
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-secondary px-4 py-3 text-center">
            <p className="text-sm text-tertiary">Protótipo: o Pix confirma sozinho na vida real.</p>
            <Button size="sm" color="link-color" onClick={pagar} isLoading={pagando}>
                Simular Pix pago
            </Button>
        </div>
    );
}
