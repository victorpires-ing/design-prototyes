import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { CheckCircle, Clock } from "@untitledui/icons";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BarraVoltar, ControlesCarteira, TopoCompra } from "../components/carteira-ui";
import { ResumoTroca } from "../components/resumo-troca";
import { ate, itemPorId, lote, mod, nomeItem, nomes, pagarNaCarteira, ped, sol, tempoAcabouCarteira, tick, useTroca } from "../data/troca-store";

const brlc = (v = 0) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const mmss = (ms: number) => {
    const t = Math.max(0, ms);
    return `${String(Math.floor(t / 60000)).padStart(2, "0")}:${String(Math.floor(t / 1000) % 60).padStart(2, "0")}`;
};

/** "Finalizar pedido" da carteira, com o tempo da reserva. Mesmo checkout de hoje. */
export function Pagamento() {
    useTroca();
    const { solId } = useParams();
    const navigate = useNavigate();
    const [agora, setAgora] = useState(Date.now());
    const [forma, setForma] = useState("Pix");
    const s = sol(solId);

    useEffect(() => {
        const t = setInterval(() => {
            setAgora(Date.now());
            if (tick()) {
                toast.error("O tempo acabou e a vaga foi liberada", { description: "Sua troca continua pendente. Toque em Continuar pagamento para tentar de novo." });
            }
        }, 1000);
        return () => clearInterval(t);
    }, []);

    if (!s) return <Navigate to="/carteira-web/inscricoes" replace />;
    if (s.status === "CONCLUIDA") return <Navigate to={`/carteira-web/troca/${s.id}/confirmada`} replace />;
    if (s.status !== "AGUARDANDO" || !s.reservado) return <Navigate to={`/carteira-web/inscricoes?item=${s.itemId}`} replace />;

    const p = ped(s.pedido)!;
    const it = p.itens.find((i) => i.id === s.itemId)!;
    const l = lote(mod(s.destino), s.lote)!;

    return (
        <div className="min-h-dvh bg-secondary text-primary">
            <TopoCompra />
            <BarraVoltar
                grande
                titulo="Finalizar pedido"
                onVoltar={() => navigate(`/carteira-web/inscricoes?item=${it.id}`)}
                extra={
                    <span role="timer" className="flex items-center gap-2 rounded-lg border border-utility-yellow-200 bg-warning-primary px-3 py-2 text-sm text-warning-primary">
                        <Clock className="size-4" aria-hidden="true" />
                        Tempo restante <b className="font-semibold">{mmss((s.reservaAte ?? 0) - agora)}</b>
                    </span>
                }
            />
            <div className="px-5 pt-6 pb-24">
                <div className="mx-auto grid max-w-7xl items-start gap-6 min-[1000px]:grid-cols-[1fr_450px]">
                    <section className="overflow-hidden rounded-2xl border border-secondary bg-primary">
                        <div className="border-b border-secondary px-5 py-4 font-semibold">Escolha como pagar</div>
                        <div className="flex flex-col gap-2.5 px-5 py-4">
                            <AriaRadioGroup aria-label="Forma de pagamento" value={forma} onChange={setForma} className="flex flex-col gap-2.5">
                                {["Pix", "Cartão de crédito"].map((o) => (
                                    <AriaRadio key={o} value={o} className={({ isSelected }) => cx("flex cursor-pointer items-center justify-between rounded-xl p-3.5 ring-1 ring-border-secondary ring-inset", isSelected && "bg-secondary ring-2 ring-brand")}>
                                        {({ isSelected, isFocusVisible }) => (
                                            <>
                                                <b className="font-semibold">{o}</b>
                                                <RadioButtonBase size="md" isSelected={isSelected} isFocusVisible={isFocusVisible} />
                                            </>
                                        )}
                                    </AriaRadio>
                                ))}
                            </AriaRadioGroup>
                            <p className="text-xs text-tertiary">Boleto não está disponível para trocas.</p>
                            <p className="text-xs text-tertiary">Sua vaga fica reservada enquanto o tempo corre. Se o tempo acabar, a vaga é liberada e você pode tentar de novo até {ate(s.expira)}.</p>
                        </div>
                    </section>
                    <aside className="overflow-hidden rounded-2xl border border-secondary bg-primary">
                        <div className="border-b border-secondary px-5 py-4 font-semibold">Troca de inscrição</div>
                        <div className="flex flex-col gap-2 px-5 py-4">
                            <p className="text-sm text-tertiary">{nomes(it)}</p>
                            <p className="font-semibold">
                                De {nomeItem(it)} para {mod(s.destino)!.nome}, {l.nome}
                            </p>
                            <ResumoTroca pago={it.pago} taxa={it.taxa} lote={l} f={s.val} />
                            <Button
                                size="lg"
                                color="primary"
                                className="mt-2 w-full"
                                onClick={() => {
                                    pagarNaCarteira(s.id);
                                    navigate(`/carteira-web/troca/${s.id}/confirmada`);
                                }}
                            >
                                Pagar {brlc(s.val.total)}
                            </Button>
                        </div>
                    </aside>
                </div>
            </div>
            <ControlesCarteira
                extras={
                    <Button size="sm" color="secondary" onClick={() => tempoAcabouCarteira(s.id)}>
                        Passar 15 minutos
                    </Button>
                }
            />
        </div>
    );
}

/** Troca confirmada na carteira. */
export function TrocaConfirmada() {
    useTroca();
    const { solId } = useParams();
    const navigate = useNavigate();
    const s = sol(solId);
    if (!s || s.status !== "CONCLUIDA") return <Navigate to="/carteira-web/inscricoes" replace />;
    const nv = itemPorId(s.novo)!.it;
    return (
        <div className="min-h-dvh bg-secondary text-primary">
            <TopoCompra />
            <div className="px-5 py-10">
                <section className="mx-auto flex max-w-[732px] animate-in flex-col items-center rounded-2xl border border-secondary bg-primary px-6 py-10 text-center duration-200 fade-in zoom-in-95">
                    <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
                    <h1 className="mt-4 text-display-xs font-bold">Troca confirmada!</h1>
                    <p className="mt-2 max-w-md text-md text-tertiary">
                        {nomes(nv)} agora está na {mod(s.destino)!.nome}. A nova inscrição já está na sua carteira, e a anterior não vale mais.
                    </p>
                    <Button size="lg" color="primary" className="mt-6" onClick={() => navigate(`/carteira-web/inscricoes?item=${nv.id}`)}>
                        Ver na carteira
                    </Button>
                </section>
            </div>
            <ControlesCarteira />
        </div>
    );
}
