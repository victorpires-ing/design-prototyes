import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/base/badges/badges";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";
import { FEATURES_V2, RELATORIOS_V2, resumoChips, type FeatureAccess, type Nivel, type ResumoChip } from "../data/membros-v2-store";

/* ------------------------------------------------------------------ */
/*  UI compartilhada de acesso                                         */
/* ------------------------------------------------------------------ */

const iniciais = (texto: string) => {
    const partes = texto.trim().split(/\s+/);
    if (partes.length > 1) return (partes[0][0] + partes[1][0]).toUpperCase();
    return texto.slice(0, 2).toUpperCase();
};

const chipColor = (nivel: ResumoChip["nivel"]) => (nivel === "write" ? "success" : "blue");

export function Avatar({ nome, size = "md" }: { nome: string; size?: "sm" | "md" }) {
    const s = size === "sm" ? "size-8 text-sm" : "size-9 text-sm";
    return <span className={cx("flex shrink-0 items-center justify-center rounded-lg bg-utility-blue-100 font-semibold text-utility-blue-700", s)}>{iniciais(nome)}</span>;
}

/** Expandir/recolher animado (altura + fade). */
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
    return (
        <AnimatePresence initial={false}>
            {open && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Segmented control de 3 níveis (Sem acesso / read / write) em linguagem da feature. */
export function NivelSegmented({ featureId, nivel, onChange }: { featureId: string; nivel: Nivel; onChange: (n: Nivel) => void }) {
    const feature = FEATURES_V2.find((f) => f.id === featureId)!;
    const opts: { id: Nivel; label: string }[] = [
        { id: "none", label: "Sem acesso" },
        { id: "read", label: feature.labels.read },
        { id: "write", label: feature.labels.write },
    ];
    return (
        <div className="inline-flex shrink-0 rounded-lg bg-secondary p-0.5 ring-1 ring-border-secondary">
            {opts.map((o) => {
                const active = nivel === o.id;
                return (
                    <button
                        key={o.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(o.id)}
                        className={cx(
                            "rounded-md px-2.5 py-1 text-sm whitespace-nowrap transition duration-100 ease-linear",
                            active ? "bg-primary font-semibold text-primary shadow-xs ring-1 ring-border-secondary" : "text-tertiary hover:text-secondary",
                        )}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

/** Escolha entre opções mutuamente exclusivas (pílulas). */
function OpcaoRadios({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((o) => {
                const active = value === o.id;
                return (
                    <button
                        key={o.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(o.id)}
                        className={cx(
                            "rounded-lg border px-3 py-1.5 text-sm transition duration-100 ease-linear",
                            active ? "border-brand bg-brand-primary font-semibold text-brand-secondary" : "border-secondary text-secondary hover:bg-primary_hover",
                        )}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Editor de acesso controlado                                        */
/* ------------------------------------------------------------------ */

export function AcessoEditor({ acessos, onChange }: { acessos: Record<string, FeatureAccess>; onChange: (featureId: string, patch: Partial<FeatureAccess>) => void }) {
    return (
        <div className="flex flex-col rounded-xl bg-primary ring-1 ring-border-secondary">
            {FEATURES_V2.map((f, i) => {
                const ac: FeatureAccess = acessos[f.id];
                const mostraEscopo = f.temEscopo && ac.nivel === "read";
                const mostraEmissao = f.temEmissao && ac.nivel === "write";
                const mostraRelatorios = f.temRelatorios && ac.nivel !== "none";
                return (
                    <div key={f.id} className={cx("flex flex-col gap-3 p-4", i !== FEATURES_V2.length - 1 && "border-b border-secondary")}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                            <div className="flex min-w-0 flex-col">
                                <span className="text-sm font-medium text-primary">{f.nome}</span>
                                <span className="text-sm text-tertiary">{f.descricao}</span>
                            </div>
                            <NivelSegmented featureId={f.id} nivel={ac.nivel} onChange={(n) => onChange(f.id, { nivel: n })} />
                        </div>

                        {mostraEscopo && (
                            <div className="flex flex-col gap-1.5 rounded-lg bg-secondary/50 p-3">
                                <span className="text-sm font-medium text-secondary">O que pode visualizar</span>
                                <OpcaoRadios
                                    value={ac.escopo ?? "proprio"}
                                    onChange={(v) => onChange(f.id, { escopo: v as FeatureAccess["escopo"] })}
                                    options={[
                                        { id: "proprio", label: "Apenas do próprio usuário" },
                                        { id: "todos", label: "De todos os usuários" },
                                    ]}
                                />
                            </div>
                        )}

                        {mostraEmissao && (
                            <div className="flex flex-col gap-1.5 rounded-lg bg-secondary/50 p-3">
                                <span className="text-sm font-medium text-secondary">Modo de emissão</span>
                                <OpcaoRadios
                                    value={ac.emissao ?? "total"}
                                    onChange={(v) => onChange(f.id, { emissao: v as FeatureAccess["emissao"] })}
                                    options={[
                                        { id: "total", label: "Emissão total" },
                                        { id: "aprovacao", label: "Mediante aprovação" },
                                    ]}
                                />
                            </div>
                        )}

                        {mostraRelatorios && (
                            <div className="flex flex-col gap-2 rounded-lg bg-secondary/50 p-3">
                                <span className="text-sm font-medium text-secondary">Relatórios que pode ver</span>
                                <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                                    {RELATORIOS_V2.map((r) => {
                                        const sel = ac.relatorios ?? [];
                                        const marcado = sel.includes(r.id);
                                        return (
                                            <label key={r.id} className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition duration-100 ease-linear hover:bg-primary_hover">
                                                <Checkbox
                                                    size="sm"
                                                    isSelected={marcado}
                                                    onChange={() => onChange(f.id, { relatorios: marcado ? sel.filter((x) => x !== r.id) : [...sel, r.id] })}
                                                    aria-label={r.nome}
                                                />
                                                <span className="truncate text-sm text-secondary">{r.nome}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/** Chips do resumo implícito (o "cargo" derivado do acesso). */
export function ResumoAcesso({ acessos, vazioTexto }: { acessos: Record<string, FeatureAccess>; vazioTexto: string }) {
    const chips = resumoChips(acessos);
    if (chips.length === 0) return <span className="text-sm text-tertiary">{vazioTexto}</span>;
    return (
        <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
                <Badge key={c.featureId} size="sm" type="pill-color" color={chipColor(c.nivel)}>
                    {c.texto}
                </Badge>
            ))}
        </div>
    );
}
