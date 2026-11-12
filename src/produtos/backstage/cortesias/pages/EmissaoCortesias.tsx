import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, ShoppingCart01, Users01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressFeaturedIconType } from "@/components/application/progress-steps/progress-types";
import { useRotaDoPainel } from "../../components/painel";
import { BackstageLayout } from "../../components/Backstage";
import { EmailListManager, type EmailListValidity } from "../components/EmailListManager";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";
import { cx } from "@/utils/cx";

const steps: ProgressFeaturedIconType[] = [
    {
        title: "Itens",
        description: "Escolha quais ingressos deseja enviar",
        status: "complete",
        icon: ShoppingCart01,
    },
    {
        title: "Destinatários",
        description: "Informe quem vai receber os itens",
        status: "current",
        icon: Users01,
    },
    {
        title: "Verificação final",
        description: "Confirme se está tudo certo e envie!",
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
    const rota = useRotaDoPainel();
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
        navigate(rota("/backstage/itens"), { state: { itemIds: incomingItemIds } });
    }, [navigate, incomingItemIds, rota]);

    const handleAdvance = useCallback(() => {
        if (!validity.canAdvance) return;
        navigate(rota("/backstage/verificacao"), {
            state: {
                itemIds: incomingItemIds,
                emails: validity.validEmails,
            },
        });
    }, [navigate, incomingItemIds, validity, rota]);

    return (
        <BackstageLayout activeSection="cortesias" activeItem="emissao-cortesias">
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <PageHeader
                    canAdvance={validity.canAdvance}
                    onAdvance={handleAdvance}
                    onBack={handleBack}
                />
                <main className="flex flex-1 flex-col items-center gap-8">
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
    <header className="relative flex items-center justify-between gap-3 max-md:flex-wrap">
        <Button size="sm" color="secondary" iconLeading={ArrowLeft} onClick={onBack}>
            Itens
        </Button>
        <h1 className={cx(TITULO_PAGINA, "pointer-events-none md:absolute md:left-1/2 md:-translate-x-1/2 md:whitespace-nowrap max-md:order-last max-md:w-full")}>
            Enviar cortesias
        </h1>
        <Button size="md" color="primary" isDisabled={!canAdvance} onClick={onAdvance}>
            Avançar
        </Button>
    </header>
);
