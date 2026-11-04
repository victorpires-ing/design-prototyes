import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

/**
 * Diálogo da Carteira Web: no desktop é um modal centralizado; no celular (`compact`)
 * vira o bottom sheet do app, preso ao frame do celular.
 */
export function Dialogo({
    aberto,
    compact,
    label,
    bloqueado,
    largura = "max-w-[440px]",
    onFechar,
    children,
}: {
    aberto: boolean;
    compact: boolean;
    label: string;
    /** Impede fechar pelo fundo (ex.: enquanto confirma). */
    bloqueado?: boolean;
    /** Largura máxima do modal no desktop (padrão 440px). */
    largura?: string;
    onFechar: () => void;
    children: ReactNode;
}) {
    return (
        <AnimatePresence>
            {aberto && (
                <motion.div
                    key="dialogo"
                    className={cx("z-50 flex bg-overlay/60", compact ? "absolute inset-0 items-end" : "fixed inset-0 items-center justify-center p-4")}
                    role="dialog"
                    aria-modal="true"
                    aria-label={label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    onClick={(e) => e.target === e.currentTarget && !bloqueado && onFechar()}
                >
                    <motion.div
                        className={cx(
                            "w-full bg-primary shadow-xl ring-1 ring-border-secondary",
                            compact ? "rounded-t-2xl px-6 pt-6 pb-8" : cx(largura, "rounded-2xl p-6"),
                        )}
                        initial={compact ? { y: "100%" } : { opacity: 0, scale: 0.96, y: 8 }}
                        animate={compact ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={compact ? { y: "100%" } : { opacity: 0, scale: 0.96, y: 8 }}
                        transition={compact ? { duration: 0.45, ease: [0.16, 1, 0.3, 1] } : { duration: 0.2, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export const BotaoFechar = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button
        type="button"
        aria-label="Fechar"
        disabled={disabled}
        onClick={onClick}
        className="-mr-1 flex size-6 shrink-0 items-center justify-center self-start text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary disabled:opacity-50"
    >
        <XClose className="size-5" />
    </button>
);

/** Confirmação (mesmos textos das sheets do app). No desktop os botões ficam lado a lado. */
export function Confirmacao({
    aberto,
    compact,
    titulo,
    descricao,
    confirmar,
    destrutivo,
    carregando,
    onConfirmar,
    onCancelar,
}: {
    aberto: boolean;
    compact: boolean;
    titulo: string;
    descricao?: ReactNode;
    confirmar: string;
    destrutivo?: boolean;
    carregando?: boolean;
    onConfirmar: () => void;
    onCancelar: () => void;
}) {
    return (
        <Dialogo aberto={aberto} compact={compact} label={titulo} bloqueado={carregando} onFechar={onCancelar}>
            <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold text-primary">{titulo}</h2>
                <BotaoFechar onClick={onCancelar} disabled={carregando} />
            </div>
            {descricao && <div className="mt-1 text-sm leading-relaxed text-tertiary">{descricao}</div>}
            <div className={cx("mt-6 flex gap-3", compact ? "flex-col" : "flex-row-reverse")}>
                <Button size="lg" color={destrutivo ? "primary-destructive" : "primary"} className={compact ? "w-full" : "flex-1"} isLoading={carregando} onClick={onConfirmar}>
                    {confirmar}
                </Button>
                <Button size="lg" color="secondary" className={compact ? "w-full" : "flex-1"} isDisabled={carregando} onClick={onCancelar}>
                    Cancelar
                </Button>
            </div>
        </Dialogo>
    );
}
