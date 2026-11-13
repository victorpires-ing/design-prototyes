import { Navigate, useLocation } from "react-router";

/**
 * O produto se chamava Revenda e as rotas começavam em /revenda. Links antigos (inclusive os já
 * compartilhados) caem aqui e vão para o mesmo caminho em /novos-negocios, com a query string.
 */
export function RedirecionaRevenda() {
    const { pathname, search } = useLocation();
    return <Navigate to={pathname.replace(/^\/revenda/, "/novos-negocios") + search} replace />;
}
