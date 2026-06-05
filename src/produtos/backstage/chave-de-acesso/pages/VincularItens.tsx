import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Calendar, Cube01, SearchLg, ShoppingBag02, Ticket02 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import productImage from "../assets/product_image.png";

/* ---- Mock data (tokens do design) ---- */
const makeLote = (id: string) => ({ id, name: "{lote_name}" });
const makeTicket = (gid: string, n: number) => ({
    id: `${gid}t${n}`,
    name: "{ticket_name}",
    type: "{ticket_type}",
    lotes: [makeLote(`${gid}t${n}l1`), makeLote(`${gid}t${n}l2`)],
});
const makeGroup = (gid: string) => ({ id: gid, name: "{group_name}", tickets: [makeTicket(gid, 1), makeTicket(gid, 2), makeTicket(gid, 3)] });

const SESSAO = { date: "08 de agosto às 14:00", groups: [makeGroup("g1"), makeGroup("g2")] };

const PRODUTOS = [
    { id: "p1", name: "{product_name}" },
    { id: "p2", name: "{product_name}" },
];

const makeCombo = (cid: string) => ({
    id: cid,
    name: "{Combo_nome}",
    subtitle: "{sessão[0]}+{count_sessao}",
    lotes: [makeLote(`${cid}l1`), makeLote(`${cid}l2`), makeLote(`${cid}l3`)],
});
const COMBOS = [
    { id: "cg1", name: "{group_name}", combos: [makeCombo("cg1c1")] },
    { id: "cg2", name: "{group_name}", combos: [makeCombo("cg2c1")] },
];

/* Leaf (selectable) ids per section. */
const sessaoLeafIds = SESSAO.groups.flatMap((g) => g.tickets.flatMap((t) => t.lotes.map((l) => l.id)));
const produtoLeafIds = PRODUTOS.map((p) => p.id);
const comboLeafIds = COMBOS.flatMap((cg) => cg.combos.flatMap((c) => c.lotes.map((l) => l.id)));
const allLeafIds = [...sessaoLeafIds, ...produtoLeafIds, ...comboLeafIds];

export function VincularItens() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const setIds = (ids: string[], select: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (select ? next.add(id) : next.delete(id)));
            return next;
        });
    };

    const allSelected = (ids: string[]) => ids.length > 0 && ids.every((id) => selected.has(id));
    const someSelected = (ids: string[]) => ids.some((id) => selected.has(id));
    const indeterminate = (ids: string[]) => someSelected(ids) && !allSelected(ids);

    // Itens vinculados, agrupados para o painel da direita.
    const selectedTickets = useMemo(
        () =>
            SESSAO.groups.flatMap((g) =>
                g.tickets.filter((t) => t.lotes.some((l) => selected.has(l.id))).map((t) => ({ ...t, groupName: g.name })),
            ),
        [selected],
    );
    const selectedCombos = useMemo(
        () => COMBOS.flatMap((cg) => cg.combos.filter((c) => c.lotes.some((l) => selected.has(l.id)))),
        [selected],
    );
    const selectedProductsList = useMemo(() => PRODUTOS.filter((p) => selected.has(p.id)), [selected]);

    const hasIngressos = selectedTickets.length > 0 || selectedCombos.length > 0;
    const hasProdutos = selectedProductsList.length > 0;

    const removerTodosIngressos = () => setIds([...sessaoLeafIds, ...comboLeafIds], false);
    const limparProdutos = () => setIds(produtoLeafIds, false);

    return (
        <BackstageLayout activeSection="marketing" activeItem="chave-de-acesso">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center justify-between gap-3 px-4 py-6 md:px-6">
                    <div className="flex items-center gap-3">
                        <ButtonUtility
                            size="md"
                            color="secondary"
                            icon={ArrowLeft}
                            tooltip="Voltar"
                            onClick={() => navigate("/backstage/marketing/chave-de-acesso")}
                        />
                        <h1 className="text-display-xs font-bold text-primary">Chave de acesso</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button size="lg" color="secondary" onClick={() => navigate("/backstage/marketing/chave-de-acesso")}>
                            Voltar
                        </Button>
                        <Button
                            size="lg"
                            color="primary"
                            isDisabled={selected.size === 0}
                            onClick={() => navigate("/backstage/marketing/chave-de-acesso/lista")}
                        >
                            Salvar
                        </Button>
                    </div>
                </header>

                <main className="flex-1 px-4 pb-10 md:px-6">
                    <div className="mx-auto w-full max-w-5xl">
                    <h2 className="text-lg font-semibold text-primary">
                        Marque os itens que serão liberados ao utilizar a chave de acesso
                    </h2>

                    <div className="mt-6 flex gap-6">
                        {/* Coluna esquerda: busca + seções */}
                        <div className="flex min-w-0 flex-1 flex-col gap-4">
                            <Input
                                icon={SearchLg}
                                placeholder="Busque por nome de grupo, item ou lote"
                                value={search}
                                onChange={setSearch}
                            />

                            {/* Sessão */}
                            <SectionCard icon={Calendar} title={SESSAO.date}>
                                <CheckRow
                                    label="Selecionar todos"
                                    bold
                                    isSelected={allSelected(sessaoLeafIds)}
                                    isIndeterminate={indeterminate(sessaoLeafIds)}
                                    onChange={(checked) => setIds(sessaoLeafIds, checked)}
                                />
                                {SESSAO.groups.map((group) => {
                                    const groupIds = group.tickets.flatMap((t) => t.lotes.map((l) => l.id));
                                    return (
                                        <div key={group.id} className="flex flex-col">
                                            <CheckRow
                                                label={group.name}
                                                bold
                                                isSelected={allSelected(groupIds)}
                                                isIndeterminate={indeterminate(groupIds)}
                                                onChange={(checked) => setIds(groupIds, checked)}
                                            />
                                            {group.tickets.map((ticket) => {
                                                const ticketIds = ticket.lotes.map((l) => l.id);
                                                return (
                                                    <div key={ticket.id} className="flex flex-col">
                                                        <CheckRow
                                                            indent="pl-6"
                                                            label={ticket.name}
                                                            badge={ticket.type}
                                                            isSelected={allSelected(ticketIds)}
                                                            isIndeterminate={indeterminate(ticketIds)}
                                                            onChange={(checked) => setIds(ticketIds, checked)}
                                                        />
                                                        {ticket.lotes.map((lote) => (
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

                            {/* Produtos */}
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
                                        <Checkbox
                                            size="sm"
                                            isSelected={selected.has(product.id)}
                                            onChange={(checked) => setIds([product.id], checked)}
                                        />
                                        <img
                                            src={productImage}
                                            alt=""
                                            aria-hidden="true"
                                            className="size-9 shrink-0 rounded-md object-cover ring-1 ring-border-secondary ring-inset"
                                        />
                                        <span className="text-sm text-secondary">{product.name}</span>
                                    </div>
                                ))}
                            </SectionCard>

                            {/* Combos */}
                            <SectionCard icon={Cube01} title="Combos">
                                <CheckRow
                                    label="Selecionar todos"
                                    bold
                                    isSelected={allSelected(comboLeafIds)}
                                    isIndeterminate={indeterminate(comboLeafIds)}
                                    onChange={(checked) => setIds(comboLeafIds, checked)}
                                />
                                {COMBOS.map((cg) => {
                                    const cgIds = cg.combos.flatMap((c) => c.lotes.map((l) => l.id));
                                    return (
                                        <div key={cg.id} className="flex flex-col">
                                            <CheckRow
                                                label={cg.name}
                                                bold
                                                isSelected={allSelected(cgIds)}
                                                isIndeterminate={indeterminate(cgIds)}
                                                onChange={(checked) => setIds(cgIds, checked)}
                                            />
                                            {cg.combos.map((combo) => {
                                                const comboIds = combo.lotes.map((l) => l.id);
                                                return (
                                                    <div key={combo.id} className="flex flex-col">
                                                        <CheckRow
                                                            indent="pl-6"
                                                            label={combo.name}
                                                            subtitle={combo.subtitle}
                                                            isSelected={allSelected(comboIds)}
                                                            isIndeterminate={indeterminate(comboIds)}
                                                            onChange={(checked) => setIds(comboIds, checked)}
                                                        />
                                                        {combo.lotes.map((lote) => (
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

                            <div className="flex flex-col items-center gap-2 py-4">
                                <div className="size-7 animate-spin rounded-full border-[3px] border-secondary border-t-brand" />
                                <span className="text-sm text-tertiary">Carregando...</span>
                            </div>
                        </div>

                        {/* Coluna direita: itens vinculados */}
                        <aside className="hidden w-80 shrink-0 lg:block">
                            <div className="sticky top-6 flex max-h-[calc(100vh-8rem)] flex-col rounded-xl ring-1 ring-border-secondary">
                                <header className="flex items-center justify-between gap-2 border-b border-secondary px-4 py-3">
                                    <span className="text-sm font-semibold text-primary">Itens</span>
                                    <span className="text-xs font-medium text-tertiary">
                                        {selected.size} de {allLeafIds.length} itens vinculados
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
                                        {/* Ingressos */}
                                        {hasIngressos && (
                                            <div className="flex flex-col">
                                                <PanelGroupHeader title="Ingressos" action="Remover todos" onAction={removerTodosIngressos} />

                                                {selectedTickets.map((ticket) => (
                                                    <div key={ticket.id} className="flex flex-col gap-0.5 py-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <span className="text-sm font-medium text-primary">{ticket.name}</span>
                                                            <RemoveLink onClick={() => setIds(ticket.lotes.map((l) => l.id), false)} />
                                                        </div>
                                                        <span className="text-xs text-tertiary">
                                                            {ticket.groupName} - {ticket.type}
                                                        </span>
                                                        <span className="text-xs text-tertiary">{"{DD} de {month} • {HH:MM}"}</span>
                                                    </div>
                                                ))}

                                                {selectedCombos.map((combo) => (
                                                    <div key={combo.id} className="flex flex-col gap-1 py-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <span className="text-sm font-medium text-primary">{"{Combo_nome_longo}"}</span>
                                                            <RemoveLink onClick={() => setIds(combo.lotes.map((l) => l.id), false)} />
                                                        </div>
                                                        <span className="text-xs text-tertiary">{combo.subtitle}</span>
                                                        <div className="mt-1 flex flex-col gap-2">
                                                            {combo.lotes.map((lote) => (
                                                                <div key={lote.id} className="flex items-start gap-2">
                                                                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md text-xs font-medium text-secondary ring-1 ring-border-secondary ring-inset">
                                                                        1
                                                                    </span>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm text-primary">{"{ticket_name}"}</span>
                                                                        <span className="text-xs text-tertiary">{"{ticket_type}"}</span>
                                                                        <span className="text-xs text-tertiary">{"{DD} de {month} • {HH:MM}"}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Produtos */}
                                        {hasProdutos && (
                                            <div className="flex flex-col">
                                                <PanelGroupHeader title="Produtos" action="Limpar tudo" onAction={limparProdutos} />
                                                {selectedProductsList.map((product) => (
                                                    <div key={product.id} className="flex items-center gap-3 py-2">
                                                        <img
                                                            src={productImage}
                                                            alt=""
                                                            aria-hidden="true"
                                                            className="size-9 shrink-0 rounded-md object-cover ring-1 ring-border-secondary ring-inset"
                                                        />
                                                        <span className="flex-1 truncate text-sm text-secondary">{"{nome produto}"}</span>
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
            </div>
        </BackstageLayout>
    );
}

interface SectionCardProps {
    icon: typeof Calendar;
    title: string;
    children: React.ReactNode;
}

const PanelGroupHeader = ({ title, action, onAction }: { title: string; action: string; onAction: () => void }) => (
    <div className="mb-1 flex items-center gap-2">
        <span className="text-xs font-semibold text-tertiary">{title}</span>
        <span className="h-px flex-1 border-t border-dashed border-border-secondary" />
        <button
            type="button"
            onClick={onAction}
            className="text-xs font-medium text-tertiary transition duration-100 ease-linear hover:text-secondary"
        >
            {action}
        </button>
    </div>
);

const RemoveLink = ({ onClick }: { onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className="shrink-0 text-xs font-medium text-tertiary transition duration-100 ease-linear hover:text-secondary"
    >
        Remover
    </button>
);

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
    <div className={cx("flex h-13 items-center gap-2", indent)}>
        <Checkbox size="sm" isSelected={isSelected} isIndeterminate={isIndeterminate} onChange={onChange} />
        <span className={cx("text-sm", bold ? "font-semibold text-primary" : "text-secondary")}>{label}</span>
        {badge && (
            <Badge size="sm" color="gray" type="modern">
                {badge}
            </Badge>
        )}
        {subtitle && <span className="text-xs text-tertiary">{subtitle}</span>}
    </div>
);
