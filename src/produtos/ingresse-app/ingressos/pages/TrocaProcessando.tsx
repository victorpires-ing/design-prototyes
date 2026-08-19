import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";
import { TicketTimeAnimation } from "../components/TicketTimeAnimation";
import { getEvento } from "../data/eventos";
import { isEmTroca, marcarEmTroca, subscribeTicketStore } from "../data/transfer-store";
import textura from "../../assets/textura.png";

/**
 * Cenário de troca com diferença cujo pagamento leva alguns minutos para processar.
 * O ingresso fica "em troca" (badge + loading na lista). Se a pessoa permanecer aqui,
 * ao concluir o pagamento ela é levada à tela de sucesso; também há CTA para a Carteira.
 */
export function TrocaProcessando() {
    const navigate = useNavigate();
    const { eventId, itemId } = useParams();
    const evento = getEvento(eventId);

    useEffect(() => {
        marcarEmTroca(itemId);
        // Quando a troca concluir (timer global), se ainda estiver nesta tela, vai ao sucesso.
        const unsub = subscribeTicketStore(() => {
            if (!isEmTroca(itemId)) {
                navigate(`/ingresse-app/ingressos/trocar/${evento.id}/${itemId}/sucesso`, { replace: true });
            }
        });
        return unsub;
    }, [evento.id, itemId, navigate]);

    return (
        <AppShell
            showTabBar={false}
            scrollClassName="bg-secondary"
            bottomBar={
                <div className="pointer-events-auto absolute inset-x-0 bottom-0 px-5 pb-8">
                    <Button size="lg" color="primary" className="w-full rounded-full" onClick={() => navigate(`/ingresse-app/ingressos/evento/${evento.id}`)}>
                        Ir para a carteira
                    </Button>
                </div>
            }
        >
            <div className="relative flex min-h-full flex-col overflow-hidden bg-secondary">
                <img src={textura} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 size-full object-cover opacity-60" />
                <div className="relative z-10">
                    <StatusBar tone="dark" />
                </div>
                <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
                    <TicketTimeAnimation />
                    <h1 className="mt-4 text-xl font-bold text-primary">Processando troca</h1>
                    <p className="mt-2 text-sm leading-relaxed text-tertiary">A troca do seu ingresso será concluída assim que o pagamento for confirmado.</p>
                </div>
            </div>
        </AppShell>
    );
}
