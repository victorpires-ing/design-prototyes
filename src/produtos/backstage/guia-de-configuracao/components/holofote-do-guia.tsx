import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CampoDeParticulas } from "../../components/campo-de-particulas";
import { useCorDasParticulas } from "../utils/cor-das-particulas";

/** Tempo para ler as duas linhas e achar o painel. Clicar no painel encerra antes (GDC-14). */
const PERMANENCIA_MS = 9000;

const ESMAECER = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
    exit: { opacity: 0, transition: { duration: 0.8, ease: [0.4, 0, 1, 1] as const } },
};
const TEXTO = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
};

/**
 * Apresentação do guia logo depois de criar o evento: escurece a tela a partir do canto do painel,
 * acende o canto com partículas e diz o que vem agora. Não bloqueia cliques (pointer-events-none)
 * e é aria-hidden: a informação que importa está no painel, que não some.
 */
export function HolofoteDoGuia({ onConcluir }: { onConcluir: () => void }) {
    const reduzir = useReducedMotion();
    const cor = useCorDasParticulas("holofote");

    useEffect(() => {
        const t = window.setTimeout(onConcluir, PERMANENCIA_MS);
        return () => window.clearTimeout(t);
    }, [onConcluir]);

    return (
        <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 overflow-hidden" {...(reduzir ? {} : ESMAECER)}>
            {/* Camadas, na ordem do DOM: escurecer, acender, texturizar. */}
            <div className="absolute inset-0 bg-[radial-gradient(190%_180%_at_100%_100%,var(--color-bg-overlay)_0%,color-mix(in_srgb,var(--color-bg-overlay)_58%,transparent)_38%,transparent_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-bg-warning-solid)_32%,var(--color-bg-error-solid)_92%)] opacity-80 [mask-image:radial-gradient(82%_82%_at_100%_100%,black_18%,transparent_70%)]" />
            <CampoDeParticulas
                cor={cor}
                densidade={1}
                escala={5}
                parada={0}
                className="absolute inset-0 size-full [mask-image:radial-gradient(75%_75%_at_100%_100%,black_0%,transparent_72%)]"
            />
            <motion.div
                className="absolute inset-x-6 bottom-[23rem] flex flex-col items-start gap-3 sm:inset-x-auto sm:right-[26rem] sm:bottom-10 sm:max-w-md"
                {...(reduzir ? {} : TEXTO)}
            >
                <h2 className="text-display-sm font-semibold text-[#fff]">Evento criado! Agora, configure as vendas</h2>
                <p className="text-md text-[#fff]/80">Siga as etapas do guia para criar os ingressos, programar as vendas e publicar o evento.</p>
            </motion.div>
        </motion.div>
    );
}
