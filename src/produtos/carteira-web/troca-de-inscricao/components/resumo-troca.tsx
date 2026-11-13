import { cx } from "@/utils/cx";
import { TAXA, r2, type Lote, type Valores } from "../data/troca-store";
import { brlc } from "./carteira-ui";


/** Valores da troca na carteira, com os mesmos rótulos do Backstage e do e-mail. */
export function ResumoTroca({ pago, taxa, lote, f }: { pago: number; taxa: number; lote: Lote; f: Valores }) {
    const linhas: [string, string][] = [
        ["Valor já pago", `${brlc(pago)} e taxa de ${brlc(taxa)}`],
        [`Nova inscrição, ${lote.nome}`, `${brlc(lote.valor)} e taxa de ${brlc(r2(lote.valor * TAXA))}`],
        ["Diferença da inscrição", f.dif < 0 ? `menos ${brlc(-f.dif)}` : brlc(f.dif)],
        ["Diferença da taxa de serviço", brlc(f.dt)],
        ["Taxa de troca", brlc(f.tt)],
    ];
    return (
        <div className="flex flex-col">
            {[...linhas, ["Total a pagar", brlc(f.total)] as [string, string]].map(([a, b], i) => {
                const total = i === linhas.length;
                return (
                    <div key={a} className={cx("flex items-baseline justify-between gap-4 py-1.5 text-sm", total ? "mt-1 border-t border-secondary pt-3 text-md font-semibold text-primary" : "text-tertiary")}>
                        <span>{a}</span>
                        <span className={cx("text-right", !total && "text-secondary")}>{b}</span>
                    </div>
                );
            })}
        </div>
    );
}
