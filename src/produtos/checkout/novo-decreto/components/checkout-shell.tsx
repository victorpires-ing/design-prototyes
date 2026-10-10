import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, HelpCircle, InfoCircle, Lock01, MarkerPin01, XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import capaEvento from "../assets/vai-safadao.png";
import { EVENTO, PRECO_ITENS, PRECO_PROTECAO, TAXAS_EXPLICADAS, TAXA_PROCESSAMENTO, TAXA_SERVICO, brl, totalPedido, type Protecao } from "../data/pedido";
import { useTempoReserva } from "../utils/hooks";
import { SMART_ANIMATE } from "../utils/transicao";
import { LogoIngresse } from "./icones";

const Linha = ({ label, valor }: { label: string; valor: string }) => (
    <div className="flex items-baseline justify-between gap-3 text-md text-secondary">
        <span>{label}</span>
        <span className="tabular-nums">{valor}</span>
    </div>
);

const Capa = ({ className }: { className: string }) => <img src={capaEvento} alt="" className={cx("shrink-0 rounded-lg object-cover", className)} />;

/** Valor que troca com fade no mesmo ritmo do Smart Animate (ex.: total do pedido). */
function ValorAnimado({ valor, className }: { valor: string; className?: string }) {
    return (
        <span className={cx("relative inline-grid tabular-nums", className)}>
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

function ModalTaxas({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-[440px]">
                <Dialog aria-label="Entenda como calculamos os valores">
                    <div className="w-full rounded-2xl bg-primary p-4 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="text-lg font-semibold text-primary">Entenda como calculamos os valores</h2>
                            <ButtonUtility size="xs" color="tertiary" icon={XClose} onClick={onClose} tooltip="Fechar" />
                        </div>
                        <dl className="mt-3 flex flex-col gap-4">
                            {TAXAS_EXPLICADAS.map((t) => (
                                <div key={t.titulo}>
                                    <dt className="text-sm font-semibold text-primary">{t.titulo}</dt>
                                    <dd className="mt-2 text-sm text-secondary">{t.texto}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}

/** Topo da Ingresse + evento + resumo do pedido. O resumo reage à decisão sobre a proteção. */
export function CheckoutShell({ isMobile, protecao, children }: { isMobile: boolean; protecao: Protecao; children: ReactNode }) {
    const tempo = useTempoReserva();
    const [taxasAbertas, setTaxasAbertas] = useState(true);
    const [resumoAberto, setResumoAberto] = useState(false);
    const [modalTaxas, setModalTaxas] = useState(false);

    const total = brl(totalPedido(protecao));

    const detalhe = (
        <div className="flex flex-col">
            <div className="border-b border-secondary py-4">
                <p className="text-lg font-semibold text-primary">Itens</p>
                <div className="mt-2 flex items-start justify-between gap-3 text-md text-secondary">
                    <p>
                        <span className="font-semibold text-primary">1</span> Inteira
                        <br />
                        {EVENTO.sessao}
                    </p>
                    <span className="tabular-nums">{brl(PRECO_ITENS)}</span>
                </div>
            </div>

            {/* "Adicionais" entra e sai junto com a proteção */}
            <AnimatePresence initial={false}>
                {protecao === "com" && (
                    <motion.div
                        key="adicionais"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={SMART_ANIMATE}
                        className="overflow-hidden"
                    >
                        <div className="border-b border-secondary py-4">
                            <p className="text-lg font-semibold text-primary">Adicionais</p>
                            <div className="mt-2">
                                <Linha label="Proteção de compra" valor={brl(PRECO_PROTECAO)} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="py-4">
                <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 text-lg font-semibold text-primary">
                        Taxas
                        <button
                            type="button"
                            aria-label="Entenda como calculamos os valores"
                            onClick={() => setModalTaxas(true)}
                            className="text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                        >
                            <InfoCircle className="size-4" />
                        </button>
                    </span>
                    <span className="text-md text-secondary tabular-nums">{brl(TAXA_SERVICO + TAXA_PROCESSAMENTO)}</span>
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
                        <Linha label="Taxa de serviço" valor={brl(TAXA_SERVICO)} />
                        <Linha label="Taxa de processamento" valor={brl(TAXA_PROCESSAMENTO)} />
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-secondary text-primary [overflow-anchor:none]">
            <header className="flex h-11 items-center justify-center bg-black">
                <LogoIngresse />
            </header>

            {/* Breadcrumb, suporte, idioma e evento */}
            <div className="bg-primary">
                <div className="mx-auto w-full max-w-[1192px] px-4 py-4 lg:px-0">
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
                            <Capa className="size-20" />
                            <div className="flex flex-col gap-1.5">
                                <p className="text-lg font-semibold text-primary">{EVENTO.nome}</p>
                                <p className="flex items-center gap-1.5 text-md text-secondary">
                                    <MarkerPin01 className="size-4" />
                                    {EVENTO.local}
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

            <div className="mx-auto w-full max-w-[1156px] px-4 pt-4 pb-16 lg:px-0 lg:pt-4">
                {/* Título + tempo da reserva */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className={cx("font-semibold text-primary", isMobile ? "text-lg" : "text-display-xs")}>Finalizar compra</h1>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-tertiary lg:mt-2">
                            {!isMobile && <Lock01 className="size-4" />}
                            Compra 100% segura
                        </p>
                    </div>
                    <p className={cx("shrink-0 text-tertiary", isMobile ? "text-sm" : "pt-1 text-md")}>
                        Tempo restante: <span className="tabular-nums">{tempo}</span>
                    </p>
                </div>

                {/* Resumo condensado (mobile) */}
                {isMobile && (
                    <div className="mt-6 rounded-2xl bg-primary p-4 shadow-xs">
                        <div className="flex items-center gap-4 border-b border-secondary pb-4">
                            <Capa className="size-20" />
                            <p className="text-lg font-semibold text-primary">{EVENTO.nome}</p>
                        </div>
                        {resumoAberto ? (
                            detalhe
                        ) : (
                            <div className="flex flex-col gap-1 border-b border-secondary py-4 text-md text-secondary">
                                <p>
                                    <span className="font-semibold text-primary">1 Inteira</span>
                                    {protecao === "com" && " • Proteção de compra"}
                                </p>
                                <p>Taxas</p>
                            </div>
                        )}
                        <div className="flex items-center justify-between gap-3 pt-4">
                            <span className="text-lg font-semibold text-primary">Total do pedido</span>
                            <ValorAnimado valor={total} className="text-lg font-semibold text-primary" />
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

                <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,684px)_448px] lg:justify-between">
                    <main className="min-w-0">{children}</main>

                    {!isMobile && (
                        <aside aria-label="Resumo do pedido" className="sticky top-6 rounded-2xl bg-primary px-4 pt-5 pb-5 shadow-xs">
                            <div className="flex items-center gap-4 border-b border-secondary pb-4">
                                <Capa className="size-20" />
                                <p className="text-lg font-semibold text-primary">{EVENTO.nome}</p>
                            </div>
                            <div className="border-b border-secondary">{detalhe}</div>
                            <div className="flex items-baseline justify-between gap-3 pt-4">
                                <span className="text-lg font-semibold text-primary">Total do pedido</span>
                                <ValorAnimado valor={total} className="text-lg font-bold text-primary" />
                            </div>
                        </aside>
                    )}
                </div>
            </div>

            <ModalTaxas isOpen={modalTaxas} onClose={() => setModalTaxas(false)} />
        </div>
    );
}
