import { useEffect, useState } from "react";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { formatarMoeda, PRAZO_REAL_LABEL, type CanalEnvio, type Conta } from "../../data/pos-compra-store";
import { Regra } from "../pos-compra-ui";

export const isEmailValido = (valor: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());

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

    const valido = isEmailValido(destino);
    const link = "pay.ingresse.com/alteracao/…";

    return (
        <>
            <Regra>Escolha para onde vai o link de pagamento. O comprador paga fora do Backstage, então confira o destinatário antes de enviar.</Regra>

            <Input
                label="E-mail de destino"
                placeholder="comprador@email.com"
                value={destino}
                onChange={onDestinoChange}
                onBlur={() => setTocado(true)}
                isInvalid={tocado && !valido}
                hint={tocado && !valido ? "Informe um e-mail válido." : undefined}
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
