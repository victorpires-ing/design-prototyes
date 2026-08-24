import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Reorder, useDragControls } from "motion/react";
import { Focusable as AriaFocusable } from "react-aria-components";
import { Lock01, SearchLg, XClose } from "@untitledui/icons";
import { Tabs } from "@/components/application/tabs/tabs";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import { ExportingIcon } from "./ExportingIcon";
import { EXPORT_FIELD_GROUPS, type ExportField } from "../data/export-fields";

type PainelAtivo = "opcoes" | "selecionadas";

function GripVertical({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <circle cx="9" cy="6" r="1.6" />
            <circle cx="9" cy="12" r="1.6" />
            <circle cx="9" cy="18" r="1.6" />
            <circle cx="15" cy="6" r="1.6" />
            <circle cx="15" cy="12" r="1.6" />
            <circle cx="15" cy="18" r="1.6" />
        </svg>
    );
}

/** Uma linha da lista "Colunas selecionadas" — arrastável por um handle dedicado
 * (dragListener={false} + useDragControls), igual ao padrão usado em Ingressos. */
const ColunaSelecionadaItem = ({ id, label, onRemover }: { id: string; label: string; onRemover: () => void }) => {
    const controls = useDragControls();
    return (
        <Reorder.Item
            value={id}
            dragListener={false}
            dragControls={controls}
            whileDrag={{ backgroundColor: "var(--color-bg-primary)", boxShadow: "0 8px 24px rgba(16,24,40,0.12)", zIndex: 20 }}
            className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2.5"
        >
            <button
                type="button"
                onPointerDown={(e) => controls.start(e)}
                aria-label={`Arrastar para reordenar ${label}`}
                className="flex shrink-0 cursor-grab touch-none items-center justify-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary active:cursor-grabbing"
            >
                <GripVertical className="size-4" />
            </button>
            <span className="flex-1 truncate text-sm font-medium text-primary">{label}</span>
            <button
                type="button"
                aria-label={`Remover ${label}`}
                onClick={onRemover}
                className="flex shrink-0 items-center justify-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
            >
                <XClose className="size-4" aria-hidden="true" />
            </button>
        </Reorder.Item>
    );
};

/** Campo fixo — sempre incluído, sempre na primeira posição, não aparece
 * como opção (só existem os campos que o comprador pode escolher). */
const ANCHOR_FIELD_ID = "pedido_id";

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
    EXPORT_FIELD_GROUPS.flatMap((g) => g.fields.map((f) => [f.id, f.label] as const)),
);

const ALL_FIELD_IDS = EXPORT_FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.id)).filter((id) => id !== ANCHOR_FIELD_ID);

export const DEFAULT_SELECTED = [
    ANCHOR_FIELD_ID,
    "pedido_status",
    "atleta_nome",
    "atleta_tipoDocumento",
    "atleta_documento",
    "atleta_telefone",
    "atleta_email",
    "atleta_dataNascimento",
    "inscricao_categoria",
    "inscricao_modalidade",
    "inscricao_lote",
    "pedido_valorUnitario",
    "pedido_valorDesconto",
    "pedido_valorTotal",
    "pedido_cupom",
    "pedido_canal",
    "pedido_formaPagamento",
    "pedido_dataCriacao",
    "pedido_ultimaAtualizacao",
];

interface ManageColumnsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selected: string[];
    onSelectedChange: (fields: string[]) => void;
    onExport: (fields: string[]) => void;
}

export const ManageColumnsModal = ({ isOpen, onClose, selected, onSelectedChange, onExport }: ManageColumnsModalProps) => {
    // Seleção em rascunho: os checkboxes só editam este estado local. O rascunho é
    // re-semeado a partir de `selected` a cada abertura e só é aplicado à tabela (via
    // onSelectedChange) quando o usuário clica em Salvar/Exportar — Cancelar ou fechar
    // o modal descarta as mudanças.
    const [draft, setDraft] = useState<string[]>(selected);
    const [leftSearch, setLeftSearch] = useState("");
    const [rightSearch, setRightSearch] = useState("");
    const [painelAtivo, setPainelAtivo] = useState<PainelAtivo>("opcoes");
    const [isExporting, setIsExporting] = useState(false);

    // Reseeda o rascunho só na transição fechado → aberto — não a cada render com o modal
    // já aberto (o que aconteceria sempre que `selected` muda, inclusive quando este próprio
    // componente aplica a seleção via onSelectedChange).
    const wasOpenRef = useRef(false);
    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            setDraft(selected);
            setIsExporting(false);
        }
        wasOpenRef.current = isOpen;
    }, [isOpen, selected]);

    // Loading fica no próprio CTA (spinner + "Exportando...") por ~5s antes de disparar o
    // toast de sucesso e fechar — sem tela ou animação separada, só o botão em carregamento.
    const exportedFieldsRef = useRef<string[]>([]);
    useEffect(() => {
        if (!isExporting) return;
        const timer = setTimeout(() => {
            onExport(exportedFieldsRef.current);
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [isExporting, onClose, onExport]);

    const toggleField = (id: string, checked: boolean) => setDraft((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

    const allSelected = ALL_FIELD_IDS.every((id) => draft.includes(id));
    const toggleSelectAll = () => setDraft(allSelected ? [ANCHOR_FIELD_ID] : [ANCHOR_FIELD_ID, ...ALL_FIELD_IDS]);

    const optionGroups = useMemo(() => {
        const term = leftSearch.trim().toLowerCase();
        return EXPORT_FIELD_GROUPS.map((group) => ({
            id: group.id,
            title: group.title,
            fields: group.fields
                .filter((f: ExportField) => f.id !== ANCHOR_FIELD_ID && (!term || f.label.toLowerCase().includes(term)))
                .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
        })).filter((group) => group.fields.length > 0);
    }, [leftSearch]);

    const rest = draft.filter((id) => id !== ANCHOR_FIELD_ID);
    const visibleRest = useMemo(() => {
        const term = rightSearch.trim().toLowerCase();
        if (!term) return rest;
        return rest.filter((id) => (FIELD_LABELS[id] ?? id).toLowerCase().includes(term));
    }, [rest, rightSearch]);

    // Até 50 colunas cabem na tabela — acima disso "Salvar" fica desabilitado e a única
    // forma de levar a seleção adiante é exportando o relatório completo em .csv.
    const overLimit = draft.length > 50;

    const handlePrimaryAction = () => {
        if (isExporting || overLimit) return;
        onSelectedChange(draft);
        onClose();
    };

    const handleExportAction = () => {
        if (isExporting) return;
        exportedFieldsRef.current = draft;
        setIsExporting(true);
    };

    // Escape ainda fecha (comportamento esperado de diálogo), mesmo sem o focus-trap do react-aria.
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Overlay construído à mão (não react-aria Modal/ModalOverlay): o hook `useModalOverlay` do
    // react-aria torna o resto da página `inert` incondicionalmente enquanto o modal está aberto
    // (sem prop para desativar), o que bloqueia qualquer plugin/extensão injetado na página por
    // baixo. Aqui o backdrop é pointer-events-none (cliques atravessam) e nada além deste
    // componente é tornado inerte, então o restante da página continua totalmente interativo.
    return createPortal(
        <div
            className={cx(
                // Mobile: bottom sheet — encostado na base, sem padding, só o topo arredondado.
                // Desktop (md:): modal flutuante centralizado, como antes.
                "pointer-events-none fixed inset-0 z-[70] flex items-end justify-center bg-overlay/70 outline-hidden backdrop-blur-[2px] md:items-center md:p-4",
                "duration-200 ease-out animate-in fade-in",
            )}
        >
            <div
                role="dialog"
                aria-modal="false"
                aria-label="Editar colunas"
                className={cx(
                    "pointer-events-auto",
                    // Altura fixa (não só max-height): evita que o card mude de tamanho — e portanto
                    // recentralize verticalmente, deslocando o título — ao trocar de aba no mobile,
                    // já que cada painel pode ter uma quantidade de conteúdo diferente.
                    "flex h-[min(85vh,720px)] w-full flex-col rounded-t-2xl bg-primary shadow-xl outline-hidden md:max-w-[692px] md:rounded-2xl",
                    "duration-200 ease-out animate-in slide-in-from-bottom fade-in md:zoom-in-95 md:slide-in-from-bottom-0",
                )}
            >
                <div className="flex min-h-0 flex-1 flex-col outline-hidden">
                    <div className="flex shrink-0 items-start justify-between gap-4 px-4 py-5 md:border-b md:border-secondary md:px-6">
                        <div>
                            <h2 className="text-lg font-semibold text-primary">Editar colunas</h2>
                            <p className="mt-1 text-sm text-tertiary">
                                Selecione até 50 colunas que para exibir na lista de transações. Para consultar mais colunas simultaneamente, você
                                deverá exportar o relatório.
                            </p>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} isDisabled={isExporting} />
                    </div>

                    <Tabs
                        selectedKey={painelAtivo}
                        onSelectionChange={(key) => setPainelAtivo(key as PainelAtivo)}
                        className="shrink-0 px-4 md:hidden"
                    >
                        <Tabs.List type="button-border" size="sm" fullWidth className="!bg-[#262626]">
                            <Tabs.Item id="opcoes" className={({ isSelected }) => cx("*:min-w-0", isSelected && "!bg-primary")}>
                                <span className="truncate">Opções de colunas</span>
                            </Tabs.Item>
                            <Tabs.Item id="selecionadas" className={({ isSelected }) => cx("*:min-w-0", isSelected && "!bg-primary")}>
                                {(state) => (
                                    <>
                                        <span className="min-w-0 truncate">Colunas escolhidas</span>
                                        <Badge
                                            size="sm"
                                            type="pill-color"
                                            color={state.isSelected || state.isHovered ? "brand" : "gray"}
                                            className="-my-px shrink-0"
                                        >
                                            {draft.length}
                                        </Badge>
                                    </>
                                )}
                            </Tabs.Item>
                        </Tabs.List>
                    </Tabs>

                    <div className="flex min-h-0 flex-1 flex-col divide-y divide-secondary md:flex-row md:divide-x md:divide-y-0">
                        {/* Opções de colunas */}
                        <div className={cx("flex min-h-0 min-w-0 flex-1 flex-col gap-4 px-4 pt-2 md:px-6 md:pt-6", painelAtivo !== "opcoes" && "hidden md:flex")}>
                            <p className="hidden shrink-0 text-sm font-semibold text-primary md:block">Opções de colunas</p>
                            <Input size="sm" icon={SearchLg} aria-label="Buscar coluna" placeholder="Buscar coluna" value={leftSearch} onChange={setLeftSearch} className="shrink-0" />
                            <div className="-mx-4 shrink-0 border-b border-secondary md:hidden" />
                            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-6">
                                <Checkbox
                                    label={allSelected ? "Limpar seleção" : "Selecionar todas"}
                                    isSelected={allSelected}
                                    onChange={toggleSelectAll}
                                />
                                {optionGroups.map((group) => {
                                    const groupIds = group.fields.map((f) => f.id);
                                    const groupAllSelected = groupIds.every((id) => draft.includes(id));
                                    const toggleGroupSelectAll = () =>
                                        setDraft((prev) =>
                                            groupAllSelected ? prev.filter((id) => !groupIds.includes(id)) : [...new Set([...prev, ...groupIds])],
                                        );
                                    return (
                                        <div key={group.id} className="group flex flex-col gap-2.5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-semibold tracking-wide text-quaternary uppercase">{group.title}</p>
                                                <button
                                                    type="button"
                                                    onClick={toggleGroupSelectAll}
                                                    className="text-xs font-semibold text-tertiary underline opacity-0 transition duration-100 ease-linear group-hover:opacity-100 hover:text-tertiary_hover"
                                                >
                                                    {groupAllSelected ? "Limpar" : "Selecionar todos"}
                                                </button>
                                            </div>
                                            <div className="flex flex-col gap-2.5">
                                                {group.fields.map((field) => (
                                                    <Checkbox
                                                        key={field.id}
                                                        label={field.label}
                                                        isSelected={draft.includes(field.id)}
                                                        onChange={(checked) => toggleField(field.id, checked)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {optionGroups.length === 0 && <p className="py-6 text-center text-sm text-tertiary">Nenhuma coluna encontrada.</p>}
                            </div>
                        </div>

                        {/* Colunas selecionadas */}
                        <div className={cx("flex min-h-0 min-w-0 flex-1 flex-col gap-4 px-4 pt-2 md:gap-6 md:px-6 md:pt-6", painelAtivo !== "selecionadas" && "hidden md:flex")}>
                            <div className="flex shrink-0 flex-col gap-4">
                                <div className="hidden items-center gap-2 md:flex">
                                    <p className="text-sm font-semibold text-primary">Colunas selecionadas</p>
                                    <Badge size="sm" color="brand" type="pill-color">
                                        {draft.length}
                                    </Badge>
                                </div>
                                <Input size="sm" icon={SearchLg} aria-label="Buscar coluna selecionada" placeholder="Buscar coluna" value={rightSearch} onChange={setRightSearch} />
                            </div>
                            <div className="-mx-4 shrink-0 border-b border-secondary md:hidden" />
                            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-2 pb-6">
                                <Tooltip title="Esta opção não pode ser removida.">
                                    <TooltipTrigger className="flex w-full items-center gap-2 rounded-lg border border-secondary bg-secondary px-3 py-2.5 text-left">
                                        <span className="flex-1 truncate text-sm font-medium text-primary">{FIELD_LABELS[ANCHOR_FIELD_ID]}</span>
                                        <Lock01 className="size-4 shrink-0 text-fg-quaternary" aria-hidden="true" />
                                    </TooltipTrigger>
                                </Tooltip>
                                {rightSearch.trim() ? (
                                    // Durante a busca a lista fica filtrada — reordenar um subconjunto não tem
                                    // uma posição final óbvia no array completo, então o arrastar fica desativado.
                                    visibleRest.map((id) => (
                                        <div key={id} className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2.5">
                                            <span className="flex-1 truncate text-sm font-medium text-primary">{FIELD_LABELS[id] ?? id}</span>
                                            <button
                                                type="button"
                                                aria-label={`Remover ${FIELD_LABELS[id] ?? id}`}
                                                onClick={() => toggleField(id, false)}
                                                className="flex shrink-0 items-center justify-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                                            >
                                                <XClose className="size-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <Reorder.Group
                                        as="div"
                                        axis="y"
                                        values={rest}
                                        onReorder={(newRest) => setDraft([ANCHOR_FIELD_ID, ...newRest])}
                                        className="flex flex-col gap-2"
                                    >
                                        {rest.map((id) => (
                                            <ColunaSelecionadaItem key={id} id={id} label={FIELD_LABELS[id] ?? id} onRemover={() => toggleField(id, false)} />
                                        ))}
                                    </Reorder.Group>
                                )}
                                {draft.length === 1 && <p className="py-6 text-center text-sm text-tertiary">Nenhuma coluna adicional selecionada.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-secondary px-6 py-4">
                        <Button
                            size="sm"
                            color="link-gray"
                            onClick={() => setDraft(DEFAULT_SELECTED)}
                            isDisabled={isExporting}
                            className="hidden md:inline-flex"
                        >
                            Restaurar padrão
                        </Button>
                        <div className="flex flex-1 items-center gap-3 md:flex-initial">
                            <Button
                                size="md"
                                color="secondary"
                                onClick={handleExportAction}
                                iconLeading={isExporting ? ExportingIcon : undefined}
                                className={cx(isExporting && "pointer-events-none opacity-50")}
                            >
                                {isExporting ? "Exportando..." : "Exportar .csv"}
                            </Button>
                            <Tooltip title="Para mais de 50 colunas, exporte como .CSV" isDisabled={!overLimit}>
                                <AriaFocusable>
                                    <span className="flex flex-1 md:flex-initial">
                                        <Button
                                            size="md"
                                            color="primary"
                                            onClick={handlePrimaryAction}
                                            isDisabled={overLimit || isExporting}
                                            className="w-full"
                                        >
                                            Salvar
                                        </Button>
                                    </span>
                                </AriaFocusable>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};
