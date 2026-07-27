import { cx } from "@/utils/cx";

interface SaoSilvestreLogoProps {
    /** "claro": preto + vermelho, para fundos claros. "escuro": todo branco, para fundos escuros/foto. */
    variante?: "claro" | "escuro";
    className?: string;
}

/** Wordmark "São Silvestre 101" — aproximação tipográfica da marca a partir das referências enviadas. */
export const SaoSilvestreLogo = ({ variante = "claro", className }: SaoSilvestreLogoProps) => {
    const corTexto = variante === "escuro" ? "text-white" : "text-neutral-900";
    const corBase = variante === "escuro" ? "text-white" : "text-[#E30613]";

    return (
        <div className={cx("flex flex-col leading-none", className)}>
            <div className="flex items-baseline gap-1.5">
                <span className={cx("size-2 shrink-0 rounded-full bg-[#E30613]", variante === "escuro" && "bg-white")} aria-hidden="true" />
                <span className={cx("text-xl font-black tracking-tight", corTexto)}>SÃO SILVESTRE</span>
                <span className={cx("text-xl font-black tracking-tight", corBase)}>101</span>
            </div>
            <span className={cx("mt-0.5 pl-3.5 text-[10px] font-semibold tracking-[0.2em]", variante === "escuro" ? "text-white/70" : "text-neutral-500")}>
                SÃO PAULO · BRASIL
            </span>
        </div>
    );
};
