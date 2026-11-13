import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowLeft, ChevronDown, Copy01, LinkExternal01, Mail01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { Aviso } from "../components/aviso";
import { CartaoItem } from "../components/cartao-item";
import { ControlesPrototipo } from "../components/controles-prototipo";
import { ModalTrocarInscricao } from "../components/modal-trocar-inscricao";
import {
    MSG_STATUS,
    alterados,
    ate,
    brl,
    calc,
    cancelarNoBackstage,
    descartarRascunho,
    desfazer,
    editavel,
    encerrado,
    escolherDestino,
    evDoPed,
    expirarPendentes,
    faltas,
    hora,
    ped,
    perfil,
    pessoa,
    rascunho,
    reenviar,
    refazer,
    reprocessar,
    sol,
    solsPend,
    taxaPed,
    tick,
    tocar,
    ultimoLote,
    useTroca,
    uuid,
    valorPed,
    type Pedido as TPedido,
} from "../data/troca-store";
import { StatusBadge } from "./pedidos";

export function Pedido() {
    useTroca();
    const { id } = useParams();
    const navigate = useNavigate();
    const p = ped(id);
    const [modalItem, setModalItem] = useState<string | null>(null);
    const [confirmaSair, setConfirmaSair] = useState(false);
    const [confirmaCancelar, setConfirmaCancelar] = useState(false);

    // Abre no topo: a lista de pedidos pode estar rolada.
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }, [id]);

    // Libera reservas e expira links enquanto a tela está aberta.
    useEffect(() => {
        tick();
        const t = setInterval(tick, 5000);
        return () => clearInterval(t);
    }, []);

    if (!p) {
        return (
            <BackstageLayout showEventContext={false} showLayoutSwitcher={false} activeProducer="pedidos">
                <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
                    <p className="text-lg font-semibold text-primary">Pedido não encontrado</p>
                    <Button color="secondary" onClick={() => navigate("/backstage/troca-de-inscricao")}>
                        Voltar para Pedidos
                    </Button>
                </div>
            </BackstageLayout>
        );
    }

    const D = rascunho(p.id);
    const ed = editavel(p);
    const c = pessoa(p.comprador);
    const e = evDoPed(p);
    const pend = solsPend(p.id);
    const ativos = p.itens.filter((i) => i.status !== "trocado");
    const alt = alterados(p);
    const itemModal = modalItem ? p.itens.find((i) => i.id === modalItem) ?? null : null;

    const sair = () => {
        if (alt.length) return setConfirmaSair(true);
        descartarRascunho(p.id);
        navigate("/backstage/troca-de-inscricao");
    };
    // Só rola se o cartão saiu da vista; se a pessoa já está nele, a tela fica onde está.
    const rolarAte = (itId: string) =>
        setTimeout(() => {
            const el = document.getElementById(`item-${itId}`);
            if (!el) return;
            const r = el.getBoundingClientRect();
            if (r.top < 0 || r.top > window.innerHeight - 120) el.scrollIntoView({ block: "start", behavior: "smooth" });
        }, 60);

    const revisar = () => {
        D.tentou = true;
        if (faltas(p)) {
            tocar();
            toast.error("Falta responder", { description: "Preencha as perguntas obrigatórias em vermelho." });
            setTimeout(() => document.querySelector("[data-invalid]")?.scrollIntoView({ block: "center", behavior: "smooth" }), 60);
            return;
        }
        navigate(`/backstage/troca-de-inscricao/${p.id}/revisar`);
    };

    return (
        <BackstageLayout showEventContext={false} showLayoutSwitcher={false} activeProducer="pedidos">
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <header className="flex items-start gap-3">
                    <ButtonUtility size="sm" color="secondary" icon={ArrowLeft} tooltip="Voltar para Pedidos" onClick={sair} />
                    <div className="flex flex-1 flex-col gap-1">
                        <h1 className="text-display-xs font-bold text-primary">Pedido</h1>
                        <p className="text-md text-tertiary">{e.nome}</p>
                    </div>
                    <StatusBadge p={p} />
                </header>

                <AlertaDoPedido p={p} onCancelar={() => setConfirmaCancelar(true)} />

                <section aria-labelledby="dados-h" className="flex flex-col gap-5 rounded-xl bg-primary p-5 ring-1 ring-border-secondary md:p-6">
                    <h2 id="dados-h" className="text-lg font-semibold text-primary">
                        Dados do pedido
                    </h2>
                    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Dado rotulo="ID do pedido" className="sm:col-span-2 lg:col-span-3">
                            <span className="flex items-center gap-1">
                                <span className="font-mono text-sm break-all">{uuid(p.id)}</span>
                                <ButtonUtility size="xs" color="tertiary" icon={Copy01} tooltip="Copiar ID" onClick={() => toast.success("ID copiado")} />
                            </span>
                        </Dado>
                        <Dado rotulo="Data da compra">{p.data}</Dado>
                        <Dado rotulo="Comprador">{c.nome}</Dado>
                        <Dado rotulo="CPF do comprador">{c.cpf}</Dado>
                        <Dado rotulo="E-mail do comprador">{c.email}</Dado>
                        <Dado rotulo="Telefone do comprador">{c.tel}</Dado>
                        <Dado rotulo="Canal">{p.grupo ? `Compra em grupo, ${p.grupo}` : p.canal}</Dado>
                        <Dado rotulo="Forma de pagamento">{p.pagamento}</Dado>
                        <Dado rotulo="Cupom">{p.cupom ?? "Nenhum"}</Dado>
                        <Dado rotulo="Valor das inscrições">{brl(valorPed(p))}</Dado>
                        <Dado rotulo="Taxa de serviço">{brl(taxaPed(p))}</Dado>
                        <Dado rotulo="Evento">{e.nome}</Dado>
                    </dl>
                </section>

                {ativos.map((it) => (
                    <CartaoItem
                        key={it.id}
                        p={p}
                        it={it}
                        ed={ed}
                        onTrocar={setModalItem}
                        onDesfazer={(itId) => desfazer(p.id, itId)}
                        onRefazer={(itId, solId) => {
                            const item = p.itens.find((i) => i.id === itId)!;
                            const s = sol(solId)!;
                            if (!refazer(p.id, item, s)) {
                                toast.error("Essa inscrição não está disponível agora", { description: "Escolha outra inscrição para refazer a troca." });
                                setModalItem(itId);
                                return;
                            }
                            rolarAte(itId);
                        }}
                    />
                ))}

                <Historico p={p} />

                {ed && (
                    <div className="sticky bottom-16 z-30 rounded-xl bg-primary px-4 py-3 shadow-lg ring-1 ring-border-secondary">
                        <BarraAcoes p={p} onDescartar={() => descartarRascunho(p.id)} onRevisar={revisar} />
                    </div>
                )}
            </div>

            <ModalTrocarInscricao
                item={itemModal}
                selecionado={itemModal ? D.itens[itemModal.id]?.dest ?? null : null}
                onClose={() => setModalItem(null)}
                onEscolher={(dest) => {
                    escolherDestino(p.id, itemModal!, dest);
                    setModalItem(null);
                    rolarAte(itemModal!.id);
                }}
            />

            <Confirmacao
                aberto={confirmaSair}
                titulo="Descartar as alterações?"
                texto="O que você mudou neste pedido ainda não foi salvo."
                manter="Continuar editando"
                acao="Descartar"
                onClose={() => setConfirmaSair(false)}
                onConfirm={() => {
                    descartarRascunho(p.id);
                    navigate("/backstage/troca-de-inscricao");
                }}
            />
            <Confirmacao
                aberto={confirmaCancelar}
                titulo="Cancelar a troca?"
                texto="O link deixa de funcionar e o comprador é avisado por e-mail. As inscrições continuam como estavam."
                manter="Manter troca"
                acao="Cancelar troca"
                onClose={() => setConfirmaCancelar(false)}
                onConfirm={() => {
                    cancelarNoBackstage(p.id);
                    setConfirmaCancelar(false);
                    toast.success("Troca cancelada", { description: "O comprador foi avisado por e-mail." });
                }}
            />

            <ControlesPrototipo
                extras={
                    <Button
                        size="sm"
                        color="secondary"
                        onClick={() => {
                            if (!expirarPendentes(p.id)) return toast.error("Não há troca aguardando pagamento neste pedido");
                            toast.success("Link expirado", { description: "Veja o motivo no item." });
                        }}
                    >
                        Expirar o link deste pedido
                    </Button>
                }
            />
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */

function AlertaDoPedido({ p, onCancelar }: { p: TPedido; onCancelar: () => void }) {
    const pend = solsPend(p.id);
    const pf = perfil();
    if (pend.length) {
        const falha = pend.find((s) => s.status === "FALHA");
        if (falha)
            return (
                <Aviso
                    cor="error"
                    titulo="Pagamento recebido, troca não finalizada"
                    acoes={
                        pf.repro && (
                            <Button size="sm" color="primary" onClick={() => reprocessar(p.id)}>
                                Reprocessar
                            </Button>
                        )
                    }
                >
                    Houve um erro técnico ao finalizar. {pf.repro ? "" : "Peça a um Admin Ingresse para reprocessar."}
                </Aviso>
            );
        if (pend.some((s) => s.status === "PROCESSANDO")) return <Aviso titulo="Pagamento recebido">Finalizando a troca.</Aviso>;
        const ag = pend.filter((s) => s.status === "AGUARDANDO");
        const s = ag[0];
        const tot = ag.reduce((a, x) => a + x.val.total, 0);
        const c = pessoa(p.comprador);
        const res = ag.find((x) => x.reservado && x.reservaAte);
        return (
            <Aviso
                cor="warning"
                titulo={`Troca aguardando pagamento de ${brl(tot)}`}
                acoes={
                    pf.pode && (
                        <>
                            <Button size="sm" color="secondary" iconLeading={Copy01} onClick={() => toast.success("Link copiado", { description: "Envie pelo canal do atendimento." })}>
                                Copiar link
                            </Button>
                            <Button
                                size="sm"
                                color="secondary"
                                iconLeading={Mail01}
                                onClick={() => {
                                    reenviar(s.id);
                                    toast.success("E-mail reenviado", { description: c.email });
                                }}
                            >
                                Reenviar e-mail
                            </Button>
                            <Button size="sm" color="secondary" iconLeading={LinkExternal01} href={`/troca/link/${s.id}`} target="_blank">
                                Abrir link
                            </Button>
                            <Button size="sm" color="tertiary" onClick={onCancelar}>
                                Cancelar troca
                            </Button>
                        </>
                    )
                }
            >
                Link enviado para {c.nome}, {c.email}. Válido até {ate(s.expira)}.
                {res && (
                    <>
                        {" "}
                        <b className="font-semibold text-secondary">O comprador está pagando agora</b>, com a vaga reservada até {hora(res.reservaAte!)}.
                    </>
                )}{" "}
                Os valores estão detalhados no item.
            </Aviso>
        );
    }
    const msg = MSG_STATUS[p.status];
    if (msg) return <Aviso cor="warning" titulo={msg[0]}>{msg[1]}</Aviso>;
    if (p.origem === "cortesia") return <Aviso cor="warning" titulo="Cortesia">Itens de cortesia não podem ser trocados nem editados.</Aviso>;
    if (p.org !== "pedras") return <Aviso cor="warning" titulo="Evento fora do AWA">Este pedido só pode ser consultado.</Aviso>;
    if (encerrado()) return <Aviso cor="warning" titulo="Evento encerrado">Este pedido não pode mais ser editado.</Aviso>;
    if (!pf.pode) return <Aviso titulo="Somente consulta">Seu perfil não pode editar pedidos.</Aviso>;
    return null;
}

function BarraAcoes({ p, onDescartar, onRevisar }: { p: TPedido; onDescartar: () => void; onRevisar: () => void }) {
    const alt = alterados(p);
    const tr = alt.filter((a) => a.m.dest);
    const fl = faltas(p);
    const total = tr.reduce((a, { it, m }) => a + calc(it.pago, it.taxa, ultimoLote(m.dest!)!.valor).total, 0);
    return (
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-3">
            <p className="mr-auto text-sm text-tertiary" aria-live="polite">
                {!alt.length ? (
                    "Nenhuma alteração ainda."
                ) : (
                    <>
                        <b className="font-semibold text-primary">
                            {alt.length} {alt.length > 1 ? "itens alterados" : "item alterado"}
                        </b>
                        {tr.length ? (
                            <>
                                , {tr.length} {tr.length > 1 ? "trocas" : "troca"} e <b className="font-semibold text-primary">{brl(total)}</b> a cobrar
                            </>
                        ) : (
                            ", só respostas"
                        )}
                    </>
                )}
            </p>
            {fl > 0 && (
                <span className="flex items-center gap-1 text-sm text-error-primary">
                    <AlertCircle className="size-4" aria-hidden="true" />
                    Responda {fl} {fl > 1 ? "perguntas obrigatórias" : "pergunta obrigatória"} para continuar
                </span>
            )}
            {alt.length > 0 && (
                <Button size="md" color="secondary" onClick={onDescartar}>
                    Descartar
                </Button>
            )}
            <Button size="md" color="primary" isDisabled={!alt.length || fl > 0} onClick={onRevisar}>
                Revisar alterações
            </Button>
        </div>
    );
}

function Historico({ p }: { p: TPedido }) {
    const S = useTroca();
    const [aberto, setAberto] = useState(false);
    const linhas = (S.hist[p.id] ?? [[p.data, "Pedido criado."]]).slice().reverse();
    return (
        <section className="rounded-xl bg-primary p-5 ring-1 ring-border-secondary md:p-6">
            <button type="button" aria-expanded={aberto} onClick={() => setAberto((a) => !a)} className="flex w-full items-center justify-between text-left">
                <h2 className="text-lg font-semibold text-primary">Histórico do pedido</h2>
                <ChevronDown className={cx("size-5 text-fg-quaternary transition-transform", aberto && "rotate-180")} aria-hidden="true" />
            </button>
            {aberto && (
                <ol className="mt-4 flex motion-safe:animate-in flex-col gap-4 duration-200 motion-safe:fade-in">
                    {linhas.map(([t, x], i) => (
                        <li key={i} className="flex gap-3">
                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-fg-quaternary" aria-hidden="true" />
                            <div>
                                <p className="text-sm text-primary">{x}</p>
                                <p className="text-xs text-tertiary">{t}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}

function Dado({ rotulo, children, className }: { rotulo: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cx("flex flex-col gap-0.5", className)}>
            <dt className="text-sm text-tertiary">{rotulo}</dt>
            <dd className="text-sm font-medium text-primary">{children}</dd>
        </div>
    );
}

export function Confirmacao({
    aberto,
    titulo,
    texto,
    manter,
    acao,
    onClose,
    onConfirm,
}: {
    aberto: boolean;
    titulo: string;
    texto: string;
    manter: string;
    acao: string;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <ModalOverlay isOpen={aberto} onOpenChange={(o) => !o && onClose()} isDismissable>
            <Modal>
                <Dialog role="alertdialog">
                    <div className="w-full max-w-md rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <h2 className="text-lg font-semibold text-primary">{titulo}</h2>
                        <p className="mt-1 text-sm text-tertiary">{texto}</p>
                        <div className="mt-6 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                {manter}
                            </Button>
                            <Button size="md" color="primary-destructive" onClick={onConfirm}>
                                {acao}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
