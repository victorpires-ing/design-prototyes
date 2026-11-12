import type { ReactNode } from "react";
import { AlertCircle, CheckCircle, InfoCircle } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

type Cor = "gray" | "warning" | "error" | "success" | "brand";

const ICONES = { gray: InfoCircle, brand: InfoCircle, warning: AlertCircle, error: AlertCircle, success: CheckCircle };

/**
 * Aviso dentro da página. Composto do Alert flutuante do DS (FeaturedIcon outline + título +
 * descrição + ações), sem o botão de fechar: o aviso some quando o estado muda.
 */
export function Aviso({ cor = "gray", titulo, children, acoes, className }: { cor?: Cor; titulo: string; children?: ReactNode; acoes?: ReactNode; className?: string }) {
    return (
        <div
            role={cor === "error" ? "alert" : "status"}
            className={cx(
                "flex animate-in flex-col gap-4 rounded-xl border bg-primary_alt p-4 shadow-xs duration-200 fade-in slide-in-from-top-1 md:flex-row",
                cor === "error" ? "border-error_subtle" : "border-primary",
                className,
            )}
        >
            <FeaturedIcon icon={ICONES[cor]} color={cor} theme="outline" size="md" />
            <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-secondary">{titulo}</p>
                    {children && <div className="text-sm text-tertiary">{children}</div>}
                </div>
                {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
            </div>
        </div>
    );
}
