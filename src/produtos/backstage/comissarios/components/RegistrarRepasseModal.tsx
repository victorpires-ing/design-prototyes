import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { TextArea } from "@/components/base/textarea/textarea";
import { CampoPreco } from "../../itens/components/comuns";
import { registrarRepasse } from "../data/comissarios";
import { moeda } from "./comuns";

/* ------------------------------------------------------------------ */
/*  Registrar repasse (COM-40 a COM-44)                                */
/*                                                                     */
/*  A organização paga a comissão por fora (Pix, transferência) e      */
/*  registra aqui para o saldo do comissário bater. O repasse é de um  */
/*  evento: o saldo é por comissário e por evento, para o mesmo        */
/*  dinheiro não ser pedido duas vezes.                                */
/* ------------------------------------------------------------------ */

export interface SaldoPorEvento {
    eventoId: string;
    nome: string;
    aRepassar: number;
}

export function RegistrarRepasseModal({
    aberto,
    onFechar,
    comissarioId,
    comissarioNome,
    saldos,
    eventoInicial,
}: {
    aberto: boolean;
    onFechar: () => void;
    comissarioId: string;
    comissarioNome: string;
    saldos: SaldoPorEvento[];
    eventoInicial?: string;
}) {
    const comSaldo = useMemo(() => saldos.filter((s) => s.aRepassar > 0), [saldos]);
    const [eventoId, setEventoId] = useState<string | null>(null);
    const [valor, setValor] = useState(0);
    const [obs, setObs] = useState("");
    const [tentou, setTentou] = useState(false);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (!aberto) return;
        const inicial = comSaldo.find((s) => s.eventoId === eventoInicial) ?? comSaldo[0];
        setEventoId(inicial?.eventoId ?? null);
        setValor(inicial?.aRepassar ?? 0);
        setObs("");
        setTentou(false);
    }, [aberto]);

    const saldo = comSaldo.find((s) => s.eventoId === eventoId);
    const erroValor = !(valor > 0) ? "Informe um valor maior que zero." : saldo && valor > saldo.aRepassar + 0.001 ? `O saldo deste evento é ${moeda(saldo.aRepassar)}.` : undefined;

    const confirmar = () => {
        if (!saldo || erroValor) {
            setTentou(true);
            return;
        }
        setSalvando(true);
        window.setTimeout(() => {
            registrarRepasse({ comissarioId, eventoId: saldo.eventoId, valor, data: new Date().toISOString(), observacao: obs.trim() || undefined });
            setSalvando(false);
            toast.success(`Repasse de ${moeda(valor)} registrado para ${comissarioNome}.`);
            onFechar();
        }, 500);
    };

    return (
        <ModalOverlay isOpen={aberto} onOpenChange={(v) => !v && onFechar()} isDismissable>
            <Modal className="sm:max-w-[480px]">
                <Dialog>
                    <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-primary">Registrar repasse</h2>
                            <p className="text-sm text-tertiary">
                                Registre o que já foi pago a {comissarioNome}. O pagamento é feito por fora da Ingresse, por Pix ou transferência.
                            </p>
                        </div>
                        {comSaldo.length === 0 ? (
                            <p className="text-sm text-tertiary">Não há comissão a repassar agora.</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <Select
                                    label="Evento"
                                    selectedKey={eventoId}
                                    onSelectionChange={(k) => {
                                        const s = comSaldo.find((x) => x.eventoId === String(k));
                                        setEventoId(String(k));
                                        if (s) setValor(s.aRepassar);
                                    }}
                                    items={comSaldo.map((s) => ({ id: s.eventoId, label: s.nome, supportingText: `${moeda(s.aRepassar)} a repassar` }))}
                                >
                                    {(item) => (
                                        <Select.Item id={item.id} supportingText={item.supportingText}>
                                            {item.label}
                                        </Select.Item>
                                    )}
                                </Select>
                                <CampoPreco
                                    label="Valor pago"
                                    isRequired
                                    valor={valor}
                                    onChange={setValor}
                                    isInvalid={tentou && !!erroValor}
                                    hint={tentou && erroValor ? erroValor : saldo ? `Saldo do evento: ${moeda(saldo.aRepassar)}` : undefined}
                                />
                                <TextArea label="Observação" placeholder="Ex.: Pix enviado em 10/11" value={obs} onChange={setObs} rows={2} />
                            </div>
                        )}
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <Button color="secondary" size="md" onClick={onFechar} isDisabled={salvando}>
                                Cancelar
                            </Button>
                            {comSaldo.length > 0 && (
                                <Button color="primary" size="md" onClick={confirmar} isLoading={salvando} showTextWhileLoading>
                                    Registrar repasse
                                </Button>
                            )}
                        </div>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
