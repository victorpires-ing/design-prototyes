import { Plus, Users03 } from "@untitledui/icons";
import { useNavigate, useSearchParams } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubButton } from "../components/hub-ui";

export function Sucesso() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isEmpresa = searchParams.get("tipo") === "juridica";

    return (
        <TicketSportsLayout>
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <span className="text-8xl leading-none">✌️</span>
                <h1 className="mt-8 text-display-xs font-bold text-primary">
                    {isEmpresa ? "Empresa cadastrada com sucesso!" : "Perfil criado com sucesso!"}
                </h1>
                <p className="mt-2 text-md text-tertiary">
                    {isEmpresa
                        ? "Tudo pronto! Configure sua comunidade ou explore o app."
                        : "Tudo pronto! Crie sua primeira rotina ou explore o app no seu ritmo."}
                </p>
            </div>
            <div className="flex flex-col gap-3 px-4 pb-8">
                {isEmpresa ? (
                    <HubButton iconLeading={Users03} onClick={() => navigate("/ticket-sports/hub/configurar-comunidade")}>
                        Configurar comunidade
                    </HubButton>
                ) : (
                    <HubButton iconLeading={Plus} onClick={() => navigate("/ticket-sports/hub/criar-rotina")}>
                        Criar rotina
                    </HubButton>
                )}
                <HubButton variant="secondary" onClick={() => navigate(isEmpresa ? "/ticket-sports/hub/empresa" : "/ticket-sports/hub/home")}>
                    Navegar pelo App
                </HubButton>
            </div>
        </TicketSportsLayout>
    );
}
