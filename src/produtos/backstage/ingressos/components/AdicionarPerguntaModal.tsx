import { useState } from "react";
import { SearchLg, XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { PERGUNTAS_CADASTRADAS, TIPO_LABEL, type PerguntaCadastrada } from "../data/formularios";

interface AdicionarPerguntaModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** IDs de perguntas já presentes no formulário (ficam desabilitadas). */
    jaAdicionadas: string[];
    onAdd: (perguntas: PerguntaCadastrada[]) => void;
}

export function AdicionarPerguntaModal({ isOpen, onClose, jaAdicionadas, onAdd }: AdicionarPerguntaModalProps) {
    const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
    const [busca, setBusca] = useState("");

    const reset = () => {
        setSelecionadas(new Set());
        setBusca("");
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const toggle = (id: string) =>
        setSelecionadas((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const filtradas = PERGUNTAS_CADASTRADAS.filter((p) => p.titulo.toLowerCase().includes(busca.trim().toLowerCase()));

    const handleAdd = () => {
        const escolhidas = PERGUNTAS_CADASTRADAS.filter((p) => selecionadas.has(p.id));
        onAdd(escolhidas);
        reset();
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && handleClose()} isDismissable>
            <Modal className="max-w-lg">
                <Dialog>
                    <div className="flex max-h-[80vh] w-full flex-col overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary_alt">
                        {/* Header (fixo) */}
                        <div className="flex shrink-0 flex-col gap-4 px-5 pt-5 pb-4">
                            <div className="flex items-start justify-between">
                                <FeaturedIcon icon={SearchLg} color="gray" theme="modern" size="md" />
                                <ButtonUtility size="sm" color="tertiary" icon={XClose} onClick={handleClose} tooltip="Fechar" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <h2 className="text-md font-semibold text-primary">Adicionar pergunta</h2>
                                <p className="text-sm text-tertiary">Escolha entre as perguntas já cadastradas.</p>
                            </div>
                            <Input aria-label="Buscar pergunta" icon={SearchLg} placeholder="Buscar pergunta" value={busca} onChange={setBusca} />
                        </div>

                        {/* Lista (única área com scroll) */}
                        <div className="min-h-0 flex-1 overflow-y-auto border-t border-secondary px-5 py-2">
                            {filtradas.length === 0 ? (
                                <p className="py-8 text-center text-sm text-tertiary">Nenhuma pergunta encontrada.</p>
                            ) : (
                                <ul className="flex flex-col gap-0.5">
                                    {filtradas.map((pergunta) => {
                                        const desativada = pergunta.ativa === false;
                                        const jaTem = jaAdicionadas.includes(pergunta.id);
                                        const bloqueada = desativada || jaTem;
                                        const checked = jaTem || selecionadas.has(pergunta.id);
                                        return (
                                            <li key={pergunta.id}>
                                                <label
                                                    className={cx(
                                                        "flex items-start gap-3 rounded-lg p-3 transition duration-100 ease-linear",
                                                        bloqueada ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-secondary",
                                                    )}
                                                >
                                                    <Checkbox
                                                        size="sm"
                                                        className="mt-0.5"
                                                        isSelected={checked}
                                                        isDisabled={bloqueada}
                                                        onChange={() => toggle(pergunta.id)}
                                                    />
                                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                        <span className="text-sm font-medium text-primary">{pergunta.titulo}</span>
                                                        <span className="text-xs text-tertiary">
                                                            {TIPO_LABEL[pergunta.tipo]}
                                                            {jaTem && " • já adicionada"}
                                                        </span>
                                                    </span>
                                                    {desativada && (
                                                        <Badge size="sm" color="gray" type="modern">
                                                            Desativada
                                                        </Badge>
                                                    )}
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Footer (fixo) */}
                        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-secondary px-5 py-4">
                            <Button size="md" color="secondary" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" isDisabled={selecionadas.size === 0} onClick={handleAdd}>
                                Adicionar{selecionadas.size > 0 ? ` (${selecionadas.size})` : ""}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
