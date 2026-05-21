import { useMemo, useState } from "react";
import {
    CheckSquare,
    Image01,
    RefreshCcw01,
    SlashCircle01,
    SwitchHorizontal01,
    XClose,
} from "@untitledui/icons";
import {
    Dialog as AriaDialog,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressFeaturedIconType } from "@/components/application/progress-steps/progress-types";
import { cx } from "@/utils/cx";
import { ITEM_STATUS_META, type CortesiaItem } from "../data/item-types";
import { CancelConfirmModal } from "./CancelConfirmModal";

/* ------------------------------------------------------------------ */
/*  Mock helpers                                                      */
/* ------------------------------------------------------------------ */

const MONTHS_PT = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
];

function pad2(n: number) {
    return n.toString().padStart(2, "0");
}

function seedFromId(id: string): number {
    let h = 0;
    for (let i = 0; i < id.length; i++) {
        h = (h * 31 + id.charCodeAt(i)) >>> 0;
    }
    return h;
}

function formatTicketDateTime(seed: number) {
    const day = (seed % 28) + 1;
    const month = MONTHS_PT[seed % 12];
    const hour = 18 + (seed % 5);
    const minute = (seed * 7) % 60;
    return `${pad2(day)} de ${month} • ${pad2(hour)}:${pad2(minute)}`;
}

function formatHistoryDate(seed: number) {
    const day = (seed % 28) + 1;
    const month = ((seed * 3) % 12) + 1;
    const hour = (seed % 12) + 8;
    const minute = (seed * 7) % 60;
    return `${pad2(day)}/${pad2(month)}/2026 às ${pad2(hour)}:${pad2(minute)}`;
}

const ERROR_MESSAGES = [
    "Falha ao gerar o QR code: o endereço de e-mail do destinatário é inválido.",
    "O envio falhou porque o destinatário possui um cadastro inativo na plataforma.",
    "Erro de processamento: o item não pôde ser emitido devido a um problema interno.",
    "O e-mail de cortesia foi rejeitado pelo servidor do destinatário. Verifique o endereço informado.",
];

function pickErrorMessage(seed: number): string {
    return ERROR_MESSAGES[seed % ERROR_MESSAGES.length];
}

function ticketSubtitle(seed: number) {
    const groups = ["Pista", "Camarote", "VIP", "Backstage", "Mezanino"];
    const types = ["Inteira", "Meia", "Cortesia", "Estudante"];
    return `${groups[seed % groups.length]} - ${types[(seed >> 3) % types.length]}`;
}

interface ComboSubItem {
    quantity: number;
    name: string;
    type: string;
    dateTime: string;
}

function buildComboItens(seed: number): ComboSubItem[] {
    const groups = ["Pista", "Camarote VIP", "Mezanino"];
    const types = ["Inteira", "Meia", "Cortesia"];
    return Array.from({ length: 3 }, (_, i) => {
        const s = seed + i * 11;
        return {
            quantity: 1,
            name: groups[s % groups.length],
            type: types[(s >> 2) % types.length],
            dateTime: formatTicketDateTime(s),
        };
    });
}

const HISTORY_ICON = {
    cancelado: SlashCircle01,
    validado: CheckSquare,
    transferido: SwitchHorizontal01,
} as const;

interface HistoryEntry {
    kind: "cancelado" | "validado" | "transferido";
    text: string;
    date: string;
}

function buildHistory(item: CortesiaItem): HistoryEntry[] {
    const seed = seedFromId(item.id);
    const entries: HistoryEntry[] = [];

    if (item.status === "cancelado") {
        entries.push({
            kind: "cancelado",
            text: `Cancelado por ${item.emissor}`,
            date: formatHistoryDate(seed),
        });
    }
    if (item.status === "aceito") {
        entries.push({
            kind: "validado",
            text: "Validado no evento por Elizate Pinheiro",
            date: formatHistoryDate(seed + 7),
        });
    }
    if (item.transferido) {
        entries.push({
            kind: "transferido",
            text: `Transferência realizada para ${item.email}`,
            date: formatHistoryDate(seed + 13),
        });
    }

    return entries;
}

function historyToProgressSteps(
    entries: HistoryEntry[],
): ProgressFeaturedIconType[] {
    return entries.map((entry, i) => ({
        title: entry.text,
        description: entry.date,
        icon: HISTORY_ICON[entry.kind],
        status: "complete",
        connector: i !== entries.length - 1,
    }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export interface ItemDetailsSlideOutProps {
    isOpen: boolean;
    item: CortesiaItem | null;
    onClose: () => void;
    onCancel: (id: string) => void;
    onResend: (id: string) => void;
}

export function ItemDetailsSlideOut({
    isOpen,
    item,
    onClose,
    onCancel,
    onResend,
}: ItemDetailsSlideOutProps) {
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const statusMeta = item ? ITEM_STATUS_META[item.status] : null;
    const isCancelled = item?.status === "cancelado";
    const isErro = item?.status === "erro";

    const seed = item ? seedFromId(item.id) : 0;
    const history = useMemo(() => (item ? buildHistory(item) : []), [item]);
    const comboItens = useMemo(
        () => (item?.kind === "combo" ? buildComboItens(seed) : []),
        [item, seed],
    );

    const ticketDateTime = item?.kind === "ticket" ? formatTicketDateTime(seed) : null;
    const ticketSub = item?.kind === "ticket" ? ticketSubtitle(seed) : null;
    const errorMessage = isErro ? pickErrorMessage(seed) : null;

    const handleCancel = () => {
        if (!item) return;
        onCancel(item.id);
        setShowCancelConfirm(false);
    };

    const handleResend = () => {
        if (!item) return;
        onResend(item.id);
    };

    return (
        <>
            <AriaModalOverlay
                isOpen={isOpen}
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
                isDismissable
                className={({ isEntering, isExiting }) =>
                    cx(
                        "fixed inset-0 z-50 flex justify-end bg-overlay/70 outline-hidden backdrop-blur-[2px]",
                        isEntering && "duration-300 ease-out animate-in fade-in",
                        isExiting && "duration-200 ease-in animate-out fade-out",
                    )
                }
            >
                <AriaModal
                    className={({ isEntering, isExiting }) =>
                        cx(
                            "h-full w-full max-w-[640px] bg-primary shadow-xl outline-hidden",
                            isEntering && "duration-300 ease-out animate-in slide-in-from-right",
                            isExiting && "duration-200 ease-in animate-out slide-out-to-right",
                        )
                    }
                >
                    <AriaDialog className="flex h-full flex-col outline-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-4 border-b border-secondary px-6 py-5">
                            <h2 className="text-lg font-semibold text-primary">
                                Detalhes do item
                            </h2>
                            <ButtonUtility
                                size="sm"
                                color="tertiary"
                                icon={XClose}
                                tooltip="Fechar"
                                onClick={onClose}
                            />
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 flex-col overflow-y-auto">
                            {item && (
                                <div className="flex flex-col gap-5 px-6 pt-6 pb-5">
                                    <ItemHero
                                        item={item}
                                        ticketSubtitle={ticketSub}
                                        ticketDateTime={ticketDateTime}
                                    />

                                    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                                        <DetailRow label="Status:">
                                            {statusMeta && (
                                                <BadgeWithDot
                                                    size="sm"
                                                    type="modern"
                                                    color={statusMeta.color}
                                                >
                                                    {statusMeta.label}
                                                </BadgeWithDot>
                                            )}
                                        </DetailRow>
                                        <DetailRow label="Emissor responsável:">
                                            <span className="text-sm text-secondary">
                                                {item.emissor}
                                            </span>
                                        </DetailRow>
                                        <DetailRow label="ID do pedido:">
                                            <span
                                                className="text-sm break-all text-secondary"
                                                title={item.pedidoId}
                                            >
                                                {item.pedidoId}
                                            </span>
                                        </DetailRow>
                                        <DetailRow label="Destinatário:">
                                            <span className="text-sm text-secondary">
                                                {item.email}
                                            </span>
                                        </DetailRow>
                                    </dl>
                                </div>
                            )}

                            {isErro && errorMessage ? (
                                <div className="px-6 pb-4">
                                    <div className="flex flex-col gap-2 rounded-lg bg-primary p-3 ring-1 ring-border-secondary">
                                        <BadgeWithDot
                                            size="md"
                                            color="error"
                                            type="modern"
                                            className="self-start"
                                        >
                                            Erro
                                        </BadgeWithDot>
                                        <p className="text-sm break-words text-secondary">
                                            {errorMessage}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mx-6 border-t border-secondary" />

                                    <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                                        <h3 className="text-md font-semibold text-primary">
                                            Ações
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                size="sm"
                                                color="secondary"
                                                iconLeading={SlashCircle01}
                                                isDisabled={isCancelled}
                                                onClick={() => setShowCancelConfirm(true)}
                                            >
                                                Cancelar item
                                            </Button>
                                            <Button
                                                size="sm"
                                                color="secondary"
                                                iconLeading={RefreshCcw01}
                                                isDisabled={isCancelled}
                                                onClick={handleResend}
                                            >
                                                Reenviar cortesia
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {item?.kind === "combo" && comboItens.length > 0 && (
                                <>
                                    <div className="mx-6 border-t border-secondary" />
                                    <div className="flex flex-col gap-3 px-6 pt-5 pb-4">
                                        <h3 className="text-md font-semibold text-primary">
                                            Itens
                                        </h3>
                                        <ul className="flex flex-col gap-3">
                                            {comboItens.map((sub, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-start gap-3"
                                                >
                                                    <span className="mt-px text-sm font-semibold text-tertiary">
                                                        {sub.quantity}
                                                    </span>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-primary">
                                                            {sub.name} - {sub.type}
                                                        </span>
                                                        <span className="text-xs text-tertiary">
                                                            {sub.dateTime}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}

                            <div className="mx-6 border-t border-secondary" />

                            <div className="flex flex-col gap-3 px-6 pt-5 pb-6">
                                <h3 className="text-md font-semibold text-primary">Histórico</h3>
                                {history.length === 0 ? (
                                    <p className="text-sm text-tertiary">
                                        Nenhum evento registrado para este item.
                                    </p>
                                ) : (
                                    <Progress.IconsWithText
                                        type="featured-icon"
                                        orientation="vertical"
                                        size="sm"
                                        items={historyToProgressSteps(history)}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 border-t border-secondary px-6 py-4">
                            <Button size="sm" color="secondary" onClick={onClose}>
                                Fechar
                            </Button>
                        </div>
                    </AriaDialog>
                </AriaModal>
            </AriaModalOverlay>

            <CancelConfirmModal
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onConfirm={handleCancel}
                title="Cancelar este item?"
                description={
                    item ? (
                        <>
                            <span className="font-medium text-primary">{item.email}</span> terá
                            o QR code para{" "}
                            <span className="font-medium text-primary">{item.nome}</span>{" "}
                            invalidado e você precisará gerar novos convites caso mude de ideia.
                            Esta ação não pode ser desfeita.
                        </>
                    ) : null
                }
                confirmLabel="Cancelar cortesia"
                cancelLabel="Manter cortesia"
            />
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

interface ItemHeroProps {
    item: CortesiaItem;
    ticketSubtitle: string | null;
    ticketDateTime: string | null;
}

const ItemHero = ({ item, ticketSubtitle, ticketDateTime }: ItemHeroProps) => {
    if (item.kind === "product") {
        return (
            <div className="flex items-center gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary ring-1 ring-border-secondary">
                    <Image01 className="size-6 text-fg-quaternary" aria-hidden="true" />
                </div>
                <h3 className="text-md font-semibold text-primary">{item.nome}</h3>
            </div>
        );
    }

    if (item.kind === "combo") {
        return (
            <div className="flex flex-col gap-1">
                <h3 className="text-md font-semibold text-primary">{item.nome}</h3>
                {item.subtitulo && (
                    <p className="text-sm text-tertiary">{item.subtitulo}</p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <h3 className="text-md font-semibold text-primary">{item.nome}</h3>
            {ticketSubtitle && (
                <p className="text-sm text-secondary">{ticketSubtitle}</p>
            )}
            {ticketDateTime && (
                <p className="text-sm text-tertiary">{ticketDateTime}</p>
            )}
        </div>
    );
};

interface DetailRowProps {
    label: string;
    children: React.ReactNode;
}

const DetailRow = ({ label, children }: DetailRowProps) => (
    <div className="flex flex-wrap items-center gap-2">
        <dt className="text-sm text-tertiary">{label}</dt>
        <dd className="text-sm text-secondary">{children}</dd>
    </div>
);

