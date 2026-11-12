import { cx } from "@/utils/cx";
import { brl, r2, TAXA, type Lote, type Valores } from "../data/troca-store";

interface QuadroCobrancaProps {
    nomeAtual: string;
    pago: number;
    taxa: number;
    lote: Lote;
    f: Valores;
    titulo?: string;
    rotuloTotal?: string;
}

/** Detalhe do dinheiro da troca: já pago, novo valor, diferenças, taxa de troca e total. */
export function QuadroCobranca({ nomeAtual, pago, taxa, lote, f, titulo, rotuloTotal = "Total a cobrar na troca" }: QuadroCobrancaProps) {
    const linhas: [string, string][] = [
        [`Valor já pago, ${nomeAtual}`, `${brl(pago)} e taxa de ${brl(taxa)}`],
        [`Valor da nova inscrição, ${lote.nome}`, `${brl(lote.valor)} e taxa de ${brl(r2(lote.valor * TAXA))}`],
        ["Diferença da inscrição", f.dif < 0 ? `menos ${brl(-f.dif)} (não devolvida)` : brl(f.dif)],
        ["Diferença da taxa de serviço", brl(f.dt)],
        ["Taxa de troca", brl(f.tt)],
    ];
    return (
        <div className="flex animate-in flex-col rounded-lg bg-secondary p-4 duration-200 fade-in" aria-label={titulo ?? "Detalhes da cobrança"}>
            {titulo && <h3 className="mb-2 text-md font-semibold text-primary">{titulo}</h3>}
            {linhas.map(([a, b]) => (
                <Linha key={a} rotulo={a} valor={b} />
            ))}
            <Linha rotulo={rotuloTotal} valor={brl(f.total)} total />
        </div>
    );
}

export function Linha({ rotulo, valor, total }: { rotulo: string; valor: string; total?: boolean }) {
    return (
        <div className={cx("flex items-baseline justify-between gap-4 py-1.5 text-sm", total ? "mt-1 border-t border-secondary pt-3 font-semibold text-primary" : "text-tertiary")}>
            <span>{rotulo}</span>
            <span className={cx("text-right", total ? "text-md" : "text-secondary")}>{valor}</span>
        </div>
    );
}
