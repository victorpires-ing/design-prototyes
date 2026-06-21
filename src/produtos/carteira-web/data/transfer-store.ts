/* Store em memória para marcar inscrições transferidas na Carteira Web.
   Mantém destinatário, respostas preenchidas na transferência e a data. */
import type { Resposta } from "./sao-silvestre";

export interface Transferencia {
    destinatario: string;
    email: string;
    respostas: Resposta[];
    data: string;
}

const transferidos = new Map<string, Transferencia>();

export function marcarTransferido(comboId: string, t: Transferencia) {
    transferidos.set(comboId, t);
}

export function getTransferencia(comboId: string): Transferencia | undefined {
    return transferidos.get(comboId);
}

export function isTransferido(comboId: string): boolean {
    return transferidos.has(comboId);
}
