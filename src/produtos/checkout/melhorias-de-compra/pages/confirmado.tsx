import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { CheckCircle, Phone01, Ticket02, Wallet02 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { brl, dataHoraCurta, useColecao, useDoc, useSessao } from "@/plataforma";
import { LogoIngresse } from "../components/icones";
import { useTemaClaro } from "../utils/hooks";

const METODO = { pix: "Pix", credito: "Cartão de crédito", debito: "Cartão de débito" } as const;

/** Pedido pago: mostra os ingressos emitidos e leva para a carteira. */
export function Confirmado() {
    useTemaClaro();
    const [params] = useSearchParams();
    const pedido = useDoc("pedidos", params.get("pedido"));
    const evento = useDoc("eventos", pedido?.eventoId);
    const sessao = useSessao();
    const todos = useColecao("ingressos");
    const emitidos = useMemo(() => todos.filter((i) => i.pedidoId === pedido?.id && i.status === "valido"), [todos, pedido?.id]);
    const meus = emitidos.filter((i) => i.titular.email === (sessao?.email ?? pedido?.comprador.email));
    const inicio = evento?.sessoes.find((s) => s.id === emitidos[0]?.sessaoId)?.inicio ?? evento?.data;

    return (
        <div className="min-h-screen bg-secondary text-primary">
            <header className="flex h-11 items-center justify-center bg-black">
                <LogoIngresse />
            </header>

            <main className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-8 lg:py-12">
                {!pedido ? (
                    <p className="text-md text-tertiary">Carregando pedido…</p>
                ) : (
                    <>
                        <div className="flex flex-col items-center gap-4 text-center">
                            <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="xl" />
                            <div className="flex flex-col gap-1">
                                <h1 className="text-display-xs font-semibold text-primary">Compra confirmada</h1>
                                <p className="text-md text-tertiary">
                                    {pedido.status === "pago"
                                        ? `Seus ingressos já estão na carteira. Enviamos o comprovante para ${pedido.comprador.email}.`
                                        : "Estamos confirmando o pagamento. Os ingressos aparecem na carteira em instantes."}
                                </p>
                            </div>
                        </div>

                        <section className="flex flex-col gap-4 rounded-2xl bg-primary p-5 shadow-xs">
                            <div className="flex items-start gap-4">
                                {evento?.capa && <img src={evento.capa} alt="" className="size-16 shrink-0 rounded-lg object-cover" />}
                                <div className="flex min-w-0 flex-col gap-0.5">
                                    <p className="text-lg font-semibold text-primary">{evento?.nome}</p>
                                    <p className="text-sm text-tertiary">{[inicio ? dataHoraCurta(inicio) : null, evento?.local].filter(Boolean).join(" · ")}</p>
                                </div>
                            </div>

                            <ul className="flex flex-col divide-y divide-border-secondary">
                                {emitidos.map((i) => (
                                    <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                                        <span className="flex min-w-0 items-center gap-3">
                                            <Ticket02 className="size-5 shrink-0 text-fg-quaternary" />
                                            <span className="flex min-w-0 flex-col">
                                                <span className="truncate text-md font-medium text-primary">
                                                    {i.rotulo.grupo} · {i.rotulo.ingresso}
                                                </span>
                                                <span className="truncate text-sm text-tertiary">{i.titular.email === pedido.comprador.email ? "Seu ingresso" : `Enviado para ${i.titular.email}`}</span>
                                            </span>
                                        </span>
                                        <Badge size="sm" type="pill-color" color="success">
                                            Válido
                                        </Badge>
                                    </li>
                                ))}
                            </ul>

                            <div className="flex items-baseline justify-between border-t border-secondary pt-4">
                                <span className="text-md text-secondary">
                                    Total pago{pedido.pagamento ? ` · ${METODO[pedido.pagamento.metodo]}${pedido.pagamento.parcelas && pedido.pagamento.parcelas > 1 ? ` em ${pedido.pagamento.parcelas}x` : ""}` : ""}
                                </span>
                                <span className="text-lg font-semibold text-primary tabular-nums">{brl(pedido.total)}</span>
                            </div>
                        </section>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button size="lg" color="primary" iconLeading={Wallet02} className="flex-1" href="/carteira-web">
                                Ver na carteira
                            </Button>
                            <Button size="lg" color="secondary" iconLeading={Phone01} className="flex-1" href="/ingresse-app/ingressos">
                                Abrir no app
                            </Button>
                        </div>
                        {meus.length === 0 && emitidos.length > 0 && (
                            <p className="text-center text-sm text-tertiary">Todos os ingressos foram enviados para outras pessoas. Eles aparecem na carteira de cada uma.</p>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
