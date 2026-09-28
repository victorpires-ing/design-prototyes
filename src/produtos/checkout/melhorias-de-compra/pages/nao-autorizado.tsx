import { useNavigate, useSearchParams } from "react-router";
import { XCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CheckoutShell } from "../components/checkout-shell";
import { PixCard } from "../components/pix-card";
import { TopoVoltar } from "../components/topo";
import { useIsMobile, useTemaClaro } from "../utils/hooks";

const BASE = "/checkout/melhorias-de-compra";

/** Cartão recusado: em vez de só o erro, o Pix já vem gerado como saída para não perder a compra. */
export function NaoAutorizado() {
    useTemaClaro();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [params] = useSearchParams();
    const tipo = params.get("tipo") === "debito" ? "?tipo=debito" : "";

    return (
        <CheckoutShell isMobile={isMobile} topo={isMobile ? null : <TopoVoltar isMobile={isMobile} onVoltar={() => navigate(BASE)} />}>
            <div role="alert" className="flex items-center gap-3 rounded-xl bg-error-secondary px-4 py-3 text-md font-medium text-primary shadow-xs">
                <XCircle className="size-5 shrink-0 text-fg-error-secondary" />
                Pagamento não autorizado
            </div>

            <div className="mt-4">
                <PixCard isMobile={isMobile} variante="fallback" />
            </div>

            <Button size="xl" color="secondary" className="mt-4 w-full" onClick={() => navigate(`${BASE}/cartao${tipo}`)}>
                Tentar outro cartão
            </Button>
        </CheckoutShell>
    );
}
