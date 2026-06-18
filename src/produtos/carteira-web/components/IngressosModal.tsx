import { useState } from "react";
import { ChevronDown, ChevronLeft, ClipboardCheck, DotsVertical, Package, QrCode02, Send01, Tag01, Wallet02, XClose } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { FakeQR } from "./FakeQR";
import { SAO_SILVESTRE, type Combo, type ComboItem, type Resposta } from "../data/sao-silvestre";

const STATUS: Record<string, { label: string; color: "brand" | "blue" | "gray" }> = {
    hoje: { label: "Evento de hoje", color: "brand" },
    proximo: { label: "Próximo", color: "blue" },
    finalizado: { label: "Finalizado", color: "gray" },
};

export function IngressosModal({ onClose, compact = false }: { onClose: () => void; compact?: boolean }) {
    const ev = SAO_SILVESTRE;

    // ----- Mobile: folha full-screen com imagem do evento no topo -----
    if (compact) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay sm:p-4" role="dialog" aria-modal="true" onClick={onClose}>
                <div
                    className="relative flex h-full w-full flex-col overflow-hidden bg-primary sm:h-[92vh] sm:max-h-[820px] sm:w-[390px] sm:max-w-full sm:rounded-3xl sm:shadow-xl sm:ring-1 sm:ring-border-secondary"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Imagem do evento */}
                    <div className="relative h-44 shrink-0" style={{ background: ev.gradient }}>
                        <button
                            type="button"
                            aria-label="Voltar"
                            onClick={onClose}
                            className="absolute top-4 left-4 flex size-10 items-center justify-center rounded-lg bg-primary text-fg-secondary shadow-md transition duration-100 ease-linear active:bg-secondary"
                        >
                            <ChevronLeft className="size-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Mais opções"
                            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-primary text-brand-secondary shadow-md transition duration-100 ease-linear active:bg-secondary"
                        >
                            <DotsVertical className="size-5" />
                        </button>
                    </div>

                    {/* Folha de conteúdo (sem arredondar o container que rola — evita o flicker do canto) */}
                    <div className="scrollbar-hide flex-1 overflow-y-auto bg-primary px-5 pt-6 pb-8">
                        <p className="text-center text-sm text-tertiary">Sua inscrição para</p>
                        <p className="text-center text-xl leading-tight font-extrabold text-primary">{ev.title}</p>

                        <div className="mt-5 flex justify-center">
                            <div className="flex flex-col items-center rounded-2xl bg-primary px-5 py-2 shadow-md ring-1 ring-border-secondary">
                                <span className="text-xs text-tertiary">{ev.diaSemana}</span>
                                <span className="text-2xl font-bold text-brand-secondary">{ev.dia}</span>
                                <span className="text-xs text-tertiary">{ev.mes}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-4">
                            {ev.combos.map((c) => (
                                <ComboCard key={c.id} combo={c} titular={ev.titular} cpf={ev.cpf} questionario={ev.questionario} compact={compact} />
                            ))}
                        </div>
                    </div>
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
                    <div className="flex items-start gap-4 pr-8">
                        <div className="size-20 shrink-0 rounded-xl" style={{ background: ev.gradient }} />
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg leading-tight font-bold text-primary">
                                Sua inscrição para <span className="font-extrabold">{ev.title}</span>
                            </h2>
                            <p className="mt-1 text-sm text-tertiary">{ev.local}</p>
                            <div className="mt-3 inline-flex flex-col items-center rounded-xl px-4 py-1.5 shadow-sm ring-1 ring-border-secondary">
                                <span className="text-xs text-tertiary">{ev.diaSemana}</span>
                                <span className="text-xl font-bold text-brand-secondary">{ev.dia}</span>
                                <span className="text-xs text-tertiary">{ev.mes}</span>
                            </div>
                        </div>
                    </div>

                    {/* Combos agrupados (expansíveis) */}
                    <div className="mt-8 flex flex-col gap-4">
                        {ev.combos.map((c) => (
                            <ComboCard key={c.id} combo={c} titular={ev.titular} cpf={ev.cpf} questionario={ev.questionario} compact={compact} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ComboCard({ combo, titular, cpf, questionario, compact = false }: { combo: Combo; titular: string; cpf: string; questionario: Resposta[]; compact?: boolean }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="overflow-hidden rounded-xl ring-1 ring-border-secondary">
            {/* Cabeçalho do combo (agrupador) */}
            <div className="flex items-center gap-3 bg-secondary/50 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-secondary text-fg-brand-primary">
                    <Package className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-primary">{combo.nome}</p>
                        <Badge size="sm" color="brand" type="pill-color">
                            Combo
                        </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-tertiary">Data do evento: {combo.dataEvento}</p>
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

            {open && (
                <div className="flex flex-col gap-5 border-t border-secondary bg-secondary/50 p-4">
                    {compact ? (
                        /* Mobile: QR Code único (mesma estrutura do app) */
                        <div className="overflow-hidden rounded-2xl bg-primary ring-1 ring-border-secondary">
                            <p className="px-5 pt-5 pb-4 text-center text-sm">
                                <span className="font-semibold text-brand-secondary">Este combo tem um QR Code único.</span>{" "}
                                <span className="font-normal text-tertiary">Apresente este código para acessar todos os itens da sua inscrição.</span>
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
                            {/* Desktop: web não exibe o QR */}
                            <div className="flex items-center gap-3 rounded-xl bg-warning-secondary px-4 py-3.5">
                                <QrCode02 className="size-6 shrink-0 text-fg-warning-primary" />
                                <span className="text-sm font-semibold text-warning-primary">Consulte as versões Mobile ou App para visualizar o QR Code.</span>
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
                        <div className="mt-2 flex flex-col gap-3">
                            {combo.itens.map((it, i) => (
                                <ItemView key={i} item={it} />
                            ))}
                        </div>
                    </div>

                    {/* Respostas do formulário (preenchido na compra) */}
                    <div>
                        <div className="flex items-center gap-2">
                            <ClipboardCheck className="size-5 text-fg-brand-primary" />
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

                    {/* Ações (mesma linha, largura e altura iguais) */}
                    <div className="flex flex-wrap items-stretch gap-3">
                        <Button size="md" color="primary" iconLeading={Send01} className="flex-1 whitespace-nowrap">
                            Transferir inscrição
                        </Button>
                        <Button size="md" color="primary" iconLeading={Tag01} className="flex-1 whitespace-nowrap">
                            Revender inscrição
                        </Button>
                        {/* Adicionar à carteira (aproximação — não é o selo oficial) */}
                        <button
                            type="button"
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white transition duration-100 ease-linear hover:brightness-90"
                        >
                            <Wallet02 className="size-5 shrink-0" />
                            Adicionar à carteira
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ItemView({ item }: { item: ComboItem }) {
    const s = item.status ? STATUS[item.status] : null;
    return (
        <div className="rounded-xl bg-primary p-4 ring-1 ring-border-secondary">
            {s && (
                <div className="mb-2">
                    <Badge size="sm" color={s.color} type="pill-color">
                        {s.label}
                    </Badge>
                </div>
            )}
            <p className="text-sm font-bold text-primary">{item.nome}</p>
            {item.data && (
                <p className="mt-1 text-sm text-tertiary">
                    {item.dataLabel ?? "Data do evento"}: {item.data}
                </p>
            )}
            {item.acesso && (
                <p className="mt-1 text-sm text-tertiary">
                    Acesso por <span className="font-semibold text-secondary">{item.acesso}</span>
                </p>
            )}
            {item.endereco && <p className="mt-1 text-sm text-tertiary">Endereço: {item.endereco}</p>}

            {(item.imagem || item.conteudo) && (
                <div className="mt-3 flex items-start gap-4">
                    {item.imagem && <img src={item.imagem} alt={item.nome} className="size-28 shrink-0 rounded-xl object-cover" />}
                    {item.conteudo && (
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-tertiary">O kit contém</p>
                            <p className="mt-1.5 text-sm text-secondary">{item.conteudo.join(", ")}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
