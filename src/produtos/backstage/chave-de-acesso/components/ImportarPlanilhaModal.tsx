import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { CheckCircle, Trash01, UploadCloud02, XCircle, XClose } from "@untitledui/icons";
import { FileIcon } from "@untitledui/file-icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";

const MAX_KEYS = 1000;

interface ImportarPlanilhaModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called when the user confirms the import. Receives the parsed access keys. */
    onImport: (keys: string[]) => void;
}

interface UploadedFile {
    name: string;
    sizeText: string;
    type: string;
}

export function ImportarPlanilhaModal({ isOpen, onClose, onImport }: ImportarPlanilhaModalProps) {
    const [file, setFile] = useState<UploadedFile | null>(null);
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [parsedKeys, setParsedKeys] = useState<string[] | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isError = !!errorMessage;
    const isLoading = !!file && !isError && parsedKeys !== null && progress < 100;
    const isDone = !!file && !isError && parsedKeys !== null && progress >= 100;

    // Reset state whenever the modal is (re)opened.
    useEffect(() => {
        if (isOpen) {
            setFile(null);
            setProgress(0);
            setIsDragging(false);
            setParsedKeys(null);
            setErrorMessage(null);
        }
    }, [isOpen]);

    // Simulated upload progress — only runs once the file is parsed and valid.
    useEffect(() => {
        if (!file || isError || parsedKeys === null || progress >= 100) return;
        const id = setInterval(() => {
            setProgress((prev) => Math.min(prev + 4, 100));
        }, 70);
        return () => clearInterval(id);
    }, [file, isError, parsedKeys, progress]);

    /** Reads the file content and returns the list of access keys it contains. */
    const parseKeys = async (f?: File): Promise<string[]> => {
        if (!f) return Array.from({ length: 800 }, () => "W3X931LG");
        const ext = f.name.split(".").pop()?.toLowerCase();
        if (ext === "csv" || ext === "txt") {
            const text = await f.text();
            return text
                .split(/[\n\r,;]+/)
                .map((value) => value.trim())
                .filter(Boolean);
        }
        if (ext === "xlsx" || ext === "xls") {
            const buffer = await f.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
            return rows
                .flat()
                .map((cell) => String(cell ?? "").trim())
                .filter(Boolean);
        }
        return Array.from({ length: 800 }, () => "W3X931LG");
    };

    const startImport = async (f?: File) => {
        const sizeMb = f ? (f.size / 1024 / 1024).toFixed(1) : "6.4";
        const ext = f?.name.split(".").pop()?.toLowerCase() ?? "csv";
        setFile({
            name: f?.name ?? "nome-do-arquivo.csv",
            sizeText: `${sizeMb} MB de 16 MB`,
            type: ext === "xlsx" || ext === "xls" ? ext : "csv",
        });
        setProgress(0);
        setParsedKeys(null);
        setErrorMessage(null);

        const keys = await parseKeys(f);
        if (keys.length > MAX_KEYS) {
            setErrorMessage(
                "A planilha ultrapassa o limite de 1.000 chaves por importação. Ajuste o arquivo e tente novamente.",
            );
            return;
        }
        setParsedKeys(keys);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        startImport(e.dataTransfer?.files?.[0]);
    };

    const openFilePicker = () => inputRef.current?.click();

    const handleRemoveFile = () => {
        setFile(null);
        setProgress(0);
        setParsedKeys(null);
        setErrorMessage(null);
    };

    const handleCancel = () => {
        handleRemoveFile();
        onClose();
    };

    const handleConfirm = () => {
        if (!isDone || !parsedKeys) return;
        onImport(parsedKeys);
    };

    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) handleCancel();
            }}
            isDismissable
        >
            <Modal>
                <Dialog>
                    <div className="w-full max-w-md rounded-xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-primary">Importar planilha</h2>
                                <p className="mt-1 text-sm text-tertiary">
                                    Envie uma planilha com as chaves de acesso que deseja adicionar
                                </p>
                            </div>
                            <ButtonUtility size="xs" color="tertiary" icon={XClose} tooltip="Fechar" onClick={handleCancel} />
                        </div>

                        {/* Dropzone */}
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                            }}
                            onDrop={handleDrop}
                            onClick={openFilePicker}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    openFilePicker();
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            className={cx(
                                "relative mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl px-6 py-6 text-center ring-1 ring-inset transition duration-100 ease-linear",
                                isDragging ? "ring-2 ring-brand bg-brand-primary/30" : "ring-border-secondary hover:bg-secondary",
                            )}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    startImport(f);
                                }}
                            />
                            <span className="flex size-10 items-center justify-center rounded-lg ring-1 ring-border-secondary">
                                <UploadCloud02 className="size-5 text-fg-secondary" />
                            </span>
                            <div>
                                <p className="text-sm">
                                    <span className="font-semibold text-brand-secondary">Clique</span>{" "}
                                    <span className="text-secondary">ou arraste o arquivo aqui</span>
                                </p>
                                <p className="mt-1 text-xs text-tertiary">CSV ou Excel com até 1.000 chaves de acesso</p>
                            </div>
                            <FileIcon type="csv" className="pointer-events-none absolute right-6 bottom-6 size-8 shrink-0" />
                        </div>

                        {/* File row (loading / done / error) */}
                        {file && (
                            <div
                                className={cx(
                                    "mt-4 flex items-start gap-3 rounded-xl bg-primary p-4 ring-1",
                                    isError ? "ring-2 ring-error" : "ring-border-secondary",
                                )}
                            >
                                <FileIcon type={file.type} className="size-10 shrink-0" />
                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <span className="truncate text-sm font-medium text-primary">{file.name}</span>
                                            <span className="flex items-center gap-1.5 text-xs text-tertiary">
                                                {file.sizeText}
                                                <span aria-hidden="true">|</span>
                                                {isError ? (
                                                    <XCircle className="size-3.5 text-fg-error-primary" aria-hidden="true" />
                                                ) : isDone ? (
                                                    <CheckCircle className="size-3.5 text-fg-success-primary" aria-hidden="true" />
                                                ) : (
                                                    <UploadCloud02 className="size-3.5 text-fg-quaternary" aria-hidden="true" />
                                                )}
                                                <span
                                                    className={cx(
                                                        isError ? "font-medium text-error-primary" : isDone ? "text-success-primary" : "text-tertiary",
                                                    )}
                                                >
                                                    {isError ? "Erro" : isDone ? "Concluído" : "Importando..."}
                                                </span>
                                            </span>
                                        </div>
                                        <ButtonUtility
                                            size="xs"
                                            color="tertiary"
                                            icon={Trash01}
                                            tooltip="Remover arquivo"
                                            onClick={handleRemoveFile}
                                        />
                                    </div>

                                    {isError ? (
                                        <p className="text-sm font-medium text-error-primary">{errorMessage}</p>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-quaternary">
                                                <div
                                                    className="h-full rounded-full bg-fg-brand-primary transition-[width] duration-75 ease-linear"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-secondary tabular-nums">{progress}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-between gap-3">
                            <Button size="md" color="secondary" onClick={handleCancel}>
                                Cancelar
                            </Button>
                            <Button size="md" color="primary" isDisabled={!isDone} onClick={handleConfirm}>
                                Importar chaves
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
