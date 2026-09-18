import { useEffect, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { criarEvento, type Evento } from "../eventos/data/eventos";

interface CriarEventoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCriado: (evento: Evento) => void;
}

/** Cria um evento de verdade (em rascunho) — antes deste modal, "Criar evento" era um botão sem ação. */
export function CriarEventoModal({ isOpen, onClose, onCriado }: CriarEventoModalProps) {
    const [nome, setNome] = useState("");
    const [data, setData] = useState("");
    const [local, setLocal] = useState("");
    const [produtor, setProdutor] = useState("");

    useEffect(() => {
        if (isOpen) {
            setNome("");
            setData("");
            setLocal("");
            setProdutor("");
        }
    }, [isOpen]);

    const podeCriar = nome.trim().length > 0 && data.length > 0 && local.trim().length > 0 && produtor.trim().length > 0;

    const handleCriar = () => {
        if (!podeCriar) return;
        const evento = criarEvento({ nome: nome.trim(), data: new Date(data).toISOString(), local: local.trim(), produtor: produtor.trim() });
        onCriado(evento);
        onClose();
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-[480px]">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-lg font-semibold text-primary">Criar evento</h2>
                            <p className="text-sm text-tertiary">O evento nasce em rascunho. Publique quando estiver pronto para vender.</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Input label="Nome do evento" placeholder="Ex: Réveillon Carneiros 2027" value={nome} onChange={setNome} isRequired />
                            <Input label="Data e horário" type="datetime-local" value={data} onChange={setData} isRequired />
                            <Input label="Local" placeholder="Ex: Arena do Grêmio · Porto Alegre, RS" value={local} onChange={setLocal} isRequired />
                            <Input label="Produtor" placeholder="Quem organiza o evento" value={produtor} onChange={setProdutor} isRequired />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" onClick={handleCriar} isDisabled={!podeCriar}>
                                Criar evento
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
