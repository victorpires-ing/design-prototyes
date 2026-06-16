import { useEffect, useRef, useState } from "react";
import { Trash01, UploadCloud02, XClose } from "@untitledui/icons";
import { FileIcon } from "@untitledui/file-icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";

interface ImportEmailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Validate the file as soon as it's picked. Returns the error message
     *  to display inline, or `null` if the file is valid. */
    onValidate?: (file: File) => string | null | Promise<string | null>;
    /** Commit the import. Returns an inline error message on failure or
     *  `null` on success (parent closes the modal). */
    onImport: (file: File) => string | null | Promise<string | null>;
    /** URL of the sample sheet (download link). */
    sampleHref?: string;
}

export function ImportEmailsModal({
    isOpen,
    onClose,
    onValidate,
    onImport,
    sampleHref = "/test-emails-80.csv",
}: ImportEmailsModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setFile(null);
            setErrorMessage(null);
        }
    }, [isOpen]);

    const pickFile = async (f: File) => {
        setFile(f);
        setErrorMessage(null);
        if (onValidate) {
            const result = await onValidate(f);
            if (result) setErrorMessage(result);
        }
    };

    const handleConfirm = async () => {
        if (!file || errorMessage) return;
        const result = await onImport(file);
        if (result) setErrorMessage(result);
    };

    const handleCancel = () => {
        setFile(null);
        setErrorMessage(null);
        onClose();
    };

    const handleRemoveFile = () => {
        setFile(null);
        setErrorMessage(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const f = e.dataTransfer?.files?.[0];
        if (f) pickFile(f);
    };

    const openFilePicker = () => inputRef.current?.click();

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
                                <h2 className="text-lg font-semibold text-primary">
                                    Importar e-mails
                                </h2>
                                <p className="mt-1 text-sm text-tertiary">
                                    Baixe a{" "}
                                    <a
                                        href={sampleHref}
                                        download
                                        className="font-medium text-brand-secondary underline underline-offset-2 hover:text-brand-secondary_hover"
                                    >
                                        planilha de exemplo aqui
                                    </a>
                                </p>
                            </div>
                            <ButtonUtility
                                size="xs"
                                color="tertiary"
                                icon={XClose}
                                tooltip="Fechar"
                                onClick={handleCancel}
                            />
                        </div>

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
                                "mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition duration-100 ease-linear",
                                isDragging
                                    ? "border-brand-solid bg-brand-primary"
                                    : "border-brand-solid hover:bg-brand-primary/40",
                            )}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".csv,.xlsx,.txt"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) pickFile(f);
                                }}
                            />
                            <UploadCloud02 className="size-6 text-fg-secondary" />
                            <div>
                                <p className="text-sm">
                                    <span className="font-semibold text-brand-secondary">
                                        Clique
                                    </span>{" "}
                                    <span className="text-secondary">
                                        ou arraste arquivos aqui
                                    </span>
                                </p>
                                <p className="mt-1 text-xs text-tertiary">
                                    Use um arquivo .CSV ou .XLSX com até 100 contatos. O arquivo deve incluir uma coluna chamada email.
                                </p>
                            </div>
                        </div>

                        {file && (
                            <div
                                className={cx(
                                    "mt-4 flex items-start gap-3 rounded-xl p-4 ring-1",
                                    errorMessage
                                        ? "bg-primary ring-2 ring-error"
                                        : "bg-primary ring-border-secondary",
                                )}
                            >
                                <FileIcon type="csv" className="size-10 shrink-0" />
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <span className="truncate text-sm font-medium text-primary">
                                                {file.name}
                                            </span>
                                            <span className="text-xs text-tertiary">
                                                {(file.size / 1024).toFixed(1)} KB
                                                {errorMessage && (
                                                    <>
                                                        {" · "}
                                                        <span className="font-medium text-error-primary">
                                                            Failed
                                                        </span>
                                                    </>
                                                )}
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
                                    {errorMessage && (
                                        <p className="mt-1 text-sm font-medium text-error-primary">
                                            {errorMessage}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={handleCancel}>
                                Cancelar
                            </Button>
                            <Button
                                size="md"
                                color="primary"
                                isDisabled={!file || !!errorMessage}
                                onClick={handleConfirm}
                            >
                                Importar e-mails
                            </Button>
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
