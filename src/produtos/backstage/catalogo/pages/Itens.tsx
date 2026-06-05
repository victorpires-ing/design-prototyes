import { useState } from "react";
import { CheckCircle, ChevronDown, ChevronRight, Edit01, Key01, Plus, Trash01, Zap } from "@untitledui/icons";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Toggle } from "@/components/base/toggle/toggle";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { VincularChavesSlideOut } from "../components/VincularChavesSlideOut";

/* ---- Mock data (tokens/conteúdo da referência) ---- */
const GROUP = {
    name: "Nome do grupo",
    info: [
        { label: "Lote", value: "via ingresso" },
        { label: "Emissões", value: "0 de 7.000" },
        { label: "Pendentes", value: "20" },
        { label: "Acesso", value: "Acesso 19" },
    ],
};

interface Lote {
    id: string;
    name: string;
    active: boolean;
    auto?: boolean;
    oculto?: boolean;
    preco: string;
    emissoes: string;
}
interface Ticket {
    id: string;
    name: string;
    sub: string;
    active: boolean;
    /** Já possui chave(s) de acesso vinculada(s) ao item. */
    hasChave?: boolean;
    precoFrom: string;
    precoTo: string;
    emissoes: string;
    pendentes: string;
    lotes: Lote[];
}

const tooltipChave = (hasChave?: boolean) => (hasChave ? "Editar vínculos de chave de acesso" : "Vincular chave de acesso");

const TICKETS: Ticket[] = [
    { id: "inteira", name: "Inteira", sub: "5 lotes à venda", active: true, precoFrom: "R$ 41,80", precoTo: "Até R$ 291,20", emissoes: "1.000 de 1.000", pendentes: "0 pendentes", lotes: [] },
    { id: "meia", name: "Meia entrada", sub: "5 lotes à venda", active: true, precoFrom: "R$ 41,80", precoTo: "Até R$ 291,20", emissoes: "1.000 de 1.000", pendentes: "0 pendentes", lotes: [] },
    {
        id: "camarote",
        name: "Camarote",
        sub: "4 lotes à venda • 2 com chave de acesso",
        active: true,
        hasChave: true,
        precoFrom: "R$ 41,80",
        precoTo: "Até R$ 291,20",
        emissoes: "1.000 de 1.000",
        pendentes: "0 pendentes",
        lotes: [
            { id: "cam-l1", name: "Lote 1", active: false, preco: "R$ 41,80", emissoes: "400 de 400" },
            { id: "cam-l2", name: "Lote 2", active: true, auto: true, oculto: true, preco: "R$ 41,80", emissoes: "400 de 400" },
            { id: "cam-l3", name: "Lote 3", active: false, oculto: true, preco: "R$ 41,80", emissoes: "400 de 400" },
            { id: "cam-l4", name: "Lote 4", active: false, preco: "R$ 41,80", emissoes: "400 de 400" },
        ],
    },
    { id: "pista", name: "Pista", sub: "5 lotes à venda • Oculto por chave de acesso", active: true, hasChave: true, precoFrom: "R$ 41,80", precoTo: "Até R$ 291,20", emissoes: "1.000 de 1.000", pendentes: "0 pendentes", lotes: [] },
    { id: "pista-premium", name: "Pista Premium", sub: "5 lotes à venda", active: false, precoFrom: "R$ 41,80", precoTo: "Até R$ 291,20", emissoes: "1.000 de 1.000", pendentes: "0 pendentes", lotes: [] },
    { id: "pista-lateral", name: "Pista Lateral", sub: "5 lotes à venda", active: false, precoFrom: "R$ 41,80", precoTo: "Até R$ 291,20", emissoes: "1.000 de 1.000", pendentes: "0 pendentes", lotes: [] },
];

const COL = {
    virada: "w-32",
    preco: "w-36",
    emissoes: "w-44",
    acoes: "w-28",
};

export function Itens() {
    const [groupOpen, setGroupOpen] = useState(true);
    const [isVincularOpen, setIsVincularOpen] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set(["camarote"]));
    const [active, setActive] = useState<Set<string>>(
        new Set(TICKETS.filter((t) => t.active).map((t) => t.id).concat(TICKETS.flatMap((t) => t.lotes.filter((l) => l.active).map((l) => l.id)))),
    );

    const toggleExpand = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    const toggleActive = (id: string) =>
        setActive((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-itens">
            <div className="flex min-w-0 flex-1 flex-col px-4 py-6 md:h-[calc(100dvh-3rem)] md:overflow-hidden md:px-6">
                {/* Header da página (fixo) */}
                <header className="flex shrink-0 items-center justify-between gap-3">
                    <h1 className="text-display-xs font-bold text-primary">Itens</h1>
                    <div className="flex items-center gap-3">
                        <Button size="lg" color="secondary">
                            Ajustar abertura de vendas
                        </Button>
                        <Button size="lg" color="primary">
                            Editar grupos
                        </Button>
                    </div>
                </header>

                {/* Card do grupo */}
                <div className="mt-6 flex flex-col overflow-hidden rounded-xl ring-1 ring-border-secondary md:min-h-0 md:flex-1">
                    {/* Cabeçalho do grupo (fixo) */}
                    <button
                        type="button"
                        onClick={() => setGroupOpen((v) => !v)}
                        className="flex shrink-0 items-center justify-between gap-3 border-b border-secondary px-4 py-4 text-left"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-md font-semibold text-primary">{GROUP.name}</span>
                            <span className="text-sm text-tertiary">
                                {GROUP.info.map((part, i) => (
                                    <span key={part.label}>
                                        {i > 0 && <span className="px-1.5">•</span>}
                                        {part.label} <span className="text-secondary">{part.value}</span>
                                    </span>
                                ))}
                            </span>
                        </div>
                        <ChevronDown className={cx("size-5 shrink-0 text-fg-quaternary transition-transform duration-200", !groupOpen && "-rotate-90")} />
                    </button>

                    {/* Cabeçalho das colunas (fixo) */}
                    <div className="flex shrink-0 items-center gap-3 border-b border-secondary px-4 py-2.5">
                        <span className="w-5 shrink-0" />
                        <span className="w-9 shrink-0" />
                        <span className="flex-1 text-xs font-semibold text-tertiary">Status</span>
                        <span className={cx("shrink-0 text-xs font-semibold text-tertiary", COL.virada)}>Virada de lote</span>
                        <span className={cx("shrink-0 text-xs font-semibold text-tertiary", COL.preco)}>Preço</span>
                        <span className={cx("shrink-0 text-xs font-semibold text-tertiary", COL.emissoes)}>Emissões e estoque</span>
                        <span className={cx("shrink-0 text-right text-xs font-semibold text-tertiary", COL.acoes)}>Ações</span>
                    </div>

                    {/* Linhas (área de scroll) */}
                    {groupOpen && (
                        <div className="flex-1 overflow-y-scroll md:min-h-0">
                            {TICKETS.map((ticket) => {
                                const isExpanded = expanded.has(ticket.id);
                                return (
                                    <div key={ticket.id}>
                                        {/* Linha do ingresso */}
                                        <div className="flex items-center gap-3 border-b border-secondary px-4 py-3.5">
                                            <button
                                                type="button"
                                                aria-label={isExpanded ? "Recolher" : "Expandir"}
                                                onClick={() => toggleExpand(ticket.id)}
                                                className="flex w-5 shrink-0 items-center justify-center text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                                            >
                                                <ChevronRight className={cx("size-4 transition-transform duration-200", isExpanded && "rotate-90")} />
                                            </button>
                                            <Toggle size="sm" isSelected={active.has(ticket.id)} onChange={() => toggleActive(ticket.id)} />
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <span className="text-sm font-semibold text-primary">{ticket.name}</span>
                                                <span className="truncate text-sm text-tertiary">{ticket.sub}</span>
                                            </div>
                                            <div className={cx("shrink-0", COL.virada)}>
                                                <Badge size="sm" color="gray" type="modern">
                                                    Individual
                                                </Badge>
                                            </div>
                                            <div className={cx("flex shrink-0 flex-col", COL.preco)}>
                                                <span className="text-sm text-secondary">{ticket.precoFrom}</span>
                                                <span className="text-xs text-tertiary">{ticket.precoTo}</span>
                                            </div>
                                            <div className={cx("flex shrink-0 flex-col", COL.emissoes)}>
                                                <span className="text-sm text-secondary">{ticket.emissoes}</span>
                                                <span className="text-xs text-tertiary">{ticket.pendentes}</span>
                                            </div>
                                            <div className={cx("flex shrink-0 items-center justify-end gap-1", COL.acoes)}>
                                                <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar item" tooltipPlacement="bottom" />
                                                <ButtonUtility size="sm" color="tertiary" icon={Key01} tooltip={tooltipChave(ticket.hasChave)} tooltipPlacement="bottom" onClick={() => setIsVincularOpen(true)} />
                                                <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Remover item" tooltipPlacement="bottom" />
                                            </div>
                                        </div>

                                        {/* Lotes (quando expandido) */}
                                        {isExpanded &&
                                            ticket.lotes.map((lote) => (
                                                <div key={lote.id} className="flex items-center gap-3 border-b border-secondary py-3.5 pr-4 pl-12">
                                                    <Toggle size="sm" isSelected={active.has(lote.id)} onChange={() => toggleActive(lote.id)} />
                                                    <div className="flex min-w-0 flex-1 flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-primary">{lote.name}</span>
                                                            {lote.auto && (
                                                                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-500">
                                                                    <Zap className="size-3.5" />
                                                                    Auto
                                                                </span>
                                                            )}
                                                        </div>
                                                        {lote.oculto && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-tertiary">
                                                                <Key01 className="size-3.5" />
                                                                Oculto
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={cx("shrink-0", COL.virada)}>
                                                        <Badge size="sm" color="gray" type="modern">
                                                            Individual
                                                        </Badge>
                                                    </div>
                                                    <div className={cx("shrink-0", COL.preco)}>
                                                        <span className="text-sm text-secondary">{lote.preco}</span>
                                                    </div>
                                                    <div className={cx("shrink-0", COL.emissoes)}>
                                                        <span className="text-sm text-secondary">{lote.emissoes}</span>
                                                    </div>
                                                    <div className={cx("flex shrink-0 items-center justify-end gap-1", COL.acoes)}>
                                                        <ButtonUtility size="sm" color="tertiary" icon={Key01} tooltip={tooltipChave(lote.oculto)} tooltipPlacement="bottom" onClick={() => setIsVincularOpen(true)} />
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Footer (fixo) */}
                    <div className="flex shrink-0 items-center border-t border-secondary px-4 py-3">
                        <Button size="md" color="secondary" iconLeading={Plus}>
                            Novo item
                        </Button>
                    </div>
                </div>
            </div>

            <VincularChavesSlideOut
                isOpen={isVincularOpen}
                onClose={() => setIsVincularOpen(false)}
                onSave={(count) => {
                    setIsVincularOpen(false);
                    toast.success(
                        count === 1
                            ? "1 chave de acesso vinculada com sucesso."
                            : `${count} chaves de acesso vinculadas com sucesso.`,
                        { icon: <CheckCircle className="size-5 text-fg-success-primary" /> },
                    );
                }}
            />
        </BackstageLayout>
    );
}
