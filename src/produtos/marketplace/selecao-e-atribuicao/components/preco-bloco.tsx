import type { ReactNode } from "react";
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
 * Composição do valor: ingresso e taxa, inline.
 *
 * Teste com usuário mostrou que o valor somado sozinho deixa dúvida ("já
 * inclui a taxa?") e que a face sozinha obriga a conta — por isso os dois
 * aparecem. Mas a linha inteira é de peso normal: com a face em negrito, cada
 * item tinha DOIS números fortes e o olho não sabia qual era o que decide. A
 * parcela precisa estar discriminada e legível (art. 6º); destacada é o total
 * (art. 7º), e só ele.
 */
export function PrecoLinha({ preco, className }: { preco: Preco; className?: string }) {
    return (
        <span className={cx("flex flex-wrap items-baseline gap-x-1.5", className)} aria-label={ariaPreco(preco)}>
            <span aria-hidden="true" className="text-sm text-tertiary tabular-nums">
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
 * Faixa de valor de uma linha larga (ingresso, passaporte): composição à
 * esquerda, total colado no seletor à direita.
 *
 * O total encosta no controle porque é o número da decisão, e o controle é
 * onde a decisão acontece. Empilhado, os dois ficavam em cantos opostos do
 * bloco e a pessoa subia e descia o olho a cada clique no "+".
 *
 * Abaixo de `sm` o par total+seletor toma a linha inteira e se abre: total na
 * borda esquerda, seletor na direita. Assim nome, lote, total e composição
 * compartilham UMA borda esquerda e o seletor tem um único eixo à direita.
 * Com o par empurrado para a direita, a segunda linha começava no meio do card
 * e o olho fazia ziguezague a cada item da lista.
 *
 * E ali o total sobe: o número que decide vem primeiro, com a composição como
 * detalhe logo abaixo dele. A inversão é `order`, que move o pixel e não o DOM,
 * mas aqui isso não custa nada — são dois textos vizinhos, cada um com o seu
 * `aria-label`, e "composição e depois total" continua uma sequência correta
 * de ouvir. O único elemento focável, o seletor, não muda de lugar na ordem.
 */
export function PrecoFaixa({ preco, children, className }: { preco: Preco; children?: ReactNode; className?: string }) {
    return (
        <div className={cx("flex flex-wrap items-center justify-between gap-x-4 gap-y-1", className)}>
            <PrecoLinha preco={preco} className="order-2 sm:order-none" />
            <div className="order-1 flex w-full items-center justify-between gap-3 sm:order-none sm:ml-auto sm:w-auto sm:shrink-0 sm:justify-end">
                <TotalLinha preco={preco} />
                {children}
            </div>
        </div>
    );
}

/**
 * O par empilhado, para cartões estreitos (produto), onde a faixa horizontal
 * não cabe. Mesma ordem de leitura da faixa: composição e depois total.
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
 * Total do item, com o rótulo "total" em caixa baixa antes do número.
 *
 * O rótulo voltou junto com a faixa horizontal: dois valores lado a lado na
 * mesma linha, sem nada que os distinga, são dois números soltos. Empilhado a
 * posição bastava; em linha, não basta.
 */
export function TotalLinha({ preco, className }: { preco: Preco; className?: string }) {
    return (
        <span className={cx("flex items-baseline gap-1", className)} aria-label={`Total ${brl(preco.total)}`}>
            <span aria-hidden="true" className="text-sm text-tertiary">
                total
            </span>
            <span aria-hidden="true" className="text-md font-bold text-primary tabular-nums">
                {brl(preco.total)}
            </span>
        </span>
    );
}
