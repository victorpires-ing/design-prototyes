import { useEffect, useRef, useState } from "react";
import { Trash01, UploadCloud02, XClose } from "@untitledui/icons";
import { FileIcon } from "@untitledui/file-icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";

type ParseResult = { ok: true; emails: string[] } | { ok: false; reason: "no-email-column" | "no-contacts" };

/** Extrai e-mails de um CSV/TXT: usa a coluna "email" do cabeçalho, ou aceita lista simples. */
function parseEmailsFromSheet(raw: string): ParseResult {
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { ok: false, reason: "no-contacts" };

    const splitCells = (line: string) => line.split(/[,;\t]/).map((c) => c.trim());
    const header = splitCells(lines[0]).map((c) => c.toLowerCase().replace(/^["']|["']$/g, ""));
    const idx = header.findIndex((h) => h === "email" || h === "e-mail");

    if (idx !== -1) {
        const emails = lines.slice(1).map((l) => (splitCells(l)[idx] ?? "").replace(/^["']|["']$/g, "").trim()).filter(Boolean);
        return emails.length ? { ok: true, emails } : { ok: false, reason: "no-contacts" };
    }
    const flat = lines.flatMap(splitCells).filter(Boolean);
    if (flat.length && flat.every((v) => v.includes("@"))) return { ok: true, emails: flat };
    return { ok: false, reason: "no-email-column" };
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (emails: string[]) => void;
}

const SAMPLE_HREF = "/test-emails-80.csv";

export function ImportarEmailsModal({ isOpen, onClose, onConfirm }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [erro, setErro] = useState<string | null>(null);
    const [arrastando, setArrastando] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) { setFile(null); setErro(null); }
    }, [isOpen]);

    const escolher = (f: File) => {
        setFile(f);
        setErro(null);
        const nome = f.name.toLowerCase();
        if (!/\.(csv|xlsx|txt)$/.test(nome)) setErro("Formato inválido. Use um arquivo .CSV, .XLSX ou .TXT.");
    };

    const confirmar = () => {
        if (!file || erro) return;
        const reader = new FileReader();
        reader.onload = () => {
            const res = parseEmailsFromSheet(String(reader.result ?? ""));
            if (!res.ok) {
                setErro(res.reason === "no-email-column" ? "Não encontramos uma coluna chamada email no arquivo." : "O arquivo não tem nenhum contato.");
                return;
            }
            onConfirm(res.emails);
        };
        reader.onerror = () => setErro("Não foi possível ler o arquivo. Tente novamente.");
        reader.readAsText(file);
    };

    const fechar = () => { setFile(null); setErro(null); onClose(); };
    const abrirSeletor = () => inputRef.current?.click();

    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(open) => { if (!open) fechar(); }} isDismissable>
            <Modal>
                <Dialog>
                    <div className="w-full max-w-md rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-primary">Importar e-mails</h2>
                                <p className="mt-1 text-sm text-tertiary">
                                    Baixe a <a href={SAMPLE_HREF} download className="font-medium text-brand-secondary underline underline-offset-2 hover:text-brand-secondary_hover">planilha de exemplo aqui</a>
                                </p>
                            </div>
                            <ButtonUtility size="xs" color="tertiary" icon={XClose} tooltip="Fechar" onClick={fechar} />
                        </div>

                        <div
                            onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setArrastando(false); }}
                            onDrop={(e) => { e.preventDefault(); setArrastando(false); const f = e.dataTransfer?.files?.[0]; if (f) escolher(f); }}
                            onClick={abrirSeletor}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirSeletor(); } }}
                            role="button"
                            tabIndex={0}
                            className={cx(
                                "mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition duration-100 ease-linear",
                                arrastando ? "border-brand-solid bg-brand-primary" : "border-brand-solid hover:bg-brand-primary/40",
                            )}
                        >
                            <input ref={inputRef} type="file" accept=".csv,.xlsx,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) escolher(f); }} />
                            <UploadCloud02 className="size-6 text-fg-secondary" />
                            <div>
                                <p className="text-sm">
                                    <span className="font-semibold text-brand-secondary">Clique</span> <span className="text-secondary">ou arraste arquivos aqui</span>
                                </p>
                                <p className="mt-1 text-xs text-tertiary">Use um arquivo .CSV ou .XLSX com até 100 contatos. O arquivo deve incluir uma coluna chamada email.</p>
                            </div>
                        </div>

                        {file && (
                            <div className={cx("mt-4 flex items-start gap-3 rounded-xl bg-primary p-4 ring-1", erro ? "ring-2 ring-error" : "ring-border-secondary")}>
                                <FileIcon type="csv" className="size-10 shrink-0" />
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <span className="truncate text-sm font-medium text-primary">{file.name}</span>
                                            <span className="text-xs text-tertiary">{(file.size / 1024).toFixed(1)} KB{erro && <> · <span className="font-medium text-error-primary">Falhou</span></>}</span>
                                        </div>
                                        <ButtonUtility size="xs" color="tertiary" icon={Trash01} tooltip="Remover arquivo" onClick={() => { setFile(null); setErro(null); }} />
                                    </div>
                                    {erro && <p className="mt-1 text-sm font-medium text-error-primary">{erro}</p>}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={fechar}>Cancelar</Button>
                            <Button size="md" color="primary" isDisabled={!file || !!erro} onClick={confirmar}>Importar e-mails</Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
