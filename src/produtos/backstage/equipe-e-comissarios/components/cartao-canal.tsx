import { Fragment, useState } from "react";
import { ChevronDown, Edit01, HelpCircle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Toggle } from "@/components/base/toggle/toggle";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { Surgir } from "@/components/foundations/transicao";
import { cx } from "@/utils/cx";
import { apoioDoItem, estoqueDoItem, INGRESSOS, ITEM_POR_ID, legendaDeSessao, separarPorTipo } from "../data/catalogo-evento";
import {
    DICA_CANAL,
    geraComissao,
    itemValido,
    itensDoCanal,
    limiteDoCanal,
    plural,
    ROTULO_CANAL,
    ROTULO_COTA,
    salvarCanal,
    usadasDoCanal,
    type CanalGrupo,
    type GrupoEquipe,
} from "../data/equipe";
import { textoComissao } from "../../comissarios/components/comuns";
import type { Comissario } from "../data/equipe";
import { CotaEditavel } from "./cota-editavel";
import { BarraUso } from "./ui-cotas";

/** Resumo dos itens do canal: "Todos os ingressos" ou "3 ingressos, 1 produto". */
function resumoDosItens(itens: string[], todos?: boolean) {
    if (todos) return "Todos os ingressos";
    const conta = { ingresso: 0, produto: 0, combo: 0 };
    for (const id of itens) {
        const i = ITEM_POR_ID[id];
        if (i) conta[i.tipo]++;
    }
    const partes = [
        conta.ingresso && plural(conta.ingresso, "ingresso", "ingressos"),
        conta.produto && plural(conta.produto, "produto", "produtos"),
        conta.combo && plural(conta.combo, "combo", "combos"),
    ].filter(Boolean) as string[];
    return partes.length ? new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" }).format(partes) : "Nenhum item";
}

/**
 * Um canal do grupo na aba Configuração (ECO-12 a ECO-19). Sem configuração: o que o canal faz e
 * "Configurar". Configurado: liga e desliga direto, resumo, uso da cota, "Editar" e os itens com o uso
 * e a cota editável no lugar.
 */
export function CartaoCanal({ grupo, canal, comissario, onConfigurar }: { grupo: GrupoEquipe; canal: CanalGrupo; comissario?: Comissario; onConfigurar: () => void }) {
    // O cartão do comissário só conta como configurado com um comissário no grupo (ECO-12).
    const cfg = canal === "link" && !comissario ? undefined : grupo.canais[canal];
    const titulo = ROTULO_CANAL[canal];
    const [abertos, setAbertos] = useState(false);
    const [editando, setEditando] = useState<string | null>(null);

    if (!cfg)
        return (
            <section className="flex flex-col gap-3 rounded-2xl bg-primary p-5 ring-1 ring-secondary sm:flex-row sm:items-center sm:justify-between">
                <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold text-primary">{ROTULO_CANAL[canal]}</span>
                    <span className="text-sm text-tertiary">Não configurado. {DICA_CANAL[canal]}</span>
                </span>
                <Button color="secondary" size="sm" className="shrink-0 self-start sm:self-center" onClick={onConfigurar}>
                    Configurar
                </Button>
            </section>
        );

    const usadas = usadasDoCanal(cfg, itemValido);
    const limite = limiteDoCanal(cfg, itemValido);
    const itens = cfg.todos ? INGRESSOS.map((i) => i.id) : itensDoCanal(cfg, itemValido);
    const comissao = geraComissao(grupo, canal, cfg);
    const tipo = cfg.cota.tipo;
    const alterarCota = (fn: (c: typeof cfg.cota) => typeof cfg.cota) => salvarCanal(grupo.id, canal, { ...cfg, cota: fn(cfg.cota) });

    return (
        <section className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <Toggle
                        size="sm"
                        isSelected={cfg.ligado}
                        onChange={(ligado) => salvarCanal(grupo.id, canal, { ...cfg, ligado })}
                        aria-label={cfg.ligado ? `Desligar ${ROTULO_CANAL[canal]}` : `Ligar ${ROTULO_CANAL[canal]}`}
                    />
                    <span className="flex min-w-0 flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-primary">{titulo}</span>
                            {!cfg.ligado && (
                                <Badge size="sm" type="pill-color" color="gray">
                                    Desligado
                                </Badge>
                            )}
                            {grupo.comissarioId && (canal === "pdv" || canal === "bilheteria") && (
                                <Badge size="sm" type="pill-color" color={comissao ? "brand" : "gray"}>
                                    {comissao ? "Gera comissão" : "Sem comissão"}
                                </Badge>
                            )}
                        </span>
                        <span className="text-sm text-tertiary">
                            {canal === "link" && comissario
                                ? `Link e cupom ${comissario.codigo}, ${textoComissao(comissario.padrao)}, ${resumoDosItens(cfg.itens, cfg.todos).toLowerCase()}`
                                : resumoDosItens(cfg.itens, cfg.todos)}
                            , {ROTULO_COTA[tipo].toLowerCase()}
                        </span>
                    </span>
                </div>
                <Button size="sm" color="tertiary" iconLeading={Edit01} onClick={onConfigurar}>
                    Editar
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pl-12">
                {limite === null ? (
                    <span className="flex items-center gap-1 text-sm font-medium text-secondary">
                        Sem limite: {plural(usadas, "emissão", "emissões")}
                        <Tooltip title={<span className="font-normal">Sem cota definida: o limite de cada item é o estoque disponível.</span>} placement="right" arrow>
                            <TooltipTrigger aria-label="Como o limite é calculado" className="flex text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover">
                                <HelpCircle className="size-4" aria-hidden="true" />
                            </TooltipTrigger>
                        </Tooltip>
                    </span>
                ) : tipo === "compartilhada" ? (
                    <CotaEditavel
                        variante="topo"
                        nome={ROTULO_CANAL[canal]}
                        uso={usadas}
                        cota={limite}
                        editando={editando === "total"}
                        onEditar={() => setEditando("total")}
                        onCancelar={() => setEditando(null)}
                        onSalvar={(n) => {
                            alterarCota((c) => ({ ...c, total: n }));
                            setEditando(null);
                        }}
                    />
                ) : (
                    <>
                        <BarraUso usadas={usadas} total={limite} className="w-60 max-w-full" />
                        <span className="text-sm font-medium text-secondary tabular-nums">
                            {usadas.toLocaleString("pt-BR")} de {limite.toLocaleString("pt-BR")}
                        </span>
                    </>
                )}
            </div>

            {itens.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-secondary pt-3">
                    <Button color="link-gray" size="sm" className="self-start" iconTrailing={<ChevronDown data-icon className={cx("size-4 transition duration-100 ease-linear", abertos && "rotate-180")} />} onClick={() => setAbertos((a) => !a)}>
                        {abertos ? "Esconder itens" : `Ver itens e uso (${itens.length})`}
                    </Button>
                    <Surgir visivel={abertos}>
                        <ul className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-4">
                            {separarPorTipo(itens.map((id) => ITEM_POR_ID[id]).filter(Boolean)).map(({ tipo: tipoItem, titulo, itens: doTipo }, t) => (
                                <Fragment key={tipoItem}>
                                    <li className={cx("col-span-2 text-sm font-semibold text-primary", t > 0 && "border-t border-secondary pt-4")}>
                                        {titulo} <span className="font-normal text-tertiary">({doTipo.length})</span>
                                    </li>
                                    {doTipo.map((item) => {
                                        const uso = cfg.uso[item.id] ?? 0;
                                        return (
                                            <li key={item.id} className="col-span-2 grid grid-cols-subgrid items-center">
                                                <span className="flex min-w-0 flex-col">
                                                    <span className="text-sm font-medium text-primary">{item.nome}</span>
                                                    <span className="text-sm text-tertiary">{apoioDoItem(item)}</span>
                                                    {legendaDeSessao(item, "curto") && <span className="text-sm text-tertiary">{legendaDeSessao(item, "curto")}</span>}
                                                </span>
                                                {tipo === "por-item" ? (
                                                    <CotaEditavel
                                                        nome={item.nome}
                                                        uso={uso}
                                                        cota={cfg.cota.porItem[item.id] ?? 0}
                                                        editando={editando === item.id}
                                                        onEditar={() => setEditando(item.id)}
                                                        onCancelar={() => setEditando(null)}
                                                        onSalvar={(n) => {
                                                            alterarCota((c) => ({ ...c, porItem: { ...c.porItem, [item.id]: n } }));
                                                            setEditando(null);
                                                        }}
                                                    />
                                                ) : tipo === "sem-limite" ? (
                                                    <span className="flex min-w-[131px] flex-col gap-2">
                                                        <span className="text-sm font-medium whitespace-nowrap text-secondary tabular-nums">
                                                            {uso} de {Math.max(estoqueDoItem(item), uso)} emissões
                                                        </span>
                                                        <BarraUso usadas={uso} total={Math.max(estoqueDoItem(item), uso)} />
                                                    </span>
                                                ) : (
                                                    <span className="justify-self-end text-sm font-medium whitespace-nowrap text-secondary tabular-nums">{plural(uso, "emissão", "emissões")}</span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </Fragment>
                            ))}
                        </ul>
                    </Surgir>
                </div>
            )}
        </section>
    );
}
