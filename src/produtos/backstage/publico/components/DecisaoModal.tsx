import { useEffect, useMemo, useRef, useState } from "react";
import {
    Dialog as AriaDialog,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
    Radio as AriaRadio,
    RadioGroup as AriaRadioGroup,
} from "react-aria-components";
import { SearchLg, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";

export const SEGMENTACOES = [
    { id: "pne-deficiente-visual", label: "PNE - Deficiente Visual" },
    { id: "pne-deficiente-auditivo", label: "PNE - Deficiente Auditivo" },
    { id: "pne-deficiente-fisico", label: "PNE - Deficiente Físico" },
    { id: "pne-deficiente-intelectual", label: "PNE - Deficiente Intelectual" },
    { id: "pne-membro-inferior", label: "PNE - Membro Inferior" },
    { id: "pne-membro-superior", label: "PNE - Membro Superior" },
    { id: "pne-transplantado", label: "PNE - Transplantado" },
];

export const JUSTIFICATIVAS = [
    { id: "ilegivel", label: "Documentação ilegível" },
    { id: "invalido", label: "Documento inválido" },
    { id: "inconsistente", label: "Dados inconsistentes" },
    { id: "laudo", label: "Laudo insuficiente" },
    { id: "outro", label: "Outro motivo" },
];

interface DecisaoModalProps {
    isOpen: boolean;
    variant: "aprovar" | "rejeitar";
    onClose: () => void;
    onConfirmar: (opcaoId: string, textoLivre?: string) => void;
}

/** Modal de decisão: aprovar (busca + lista de segmentações) ou rejeitar (lista de justificativas). */
export function DecisaoModal({ isOpen, variant, onClose, onConfirmar }: DecisaoModalProps) {
    const [valor, setValor] = useState<string | null>(null);
    const [busca, setBusca] = useState("");
    const [justificativaLivre, setJustificativaLivre] = useState("");
    const [mostrarErroLimite, setMostrarErroLimite] = useState(false);
    const timeoutErroLimiteRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isOpen) {
            setValor(null);
            setBusca("");
            setJustificativaLivre("");
            setMostrarErroLimite(false);
            if (timeoutErroLimiteRef.current) clearTimeout(timeoutErroLimiteRef.current);
        }
    }, [isOpen, variant]);

    /** Mostra o erro de limite por 2s; nova tentativa de digitar reinicia a contagem. */
    const dispararErroLimite = () => {
        setMostrarErroLimite(true);
        if (timeoutErroLimiteRef.current) clearTimeout(timeoutErroLimiteRef.current);
        timeoutErroLimiteRef.current = setTimeout(() => setMostrarErroLimite(false), 2000);
    };

    const TECLAS_IGNORADAS = new Set([
        "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Tab", "Shift", "Control", "Meta", "Alt", "Escape", "Home", "End", "CapsLock",
    ]);

    const segmentacoesFiltradas = useMemo(() => {
        const query = busca.trim().toLowerCase();
        if (!query) return SEGMENTACOES;
        return SEGMENTACOES.filter((s) => s.label.toLowerCase().includes(query));
    }, [busca]);

    if (variant === "aprovar") {
        return (
            <AriaModalOverlay
                isOpen={isOpen}
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
                isDismissable
                className={({ isEntering, isExiting }) =>
                    cx(
                        "fixed inset-0 z-[80] flex items-center justify-center bg-overlay/70 p-4 outline-hidden backdrop-blur-[2px]",
                        isEntering && "duration-200 ease-out animate-in fade-in",
                        isExiting && "duration-150 ease-in animate-out fade-out",
                    )
                }
            >
                <AriaModal
                    className={({ isEntering, isExiting }) =>
                        cx(
                            "flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary outline-hidden",
                            isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                            isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                        )
                    }
                >
                    <AriaDialog className="flex max-h-[85vh] flex-col outline-hidden">
                        <div className="flex items-start justify-between gap-4 px-6 pt-6">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">
                                    Selecione a segmentação em que a pessoa será incluída
                                </h2>
                                <p className="text-sm text-tertiary">Depois da aprovação, ele receberá um e-mail de confirmação.</p>
                            </div>
                            <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                        </div>

                        <div className="px-6 pt-5">
                            <Input
                                size="md"
                                icon={SearchLg}
                                aria-label="Buscar segmentação"
                                placeholder="Buscar segmentação"
                                value={busca}
                                onChange={setBusca}
                            />
                        </div>

                        <div className="mt-4 max-h-[320px] min-h-0 flex-1 overflow-y-auto border-t border-secondary px-6 py-3">
                            {segmentacoesFiltradas.length === 0 ? (
                                <p className="px-2 py-6 text-center text-sm text-tertiary">Nenhuma segmentação encontrada.</p>
                            ) : (
                                <AriaRadioGroup value={valor} onChange={setValor} className="flex flex-col" aria-label="Segmentação">
                                    {segmentacoesFiltradas.map((seg) => (
                                        <AriaRadio
                                            key={seg.id}
                                            value={seg.id}
                                            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-3 outline-none transition duration-100 ease-linear hover:bg-secondary"
                                        >
                                            {({ isSelected }) => (
                                                <>
                                                    <div
                                                        className={cx(
                                                            "relative flex size-4 shrink-0 items-center justify-center rounded-full ring-inset",
                                                            isSelected ? "bg-brand-solid" : "ring-1 ring-primary",
                                                        )}
                                                    >
                                                        <div
                                                            className={cx(
                                                                "absolute size-1.5 rounded-full bg-fg-white",
                                                                isSelected ? "opacity-100" : "opacity-0",
                                                            )}
                                                        />
                                                    </div>
                                                    <span className="text-md font-medium text-primary">{seg.label}</span>
                                                </>
                                            )}
                                        </AriaRadio>
                                    ))}
                                </AriaRadioGroup>
                            )}
                        </div>

                        <div className="flex gap-3 border-t border-secondary px-6 py-4">
                            <Button size="lg" color="secondary" className="flex-1" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button
                                size="lg"
                                color="primary"
                                className="flex-1"
                                isDisabled={!valor}
                                onClick={() => valor && onConfirmar(valor)}
                            >
                                Aprovar solicitação
                            </Button>
                        </div>
                    </AriaDialog>
                </AriaModal>
            </AriaModalOverlay>
        );
    }

    const precisaJustificativaLivre = valor === "outro";
    const podeConfirmar = !!valor && (!precisaJustificativaLivre || justificativaLivre.trim().length > 0);

    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-[80] flex items-center justify-center bg-overlay/70 p-4 outline-hidden backdrop-blur-[2px]",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex max-h-[85vh] flex-col outline-hidden">
                    <div className="flex items-start justify-between gap-4 px-6 pt-6">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-primary">Rejeitar solicitação</h2>
                            <p className="text-sm text-tertiary">
                                Selecione uma justificativa para informar ao comprador o motivo da rejeição.
                            </p>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                    </div>

                    <div className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-secondary px-6 py-3">
                        <AriaRadioGroup value={valor} onChange={setValor} className="flex flex-col" aria-label="Justificativa">
                            {JUSTIFICATIVAS.map((just) => (
                                <AriaRadio
                                    key={just.id}
                                    value={just.id}
                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-3 outline-none transition duration-100 ease-linear hover:bg-secondary"
                                >
                                    {({ isSelected }) => (
                                        <>
                                            <div
                                                className={cx(
                                                    "relative flex size-4 shrink-0 items-center justify-center rounded-full ring-inset",
                                                    isSelected ? "bg-brand-solid" : "ring-1 ring-primary",
                                                )}
                                            >
                                                <div
                                                    className={cx(
                                                        "absolute size-1.5 rounded-full bg-fg-white",
                                                        isSelected ? "opacity-100" : "opacity-0",
                                                    )}
                                                />
                                            </div>
                                            <span className="text-md font-medium text-primary">{just.label}</span>
                                        </>
                                    )}
                                </AriaRadio>
                            ))}
                        </AriaRadioGroup>

                        {precisaJustificativaLivre && (
                            <div className="pt-3 pl-2">
                                <Tooltip
                                    title="Você não pode inserir mais que 60 caracteres."
                                    isOpen={mostrarErroLimite}
                                    placement="right"
                                >
                                    <Input
                                        size="md"
                                        aria-label="Descreva o motivo"
                                        placeholder="Descreva o motivo da rejeição"
                                        maxLength={60}
                                        value={justificativaLivre}
                                        onChange={(value) => {
                                            setJustificativaLivre(value);
                                            if (value.length >= 60) dispararErroLimite();
                                        }}
                                        onKeyDown={(e) => {
                                            if (justificativaLivre.length >= 60 && !TECLAS_IGNORADAS.has(e.key) && !e.ctrlKey && !e.metaKey) {
                                                dispararErroLimite();
                                            }
                                        }}
                                        isInvalid={mostrarErroLimite}
                                        inputClassName="pr-10"
                                    />
                                </Tooltip>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 border-t border-secondary px-6 py-4">
                        <Button size="lg" color="secondary" className="flex-1" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            size="lg"
                            color="primary"
                            className="flex-1"
                            isDisabled={!podeConfirmar}
                            onClick={() => valor && onConfirmar(valor, precisaJustificativaLivre ? justificativaLivre.trim() : undefined)}
                        >
                            Rejeitar solicitação
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
