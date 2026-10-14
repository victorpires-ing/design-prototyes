import type { ReactNode } from "react";
import { toast } from "sonner";
import { Package, Ticket01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";
import { ListaLimitada, mascararCPF } from "../pos-compra-ui";
import {
    getConta,
    getItem,
    motivoIndisponivel,
    removerRascunho,
    restaurarRascunho,
    sessaoDoItem,
    sessaoLabel,
    type CatalogoItem,
    type Pedido,
    type PedidoItem,
    type Rascunho,
    type Verbo,
} from "../../data/pos-compra-store";

/**
 * Miniatura feita só de `span`. A `Miniatura` de pos-compra-ui usa FeaturedIcon,
 * que renderiza um `div`, e aqui ela vive dentro do label do Checkbox — que o
 * React Aria monta como `p`. Div dentro de p é HTML inválido e o React reclama.
 */
const MiniaturaEmLinha = ({ item }: { item?: CatalogoItem }) => {
    if (item?.foto) return <img src={item.foto} alt="" className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-border-primary" />;
    const Icone = item?.tipo === "ingresso" ? Ticket01 : Package;
    return (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-secondary ring-1 ring-border-secondary">
            <Icone className="size-5" aria-hidden="true" />
        </span>
    );
};

export const detalheDoItem = (item?: CatalogoItem) => [item?.lote, sessaoDoItem(item) ? sessaoLabel(item) : null].filter(Boolean).join(" | ");

/** Quem é a pessoa desta unidade, do jeito que o operador confere ao telefone. Toda linha diz
 *  o nome e o CPF mascarado: três "Corrida 5 km" iguais deixam de ser indistinguíveis. */
export const identidadeDaLinha = (pedido: Pedido, linha: PedidoItem) => {
    const conta = getConta(linha.titularId ?? pedido.compradorId);
    const cpf = conta?.cpf ? `CPF ${mascararCPF(conta.cpf)}` : conta?.email;
    const origem = linha.titularId
        ? ["Recebeu por transferência", linha.transferidoEmLabel && `em ${linha.transferidoEmLabel}`, linha.transferidoPor && `por ${linha.transferidoPor}`].filter(Boolean).join(" ")
        : "Fez a compra";
    return { nome: conta?.nome ?? "Participante", apoio: [origem, cpf].filter(Boolean).join(" · ") };
};

/**
 * Etapa de seleção dentro do overlay. A elegibilidade é do verbo: o que entra numa troca não é o
 * mesmo que entra numa transferência, então só dá para dizer o que pode depois de saber o que se
 * vai fazer. O indisponível aparece com o motivo escrito, nunca como checkbox desabilitado mudo.
 */
export function SeletorUnidades({
    pedido,
    verbo,
    selecao,
    onChange,
}: {
    pedido: Pedido;
    verbo: Verbo;
    selecao: Record<string, boolean>;
    onChange: (proxima: Record<string, boolean>) => void;
}) {
    const disponiveis = pedido.itens.filter((l) => !motivoIndisponivel(pedido, l, verbo));
    const indisponiveis = pedido.itens.filter((l) => motivoIndisponivel(pedido, l, verbo));
    const marcar = (ids: string[], marcado: boolean) => onChange({ ...selecao, ...Object.fromEntries(ids.map((id) => [id, marcado])) });

    return (
        <div className="flex flex-col gap-4">
            {disponiveis.length === 0 && <p className="rounded-xl bg-secondary px-4 py-6 text-center text-sm text-tertiary">Nenhuma unidade deste pedido pode entrar nesta alteração agora.</p>}

            {/*
              Lista plana: uma unidade por linha, identificada pelo ITEM — nome, lote e
              sessão, um em cada linha. Antes a linha era o portador, com o item virando
              cabeçalho de grupo; quem escolhe o que transferir procura pelo ingresso,
              não pela pessoa, e o nome só repetia o comprador em todas as linhas.

              O ordinal só aparece quando o mesmo item tem mais de uma unidade: sem o
              nome do portador, duas linhas do mesmo item seriam indistinguíveis.
            */}
            {disponiveis.length > 0 && (
                <ul className="flex flex-col divide-y divide-border-secondary">
                    {disponiveis.map((linha) => {
                        const item = getItem(linha.itemId);
                        const irmas = disponiveis.filter((l) => l.itemId === linha.itemId);
                        const ordinal = irmas.length > 1 ? `Unidade ${irmas.indexOf(linha) + 1} de ${irmas.length}` : null;
                        const sessao = sessaoDoItem(item) ? sessaoLabel(item) : null;
                        return (
                            <li key={linha.id} className={cx("cursor-pointer px-4 py-3 transition duration-100 ease-linear hover:bg-primary_hover", selecao[linha.id] && "bg-secondary")}>
                                {/*
                                  Miniatura e texto vão dentro do `label`, não no `hint`:
                                  assim a área clicável é a linha inteira — foto incluída —
                                  e as três linhas de texto alinham ao lado da imagem em vez
                                  de recuarem sob a caixa.
                                */}
                                <Checkbox
                                    size="md"
                                    isSelected={Boolean(selecao[linha.id])}
                                    onChange={(marcado) => marcar([linha.id], marcado)}
                                    label={
                                        <span className="flex cursor-pointer items-start gap-3">
                                            <MiniaturaEmLinha item={item} />
                                            <span className="flex min-w-0 flex-col gap-0.5">
                                                <span className="text-sm font-medium text-primary">{item?.nome}</span>
                                                {item?.lote && <span className="text-sm font-normal text-tertiary">{item.lote}</span>}
                                                {sessao && <span className="text-sm font-normal text-tertiary">{sessao}</span>}
                                                {ordinal && <span className="text-sm font-normal text-tertiary">{ordinal}</span>}
                                            </span>
                                        </span>
                                    }
                                />
                            </li>
                        );
                    })}
                </ul>
            )}

            {indisponiveis.length > 0 && (
                <details className="group rounded-xl bg-primary ring-1 ring-border-secondary">
                    <summary className="cursor-pointer list-none rounded-xl px-4 py-3 text-sm font-semibold text-secondary transition duration-100 ease-linear hover:bg-primary_hover">
                        {indisponiveis.length === 1 ? "1 unidade não pode entrar" : `${indisponiveis.length} unidades não podem entrar`}
                        <span className="font-normal text-tertiary"> · ver motivo</span>
                    </summary>
                    <ul className="flex flex-col divide-y divide-border-secondary border-t border-secondary">
                        {indisponiveis.map((linha) => (
                            <li key={linha.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-4 py-3">
                                <span className="text-sm text-secondary">
                                    {getItem(linha.itemId)?.nome} · {identidadeDaLinha(pedido, linha).nome}
                                </span>
                                <span className="text-sm text-tertiary">{motivoIndisponivel(pedido, linha, verbo)}</span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}

/**
 * O que está sendo alterado, sempre com a pessoa: o overlay repete "qual unidade, de quem" para
 * o operador conferir o alvo antes de qualquer cobrança. "Alterar" volta para a seleção dentro do
 * overlay em vez de fechá-lo; o atalho inclui as unidades irmãs sem passar pela lista.
 */
export function ResumoUnidades({
    pedido,
    linhas,
    verbo,
    titulo,
    onAlterar,
    onIncluir,
    extra,
}: {
    pedido: Pedido;
    linhas: PedidoItem[];
    verbo: Verbo;
    titulo: string;
    onAlterar?: () => void;
    onIncluir?: (ids: string[]) => void;
    extra?: ReactNode;
}) {
    const ids = new Set(linhas.map((l) => l.id));
    const irmas = onIncluir && linhas.length > 0 ? pedido.itens.filter((l) => !ids.has(l.id) && linhas.some((x) => x.itemId === l.itemId) && !motivoIndisponivel(pedido, l, verbo)) : [];
    const nomeDasIrmas = getItem(irmas[0]?.itemId ?? "")?.nome;

    return (
        <div className="w-full rounded-xl bg-primary ring-1 ring-border-secondary">
            <div className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-3">
                <p className="text-sm font-semibold text-primary">{titulo}</p>
                {onAlterar && (
                    <Button size="sm" color="link-color" onClick={onAlterar}>
                        Alterar
                    </Button>
                )}
            </div>
            <div className="px-4 py-1">
                <ListaLimitada itens={linhas} limite={3} rotulo="unidades">
                    {(linha) => {
                        /* Só o item: quem é o portador não ajuda aqui. Na transferência
                           ele é a pessoa que SAI, e a etapa seguinte é justamente sobre
                           quem entra — mostrar os dois convida à troca de um pelo outro. */
                        const item = getItem(linha.itemId);
                        const sessao = sessaoDoItem(item) ? sessaoLabel(item) : null;
                        return (
                            <div key={linha.id} className="py-3">
                                <p className="text-sm font-medium text-primary">
                                    {item?.nome}
                                    {item?.lote && <span className="font-normal text-tertiary"> | {item.lote}</span>}
                                </p>
                                {sessao && <p className="text-sm text-tertiary">{sessao}</p>}
                            </div>
                        );
                    }}
                </ListaLimitada>
            </div>
            {irmas.length > 0 && (
                <div className="border-t border-secondary px-4 py-3">
                    <Button size="sm" color="link-color" onClick={() => onIncluir?.(irmas.map((l) => l.id))}>
                        {irmas.length === 1 ? `Incluir a outra unidade de ${nomeDasIrmas}` : `Incluir as outras ${irmas.length} unidades de ${nomeDasIrmas}`}
                    </Button>
                </div>
            )}
            {extra}
        </div>
    );
}

/** Ao fechar com algo feito, o rascunho já está salvo: o aviso diz isso e oferece descartar,
 *  com desfazer. Nenhum modal pergunta "deseja salvar?" (fechar nunca perde trabalho). */
export const avisarRascunhoSalvo = (rascunho: Rascunho | undefined) => {
    if (!rascunho) return;
    toast("Rascunho salvo no pedido", {
        description: "Nada foi cobrado nem reservado.",
        action: { label: "Descartar", onClick: () => descartarRascunho(rascunho) },
    });
};

export const descartarRascunho = (rascunho: Rascunho) => {
    removerRascunho(rascunho.id);
    toast("Rascunho descartado", { action: { label: "Desfazer", onClick: () => restaurarRascunho(rascunho) } });
};
