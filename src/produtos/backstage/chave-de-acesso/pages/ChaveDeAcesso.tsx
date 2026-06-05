import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Download01, Plus, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { RadioButton, RadioGroup } from "@/components/base/radio-buttons/radio-buttons";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { ImportarPlanilhaModal } from "../components/ImportarPlanilhaModal";
import msExcelIcon from "../assets/ms_excel.png";
import alertIcon from "../assets/alert.png";
import alertAmareloIcon from "../assets/alert-amarelo.png";

type CreationMode = "automatica" | "manual";

const EXAMPLE_CODES = ["ASDFG", "SDFGH", "DFGHJ", "DFGHJ", "CFGHJ", "OFGHJ"];

export function ChaveDeAcesso() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCreating, setIsCreating] = useState(() => !!(location.state as { create?: boolean } | null)?.create);
    const [mode, setMode] = useState<CreationMode | null>(null);

    // Campos do fluxo "Criar automaticamente"
    const [limiteUso, setLimiteUso] = useState("");
    const [quantidade, setQuantidade] = useState("");
    const [prefixo, setPrefixo] = useState("");

    const quantidadeNumber = parseInt(quantidade.replace(/\D/g, ""), 10) || 0;
    const isQuantidadeInvalid = quantidadeNumber > 5000;

    // Campos do fluxo "Criar manualmente"
    const [limiteUsoManual, setLimiteUsoManual] = useState("");
    const [chavesManuais, setChavesManuais] = useState("");
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    // Estado do campo de chaves: digitação livre, importando (loading) ou carregado (chips).
    const [manualFieldState, setManualFieldState] = useState<"input" | "loading" | "loaded">("input");
    const [importedKeys, setImportedKeys] = useState<{ id: number; value: string }[]>([]);
    const [newKey, setNewKey] = useState("");
    const nextKeyId = useRef(0);
    const keysInputRef = useRef<HTMLInputElement>(null);
    // Edição inline de um chip já importado.
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState("");

    const MAX_CHAVES = 1000;
    const chavesList = chavesManuais
        .split(",")
        .map((chave) => chave.trim())
        .filter(Boolean);
    const hasChaveManual = chavesList.length > 0 || importedKeys.length > 0;

    const handlePlanilhaImportada = (keys: string[]) => {
        setIsImportModalOpen(false);
        setManualFieldState("loading");
        // Simula o processamento da planilha e popula as chaves importadas.
        setTimeout(() => {
            const mapped = keys.map((value, i) => ({ id: i, value }));
            nextKeyId.current = mapped.length;
            setImportedKeys(mapped);
            setManualFieldState("loaded");
        }, 1800);
    };

    const removeImportedKey = (id: number) => setImportedKeys((prev) => prev.filter((key) => key.id !== id));

    // Uma chave é válida se contiver apenas letras e números (sem símbolos/emojis).
    const isValidKey = (value: string) => /^[A-Za-z0-9]+$/.test(value);
    const invalidKeysCount = importedKeys.filter((key) => !isValidKey(key.value)).length;
    const hasInvalidKey = invalidKeysCount > 0;

    // Duplicadas: a primeira ocorrência é a "original"; as repetições são destacadas.
    // A comparação ignora maiúsculas/minúsculas (as chaves não distinguem caixa).
    const duplicateIds = new Set<number>();
    const seenValues = new Set<string>();
    for (const key of importedKeys) {
        const normalized = key.value.toUpperCase();
        if (seenValues.has(normalized)) duplicateIds.add(key.id);
        else seenValues.add(normalized);
    }
    const duplicateCount = duplicateIds.size;

    const startEditingKey = (id: number, value: string) => {
        setEditingId(id);
        setEditingValue(value);
    };

    const commitEditingKey = () => {
        if (editingId === null) return;
        const value = editingValue.trim();
        setImportedKeys((prev) =>
            value === ""
                ? prev.filter((key) => key.id !== editingId)
                : prev.map((key) => (key.id === editingId ? { ...key, value } : key)),
        );
        setEditingId(null);
        setEditingValue("");
    };

    const addImportedKeys = (raw: string) => {
        const values = raw
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
        if (values.length === 0) return;
        setImportedKeys((prev) => {
            const room = MAX_CHAVES - prev.length;
            const toAdd = values.slice(0, Math.max(room, 0)).map((value) => ({ id: nextKeyId.current++, value }));
            return [...prev, ...toAdd];
        });
        setNewKey("");
    };

    const handleNewKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addImportedKeys(newKey);
        } else if (event.key === "Backspace" && newKey === "" && importedKeys.length > 0) {
            removeImportedKey(importedKeys[importedKeys.length - 1].id);
        }
    };

    // Habilita o botão "Criar chaves de acesso" conforme o fluxo escolhido.
    let canSubmit = false;
    if (mode === "automatica") canSubmit = quantidadeNumber > 0 && !isQuantidadeInvalid;
    if (mode === "manual") canSubmit = hasChaveManual && manualFieldState !== "loading" && !hasInvalidKey;

    return (
        <BackstageLayout activeSection="marketing" activeItem="chave-de-acesso">
            <div className="flex min-w-0 flex-1 flex-col">
                {isCreating ? (
                    <>
                        <header className="flex items-center justify-between gap-3 px-4 py-6 md:px-6">
                            <div className="flex items-center gap-3">
                                <ButtonUtility
                                    size="md"
                                    color="secondary"
                                    icon={ArrowLeft}
                                    tooltip="Voltar"
                                    onClick={() => setIsCreating(false)}
                                />
                                <h1 className="text-display-xs font-bold text-primary">Chave de acesso</h1>
                            </div>
                            <Button
                                size="lg"
                                color="primary"
                                isDisabled={!canSubmit}
                                onClick={() => navigate("/backstage/marketing/chave-de-acesso/vincular-itens")}
                            >
                                Criar e vincular itens
                            </Button>
                        </header>

                        <main className="flex flex-1 flex-col items-center px-4 py-6 md:px-6">
                            <div className="flex w-full max-w-3xl flex-col gap-6">
                                <h2 className="text-center text-lg font-semibold text-primary">
                                    Escolha como quer criar suas chaves de acesso
                                </h2>

                                <RadioGroup
                                    size="md"
                                    aria-label="Como criar suas chaves de acesso"
                                    value={mode ?? ""}
                                    onChange={(value) => setMode(value as CreationMode)}
                                    className="gap-3"
                                >
                                    {/* Criar automaticamente */}
                                    <OptionCard isSelected={mode === "automatica"}>
                                        <RadioButton value="automatica" size="md" label="Criar automaticamente" />

                                        <AnimatePresence initial={false}>
                                        {mode === "automatica" && (
                                            <motion.div
                                                key="auto-content"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.25, ease: "easeOut" }}
                                                className="overflow-hidden"
                                            >
                                            <div className="mt-4 flex flex-col gap-5 pl-8">
                                                <p className="text-sm text-tertiary">
                                                    As chaves de acesso geradas usarão apenas letras e números, sem
                                                    símbolos ou emojis e sem distinção entre maiúsculas e minúsculas.
                                                </p>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                    <Input
                                                        label="Limite de uso (opcional)"
                                                        placeholder="Ilimitado"
                                                        value={limiteUso}
                                                        onChange={setLimiteUso}
                                                    />
                                                    <Input
                                                        label="Quantidade"
                                                        placeholder="Até 5.000"
                                                        value={quantidade}
                                                        onChange={setQuantidade}
                                                        isInvalid={isQuantidadeInvalid}
                                                    />
                                                    <Input
                                                        label="Prefixo (opcional)"
                                                        placeholder="Ex: sorteio"
                                                        value={prefixo}
                                                        onChange={setPrefixo}
                                                    />
                                                </div>

                                                {isQuantidadeInvalid && (
                                                    <p className="-mt-3 text-sm text-error-primary">
                                                        O seu total de chaves de acesso no evento não pode ser maior que 5 mil.
                                                    </p>
                                                )}

                                                <div className="flex flex-col gap-3 rounded-xl bg-secondary p-4 ring-1 ring-inset ring-border-secondary">
                                                    <p className="text-sm font-medium text-secondary">
                                                        Exemplos dos códigos que serão gerados
                                                    </p>
                                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                                        {EXAMPLE_CODES.map((code, index) => (
                                                            <span key={index} className="text-sm font-medium text-tertiary uppercase">
                                                                {prefixo}
                                                                {code}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            </motion.div>
                                        )}
                                        </AnimatePresence>
                                    </OptionCard>

                                    {/* Criar manualmente */}
                                    <OptionCard isSelected={mode === "manual"}>
                                        <RadioButton value="manual" size="md" label="Criar manualmente" />

                                        <AnimatePresence initial={false}>
                                        {mode === "manual" && (
                                            <motion.div
                                                key="manual-content"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.25, ease: "easeOut" }}
                                                className="overflow-hidden"
                                            >
                                            <div className="mt-4 flex flex-col gap-5 pl-8">
                                                <p className="text-sm text-tertiary">
                                                    As chaves de acesso geradas usarão apenas letras e números, sem
                                                    símbolos ou emojis e sem distinção entre maiúsculas e minúsculas.
                                                </p>

                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                                    <Input
                                                        label="Limite de uso (opcional)"
                                                        placeholder="Ilimitado"
                                                        tooltip="Quantas vezes cada chave de acesso pode ser utilizada."
                                                        value={limiteUsoManual}
                                                        onChange={setLimiteUsoManual}
                                                        wrapperClassName="sm:w-56"
                                                        className="sm:w-56"
                                                    />
                                                    <div className="flex items-center gap-4">
                                                        <Button
                                                            size="md"
                                                            color="secondary"
                                                            iconLeading={<SpreadsheetIcon />}
                                                            onClick={() => setIsImportModalOpen(true)}
                                                        >
                                                            Importar de planilha
                                                        </Button>
                                                        <Button size="md" color="link-gray" iconLeading={Download01}>
                                                            Baixar modelo de importação
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    {manualFieldState === "input" && (
                                                        <div className="relative">
                                                            <TextArea
                                                                aria-label="Chaves de acesso"
                                                                placeholder="Insira aqui até 1.000 chaves separadas por vírgulas."
                                                                rows={5}
                                                                value={chavesManuais}
                                                                onChange={setChavesManuais}
                                                            />
                                                            <span className="pointer-events-none absolute right-3 bottom-3 text-xs text-tertiary">
                                                                {chavesList.length} / {MAX_CHAVES.toLocaleString("pt-BR")}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {manualFieldState === "loading" && (
                                                        <>
                                                            <div className="flex min-h-44 flex-col items-center justify-center gap-4 rounded-lg bg-primary ring-1 ring-primary ring-inset">
                                                                <LoadingSpinner />
                                                                <p className="text-sm text-tertiary">Carregando chaves</p>
                                                            </div>
                                                            <span className="self-end text-xs text-tertiary">0 / 0</span>
                                                        </>
                                                    )}

                                                    {manualFieldState === "loaded" && (
                                                        <>
                                                            <div
                                                                onClick={() => keysInputRef.current?.focus()}
                                                                className="cursor-text rounded-lg bg-primary px-3 py-2 ring-1 ring-primary ring-inset focus-within:ring-2 focus-within:ring-brand"
                                                            >
                                                            <div className="flex max-h-40 min-h-40 flex-wrap content-start items-start gap-2 overflow-y-auto">
                                                                {importedKeys.map((key) => {
                                                                    const invalid = !isValidKey(key.value);
                                                                    const duplicate = !invalid && duplicateIds.has(key.id);
                                                                    const editing = editingId === key.id;
                                                                    return (
                                                                        <span
                                                                            key={key.id}
                                                                            className={cx(
                                                                                "inline-flex h-7 max-w-full items-center gap-1.5 whitespace-nowrap rounded-md bg-secondary px-2.5 text-sm font-medium ring-1 ring-inset",
                                                                                invalid
                                                                                    ? "text-error-primary ring-error"
                                                                                    : duplicate
                                                                                      ? "text-fg-warning-primary ring-fg-warning-primary"
                                                                                      : "text-secondary ring-border-primary",
                                                                            )}
                                                                        >
                                                                            {editing ? (
                                                                                <input
                                                                                    autoFocus
                                                                                    value={editingValue}
                                                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === "Enter") commitEditingKey();
                                                                                        if (e.key === "Escape") {
                                                                                            setEditingId(null);
                                                                                            setEditingValue("");
                                                                                        }
                                                                                    }}
                                                                                    onBlur={commitEditingKey}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    aria-label="Editar chave"
                                                                                    className="w-24 bg-transparent text-primary outline-hidden"
                                                                                />
                                                                            ) : (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        startEditingKey(key.id, key.value);
                                                                                    }}
                                                                                    className="truncate"
                                                                                >
                                                                                    {key.value}
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                aria-label={`Remover ${key.value}`}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    removeImportedKey(key.id);
                                                                                }}
                                                                                className={cx(
                                                                                    "shrink-0 transition duration-100 ease-linear",
                                                                                    invalid
                                                                                        ? "text-fg-error-secondary hover:text-fg-error-primary"
                                                                                        : duplicate
                                                                                          ? "text-fg-warning-secondary hover:text-fg-warning-primary"
                                                                                          : "text-fg-quaternary hover:text-fg-secondary",
                                                                                )}
                                                                            >
                                                                                <XClose className="size-3.5" />
                                                                            </button>
                                                                        </span>
                                                                    );
                                                                })}
                                                                <input
                                                                    ref={keysInputRef}
                                                                    value={newKey}
                                                                    onChange={(e) => setNewKey(e.target.value)}
                                                                    onKeyDown={handleNewKeyDown}
                                                                    onBlur={() => addImportedKeys(newKey)}
                                                                    disabled={importedKeys.length >= MAX_CHAVES}
                                                                    placeholder={importedKeys.length >= MAX_CHAVES ? "" : "Adicionar chave"}
                                                                    aria-label="Adicionar chave de acesso"
                                                                    className="h-7 min-w-32 flex-1 bg-transparent px-1 text-sm text-primary outline-hidden placeholder:text-placeholder"
                                                                />
                                                            </div>
                                                            </div>
                                                            <div className="flex items-start justify-between gap-3">
                                                                {hasInvalidKey || duplicateCount > 0 ? (
                                                                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
                                                                        <img
                                                                            src={hasInvalidKey ? alertIcon : alertAmareloIcon}
                                                                            alt=""
                                                                            aria-hidden="true"
                                                                            width={38}
                                                                            height={38}
                                                                            className="shrink-0 object-contain"
                                                                            style={{ width: 38, height: 38 }}
                                                                        />
                                                                        <span>
                                                                            {hasInvalidKey
                                                                                ? "Chave de acesso inválida encontrada. Ajuste o formato dos destacados para continuar."
                                                                                : `${duplicateCount} ${duplicateCount === 1 ? "chave está duplicada e não será considerada" : "chaves estão duplicadas e não serão consideradas"} ao continuar.`}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span />
                                                                )}
                                                                <span className="shrink-0 text-xs text-tertiary">
                                                                    {importedKeys.length} / {MAX_CHAVES.toLocaleString("pt-BR")}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            </motion.div>
                                        )}
                                        </AnimatePresence>
                                    </OptionCard>
                                </RadioGroup>
                            </div>
                        </main>
                    </>
                ) : (
                    <main className="flex flex-1 flex-col px-4 py-6 md:px-6">
                        <h1 className="text-xl font-semibold text-primary">Chave de acesso</h1>

                        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
                            <div className="z-10 flex max-w-xl flex-col items-center gap-5 text-center">
                                <div className="flex flex-col gap-1">
                                    <p className="text-display-sm font-light text-tertiary italic">
                                        Crie chaves de acesso para
                                    </p>
                                    <h2 className="text-display-md font-bold text-primary">
                                        liberar ingressos ocultos
                                    </h2>
                                </div>

                                <p className="max-w-md text-md text-tertiary">
                                    Com a chave de acesso é possível liberar ingressos apenas para quem o
                                    tem ou acessa o evento por um link especial.
                                </p>

                                <Button
                                    size="lg"
                                    color="primary"
                                    iconLeading={Plus}
                                    className="mt-1"
                                    onClick={() => setIsCreating(true)}
                                >
                                    Criar chave de acesso
                                </Button>
                            </div>

                            <DecorativeCards />
                        </div>
                    </main>
                )}
            </div>

            <ImportarPlanilhaModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handlePlanilhaImportada}
            />
        </BackstageLayout>
    );
}

/* Microsoft Excel (ms_excel) brand logo used on the "Importar de planilha" button. */
const SpreadsheetIcon = () => (
    <img data-icon src={msExcelIcon} alt="" aria-hidden="true" className="size-4 shrink-0 object-contain" />
);

/* Circular spinner shown while the imported keys are being processed. */
const LoadingSpinner = () => (
    <div className="size-9 animate-spin rounded-full border-[3px] border-secondary border-t-brand" aria-label="Carregando" />
);

/* Full-width selectable card. The radio header sits at the top and any expanded
   content is rendered as a sibling so form fields don't toggle the radio. */
const OptionCard = ({ isSelected, children }: { isSelected: boolean; children: React.ReactNode }) => (
    <div
        className={
            "w-full rounded-xl bg-primary px-5 py-4 ring-1 ring-inset transition duration-100 ease-linear " +
            (isSelected ? "ring-2 ring-brand" : "ring-border-primary")
        }
    >
        {children}
    </div>
);

/* Faded stacked "ticket" cards illustration at the bottom of the empty state. */
const DecorativeCards = () => (
    <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
    >
        <div className="relative h-64 w-full max-w-2xl">
            <SkeletonCard className="absolute bottom-0 left-1/2 w-[440px] -translate-x-1/2 translate-y-10 -rotate-6 opacity-50" />
            <SkeletonCard className="absolute bottom-0 left-1/2 w-[440px] -translate-x-1/2 translate-y-10 rotate-6 opacity-50" />
            <SkeletonCard className="absolute bottom-0 left-1/2 w-[480px] -translate-x-1/2 translate-y-12" />
        </div>
    </div>
);

const SkeletonCard = ({ className }: { className?: string }) => (
    <div
        className={
            "flex flex-col gap-3 rounded-2xl bg-secondary p-6 ring-1 ring-border-secondary " +
            (className ?? "")
        }
    >
        <div className="h-3 w-1/3 rounded-full bg-quaternary" />
        <div className="h-3 w-3/4 rounded-full bg-quaternary" />
        <div className="h-3 w-2/3 rounded-full bg-quaternary" />
        <div className="h-3 w-1/2 rounded-full bg-quaternary" />
    </div>
);
