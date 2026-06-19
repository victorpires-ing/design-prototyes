import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Calendar, ChevronDown, SearchLg, Ticket01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Toggle } from "@/components/base/toggle/toggle";
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
    // Itens marcados como "Resposta obrigatória". Por padrão, ao vincular um item, a resposta é obrigatória.
    const [obrig, setObrig] = useState<Set<string>>(() => new Set(perguntaId ? itensDaPergunta(perguntaId).map((i) => i.id) : []));

    const voltar = () => navigate("/backstage/pesquisas");

    const toggle = (id: string) =>
        setSel((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                setObrig((o) => {
                    const n = new Set(o);
                    n.delete(id);
                    return n;
                });
            } else {
                next.add(id);
                setObrig((o) => new Set(o).add(id));
            }
            return next;
        });

    const setVarios = (ids: string[], on: boolean) => {
        setSel((prev) => {
            const next = new Set(prev);
            for (const id of ids) (on ? next.add(id) : next.delete(id));
            return next;
        });
        setObrig((prev) => {
            const next = new Set(prev);
            for (const id of ids) (on ? next.add(id) : next.delete(id));
            return next;
        });
    };

    const toggleObrig = (id: string) =>
        setObrig((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    // Accordions abertos por padrão (lista aberta), como na 1ª etapa de cortesias.
    const [fechados, setFechados] = useState<Set<string>>(new Set());
    const toggleAccordion = useCallback((titulo: string) => {
        setFechados((prev) => {
            const next = new Set(prev);
            if (next.has(titulo)) next.delete(titulo);
            else next.add(titulo);
            return next;
        });
    }, []);
    const estaAberto = (titulo: string) => busca.trim() !== "" || !fechados.has(titulo);

    // Seções: ingressos agrupados por data › setor.
    const secoes = useMemo(() => {
        const term = busca.trim().toLowerCase();
        const ingressos = term ? itensVinculaveis.filter((i) => i.nome.toLowerCase().includes(term) || i.grupo.toLowerCase().includes(term)) : itensVinculaveis;

        const byData = new Map<string, Map<string, ItemVinculavel[]>>();
        for (const it of ingressos) {
            const data = it.data ?? "Sem data";
            if (!byData.has(data)) byData.set(data, new Map());
            const g = byData.get(data)!;
            if (!g.has(it.grupo)) g.set(it.grupo, []);
            g.get(it.grupo)!.push(it);
        }

        return Array.from(byData, ([data, grupos]) => ({
            titulo: data,
            icon: Calendar,
            grupos: Array.from(grupos, ([nome, itensGrupo]) => ({ nome, itens: itensGrupo })),
        }));
    }, [itensVinculaveis, busca]);

    const vazio = secoes.length === 0;

    // Resumo da seleção: ingressos selecionados.
    const resumo = useMemo(() => {
        const selecionados = itensVinculaveis.filter((i) => sel.has(i.id));
        return { ingressos: selecionados };
    }, [itensVinculaveis, sel]);

    const salvar = () => {
        if (!perguntaId) return;
        setItensDaPergunta(perguntaId, Array.from(sel));
        toast.success("Vínculos atualizados", {
            description:
                sel.size === 0
                    ? `${pergunta?.titulo ?? "A pergunta"} não será exibida em nenhum item.`
                    : `${pergunta?.titulo ?? "Pergunta"} vinculada a ${sel.size} ${sel.size === 1 ? "item" : "itens"}.`,
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
                                <p className="text-sm text-tertiary">Selecione os ingressos em que esta pergunta será feita ao comprador.</p>
                            </div>
                        </div>
                    </div>

                    {/* Divider entre o header e a busca */}
                    <hr className="border-t border-secondary" />

                    {/* Lista (esquerda, com busca) + resumo (direita) */}
                    <div className="flex w-full gap-6">
                        <section className="flex min-w-0 flex-1 flex-col gap-4">
                            <Input
                                icon={SearchLg}
                                label="Buscar itens"
                                placeholder="Busque por nome do grupo ou item"
                                value={busca}
                                onChange={setBusca}
                            />

                            {vazio ? (
                                <p className="rounded-lg bg-secondary px-4 py-8 text-center text-sm text-tertiary">Nenhum item corresponde à busca.</p>
                            ) : (
                                secoes.map((secao) => (
                                    <AccordionShell key={secao.titulo} icon={secao.icon} title={secao.titulo} isOpen={estaAberto(secao.titulo)} onToggle={() => toggleAccordion(secao.titulo)}>
                                        {secao.grupos.map((g) => {
                                            const ids = g.itens.map((i) => i.id);
                                            const todos = ids.length > 0 && ids.every((id) => sel.has(id));
                                            const alguns = ids.some((id) => sel.has(id)) && !todos;
                                            return (
                                                <div key={g.nome} className="flex flex-col gap-2">
                                                    <label className="flex w-fit cursor-pointer items-center gap-2.5">
                                                        <Checkbox size="sm" isSelected={todos} isIndeterminate={alguns} onChange={(on: boolean) => setVarios(ids, on)} aria-label={`Selecionar todos de ${g.nome}`} />
                                                        <span className="text-sm font-semibold text-primary">{g.nome}</span>
                                                    </label>
                                                    <div className="flex flex-col gap-1">
                                                        {g.itens.map((it) => (
                                                            <ItemRow
                                                                key={it.id}
                                                                item={it}
                                                                marcado={sel.has(it.id)}
                                                                obrigatorio={obrig.has(it.id)}
                                                                onToggle={() => toggle(it.id)}
                                                                onToggleObrig={() => toggleObrig(it.id)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </AccordionShell>
                                ))
                            )}
                        </section>

                        {/* Resumo da seleção — modelo da 1ª etapa de cortesias (desktop) */}
                        <aside className="sticky top-6 hidden h-[calc(100vh-7rem)] max-h-[560px] w-[330px] shrink-0 flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary lg:mt-[26px] lg:flex">
                            <header className="flex shrink-0 items-baseline justify-between gap-2 border-b border-secondary bg-secondary px-4 py-3.5">
                                <h3 className="text-sm font-semibold text-primary">Itens vinculados</h3>
                                <span className="text-xs text-tertiary tabular-nums">
                                    {sel.size} {sel.size === 1 ? "selecionado" : "selecionados"}
                                </span>
                            </header>

                            {sel.size === 0 ? (
                                <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                                    <FeaturedIcon icon={Ticket01} color="brand" theme="gradient" size="xl" />
                                    <p className="text-md text-primary">Sem itens vinculados a essa pergunta</p>
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
                                </div>
                            )}

                            {/* Rodapé do resumo — cancelar + salvar */}
                            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-secondary px-4 py-3.5">
                                <Button size="md" color="secondary" onClick={voltar}>
                                    Cancelar
                                </Button>
                                <Button size="md" color="primary" onClick={salvar}>
                                    Salvar vínculos
                                </Button>
                            </div>
                        </aside>
                    </div>
                </main>

                {/* Barra de ações flutuante — apenas mobile (no desktop a ação fica no resumo) */}
                <div className="sticky bottom-4 z-20 mb-4 w-full px-4 md:px-6 lg:hidden">
                    <div className="flex items-center justify-end gap-2 rounded-xl bg-primary px-4 py-3 shadow-lg ring-1 ring-border-secondary">
                        <Button size="md" color="secondary" onClick={voltar}>
                            Cancelar
                        </Button>
                        <Button size="md" color="primary" onClick={salvar}>
                            Salvar vínculos
                        </Button>
                    </div>
                </div>
            </div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Accordion + linha de item — layout da 1ª etapa de cortesias       */
/* ------------------------------------------------------------------ */

function AccordionShell({ icon: Icon, title, isOpen, onToggle, children }: { icon: React.FC<{ className?: string }>; title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
        <div className="flex flex-col overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                className={cx("flex items-center gap-3 px-4 py-3 text-left hover:bg-primary_hover", isOpen && "border-b border-secondary")}
            >
                <FeaturedIcon icon={Icon} color="gray" size="sm" theme="modern" />
                <h3 className="flex-1 text-sm font-semibold text-primary">{title}</h3>
                <ChevronDown aria-hidden="true" className={cx("size-4 shrink-0 text-fg-quaternary transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && <div className="flex flex-col gap-4 p-4">{children}</div>}
        </div>
    );
}

function ItemRow({ item, marcado, obrigatorio, onToggle, onToggleObrig }: { item: ItemVinculavel; marcado: boolean; obrigatorio: boolean; onToggle: () => void; onToggleObrig: () => void }) {
    return (
        <div className={cx("flex items-center gap-2 rounded-md px-2 py-1.5 transition duration-100 ease-linear hover:bg-primary_hover")}>
            <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <Checkbox size="sm" isSelected={marcado} isReadOnly aria-hidden="true" />
                {item.imagem && <img src={item.imagem} alt="" aria-hidden="true" className="size-9 shrink-0 rounded-md object-cover ring-1 ring-secondary" />}
                <span className="min-w-0 truncate text-sm font-medium text-primary">{item.nome}</span>
            </button>
            <label className={cx("flex shrink-0 items-center gap-2 transition-opacity duration-100 ease-linear", marcado ? "opacity-100" : "pointer-events-none opacity-40")}>
                <span className="text-xs text-tertiary">Resposta obrigatória</span>
                <Toggle size="sm" isSelected={obrigatorio} isDisabled={!marcado} onChange={onToggleObrig} aria-label={`Resposta obrigatória para ${item.nome}`} />
            </label>
        </div>
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
