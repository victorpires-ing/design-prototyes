import { Navigate, useNavigate, useParams } from "react-router";
import { HelpCircle } from "@untitledui/icons";
import { Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { HintText } from "@/components/base/input/hint-text";
import { Input } from "@/components/base/input/input";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { cx } from "@/utils/cx";
import { BarraVoltar, ControlesCarteira, Etapas, TopoCompra, brlc, useTopoAoEntrar } from "../components/carteira-ui";
import { ResumoTroca } from "../components/resumo-troca";
import { EVENTO, PERG, W, abrirPagamentoCarteira, camisetaOk, criarTrocaNaCarteira, faltamNaCarteira, itemPorId, mod, pessoa, tocar, ultimoLote, calc, useTroca, type Item } from "../data/troca-store";

/**
 * Perguntas da nova inscrição no modelo do fluxo de compra ("Para quem é esta inscrição?"):
 * um cartão por atleta, formulário com as opções em lista e "Salvar respostas" fechando o cartão.
 * Respostas atuais já preenchidas, perguntas novas marcadas e tamanho esgotado em branco.
 */
export function Perguntas() {
    useTroca();
    const { itemId } = useParams();
    useTopoAoEntrar(itemId);
    const navigate = useNavigate();
    const x = itemPorId(itemId);

    if (!x || W.item !== itemId || !W.dest || !W.resp.length) return <Navigate to={`/carteira-web/inscricoes/${itemId}/trocar`} replace />;
    const { it } = x;
    const m = mod(W.dest)!;
    const l = ultimoLote(m)!;
    const f = calc(it.pago, it.taxa, l.valor);
    const faltamDe = (i: number) => m.perguntas.filter((k) => PERG[k].req && !String(W.resp[i][k] ?? "").trim()).length;
    const faltam = faltamNaCarteira();

    const continuar = () => {
        if (faltam) {
            W.tentou = true;
            tocar();
            toast.error("Falta responder", { description: "Preencha as perguntas obrigatórias em vermelho." });
            setTimeout(() => document.querySelector("[data-invalid]")?.scrollIntoView({ block: "center", behavior: "smooth" }), 60);
            return;
        }
        const s = criarTrocaNaCarteira();
        if (s.status === "CONCLUIDA") return navigate(`/carteira-web/troca/${s.id}/confirmada`);
        const r = abrirPagamentoCarteira(s.id);
        if (!r.ok) {
            toast.error(r.tipo === "pergunta" ? `O tamanho ${r.tam} da camiseta esgotou antes do pagamento` : "A modalidade escolhida esgotou antes do pagamento", {
                description: "A troca foi cancelada e nada foi alterado.",
            });
            return navigate(`/carteira-web/inscricoes?item=${it.id}`);
        }
        navigate(`/carteira-web/troca/${s.id}/pagamento`);
    };
    const ajuda = (
        <>
            <Button size="md" color="secondary" iconTrailing={HelpCircle} onClick={() => toast.error("Fora do protótipo")} className="max-md:hidden">
                Preciso de ajuda
            </Button>
            <ButtonUtility size="sm" color="secondary" icon={HelpCircle} tooltip="Preciso de ajuda" onClick={() => toast.error("Fora do protótipo")} className="md:hidden" />
        </>
    );
    const total = brlc(f.total);

    return (
        <div className="min-h-dvh bg-secondary text-primary">
            <TopoCompra />
            <BarraVoltar grande titulo={EVENTO.nome.toUpperCase()} onVoltar={() => navigate(`/carteira-web/inscricoes/${it.id}/trocar`)} extra={ajuda} />
            <div className="px-4 pt-6 pb-36 md:px-5 min-[1000px]:pb-16">
                <div className="mx-auto grid max-w-[1176px] items-start gap-6 min-[1000px]:grid-cols-[minmax(0,732px)_420px]">
                    <div className="flex flex-col gap-5">
                        <Etapas atual={2} />
                        <div>
                            <h1 className="text-display-xs font-bold">Responda o formulário da nova inscrição</h1>
                            <p className="mt-1 text-md text-tertiary">
                                {m.nome}, {m.grupo}, {l.nome}. Suas respostas atuais já estão preenchidas e podem ser alteradas.
                            </p>
                        </div>

                        {/* Um cartão sempre aberto por atleta (UI-FRM-006, UI-VIS-019) */}
                        {it.ps.map((pid, i) => {
                            const falta = faltamDe(i);
                            return (
                                <section key={pid} aria-labelledby={`atleta-${i}`} className="flex flex-col gap-5 rounded-2xl border border-secondary bg-primary p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <h2 id={`atleta-${i}`} className="text-lg font-semibold">
                                                Formulário do atleta
                                            </h2>
                                            <p className="text-md text-tertiary">{pessoa(pid).nome}</p>
                                        </div>
                                        {falta ? (
                                            <Badge size="sm" type="pill-color" color="warning">
                                                {falta > 1 ? `Faltam ${falta} respostas` : "Falta 1 resposta"}
                                            </Badge>
                                        ) : (
                                            <Badge size="sm" type="pill-color" color="success">
                                                Formulário completo
                                            </Badge>
                                        )}
                                    </div>
                                    {m.perguntas.map((k) => (
                                        <Pergunta key={k} it={it} i={i} k={k} />
                                    ))}
                                </section>
                            );
                        })}
                    </div>

                    <aside className="flex flex-col overflow-hidden rounded-2xl border border-secondary bg-primary min-[1000px]:sticky min-[1000px]:top-6">
                        <div className="border-b border-secondary px-5 py-4 font-semibold">Resumo da troca</div>
                        <div id="resumo-troca" className="flex flex-col gap-3 px-5 py-4">
                            <p className="font-semibold">
                                De {mod(it.mod)!.nome} para {m.nome}
                            </p>
                            <ResumoTroca pago={it.pago} taxa={it.taxa} lote={l} f={f} />
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-secondary px-5 py-4 max-[999px]:hidden">
                            <div>
                                <b className="block text-lg font-semibold">{total}</b>
                                <span className="text-sm text-tertiary">{it.ps.length > 1 ? `${it.ps.length} atletas` : "1 atleta"}</span>
                            </div>
                            <Button size="lg" color="primary" onClick={continuar}>
                                Continuar
                            </Button>
                        </div>
                    </aside>
                </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-secondary bg-primary px-4 py-3 min-[1000px]:hidden">
                <div className="min-w-0 flex-1">
                    <b className="block text-lg font-semibold">{total}</b>
                    <span className="text-sm text-tertiary">{faltam ? `${faltam > 1 ? `Faltam ${faltam} respostas` : "Falta 1 resposta"}` : "Formulário completo"}</span>
                </div>
                <Button size="lg" color="primary" onClick={continuar}>
                    Continuar
                </Button>
            </div>
            <ControlesCarteira />
        </div>
    );
}

/** Uma pergunta no modelo do fluxo de compra: opções em lista de rádio, texto em campo. */
function Pergunta({ it, i, k }: { it: Item; i: number; k: string }) {
    const q = PERG[k];
    const orig = it.resp[i]?.[k];
    const v = W.resp[i][k] ?? "";
    const nova = !(k in (it.resp[i] ?? {}));
    const esgotou = q.estoque && orig && !v && !camisetaOk(orig);
    const erro = q.req && !v.trim() && (nova || !!esgotou || W.tentou);
    const msg = esgotou ? `O tamanho ${orig} esgotou. Escolha outro.` : nova ? "Pergunta nova obrigatória. Responda para continuar." : "Resposta obrigatória.";
    const set = (val: string) => {
        W.resp[i][k] = val;
        tocar();
    };
    const rotulo = (
        <span className="flex flex-wrap items-center gap-1.5 text-md font-medium text-secondary">
            {q.label}
            {q.req ? (
                <span className="text-brand-tertiary" aria-hidden="true">
                    *
                </span>
            ) : (
                <span className="font-normal text-tertiary">(opcional)</span>
            )}
            {nova && (
                <Badge size="sm" type="color" color="brand">
                    Nova pergunta
                </Badge>
            )}
        </span>
    );

    if (q.tipo === "text")
        return (
            <div className="flex flex-col gap-1.5">
                {rotulo}
                <Input aria-label={q.label} size="md" placeholder={q.ph} value={v} isInvalid={!!erro} hint={erro ? msg : undefined} onChange={set} />
            </div>
        );

    return (
        <div className="flex flex-col gap-2">
            <AriaRadioGroup aria-label={q.label} value={v || null} onChange={set} isInvalid={!!erro} className="flex flex-col gap-2">
                {rotulo}
                {(q.opcoes ?? []).map((o) => {
                    const semEstoque = !!q.estoque && !camisetaOk(o);
                    return (
                        <AriaRadio key={o} value={o} isDisabled={semEstoque} className={({ isDisabled }) => cx("relative flex w-max cursor-pointer items-center gap-3 py-1", isDisabled && "cursor-not-allowed")}>
                            {({ isSelected, isDisabled, isFocusVisible }) => (
                                <>
                                    <RadioButtonBase size="md" isSelected={isSelected} isDisabled={isDisabled} isFocusVisible={isFocusVisible} />
                                    <span className={cx("text-md", isDisabled ? "text-tertiary" : "text-primary")}>{o}</span>
                                    {semEstoque && (
                                        <Badge size="sm" type="color" color="gray">
                                            Esgotado
                                        </Badge>
                                    )}
                                </>
                            )}
                        </AriaRadio>
                    );
                })}
            </AriaRadioGroup>
            {erro && <HintText isInvalid>{msg}</HintText>}
        </div>
    );
}
