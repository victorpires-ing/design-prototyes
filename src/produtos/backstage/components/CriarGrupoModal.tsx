import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { CheckboxSelect } from "./CheckboxSelect";
import { addGrupo, EVENTOS, useMembros, type Grupo } from "./membros-store";

interface CriarGrupoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCriado?: (g: Grupo) => void;
    /** Nome pré-preenchido (ex.: fluxo JIT da gestão de cortesias). */
    nomeInicial?: string;
}

export function CriarGrupoModal({ isOpen, onClose, onCriado, nomeInicial = "" }: CriarGrupoModalProps) {
    const membros = useMembros();
    const [nome, setNome] = useState(nomeInicial);
    const [eventos, setEventos] = useState<Set<string>>(new Set());
    const [membrosSel, setMembrosSel] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            setNome(nomeInicial);
            setEventos(new Set());
            setMembrosSel(new Set());
        }
    }, [isOpen, nomeInicial]);

    const podeSalvar = nome.trim().length > 0 && eventos.size > 0;

    const handleCriar = () => {
        if (!podeSalvar) return;
        const grupo: Grupo = {
            id: crypto.randomUUID(),
            nome: nome.trim(),
            eventoIds: [...eventos],
            membroIds: [...membrosSel],
        };
        addGrupo(grupo);
        toast.success(`Grupo "${grupo.nome}" criado`);
        onCriado?.(grupo);
        onClose();
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(o) => !o && onClose()} isDismissable>
            <Modal className="sm:max-w-[480px]">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <h2 className="text-lg font-semibold text-primary">Criar novo grupo</h2>

                        <div className="flex flex-col gap-4">
                            <Input label="Nome do grupo" placeholder="Ex: Time de Marketing, Financeiro SP, Portaria…" value={nome} onChange={setNome} isRequired />
                            <CheckboxSelect
                                label="Eventos"
                                required
                                placeholder="Escolha manualmente quais eventos este grupo poderá gerenciar"
                                options={EVENTOS.map((e) => ({ id: e.id, label: e.nome }))}
                                selected={eventos}
                                onChange={setEventos}
                            />
                            <CheckboxSelect
                                label="Membros"
                                placeholder="Busque e selecione as pessoas para este grupo"
                                options={membros.map((m) => ({ id: m.id, label: m.email }))}
                                selected={membrosSel}
                                onChange={setMembrosSel}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" onClick={handleCriar} isDisabled={!podeSalvar}>
                                Criar grupo
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
