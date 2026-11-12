import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "@untitledui/icons";
import { toast } from "sonner";
import { Tab, TabList, Tabs } from "@/components/application/tabs/tabs";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { BackstageLayout } from "../../components/Backstage";
import { ControlesPrototipo } from "../components/controles-prototipo";
import { brl, estado, lote, mod, nomes, sol, useTroca, uuid, type Item, type Modalidade, type Pedido, type Solicitacao } from "../data/troca-store";

/* Telas existentes de relatório só com o que muda na troca (TS-1818): totais pelas inscrições
   vigentes, indicador e filtro de trocas, e a inscrição que voltou ao estoque. */

interface LinhaTx {
    p: Pedido;
    it: Item;
    m: Modalidade;
    s: Solicitacao | null;
}

function linhas(): LinhaTx[] {
    const S = estado();
    return S.pedidos
        .filter((p) => p.org === "pedras" && p.status === "pago")
        .flatMap((p) => p.itens.filter((i) => i.mod).map((it) => ({ p, it, m: mod(it.mod)!, s: it.veioDe ? sol(it.veioDe) ?? null : null })));
}

const FILTROS = [
    { id: "todas", label: "Todas" },
    { id: "vendas", label: "Vendas" },
    { id: "trocas", label: "Trocas" },
    { id: "ret", label: "Retornadas por troca" },
];

export function TransacoesTroca() {
    const S = useTroca();
    const navigate = useNavigate();
    const [filtro, setFiltro] = useState("todas");
    const L = linhas();
    const vig = L.filter((l) => l.it.status !== "trocado");
    const ret = L.filter((l) => l.it.status === "trocado");
    const tc = S.sols.filter((s) => s.status === "CONCLUIDA");
    const lst = L.filter(
        (l) =>
            filtro === "todas" ||
            (filtro === "vendas" && !l.it.veioDe && l.it.status !== "trocado") ||
            (filtro === "trocas" && !!l.it.veioDe) ||
            (filtro === "ret" && l.it.status === "trocado"),
    );

    return (
        <BackstageLayout activeSection="relatorios" activeItem="transacoes" showLayoutSwitcher={false}>
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <header className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-display-xs font-bold text-primary">Transações</h1>
                        <p className="text-md text-tertiary">Horário de Brasília, valores em reais.</p>
                    </div>
                    <Button color="secondary" onClick={() => toast.success("Exportação iniciada", { description: "Você recebe o arquivo por e-mail." })}>
                        Exportar
                    </Button>
                </header>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Kpi rotulo="Inscrições vigentes" valor={String(vig.length)} apoio="Sem as que voltaram ao estoque por troca" />
                    <Kpi rotulo="Valor das inscrições vigentes" valor={brl(vig.reduce((a, l) => a + l.it.pago, 0))} apoio="Pelo valor dos lotes atuais" />
                    <Kpi rotulo="Trocas concluídas" valor={String(tc.length)} apoio={`${brl(tc.reduce((a, s) => a + s.val.total, 0))} cobrados em trocas`} />
                    <Kpi rotulo="Retornadas ao estoque por troca" valor={String(ret.length)} apoio="Fora dos totais" />
                </div>

                <section className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary">
                    <div className="p-4">
                        <Tabs selectedKey={filtro} onSelectionChange={(k) => setFiltro(String(k))}>
                            <TabList type="button-border" size="sm" items={FILTROS}>
                                {(item) => <Tab {...item} />}
                            </TabList>
                        </Tabs>
                    </div>
                    {lst.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 border-t border-secondary py-12">
                            <p className="text-sm font-semibold text-primary">Nenhuma transação neste filtro</p>
                            <Button size="sm" color="secondary" onClick={() => setFiltro("todas")}>
                                Ver todas
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto max-lg:hidden">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-y border-secondary bg-secondary_subtle text-left text-xs text-tertiary">
                                            {["Pedido", "Atleta", "Inscrição e lote", "Canal", "Valor", "Tipo", "Status"].map((h) => (
                                                <th key={h} className="px-4 py-3 font-medium">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lst.map((l) => {
                                            const nv = l.it.para ? l.p.itens.find((i) => i.id === l.it.para) : null;
                                            return (
                                                <tr key={l.it.id} onClick={() => navigate(`/backstage/pedidos/${l.p.id}`)} className="cursor-pointer border-b border-secondary text-sm hover:bg-primary_hover">
                                                    <td className="max-w-[130px] truncate px-4 py-4 font-mono text-xs text-tertiary" title={uuid(l.p.id)}>
                                                        {uuid(l.p.id)}
                                                    </td>
                                                    <td className="px-4 py-4 text-primary">{nomes(l.it)}</td>
                                                    <td className="px-4 py-4">
                                                        <span className="block text-secondary">{l.m.nome}</span>
                                                        <span className="text-tertiary">{lote(l.m, l.it.lote)?.nome}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-tertiary">{l.p.canal}</td>
                                                    <td className="px-4 py-4">
                                                        {l.it.status === "trocado" ? <s className="text-tertiary">{brl(l.it.pago)}</s> : <span className="font-medium text-primary">{brl(l.it.pago)}</span>}
                                                        {l.s && <span className="block text-xs text-tertiary">Pago na troca: {brl(l.s.val.total)}</span>}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <BadgeWithDot size="sm" type="pill-color" color={l.it.veioDe ? "warning" : "gray"}>
                                                            {l.it.veioDe ? `Troca ${l.it.veioDe}` : "Venda"}
                                                        </BadgeWithDot>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {nv ? (
                                                            <>
                                                                <BadgeWithDot size="sm" type="pill-color" color="warning">
                                                                    Retornado ao estoque por troca
                                                                </BadgeWithDot>
                                                                <span className="mt-1 block text-xs text-tertiary">
                                                                    Nova inscrição: {mod(nv.mod)?.nome}, {lote(mod(nv.mod), nv.lote)?.nome}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <BadgeWithDot size="sm" type="pill-color" color={l.p.origem === "cortesia" ? "gray" : "success"}>
                                                                {l.p.origem === "cortesia" ? "Cortesia" : "Pago"}
                                                            </BadgeWithDot>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <ul className="flex flex-col border-t border-secondary lg:hidden">
                                {lst.map((l) => (
                                    <li key={l.it.id} className="border-b border-secondary">
                                        <button type="button" onClick={() => navigate(`/backstage/pedidos/${l.p.id}`)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-primary_hover">
                                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <span className="truncate text-sm font-semibold text-primary">{nomes(l.it)}</span>
                                                <span className="text-sm text-tertiary">
                                                    {l.m.nome}, {lote(l.m, l.it.lote)?.nome}
                                                </span>
                                                <span className="mt-1">
                                                    <BadgeWithDot size="sm" type="pill-color" color={l.it.status === "trocado" || l.it.veioDe ? "warning" : "gray"}>
                                                        {l.it.status === "trocado" ? "Retornado ao estoque por troca" : l.it.veioDe ? `Troca ${l.it.veioDe}` : "Venda"}
                                                    </BadgeWithDot>
                                                </span>
                                            </span>
                                            <span className="text-sm font-semibold text-primary">{brl(l.it.pago)}</span>
                                            <ChevronRight className="size-5 text-fg-quaternary" aria-hidden="true" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </section>
                <p className="max-w-[65ch] text-sm text-tertiary">
                    Os totais consideram só as inscrições vigentes, pelo valor do lote atual. As inscrições que voltaram ao estoque por troca ficam na lista para consulta.
                </p>
            </div>
            <ControlesPrototipo />
        </BackstageLayout>
    );
}

export function BorderoTroca() {
    const S = useTroca();
    const L = linhas();
    const tc = S.sols.filter((s) => s.status === "CONCLUIDA");
    const entrou: Record<string, number> = {};
    const saiu: Record<string, number> = {};
    tc.forEach((s) => {
        const it = S.pedidos.find((p) => p.id === s.pedido)!.itens.find((i) => i.id === s.itemId)!;
        entrou[s.destino] = (entrou[s.destino] ?? 0) + 1;
        saiu[it.mod!] = (saiu[it.mod!] ?? 0) + 1;
    });
    const vig = L.filter((l) => l.it.status !== "trocado");
    const soma = (f: (s: Solicitacao) => number) => tc.reduce((a, s) => a + f(s), 0);
    const ativos = S.mods.filter((m) => m.ativo);

    return (
        <BackstageLayout activeSection="relatorios" activeItem="bordero" showLayoutSwitcher={false}>
            <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                <header>
                    <h1 className="text-display-xs font-bold text-primary">Borderô</h1>
                    <p className="text-md text-tertiary">Horário de Brasília, valores em reais.</p>
                </header>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Kpi rotulo="Itens vigentes" valor={String(vig.length)} apoio="Depois das trocas" />
                    <Kpi rotulo="Faturado pelos lotes atuais" valor={brl(vig.reduce((a, l) => a + l.it.pago, 0))} />
                    <Kpi rotulo="Trocas" valor={String(tc.length)} apoio={`Diferenças de ${brl(soma((s) => Math.max(0, s.val.dif)))} e taxa de serviço de ${brl(soma((s) => s.val.dt))}`} />
                    <Kpi rotulo="Taxa de troca" valor={brl(soma((s) => s.val.tt))} apoio={`Não devolvido, para a Ingresse: ${brl(soma((s) => s.val.nd ?? 0))}`} />
                </div>
                <section className="overflow-x-auto rounded-xl bg-primary ring-1 ring-border-secondary">
                    <table className="w-full border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-secondary bg-secondary_subtle text-left text-xs text-tertiary">
                                {["Modalidade", "Itens vigentes", "Faturado", "Trocas que entraram", "Trocas que saíram"].map((h) => (
                                    <th key={h} className="px-4 py-3 font-medium">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ativos.map((m) => {
                                const v = vig.filter((l) => l.m.id === m.id);
                                return (
                                    <tr key={m.id} className="border-b border-secondary text-sm last:border-b-0">
                                        <td className="px-4 py-4 font-medium text-primary">{m.nome}</td>
                                        <td className="px-4 py-4 text-secondary">{v.length}</td>
                                        <td className="px-4 py-4 text-secondary">{brl(v.reduce((a, l) => a + l.it.pago, 0))}</td>
                                        <td className="px-4 py-4 text-secondary">{entrou[m.id] ?? 0}</td>
                                        <td className="px-4 py-4 text-secondary">{saiu[m.id] ?? 0}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
                <p className="max-w-[65ch] text-sm text-tertiary">
                    Cada troca soma 1 item na modalidade nova e devolve 1 ao lote da compra original. Por isso o faturado reflete só os lotes vigentes.
                </p>
            </div>
            <ControlesPrototipo />
        </BackstageLayout>
    );
}

function Kpi({ rotulo, valor, apoio }: { rotulo: string; valor: string; apoio?: string }) {
    return (
        <div className="flex flex-col gap-2 rounded-xl bg-primary p-5 ring-1 ring-border-secondary">
            <p className="text-sm text-tertiary">{rotulo}</p>
            <p className="text-display-sm font-bold text-primary">{valor}</p>
            {apoio && <p className="text-sm text-tertiary">{apoio}</p>}
        </div>
    );
}
