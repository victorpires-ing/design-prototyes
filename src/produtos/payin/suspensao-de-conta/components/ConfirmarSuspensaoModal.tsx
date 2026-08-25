import { IconAlert } from "./retool/icons";
import { RButton, RModal } from "./retool/ui";
import type { Conta, MotivoSuspensao } from "../data/antifraude";

interface ConfirmarSuspensaoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmar: () => void;
    conta: Conta;
    motivo: MotivoSuspensao;
    totalCompras: number;
}

/** Confirmação de suspensão (Figma "Confirmação (modal)"). */
export function ConfirmarSuspensaoModal({ isOpen, onClose, onConfirmar, conta, motivo, totalCompras }: ConfirmarSuspensaoModalProps) {
    const resumo = [
        { label: "Motivo", valor: motivo.label },
        { label: "Compras impactadas", valor: `${totalCompras} ${totalCompras === 1 ? "compra" : "compras"}` },
        { label: "Companhia", valor: conta.companhia },
    ];

    return (
        <RModal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirmar suspensão de usuário"
            description={`Você está prestes a suspender ${conta.nome} (${conta.email}).`}
            footer={
                <>
                    <RButton variant="secondary" onClick={onClose}>
                        Cancelar
                    </RButton>
                    <RButton variant="danger" onClick={onConfirmar}>
                        Suspender usuário
                    </RButton>
                </>
            }
        >
            <dl className="mt-4 flex flex-col gap-2 rounded-[6px] bg-[var(--rt-surface-subtle)] p-3">
                {resumo.map((linha) => (
                    <div key={linha.label} className="flex items-baseline justify-between gap-4">
                        <dt className="text-[13px] text-[var(--rt-text-secondary)]">{linha.label}</dt>
                        <dd className="text-[13px] font-medium">{linha.valor}</dd>
                    </div>
                ))}
            </dl>

            <div className="rt-callout rt-callout--warning mt-3">
                <IconAlert className="mt-px shrink-0" />
                <p>
                    As compras entram em suspensão imediatamente. A conta continua suspensa até a validação — mesmo depois que o prazo das
                    compras expira.
                </p>
            </div>
        </RModal>
    );
}
