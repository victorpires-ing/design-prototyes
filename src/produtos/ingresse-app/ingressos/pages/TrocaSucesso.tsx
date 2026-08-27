import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/base/buttons/button";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";
import { CardWalletAnimation } from "../components/CardWalletAnimation";
import { getEvento } from "../data/eventos";
import textura from "../../assets/textura.png";

/** Sucesso da troca de ingresso: carteira animada + "Troca concluída!". */
export function TrocaSucesso() {
    const navigate = useNavigate();
    const { eventId, itemId } = useParams();
    const evento = getEvento(eventId);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [showText, setShowText] = useState(false);

    useEffect(() => () => clearTimeout(timer.current), []);

    const destino = `/ingresse-app/ingressos/detalhe/${evento.id}/${itemId}`;

    const irParaIngresso = () => {
        clearTimeout(timer.current);
        navigate(destino, { replace: true });
    };

    const aoTerminarAnimacao = () => {
        setShowText(true);
        // Fallback: se o usuário não tocar em "Concluir", redireciona automaticamente.
        timer.current = setTimeout(irParaIngresso, 4800);
    };

    return (
        <AppShell showTabBar={false} scrollClassName="bg-secondary">
            <div className="relative flex min-h-full flex-col overflow-hidden bg-secondary">
                <img src={textura} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 size-full object-cover opacity-60" />
                <div className="relative z-10">
                    <StatusBar tone="dark" />
                </div>
                <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
                    <motion.div layout transition={{ type: "spring", stiffness: 220, damping: 26 }}>
                        <CardWalletAnimation plays={2} onDone={aoTerminarAnimacao} />
                    </motion.div>

                    <AnimatePresence>
                        {showText && (
                            <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }}>
                                <h1 className="mt-4 text-xl font-bold text-primary">Troca concluída!</h1>
                                <p className="mt-2 text-sm leading-relaxed text-tertiary">Seu novo ingresso já está disponível.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* CTA: leva ao novo ingresso. Aparece junto com o texto de sucesso. */}
                <AnimatePresence>
                    {showText && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
                            className="relative z-10 px-6 pb-8"
                        >
                            <Button size="lg" color="primary" className="w-full" onClick={irParaIngresso}>
                                Concluir
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AppShell>
    );
}
