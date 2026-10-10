import { useState, type ReactNode } from "react";
import { ChevronDown, InfoCircle } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
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
    /*
      Aberto por padrão. Fechar de saída esconderia a discriminação das
      cobranças atrás de um clique, e o controle existe para poder recolher
      depois de ler, não para adiar a informação (art. 6º).
    */
    const [detalhes, setDetalhes] = useState(true);
    /*
      Com uma cobrança só, agregado e parcela são o mesmo número: o título
      "Taxas" e o controle não teriam o que somar nem o que abrir, então a
      linha mostra direto o nome da cobrança.
    */
    const varias = taxas.length > 1;

    return (
        <div
            className={cx(
                "flex flex-col gap-3 px-4",
                mobile ? "pt-3 pb-9" : "py-4",
                comoCard ? "rounded-xl bg-primary ring-1 ring-border-secondary" : "border-t border-secondary",
            )}
        >
            {/*
              O agregado é `total.taxa`, o mesmo número que está dentro de
              `total.total`: somar de novo as parcelas aqui abriria caminho para
              a soma divergir do total impresso logo abaixo.

              A taxa de processamento depende do meio de pagamento e só existe no
              SDK, por isso ela fica como nota sob o total, sem número inventado.
            */}
            {taxas.length > 0 && (
                <div className="flex flex-col gap-2">
                    <Linha
                        rotulo={
                            <span className="flex items-center gap-1.5">
                                {varias ? "Taxas" : taxas[0].nome}
                                <button
                                    type="button"
                                    onClick={onAbrirTaxa}
                                    aria-label="Entenda como calculamos os valores"
                                    className="rounded-full text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                                >
                                    <InfoCircle className="size-4" />
                                </button>
                            </span>
                        }
                        valor={brl(total.taxa)}
                    />

                    {varias && (
                        <>
                            <AnimatePresence initial={false}>
                                {detalhes && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="overflow-hidden"
                                    >
                                        <ul className="flex flex-col gap-1">
                                            {taxas.map((t) => (
                                                <li key={t.nome} className="flex items-baseline justify-between gap-3 pl-3">
                                                    <span className="text-sm text-secondary">{t.nome}</span>
                                                    <span className="shrink-0 text-sm text-secondary tabular-nums">{brl(t.valor)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Embaixo do bloco: o controle vem DEPOIS do que ele controla,
                                então a ordem de leitura e a de foco batem com a visual. */}
                            <button
                                type="button"
                                onClick={() => setDetalhes((v) => !v)}
                                aria-expanded={detalhes}
                                className="flex items-center gap-1 self-start text-sm text-tertiary transition duration-100 ease-linear hover:text-secondary"
                            >
                                {detalhes ? "Ocultar detalhes" : "Ver detalhes"}
                                <ChevronDown className={cx("size-4 transition-transform", detalhes && "rotate-180")} />
                            </button>
                        </>
                    )}
                </div>
            )}

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
