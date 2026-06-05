import { useState } from "react";
import { ChevronDown, SearchLg, XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";

interface AdicionarVinculosSlideOutProps {
    isOpen: boolean;
    onClose: () => void;
    /** Chamado ao salvar, com a quantidade de itens vinculados. */
    onSave: (count: number) => void;
}

const TOTAL_DISPONIVEIS = 1200;

/* Mesma estrutura de itens do passo "Vincular itens" (tokens do design). */
const makeLote = (id: string) => ({ id, name: "{lote_name}" });
const makeTicket = (gid: string, n: number) => ({
    id: `${gid}t${n}`,
    name: "{ticket_name}",
    type: "{ticket_type}",
    lotes: [makeLote(`${gid}t${n}l1`), makeLote(`${gid}t${n}l2`)],
});
const makeGroup = (gid: string) => ({ id: gid, name: "{group_name}", tickets: [makeTicket(gid, 1), makeTicket(gid, 2), makeTicket(gid, 3)] });
const GROUPS = [makeGroup("g1"), makeGroup("g2"), makeGroup("g3")];

const allLeafIds = GROUPS.flatMap((g) => g.tickets.flatMap((t) => t.lotes.map((l) => l.id)));

export function AdicionarVinculosSlideOut({ isOpen, onClose, onSave }: AdicionarVinculosSlideOutProps) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const setIds = (ids: string[], select: boolean) =>
        setSelected((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => (select ? next.add(id) : next.delete(id)));
            return next;
        });
    const allSel = (ids: string[]) => ids.length > 0 && ids.every((id) => selected.has(id));
    const indet = (ids: string[]) => ids.some((id) => selected.has(id)) && !allSel(ids);

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
                    <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-primary">Adicionar vínculos</h2>
                            <p className="mt-1 text-sm text-tertiary">
                                Esta ação apenas adiciona novos vínculos. Itens já vinculados não serão alterados.
                            </p>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                    </div>

                    {/* Busca */}
                    <div className="px-6">
                        <label className="text-sm font-medium text-secondary">Busca</label>
                        <div className="mt-1.5">
                            <Input icon={SearchLg} placeholder="Busque por chave de acesso" value={search} onChange={setSearch} />
                        </div>
                    </div>

                    {/* Opções + contador */}
                    <div className="mt-5 flex items-center justify-between gap-3 border-b border-secondary px-6 pb-3">
                        <Dropdown.Root>
                            <Button size="sm" color="secondary" iconTrailing={ChevronDown}>
                                Opções
                            </Button>
                            <Dropdown.Popover placement="bottom start" className="w-56">
                                <Dropdown.Menu>
                                    <Dropdown.Item label="Selecionar todos" onAction={() => setIds(allLeafIds, true)} />
                                    <Dropdown.Item label="Desmarcar todos" onAction={() => setIds(allLeafIds, false)} />
                                </Dropdown.Menu>
                            </Dropdown.Popover>
                        </Dropdown.Root>
                        <span className="text-sm text-tertiary">
                            {selected.size} de {TOTAL_DISPONIVEIS.toLocaleString("pt-BR")} vinculada
                        </span>
                    </div>

                    {/* Lista de itens (árvore com seleção em cascata) */}
                    <div className="flex-1 overflow-y-auto px-6 py-2">
                        {GROUPS.map((group) => {
                            const groupIds = group.tickets.flatMap((t) => t.lotes.map((l) => l.id));
                            return (
                                <div key={group.id} className="flex flex-col">
                                    <Row
                                        label={group.name}
                                        bold
                                        isSelected={allSel(groupIds)}
                                        isIndeterminate={indet(groupIds)}
                                        onChange={(checked) => setIds(groupIds, checked)}
                                    />
                                    {group.tickets.map((ticket) => {
                                        const ticketIds = ticket.lotes.map((l) => l.id);
                                        return (
                                            <div key={ticket.id} className="flex flex-col">
                                                <Row
                                                    indent="pl-6"
                                                    label={ticket.name}
                                                    badge={ticket.type}
                                                    isSelected={allSel(ticketIds)}
                                                    isIndeterminate={indet(ticketIds)}
                                                    onChange={(checked) => setIds(ticketIds, checked)}
                                                />
                                                {ticket.lotes.map((lote) => (
                                                    <Row
                                                        key={lote.id}
                                                        indent="pl-12"
                                                        label={lote.name}
                                                        isSelected={selected.has(lote.id)}
                                                        onChange={(checked) => setIds([lote.id], checked)}
                                                    />
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
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

interface RowProps {
    label: string;
    badge?: string;
    indent?: string;
    bold?: boolean;
    isSelected: boolean;
    isIndeterminate?: boolean;
    onChange: (checked: boolean) => void;
}

const Row = ({ label, badge, indent, bold, isSelected, isIndeterminate, onChange }: RowProps) => (
    <div className={cx("flex h-12 items-center gap-2", indent)}>
        <Checkbox size="sm" isSelected={isSelected} isIndeterminate={isIndeterminate} onChange={onChange} />
        <span className={cx("text-sm", bold ? "font-semibold text-primary" : "text-secondary")}>{label}</span>
        {badge && (
            <Badge size="sm" color="gray" type="modern">
                {badge}
            </Badge>
        )}
    </div>
);
