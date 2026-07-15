import { useState } from "react";
import {
    Dialog as AriaDialog,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { Globe01, PieChart01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

export type CompartilharOption = "todos" | "sem-preco";
export type CompartilharKind = "valor" | "limite";

const SUBTITLE =
    "Com esta funcionalidade você pode preencher automaticamente com esta informação todos os outros campos.";

const COPY: Record<
    CompartilharKind,
    { title: string; opt1Desc: string; opt2Title: string; opt2Desc: string }
> = {
    valor: {
        title: "Como você gostaria de compartilhar este valor?",
        opt1Desc: "Até itens com valor já informado serão atualizados",
        opt2Title: "Para todos os itens sem preço definido",
        opt2Desc: "Itens com valor já informado não serão afetados",
    },
    limite: {
        title: "Como você gostaria de compartilhar este limite?",
        opt1Desc: "Até itens com limite já informado serão atualizados",
        opt2Title: "Para todos os itens sem limite definido",
        opt2Desc: "Itens com limite já informado não serão afetados",
    },
};

interface CompartilharValorModalProps {
    isOpen: boolean;
    kind: CompartilharKind;
    onClose: () => void;
    onConfirm: (option: CompartilharOption) => void;
}

export function CompartilharValorModal({ isOpen, kind, onClose, onConfirm }: CompartilharValorModalProps) {
    const [selected, setSelected] = useState<CompartilharOption>("todos");

    const copy = COPY[kind];
    const options: {
        id: CompartilharOption;
        icon: typeof Globe01;
        title: string;
        description: string;
    }[] = [
        { id: "todos", icon: Globe01, title: "Para todos os itens", description: copy.opt1Desc },
        { id: "sem-preco", icon: PieChart01, title: copy.opt2Title, description: copy.opt2Desc },
    ];

    return (
        <AriaModalOverlay
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4 outline-hidden backdrop-blur-[2px]",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal
                className={({ isEntering, isExiting }) =>
                    cx(
                        "w-full max-w-[480px] rounded-2xl bg-primary shadow-xl ring-1 ring-secondary outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex flex-col outline-hidden">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-primary">{copy.title}</h2>
                            <p className="text-sm text-tertiary">{SUBTITLE}</p>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                    </div>

                    {/* Options */}
                    <div className="flex flex-col gap-3 px-6">
                        {options.map((opt) => {
                            const active = selected === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    onClick={() => setSelected(opt.id)}
                                    className={cx(
                                        "flex items-center gap-3 rounded-xl bg-primary p-4 text-left outline-none transition duration-100 ease-linear",
                                        "focus-visible:ring-2 focus-visible:ring-brand",
                                        active ? "ring-2 ring-brand" : "ring-1 ring-border-secondary hover:bg-primary_hover",
                                    )}
                                >
                                    <FeaturedIcon icon={opt.icon} color="gray" theme="modern" size="md" />
                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="text-sm font-semibold text-secondary">
                                            {opt.title}
                                        </span>
                                        <span className="text-sm text-tertiary">{opt.description}</span>
                                    </div>
                                    <RadioButtonBase isSelected={active} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 px-6 py-6">
                        <Button size="lg" color="secondary" className="flex-1" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            size="lg"
                            color="primary"
                            className="flex-1"
                            onClick={() => onConfirm(selected)}
                        >
                            Confirmar
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
