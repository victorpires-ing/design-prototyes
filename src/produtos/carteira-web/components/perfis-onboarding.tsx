import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronRight } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import logoBlack from "../../../assets/Company logo_black.svg";
import { BotaoFechar, Dialogo } from "./dialogo";
import { CONTA } from "./site-header";

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

type Etapa = "avatar" | "menu" | "trocado";
const DURACAO: Record<Etapa, number> = { avatar: 1600, menu: 2000, trocado: 2200 };
const PROXIMA: Record<Etapa, Etapa> = { avatar: "menu", menu: "trocado", trocado: "avatar" };

/**
 * Mini-demo em loop da troca de perfil pelo header: toca no avatar, o menu abre com os outros perfis,
 * toca na Mariana, o avatar passa a ser o dela (iniciais) e a carteira mostra os eventos dela.
 */
function DemoPerfis({ compact }: { compact: boolean }) {
    const [etapa, setEtapa] = useState<Etapa>("avatar");
    useEffect(() => {
        const t = setTimeout(() => setEtapa((e) => PROXIMA[e]), DURACAO[etapa]);
        return () => clearTimeout(t);
    }, [etapa]);

    const trocado = etapa === "trocado";

    return (
        // Contorno fino: o header branco da prévia não se mistura com o branco do modal
        <div className={cx("relative overflow-hidden rounded-2xl bg-secondary ring-1 ring-border-secondary", compact ? "h-56" : "h-60")}>
            {/* Pedaço do header do site: logo da Ingresse à esquerda e o avatar da conta no canto */}
            <div className="absolute inset-x-0 top-0 flex h-16 items-center justify-between gap-2 border-b border-secondary bg-primary px-5">
                <img src={logoBlack} alt="Ingresse" className="h-5 w-auto" />
                <div className="relative flex items-center gap-1.5">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span key={trocado ? "ml" : "eu"} className="flex" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }}>
                            {trocado ? <Avatar size="md" initials="ML" alt="Mariana" /> : <Avatar size="md" src={CONTA.foto} alt={CONTA.nome} />}
                        </motion.span>
                    </AnimatePresence>
                    <ChevronDown className={cx("size-4 text-fg-primary transition duration-150 ease-out", etapa === "menu" && "rotate-180")} />
                    {etapa === "avatar" && <Tap className="top-6 left-4" />}
                </div>
            </div>

            {/* Menu da conta, só com a parte dos perfis */}
            <AnimatePresence>
                {etapa === "menu" && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-[72px] right-4 w-64 rounded-xl bg-primary p-3.5 shadow-lg ring-1 ring-border-secondary"
                    >
                        <div className="flex items-center gap-2.5 border-b border-secondary pb-3">
                            <Avatar size="sm" src={CONTA.foto} alt={CONTA.nome} />
                            <span className="truncate text-sm font-medium text-primary">{CONTA.nome}</span>
                        </div>
                        <div className="relative mt-2.5 flex items-center gap-2.5 rounded-lg bg-primary_hover px-2 py-2">
                            <Avatar size="sm" initials="ML" alt="Mariana" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-primary">Mariana Costa Lima</p>
                                <p className="text-xs text-tertiary">Filha</p>
                            </div>
                            <ChevronRight className="size-4 text-fg-quaternary" />
                            <Tap className="top-4 right-7" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Depois da troca: a carteira passa a mostrar os eventos dela */}
            <AnimatePresence>
                {trocado && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-x-0 top-[88px] flex justify-center gap-4 px-5"
                    >
                        {[
                            ["bg-utility-green-600", "ARENA BRASILEIRA"],
                            ["bg-utility-yellow-500", "SAMBA INDEPENDENTE"],
                        ].map(([cor, nome]) => (
                            <div key={nome} className="w-40 overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                                <div className={cx("h-[72px]", cor)} />
                                <p className="truncate px-2.5 py-2 text-xs font-bold text-primary">{nome}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Onboarding dos perfis dos dependentes (primeiro acesso de quem tem dependentes cadastrados).
 * Desktop: modal central, como o do upgrade. Celular (`compact`): bottom sheet no frame.
 */
export function PerfisOnboarding({ aberto, compact, onFechar, onAcessar }: { aberto: boolean; compact: boolean; onFechar: () => void; onAcessar: () => void }) {
    return (
        <Dialogo aberto={aberto} compact={compact} label="Use os perfis dos seus dependentes" largura="max-w-[520px]" onFechar={onFechar}>
            {!compact && (
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-lg font-bold text-primary">Use os perfis dos seus dependentes</h2>
                    <BotaoFechar onClick={onFechar} />
                </div>
            )}

            {/* Celular: o X fica no topo, à direita, como nos outros bottom sheets (o título vem depois da prévia) */}
            {compact && (
                <div className="-mt-1 mb-3 flex justify-end">
                    <BotaoFechar onClick={onFechar} />
                </div>
            )}

            <div className={cx(!compact && "mt-5")}>
                <DemoPerfis compact={compact} />
            </div>

            {compact && <h2 className="mt-5 text-lg font-bold text-primary">Use os perfis dos seus dependentes</h2>}
            <p className={cx("text-sm leading-relaxed text-tertiary", compact ? "mt-1.5" : "mt-5")}>
                Acesse os ingressos que você comprou ou atribuiu e faça novas compras diretamente no perfil deles. Tudo vinculado à sua conta, sem criar outro login.
            </p>

            <div className="mt-5 flex flex-col gap-3">
                <Button size="lg" color="primary" className="w-full" onClick={onAcessar}>
                    Acessar Meus dependentes
                </Button>
                <Button size="lg" color="secondary" className="w-full" onClick={onFechar}>
                    Agora não
                </Button>
            </div>
        </Dialogo>
    );
}
