import type { FC } from "react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, ChevronSelectorVertical, Copy01, Edit01, HomeLine, Plus, Trash01, XClose } from "@untitledui/icons";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import type { DateValue } from "react-aria-components";
import { CalendarDate } from "@internationalized/date";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Calendar as DSCalendar } from "@/components/application/date-picker/calendar";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Máscara de data: só dígitos, formato dd/mm/aaaa. */
function maskDate(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 8);
    let out = d.slice(0, 2);
    if (d.length > 2) out += "/" + d.slice(2, 4);
    if (d.length > 4) out += "/" + d.slice(4, 8);
    return out;
}

/** Máscara de hora: só dígitos, formato hh:mm, com horas 00–23 e minutos 00–59. */
function maskTime(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    let h = d.slice(0, 2);
    let m = d.slice(2, 4);
    if (h.length === 2 && +h > 23) h = "23";
    if (m.length === 2 && +m > 59) m = "59";
    return d.length > 2 ? `${h}:${m}` : h;
}

/** "dd/mm/aaaa" -> CalendarDate (ou null se incompleto/ inválido). */
function parseDate(str: string): CalendarDate | null {
    const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const day = +m[1];
    const month = +m[2];
    const year = +m[3];
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    try {
        return new CalendarDate(year, month, day);
    } catch {
        return null;
    }
}

const toStr = (dv: DateValue) => `${String(dv.day).padStart(2, "0")}/${String(dv.month).padStart(2, "0")}/${dv.year}`;

/** "24/07/2026" + "12:00" -> "24 de jul. às 12:00" */
function fmtDataHora(data: string, hora: string) {
    const [d, m] = data.split("/");
    const mes = MESES[Number(m) - 1];
    if (!d || !mes) return "";
    return `${Number(d)} de ${mes}. às ${hora || "00:00"}`;
}

interface Config {
    id: string;
    venderPara: string;
    ingressos: string;
    canais: string;
}

interface Abertura {
    id: string;
    nome: string;
    periodo: string;
    configs: Config[];
}

export function AberturasDeVendas() {
    const navigate = useNavigate();
    const seq = useRef(0);
    const nextId = (p: string) => `${p}-${(seq.current += 1)}`;

    const [aberturas, setAberturas] = useState<Abertura[]>([
        {
            id: "ab-seed-1",
            nome: "Primeira abertura",
            periodo: "02 de jan. às 15:00 - 10 de jan. às 15:00",
            configs: [{ id: "cfg-seed-1", venderPara: "", ingressos: "", canais: "Todos" }],
        },
        {
            id: "ab-seed-2",
            nome: "Venda antecipada",
            periodo: "15 de jan. às 10:00 - 31 de jan. às 23:59",
            configs: [{ id: "cfg-seed-2", venderPara: "", ingressos: "", canais: "Todos" }],
        },
    ]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirm, setConfirm] = useState<{ tipo: "excluir" | "duplicar"; id: string } | null>(null);
    // Badge temporária "Abertura duplicada" na cópia recém-criada.
    const [flashId, setFlashId] = useState<string | null>(null);

    // Formulário do modal
    const [nome, setNome] = useState("");
    const [dataInicial, setDataInicial] = useState("");
    const [horaInicial, setHoraInicial] = useState("");
    const [dataFinal, setDataFinal] = useState("");
    const [horaFinal, setHoraFinal] = useState("");

    const abrirModal = () => {
        setNome("");
        setDataInicial("");
        setHoraInicial("");
        setDataFinal("");
        setHoraFinal("");
        setModalOpen(true);
    };

    const salvar = () => {
        const inicio = fmtDataHora(dataInicial, horaInicial);
        const fim = fmtDataHora(dataFinal, horaFinal);
        const periodo = inicio && fim ? `${inicio} - ${fim}` : "Período a definir";
        const id = nextId("ab");
        setAberturas((prev) => [
            ...prev,
            { id, nome: nome.trim() || "Nova abertura", periodo, configs: [{ id: nextId("cfg"), venderPara: "", ingressos: "", canais: "Todos" }] },
        ]);
        setModalOpen(false);
    };

    const remover = (id: string) => setAberturas((prev) => prev.filter((a) => a.id !== id));
    const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

    const duplicar = (id: string) => {
        const orig = aberturas.find((a) => a.id === id);
        if (!orig) return;
        const copiaId = nextId("ab");
        const copia: Abertura = {
            ...orig,
            id: copiaId,
            configs: orig.configs.map((c) => ({ ...c, id: nextId("cfg") })),
        };
        setAberturas((prev) => {
            const idx = prev.findIndex((a) => a.id === id);
            if (idx === -1) return prev;
            const next = [...prev];
            next.splice(idx + 1, 0, copia);
            return next;
        });
        // Badge some (com fade) depois de 30s.
        setFlashId(copiaId);
        window.setTimeout(() => setFlashId((cur) => (cur === copiaId ? null : cur)), 30000);
    };

    const novaConfig = (aberturaId: string) =>
        setAberturas((prev) =>
            prev.map((a) => (a.id === aberturaId ? { ...a, configs: [...a.configs, { id: nextId("cfg"), venderPara: "", ingressos: "", canais: "Todos" }] } : a)),
        );
    const removerConfig = (aberturaId: string, cfgId: string) =>
        setAberturas((prev) => prev.map((a) => (a.id === aberturaId ? { ...a, configs: a.configs.filter((c) => c.id !== cfgId) } : a)));

    const confirmarAcao = () => {
        if (!confirm) return;
        if (confirm.tipo === "excluir") remover(confirm.id);
        else duplicar(confirm.id);
        setConfirm(null);
    };

    return (
        <BackstageLayout activeSection="itens" activeItem="catalogo-aberturas">
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex flex-1 flex-col px-4 py-6 md:px-6">
                    {/* Breadcrumb + ação principal */}
                    <div className="flex items-center justify-between gap-3">
                        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-tertiary">
                            <button
                                type="button"
                                aria-label="Início"
                                onClick={() => navigate("/backstage/")}
                                className="flex size-7 items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                            >
                                <HomeLine className="size-4" />
                            </button>
                            <ChevronRight className="size-4 text-fg-quaternary" />
                            <span>Itens</span>
                            <ChevronRight className="size-4 text-fg-quaternary" />
                            <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary">Aberturas de vendas</span>
                        </nav>

                        <div className="flex items-center gap-3">
                            {aberturas.length > 0 && <span className="hidden text-sm text-tertiary sm:inline">Alterações salvas</span>}
                            <Button size="lg" color="secondary" iconLeading={Plus} onClick={abrirModal}>
                                Nova abertura
                            </Button>
                        </div>
                    </div>

                    {/* Header: voltar + título */}
                    <header className="mt-5 flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Voltar"
                            onClick={() => navigate("/backstage/catalogo/ingressos")}
                            className="flex size-9 items-center justify-center rounded-lg text-fg-secondary ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary"
                        >
                            <ChevronLeft className="size-5" />
                        </button>
                        <h1 className="text-display-xs font-bold text-primary">Aberturas de vendas</h1>
                    </header>

                    {aberturas.length === 0 ? (
                        <EmptyState onNova={abrirModal} />
                    ) : (
                        <div className="mt-8 flex flex-col gap-6">
                            {/* Filtros */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <SelectField label="Público alvo" placeholder="Filtrar por público-alvo" />
                                <SelectField label="Grupos de ingressos" placeholder="Filtrar por grupo" />
                                <SelectField label="Ingressos" placeholder="Filtrar por ingresso" />
                            </div>

                            {/* Lista de aberturas */}
                            <div className="flex flex-col gap-4">
                                <AnimatePresence initial={false}>
                                    {aberturas.map((ab) => (
                                        <motion.div
                                            key={ab.id}
                                            className="overflow-hidden"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{
                                                height: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                                                opacity: { duration: 0.45, ease: "easeOut" },
                                            }}
                                        >
                                            <AberturaCard
                                                abertura={ab}
                                                expanded={expandedId === ab.id}
                                                onToggle={() => toggleExpand(ab.id)}
                                                onRemover={() => setConfirm({ tipo: "excluir", id: ab.id })}
                                                onDuplicar={() => setConfirm({ tipo: "duplicar", id: ab.id })}
                                                onNovaConfig={() => novaConfig(ab.id)}
                                                onRemoverConfig={(cfgId) => removerConfig(ab.id, cfgId)}
                                                flash={flashId === ab.id}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Modal: nova abertura de vendas */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 p-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-primary">Nova abertura de vendas</h2>
                            <button
                                type="button"
                                aria-label="Fechar"
                                onClick={() => setModalOpen(false)}
                                className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>

                        {/* Período programado do evento */}
                        <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
                            <Calendar className="size-5 shrink-0 text-fg-quaternary" />
                            <div className="min-w-0">
                                <p className="text-xs text-tertiary">Evento programado para</p>
                                <p className="text-sm font-semibold text-primary">10/08/2026 00:00 - 30/09/2026 00:00</p>
                            </div>
                        </div>

                        {/* Nome */}
                        <Field
                            className="mt-5"
                            label="Nome"
                            placeholder="Ex.: Primeira abertura, venda antecipada… etc."
                            hint="Este nome será exibido para o comprador."
                            value={nome}
                            onChange={setNome}
                            autoFocus
                        />

                        {/* Datas / horas */}
                        <div className="mt-5 grid grid-cols-2 gap-4">
                            <DateField label="Data inicial" value={dataInicial} onChange={setDataInicial} />
                            <Field label="Hora inicial" placeholder="hh:mm" value={horaInicial} onChange={(v) => setHoraInicial(maskTime(v))} />
                            <DateField label="Data final" value={dataFinal} onChange={setDataFinal} />
                            <Field label="Hora final" placeholder="hh:mm" value={horaFinal} onChange={(v) => setHoraFinal(maskTime(v))} />
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2">
                            <Button size="lg" color="link-gray" onClick={() => setModalOpen(false)}>
                                Voltar
                            </Button>
                            <Button size="lg" color="secondary" onClick={salvar}>
                                Salvar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmação: excluir / duplicar */}
            {confirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/60 p-4" role="dialog" aria-modal="true">
                    <div className="w-full max-w-md rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-primary">
                                {confirm.tipo === "excluir" ? "Confirmar exclusão" : "Duplicar abertura de venda?"}
                            </h2>
                            <button
                                type="button"
                                aria-label="Fechar"
                                onClick={() => setConfirm(null)}
                                className="shrink-0 text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-tertiary">
                            {confirm.tipo === "excluir"
                                ? "Tem certeza que deseja excluir esta abertura de vendas? Esta ação não pode ser desfeita."
                                : "Será criada uma nova abertura com as mesmas configurações desta. Depois, você poderá revisar e ajustar as informações necessárias."}
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-2">
                            <Button size="lg" color="link-gray" onClick={() => setConfirm(null)}>
                                Cancelar
                            </Button>
                            <Button
                                size="lg"
                                color={confirm.tipo === "excluir" ? "primary-destructive" : "primary"}
                                onClick={confirmarAcao}
                            >
                                {confirm.tipo === "excluir" ? "Excluir" : "Duplicar abertura"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </BackstageLayout>
    );
}

/* ------------------------------------------------------------------ */

function EmptyState({ onNova }: { onNova: () => void }) {
    return (
        <div className="relative flex flex-1 flex-col items-center overflow-hidden pt-16 md:pt-24">
            <div className="z-10 flex flex-col items-center text-center">
                <p className="text-display-sm font-light text-quaternary italic md:text-display-md">Aberturas</p>
                <h2 className="-mt-1 text-display-md font-bold text-primary md:text-display-lg">não programadas</h2>
                <p className="mt-4 max-w-sm text-md text-tertiary">Clique no botão abaixo para criar sua primeira abertura</p>
                <Button size="lg" color="primary" className="mt-6" onClick={onNova}>
                    Nova abertura
                </Button>
            </div>

            {/* Esqueleto decorativo (prévia do conteúdo que virá) */}
            <div aria-hidden="true" className="pointer-events-none mt-16 w-full max-w-3xl [mask-image:linear-gradient(to_bottom,black,transparent)]">
                <div className="flex flex-col gap-4 opacity-40">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-2xl bg-primary p-5 ring-1 ring-border-secondary">
                            <div className="flex items-center justify-between">
                                <div className="h-3 w-40 rounded-full bg-secondary" />
                                <div className="h-6 w-16 rounded-full bg-secondary" />
                            </div>
                            <div className="mt-4 h-2.5 w-24 rounded-full bg-secondary" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* Card de uma abertura, com editor de configurações expansível. */
function AberturaCard({
    abertura,
    expanded,
    onToggle,
    onRemover,
    onDuplicar,
    onNovaConfig,
    onRemoverConfig,
    flash,
}: {
    abertura: Abertura;
    expanded: boolean;
    onToggle: () => void;
    onRemover: () => void;
    onDuplicar: () => void;
    onNovaConfig: () => void;
    onRemoverConfig: (cfgId: string) => void;
    flash: boolean;
}) {
    const CFG_COLS = "grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_12rem_2.25rem]";
    return (
        <div className="rounded-2xl bg-primary ring-1 ring-border-secondary">
            {/* Cabeçalho da abertura */}
            <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold tracking-wide text-primary uppercase">{abertura.nome}</p>
                        <AnimatePresence>
                            {flash && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.6, ease: "easeInOut" } }}
                                    transition={{ type: "spring", stiffness: 420, damping: 22 }}
                                >
                                    <Badge size="sm" color="blue" type="pill-color">
                                        cópia de abertura
                                    </Badge>
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    <p className="mt-0.5 text-sm text-tertiary">{abertura.periodo}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <ButtonUtility size="sm" color="tertiary" icon={Copy01} tooltip="Duplicar abertura" tooltipPlacement="bottom" onClick={onDuplicar} />
                    <ButtonUtility size="sm" color="tertiary" icon={Edit01} tooltip="Editar abertura" tooltipPlacement="bottom" />
                    <ButtonUtility size="sm" color="tertiary" icon={Trash01} tooltip="Excluir abertura" tooltipPlacement="bottom" onClick={onRemover} />
                    <ButtonUtility
                        size="sm"
                        color="tertiary"
                        tooltip={expanded ? "Recolher" : "Expandir"}
                        tooltipPlacement="bottom"
                        onClick={onToggle}
                        icon={<ChevronDown className={cx("size-5 transition-transform duration-200", expanded && "rotate-180")} />}
                    />
                </div>
            </div>

            {/* Configurações */}
            {expanded && (
                <div className="border-t border-secondary px-5 py-5">
                    <div className="overflow-x-auto">
                        <div className="min-w-[720px]">
                            {/* Cabeçalho das colunas */}
                            <div className={cx("grid items-center gap-3 rounded-lg bg-secondary/50 px-2 py-2.5", CFG_COLS)}>
                                <span />
                                <span className="px-1.5 text-xs font-semibold text-tertiary">Vender para</span>
                                <span className="px-1.5 text-xs font-semibold text-tertiary">Itens</span>
                                <span className="px-1.5 text-xs font-semibold text-tertiary">Canal de venda</span>
                                <span />
                            </div>

                            {/* Linhas de configuração */}
                            <div className="flex flex-col">
                                {abertura.configs.map((cfg) => (
                                    <div key={cfg.id} className={cx("grid items-center gap-3 py-2.5", CFG_COLS)}>
                                        <span className="flex size-8 cursor-grab items-center justify-center text-fg-quaternary" aria-hidden="true">
                                            <ChevronSelectorVertical className="size-5" />
                                        </span>
                                        <SelectTrigger placeholder="Clique para selecionar" />
                                        <SelectTrigger placeholder="Clique para selecionar" />
                                        <SelectTrigger value={cfg.canais} />
                                        <button
                                            type="button"
                                            aria-label="Remover configuração"
                                            onClick={() => onRemoverConfig(cfg.id)}
                                            className="flex size-9 items-center justify-center rounded-lg text-fg-error-secondary transition duration-100 ease-linear hover:bg-error-primary"
                                        >
                                            <Trash01 className="size-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onNovaConfig}
                        className="mt-3 flex items-center gap-2 text-sm font-semibold text-tertiary transition duration-100 ease-linear hover:text-secondary"
                    >
                        <Plus className="size-4" />
                        Nova configuração
                    </button>
                </div>
            )}
        </div>
    );
}

/* Gatilho de dropdown (sem label) usado nas linhas de configuração. */
function SelectTrigger({ placeholder, value }: { placeholder?: string; value?: string }) {
    return (
        <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-lg bg-secondary px-3.5 py-2.5 text-sm ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-tertiary"
        >
            <span className={cx("truncate", value ? "text-primary" : "text-placeholder")}>{value ?? placeholder}</span>
            <ChevronDown className="size-4 shrink-0 text-fg-quaternary" />
        </button>
    );
}

/* Dropdown visual (label em caixa alta + gatilho). */
function SelectField({ label, placeholder, value }: { label: string; placeholder?: string; value?: string }) {
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</span>
            <button
                type="button"
                className="flex items-center justify-between gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm ring-1 ring-border-secondary transition duration-100 ease-linear hover:bg-secondary"
            >
                <span className={cx("truncate", value ? "text-primary" : "text-placeholder")}>{value ?? placeholder}</span>
                <ChevronDown className="size-4 shrink-0 text-fg-quaternary" />
            </button>
        </div>
    );
}

/* Campo de data: input com máscara dd/mm/aaaa + calendário (date picker) no ícone. */
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    const selected = parseDate(value);
    return (
        <div>
            <label className="text-sm font-semibold text-secondary">{label}</label>
            <div className="relative mt-1.5">
                <input
                    value={value}
                    onChange={(e) => onChange(maskDate(e.target.value))}
                    placeholder="dd/mm/aaaa"
                    inputMode="numeric"
                    className="w-full rounded-lg bg-primary py-2.5 pr-10 pl-3.5 text-sm text-primary ring-1 ring-border-secondary outline-none placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                />
                <AriaDialogTrigger>
                    <AriaButton
                        aria-label="Abrir calendário"
                        className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-fg-quaternary outline-none transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                    >
                        <Calendar className="size-5" />
                    </AriaButton>
                    <AriaPopover offset={8} placement="bottom right" className="z-[60] origin-top rounded-2xl duration-150 ease-out animate-in fade-in zoom-in-95">
                        <AriaDialog aria-label="Selecionar data" className="rounded-2xl bg-primary p-4 shadow-xl ring ring-secondary_alt outline-none">
                            {({ close }) => (
                                <DSCalendar
                                    value={selected}
                                    onChange={(dv: DateValue) => {
                                        onChange(toStr(dv));
                                        close();
                                    }}
                                />
                            )}
                        </AriaDialog>
                    </AriaPopover>
                </AriaDialogTrigger>
            </div>
        </div>
    );
}

/* Campo de texto (com hint e ícone opcional à direita). */
function Field({
    label,
    placeholder,
    hint,
    value,
    onChange,
    icon: Icon,
    className,
    autoFocus,
}: {
    label: string;
    placeholder?: string;
    hint?: string;
    value: string;
    onChange: (v: string) => void;
    icon?: FC<{ className?: string }>;
    className?: string;
    autoFocus?: boolean;
}) {
    return (
        <div className={className}>
            <label className="text-sm font-semibold text-secondary">{label}</label>
            <div className="relative mt-1.5">
                <input
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={autoFocus}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={cx(
                        "w-full rounded-lg bg-primary py-2.5 pl-3.5 text-sm text-primary ring-1 ring-border-secondary outline-none placeholder:text-placeholder focus:ring-2 focus:ring-brand",
                        Icon ? "pr-10" : "pr-3.5",
                    )}
                />
                {Icon && <Icon className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-fg-quaternary" />}
            </div>
            {hint && <p className="mt-1.5 text-sm text-tertiary">{hint}</p>}
        </div>
    );
}
