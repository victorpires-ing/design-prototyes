import { useEffect, useState } from "react";
import { Mail01, MessageChatCircle } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { RadioGroupRadioButton } from "@/components/base/radio-groups/radio-group-radio-button";
import { TextArea } from "@/components/base/textarea/textarea";
import { formatarMoeda, PRAZO_REAL_LABEL, type CanalEnvio, type Conta } from "../../data/pos-compra-store";
import { Regra } from "../pos-compra-ui";

export const isEmailValido = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
export const isTelefoneValido = (valor: string) => valor.replace(/\D/g, "").length >= 10;

interface EtapaEnvioProps {
    /** A quem a cobrança deveria ir por padrão — o comprador numa troca, o novo titular numa transferência.
     *  Nunca pré-selecionado silenciosamente sem o operador ver: o campo já vem preenchido, mas editável. */
    destinatarioSugerido?: Conta;
    resumo: string;
    total: number;
    canal: CanalEnvio;
    destino: string;
    onCanalChange: (canal: CanalEnvio) => void;
    onDestinoChange: (destino: string) => void;
}

/** Última etapa dos dois fluxos: escolher canal, conferir destinatário e ver a mensagem real
 *  antes de enviar — resolve o "conteúdo é caixa-preta" e o "pré-preenche o contato errado". */
export function EtapaEnvio({ destinatarioSugerido, resumo, total, canal, destino, onCanalChange, onDestinoChange }: EtapaEnvioProps) {
    const [tocado, setTocado] = useState(false);

    useEffect(() => {
        if (destino) return;
        const sugestao = canal === "email" ? destinatarioSugerido?.email : destinatarioSugerido?.celular;
        if (sugestao) onDestinoChange(sugestao);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canal, destinatarioSugerido]);

    const valido = canal === "email" ? isEmailValido(destino) : isTelefoneValido(destino);
    const link = "pay.ingresse.com/alteracao/…";

    return (
        <>
            <Regra>Escolha para onde vai o link de pagamento. O comprador paga fora do Backstage, então confira o destinatário antes de enviar.</Regra>

            <RadioGroupRadioButton
                value={canal}
                onChange={(valor) => onCanalChange(valor as CanalEnvio)}
                items={[
                    { value: "email", title: "E-mail", secondaryTitle: "", description: "Envia o link por e-mail.", icon: Mail01 },
                    { value: "whatsapp", title: "WhatsApp", secondaryTitle: "", description: "Envia o link por WhatsApp.", icon: MessageChatCircle },
                ]}
            />

            <Input
                label={canal === "email" ? "E-mail de destino" : "WhatsApp de destino (com DDD)"}
                placeholder={canal === "email" ? "comprador@email.com" : "(11) 98888-7777"}
                value={destino}
                onChange={onDestinoChange}
                onBlur={() => setTocado(true)}
                isInvalid={tocado && !valido}
                hint={tocado && !valido ? (canal === "email" ? "Informe um e-mail válido." : "Informe um número com DDD.") : undefined}
                isRequired
            />

            <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-secondary">Prévia da mensagem</p>
                <TextArea
                    isReadOnly
                    rows={6}
                    value={`Olá! ${resumo}\n\nValor a pagar: ${formatarMoeda(total)}\nPrazo para pagar: ${PRAZO_REAL_LABEL}\nLink de pagamento: https://${link}\n\nSe você não solicitou essa alteração, ignore esta mensagem.`}
                />
            </div>
        </>
    );
}
