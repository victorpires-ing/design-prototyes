import { useState, type CSSProperties, type ReactNode } from "react";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ControlesPrototipo } from "../components/controles-prototipo";
import { EVENTO, PERG, ate, brl, calc, hora, lote, mod, ped, pessoa, sol, useTroca, type Item, type Solicitacao } from "../data/troca-store";

/** Os 6 e-mails da troca (TS-1818). */
const MODELOS: Record<string, string> = {
    criada: "Link de pagamento da troca",
    concluida: "Troca confirmada, para o comprador",
    portador: "Inscrição alterada, para o atleta",
    expirada: "Prazo de pagamento terminou",
    cancelada: "Troca cancelada",
    reprovada: "Troca não concluída, com estorno",
};

/**
 * Prévia dos e-mails. O e-mail segue o padrão da Ticket Sports (tema claro, logo e botão azul),
 * por isso usa cores fixas: o cliente de e-mail não tem o tema do Backstage.
 */
export function Emails() {
    const S = useTroca();
    const [aba, setAba] = useState("modelos");
    const [sel, setSel] = useState<string>("criada");
    const [compradorAtleta, setCompradorAtleta] = useState("nao");
    const enviados = S.emails.filter((e) => MODELOS[e.tipo]).slice().reverse();

    let previa: ReactNode = null;
    if (aba === "modelos") {
        // Exemplo: Marcos comprou e troca a 10 km dele, ou a 21 km da Helena, para outra modalidade.
        const daHelena = sel === "portador" || (sel === "concluida" && compradorAtleta === "nao");
        const itemId = daHelena ? "i31" : "i30";
        const p = ped("48330")!;
        const it = p.itens.find((i) => i.id === itemId)!;
        const destino = daHelena ? "m42" : "m21";
        const l = mod(destino)!.lotes.find((x) => x.ativo && x.vendidos < x.estoque) ?? mod(destino)!.lotes[0];
        const resp = it.resp.map((r) => ({ ...r, tempo: r.tempo || "2h15 a 2h45", pelotao: r.pelotao || "A" }));
        const exemplo: Solicitacao = {
            id: "TR-1001",
            grupo: "G",
            pedido: "48330",
            itemId,
            destino,
            lote: l.id,
            resp,
            val: calc(it.pago, it.taxa, l.valor),
            canal: "Backstage",
            autor: "Atendimento",
            criada: Date.now(),
            expira: Date.now() + 24 * 36e5,
            status: "AGUARDANDO",
            motivoFim: "Na verificação final, a atleta já tinha outra inscrição no mesmo evento, data e hora.",
            motivoTipo: "vagas",
        };
        const para = sel === "portador" ? pessoa("helena") : pessoa("marcos");
        previa = <Email tipo={sel} s={exemplo} para={para} item={it} />;
    } else {
        const e = enviados[Number(sel)];
        const s = e && sol(e.solId);
        const it = s && ped(s.pedido)?.itens.find((i) => i.id === s.itemId);
        if (e && s && it) previa = <Email tipo={e.tipo} s={s} para={{ nome: e.para, email: e.mail }} item={it} />;
    }

    const itens =
        aba === "modelos"
            ? Object.entries(MODELOS).map(([k, t]) => ({ k, t, sub: "" }))
            : enviados.map((e, i) => ({ k: String(i), t: MODELOS[e.tipo], sub: `Para ${e.para}, às ${hora(e.ts)}` }));

    return (
        <BackstageLayout showEventContext={false} showLayoutSwitcher={false} activeProducer="pedidos">
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <header>
                    <h1 className="text-display-xs font-bold text-primary">E-mails da troca</h1>
                    <p className="text-md text-tertiary">O link e os avisos de pagamento vão sempre para o comprador. O atleta inscrito que não comprou é avisado quando a inscrição muda.</p>
                </header>
                <Tabs
                    selectedKey={aba}
                    onSelectionChange={(k) => {
                        setAba(String(k));
                        setSel(k === "modelos" ? "criada" : "0");
                    }}
                >
                    <TabList
                        type="underline"
                        items={[
                            { id: "modelos", label: `Todos os modelos (${Object.keys(MODELOS).length})` },
                            { id: "enviados", label: `Enviados nesta sessão (${enviados.length})` },
                        ]}
                    >
                        {(item) => <Tab {...item} />}
                    </TabList>
                </Tabs>
                <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="flex min-w-0 flex-col gap-4">
                        {aba === "modelos" && sel === "concluida" && (
                            <ButtonGroup size="sm" selectedKeys={new Set([compradorAtleta])} disallowEmptySelection onSelectionChange={(k) => setCompradorAtleta(String([...k][0]))}>
                                <ButtonGroupItem id="nao">Comprador não é o atleta</ButtonGroupItem>
                                <ButtonGroupItem id="sim">Comprador é o atleta</ButtonGroupItem>
                            </ButtonGroup>
                        )}
                        {previa ?? (
                            <div className="rounded-xl bg-primary p-10 text-center ring-1 ring-border-secondary">
                                <p className="text-sm font-semibold text-primary">Nenhum e-mail enviado ainda</p>
                                <p className="text-sm text-tertiary">Faça uma troca no Backstage ou na carteira para ver as comunicações.</p>
                            </div>
                        )}
                    </div>
                    <nav aria-label="E-mails" className="flex flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                        {itens.map((i) => (
                            <button
                                key={i.k}
                                type="button"
                                aria-current={sel === i.k}
                                onClick={() => setSel(i.k)}
                                className={cx("border-b border-secondary px-4 py-3 text-left text-sm last:border-b-0 hover:bg-primary_hover", sel === i.k && "bg-secondary")}
                            >
                                <span className="block font-semibold text-primary">{i.t}</span>
                                {i.sub && <span className="text-xs text-tertiary">{i.sub}</span>}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            <ControlesPrototipo />
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  E-mail no padrão Ticket Sports                                     */
/* ------------------------------------------------------------------ */

const C = {
    texto: "#18181b",
    apoio: "#52525b",
    claro: "#71717a",
    linha: "#e4e4e7",
    caixa: "#f4f4f5",
    azul: "#4391f0",
    fundo: "#ffffff",
};

function LogoTicketSports() {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: C.texto }}>
            <svg viewBox="0 0 28 20" width="34" height="24" aria-hidden="true">
                <path d="M2 14 C7 3 17 1 26 2 C19 5 15 9 13 18 L9 18 C10 13 12 10 15 7 C10 8 6 11 4 15 Z" fill={C.azul} />
            </svg>
            <span style={{ lineHeight: 1 }}>
                <span style={{ display: "block", fontSize: 18, letterSpacing: 0.2 }}>
                    TICKET<b style={{ fontWeight: 800 }}>SPORTS</b>
                </span>
                <span style={{ display: "block", fontSize: 11, paddingLeft: 2, marginTop: 2 }}>
                    By <b style={{ fontWeight: 800 }}>INGRESSE</b>
                </span>
            </span>
        </span>
    );
}

/** Inscrição no resumo: data da sessão, grupo, modalidade e lote, e o valor. */
function BlocoInscricao({ rotulo, it, modId, loteId, valor, apagado }: { rotulo: string; it: Item; modId: string; loteId: string; valor: string; apagado?: boolean }) {
    const m = mod(modId)!;
    const l = lote(m, loteId);
    return (
        <div style={{ padding: "14px 0", borderTop: `1px solid ${C.linha}` }}>
            <div style={{ fontSize: 13, color: C.claro, marginBottom: 4 }}>{rotulo}</div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline" }}>
                <div style={{ color: apagado ? C.claro : C.texto }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                        {m.nome}, {l?.nome}
                    </div>
                    <div style={{ fontSize: 14, color: C.apoio }}>{m.grupo}</div>
                    <div style={{ fontSize: 14, color: C.apoio }}>{EVENTO.sessao}</div>
                </div>
                <div style={{ fontSize: 14, color: C.apoio, whiteSpace: "nowrap" }}>{valor}</div>
            </div>
            {it.ps.length > 1 && <div style={{ fontSize: 13, color: C.claro, marginTop: 4 }}>Combo para {it.ps.map((id) => pessoa(id).nome).join(" e ")}</div>}
        </div>
    );
}

function Email({ tipo, s, para, item: it }: { tipo: string; s: Solicitacao; para: { nome: string; email: string }; item: Item }) {
    const p = ped(s.pedido)!;
    const de = mod(it.mod)!;
    const pa = mod(s.destino)!;
    const l = lote(pa, s.lote)!;
    const f = s.val;
    const n = para.nome.split(" ")[0];
    const comprador = pessoa(p.comprador);
    const atletas = it.ps.map((id) => pessoa(id).nome).join(" e ");
    const compradorEhAtleta = it.ps.includes(p.comprador);
    const daInscricao = compradorEhAtleta ? "sua inscrição" : `a inscrição de ${atletas}`;

    const h1: CSSProperties = { fontSize: 24, fontWeight: 700, color: C.texto, margin: "0 0 12px" };
    const pTxt: CSSProperties = { fontSize: 16, lineHeight: "24px", color: C.apoio, margin: "0 0 12px" };
    const h2: CSSProperties = { fontSize: 17, fontWeight: 700, color: C.texto, margin: "24px 0 4px" };
    const Botao = ({ children }: { children: ReactNode }) => (
        <span style={{ display: "block", background: C.azul, color: "#fff", textAlign: "center", fontWeight: 700, fontSize: 15, padding: "14px 16px", borderRadius: 8, margin: "20px 0 8px" }}>{children}</span>
    );
    const Linha = ({ a, b, forte }: { a: string; b: string; forte?: boolean }) => (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: forte ? "14px 0 0" : "6px 0", borderTop: forte ? `1px solid ${C.linha}` : undefined, marginTop: forte ? 8 : 0, fontSize: forte ? 17 : 15, fontWeight: forte ? 700 : 400, color: forte ? C.texto : C.apoio }}>
            <span>{a}</span>
            <span>{b}</span>
        </div>
    );
    const atual = <BlocoInscricao rotulo="Inscrição atual" it={it} modId={it.mod!} loteId={it.lote!} valor={`${brl(it.pago)} pagos`} />;
    const anterior = <BlocoInscricao rotulo="Inscrição anterior (não vale mais)" it={it} modId={it.mod!} loteId={it.lote!} valor={`${brl(it.pago)} pagos`} apagado />;
    const nova = <BlocoInscricao rotulo="Nova inscrição" it={it} modId={pa.id} loteId={l.id} valor={brl(l.valor)} />;
    const respostas = (
        <>
            <div style={h2}>Respostas do formulário</div>
            {it.ps.map((pid, i) => (
                <div key={pid}>
                    {it.ps.length > 1 && <div style={{ fontSize: 14, fontWeight: 600, color: C.texto, marginTop: 8 }}>{pessoa(pid).nome}</div>}
                    {pa.perguntas
                        .filter((k) => s.resp[i]?.[k] || it.resp[i]?.[k])
                        .map((k) => (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "6px 0", fontSize: 14, color: C.apoio }}>
                                <span>{PERG[k].label}</span>
                                <span style={{ color: C.texto, textAlign: "right" }}>{s.resp[i]?.[k] || it.resp[i]?.[k]}</span>
                            </div>
                        ))}
                </div>
            ))}
        </>
    );
    const motivoCancel =
        s.motivoTipo === "vagas"
            ? `as vagas da ${pa.nome} acabaram antes do pagamento`
            : s.motivoTipo === "pergunta"
              ? `o tamanho ${s.tam} da camiseta acabou antes do pagamento`
              : s.motivoTipo === "comprador"
                ? "você cancelou pela carteira"
                : "o atendimento cancelou a pedido da organização";

    const M: Record<string, [string, ReactNode]> = {
        criada: [
            `Falta só o pagamento para trocar ${daInscricao} na ${EVENTO.nome}`,
            <>
                <h1 style={h1}>Falta só o pagamento para trocar {compradorEhAtleta ? "sua inscrição" : "a inscrição"}</h1>
                <p style={pTxt}>
                    Olá, {n}! Recebemos o pedido para trocar {daInscricao} na <b style={{ color: C.texto }}>{EVENTO.nome}</b>. Confira a troca e pague para garantir a nova inscrição.
                </p>
                <div style={h2}>Resumo da troca</div>
                {atual}
                {nova}
                <div style={h2}>Valores</div>
                <Linha a="Diferença da inscrição" b={f.dif < 0 ? `menos ${brl(-f.dif)} (não devolvida)` : brl(f.dif)} />
                <Linha a="Diferença da taxa de serviço" b={brl(f.dt)} />
                <Linha a="Taxa de troca" b={brl(f.tt)} />
                <Linha a="Total a pagar" b={brl(f.total)} forte />
                {f.down && <p style={{ ...pTxt, marginTop: 12 }}>A nova inscrição custa menos que a atual. A diferença não é devolvida, como combinado no atendimento.</p>}
                <Botao>Pagar {brl(f.total)}</Botao>
                <p style={{ ...pTxt, fontSize: 14, textAlign: "center", color: C.claro }}>
                    O link vale até {ate(s.expira)}. Quando você abrir, a vaga na {pa.nome} fica reservada por 15 minutos para concluir o pagamento.
                </p>
                <p style={pTxt}>
                    <b style={{ color: C.texto }}>Importante:</b> a troca só vale depois do pagamento. Se o prazo passar, a inscrição continua como está.
                </p>
                <p style={pTxt}>Não pediu essa troca? É só ignorar este e-mail.</p>
            </>,
        ],
        concluida: [
            compradorEhAtleta ? `Troca confirmada: agora você está na ${pa.nome}` : `A inscrição de ${atletas} foi alterada`,
            <>
                <h1 style={h1}>{compradorEhAtleta ? "Troca confirmada 🎉" : `A inscrição de ${atletas} foi alterada`}</h1>
                <p style={pTxt}>
                    {compradorEhAtleta ? (
                        <>
                            Olá, {n}! Sua inscrição na <b style={{ color: C.texto }}>{EVENTO.nome}</b> agora é a <b style={{ color: C.texto }}>{pa.nome}</b>. Bons treinos!
                        </>
                    ) : (
                        <>
                            Olá, {n}! A troca que você pediu foi concluída. {atletas} agora {it.ps.length > 1 ? "estão inscritos" : "está inscrita"} na <b style={{ color: C.texto }}>{pa.nome}</b> da{" "}
                            <b style={{ color: C.texto }}>{EVENTO.nome}</b>. Também avisamos {it.ps.length > 1 ? "os atletas" : "a atleta"} por e-mail.
                        </>
                    )}
                </p>
                {compradorEhAtleta && <Botao>Ver minha inscrição</Botao>}
                <div style={h2}>O que mudou</div>
                {anterior}
                {nova}
                {respostas}
                <div style={h2}>Pagamento da troca</div>
                <Linha a="Valor pago na troca" b={brl(f.total)} forte />
                {!f.total && f.nd > 0 && <p style={{ ...pTxt, marginTop: 12 }}>Esta troca não teve cobrança. A diferença de {brl(f.nd)} não é devolvida, como combinado.</p>}
                <p style={{ ...pTxt, marginTop: 16 }}>O QR Code da inscrição anterior não vale mais. Use o novo, que já está na carteira.</p>
            </>,
        ],
        portador: [
            `Sua inscrição na ${EVENTO.nome} mudou para ${pa.nome}`,
            <>
                <h1 style={h1}>Sua inscrição mudou</h1>
                <p style={pTxt}>
                    Olá, {n}! {comprador.nome} trocou a sua inscrição na <b style={{ color: C.texto }}>{EVENTO.nome}</b>. Agora você está na <b style={{ color: C.texto }}>{pa.nome}</b>.
                </p>
                <Botao>Ver minha inscrição</Botao>
                <div style={h2}>O que mudou</div>
                {anterior}
                {nova}
                {respostas}
                <p style={{ ...pTxt, marginTop: 16 }}>O QR Code da inscrição anterior não vale mais. Use o novo, que já está na sua carteira. Alguma resposta errada? Fale com a gente.</p>
            </>,
        ],
        expirada: [
            `O prazo para pagar a troca terminou`,
            <>
                <h1 style={h1}>O prazo para pagar a troca terminou</h1>
                <p style={pTxt}>
                    Olá, {n}! O link para trocar {daInscricao} na <b style={{ color: C.texto }}>{EVENTO.nome}</b> expirou sem pagamento. Nada mudou: a inscrição continua a mesma.
                </p>
                {atual}
                <p style={{ ...pTxt, marginTop: 16 }}>Ainda quer trocar? Fale com a gente. Os valores e as vagas podem ter mudado.</p>
            </>,
        ],
        cancelada: [
            `A troca da inscrição foi cancelada`,
            <>
                <h1 style={h1}>A troca foi cancelada</h1>
                <p style={pTxt}>
                    Olá, {n}! A troca para a <b style={{ color: C.texto }}>{pa.nome}</b> foi cancelada porque {motivoCancel}. Nada foi cobrado e a inscrição continua a mesma.
                </p>
                {atual}
            </>,
        ],
        reprovada: [
            "Não conseguimos concluir a troca e vamos devolver o valor",
            <>
                <h1 style={h1}>Não conseguimos concluir a troca</h1>
                <p style={pTxt}>
                    Olá, {n}! Recebemos o pagamento, mas não foi possível trocar para a <b style={{ color: C.texto }}>{pa.nome}</b>. {s.motivoFim}
                </p>
                <Linha a="Valor devolvido" b={brl(f.total)} forte />
                <p style={{ ...pTxt, marginTop: 12 }}>O valor volta no mesmo meio de pagamento em até 7 dias úteis.</p>
                {atual}
            </>,
        ],
    };
    const [assunto, corpo] = M[tipo] ?? M.criada;

    return (
        <div className="flex motion-safe:animate-in flex-col gap-3 duration-200 motion-safe:fade-in">
            <p className="text-sm text-tertiary">
                De: Ticket Sports, no-reply@ticketsports.com.br
                <br />
                Para: {para.nome}, {para.email}
                <br />
                Assunto: <b className="text-primary">{assunto}</b>
            </p>
            <div style={{ background: C.fundo, color: C.texto, borderRadius: 12, border: `1px solid ${C.linha}`, maxWidth: 600, width: "100%", margin: "0 auto", padding: "28px 28px 24px", fontFamily: "Inter, Arial, sans-serif" }}>
                <LogoTicketSports />
                <div style={{ marginTop: 28 }}>{corpo}</div>
                <div style={{ background: C.caixa, borderRadius: 12, padding: 18, marginTop: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 17, fontWeight: 700, color: C.texto }}>
                        <span aria-hidden="true" style={{ display: "inline-grid", placeItems: "center", width: 24, height: 24, borderRadius: 999, border: `1.5px solid ${C.texto}`, fontSize: 13 }}>
                            ?
                        </span>
                        Precisa de ajuda?
                    </div>
                    <p style={{ fontSize: 15, color: C.apoio, margin: "8px 0 0" }}>
                        Fale com a gente <span style={{ color: C.azul, textDecoration: "underline" }}>por aqui</span>.
                    </p>
                </div>
                <p style={{ fontSize: 14, color: C.apoio, margin: "20px 0 0" }}>Este é um e-mail automático, não é necessário responder.</p>
            </div>
        </div>
    );
}
