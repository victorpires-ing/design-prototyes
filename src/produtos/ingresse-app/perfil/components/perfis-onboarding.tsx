import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, XClose } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { BottomSheet } from "../../components/BottomSheet";
import { FOTO_MINHA_CONTA } from "../../components/perfil-ativo";
import { EU } from "../data/dependentes";

/** Dedinho tocando + ondinha, para simular o "clique" da pessoa (mesmo do onboarding do upgrade). */
function Tap({ className }: { className?: string }) {
    return (
        <span className={cx("pointer-events-none absolute z-10", className)}>
            <motion.span
                className="absolute -inset-2 rounded-full bg-black/15"
                animate={{ scale: [0.5, 1.8], opacity: [0.45, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span className="block text-2xl drop-shadow" animate={{ y: [0, -5, 0] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}>
                👆
            </motion.span>
        </span>
    );
}

type Etapa = "toque" | "carregando" | "trocado";
const DURACAO: Record<Etapa, number> = { toque: 1800, carregando: 700, trocado: 2400 };
const PROXIMA: Record<Etapa, Etapa> = { toque: "carregando", carregando: "trocado", trocado: "toque" };

const CAMILA = { nome: EU.nome, legenda: "Sua conta", foto: FOTO_MINHA_CONTA, iniciais: EU.iniciais };
const MARIANA = { nome: "Mariana Costa Lima", legenda: "Filha", foto: undefined, iniciais: "ML" };

/**
 * Mini-demo em loop da troca de perfil no card do Perfil (como no app): toca na Mariana,
 * aparece o loading curto da troca e ela passa a ser o perfil em destaque.
 */
function DemoPerfis() {
    const [etapa, setEtapa] = useState<Etapa>("toque");
    useEffect(() => {
        const t = setTimeout(() => setEtapa((e) => PROXIMA[e]), DURACAO[etapa]);
        return () => clearTimeout(t);
    }, [etapa]);

    const trocado = etapa === "trocado";
    const [principal, outro] = trocado ? [MARIANA, CAMILA] : [CAMILA, MARIANA];

    return (
        <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-secondary px-5">
            <div className="w-full max-w-[290px] overflow-hidden rounded-2xl bg-primary shadow-lg ring-1 ring-border-secondary">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={principal.nome}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-3 p-3"
                    >
                        <Avatar size="md" src={principal.foto} initials={principal.iniciais} alt={principal.nome} />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-primary">{principal.nome}</p>
                            <p className="text-xs text-tertiary">{principal.legenda}</p>
                        </div>
                    </motion.div>
                </AnimatePresence>
                <div className="relative flex items-center gap-2.5 border-t border-secondary px-3 py-2.5">
                    <Avatar size="xs" src={outro.foto} initials={outro.iniciais} alt={outro.nome} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-primary">{outro.nome}</p>
                        <p className="text-[10px] text-tertiary">{outro.legenda}</p>
                    </div>
                    {etapa === "carregando" ? (
                        <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-tertiary border-t-fg-brand-primary" aria-hidden="true" />
                    ) : (
                        <ChevronRight className="size-3.5 shrink-0 text-fg-quaternary" />
                    )}
                    {etapa === "toque" && <Tap className="top-2 right-8" />}
                </div>
            </div>
        </div>
    );
}

/** Onboarding dos perfis dos dependentes no app (primeiro acesso de quem tem dependentes cadastrados). */
export function PerfisOnboarding({ isOpen, onClose, onAcessar }: { isOpen: boolean; onClose: () => void; onAcessar: () => void }) {
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col">
                {/* X no topo, à direita, como nos outros bottom sheets do app (o título vem depois da prévia) */}
                <div className="-mt-1 mb-3 flex justify-end">
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={onClose}
                        className="-mr-1 flex size-6 shrink-0 items-center justify-center text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                    >
                        <XClose className="size-5" />
                    </button>
                </div>
                <DemoPerfis />

                <h2 className="mt-5 text-lg font-bold text-primary">Use os perfis dos seus dependentes</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-tertiary">
                    Acesse os ingressos que você comprou ou atribuiu e faça novas compras diretamente no perfil deles. Tudo vinculado à sua conta, sem criar outro login.
                </p>

                <div className="mt-5 flex flex-col gap-3">
                    <Button size="lg" color="primary" className="w-full" onClick={onAcessar}>
                        Acessar Meus dependentes
                    </Button>
                    <Button size="lg" color="secondary" className="w-full" onClick={onClose}>
                        Agora não
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
}
