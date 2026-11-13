import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AlertCircle, ChevronDown, Clock, File06, Image01, InfoCircle, SwitchHorizontal01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { BarraVoltar, ControlesCarteira, TopoCarteira } from "../components/carteira-ui";
import {
    EVENTO,
    PERG,
    abrirPagamentoCarteira,
    ate,
    brl,
    cancelarNaCarteira,
    falhou as solFalhou,
    iniciarTroca,
    meus,
    mod,
    motivoTxt,
    nomeItem,
    periodo,
    pessoa,
    podeTrocar,
    tick,
    ultimaSol,
    usuario,
    useTroca,
    uuid,
    type Item,
    type Pedido,
} from "../data/troca-store";

/**
 * Carteira, página da inscrição no evento. Réplica de produção; o que é novo (aviso de troca,
 * botão Trocar e os estados da troca) segue o AFTER DS.
 */
export function Inscricoes() {
    useTroca();
    const [params] = useSearchParams();
    const [aberto, setAberto] = useState<string | null>(params.get("item"));
    const lista = meus();

    useEffect(() => {
        tick();
    }, []);

    return (
        <div className="min-h-dvh bg-primary text-sm text-primary">
            <TopoCarteira />
            <BarraVoltar titulo="Inscrição" onVoltar={() => toast.error("Fora do protótipo", { description: "A lista de eventos da carteira não faz parte desta demanda." })} />
            <div className="mx-auto max-w-[590px] px-4 pt-3 pb-24">
                <div className="mb-6 flex items-center gap-2.5">
                    <span className="size-[90px] shrink-0 rounded-lg" style={{ background: "linear-gradient(135deg,#0ea5e9,#78350f 60%,#b45309)" }} />
                    <div className="flex flex-col gap-0.5 text-xs">
                        <b className="text-sm font-semibold">{EVENTO.nome.toUpperCase()}</b>
                        <span>Dom, 14 mar • 06:00</span>
                        <span className="text-tertiary">Parque das Pedras</span>
                    </div>
                </div>

                <AvisoTroca />

                <div className="mx-1 my-2 flex items-center justify-between text-xs">
                    <b className="font-semibold">Dom, 14 mar • 06:00</b>
                    <span className="grid size-6.5 place-items-center rounded-full border border-primary">{lista.length}</span>
                </div>

                {lista.length ? (
                    lista.map(({ p, it }) => <CartaoInscricao key={it.id} p={p} it={it} aberto={aberto === it.id} onToggle={() => setAberto(aberto === it.id ? null : it.id)} />)
                ) : (
                    <div className="rounded-xl border border-secondary bg-secondary p-6 text-center">
                        <b className="font-semibold">Você ainda não tem inscrições neste evento</b>
                        <p className="text-xs text-tertiary">As inscrições compradas aparecem aqui.</p>
                    </div>
                )}
            </div>
            <ControlesCarteira />
        </div>
    );
}

/** Novo: avisa que a troca está disponível. Só aparece para quem comprou algo que pode trocar. */
function AvisoTroca() {
    const pr = periodo();
    if (pr.st === "off") return null;
    const comprador = meus().some(({ p, it }) => p.comprador === usuario() && p.origem !== "cortesia" && it.status !== "kit");
    if (!comprador) return null;
    const [t, x] =
        pr.st === "aberto"
            ? ["Você pode trocar sua inscrição", `Troque por outra modalidade deste evento até ${pr.fim}. Abra a inscrição e toque em Trocar.`]
            : pr.st === "antes"
              ? [`Trocas de inscrição a partir de ${pr.ini}`, `Você poderá trocar por outra modalidade até ${pr.fim}.`]
              : [`O período de trocas terminou em ${pr.fim}`, "Se precisar de ajuda, fale com a nossa equipe."];
    return (
        <div role="status" className={cx("mb-4 flex items-start gap-3 rounded-xl border p-4 text-xs", pr.st === "aberto" ? "border-utility-brand-200 bg-brand-primary_alt" : "border-secondary bg-secondary")}>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-brand-secondary">
                <SwitchHorizontal01 className="size-4" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5 text-secondary">
                <b className="text-sm font-semibold text-primary">{t}</b>
                <span>{x}</span>
            </div>
        </div>
    );
}

function CartaoInscricao({ p, it, aberto, onToggle }: { p: Pedido; it: Item; aberto: boolean; onToggle: () => void }) {
    const navigate = useNavigate();
    const pt = podeTrocar(p, it);
    const pend = pt.pend;
    const m = mod(it.mod)!;
    const ult = ultimaSol(it.id);
    const naoRealizada = !pend && solFalhou(ult) && !it.veioDe;
    const souComprador = p.comprador === usuario();

    const continuar = (id: string) => {
        const r = abrirPagamentoCarteira(id);
        if (!r.ok) {
            toast.error(r.tipo === "pergunta" ? `O tamanho ${r.tam} da camiseta esgotou antes do pagamento` : "A modalidade escolhida esgotou antes do pagamento", {
                description: "A troca foi cancelada e nada foi alterado.",
            });
            return;
        }
        navigate(`/carteira-web/troca/${id}/pagamento`);
    };

    return (
        <section className="mb-2.5 overflow-hidden rounded-xl border border-secondary bg-secondary">
            <button type="button" aria-expanded={aberto} onClick={onToggle} className="flex w-full items-center gap-3.5 py-3.5 pr-3.5 pl-5 text-left outline-focus-ring focus-visible:outline-2">
                <QrIcone />
                <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold">
                        {nomeItem(it)}
                        {pend ? (
                            <Badge size="sm" type="pill-color" color="warning">
                                Troca aguardando pagamento
                            </Badge>
                        ) : it.status === "kit" ? (
                            <Badge size="sm" type="pill-color" color="gray">
                                Kit retirado
                            </Badge>
                        ) : (
                            <Badge size="sm" type="pill-color" color="success">
                                Pronto para uso
                            </Badge>
                        )}
                        {it.ps.includes(usuario()) && (
                            <Badge size="sm" type="pill-color" color="gray">
                                Meu ingresso
                            </Badge>
                        )}
                        {it.veioDe && (
                            <Badge size="sm" type="pill-color" color="blue">
                                Nova inscrição
                            </Badge>
                        )}
                    </span>
                    {it.ps.map((id) => (
                        <span key={id} className="mt-1 flex items-center gap-1.5 text-[11px]">
                            <Image01 className="size-3.5" aria-hidden="true" />
                            {pessoa(id).nome.toUpperCase()}
                        </span>
                    ))}
                </span>
                <span className={cx("grid size-7 place-items-center rounded-full border border-primary bg-primary transition-transform duration-200", aberto && "rotate-180")}>
                    <ChevronDown className="size-4" aria-hidden="true" />
                </span>
            </button>

            {aberto && (
                <div className="motion-safe:animate-in border-t border-secondary px-4 pb-5 duration-200 motion-safe:fade-in">
                    <span className="mt-2.5 mb-3.5 block text-[11px] text-tertiary">{m.grupo.toUpperCase()}</span>
                    <div className="mb-4.5 flex items-center gap-3 rounded-xl border border-utility-yellow-200 bg-warning-primary p-3.5 text-xs">
                        <AlertCircle className="size-5 shrink-0 text-fg-warning-primary" aria-hidden="true" />
                        <div>
                            <b className="block font-semibold">Visualize o QR Code no celular.</b>
                            <span>Acesse esta página pelo navegador do celular ou pelo aplicativo.</span>
                        </div>
                    </div>

                    {it.ps.map((pid, i) => (
                        <div key={pid}>
                            <h4 className="mt-2.5 mb-2 text-[13px] font-semibold">Informações</h4>
                            <div className="mb-3 rounded-xl border border-secondary bg-primary p-3.5">
                                <div className="grid grid-cols-[2fr_1fr_1fr] gap-3">
                                    <Info rotulo="Titular" valor={pessoa(pid).nome.toUpperCase()} />
                                    <Info rotulo="Documento" valor={pessoa(pid).cpf} />
                                    <Info rotulo="Acesso por" valor={nomeItem(it).toUpperCase()} />
                                </div>
                                <span className="mt-2.5 block text-[11px] text-tertiary">#{uuid(p.id + it.id)}</span>
                            </div>
                            <h4 className="mt-2.5 mb-2 flex items-center gap-1.5 text-[13px] font-semibold">
                                <File06 className="size-4 text-fg-brand-secondary" aria-hidden="true" />
                                Respostas do formulário
                            </h4>
                            <div className="mb-3 divide-y divide-secondary rounded-xl border border-secondary bg-primary">
                                {m.perguntas.map((k) => (
                                    <div key={k} className="px-3.5 py-3 text-xs">
                                        <b className="block font-semibold">{PERG[k].label}</b>
                                        <span className="text-secondary">{it.resp[i]?.[k] || "Sem resposta"}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {pend ? (
                        <>
                            <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-utility-yellow-200 bg-warning-primary p-3.5 text-xs text-warning-primary">
                                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                <div>
                                    Troca para a <b className="font-semibold">{mod(pend.destino)!.nome}</b> aguardando pagamento de {brl(pend.val.total)}. Válida até {ate(pend.expira)}.
                                </div>
                            </div>
                            {souComprador ? (
                                <div className="mt-3 flex flex-wrap justify-center gap-2">
                                    <Button size="md" color="primary" onClick={() => continuar(pend.id)}>
                                        Continuar pagamento
                                    </Button>
                                    <Button
                                        size="md"
                                        color="secondary"
                                        onClick={() => {
                                            cancelarNaCarteira(pend.id);
                                            toast.success("Troca cancelada", { description: "Sua inscrição continua como está." });
                                        }}
                                    >
                                        Cancelar troca
                                    </Button>
                                </div>
                            ) : (
                                <p className="mt-2 text-center text-[11px] text-tertiary">Só quem comprou ({pessoa(p.comprador).nome}) pode pagar ou cancelar esta troca.</p>
                            )}
                        </>
                    ) : (
                        <>
                            {naoRealizada && souComprador && ult && (
                                <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-secondary bg-primary p-3.5 text-xs">
                                    <InfoCircle className="mt-0.5 size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                    <div>
                                        A troca para a <b className="font-semibold">{mod(ult.destino)!.nome}</b> não foi realizada. {motivoTxt(ult)} Sua inscrição continua a mesma.
                                    </div>
                                </div>
                            )}
                            <div className="mt-4 mb-2 flex flex-col items-center gap-1.5">
                                <Button
                                    size="md"
                                    color="secondary"
                                    iconLeading={SwitchHorizontal01}
                                    isDisabled={!pt.ok}
                                    className="min-w-45"
                                    onClick={() => {
                                        iniciarTroca(it.id);
                                        navigate(`/carteira-web/inscricoes/${it.id}/trocar`);
                                    }}
                                >
                                    Trocar
                                </Button>
                                <p className="text-center text-[11px] text-tertiary">{pt.ok ? `Troca disponível até ${(periodo() as { fim: string }).fim}` : pt.mot}</p>
                            </div>
                        </>
                    )}

                    <div className="mt-7 flex flex-col gap-2.5 text-xs text-secondary">
                        <p>Ao chegar ao evento, utilize a entrada indicada no seu ingresso.</p>
                        <p>Este ingresso está vinculado ao seu nome. Tenha um documento de identificação em mãos, caso ele seja solicitado na entrada.</p>
                        <p>
                            Em caso de dúvidas, fale com a nossa equipe.
                            <br />
                            <Button size="sm" color="link-color" onClick={() => toast.error("Fora do protótipo")}>
                                Falar com a Ingresse
                            </Button>
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}

const Info = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
    <div>
        <span className="block text-[11px] text-tertiary">{rotulo}</span>
        <b className="mt-1 block text-[13px] font-semibold">{valor}</b>
    </div>
);

const QrIcone = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="shrink-0 text-secondary">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
    </svg>
);
