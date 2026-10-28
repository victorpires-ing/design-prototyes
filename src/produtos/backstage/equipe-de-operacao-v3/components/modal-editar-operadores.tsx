import { useEffect, useState } from "react";
import { XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import type { GrupoCotas } from "../data/equipe-v3-store";
import { operadoresDe, SeletorOperadores } from "./seletor-operadores";

interface Props {
    grupo: GrupoCotas | null;
    onCancelar: () => void;
    onSalvar: (gruposMembrosIds: string[], emailsAvulsos: string[]) => void;
}

/**
 * "Editar operadores" no detalhe: a mesma seleção da etapa Grupo (grupos de Membros +
 * pessoas individuais) num modal. Header e rodapé fixos; só o conteúdo rola.
 */
export function ModalEditarOperadores({ grupo, onCancelar, onSalvar }: Props) {
    const [grupos, setGrupos] = useState<string[]>([]);
    const [emails, setEmails] = useState<string[]>([]);

    // Cada abertura começa do que está salvo no grupo.
    useEffect(() => {
        if (!grupo) return;
        setGrupos(grupo.gruposMembrosIds);
        setEmails(grupo.emailsAvulsos);
    }, [grupo]);

    const vazio = operadoresDe(grupos, emails).length === 0;

    return (
        <ModalOverlay isOpen={Boolean(grupo)} onOpenChange={(abrir) => !abrir && onCancelar()} isDismissable className="bg-black/40 backdrop-blur-[16px]">
            <Modal className="max-w-[720px]">
                <Dialog aria-label="Editar operadores">
                    <div className="tema-cotas relative flex max-h-[calc(100dvh-96px)] w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary ring-inset">
                        <button
                            type="button"
                            onClick={onCancelar}
                            aria-label="Fechar"
                            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover"
                        >
                            <XClose className="size-5" aria-hidden="true" />
                        </button>
                        <div className="flex shrink-0 flex-col gap-0.5 px-6 pt-6 pr-14">
                            <h2 className="text-md font-semibold text-primary">Editar operadores</h2>
                            <p className="text-sm text-tertiary">Selecione grupos de membros ou adicione pessoas individualmente.</p>
                        </div>

                        <div className="min-h-0 overflow-y-auto px-6 pt-5">
                            <SeletorOperadores grupos={grupos} onGrupos={setGrupos} emails={emails} onEmails={setEmails} semMoldura />
                        </div>

                        <div className="flex shrink-0 gap-3 border-t border-secondary px-6 pt-6 pb-6 mt-6">
                            <Button size="md" color="secondary" className="flex-1" onClick={onCancelar}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" className="flex-1" isDisabled={vazio} onClick={() => onSalvar(grupos, emails)}>
                                Salvar alterações
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
