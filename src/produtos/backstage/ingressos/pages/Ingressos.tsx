import { useRef, useState } from "react";
import type { FC } from "react";
import { Calendar, ChevronDown, ChevronRight, Edit01, Key01, Plus, QrCode01, Trash01, XClose, Zap } from "@untitledui/icons";
import { AnimatePresence, Reorder, motion, useDragControls } from "motion/react";
import { Badge, BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { SESSOES, type Grupo, type Ingresso, type Sessao } from "../data/ingressos";

/** Handle de arraste com 2 colunas de pontos (padrão Jira/Gmail). */
function GripVertical({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <circle cx="9" cy="6" r="1.6" />
            <circle cx="9" cy="12" r="1.6" />
            <circle cx="9" cy="18" r="1.6" />
            <circle cx="15" cy="6" r="1.6" />
            <circle cx="15" cy="12" r="1.6" />
            <circle cx="15" cy="18" r="1.6" />
        </svg>
    );
}

const COL = {
    virada: "w-40",
    preco: "w-28",
    emissoes: "w-40",
    acoes: "w-24",
};

/** Ícone de ação (editar / vincular / excluir) exibido na coluna Ações. */
function ActionIcon({ icon: Icon, label }: { icon: FC<{ className?: string }>; label: string }) {
    return (
        <button
            type="button"
            aria-label={label}
            className="flex size-7 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
        >
            <Icon className="size-4" />
        </button>
    );
}

/** Contexto do que está sendo reordenado (para o modal de confirmação). */
type Pending = { kind: "grupo" | "tipo"; nome: string; contexto: string; id: string };

type DropSide = "top" | "bottom" | null;

/** Onde desenhar a linha de inserção: no topo do slot arrastado (borda inferior do item de cima). */
function dropLineFor<T extends { id: string }>(arr: T[], idx: number, draggingId: string | null): DropSide {
    if (!draggingId) return null;
    const d = arr.findIndex((x) => x.id === draggingId);
    if (d === -1 || idx === d) return null;
    if (idx === d - 1) return "bottom";
    if (d === 0 && idx === d + 1) return "top";
    return null;
}

/** Linha vermelha (cor da marca) indicando onde o item vai entrar — padrão Jira/Spotify. */
function DropLine({ position }: { position: Exclude<DropSide, null> }) {
    return (
        <div
            aria-hidden="true"
            className={cx(
                "pointer-events-none absolute inset-x-0 z-30 flex items-center gap-1",
                position === "top" ? "top-0 -translate-y-1/2" : "bottom-0 translate-y-1/2",
            )}
        >
            <span className="size-2.5 shrink-0 rounded-full border-2 border-brand-solid bg-primary" />
            <span className="h-0.5 flex-1 rounded-full bg-brand-solid" />
        </div>
    );
}

/** Assinatura da ordem atual (sessões › grupos › ingressos) para detectar mudança. */
const orderSig = (ss: Sessao[]) =>
    ss.map((s) => `${s.id}{${s.grupos.map((g) => `${g.id}[${g.ingressos.map((i) => i.id).join(",")}]`).join(",")}}`).join("|");

const clone = (ss: Sessao[]): Sessao[] => ss.map((s) => ({ ...s, grupos: s.grupos.map((g) => ({ ...g, ingressos: [...g.ingressos] })) }));

export function Ingressos() {
    const [sessoes, setSessoes] = useState<Sessao[]>(SESSOES);
    const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set([SESSOES[0].grupos[0].id]));
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set([SESSOES[0].grupos[0].ingressos[0].id]));
    const [active, setActive] = useState<Set<string>>(
        () => new Set(SESSOES.flatMap((s) => s.grupos.flatMap((g) => g.ingressos.filter((i) => i.active).map((i) => i.id)))),
    );
    const [pending, setPending] = useState<Pending | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const sessoesRef = useRef(sessoes);
    sessoesRef.current = sessoes;
    const snapshotRef = useRef<Sessao[] | null>(null);
    const dragCtxRef = useRef<Pending | null>(null);

    const toggleGroup = (id: string) => setOpenGroups((p) => toggleSet(p, id));
    const toggleExpand = (id: string) => setExpanded((p) => toggleSet(p, id));
    const toggleActive = (id: string) => setActive((p) => toggleSet(p, id));

    const reorderGrupos = (sessaoId: string, next: Grupo[]) =>
        setSessoes((prev) => prev.map((s) => (s.id === sessaoId ? { ...s, grupos: next } : s)));
    const reorderIngressos = (sessaoId: string, grupoId: string, next: Ingresso[]) =>
        setSessoes((prev) =>
            prev.map((s) => (s.id === sessaoId ? { ...s, grupos: s.grupos.map((g) => (g.id === grupoId ? { ...g, ingressos: next } : g)) } : s)),
        );

    // Ao iniciar o arraste: guarda a ordem anterior (para reverter) + o contexto.
    const handleDragStart = (ctx: Pending) => {
        snapshotRef.current = clone(sessoesRef.current);
        dragCtxRef.current = ctx;
        setDraggingId(ctx.id);
    };
    // Ao soltar: se a ordem mudou, abre o modal de confirmação.
    const handleDragEnd = () => {
        setDraggingId(null);
        const snap = snapshotRef.current;
        if (!snap) return;
        if (dragCtxRef.current && orderSig(sessoesRef.current) !== orderSig(snap)) {
            setPending(dragCtxRef.current);
        } else {
            snapshotRef.current = null;
            dragCtxRef.current = null;
        }
    };
    const confirmar = () => {
        snapshotRef.current = null;
        dragCtxRef.current = null;
        setPending(null);
    };
    const cancelar = () => {
        if (snapshotRef.current) setSessoes(snapshotRef.current);
        snapshotRef.current = null;
        dragCtxRef.current = null;
        setPending(null);
    };

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

                {/* Sessões (cada sessão é um card; os grupos ficam alinhados dentro dela) */}
                <div className="mt-6 flex flex-col gap-6">
                    {sessoes.map((sessao) => (
                        <section key={sessao.id} className="rounded-2xl bg-secondary p-4 ring-1 ring-border-secondary md:p-5">
                            <h2 className="text-lg font-semibold text-primary">
                                {sessao.label} <span className="font-normal text-tertiary">({sessao.diaSemana})</span>
                            </h2>

                            <Reorder.Group as="div" axis="y" values={sessao.grupos} onReorder={(next) => reorderGrupos(sessao.id, next)} className="mt-4 flex flex-col gap-4">
                                {sessao.grupos.map((grupo, idx) => (
                                    <GrupoCard
                                        key={grupo.id}
                                        grupo={grupo}
                                        sessaoLabel={sessao.label}
                                        isOpen={openGroups.has(grupo.id)}
                                        onToggleOpen={() => toggleGroup(grupo.id)}
                                        expanded={expanded}
                                        onToggleExpand={toggleExpand}
                                        active={active}
                                        onToggleActive={toggleActive}
                                        onReorderIngressos={(next) => reorderIngressos(sessao.id, grupo.id, next)}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                        draggingId={draggingId}
                                        dropLine={dropLineFor(sessao.grupos, idx, draggingId)}
                                    />
                                ))}
                            </Reorder.Group>
                        </section>
                    ))}
                </div>
            </div>

            {/* Modal de confirmação da reordenação */}
            {pending && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 p-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-end">
                            <button
                                type="button"
                                onClick={cancelar}
                                aria-label="Fechar"
                                className="flex size-8 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                            >
                                <XClose className="size-5" aria-hidden="true" />
                            </button>
                        </div>
                        <h2 className="mt-2 text-lg font-bold text-primary">
                            {pending.kind === "grupo" ? "Confirmar alteração da ordem dos grupos?" : "Confirmar alteração da ordem dos ingressos?"}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-tertiary">
                            {pending.kind === "grupo" ? (
                                <>
                                    A ordem do grupo <span className="font-semibold text-secondary">{pending.nome}</span> dentro da sessão{" "}
                                    <span className="font-semibold text-secondary">{pending.contexto}</span> será alterada.
                                </>
                            ) : (
                                <>
                                    A ordem do ingresso <span className="font-semibold text-secondary">{pending.nome}</span> dentro do grupo{" "}
                                    <span className="font-semibold text-secondary">{pending.contexto}</span> será alterada.
                                </>
                            )}
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <Button size="md" color="secondary" onClick={cancelar} className="w-full">
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" onClick={confirmar} className="w-full">
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </BackstageLayout>
    );
}

interface GrupoCardProps {
    grupo: Grupo;
    sessaoLabel: string;
    isOpen: boolean;
    onToggleOpen: () => void;
    expanded: Set<string>;
    onToggleExpand: (id: string) => void;
    active: Set<string>;
    onToggleActive: (id: string) => void;
    onReorderIngressos: (next: Ingresso[]) => void;
    onDragStart: (ctx: Pending) => void;
    onDragEnd: () => void;
    draggingId: string | null;
    dropLine: DropSide;
}

function GrupoCard({ grupo, sessaoLabel, isOpen, onToggleOpen, expanded, onToggleExpand, active, onToggleActive, onReorderIngressos, onDragStart, onDragEnd, draggingId, dropLine }: GrupoCardProps) {
    const controls = useDragControls();
    // overflow-hidden só durante a animação de abrir/fechar; quando aberto, "visible"
    // para não cortar o handle de arraste (que fica meio pra fora) nem a linha em drag.
    const [animatingContent, setAnimatingContent] = useState(false);

    return (
        <Reorder.Item
            as="div"
            value={grupo}
            dragListener={false}
            dragControls={controls}
            onDragStart={() => onDragStart({ kind: "grupo", nome: grupo.name, contexto: sessaoLabel, id: grupo.id })}
            onDragEnd={onDragEnd}
            whileDrag={{ boxShadow: "0 12px 32px rgba(16,24,40,0.14)", zIndex: 20 }}
            className="relative flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary select-none"
        >
            {dropLine && <DropLine position={dropLine} />}

            {/* Cabeçalho do grupo */}
            <button type="button" onClick={onToggleOpen} className="group/header relative flex items-center justify-between gap-3 px-4 py-4 text-left">
                {/* Handle de arraste — aparece no hover, colado na borda esquerda */}
                <span
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        controls.start(e);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="pointer-events-none absolute top-1/2 -left-3 flex -translate-y-1/2 items-center justify-center rounded-md bg-tertiary p-1 text-fg-secondary opacity-0 shadow-sm ring-1 ring-border-secondary transition-opacity duration-100 group-hover/header:pointer-events-auto group-hover/header:cursor-grab group-hover/header:opacity-100"
                >
                    <GripVertical className="size-4" />
                </span>
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
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-tertiary hover:text-fg-secondary">
                    <ChevronDown className={cx("size-5 transition-transform duration-200", isOpen && "rotate-180")} />
                </span>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="grupo-conteudo"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.2 } }}
                        onAnimationStart={() => setAnimatingContent(true)}
                        onAnimationComplete={() => setAnimatingContent(false)}
                        className={animatingContent ? "overflow-hidden" : "overflow-visible"}
                    >
                        {/* Cabeçalho das colunas */}
                        <div className="flex items-center gap-3 border-y border-secondary bg-secondary/40 px-4 py-2.5">
                            <span className="flex-1 text-xs font-semibold text-tertiary">Status</span>
                            <span className={cx("shrink-0 text-xs font-semibold text-tertiary", COL.virada)}>Virada de lote</span>
                            <span className={cx("shrink-0 text-xs font-semibold text-tertiary", COL.preco)}>Preço</span>
                            <span className={cx("shrink-0 text-xs font-semibold text-tertiary", COL.emissoes)}>Emissões e estoque</span>
                            <span className={cx("shrink-0 text-right text-xs font-semibold text-tertiary", COL.acoes)}>Ações</span>
                        </div>

                        {/* Linhas dos ingressos (reordenáveis dentro do grupo) */}
                        <Reorder.Group as="div" axis="y" values={grupo.ingressos} onReorder={onReorderIngressos}>
                            {grupo.ingressos.map((ingresso, idx) => (
                                <IngressoRow
                                    key={ingresso.id}
                                    ingresso={ingresso}
                                    grupoNome={grupo.name}
                                    isExpanded={expanded.has(ingresso.id)}
                                    onToggleExpand={() => onToggleExpand(ingresso.id)}
                                    active={active}
                                    onToggleActive={onToggleActive}
                                    onDragStart={onDragStart}
                                    onDragEnd={onDragEnd}
                                    dropLine={dropLineFor(grupo.ingressos, idx, draggingId)}
                                />
                            ))}
                        </Reorder.Group>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer do grupo (sempre visível) */}
            <button
                type="button"
                className="group/novo flex items-center gap-2 rounded-b-xl border-t border-secondary px-4 py-3.5 text-left text-sm font-semibold text-brand-secondary transition duration-100 ease-linear hover:bg-tertiary hover:text-brand-secondary_hover"
            >
                <Plus className="size-4" />
                Novo ingresso
            </button>
        </Reorder.Item>
    );
}

interface IngressoRowProps {
    ingresso: Ingresso;
    grupoNome: string;
    isExpanded: boolean;
    onToggleExpand: () => void;
    active: Set<string>;
    onToggleActive: (id: string) => void;
    onDragStart: (ctx: Pending) => void;
    onDragEnd: () => void;
    dropLine: DropSide;
}

function IngressoRow({ ingresso, grupoNome, isExpanded, onToggleExpand, active, onToggleActive, onDragStart, onDragEnd, dropLine }: IngressoRowProps) {
    const controls = useDragControls();

    return (
        <Reorder.Item
            as="div"
            value={ingresso}
            dragListener={false}
            dragControls={controls}
            onDragStart={() => onDragStart({ kind: "tipo", nome: ingresso.name, contexto: grupoNome, id: ingresso.id })}
            onDragEnd={onDragEnd}
            whileDrag={{ backgroundColor: "var(--color-bg-primary)", boxShadow: "0 8px 24px rgba(16,24,40,0.12)", zIndex: 20 }}
            className="relative select-none"
        >
            {dropLine && <DropLine position={dropLine} />}

            {/* Linha do ingresso */}
            <div className="group/row relative flex items-center gap-3 border-b border-secondary px-4 py-3.5">
                {/* Handle de arraste — aparece no hover, colado na borda esquerda */}
                <span
                    onPointerDown={(e) => controls.start(e)}
                    className="pointer-events-none absolute top-1/2 -left-3 flex -translate-y-1/2 items-center justify-center rounded-md bg-tertiary p-1 text-fg-secondary opacity-0 shadow-sm ring-1 ring-border-secondary transition-opacity duration-100 group-hover/row:pointer-events-auto group-hover/row:cursor-grab group-hover/row:opacity-100"
                >
                    <GripVertical className="size-4" />
                </span>

                <button
                    type="button"
                    onClick={onToggleExpand}
                    aria-label={isExpanded ? "Recolher lotes" : "Expandir lotes"}
                    className="flex size-5 shrink-0 items-center justify-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                >
                    <ChevronRight className={cx("size-4 transition-transform duration-200", isExpanded && "rotate-90")} />
                </button>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Toggle size="sm" isSelected={active.has(ingresso.id)} onChange={() => onToggleActive(ingresso.id)} />
                    <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-semibold text-primary">{ingresso.name}</span>
                        <span className="truncate text-sm text-tertiary">{ingresso.lotesLabel}</span>
                    </div>
                </div>
                <div className={cx("shrink-0", COL.virada)}>
                    <Badge size="sm" type="modern" color="gray">
                        {ingresso.virada}
                    </Badge>
                </div>
                <div className={cx("flex shrink-0 flex-col", COL.preco)}>
                    <span className="text-sm text-secondary">{ingresso.preco}</span>
                    {ingresso.precoAte && <span className="text-xs text-tertiary">{ingresso.precoAte}</span>}
                </div>
                <div className={cx("flex shrink-0 flex-col", COL.emissoes)}>
                    <span className="text-sm text-secondary">{ingresso.emissoes}</span>
                    <span className="text-xs text-tertiary">{ingresso.pendente}</span>
                </div>
                <div className={cx("flex shrink-0 items-center justify-end gap-0.5", COL.acoes)}>
                    <ActionIcon icon={Edit01} label="Editar" />
                    <ActionIcon icon={Key01} label="Vincular códigos" />
                    <ActionIcon icon={Trash01} label="Excluir" />
                </div>
            </div>

            {/* Lotes (quando expandido) — permanecem vinculados ao ingresso */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="lotes"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ height: { duration: 0.28, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.18 } }}
                        className="overflow-hidden"
                    >
                        {ingresso.lotes.map((lote) => (
                            <div key={lote.id} className="flex items-center gap-3 border-b border-secondary py-3 pr-4 pl-24">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <Toggle size="sm" isSelected={active.has(lote.id)} onChange={() => onToggleActive(lote.id)} />
                                    <span className="truncate text-sm text-primary">{lote.name}</span>
                                    {lote.auto && (
                                        <BadgeWithIcon size="sm" type="pill-color" color="blue" iconLeading={Zap}>
                                            Auto
                                        </BadgeWithIcon>
                                    )}
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
                                <div className={cx("flex shrink-0 items-center justify-end", COL.acoes)}>
                                    <ActionIcon icon={Key01} label="Vincular códigos" />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    );
}

function toggleSet(set: Set<string>, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
}
