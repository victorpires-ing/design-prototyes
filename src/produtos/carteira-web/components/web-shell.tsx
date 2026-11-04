import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { cx } from "@/utils/cx";
import { useViewport } from "../data/viewport";
import { ControlesPrototipo } from "./controles-prototipo";
import { SiteHeader } from "./site-header";
import { useForceLightTheme } from "./use-force-light-theme";
import { useMarcaIngresse } from "./use-marca-ingresse";
import { WebToast } from "./WebToast";

/**
 * Casco das páginas da Carteira Web: header do site, controles flutuantes do protótipo e,
 * no modo Mobile, o frame do celular (o conteúdo recebe `compact` para se adaptar).
 */
export function WebShell({ children, semConta = false }: { children: (compact: boolean) => ReactNode; semConta?: boolean }) {
    useForceLightTheme();
    useMarcaIngresse();
    const navigate = useNavigate();
    const [viewport] = useViewport();
    const mobile = viewport === "mobile";

    return (
        <div className={cx("min-h-screen", mobile ? "bg-secondary" : "bg-secondary")}>
            <ControlesPrototipo voltar={{ label: "Produtos", onClick: () => navigate("/") }} />
            {!mobile && <SiteHeader semConta={semConta} />}

            <div className={cx(mobile && "py-10 sm:px-4")}>
                <div
                    className={cx(
                        "mx-auto",
                        mobile
                            ? "relative flex h-[calc(100dvh-5rem)] w-full flex-col overflow-hidden bg-secondary sm:h-[820px] sm:max-h-[85vh] sm:w-[390px] sm:max-w-full sm:rounded-3xl sm:shadow-xl sm:ring-1 sm:ring-border-secondary"
                            : "w-full",
                    )}
                >
                    {mobile && <SiteHeader compact semConta={semConta} />}
                    {children(mobile)}
                    <WebToast ancora={mobile ? "frame" : "janela"} />
                </div>
            </div>
        </div>
    );
}
