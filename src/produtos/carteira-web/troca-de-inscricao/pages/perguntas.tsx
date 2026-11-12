import { Navigate, useNavigate, useParams } from "react-router";
import { AlertCircle } from "@untitledui/icons";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { BarraVoltar, ControlesCarteira, TopoCompra } from "../components/carteira-ui";
import { PERG, W, abrirPagamentoCarteira, camisetaOk, criarTrocaNaCarteira, faltamNaCarteira, itemPorId, mod, pessoa, tocar, useTroca } from "../data/troca-store";

/**
 * Novo: perguntas da nova inscrição antes do pagamento. Respostas atuais já preenchidas,
 * perguntas novas marcadas e tamanho esgotado em branco (TS-1819 com as regras de TS-1813).
 */
export function Perguntas() {
    useTroca();
    const { itemId } = useParams();
    const navigate = useNavigate();
    const x = itemPorId(itemId);
    if (!x || W.item !== itemId || !W.dest || !W.resp.length) return <Navigate to={`/carteira-web/inscricoes/${itemId}/trocar`} replace />;
    const { it } = x;
    const m = mod(W.dest)!;
    const faltam = faltamNaCarteira();

    const irParaPagamento = () => {
        if (faltam) {
            W.tentou = true;
            tocar();
            toast.error("Falta responder", { description: "Preencha as perguntas obrigatórias em vermelho." });
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

    return (
        <div className="min-h-dvh bg-secondary text-primary">
            <TopoCompra />
            <BarraVoltar grande titulo="Perguntas da nova inscrição" onVoltar={() => navigate(`/carteira-web/inscricoes/${it.id}/trocar`)} />
            <div className="px-5 pt-6 pb-10">
                <div className="mx-auto flex max-w-[732px] flex-col gap-4">
                    <section className="flex flex-col gap-5 rounded-2xl border border-secondary bg-primary p-5 md:p-6">
                        <div>
                            <h2 className="text-lg font-semibold">Perguntas da {m.nome}</h2>
                            <p className="text-sm text-tertiary">Suas respostas atuais já estão preenchidas e podem ser alteradas.</p>
                        </div>
                        {it.ps.map((pid, i) => (
                            <div key={pid} className="flex flex-col gap-3">
                                {it.ps.length > 1 && <h3 className="text-md font-semibold">{pessoa(pid).nome}</h3>}
                                <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
                                    {m.perguntas.map((k) => {
                                        const q = PERG[k];
                                        const orig = it.resp[i]?.[k];
                                        const v = W.resp[i][k] ?? "";
                                        const nova = !(k in (it.resp[i] ?? {}));
                                        const esgotou = q.estoque && orig && !v && !camisetaOk(orig);
                                        const erro = q.req && !v.trim() && (nova || !!esgotou || W.tentou);
                                        const msg = esgotou ? `O tamanho ${orig} esgotou. Escolha outro.` : "Resposta obrigatória.";
                                        const set = (val: string) => {
                                            W.resp[i][k] = val;
                                            tocar();
                                        };
                                        const label = (
                                            <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-secondary">
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
                                        return (
                                            <div key={k} className="flex flex-col gap-1.5">
                                                {label}
                                                {q.tipo === "select" ? (
                                                    <Select
                                                        aria-label={q.label}
                                                        placeholder="Selecione"
                                                        selectedKey={v || null}
                                                        isInvalid={!!erro}
                                                        hint={erro ? msg : undefined}
                                                        onSelectionChange={(key) => set(String(key))}
                                                        items={(q.opcoes ?? []).map((o) => {
                                                            const ok = !q.estoque || camisetaOk(o);
                                                            return { id: o, label: o, supportingText: ok ? undefined : "esgotado", isDisabled: !ok };
                                                        })}
                                                    >
                                                        {(item) => (
                                                            <Select.Item id={item.id} supportingText={item.supportingText} isDisabled={item.isDisabled}>
                                                                {item.label}
                                                            </Select.Item>
                                                        )}
                                                    </Select>
                                                ) : (
                                                    <Input aria-label={q.label} placeholder={q.ph} value={v} isInvalid={!!erro} hint={erro ? msg : undefined} onChange={set} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </section>

                    <div className="sticky bottom-3 flex flex-wrap items-center justify-end gap-3 rounded-xl bg-primary px-4 py-3 shadow-lg ring-1 ring-border-secondary">
                        {faltam > 0 && (
                            <span className="mr-auto flex items-center gap-1 text-sm text-error-primary">
                                <AlertCircle className="size-4" aria-hidden="true" />
                                Responda {faltam} {faltam > 1 ? "perguntas obrigatórias" : "pergunta obrigatória"} para continuar.
                            </span>
                        )}
                        <Button size="lg" color="secondary" onClick={() => navigate(`/carteira-web/inscricoes/${it.id}/trocar`)}>
                            Voltar
                        </Button>
                        <Button size="lg" color="primary" onClick={irParaPagamento}>
                            Ir para o pagamento
                        </Button>
                    </div>
                </div>
            </div>
            <ControlesCarteira />
        </div>
    );
}
