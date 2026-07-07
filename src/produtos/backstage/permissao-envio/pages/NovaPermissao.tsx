import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle, CornerDownLeft, Minus, Plus, ShoppingCart01, UploadCloud02, User01, Users01, UsersPlus } from "@untitledui/icons";
import { toast } from "sonner";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input, InputBase } from "@/components/base/input/input";
import { InputGroup } from "@/components/base/input/input-group";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Progress } from "@/components/application/progress-steps/progress-steps";
import type { ProgressFeaturedIconType } from "@/components/application/progress-steps/progress-types";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";
import { BackstageLayout } from "../../components/Backstage";
import { TICKETS, addPermissao, getPermissao, updatePermissao, type CotaMode, type PermTipo } from "../data/permissoes";

const brNum = (n: number) => n.toLocaleString("pt-BR");
const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SelState = Record<string, { on: boolean; qty: number }>;

const STEP_TITLES = ["Tipo", "Ingressos & cotas", "Emissores", "Revisão"];

export function NovaPermissao() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const editPerm = id ? getPermissao(id) : undefined;
    const editMode = !!editPerm;

    /* ---- estado do formulário (lazy init para modo edição) ---- */
    const [step, setStep] = useState(0);
    const [tipo, setTipo] = useState<PermTipo | null>(() => editPerm?.tipo ?? null);
    const [nome, setNome] = useState(() => editPerm?.nome ?? "");
    const [quotaMode, setQuotaMode] = useState<CotaMode>(() => editPerm?.quotaMode ?? "shared");
    const [sel, setSel] = useState<SelState>(() => {
        if (!editPerm) return {};
        const s: SelState = {};
        editPerm.tickets.forEach((t) => {
            s[t.ticketId] = { on: true, qty: t.qty };
        });
        return s;
    });
    const [emails, setEmails] = useState<string[]>(() => editPerm?.emailList ?? []);
    const [indEmail, setIndEmail] = useState(() => editPerm?.indEmail ?? "");
    const [confirmOpen, setConfirmOpen] = useState(false);

    const isGrupo = tipo === "grupo";
    const perEmissor = isGrupo && quotaMode === "per";
    const nEmissores = isGrupo ? emails.length : 1;

    const baseTotal = useMemo(() => TICKETS.reduce((acc, t) => acc + (sel[t.id]?.on ? sel[t.id].qty : 0), 0), [sel]);
    const totalGeral = perEmissor ? baseTotal * nEmissores : baseTotal;
    const ticketsLiberados = useMemo(() => TICKETS.filter((t) => sel[t.id]?.on && sel[t.id].qty > 0), [sel]);

    /* ---- validação por passo ---- */
    const podeAvancar = (() => {
        if (step === 0) return !!tipo && nome.trim().length > 0;
        if (step === 1) return baseTotal > 0;
        if (step === 2) return isGrupo ? emails.length > 0 : EMAIL_REGEX.test(indEmail.trim());
        return true;
    })();

    /* ---- ações ---- */
    const escolherTipo = (t: PermTipo) => {
        setTipo(t);
        if (t === "individual") setQuotaMode("shared");
    };

    const toggleTicket = (id: string) =>
        setSel((prev) => {
            const atual = prev[id] ?? { on: false, qty: 0 };
            const on = !atual.on;
            return { ...prev, [id]: { on, qty: on ? (atual.qty > 0 ? atual.qty : 10) : 0 } };
        });

    const bump = (id: string, delta: number) =>
        setSel((prev) => {
            const atual = prev[id];
            if (!atual?.on) return prev;
            return { ...prev, [id]: { ...atual, qty: Math.max(0, atual.qty + delta) } };
        });

    const setQty = (id: string, v: number) =>
        setSel((prev) => {
            const atual = prev[id];
            if (!atual?.on) return prev;
            return { ...prev, [id]: { ...atual, qty: Math.max(0, v) } };
        });

    const importarPlanilha = () => {
        const n = 1240;
        setEmails((prev) => [...prev, ...Array.from({ length: n }, (_, i) => `emissor${i + 1}@ingresse.com`)]);
        toast.success(`${brNum(n)} e-mails importados da planilha`);
    };

    const voltar = () => {
        if (step === 0) {
            navigate("/backstage/permissao-envio");
            return;
        }
        setStep((s) => s - 1);
    };

    const avancar = () => {
        if (!podeAvancar) return;
        if (step === 3) {
            setConfirmOpen(true);
            return;
        }
        setStep((s) => s + 1);
    };

    const buildPermissao = () => ({
        id: editPerm?.id ?? crypto.randomUUID(),
        nome,
        tipo: tipo!,
        iniciais: nome.slice(0, 2).toUpperCase(),
        sub: isGrupo
            ? `${brNum(emails.length)} emissores · cota ${perEmissor ? "por emissor" : "compartilhada"}`
            : indEmail,
        emissorCount: isGrupo ? emails.length : 1,
        quotaMode,
        emailList: isGrupo ? emails : [],
        indEmail: isGrupo ? "" : indEmail,
        tickets: ticketsLiberados.map((t) => ({
            ticketId: t.id,
            label: t.name,
            qty: sel[t.id].qty,
            perEmissor: perEmissor || undefined,
        })),
        usadas: editPerm?.usadas ?? 0,
        total: totalGeral,
    });

    const confirmar = () => {
        const perm = buildPermissao();
        if (editMode) {
            updatePermissao(perm.id, perm);
            toast.success("Permissão atualizada com sucesso");
        } else {
            addPermissao(perm);
            toast.success("Permissão criada com sucesso");
        }
        setConfirmOpen(false);
        navigate("/backstage/permissao-envio");
    };

    const steps: ProgressFeaturedIconType[] = STEP_TITLES.map((title, i) => ({
        title,
        description: STEP_DESCS[i](isGrupo),
        status: i < step ? "complete" : i === step ? "current" : "incomplete",
        icon: STEP_ICONS[i],
    }));

    return (
        <BackstageLayout activeSection="cortesias" activeItem="permissao-envio">
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="relative flex items-center justify-between gap-3 px-6 py-6">
                    <Button size="sm" color="secondary" iconLeading={ArrowLeft} onClick={voltar}>
                        {step === 0 ? "Permissões" : "Voltar"}
                    </Button>
                    <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-display-xs font-bold text-primary">
                        {editMode ? "Editar permissão" : "Nova permissão de envio"}
                    </h1>
                    <Button size="md" color="primary" isDisabled={!podeAvancar} onClick={avancar}>
                        {step === 3 ? (editMode ? "Salvar alterações" : "Criar permissão") : "Avançar"}
                    </Button>
                </header>

                <main className="flex flex-1 flex-col items-center gap-8 px-6 py-6">
                    <Progress.IconsWithText items={steps} size="sm" type="icon" orientation="horizontal" className="max-w-[860px] max-md:hidden" />
                    <Progress.IconsWithText items={steps} size="sm" type="icon" orientation="vertical" className="w-full md:hidden" />

                    <section className="flex w-full max-w-[900px] flex-col">
                        {step === 0 && <StepTipo tipo={tipo} nome={nome} onTipo={escolherTipo} onNome={setNome} />}
                        {step === 1 && (
                            <StepCotas
                                isGrupo={isGrupo}
                                quotaMode={quotaMode}
                                onQuotaMode={setQuotaMode}
                                sel={sel}
                                onToggle={toggleTicket}
                                onBump={bump}
                                onSetQty={setQty}
                                baseTotal={baseTotal}
                            />
                        )}
                        {step === 2 && (
                            <StepEmissores
                                isGrupo={isGrupo}
                                emails={emails}
                                onEmails={setEmails}
                                indEmail={indEmail}
                                onIndEmail={setIndEmail}
                                onImport={importarPlanilha}
                            />
                        )}
                        {step === 3 && (
                            <StepRevisao
                                nome={nome}
                                tipo={tipo}
                                perEmissor={perEmissor}
                                nEmissores={nEmissores}
                                emails={emails}
                                indEmail={indEmail}
                                ticketsLiberados={ticketsLiberados.map((t) => ({ label: `${t.name} · ${t.area}`, qty: sel[t.id].qty }))}
                                baseTotal={baseTotal}
                                totalGeral={totalGeral}
                            />
                        )}
                    </section>
                </main>
            </div>

            <ModalOverlay isOpen={confirmOpen} onOpenChange={(o) => !o && setConfirmOpen(false)} isDismissable>
                <Modal className="sm:max-w-[480px]">
                    <Dialog>
                        <div className="flex w-full flex-col gap-5 rounded-2xl bg-primary p-6 shadow-xl ring-1 ring-border-secondary">
                            <div className="flex items-start gap-4">
                                <FeaturedIcon icon={CheckCircle} color="success" theme="light" size="lg" />
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-lg font-semibold text-primary">
                                        {editMode ? "Salvar alterações" : "Criar permissão de envio"}
                                    </h2>
                                    <p className="text-sm text-tertiary">
                                        {isGrupo ? (
                                            <>
                                                Você vai liberar <strong>{brNum(totalGeral)}</strong> cortesias para <strong>{brNum(nEmissores)}</strong> emissores do grupo{" "}
                                                <strong>{nome}</strong>.
                                            </>
                                        ) : (
                                            <>
                                                <strong>{indEmail}</strong> poderá emitir até <strong>{brNum(baseTotal)}</strong> cortesias.
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button size="md" color="secondary" onClick={() => setConfirmOpen(false)}>
                                    Voltar
                                </Button>
                                <Button size="md" color="primary" onClick={confirmar}>
                                    {editMode ? "Salvar" : "Criar permissão"}
                                </Button>
                            </div>
                        </div>
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </BackstageLayout>
    );
}

const STEP_ICONS = [Users01, ShoppingCart01, UsersPlus, CheckCircle];
const STEP_DESCS = [
    () => "Grupo ou individual",
    () => "O que pode enviar e quanto",
    (isGrupo: boolean) => (isGrupo ? "Quem recebe a permissão" : "A pessoa responsável"),
    () => "Confirmar permissão",
];

/* ------------------------------------------------------------------ */
/*  Passo 1 — Tipo                                                     */
/* ------------------------------------------------------------------ */

function StepTipo({ tipo, nome, onTipo, onNome }: { tipo: PermTipo | null; nome: string; onTipo: (t: PermTipo) => void; onNome: (v: string) => void }) {
    return (
        <div className="flex flex-col gap-6">
            <p className="text-center text-sm text-tertiary">Como você quer configurar essa permissão?</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TipoCard
                    selected={tipo === "grupo"}
                    icon={Users01}
                    cor="purple"
                    titulo="Grupo"
                    descricao="Vários emissores compartilham a mesma configuração. Ideal para patrocinadores, staff ou listas de 10 a 1000+ pessoas."
                    onClick={() => onTipo("grupo")}
                />
                <TipoCard
                    selected={tipo === "individual"}
                    icon={User01}
                    cor="blue"
                    titulo="Individual"
                    descricao="Uma pessoa com cota dedicada. Ideal para um convidado VIP ou responsável com limite próprio."
                    onClick={() => onTipo("individual")}
                />
            </div>
            <div className="mx-auto w-full max-w-[560px]">
                <Input
                    label={tipo === "individual" ? "Nome / identificação" : "Nome do grupo"}
                    placeholder={tipo === "individual" ? "Ex: Viviane Ferreira" : "Ex: Patrocinador Master"}
                    value={nome}
                    onChange={onNome}
                    isRequired
                />
            </div>
        </div>
    );
}

function TipoCard({
    selected,
    icon: Icon,
    cor,
    titulo,
    descricao,
    onClick,
}: {
    selected: boolean;
    icon: typeof Users01;
    cor: "purple" | "blue";
    titulo: string;
    descricao: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cx(
                "flex flex-col items-center gap-4 rounded-2xl bg-primary p-6 text-center ring-1 transition duration-100 ease-linear",
                selected ? "ring-2 ring-brand" : "ring-border-secondary hover:ring-border-primary",
            )}
        >
            <FeaturedIcon icon={Icon} color={cor === "purple" ? "brand" : "gray"} theme="light" size="lg" />
            <div className="flex flex-col gap-1.5">
                <span className="text-md font-semibold text-primary">{titulo}</span>
                <span className="text-sm text-tertiary">{descricao}</span>
            </div>
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Passo 2 — Ingressos & cotas                                        */
/* ------------------------------------------------------------------ */

function StepCotas({
    isGrupo,
    quotaMode,
    onQuotaMode,
    sel,
    onToggle,
    onBump,
    onSetQty,
    baseTotal,
}: {
    isGrupo: boolean;
    quotaMode: CotaMode;
    onQuotaMode: (m: CotaMode) => void;
    sel: SelState;
    onToggle: (id: string) => void;
    onBump: (id: string, d: number) => void;
    onSetQty: (id: string, v: number) => void;
    baseTotal: number;
}) {
    const perEmissor = isGrupo && quotaMode === "per";
    const totalLabel = perEmissor ? "Cota por emissor" : isGrupo ? "Total liberado por grupo" : "Cota da pessoa";

    return (
        <div className="flex flex-col gap-4">
            {isGrupo && (
                <div className="flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 ring-border-secondary sm:flex-row sm:items-center sm:gap-4">
                    <span className="text-sm font-semibold text-primary">Como a cota funciona:</span>
                    <Segmented
                        value={quotaMode}
                        onChange={onQuotaMode}
                        options={[
                            { value: "shared", label: "Compartilhada pelo grupo" },
                            { value: "per", label: "Por emissor" },
                        ]}
                    />
                    <span className="text-sm text-tertiary sm:ml-auto sm:max-w-[380px] sm:text-right">
                        {quotaMode === "shared"
                            ? "Um único bolo de cortesias dividido entre todos os emissores do grupo."
                            : "Cada emissor recebe a mesma cota individualmente (multiplica pelo nº de emissores)."}
                    </span>
                </div>
            )}

            <p className="text-sm text-tertiary">Marque os ingressos liberados e defina o limite de cada um.</p>

            <div className="flex flex-col gap-2.5">
                {TICKETS.map((t) => {
                    const s = sel[t.id] ?? { on: false, qty: 0 };
                    return (
                        <div
                            key={t.id}
                            className={cx(
                                "flex flex-col gap-3 rounded-xl bg-primary p-4 ring-1 transition duration-100 ease-linear sm:flex-row sm:items-center sm:gap-4",
                                s.on ? "ring-brand" : "ring-border-secondary",
                            )}
                        >
                            <button type="button" onClick={() => onToggle(t.id)} className="flex flex-1 items-center gap-3 text-left">
                                <span className={cx("flex size-5 shrink-0 items-center justify-center rounded-md ring-2 transition", s.on ? "bg-brand-solid ring-brand" : "ring-secondary")}>
                                    {s.on && <CheckIcon />}
                                </span>
                                <span className="flex min-w-0 flex-col">
                                    <span className="text-sm font-medium text-primary">{t.name}</span>
                                    <span className="text-sm text-tertiary">{t.area}</span>
                                </span>
                            </button>
                            <Badge size="sm" type="modern" color="gray">
                                {t.tipo}
                            </Badge>
                            <QtyStepper disabled={!s.on} value={s.qty} onBump={(d) => onBump(t.id, d)} onSet={(v) => onSetQty(t.id, v)} />
                        </div>
                    );
                })}
            </div>

            <div className="mt-2 flex items-center justify-between rounded-xl bg-brand-primary p-5 ring-1 ring-border-secondary">
                <span className="text-sm text-secondary">{totalLabel}</span>
                <span className="text-display-xs font-bold text-primary">
                    {brNum(baseTotal)} <span className="text-sm font-medium text-tertiary">cortesias</span>
                </span>
            </div>
        </div>
    );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
    return (
        <div className="inline-flex rounded-lg bg-secondary p-1 ring-1 ring-border-secondary">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(o.value)}
                    className={cx(
                        "rounded-md px-3.5 py-1.5 text-sm font-semibold transition duration-100 ease-linear",
                        value === o.value ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                    )}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none" aria-hidden="true">
            <path d="M10 3 4.5 8.5 2 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function QtyStepper({ disabled, value, onBump, onSet }: { disabled: boolean; value: number; onBump: (d: number) => void; onSet: (v: number) => void }) {
    return (
        <div className={cx("flex shrink-0 items-center overflow-hidden rounded-lg bg-primary ring-1 ring-border-primary", disabled && "pointer-events-none opacity-40")}>
            <button type="button" aria-label="Diminuir" onClick={() => onBump(-10)} className="flex size-10 items-center justify-center text-fg-quaternary transition hover:bg-primary_hover hover:text-fg-secondary">
                <Minus className="size-4" />
            </button>
            <input
                type="text"
                inputMode="numeric"
                aria-label="Quantidade"
                value={value}
                disabled={disabled}
                onChange={(e) => onSet(Math.max(0, parseInt(e.target.value.replace(/\D/g, ""), 10) || 0))}
                className="h-10 w-14 bg-transparent text-center text-sm font-bold text-primary outline-none"
            />
            <button type="button" aria-label="Aumentar" onClick={() => onBump(10)} className="flex size-10 items-center justify-center text-fg-quaternary transition hover:bg-primary_hover hover:text-fg-secondary">
                <Plus className="size-4" />
            </button>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Passo 3 — Emissores                                                */
/* ------------------------------------------------------------------ */

function StepEmissores({
    isGrupo,
    emails,
    onEmails,
    indEmail,
    onIndEmail,
    onImport,
}: {
    isGrupo: boolean;
    emails: string[];
    onEmails: (v: string[]) => void;
    indEmail: string;
    onIndEmail: (v: string) => void;
    onImport: () => void;
}) {
    const [grupoInput, setGrupoInput] = useState("");

    const addMany = (raw: string) => {
        const novos = raw
            .split(/[\s,;|\t\n\r]+/)
            .map((s) => s.trim().toLowerCase())
            .filter((s) => EMAIL_REGEX.test(s) && !emails.includes(s));
        if (novos.length > 0) onEmails([...emails, ...novos]);
    };

    const tryAdd = () => {
        const email = grupoInput.trim().toLowerCase();
        if (!email) return;
        if (EMAIL_REGEX.test(email) && !emails.includes(email)) {
            onEmails([...emails, email]);
        }
        setGrupoInput("");
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData.getData("text");
        if (!text.trim()) return;
        e.preventDefault();
        addMany(text);
        setGrupoInput("");
    };

    const removeEmail = (idx: number) => onEmails(emails.filter((_, i) => i !== idx));

    if (!isGrupo) {
        return (
            <div className="mx-auto flex w-full max-w-[560px] flex-col gap-3">
                <Input
                    label="E-mail do responsável"
                    type="email"
                    placeholder="nome@empresa.com"
                    value={indEmail}
                    onChange={onIndEmail}
                    isRequired
                    hint="Essa pessoa terá a cota dedicada configurada no passo anterior."
                />
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <Button size="sm" color="secondary" iconLeading={UploadCloud02} onClick={onImport}>
                    Importar planilha (.xlsx/.csv)
                </Button>
                {emails.length > 0 && (
                    <Button size="sm" color="tertiary-destructive" onClick={() => onEmails([])}>
                        Remover todos
                    </Button>
                )}
            </div>

            <div
                onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && grupoInput.trim()) {
                        e.preventDefault();
                        tryAdd();
                    }
                }}
                onPaste={handlePaste}
            >
                <InputGroup
                    label="E-mails dos emissores"
                    hint="Enter ou Espaço para adicionar · Cole uma lista para importar vários de uma vez"
                    value={grupoInput}
                    onChange={setGrupoInput}
                    trailingAddon={
                        <Button size="sm" color="secondary" iconLeading={CornerDownLeft} onClick={tryAdd}>
                            {isMac ? "Return" : "Enter"}
                        </Button>
                    }
                >
                    <InputBase placeholder="nome@empresa.com" />
                </InputGroup>
            </div>

            {emails.length > 0 && (
                <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-border-secondary">
                    <div className="max-h-[45vh] overflow-y-auto">
                        {emails.map((email, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-3 last:border-b-0">
                                <span className="truncate text-sm text-primary">{email}</span>
                                <Button size="sm" color="link-destructive" onClick={() => removeEmail(i)}>
                                    Deletar
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-sm text-tertiary">
                <span className="font-semibold text-secondary">
                    {brNum(emails.length)} emissor{emails.length !== 1 ? "es" : ""}
                </span>{" "}
                adicionado{emails.length !== 1 ? "s" : ""}.
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Passo 4 — Revisão                                                  */
/* ------------------------------------------------------------------ */

function StepRevisao({
    nome,
    tipo,
    perEmissor,
    nEmissores,
    emails,
    indEmail,
    ticketsLiberados,
    baseTotal,
    totalGeral,
}: {
    nome: string;
    tipo: PermTipo | null;
    perEmissor: boolean;
    nEmissores: number;
    emails: string[];
    indEmail: string;
    ticketsLiberados: { label: string; qty: number }[];
    baseTotal: number;
    totalGeral: number;
}) {
    const isGrupo = tipo === "grupo";
    return (
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
            <RevCard titulo="Permissão">
                <div className="flex items-center gap-3">
                    <span
                        className={cx(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                            isGrupo ? "bg-utility-purple-100 text-utility-purple-700" : "bg-utility-blue-100 text-utility-blue-700",
                        )}
                    >
                        {(nome || "?").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex flex-col">
                        <span className="text-md font-semibold text-primary">{nome || "—"}</span>
                        <span className="text-sm text-tertiary">
                            {isGrupo ? `${brNum(nEmissores)} emissores · cota ${perEmissor ? "por emissor" : "compartilhada"}` : indEmail || "—"}
                        </span>
                    </div>
                </div>
            </RevCard>

            <RevCard titulo="Ingressos & cotas">
                <div className="flex flex-col">
                    {ticketsLiberados.map((t, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 border-b border-secondary py-2.5 last:border-b-0">
                            <span className="text-sm text-secondary">{t.label}</span>
                            <span className="text-sm font-semibold text-primary">
                                {brNum(t.qty)}
                                {perEmissor ? " / emissor" : ""}
                            </span>
                        </div>
                    ))}
                    <div className="mt-1 flex items-center justify-between gap-4 pt-2.5">
                        <span className="text-sm font-bold text-primary">Total</span>
                        <span className="text-sm font-bold text-primary">
                            {perEmissor ? (
                                <>
                                    {brNum(baseTotal)} por emissor · {brNum(totalGeral)} no total
                                </>
                            ) : (
                                <>{brNum(baseTotal)} cortesias</>
                            )}
                        </span>
                    </div>
                </div>
            </RevCard>

            <RevCard titulo={isGrupo ? `Emissores (${brNum(nEmissores)})` : "Emissor"}>
                <div className="flex flex-wrap gap-2">
                    {isGrupo ? (
                        <>
                            {emails.slice(0, 10).map((m, i) => (
                                <span key={i} className="rounded-md bg-secondary px-2 py-1 text-sm text-secondary">
                                    {m}
                                </span>
                            ))}
                            {emails.length > 10 && <span className="rounded-md px-2 py-1 text-sm text-tertiary">+ {brNum(emails.length - 10)} outros</span>}
                        </>
                    ) : (
                        <span className="rounded-md bg-secondary px-2 py-1 text-sm text-secondary">{indEmail}</span>
                    )}
                </div>
            </RevCard>
        </div>
    );
}

function RevCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3.5 rounded-2xl bg-primary p-6 ring-1 ring-border-secondary">
            <span className="text-sm font-medium tracking-wide text-tertiary uppercase">{titulo}</span>
            {children}
        </div>
    );
}
