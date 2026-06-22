import { cx } from "@/utils/cx";

/** Logo oficial da Ingresse (mesmo asset usado no marketplace). */
export const INGRESSE_LOGO = "https://auth.prod.ingresse.com/resources/2ibrw/login/custom/img/ingresse-light.svg";

/**
 * Barra de marca no topo: logo da Ingresse + logo parceira opcional ao lado
 * (igual ao cadastro do marketplace). Deixa claro que é uma pesquisa da Ingresse.
 */
export function LogoTopo({ logoParceira, fixo = true }: { logoParceira?: string; fixo?: boolean }) {
    return (
        <div className={cx("flex justify-center bg-primary-solid py-3", fixo && "fixed inset-x-0 top-0 z-[10000]")}>
            <div className="flex items-center gap-4">
                <img src={INGRESSE_LOGO} alt="Ingresse" className="h-6 w-auto" />
                {logoParceira && (
                    <>
                        <span aria-hidden="true" className="h-6 w-px bg-white/25" />
                        <img src={logoParceira} alt="" className="h-6 w-auto object-contain" />
                    </>
                )}
            </div>
        </div>
    );
}

/** Renderiza HTML de rich text com estilos de prosa (negrito, listas, links, quebras). */
export function RichTextView({ html, className }: { html: string; className?: string }) {
    return (
        <div
            className={cx(
                "[&_a]:underline [&_b]:font-semibold [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5",
                // Quebras de linha: parágrafos vazios viram linha em branco; espaço entre blocos.
                "[&_p]:min-h-[1em] [&_p:not(:first-child)]:mt-2",
                className,
            )}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
