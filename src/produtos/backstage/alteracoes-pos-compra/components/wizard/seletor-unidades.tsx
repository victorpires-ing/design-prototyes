import type { ReactNode } from "react";
import { toast } from "sonner";
import { Package, Ticket01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { InputNumber } from "@/components/base/input/input-number";
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
 * Unidades que são a mesma coisa: mesmo item e mesmo portador. Duas unidades do mesmo
 * ingresso só são intercambiáveis enquanto pertencem à mesma pessoa — depois de uma
 * transferência deixam de ser, e aí voltam a ser linhas separadas, com o nome à mostra.
 */
const agruparIguais = (linhas: PedidoItem[], pedido: Pedido) => {
    const grupos = new Map<string, { itemId: string; titularId: string; unidades: PedidoItem[] }>();
    for (const linha of linhas) {
        const titularId = linha.titularId ?? pedido.compradorId;
        const chave = `${linha.itemId}|${titularId}`;
        const grupo = grupos.get(chave) ?? { itemId: linha.itemId, titularId, unidades: [] };
        grupo.unidades.push(linha);
        grupos.set(chave, grupo);
    }
    return [...grupos.values()];
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
    bloqueioExtra,
    unica = false,
}: {
    pedido: Pedido;
    verbo: Verbo;
    selecao: Record<string, boolean>;
    onChange: (proxima: Record<string, boolean>) => void;
    /** Escolha de uma unidade só, sem quantidade: o formulário é de uma unidade por vez.
     *  Marcar um item desmarca o anterior, e o campo de quantidade não aparece. */
    unica?: boolean;
    /** Motivo que depende de algo de fora da unidade — na transferência, de quem vai receber.
     *  A elegibilidade é da dupla pessoa+unidade, e só quem sabe a pessoa consegue respondê-la. */
    bloqueioExtra?: (linha: PedidoItem) => string | null;
}) {
    const motivo = (linha: PedidoItem) => motivoIndisponivel(pedido, linha, verbo) ?? bloqueioExtra?.(linha) ?? null;
    const disponiveis = pedido.itens.filter((l) => !motivo(l));
    const indisponiveis = pedido.itens.filter((l) => motivo(l));

    /* Uma linha por grupo. Escolher N marca as N primeiras unidades dele: dentro do
       grupo elas são idênticas, então qual delas vai é indiferente. */
    const grupos = agruparIguais(disponiveis, pedido);
    const escolher = (unidades: PedidoItem[], quantas: number) =>
        onChange(unica ? (quantas > 0 ? { [unidades[0].id]: true } : {}) : { ...selecao, ...Object.fromEntries(unidades.map((l, i) => [l.id, i < quantas])) });

    /* Só vale dizer de quem é a unidade quando o mesmo item cai em mais de um grupo:
       aí duas linhas seriam idênticas na tela. Com tudo na mão do comprador — o caso
       normal — o nome repetiria a mesma pessoa linha após linha. */
    const precisaDoNome = (itemId: string) => grupos.filter((g) => g.itemId === itemId).length > 1;

    return (
        <div className="flex flex-col gap-4">
            {disponiveis.length === 0 && <p className="rounded-xl bg-secondary px-4 py-6 text-center text-sm text-tertiary">Nenhuma unidade deste pedido pode entrar nesta alteração agora.</p>}

            {/*
              Uma linha por item, não por unidade: um pedido de assessoria com 40 inscrições
              iguais virava 40 linhas idênticas, impossíveis de distinguir e de percorrer. As
              unidades iguais entram agregadas e a quantidade vira um campo à direita.

              O seletor só aparece onde há quantidade a escolher, e nasce desabilitado: a
              ordem é marcar o item e então dizer quantas unidades dele entram.
            */}
            {grupos.length > 0 && (
                <ul className="flex flex-col divide-y divide-border-secondary">
                    {grupos.map((grupo) => {
                        const item = getItem(grupo.itemId);
                        const sessao = sessaoDoItem(item) ? sessaoLabel(item) : null;
                        const total = grupo.unidades.length;
                        const escolhidas = grupo.unidades.filter((l) => selecao[l.id]).length;
                        const marcado = escolhidas > 0;
                        return (
                            <li
                                key={`${grupo.itemId}|${grupo.titularId}`}
                                className={cx("flex items-center gap-3 px-4 py-3 transition duration-100 ease-linear hover:bg-primary_hover", marcado && "bg-secondary")}
                            >
                                {/*
                                  Miniatura e texto vão dentro do `label`, não no `hint`:
                                  assim a área clicável vai da foto ao fim do texto, e as
                                  linhas alinham ao lado da imagem em vez de recuarem sob
                                  a caixa. O seletor fica fora dela, para o clique nele não
                                  marcar nem desmarcar o item.
                                */}
                                <Checkbox
                                    size="md"
                                    isSelected={marcado}
                                    onChange={(quer) => escolher(grupo.unidades, quer ? Math.max(1, escolhidas) : 0)}
                                    className="min-w-0 flex-1 cursor-pointer"
                                    label={
                                        <span className="flex cursor-pointer items-start gap-3">
                                            <MiniaturaEmLinha item={item} />
                                            <span className="flex min-w-0 flex-col gap-0.5">
                                                <span className="text-sm font-medium text-primary">{item?.nome}</span>
                                                {item?.lote && <span className="text-sm font-normal text-tertiary">{item.lote}</span>}
                                                {sessao && <span className="text-sm font-normal text-tertiary">{sessao}</span>}
                                                {precisaDoNome(grupo.itemId) && <span className="text-sm font-normal text-tertiary">{getConta(grupo.titularId)?.nome}</span>}
                                                {total > 1 && <span className="text-sm font-normal text-tertiary">{total} unidades no pedido</span>}
                                            </span>
                                        </span>
                                    }
                                />
                                {total > 1 && !unica && (
                                    <InputNumber
                                        size="sm"
                                        orientation="horizontal"
                                        aria-label={`Quantas unidades de ${item?.nome}`}
                                        minValue={1}
                                        maxValue={total}
                                        value={marcado ? escolhidas : 1}
                                        isDisabled={!marcado}
                                        onChange={(quantas) => escolher(grupo.unidades, Number.isFinite(quantas) ? quantas : 1)}
                                        className="w-auto shrink-0"
                                        wrapperClassName="w-auto"
                                        inputClassName="w-12 px-0 text-center tabular-nums"
                                    />
                                )}
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
                                <span className="text-sm text-tertiary">{motivo(linha)}</span>
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
    bloqueioExtra,
    extra,
}: {
    pedido: Pedido;
    linhas: PedidoItem[];
    verbo: Verbo;
    titulo: string;
    onAlterar?: () => void;
    onIncluir?: (ids: string[]) => void;
    /** Mesmo motivo do seletor: o atalho de incluir as irmãs não pode oferecer unidade que o
     *  destinatário escolhido não tem como receber. */
    bloqueioExtra?: (linha: PedidoItem) => string | null;
    extra?: ReactNode;
}) {
    const ids = new Set(linhas.map((l) => l.id));
    const irmas =
        onIncluir && linhas.length > 0
            ? pedido.itens.filter((l) => !ids.has(l.id) && linhas.some((x) => x.itemId === l.itemId) && !motivoIndisponivel(pedido, l, verbo) && !bloqueioExtra?.(l))
            : [];
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
                {/* Agregado como na etapa de seleção: 40 inscrições iguais são uma linha
                    "40x Corrida 5 km", não quarenta linhas idênticas de conferir uma a uma. */}
                <ListaLimitada itens={agruparIguais(linhas, pedido)} limite={3} rotulo="itens">
                    {(grupo) => {
                        /* Só o item: quem é o portador não ajuda aqui. Na transferência
                           ele é a pessoa que SAI, e a etapa seguinte é justamente sobre
                           quem entra — mostrar os dois convida à troca de um pelo outro. */
                        const item = getItem(grupo.itemId);
                        const sessao = sessaoDoItem(item) ? sessaoLabel(item) : null;
                        return (
                            <div key={`${grupo.itemId}|${grupo.titularId}`} className="flex gap-3 py-3">
                                <span className="shrink-0 text-sm font-semibold text-secondary tabular-nums">{grupo.unidades.length}x</span>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-primary">
                                        {item?.nome}
                                        {item?.lote && <span className="font-normal text-tertiary"> | {item.lote}</span>}
                                    </p>
                                    {sessao && <p className="text-sm text-tertiary">{sessao}</p>}
                                </div>
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
