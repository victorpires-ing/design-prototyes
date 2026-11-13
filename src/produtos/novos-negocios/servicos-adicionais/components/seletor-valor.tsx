import { Radio as AriaRadio, RadioGroup as AriaRadioGroup, Label as AriaLabel } from "react-aria-components";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { brl, valorFinal, type Servico } from "../data/servicos";
import type { SelecaoValor } from "../utils/use-selecao-valor";

const Prefixo = ({ className }: { className?: string }) => (
    <span className={cx("flex items-center justify-center text-md font-medium", className)} aria-hidden="true">
        R$
    </span>
);

const inteiro = (v: number) => brl(v).replace(",00", "");

/**
 * Valores sugeridos + "Outro valor". Mesmo componente para qualquer serviço:
 * com desconto, cada opção mostra quanto a pessoa paga.
 */
export function SeletorValor({ servico, selecao }: { servico: Servico; selecao: SelecaoValor }) {
    const temDesconto = servico.desconto > 0;

    const opcao = (selecionada: boolean, extra?: string) =>
        cx(
            "relative flex min-h-[104px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-primary px-1 py-3 text-center outline-focus-ring transition duration-100 ease-linear ring-inset",
            selecionada ? "ring-2 ring-fg-brand-primary" : "ring-1 ring-secondary hover:bg-primary_hover",
            extra,
        );

    return (
        <div className="flex flex-col gap-4">
            <AriaRadioGroup
                aria-label={servico.pergunta}
                orientation="horizontal"
                value={selecao.opcao == null ? null : String(selecao.opcao)}
                onChange={(v) => selecao.setOpcao(v === "outro" ? "outro" : Number(v))}
                className="flex flex-col gap-4"
            >
                <AriaLabel className="text-lg font-semibold text-primary">{servico.pergunta}</AriaLabel>
                <div className="grid grid-cols-3 gap-2">
                    {servico.valores.map((v) => (
                        <AriaRadio
                            key={v}
                            value={String(v)}
                            className={({ isSelected, isFocusVisible }) => opcao(isSelected, isFocusVisible ? "outline-2 outline-offset-2" : "")}
                        >
                            {({ isSelected }) => (
                                <>
                                    <span
                                        className={cx(
                                            servico.pacotes ? "text-md leading-tight font-bold sm:text-lg" : "text-lg font-bold tabular-nums sm:text-xl lg:text-display-xs",
                                            isSelected ? "text-brand-secondary" : "text-primary",
                                        )}
                                    >
                                        {servico.pacotes?.[v] ?? inteiro(v)}
                                    </span>
                                    {/* Pacote (fotos, seguro): nome em destaque e o preço embaixo */}
                                    {servico.pacotes ? (
                                        <span className="text-xs whitespace-nowrap text-tertiary tabular-nums sm:text-sm lg:text-md">{brl(v)}</span>
                                    ) : (
                                        temDesconto && (
                                            <span className="text-xs whitespace-nowrap text-tertiary tabular-nums sm:text-sm lg:text-md">por {brl(valorFinal(servico, v))}</span>
                                        )
                                    )}
                                </>
                            )}
                        </AriaRadio>
                    ))}
                    {/* "Outro valor" em largura total, abaixo dos valores sugeridos. Escolhido, dá lugar ao
                        campo (logo abaixo, no mesmo lugar); tocar num valor sugerido traz o botão de volta */}
                    {servico.outroValor && selecao.opcao !== "outro" && (
                        <AriaRadio
                            value="outro"
                            className={({ isSelected, isFocusVisible }) =>
                                opcao(isSelected, cx("col-span-3 min-h-12 py-2", isFocusVisible && "outline-2 outline-offset-2"))
                            }
                        >
                            {({ isSelected }) => (
                                <span className={cx("text-sm font-semibold", isSelected ? "text-brand-secondary" : "text-secondary")}>Outro valor</span>
                            )}
                        </AriaRadio>
                    )}
                </div>
            </AriaRadioGroup>

            {/* Sem valor escolhido ao tentar contratar */}
            {selecao.opcao == null && selecao.erroVisivel && <p className="-mt-2 text-sm text-error-primary">{selecao.erroVisivel}</p>}

            {selecao.opcao === "outro" && (
                // Ocupa o lugar do botão "Outro valor"; autoFocus leva o cursor direto para o campo.
                // O CTA principal só habilita com um valor válido digitado
                <Input
                    autoFocus
                    size="lg"
                    icon={Prefixo}
                    inputMode="numeric"
                    placeholder={temDesconto ? "Digite o valor do crédito" : "Digite o valor da recarga"}
                    value={selecao.outro}
                    onChange={selecao.setOutro}
                    onBlur={selecao.marcarTocado}
                    isInvalid={!!selecao.erroVisivel}
                    // Sem desconto (recarga, ex.: Meep) não há legenda embaixo do campo; só o erro, se houver.
                    // Com desconto (crédito Uber) mostra a faixa e, com valor válido, quanto a pessoa paga
                    hint={
                        selecao.erroVisivel ??
                        (!temDesconto
                            ? undefined
                            : selecao.valor != null
                              ? `Você paga ${brl(valorFinal(servico, selecao.valor))} com ${Math.round(servico.desconto * 100)}% de desconto.`
                              : `De ${brl(servico.minimo)} a ${brl(servico.maximo)}.`)
                    }
                />
            )}
        </div>
    );
}
