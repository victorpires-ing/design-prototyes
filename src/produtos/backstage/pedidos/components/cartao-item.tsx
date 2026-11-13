import { useState } from "react";
import { ChevronDown, ChevronRight } from "@untitledui/icons";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import {
    PERG,
    brl,
    calc,
    camisetaOk,
    elegib,
    falhou as solFalhou,
    fmt,
    lote,
    mod,
    motivoTxt,
    mudancas,
    nomeItem,
    pendDoItem,
    pergs,
    pessoa,
    rascunho,
    setResp,
    sol,
    ultimaSol,
    ultimoLote,
    type Item,
    type Lote,
    type Pedido,
    type Valores,
} from "../data/troca-store";
import { Aviso } from "./aviso";
import { QuadroCobranca } from "./quadro-cobranca";

interface CartaoItemProps {
    p: Pedido;
    it: Item;
    ed: boolean;
    onTrocar: (itId: string) => void;
    onDesfazer: (itId: string) => void;
    onRefazer: (itId: string, solId: string) => void;
}

/** Um item do pedido: atleta inscrito, inscrição, valores da troca e questionário. */
export function CartaoItem({ p, it, ed, onTrocar, onDesfazer, onRefazer }: CartaoItemProps) {
    const D = rascunho(p.id);
    const m = it.mod ? mod(it.mod) : undefined;
    const pend = pendDoItem(it.id);
    const d = D.itens[it.id];
    const mud = mudancas(p.id, it);
    const troca = d?.dest ?? null;
    const off = !ed || !m || it.status === "kit" || !!pend;
    const ks = m ? pergs(p.id, it) : [];
    const resp = d ? d.resp : it.resp;
    const dl = troca ? ultimoLote(mod(troca)) : null;
    const f = dl ? calc(it.pago, it.taxa, dl.valor) : null;
    const ult = ultimaSol(it.id);
    const falhou = !troca && !pend && solFalhou(ult);
    const s0 = it.veioDe ? sol(it.veioDe) : undefined;
    const ant = s0 ? p.itens.find((i) => i.para === it.id) : undefined;

    const faltam = it.ps.reduce((n, _, i) => n + ks.filter((k) => PERG[k].req && !String(resp[i]?.[k] ?? "").trim()).length, 0);
    const faltaAqui = D.tentou && faltam > 0;
    const [qAberto, setQAberto] = useState(false);
    const questionarioAberto = qAberto || !!troca || faltaAqui;

    const extras = (
        <>
            {m?.passkey && (
                <Badge size="sm" type="color" color="gray">
                    Oculto por passkey
                </Badge>
            )}
            {m?.passkey && it.passkey && <span className="text-xs text-tertiary">código {it.passkey}</span>}
            {m?.n && <span className="text-xs text-tertiary">Combo com {m.n} inscrições</span>}
        </>
    );

    let linha1: React.ReactNode;
    let linha2: React.ReactNode = null;
    let total: React.ReactNode = null;

    if (troca && dl && f) {
        linha1 = <Escolha id={`${it.id}-a`} rotulo="Inscrição atual" nome={nomeItem(it)} riscado extras={extras} />;
        linha2 = (
            <Escolha
                id={`${it.id}-n`}
                rotulo="Nova inscrição"
                nome={mod(troca)!.nome}
                acao="Mudar"
                onAcao={() => onTrocar(it.id)}
                depois={
                    <Button size="sm" color="link-gray" className="self-start" onClick={() => onDesfazer(it.id)}>
                        Desfazer troca
                    </Button>
                }
            />
        );
        total = <CampoTotal rotulo="Total a cobrar na troca" valor={brl(f.total)} apoio={f.total ? "" : "sem cobrança"} nomeAtual={nomeItem(it)} it={it} l={dl} f={f} />;
    } else if (pend) {
        linha1 = <Escolha id={`${it.id}-a`} rotulo="Inscrição atual" nome={nomeItem(it)} riscado extras={extras} />;
        linha2 = <Escolha id={`${it.id}-n`} rotulo="Nova inscrição" nome={mod(pend.destino)!.nome} />;
        total = (
            <CampoTotal
                rotulo={pend.status === "AGUARDANDO" ? "Total da troca aguardando pagamento" : "Pagamento da troca recebido"}
                valor={brl(pend.val.total)}
                nomeAtual={nomeItem(it)}
                it={it}
                l={lote(mod(pend.destino), pend.lote)!}
                f={pend.val}
            />
        );
    } else {
        linha1 = <Escolha id={it.id} rotulo="Inscrição atual" nome={nomeItem(it)} acao={off ? undefined : "Trocar"} onAcao={() => onTrocar(it.id)} extras={extras} />;
        if (falhou && ult) {
            linha2 = <Escolha id={`${it.id}-f`} rotulo="Nova inscrição" nome={mod(ult.destino)!.nome} riscado />;
            total = (
                <CampoTotal
                    rotulo="Total da troca não realizada"
                    valor={<s className="text-tertiary">{brl(ult.val.total)}</s>}
                    apoio={ult.status === "REPROVADA" ? "estornado" : "não cobrado"}
                    nomeAtual={nomeItem(it)}
                    it={it}
                    l={lote(mod(ult.destino), ult.lote)!}
                    f={ult.val}
                />
            );
        } else if (s0 && ant) {
            linha2 = <Escolha id={`${it.id}-p`} rotulo="Inscrição anterior" nome={nomeItem(ant)} riscado />;
            total = (
                <CampoTotal
                    rotulo="Pago na troca"
                    valor={brl(s0.val.total)}
                    apoio={`em ${fmt(s0.concluida ?? s0.criada).slice(0, 10)}`}
                    nomeAtual={nomeItem(ant)}
                    it={ant}
                    l={lote(mod(s0.destino), s0.lote)!}
                    f={s0.val}
                />
            );
        }
    }

    // Troca não realizada: motivo e atalho para refazer.
    let aviso: React.ReactNode = null;
    if (falhou && ult) {
        const md = mod(ult.destino)!;
        const destinoFora = !ultimoLote(md) || elegib(it, md).length > 0;
        const camisetaFora = ult.resp.some((r) => r.camiseta && !camisetaOk(r.camiseta));
        aviso = (
            <Aviso
                cor="gray"
                titulo={`A troca para a ${md.nome} não foi realizada`}
                acoes={
                    ed &&
                    it.status !== "kit" && (
                        <Button size="sm" color="secondary" onClick={() => onRefazer(it.id, ult.id)}>
                            {destinoFora ? "Escolher outra inscrição" : "Refazer troca"}
                        </Button>
                    )
                }
            >
                {motivoTxt(ult)} A inscrição continua a mesma{ult.status === "REPROVADA" ? "" : " e nada foi cobrado"}.
                {destinoFora ? " Ao refazer, escolha outra inscrição." : camisetaFora ? " Ao refazer, escolha outro tamanho de camiseta." : ""}
            </Aviso>
        );
    }

    // Respostas que não existem no destino e serão removidas.
    const sobras = troca
        ? it.ps.flatMap((_, i) =>
              Object.entries(it.resp[i] ?? {})
                  .filter(([k, v]) => v && !ks.includes(k) && PERG[k])
                  .map(([k, v]) => `${PERG[k].label} (${v})`),
          )
        : [];

    return (
        <section
            id={`item-${it.id}`}
            aria-labelledby={`h-${it.id}`}
            className={cx("flex scroll-mt-6 flex-col gap-6 rounded-xl bg-primary p-5 ring-1 md:p-6", pend ? "ring-2 ring-border-brand" : troca || mud ? "ring-2 ring-border-primary" : "ring-border-secondary")}
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-4">
                    {it.ps.map((id, i) => {
                        const a = pessoa(id);
                        return (
                            <div key={id} className="flex flex-col gap-1">
                                <Badge size="sm" type="pill-color" color="gray" className="self-start">
                                    Atleta inscrito
                                </Badge>
                                <h2 id={i === 0 ? `h-${it.id}` : undefined} className="text-lg font-semibold text-primary">
                                    {a.nome}
                                </h2>
                                <p className="text-sm text-tertiary">
                                    {a.email}
                                    <br />
                                    {a.tel}
                                    <br />
                                    CPF {a.cpf}
                                </p>
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {it.status === "kit" && (
                        <BadgeWithDot size="sm" type="pill-color" color="gray">
                            Kit retirado
                        </BadgeWithDot>
                    )}
                    {(troca || mud) && (
                        <BadgeWithDot size="sm" type="pill-color" color="warning">
                            Alterado
                        </BadgeWithDot>
                    )}
                    {pend && (
                        <BadgeWithDot size="sm" type="pill-color" color={pend.status === "FALHA" ? "error" : "warning"}>
                            {pend.status === "AGUARDANDO" ? "Aguardando pagamento" : pend.status === "FALHA" ? "Falha ao finalizar" : "Pagamento recebido"}
                        </BadgeWithDot>
                    )}
                    {!troca && !pend && falhou && (
                        <BadgeWithDot size="sm" type="pill-color" color="gray">
                            Troca não realizada
                        </BadgeWithDot>
                    )}
                    {!troca && !pend && !falhou && s0 && (
                        <BadgeWithDot size="sm" type="pill-color" color="success">
                            Troca concluída
                        </BadgeWithDot>
                    )}
                </div>
            </div>

            <div className="grid items-start gap-x-6 gap-y-5 md:grid-cols-2">
                {linha1}
                <CampoLeitura rotulo="Valor pago" valor={`${brl(it.pago)} e taxa de ${brl(it.taxa)}`} />
                {linha2}
                {linha2 && (total ?? <div />)}
            </div>

            {aviso}

            {m && m.perguntas.length > 0 && (
                <div className="border-t border-secondary pt-4">
                    <button
                        type="button"
                        aria-expanded={questionarioAberto}
                        aria-controls={`q-${it.id}`}
                        onClick={() => setQAberto((a) => !(a || !!troca || faltaAqui))}
                        className="flex w-full items-center justify-between gap-3 rounded-md text-left outline-focus-ring focus-visible:outline-2"
                    >
                        <span className="flex flex-col">
                            <span className="text-md font-semibold text-primary">Questionário{troca ? ` da ${mod(troca)!.nome}` : ""}</span>
                            <span className={cx("text-sm", faltam ? "text-warning-primary" : "text-tertiary")}>
                                {faltam ? `Falta${faltam > 1 ? "m" : ""} ${faltam} obrigatória${faltam > 1 ? "s" : ""}` : `${ks.length * it.ps.length} perguntas`}
                            </span>
                        </span>
                        <ChevronDown className={cx("size-5 text-fg-quaternary transition-transform duration-200", questionarioAberto && "rotate-180")} aria-hidden="true" />
                    </button>
                    {questionarioAberto && (
                        <div id={`q-${it.id}`} className="mt-4 flex motion-safe:animate-in flex-col gap-4 duration-200 motion-safe:fade-in motion-safe:slide-in-from-top-1">
                            {it.ps.map((pid, i) => (
                                <div key={pid} className="flex flex-col gap-3">
                                    {it.ps.length > 1 && <p className="text-sm font-semibold text-primary">{pessoa(pid).nome}</p>}
                                    <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
                                        {ks.map((k) => (
                                            <CampoPergunta key={k} p={p} it={it} i={i} k={k} valor={resp[i]?.[k] ?? ""} off={off} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {sobras.length > 0 && <p className="text-sm text-tertiary">Não existe na nova inscrição e será removido: {sobras.join(", ")}.</p>}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

/* ------------------------------------------------------------------ */

/** Linha de escolha (UI-FRM-007): rótulo, valor e a ação que abre a escolha. */
function Escolha({
    id,
    rotulo,
    nome,
    riscado,
    acao,
    onAcao,
    extras,
    depois,
}: {
    id: string;
    rotulo: string;
    nome: string;
    riscado?: boolean;
    acao?: string;
    onAcao?: () => void;
    extras?: React.ReactNode;
    depois?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <span id={`lb-${id}`} className="text-sm font-medium text-secondary">
                {rotulo}
            </span>
            <button
                type="button"
                aria-labelledby={`lb-${id}`}
                disabled={!acao}
                onClick={onAcao}
                className={cx(
                    "flex min-h-11 w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left shadow-xs ring-1 ring-border-primary ring-inset transition duration-100 ease-linear",
                    acao ? "bg-primary hover:bg-primary_hover focus-visible:ring-2 focus-visible:ring-brand" : "cursor-default bg-secondary_subtle",
                )}
            >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className={cx("text-md font-medium", riscado ? "text-tertiary line-through" : "text-primary")}>{nome}</span>
                    {extras && <span className="flex flex-wrap items-center gap-1.5">{extras}</span>}
                </span>
                {acao && (
                    <span className="flex items-center gap-0.5 text-sm font-semibold text-brand-secondary">
                        {acao}
                        <ChevronRight className="size-4" aria-hidden="true" />
                    </span>
                )}
            </button>
            {depois}
        </div>
    );
}

function CampoLeitura({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-secondary">{rotulo}</span>
            <div className="flex min-h-11 items-center rounded-lg bg-secondary_subtle px-3.5 py-2.5 text-md text-primary ring-1 ring-border-secondary ring-inset">{valor}</div>
        </div>
    );
}

function CampoTotal({ rotulo, valor, apoio, nomeAtual, it, l, f }: { rotulo: string; valor: React.ReactNode; apoio?: string; nomeAtual: string; it: Item; l: Lote; f: Valores }) {
    const [aberto, setAberto] = useState(false);
    return (
        <div className="flex motion-safe:animate-in flex-col gap-1.5 duration-200 motion-safe:fade-in">
            <span className="text-sm font-medium text-secondary">{rotulo}</span>
            <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-secondary_subtle px-3.5 py-2.5 ring-1 ring-border-secondary ring-inset">
                <span className="text-md font-semibold text-primary">{valor}</span>
                {apoio && <span className="text-sm text-tertiary">{apoio}</span>}
            </div>
            <Button
                size="sm"
                color="link-gray"
                className="self-start"
                iconTrailing={<ChevronDown data-icon className={cx("size-4 transition-transform", aberto && "rotate-180")} />}
                aria-expanded={aberto}
                onClick={() => setAberto((a) => !a)}
            >
                {aberto ? "Ocultar detalhes da cobrança" : "Ver detalhes da cobrança"}
            </Button>
            {aberto && <QuadroCobranca nomeAtual={nomeAtual} pago={it.pago} taxa={it.taxa} lote={l} f={f} />}
        </div>
    );
}

function CampoPergunta({ p, it, i, k, valor, off }: { p: Pedido; it: Item; i: number; k: string; valor: string; off: boolean }) {
    const q = PERG[k];
    const D = rascunho(p.id);
    const d = D.itens[it.id];
    const mud = mudancas(p.id, it);
    const c = mud?.resp.find((r) => r.i === i && r.k === k);
    const orig = it.resp[i]?.[k];
    const av = d?.av && !valor ? d.av[`${i}${k}`] : "";
    const esgotou = av || (q.estoque && d?.dest && orig && !valor && !camisetaOk(orig));
    const erro = q.req && !valor.trim() && !off && (D.tentou || !!d?.dest);
    const msg = av || (esgotou ? `O tamanho ${orig} esgotou. Escolha outro.` : c?.nova ? "Pergunta nova obrigatória. Responda para continuar." : "Resposta obrigatória.");
    const tag = c ? (
        <Badge size="sm" type="color" color={c.nova ? "brand" : "gray"} className="ml-1.5">
            {c.nova ? "Nova pergunta" : "Alterado"}
        </Badge>
    ) : null;
    const label = (
        <span className="flex flex-wrap items-center">
            {q.label}
            {q.req && <span className="ml-0.5 text-brand-tertiary" aria-hidden="true">*</span>}
            {!q.req && <span className="ml-1 font-normal text-tertiary">(opcional)</span>}
            {tag}
        </span>
    );

    if (q.tipo === "select") {
        const items = (q.opcoes ?? []).map((o) => {
            const ok = !q.estoque || (o === orig && !d?.dest) || camisetaOk(o);
            return { id: o, label: o, supportingText: ok ? undefined : "esgotado", isDisabled: !ok };
        });
        return (
            <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-secondary">
                    {label}
                </span>
                <Select
                    aria-label={q.label}
                    size="md"
                    placeholder="Selecione"
                    isDisabled={off}
                    isInvalid={!!erro}
                    selectedKey={valor || null}
                    onSelectionChange={(key) => setResp(p.id, it, i, k, String(key))}
                    items={items}
                    hint={erro ? msg : undefined}
                >
                    {(item) => <Select.Item id={item.id} supportingText={item.supportingText} isDisabled={item.isDisabled}>{item.label}</Select.Item>}
                </Select>
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-secondary">
                {label}
            </span>
            <Input
                aria-label={q.label}
                size="md"
                placeholder={q.ph}
                isDisabled={off}
                isInvalid={!!erro}
                value={valor}
                onChange={(v) => setResp(p.id, it, i, k, v)}
                hint={erro ? msg : undefined}
            />
        </div>
    );
}
