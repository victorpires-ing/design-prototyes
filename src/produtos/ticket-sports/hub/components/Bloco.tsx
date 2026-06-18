import type { ComponentType, ReactNode } from "react";
import { cx } from "@/utils/cx";

/**
 * Painel temático do Hub: agrupa conteúdo relacionado num bloco com fundo
 * suave e cabeçalho (ícone + título). Usado para deixar as telas organizadas
 * e harmônicas (mesma linguagem da Home, Grupos e Perfil).
 *
 * Dica: os cards internos devem usar `bg-primary` para "saltarem" sobre o
 * fundo `bg-secondary` do bloco.
 */
export function Bloco({
    icon: Icon,
    titulo,
    onVer,
    verLabel = "Ver tudo",
    className,
    children,
}: {
    icon?: ComponentType<{ className?: string }>;
    titulo: string;
    onVer?: () => void;
    verLabel?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section className={cx("flex flex-col gap-4 rounded-3xl bg-secondary p-4", className)}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    {Icon && (
                        <span className="flex size-8 items-center justify-center rounded-xl bg-[#7C3AED] text-white">
                            <Icon className="size-4" />
                        </span>
                    )}
                    <h2 className="text-base font-bold text-primary">{titulo}</h2>
                </div>
                {onVer && (
                    <button type="button" onClick={onVer} className="text-sm font-medium text-[#7C3AED]">
                        {verLabel}
                    </button>
                )}
            </div>
            {children}
        </section>
    );
}
