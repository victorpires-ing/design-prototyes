import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, InfoCircle, Send01, Wallet02, XClose } from "@untitledui/icons";
import { AppShell } from "../../components/AppShell";
import { ActionFab, type FabAction } from "../../components/ActionFab";
import { FakeQR } from "../../components/FakeQR";
import { StatusBar } from "../../components/StatusBar";
import { Zigzag } from "../../components/Zigzag";
import { getEvento, getItem } from "../data/eventos";

/** Detalhe de um item de produto/merchandising (QR de retirada). */
export function ProdutoDetalhe() {
    const navigate = useNavigate();
    const { eventId, itemId } = useParams();
    const eventoObj = getEvento(eventId);
    const item = getItem(eventId, itemId);
    const title = item?.title ?? "Produto";
    const imagem = item?.imagem;
    const [zoom, setZoom] = useState(false);

    const acoes: FabAction[] = [
        {
            icon: Send01,
            label: "Transferir produto",
            short: "Transferir",
            onClick: () => navigate(`/ingresse-app/ingressos/transferir/${eventoObj.id}/${itemId}`),
        },
        { icon: InfoCircle, label: "Detalhes do produto", short: "Detalhes" },
        { icon: Wallet02, label: "Adicionar à Carteira", short: "Carteira", dark: true },
    ];

    return (
        <AppShell showTabBar={false} bottomBar={<ActionFab actions={acoes} />}>
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                {/* Top bar */}
                <div className="flex items-center justify-between px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={() => navigate(`/ingresse-app/ingressos/evento/${eventoObj.id}`)}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Informações"
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <InfoCircle className="size-5" />
                    </button>
                </div>
                <h1 className="px-5 pt-4 text-xl font-bold text-primary">Produto</h1>

                <div className="flex flex-1 flex-col gap-5 px-5 pt-4 pb-8">
                    <div className="rounded-3xl bg-primary shadow-sm ring-1 ring-border-secondary">
                        {/* Topo: produto + retirada */}
                        <div className="p-5">
                            <motion.button
                                type="button"
                                layoutId="produto-img"
                                onClick={() => imagem && setZoom(true)}
                                aria-label="Ampliar imagem do produto"
                                className="block h-16 w-16 overflow-hidden rounded-xl bg-secondary transition duration-100 ease-linear active:scale-95"
                            >
                                {imagem && <img src={imagem} alt="" className="size-full object-cover" />}
                            </motion.button>
                            <p className="mt-4 text-sm text-tertiary">Produto</p>
                            <p className="mt-1 text-2xl leading-tight font-bold text-primary">{title}</p>
                            <p className="mt-1.5 text-sm text-tertiary">Retire em: Stand Loja, 23</p>

                            <div className="my-4 border-t border-tertiary" />

                            <p className="text-xs font-semibold text-tertiary">Data de retirada</p>
                            <p className="mt-1 text-sm font-bold text-primary">30 de Dez 2026</p>
                        </div>

                        {/* Rasgadinho (zigzag) */}
                        <div className="relative py-1">
                            <div className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                            <div className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
                            <div className="px-3">
                                <Zigzag />
                            </div>
                        </div>

                        {/* QR de retirada + dados do pedido */}
                        <div className="px-6 pt-6 pb-7">
                            <div className="flex justify-center">
                                <FakeQR px={220} />
                            </div>
                            <p className="mt-5 text-center text-sm text-tertiary">Apresente este QR Code no espaço para retirada dos seus produtos</p>

                            <div className="-mx-6 my-5 border-t border-tertiary" />

                            <div className="text-left">
                                <p className="text-sm text-tertiary">
                                    Data do pedido: <span className="font-semibold text-primary">22 de Abril de 2026</span>
                                </p>
                                <p className="mt-1 text-sm text-tertiary">
                                    Número do pedido: <span className="font-semibold text-primary">82920303</span>
                                </p>
                                <p className="mt-2 text-xs text-quaternary">#c31da550-31e1-45e2-85df-001555b4b989</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lightbox: imagem do produto ampliada */}
                <AnimatePresence>
                    {zoom && (
                        <motion.div
                            className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 p-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setZoom(false)}
                        >
                            <div className="relative w-full max-w-[300px]" onClick={(e) => e.stopPropagation()}>
                                <motion.div layoutId="produto-img" className="w-full overflow-hidden rounded-2xl bg-secondary shadow-2xl">
                                    {imagem && <img src={imagem} alt={title} className="w-full object-contain" />}
                                </motion.div>

                                <motion.button
                                    type="button"
                                    aria-label="Fechar"
                                    onClick={() => setZoom(false)}
                                    initial={{ opacity: 0, scale: 0.6 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.6 }}
                                    transition={{ delay: 0.12 }}
                                    className="absolute -top-3 -right-3 flex size-9 items-center justify-center rounded-full bg-white text-fg-secondary shadow-lg ring-1 ring-border-secondary transition duration-100 ease-linear active:scale-95"
                                >
                                    <XClose className="size-5" />
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AppShell>
    );
}
