import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, AlertTriangle } from "@untitledui/icons";
import { BadgeIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { InputTags } from "@/components/base/input/input-tags";
import { cx } from "@/utils/cx";
import { ImportEmailsModal } from "./ImportEmailsModal";
import { showErrorToast, showSuccessToast } from "../utils/toast";

const MAX_EMAILS = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DELIMITER_REGEX = /[\s,;]+/;

const parseRawEmails = (raw: string): string[] =>
    raw
        .split(DELIMITER_REGEX)
        .map((s) => s.trim())
        .filter(Boolean);

type SheetParseResult =
    | { ok: true; emails: string[] }
    | { ok: false; reason: "no-email-column" | "no-contacts" };

/**
 * Parse the raw text of a CSV/TXT spreadsheet into a list of e-mails.
 *
 * Strategy:
 *  - If the first line looks like a header with an "email" column, pull values
 *    from that column on the subsequent rows.
 *  - Else if the file is a single-column list of e-mails (every non-empty line
 *    looks like an e-mail), accept it.
 *  - Else, report "no-email-column".
 */
function parseEmailsFromSheet(raw: string): SheetParseResult {
    const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

    if (lines.length === 0) return { ok: false, reason: "no-contacts" };

    const splitCells = (line: string) => line.split(/[,;\t]/).map((c) => c.trim());

    const headerCells = splitCells(lines[0]).map((c) => c.toLowerCase());
    const emailColIdx = headerCells.findIndex(
        (h) => h === "email" || h === "e-mail" || h === '"email"' || h === "'email'",
    );

    if (emailColIdx !== -1) {
        const emails = lines
            .slice(1)
            .map((line) => splitCells(line)[emailColIdx] ?? "")
            .map((v) => v.replace(/^["']|["']$/g, "").trim())
            .filter(Boolean);
        if (emails.length === 0) return { ok: false, reason: "no-contacts" };
        return { ok: true, emails };
    }

    // No header — accept if it looks like a flat single-column list of e-mails.
    const singleColumnEmails = lines.flatMap((line) => splitCells(line)).filter(Boolean);
    const looksLikeEmails = singleColumnEmails.length > 0 && singleColumnEmails.every((v) => v.includes("@"));
    if (looksLikeEmails) {
        return { ok: true, emails: singleColumnEmails };
    }

    return { ok: false, reason: "no-email-column" };
}

const computeDuplicateIndices = (emails: string[]): Set<number> => {
    const seen = new Map<string, number[]>();
    emails.forEach((email, i) => {
        const key = email.trim().toLowerCase();
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key)!.push(i);
    });
    const dupes = new Set<number>();
    for (const [, idxs] of seen) {
        if (idxs.length > 1) idxs.forEach((i) => dupes.add(i));
    }
    return dupes;
};

const computeErrorIndices = (emails: string[]): Set<number> => {
    const errors = new Set<number>();
    emails.forEach((email, i) => {
        if (!EMAIL_REGEX.test(email)) errors.add(i);
    });
    return errors;
};

export interface EmailListValidity {
    canAdvance: boolean;
    validEmails: string[];
    counts: { all: number; valid: number; invalid: number };
}

interface EmailListManagerProps {
    onValidityChange?: (state: EmailListValidity) => void;
}

export function EmailListManager({ onValidityChange }: EmailListManagerProps) {
    const [draftEmails, setDraftEmails] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [confirmingClear, setConfirmingClear] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);

    const dupeIndices = useMemo(() => computeDuplicateIndices(draftEmails), [draftEmails]);
    const errorIndices = useMemo(() => computeErrorIndices(draftEmails), [draftEmails]);

    const count = draftEmails.length;
    const reachedLimit = count >= MAX_EMAILS;
    const canAdvance = count > 0 && errorIndices.size === 0;

    useEffect(() => {
        onValidityChange?.({
            canAdvance,
            validEmails: draftEmails.filter((_, i) => !errorIndices.has(i)),
            counts: {
                all: count,
                valid: count - errorIndices.size,
                invalid: errorIndices.size,
            },
        });
    }, [canAdvance, draftEmails, errorIndices, count, onValidityChange]);

    useEffect(() => {
        if (count === 0 && confirmingClear) setConfirmingClear(false);
    }, [count, confirmingClear]);

    const handleFileSelect = useCallback(
        async (files: FileList | null) => {
            const file = files?.[0];
            if (!file) return;
            const text = await file.text();
            const parseResult = parseEmailsFromSheet(text);

            if (!parseResult.ok) {
                if (parseResult.reason === "no-email-column") {
                    showErrorToast(
                        'Não encontramos a coluna "email"',
                        'Para importar contatos, a planilha precisa ter uma coluna chamada "email". Revise o arquivo e envie novamente.',
                    );
                } else {
                    showErrorToast(
                        "Não encontramos contatos para importar",
                        "A planilha não tem contatos preenchidos na coluna email. Adicione pelo menos um e-mail e envie o arquivo novamente.",
                    );
                }
                return;
            }

            const sheetEmails = parseResult.emails;

            if (sheetEmails.length > MAX_EMAILS) {
                showErrorToast(
                    `A planilha ultrapassa o limite de ${MAX_EMAILS} contatos`,
                    `Encontramos ${sheetEmails.length} contatos na planilha. Para continuar, mantenha até ${MAX_EMAILS} contatos e envie o arquivo novamente.`,
                );
                return;
            }

            const existingCount = draftEmails.length;
            const available = MAX_EMAILS - existingCount;
            if (sheetEmails.length > available) {
                showErrorToast(
                    "A importação ultrapassa o limite de contatos",
                    `Sua lista já tem ${existingCount} contatos. Para manter o limite de ${MAX_EMAILS} contatos, esta planilha pode ter no máximo ${available} contatos.`,
                );
                return;
            }

            setDraftEmails((prev) => [...prev, ...sheetEmails]);
            setImportModalOpen(false);
            showSuccessToast(
                "Contatos importados",
                `${sheetEmails.length} ${sheetEmails.length === 1 ? "contato foi adicionado" : "contatos foram adicionados"} à lista.`,
            );
        },
        [draftEmails.length],
    );

    const handleModalImport = useCallback(
        (file: File) => {
            const dt = new DataTransfer();
            dt.items.add(file);
            handleFileSelect(dt.files);
        },
        [handleFileSelect],
    );

    const handleClearAll = useCallback(() => {
        setDraftEmails([]);
        setConfirmingClear(false);
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isDragging) setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) handleFileSelect(files);
    };

    return (
        <div className="flex w-full flex-col items-center gap-6">
            <header className="flex flex-col items-center gap-1 text-center">
                <h2 className="text-xl font-semibold text-primary">Adicionar destinatários</h2>
                <p className="text-sm text-tertiary">
                    Importe uma planilha, cole ou escreva e-mails manualmente
                </p>
            </header>

            <div className="flex w-full flex-col gap-3">
                {/* Action row above the input */}
                <div className="flex items-center justify-between gap-3">
                    <Button
                        size="sm"
                        color="secondary"
                        iconLeading={<XlsFileIcon data-icon className="size-5" />}
                        onClick={() => setImportModalOpen(true)}
                    >
                        Importar de planilha
                    </Button>

                    {count > 0 && (
                        <AnimatePresence mode="wait" initial={false}>
                            {confirmingClear ? (
                                <motion.div
                                    key="confirm"
                                    initial={{ opacity: 0, x: 4 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 4 }}
                                    transition={{ duration: 0.12 }}
                                    className="flex items-center gap-2"
                                >
                                    <span className="text-xs text-tertiary">Limpar todos?</span>
                                    <Button
                                        size="xs"
                                        color="secondary"
                                        onClick={() => setConfirmingClear(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        size="xs"
                                        color="primary-destructive"
                                        onClick={handleClearAll}
                                    >
                                        Sim, limpar
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="link"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.12 }}
                                >
                                    <Button
                                        size="sm"
                                        color="link-gray"
                                        onClick={() => setConfirmingClear(true)}
                                    >
                                        Limpar e-mails preenchidos
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cx(
                        "relative rounded-xl transition duration-100 ease-linear",
                        isDragging && "ring-2 ring-brand-solid rounded-lg",
                    )}
                >
                    <InputTags
                        value={draftEmails}
                        onChange={setDraftEmails}
                        splitOn={[",", ";", " "]}
                        allowDuplicates
                        maxTags={MAX_EMAILS}
                        size="md"
                        className="[&_[role=group]]:min-h-[180px] [&_[role=group]]:max-h-[500px] [&_[role=group]]:overflow-y-auto [&_[role=group]]:items-start!"
                        placeholder="Cole ou digite os e-mails separados por vírgula ou Enter."
                        renderTag={(label: string, idx: number) => (
                            <span className="flex items-center gap-1">
                                {errorIndices.has(idx) ? (
                                    <AlertCircle
                                        className="size-3 shrink-0 text-error-primary"
                                        aria-label="Erro de formato"
                                    />
                                ) : dupeIndices.has(idx) ? (
                                    <AlertTriangle
                                        className="size-3 shrink-0 text-warning-primary"
                                        aria-label="E-mail duplicado"
                                    />
                                ) : null}
                                <span>{label}</span>
                            </span>
                        )}
                    />
                    {isDragging && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-brand-primary/90">
                            <p className="text-sm font-semibold text-brand-secondary">
                                Solte a planilha aqui
                            </p>
                        </div>
                    )}
                </div>

                {/* Summary row below the input: warnings on the left, counter on the right */}
                <div className="flex items-start justify-between gap-4">
                    <AnimatePresence initial={false}>
                        {dupeIndices.size > 0 || errorIndices.size > 0 ? (
                            <motion.div
                                key="warnings"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden"
                            >
                                {dupeIndices.size > 0 && (
                                    <div className="flex items-start gap-2 text-sm text-primary">
                                        <BadgeIcon
                                            type="color"
                                            size="sm"
                                            color="warning"
                                            icon={AlertTriangle}
                                        />
                                        <span>
                                            {dupeIndices.size}{" "}
                                            {dupeIndices.size === 1
                                                ? "e-mail repetido. Se continuar, esse e-mail receberá cortesias para cada ocorrência na lista"
                                                : "e-mails repetidos. Se continuar, esses e-mails receberão cortesias para cada ocorrência na lista"}
                                        </span>
                                    </div>
                                )}
                                {errorIndices.size > 0 && (
                                    <div className="flex items-start gap-2 text-sm text-primary">
                                        <BadgeIcon
                                            type="color"
                                            size="sm"
                                            color="error"
                                            icon={AlertCircle}
                                        />
                                        <span>
                                            {errorIndices.size}{" "}
                                            {errorIndices.size === 1
                                                ? "e-mail inválido"
                                                : "e-mails inválidos"}
                                            , corrija para poder avançar
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <span key="placeholder" />
                        )}
                    </AnimatePresence>

                    <p
                        className={cx(
                            "shrink-0 whitespace-nowrap text-xs",
                            reachedLimit ? "text-warning-primary" : "text-tertiary",
                        )}
                    >
                        {count} de {MAX_EMAILS} e-mails adicionados
                        {reachedLimit && " — limite atingido"}
                    </p>
                </div>
            </div>

            <ImportEmailsModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onImport={handleModalImport}
            />
        </div>
    );
}

const XlsFileIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 40 40" fill="none" {...props}>
        <path
            stroke="currentColor"
            strokeWidth={1.5}
            d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
        />
        <path
            stroke="currentColor"
            strokeWidth={1.5}
            d="M27 .5V8a4 4 0 0 0 4 4h7.5"
        />
        <rect width={28} height={16} x={1} y={18} fill="#079455" rx={2} />
        <path
            fill="#fff"
            d="M11.273 25.273H9.717a1.5 1.5 0 0 0-.174-.536 1.4 1.4 0 0 0-.337-.405 1.5 1.5 0 0 0-.476-.255 1.8 1.8 0 0 0-.579-.09q-.564 0-.983.282-.42.276-.65.81-.231.528-.231 1.285 0 .777.23 1.306.236.53.654.8.42.27.97.27.309 0 .571-.082.267-.082.473-.238a1.4 1.4 0 0 0 .34-.387q.14-.228.192-.519l1.556.007q-.06.501-.302.966a2.9 2.9 0 0 1-.643.828 3 3 0 0 1-.959.575q-.554.21-1.253.21-.973 0-1.74-.44a3.13 3.13 0 0 1-1.208-1.276q-.44-.834-.44-2.02 0-1.19.447-2.024.448-.835 1.215-1.272a3.4 3.4 0 0 1 1.726-.44q.632 0 1.172.177.543.179.962.519.42.337.682.827.265.49.34 1.122m5.048-.454a.9.9 0 0 0-.366-.668q-.324-.238-.877-.238-.377 0-.636.107a.9.9 0 0 0-.398.288.7.7 0 0 0-.135.419.6.6 0 0 0 .082.34.85.85 0 0 0 .252.253q.16.103.37.18.21.075.447.129l.653.156q.477.106.874.284.398.177.689.437.291.259.45.61.164.353.168.807-.004.667-.341 1.157-.335.487-.966.757-.63.266-1.516.266-.882 0-1.534-.27a2.25 2.25 0 0 1-1.016-.799q-.362-.533-.38-1.317h1.488q.024.366.21.61.188.242.5.366.316.12.714.12.39 0 .678-.113a1.04 1.04 0 0 0 .451-.316.73.73 0 0 0 .16-.465q0-.244-.146-.412a1.1 1.1 0 0 0-.419-.284 4 4 0 0 0-.67-.213l-.793-.199q-.92-.224-1.452-.7-.533-.475-.53-1.282-.003-.66.352-1.154.36-.493.984-.77.625-.277 1.42-.277.81 0 1.414.277.608.276.944.77.338.494.348 1.144zm3.92-2.092L22 28.253h.067l1.762-5.526h1.704L23.026 30h-1.982l-2.51-7.273z"
        />
    </svg>
);
