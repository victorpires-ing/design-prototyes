import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronDown, InfoCircle, Plus, Trash01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";
import { AppShell } from "../../components/AppShell";
import { StatusBar } from "../../components/StatusBar";
import { getEvento, getItem } from "../data/eventos";

const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

// Juros por nº de parcelas (proporção sobre o valor base da taxa).
const JUROS: Record<number, number> = { 1: 0, 2: 0, 3: 0.06, 4: 0.075, 5: 0.15, 6: 0.18 };

/** Gera as opções de parcelamento a partir do valor base (a taxa de transferência). */
const gerarParcelas = (base: number) =>
    [1, 2, 3, 4, 5, 6].map((n) => {
        const total = base * (1 + JUROS[n]);
        return { id: String(n), n, label: `${n}x ${brl(total / n)}`, right: JUROS[n] === 0 ? "Sem juros" : brl(total), total, popular: n === 4 };
    });

const Mastercard = () => (
    <span className="flex items-center">
        <span className="size-4 rounded-full bg-[#eb001b]" />
        <span className="-ml-1.5 size-4 rounded-full bg-[#f79e1b] mix-blend-multiply" />
    </span>
);

const Radio = ({ on }: { on: boolean }) => (
    <span className={cx("flex size-5 shrink-0 items-center justify-center rounded-full ring-2", on ? "ring-primary" : "ring-border-primary")}>
        {on && <span className="size-2.5 rounded-full bg-fg-primary" />}
    </span>
);

export function PagamentoCartao() {
    const navigate = useNavigate();
    const { eventId, id } = useParams();
    const evento = getEvento(eventId);
    const item = getItem(eventId, id);

    const parcelas = gerarParcelas(item?.taxaTransferencia ?? 0);
    const [cartao, setCartao] = useState("1234");
    const [cvc, setCvc] = useState("");
    const [parcela, setParcela] = useState("1");
    const totalSelecionado = parcelas.find((p) => p.id === parcela)?.total ?? 0;

    const finalizar = () => {
        navigate(`/ingresse-app/ingressos/transferir-pagamento/${evento.id}/${id}/sucesso`);
    };

    return (
        <AppShell showTabBar={false} scrollClassName="bg-secondary">
            <div className="min-h-full bg-secondary">
                <StatusBar tone="dark" />

                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-5 pt-2">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            aria-label="Voltar"
                            onClick={() => navigate(-1)}
                            className="-ml-2 flex size-9 items-center justify-center rounded-lg text-fg-secondary transition duration-100 ease-linear active:bg-primary"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <h1 className="text-lg font-bold text-primary">Outros métodos</h1>
                    </div>
                    <span className="text-sm text-tertiary">
                        Tempo restante: <span className="font-semibold text-secondary">19m15s</span>
                    </span>
                </div>

                <div className="flex flex-col gap-4 px-5 pt-4 pb-8">
                    {/* Selecione como pagar */}
                    <section>
                        <div className="flex items-center justify-between pb-2">
                            <h2 className="text-md font-bold text-primary">Selecione como pagar</h2>
                            <button type="button" className="flex items-center gap-1.5 text-sm font-semibold text-error-primary">
                                <Trash01 className="size-4" />
                                Excluir
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Cartão 4095 */}
                            <button
                                type="button"
                                onClick={() => setCartao("4095")}
                                className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-left ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                            >
                                <Mastercard />
                                <span className="flex-1 text-sm font-medium text-primary">**** 4095</span>
                                <Radio on={cartao === "4095"} />
                            </button>

                            {/* Cartão 1234 (com CVC) */}
                            <div className={cx("rounded-2xl bg-primary p-4 ring-1", cartao === "1234" ? "ring-2 ring-border-brand" : "ring-border-secondary")}>
                                <button type="button" onClick={() => setCartao("1234")} className="flex w-full items-center gap-3 text-left">
                                    <Mastercard />
                                    <span className="flex-1 text-sm font-medium text-primary">**** 1234</span>
                                    <Radio on={cartao === "1234"} />
                                </button>
                                {cartao === "1234" && (
                                    <div className="mt-3 border-t border-secondary pt-3">
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <label className="text-xs font-semibold text-tertiary">CVC</label>
                                            <InfoCircle className="size-4 text-fg-quaternary" />
                                        </div>
                                        <input
                                            value={cvc}
                                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                            inputMode="numeric"
                                            placeholder="124"
                                            className="w-full rounded-lg bg-secondary px-3.5 py-2.5 text-sm text-primary ring-1 ring-border-secondary outline-none placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Novo cartão */}
                            <button
                                type="button"
                                onClick={() => setCartao("novo")}
                                className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-left ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                            >
                                <Plus className="size-5 text-fg-quaternary" />
                                <span className="flex-1 text-sm font-medium text-primary">Novo cartão de crédito</span>
                                <Radio on={cartao === "novo"} />
                            </button>
                        </div>
                    </section>

                    {/* Parcelamento */}
                    <section className="rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                        <h2 className="text-md font-bold text-primary">Selecione o parcelamento</h2>
                        <div className="mt-2 flex flex-col">
                            {parcelas.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setParcela(p.id)}
                                    className={cx(
                                        "-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 text-left transition duration-100 ease-linear",
                                        parcela === p.id && "bg-secondary",
                                    )}
                                >
                                    <Radio on={parcela === p.id} />
                                    <span className="flex flex-1 items-center gap-2">
                                        <span className="text-sm font-medium text-primary">{p.label}</span>
                                        {p.popular && <span className="rounded-full bg-primary-solid px-2 py-0.5 text-[11px] font-semibold text-white">Mais popular</span>}
                                    </span>
                                    <span className={cx("text-sm", p.right === "Sem juros" ? "text-success-primary" : "text-tertiary")}>{p.right}</span>
                                </button>
                            ))}
                        </div>
                        <button type="button" className="mt-2 flex w-full items-center justify-between px-2 py-2 text-sm font-medium text-tertiary">
                            Visualizar todas opções
                            <ChevronDown className="size-5" />
                        </button>
                    </section>

                    {/* Revise e confirme */}
                    <section className="rounded-2xl bg-primary p-4 ring-1 ring-border-secondary">
                        <h2 className="text-md font-bold text-primary">Revise e confirme</h2>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm text-tertiary">{parcelas.find((p) => p.id === parcela)?.label}</span>
                            <span className="text-sm text-secondary">{brl(totalSelecionado)}</span>
                        </div>
                        <button type="button" className="mt-2 text-sm font-semibold text-error-primary">Detalhamento do preço</button>
                        <div className="my-4 border-t border-secondary" />
                        <div className="flex items-center justify-between">
                            <span className="text-md font-bold text-primary">Total</span>
                            <span className="text-md font-bold text-primary">{brl(totalSelecionado)}</span>
                        </div>
                        <Button size="lg" color="primary" className="mt-4 w-full rounded-full" onClick={finalizar}>
                            Finalizar compra
                        </Button>
                    </section>
                </div>
            </div>
        </AppShell>
    );
}
