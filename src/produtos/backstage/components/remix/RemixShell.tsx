import { AnimatePresence, motion } from "motion/react";
import { cx } from "@/utils/cx";
import { RemixMark, RemixPanel } from "./RemixPanel";
import { useRemix } from "./remix-context";

/**
 * Integração do Remix na shell do Backstage.
 *
 * Desktop: o agente ocupa uma coluna à direita e o conteúdo da página encolhe
 * para caber ao lado — ele fica *ao lado* do trabalho, não por cima dele.
 * Mobile: folha de tela cheia, como no design.
 */

const LARGURA_DOCA = 400;

/**
 * Shader metálico da borda: um cone neutro que alterna brilho e sombra. Girando,
 * lê como um anel de metal escovado pegando luz.
 */
const BORDA_METALICA =
    "bg-[conic-gradient(from_0deg,#71717a_0%,#f4f4f5_8%,#52525b_18%,#27272a_28%,#a1a1aa_42%,#ffffff_50%,#8a8a93_58%,#3f3f46_72%,#d4d4d8_84%,#71717a_100%)]";

/** Espaço reservado na shell para a doca do agente. */
export function RemixDock() {
    const { aberto } = useRemix();

    return (
        <>
            {/* Desktop: coluna fixa que empurra o conteúdo. */}
            <AnimatePresence>
                {aberto && (
                    <motion.aside
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                        style={{ width: LARGURA_DOCA }}
                        className="sticky top-6 hidden h-[calc(100vh-3rem)] shrink-0 overflow-hidden rounded-2xl ring-1 ring-border-secondary lg:block"
                    >
                        <RemixPanel />
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Mobile e tablet: folha de tela cheia. */}
            <AnimatePresence>
                {aberto && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                        className="fixed inset-0 top-14 z-[65] lg:hidden"
                    >
                        <RemixPanel />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/** Pílula de acesso ao agente. Some quando o painel está aberto. */
export function RemixLauncher() {
    const { aberto, abrir } = useRemix();

    return (
        <AnimatePresence>
            {!aberto && (
                <motion.button
                    type="button"
                    onClick={() => abrir()}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.18 }}
                    className={cx(
                        // A borda de 2px é o próprio padding: o gradiente metálico gira por baixo do miolo.
                        "group fixed bottom-5 left-1/2 z-40 -translate-x-1/2 overflow-hidden rounded-full p-0.5 shadow-lg",
                        // No desktop a pílula encosta na direita, alinhada com a doca que vai abrir.
                        "lg:left-auto lg:right-6 lg:translate-x-0",
                    )}
                >
                    <span
                        aria-hidden="true"
                        className={cx(
                            "absolute top-1/2 left-1/2 aspect-square w-[220%] -translate-x-1/2 -translate-y-1/2",
                            "animate-spin [animation-duration:4s] motion-reduce:animate-none",
                            BORDA_METALICA,
                        )}
                    />
                    <span className="relative flex items-center gap-2 rounded-full bg-primary-solid px-4 py-2 text-sm font-semibold text-white transition duration-100 ease-linear group-hover:bg-brand-solid">
                        <RemixMark className="size-5" />
                        Remix
                    </span>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
