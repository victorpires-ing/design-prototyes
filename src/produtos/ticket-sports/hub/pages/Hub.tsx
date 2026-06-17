import { useNavigate } from "react-router";
import { TicketSportsLayout } from "../../components/TicketSportsLayout";
import { HubButton, HubWordmark } from "../components/hub-ui";

export function Hub() {
    const navigate = useNavigate();
    return (
        <TicketSportsLayout>
            <div className="flex flex-1 flex-col items-center justify-center px-6">
                <HubWordmark className="text-8xl" />
                <p className="mt-2 text-md text-tertiary">Transforme movimento em conquista.</p>
            </div>
            <div className="flex flex-col gap-3 px-4 pb-8">
                <HubButton onClick={() => navigate("/ticket-sports/hub/tipo-perfil")}>Começar agora!</HubButton>
                <HubButton variant="secondary" onClick={() => navigate("/ticket-sports/hub/login")}>
                    Já tenho uma conta
                </HubButton>
            </div>
        </TicketSportsLayout>
    );
}
