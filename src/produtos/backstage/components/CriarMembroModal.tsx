import { useEffect, useMemo, useState } from "react";
import { XClose } from "@untitledui/icons";
import { toast } from "sonner";
import { Button } from "@/components/base/buttons/button";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { cx } from "@/utils/cx";
import { CheckboxSelect } from "./CheckboxSelect";
import { addMembro, CARGOS, useGrupos, type Membro } from "./membros-store";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAILS = 30;

interface CriarMembroModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCriado?: (membros: Membro[]) => void;
    defaultCargoId?: string;
}

export function CriarMembroModal({ isOpen, onClose, onCriado, defaultCargoId }: CriarMembroModalProps) {
    const grupos = useGrupos();
    const [emails, setEmails] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [cargos, setCargos] = useState<Set<string>>(new Set());
    const [gruposSel, setGruposSel] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            setEmails([]);
            setInput("");
            setCargos(new Set(defaultCargoId ? [defaultCargoId] : []));
            setGruposSel(new Set());
        }
    }, [isOpen, defaultCargoId]);

    const addEmails = (raw: string) => {
        const novos = raw
            .split(/[\s,;]+/)
            .map((s) => s.trim().toLowerCase())
            .filter((s) => EMAIL_REGEX.test(s));
        setEmails((prev) => {
            const set = new Set(prev);
            for (const e of novos) {
                if (set.size >= MAX_EMAILS) break;
                set.add(e);
            }
            return [...set];
        });
    };
    const removeEmail = (e: string) => setEmails((prev) => prev.filter((x) => x !== e));

    const cargoOptions = useMemo(() => CARGOS.map((c) => ({ id: c.id, label: c.nome })), []);

    const podeSalvar = emails.length > 0 && cargos.size > 0 && gruposSel.size > 0;

    const handleSalvar = () => {
        if (!podeSalvar) return;
        const novos: Membro[] = emails.map((email) => ({
            id: crypto.randomUUID(),
            email,
            cargoIds: [...cargos],
            grupoIds: [...gruposSel],
            eventosCount: 0,
        }));
        novos.forEach(addMembro);
        toast.success(novos.length === 1 ? `Membro "${novos[0].email}" adicionado` : `${novos.length} membros adicionados`);
        onCriado?.(novos);
        onClose();
    };

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(o) => !o && onClose()} isDismissable>
            <Modal className="sm:max-w-[520px]">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-semibold text-primary">Adicionar membro</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Fechar"
                                className="-m-1 flex size-8 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>

                        {/* Membros — input de e-mails em tags */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-medium text-secondary">Membros</span>
                            <div
                                className="flex items-center rounded-lg bg-primary px-3 py-2.5 shadow-xs ring-1 ring-border-primary focus-within:ring-2 focus-within:ring-brand"
                                onKeyDown={(e) => {
                                    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
                                        e.preventDefault();
                                        addEmails(input);
                                        setInput("");
                                    } else if (e.key === "Backspace" && !input && emails.length) {
                                        removeEmail(emails[emails.length - 1]);
                                    }
                                }}
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onBlur={() => {
                                        if (input.trim()) {
                                            addEmails(input);
                                            setInput("");
                                        }
                                    }}
                                    onPaste={(e) => {
                                        const text = e.clipboardData.getData("text");
                                        if (/[\s,;]/.test(text)) {
                                            e.preventDefault();
                                            addEmails(text);
                                            setInput("");
                                        }
                                    }}
                                    placeholder="Insira o e-mail ou a lista separada por vírgulas (ex: nome@email.com, nome2@email.com)"
                                    aria-label="E-mails dos membros"
                                    className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-placeholder"
                                />
                            </div>

                            {emails.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {emails.map((e) => (
                                        <span key={e} className="inline-flex items-center gap-1 rounded-md bg-secondary py-1 pr-1 pl-2 text-sm text-secondary ring-1 ring-border-secondary">
                                            {e}
                                            <button type="button" onClick={() => removeEmail(e)} aria-label={`Remover ${e}`} className="flex size-4 items-center justify-center rounded text-fg-quaternary transition hover:bg-tertiary hover:text-fg-secondary">
                                                <XClose className="size-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm text-tertiary">Máximo de 30 e-mails por vez. Use e-mail cadastrado na Ingresse.</p>
                                <span className={cx("shrink-0 text-sm", emails.length >= MAX_EMAILS ? "text-error-primary" : "text-tertiary")}>{emails.length}/{MAX_EMAILS}</span>
                            </div>
                        </div>

                        <CheckboxSelect
                            label="Cargo"
                            required
                            placeholder="Selecione os cargos"
                            options={cargoOptions}
                            selected={cargos}
                            onChange={setCargos}
                            hint="Determina quais telas e ações estarão liberadas para o usuário ou lote convidado."
                        />

                        <CheckboxSelect
                            label="Grupo"
                            required
                            placeholder="Selecione os grupos"
                            options={grupos.map((g) => ({ id: g.id, label: g.nome }))}
                            selected={gruposSel}
                            onChange={setGruposSel}
                            hint="Os novos acessos serão incluídos neste grupo de trabalho."
                        />

                        <div className="grid grid-cols-2 gap-3">
                            <Button size="md" color="secondary" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" onClick={handleSalvar} isDisabled={!podeSalvar}>
                                Salvar
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
