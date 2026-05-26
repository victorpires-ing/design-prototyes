import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, HomeLine } from "@untitledui/icons";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { Button } from "@/components/base/buttons/button";

interface RelatorioPageHeaderProps {
    title: string;
    actions?: ReactNode;
}

export const RelatorioPageHeader = ({ title, actions }: RelatorioPageHeaderProps) => {
    const navigate = useNavigate();
    return (
        <div className="relative flex flex-col gap-4">
            <div className="max-lg:hidden">
                <Breadcrumbs type="button">
                    <Breadcrumbs.Item href="/" icon={HomeLine} />
                    <Breadcrumbs.Item href="/backstage/relatorios/vendas-por-grupo">
                        Relatórios
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item>{title}</Breadcrumbs.Item>
                </Breadcrumbs>
            </div>
            <div className="flex lg:hidden">
                <Button
                    color="link-gray"
                    size="xs"
                    iconLeading={ArrowLeft}
                    onClick={() => navigate(-1)}
                >
                    Voltar
                </Button>
            </div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <p className="text-xl font-semibold text-primary">{title}</p>
                {actions && <div className="flex items-start gap-3">{actions}</div>}
            </div>
        </div>
    );
};
