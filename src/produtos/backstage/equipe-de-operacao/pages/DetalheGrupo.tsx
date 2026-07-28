import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ChevronRight, Edit01, HomeLine, Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Avatar } from "@/components/base/avatar/avatar";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ITENS_POR_ID, rotuloItem } from "../data/equipe-data";
import { cotaTotal, useEquipe } from "../data/equipe-store";

const iniciais = (nome: string) => nome.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "GR";

export function DetalheGrupo() {
    const navigate = useNavigate();
    const { grupoId = "" } = useParams();
    const { getGrupo } = useEquipe();
    const grupo = getGrupo(grupoId);

    const [ativos, setAtivos] = useState<Record<string, boolean>>(() => Object.fromEntries((grupo?.operadores ?? []).map((e) => [e, true])));

    if (!grupo) {
        return (
            <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
                    <p className="text-sm text-tertiary">Grupo não encontrado.</p>
                    <Button size="md" color="secondary" onClick={() => navigate("/backstage/equipe-de-operacao")}>Voltar</Button>
                </div>
            </BackstageLayout>
        );
    }

    const total = cotaTotal(grupo);
    const pct = total ? Math.min(100, Math.round((grupo.emitidas / total) * 100)) : 0;

    return (
        <BackstageLayout activeSection="equipe-de-operacao" activeItem="grupos-operacao">
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Breadcrumb */}
                <div className="px-6 pt-6">
                    <nav className="flex items-center gap-1.5 text-sm text-tertiary">
                        <button type="button" onClick={() => navigate("/backstage/home")} aria-label="Início" className="transition duration-100 ease-linear hover:text-secondary">
                            <HomeLine className="size-4" aria-hidden="true" />
                        </button>
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                        <button type="button" onClick={() => navigate("/backstage/equipe-de-operacao")} className="transition duration-100 ease-linear hover:text-secondary">
                            Equipe de operação
                        </button>
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                        <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary">Detalhes</span>
                    </nav>
                </div>

                {/* Header do grupo */}
                <header className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <ButtonUtility size="md" color="tertiary" icon={ArrowLeft} tooltip="Voltar" onClick={() => navigate("/backstage/equipe-de-operacao")} />
                        <Avatar size="lg" initials={iniciais(grupo.nome)} alt={grupo.nome} />
                        <div className="flex flex-col">
                            <h1 className="text-display-xs font-bold text-primary">{grupo.nome}</h1>
                            <p className="flex items-center gap-1.5 text-sm text-tertiary">
                                <span>{grupo.operadores.length} {grupo.operadores.length === 1 ? "operador" : "operadores"}</span>
                                <span aria-hidden="true">•</span>
                                <span>{grupo.modo === "individual" ? "Cota individual" : "Cota compartilhada"}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex min-w-[220px] flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-secondary">Cortesias emitidas</span>
                            <span className="text-sm text-secondary tabular-nums"><span className="font-semibold text-primary">{grupo.emitidas}</span> de {total}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-quaternary">
                            <div className={cx("h-full rounded-full", pct >= 100 ? "bg-error-solid" : "bg-brand-solid")} style={{ width: `${pct}%` }} />
                        </div>
                    </div>
                </header>

                <main className="flex flex-1 flex-col gap-5 px-6 pb-10">
                    {/* Itens liberados pela cota */}
                    <section className="flex flex-col rounded-xl bg-secondary">
                        <div className="flex items-center justify-between gap-2 px-5 py-4">
                            <h2 className="text-md font-semibold text-primary">Itens e cota</h2>
                            <Button size="sm" color="link-color" iconLeading={Edit01} onClick={() => navigate(`/backstage/equipe-de-operacao/${grupo.id}/editar-itens`)}>
                                Editar itens e cota
                            </Button>
                        </div>
                        <div className="mx-5 border-t border-secondary" />
                        <ul className="flex flex-col px-5">
                            {grupo.itens.map((v, i) => {
                                const item = ITENS_POR_ID[v.itemId];
                                // Distribui o total emitido entre os itens (mock determinístico) para o modo compartilhado.
                                const n = grupo.itens.length;
                                const emitidosCompart = n ? Math.floor(grupo.emitidas / n) + (i < grupo.emitidas % n ? 1 : 0) : 0;
                                const emitidasItem = grupo.modo === "individual" && v.cota ? Math.min(v.cota, Math.round(v.cota * (total ? grupo.emitidas / total : 0))) : 0;
                                const pctItem = v.cota ? Math.round((emitidasItem / v.cota) * 100) : 0;
                                return (
                                    <li key={v.itemId} className="flex items-center gap-4 border-b border-secondary py-3 last:border-b-0">
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <span className="truncate text-sm font-medium text-primary">{item ? rotuloItem(item) : v.itemId}</span>
                                            <span className="truncate text-xs text-tertiary">{item?.grupo}</span>
                                        </div>
                                        {grupo.modo === "individual" ? (
                                            <div className="flex w-[88px] shrink-0 flex-col gap-1.5">
                                                <span className="text-sm text-secondary tabular-nums"><span className="font-semibold text-primary">{emitidasItem}</span> de {v.cota}</span>
                                                <div className="h-2 overflow-hidden rounded-full bg-quaternary">
                                                    <div className={cx("h-full rounded-full", pctItem >= 100 ? "bg-error-solid" : "bg-brand-solid")} style={{ width: `${pctItem}%` }} />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="shrink-0 text-sm text-secondary tabular-nums"><span className="font-semibold text-primary">{emitidosCompart}</span> emitidos</span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </section>

                    {/* Operadores */}
                    <section className="flex flex-col rounded-xl bg-secondary">
                        <div className="flex items-center justify-between gap-2 px-5 py-4">
                            <h2 className="text-md font-semibold text-primary">Operadores</h2>
                            <Button size="sm" color="link-color" iconLeading={Plus} onClick={() => navigate(`/backstage/equipe-de-operacao/${grupo.id}/editar-operadores`)}>
                                Adicionar operador
                            </Button>
                        </div>
                        <div className="mx-5 border-t border-secondary" />
                        <ul className="flex flex-col px-5">
                            {grupo.operadores.map((email) => (
                                <li key={email} className="flex items-center gap-3 border-b border-secondary py-3.5 last:border-b-0">
                                    <Toggle isSelected={ativos[email] ?? true} onChange={(v) => setAtivos((p) => ({ ...p, [email]: v }))} size="sm" aria-label={`Ativar ${email}`} />
                                    <span className={cx("truncate text-sm", ativos[email] ?? true ? "text-primary" : "text-tertiary")}>{email}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </main>
            </div>
        </BackstageLayout>
    );
}
