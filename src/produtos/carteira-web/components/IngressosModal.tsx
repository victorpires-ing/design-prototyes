import { useState } from "react";
import type { FC } from "react";
import { AlertCircle, ArrowLeft, ChevronDown, ClipboardCheck, InfoCircle, Package, Plus, Send01, Tag01, UserRight01, Wallet02, XClose } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import googleWalletBtn from "../assets/view-in-google-wallet-svg/pt-BR_view_in_wallet_wallet-button.svg";
import { FakeQR } from "./FakeQR";
import { Zigzag } from "./Zigzag";
import { SAO_SILVESTRE, type Combo, type ComboItem, type EventoSS, type Resposta } from "../data/sao-silvestre";
import { getTransferencia } from "../data/transfer-store";

const STATUS: Record<string, { label: string; color: "brand" | "blue" | "gray" }> = {
    hoje: { label: "Evento de hoje", color: "brand" },
    proximo: { label: "Próximo", color: "blue" },
    finalizado: { label: "Finalizado", color: "gray" },
};

/** Datas do combo de forma compacta — ex.: "10 e 31, Dez 2026". */
function datasDoCombo(combo: Combo): string {
    const partes = combo.itens.map((it) => it.data?.split("•")[0].trim()).filter(Boolean) as string[];
    const dias = [...new Set(partes.map((p) => p.match(/\d{1,2}/)?.[0]).filter(Boolean))] as string[];
    const palavras = partes[0]?.split(/\s+/) ?? [];
    const mesRaw = palavras[palavras.length - 1] ?? "";
    const mes = mesRaw.charAt(0).toUpperCase() + mesRaw.slice(1);
    return `${dias.join(" e ")}, ${mes} 2026`;
}

/** Botão de ação circular com rótulo — mesmo formato do ActionFab do app. */
function CircleAction({
    icon: Icon,
    label,
    variant = "neutral",
    onClick,
}: {
    icon: FC<{ className?: string }>;
    label: string;
    variant?: "primary" | "neutral";
    onClick?: () => void;
}) {
    return (
        <button type="button" onClick={onClick} className="flex w-16 flex-col items-center gap-1.5">
            <span
                className={cx(
                    "flex size-14 items-center justify-center rounded-full shadow-lg transition duration-100 ease-linear active:scale-95",
                    variant === "primary" ? "bg-brand-solid text-white" : "bg-primary text-fg-secondary ring-1 ring-border-secondary",
                )}
            >
                <Icon className="size-6" />
            </span>
            <span className="text-center text-xs leading-tight font-medium text-secondary">{label}</span>
        </button>
    );
}

/* ----------------------------------------------------------------------------
 * Mobile: tela de ingresso no formato do app (card em formato de ingresso).
 * -------------------------------------------------------------------------- */
function MobileComboView({
    ev,
    combo,
    titular,
    cpf,
    onClose,
    onTransfer,
}: {
    ev: EventoSS;
    combo: Combo;
    titular: string;
    cpf: string;
    onClose: () => void;
    onTransfer?: (combo: Combo) => void;
}) {
    const transferencia = getTransferencia(combo.id);
    const [actionsOpen, setActionsOpen] = useState(false);

    return (
        <>
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto bg-secondary">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-4">
                <button
                    type="button"
                    aria-label="Voltar"
                    onClick={onClose}
                    className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <button
                    type="button"
                    aria-label="Informações"
                    className="flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear active:bg-secondary"
                >
                    <InfoCircle className="size-5" />
                </button>
            </div>
            <h1 className="px-5 pt-4 text-xl font-bold text-primary">Inscrição</h1>

            <div className={cx("flex flex-1 flex-col gap-6 px-5 pt-4", transferencia ? "pb-8" : "pb-40")}>
                {transferencia ? (
                    <>
                        {/* Estado transferido (formato de ingresso) */}
                        <div className="rounded-3xl bg-primary shadow-sm ring-1 ring-border-secondary">
                            <div className="p-5">
                                <p className="text-xs font-medium tracking-wide text-tertiary uppercase">{ev.title}</p>
                                <div className="my-3 border-t border-tertiary" />
                                <p className="text-2xl leading-tight font-bold text-primary">{combo.nome}</p>
                                <p className="mt-1.5 text-sm text-tertiary">{datasDoCombo(combo)}</p>
                            </div>

                            <TicketNotch />

                            <div className="p-5">
                                <div className="flex items-start gap-3">
                                    <FeaturedIcon icon={UserRight01} color="gray" theme="modern" size="lg" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-md font-bold text-primary">Inscrição transferida</p>
                                        <p className="mt-1 text-sm text-tertiary">Esta inscrição foi enviada para outro participante e não pode mais ser utilizada por você.</p>
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-tertiary pt-4">
                                    <p className="text-sm text-tertiary">Transferido para</p>
                                    <p className="mt-0.5 text-md font-bold text-primary">{transferencia.destinatario}</p>
                                    <p className="mt-0.5 text-sm text-tertiary">{transferencia.email}</p>

                                    <p className="mt-4 text-sm text-tertiary">Data da transferência</p>
                                    <p className="mt-0.5 text-md font-bold text-primary">{transferencia.data}</p>
                                </div>
                            </div>
                        </div>

                        {/* Itens do combo */}
                        <div>
                            <h2 className="pb-3 text-md font-bold text-primary">Itens do combo</h2>
                            <div className="flex flex-col gap-5">
                                {combo.itens.map((it, i) => (
                                    <MobileItem key={i} item={it} />
                                ))}
                            </div>
                        </div>

                        {/* Respostas do formulário (preenchidas na transferência) */}
                        <div>
                            <div className="flex items-center gap-2 pb-3">
                                <ClipboardCheck className="size-5 text-brand-secondary" />
                                <h2 className="text-md font-bold text-primary">Respostas do formulário</h2>
                            </div>
                            <div className="divide-y divide-border-secondary overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                                {transferencia.respostas.map((q) => (
                                    <div key={q.pergunta} className="p-4">
                                        <p className="text-sm font-semibold text-primary">{q.pergunta}</p>
                                        <p className="mt-0.5 text-sm text-tertiary">{q.resposta}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Card do ingresso (combo) — mesmo layout do app, com QR único */}
                        <div className="rounded-3xl bg-primary shadow-sm ring-1 ring-border-secondary">
                            <div className="p-5">
                                <p className="text-xs font-medium tracking-wide text-tertiary uppercase">{ev.title}</p>
                                <p className="mt-1 text-2xl leading-tight font-bold text-primary">{combo.nome}</p>

                                <div className="my-4 border-t border-tertiary" />

                                <p className="text-xs font-semibold text-tertiary">Data do evento</p>
                                <p className="mt-1 text-sm font-bold text-primary">{datasDoCombo(combo)}</p>
                            </div>

                            <TicketNotch />

                            {/* QR Code único + titular */}
                            <div className="px-6 pt-6 pb-7">
                                <p className="text-center text-sm">
                                    <span className="font-semibold text-brand-secondary">Este combo tem um QR Code único.</span>{" "}
                                    <span className="font-normal text-tertiary">Apresente este código para acessar os itens abaixo.</span>
                                </p>
                                <div className="mt-5 flex justify-center">
                                    <FakeQR px={220} />
                                </div>
                                <div className="-mx-6 my-5 border-t border-tertiary" />
                                <div>
                                    <p className="text-sm text-tertiary">
                                        Titular: <span className="font-semibold text-primary">{titular}</span>
                                    </p>
                                    <p className="mt-1 text-sm text-tertiary">
                                        CPF: <span className="font-semibold text-primary">{cpf}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Itens do combo */}
                        <div>
                            <h2 className="pb-3 text-md font-bold text-primary">Itens do combo</h2>
                            <div className="flex flex-col gap-5">
                                {combo.itens.map((it, i) => (
                                    <MobileItem key={i} item={it} />
                                ))}
                            </div>
                        </div>

                    </>
                )}
            </div>
        </div>

        {/* Barra de ações flutuante fixa no rodapé (igual ActionFab do app). Oculta quando transferido. */}
        {!transferencia && (
            <>
                {actionsOpen && (
                    <button type="button" aria-label="Fechar" onClick={() => setActionsOpen(false)} className="absolute inset-0 z-10 bg-black/30" />
                )}
                <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center bg-[linear-gradient(to_top,var(--color-bg-secondary)_30%,transparent)] px-5 pt-16 pb-6">
                    <div className="flex flex-col gap-5">
                        {/* Ações extras reveladas pelo "Mais" (pílulas) */}
                        {actionsOpen && (
                            <div className="flex flex-col items-end gap-2.5 duration-150 animate-in fade-in slide-in-from-bottom-2">
                                <button
                                    type="button"
                                    onClick={() => setActionsOpen(false)}
                                    className="flex items-center gap-2.5 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-lg ring-1 ring-black/10 transition duration-100 ease-linear active:scale-95"
                                >
                                    <Wallet02 className="size-5 text-white" />
                                    Adicionar à Carteira
                                </button>
                            </div>
                        )}

                        {/* Linha principal: 2 ações + Mais/Fechar */}
                        <div className="flex items-start justify-center gap-8">
                            <CircleAction
                                icon={Send01}
                                label="Transferir"
                                variant="primary"
                                onClick={() => {
                                    setActionsOpen(false);
                                    onTransfer?.(combo);
                                }}
                            />
                            <CircleAction icon={Tag01} label="Revender" onClick={() => setActionsOpen(false)} />
                            <CircleAction icon={actionsOpen ? XClose : Plus} label={actionsOpen ? "Fechar" : "Mais"} onClick={() => setActionsOpen((v) => !v)} />
                        </div>
                    </div>
                </div>
            </>
        )}
        </>
    );
}

/** Recorte (rasgadinho) do card de ingresso. */
function TicketNotch() {
    return (
        <div className="relative py-1">
            <div className="absolute top-1/2 -left-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
            <div className="absolute top-1/2 -right-2.5 size-5 -translate-y-1/2 rounded-full bg-secondary" />
            <div className="px-3">
                <Zigzag />
            </div>
        </div>
    );
}

/** Item do combo no mobile — data acima do card (igual app). */
function MobileItem({ item }: { item: ComboItem }) {
    const s = item.status ? STATUS[item.status] : null;
    const finalizado = item.status === "finalizado";
    const hoje = item.status === "hoje";
    // Data da retirada, endereço e conteúdo do kit vão dentro da descrição do produto.
    const temDescricao = !!(item.imagem || item.gradient || item.conteudo || item.endereco || (item.dataLabel && item.data));
    return (
        <div>
            {item.data && <p className="pb-2 text-sm font-bold text-primary">{item.data}</p>}
            <div className={cx("rounded-2xl bg-primary p-4", hoje ? "ring-2 ring-fg-brand-primary" : "ring-1 ring-border-secondary")}>
                {s && (
                    <div className="mb-3">
                        <Badge size="md" color={s.color} type="pill-color">
                            {s.label}
                        </Badge>
                    </div>
                )}
                <p className={cx("text-sm font-bold", finalizado ? "text-tertiary" : "text-primary")}>{item.nome}</p>
                {item.acesso && (
                    <p className="mt-1.5 text-sm text-tertiary">
                        Acesso por <span className="font-semibold text-secondary">{item.acesso}</span>
                    </p>
                )}

                {item.gradient ? (
                    <div className="mt-3 aspect-[4/3] w-full rounded-xl" style={{ background: item.gradient }} />
                ) : (
                    item.imagem && <img src={item.imagem} alt={item.nome} className="mt-3 w-full rounded-xl object-cover" />
                )}

                {/* Descrição do produto: data da retirada + endereço, depois o que contém no kit */}
                {temDescricao && (
                    <div className="mt-3 flex flex-col gap-3">
                        {item.dataLabel && item.data && (
                            <div>
                                <p className="text-xs font-semibold text-tertiary">{item.dataLabel}</p>
                                <p className="mt-1 text-sm text-secondary">{item.data}</p>
                            </div>
                        )}
                        {item.endereco && (
                            <div>
                                <p className="text-xs font-semibold text-tertiary">Endereço</p>
                                <p className="mt-1 text-sm text-secondary">{item.endereco}</p>
                            </div>
                        )}
                        {item.conteudo && (
                            <div>
                                <p className="text-xs font-semibold text-tertiary">O kit contém</p>
                                <ul className="mt-2 flex flex-col gap-1.5">
                                    {item.conteudo.map((c) => (
                                        <li key={c} className="flex items-center gap-2 text-sm text-secondary">
                                            <span className="size-1.5 shrink-0 rounded-full bg-fg-quaternary" />
                                            {c}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export function IngressosModal({ onClose, compact = false, onTransfer }: { onClose: () => void; compact?: boolean; onTransfer?: (combo: Combo) => void }) {
    const ev = SAO_SILVESTRE;

    // ----- Mobile: tela de ingresso no formato do app (sem header com degradê) -----
    if (compact) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay sm:p-4" role="dialog" aria-modal="true" onClick={onClose}>
                <div
                    className="relative flex h-full w-full flex-col overflow-hidden bg-secondary sm:h-[92vh] sm:max-h-[820px] sm:w-[390px] sm:max-w-full sm:rounded-3xl sm:shadow-xl sm:ring-1 sm:ring-border-secondary"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MobileComboView ev={ev} combo={ev.combos[0]} titular={ev.titular} cpf={ev.cpf} onClose={onClose} onTransfer={onTransfer} />
                </div>
            </div>
        );
    }

    // ----- Desktop: diálogo centralizado -----
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4" role="dialog" aria-modal="true" onClick={onClose}>
            <div
                className={cx("flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-border-secondary", compact ? "max-w-[360px]" : "max-w-3xl")}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative overflow-y-auto p-6">
                    <button
                        type="button"
                        aria-label="Fechar"
                        onClick={onClose}
                        className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary"
                    >
                        <XClose className="size-5" />
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-4 pr-8">
                        <div className="size-20 shrink-0 rounded-xl" style={{ background: ev.gradient }} />
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg leading-tight font-bold text-primary">
                                Sua inscrição para <span className="font-extrabold">{ev.title}</span>
                            </h2>
                            <p className="mt-1 text-sm text-tertiary">{ev.local}</p>
                        </div>
                    </div>

                    {/* Combos agrupados (expansíveis) */}
                    <div className="mt-8 flex flex-col gap-4">
                        {ev.combos.map((c) => (
                            <ComboCard
                                key={c.id}
                                combo={c}
                                titular={ev.titular}
                                cpf={ev.cpf}
                                questionario={ev.questionario}
                                compact={compact}
                                onTransfer={() => onTransfer?.(c)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ComboCard({
    combo,
    titular,
    cpf,
    questionario,
    compact = false,
    onTransfer,
}: {
    combo: Combo;
    titular: string;
    cpf: string;
    questionario: Resposta[];
    compact?: boolean;
    onTransfer?: () => void;
}) {
    const [open, setOpen] = useState(true);
    const transferencia = getTransferencia(combo.id);

    return (
        <div className="overflow-hidden rounded-xl ring-1 ring-border-secondary">
            {/* Cabeçalho do combo (agrupador) */}
            <div className="flex items-center gap-3 bg-secondary/50 p-4">
                <span
                    className={cx(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        transferencia ? "bg-tertiary text-fg-quaternary" : "bg-brand-secondary text-fg-brand-primary",
                    )}
                >
                    <Package className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-primary">{combo.nome}</p>
                        {transferencia ? (
                            <Badge size="sm" color="gray" type="pill-color">
                                Transferida
                            </Badge>
                        ) : (
                            <span className="shrink-0 rounded-full bg-brand-secondary px-2 py-0.5 text-xs font-medium text-brand-secondary">Combo</span>
                        )}
                    </div>
                    <p className="mt-0.5 text-sm text-tertiary">Data do evento: {datasDoCombo(combo)}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    aria-label={open ? "Recolher" : "Expandir"}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-fg-quaternary ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary"
                >
                    <ChevronDown className={cx("size-5 transition-transform duration-200", open && "rotate-180")} />
                </button>
            </div>

            {open && transferencia && (
                <div className="flex flex-col gap-5 border-t border-secondary bg-secondary/50 p-4">
                    {/* Estado transferido (adaptado do app) */}
                    <div className="rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                        <div className="flex items-start gap-3">
                            <FeaturedIcon icon={UserRight01} color="gray" theme="modern" size="lg" />
                            <div className="min-w-0 flex-1">
                                <p className="text-md font-bold text-primary">Inscrição transferida</p>
                                <p className="mt-1 text-sm text-tertiary">Esta inscrição foi enviada para outro participante e não pode mais ser utilizada por você.</p>
                            </div>
                        </div>
                        <div className="mt-4 border-t border-secondary pt-4">
                            <p className="text-sm text-tertiary">Transferido para</p>
                            <p className="mt-0.5 text-md font-bold text-primary">{transferencia.destinatario}</p>
                            <p className="mt-0.5 text-sm text-tertiary">{transferencia.email}</p>

                            <p className="mt-4 text-sm text-tertiary">Data da transferência</p>
                            <p className="mt-0.5 text-md font-bold text-primary">{transferencia.data}</p>
                        </div>
                    </div>

                    {/* Itens do combo */}
                    <div>
                        <h4 className="text-sm font-bold text-primary">Itens do combo</h4>
                        <div className="mt-3 flex flex-col gap-5">
                            {combo.itens.map((it, i) => (
                                <ItemView key={i} item={it} />
                            ))}
                        </div>
                    </div>

                    {/* Respostas do formulário (preenchidas na transferência) */}
                    <div>
                        <div className="flex items-center gap-2">
                            <ClipboardCheck className="size-5 text-brand-secondary" />
                            <h4 className="text-sm font-bold text-primary">Respostas do formulário</h4>
                        </div>
                        <div className="mt-2 divide-y divide-border-secondary overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                            {transferencia.respostas.map((q) => (
                                <div key={q.pergunta} className="p-4">
                                    <p className="text-sm font-semibold text-primary">{q.pergunta}</p>
                                    <p className="mt-0.5 text-sm text-tertiary">{q.resposta}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {open && !transferencia && (
                <div className="flex flex-col gap-5 border-t border-secondary bg-secondary/50 p-4">
                    {compact ? (
                        /* Mobile: QR Code único (mesma estrutura do app) */
                        <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                            <p className="px-5 pt-5 pb-4 text-center text-sm">
                                <span className="font-semibold text-brand-secondary">Este combo tem um QR Code único.</span>{" "}
                                <span className="font-normal text-tertiary">Apresente este código para retirada do kit, acesso ao evento e retirada da medalha.</span>
                            </p>
                            <div className="border-t border-secondary" />
                            <div className="flex justify-center px-5 pt-6 pb-6">
                                <FakeQR px={220} />
                            </div>
                            <div className="border-t border-secondary px-5 py-4">
                                <p className="text-base text-tertiary">
                                    Titular: <span className="font-bold text-primary">{titular}</span>
                                </p>
                                <p className="mt-1 text-base text-tertiary">
                                    CPF: <span className="font-bold text-primary">{cpf}</span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop: web não exibe o QR — alerta (estrutura do DS) com fundo amarelo claro + borda amarela mais escura */}
                            <div className="flex flex-col gap-4 rounded-xl border border-utility-yellow-300 bg-utility-yellow-50 p-4 md:flex-row">
                                <FeaturedIcon icon={AlertCircle} color="warning" theme="outline" size="md" />
                                <div className="flex flex-1 flex-col gap-1 md:w-0">
                                    <p className="text-sm font-semibold text-secondary">O QR Code é exibido na versão mobile.</p>
                                    <p className="text-sm text-tertiary">Use o QR Code único deste combo para acessar todos os itens listados abaixo.</p>
                                </div>
                            </div>

                            {/* Informações */}
                            <div>
                                <h4 className="text-sm font-bold text-primary">Informações</h4>
                                <div className="mt-2 flex flex-wrap gap-x-12 gap-y-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                                    <div>
                                        <p className="text-xs text-tertiary">Titular</p>
                                        <p className="mt-0.5 text-sm font-bold text-primary">{titular}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-tertiary">CPF do Titular</p>
                                        <p className="mt-0.5 text-sm font-bold text-primary">{cpf}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Itens do combo */}
                    <div>
                        <h4 className="text-sm font-bold text-primary">Itens do combo</h4>
                        <div className="mt-3 flex flex-col gap-5">
                            {combo.itens.map((it, i) => (
                                <ItemView key={i} item={it} />
                            ))}
                        </div>
                    </div>

                    {/* Respostas do formulário (preenchido na compra) */}
                    <div>
                        <div className="flex items-center gap-2">
                            <ClipboardCheck className="size-5 text-brand-secondary" />
                            <h4 className="text-sm font-bold text-primary">Respostas do formulário</h4>
                        </div>
                        <div className="mt-2 divide-y divide-border-secondary overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                            {questionario.map((q) => (
                                <div key={q.pergunta} className="p-4">
                                    <p className="text-sm font-semibold text-primary">{q.pergunta}</p>
                                    <p className="mt-0.5 text-sm text-tertiary">{q.resposta}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ações desktop (lado a lado, centralizadas). No mobile, ver rodapé fixo. */}
                    {!compact && (
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={onTransfer}
                                className="flex items-center justify-center gap-2 rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white transition duration-100 ease-linear hover:brightness-95"
                            >
                                <Send01 className="size-5 shrink-0" />
                                Transferir inscrição
                            </button>
                            {/* Selo oficial "Adicionar à Google Wallet" (PT-BR) */}
                            <button type="button" aria-label="Adicionar à Google Wallet" className="transition duration-100 ease-linear hover:opacity-90">
                                <img src={googleWalletBtn} alt="Adicionar à Google Wallet" className="h-10 w-auto" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ItemView({ item }: { item: ComboItem }) {
    const s = item.status ? STATUS[item.status] : null;
    // Data da retirada, endereço e conteúdo do kit vão dentro da descrição do produto.
    const temDescricao = !!(item.imagem || item.gradient || item.conteudo || item.endereco || (item.dataLabel && item.data));
    return (
        <div>
            {/* Data acima do card (igual mobile/app) */}
            {item.data && <p className="pb-2 text-sm font-bold text-primary">{item.data}</p>}

            <div className="rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
                {s && (
                    <div className="mb-2">
                        <Badge size="sm" color={s.color} type="pill-color">
                            {s.label}
                        </Badge>
                    </div>
                )}
                <p className="text-sm font-bold text-primary">{item.nome}</p>
                {item.acesso && (
                    <p className="mt-1 text-sm text-tertiary">
                        Acesso por <span className="font-semibold text-secondary">{item.acesso}</span>
                    </p>
                )}

                {/* Descrição do produto: data da retirada + endereço, depois o que contém no kit */}
                {temDescricao && (
                    <div className="mt-3 flex items-start gap-4">
                        {item.gradient ? (
                            <div className="size-28 shrink-0 rounded-xl" style={{ background: item.gradient }} />
                        ) : (
                            item.imagem && <img src={item.imagem} alt={item.nome} className="size-28 shrink-0 rounded-xl object-cover" />
                        )}
                        <div className="min-w-0 flex-1 space-y-3">
                            {item.dataLabel && item.data && (
                                <div>
                                    <p className="text-xs font-semibold text-tertiary">{item.dataLabel}</p>
                                    <p className="mt-1 text-sm text-secondary">{item.data}</p>
                                </div>
                            )}
                            {item.endereco && (
                                <div>
                                    <p className="text-xs font-semibold text-tertiary">Endereço</p>
                                    <p className="mt-1 text-sm text-secondary">{item.endereco}</p>
                                </div>
                            )}
                            {item.conteudo && (
                                <div>
                                    <p className="text-xs font-semibold text-tertiary">O kit contém</p>
                                    <p className="mt-1 text-sm text-secondary">{item.conteudo.join(", ")}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
