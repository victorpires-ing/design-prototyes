import { useState } from "react";
import { Calendar, ChevronDown, ChevronRight, Plus, QrCode01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { GRUPOS, type Grupo, type Ingresso } from "../data/ingressos";

const COL = {
    virada: "w-40",
    preco: "w-28",
    emissoes: "w-40",
};

export function Ingressos() {
    const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(GRUPOS.map((g) => g.id)));
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [active, setActive] = useState<Set<string>>(
        () => new Set(GRUPOS.flatMap((g) => g.ingressos.filter((i) => i.active).map((i) => i.id))),
    );

    const toggleGroup = (id: string) => setOpenGroups((p) => toggleSet(p, id));
    const toggleExpand = (id: string) => setExpanded((p) => toggleSet(p, id));
    const toggleActive = (id: string) => setActive((p) => toggleSet(p, id));

    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-ingressos">
            <div className="flex min-w-0 flex-1 flex-col px-4 py-6 md:px-6">
                {/* Header da página */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-display-xs font-bold text-primary">Ingressos</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button size="md" color="secondary" iconLeading={Calendar}>
                            Filtrar por data
                        </Button>
                        <Button size="md" color="secondary">
                            Ajustar abertura de vendas
                        </Button>
                        <Button size="md" color="primary">
                            Editar grupos
                        </Button>
                    </div>
                </header>

                {/* Grupos de ingresso */}
                <div className="mt-6 flex flex-col gap-5">
                    {GRUPOS.map((grupo) => (
                        <GrupoCard
                            key={grupo.id}
                            grupo={grupo}
                            isOpen={openGroups.has(grupo.id)}
                            onToggleOpen={() => toggleGroup(grupo.id)}
                            expanded={expanded}
                            onToggleExpand={toggleExpand}
                            active={active}
                            onToggleActive={toggleActive}
                        />
                    ))}
                </div>
            </div>
        </BackstageLayout>
    );
}

interface GrupoCardProps {
    grupo: Grupo;
    isOpen: boolean;
    onToggleOpen: () => void;
    expanded: Set<string>;
    onToggleExpand: (id: string) => void;
    active: Set<string>;
    onToggleActive: (id: string) => void;
}

function GrupoCard({ grupo, isOpen, onToggleOpen, expanded, onToggleExpand, active, onToggleActive }: GrupoCardProps) {
    return (
        <div className="flex flex-col overflow-hidden rounded-xl ring-1 ring-border-secondary">
            {/* Cabeçalho do grupo */}
            <button type="button" onClick={onToggleOpen} className="flex items-center justify-between gap-3 px-4 py-4 text-left">
                <div className="flex min-w-0 items-center gap-3">
                    <QrCode01 className="size-5 shrink-0 text-fg-secondary" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-md font-semibold text-primary">{grupo.name}</span>
                        <span className="flex flex-wrap gap-x-5 gap-y-0.5 text-sm text-tertiary">
                            <span>
                                Emissões: <span className="text-secondary">{grupo.emissoes}</span>
                            </span>
                            <span>
                                Pendentes: <span className="text-secondary">{grupo.pendentes}</span>
                            </span>
                            <span>
                                Acesso: <span className="text-secondary">{grupo.acesso}</span>
                            </span>
                        </span>
                    </div>
                </div>
                <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-200", !isOpen && "-rotate-90")} />
            </button>

            {isOpen && (
                <>
                    {/* Cabeçalho das colunas */}
                    <div className="flex items-center gap-3 border-y border-secondary bg-secondary/40 px-4 py-2.5">
                        <span className="flex-1 text-xs font-semibold text-tertiary">Nome</span>
                        <span className={cx("shrink-0 text-xs font-semibold text-tertiary", COL.virada)}>Virada de lote</span>
                        <span className={cx("shrink-0 text-xs font-semibold text-tertiary", COL.preco)}>Preço</span>
                        <span className={cx("shrink-0 text-xs font-semibold text-tertiary", COL.emissoes)}>Emissões e estoque</span>
                        <span className="w-8 shrink-0" />
                    </div>

                    {/* Linhas dos ingressos */}
                    {grupo.ingressos.map((ingresso) => (
                        <IngressoRow
                            key={ingresso.id}
                            ingresso={ingresso}
                            isExpanded={expanded.has(ingresso.id)}
                            onToggleExpand={() => onToggleExpand(ingresso.id)}
                            active={active}
                            onToggleActive={onToggleActive}
                        />
                    ))}

                    {/* Footer do grupo */}
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-3.5 text-left text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:text-brand-secondary_hover"
                    >
                        <Plus className="size-4" />
                        Novo ingresso
                    </button>
                </>
            )}
        </div>
    );
}

interface IngressoRowProps {
    ingresso: Ingresso;
    isExpanded: boolean;
    onToggleExpand: () => void;
    active: Set<string>;
    onToggleActive: (id: string) => void;
}

function IngressoRow({ ingresso, isExpanded, onToggleExpand, active, onToggleActive }: IngressoRowProps) {
    return (
        <div>
            {/* Linha do ingresso */}
            <div className="flex items-center gap-3 border-b border-secondary px-4 py-3.5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Toggle size="sm" isSelected={active.has(ingresso.id)} onChange={() => onToggleActive(ingresso.id)} />
                    <button type="button" onClick={onToggleExpand} className="flex min-w-0 flex-col text-left">
                        <span className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-primary">{ingresso.name}</span>
                            <ChevronRight className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-200", isExpanded && "rotate-90")} />
                        </span>
                        <span className="truncate text-sm text-tertiary">{ingresso.lotesLabel}</span>
                    </button>
                </div>
                <div className={cx("shrink-0", COL.virada)}>
                    <span className="text-sm text-tertiary">{ingresso.virada}</span>
                </div>
                <div className={cx("shrink-0", COL.preco)}>
                    <span className="text-sm text-secondary">{ingresso.preco}</span>
                </div>
                <div className={cx("flex shrink-0 flex-col", COL.emissoes)}>
                    <span className="text-sm text-secondary">{ingresso.emissoes}</span>
                    <span className="text-xs text-tertiary">{ingresso.pendente}</span>
                </div>
                <div className="flex w-8 shrink-0 items-center justify-end">
                    <RowMenu />
                </div>
            </div>

            {/* Lotes (quando expandido) */}
            {isExpanded &&
                ingresso.lotes.map((lote) => (
                    <div key={lote.id} className="flex items-center gap-3 border-b border-secondary py-3 pr-4 pl-14">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <Toggle size="sm" isSelected={active.has(lote.id)} onChange={() => onToggleActive(lote.id)} />
                            <span className="truncate text-sm text-primary">{lote.name}</span>
                        </div>
                        <div className={cx("shrink-0", COL.virada)}>
                            <span className="text-sm text-tertiary">{lote.virada}</span>
                        </div>
                        <div className={cx("shrink-0", COL.preco)}>
                            <span className="text-sm text-secondary">{lote.preco}</span>
                        </div>
                        <div className={cx("shrink-0", COL.emissoes)}>
                            <span className="text-sm text-secondary">{lote.emissoes}</span>
                        </div>
                        <span className="w-8 shrink-0" />
                    </div>
                ))}
        </div>
    );
}

function RowMenu() {
    return (
        <Dropdown.Root>
            <Dropdown.DotsButton />
            <Dropdown.Popover className="w-48">
                <Dropdown.Menu>
                    <Dropdown.Item label="Editar" />
                    <Dropdown.Item label="Vincular códigos" />
                    <Dropdown.Item label="Formulário" href="/backstage/catalogo/ingressos/formulario" />
                    <Dropdown.Item textValue="Excluir">
                        <span className="text-error-primary">Excluir</span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown.Popover>
        </Dropdown.Root>
    );
}

function toggleSet(set: Set<string>, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
}
