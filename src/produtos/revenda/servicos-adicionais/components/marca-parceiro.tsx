import { cx } from "@/utils/cx";
import type { ServicoId } from "../data/servicos";

/**
 * Selo do parceiro. Placeholder tipográfico: no produto entra o logo oficial
 * fornecido pelo parceiro, no mesmo tamanho.
 */
export function MarcaParceiro({ id, nome, tamanho = "md" }: { id: ServicoId; nome: string; tamanho?: "sm" | "md" }) {
    return (
        <span
            aria-hidden="true"
            className={cx(
                "flex shrink-0 items-center justify-center font-bold tracking-tight",
                tamanho === "md" ? "size-12 rounded-xl text-sm" : "size-10 rounded-lg text-xs",
                id === "uber" && "bg-black text-white",
                id === "meep" && "bg-utility-orange-500 text-white lowercase",
            )}
        >
            {nome}
        </span>
    );
}
