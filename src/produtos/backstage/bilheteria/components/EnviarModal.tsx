import { useEffect, useState } from "react";
import { XClose } from "@untitledui/icons";
import { Dialog as AriaDialog, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { InputBase } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { isValidEmail } from "../data/catalogo";

export type CanalEnvio = "email" | "whatsapp";

interface EnviarModalProps {
    canal: CanalEnvio | null;
    /** O que está sendo enviado — entra no título ("Enviar o link", "Enviar os ingressos"). */
    assunto: string;
    /** Valor já conhecido; quando existe, o campo vem preenchido. */
    valorInicial?: string;
    onClose: () => void;
    onConfirm: (canal: CanalEnvio, destino: string) => void;
}

/** Só dígitos, formato brasileiro com DDD. */
const isValidPhone = (value: string) => value.replace(/\D/g, "").length >= 10;

/**
 * Pede o destino quando ele não está no cadastro — é o que permite enviar por
 * WhatsApp ou e-mail mesmo para comprador sem conta.
 */
export function EnviarModal({ canal, assunto, valorInicial, onClose, onConfirm }: EnviarModalProps) {
    const [valor, setValor] = useState(valorInicial ?? "");
    const [tocado, setTocado] = useState(false);

    // Reabrir o modal em outro canal precisa recomeçar do valor conhecido daquele canal.
    useEffect(() => {
        if (canal) {
            setValor(valorInicial ?? "");
            setTocado(false);
        }
    }, [canal, valorInicial]);

    const email = canal === "email";
    const valido = email ? isValidEmail(valor) : isValidPhone(valor);

    return (
        <AriaModalOverlay
            isOpen={Boolean(canal)}
            onOpenChange={(open) => !open && onClose()}
            isDismissable
            className={({ isEntering, isExiting }) =>
                cx(
                    "fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 p-4 outline-hidden backdrop-blur-[2px]",
                    isEntering && "duration-200 ease-out animate-in fade-in",
                    isExiting && "duration-150 ease-in animate-out fade-out",
                )
            }
        >
            <AriaModal className="w-full max-w-md outline-hidden">
                <AriaDialog className="flex flex-col gap-5 rounded-xl bg-primary p-6 shadow-xl outline-hidden ring-1 ring-border-secondary">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-lg font-semibold text-primary">
                                {email ? `Enviar ${assunto} por e-mail` : `Enviar ${assunto} por WhatsApp`}
                            </h2>
                            <p className="text-sm text-tertiary">
                                {email ? "Confirme o e-mail de destino." : "Informe o WhatsApp com DDD."}
                            </p>
                        </div>
                        <ButtonUtility size="xs" color="tertiary" icon={XClose} tooltip="Fechar" onClick={onClose} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="envio-destino" className="text-sm font-medium text-secondary">
                            {email ? "E-mail" : "WhatsApp"}
                        </label>
                        <InputBase
                            id="envio-destino"
                            size="md"
                            value={valor}
                            isInvalid={tocado && !valido}
                            onChange={(event) => setValor(event.target.value)}
                            onBlur={() => setTocado(true)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" && valido) onConfirm(canal!, valor.trim());
                            }}
                            placeholder={email ? "comprador@email.com" : "(11) 98888-7777"}
                        />
                        {tocado && !valido && (
                            <p className="text-sm text-error-primary">
                                {email ? "Informe um e-mail válido." : "Informe um número com DDD."}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
                        <Button size="md" color="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button size="md" color="primary" isDisabled={!valido} onClick={() => onConfirm(canal!, valor.trim())}>
                            Enviar
                        </Button>
                    </div>
                </AriaDialog>
            </AriaModal>
        </AriaModalOverlay>
    );
}
