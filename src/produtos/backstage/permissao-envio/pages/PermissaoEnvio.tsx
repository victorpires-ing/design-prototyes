import { useState } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Edit01, Plus, SearchLg, Trash01, Users01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { cotaNivel, removePermissao, usePermissoes, type Permissao, type PermTipo } from "../data/permissoes";

const brNum = (n: number) => n.toLocaleString("pt-BR");

type Filtro = "all" | "grupo" | "individual";

export function PermissaoEnvio() {
    const navigate = useNavigate();
    const permissoes = usePermissoes();
    const [filtro, setFiltro] = useState<Filtro>("all");
    const [busca, setBusca] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Permissao | null>(null);

    const stats = useMemo(
        () => ({
            grupos: permissoes.filter((p) => p.tipo === "grupo").length,
            emissores: permissoes.reduce((acc, p) => acc + p.emissorCount, 0),
            alocadas: permissoes.reduce((acc, p) => acc + p.total, 0),
        }),
        [permissoes],
    );

    const linhas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return permissoes.filter((p) => {
            if (filtro !== "all" && p.tipo !== filtro) return false;
            if (!termo) return true;
            return p.nome.toLowerCase().includes(termo) || p.sub.toLowerCase().includes(termo);
        });
    }, [permissoes, filtro, busca]);

    const irParaNova = () => navigate("/backstage/permissao-envio/nova");

    const confirmarDelete = () => {
        if (deleteTarget) removePermissao(deleteTarget.id);
        setDeleteTarget(null);
    };

    return (
        <BackstageLayout activeSection="cortesias" activeItem="permissao-envio">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-display-xs font-bold text-primary">Permissão de envio</h1>
                        <p className="text-sm text-tertiary">Defina quem pode emitir cortesias, quais ingressos e o limite de cada um.</p>
                    </div>
                    <Button size="md" color="primary" iconLeading={Plus} onClick={irParaNova}>
                        Nova permissão
                    </Button>
                </header>

                <main className="flex flex-1 flex-col gap-5 px-6 pb-10">
                    {/* Métricas */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <MetricCard label="Grupos" valor={brNum(stats.grupos)} />
                        <MetricCard label="Emissores com permissão" valor={brNum(stats.emissores)} />
                        <MetricCard label="Cortesias alocadas" valor={brNum(stats.alocadas)} />
                    </div>

                    {/* Tabs + busca */}
                    <div className="flex flex-col gap-4 border-b border-secondary pb-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex gap-6">
                            <FiltroTab label="Todos" active={filtro === "all"} onClick={() => setFiltro("all")} />
                            <FiltroTab label="Grupos" active={filtro === "grupo"} onClick={() => setFiltro("grupo")} />
                            <FiltroTab label="Individuais" active={filtro === "individual"} onClick={() => setFiltro("individual")} />
                        </div>
                        <div className="w-full sm:w-72">
                            <Input icon={SearchLg} aria-label="Buscar" placeholder="Nome do grupo ou e-mail" value={busca} onChange={setBusca} size="sm" />
                        </div>
                    </div>

                    {/* Tabela / Empty state */}
                    <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                        {permissoes.length === 0 ? (
                            <EmptyState onNova={irParaNova} />
                        ) : (
                            <>
                                <div className="hidden grid-cols-[minmax(0,1.4fr)_110px_minmax(0,1.6fr)_190px_90px] gap-4 border-b border-secondary px-5 py-3 md:grid">
                                    <ColHead>Nome</ColHead>
                                    <ColHead>Tipo</ColHead>
                                    <ColHead>Ingressos liberados</ColHead>
                                    <ColHead>Cota (uso / total)</ColHead>
                                    <ColHead className="text-right">Ações</ColHead>
                                </div>

                                {linhas.length === 0 ? (
                                    <div className="px-5 py-12 text-center text-sm text-tertiary">Nenhuma permissão encontrada para esse filtro.</div>
                                ) : (
                                    linhas.map((p) => (
                                        <div
                                            key={p.id}
                                            className="grid grid-cols-1 gap-3 border-b border-secondary px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.4fr)_110px_minmax(0,1.6fr)_190px_90px] md:items-center md:gap-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <TipoAvatar tipo={p.tipo} iniciais={p.iniciais} />
                                                <div className="flex min-w-0 flex-col">
                                                    <span className="truncate text-sm font-semibold text-primary">{p.nome}</span>
                                                    <span className="truncate text-sm text-tertiary">{p.sub}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <Badge size="sm" type="pill-color" color={p.tipo === "grupo" ? "purple" : "blue"}>
                                                    {p.tipo === "grupo" ? "Grupo" : "Individual"}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5">
                                                {p.tickets.map((t, i) => (
                                                    <span key={i} className="rounded-md bg-secondary px-2 py-1 text-sm text-secondary">
                                                        {t.label} ×{brNum(t.qty)}
                                                        {t.perEmissor ? " / emissor" : ""}
                                                    </span>
                                                ))}
                                            </div>

                                            <QuotaBar usadas={p.usadas} total={p.total} />

                                            <div className="flex gap-2 md:justify-end">
                                                <ButtonUtility
                                                    size="sm"
                                                    color="tertiary"
                                                    icon={Edit01}
                                                    tooltip="Editar"
                                                    onPress={() => navigate(`/backstage/permissao-envio/${p.id}/editar`)}
                                                />
                                                <ButtonUtility
                                                    size="sm"
                                                    color="tertiary"
                                                    icon={Trash01}
                                                    tooltip="Remover"
                                                    onPress={() => setDeleteTarget(p)}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal confirmação de exclusão */}
            <ModalOverlay isOpen={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} isDismissable>
                <Modal className="sm:max-w-[440px]">
                    <Dialog>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex items-start gap-4">
                                <FeaturedIcon icon={Trash01} color="error" theme="light" size="lg" />
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-lg font-semibold text-primary">Remover permissão</h2>
                                    <p className="text-sm text-tertiary">
                                        Tem certeza que quer remover <strong className="text-secondary">{deleteTarget?.nome}</strong>? Essa ação não pode ser desfeita.
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
/*  Subcomponentes                                                      */
/* ------------------------------------------------------------------ */

function EmptyState({ onNova }: { onNova: () => void }) {
    return (
        <div className="flex flex-col items-center gap-5 px-6 py-16 text-center">
            <FeaturedIcon icon={Users01} color="gray" theme="modern" size="lg" />
            <div className="flex flex-col gap-1.5">
                <p className="text-md font-semibold text-primary">Nenhuma permissão criada</p>
                <p className="max-w-xs text-sm text-tertiary">Crie grupos ou permissões individuais para definir quem pode emitir cortesias e em quais limites.</p>
            </div>
            <Button size="md" color="primary" iconLeading={Plus} onClick={onNova}>
                Nova permissão
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

function FiltroTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cx(
                "-mb-4 border-b-2 pb-4 text-sm font-semibold transition duration-100 ease-linear",
                active ? "border-brand text-primary" : "border-transparent text-tertiary hover:text-secondary",
            )}
        >
            {label}
        </button>
    );
}

function ColHead({ children, className }: { children: React.ReactNode; className?: string }) {
    return <span className={cx("text-sm font-medium text-tertiary", className)}>{children}</span>;
}

function TipoAvatar({ tipo, iniciais }: { tipo: PermTipo; iniciais: string }) {
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
                <span className="text-tertiary">{brNum(usadas)} usadas</span>
                <span className="font-semibold text-secondary">{brNum(total)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-quaternary">
                <div className={cx("h-full rounded-full transition-all duration-200 ease-linear", cor)} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
