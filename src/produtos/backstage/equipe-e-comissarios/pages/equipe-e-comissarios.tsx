import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, CoinsHand, Plus, SearchLg, UsersPlus } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { PaginationCardAdvanced } from "@/components/application/pagination/pagination";
import { BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Toggle } from "@/components/base/toggle/toggle";
import { BackstageLayout } from "../../components/Backstage";
import { FaixaDeMetricas, Metrica, moeda, numero } from "../../comissarios/components/comuns";
import { ModalCriarGrupo } from "../components/modal-criar-grupo";
import { ModalDesativar } from "../components/modal-desativar";
import { BadgeInativo, CabecalhoCotas, TemaCotas } from "../components/ui-cotas";
import { ITEM_POR_ID } from "../data/catalogo-evento";
import {
    alterarGrupo,
    BASE,
    canaisLigados,
    plural,
    ROTULO_CANAL,
    totais,
    useEquipeDoEvento,
    type CanalGrupo,
    type DadosDoGrupo,
    type GrupoEquipe,
} from "../data/equipe";

type FiltroCanal = "todos" | CanalGrupo;
type FiltroStatus = "todos" | "ativos" | "inativos";

const CANAIS: Array<{ id: FiltroCanal; label: string }> = [
    { id: "todos", label: "Todos" },
    { id: "link", label: ROTULO_CANAL.link },
    { id: "pdv", label: ROTULO_CANAL.pdv },
    { id: "bilheteria", label: ROTULO_CANAL.bilheteria },
    { id: "cortesia", label: ROTULO_CANAL.cortesia },
];
const STATUS: Array<{ id: FiltroStatus; label: string }> = [
    { id: "todos", label: "Todos" },
    { id: "ativos", label: "Ativos" },
    { id: "inativos", label: "Inativos" },
];

/** Lista da Equipe e Comissários do evento (ECO-02 a ECO-05). */
export function EquipeEComissarios() {
    const navigate = useNavigate();
    const { carregando, evento, organizacao, grupos } = useEquipeDoEvento();
    const [busca, setBusca] = useState("");
    const [canal, setCanal] = useState<FiltroCanal>("todos");
    const [status, setStatus] = useState<FiltroStatus>("todos");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [desativando, setDesativando] = useState<GrupoEquipe | null>(null);
    const [criando, setCriando] = useState(false);

    const filtrados = useMemo(() => {
        const q = busca.trim().toLowerCase();
        const lista = grupos.filter(({ grupo: g, comissario }) => {
            if (canal !== "todos" && !g.canais[canal]?.ligado) return false;
            if (status === "ativos" && !g.ativo) return false;
            if (status === "inativos" && g.ativo) return false;
            if (!q) return true;
            return (
                g.nome.toLowerCase().includes(q) ||
                !!comissario?.nome.toLowerCase().includes(q) ||
                g.operadores.some((e) => e.toLowerCase().includes(q)) ||
                Object.values(g.canais).some((c) => c?.itens.some((id) => ITEM_POR_ID[id]?.nome.toLowerCase().includes(q)))
            );
        });
        // Ativos primeiro, inativos no fim (ECO-04).
        return [...lista.filter((x) => x.grupo.ativo), ...lista.filter((x) => !x.grupo.ativo)];
    }, [grupos, busca, canal, status]);

    const comComissarios = grupos.filter((x) => x.comissario);
    const geral = useMemo(() => totais(comComissarios.flatMap((x) => x.vendas), comComissarios.flatMap((x) => x.repasses)), [comComissarios]);

    const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const inicio = safePage * pageSize;
    const visiveis = filtrados.slice(inicio, inicio + pageSize);
    const resetar = <T,>(set: (v: T) => void) => (v: T) => {
        set(v);
        setPage(0);
    };
    const alternar = (g: GrupoEquipe) => (g.ativo ? setDesativando(g) : alterarGrupo(g.id, (x) => ({ ...x, ativo: true })));

    return (
        <BackstageLayout activeSection="equipe-e-comissarios" activeItem="equipe-e-comissarios">
            <TemaCotas className="gap-6">
                <div className="flex flex-col gap-1">
                    <CabecalhoCotas titulo="Equipe e Comissários" alinhamento="esquerda" acao={grupos.length > 0 ? { label: "Criar grupo", onClick: () => setCriando(true) } : undefined} />
                    <p className="max-w-[65ch] text-md text-tertiary">Quem opera o evento, em quais canais, com quais itens e qual cota. Com comissário, o grupo também vende pelo link e ganha comissão.</p>
                </div>

                {carregando ? (
                    <div role="status" aria-label="Carregando grupos" className="flex flex-col gap-3">
                        <span aria-hidden="true" className="h-24 w-full animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                        <span aria-hidden="true" className="h-64 w-full animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                    </div>
                ) : grupos.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center py-16">
                        <EmptyState size="sm">
                            <EmptyState.Header>
                                <EmptyState.FeaturedIcon icon={UsersPlus} color="gray" theme="modern" />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <EmptyState.Title>Nenhum grupo neste evento</EmptyState.Title>
                                <EmptyState.Description>Crie um grupo para quem emite cortesias, vende no PDV e na bilheteria ou vende pelo link como comissário.</EmptyState.Description>
                            </EmptyState.Content>
                            <EmptyState.Footer>
                                <Button color="primary" size="md" iconLeading={Plus} onClick={() => setCriando(true)}>
                                    Criar grupo
                                </Button>
                            </EmptyState.Footer>
                        </EmptyState>
                    </div>
                ) : (
                    <main className="flex flex-1 flex-col gap-6">
                        {comComissarios.length > 0 && (
                            <FaixaDeMetricas>
                                <Metrica
                                    rotulo="Vendido por comissários"
                                    valor={moeda(geral.receita)}
                                    apoio={`${plural(geral.porCanal.online.quantidade, "ingresso", "ingressos")} no link, ${numero(geral.porCanal.bilheteria.quantidade)} no PDV e na bilheteria`}
                                />
                                <Metrica rotulo="Cortesias enviadas" valor={numero(geral.cortesias)} apoio="Pelos grupos com comissário" />
                                <Metrica rotulo="Comissão gerada" valor={moeda(geral.comissao)} apoio={geral.estornado > 0 ? `${moeda(geral.estornado)} estornados em cancelamentos` : undefined} />
                                <Metrica rotulo="A repassar" valor={moeda(geral.aRepassar)} apoio={`${moeda(geral.repassado)} já repassados`} />
                            </FaixaDeMetricas>
                        )}

                        <div className="flex flex-wrap items-end gap-4">
                            <div className="w-full max-w-[300px]">
                                <Input size="sm" label="Busca" icon={SearchLg} placeholder="Grupo, comissário, pessoa ou item" value={busca} onChange={resetar(setBusca)} />
                            </div>
                            {[
                                { rotulo: "Canais", valor: canal, set: setCanal, itens: CANAIS, largura: "w-44" },
                                { rotulo: "Status", valor: status, set: setStatus, itens: STATUS, largura: "w-36" },
                            ].map((f) => (
                                <div key={f.rotulo} className={f.largura}>
                                    <Select size="sm" label={f.rotulo} selectedKey={f.valor} onSelectionChange={(k) => k && resetar(f.set as (v: string) => void)(String(k))} items={f.itens}>
                                        {(item) => (
                                            <Select.Item id={item.id} selectionIndicator="none">
                                                {item.label}
                                            </Select.Item>
                                        )}
                                    </Select>
                                </div>
                            ))}
                        </div>

                        <p className="text-sm text-tertiary">
                            {filtrados.length === 0 ? "Nenhum grupo encontrado" : `Exibindo ${inicio + 1}-${inicio + visiveis.length} de ${plural(filtrados.length, "grupo", "grupos")}`}
                        </p>

                        {filtrados.length === 0 ? (
                            <div className="rounded-xl bg-primary px-6 py-16 text-center text-sm text-tertiary ring-1 ring-border-secondary ring-inset">Nenhum grupo corresponde à busca ou aos filtros.</div>
                        ) : (
                            <div className="-mt-3 flex flex-col gap-3">
                                {visiveis.map((d) => (
                                    <LinhaGrupo key={d.grupo.id} dados={d} onToggle={() => alternar(d.grupo)} onAbrir={() => navigate(`${BASE}/${d.grupo.id}`)} />
                                ))}
                            </div>
                        )}

                        {filtrados.length > 0 && (
                            <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary ring-inset">
                                <PaginationCardAdvanced
                                    className="border-t-0"
                                    page={safePage + 1}
                                    total={totalPages}
                                    pageSize={pageSize}
                                    onPageChange={(p) => setPage(Math.max(0, p - 1))}
                                    onPageSizeChange={(s) => {
                                        setPageSize(s);
                                        setPage(0);
                                    }}
                                />
                            </div>
                        )}
                    </main>
                )}

                <ModalDesativar
                    aberto={!!desativando}
                    titulo="Desativar grupo?"
                    descricao={
                        desativando?.comissarioId
                            ? "Ao desativar, as pessoas do grupo deixam de operar os canais dele e o link de venda do comissário para de contar vendas. O já vendido e o saldo continuam. Você pode ativar de novo quando quiser."
                            : "Ao desativar, as pessoas do grupo deixam de ter acesso aos itens dos canais dele. Você pode ativar de novo quando quiser."
                    }
                    acao="Desativar grupo"
                    onCancelar={() => setDesativando(null)}
                    onConfirmar={() => {
                        if (desativando) alterarGrupo(desativando.id, (x) => ({ ...x, ativo: false }));
                        setDesativando(null);
                    }}
                />
                <ModalCriarGrupo aberto={criando} onFechar={() => setCriando(false)} eventoId={evento.id} organizacaoId={organizacao?.id ?? ""} grupos={grupos.map((x) => x.grupo)} />
            </TemaCotas>
        </BackstageLayout>
    );
}

/* ------------------------------ Linha ------------------------------- */

function LinhaGrupo({ dados, onToggle, onAbrir }: { dados: DadosDoGrupo; onToggle: () => void; onAbrir: () => void }) {
    // Sem cota, uso e valores na lista: ficam no detalhe do grupo (ECO-14).
    const { grupo, comissario } = dados;
    // Inativo mostra os canais que voltam ao reativar.
    const ligados = canaisLigados({ ...grupo, ativo: true });
    const canais = ligados.length ? ligados.map((c) => ROTULO_CANAL[c]).join(", ") : "Nenhum canal ligado";

    return (
        <div
            role="link"
            tabIndex={0}
            onClick={onAbrir}
            onKeyDown={(e) => e.key === "Enter" && onAbrir()}
            className="group relative flex min-h-[72px] cursor-pointer items-center rounded-xl bg-primary ring-1 ring-border-secondary outline-focus-ring ring-inset hover:ring-2 hover:ring-border-primary focus-visible:outline-2"
        >
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 sm:px-6">
                <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="flex">
                    <Toggle size="sm" isSelected={grupo.ativo} onChange={onToggle} aria-label={grupo.ativo ? `Desativar ${grupo.nome}` : `Ativar ${grupo.nome}`} />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-primary">{grupo.nome}</span>
                        {!grupo.ativo && <BadgeInativo />}
                        {comissario && (
                            <BadgeWithIcon size="sm" type="pill-color" color="brand" iconLeading={CoinsHand}>
                                Comissário {comissario.codigo}
                            </BadgeWithIcon>
                        )}
                    </span>
                    <span className="truncate text-sm text-tertiary">
                        {canais}, {plural(grupo.operadores.length, "pessoa", "pessoas")}
                    </span>
                </div>
            </div>

            <div className="flex w-12 shrink-0 justify-center p-4">
                <ChevronRight className="size-4 text-fg-quaternary transition duration-100 ease-linear group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
        </div>
    );
}
