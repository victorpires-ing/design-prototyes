import { useState } from "react";
import { ChevronDown, SearchLg, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

interface VincularChavesSlideOutProps {
    isOpen: boolean;
    onClose: () => void;
    /** Chamado ao salvar, com a quantidade de chaves vinculadas. */
    onSave: (count: number) => void;
}

const TOTAL_DISPONIVEIS = 1200;
const KEYS = Array.from({ length: 24 }, (_, i) => ({ id: i, name: `W3X${String(i + 1).padStart(2, "0")}LG` }));

export function VincularChavesSlideOut({ isOpen, onClose, onSave }: VincularChavesSlideOutProps) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<number>>(new Set());

    // Resultado filtrado pela busca.
    const term = search.trim().toLowerCase();
    const filtered = term === "" ? KEYS : KEYS.filter((k) => k.name.toLowerCase().includes(term));
    const filteredIds = filtered.map((k) => k.id);

    const toggle = (id: number) =>
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    // "Selecionar/Desmarcar todos" agem apenas sobre as chaves do filtro atual.
    const selecionarFiltradas = () => setSelected((prev) => new Set([...prev, ...filteredIds]));
    const desmarcarFiltradas = () =>
        setSelected((prev) => {
            const next = new Set(prev);
            filteredIds.forEach((id) => next.delete(id));
            return next;
        });

    const vinculadaLabel = selected.size > 1 ? "vinculadas" : "vinculada";

    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex justify-end bg-overlay/70 outline-hidden backdrop-blur-[2px]",
                    isEntering && "duration-300 ease-out animate-in fade-in",
                    isExiting && "duration-200 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "h-full w-full max-w-[480px] bg-primary shadow-xl outline-hidden",
                        isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                        isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                    )
                }
            >
                <AriaDialog className="flex h-full flex-col outline-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4">
                        <h2 className="text-lg font-semibold text-primary">Vincular chaves de acesso</h2>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                    </div>

                    {/* Busca */}
                    <div className="px-6">
                        <label className="text-sm font-medium text-secondary">Busca</label>
                        <div className="mt-1.5">
                            <Input icon={SearchLg} placeholder="Busque por chave de acesso" value={search} onChange={setSearch} />
                        </div>
                        {term !== "" && <p className="mt-3 text-sm text-tertiary">{filtered.length} chaves encontradas</p>}
                    </div>

                    {/* Opções + contador */}
                    <div className="mt-4 flex items-center justify-between gap-3 border-b border-secondary px-6 pb-3">
                        <Dropdown.Root>
                            <Button size="sm" color="secondary" iconTrailing={ChevronDown}>
                                Opções
                            </Button>
                            <Dropdown.Popover placement="bottom start" className="w-56">
                                <Dropdown.Menu>
                                    <Dropdown.Item label="Selecionar todos" onAction={selecionarFiltradas} />
                                    <Dropdown.Item label="Desmarcar todos" onAction={desmarcarFiltradas} />
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown.Root>
                        <span className="text-sm text-tertiary">
                            {selected.size} de {TOTAL_DISPONIVEIS.toLocaleString("pt-BR")} {vinculadaLabel}
                        </span>
                    </div>

                    {/* Lista (scroll) */}
                    <div className="flex-1 overflow-y-auto px-6 py-2">
                        {filtered.map((key) => (
                            <label key={key.id} className="flex h-11 cursor-pointer items-center gap-3">
                                <Checkbox size="sm" isSelected={selected.has(key.id)} onChange={() => toggle(key.id)} />
                                <span className="text-sm text-secondary">{key.name}</span>
                            </label>
                        ))}
                        {filtered.length === 0 && <p className="px-1 py-6 text-sm text-tertiary">Nenhuma chave encontrada.</p>}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 border-t border-secondary px-6 py-4">
                        <Button size="lg" color="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button size="lg" color="primary" isDisabled={selected.size === 0} onClick={() => onSave(selected.size)}>
                            Salvar
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
