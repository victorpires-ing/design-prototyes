import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Calendar, Cube01, SearchLg, ShoppingBag02, Ticket02 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { COMBOS, PRODUTOS, SESSOES, comboLeafIds, produtoLeafIds, sessaoLeafIds, sessoesLeafIds } from "../data/itens-evento";

type Filtro = "todos" | "ingressos" | "combos" | "produtos";

export function VincularItens() {
    const navigate = useNavigate();
    const location = useLocation();
    // Modo "adicionar vínculos" (vindo da listagem) muda título/legenda e o destino do voltar.
    const adicionarMode = !!(location.state as { adicionar?: boolean } | null)?.adicionar;
    const backTo = adicionarMode ? "/backstage/marketing/chave-de-acesso/lista" : "/backstage/marketing/chave-de-acesso";
    const [exiting, setExiting] = useState(false);
    // Anima a saída antes de navegar, suavizando a transição.
    const leaveTo = (path: string) => {
        setExiting(true);
        setTimeout(() => navigate(path), 260);
    };
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filtro>("todos");
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const setIds = (ids: string[], select: boolean) =>
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (select ? next.add(id) : next.delete(id)));
            return next;
        });
    const allSelected = (ids: string[]) => ids.length > 0 && ids.every((id) => selected.has(id));
    const indeterminate = (ids: string[]) => ids.some((id) => selected.has(id)) && !allSelected(ids);

    // Itens vinculados, para o painel da direita.
    const selectedIngressos = useMemo(
        () =>
            SESSOES.flatMap((s) =>
                s.grupos.flatMap((g) =>
                    g.ingressos.filter((t) => t.lotes.some((l) => selected.has(l.id))).map((t) => ({ ...t, groupName: g.name, date: s.date })),
                ),
            ),
        [selected],
    );
    const selectedCombos = useMemo(() => COMBOS.filter((c) => c.lotes.some((l) => selected.has(l.id))), [selected]);
    const selectedProdutos = useMemo(() => PRODUTOS.filter((p) => selected.has(p.id)), [selected]);

    const hasIngressos = selectedIngressos.length > 0 || selectedCombos.length > 0;
    const hasProdutos = selectedProdutos.length > 0;

    const removerTodosIngressos = () => setIds([...sessoesLeafIds, ...comboLeafIds], false);
    const limparProdutos = () => setIds(produtoLeafIds, false);

    const showIngressos = filter === "todos" || filter === "ingressos";
    const showProdutos = filter === "todos" || filter === "produtos";
    const showCombos = filter === "todos" || filter === "combos";

    return (
        <BackstageLayout activeSection="marketing" activeItem="chave-de-acesso">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={exiting ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
                transition={{ duration: exiting ? 0.25 : 0.3, ease: "easeOut" }}
                className="flex min-w-0 flex-1 flex-col md:h-[calc(100dvh-3rem)] md:overflow-hidden"
            >
                <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-6 md:px-6">
                    <div className="flex items-center gap-3">
                        <ButtonUtility size="md" color="secondary" icon={ArrowLeft} tooltip="Voltar" onClick={() => leaveTo(backTo)} />
                        <h1 className="text-display-xs font-bold text-primary">Chave de acesso</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button size="lg" color="secondary" onClick={() => leaveTo(backTo)}>
                            Voltar
                        </Button>
                        <Button
                            size="lg"
                            color="primary"
                            isDisabled={selected.size === 0}
                            onClick={() => leaveTo("/backstage/marketing/chave-de-acesso/lista")}
                        >
                            Salvar
                        </Button>
                    </div>
                </header>

                <main className="flex-1 px-4 pb-10 md:min-h-0 md:overflow-y-auto md:px-6">
                    <div className="mx-auto w-full max-w-5xl">
                        <h2 className="text-lg font-semibold text-primary">
                            {adicionarMode ? "Adicionar vínculos" : "Marque os itens que serão liberados ao utilizar a chave de acesso"}
                        </h2>
                        {adicionarMode && (
                            <p className="mt-1 text-sm text-tertiary">
                                Esta ação apenas adiciona novos vínculos. Itens já vinculados não serão alterados.
                            </p>
                        )}

                        <div className="mt-6 flex gap-6">
                            {/* Coluna esquerda: filtro + busca + seções */}
                            <div className="flex min-w-0 flex-1 flex-col gap-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <ButtonGroup
                                        selectedKeys={[filter]}
                                        onSelectionChange={(keys) => {
                                            const value = [...keys][0] as Filtro;
                                            if (value) setFilter(value);
                                        }}
                                    >
                                        <ButtonGroupItem id="todos">Todos</ButtonGroupItem>
                                        <ButtonGroupItem id="ingressos">Ingressos</ButtonGroupItem>
                                        <ButtonGroupItem id="combos">Combos</ButtonGroupItem>
                                        <ButtonGroupItem id="produtos">Produtos</ButtonGroupItem>
                                    </ButtonGroup>
                                    <div className="min-w-0 flex-1">
                                        <Input icon={SearchLg} placeholder="Busque por nome de grupo, item ou lote" value={search} onChange={setSearch} />
                                    </div>
                                </div>

                                {/* Ingressos — um bloco por sessão */}
                                {showIngressos &&
                                    SESSOES.map((sessao) => {
                                        const ids = sessaoLeafIds(sessao);
                                        return (
                                            <SectionCard key={sessao.id} icon={Calendar} title={sessao.date}>
                                                <CheckRow
                                                    label="Selecionar todos"
                                                    bold
                                                    isSelected={allSelected(ids)}
                                                    isIndeterminate={indeterminate(ids)}
                                                    onChange={(checked) => setIds(ids, checked)}
                                                />
                                                {sessao.grupos.map((group) => {
                                                    const groupIds = group.ingressos.flatMap((t) => t.lotes.map((l) => l.id));
                                                    return (
                                                        <div key={group.id} className="flex flex-col">
                                                            <CheckRow
                                                                label={group.name}
                                                                bold
                                                                isSelected={allSelected(groupIds)}
                                                                isIndeterminate={indeterminate(groupIds)}
                                                                onChange={(checked) => setIds(groupIds, checked)}
                                                            />
                                                            {group.ingressos.map((ing) => {
                                                                const ingIds = ing.lotes.map((l) => l.id);
                                                                return (
                                                                    <div key={ing.id} className="flex flex-col">
                                                                        <CheckRow
                                                                            indent="pl-6"
                                                                            label={ing.name}
                                                                            badge={ing.type}
                                                                            isSelected={allSelected(ingIds)}
                                                                            isIndeterminate={indeterminate(ingIds)}
                                                                            onChange={(checked) => setIds(ingIds, checked)}
                                                                        />
                                                                        {ing.lotes.map((lote) => (
                                                                            <CheckRow
                                                                                key={lote.id}
                                                                                indent="pl-12"
                                                                                label={lote.name}
                                                                                isSelected={selected.has(lote.id)}
                                                                                onChange={(checked) => setIds([lote.id], checked)}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                            </SectionCard>
                                        );
                                    })}

                                {/* Produtos */}
                                {showProdutos && (
                                    <SectionCard icon={ShoppingBag02} title="Produtos">
                                        <CheckRow
                                            label="Selecionar todos"
                                            bold
                                            isSelected={allSelected(produtoLeafIds)}
                                            isIndeterminate={indeterminate(produtoLeafIds)}
                                            onChange={(checked) => setIds(produtoLeafIds, checked)}
                                        />
                                        {PRODUTOS.map((product) => (
                                            <div key={product.id} className="flex h-13 items-center gap-3">
                                                <Checkbox size="sm" isSelected={selected.has(product.id)} onChange={(checked) => setIds([product.id], checked)} />
                                                <img
                                                    src={product.img}
                                                    alt=""
                                                    aria-hidden="true"
                                                    className="size-9 shrink-0 rounded-md object-cover ring-1 ring-border-secondary ring-inset"
                                                />
                                                <span className="text-sm text-secondary">{product.name}</span>
                                            </div>
                                        ))}
                                    </SectionCard>
                                )}

                                {/* Combos */}
                                {showCombos && (
                                    <SectionCard icon={Cube01} title="Combos">
                                        <CheckRow
                                            label="Selecionar todos"
                                            bold
                                            isSelected={allSelected(comboLeafIds)}
                                            isIndeterminate={indeterminate(comboLeafIds)}
                                            onChange={(checked) => setIds(comboLeafIds, checked)}
                                        />
                                        {COMBOS.map((combo) => {
                                            const comboIds = combo.lotes.map((l) => l.id);
                                            return (
                                                <div key={combo.id} className="flex flex-col">
                                                    <CheckRow
                                                        label={combo.name}
                                                        bold
                                                        subtitle={combo.legenda}
                                                        isSelected={allSelected(comboIds)}
                                                        isIndeterminate={indeterminate(comboIds)}
                                                        onChange={(checked) => setIds(comboIds, checked)}
                                                    />
                                                    {combo.lotes.map((lote) => (
                                                        <CheckRow
                                                            key={lote.id}
                                                            indent="pl-6"
                                                            label={lote.name}
                                                            isSelected={selected.has(lote.id)}
                                                            onChange={(checked) => setIds([lote.id], checked)}
                                                        />
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </SectionCard>
                                )}

                                <div className="flex flex-col items-center gap-2 py-4">
                                    <div className="size-7 animate-spin rounded-full border-[3px] border-secondary border-t-brand" />
                                    <span className="text-sm text-tertiary">Carregando...</span>
                                </div>
                            </div>

                            {/* Coluna direita: itens vinculados */}
                            <aside className="hidden w-80 shrink-0 lg:block">
                                <div className="sticky top-2 flex max-h-[calc(100dvh-9rem)] flex-col rounded-xl ring-1 ring-border-secondary">
                                    <header className="flex items-center justify-between gap-2 border-b border-secondary px-4 py-3">
                                        <span className="text-sm font-semibold text-primary">Itens</span>
                                        <span className="text-xs font-medium text-tertiary">
                                            {selected.size} {selected.size === 1 ? "item vinculado" : "itens vinculados"}
                                        </span>
                                    </header>

                                    {selected.size === 0 ? (
                                        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                                            <FeaturedIcon icon={Ticket02} color="error" theme="dark" size="lg" />
                                            <p className="text-sm font-medium text-tertiary">
                                                Você ainda não
                                                <br />
                                                selecionou nenhum item
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
                                            {hasIngressos && (
                                                <div className="flex flex-col">
                                                    <PanelGroupHeader title="Ingressos" action="Remover todos" onAction={removerTodosIngressos} />

                                                    {selectedIngressos.map((ing) => (
                                                        <div key={ing.id} className="flex flex-col gap-0.5 py-3">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <span className="text-sm font-medium text-primary">{ing.name}</span>
                                                                <RemoveLink onClick={() => setIds(ing.lotes.map((l) => l.id), false)} />
                                                            </div>
                                                            <span className="text-xs text-tertiary">
                                                                {ing.groupName} • {ing.type}
                                                            </span>
                                                            <span className="text-xs text-tertiary">{ing.date}</span>
                                                        </div>
                                                    ))}

                                                    {selectedCombos.map((combo) => (
                                                        <div key={combo.id} className="flex flex-col gap-1 py-3">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <span className="text-sm font-medium text-primary">{combo.name}</span>
                                                                <RemoveLink onClick={() => setIds(combo.lotes.map((l) => l.id), false)} />
                                                            </div>
                                                            <span className="text-xs text-tertiary">{combo.legenda}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {hasProdutos && (
                                                <div className="flex flex-col">
                                                    <PanelGroupHeader title="Produtos" action="Limpar tudo" onAction={limparProdutos} />
                                                    {selectedProdutos.map((product) => (
                                                        <div key={product.id} className="flex items-center gap-3 py-2">
                                                            <img
                                                                src={product.img}
                                                                alt=""
                                                                aria-hidden="true"
                                                                className="size-9 shrink-0 rounded-md object-cover ring-1 ring-border-secondary ring-inset"
                                                            />
                                                            <span className="flex-1 truncate text-sm text-secondary">{product.name}</span>
                                                            <RemoveLink onClick={() => setIds([product.id], false)} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </aside>
                        </div>
                    </div>
                </main>
            </motion.div>
        </BackstageLayout>
    );
}

const PanelGroupHeader = ({ title, action, onAction }: { title: string; action: string; onAction: () => void }) => (
    <div className="mb-1 flex items-center gap-2">
        <span className="text-xs font-semibold text-tertiary">{title}</span>
        <span className="h-px flex-1 border-t border-dashed border-border-secondary" />
        <button type="button" onClick={onAction} className="text-xs font-medium text-tertiary transition duration-100 ease-linear hover:text-secondary">
            {action}
        </button>
    </div>
);

const RemoveLink = ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick} className="shrink-0 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:text-secondary">
        Remover
    </button>
);

interface SectionCardProps {
    icon: typeof Calendar;
    title: string;
    children: React.ReactNode;
}

const SectionCard = ({ icon: Icon, title, children }: SectionCardProps) => (
    <section className="overflow-hidden rounded-xl ring-1 ring-border-secondary">
        <header className="flex items-center gap-3 border-b border-secondary px-4 py-3">
            <FeaturedIcon icon={Icon} color="gray" theme="modern" size="sm" />
            <span className="text-sm font-semibold text-primary">{title}</span>
        </header>
        <div className="flex flex-col px-4 py-1">{children}</div>
    </section>
);

interface CheckRowProps {
    label: string;
    badge?: string;
    subtitle?: string;
    indent?: string;
    bold?: boolean;
    isSelected: boolean;
    isIndeterminate?: boolean;
    onChange: (checked: boolean) => void;
}

const CheckRow = ({ label, badge, subtitle, indent, bold, isSelected, isIndeterminate, onChange }: CheckRowProps) => (
    <div className={cx("flex gap-2", subtitle ? "items-start py-2.5" : "h-13 items-center", indent)}>
        <Checkbox
            size="sm"
            isSelected={isSelected}
            isIndeterminate={isIndeterminate}
            onChange={onChange}
            className={subtitle ? "mt-0.5" : undefined}
        />
        <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
                <span className={cx("text-sm", bold ? "font-semibold text-primary" : "text-secondary")}>{label}</span>
                {badge && (
                    <Badge size="sm" color="gray" type="modern">
                        {badge}
                    </Badge>
                )}
            </div>
            {subtitle && <span className="text-xs text-tertiary">{subtitle}</span>}
        </div>
    </div>
);
