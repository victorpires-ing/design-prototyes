import { Checkbox } from "@/components/base/checkbox/checkbox";
import { AccordionComponent } from "@/components/application/accordion/accordion";
import { FEATURES, type FeaturePermission, type PermissionLevel } from "../../components/membros-store";
import { cx } from "@/utils/cx";

interface PermissionAccordionProps {
    permissions: FeaturePermission[];
    onChange: (permissions: FeaturePermission[]) => void;
}

export function PermissionAccordion({ permissions, onChange }: PermissionAccordionProps) {
    const handlePermissionChange = (featureId: string, level: PermissionLevel) => {
        const updated = permissions.map((p) => (p.featureId === featureId ? { ...p, level } : p));
        onChange(updated);
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
        onChange(updated);
    };

    return (
        <AccordionComponent type="single" collapsible className="w-full space-y-1">
            {FEATURES.map((feature) => {
                const perm = permissions.find((p) => p.featureId === feature.id) || {
                    featureId: feature.id,
                    nome: feature.nome,
                    level: "none" as PermissionLevel,
                    subitens: feature.subitens?.map((s) => ({ id: s.id, nome: s.nome, level: "none" as PermissionLevel })),
                };

                return (
                    <AccordionComponent.Item
                        key={feature.id}
                        value={feature.id}
                        trigger={
                            <div className="flex items-center justify-between w-full">
                                <span className="text-sm font-medium text-primary">{feature.nome}</span>
                                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                    <PermissionCheckboxes
                                        level={perm.level}
                                        onChange={(newLevel) => handlePermissionChange(feature.id, newLevel)}
                                    />
                                </div>
                            </div>
                        }
                    >
                        {perm.subitens && perm.subitens.length > 0 && (
                            <div className="space-y-3 border-t border-secondary pt-3">
                                {perm.subitens.map((subitem) => (
                                    <div key={subitem.id} className="flex items-center justify-between">
                                        <span className="text-sm text-tertiary">{subitem.nome}</span>
                                        <PermissionCheckboxes
                                            level={subitem.level}
                                            onChange={(newLevel) => handleSubitemChange(feature.id, subitem.id, newLevel)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </AccordionComponent.Item>
                );
            })}
        </AccordionComponent>
    );
}

function PermissionCheckboxes({ level, onChange }: { level: PermissionLevel; onChange: (level: PermissionLevel) => void }) {
    return (
        <div className="flex items-center gap-2">
            <Checkbox
                size="sm"
                isSelected={level === "viewer"}
                onChange={(isSelected) => onChange(isSelected ? "viewer" : "none")}
                aria-label="Visualizador"
                title="Visualizador"
            />
            <Checkbox
                size="sm"
                isSelected={level === "editor"}
                onChange={(isSelected) => onChange(isSelected ? "editor" : "none")}
                aria-label="Editor"
                title="Editor"
            />
            <Checkbox
                size="sm"
                isSelected={level === "admin"}
                onChange={(isSelected) => onChange(isSelected ? "admin" : "none")}
                aria-label="Admin"
                title="Admin"
            />
        </div>
    );
}
