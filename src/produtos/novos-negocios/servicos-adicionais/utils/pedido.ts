import { SERVICOS, valorFinal, type Servico, type ServicoId } from "../data/servicos";

/**
 * Pedido de um serviço (serviço + valor escolhido), lido da rota e da query string
 * (?valor=100). Checkout e confirmação usam o mesmo caminho.
 */
export interface ItemPedido {
    servico: Servico;
    valor: number;
}

/** Pacote precisa ser um dos oferecidos; crédito/recarga respeita mínimo e máximo. */
export const valorValido = (servico: Servico, valor: number) =>
    servico.pacotes ? servico.valores.includes(valor) : valor >= servico.minimo && valor <= servico.maximo;

export function lerPedido(id: string | undefined, params: URLSearchParams): ItemPedido | null {
    const servico = SERVICOS[id as ServicoId];
    const valor = Number(params.get("valor"));
    return servico && valor && valorValido(servico, valor) ? { servico, valor } : null;
}

export const totalPedido = ({ servico, valor }: ItemPedido) => valorFinal(servico, valor);

/** Nome do item no resumo: "Crédito Uber" ou "Fotos do rolê · 15 fotos". */
export const nomeItem = ({ servico, valor }: ItemPedido) => (servico.pacotes?.[valor] ? `${servico.item} · ${servico.pacotes[valor]}` : servico.item);
