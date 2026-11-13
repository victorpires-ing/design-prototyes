import { useId, type Ref } from "react";
import { ChevronDown, ChevronUp, Lock01 } from "@untitledui/icons";
import { motion, useReducedMotion, type TargetAndTransition } from "motion/react";
import { IconLeftNumber } from "@/components/application/progress-steps/progress-step-base";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { CloseButton } from "@/components/base/buttons/close-button";
import { CampoDeParticulas } from "../../components/campo-de-particulas";
import { useCorDasParticulas } from "../utils/cor-das-particulas";
import type { PassoId, PassoResolvido } from "../data/passos";

export const TITULO_DO_GUIA = "Guia de configuração";

interface PainelDoGuiaProps {
    passos: PassoResolvido[];
    minimizado: boolean;
    onIrParaPasso: (id: PassoId) => void;
    onAlternarMinimizado: () => void;
    onFechar: () => void;
    /* Prop comum e não forwardRef: o AnimatePresence do motion lê `ref` do filho e reclama no React 18. */
    painelRef?: Ref<HTMLElement>;
}

/* Sobe de fora da tela; sai pelo mesmo lado, mais rápido e acelerando (quem fecha quer a tela de volta). */
const PAINEL = {
    initial: { y: "120%" },
    animate: { y: 0 },
    exit: { y: "120%", transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as const } },
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
};
/* Recolher e reabrir: a mesma gaveta indo e voltando, tempos iguais. */
const RECOLHER = { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

interface Entrada {
    initial: TargetAndTransition;
    animate: TargetAndTransition;
}
/* O título entra palavra a palavra, desfocado; os passos descem em cascata. */
const PALAVRA: Entrada = { initial: { filter: "blur(8px)", opacity: 0 }, animate: { filter: "blur(0px)", opacity: 1 } };
const PASSO: Entrada = { initial: { y: -12, opacity: 0 }, animate: { y: 0, opacity: 1 } };

/**
 * Painel do canto inferior direito com o que falta para o evento vender (GDC-05 a GDC-09).
 * Não bloqueia nada e não tem "próximo": cada passo lê o estado real do evento.
 */
export function PainelDoGuia({ passos, minimizado, onIrParaPasso, onAlternarMinimizado, onFechar, painelRef }: PainelDoGuiaProps) {
    const reduzir = useReducedMotion();
    const corpoId = useId();
    const cor = useCorDasParticulas("faixa");

    const entrar = (v: Entrada, atraso: number) => (reduzir ? {} : { initial: v.initial, animate: v.animate, transition: { duration: 0.4, delay: atraso } });

    return (
        <motion.aside
            ref={painelRef}
            aria-label={TITULO_DO_GUIA}
            className="fixed inset-x-4 bottom-[calc(1rem+var(--altura-barra-fixa,0px))] z-30 overflow-hidden rounded-2xl border border-secondary bg-primary shadow-lg transition-[bottom] duration-200 ease-out motion-reduce:transition-none sm:inset-x-auto sm:right-6 sm:bottom-[calc(1.5rem+var(--altura-barra-fixa,0px))] sm:w-full sm:max-w-sm"
            {...(reduzir ? {} : PAINEL)}
        >
            {/* Faixa: tem área para as partículas e é o que sobra quando o painel é recolhido. */}
            <div className="relative isolate px-5 py-4">
                <CampoDeParticulas
                    cor={cor}
                    densidade={2}
                    escala={3}
                    parada={0}
                    className="absolute inset-0 -z-10 size-full [mask-image:linear-gradient(to_right,transparent_0%,black_100%)]"
                />
                <div className="flex items-center justify-between gap-3">
                    {/* Quebrado em palavras só para a entrada; o leitor de tela lê o aria-label do aside. */}
                    <p className="text-md font-semibold text-primary" aria-hidden="true">
                        {TITULO_DO_GUIA.split(" ").map((palavra, i) => (
                            <motion.span key={`${palavra}-${i}`} className="mr-[0.25em] inline-block" {...entrar(PALAVRA, 0.12 + i * 0.07)}>
                                {palavra}
                            </motion.span>
                        ))}
                    </p>
                    <div className="flex shrink-0 items-center gap-0.5">
                        <ButtonUtility
                            size="sm"
                            color="tertiary"
                            icon={minimizado ? ChevronUp : ChevronDown}
                            tooltip={minimizado ? "Expandir" : "Minimizar"}
                            aria-expanded={!minimizado}
                            aria-controls={corpoId}
                            onClick={onAlternarMinimizado}
                        />
                        <CloseButton size="sm" label="Fechar guia" onPress={onFechar} />
                    </div>
                </div>
            </div>

            {/* initial={false}: o painel já entra na altura que tem. Recolhido, o corpo fica inerte para o Tab. */}
            <motion.div
                id={corpoId}
                className="overflow-hidden"
                initial={false}
                animate={{ height: minimizado ? 0 : "auto" }}
                transition={reduzir ? { duration: 0 } : RECOLHER}
                // React 18 só escreve `inert` como string; vazio liga, ausente desliga.
                {...(minimizado ? { inert: "" as unknown as boolean } : {})}
            >
                <ol className="flex flex-col gap-2 border-t border-secondary bg-secondary p-5">
                    {passos.map((passo, i) => {
                        const atual = passo.status === "current";
                        return (
                            <motion.li key={passo.id} {...entrar(PASSO, 0.22 + i * 0.08)}>
                                <button
                                    type="button"
                                    disabled={passo.bloqueado}
                                    onClick={() => onIrParaPasso(passo.id)}
                                    aria-label={passo.bloqueado && passo.motivo ? `${passo.rotulo}. ${passo.motivo}` : passo.rotulo}
                                    className="group/linha relative -mx-2 w-[calc(100%+1rem)] rounded-lg px-2 py-1.5 text-left transition duration-100 ease-linear enabled:cursor-pointer enabled:hover:bg-secondary_hover disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                                >
                                    {/* A ação vem antes no DOM para o passo ser sempre o último filho (sem o pb-8 do primitivo) e fica à direita por posição absoluta. */}
                                    {atual && (
                                        <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-sm font-semibold text-brand-secondary underline underline-offset-2 group-hover/linha:text-brand-secondary_hover">
                                            {passo.acao}
                                        </span>
                                    )}
                                    {/* O cadeado ocupa o lugar do número: passo bloqueado não tem posição na fila, tem um motivo. */}
                                    {passo.bloqueado && (
                                        <span aria-hidden="true" className="pointer-events-none absolute top-1.5 left-2 z-20 flex size-8 items-center justify-center rounded-full bg-secondary ring-1 ring-secondary ring-inset">
                                            <Lock01 className="size-4 text-fg-quaternary" />
                                        </span>
                                    )}
                                    <div className={atual ? "pr-24" : undefined}>
                                        <IconLeftNumber step={i + 1} status={passo.status} title={passo.rotulo} description={undefined} connector={false} size="md" />
                                    </div>
                                </button>
                            </motion.li>
                        );
                    })}
                </ol>
            </motion.div>
        </motion.aside>
    );
}
