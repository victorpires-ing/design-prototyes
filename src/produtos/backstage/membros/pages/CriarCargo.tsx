import { useState } from "react";
import { ChevronDown, ArrowLeft } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { toast } from "sonner";
import { FEATURES, type FeaturePermission, type PermissionLevel, addCargo } from "../../components/membros-store";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";

export function CriarCargo() {
    const [nome, setNome] = useState("");
    const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set(FEATURES.map(f => f.id)));
    const [permissions, setPermissions] = useState<FeaturePermission[]>(
        FEATURES.map((f) => ({
            featureId: f.id,
            nome: f.nome,
            level: "none" as PermissionLevel,
            subitens: f.subitens.map((s) => ({ id: s.id, nome: s.nome, level: "none" as PermissionLevel, subitens: getSubsubitens(f.id, s.id) })),
        }))
    );

    function getSubsubitens(featureId: string, subitemId: string) {
        if (featureId === "relatorios-geral" && subitemId === "vendas-geral") {
            return [
                { id: "vendas-ingressos", nome: "Ingressos", level: "none" as PermissionLevel },
                { id: "vendas-combos", nome: "Combos", level: "none" as PermissionLevel },
            ];
        }
        if (featureId === "relatorios-geral" && subitemId === "financeiro-geral") {
            return [
                { id: "fin-receita", nome: "Receita", level: "none" as PermissionLevel },
                { id: "fin-custos", nome: "Custos", level: "none" as PermissionLevel },
            ];
        }
        if (featureId === "relatorios-geral" && subitemId === "audience") {
            return [
                { id: "aud-dados", nome: "Dados da Audiência", level: "none" as PermissionLevel },
                { id: "aud-comportamento", nome: "Comportamento", level: "none" as PermissionLevel },
            ];
        }
        return [];
    }

    const toggleFeature = (featureId: string) => {
        const newSet = new Set(expandedFeatures);
        if (newSet.has(featureId)) {
            newSet.delete(featureId);
        } else {
            newSet.add(featureId);
        }
        setExpandedFeatures(newSet);
    };

    const handleFeaturePermissionChange = (featureId: string, level: PermissionLevel) => {
        const updated = permissions.map((p) => {
            if (p.featureId === featureId && p.subitens) {
                return {
                    ...p,
                    level,
                    subitens: p.subitens.map((s) => ({
                        ...s,
                        level,
                        subitens: s.subitens?.map((sub) => ({ ...sub, level })) || [],
                    })),
                };
            }
            return p;
        });
        setPermissions(updated);
    };

    const handleSubitemChange = (featureId: string, subitemId: string, level: PermissionLevel) => {
        const updated = permissions.map((p) => {
            if (p.featureId === featureId && p.subitens) {
                return {
                    ...p,
                    subitens: p.subitens.map((s) => (s.id === subitemId ? { ...s, level } : s)),
                };
            }
            return p;
        });
        setPermissions(updated);
    };

    const handleSubsubitemChange = (featureId: string, subitemId: string, subsubitemId: string, level: PermissionLevel) => {
        const updated = permissions.map((p) => {
            if (p.featureId === featureId && p.subitens) {
                return {
                    ...p,
                    subitens: p.subitens.map((s) =>
                        s.id === subitemId && s.subitens
                            ? {
                                ...s,
                                subitens: s.subitens.map((sub) =>
                                    sub.id === subsubitemId ? { ...sub, level } : sub
                                ),
                            }
                            : s
                    ),
                };
            }
            return p;
        });
        setPermissions(updated);
    };

    const handleCriar = () => {
        if (!nome.trim()) {
            toast.error("Nome do cargo é obrigatório");
            return;
        }

        const novoCargo = {
            id: `cargo-${Date.now()}`,
            nome: nome.trim(),
            descricao: "",
            permissions,
        };

        addCargo(novoCargo);
        toast.success(`Cargo "${nome}" criado com sucesso`);
        setNome("");
        // TODO: redirecionar para página de cargos
    };

    return (
        <BackstageLayout showEventContext={false} activeProducer="membros">
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header */}
                <header className="flex min-h-11 items-center justify-between gap-4 border-b border-secondary px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Button size="md" color="secondary" iconLeading={ArrowLeft} onClick={() => window.history.back()}>
                            Voltar
                        </Button>
                        <h1 className="text-display-xs font-bold text-primary">Criar cargo</h1>
                    </div>
                    <Button size="md" color="primary" onClick={handleCriar}>
                        Criar cargo
                    </Button>
                </header>

                {/* Main Content */}
                <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6 pb-10">
                    {/* Nome do Cargo */}
                    <div className="w-full max-w-2xl">
                        <Input
                            label="Nome do cargo"
                            placeholder="Ex: Gerente de eventos"
                            value={nome}
                            onChange={setNome}
                            isRequired
                        />
                    </div>

                    {/* Feature Tables */}
                    <div className="w-full space-y-6">
                        {permissions.map((feature) => {
                            const isExpanded = expandedFeatures.has(feature.featureId);
                            const allSubitemLevels = feature.subitens?.flatMap(s => [
                                s.level,
                                ...(s.subitens?.map(sub => sub.level) || []),
                            ]) || [];
                            const someViewer = allSubitemLevels.some(l => l === "viewer");
                            const someEditor = allSubitemLevels.some(l => l === "editor");
                            const someAdmin = allSubitemLevels.some(l => l === "admin");
                            const allViewer = allSubitemLevels.every(l => l === "viewer") && allSubitemLevels.length > 0;
                            const allEditor = allSubitemLevels.every(l => l === "editor") && allSubitemLevels.length > 0;
                            const allAdmin = allSubitemLevels.every(l => l === "admin") && allSubitemLevels.length > 0;

                            return (
                                <div key={feature.featureId} className="overflow-hidden rounded-lg border border-secondary bg-primary">
                                    {/* Feature Header - Always Visible */}
                                    <div className="flex items-center border-b border-secondary bg-secondary_subtle px-6 py-4 hover:bg-secondary transition-colors">
                                        <button
                                            onClick={() => toggleFeature(feature.featureId)}
                                            className="flex items-center gap-4 flex-1"
                                        >
                                            <ChevronDown
                                                className={cx("size-5 text-fg-quaternary transition-transform", isExpanded && "rotate-180")}
                                                aria-hidden="true"
                                            />
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold text-primary">{feature.nome}</h3>
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-xs text-brand-secondary hover:text-brand-tertiary transition-colors"
                                                >
                                                    Detalhar permissão
                                                </button>
                                            </div>
                                        </button>

                                        {/* Permission Titles */}
                                        <div className="flex w-64 items-center justify-around text-xs font-semibold text-secondary">
                                            <span>Visualizar</span>
                                            <span>Editor</span>
                                            <span>Admin</span>
                                        </div>

                                        {/* Permission Checkboxes */}
                                        <div className="flex w-56 items-center justify-around gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                size="sm"
                                                isSelected={allViewer}
                                                isIndeterminate={someViewer && !allViewer}
                                                onChange={(isSelected) =>
                                                    handleFeaturePermissionChange(feature.featureId, isSelected ? "viewer" : "none")
                                                }
                                                aria-label={`${feature.nome} - Visualizar (geral)`}
                                            />
                                            <Checkbox
                                                size="sm"
                                                isSelected={allEditor}
                                                isIndeterminate={someEditor && !allEditor}
                                                onChange={(isSelected) =>
                                                    handleFeaturePermissionChange(feature.featureId, isSelected ? "editor" : "none")
                                                }
                                                aria-label={`${feature.nome} - Editor (geral)`}
                                            />
                                            <Checkbox
                                                size="sm"
                                                isSelected={allAdmin}
                                                isIndeterminate={someAdmin && !allAdmin}
                                                onChange={(isSelected) =>
                                                    handleFeaturePermissionChange(feature.featureId, isSelected ? "admin" : "none")
                                                }
                                                aria-label={`${feature.nome} - Admin (geral)`}
                                            />
                                            <div className="w-8" />
                                        </div>
                                    </div>

                                    {/* Feature Table */}
                                    {isExpanded && (
                                        <div className="divide-y divide-secondary">
                                            {feature.subitens && feature.subitens.map((subitem) => (
                                                <div key={subitem.id}>
                                                    {/* Subitem Row */}
                                                    <div className="flex items-center gap-4 px-6 py-3 hover:bg-secondary_hover transition-colors">
                                                        <span className="flex-1 text-sm text-tertiary">{subitem.nome}</span>

                                                        <div className="flex w-56 items-center justify-around gap-2">
                                                            <Checkbox
                                                                size="sm"
                                                                isSelected={subitem.level === "viewer"}
                                                                onChange={(isSelected) =>
                                                                    handleSubitemChange(feature.featureId, subitem.id, isSelected ? "viewer" : "none")
                                                                }
                                                                aria-label={`${subitem.nome} - Visualizar`}
                                                            />
                                                            <Checkbox
                                                                size="sm"
                                                                isSelected={subitem.level === "editor"}
                                                                onChange={(isSelected) =>
                                                                    handleSubitemChange(feature.featureId, subitem.id, isSelected ? "editor" : "none")
                                                                }
                                                                aria-label={`${subitem.nome} - Editor`}
                                                            />
                                                            <Checkbox
                                                                size="sm"
                                                                isSelected={subitem.level === "admin"}
                                                                onChange={(isSelected) =>
                                                                    handleSubitemChange(feature.featureId, subitem.id, isSelected ? "admin" : "none")
                                                                }
                                                                aria-label={`${subitem.nome} - Admin`}
                                                            />
                                                            <div className="w-8" />
                                                        </div>
                                                    </div>

                                                    {/* Sub-subitems (only for relatórios) */}
                                                    {subitem.subitens && subitem.subitens.map((subsubitem) => (
                                                        <div key={subsubitem.id} className="flex items-center gap-4 px-12 py-2 hover:bg-secondary_hover transition-colors border-t border-secondary/50">
                                                            <span className="flex-1 text-xs text-quaternary">{subsubitem.nome}</span>

                                                            <div className="flex w-56 items-center justify-around gap-2">
                                                                <Checkbox
                                                                    size="sm"
                                                                    isSelected={subsubitem.level === "viewer"}
                                                                    onChange={(isSelected) =>
                                                                        handleSubsubitemChange(feature.featureId, subitem.id, subsubitem.id, isSelected ? "viewer" : "none")
                                                                    }
                                                                    aria-label={`${subsubitem.nome} - Visualizar`}
                                                                />
                                                                <Checkbox
                                                                    size="sm"
                                                                    isSelected={subsubitem.level === "editor"}
                                                                    onChange={(isSelected) =>
                                                                        handleSubsubitemChange(feature.featureId, subitem.id, subsubitem.id, isSelected ? "editor" : "none")
                                                                    }
                                                                    aria-label={`${subsubitem.nome} - Editor`}
                                                                />
                                                                <Checkbox
                                                                    size="sm"
                                                                    isSelected={subsubitem.level === "admin"}
                                                                    onChange={(isSelected) =>
                                                                        handleSubsubitemChange(feature.featureId, subitem.id, subsubitem.id, isSelected ? "admin" : "none")
                                                                    }
                                                                    aria-label={`${subsubitem.nome} - Admin`}
                                                                />
                                                                <div className="w-8" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </BackstageLayout>
    );
}
