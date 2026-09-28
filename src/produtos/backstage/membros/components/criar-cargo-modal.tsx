import { useState } from "react";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { toast } from "sonner";
import { FEATURES, type Cargo, type FeaturePermission, type PermissionLevel, addCargo } from "../../components/membros-store";
import { PermissionAccordion } from "./permission-accordion";

interface CriarCargoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CriarCargoModal({ isOpen, onClose }: CriarCargoModalProps) {
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [permissions, setPermissions] = useState<FeaturePermission[]>(
        FEATURES.map((f) => ({
            featureId: f.id,
            nome: f.nome,
            level: "none" as PermissionLevel,
            subitens: f.subitens?.map((s) => ({ id: s.id, nome: s.nome, level: "none" as PermissionLevel })),
        }))
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome.trim()) {
            toast.error("Nome do cargo é obrigatório");
            return;
        }

        const novoCargo: Cargo = {
            id: `cargo-${Date.now()}`,
            nome: nome.trim(),
            descricao: descricao.trim(),
            permissions,
        };

        addCargo(novoCargo);
        toast.success(`Cargo "${nome}" criado com sucesso`);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setNome("");
        setDescricao("");
        setPermissions(
            FEATURES.map((f) => ({
                featureId: f.id,
                nome: f.nome,
                level: "none" as PermissionLevel,
                subitens: f.subitens?.map((s) => ({ id: s.id, nome: s.nome, level: "none" as PermissionLevel })),
            }))
        );
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(o) => !o && onClose()} isDismissable>
            <Modal className="sm:max-w-[640px]">
                <Dialog>
                    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div>
                            <h2 className="text-lg font-semibold text-primary">Criar novo cargo</h2>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Nome do cargo"
                                placeholder="Ex: Gerenciador de conteúdo"
                                value={nome}
                                onChange={setNome}
                                isRequired
                            />
                            <TextArea
                                label="Descrição (opcional)"
                                placeholder="Descreva as responsabilidades deste cargo..."
                                value={descricao}
                                onChange={setDescricao}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-secondary">Permissões</label>
                            <div className="max-h-96 overflow-y-auto rounded-lg border border-secondary p-4">
                                <PermissionAccordion permissions={permissions} onChange={setPermissions} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" type="submit">
                                Criar cargo
                            </Button>
                        </div>
                    </form>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
