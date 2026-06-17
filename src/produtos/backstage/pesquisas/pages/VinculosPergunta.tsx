import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Calendar, Package, SearchLg, Ticket01 } from "@untitledui/icons";
import { toast } from "sonner";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { TIPO_PERGUNTA, usePesquisas, type ItemVinculavel } from "../data/pesquisas-store";

export function VinculosPergunta() {
    const { perguntaId } = useParams();
    const navigate = useNavigate();
    const { getPergunta, itensVinculaveis, itensDaPergunta, setItensDaPergunta } = usePesquisas();

    const pergunta = perguntaId ? getPergunta(perguntaId) : undefined;

    const [busca, setBusca] = useState("");
    const [sel, setSel] = useState<Set<string>>(() => new Set(perguntaId ? itensDaPergunta(perguntaId).map((i) => i.id) : []));

    const voltar = () => navigate("/backstage/pesquisas");

    const toggle = (id: string) =>
        setSel((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const setVarios = (ids: string[], on: boolean) =>
        setSel((prev) => {
            const next = new Set(prev);
            for (const id of ids) (on ? next.add(id) : next.delete(id));
            return next;
        });

    // Seções: ingressos agrupados por data › setor; produtos numa seção própria.
    const secoes = useMemo(() => {
        const term = busca.trim().toLowerCase();
        const itens = term ? itensVinculaveis.filter((i) => i.nome.toLowerCase().includes(term) || i.grupo.toLowerCase().includes(term)) : itensVinculaveis;

        const ingressos = itens.filter((i) => i.categoria === "ingresso");
        const produtos = itens.filter((i) => i.categoria === "produto");

        const byData = new Map<string, Map<string, ItemVinculavel[]>>();
        for (const it of ingressos) {
            const data = it.data ?? "Sem data";
            if (!byData.has(data)) byData.set(data, new Map());
            const g = byData.get(data)!;
            if (!g.has(it.grupo)) g.set(it.grupo, []);
            g.get(it.grupo)!.push(it);
        }

        const out: { titulo: string; icon: typeof Calendar; grupos: { nome: string; itens: ItemVinculavel[] }[] }[] = Array.from(byData, ([data, grupos]) => ({
            titulo: data,
            icon: Calendar,
            grupos: Array.from(grupos, ([nome, itensGrupo]) => ({ nome, itens: itensGrupo })),
        }));
        if (produtos.length) out.push({ titulo: "Produtos", icon: Package, grupos: [{ nome: "Produtos", itens: produtos }] });
        return out;
    }, [itensVinculaveis, busca]);

    const totalItens = itensVinculaveis.length;
    const vazio = secoes.length === 0;

    // Resumo da seleção: ingressos e produtos selecionados.
    const resumo = useMemo(() => {
        const selecionados = itensVinculaveis.filter((i) => sel.has(i.id));
        return {
            ingressos: selecionados.filter((i) => i.categoria === "ingresso"),
            produtos: selecionados.filter((i) => i.categoria === "produto"),
        };
    }, [itensVinculaveis, sel]);

    const salvar = () => {
        if (!perguntaId) return;
        setItensDaPergunta(perguntaId, Array.from(sel));
        toast.success("Vínculos atualizados", {
            description: sel.size === 0 ? "A pergunta não será exibida em nenhum item." : `Exibida em ${sel.size} ${sel.size === 1 ? "item" : "itens"}.`,
        });
        voltar();
    };

    const meta = pergunta ? TIPO_PERGUNTA[pergunta.tipo] : null;

    return (
        <BackstageLayout activeSection="pesquisas" activeItem="formularios-compra">
            <div className="flex min-w-0 flex-1 flex-col motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-300 motion-safe:ease-out">
                <main className="flex w-full flex-1 flex-col gap-6 px-4 py-6 pb-28 md:px-6">
                    {/* Header */}
                    <div className="flex flex-col gap-3">
                        <button type="button" onClick={voltar} className="flex w-fit items-center gap-1.5 text-sm text-tertiary transition hover:text-secondary">
                            <ArrowLeft className="size-4" />
                            Voltar para perguntas
                        </button>
                        <div className="flex items-start gap-3">
                            {meta && <meta.icon className="mt-1 size-5 shrink-0 text-fg-quaternary" />}
                            <div className="flex flex-col gap-0.5">
                                <h1 className="text-xl font-semibold text-primary">{pergunta?.titulo ?? "Pergunta"}</h1>
                                <p className="text-sm text-tertiary">Selecione os ingressos e produtos em que esta pergunta será feita ao comprador.</p>
                            </div>
                        </div>
                    </div>

                    {/* Lista (esquerda, com busca) + resumo (direita) */}
                    <div className="flex w-full gap-6">
                        <div className="flex min-w-0 flex-1 flex-col gap-4">
                            {/* Busca + Selecionar todos (topo da lista) */}
                            <div className="flex items-center justify-between gap-3">
                                <Input
                                    size="sm"
                                    icon={SearchLg}
                                    aria-label="Buscar itens"
                                    placeholder="Buscar ingresso, setor ou produto"
                                    value={busca}
                                    onChange={setBusca}
                                    className="min-w-0 max-w-[540px] flex-1"
                                />
                                <Button size="sm" color="link-color" className="shrink-0" onClick={() => setVarios(itensVinculaveis.map((i) => i.id), true)}>
                                    Selecionar todos
                                </Button>
                            </div>
                    {vazio ? (
                        <div className="flex flex-1 items-center justify-center py-12">
                            <EmptyState size="sm">
                                <EmptyState.Header>
                                    <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" />
                                </EmptyState.Header>
                                <EmptyState.Content>
                                    <EmptyState.Title>Nada encontrado</EmptyState.Title>
                                    <EmptyState.Description>Tente outro termo de busca.</EmptyState.Description>
                                </EmptyState.Content>
                            </EmptyState>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {secoes.map((secao) => (
                                <section key={secao.titulo} className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <secao.icon className="size-4 shrink-0 text-fg-quaternary" />
                                        <h2 className="text-md font-semibold text-primary">{secao.titulo}</h2>
                                    </div>
                                    {secao.grupos.map((g) => {
                                        const ids = g.itens.map((i) => i.id);
                                        const todos = ids.every((id) => sel.has(id));
                                        const alguns = ids.some((id) => sel.has(id)) && !todos;
                                        return (
                                            <div key={`${secao.titulo}/${g.nome}`} className="overflow-clip rounded-xl bg-primary ring-1 ring-border-secondary">
                                                <div className="flex items-center gap-3 border-b border-secondary bg-secondary/40 px-4 py-3">
                                                    <Checkbox
                                                        size="sm"
                                                        aria-label={`Selecionar todos de ${g.nome}`}
                                                        isSelected={todos}
                                                        isIndeterminate={alguns}
                                                        onChange={(on: boolean) => setVarios(ids, on)}
                                                    />
                                                    <span className="flex-1 text-sm font-semibold text-primary">{g.nome}</span>
                                                    <span className="text-sm text-tertiary">
                                                        {g.itens.length} {g.itens.length === 1 ? "item" : "itens"}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    {g.itens.map((it) => {
                                                        const marcado = sel.has(it.id);
                                                        return (
                                                            <button
                                                                key={it.id}
                                                                type="button"
                                                                onClick={() => toggle(it.id)}
                                                                className={cx(
                                                                    "flex items-center gap-3 border-b border-secondary px-4 py-3 text-left transition-colors duration-100 ease-linear last:border-b-0",
                                                                    marcado ? "bg-brand-primary dark:bg-white/10" : "hover:bg-primary_hover",
                                                                )}
                                                            >
                                                                <Checkbox size="sm" isSelected={marcado} isReadOnly aria-hidden="true" />
                                                                {it.imagem && (
                                                                    <img src={it.imagem} alt="" aria-hidden="true" className="size-9 shrink-0 rounded-md object-cover ring-1 ring-border-secondary" />
                                                                )}
                                                                <span className="min-w-0 flex-1 truncate text-sm text-primary">{it.nome}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </section>
                            ))}
                        </div>
                    )}
                        </div>

                        {/* Resumo da seleção — modelo da 1ª etapa de cortesias (desktop) */}
                        <aside className="sticky top-6 hidden h-[calc(100vh-7rem)] max-h-[560px] w-[330px] shrink-0 flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary lg:flex">
                            <header className="flex shrink-0 items-baseline justify-between gap-2 border-b border-secondary bg-secondary px-4 py-3.5">
                                <h3 className="text-sm font-semibold text-primary">Itens vinculados</h3>
                                <span className="text-xs text-tertiary tabular-nums">
                                    {sel.size} de {totalItens} selecionados
                                </span>
                            </header>

                            {sel.size === 0 ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                                    <FeaturedIcon icon={Ticket01} color="brand" theme="gradient" size="xl" />
                                    <p className="text-md text-primary">
                                        Você ainda não
                                        <br />
                                        vinculou itens
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
                                    {resumo.ingressos.length > 0 && (
                                        <ResumoSection title="Ingressos" onClear={() => setVarios(resumo.ingressos.map((i) => i.id), false)}>
                                            {resumo.ingressos.map((it) => (
                                                <ResumoIngressoRow key={it.id} item={it} onRemover={() => toggle(it.id)} />
                                            ))}
                                        </ResumoSection>
                                    )}
                                    {resumo.produtos.length > 0 && (
                                        <ResumoSection title="Produtos" onClear={() => setVarios(resumo.produtos.map((i) => i.id), false)}>
                                            {resumo.produtos.map((it) => (
                                                <ResumoProdutoRow key={it.id} item={it} onRemover={() => toggle(it.id)} />
                                            ))}
                                        </ResumoSection>
                                    )}
                                </div>
                            )}
                        </aside>
                    </div>
                </main>

                {/* Barra de ações flutuante — largura total */}
                <div className="sticky bottom-4 z-20 mb-4 w-full px-4 md:px-6">
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 shadow-lg ring-1 ring-border-secondary">
                        <span className="text-sm text-tertiary">
                            <span className="font-semibold text-primary tabular-nums">{sel.size}</span> {sel.size === 1 ? "item selecionado" : "itens selecionados"}
                        </span>
                        <div className="flex gap-2">
                            <Button size="md" color="secondary" onClick={voltar}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" onClick={salvar}>
                                Salvar vínculos
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Resumo da seleção — modelo da 1ª etapa de cortesias               */
/* ------------------------------------------------------------------ */

function ResumoSection({ title, onClear, children }: { title: string; onClear: () => void; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <header className="flex items-center gap-3">
                <h4 className="shrink-0 text-sm font-semibold text-primary">{title}</h4>
                <span className="flex-1 border-t border-dashed border-secondary" aria-hidden="true" />
                <Button size="xs" color="link-gray" className="font-medium underline" onClick={onClear}>
                    Remover todos
                </Button>
            </header>
            <div className="flex flex-col gap-4">{children}</div>
        </section>
    );
}

function ResumoIngressoRow({ item, onRemover }: { item: ItemVinculavel; onRemover: () => void }) {
    return (
        <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-primary">{item.nome}</span>
                <span className="truncate text-sm text-tertiary">{item.grupo}</span>
                {item.data && <span className="truncate text-xs text-tertiary">{item.data}</span>}
            </div>
            <Button size="xs" color="link-gray" className="font-medium underline" onClick={onRemover}>
                Remover
            </Button>
        </div>
    );
}

function ResumoProdutoRow({ item, onRemover }: { item: ItemVinculavel; onRemover: () => void }) {
    return (
        <div className="flex items-center gap-3">
            {item.imagem && <img src={item.imagem} alt="" aria-hidden="true" className="size-10 shrink-0 rounded-md object-cover ring-1 ring-secondary" />}
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{item.nome}</span>
            <Button size="xs" color="link-gray" className="font-medium underline" onClick={onRemover}>
                Remover
            </Button>
        </div>
    );
}
