import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router";
import { ChevronLeft, HelpCircle, Share06 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useForceLightTheme } from "../../utils/use-force-light-theme";
import { IconeCartao, IconeClickToPay, IconeGoogle, IconePix, MetodoPagamento } from "../components/metodos-pagamento";
import { Topo } from "../components/topo";
import { SERVICOS, brl, valorFinal, type ServicoId } from "../data/servicos";

/**
 * Checkout do crédito no formato do checkout em produção: header, barra com voltar, nome do
 * produto e ações, "Finalizar pedido" com tempo restante, métodos de pagamento em lista
 * e resumo à direita. Não fica preso a um evento: no lugar da capa e do nome do evento entram
 * a logo e o nome do crédito. Sem a proteção de compra, que é do ingresso. Simulado: escolher um método
 * leva direto para a confirmação.
 */
export function CheckoutServico() {
    useForceLightTheme();
    const navigate = useNavigate();
    const { servico: id } = useParams();
    const [params] = useSearchParams();
    const servico = SERVICOS[id as ServicoId];
    const valor = Number(params.get("valor"));

    // Tempo restante do pedido, como em produção
    const [restante, setRestante] = useState(10 * 60);
    useEffect(() => {
        window.scrollTo(0, 0);
        const t = window.setInterval(() => setRestante((r) => (r > 0 ? r - 1 : 0)), 1000);
        return () => window.clearInterval(t);
    }, []);
    const tempo = `${String(Math.floor(restante / 60)).padStart(2, "0")}:${String(restante % 60).padStart(2, "0")}`;

    if (!servico) return <Navigate to="/novos-negocios/servicos-adicionais" replace />;
    if (!valor || valor < servico.minimo || valor > servico.maximo) return <Navigate to={`/novos-negocios/servicos-adicionais/${servico.id}`} replace />;

    const final = valorFinal(servico, valor);
    const desconto = valor - final;
    const pct = Math.round(servico.desconto * 100);
    const voltar = () => navigate(`/novos-negocios/servicos-adicionais/${servico.id}`);
    const pagar = (forma: "pix" | "cartao") => navigate(`/novos-negocios/servicos-adicionais/${servico.id}/confirmacao?valor=${valor}&forma=${forma}`);

    return (
        <div className="min-h-screen bg-secondary text-primary">
            <Topo comEvento={false} />

            {/* Barra do produto: voltar, nome e ações */}
            <div className="border-b border-secondary bg-primary">
                <div className="mx-auto flex h-[68px] w-full max-w-[1264px] items-center justify-between gap-4 px-4 lg:px-6">
                    <div className="flex min-w-0 items-center gap-4 lg:gap-8">
                        <button
                            type="button"
                            onClick={voltar}
                            aria-label="Voltar para a oferta"
                            className="-ml-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-secondary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover focus-visible:outline-2"
                        >
                            <ChevronLeft className="size-5" aria-hidden="true" />
                        </button>
                        <p className="truncate text-md font-bold text-primary uppercase">{servico.item}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button size="md" color="secondary" iconTrailing={Share06} className="hidden sm:flex">
                            Compartilhar
                        </Button>
                        <Button size="md" color="secondary" iconTrailing={HelpCircle}>
                            Preciso de ajuda
                        </Button>
                    </div>
                </div>
            </div>

            <main className="mx-auto w-full max-w-[1160px] px-4 pt-6 pb-16 lg:px-6">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-xl font-bold text-primary">Finalizar pedido</h1>
                    <p className="text-xs text-secondary tabular-nums">Tempo restante: {tempo}</p>
                </div>

                <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_448px]">
                    <div className="flex flex-col">
                        <h2 className="text-md font-bold text-primary">Escolha como pagar</h2>
                        <div className="mt-4 flex flex-col gap-3">
                            <MetodoPagamento icone={<IconePix />} rotulo="PIX" destaque onPress={() => pagar("pix")} />
                            <MetodoPagamento icone={<IconeCartao />} rotulo="Crédito" onPress={() => pagar("cartao")} />
                            <MetodoPagamento icone={<IconeGoogle />} rotulo="Google Pay" onPress={() => pagar("cartao")} />
                            <MetodoPagamento icone={<IconeClickToPay />} rotulo="Click to Pay" onPress={() => pagar("cartao")} />
                        </div>
                    </div>

                    {/* Resumo do pedido: à direita no desktop, antes dos métodos no mobile */}
                    <aside aria-label="Resumo do pedido" className="order-first rounded-2xl bg-primary p-4 shadow-xs ring-1 ring-secondary lg:sticky lg:top-6 lg:order-none">
                        <div className="flex items-center gap-4">
                            {/* Logo do parceiro no lugar da capa do evento: o crédito não fica preso a um evento */}
                            <span className="flex size-[72px] shrink-0 items-center justify-center rounded-xl bg-black">
                                {servico.logo ? (
                                    <img src={servico.logo} alt={servico.parceiro} className="h-5 w-auto invert" />
                                ) : (
                                    <span className="text-sm font-bold text-white">{servico.parceiro}</span>
                                )}
                            </span>
                            <p className="text-md font-bold text-primary uppercase">{servico.item}</p>
                        </div>

                        <div className="my-4 border-t border-secondary" />

                        <p className="text-md font-bold text-primary">Itens</p>
                        <div className="mt-3 flex items-start justify-between gap-3 text-sm">
                            <p className="flex gap-2 text-secondary">
                                <span className="font-semibold text-primary">1</span>
                                <span>{servico.item}</span>
                            </p>
                            <span className="font-semibold text-primary tabular-nums">{brl(valor)}</span>
                        </div>
                        {servico.desconto > 0 && (
                            <div className="mt-2 flex items-baseline justify-between gap-3 pl-4 text-sm">
                                <span className="text-secondary">Desconto de {pct}%</span>
                                <span className="font-semibold text-success-primary tabular-nums">− {brl(desconto)}</span>
                            </div>
                        )}

                        <div className="my-4 border-t border-secondary" />

                        <div className="flex items-baseline justify-between gap-3">
                            <span className="text-md font-bold text-primary">Total a pagar</span>
                            <span className="text-lg font-bold text-primary tabular-nums">{brl(final)}</span>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
