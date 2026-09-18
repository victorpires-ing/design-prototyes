import { Button } from "@/components/base/buttons/button";
import { BadgeTipoOperacao } from "./pos-compra-ui";
import { TIPO_OPERACAO_LABEL, useRascunhos, type Pedido, type Rascunho } from "../data/pos-compra-store";

/** Dá lugar visível a operações que o operador começou a montar mas ainda não enviou a
 *  cobrança — inclusive o caso mais comum do domínio (novo titular sem conta, que pode levar
 *  dias para se cadastrar). Nunca mostra prazo: rascunho não reserva estoque nem trava linha,
 *  isso só acontece quando a cobrança é de fato enviada. */
export function FaixaRascunhos({ pedido, onContinuar }: { pedido: Pedido; onContinuar: (rascunho: Rascunho) => void }) {
    const rascunhos = useRascunhos(pedido.id);
    if (rascunhos.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 rounded-2xl bg-secondary p-4 ring-1 ring-border-secondary">
            <p className="text-sm font-semibold text-primary">{rascunhos.length === 1 ? "1 rascunho em andamento" : `${rascunhos.length} rascunhos em andamento`}</p>
            <ul className="flex flex-col gap-2">
                {rascunhos.map((rascunho) => (
                    <li key={rascunho.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary p-3 ring-1 ring-border-secondary">
                        <div className="flex min-w-0 flex-col gap-1">
                            <BadgeTipoOperacao tipo={rascunho.tipo} texto={TIPO_OPERACAO_LABEL[rascunho.tipo]} />
                            <p className="text-sm text-tertiary">
                                {rascunho.linhasSelecionadas.length} {rascunho.linhasSelecionadas.length === 1 ? "item" : "itens"}
                                {rascunho.aguardandoCadastroDe && ` · aguardando cadastro de "${rascunho.aguardandoCadastroDe}"`}
                                {" · "}
                                {rascunho.operador} · {rascunho.atualizadoEmLabel}
                            </p>
                        </div>
                        <Button size="sm" color="secondary" onClick={() => onContinuar(rascunho)}>
                            Continuar
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
