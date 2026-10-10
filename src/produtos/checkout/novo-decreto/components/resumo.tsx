import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import dot from "../assets/dot.svg";
import icChevronResumo from "../assets/ic-chevron-resumo.svg";
import icChevronUpTaxas from "../assets/ic-chevron-up-taxas.svg";
import icInfo from "../assets/ic-info.svg";
import { EVENTO, PRECO_ITENS, PRECO_PROTECAO, TAXA_PROCESSAMENTO, TAXA_SERVICO, brl, totalPedido, type Protecao } from "../data/pedido";
import { SMART_ANIMATE } from "../utils/transicao";
import { DivisorLinha as Divisor, Icone } from "./base";
import { CapaEvento } from "./topo";

/** Valor que troca com fade no ritmo do Smart Animate (total do pedido). */
function ValorAnimado({ valor }: { valor: string }) {
    return (
        <span className="inline-grid tabular-nums">
            <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                    key={valor}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={SMART_ANIMATE}
                    className="col-start-1 row-start-1"
                >
                    {valor}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}

/** Entra/sai com a altura animada (usado em "Adicionais"). */
function Expansivel({ aberto, children }: { aberto: boolean; children: React.ReactNode }) {
    return (
        <AnimatePresence initial={false}>
            {aberto && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={SMART_ANIMATE}
                    className="w-full overflow-hidden"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

const EventoResumo = () => (
    <div className="flex w-full items-center gap-4">
        <CapaEvento />
        <p className="min-w-0 flex-1 text-[16px] leading-6 font-bold text-(--ck-text-primary)">{EVENTO.nome}</p>
    </div>
);

const Total = ({ protecao }: { protecao: Protecao }) => (
    <div className="flex h-6 w-full items-center gap-1 text-[16px] leading-6 font-bold whitespace-nowrap">
        <span className="flex-1 text-(--ck-text-primary)">Total do pedido</span>
        <ValorAnimado valor={brl(totalPedido(protecao))} />
    </div>
);

/** Resumo do pedido — coluna direita do desktop (448px). */
export function ResumoDesktop({ protecao, onInfoTaxas }: { protecao: Protecao; onInfoTaxas: () => void }) {
    const [detalhes, setDetalhes] = useState(true);

    return (
        <aside aria-label="Resumo do pedido" className="ck-sombra-resumo flex w-full flex-col gap-4 overflow-clip rounded-2xl bg-(--ck-bg-primary) px-4 pt-5 pb-5">
            <EventoResumo />
            <Divisor />

            <div className="flex w-full flex-col gap-2">
                <p className="h-6 text-[16px] leading-6 font-bold text-(--ck-text-primary)">Itens</p>
                <div className="flex w-full items-center justify-between gap-2 text-[14px] leading-5">
                    <div>
                        <p>
                            <span className="font-semibold text-(--ck-text-primary)">1</span>
                            {"  "}
                            <span className="tracking-[0.28px] text-(--ck-text-secondary)">Inteira</span>
                        </p>
                        <p className="tracking-[0.28px] text-(--ck-text-secondary)">{EVENTO.sessao}</p>
                    </div>
                    <p className="self-start text-(--ck-text-secondary) tabular-nums">{brl(PRECO_ITENS)}</p>
                </div>
            </div>

            <Divisor />

            {/* Adicionais: aparece junto com "Ingresso protegido" (Smart Animate) */}
            <Expansivel aberto={protecao === "com"}>
                <div className="flex w-full flex-col gap-4">
                    <div className="flex w-full flex-col gap-2">
                        <p className="text-[16px] leading-6 font-bold text-(--ck-text-primary)">Adicionais</p>
                        <div className="flex h-5 w-full items-center justify-between text-[14px] leading-5 whitespace-nowrap text-(--ck-text-secondary)">
                            <span className="tracking-[0.28px]">Proteção de compra</span>
                            <span className="tabular-nums">{brl(PRECO_PROTECAO)}</span>
                        </div>
                    </div>
                    <Divisor />
                </div>
            </Expansivel>

            <div className="flex w-full flex-col gap-2">
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                        <p className="text-[16px] leading-6 font-bold text-(--ck-text-primary)">Taxas</p>
                        <button type="button" aria-label="Entenda como calculamos os valores" onClick={onInfoTaxas} className="flex cursor-pointer">
                            <Icone src={icInfo} tamanho={16} />
                        </button>
                    </div>
                    <p className="text-[14px] leading-5 text-(--ck-text-secondary) tabular-nums">{brl(TAXA_SERVICO + TAXA_PROCESSAMENTO)}</p>
                </div>
                <button
                    type="button"
                    aria-expanded={detalhes}
                    onClick={() => setDetalhes((v) => !v)}
                    className="flex cursor-pointer items-start gap-2 text-[14px] leading-4 tracking-[0.28px] text-(--ck-text-secondary)"
                >
                    {detalhes ? "Ocultar detalhes" : "Ver detalhes"}
                    <Icone src={icChevronUpTaxas} tamanho={18} className={detalhes ? "" : "rotate-180"} />
                </button>
                {detalhes && (
                    <div className="flex w-full items-center gap-1.5 pl-2">
                        <span aria-hidden="true" className="h-10 w-px shrink-0 bg-(--ck-border-secondary)" />
                        <div className="flex min-w-0 flex-1 flex-col text-[14px] leading-5 text-(--ck-content-secundary)">
                            <p className="flex gap-1">
                                <span className="whitespace-nowrap">Taxa de serviço</span>
                                <span className="flex-1 text-right tabular-nums">{brl(TAXA_SERVICO)}</span>
                            </p>
                            <p className="flex gap-1">
                                <span className="whitespace-nowrap">Taxa de processamento</span>
                                <span className="flex-1 text-right tabular-nums">{brl(TAXA_PROCESSAMENTO)}</span>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <Divisor />
            <Total protecao={protecao} />
        </aside>
    );
}

/** Resumo condensado do mobile (abre o detalhe no chevron). */
export function ResumoMobile({ protecao, onInfoTaxas }: { protecao: Protecao; onInfoTaxas: () => void }) {
    const [aberto, setAberto] = useState(false);

    return (
        <div className="ck-sombra-resumo flex w-full flex-col gap-4 overflow-clip rounded-2xl bg-(--ck-bg-primary) p-4">
            <EventoResumo />
            <Divisor />

            <div className="flex flex-col gap-2 text-[14px] leading-5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-(--ck-content-primary)">1 Inteira</p>
                    <AnimatePresence initial={false}>
                        {protecao === "com" && (
                            <motion.span
                                className="flex items-center gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={SMART_ANIMATE}
                            >
                                <img src={dot} alt="" className="size-1" />
                                <span className="tracking-[0.28px] text-(--ck-text-secondary)">Proteção de compra</span>
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                <p className="tracking-[0.28px] text-(--ck-content-primary)">Taxas</p>
            </div>

            <Expansivel aberto={aberto}>
                <div className="flex flex-col gap-2 text-[14px] leading-5 text-(--ck-content-secundary)">
                    <p className="flex justify-between">
                        <span>1 Inteira · {EVENTO.sessao}</span>
                        <span className="tabular-nums">{brl(PRECO_ITENS)}</span>
                    </p>
                    {protecao === "com" && (
                        <p className="flex justify-between">
                            <span>Proteção de compra</span>
                            <span className="tabular-nums">{brl(PRECO_PROTECAO)}</span>
                        </p>
                    )}
                    <p className="flex justify-between">
                        <span>Taxa de serviço</span>
                        <span className="tabular-nums">{brl(TAXA_SERVICO)}</span>
                    </p>
                    <p className="flex justify-between">
                        <span className="flex items-center gap-2">
                            Taxa de processamento
                            <button type="button" aria-label="Entenda como calculamos os valores" onClick={onInfoTaxas} className="flex cursor-pointer">
                                <Icone src={icInfo} tamanho={16} />
                            </button>
                        </span>
                        <span className="tabular-nums">{brl(TAXA_PROCESSAMENTO)}</span>
                    </p>
                </div>
            </Expansivel>

            <Divisor />
            <Total protecao={protecao} />

            <button
                type="button"
                aria-label={aberto ? "Recolher resumo do pedido" : "Ver resumo do pedido"}
                aria-expanded={aberto}
                onClick={() => setAberto((v) => !v)}
                className="flex w-full cursor-pointer items-center justify-center"
            >
                <Icone src={icChevronResumo} tamanho={24} className={aberto ? "rotate-180 transition" : "transition"} />
            </button>
        </div>
    );
}
