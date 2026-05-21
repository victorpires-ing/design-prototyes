import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, ShoppingCart01, Users01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressFeaturedIconType } from "@/components/application/progress-steps/progress-types";
import { BackstageLayout } from "../components/Backstage";
import { EmailListManager, type EmailListValidity } from "../components/EmailListManager";

const steps: ProgressFeaturedIconType[] = [
    {
        title: "Itens",
        description: "Defina a quantidade e tipo de itens",
        status: "complete",
        icon: ShoppingCart01,
    },
    {
        title: "Destinatários",
        description: "Escolha para quem vai enviar",
        status: "current",
        icon: Users01,
    },
    {
        title: "Verificação final",
        description: "Revisão dos destinatários e itens",
        status: "incomplete",
        icon: CheckCircle,
    },
];

interface RouteState {
    itemIds?: string[];
}

export function EmissaoCortesias() {
    const navigate = useNavigate();
    const location = useLocation();
    const incomingItemIds = (location.state as RouteState | null)?.itemIds ?? [];

    const [validity, setValidity] = useState<EmailListValidity>({
        canAdvance: false,
        validEmails: [],
        counts: { all: 0, valid: 0, invalid: 0 },
    });

    const handleValidityChange = useCallback((state: EmailListValidity) => {
        setValidity(state);
    }, []);

    const handleBack = useCallback(() => {
        navigate("/backstage", { state: { itemIds: incomingItemIds } });
    }, [navigate, incomingItemIds]);

    const handleAdvance = useCallback(() => {
        if (!validity.canAdvance) return;
        navigate("/backstage/verificacao", {
            state: {
                itemIds: incomingItemIds,
                emails: validity.validEmails,
            },
        });
    }, [navigate, incomingItemIds, validity]);

    return (
        <BackstageLayout activeSection="cortesias" activeItem="emissao-cortesias">
            <div className="flex min-w-0 flex-1 flex-col">
                <PageHeader
                    canAdvance={validity.canAdvance}
                    onAdvance={handleAdvance}
                    onBack={handleBack}
                />
                <main className="flex flex-1 flex-col items-center gap-8 px-6 py-6">
                    <Progress.IconsWithText
                        items={steps}
                        size="sm"
                        type="icon"
                        orientation="horizontal"
                        className="max-w-[760px] max-md:hidden"
                    />
                    <Progress.IconsWithText
                        items={steps}
                        size="sm"
                        type="icon"
                        orientation="vertical"
                        className="w-full md:hidden"
                    />
                    <section className="flex w-full max-w-[800px] flex-col">
                        <EmailListManager onValidityChange={handleValidityChange} />
                    </section>
                </main>
            </div>
        </BackstageLayout>
    );
}

interface PageHeaderProps {
    canAdvance: boolean;
    onAdvance: () => void;
    onBack: () => void;
}

const PageHeader = ({ canAdvance, onAdvance, onBack }: PageHeaderProps) => (
    <header className="relative flex items-center justify-between gap-3 px-6 py-6">
        <Button size="sm" color="secondary" iconLeading={ArrowLeft} onClick={onBack}>
            Itens
        </Button>
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-display-xs font-bold text-primary">
            Enviar cortesias
        </h1>
        <Button size="md" color="primary" isDisabled={!canAdvance} onClick={onAdvance}>
            Avançar
        </Button>
    </header>
);
