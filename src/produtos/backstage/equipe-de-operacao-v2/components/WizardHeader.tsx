import { ChevronLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

interface WizardHeaderProps {
    title: string;
    subtitle?: string;
    onBack: () => void;
    /** Ação primária opcional (à direita). Quando ausente, o header não mostra botão. */
    actionLabel?: string;
    onAction?: () => void;
    actionDisabled?: boolean;
    actionLoading?: boolean;
}

/** Cabeçalho dos fluxos de Equipe de operação: voltar + título centralizado + ação primária. */
export function WizardHeader({ title, subtitle, onBack, actionLabel, onAction, actionDisabled, actionLoading }: WizardHeaderProps) {
    return (
        <header className="relative flex items-center justify-between gap-3 px-6 py-6">
            <ButtonUtility size="md" color="secondary" icon={ChevronLeft} tooltip="Voltar" onClick={onBack} />
            <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center text-center">
                <h1 className="text-display-xs font-bold text-primary">{title}</h1>
                {subtitle && <p className="text-sm text-tertiary">{subtitle}</p>}
            </div>
            {actionLabel && onAction ? (
                <Button size="md" color="primary" isDisabled={actionDisabled} isLoading={actionLoading} onClick={onAction}>
                    {actionLabel}
                </Button>
            ) : (
                <span className="size-11" aria-hidden="true" />
            )}
        </header>
    );
}
