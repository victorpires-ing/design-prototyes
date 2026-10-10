import { cx } from "@/utils/cx";
import { ariaPreco, brl, legendaTaxa, multiplicar, nomeDaTaxa, type Preco } from "../utils/preco";

/**
 * A única forma de renderizar dinheiro para o consumidor.
 *
 * O número dominante é o valor do ingresso e, colada a ele, a taxa de serviço
 * nomeada entre parênteses. A soma das duas parcelas aparece uma vez por
 * pedido, na barra de total, em vez de repetida em cada linha do resumo.
 */

/**
 * Três degraus de verdade. Antes o valor era `text-md` (16px) contra metadados
 * de 14px: 2px de diferença não cria hierarquia, cria parede de texto.
 */
const TAMANHOS = {
    /** Linha do resumo: ali o destaque é do total, não de cada item. */
    sm: "text-sm font-semibold text-primary tabular-nums",
    md: "text-lg font-bold text-primary tabular-nums",
    lg: "text-xl font-bold text-primary tabular-nums",
    xl: "text-display-xs font-bold text-primary tabular-nums",
} as const;

interface PrecoBlocoProps {
    /** Preço unitário. A multiplicação por `qtd` acontece aqui, nunca no chamador. */
    preco: Preco;
    qtd?: number;
    tamanho?: keyof typeof TAMANHOS;
    /** Rótulo acima do valor, ex.: "Total do combo". */
    rotulo?: string;
    /** Qualificador antes do número, ex.: "A partir de". Nunca depois. */
    prefixo?: string;
    /** No resumo a taxa é somada numa linha única, então a linha do item não a repete. */
    mostrarTaxa?: boolean;
    className?: string;
}

export function PrecoBloco({ preco, qtd = 1, tamanho = "md", rotulo, prefixo, mostrarTaxa = true, className }: PrecoBlocoProps) {
    const valor = multiplicar(preco, qtd);
    const composicao = mostrarTaxa ? legendaTaxa(valor) : null;

    return (
        <div className={cx("flex flex-col gap-0.5", className)}>
            {rotulo && <span className="text-sm font-medium text-tertiary">{rotulo}</span>}
            <span aria-label={`${prefixo ? `${prefixo} ` : ""}${ariaPreco(preco, qtd, mostrarTaxa)}`}>
                <span aria-hidden="true" className="flex flex-wrap items-baseline gap-x-1.5">
                    {prefixo && <span className="text-sm text-tertiary">{prefixo}</span>}
                    <span className={TAMANHOS[tamanho]}>{brl(valor.face)}</span>
                </span>
            </span>
            {composicao && (
                <span aria-hidden="true" className="text-sm text-quaternary tabular-nums">
                    {composicao}
                </span>
            )}
        </div>
    );
}

/**
 * Forma de linha, validada em teste com usuário: valor do ingresso, a taxa
 * inline logo depois e o total colado na ação.
 *
 * O teste mostrou que o valor somado sozinho deixa dúvida ("já inclui a taxa?")
 * e que a face sozinha obriga a conta. Os três números juntos resolvem os dois,
 * e o total fica perto do botão, que é onde a decisão acontece.
 */
export function PrecoLinha({ preco, className }: { preco: Preco; className?: string }) {
    return (
        <span className={cx("flex flex-wrap items-baseline gap-x-1.5", className)} aria-label={ariaPreco(preco)}>
            <span aria-hidden="true" className="text-sm font-semibold text-primary tabular-nums">
                {brl(preco.face)}
            </span>
            {preco.taxa > 0 && (
                <span aria-hidden="true" className="text-sm text-tertiary tabular-nums">
                    + {brl(preco.taxa)} de {nomeDaTaxa(preco).toLowerCase()}
                </span>
            )}
        </span>
    );
}

/**
 * O par de valores de um item: composição em cima, total embaixo.
 *
 * O total é a ÚLTIMA linha porque é a que encosta no seletor de quantidade.
 * Com ele no topo, o número da decisão e o controle da decisão ficavam em
 * cantos opostos do bloco, e a pessoa tinha de subir e descer o olho a cada
 * clique no "+".
 *
 * Existe como componente, e não como duas linhas copiadas em cada card, porque
 * ingresso, passaporte e produto têm de apresentar valor da mesma forma: duas
 * cópias são duas chances de divergir, e divergir aqui é divergir de preço.
 */
export function PrecoPar({ preco, className }: { preco: Preco; className?: string }) {
    return (
        <div className={cx("flex min-w-0 flex-col gap-0.5", className)}>
            <PrecoLinha preco={preco} />
            <TotalLinha preco={preco} />
        </div>
    );
}

/**
 * Total da linha. Sem rótulo visível, mas o leitor de tela continua recebendo
 * "Total": sozinho, o número não diz de que ele é, e logo abaixo há outro.
 */
export function TotalLinha({ preco, className }: { preco: Preco; className?: string }) {
    return (
        <span className={cx("block", className)} aria-label={`Total ${brl(preco.total)}`}>
            <span aria-hidden="true" className="text-md font-bold text-primary tabular-nums">
                {brl(preco.total)}
            </span>
        </span>
    );
}
