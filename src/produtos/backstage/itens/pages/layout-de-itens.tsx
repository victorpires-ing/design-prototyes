import { Outlet, useLocation } from "react-router";
import { BackstageLayout } from "../../components/Backstage";
import { AbasDeItens } from "../../components/abas-de-itens";

/**
 * Moldura das abas de Itens (BKS-17): rail, menu do evento, título e abas ficam montados enquanto a
 * pessoa troca entre Ingressos, Produtos e Combos; cada rota renderiza só o conteúdo da aba.
 */
export function LayoutDeItens() {
    const { pathname } = useLocation();
    const ativa = (["produtos", "combos"] as const).find((a) => pathname.startsWith(`/backstage/catalogo/${a}`)) ?? "ingressos";
    return (
        <BackstageLayout activeSection="itens" activeItem={`catalogo-${ativa}`} chaveDaTela="itens">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <AbasDeItens ativa={ativa} />
                {/* Só o conteúdo da aba entra animado ao trocar (BKS-15). */}
                <div key={pathname} className="bs-aba flex min-w-0 flex-1 flex-col">
                    <Outlet />
                </div>
            </div>
        </BackstageLayout>
    );
}
