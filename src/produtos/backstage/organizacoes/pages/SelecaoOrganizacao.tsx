import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router";
import LogoBlack from "../../../../assets/Company logo_black.svg";
import LogoWhite from "../../../../assets/Company logo_white.svg";
import { useBanco } from "@/plataforma";
import { ThemeToggle } from "../../components/ThemeToggle";
import { BuscaOrganizacaoEvento } from "../components/BuscaOrganizacaoEvento";
import { escolheuNestaSessao, setOrganizacaoAtual, useOrganizacoes } from "../data/organizacao-atual";

/** Entrada do Backstage (`/backstage`): escolher a organização ou ir direto a um evento. */
export function SelecaoOrganizacao() {
    const navigate = useNavigate();
    const { modo } = useBanco();
    const orgs = useOrganizacoes();
    const unica = modo !== "carregando" && orgs.length === 1 ? orgs[0] : undefined;

    // ORG-03: com uma organização só, não há o que escolher.
    useEffect(() => {
        if (!unica) return;
        setOrganizacaoAtual(unica.id);
        navigate("/backstage/eventos", { replace: true });
    }, [unica, navigate]);

    // ORG-02: já escolheu nesta sessão do navegador, entra direto.
    if (escolheuNestaSessao()) return <Navigate to="/backstage/eventos" replace />;

    return (
        <div className="flex min-h-dvh flex-col bg-primary_alt">
            <header className="flex items-center justify-between px-4 py-4 md:px-6">
                <img src={LogoBlack} alt="Ingresse" className="block h-6 dark:hidden" />
                <img src={LogoWhite} alt="Ingresse" className="hidden h-6 dark:block" />
                <ThemeToggle />
            </header>

            <main className="flex flex-1 flex-col items-center px-4 pt-6 pb-10 md:pt-[clamp(32px,10vh,120px)]">
                <div className="flex w-full max-w-xl flex-col gap-6">
                    <div className="flex flex-col gap-1 text-center">
                        <h1 className="text-display-xs font-semibold text-primary">Escolha onde trabalhar</h1>
                        <p className="text-md text-tertiary">Busque uma organização ou vá direto para um evento.</p>
                    </div>
                    <BuscaOrganizacaoEvento variante="pagina" className="overflow-hidden rounded-xl bg-primary shadow-lg ring-1 ring-secondary" />
                </div>
            </main>
        </div>
    );
}
