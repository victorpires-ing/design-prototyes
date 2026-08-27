import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";
import { TicketTimeAnimation } from "../components/TicketTimeAnimation";
import { getEvento } from "../data/eventos";
import { concluirTransferencia, marcarEmTransferencia } from "../data/transfer-store";
import textura from "../../assets/textura.png";

/** Tempo (simulado) de processamento do pagamento antes da transferência concluir. */
const PROCESSANDO_MS = 15000;

/**
 * Cenário 2 da transferência paga: o pagamento leva alguns minutos para processar.
 * O ingresso fica "em transferência"; se a pessoa permanecer nesta tela, ao concluir
 * o pagamento ela é levada à tela de sucesso. Também há um CTA para sair para a Carteira.
 */
export function TransferenciaProcessando() {
    const navigate = useNavigate();
    const { eventId, id } = useParams();
    const evento = getEvento(eventId);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        marcarEmTransferencia(id);
        // Se a pessoa ficar na tela, ao terminar o processamento vai para o sucesso.
        timer.current = setTimeout(() => {
            concluirTransferencia(id);
            navigate(`/ingresse-app/ingressos/transferir-pagamento/${evento.id}/${id}/sucesso`, { replace: true });
        }, PROCESSANDO_MS);
        return () => clearTimeout(timer.current);
    }, [evento.id, id, navigate]);

    return (
        <AppShell
            showTabBar={false}
            scrollClassName="bg-secondary"
            bottomBar={
                <div className="pointer-events-auto absolute inset-x-0 bottom-0 px-5 pb-8">
                    <Button
                        size="lg"
                        color="primary"
                        className="w-full rounded-full"
                        onClick={() => navigate(`/ingresse-app/ingressos/evento/${evento.id}`)}
                    >
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
                    <h1 className="mt-4 text-xl font-bold text-primary">Processando pagamento</h1>
                    <p className="mt-2 text-sm leading-relaxed text-tertiary">A transferência será concluída assim que o pagamento for confirmado.</p>
                </div>
            </div>
        </AppShell>
    );
}
