import { useEffect, useRef, useState } from "react";
import { UploadCloud02, XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";

interface ImportEmailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (file: File) => void;
    /** URL of the sample sheet (download link). */
    sampleHref?: string;
}

export function ImportEmailsModal({
    isOpen,
    onClose,
    onImport,
    sampleHref = "/test-emails-80.csv",
}: ImportEmailsModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset selected file each time the modal opens.
    useEffect(() => {
        if (isOpen) setFile(null);
    }, [isOpen]);

    const handleConfirm = () => {
        if (!file) return;
        onImport(file);
    };

    const handleCancel = () => {
        setFile(null);
        onClose();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const f = e.dataTransfer?.files?.[0];
        if (f) setFile(f);
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
                                    if (f) setFile(f);
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
                                    {file ? (
                                        <>
                                            <span className="font-medium text-primary">
                                                {file.name}
                                            </span>{" "}
                                            · {(file.size / 1024).toFixed(1)} KB
                                        </>
                                    ) : (
                                        '.CSV ou .XLSX com até 100 contatos na coluna "email"'
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button size="md" color="secondary" onClick={handleCancel}>
                                Cancelar
                            </Button>
                            <Button
                                size="md"
                                color="primary"
                                isDisabled={!file}
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
