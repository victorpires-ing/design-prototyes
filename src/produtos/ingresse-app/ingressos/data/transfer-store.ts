/* Store simples (em memória, por sessão) dos ingressos/combos já transferidos.
   Usado para exibir a badge "Transferido" na listagem após a transferência. */

const transferidos = new Set<string>();

export const marcarTransferido = (id?: string) => {
    if (id) transferidos.add(id);
};

export const isTransferido = (id?: string) => !!id && transferidos.has(id);
