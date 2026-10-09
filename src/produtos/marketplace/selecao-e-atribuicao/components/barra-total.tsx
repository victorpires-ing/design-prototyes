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
 * O razonete saiu: detalhamento linha a linha é assunto do checkout. A taxa de
 * serviço continua discriminada sem nenhum clique, na linha de cada item do
 * catálogo e do resumo; o que não existe mais é a soma dela aqui.
 */

interface BarraTotalProps {
    variante: "desktop" | "mobile";
    total: Preco;
    continuarDisabled: boolean;
    rotuloBotao?: string;
    /** Fora de um card (layouts com mapa), a barra vira o próprio card. */
    comoCard?: boolean;
    onAvancar: () => void;
}

export function BarraTotal({ variante, total, continuarDisabled, rotuloBotao = "Continuar", comoCard, onAvancar }: BarraTotalProps) {
    const mobile = variante === "mobile";

    return (
        <div
            className={cx(
                // Container query, não breakpoint de tela: a mesma barra vive num painel
                // de 640px e num resumo lateral de 360px, onde botão e valor não cabem
                // lado a lado.
                "@container flex flex-col px-4",
                mobile ? "pt-3 pb-9" : "py-4",
                comoCard ? "rounded-xl bg-primary ring-1 ring-border-secondary" : "border-t border-secondary",
            )}
        >
            <div className="flex flex-col gap-3 @md:flex-row @md:items-end @md:justify-between">
                <div className="flex min-w-0 flex-col gap-0.5">
                    {/*
                      Sem rótulo visível, mas o leitor de tela continua recebendo "Total a
                      pagar": sozinho, o número não diz de que ele é.

                      A taxa de serviço segue discriminada em cada linha do catálogo e do
                      resumo; o que saiu daqui foi a soma dela. E o acréscimo do meio de
                      pagamento aparece sem valor porque só é conhecido no SDK.
                    */}
                    <span aria-label={`Total a pagar ${brl(total.total)}`} className="text-display-xs font-bold text-primary tabular-nums">
                        {brl(total.total)}
                    </span>
                    <span className="text-sm text-tertiary">+ taxas do meio de pagamento</span>
                </div>
                <Button size="lg" color="primary" isDisabled={continuarDisabled} onClick={onAvancar} className="w-full @md:w-auto">
                    {rotuloBotao}
                </Button>
            </div>
        </div>
    );
}
