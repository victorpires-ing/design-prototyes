import { useState } from "react";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ControlesPrototipo } from "../components/controles-prototipo";
import { EVENTO, ate, brl, calc, hora, lote, mod, nomes, ped, pessoa, sol, useTroca, type Solicitacao } from "../data/troca-store";

const MODELOS: Record<string, string> = {
    criada: "Solicitação criada, com link de pagamento",
    pago: "Pagamento recebido",
    concluida: "Troca confirmada, para o comprador",
    portador: "Inscrição alterada, para o atleta",
    expirada: "Prazo de pagamento terminou",
    cancelada: "Troca cancelada",
    reprovada: "Troca não concluída, com estorno",
    falha: "Alerta interno de falha",
};

/** Os 8 e-mails transacionais da troca (TS-1818): modelos e os enviados nesta sessão. */
export function Emails() {
    const S = useTroca();
    const [aba, setAba] = useState("modelos");
    const [sel, setSel] = useState<string>("criada");
    const enviados = S.emails.slice().reverse();

    let previa: React.ReactNode = null;
    if (aba === "modelos") {
        const exemplo: Solicitacao = {
            id: "TR-1001",
            grupo: "G",
            pedido: "48330",
            itemId: "i30",
            destino: "m21",
            lote: "l3",
            resp: [{ camiseta: "GG" }],
            val: calc(140, 14, 180),
            canal: "Backstage",
            autor: "Atendimento",
            criada: Date.now(),
            expira: Date.now() + 24 * 36e5,
            status: "AGUARDANDO",
            motivoFim: "Na verificação final, um dos atletas passou a ter outra inscrição na mesma sessão.",
            motivoTipo: "atendimento",
        };
        const para = sel === "portador" ? pessoa("helena") : sel === "falha" ? { nome: "Operação Ingresse", email: "operacao@ingresse.com" } : pessoa("marcos");
        previa = <Email tipo={sel} s={exemplo} para={para} />;
    } else {
        const e = enviados[Number(sel)];
        const s = e && sol(e.solId);
        if (e && s) previa = <Email tipo={e.tipo} s={s} para={{ nome: e.para, email: e.mail }} />;
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
                    <p className="text-md text-tertiary">O link e os avisos de pagamento vão sempre para o comprador. O atleta inscrito que não comprou recebe o novo comprovante.</p>
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
                            { id: "modelos", label: "Todos os modelos (8)" },
                            { id: "enviados", label: `Enviados nesta sessão (${S.emails.length})` },
                        ]}
                    >
                        {(item) => <Tab {...item} />}
                    </TabList>
                </Tabs>
                <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="min-w-0">
                        {previa ?? (
                            <div className="rounded-xl bg-primary p-10 text-center ring-1 ring-border-secondary">
                                <p className="text-sm font-semibold text-primary">Nenhum e-mail enviado ainda</p>
                                <p className="text-sm text-tertiary">Faça uma troca no Backstage ou na carteira para ver as comunicações.</p>
                            </div>
                        )}
                    </div>
                    <nav aria-label="E-mails" className="flex flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary lg:order-last">
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

/** Prévia do e-mail como chega na caixa de entrada (layout de e-mail, fora do DS do app). */
function Email({ tipo, s, para }: { tipo: string; s: Solicitacao; para: { nome: string; email: string } }) {
    const p = ped(s.pedido)!;
    const it = p.itens.find((i) => i.id === s.itemId)!;
    const de = mod(it.mod)!;
    const pa = mod(s.destino)!;
    const l = lote(pa, s.lote)!;
    const f = s.val;
    const n = para.nome.split(" ")[0];

    const Caixa = ({ children }: { children: React.ReactNode }) => <div className="my-3 flex flex-col gap-1.5 rounded-lg bg-secondary p-4 text-sm">{children}</div>;
    const L = ({ a, b, forte }: { a: string; b: React.ReactNode; forte?: boolean }) => (
        <div className={cx("flex justify-between gap-4", forte && "font-semibold text-primary")}>
            <span className={forte ? "" : "text-tertiary"}>{a}</span>
            <span>{b}</span>
        </div>
    );
    const comp = (
        <Caixa>
            <L a="Inscrição atual" b={<b>{de.nome}</b>} />
            <L a="Nova inscrição" b={<b>{`${pa.nome}, ${l.nome}`}</b>} />
            <L a="Atleta" b={nomes(it)} />
        </Caixa>
    );
    const vals = (
        <Caixa>
            <L a="Diferença da inscrição" b={f.dif < 0 ? `menos ${brl(-f.dif)} (não devolvida)` : brl(f.dif)} />
            <L a="Diferença da taxa de serviço" b={brl(f.dt)} />
            <L a="Taxa de troca" b={brl(f.tt)} />
            <L a="Total a pagar" b={brl(f.total)} forte />
        </Caixa>
    );
    const Qr = () => <div className="mx-auto my-3 size-28 rounded-md" style={{ background: "repeating-conic-gradient(#18181b 0 25%, #fff 0 50%) 0 0/14px 14px" }} aria-hidden="true" />;
    const motivoCancel =
        s.motivoTipo === "vagas" ? "porque as vagas esgotaram antes do pagamento" : s.motivoTipo === "pergunta" ? `porque o tamanho ${s.tam} da camiseta esgotou antes do pagamento` : s.motivoTipo === "comprador" ? "a seu pedido, na carteira" : "pelo atendimento";

    const M: Record<string, [string, React.ReactNode]> = {
        criada: [
            `Pague até ${ate(s.expira)} para concluir a troca da sua inscrição`,
            <>
                <h4>Falta só o pagamento para trocar sua inscrição</h4>
                <p>
                    Olá, {n}! Recebemos o pedido de troca no evento <b>{EVENTO.nome}</b>.
                </p>
                {comp}
                {vals}
                {f.down && <p>A nova modalidade custa menos que o valor pago. A diferença não é devolvida, conforme combinado no atendimento.</p>}
                <span className="my-3 block rounded-lg bg-brand-solid px-4 py-3 text-center font-semibold text-white">Pagar {brl(f.total)}</span>
                <p className="text-center text-xs text-tertiary">O link vale até {ate(s.expira)} (24 horas). Ao abrir, sua vaga fica reservada por 15 minutos para você pagar. Pix ou cartão.</p>
                <p>
                    <b>Importante:</b> a troca só acontece depois do pagamento e depende de haver vagas. Se o prazo passar, nada muda na sua inscrição.
                </p>
                <p>Não pediu esta troca? É só ignorar este e-mail ou falar com a gente.</p>
            </>,
        ],
        pago: [
            "Recebemos o pagamento da sua troca",
            <>
                <h4>Pagamento recebido</h4>
                <p>
                    Olá, {n}! Recebemos {brl(f.total)} pela troca para a <b>{pa.nome}</b>. Estamos processando, e você recebe a confirmação em instantes.
                </p>
                {comp}
                <p>Não é preciso fazer mais nada.</p>
            </>,
        ],
        concluida: [
            `Troca confirmada: ${nomes(it).split(" e ")[0]} está na ${pa.nome}`,
            <>
                <h4>Troca confirmada!</h4>
                <p>
                    Olá, {n}! A troca no evento <b>{EVENTO.nome}</b> foi concluída.
                </p>
                {comp}
                <Caixa>
                    <b className="text-center">Novo comprovante</b>
                    <Qr />
                </Caixa>
                <p>O comprovante anterior ({de.nome}) não vale mais. Use só o novo, que também está na sua carteira.</p>
                <p>
                    {f.total ? (
                        <>
                            Valor pago na troca: <b>{brl(f.total)}</b>.
                        </>
                    ) : (
                        `Esta troca não teve pagamento. A diferença de ${brl(f.nd ?? 0)} não é devolvida, conforme aceite registrado.`
                    )}
                </p>
            </>,
        ],
        portador: [
            `Sua inscrição no evento ${EVENTO.nome} foi alterada`,
            <>
                <h4>Sua inscrição mudou</h4>
                <p>
                    Olá, {n}! A pedido de {pessoa(p.comprador).nome}, sua inscrição foi trocada.
                </p>
                {comp}
                <Caixa>
                    <b className="text-center">Seu novo comprovante</b>
                    <Qr />
                </Caixa>
                <p>O comprovante anterior não vale mais.</p>
            </>,
        ],
        expirada: [
            "O prazo para pagar a troca terminou",
            <>
                <h4>A troca não foi concluída</h4>
                <p>Olá, {n}! O link expirou depois de 24 horas sem pagamento.</p>
                <p>
                    <b>Nada mudou na sua inscrição</b> ({de.nome}). Se ainda quiser trocar, fale com o atendimento. Os valores e as vagas podem ter mudado.
                </p>
            </>,
        ],
        cancelada: [
            "A troca da sua inscrição foi cancelada",
            <>
                <h4>Troca cancelada</h4>
                <p>
                    Olá, {n}! A troca para a <b>{pa.nome}</b> foi cancelada {motivoCancel}.
                </p>
                <p>
                    <b>Nada foi cobrado e nada mudou</b> na sua inscrição ({de.nome}).
                </p>
            </>,
        ],
        reprovada: [
            "Não conseguimos concluir a troca, estorno a caminho",
            <>
                <h4>Não foi possível concluir a troca</h4>
                <p>
                    Olá, {n}! Recebemos o pagamento, mas na verificação final não foi possível trocar para a <b>{pa.nome}</b>. {s.motivoFim}
                </p>
                <Caixa>
                    <L a="Estorno integral" b={<b>{brl(f.total)}</b>} />
                    <L a="Prazo" b="até 7 dias úteis, no mesmo meio de pagamento" />
                </Caixa>
                <p>Sua inscrição continua como estava ({de.nome}).</p>
            </>,
        ],
        falha: [
            `[Operação] Falha de processamento na troca ${s.id}`,
            <>
                <h4>Ação necessária: reprocessar a troca</h4>
                <p>
                    A troca <b>{s.id}</b> teve o pagamento aprovado ({brl(f.total)}), mas a efetivação falhou.
                </p>
                <Caixa>
                    <L a="Reserva" b="mantida" />
                    <L a="Nova cobrança" b="não" />
                </Caixa>
                <p>Um Admin Ingresse deve reprocessar pelo pedido no Backstage. Não peça ao atleta para pagar de novo.</p>
            </>,
        ],
    };
    const [assunto, corpo] = M[tipo];

    return (
        <div className="flex animate-in flex-col gap-3 duration-200 fade-in">
            <p className="text-sm text-tertiary">
                De: Ticket Sports, no-reply@ticketsports.com.br
                <br />
                Para: {para.nome}, {para.email}
                <br />
                Assunto: <b className="text-primary">{assunto}</b>
            </p>
            <div className="mx-auto w-full max-w-[600px] overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                <div className="bg-brand-solid px-6 py-4 text-center text-sm font-extrabold tracking-wide text-white">TICKET SPORTS</div>
                <div className="flex flex-col gap-3 px-6 py-6 text-md text-secondary [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-primary">{corpo}</div>
                <div className="border-t border-secondary px-6 py-4 text-xs text-tertiary">Precisa de ajuda? Fale com a gente. Este é um e-mail automático, não é necessário responder.</div>
            </div>
        </div>
    );
}
