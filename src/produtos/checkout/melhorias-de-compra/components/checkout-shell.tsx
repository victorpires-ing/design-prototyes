import { useState, type ReactNode } from "react";
import { ChevronDown, HelpCircle, InfoCircle, MarkerPin01 } from "@untitledui/icons";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import capaEvento from "../assets/vai-safadao.png";
import { useCheckout } from "../data/checkout-store";
import { EVENTO, PRECO_ITENS, PRECO_PROTECAO, TAXA_PROCESSAMENTO, TAXA_SERVICO, brl } from "../data/pedido";
import { totalBaseDoPedidoAtual, usePedidoCheckout } from "../data/pedido-banco";
import { LogoIngresse } from "./icones";

interface CheckoutShellProps {
    isMobile: boolean;
    /** Linha acima das colunas no desktop (título ou "Outros métodos" + tempo). */
    topo: ReactNode;
    /** Juros do parcelamento escolhido — só no cartão. */
    juros?: number;
    children: ReactNode;
}

const Linha = ({ label, valor }: { label: string; valor: string }) => (
    <div className="flex items-baseline justify-between gap-3 text-md text-secondary">
        <span>{label}</span>
        <span className="tabular-nums">{valor}</span>
    </div>
);

const Capa = ({ className, src }: { className: string; src?: string }) => <img src={src || capaEvento} alt="" className={cx("shrink-0 rounded-lg object-cover", className)} />;

/** Total a pagar. Com pedido do banco, parte do total dele; sem, do mock. */
export function totalPedido(protecao: "com" | "sem", juros = 0) {
    const base = totalBaseDoPedidoAtual() ?? PRECO_ITENS + TAXA_SERVICO + TAXA_PROCESSAMENTO;
    return base + (protecao === "com" ? PRECO_PROTECAO : 0) + juros;
}

/** Topo da Ingresse + evento + resumo do pedido, compartilhado por todas as telas do pagamento. */
export function CheckoutShell({ isMobile, topo, juros = 0, children }: CheckoutShellProps) {
    const { protecao } = useCheckout();
    const [taxasAbertas, setTaxasAbertas] = useState(true);
    const [resumoAberto, setResumoAberto] = useState(false);

    const doBanco = usePedidoCheckout();
    const pedido = doBanco?.pedido;
    const ev = {
        nome: doBanco?.evento?.nome ?? EVENTO.nome,
        local: doBanco?.evento ? [doBanco.evento.local, doBanco.evento.cidade].filter(Boolean).join(" - ") : EVENTO.local,
        sessao: doBanco?.sessao ?? EVENTO.sessao,
        capa: doBanco?.evento?.capa,
    };
    const taxaServico = pedido ? pedido.taxas : TAXA_SERVICO;
    const taxaProcessamento = pedido ? 0 : TAXA_PROCESSAMENTO;
    const taxas = taxaServico + taxaProcessamento + juros;
    const total = totalPedido(protecao, juros);
    const qtdItens = pedido ? pedido.itens.reduce((a, i) => a + i.quantidade, 0) : 1;

    const detalhe = (
        <div className="flex flex-col divide-y divide-border-secondary">
            <div className="py-4">
                <p className="text-lg font-semibold text-primary">Itens</p>
                {pedido ? (
                    pedido.itens.map((item, i) => (
                        <div key={i} className="mt-2 flex items-start justify-between gap-3 text-md text-secondary">
                            <p>
                                <span className="font-semibold text-primary">{item.quantidade}</span> {item.nome}
                                {item.detalhe ? ` · ${item.detalhe}` : ""}
                                <br />
                                {ev.sessao}
                            </p>
                            <span className="tabular-nums">{brl(item.face * item.quantidade)}</span>
                        </div>
                    ))
                ) : (
                    <div className="mt-2 flex items-start justify-between gap-3 text-md text-secondary">
                        <p>
                            <span className="font-semibold text-primary">1</span> Inteira
                            <br />
                            {EVENTO.sessao}
                        </p>
                        <span className="tabular-nums">{brl(PRECO_ITENS)}</span>
                    </div>
                )}
            </div>

            {protecao === "com" && (
                <div className="py-4">
                    <p className="text-lg font-semibold text-primary">Adicionais</p>
                    <div className="mt-2">
                        <Linha label="Proteção de compra" valor={brl(PRECO_PROTECAO)} />
                    </div>
                </div>
            )}

            <div className="py-4">
                <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 text-lg font-semibold text-primary">
                        Taxas
                        <Tooltip title="Como calculamos" description="Taxas de serviço e processamento da compra. Juros só entram em compras parceladas no cartão.">
                            <TooltipTrigger aria-label="Entenda as taxas" className="text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary">
                                <InfoCircle className="size-4" />
                            </TooltipTrigger>
                        </Tooltip>
                    </span>
                    <span className="text-md text-secondary tabular-nums">{brl(taxas)}</span>
                </div>
                <button
                    type="button"
                    aria-expanded={taxasAbertas}
                    onClick={() => setTaxasAbertas((v) => !v)}
                    className="mt-2 flex items-center gap-2 text-md text-secondary"
                >
                    {taxasAbertas ? "Ocultar detalhes" : "Ver detalhes"}
                    <ChevronDown className={cx("size-4 transition", taxasAbertas && "rotate-180")} />
                </button>
                {taxasAbertas && (
                    <div className="mt-3 flex flex-col gap-1 border-l border-secondary pl-3">
                        <Linha label="Taxa de serviço" valor={brl(taxaServico)} />
                        {taxaProcessamento > 0 && <Linha label="Taxa de processamento" valor={brl(taxaProcessamento)} />}
                        {juros > 0 && <Linha label="Juros de parcelamento" valor={brl(juros)} />}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-secondary text-primary">
            <header className="flex h-11 items-center justify-center bg-black">
                <LogoIngresse />
            </header>

            {/* Breadcrumb, suporte, idioma e evento */}
            <div className="bg-primary">
                <div className="mx-auto w-full max-w-[1192px] px-4 py-4 lg:px-5 lg:pt-5 lg:pb-4">
                    <div className={cx("flex gap-3", isMobile ? "flex-col" : "items-center justify-between")}>
                        <nav aria-label="Etapas da compra" className={cx("flex items-center gap-2 text-md text-tertiary", isMobile && "justify-center")}>
                            <span>Ingressos</span>
                            <span aria-hidden="true">•</span>
                            <span>Atribuição</span>
                            <span aria-hidden="true">•</span>
                            <span aria-current="step" className="font-semibold text-brand-secondary">
                                Pagamento
                            </span>
                        </nav>
                        <div className="flex items-center justify-between gap-6">
                            <span className="flex items-center gap-1.5 rounded-md bg-brand-primary px-3 py-1 text-sm font-medium text-brand-secondary">
                                <HelpCircle className="size-4" />
                                Suporte
                            </span>
                            <button type="button" className="flex items-center gap-2 text-sm font-medium text-secondary">
                                <img src="/Brazil flag.svg" alt="" className="size-5 rounded-full" />
                                PT
                                <ChevronDown className="size-4 text-fg-quaternary" />
                            </button>
                        </div>
                    </div>

                    {!isMobile && (
                        <div className="mt-4 flex items-center gap-4">
                            <Capa className="size-20" src={ev.capa} />
                            <div className="flex flex-col gap-1.5">
                                <p className="text-lg font-semibold text-primary">{ev.nome}</p>
                                <p className="flex items-center gap-1.5 text-md text-secondary">
                                    <MarkerPin01 className="size-4" />
                                    {ev.local}
                                </p>
                                <p className="flex items-center gap-4 text-sm font-medium text-brand-secondary">
                                    <span>Ver página do evento</span>
                                    <span>Compartilhar</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mx-auto w-full max-w-[1192px] px-4 pt-5 pb-16 lg:px-5 lg:pt-6">
                {/* Resumo condensado no topo (mobile) */}
                {isMobile && (
                    <div className="mb-6 rounded-2xl bg-primary p-4 shadow-xs">
                        <div className="flex items-center gap-4 border-b border-secondary pb-4">
                            <Capa className="size-20" src={ev.capa} />
                            <p className="text-lg font-semibold text-primary">{ev.nome}</p>
                        </div>
                        {resumoAberto ? (
                            detalhe
                        ) : (
                            <div className="flex flex-col gap-1 border-b border-secondary py-4 text-md text-secondary">
                                <p>
                                    <span className="font-semibold text-primary">{qtdItens}</span> {qtdItens === 1 ? "Item" : "Itens"} • {protecao === "com" ? "Proteção de compra" : "Sem proteção"}
                                </p>
                                <p>Taxas • Cupom de desconto</p>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-3 pt-4">
                            <span className="text-lg font-semibold text-primary">Total do pedido</span>
                            <span className="text-lg font-semibold text-primary tabular-nums">{brl(total)}</span>
                        </div>
                        <button
                            type="button"
                            aria-label={resumoAberto ? "Recolher resumo do pedido" : "Ver resumo do pedido"}
                            aria-expanded={resumoAberto}
                            onClick={() => setResumoAberto((v) => !v)}
                            className="mt-2 flex w-full items-center justify-center text-fg-secondary"
                        >
                            <ChevronDown className={cx("size-5 transition", resumoAberto && "rotate-180")} />
                        </button>
                    </div>
                )}

                {topo}

                <div className="mt-4 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,684px)_448px] lg:justify-between">
                    <main className="min-w-0">{children}</main>

                    {!isMobile && (
                        <aside aria-label="Resumo do pedido" className="sticky top-6 rounded-2xl bg-primary px-4 pt-5 pb-5 shadow-xs">
                            <div className="flex items-center gap-4 border-b border-secondary pb-4">
                                <Capa className="size-20" src={ev.capa} />
                                <p className="text-lg font-semibold text-primary">{ev.nome}</p>
                            </div>
                            <div className="border-b border-secondary">{detalhe}</div>
                            <div className="flex items-baseline justify-between gap-3 pt-5">
                                <span className="text-lg font-semibold text-primary">Total do pedido</span>
                                <span className="text-lg font-bold text-primary tabular-nums">{brl(total)}</span>
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
}
