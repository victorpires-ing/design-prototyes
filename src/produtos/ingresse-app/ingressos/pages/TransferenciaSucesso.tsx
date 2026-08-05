import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";
import { TicketCheckAnimation } from "../components/TicketCheckAnimation";
import { getCombo, getEvento } from "../data/eventos";
import { marcarTransferido } from "../data/transfer-store";

const DESTINATARIO = "Mariana Costa Lima";

export function TransferenciaSucesso() {
    const navigate = useNavigate();
    const { eventId, id } = useParams();
    const evento = getEvento(eventId);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [showText, setShowText] = useState(false);

    // Marca como transferido assim que a tela abre.
    useEffect(() => {
        marcarTransferido(id);
        return () => clearTimeout(timer.current);
    }, [id]);

    // Volta para o combo (se for combo) ou para o detalhe do ingresso.
    const destino = getCombo(eventId, id)
        ? `/ingresse-app/ingressos/combo/${evento.id}/${id}`
        : `/ingresse-app/ingressos/detalhe/${evento.id}/${id}`;

    // Após a animação do ícone: revela o texto (ícone sobe) e, ~4,8s depois (tempo de ler),
    // vai para o ingresso transferido.
    const aoTerminarAnimacao = () => {
        setShowText(true);
        timer.current = setTimeout(() => {
            navigate(destino, { replace: true });
        }, 4800);
    };

    return (
        <AppShell showTabBar={false} scrollClassName="bg-secondary">
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                    {/* Ícone: começa centralizado sozinho e reposiciona (sobe) quando o texto surge */}
                    <motion.div layout transition={{ type: "spring", stiffness: 220, damping: 26 }}>
                        <TicketCheckAnimation plays={1} onDone={aoTerminarAnimacao} />
                    </motion.div>

                    <AnimatePresence>
                        {showText && (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                            >
                                <h1 className="mt-4 text-xl font-bold text-primary">Ingresso transferido</h1>
                                <p className="mt-2 text-sm leading-relaxed text-tertiary">
                                    A transferência foi concluída e o ingresso já está com <span className="font-medium text-secondary">{DESTINATARIO}</span>.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </AppShell>
    );
}
