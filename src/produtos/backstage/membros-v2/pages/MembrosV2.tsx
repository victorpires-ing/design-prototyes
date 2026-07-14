import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import type { Key } from "react-aria-components";
import { Calendar, ChevronDown, InfoCircle, Plus, SearchLg, Star01, Trash01, Users01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { Tabs } from "@/components/application/tabs/tabs";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { AcessoEditor, Avatar, Collapse, ResumoAcesso } from "../components/acesso-ui";
import {
    EVENTOS,
    MEMBROS_V2,
    addMembroAoGrupo,
    escopoLabel,
    getAcessos,
    removeMembroDoGrupo,
    setAcesso,
    updateEscopo,
    useAtribuicoes,
    useGruposV2,
    type AtribuicaoV2,
    type GrupoV2,
    type MembroV2,
} from "../data/membros-v2-store";

type TabKey = "membros" | "grupos";

const PLACEHOLDERS: Record<TabKey, string> = {
    membros: "Busque por nome ou e-mail",
    grupos: "Busque por grupo",
};

export function MembrosV2() {
    const navigate = useNavigate();
    const grupos = useGruposV2();
    const atribuicoes = useAtribuicoes();
    const [tab, setTab] = useState<TabKey>("membros");
    const [busca, setBusca] = useState("");
    const termo = busca.trim().toLowerCase();

    const membros = useMemo(
        () => (termo ? MEMBROS_V2.filter((m) => m.nome.toLowerCase().includes(termo) || m.email.toLowerCase().includes(termo)) : MEMBROS_V2),
        [termo],
    );
    const gruposFiltrados = useMemo(() => (termo ? grupos.filter((g) => g.nome.toLowerCase().includes(termo)) : grupos), [termo, grupos]);

    return (
        <BackstageLayout showEventContext={false} activeProducer="membros-v2">
            <motion.div
                className="flex min-w-0 flex-1 flex-col"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
            >
                <header className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <h1 className="text-display-xs font-bold text-primary">Membros</h1>
                            <Badge size="md" type="pill-color" color="brand">
                                v2 · acesso por grupo
                            </Badge>
                        </div>
                        <p className="max-w-2xl text-sm text-tertiary">
                            O acesso é definido <span className="font-medium text-secondary">por pessoa dentro de cada grupo</span>. O grupo define os eventos; você escolhe o que a pessoa pode
                            fazer em cada feature. Quando alguém está em vários grupos, vale o acesso mais amplo.
                        </p>
                    </div>
                    <Button size="md" color="primary" iconLeading={Plus} onClick={() => navigate("/backstage/membros-v2/grupos/novo")}>
                        Novo grupo
                    </Button>
                </header>

                <main className="flex flex-1 flex-col gap-5 px-6 pb-10">
                    <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-3 border-b border-secondary p-4 md:flex-row md:items-center md:justify-between md:px-6">
                            <Tabs selectedKey={tab} onSelectionChange={(key: Key) => { setTab(key as TabKey); setBusca(""); }} className="w-fit!">
                                <Tabs.List type="button-border" size="sm">
                                    <Tabs.Item id="membros">{`Membros (${MEMBROS_V2.length})`}</Tabs.Item>
                                    <Tabs.Item id="grupos">{`Grupos (${grupos.length})`}</Tabs.Item>
                                </Tabs.List>
                            </Tabs>
                            <div className="w-full md:w-72">
                                <Input icon={SearchLg} size="sm" aria-label="Buscar" placeholder={PLACEHOLDERS[tab]} value={busca} onChange={setBusca} />
                            </div>
                        </div>

                        {tab === "membros" && <MembrosLista membros={membros} grupos={grupos} atribuicoes={atribuicoes} />}
                        {tab === "grupos" && <GruposLista grupos={gruposFiltrados} atribuicoes={atribuicoes} />}
                    </div>
                </main>
            </motion.div>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ListaVazia({ description }: { description: string }) {
    return (
        <div className="flex items-center justify-center px-6 py-16">
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

/**
 * Painel de acesso de (membro, grupo): resumo + editor colapsável.
 * Reutilizado nas abas Membros (subject = grupo) e Grupos (subject = pessoa).
 */
function AcessoPanel({ header, membroId, grupoId, atribuicoes, onRemove }: { header: React.ReactNode; membroId: string; grupoId: string; atribuicoes: AtribuicaoV2[]; onRemove?: () => void }) {
    const [editando, setEditando] = useState(false);
    const acessos = getAcessos(atribuicoes, membroId, grupoId);

    return (
        <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">{header}</div>
                {onRemove && <ButtonUtility size="xs" color="tertiary" tooltip="Remover do grupo" icon={Trash01} onClick={onRemove} />}
            </div>
            <ResumoAcesso acessos={acessos} vazioTexto="Sem acesso configurado neste grupo." />
            <div>
                <Button
                    size="sm"
                    color="link-color"
                    iconTrailing={<ChevronDown data-icon className={cx("size-4 transition-transform duration-150", editando && "rotate-180")} />}
                    onClick={() => setEditando((v) => !v)}
                >
                    {editando ? "Ocultar acesso" : "Editar acesso"}
                </Button>
            </div>
            <Collapse open={editando}>
                <AcessoEditor acessos={acessos} onChange={(featureId, patch) => setAcesso(membroId, grupoId, featureId, patch)} />
            </Collapse>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Aba Membros                                                        */
/* ------------------------------------------------------------------ */

function MembrosLista({ membros, grupos, atribuicoes }: { membros: MembroV2[]; grupos: GrupoV2[]; atribuicoes: AtribuicaoV2[] }) {
    const [abertos, setAbertos] = useState<Set<string>>(new Set());
    if (membros.length === 0) return <ListaVazia description="Não encontramos membros para essa busca." />;

    const toggle = (id: string) =>
        setAbertos((prev) => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });

    return (
        <>
            {membros.map((m, i) => (
                <MembroRow key={m.id} membro={m} grupos={grupos} atribuicoes={atribuicoes} aberto={abertos.has(m.id)} onToggle={() => toggle(m.id)} isLast={i === membros.length - 1} index={i} />
            ))}
        </>
    );
}

function MembroRow({ membro, grupos, atribuicoes, aberto, onToggle, isLast, index }: { membro: MembroV2; grupos: GrupoV2[]; atribuicoes: AtribuicaoV2[]; aberto: boolean; onToggle: () => void; isLast: boolean; index: number }) {
    const gruposDoMembro = grupos.filter((g) => g.membroIds.includes(membro.id));
    const disponiveis = grupos.filter((g) => !g.membroIds.includes(membro.id));

    return (
        <motion.div
            className={cx(!isLast && !aberto && "border-b border-secondary")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut", delay: Math.min(index * 0.03, 0.15) }}
        >
            <div
                role="button"
                tabIndex={0}
                aria-expanded={aberto}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                className={cx(
                    "flex cursor-pointer flex-col gap-3 px-4 py-4 transition duration-100 ease-linear hover:bg-primary_hover md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)] md:items-center md:gap-6 md:px-6",
                    aberto && "border-b border-secondary",
                )}
            >
                <div className="flex items-center gap-3">
                    <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", aberto && "rotate-180")} aria-hidden="true" />
                    <Avatar nome={membro.nome} />
                    <span className="truncate text-sm font-semibold text-primary">{membro.nome}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 md:justify-end md:pl-7">
                    {gruposDoMembro.length > 0 ? (
                        gruposDoMembro.map((g) => (
                            <Badge key={g.id} size="sm" type="pill-color" color="gray">
                                {g.nome}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-sm text-tertiary">Nenhum grupo</span>
                    )}
                </div>
            </div>

            <Collapse open={aberto}>
                <div className={cx("flex flex-col gap-4 bg-secondary/40 px-4 py-4 md:px-6", !isLast && "border-b border-secondary")}>
                    <div className="flex flex-col gap-2">
                        <span className="px-1 text-sm font-medium tracking-wide text-tertiary uppercase">Acesso por grupo</span>
                        {gruposDoMembro.length > 0 ? (
                            gruposDoMembro.map((g) => (
                                <AcessoPanel
                                    key={g.id}
                                    membroId={membro.id}
                                    grupoId={g.id}
                                    atribuicoes={atribuicoes}
                                    onRemove={g.sistema ? undefined : () => removeMembroDoGrupo(g.id, membro.id)}
                                    header={
                                        <div className="flex items-center gap-2">
                                            {g.sistema ? <Star01 className="size-4 shrink-0 text-fg-warning-secondary" aria-hidden="true" /> : <Users01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />}
                                            <span className="truncate text-sm font-semibold text-primary">{g.nome}</span>
                                            <Badge size="sm" type="pill-color" color="gray">
                                                {escopoLabel(g)}
                                            </Badge>
                                        </div>
                                    }
                                />
                            ))
                        ) : (
                            <span className="px-1 text-sm text-tertiary">Ainda não está em nenhum grupo.</span>
                        )}
                    </div>

                    {disponiveis.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <span className="px-1 text-sm text-tertiary">Adicionar a um grupo</span>
                            <div className="w-full sm:w-80">
                                <Select
                                    size="sm"
                                    aria-label="Adicionar a um grupo"
                                    placeholder="Escolher grupo…"
                                    selectedKey={null}
                                    onSelectionChange={(k: Key | null) => k && addMembroAoGrupo(String(k), membro.id)}
                                    items={disponiveis.map((g) => ({ id: g.id, label: g.nome }))}
                                >
                                    {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                </Select>
                            </div>
                        </div>
                    )}
                </div>
            </Collapse>
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Aba Grupos                                                         */
/* ------------------------------------------------------------------ */

function GruposLista({ grupos, atribuicoes }: { grupos: GrupoV2[]; atribuicoes: AtribuicaoV2[] }) {
    const [abertos, setAbertos] = useState<Set<string>>(new Set());
    if (grupos.length === 0) return <ListaVazia description="Não encontramos grupos para essa busca." />;

    const toggle = (id: string) =>
        setAbertos((prev) => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });

    return (
        <>
            {grupos.map((g, i) => (
                <GrupoRow key={g.id} grupo={g} atribuicoes={atribuicoes} aberto={abertos.has(g.id)} onToggle={() => toggle(g.id)} isLast={i === grupos.length - 1} index={i} />
            ))}
        </>
    );
}

function GrupoRow({ grupo, atribuicoes, aberto, onToggle, isLast, index }: { grupo: GrupoV2; atribuicoes: AtribuicaoV2[]; aberto: boolean; onToggle: () => void; isLast: boolean; index: number }) {
    const membrosDoGrupo = MEMBROS_V2.filter((m) => grupo.membroIds.includes(m.id));
    const disponiveis = MEMBROS_V2.filter((m) => !grupo.membroIds.includes(m.id));

    return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut", delay: Math.min(index * 0.03, 0.15) }}>
            <div
                role="button"
                tabIndex={0}
                aria-expanded={aberto}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                className={cx(
                    "flex cursor-pointer items-center gap-3 px-4 py-4 transition duration-100 ease-linear hover:bg-primary_hover md:px-6",
                    (aberto || !isLast) && "border-b border-secondary",
                )}
            >
                <ChevronDown className={cx("size-4 shrink-0 text-fg-quaternary transition-transform duration-150", aberto && "rotate-180")} aria-hidden="true" />
                {grupo.sistema ? <Star01 className="size-4 shrink-0 text-fg-warning-secondary" aria-hidden="true" /> : <Users01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />}
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-primary">{grupo.nome}</span>
                <Badge size="sm" type="pill-color" color="gray">
                    {escopoLabel(grupo)}
                </Badge>
                <span className="shrink-0 text-sm text-tertiary">
                    {membrosDoGrupo.length} {membrosDoGrupo.length === 1 ? "pessoa" : "pessoas"}
                </span>
            </div>

            <Collapse open={aberto}>
                <div className={cx("flex flex-col gap-5 bg-secondary/40 px-4 py-4 md:px-6", !isLast && "border-b border-secondary")}>
                    <EscopoEditor grupo={grupo} />

                    <section className="flex flex-col gap-2">
                        <span className="px-1 text-sm font-medium tracking-wide text-tertiary uppercase">Pessoas e acesso</span>
                        {membrosDoGrupo.length > 0 ? (
                            membrosDoGrupo.map((m) => (
                                <AcessoPanel
                                    key={m.id}
                                    membroId={m.id}
                                    grupoId={grupo.id}
                                    atribuicoes={atribuicoes}
                                    onRemove={() => removeMembroDoGrupo(grupo.id, m.id)}
                                    header={
                                        <div className="flex items-center gap-2.5">
                                            <Avatar nome={m.nome} size="sm" />
                                            <div className="flex min-w-0 flex-col">
                                                <span className="truncate text-sm font-semibold text-primary">{m.nome}</span>
                                                <span className="truncate text-sm text-tertiary">{m.email}</span>
                                            </div>
                                        </div>
                                    }
                                />
                            ))
                        ) : (
                            <span className="px-1 text-sm text-tertiary">Nenhuma pessoa neste grupo.</span>
                        )}
                    </section>

                    {disponiveis.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <span className="px-1 text-sm text-tertiary">Adicionar pessoa</span>
                            <div className="w-full sm:w-80">
                                <Select
                                    size="sm"
                                    aria-label="Adicionar pessoa"
                                    placeholder="Escolher pessoa…"
                                    selectedKey={null}
                                    onSelectionChange={(k: Key | null) => k && addMembroAoGrupo(grupo.id, String(k))}
                                    items={disponiveis.map((m) => ({ id: m.id, label: m.nome }))}
                                >
                                    {(item: { id: string; label: string }) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                                </Select>
                            </div>
                        </div>
                    )}
                </div>
            </Collapse>
        </motion.div>
    );
}

/** Editor do escopo de eventos do grupo. */
function EscopoEditor({ grupo }: { grupo: GrupoV2 }) {
    const todos = grupo.escopo === "todos";
    const selecionados = todos ? [] : grupo.escopo;

    const toggleEvento = (id: string) => {
        const atual = todos ? [] : [...grupo.escopo];
        const next = atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id];
        updateEscopo(grupo.id, next);
    };

    return (
        <section className="flex flex-col gap-3">
            <span className="px-1 text-sm font-medium tracking-wide text-tertiary uppercase">Escopo de eventos</span>
            <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                <div className="inline-flex w-fit rounded-lg bg-secondary p-0.5 ring-1 ring-border-secondary">
                    {[
                        { id: "todos", label: "Todos os eventos" },
                        { id: "especificos", label: "Eventos específicos" },
                    ].map((o) => {
                        const active = (o.id === "todos") === todos;
                        return (
                            <button
                                key={o.id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => updateEscopo(grupo.id, o.id === "todos" ? "todos" : selecionados)}
                                className={cx(
                                    "rounded-md px-3 py-1 text-sm transition duration-100 ease-linear",
                                    active ? "bg-primary font-semibold text-primary shadow-xs ring-1 ring-border-secondary" : "text-tertiary hover:text-secondary",
                                )}
                            >
                                {o.label}
                            </button>
                        );
                    })}
                </div>

                {todos ? (
                    <p className="flex items-start gap-1.5 text-sm text-tertiary">
                        <InfoCircle className="mt-0.5 size-3.5 shrink-0 text-fg-quaternary" aria-hidden="true" />
                        O acesso concedido aqui vale para todos os eventos da produtora, inclusive os futuros.
                    </p>
                ) : (
                    <div className="flex flex-col gap-1">
                        {EVENTOS.map((ev) => (
                            <label key={ev.id} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition duration-100 ease-linear hover:bg-primary_hover">
                                <Checkbox size="sm" isSelected={selecionados.includes(ev.id)} onChange={() => toggleEvento(ev.id)} aria-label={ev.nome} />
                                <Calendar className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                <span className="truncate text-sm text-secondary">{ev.nome}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
