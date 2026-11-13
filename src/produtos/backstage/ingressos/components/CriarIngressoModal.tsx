import { useEffect, useState } from "react";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/base/select/select-native";
import type { NovoIngresso } from "../data/catalogo-banco";

interface CriarIngressoModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessoes: { id: string; label: string }[];
    gruposExistentes: string[];
    /** Aberto a partir de um grupo: já vem com a sessão e o grupo dele. */
    preset?: { sessaoId: string; grupo: string } | null;
    onCriar: (n: NovoIngresso) => void;
}

/** Cria um ingresso com lote único direto no catálogo do evento em contexto. */
export function CriarIngressoModal({ isOpen, onClose, sessoes, gruposExistentes, preset, onCriar }: CriarIngressoModalProps) {
    const [sessaoId, setSessaoId] = useState("");
    const [grupo, setGrupo] = useState("");
    const [nome, setNome] = useState("");
    const [preco, setPreco] = useState("");
    const [quantidade, setQuantidade] = useState("");
    const [comMeia, setComMeia] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        setSessaoId(preset?.sessaoId ?? sessoes[0]?.id ?? "");
        setGrupo(preset?.grupo ?? gruposExistentes[0] ?? "Pista");
        setNome("Inteira");
        setPreco("");
        setQuantidade("");
        setComMeia(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const precoN = Number(preco.replace(",", "."));
    const qtdN = Math.floor(Number(quantidade));
    const valido = !!sessaoId && grupo.trim() && nome.trim() && precoN >= 0 && preco !== "" && qtdN > 0;

    const criar = () => {
        if (!valido) return;
        onCriar({ sessaoId, grupo: grupo.trim(), nome: nome.trim(), preco: precoN, quantidade: qtdN, comMeia });
        onClose();
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="sm:max-w-[480px]">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-lg font-semibold text-primary">Criar ingresso</h2>
                            <p className="text-sm text-tertiary">O ingresso entra à venda assim que o evento estiver publicado ou privado.</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            {sessoes.length > 1 && (
                                <NativeSelect label="Sessão" value={sessaoId} onChange={(e) => setSessaoId(e.target.value)} options={sessoes.map((s) => ({ label: s.label, value: s.id }))} />
                            )}
                            <Input label="Grupo" hint="Grupo do evento. Se o nome já existir, o ingresso entra nele." placeholder="Ex: Pista, Camarote" value={grupo} onChange={setGrupo} isRequired />
                            <Input label="Nome do ingresso" placeholder="Ex: Inteira" value={nome} onChange={setNome} isRequired />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Preço (R$)" type="number" inputMode="decimal" placeholder="0,00" value={preco} onChange={setPreco} isRequired />
                                <Input label="Quantidade" type="number" inputMode="numeric" placeholder="Ex: 500" value={quantidade} onChange={setQuantidade} isRequired />
                            </div>
                            <Checkbox size="sm" label="Criar também a meia-entrada" hint="Metade do preço, com 40% da quantidade." isSelected={comMeia} onChange={setComMeia} />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" onClick={criar} isDisabled={!valido}>
                                Criar ingresso
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
