import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowDown, ArrowLeft, Calendar, ChevronDown, InfoCircle, Tag01, Ticket01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";
import { RadioButtonBase } from "@/components/base/radio-buttons/radio-buttons";
import { AppShell } from "../../components/AppShell";
import { GradientFill } from "../../components/GradientFill";
import { StatusBar } from "../../components/StatusBar";
import { getEvento, getItem } from "../data/eventos";
import { brl, getCatalogoTroca } from "../data/upgrade";

/** Fluxo de troca/upgrade de ingresso — seleção do novo ingresso (troca 1 para 1).
 *  Só permite seguir se o novo ingresso for de valor igual ou superior (paga a diferença). */
export function TrocarIngresso() {
    const navigate = useNavigate();
    const { eventId, itemId } = useParams();
    const evento = getEvento(eventId);
    const item = getItem(eventId, itemId);
    const catalogo = getCatalogoTroca(eventId, itemId);

    const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
    const [expandido, setExpandido] = useState<Record<string, boolean>>(() =>
        Object.fromEntries((catalogo?.grupos ?? []).map((g) => [g.nome, true])),
    );
    const [resumoAberto, setResumoAberto] = useState(false);

    const opcoes = catalogo?.grupos.flatMap((g) => g.opcoes) ?? [];
    const selecionado = opcoes.find((o) => o.id === selecionadoId);
    const totalValor = selecionado?.valor ?? 0;
    const atualValor = catalogo?.atualValor ?? 0;
    const valorCompraInicial = catalogo?.valorCompraInicial ?? atualValor;
    // Diferença a pagar = novo valor − valor pago na compra inicial.
    const diferenca = totalValor - valorCompraInicial;
    // Regra: só é possível trocar por valor igual ou superior (diferença ≥ 0).
    const podeSeguir = !!selecionado && diferenca >= 0;
    // Diferença formatada: zero aparece como "R$ 0" (fiel ao layout).
    const diferencaFmt = diferenca > 0 ? brl(diferenca) : "R$ 0";

    const dataEvento = item?.data ?? evento.sessao;

    return (
        <AppShell
            showTabBar={false}
            scrollClassName="bg-secondary"
            bottomBar={
                selecionado ? (
                    <div className="pointer-events-auto absolute inset-x-0 bottom-0 rounded-t-2xl bg-primary shadow-[0_-8px_24px_rgba(0,0,0,0.10)] ring-1 ring-border-secondary">
                        {/* Cabeçalho do resumo (toggle) */}
                        <button
                            type="button"
                            onClick={() => setResumoAberto((v) => !v)}
                            className="flex w-full items-center justify-between px-5 py-4 text-left"
                        >
                            <span className="text-md font-bold text-primary">Resumo da compra</span>
                            <ChevronDown className={cx("size-5 text-fg-quaternary transition duration-200", !resumoAberto && "rotate-180")} />
                        </button>

                        {/* Conteúdo expandido */}
                        {resumoAberto && (
                            <div className="px-5 pb-4">
                                <div className="flex items-center justify-between border-t border-dashed border-secondary pt-3">
                                    <span className="text-sm text-tertiary">Ingressos</span>
                                    <button
                                        type="button"
                                        onClick={() => setSelecionadoId(null)}
                                        className="text-sm text-secondary underline"
                                    >
                                        Remover tudo
                                    </button>
                                </div>

                                <div className="mt-3 flex">
                                    <span className="flex w-9 shrink-0 items-center gap-1 self-start text-sm font-semibold text-primary tabular-nums">
                                        1
                                        <Ticket01 className="size-4 text-fg-quaternary" />
                                    </span>
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <p className="text-sm font-bold text-primary">{catalogo?.atualNome}</p>
                                        <p className="text-sm text-tertiary">{selecionado.nome}</p>
                                        <p className="text-xs text-tertiary">{catalogo?.dataResumo}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-primary tabular-nums">{brl(selecionado.valor)}</p>
                                        <button
                                            type="button"
                                            onClick={() => setSelecionadoId(null)}
                                            className="text-sm text-secondary underline"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 ml-9 flex flex-col gap-2 border-t border-dashed border-secondary pt-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-tertiary">Valor da compra inicial</span>
                                        <span className="font-semibold text-primary tabular-nums">{brl(valorCompraInicial)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-tertiary">Valor da diferença</span>
                                        <span className="font-semibold text-primary tabular-nums">{diferencaFmt}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Barra de ação */}
                        <div className="flex items-center justify-between gap-3 border-t border-secondary px-5 pt-3 pb-6">
                            {diferenca > 0 ? (
                                <p className="flex min-w-0 items-center gap-1.5 leading-tight">
                                    <span className="text-lg font-bold text-primary tabular-nums">{brl(diferenca)}</span>
                                    <span className="text-sm text-tertiary">+ taxas</span>
                                    <InfoCircle className="size-4 text-blue-500" />
                                </p>
                            ) : (
                                <p className="min-w-0 text-md font-semibold text-primary">Nenhum valor adicional</p>
                            )}
                            <Button
                                size="lg"
                                color="primary"
                                className="shrink-0 px-8"
                                isDisabled={!podeSeguir}
                                onClick={() =>
                                    navigate(
                                        diferenca > 0
                                            ? `/ingresse-app/ingressos/trocar/${evento.id}/${itemId}/pagamento?opcao=${selecionado.id}`
                                            : `/ingresse-app/ingressos/trocar/${evento.id}/${itemId}/sucesso`,
                                    )
                                }
                            >
                                {diferenca > 0 ? "Continuar" : "Trocar"}
                            </Button>
                        </div>
                    </div>
                ) : undefined
            }
        >
            <div className="flex min-h-full flex-col bg-secondary">
                <StatusBar tone="dark" />

                {/* Top bar + título */}
                <div className="px-5 pt-2">
                    <button
                        type="button"
                        aria-label="Voltar"
                        onClick={() => navigate(-1)}
                        className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <h1 className="pt-4 text-xl font-bold text-primary">Trocar ingresso</h1>
                </div>

                <div className="px-5 pt-4 pb-8">
                    {/* Card: ingresso atual */}
                    <div className="rounded-2xl bg-primary p-5 shadow-sm ring-1 ring-border-secondary">
                        <p className="text-sm text-tertiary">Detalhes do seu ingresso atual</p>
                        <div className="mt-3 flex gap-3">
                            <div className="size-16 shrink-0 overflow-hidden rounded-xl">
                                <GradientFill gradient={evento.gradient} />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                                <p className="text-md leading-tight font-bold text-primary">{evento.title}</p>
                                <p className="truncate text-sm text-tertiary">{item?.title ?? catalogo?.atualNome}</p>
                                {item?.tipo && <p className="truncate text-sm text-quaternary">{item.tipo}</p>}
                            </div>
                        </div>

                        <div className="my-4 border-t border-tertiary" />

                        <div className="flex gap-10">
                            <div>
                                <p className="text-xs text-tertiary">Data do evento</p>
                                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-primary">
                                    <Calendar className="size-4 text-fg-quaternary" />
                                    {dataEvento}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-tertiary">Valor do ingresso</p>
                                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-primary">
                                    <Ticket01 className="size-4 text-fg-quaternary" />
                                    {brl(atualValor)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Conector */}
                    <div className="flex justify-center py-6">
                        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-fg-secondary ring-1 ring-border-secondary">
                            <ArrowDown className="size-5" />
                        </span>
                    </div>

                    <h2 className="text-lg font-bold text-primary">Selecione seu novo ingresso</h2>

                    {/* Cupom */}
                    <button
                        type="button"
                        className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                    >
                        <Tag01 className="size-5 text-fg-quaternary" />
                        Adicionar código ou cupom
                    </button>

                    {/* Sessão */}
                    <div className="mt-5">
                        {catalogo?.sessaoDia && <p className="text-sm text-tertiary">{catalogo.sessaoDia}</p>}
                        <p className="text-md font-bold text-primary">{catalogo?.sessaoData}</p>
                    </div>

                    {/* Grupos de ingressos (seleção única — troca 1 para 1) */}
                    <div className="mt-3 flex flex-col gap-3">
                        {catalogo?.grupos.map((grupo) => {
                            // Só exibe opções de valor igual ou superior ao ingresso atual.
                            const opcoesVisiveis = grupo.opcoes.filter((o) => o.valor >= atualValor);
                            if (opcoesVisiveis.length === 0) return null;
                            const aberto = expandido[grupo.nome];
                            return (
                                <div key={grupo.nome} className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                                    <button
                                        type="button"
                                        onClick={() => setExpandido((e) => ({ ...e, [grupo.nome]: !e[grupo.nome] }))}
                                        className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                                    >
                                        <span className="text-base font-bold text-primary">{grupo.nome}</span>
                                        <ChevronDown className={cx("size-5 text-fg-quaternary transition duration-200", aberto && "rotate-180")} />
                                    </button>

                                    {aberto &&
                                        opcoesVisiveis.map((o) => {
                                            const sel = o.id === selecionadoId;
                                            return (
                                                <button
                                                    key={o.id}
                                                    type="button"
                                                    onClick={() => setSelecionadoId(o.id)}
                                                    className={cx(
                                                        "flex w-full items-center justify-between gap-3 border-t border-secondary px-4 py-4 text-left transition duration-100 ease-linear",
                                                        sel ? "bg-secondary" : "active:bg-secondary",
                                                    )}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-primary">{o.nome}</p>
                                                        <p className="text-xs text-tertiary">{o.lote}</p>
                                                        <p className="mt-1.5 text-sm font-bold text-primary">{brl(o.valor)}</p>
                                                    </div>
                                                    {/* Radio do design system */}
                                                    <RadioButtonBase size="md" isSelected={sel} />
                                                </button>
                                            );
                                        })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
