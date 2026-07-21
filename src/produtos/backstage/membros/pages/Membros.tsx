import { useMemo, useState } from "react";
import type { Key } from "react-aria-components";
import { LinkExternal01, Plus, SearchLg, Trash01, Users01 } from "@untitledui/icons";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Tabs } from "@/components/application/tabs/tabs";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { CriarGrupoModal } from "../../components/CriarGrupoModal";
import { CriarMembroModal } from "../../components/CriarMembroModal";
import { CARGOS, cargoById, eventoById, removeGrupos, removeMembros, useGrupos, useMembros, type Grupo, type Membro } from "../../components/membros-store";

type TabKey = "membros" | "grupos" | "cargos";

const PLACEHOLDERS: Record<TabKey, string> = {
    membros: "Busque por e-mail",
    grupos: "Busque por grupo ou evento",
    cargos: "Busque por cargo",
};

export function Membros() {
    const membros = useMembros();
    const grupos = useGrupos();
    const [tab, setTab] = useState<TabKey>("membros");
    const [busca, setBusca] = useState("");
    const [membroModalOpen, setMembroModalOpen] = useState(false);
    const [grupoModalOpen, setGrupoModalOpen] = useState(false);
    const [selMembros, setSelMembros] = useState<Set<string>>(new Set());
    const [selGrupos, setSelGrupos] = useState<Set<string>>(new Set());
    const [confirmRemover, setConfirmRemover] = useState(false);

    const termo = busca.trim().toLowerCase();

    const membrosFiltrados = useMemo(
        () => (termo ? membros.filter((m) => m.email.toLowerCase().includes(termo)) : membros),
        [membros, termo],
    );
    const gruposFiltrados = useMemo(() => {
        if (!termo) return grupos;
        return grupos.filter(
            (g) => g.nome.toLowerCase().includes(termo) || g.eventoIds.some((id) => (eventoById(id)?.nome ?? "").toLowerCase().includes(termo)),
        );
    }, [grupos, termo]);
    const cargosFiltrados = useMemo(() => (termo ? CARGOS.filter((c) => c.nome.toLowerCase().includes(termo)) : CARGOS), [termo]);

    const changeTab = (key: TabKey) => {
        setTab(key);
        setBusca("");
        setSelMembros(new Set());
        setSelGrupos(new Set());
    };

    const selCount = tab === "membros" ? selMembros.size : tab === "grupos" ? selGrupos.size : 0;
    const podeRemover = tab === "membros" || tab === "grupos";

    const confirmarRemocao = () => {
        if (tab === "membros") {
            removeMembros(selMembros);
            toast.success(selMembros.size === 1 ? "Membro removido" : `${selMembros.size} membros removidos`);
            setSelMembros(new Set());
        } else if (tab === "grupos") {
            removeGrupos(selGrupos);
            toast.success(selGrupos.size === 1 ? "Grupo excluído" : `${selGrupos.size} grupos excluídos`);
            setSelGrupos(new Set());
        }
        setConfirmRemover(false);
    };

    return (
        <BackstageLayout showEventContext={false} activeProducer="membros">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex min-h-11 flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-display-xs font-bold text-primary">Membros</h1>
                    <div className="flex min-h-11 items-center">
                        {tab === "membros" && (
                            <Button size="md" color="primary" iconLeading={Plus} onClick={() => setMembroModalOpen(true)}>
                                Adicionar membro
                            </Button>
                        )}
                        {tab === "grupos" && (
                            <Button size="md" color="primary" iconLeading={Plus} onClick={() => setGrupoModalOpen(true)}>
                                Novo grupo
                            </Button>
                        )}
                    </div>
                </header>

                <main className="flex flex-1 flex-col gap-5 px-6 pb-10">
                    <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                        {/* Barra: tabs (esquerda) + [Remover · busca] (direita) */}
                        <div className="flex flex-col gap-3 border-b border-secondary p-4 md:flex-row md:items-center md:justify-between md:px-6">
                            <Tabs selectedKey={tab} onSelectionChange={(key: Key) => changeTab(key as TabKey)} className="w-fit!">
                                <Tabs.List type="button-border" size="sm">
                                    <Tabs.Item id="membros">{`Membros (${membros.length})`}</Tabs.Item>
                                    <Tabs.Item id="grupos">{`Grupos (${grupos.length})`}</Tabs.Item>
                                    <Tabs.Item id="cargos">{`Cargos (${CARGOS.length})`}</Tabs.Item>
                                </Tabs.List>
                            </Tabs>
                            <div className="flex items-center gap-3">
                                {podeRemover && (
                                    <Button
                                        size="sm"
                                        color="secondary-destructive"
                                        iconLeading={Trash01}
                                        isDisabled={selCount === 0}
                                        onClick={() => setConfirmRemover(true)}
                                    >
                                        {`Remover (${selCount})`}
                                    </Button>
                                )}
                                <div className="w-full md:w-72">
                                    <Input icon={SearchLg} size="sm" aria-label="Buscar" placeholder={PLACEHOLDERS[tab]} value={busca} onChange={setBusca} />
                                </div>
                            </div>
                        </div>

                        {tab === "membros" && <MembrosTable rows={membrosFiltrados} selected={selMembros} onChange={setSelMembros} />}
                        {tab === "grupos" && <GruposTable rows={gruposFiltrados} selected={selGrupos} onChange={setSelGrupos} />}
                        {tab === "cargos" && <CargosTable rows={cargosFiltrados} />}
                    </div>
                </main>
            </div>

            <CriarMembroModal isOpen={membroModalOpen} onClose={() => setMembroModalOpen(false)} />
            <CriarGrupoModal isOpen={grupoModalOpen} onClose={() => setGrupoModalOpen(false)} />

            <ConfirmarRemocaoModal
                isOpen={confirmRemover}
                tab={tab}
                count={selCount}
                onClose={() => setConfirmRemover(false)}
                onConfirm={confirmarRemocao}
            />
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function TableEmpty({ description }: { description: string }) {
    return (
        <div className="flex items-center justify-center overflow-hidden px-6 py-16">
            <EmptyState size="sm">
                <EmptyState.Header>
                    <EmptyState.FeaturedIcon icon={SearchLg} color="gray" theme="modern" />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title>Nenhum resultado</EmptyState.Title>
                    <EmptyState.Description>{description}</EmptyState.Description>
                </EmptyState.Content>
            </EmptyState>
        </div>
    );
}

const CELL = "px-4 py-4 md:px-6";
const HEADER_CELL = "px-4 py-3 text-sm font-semibold text-tertiary md:px-6";

function toggleId(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
}

/* ------------------------------------------------------------------ */
/*  Membros table                                                      */
/* ------------------------------------------------------------------ */

const MEMBROS_COLS = "grid-cols-[44px_minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]";

function MembrosTable({ rows, selected, onChange }: { rows: Membro[]; selected: Set<string>; onChange: (s: Set<string>) => void }) {
    if (rows.length === 0) return <TableEmpty description="Não encontramos membros para essa busca." />;

    const allSel = rows.every((r) => selected.has(r.id));
    const someSel = !allSel && rows.some((r) => selected.has(r.id));
    const toggleAll = () => onChange(allSel ? new Set() : new Set(rows.map((r) => r.id)));

    return (
        <>
            <div className={cx("hidden items-center border-b border-secondary bg-secondary_subtle md:grid", MEMBROS_COLS)}>
                <span className="flex items-center justify-center py-3">
                    <Checkbox isSelected={allSel} isIndeterminate={someSel} onChange={toggleAll} aria-label="Selecionar todos" />
                </span>
                <span className={HEADER_CELL}>E-mail</span>
                <span className={HEADER_CELL}>Cargos</span>
                <span className={HEADER_CELL}>Grupos</span>
                <span className={HEADER_CELL}>Eventos</span>
            </div>
            {rows.map((m, i) => {
                const grupoCount = m.grupoIds.length;
                return (
                    <div
                        key={m.id}
                        className={cx("flex flex-col gap-3 py-3 md:grid md:items-center md:gap-0 md:py-0", MEMBROS_COLS, i !== rows.length - 1 && "border-b border-secondary")}
                    >
                        <span className="flex items-center gap-2 px-4 md:justify-center md:px-0">
                            <Checkbox isSelected={selected.has(m.id)} onChange={() => onChange(toggleId(selected, m.id))} aria-label={`Selecionar ${m.email}`} />
                        </span>
                        <div className={cx(CELL, "flex items-center gap-2 py-0 md:py-4")}>
                            <span className="truncate text-sm font-medium text-primary">{m.email}</span>
                            <LinkExternal01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        </div>
                        <div className={cx(CELL, "flex flex-wrap gap-1.5 py-0 md:py-4")}>
                            {m.cargoIds.map((id) => (
                                <Badge key={id} size="sm" type="pill-color" color={id === "administrador" ? "success" : "gray"}>
                                    {cargoById(id)?.nome ?? id}
                                </Badge>
                            ))}
                        </div>
                        <div className={cx(CELL, "py-0 text-sm text-tertiary md:py-4")}>
                            {grupoCount} {grupoCount === 1 ? "grupo" : "grupos"}
                        </div>
                        <div className={cx(CELL, "py-0 text-sm text-tertiary md:py-4")}>{m.eventosCount} eventos</div>
                    </div>
                );
            })}
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Grupos table                                                       */
/* ------------------------------------------------------------------ */

const GRUPOS_COLS = "grid-cols-[44px_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]";

function GruposTable({ rows, selected, onChange }: { rows: Grupo[]; selected: Set<string>; onChange: (s: Set<string>) => void }) {
    if (rows.length === 0) return <TableEmpty description="Não encontramos grupos para essa busca." />;

    const selecionaveis = rows.filter((r) => !r.sistema);
    const allSel = selecionaveis.length > 0 && selecionaveis.every((r) => selected.has(r.id));
    const someSel = !allSel && selecionaveis.some((r) => selected.has(r.id));
    const toggleAll = () => onChange(allSel ? new Set() : new Set(selecionaveis.map((r) => r.id)));

    return (
        <>
            <div className={cx("hidden items-center border-b border-secondary bg-secondary_subtle md:grid", GRUPOS_COLS)}>
                <span className="flex items-center justify-center py-3">
                    <Checkbox isSelected={allSel} isIndeterminate={someSel} onChange={toggleAll} aria-label="Selecionar todos" />
                </span>
                <span className={HEADER_CELL}>Nome do grupo</span>
                <span className={HEADER_CELL}>Membros</span>
                <span className={HEADER_CELL}>Eventos</span>
            </div>
            {rows.map((g, i) => {
                const membroCount = g.membroIds.length;
                const eventoCount = g.eventoIds.length;
                return (
                    <div
                        key={g.id}
                        className={cx("flex flex-col gap-3 py-3 md:grid md:items-center md:gap-0 md:py-0", GRUPOS_COLS, i !== rows.length - 1 && "border-b border-secondary")}
                    >
                        <span className="flex items-center gap-2 px-4 md:justify-center md:px-0">
                            <Checkbox
                                isSelected={selected.has(g.id)}
                                isDisabled={g.sistema}
                                onChange={() => onChange(toggleId(selected, g.id))}
                                aria-label={g.sistema ? `${g.nome} (grupo padrão, não removível)` : `Selecionar ${g.nome}`}
                            />
                        </span>
                        <div className={cx(CELL, "flex items-center gap-2 py-0 md:py-4")}>
                            <Users01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                            <span className="truncate text-sm font-semibold text-primary">{g.nome}</span>
                            {g.sistema && (
                                <Badge size="sm" type="pill-color" color="gray">
                                    Padrão
                                </Badge>
                            )}
                        </div>
                        <div className={cx(CELL, "py-0 text-sm text-tertiary md:py-4")}>
                            {membroCount} {membroCount === 1 ? "usuário" : "usuários"}
                        </div>
                        <div className={cx(CELL, "py-0 text-sm text-tertiary md:py-4")}>
                            {eventoCount} {eventoCount === 1 ? "evento" : "eventos"}
                        </div>
                    </div>
                );
            })}
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Cargos table                                                       */
/* ------------------------------------------------------------------ */

function CargosTable({ rows }: { rows: typeof CARGOS }) {
    if (rows.length === 0) return <TableEmpty description="Não encontramos cargos para essa busca." />;

    return (
        <>
            <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,2fr)] border-b border-secondary bg-secondary_subtle md:grid">
                <span className={HEADER_CELL}>Nome do cargo</span>
                <span className={HEADER_CELL}>Permissões</span>
            </div>
            {rows.map((c, i) => (
                <div
                    key={c.id}
                    className={cx("flex flex-col gap-2 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-0", i !== rows.length - 1 && "border-b border-secondary")}
                >
                    <div className={cx(CELL, "flex flex-wrap items-center gap-2")}>
                        <span className="text-sm font-semibold text-primary">{c.nome}</span>
                        {c.porFeature && (
                            <Badge size="sm" type="pill-color" color="blue">
                                Por feature
                            </Badge>
                        )}
                    </div>
                    <div className={cx(CELL, "text-sm text-tertiary")}>{c.descricao}</div>
                </div>
            ))}
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Modal de confirmação de remoção                                    */
/* ------------------------------------------------------------------ */

function ConfirmarRemocaoModal({
    isOpen,
    tab,
    count,
    onClose,
    onConfirm,
}: {
    isOpen: boolean;
    tab: TabKey;
    count: number;
    onClose: () => void;
    onConfirm: () => void;
}) {
    const isGrupo = tab === "grupos";
    const titulo = isGrupo ? "Excluir grupos" : "Remover membros";
    const descricao = isGrupo
        ? count === 1
            ? "Excluir o grupo selecionado? Os membros perdem os acessos concedidos por ele. Esta ação não pode ser desfeita."
            : `Excluir os ${count} grupos selecionados? Os membros perdem os acessos concedidos por eles. Esta ação não pode ser desfeita.`
        : count === 1
          ? "Remover o membro selecionado da organização? Isso revoga todo o acesso dele e não pode ser desfeito."
          : `Remover os ${count} membros selecionados da organização? Isso revoga todo o acesso deles e não pode ser desfeito.`;

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(o) => !o && onClose()} isDismissable>
            <Modal className="sm:max-w-[440px]">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start gap-4">
                            <FeaturedIcon icon={Trash01} color="error" theme="light" size="lg" />
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">{titulo}</h2>
                                <p className="text-sm text-tertiary">{descricao}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary-destructive" onClick={onConfirm}>
                                {isGrupo ? "Excluir" : "Remover"}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
