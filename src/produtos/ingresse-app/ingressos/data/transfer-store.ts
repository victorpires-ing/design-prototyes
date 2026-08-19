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

/* --- Em troca (upgrade com pagamento da diferença em processamento) --- */

const emTroca = new Set<string>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Inscreve-se para re-renderizar quando o estado dos ingressos muda (ex.: troca concluída). */
export const subscribeTicketStore = (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
};

/** Tempo (simulado) de processamento do pagamento da diferença. */
const TROCA_MS = 15000;

/** Marca o ingresso como "em troca" e agenda a conclusão (global): ao terminar, volta ao normal. */
export const marcarEmTroca = (id?: string) => {
    if (!id || emTroca.has(id)) return;
    emTroca.add(id);
    notify();
    setTimeout(() => {
        emTroca.delete(id);
        notify();
    }, TROCA_MS);
};

export const isEmTroca = (id?: string) => !!id && emTroca.has(id);

/* --- Dependente atribuído --- */

export type DependenteAtribuido = { nome: string; cpf: string; email: string; iniciais: string };

const dependentes = new Map<string, DependenteAtribuido>();

export const atribuirDependente = (id: string | undefined, dep: DependenteAtribuido) => {
    if (id) dependentes.set(id, dep);
};

export const getDependenteAtribuido = (id?: string): DependenteAtribuido | undefined => (id ? dependentes.get(id) : undefined);
