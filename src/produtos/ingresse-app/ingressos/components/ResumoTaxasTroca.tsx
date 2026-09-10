import { useState } from "react";
import { ChevronDown, InfoCircle, XClose } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { TAXAS_TOTAL, TAXA_PROCESSAMENTO, TAXA_SERVICO, brl } from "../data/upgrade";

const EXPLICACOES = [
    {
        titulo: "Taxa de serviço",
        desc: "Responsável por viabilizar a operação da plataforma, incluindo tecnologia, atendimento e segurança da compra.",
    },
    {
        titulo: "Taxa de processamento",
        desc: "Referente ao processamento do pagamento e às integrações necessárias para concluir a transação com segurança.",
    },
    {
        titulo: "Juros de parcelamento",
        desc: "Valor aplicado pela operadora financeira em compras parceladas, conforme a forma de pagamento escolhida.",
    },
    {
        titulo: "Desconto",
        desc: "Os descontos são aplicados exclusivamente ao valor dos itens, sem incidência nas taxas.",
    },
];

/** Resumo dos valores da troca: diferença + taxas (com detalhamento) + total a pagar. */
export function ResumoTaxasTroca({ diferenca, labelDiferenca = "Valor da diferença" }: { diferenca: number; labelDiferenca?: string }) {
    const [detalhes, setDetalhes] = useState(false);
    const [entenda, setEntenda] = useState(false);
    const total = diferenca + TAXAS_TOTAL;

    return (
        <>
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-tertiary">{labelDiferenca}</span>
                    <span className="font-semibold text-primary tabular-nums">{brl(diferenca)}</span>
                </div>

                {/* Taxas (com detalhamento) */}
                <div className="border-t border-secondary pt-3">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
                            Taxas
                            <button
                                type="button"
                                aria-label="Entenda como calculamos os valores"
                                onClick={() => setEntenda(true)}
                                className="text-fg-quaternary transition duration-100 ease-linear active:text-fg-secondary"
                            >
                                <InfoCircle className="size-4" />
                            </button>
                        </span>
                        <span className="text-sm font-semibold text-primary tabular-nums">{brl(TAXAS_TOTAL)}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setDetalhes((v) => !v)}
                        className="mt-1 flex items-center gap-1 text-sm font-medium text-secondary transition duration-100 ease-linear active:text-primary"
                    >
                        {detalhes ? "Ocultar detalhes" : "Ver detalhes"}
                        <ChevronDown className={cx("size-4 transition-transform duration-200", detalhes && "rotate-180")} />
                    </button>
                    {detalhes && (
                        <div className="mt-2 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-sm text-tertiary">
                                <span>Taxa de serviço</span>
                                <span className="tabular-nums">{brl(TAXA_SERVICO)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-tertiary">
                                <span>Taxa de processamento</span>
                                <span className="tabular-nums">{brl(TAXA_PROCESSAMENTO)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-secondary pt-3">
                    <span className="text-md font-bold text-primary">Total a pagar</span>
                    <span className="text-md font-bold text-primary tabular-nums">{brl(total)}</span>
                </div>
            </div>

            {entenda && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 p-5"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setEntenda(false)}
                >
                    <div
                        className="flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary"
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3 p-5 pb-3">
                            <h2 className="text-lg font-bold text-primary">Entenda como calculamos os valores</h2>
                            <button
                                type="button"
                                aria-label="Fechar"
                                onClick={() => setEntenda(false)}
                                className="-mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear active:bg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                            {EXPLICACOES.map((e) => (
                                <div key={e.titulo}>
                                    <p className="text-sm font-bold text-primary">{e.titulo}</p>
                                    <p className="mt-1 text-sm leading-relaxed text-tertiary">{e.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
