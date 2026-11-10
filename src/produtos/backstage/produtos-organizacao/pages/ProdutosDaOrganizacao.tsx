import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, SearchLg, ShoppingBag01 } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { InputBase } from "@/components/base/input/input";
import { Surgir } from "@/components/foundations/transicao";
import type { ProdutoDaOrganizacao } from "@/plataforma";
import { TITULO_PAGINA } from "@/produtos/backstage/components/titulo-pagina";
import { BackstageLayout } from "../../components/Backstage";
import { BotaoMostrarMais, LIMIAR_FERRAMENTAS, paraBusca, useMostrarMais } from "../../itens/components/escala";
import { formatar, useTextosItens } from "../../itens/data/textos-itens";
import { useBiblioteca } from "../data/biblioteca";

/* ------------------------------------------------------------------ */
/*  Produtos da organização (POR)                                      */
/*                                                                     */
/*  A biblioteca que todos os eventos usam. Cada linha mostra preço    */
/*  sugerido e em quantos eventos o produto está. Busca e "Mostrar     */
/*  mais" só acima do limiar (UI-LST-001).                             */
/* ------------------------------------------------------------------ */

const T = {
    titulo: "Produtos",
    subtitulo: "Cada evento escolhe quais vender, com preço e estoque próprios.",
    criar: "Criar produto",
    buscar: "Buscar produto",
    contagem: "{visiveis} de {total}",
    nada: "Nenhum produto com esse nome.",
    vazio: "Nenhum produto ainda",
    vazioDica: "Crie camisetas, copos, estacionamento e o que mais a organização vende nos eventos.",
    sugerido: "{preco} sugerido",
    eventos: { one: "Em {n} evento", other: "Em {n} eventos" },
    semEvento: "Em nenhum evento",
    abrir: "Abrir {nome}",
    carregando: "Carregando produtos",
};

export function ProdutosDaOrganizacao() {
    const navigate = useNavigate();
    const { numero } = useTextosItens();
    const { carregando, biblioteca, usos } = useBiblioteca();
    const [busca, setBusca] = useState("");
    const termo = paraBusca(busca.trim());
    const ordenados = useMemo(() => [...biblioteca].sort((a, b) => a.nome.localeCompare(b.nome)), [biblioteca]);
    const filtrados = useMemo(() => (termo ? ordenados.filter((p) => paraBusca(p.nome).includes(termo)) : ordenados), [ordenados, termo]);
    const { visiveis, restantes, mostrarMais } = useMostrarMais(filtrados);
    const muitos = biblioteca.length > LIMIAR_FERRAMENTAS;

    return (
        <BackstageLayout showEventContext={false} activeProducer="produtos" showLayoutSwitcher={false}>
            <div className="flex min-w-0 flex-1 flex-col gap-6">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                        <h1 className={TITULO_PAGINA}>{T.titulo}</h1>
                        <p className="text-md text-tertiary">{T.subtitulo}</p>
                    </div>
                    <Button color="primary" size="md" iconLeading={Plus} onClick={() => navigate("/backstage/produtos/novo")}>
                        {T.criar}
                    </Button>
                </header>

                {carregando ? (
                    <div role="status" aria-label={T.carregando} className="flex flex-col gap-3">
                        {[0, 1, 2].map((i) => (
                            <span key={i} aria-hidden="true" className="h-20 w-full animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
                        ))}
                    </div>
                ) : biblioteca.length === 0 ? (
                    <div className="flex items-center justify-center py-16">
                        <EmptyState size="sm">
                            <EmptyState.Header>
                                <EmptyState.FeaturedIcon icon={ShoppingBag01} color="gray" theme="modern" />
                            </EmptyState.Header>
                            <EmptyState.Content>
                                <EmptyState.Title>{T.vazio}</EmptyState.Title>
                                <EmptyState.Description>{T.vazioDica}</EmptyState.Description>
                            </EmptyState.Content>
                            <EmptyState.Footer>
                                <Button color="primary" size="md" iconLeading={Plus} onClick={() => navigate("/backstage/produtos/novo")}>
                                    {T.criar}
                                </Button>
                            </EmptyState.Footer>
                        </EmptyState>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {muitos && (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <InputBase
                                    size="sm"
                                    icon={SearchLg}
                                    aria-label={T.buscar}
                                    placeholder={T.buscar}
                                    value={busca}
                                    onChange={(v: unknown) => setBusca(typeof v === "string" ? v : ((v as { target?: { value?: string } })?.target?.value ?? ""))}
                                    wrapperClassName="w-full sm:max-w-80"
                                />
                                <span role="status" className="text-sm text-tertiary tabular-nums">
                                    {formatar(T.contagem, { visiveis: numero(filtrados.length), total: numero(biblioteca.length) })}
                                </span>
                            </div>
                        )}
                        <ul className="flex flex-col gap-3">
                            {visiveis.map((p) => (
                                <li key={p.id}>
                                    <LinhaDoProduto produto={p} usos={usos.get(p.id) ?? 0} onAbrir={() => navigate(`/backstage/produtos/${p.id}`)} />
                                </li>
                            ))}
                        </ul>
                        <Surgir visivel={filtrados.length === 0}>
                            <p className="text-sm text-tertiary">{T.nada}</p>
                        </Surgir>
                        <BotaoMostrarMais restantes={restantes} onClick={mostrarMais} />
                    </div>
                )}
            </div>
        </BackstageLayout>
    );
}

function LinhaDoProduto({ produto, usos, onAbrir }: { produto: ProdutoDaOrganizacao; usos: number; onAbrir: () => void }) {
    const { preco, plural } = useTextosItens();
    return (
        <button
            type="button"
            onClick={onAbrir}
            aria-label={formatar(T.abrir, { nome: produto.nome })}
            className="flex w-full items-center gap-3 rounded-2xl bg-primary p-4 text-left ring-1 ring-secondary outline-focus-ring transition duration-100 ease-linear hover:ring-brand focus-visible:outline-2 focus-visible:outline-offset-2"
        >
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                {produto.imagem ? <img src={produto.imagem} alt="" className="size-full object-cover" /> : <ShoppingBag01 className="size-5 text-fg-quaternary" aria-hidden="true" />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-md font-semibold text-primary">{produto.nome}</span>
                <span className="text-sm text-tertiary">{usos ? plural(T.eventos, usos) : T.semEvento}</span>
            </span>
            <span className="shrink-0 text-sm font-medium text-primary tabular-nums">{formatar(T.sugerido, { preco: preco(produto.precoBase) })}</span>
        </button>
    );
}
