import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronDown, Clock, Copy01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";
import { AppShell } from "../../components/AppShell";
import { GradientFill } from "../../components/GradientFill";
import { StatusBar } from "../../components/StatusBar";
import { getEvento, getItem } from "../data/eventos";

const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
const PIX = "0939394884849448484.PIX28474.instantpayment.br/qr/v2/cobv/8f2a1c9e";
const TOTAL = 15 * 60 + 30; // 15:30
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function PagamentoPix() {
    const navigate = useNavigate();
    const { eventId, id } = useParams();
    const evento = getEvento(eventId);
    const item = getItem(eventId, id);
    const taxa = item?.taxaTransferencia ?? 0;

    const [restante, setRestante] = useState(TOTAL);
    const [copiado, setCopiado] = useState(false);
    const [comoOpen, setComoOpen] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setRestante((r) => (r > 0 ? r - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, []);

    const copiar = () => {
        navigator.clipboard?.writeText(PIX).catch(() => {});
        setCopiado(true);
        // Após copiar, o pagamento é "confirmado" e o fluxo segue para a tela de sucesso.
        setTimeout(() => navigate(`/ingresse-app/ingressos/transferir-pagamento/${evento.id}/${id}/sucesso`), 1200);
    };

    return (
        <AppShell showTabBar={false} scrollClassName="bg-secondary">
            <div className="min-h-full bg-secondary">
                <StatusBar tone="dark" />

                <div className="flex items-center px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={() => navigate(-1)}
                        className="-ml-2 flex size-9 items-center justify-center rounded-lg text-fg-secondary transition duration-100 ease-linear active:bg-primary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                </div>

                <div className="flex flex-col gap-4 px-5 pt-2 pb-8">
                    {/* Aguardando pagamento */}
                    <section className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-fg-secondary">
                                <Clock className="size-5" />
                            </span>
                            <h1 className="text-md font-bold text-primary">Pedido aguardando o pagamento</h1>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-tertiary">
                            Assim que o pagamento for concluído, a transferência será realizada. Copie o código abaixo e cole no app do seu banco para pagar com Pix
                            Copia e Cola.
                        </p>

                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary px-3.5 py-3 ring-1 ring-border-secondary">
                            <span className="min-w-0 flex-1 truncate text-sm text-tertiary">{PIX}</span>
                            <Copy01 className="size-4 shrink-0 text-fg-quaternary" />
                        </div>

                        <Button size="lg" color="primary" className="mt-3 w-full rounded-full" iconLeading={Copy01} onClick={copiar}>
                            {copiado ? "Código copiado" : "Copiar código"}
                        </Button>

                        <p className="mt-5 text-sm text-tertiary">A sua reserva expira em:</p>
                        <p className="mt-0.5 text-2xl font-bold text-primary tabular-nums">{fmt(restante)}</p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-success-solid transition-all duration-1000 ease-linear" style={{ width: `${(restante / TOTAL) * 100}%` }} />
                        </div>

                        <div className="mt-4 border-t border-secondary pt-3">
                            <button type="button" onClick={() => setComoOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
                                <span className="text-sm font-medium text-secondary">Entenda como funciona</span>
                                <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-fg-secondary">
                                    <ChevronDown className={cx("size-4 transition-transform duration-200", comoOpen && "rotate-180")} />
                                </span>
                            </button>
                            {comoOpen && (
                                <p className="mt-2 text-sm leading-relaxed text-tertiary">
                                    O valor pago é a taxa da transferência. Após a confirmação do Pix, o ingresso é transferido automaticamente para o destinatário e você
                                    recebe a confirmação.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Card do evento */}
                    <section className="rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                        <div className="flex gap-3">
                            <div className="size-14 shrink-0 overflow-hidden rounded-xl">
                                <GradientFill gradient={evento.gradient} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-primary">{evento.title}</p>
                                <p className="truncate text-sm text-tertiary">{item?.title}</p>
                                <p className="truncate text-sm text-tertiary">{item?.tipo}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-secondary pt-3">
                            <span className="text-sm font-semibold text-primary">Taxa de transferência</span>
                            <span className="text-sm font-semibold text-primary">{brl(taxa)}</span>
                        </div>
                    </section>
                </div>
            </div>
        </AppShell>
    );
}
