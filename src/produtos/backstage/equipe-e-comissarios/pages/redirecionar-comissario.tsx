import { Navigate, useParams, useSearchParams } from "react-router";
import { BackstageLayout } from "../../components/Backstage";
import { BASE, useEquipeDoEvento } from "../data/equipe";

/**
 * Endereço antigo do comissário no evento (`/backstage/evento/comissarios/:id`): leva ao grupo dele
 * no evento em contexto, ou à lista quando ele não tem grupo aqui (ECO-03).
 */
export function RedirecionarComissario() {
    const { id = "" } = useParams();
    const [params] = useSearchParams();
    const { carregando, grupos } = useEquipeDoEvento();
    if (carregando)
        return (
            <BackstageLayout activeSection="equipe-e-comissarios" activeItem="equipe-e-comissarios">
                <div role="status" aria-label="Carregando" className="h-64 w-full animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
            </BackstageLayout>
        );
    const grupo = grupos.find((x) => x.grupo.comissarioId === id)?.grupo;
    if (!grupo) return <Navigate to={BASE} replace />;
    return <Navigate to={`${BASE}/${grupo.id}${params.get("aba") === "configuracao" ? "" : "?aba=pedidos"}`} replace />;
}
