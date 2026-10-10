import type { ReactNode } from "react";
import { InfoCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { brl, type Preco } from "../utils/preco";

/**
 * Barra de total, fonte única nas duas variantes.
 *
 * Antes eram dois markups independentes (um para desktop, uma cópia manual no
 * portal do rodapé mobile) que já tinham divergido. Divergência aqui é
 * divergência de preço em fase de compra, ou seja, art. 7º.
 *
 * Estrutura espelhada no resumo de pagamento: as taxas em linhas de rótulo e
 * valor, e o total separado por régua.
 */

interface BarraTotalProps {
    variante: "desktop" | "mobile";
    total: Preco;
    /** Uma linha por cobrança acessória, com o nome dela. Agregar duas sob um
        rótulo só apagaria justamente a discriminação que o art. 6º pede. */
    taxas: { nome: string; valor: number }[];
    continuarDisabled: boolean;
    rotuloBotao?: string;
    /** Fora de um card (layouts com mapa), a barra vira o próprio card. */
    comoCard?: boolean;
    onAvancar: () => void;
    onAbrirTaxa: () => void;
}

/** Linha rótulo à esquerda, valor à direita. Taxa e total têm o mesmo peso. */
function Linha({ rotulo, valor }: { rotulo: ReactNode; valor: string }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-md font-bold text-primary">{rotulo}</span>
            <span className="shrink-0 text-md font-bold text-primary tabular-nums">{valor}</span>
        </div>
    );
}

export function BarraTotal({ variante, total, taxas, continuarDisabled, rotuloBotao = "Continuar", comoCard, onAvancar, onAbrirTaxa }: BarraTotalProps) {
    const mobile = variante === "mobile";

    return (
        <div
            className={cx(
                "flex flex-col gap-3 px-4",
                mobile ? "pt-3 pb-9" : "py-4",
                comoCard ? "rounded-xl bg-primary ring-1 ring-border-secondary" : "border-t border-secondary",
            )}
        >
            {/*
              Cada cobrança nesta fase tem a sua linha, com o nome que ela tem em
              contrato: ingresso paga taxa de serviço e produto paga licenciamento, em
              alíquotas diferentes. Somar as duas sob um rótulo só devolveria o
              problema que esta barra existe para resolver.

              O "i" fica uma vez, na primeira linha, e abre o painel que explica todas:
              repetir o ícone por linha sugeriria explicações diferentes.

              A taxa de processamento depende do meio de pagamento e só existe no SDK,
              por isso ela fica como nota sob o total, sem número inventado.
            */}
            {taxas.map((t, i) => (
                <Linha
                    key={t.nome}
                    rotulo={
                        <span className="flex items-center gap-1.5">
                            {t.nome}
                            {i === 0 && (
                                <button
                                    type="button"
                                    onClick={onAbrirTaxa}
                                    aria-label="Entenda como calculamos os valores"
                                    className="rounded-full text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                                >
                                    <InfoCircle className="size-4" />
                                </button>
                            )}
                        </span>
                    }
                    valor={brl(t.valor)}
                />
            ))}

            <div className="flex flex-col gap-0.5 border-t border-secondary pt-3">
                <Linha rotulo="Total a pagar" valor={brl(total.total)} />
                {/* Alinhada ao valor, não ao rótulo: ela qualifica o número. */}
                <span className="text-right text-sm text-tertiary">+ taxas do meio de pagamento</span>
            </div>

            <Button size="lg" color="primary" isDisabled={continuarDisabled} onClick={onAvancar} className="w-full">
                {rotuloBotao}
            </Button>
        </div>
    );
}
