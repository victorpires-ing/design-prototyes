import type { FC, ReactNode } from "react";
import { useNavigate } from "react-router";
import { Building03, Calendar, ChevronLeftDouble, CurrencyDollar, LogOut02, Settings01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

export type ItemCashout = "produtoras" | "eventos" | "inputs" | "painel";

interface ItemNav {
    id: ItemCashout;
    label: string;
    icon: FC<{ className?: string }>;
    /** Itens sem rota ficam inertes — não foram desenhados neste refinamento. */
    to?: string;
}

const NAV: ItemNav[] = [
    { id: "produtoras", label: "Produtoras", icon: Building03, to: "/payout/contrato-quick-win-finance/produtoras" },
    { id: "eventos", label: "Eventos", icon: Calendar, to: "/payout/contrato-quick-win-finance" },
    { id: "inputs", label: "Inputs", icon: CurrencyDollar },
    { id: "painel", label: "Painel de Controle", icon: Settings01 },
];

/**
 * Shell do painel administrativo Cashout: sidebar fixa à esquerda com a
 * navegação do produto. Compartilhado entre os projetos do PayOut.
 */
export function CashoutShell({ children, itemAtivo }: { children: ReactNode; itemAtivo: ItemCashout }) {
    const navigate = useNavigate();

    return (
        <div className="flex min-h-screen bg-secondary">
            <nav
                aria-label="Cashout"
                className="sticky top-0 flex h-screen w-[238px] shrink-0 flex-col gap-1 border-r border-secondary bg-primary px-3.5 py-4.5"
            >
                <div className="flex w-full items-center justify-between pb-5 pl-1">
                    <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2.5 text-left" aria-label="Voltar para os produtos">
                        <span className="flex shrink-0 items-center rounded-lg bg-brand-solid p-[7px] text-white">
                            <CurrencyDollar className="size-[17px]" aria-hidden="true" />
                        </span>
                        <span className="flex flex-col">
                            <span className="text-sm font-semibold text-primary">Cashout</span>
                            <span className="text-[10px] text-placeholder">Admin Panel</span>
                        </span>
                    </button>
                    <ChevronLeftDouble className="size-[15px] shrink-0 text-quaternary" aria-hidden="true" />
                </div>

                {NAV.map((item) => {
                    const ativo = itemAtivo === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={item.to ? () => navigate(item.to!) : undefined}
                            aria-current={ativo ? "page" : undefined}
                            className={cx(
                                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[13px] transition duration-100 ease-linear",
                                ativo ? "bg-brand-secondary font-semibold text-brand-secondary" : "font-medium text-secondary hover:bg-primary_hover",
                                !item.to && "cursor-default",
                            )}
                        >
                            <item.icon className="size-4 shrink-0" aria-hidden="true" />
                            <span className="min-w-0 flex-1">{item.label}</span>
                        </button>
                    );
                })}

                <div className="flex-1" />

                <div className="h-px w-full bg-utility-brand-100" />

                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="flex w-full items-center gap-2.5 py-2 pl-2.5 text-left text-[13px] font-medium text-secondary transition duration-100 ease-linear hover:text-primary"
                >
                    <LogOut02 className="size-4 shrink-0" aria-hidden="true" />
                    Sair
                </button>
            </nav>

            <main className="flex min-w-0 flex-1 flex-col gap-4 p-4">{children}</main>
        </div>
    );
}
