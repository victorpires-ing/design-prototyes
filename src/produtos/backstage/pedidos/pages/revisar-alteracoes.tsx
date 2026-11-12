import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { ArrowLeft } from "@untitledui/icons";
import { toast } from "sonner";
import { Badge, BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { BackstageLayout } from "../../components/Backstage";
import { Aviso } from "../components/aviso";
import { Linha, QuadroCobranca } from "../components/quadro-cobranca";
import { PERG, alterados, ate, brl, calc, confirmar, nomeItem, nomes, ped, pessoa, rascunho, tocar, ultimoLote, useTroca } from "../data/troca-store";

/** Revisar alterações: de→para por item e um único link de pagamento para todas as trocas. */
export function RevisarAlteracoes() {
    useTroca();
    const { id } = useParams();
    const navigate = useNavigate();
    const p = ped(id);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!p || !alterados(p).length) return <Navigate to={`/backstage/pedidos/${id}`} replace />;

    const D = rascunho(p.id);
    const alt = alterados(p);
    const vals = alt
        .filter((a) => a.m.dest)
        .map(({ it, m }) => {
            const l = ultimoLote(m.dest!)!;
            return { it, l, f: calc(it.pago, it.taxa, l.valor) };
        });
    const total = vals.reduce((a, v) => a + v.f.total, 0);
    const maisBarata = vals.some((v) => v.f.down);
    const soResp = alt.some((a) => !a.m.dest);
    const c = pessoa(p.comprador);
    const botao = total ? "Gerar link de pagamento" : vals.length ? "Confirmar troca" : "Salvar alterações";

    const onConfirmar = () => {
        if (maisBarata && !D.aceite) {
            D.erroAceite = true;
            tocar();
            document.getElementById("aceite")?.scrollIntoView({ block: "center", behavior: "smooth" });
            return;
        }
        const r = confirmar(p);
        if (r.tipo === "esgotou") {
            toast.error("Acabaram as vagas", { description: `${r.destino} esgotou agora. Escolha outra.` });
            navigate(`/backstage/pedidos/${p.id}`);
            return;
        }
        if (r.tipo === "link") toast.success("Link gerado", { description: `Enviado para ${c.email}. Vale até ${ate(r.expira!)}.` });
        else if (r.tipo === "concluida") toast.success("Troca concluída", { description: "O novo comprovante foi enviado por e-mail." });
        else toast.success("Alterações salvas", { description: "O pedido foi atualizado." });
        navigate(`/backstage/pedidos/${p.id}`);
    };

    return (
        <BackstageLayout showEventContext={false} showLayoutSwitcher={false} activeProducer="pedidos">
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <header className="flex items-start gap-3">
                    <ButtonUtility size="sm" color="secondary" icon={ArrowLeft} tooltip="Voltar e editar" onClick={() => navigate(`/backstage/pedidos/${p.id}`)} />
                    <div className="flex flex-col gap-1">
                        <h1 className="text-display-xs font-bold text-primary">Revisar alterações</h1>
                        <p className="text-md text-tertiary">Confira antes de confirmar. Nada muda até o pagamento.</p>
                    </div>
                </header>

                {alt.map(({ it, m }) => {
                    const v = vals.find((x) => x.it === it);
                    return (
                        <section key={it.id} className="flex flex-col gap-4 rounded-xl bg-primary p-5 ring-1 ring-border-secondary md:p-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold text-primary">{nomes(it)}</h2>
                                <BadgeWithDot size="sm" type="pill-color" color={m.dest ? "warning" : "gray"}>
                                    {m.dest ? "Troca" : "Respostas"}
                                </BadgeWithDot>
                            </div>
                            <div className="overflow-x-auto rounded-lg ring-1 ring-border-secondary">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-secondary_subtle text-left text-xs text-tertiary">
                                            <th className="w-1/3 px-4 py-2.5 font-medium">Campo</th>
                                            <th className="w-1/3 px-4 py-2.5 font-medium">Antes</th>
                                            <th className="px-4 py-2.5 font-medium">Depois</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {m.dest && v && (
                                            <tr className="border-t border-secondary">
                                                <td className="px-4 py-3 text-secondary">Inscrição</td>
                                                <td className="px-4 py-3 text-tertiary">
                                                    {nomeItem(it)}
                                                    {it.passkey && <span className="block text-xs">Passkey {it.passkey}</span>}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-primary">
                                                    {m.dest.nome}
                                                    <span className="block text-xs font-normal text-tertiary">{v.l.nome}</span>
                                                </td>
                                            </tr>
                                        )}
                                        {m.resp
                                            .filter((r) => r.a || r.b)
                                            .map((r) => (
                                                <tr key={`${r.i}${r.k}`} className="border-t border-secondary">
                                                    <td className="px-4 py-3 text-secondary">
                                                        {it.ps.length > 1 && `${pessoa(it.ps[r.i]).nome.split(" ")[0]}, `}
                                                        {PERG[r.k].label}
                                                        {r.nova && (
                                                            <Badge size="sm" type="color" color="brand" className="ml-1.5">
                                                                Nova
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-tertiary">{r.a || "Sem resposta"}</td>
                                                    <td className="px-4 py-3 font-medium text-primary">{r.b || "Sem resposta"}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                            {v && <QuadroCobranca titulo="Valores" nomeAtual={nomeItem(it)} pago={it.pago} taxa={it.taxa} lote={v.l} f={v.f} />}
                        </section>
                    );
                })}

                <section className="flex flex-col gap-5 rounded-xl bg-primary p-5 ring-1 ring-border-secondary md:p-6">
                    <h2 className="text-lg font-semibold text-primary">{total ? "Pagamento" : "Confirmação"}</h2>
                    {vals.length ? (
                        <Linha rotulo={`Total a cobrar${vals.length > 1 ? ` (${vals.length} trocas)` : ""}`} valor={brl(total)} total />
                    ) : (
                        <p className="text-sm text-tertiary">Só respostas foram alteradas. Não há nada a cobrar, e elas são salvas na hora.</p>
                    )}
                    {total > 0 && vals.some((v) => v.f.total === 0) && <p className="text-sm text-tertiary">A troca sem custo é feita assim que você confirmar. As outras esperam o pagamento.</p>}
                    {maisBarata && (
                        <div id="aceite" className="flex flex-col gap-1.5">
                            <Checkbox
                                isSelected={D.aceite}
                                isInvalid={D.erroAceite}
                                onChange={(v) => {
                                    D.aceite = v;
                                    D.erroAceite = false;
                                    tocar();
                                }}
                                label={`${c.nome} está ciente de que a diferença da inscrição mais barata não é devolvida.`}
                            />
                            {D.erroAceite && <p className="text-sm text-error-primary">Confirme para continuar.</p>}
                        </div>
                    )}
                    {total > 0 && (
                        <Aviso titulo={`Um link de pagamento para ${c.nome}`}>
                            {c.email}. O link vale 24 horas, com Pix ou cartão. Ao abrir o link, a vaga fica reservada por 15 minutos para o pagamento. As trocas só acontecem depois do pagamento.
                            {soResp && " As respostas dos outros itens são salvas agora."}
                        </Aviso>
                    )}
                    <Input
                        className="max-w-xs"
                        label="Nº do chamado (opcional)"
                        placeholder="Ex.: ATD-55120"
                        value={D.chamado}
                        onChange={(v) => {
                            D.chamado = v;
                            tocar();
                        }}
                    />
                </section>

                <div className="sticky bottom-16 z-30 flex flex-wrap items-center justify-end gap-3 rounded-xl bg-primary px-4 py-3 shadow-lg ring-1 ring-border-secondary">
                    <p className="mr-auto text-sm text-tertiary">
                        {alt.length} {alt.length > 1 ? "itens" : "item"}, {total ? <b className="font-semibold text-primary">{brl(total)} a cobrar</b> : "nada a cobrar"}
                    </p>
                    <Button size="md" color="secondary" onClick={() => navigate(`/backstage/pedidos/${p.id}`)}>
                        Voltar e editar
                    </Button>
                    <Button size="md" color="primary" onClick={onConfirmar}>
                        {botao}
                    </Button>
                </div>
            </div>
        </BackstageLayout>
    );
}
