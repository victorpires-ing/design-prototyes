/* Store simples (em memória, por sessão) dos ingressos/combos já transferidos
   e dos ingressos atribuídos a um dependente.
   Usado para exibir a badge "Transferido"/"Dependente" na listagem e trocar o
   titular no detalhe do ingresso. */

const transferidos = new Set<string>();

export const marcarTransferido = (id?: string) => {
    if (id) transferidos.add(id);
};

export const isTransferido = (id?: string) => !!id && transferidos.has(id);

/* --- Em transferência (pagamento em processamento) --- */

const emTransferencia = new Set<string>();

export const marcarEmTransferencia = (id?: string) => {
    if (id) emTransferencia.add(id);
};

export const isEmTransferencia = (id?: string) => !!id && emTransferencia.has(id);

/** Conclui a transferência: sai de "em transferência" e passa a "transferido". */
export const concluirTransferencia = (id?: string) => {
    if (!id) return;
    emTransferencia.delete(id);
    transferidos.add(id);
};

/* --- Dependente atribuído --- */

export type DependenteAtribuido = { nome: string; cpf: string; email: string; iniciais: string };

const dependentes = new Map<string, DependenteAtribuido>();

export const atribuirDependente = (id: string | undefined, dep: DependenteAtribuido) => {
    if (id) dependentes.set(id, dep);
};

export const getDependenteAtribuido = (id?: string): DependenteAtribuido | undefined => (id ? dependentes.get(id) : undefined);
