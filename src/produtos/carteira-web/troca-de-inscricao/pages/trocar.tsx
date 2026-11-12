import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { AlertCircle, Bank, Calendar, ChevronDown, File06 } from "@untitledui/icons";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { cx } from "@/utils/cx";
import { BarraVoltar, ControlesCarteira, TopoCompra } from "../components/carteira-ui";
import { ResumoTroca } from "../components/resumo-troca";
import { EVENTO, W, calc, escolherNaCarteira, itemPorId, mod, nomeItem, opcoes, periodo, podeTrocar, prepararPerguntas, tocar, ultimoLote, useTroca, type Opcao } from "../data/troca-store";

const brlc = (v = 0) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * "Trocar ingresso": mesmo layout do carrinho atual da carteira. Novo: indisponíveis com
 * motivo explícito e o card "Resumo da troca" com o aceite da inscrição mais barata.
 */
export function Trocar() {
    useTroca();
    const { itemId } = useParams();
    const navigate = useNavigate();
    const [fechados, setFechados] = useState<Set<string>>(new Set());
    const x = itemPorId(itemId);

    if (!x || !podeTrocar(x.p, x.it).ok) return <Navigate to="/carteira-web/inscricoes" replace />;
    if (W.item !== itemId) {
        W.item = itemId;
        W.dest = null;
        W.aceite = false;
    }
    const { it } = x;
    const m0 = mod(it.mod)!;
    const ops = opcoes(it, "carteira");
    const grupos = [...new Set(ops.map((o) => o.m.grupo))];
    const l = W.dest ? ultimoLote(mod(W.dest)) : null;
    const f = l ? calc(it.pago, it.taxa, l.valor) : null;
    const pr = periodo();

    return (
        <div className="min-h-dvh bg-secondary text-primary">
            <TopoCompra />
            <BarraVoltar grande titulo="Trocar ingresso" onVoltar={() => navigate(`/carteira-web/inscricoes?item=${it.id}`)} />
            <div className="px-5 pt-6 pb-28">
                <div className="mx-auto grid max-w-7xl gap-6 min-[1000px]:grid-cols-[1fr_450px]">
                    <div>
                        <span className="block text-md">Domingo</span>
                        <b className="mt-1 mb-5 block text-display-xs font-semibold">14 de março de 2027 às 06:00</b>
                        {grupos.map((g) => {
                            const aberto = !fechados.has(g);
                            return (
                                <section key={g} className="mb-5 overflow-hidden rounded-2xl border border-secondary bg-primary">
                                    <button
                                        type="button"
                                        aria-expanded={aberto}
                                        onClick={() => {
                                            const n = new Set(fechados);
                                            if (aberto) n.add(g);
                                            else n.delete(g);
                                            setFechados(n);
                                        }}
                                        className="flex w-full items-center justify-between border-b border-secondary px-4.5 py-7 text-lg font-bold"
                                    >
                                        {g.toUpperCase()}
                                        <ChevronDown className={cx("size-5 transition-transform duration-200", aberto && "rotate-180")} aria-hidden="true" />
                                    </button>
                                    {aberto && (
                                        <AriaRadioGroup aria-label={`Inscrições de ${g}`} value={W.dest ?? null} onChange={escolherNaCarteira}>
                                            {ops
                                                .filter((o) => o.m.grupo === g)
                                                .map((o) => (
                                                    <Linha key={o.m.id} o={o} pago={it.pago} />
                                                ))}
                                        </AriaRadioGroup>
                                    )}
                                </section>
                            );
                        })}
                    </div>

                    <aside className="flex flex-col gap-4">
                        <section className="overflow-hidden rounded-2xl border border-secondary bg-primary">
                            <div className="border-b border-secondary px-5 py-4 font-semibold">Detalhes do seu ingresso atual</div>
                            <div className="flex gap-3 px-5 py-4">
                                <span className="size-16 shrink-0 rounded-lg" style={{ background: "linear-gradient(135deg,#0ea5e9,#78350f 60%,#b45309)" }} />
                                <div className="flex min-w-0 flex-col text-sm">
                                    <b className="truncate font-semibold">{EVENTO.nome.toUpperCase()}</b>
                                    <span>{m0.grupo.toUpperCase()}</span>
                                    <span className="text-tertiary">{nomeItem(it)}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 border-t border-secondary px-5 py-4 text-sm">
                                <div>
                                    <span className="text-tertiary">Data do evento</span>
                                    <b className="mt-1 flex items-center gap-1.5 font-semibold">
                                        <Calendar className="size-4" aria-hidden="true" /> 14 mar 2027
                                    </b>
                                </div>
                                <div>
                                    <span className="text-tertiary">Valor do ingresso</span>
                                    <b className="mt-1 flex items-center gap-1.5 font-semibold">
                                        <Bank className="size-4" aria-hidden="true" /> {brlc(it.pago)}
                                    </b>
                                </div>
                            </div>
                        </section>
                        <Button size="lg" color="secondary" iconLeading={File06} onClick={() => toast.error("Fora do protótipo")}>
                            Adicionar código ou cupom
                        </Button>

                        <section className="animate-in overflow-hidden rounded-2xl border border-secondary bg-primary duration-200 fade-in">
                            <div className="border-b border-secondary px-5 py-4 font-semibold">Resumo da troca</div>
                            <div className="flex flex-col gap-3 px-5 py-4">
                                {f && l && W.dest ? (
                                    <>
                                        <p className="font-semibold">
                                            De {nomeItem(it)} para {mod(W.dest)!.nome}
                                        </p>
                                        <ResumoTroca pago={it.pago} taxa={it.taxa} lote={l} f={f} />
                                        {f.down && (
                                            <div className="flex animate-in flex-col gap-2 rounded-xl border border-utility-yellow-200 bg-warning-primary p-3.5 text-sm text-warning-primary duration-200 fade-in">
                                                <span>
                                                    A nova inscrição é mais barata. <b className="font-semibold">A diferença não é devolvida.</b>
                                                </span>
                                                <Checkbox
                                                    isSelected={W.aceite}
                                                    onChange={(v) => {
                                                        W.aceite = v;
                                                        tocar();
                                                    }}
                                                    label="Estou ciente e quero continuar."
                                                />
                                            </div>
                                        )}
                                        <Button
                                            size="lg"
                                            color="primary"
                                            className="w-full"
                                            isDisabled={f.down && !W.aceite}
                                            onClick={() => {
                                                prepararPerguntas();
                                                navigate(`/carteira-web/inscricoes/${it.id}/trocar/perguntas`);
                                            }}
                                        >
                                            Continuar
                                        </Button>
                                        <p className="text-center text-xs text-tertiary">A troca só acontece depois do pagamento.</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-tertiary">Escolha a nova inscrição para ver quanto será cobrado.</p>
                                )}
                                {pr.st === "aberto" && <p className="text-xs text-tertiary">Trocas disponíveis até {pr.fim}.</p>}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
            <ControlesCarteira />
        </div>
    );
}

function Linha({ o, pago }: { o: Opcao; pago: number }) {
    const motivo = o.motivo ?? (o.e ?? []).map((x) => x.msg).join(" ");
    const preco = o.l.valor > pago ? "Mais caro" : o.l.valor < pago ? "Mais barato" : "Mesmo valor";
    return (
        <div onClick={() => o.off && toast.error("Troca não permitida", { description: motivo })}>
            <AriaRadio
                value={o.m.id}
                isDisabled={o.off}
                className={({ isSelected, isDisabled }) =>
                    cx(
                        "flex cursor-pointer items-center gap-4 border-b border-secondary p-5.5 transition duration-100 ease-linear last:border-b-0 hover:bg-primary_hover",
                        isSelected && "bg-secondary",
                        isDisabled && "cursor-not-allowed hover:bg-transparent",
                    )
                }
            >
                {({ isSelected, isDisabled, isFocusVisible }) => (
                    <>
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className={cx("flex flex-wrap items-center gap-1.5 text-md font-semibold", isDisabled && "text-tertiary")}>
                                {o.m.nome}
                                {!o.off && (
                                    <Badge size="sm" type="color" color={preco === "Mais caro" ? "warning" : preco === "Mais barato" ? "success" : "gray"}>
                                        {preco}
                                    </Badge>
                                )}
                            </span>
                            <span className="text-sm text-tertiary">{o.l.nome}</span>
                            <b className={cx("text-md font-semibold", isDisabled && "text-tertiary")}>{brlc(o.l.valor)}</b>
                            {o.off && (
                                <span className="flex gap-1.5 text-sm text-error-primary">
                                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    {motivo}
                                </span>
                            )}
                        </span>
                        <RadioButtonBase size="md" isSelected={isSelected} isDisabled={isDisabled} isFocusVisible={isFocusVisible} />
                    </>
                )}
            </AriaRadio>
        </div>
    );
}
