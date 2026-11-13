import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { ChevronDown, File06, HelpCircle, InfoCircle } from "@untitledui/icons";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { cx } from "@/utils/cx";
import { BarraVoltar, ControlesCarteira, Etapas, Recolhivel, TopoCompra, brlc, useTopoAoEntrar } from "../components/carteira-ui";
import { ResumoTroca } from "../components/resumo-troca";
import { EVENTO, W, calc, escolherNaCarteira, itemPorId, mod, nomeItem, opcoes, periodo, podeTrocar, prepararPerguntas, tocar, ultimoLote, useTroca, vagas, type Opcao } from "../data/troca-store";

/**
 * Escolha da nova inscrição no modelo da seleção de itens do fluxo de compra: data e horário,
 * grupos que abrem e fecham e, dentro deles, as inscrições com lote ativo, preço e o valor a cobrar.
 */
export function Trocar() {
    useTroca();
    const { itemId } = useParams();
    useTopoAoEntrar(itemId);
    const navigate = useNavigate();
    const x = itemPorId(itemId);
    const [fechados, setFechados] = useState<Set<string>>(new Set());

    if (!x || !podeTrocar(x.p, x.it).ok) return <Navigate to="/carteira-web/inscricoes" replace />;
    if (W.item !== itemId) {
        W.item = itemId;
        W.dest = null;
        W.aceite = false;
    }
    const { it } = x;
    const ops = opcoes(it, "carteira");
    const grupos = [...new Set(ops.map((o) => o.m.grupo))];
    const l = W.dest ? ultimoLote(mod(W.dest)) : null;
    const f = l ? calc(it.pago, it.taxa, l.valor) : null;
    const pr = periodo();
    const podeContinuar = !!f && !(f.down && !W.aceite);
    const continuar = () => {
        prepararPerguntas();
        navigate(`/carteira-web/inscricoes/${it.id}/trocar/perguntas`);
    };
    const ajuda = (
        <>
            <Button size="md" color="secondary" iconTrailing={HelpCircle} onClick={() => toast.error("Fora do protótipo")} className="max-md:hidden">
                Preciso de ajuda
            </Button>
            <ButtonUtility size="sm" color="secondary" icon={HelpCircle} tooltip="Preciso de ajuda" onClick={() => toast.error("Fora do protótipo")} className="md:hidden" />
        </>
    );

    return (
        <div className="min-h-dvh bg-secondary text-primary">
            <TopoCompra />
            <BarraVoltar grande titulo={EVENTO.nome.toUpperCase()} onVoltar={() => navigate(`/carteira-web/inscricoes?item=${it.id}`)} extra={ajuda} />
            <div className="px-4 pt-6 pb-36 md:px-5 min-[1000px]:pb-16">
                <div className="mx-auto grid max-w-7xl gap-6 min-[1000px]:grid-cols-[1fr_420px]">
                    <div className="flex flex-col gap-5">
                        <Etapas atual={1} />
                        <div>
                            <h1 className="text-display-xs font-bold">Escolha a nova inscrição</h1>
                            {/* Uma sessão só: data e horário são informação, não escolha. */}
                            <p className="mt-1 text-md text-tertiary">{EVENTO.sessao.replace("às 06:00", "às 06h00")}</p>
                        </div>

                        <AriaRadioGroup aria-label="Nova inscrição" value={W.dest ?? null} onChange={escolherNaCarteira} className="flex flex-col gap-3">
                            {grupos.map((g) => {
                                const aberto = !fechados.has(g);
                                return (
                                    <section key={g} className="overflow-hidden rounded-2xl border border-secondary bg-primary">
                                        <button
                                            type="button"
                                            aria-expanded={aberto}
                                            onClick={() => {
                                                const n = new Set(fechados);
                                                if (aberto) n.add(g);
                                                else n.delete(g);
                                                setFechados(n);
                                            }}
                                            className="flex min-h-14 w-full items-center gap-3 px-5 py-4 text-left hover:bg-primary_hover"
                                        >
                                            <QrIcone />
                                            <span className="flex-1 text-lg font-semibold">{g}</span>
                                            <ChevronDown className={cx("size-6 text-fg-brand-secondary transition-transform duration-200", aberto && "rotate-180")} aria-hidden="true" />
                                        </button>
                                        <Recolhivel aberto={aberto} className="divide-y divide-secondary border-t border-secondary">
                                            {ops
                                                .filter((o) => o.m.grupo === g)
                                                .map((o) => (
                                                    <LinhaOpcao key={o.m.id} o={o} pago={it.pago} taxa={it.taxa} />
                                                ))}
                                        </Recolhivel>
                                    </section>
                                );
                            })}
                        </AriaRadioGroup>
                    </div>

                    <aside className="flex flex-col gap-4 min-[1000px]:sticky min-[1000px]:top-6 min-[1000px]:self-start">
                        <Button size="lg" color="secondary" iconLeading={File06} onClick={() => toast.error("Fora do protótipo")}>
                            Adicionar código ou cupom
                        </Button>
                        <section id="resumo-troca" className="overflow-hidden rounded-2xl border border-secondary bg-primary">
                            <div className="border-b border-secondary px-5 py-4 font-semibold">Resumo da troca</div>
                            <div className="flex flex-col gap-3 px-5 py-4">
                                {f && l && W.dest ? (
                                    <>
                                        <p className="font-semibold">
                                            De {nomeItem(it)} para {mod(W.dest)!.nome}
                                        </p>
                                        <ResumoTroca pago={it.pago} taxa={it.taxa} lote={l} f={f} />
                                        {f.down && (
                                            <div className="flex flex-col gap-2 rounded-xl border border-utility-yellow-200 bg-warning-primary p-3.5 text-sm text-warning-primary">
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
                                        <Button size="lg" color="primary" className="w-full max-[999px]:hidden" isDisabled={!podeContinuar} onClick={continuar}>
                                            Continuar
                                        </Button>
                                        <p className="text-center text-xs text-tertiary">A troca só acontece depois do pagamento.</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="text-tertiary">Sua inscrição atual</span>
                                            <span className="font-semibold">
                                                {nomeItem(it)}, {brlc(it.pago)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-tertiary">Escolha a nova inscrição para ver quanto será cobrado.</p>
                                    </>
                                )}
                                {pr.st === "aberto" && <p className="text-xs text-tertiary">Trocas disponíveis até {pr.fim}.</p>}
                            </div>
                        </section>
                        <div className="aspect-video w-full rounded-2xl max-[999px]:hidden" style={{ background: "linear-gradient(135deg,#0ea5e9,#78350f 60%,#b45309)" }} role="img" aria-label={`Banner do evento ${EVENTO.nome}`} />
                    </aside>
                </div>
            </div>

            {/* Celular: total e Continuar ao alcance do polegar, como no fluxo de compra */}
            <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-secondary bg-primary px-4 py-3 min-[1000px]:hidden">
                <div className="min-w-0 flex-1">
                    {f ? (
                        <>
                            <b className="block text-lg font-semibold">{brlc(f.total)}</b>
                            <button type="button" className="text-sm text-tertiary underline" onClick={() => document.getElementById("resumo-troca")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                                Ver detalhes da cobrança
                            </button>
                        </>
                    ) : (
                        <span className="text-sm text-tertiary">Escolha a nova inscrição</span>
                    )}
                </div>
                <Button size="lg" color="primary" isDisabled={!podeContinuar} onClick={continuar}>
                    Continuar
                </Button>
            </div>
            <ControlesCarteira />
        </div>
    );
}

/** Uma inscrição dentro do grupo: nome, lote ativo, preço, valor a cobrar e seleção; Detalhes mostra os lotes. */
function LinhaOpcao({ o, pago, taxa }: { o: Opcao; pago: number; taxa: number }) {
    const [detalhes, setDetalhes] = useState(false);
    const esgotada = !!o.motivo;
    const motivo = esgotada ? "" : (o.e ?? []).map((x) => x.msg).join(" ");
    const preco = o.l.valor > pago ? "Mais caro" : o.l.valor < pago ? "Mais barato" : "Mesmo valor";
    const f = calc(pago, taxa, o.l.valor);

    return (
        <div>
            <div onClick={() => o.off && toast.error(esgotada ? "Inscrição esgotada" : "Troca não permitida", { description: esgotada ? `${o.m.nome} não tem mais vagas.` : motivo })}>
                <AriaRadio
                    value={o.m.id}
                    isDisabled={o.off}
                    className={({ isSelected, isDisabled, isFocusVisible }) =>
                        cx(
                            "relative flex cursor-pointer items-center gap-4 px-5 py-4 transition duration-100 ease-linear hover:bg-primary_hover",
                            isSelected && "bg-brand-primary_alt hover:bg-brand-primary_alt",
                            isFocusVisible && "outline-2 -outline-offset-2 outline-focus-ring",
                            isDisabled && "cursor-not-allowed hover:bg-transparent",
                        )
                    }
                >
                    {({ isSelected, isDisabled, isFocusVisible }) => (
                        <>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className={cx("flex flex-wrap items-center gap-1.5 text-lg font-semibold", isDisabled && "text-tertiary")}>
                                    {o.m.nome}
                                    {esgotada ? (
                                        <Badge size="sm" type="color" color="gray">
                                            Esgotado
                                        </Badge>
                                    ) : (
                                        !o.off && (
                                            <Badge size="sm" type="color" color={preco === "Mais caro" ? "warning" : preco === "Mais barato" ? "success" : "gray"}>
                                                {preco}
                                            </Badge>
                                        )
                                    )}
                                </span>
                                <span className="text-md text-tertiary">{esgotada ? "Todos os lotes esgotados" : o.l.nome}</span>
                                <span className={cx("text-md", isDisabled ? "text-tertiary" : "text-primary")}>
                                    <b className="font-semibold">{brlc(o.l.valor)}</b>
                                    {!o.off && <span className="text-tertiary">{f.total ? `, ${brlc(f.total)} a cobrar na troca` : ", sem cobrança na troca"}</span>}
                                </span>
                                {motivo && (
                                    <span className="mt-1 flex gap-1.5 text-sm text-tertiary">
                                        <InfoCircle className="mt-0.5 size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                        {motivo}
                                    </span>
                                )}
                            </span>
                            <RadioButtonBase size="md" isSelected={isSelected} isDisabled={isDisabled} isFocusVisible={isFocusVisible} />
                        </>
                    )}
                </AriaRadio>
            </div>
            <button
                type="button"
                aria-expanded={detalhes}
                onClick={() => setDetalhes((d) => !d)}
                className="flex min-h-11 w-full items-center justify-between px-5 py-2 text-sm text-secondary hover:bg-primary_hover"
            >
                Detalhes
                <ChevronDown className={cx("size-5 text-fg-brand-secondary transition-transform duration-200", detalhes && "rotate-180")} aria-hidden="true" />
            </button>
            <Recolhivel aberto={detalhes} className="px-5 pb-3">
                <ul>
                    {o.m.lotes.map((l) => {
                        const ativo = !esgotada && l.id === o.l.id;
                        const estado = ativo ? "Lote ativo" : vagas(l) <= 0 ? "Esgotado" : !l.ativo ? "Encerrado" : "Indisponível para troca";
                        return (
                            <li key={l.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                                <span className={cx("flex items-center gap-1.5", ativo ? "text-primary" : "text-tertiary")}>
                                    {l.nome}
                                    <Badge size="sm" type="color" color={ativo ? "success" : "gray"}>
                                        {estado}
                                    </Badge>
                                </span>
                                <span className={ativo ? "font-semibold text-primary" : "text-tertiary"}>{brlc(l.valor)}</span>
                            </li>
                        );
                    })}
                    <li className="pt-1.5 text-xs text-tertiary">Só o lote ativo pode ser escolhido na troca.</li>
                </ul>
            </Recolhivel>
        </div>
    );
}

const QrIcone = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="shrink-0 text-fg-brand-secondary">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
    </svg>
);
