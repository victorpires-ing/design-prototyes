import { useEffect, useState } from "react";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay, Radio as AriaRadio, RadioGroup as AriaRadioGroup } from "react-aria-components";
import { UserPlus01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";

export type LimiteSolicitacoes = "ilimitado" | "limitado";

const LIMITE_OPCOES: Array<{ value: LimiteSolicitacoes; titulo: string; descricao: string }> = [
    {
        value: "ilimitado",
        titulo: "Ilimitado",
        descricao: "Você receberá solicitações enquanto o recebimento estiver ativo",
    },
    {
        value: "limitado",
        titulo: "Limitado",
        descricao: "O recebimento será desativado quando atingir este limite",
    },
];

/** Remove tudo que não for dígito. */
const apenasDigitos = (valor: string) => valor.replace(/\D/g, "");

/** Aplica máscara de milhares (pt-BR) a uma string numérica. */
const formatarMilhar = (valor: string) => {
    const digitos = apenasDigitos(valor);
    return digitos ? Number(digitos).toLocaleString("pt-BR") : "";
};

export interface FormularioParticipacaoDados {
    ativo: boolean;
    limite: LimiteSolicitacoes;
    quantidade?: number;
}

interface FormularioParticipacaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSalvar: (dados: FormularioParticipacaoDados) => void;
    ativoInicial: boolean;
    limiteInicial: LimiteSolicitacoes;
    quantidadeInicial?: number;
    /** Total de solicitações já recebidas — usado para validar o novo limite. */
    solicitacoesRecebidas: number;
}

/** Modal "Formulário de participação": ativa/desativa o recebimento e define o limite de solicitações. */
export function FormularioParticipacaoModal({
    isOpen,
    onClose,
    onSalvar,
    ativoInicial,
    limiteInicial,
    quantidadeInicial,
    solicitacoesRecebidas,
}: FormularioParticipacaoModalProps) {
    const [recebimentoAtivo, setRecebimentoAtivo] = useState(ativoInicial);
    const [limite, setLimite] = useState<LimiteSolicitacoes>(limiteInicial);
    const [limiteQuantidade, setLimiteQuantidade] = useState(quantidadeInicial ? formatarMilhar(String(quantidadeInicial)) : "");
    const [erroLimite, setErroLimite] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setRecebimentoAtivo(ativoInicial);
            setLimite(limiteInicial);
            setLimiteQuantidade(quantidadeInicial ? formatarMilhar(String(quantidadeInicial)) : "");
            setErroLimite(null);
        }
    }, [isOpen, ativoInicial, limiteInicial, quantidadeInicial]);

    const handleSalvar = () => {
        if (limite === "limitado") {
            const quantidade = Number(apenasDigitos(limiteQuantidade));

            if (!apenasDigitos(limiteQuantidade)) {
                setErroLimite("Campo obrigatório");
                return;
            }

            if (quantidade < solicitacoesRecebidas) {
                setErroLimite(`O limite deve ser maior ou igual a ${solicitacoesRecebidas.toLocaleString("pt-BR")}, que é o total de solicitações já recebidas.`);
                return;
            }

            onSalvar({ ativo: recebimentoAtivo, limite, quantidade });
        } else {
            onSalvar({ ativo: recebimentoAtivo, limite });
        }

        onClose();
    };

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
                        "w-full max-w-[560px] overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary outline-hidden",
                        isEntering && "duration-200 ease-out animate-in zoom-in-95 fade-in",
                        isExiting && "duration-150 ease-in animate-out zoom-out-95 fade-out",
                    )
                }
            >
                <AriaDialog className="flex flex-col outline-hidden">
                    <div className="flex items-start justify-between gap-4 px-6 pt-6">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-primary">Formulário de participação</h2>
                            <p className="text-sm text-tertiary">Defina até quando gostaria de receber pedidos de participação</p>
                        </div>
                        <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                    </div>

                    <div className="flex flex-col gap-5 px-6 pt-5">
                        <div className="flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ring-secondary">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md ring-1 ring-secondary">
                                <UserPlus01 className="size-5 text-fg-secondary" aria-hidden="true" />
                            </div>
                            <div className="flex min-w-px flex-1 flex-col">
                                <span className="text-md font-medium text-primary">{recebimentoAtivo ? "Recebimento ativo" : "Recebimento inativo"}</span>
                                <span className="text-sm text-tertiary">
                                    {recebimentoAtivo
                                        ? "Você receberá solicitações enquanto o limite permitir."
                                        : "Ative para receber solicitações de acordo com o limite"}
                                </span>
                            </div>
                            <Toggle isSelected={recebimentoAtivo} onChange={setRecebimentoAtivo} aria-label="Recebimento ativo" />
                        </div>

                        <div className="flex flex-col gap-3">
                            <span className="text-sm font-semibold text-primary">Limite de solicitações</span>
                            <AriaRadioGroup
                                value={limite}
                                onChange={(value) => {
                                    setLimite(value as LimiteSolicitacoes);
                                    setErroLimite(null);
                                }}
                                className="flex flex-col gap-3"
                                aria-label="Limite de solicitações"
                            >
                                {LIMITE_OPCOES.map((opcao) => (
                                    <AriaRadio
                                        key={opcao.value}
                                        value={opcao.value}
                                        className={({ isSelected, isFocusVisible }) =>
                                            cx(
                                                "flex cursor-pointer items-start gap-3 rounded-xl p-4 outline-focus-ring ring-inset",
                                                isSelected ? "ring-2 ring-brand" : "ring-1 ring-secondary",
                                                isFocusVisible && "outline-2 outline-offset-2",
                                            )
                                        }
                                    >
                                        {({ isSelected }) => (
                                            <>
                                                <div
                                                    className={cx(
                                                        "relative mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ring-inset",
                                                        isSelected ? "bg-brand-solid" : "ring-1 ring-primary",
                                                    )}
                                                >
                                                    <div className={cx("absolute size-1.5 rounded-full bg-fg-white", isSelected ? "opacity-100" : "opacity-0")} />
                                                </div>
                                                <div className="flex min-w-px flex-1 flex-col gap-0.5">
                                                    <span className="text-md font-medium text-primary">{opcao.titulo}</span>
                                                    <span className="text-sm text-tertiary">{opcao.descricao}</span>
                                                    {opcao.value === "limitado" && isSelected && (
                                                        <div
                                                            className="pt-3"
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                        >
                                                            <Input
                                                                type="text"
                                                                inputMode="numeric"
                                                                size="md"
                                                                placeholder="Defina aqui o limite"
                                                                value={limiteQuantidade}
                                                                onChange={(value) => {
                                                                    setLimiteQuantidade(formatarMilhar(value));
                                                                    setErroLimite(null);
                                                                }}
                                                                isInvalid={!!erroLimite}
                                                                hint={erroLimite ?? undefined}
                                                                aria-label="Limite de solicitações"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </AriaRadio>
                                ))}
                            </AriaRadioGroup>
                        </div>
                    </div>

                    <div className="flex gap-3 px-6 pt-8 pb-6">
                        <Button size="lg" color="secondary" className="flex-1" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button size="lg" color="primary" className="flex-1" onClick={handleSalvar}>
                            Salvar
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
