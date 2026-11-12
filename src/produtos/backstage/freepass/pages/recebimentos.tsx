import { useMemo } from "react";
import { Link } from "react-router";
import { BackstageLayout } from "../../components/Backstage";
import { TITULO_PAGINA } from "../../components/titulo-pagina";
import { Metrica } from "../components/comuns";
import { abrirEventoNoPainel, useMinhasVendas } from "../data/minhas-vendas";
import { dia, moeda } from "../utils/formato";

/* ------------------------------------------------------------------ */
/*  Recebimentos do comissário no Freepass (FCO-30 a FCO-39)           */
/*                                                                     */
/*  Quanto cada organizador ainda deve e o histórico do que já pagou.  */
/*  O pagamento é combinado com o organizador, fora da Ingresse: aqui  */
/*  é o extrato para conferir.                                         */
/* ------------------------------------------------------------------ */

export function Recebimentos() {
    const { carregando, participacoes, geral } = useMinhasVendas();
    // Só quem vende pelo link tem comissão a receber; quem só emite cortesia ou bilheteria não aparece aqui.
    const minhas = participacoes.filter((p) => p.papel === "responsavel" && p.vinculo.canais.includes("online"));

    const porOrganizador = useMemo(() => {
        const m = new Map<string, { nome: string; aReceber: number; recebido: number; eventos: Array<{ evento: (typeof minhas)[number]["evento"]; aReceber: number }> }>();
        for (const p of minhas) {
            const o = m.get(p.organizacao) ?? { nome: p.organizacao, aReceber: 0, recebido: 0, eventos: [] };
            o.aReceber += p.t.aRepassar;
            o.recebido += p.t.repassado;
            if (p.t.aRepassar > 0) o.eventos.push({ evento: p.evento, aReceber: p.t.aRepassar });
            m.set(p.organizacao, o);
        }
        return [...m.values()].sort((a, b) => b.aReceber - a.aReceber);
    }, [minhas]);

    const historico = useMemo(
        () => minhas.flatMap((p) => p.repasses.map((r) => ({ ...r, evento: p.evento.nome, organizacao: p.organizacao }))).sort((a, b) => b.data.localeCompare(a.data)),
        [minhas],
    );

    return (
        <BackstageLayout activeProducer="recebimentos" showEventContext={false}>
            <div className="flex w-full min-w-0 flex-1 flex-col gap-6">
                <header className="flex flex-col gap-1">
                    <h1 className={TITULO_PAGINA}>Recebimentos</h1>
                    <p className="max-w-[60ch] text-md text-tertiary">
                        Cada organizador paga a sua comissão direto para você, por Pix ou transferência. Aqui você confere o que já recebeu e o que falta.
                    </p>
                </header>

                {carregando ? (
                    <span role="status" aria-label="Carregando recebimentos" className="h-64 w-full animate-pulse rounded-xl bg-secondary motion-reduce:animate-none" />
                ) : minhas.length === 0 ? (
                    <p className="rounded-xl bg-secondary px-6 py-12 text-center text-sm text-tertiary">
                        Os pagamentos vão para o responsável do seu grupo. Suas vendas e a comissão delas estão em cada evento, em Minhas vendas.
                    </p>
                ) : (
                    <>
                        <section aria-label="Resumo" className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                            <Metrica rotulo="A receber" valor={moeda(geral.aRepassar)} />
                            <Metrica rotulo="Já recebido" valor={moeda(geral.repassado)} />
                            <Metrica rotulo="Comissão gerada" valor={moeda(geral.comissao)} apoio={geral.estornado > 0 ? `${moeda(geral.estornado)} estornados` : undefined} />
                        </section>

                        <section className="flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary">
                            <h2 className="border-b border-secondary px-4 py-4 text-lg font-semibold text-primary md:px-6">Por organizador</h2>
                            <ul className="flex flex-col divide-y divide-secondary">
                                {porOrganizador.map((o) => (
                                    <li key={o.nome} className="flex flex-col gap-2 px-4 py-4 md:px-6">
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="flex min-w-0 flex-col gap-0.5">
                                                <span className="truncate text-md font-semibold text-primary">{o.nome}</span>
                                                <span className="text-sm text-tertiary">{moeda(o.recebido)} já recebidos</span>
                                            </span>
                                            <span className="shrink-0 text-right">
                                                <span className="block text-md font-semibold text-primary tabular-nums">{moeda(o.aReceber)}</span>
                                                <span className="text-sm text-tertiary">a receber</span>
                                            </span>
                                        </div>
                                        {o.eventos.length > 0 && (
                                            <ul className="flex flex-col gap-1">
                                                {o.eventos.map((e) => (
                                                    <li key={e.evento.id} className="flex justify-between gap-3 text-sm text-tertiary">
                                                        <Link
                                                            to="/freepass/evento/vendas"
                                                            onClick={() => abrirEventoNoPainel(e.evento)}
                                                            className="min-w-0 truncate outline-focus-ring hover:text-secondary hover:underline focus-visible:outline-2"
                                                        >
                                                            {e.evento.nome}
                                                        </Link>
                                                        <span className="shrink-0 tabular-nums">{moeda(e.aReceber)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="flex flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary">
                            <h2 className="border-b border-secondary px-4 py-4 text-lg font-semibold text-primary md:px-6">Pagamentos recebidos</h2>
                            {historico.length === 0 ? (
                                <p className="px-4 py-10 text-center text-sm text-tertiary md:px-6">Nenhum pagamento registrado ainda. Quando o organizador registrar, ele aparece aqui.</p>
                            ) : (
                                <ul className="flex flex-col divide-y divide-secondary">
                                    {historico.map((r) => (
                                        <li key={r.id} className="flex items-center gap-3 px-4 py-3 md:px-6">
                                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <span className="truncate text-sm font-medium text-primary">{r.evento}</span>
                                                <span className="truncate text-sm text-tertiary">
                                                    {r.organizacao}, {dia(r.data)}
                                                    {r.observacao ? `, ${r.observacao}` : ""}
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">{moeda(r.valor)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                        <p className="text-sm text-tertiary">Algum valor não bate? Fale com o organizador do evento: é ele quem registra os pagamentos.</p>
                    </>
                )}
            </div>
        </BackstageLayout>
    );
}
