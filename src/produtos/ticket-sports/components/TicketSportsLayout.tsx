import type { ReactNode } from "react";
import { cx } from "@/utils/cx";
import { useForceLightTheme } from "./use-light-theme";

interface TicketSportsLayoutProps {
    children: ReactNode;
    /**
     * Altura fixa do viewport com rolagem interna — usar nas telas com tab bar
     * para que o rodapé fique fixo. Default: false (a página rola normalmente).
     */
    fullHeight?: boolean;
}

/**
 * Shell mobile do produto Ticket Sports: moldura centralizada (phone-width),
 * fundo branco e tema light forçado. As telas controlam o próprio conteúdo
 * (cabeçalho, stepper, botão fixo no rodapé).
 */
export function TicketSportsLayout({ children, fullHeight = false }: TicketSportsLayoutProps) {
    useForceLightTheme();
    return (
        <div className="flex min-h-dvh justify-center bg-secondary md:py-6">
            <style>{`
@keyframes hubRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.hub-rise>*{animation:hubRise .45s cubic-bezier(.22,1,.36,1) both}
.hub-rise>*:nth-child(1){animation-delay:.03s}
.hub-rise>*:nth-child(2){animation-delay:.08s}
.hub-rise>*:nth-child(3){animation-delay:.13s}
.hub-rise>*:nth-child(4){animation-delay:.18s}
.hub-rise>*:nth-child(5){animation-delay:.23s}
.hub-rise>*:nth-child(6){animation-delay:.28s}
.hub-rise>*:nth-child(7){animation-delay:.33s}
.hub-rise>*:nth-child(8){animation-delay:.38s}
.hub-rise>*:nth-child(n+9){animation-delay:.42s}
@media (prefers-reduced-motion:reduce){.hub-rise>*{animation:none}}
`}</style>
            <div
                className={cx(
                    "relative flex w-full max-w-md flex-col bg-primary md:rounded-3xl md:shadow-xl md:ring-1 md:ring-border-secondary",
                    fullHeight
                        ? "h-dvh overflow-hidden md:h-[calc(100vh-3rem)]"
                        : "min-h-dvh md:min-h-[calc(100vh-3rem)]",
                )}
            >
                {children}
            </div>
        </div>
    );
}
