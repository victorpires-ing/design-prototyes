import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, ChevronDown, Edit01, ImageUser, Plus, SearchLg, Trash01 } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { cotaNivel, moduloLabel, relatorioLabel, removeMembro, useMembros, type Membro, type MembroTipo } from "../data/membros";

const brNum = (n: number) => n.toLocaleString("pt-BR");

export function EquipeEPermissoes() {
    const navigate = useNavigate();
    const membros = useMembros();
    const [busca, setBusca] = useState("");
    const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
    const [deleteTarget, setDeleteTarget] = useState<Membro | null>(null);

    const stats = useMemo(
        () => ({
            total: membros.length,
            individuos: membros.filter((m) => m.tipo === "individuo").length,
            grupos: membros.filter((m) => m.tipo === "grupo").length,
        }),
        [membros],
    );

    const linhas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return membros;
        return membros.filter((m) => m.nome.toLowerCase().includes(termo));
    }, [membros, busca]);

    const toggle = (id: string) =>
        setExpandidos((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const irParaNovo = () => navigate("/backstage/equipe-e-permissoes/novo");

    const confirmarDelete = () => {
        if (deleteTarget) removeMembro(deleteTarget.id);
        setDeleteTarget(null);
    };

    return (
        <BackstageLayout activeSection="equipe-e-permissoes">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-display-xs font-bold text-primary">Equipe e Permissões</h1>
                        <p className="text-sm text-tertiary">Gerencie quem tem acesso a este evento e o que cada membro pode fazer.</p>
                    </div>
                    <Button size="md" color="primary" iconLeading={Plus} onClick={irParaNovo}>
                        Adicionar membro
                    </Button>
                </header>

                <main className="flex flex-1 flex-col gap-5 px-6 pb-10">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <MetricCard label="Total de membros" valor={brNum(stats.total)} />
                        <MetricCard label="Indivíduos" valor={brNum(stats.individuos)} />
                        <MetricCard label="Grupos" valor={brNum(stats.grupos)} />
                    </div>

                    <div className="flex justify-end border-b border-secondary pb-4">
                        <div className="w-full sm:w-72">
                            <Input icon={SearchLg} aria-label="Buscar" placeholder="Buscar por nome" value={busca} onChange={setBusca} size="sm" />
                        </div>
                    </div>

                    {membros.length === 0 ? (
                        <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                            <EmptyState onNovo={irParaNovo} />
                        </div>
                    ) : linhas.length === 0 ? (
                        <div className="rounded-2xl bg-primary px-5 py-12 text-center text-sm text-tertiary ring-1 ring-border-secondary">
                            Nenhum membro encontrado para essa busca.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {linhas.map((m) => (
                                <MembroCard
                                    key={m.id}
                                    membro={m}
                                    aberto={expandidos.has(m.id)}
                                    onToggle={() => toggle(m.id)}
                                    onEdit={() => navigate(`/backstage/equipe-e-permissoes/${m.id}/editar`)}
                                    onDelete={() => setDeleteTarget(m)}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            <ModalOverlay isOpen={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} isDismissable>
                <Modal className="sm:max-w-[440px]">
                    <Dialog>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex items-start gap-4">
                                <FeaturedIcon icon={Trash01} color="error" theme="light" size="lg" />
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-lg font-semibold text-primary">Remover membro</h2>
                                    <p className="text-sm text-tertiary">
                                        Tem certeza que quer remover <strong className="text-secondary">{deleteTarget?.nome}</strong> da equipe? Essa ação não pode ser desfeita.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button size="md" color="secondary" onClick={() => setDeleteTarget(null)}>
                                    Cancelar
                                </Button>
                                <Button size="md" color="primary-destructive" onClick={confirmarDelete}>
                                    Remover
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */
/*  Card expansível de membro                                          */
/* ------------------------------------------------------------------ */

function MembroCard({
    membro,
    aberto,
    onToggle,
    onEdit,
    onDelete,
}: {
    membro: Membro;
    aberto: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const isGrupo = membro.tipo === "grupo";
    const sub = isGrupo
        ? `${brNum(membro.emails.length)} ${membro.emails.length === 1 ? "membro" : "membros"} · ${membro.modulos.length} ${membro.modulos.length === 1 ? "módulo" : "módulos"}`
        : membro.conviteFantasma
          ? "Convite de ativação pendente"
          : membro.nome;

    return (
        <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
            <div
                role="button"
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                className="flex cursor-pointer items-center gap-3 px-5 py-4 transition duration-100 ease-linear hover:bg-primary_hover"
            >
                <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-150", aberto && "rotate-180")} />
                <TipoAvatar tipo={membro.tipo} nome={membro.nome} />
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-primary">{membro.nome}</span>
                    <span className="truncate text-sm text-tertiary">{sub}</span>
                </div>
                <Badge size="sm" type="pill-color" color={isGrupo ? "purple" : "blue"}>
                    {isGrupo ? "Grupo" : "Indivíduo"}
                </Badge>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar" onPress={onEdit} />
                    <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover" onPress={onDelete} />
                </div>
            </div>

            <AnimatePresence initial={false}>
                {aberto && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-6 border-t border-secondary px-5 py-5">
                            <section className="flex flex-col gap-3">
                                <span className="text-sm font-medium tracking-wide text-tertiary uppercase">Módulos de acesso</span>
                                <div className="flex flex-col gap-2">
                                    {membro.modulos.map((id) => (
                                        <div key={id} className="flex items-center gap-2.5">
                                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white">
                                                <CheckIcon />
                                            </span>
                                            <span className="text-sm font-medium text-secondary">{moduloLabel(id)}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {membro.regras.length > 0 && (
                                <section className="flex flex-col gap-3">
                                    <span className="text-sm font-medium tracking-wide text-tertiary uppercase">Cortesias — consumo por ingresso</span>
                                    <div className="flex flex-col gap-3">
                                        {membro.regras.map((r) => (
                                            <div key={r.ticketId} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,240px)] sm:items-center sm:gap-6">
                                                <span className="text-sm font-medium text-primary">{r.label}</span>
                                                <QuotaBar usadas={r.usadas} total={r.cota} />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {membro.relatorios.length > 0 && (
                                <section className="flex flex-col gap-3">
                                    <span className="text-sm font-medium tracking-wide text-tertiary uppercase">Relatórios liberados</span>
                                    <div className="flex flex-wrap gap-2">
                                        {membro.relatorios.map((id) => (
                                            <span key={id} className="rounded-md bg-secondary px-2 py-1 text-sm text-secondary">
                                                {relatorioLabel(id)}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {isGrupo && membro.emails.length > 0 && (
                                <section className="flex flex-col gap-3">
                                    <span className="text-sm font-medium tracking-wide text-tertiary uppercase">
                                        Membros do grupo ({brNum(membro.emails.length)})
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {membro.emails.slice(0, 12).map((email, i) => (
                                            <span key={i} className="rounded-md bg-secondary px-2 py-1 text-sm text-secondary">
                                                {email}
                                            </span>
                                        ))}
                                        {membro.emails.length > 12 && (
                                            <span className="rounded-md px-2 py-1 text-sm text-tertiary">+ {brNum(membro.emails.length - 12)} outros</span>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Subcomponentes                                                      */
/* ------------------------------------------------------------------ */

function EmptyState({ onNovo }: { onNovo: () => void }) {
    return (
        <div className="flex flex-col items-center gap-5 px-6 py-16 text-center">
            <FeaturedIcon icon={ImageUser} color="gray" theme="modern" size="lg" />
            <div className="flex flex-col gap-1.5">
                <p className="text-md font-semibold text-primary">Nenhum membro na equipe</p>
                <p className="max-w-xs text-sm text-tertiary">Adicione indivíduos ou grupos e defina o que cada um pode acessar e gerenciar neste evento.</p>
            </div>
            <Button size="md" color="primary" iconLeading={Plus} onClick={onNovo}>
                Adicionar membro
            </Button>
        </div>
    );
}

function MetricCard({ label, valor }: { label: string; valor: string }) {
    return (
        <div className="flex flex-col gap-1.5 rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
            <span className="text-sm text-tertiary">{label}</span>
            <span className="text-display-sm font-bold text-primary">{valor}</span>
        </div>
    );
}

function TipoAvatar({ tipo, nome }: { tipo: MembroTipo; nome: string }) {
    const iniciais = (nome || "?").slice(0, 2).toUpperCase();
    return (
        <span
            className={cx(
                "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                tipo === "grupo" ? "bg-utility-purple-100 text-utility-purple-700" : "bg-utility-blue-100 text-utility-blue-700",
            )}
        >
            {iniciais}
        </span>
    );
}

function QuotaBar({ usadas, total }: { usadas: number; total: number }) {
    const nivel = cotaNivel(usadas, total);
    const pct = total > 0 ? Math.min(100, Math.round((usadas / total) * 100)) : 0;
    const cor = nivel === "full" ? "bg-error-solid" : nivel === "high" ? "bg-warning-solid" : "bg-success-solid";
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="text-tertiary">
                    {brNum(usadas)} de {brNum(total)} usadas
                </span>
                <span className="font-semibold text-secondary">{brNum(total)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-quaternary">
                <div className={cx("h-full rounded-full transition-all duration-200 ease-linear", cor)} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden="true">
            <path d="M10 3 4.5 8.5 2 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
