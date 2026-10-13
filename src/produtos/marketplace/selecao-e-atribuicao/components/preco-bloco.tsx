import type { ReactNode } from "react";
import { cx } from "@/utils/cx";
import { ariaPreco, brl, legendaTaxa, multiplicar, nomeDaTaxaCurto, type Preco } from "../utils/preco";

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
    /*
      A parcela da taxa é um bloco indivisível. No celular a linha não cabe em
      199px por uns poucos pixels, e deixada à própria sorte ela quebrava no
      último espaço, largando "serviço" sozinho na segunda linha. Presa, a
      quebra cai entre a face e a taxa, que é onde o sentido se divide.
    */
    return (
        <span className={cx("block text-sm text-tertiary tabular-nums", className)} aria-label={ariaPreco(preco)}>
            <span aria-hidden="true">{brl(preco.face)}</span>
            {preco.taxa > 0 && (
                <>
                    {" "}
                    <span aria-hidden="true" className="whitespace-nowrap">
                        + {brl(preco.taxa)} {nomeDaTaxaCurto(preco)}
                    </span>
                </>
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
 * Valores e seletor no MESMO container, um só em todos os tamanhos.
 *
 * No celular são duas linhas. Em cima a composição, com a largura inteira do
 * card — que é o que a faz caber numa linha só, em vez de quebrar por uns
 * poucos pixels disputando espaço com o seletor. Embaixo o que decide: total
 * na esquerda e seletor na direita, nas pontas da mesma linha.
 *
 * De `sm` para cima tudo volta para uma linha: composição à esquerda, total
 * empurrado para a direita e o seletor logo depois dele.
 *
 * Sem `order` em lugar nenhum: a ordem visual é a do DOM nos dois tamanhos,
 * então teclado e leitor de tela recebem exatamente o que está na tela.
 */
export function PrecoFaixa({
    preco,
    rotulo,
    children,
    className,
}: {
    preco: Preco;
    /** Substitui "total", ex.: "a partir de" em combo com opcional pago. */
    rotulo?: string;
    children?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cx("flex min-w-0 flex-col gap-y-1 sm:flex-row sm:items-center sm:gap-4", className)}>
            <PrecoLinha preco={preco} />
            <div className="flex w-full items-center justify-between gap-3 sm:ml-auto sm:w-auto sm:shrink-0 sm:justify-end sm:gap-4">
                <TotalLinha preco={preco} rotulo={rotulo} />
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
 * Total do item. Sem rótulo visível: o número é o mais pesado do bloco e a
 * composição logo ao lado já se explica sozinha.
 *
 * O leitor de tela continua recebendo "Total", porque ali não existe peso nem
 * posição — sem a palavra seriam dois valores lidos em sequência, e quem ouve
 * não teria como saber qual é qual.
 *
 * `rotulo` só entra quando o número NÃO é o total: em combo cujo opcional pago
 * ainda pode subi-lo, ele vira "a partir de", porque anunciar aquele valor
 * como final seria subdeclaração.
 */
export function TotalLinha({ preco, rotulo, className }: { preco: Preco; rotulo?: string; className?: string }) {
    return (
        <span className={cx("flex items-baseline gap-1", className)} aria-label={`${rotulo ?? "Total"} ${brl(preco.total)}`}>
            {/* `nowrap`: "a partir de" são três palavras e empilhava ao lado do número. */}
            {rotulo && (
                <span aria-hidden="true" className="text-sm whitespace-nowrap text-tertiary">
                    {rotulo}
                </span>
            )}
            <span aria-hidden="true" className="text-md font-bold text-primary tabular-nums">
                {brl(preco.total)}
            </span>
        </span>
    );
}
